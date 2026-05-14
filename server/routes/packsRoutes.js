const express = require('express');
const {
    getPacks
} = require('../controllers/packsController.js');
const requireAuth = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/', requireAuth, getPacks);

module.exports = router;
