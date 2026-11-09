const activityData = require('../data/activity.data');
const weatherData = require('../data/weather.data');

const validPeriods = ['morning', 'afternoon', 'evening', 'night', 'all-day'];

async function getSuggestions(req, res) {
  const { city, period } = req.query;
  if (!city || city.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'City parameter is required',
      code: 'MISSING_CITY'
    });
  }

  const selectedPeriod = period ? period.toLowerCase() : 'all-day';
  if (!validPeriods.includes(selectedPeriod)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid period. Valid options are: ${validPeriods.join(', ')}`,
      code: 'INVALID_PERIOD'
    });
  }

  const suggestions = await activityData.getActivitySuggestions(city, selectedPeriod);

  if (!suggestions) {
    const cities = await weatherData.getCities();
    return res.status(404).json({
      error: 'Not Found',
      message: `No activity suggestions found for city: ${city}`,
      code: 'CITY_NOT_FOUND',
      available_cities: cities
    });
  }

  res.json({
    city: city,
    period: selectedPeriod,
    suggestions: suggestions
  });
}

async function getRiskAssessment(req, res) {
  const { city } = req.query;
  const cities = await weatherData.getCities();

  if (!city || city.trim() === '') {
    const citiesWithRisks = [];
    for (const c of cities) {
      const weather = await weatherData.getWeatherForActivities(c.city);
      const risks = weather ? activityData.detectRisks(weather) : [];
      citiesWithRisks.push({
        city: c.city,
        country: c.country,
        risks: risks
      });
    }

    return res.json({
      cities: {
        count: citiesWithRisks.length,
        list: citiesWithRisks
      }
    });
  }

  const weather = await weatherData.getWeatherForActivities(city);
  if (!weather) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Weather data not found for city: ${city}`,
      code: 'CITY_NOT_FOUND',
      available_cities: cities
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
};