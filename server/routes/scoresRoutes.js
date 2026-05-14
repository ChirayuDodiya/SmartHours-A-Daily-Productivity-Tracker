const express = require('express');
const {
    getMonthlyScores
} = require('../controllers/scoresController.js');
const requireAuth = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/month/:year/:month', requireAuth, getMonthlyScores);

module.exports = router;
