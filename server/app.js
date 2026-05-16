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

const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
const allowedOrigins = [frontendUrl].filter(Boolean);

app.use(cors({
    origin: frontendUrl,
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
