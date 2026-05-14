const sql = require('../db/dbConnection.js');

function parseYear(value) {
    const year = Number(value);
    const currentYear = new Date().getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > currentYear + 20) {
        return null;
    }

    return year;
}

function parseMonth(value) {
    const month = Number(value);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
        return null;
    }

    return month;
}

async function getMonthlyScores(req, res) {
    try {
        const year = parseYear(req.params.year);
        const month = parseMonth(req.params.month);

        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: 'Valid year and month are required'
            });
        }

        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;

        const scores = await sql`
            SELECT
                TO_CHAR(date, 'YYYY-MM-DD') AS date,
                total_points
            FROM daily_scores
            WHERE user_id = ${req.user.id}
                AND date >= ${monthStart}::date
                AND date < (${monthStart}::date + INTERVAL '1 month')
            ORDER BY date ASC
        `;

        return res.json(scores.map((score) => ({
            date: score.date,
            total_points: Number(score.total_points)
        })));
    }
    catch (err) {
        console.error('Get monthly scores error:', err);

        return res.status(500).json({
            success: false,
            message: 'Monthly scores could not be loaded'
        });
    }
}

module.exports = {
    getMonthlyScores
};
