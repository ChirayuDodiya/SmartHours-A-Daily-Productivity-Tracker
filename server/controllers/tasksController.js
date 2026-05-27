const sql = require('../db/dbConnection.js');

function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
}

function normalizeTaskName(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function parseWeight(value) {
    const weight = Number(value);

    if (!Number.isFinite(weight) || weight < -100 || weight > 100) {
        return null;
    }

    return weight;
}

function parseOptionalId(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        return undefined;
    }

    return id;
}

function getCurrentDateKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function mapTask(task) {
    return {
        id: task.id,
        user_id: task.user_id,
        date: task.date,
        name: task.name,
        weight: Number(task.weight),
        pack_id: task.pack_id,
        total_seconds: Number(task.total_seconds) || 0
    };
}

async function recalculateDailyScore(userId, date) {
    const totals = await sql`
        SELECT
            ${userId} AS user_id,
            ${date}::date AS date,
            COALESCE(SUM(task_sessions.duration_seconds), 0) AS total_seconds,
            COALESCE(SUM((task_sessions.duration_seconds / 3600.0) * tasks.weight * 5), 0) AS total_points
        FROM tasks
        LEFT JOIN task_sessions ON task_sessions.task_id = tasks.id
            AND task_sessions.duration_seconds IS NOT NULL
            AND task_sessions.start_time >= ${date}::date
            AND task_sessions.start_time < (${date}::date + INTERVAL '1 day')
        WHERE tasks.user_id = ${userId}
    `;

    if (totals.length === 0) {
        return null;
    }

    const total = totals[0];

    const scores = await sql`
        INSERT INTO daily_scores (user_id, date, total_points, total_seconds)
        VALUES (
            ${total.user_id},
            ${total.date}::date,
            ${Number(total.total_points)},
            ${Number(total.total_seconds)}
        )
        ON CONFLICT (user_id, date)
        DO UPDATE SET
            total_points = EXCLUDED.total_points,
            total_seconds = EXCLUDED.total_seconds
        RETURNING
            TO_CHAR(date, 'YYYY-MM-DD') AS date,
            total_points,
            total_seconds
    `;

    return {
        date: scores[0].date,
        total_points: Number(scores[0].total_points),
        total_seconds: Number(scores[0].total_seconds)
    };
}

async function stopActiveSessionsForUser(userId) {
    const stoppedSessions = await sql`
        UPDATE task_sessions
        SET
            end_time = NOW(),
            duration_seconds = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - start_time))))::integer
        FROM tasks
        WHERE task_sessions.task_id = tasks.id
            AND tasks.user_id = ${userId}
            AND task_sessions.end_time IS NULL
        RETURNING
            task_sessions.id,
            task_sessions.task_id,
            task_sessions.start_time,
            TO_CHAR(task_sessions.start_time::date, 'YYYY-MM-DD') AS attribution_date,
            task_sessions.end_time,
            task_sessions.duration_seconds
    `;

    const affectedDates = [...new Set(stoppedSessions.map((session) => session.attribution_date))];
    const dailyScores = [];

    for (const affectedDate of affectedDates) {
        const dailyScore = await recalculateDailyScore(userId, affectedDate);

        if (dailyScore) {
            dailyScores.push(dailyScore);
        }
    }

    return {
        stoppedSessions,
        dailyScores
    };
}

async function getTasksByDate(req, res) {
    try {
        const { date } = req.params;

        if (!isValidDate(date)) {
            return res.status(400).json({
                success: false,
                message: 'Valid date is required in YYYY-MM-DD format'
            });
        }

        const tasks = await sql`
            SELECT
                tasks.id,
                tasks.user_id,
                TO_CHAR(tasks.date, 'YYYY-MM-DD') AS date,
                tasks.name,
                tasks.weight,
                tasks.pack_id,
                COALESCE(SUM(ts.duration_seconds), 0) AS total_seconds
            FROM tasks
            LEFT JOIN task_sessions ts ON ts.task_id = tasks.id
            WHERE tasks.user_id = ${req.user.id}
                AND tasks.date = ${date}::date
            GROUP BY tasks.id
            ORDER BY tasks.id ASC
        `;

        return res.json(tasks.map(mapTask));
    }
    catch (err) {
        console.error('Get tasks by date error:', err);

        return res.status(500).json({
            success: false,
            message: 'Tasks could not be loaded'
        });
    }
}

async function createTask(req, res) {
    try {
        const body = req.body || {};
        const { date } = body;
        const name = normalizeTaskName(body.name);
        const weight = parseWeight(body.weight);
        const packId = parseOptionalId(body.pack_id);

        if (!isValidDate(date) || !name || weight === null || packId === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Valid date, name, weight, and optional pack_id are required'
            });
        }

        if (name.length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Task name must be 255 characters or fewer'
            });
        }

        if (packId) {
            const packs = await sql`
                SELECT id
                FROM packs
                WHERE id = ${packId}
                    AND user_id = ${req.user.id}
                LIMIT 1
            `;

            if (packs.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pack not found'
                });
            }
        }

        const tasks = await sql`
            INSERT INTO tasks (user_id, date, name, weight, pack_id)
            VALUES (${req.user.id}, ${date}::date, ${name}, ${weight}, ${packId})
            RETURNING
                id,
                user_id,
                TO_CHAR(date, 'YYYY-MM-DD') AS date,
                name,
                weight,
                pack_id,
                0 AS total_seconds
        `;

        return res.status(201).json(mapTask(tasks[0]));
    }
    catch (err) {
        console.error('Create task error:', err);

        return res.status(500).json({
            success: false,
            message: 'Task could not be created'
        });
    }
}

async function deleteTask(req, res) {
    try {
        const taskId = Number(req.params.taskId);

        if (!Number.isInteger(taskId) || taskId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid taskId is required'
            });
        }

        const affectedDates = await sql`
            SELECT DISTINCT TO_CHAR(task_sessions.start_time::date, 'YYYY-MM-DD') AS date
            FROM task_sessions
            JOIN tasks ON tasks.id = task_sessions.task_id
            WHERE tasks.id = ${taskId}
                AND tasks.user_id = ${req.user.id}
                AND task_sessions.duration_seconds IS NOT NULL
        `;

        const tasks = await sql`
            DELETE FROM tasks
            WHERE id = ${taskId}
                AND user_id = ${req.user.id}
            RETURNING
                id,
                TO_CHAR(date, 'YYYY-MM-DD') AS date
        `;

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const datesToRecalculate = affectedDates.length > 0
            ? affectedDates.map((row) => row.date)
            : [tasks[0].date];

        for (const affectedDate of datesToRecalculate) {
            await recalculateDailyScore(req.user.id, affectedDate);
        }

        return res.json({
            success: true,
            message: 'Task removed successfully'
        });
    }
    catch (err) {
        console.error('Delete task error:', err);

        return res.status(500).json({
            success: false,
            message: 'Task could not be removed'
        });
    }
}

async function startTaskTimer(req, res) {
    try {
        const taskId = Number(req.params.taskId);

        if (!Number.isInteger(taskId) || taskId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid taskId is required'
            });
        }

        const tasks = await sql`
            SELECT
                id,
                TO_CHAR(date, 'YYYY-MM-DD') AS date
            FROM tasks
            WHERE id = ${taskId}
                AND user_id = ${req.user.id}
            LIMIT 1
        `;

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        let dateToCheck = getCurrentDateKey();
        const clientDate = req.body ? (req.body.clientDate || req.body.date) : null;
        if (clientDate && isValidDate(clientDate)) {
            // Check if the client date is within 2 days of the server's current date.
            // This timezone-agnostic check handles clients globally (e.g. up to UTC+14 / UTC-12)
            // while preventing arbitrary dates in the past or future.
            const serverTime = new Date();
            const clientTime = new Date(`${clientDate}T12:00:00Z`);
            const diffTime = Math.abs(serverTime.getTime() - clientTime.getTime());
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            if (diffDays <= 2) {
                dateToCheck = clientDate;
            }
        }

        if (tasks[0].date !== dateToCheck) {
            return res.status(400).json({
                success: false,
                message: 'Timers can only be started for the current date'
            });
        }

        const stopped = await stopActiveSessionsForUser(req.user.id);

        const sessions = await sql`
            INSERT INTO task_sessions (task_id, start_time)
            VALUES (${taskId}, NOW())
            RETURNING
                id,
                task_id,
                start_time
        `;

        return res.status(201).json({
            active_session: {
                id: sessions[0].id,
                task_id: sessions[0].task_id,
                start_time: sessions[0].start_time
            },
            stopped_sessions: stopped.stoppedSessions,
            daily_scores: stopped.dailyScores
        });
    }
    catch (err) {
        console.error('Start task timer error:', err);

        return res.status(500).json({
            success: false,
            message: 'Timer could not be started'
        });
    }
}

async function stopTaskTimer(req, res) {
    try {
        const taskId = Number(req.params.taskId);

        if (!Number.isInteger(taskId) || taskId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid taskId is required'
            });
        }

        const stoppedSessions = await sql`
            UPDATE task_sessions
            SET
                end_time = NOW(),
                duration_seconds = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - start_time))))::integer
            FROM tasks
            WHERE task_sessions.task_id = tasks.id
                AND task_sessions.task_id = ${taskId}
                AND tasks.user_id = ${req.user.id}
                AND task_sessions.end_time IS NULL
            RETURNING
                task_sessions.id,
                task_sessions.task_id,
                task_sessions.start_time,
                TO_CHAR(task_sessions.start_time::date, 'YYYY-MM-DD') AS attribution_date,
                task_sessions.end_time,
                task_sessions.duration_seconds
        `;

        if (stoppedSessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active timer found for this task'
            });
        }

        const dailyScore = await recalculateDailyScore(
            req.user.id,
            stoppedSessions[0].attribution_date
        );

        return res.json({
            session: stoppedSessions[0],
            daily_score: dailyScore
        });
    }
    catch (err) {
        console.error('Stop task timer error:', err);

        return res.status(500).json({
            success: false,
            message: 'Timer could not be stopped'
        });
    }
}

module.exports = {
    getTasksByDate,
    createTask,
    deleteTask,
    startTaskTimer,
    stopTaskTimer
};