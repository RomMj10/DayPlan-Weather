const { get } = require('http');
const activityData = require('../data/activity.data');
const weatherService = require('../data/weatherService');

function getSuggestions(req, res) {
  const {city, period} = req.query;
  if (!city || city.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'City parameter is required',
      code: 'MISSING_CITY'
    });
  }

  const validPeriods = ['morning', 'afternoon', 'evening', 'night', 'all-day'];
  const selectedPeriod = period ? period.toLowerCase() : 'all-day';
  if (!validPeriods.includes(selectedPeriod)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid period. Valid options are: ${validPeriods.join(', ')}`,
      code: 'INVALID_PERIOD'
    });
  }
}

function getRiskAssessment(req, res) {
  const {city} = req.query;
  if (!city || city.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'City parameter is required',
      code: 'MISSING_CITY'
    });
  }
}

module.exports = {
  getSuggestions,
  getRiskAssessment
}