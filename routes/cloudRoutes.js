const express = require('express');
const router = express.Router();
const controller = require('../controllers/cloudController');

router.get('/inventory', controller.getInventory);
router.get('/metrics/:id', controller.getResourceMetrics);
router.get('/recommendations', controller.getRecommendations);

module.exports = router;