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
    getPacks
};
