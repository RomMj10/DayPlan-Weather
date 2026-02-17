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
    const cities = weatherData.getCities();
    const citiesWithRisks = cities.map(c => {
      const weather = weatherData.getWeatherForActivities(c.city);
      const risks = weather ? activityData.detectRisks(weather) : [];
      return {
        city: c.city,
        country: c.country,
        risks: risks
      };
    });
    
    return res.json({
      cities: {
        count: citiesWithRisks.length, 
        list: citiesWithRisks
      }
    });
  }
  const weather = weatherData.getWeatherForActivities(city);
  if (!weather) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Weather data not found for city: ${city}`,
      code: 'CITY_NOT_FOUND',
      available_cities: weatherData.getCities()
    });
  }
  const risks = activityData.detectRisks(weather);
  res.json({
    city: city,
    country: weather.current.location.country,
    risks: risks
  });
}

module.exports = {
  getSuggestions,
  getRiskAssessment
}