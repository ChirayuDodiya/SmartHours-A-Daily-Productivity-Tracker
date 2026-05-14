const express = require('express');
const { 
    getDailyAnalytics,
    getWeeklyAnalytics,
    getMonthlyAnalytics,
    getYearlyAnalytics,
    getCustomAnalytics,
    getRangeAnalytics
} = require('../controllers/analyticsController.js');
const requireAuth = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/daily/:date', requireAuth, getDailyAnalytics);
router.get('/weekly', requireAuth, getWeeklyAnalytics);
router.get('/monthly', requireAuth, getMonthlyAnalytics);
router.get('/yearly', requireAuth, getYearlyAnalytics);
router.get('/custom', requireAuth, getCustomAnalytics);
router.get('/range', requireAuth, getRangeAnalytics);

module.exports = router;
