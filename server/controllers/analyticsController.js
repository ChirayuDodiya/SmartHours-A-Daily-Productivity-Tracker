const sql = require('../db/dbConnection.js');

function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
}

async function getDailyAnalytics(req, res) {
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
                tasks.name AS task_name,
                tasks.weight,
                COALESCE(SUM(ts.duration_seconds), 0) AS total_seconds
            FROM tasks
            LEFT JOIN task_sessions ts ON ts.task_id = tasks.id
            WHERE tasks.user_id = ${req.user.id}
                AND tasks.date = ${date}::date
            GROUP BY tasks.id
            ORDER BY tasks.id ASC
        `;

        const sumAllSeconds = tasks.reduce((acc, row) => acc + Number(row.total_seconds), 0);

        const result = tasks.map(row => {
            const total_seconds = Number(row.total_seconds);
            const weight = Number(row.weight);
            const points = Number(((total_seconds / 3600.0) * weight * 5).toFixed(2));
            const pct = sumAllSeconds > 0 ? Number(((total_seconds / sumAllSeconds) * 100).toFixed(1)) : 0;

            return {
                task_name: row.task_name,
                total_seconds,
                points,
                pct
            };
        });

        return res.json(result);
    }
    catch (err) {
        console.error('Get daily analytics error:', err);

        return res.status(500).json({
            success: false,
            message: 'Analytics could not be loaded'
        });
    }
}

module.exports = {
    getDailyAnalytics
};
