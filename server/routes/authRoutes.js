const express = require('express');
const {
    getCurrentUser,
    handleGoogleCallback,
    login,
    logout,
    register,
    startGoogleAuth
} = require('../controllers/authController.js');
const requireAuth = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/google', startGoogleAuth);
router.get('/google/callback', handleGoogleCallback);
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
