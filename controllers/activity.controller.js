const { get } = require('http');
const activityData = require('../data/activity.data');
const weatherData = require('../data/weather.data');

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
  const suggestions = activityData.getActivitySuggestions(city, selectedPeriod);
  
  if (!suggestions) {
    return res.status(404).json({
      error: 'Not Found',
      message: `No activity suggestions found for city: ${city}`,
      code: 'CITY_NOT_FOUND',
      available_cities: weatherData.getCities()
    });
  }
  
  res.json({
    city: city,
    period: selectedPeriod,
    suggestions: suggestions
  });
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