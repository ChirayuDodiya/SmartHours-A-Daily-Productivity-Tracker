const express = require('express');
const {
    getActiveSession
} = require('../controllers/sessionsController.js');
const requireAuth = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/active', requireAuth, getActiveSession);

module.exports = router;
