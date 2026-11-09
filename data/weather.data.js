const weatherService = require('../services/weather.service');

const mockWeatherData = {
  'cebu': {
    location: { city: 'Cebu', country: 'PH' },
    current: {
      temperature_c: 34,
      humidity_percent: 65,
      condition: 'Sunny',
      wind_kph: 12,
      uv_index: 11,
      rain_probability: 10,
      air_quality_index: 45,
      observed_at: new Date().toISOString()
    },
    forecast: [
      { date: '2026-02-17', min_temp_c: 26, max_temp_c: 34, condition: 'Sunny', rain_probability: 10, uv_index: 11 },
      { date: '2026-02-18', min_temp_c: 25, max_temp_c: 33, condition: 'Partly Cloudy', rain_probability: 20, uv_index: 9 },
      { date: '2026-02-19', min_temp_c: 25, max_temp_c: 31, condition: 'Thunderstorm', rain_probability: 80, uv_index: 4 },
      { date: '2026-02-20', min_temp_c: 24, max_temp_c: 29, condition: 'Rainy', rain_probability: 70, uv_index: 3 },
      { date: '2026-02-21', min_temp_c: 25, max_temp_c: 30, condition: 'Cloudy', rain_probability: 40, uv_index: 6 },
      { date: '2026-02-22', min_temp_c: 26, max_temp_c: 32, condition: 'Sunny', rain_probability: 15, uv_index: 10 },
      { date: '2026-02-23', min_temp_c: 26, max_temp_c: 33, condition: 'Sunny', rain_probability: 10, uv_index: 11 }
    ]
  },
  'manila': {
    location: { city: 'Manila', country: 'PH' },
    current: {
      temperature_c: 36,
      humidity_percent: 70,
      condition: 'Hot and Humid',
      wind_kph: 8,
      uv_index: 10,
      rain_probability: 15,
      air_quality_index: 55,
      observed_at: new Date().toISOString()
    },
    forecast: [
      { date: '2026-02-17', min_temp_c: 27, max_temp_c: 36, condition: 'Hot and Humid', rain_probability: 15, uv_index: 10 },
      { date: '2026-02-18', min_temp_c: 27, max_temp_c: 35, condition: 'Partly Cloudy', rain_probability: 25, uv_index: 8 },
      { date: '2026-02-19', min_temp_c: 26, max_temp_c: 33, condition: 'Thunderstorm', rain_probability: 75, uv_index: 3 },
      { date: '2026-02-20', min_temp_c: 26, max_temp_c: 32, condition: 'Rainy', rain_probability: 65, uv_index: 4 },
      { date: '2026-02-21', min_temp_c: 27, max_temp_c: 34, condition: 'Sunny', rain_probability: 20, uv_index: 9 }
    ]
  },
  'calamba': {
    location: { city: 'Calamba', country: 'PH' },
    current: {
      temperature_c: 32,
      humidity_percent: 62,
      condition: 'Rainy',
      wind_kph: 10,
      uv_index: 4,
      rain_probability: 75,
      air_quality_index: 40,
      observed_at: new Date().toISOString()
    },
    forecast: [
      { date: '2026-02-17', min_temp_c: 8, max_temp_c: 12, condition: 'Rainy', rain_probability: 85, uv_index: 2 },
      { date: '2026-02-18', min_temp_c: 7, max_temp_c: 11, condition: 'Overcast', rain_probability: 60, uv_index: 1 },
      { date: '2026-02-19', min_temp_c: 6, max_temp_c: 10, condition: 'Light Rain', rain_probability: 70, uv_index: 2 },
      { date: '2026-02-20', min_temp_c: 5, max_temp_c: 9, condition: 'Cloudy', rain_probability: 40, uv_index: 3 },
      { date: '2026-02-21', min_temp_c: 7, max_temp_c: 12, condition: 'Partly Cloudy', rain_probability: 35, uv_index: 4 }
    ]
  }
};

async function getCurrentWeather(city) {
  const cityKey = city.toLowerCase().trim();
  const mock = mockWeatherData[cityKey];
  if (!mock) return null;

  try {
    const live = await weatherService.getWeatherByCity(city);
    return {
      location: live.location,
      temperature_c: live.current.temperature_c,
      humidity_percent: live.current.humidity_percent,
      condition: live.current.condition,
      wind_kph: live.current.wind_kph,
      uv_index: live.current.uv_index,
      rain_probability: live.current.rain_probability,
      air_quality_index: live.current.air_quality_index,
      observed_at: live.current.observed_at
    };
  } catch (error) {
    return {
      location: mock.location,
      temperature_c: mock.current.temperature_c,
      humidity_percent: mock.current.humidity_percent,
      condition: mock.current.condition,
      wind_kph: mock.current.wind_kph,
      uv_index: mock.current.uv_index,
      rain_probability: mock.current.rain_probability,
      air_quality_index: mock.current.air_quality_index,
      observed_at: new Date().toISOString()
    };
  }
}

async function getForecast(city, days = 3) {
  const numDays = Math.min(Math.max(1, parseInt(days) || 3), 7);
  const cityKey = city.toLowerCase().trim();
  const mock = mockWeatherData[cityKey];
  if (!mock) return null;

  try {
    const live = await weatherService.getWeatherByCity(city);
    return {
      location: live.location,
      forecast: live.forecast.slice(0, numDays)
    };
  } catch (error) {
    return {
      location: mock.location,
      forecast: mock.forecast.slice(0, numDays)
    };
  }
}

async function getCities() {
  try {
    const live = await weatherService.getWeatherByCity('Cebu');
    return [{ city: live.location.city, country: live.location.country }];
  } catch (error) {
    return Object.keys(mockWeatherData).map(key => ({
      city: mockWeatherData[key].location.city,
      country: mockWeatherData[key].location.country
    }));
  }
}

async function getWeatherForActivities(city, period = 'all-day') {
  const cityKey = city.toLowerCase().trim();
  const mock = mockWeatherData[cityKey];
  if (!mock) return null;

  try {
    const live = await weatherService.getWeatherByCity(city);
    const current = {
      location: live.location,
      temperature_c: live.current.temperature_c,
      humidity_percent: live.current.humidity_percent,
      condition: live.current.condition,
      wind_kph: live.current.wind_kph,
      uv_index: live.current.uv_index,
      rain_probability: live.current.rain_probability,
      air_quality_index: live.current.air_quality_index,
      observed_at: live.current.observed_at
    };
    const forecast = {
      date: live.forecast[0]?.date || new Date().toISOString().split('T')[0],
      min_temp_c: live.forecast[0]?.min_temp_c || 15,
      max_temp_c: live.forecast[0]?.max_temp_c || 25,
      condition: live.forecast[0]?.condition || 'Cloudy',
      rain_probability: live.forecast[0]?.rain_probability || 0,
      uv_index: live.forecast[0]?.uv_index || 5
    };

    return {
      current,
      forecast,
      period
    };
  } catch (error) {
    const current = {
      location: mock.location,
      temperature_c: mock.current.temperature_c,
      humidity_percent: mock.current.humidity_percent,
      condition: mock.current.condition,
      wind_kph: mock.current.wind_kph,
      uv_index: mock.current.uv_index,
      rain_probability: mock.current.rain_probability,
      air_quality_index: mock.current.air_quality_index,
      observed_at: new Date().toISOString()
    };
    return {
      current,
      forecast: mock.forecast[0],
      period
    };
  }
}

module.exports = {
  getCurrentWeather,
  getForecast,
  getCities,
  getWeatherForActivities
};