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

function getCurrentWeather(city) {
    const cityKey = city.toLowerCase().trim();
    const data = mockWeatherData[cityKey];

    if (!data) {
        return null;
    }

    return {
        location: data.location,
        temperature_c: data.current.temperature_c,
        humidity_percent: data.current.humidity_percent,
        condition: data.current.condition,
        wind_kph: data.current.wind_kph,
        uv_index: data.current.uv_index,
        rain_probability: data.current.rain_probability,
        air_quality_index: data.current.air_quality_index,
        observed_at: data.current.observed_at
    };
}

function getForecast(city, days = 3) {
    const cityKey = city.toLowerCase().trim();
    const data = mockWeatherData[cityKey];

    if (!data) {
        return null;
    }

    const limitedDays = Math.min(Math.max(1, days), 7);
    return {
        location: data.location,
        forecast: data.forecast.slice(0, limitedDays)
    };
}

function getCities() {
    return Object.keys(mockWeatherData).map(key => ({
        city: mockWeatherData[key].location.city,
        country: mockWeatherData[key].location.country
    }));
}

function getWeatherForActivities(city, period = 'all-day') {
  const current = getCurrentWeather(city);
  if (!current) {
    return null;
  }
  const forecast = getForecast(city, 1);
  
  return {
    current,
    forecast: forecast.forecast[0],
    period
  };
}

module.exports = {
    getCurrentWeather,
    getForecast,
    getCities,
    getWeatherForActivities
};