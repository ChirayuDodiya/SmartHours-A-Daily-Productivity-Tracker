const express = require('express');
const {
    getPacks,
    createPack,
    updatePack,
    deletePack
} = require('../controllers/packsController.js');
const requireAuth = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/', requireAuth, getPacks);
router.post('/', requireAuth, createPack);
router.put('/:packId', requireAuth, updatePack);
router.delete('/:packId', requireAuth, deletePack);

module.exports = router;
