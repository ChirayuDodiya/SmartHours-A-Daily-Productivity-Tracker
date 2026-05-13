const jwt = require('jsonwebtoken');
const sql = require('../db/dbConnection.js');

function getTokenFromRequest(req) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    return req.cookies?.token;
}

async function requireAuth(req, res, next) {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is required'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const users = await sql`
            SELECT id, email
            FROM users
            WHERE id = ${payload.userId}
            LIMIT 1
        `;

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }

        req.user = users[0];
        return next();
    }
    catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired authentication token'
            });
        }

        console.error('Auth middleware error:', err);

        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
}

module.exports = requireAuth;
