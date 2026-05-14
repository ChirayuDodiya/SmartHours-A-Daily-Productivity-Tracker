const express = require('express');
const { getDailyAnalytics } = require('../controllers/analyticsController.js');
const requireAuth = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/daily/:date', requireAuth, getDailyAnalytics);

module.exports = router;
