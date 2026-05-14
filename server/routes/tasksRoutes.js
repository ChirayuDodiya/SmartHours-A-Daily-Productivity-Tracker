const express = require('express');
const {
    createTask,
    deleteTask,
    getTasksByDate,
    startTaskTimer,
    stopTaskTimer
} = require('../controllers/tasksController.js');
const requireAuth = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/:date', requireAuth, getTasksByDate);
router.post('/', requireAuth, createTask);
router.post('/:taskId/start', requireAuth, startTaskTimer);
router.post('/:taskId/stop', requireAuth, stopTaskTimer);
router.delete('/:taskId', requireAuth, deleteTask);

module.exports = router;
