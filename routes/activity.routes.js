const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');

router.get('/suggestions', activityController.getSuggestions);

router.get('/risks', activityController.getRiskAssessment);

module.exports = router;