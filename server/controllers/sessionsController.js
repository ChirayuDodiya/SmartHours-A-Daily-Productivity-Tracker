const sql = require('../db/dbConnection.js');

async function getActiveSession(req, res) {
    try {
        const sessions = await sql`
            SELECT
                task_sessions.id,
                task_sessions.task_id,
                task_sessions.start_time,
                TO_CHAR(tasks.date, 'YYYY-MM-DD') AS date
            FROM task_sessions
            JOIN tasks ON tasks.id = task_sessions.task_id
            WHERE tasks.user_id = ${req.user.id}
                AND task_sessions.end_time IS NULL
            ORDER BY task_sessions.start_time DESC
            LIMIT 1
        `;

        return res.json({
            active_session: sessions[0] || null
        });
    }
    catch (err) {
        console.error('Get active session error:', err);

        return res.status(500).json({
            success: false,
            message: 'Active session could not be loaded'
        });
    }
}

module.exports = {
    getActiveSession
};
