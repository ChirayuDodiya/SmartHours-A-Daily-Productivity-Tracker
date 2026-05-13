const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes.js');

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('SmartHours API Running');
});

app.use('/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

module.exports = app;
