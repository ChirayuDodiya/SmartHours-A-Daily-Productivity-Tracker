const sql = require('../db/dbConnection.js');

function mapPackRows(rows) {
    const packsById = new Map();

    rows.forEach((row) => {
        if (!packsById.has(row.id)) {
            packsById.set(row.id, {
                id: row.id,
                name: row.name,
                created_at: row.created_at,
                tasks: []
            });
        }

        if (row.task_id) {
            packsById.get(row.id).tasks.push({
                id: row.task_id,
                name: row.task_name,
                weight: Number(row.task_weight)
            });
        }
    });

    return Array.from(packsById.values());
}

function normalizePackName(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeTaskName(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function parseTaskWeight(value) {
    const weight = Number(value);

    if (!Number.isFinite(weight) || weight < -100 || weight > 100) {
        return null;
    }

    return weight;
}

function parsePackTaskId(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
        return undefined;
    }

    return id;
}

async function getPackById(req, packId) {
    const packs = await sql`
        SELECT id, name, created_at
        FROM packs
        WHERE id = ${packId}
            AND user_id = ${req.user.id}
        LIMIT 1
    `;

    return packs[0] || null;
}

async function getPackTasks(packId) {
    return await sql`
        SELECT id, name, weight
        FROM pack_tasks
        WHERE pack_id = ${packId}
        ORDER BY id ASC
    `;
}

async function createPack(req, res) {
    const packName = normalizePackName(req.body.name);
    const incomingTasks = Array.isArray(req.body.tasks) ? req.body.tasks : [];

    if (!packName || packName.length > 255) {
        return res.status(400).json({
            success: false,
            message: 'Pack name is required and must be 255 characters or fewer'
        });
    }

    if (incomingTasks.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'At least one task is required to create a pack'
        });
    }

    const tasks = [];

    for (let index = 0; index < incomingTasks.length; index += 1) {
        const item = incomingTasks[index] || {};
        const taskName = normalizeTaskName(item.name);
        const taskWeight = parseTaskWeight(item.weight);

        if (!taskName || taskName.length > 255 || taskWeight === null) {
            return res.status(400).json({
                success: false,
                message: `Each task must include a valid name (up to 255 characters) and a weight between -100 and 100. Invalid task at index ${index}.`
            });
        }

        tasks.push({ name: taskName, weight: taskWeight });
    }

    let createdPack;

    try {
        const insertedPack = await sql`
            INSERT INTO packs (user_id, name)
            VALUES (${req.user.id}, ${packName})
            RETURNING id, name, created_at
        `;

        if (insertedPack.length === 0) {
            throw new Error('Pack insertion failed');
        }

        createdPack = insertedPack[0];
        const createdTasks = [];

        for (const task of tasks) {
            const insertedTask = await sql`
                INSERT INTO pack_tasks (pack_id, name, weight)
                VALUES (${createdPack.id}, ${task.name}, ${task.weight})
                RETURNING id, name, weight
            `;

            createdTasks.push(insertedTask[0]);
        }

        return res.status(201).json({
            id: createdPack.id,
            name: createdPack.name,
            created_at: createdPack.created_at,
            tasks: createdTasks
        });
    }
    catch (err) {
        console.error('Create pack error:', err);

        if (createdPack?.id) {
            try {
                await sql`
                    DELETE FROM packs
                    WHERE id = ${createdPack.id}
                `;
            }
            catch (cleanupErr) {
                console.error('Pack cleanup failed after create error:', cleanupErr);
            }
        }

        return res.status(500).json({
            success: false,
            message: 'Pack could not be created'
        });
    }
}

async function updatePack(req, res) {
    const packId = Number(req.params.packId);

    if (!Number.isInteger(packId) || packId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid packId is required'
        });
    }

    const pack = await getPackById(req, packId);

    if (!pack) {
        return res.status(404).json({
            success: false,
            message: 'Pack not found'
        });
    }

    const updateName = req.body.name !== undefined;
    const packName = normalizePackName(req.body.name);

    if (updateName && (!packName || packName.length > 255)) {
        return res.status(400).json({
            success: false,
            message: 'Pack name must be 255 characters or fewer'
        });
    }

    let tasks = null;

    if (req.body.tasks !== undefined) {
        if (!Array.isArray(req.body.tasks)) {
            return res.status(400).json({
                success: false,
                message: 'Tasks must be an array'
            });
        }

        tasks = [];

        for (let index = 0; index < req.body.tasks.length; index += 1) {
            const item = req.body.tasks[index] || {};
            const taskId = parsePackTaskId(item.id);

            if (item.id !== undefined && taskId === undefined) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid task id at index ${index}`
                });
            }

            const name = normalizeTaskName(item.name);
            const weight = parseTaskWeight(item.weight);

            if (!name || name.length > 255 || weight === null) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid task at index ${index}. Each task requires a valid name and weight between -100 and 100.`
                });
            }

            tasks.push({ id: taskId, name, weight });
        }
    }

    try {
        if (updateName && packName !== pack.name) {
            await sql`
                UPDATE packs
                SET name = ${packName}
                WHERE id = ${packId}
            `;
        }

        if (tasks !== null) {
            const existingTasks = await getPackTasks(packId);
            const existingIds = existingTasks.map((task) => Number(task.id));
            const incomingIds = tasks.filter((task) => task.id !== null).map((task) => Number(task.id));

            const invalidIds = incomingIds.filter((id) => !existingIds.includes(id));

            if (invalidIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more task ids are invalid for this pack'
                });
            }

            const tasksToDelete = existingIds.filter((id) => !incomingIds.includes(id));
            const tasksToUpdate = tasks.filter((task) => task.id !== null);
            const tasksToCreate = tasks.filter((task) => task.id === null);

            for (const deleteId of tasksToDelete) {
                await sql`
                    DELETE FROM pack_tasks
                    WHERE pack_id = ${packId}
                        AND id = ${deleteId}
                `;
            }

            for (const taskToUpdate of tasksToUpdate) {
                await sql`
                    UPDATE pack_tasks
                    SET name = ${taskToUpdate.name}, weight = ${taskToUpdate.weight}
                    WHERE id = ${taskToUpdate.id}
                        AND pack_id = ${packId}
                `;
            }

            for (const taskToCreate of tasksToCreate) {
                await sql`
                    INSERT INTO pack_tasks (pack_id, name, weight)
                    VALUES (${packId}, ${taskToCreate.name}, ${taskToCreate.weight})
                `;
            }
        }

        const updatedTasks = await getPackTasks(packId);

        return res.json({
            id: pack.id,
            name: updateName ? packName : pack.name,
            created_at: pack.created_at,
            tasks: updatedTasks.map((task) => ({
                id: task.id,
                name: task.name,
                weight: Number(task.weight)
            }))
        });
    }
    catch (err) {
        console.error('Update pack error:', err);

        return res.status(500).json({
            success: false,
            message: 'Pack could not be updated'
        });
    }
}

async function deletePack(req, res) {
    const packId = Number(req.params.packId);

    if (!Number.isInteger(packId) || packId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid packId is required'
        });
    }

    const pack = await getPackById(req, packId);

    if (!pack) {
        return res.status(404).json({
            success: false,
            message: 'Pack not found'
        });
    }

    try {
        await sql`
            DELETE FROM packs
            WHERE id = ${packId}
        `;

        return res.status(200).json({
            success: true,
            message: 'Pack deleted successfully'
        });
    }
    catch (err) {
        console.error('Delete pack error:', err);

        return res.status(500).json({
            success: false,
            message: 'Pack could not be deleted'
        });
    }
}

async function getPacks(req, res) {
    try {
        const rows = await sql`
            SELECT
                p.id,
                p.name,
                p.created_at,
                pt.id AS task_id,
                pt.name AS task_name,
                pt.weight AS task_weight
            FROM packs p
            LEFT JOIN pack_tasks pt ON pt.pack_id = p.id
            WHERE p.user_id = ${req.user.id}
            ORDER BY p.created_at DESC, p.id DESC, pt.id ASC
        `;

            return res.json(mapPackRows(rows));
    }
    catch (err) {
        console.error('Get packs error:', err);

        return res.status(500).json({
            success: false,
            message: 'Packs could not be loaded'
        });
    }
}

module.exports = {
    getPacks,
    createPack,
    updatePack,
    deletePack
};
