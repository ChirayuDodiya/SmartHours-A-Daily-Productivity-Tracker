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

async function getWeeklyAnalytics(req, res) {
    try {
        const scores = await sql`
            SELECT
                TO_CHAR(date, 'YYYY-MM-DD') AS date,
                total_points,
                total_seconds
            FROM daily_scores
            WHERE user_id = ${req.user.id}
                AND date >= CURRENT_DATE - INTERVAL '6 days'
                AND date <= CURRENT_DATE
            ORDER BY date ASC
        `;

        return res.json(scores.map(s => ({
            date: s.date,
            total_points: Number(s.total_points),
            total_seconds: Number(s.total_seconds)
        })));
    } catch (err) {
        console.error('Weekly analytics error:', err);
        return res.status(500).json({ success: false, message: 'Could not load weekly analytics' });
    }
}

async function getMonthlyAnalytics(req, res) {
    try {
        const now = new Date();
        const year = req.query.year ? Number(req.query.year) : now.getFullYear();
        const month = req.query.month ? Number(req.query.month) : (now.getMonth() + 1);

        if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
            return res.status(400).json({ success: false, message: 'Invalid year or month' });
        }

        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;

        const scores = await sql`
            SELECT
                TO_CHAR(date, 'YYYY-MM-DD') AS date,
                total_points,
                total_seconds
            FROM daily_scores
            WHERE user_id = ${req.user.id}
                AND date >= ${monthStart}::date
                AND date < (${monthStart}::date + INTERVAL '1 month')
            ORDER BY date ASC
        `;

        return res.json(scores.map(s => ({
            date: s.date,
            total_points: Number(s.total_points),
            total_seconds: Number(s.total_seconds)
        })));
    } catch (err) {
        console.error('Monthly analytics error:', err);
        return res.status(500).json({ success: false, message: 'Could not load monthly analytics' });
    }
}

async function getYearlyAnalytics(req, res) {
    try {
        const now = new Date();
        const year = req.query.year ? Number(req.query.year) : now.getFullYear();

        if (!Number.isInteger(year)) {
            return res.status(400).json({ success: false, message: 'Invalid year' });
        }

        const yearStart = `${year}-01-01`;

        const scores = await sql`
            SELECT
                TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
                SUM(total_points) AS total_points,
                SUM(total_seconds) AS total_seconds
            FROM daily_scores
            WHERE user_id = ${req.user.id}
                AND date >= ${yearStart}::date
                AND date < (${yearStart}::date + INTERVAL '1 year')
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY month ASC
        `;

        return res.json(scores.map(s => ({
            month: s.month,
            total_points: Number(s.total_points),
            total_seconds: Number(s.total_seconds)
        })));
    } catch (err) {
        console.error('Yearly analytics error:', err);
        return res.status(500).json({ success: false, message: 'Could not load yearly analytics' });
    }
}

async function getCustomAnalytics(req, res) {
    try {
        const { start, end } = req.query;

        if (!isValidDate(start) || !isValidDate(end)) {
            return res.status(400).json({ success: false, message: 'Valid start and end dates required' });
        }

        const scores = await sql`
            SELECT
                TO_CHAR(date, 'YYYY-MM-DD') AS date,
                total_points,
                total_seconds
            FROM daily_scores
            WHERE user_id = ${req.user.id}
                AND date >= ${start}::date
                AND date <= ${end}::date
            ORDER BY date ASC
        `;

        return res.json(scores.map(s => ({
            date: s.date,
            total_points: Number(s.total_points),
            total_seconds: Number(s.total_seconds)
        })));
    } catch (err) {
        console.error('Custom analytics error:', err);
        return res.status(500).json({ success: false, message: 'Could not load custom analytics' });
    }
}

async function getRangeAnalytics(req, res) {
    try {
        const { from, to } = req.query;

        if (!isValidDate(from) || !isValidDate(to)) {
            return res.status(400).json({ success: false, message: 'Valid from and to dates required' });
        }

        const stats = await sql`
            SELECT
                tasks.name AS task_name,
                COALESCE(SUM(ts.duration_seconds), 0) AS total_seconds,
                COALESCE(SUM((ts.duration_seconds / 3600.0) * tasks.weight * 5), 0) AS points
            FROM tasks
            JOIN task_sessions ts ON ts.task_id = tasks.id
            WHERE tasks.user_id = ${req.user.id}
                AND ts.duration_seconds IS NOT NULL
                AND ts.start_time >= ${from}::date
                AND ts.start_time < (${to}::date + INTERVAL '1 day')
            GROUP BY tasks.name
            ORDER BY points DESC
        `;

        return res.json(stats.map(s => ({
            task_name: s.task_name,
            total_seconds: Number(s.total_seconds),
            points: Number(s.points).toFixed(2)
        })));
    } catch (err) {
        console.error('Range analytics error:', err);
        return res.status(500).json({ success: false, message: 'Could not load range analytics' });
    }
}

module.exports = {
    getDailyAnalytics,
    getWeeklyAnalytics,
    getMonthlyAnalytics,
    getYearlyAnalytics,
    getCustomAnalytics,
    getRangeAnalytics
};
