const weatherData = require('../data/weather.data');

async function getCurrentWeather(req, res) {
  const { city } = req.query;
  if (!city || city.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'City parameter is required',
      code: 'MISSING_CITY'
    });
  }

  try {
    const weather = await weatherData.getCurrentWeather(city);

    if (!weather) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Weather data not found for city: ${city}`,
        code: 'CITY_NOT_FOUND',
        available_cities: weatherData.getCities()
      });
    }
    res.status(200).json(weather);
  } catch (err) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch weather data'
    });
  }
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
  const numDays = days ? parseInt(days) : 3;
  if (isNaN(numDays) || numDays < 1 || numDays > 7) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Days parameter must be a number between 1 and 7',
      code: 'INVALID_DAYS'
    });
  }

  try {
    const forecast = await weatherData.getForecast(city, numDays);

    if (!forecast) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Weather data not found for city: ${city}`,
        code: 'CITY_NOT_FOUND',
        available_cities: weatherData.getCities()
      });
    }
    res.status(200).json(forecast);
  } catch (err) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch forecast data'
    });
  }
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
