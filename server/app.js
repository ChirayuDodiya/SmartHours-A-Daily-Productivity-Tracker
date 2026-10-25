const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes.js');
const packsRoutes = require('./routes/packsRoutes.js');
const scoresRoutes = require('./routes/scoresRoutes.js');
const sessionsRoutes = require('./routes/sessionsRoutes.js');
const tasksRoutes = require('./routes/tasksRoutes.js');
const analyticsRoutes = require('./routes/analyticsRoutes.js');


const app = express();

app.set('trust proxy', 1);

const rawFrontendUrl = process.env.FRONTEND_URL || '';
const allowedOrigins = rawFrontendUrl
    .split(',')
    .map(url => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    console.warn('[CORS Warning] FRONTEND_URL is not set in environment variables. Requests from web browsers will be blocked.');
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        // Allow Vercel preview deployments if configured domain is a vercel.app domain
        const isVercelAllowed = allowedOrigins.some(allowed =>
            allowed.includes('vercel.app') && normalizedOrigin.endsWith('.vercel.app')
        );
        if (isVercelAllowed) {
            return callback(null, true);
        }

        console.warn(`[CORS Blocked] Origin "${origin}" not allowed. Configured FRONTEND_URL: "${rawFrontendUrl}"`);
        callback(new Error('CORS origin not allowed'));
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('SmartHours API Running');
});

app.use('/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/packs', packsRoutes);
app.use('/api/v1/scores', scoresRoutes);
app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/analytics', analyticsRoutes);


module.exports = app;
