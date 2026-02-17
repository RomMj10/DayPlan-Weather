const weatherData = require('../data/weather.data');
function getCurrentWeather(req, res) {
  const { city } = req.query;
  if (!city || city.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'City parameter is required',
      code: 'MISSING_CITY'
    });
  }

  const weather = weatherData.getCurrentWeather(city);
  
  if (!weather) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Weather data not found for city: ${city}`,
      code: 'CITY_NOT_FOUND',
      available_cities: weatherData.getCities()
    });
  }
  res.status(200).json(weather);
}
function getForecast(req, res) {
  const { city, days } = req.query;
  if (!city || city.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'City parameter is required',
      code: 'MISSING_CITY'
    });
  }
  const numDays = days ? parseInt(days) : 3;
  const forecast = weatherData.getForecast(city, numDays);
  if (isNaN(numDays) || numDays < 1 || numDays > 7) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Days parameter must be a number between 1 and 7',
      code: 'INVALID_DAYS'
    });
  }

  res.status(200).json(forecast);
}
function getCities(req, res) {
  const cities = weatherData.getCities();
  res.status(200).json(cities);
}

module.exports = {
  getCurrentWeather,
  getForecast,
  getCities
};