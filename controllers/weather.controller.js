const weatherData = require('../data/weather.data');
const activityData = require('../data/activity.data');

async function getCurrentWeather(req, res) {
  const { city } = req.query;
  if (!city || city.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'City parameter is required',
      code: 'MISSING_CITY'
    });
  }

  const weather = await weatherData.getCurrentWeather(city);

  if (!weather) {
    const cities = await weatherData.getCities();
    return res.status(404).json({
      error: 'Not Found',
      message: `Weather data not found for city: ${city}`,
      code: 'CITY_NOT_FOUND',
      available_cities: cities
    });
  }
  res.status(200).json(weather);
}

async function getForecast(req, res) {
  const { city, days } = req.query;
  if (!city || city.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'City parameter is required',
      code: 'MISSING_CITY'
    });
  }

  const numDays = parseInt(days) || 3;
  if (isNaN(numDays) || numDays < 1 || numDays > 7) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Days parameter must be a number between 1 and 7',
      code: 'INVALID_DAYS'
    });
  }

  const forecast = await weatherData.getForecast(city, numDays);
  if (!forecast) {
    const cities = await weatherData.getCities();
    return res.status(404).json({
      error: 'Not Found',
      message: `Weather data not found for city: ${city}`,
      code: 'CITY_NOT_FOUND',
      available_cities: cities
    });
  }

  res.status(200).json(forecast);
}

async function getCities(req, res) {
  const cities = await weatherData.getCities();
  res.status(200).json(cities);
}

module.exports = {
  getCurrentWeather,
  getForecast,
  getCities
};