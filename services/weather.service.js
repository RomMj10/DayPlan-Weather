const axios = require('axios');

const CACHE_TTL = parseInt(process.env.CACHE_TTL_MINUTES || '15') * 60 * 1000;

const GEOCODE_HEADERS = { 'User-Agent': 'DayPlan-API/1.0' };

const WMO_WEATHER_CODES = {
  0: 'Clear',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing Rime Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  56: 'Light Freezing Drizzle',
  57: 'Dense Freezing Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  66: 'Light Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Slight Snow',
  73: 'Moderate Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  85: 'Slight Snow Showers',
  86: 'Heavy Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Slight Hail',
  99: 'Thunderstorm with Heavy Hail'
};

const codeToCondition = (code) => {
  const base = WMO_WEATHER_CODES[code] || 'Cloudy';
  if (code >= 95) return 'Thunderstorm';
  if (code >= 80) return 'Rainy';
  if (code >= 61) return 'Rainy';
  if (code >= 51) return 'Cloudy';
  if (code >= 45) return 'Foggy';
  if (code >= 3) return 'Cloudy';
  if (code >= 1) return 'Partly Cloudy';
  return 'Sunny';
};

const cache = new Map();

const getCacheKey = (type, key) => `${type}:${key}`;

const getFromCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const geocodeCity = async (city) => {
  const params = new URLSearchParams({
    q: city,
    format: 'json',
    limit: '1'
  });
  const url = `${process.env.GEOCODE_API_BASE || 'https://nominatim.openstreetmap.org/search'}?${params}`;
  const response = await axios.get(url, { headers: GEOCODE_HEADERS });
  if (!response.data.length) throw new Error('City not found');
  return { lat: parseFloat(response.data[0].lat), lon: parseFloat(response.data[0].lon), display_name: response.data[0].display_name };
};

const fetchCurrentWeather = async (lat, lon) => {
  const cacheKey = getCacheKey('current', `${lat},${lon}`);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index,precipitation_probability&timezone=auto`;
  const response = await axios.get(url);
  const data = response.data;

  const weatherCode = data.current?.weather_code ?? 3;
  const condition = codeToCondition(weatherCode);

  const result = {
    temperature_c: data.current?.temperature_2m ?? 20,
    humidity_percent: data.current?.relative_humidity_2m ?? 50,
    condition,
    wind_kph: Math.round((data.current?.wind_speed_10m ?? 10) * 3.6),
    uv_index: data.current?.uv_index ?? 5,
    rain_probability: data.current?.precipitation_probability ?? 0,
    air_quality_index: 50,
    observed_at: new Date().toISOString()
  };

  setCache(cacheKey, result);
  return result;
};

const fetchForecast = async (lat, lon, days = 7) => {
  const maxDays = Math.min(Math.max(1, days), 7);
  const cacheKey = getCacheKey('forecast', `${lat},${lon}:${maxDays}`);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_min,temperature_2m_max,weather_code,precipitation_probability_max,uv_index_max&forecast_days=${maxDays}&timezone=auto`;
  const response = await axios.get(url);
  const data = response.data;

  const daily = data.daily;
  const forecast = [];

  for (let i = 0; i < maxDays; i++) {
    const weatherCode = daily?.weather_code?.[i] ?? 3;
    forecast.push({
      date: daily?.time?.[i] || new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      min_temp_c: daily?.temperature_2m_min?.[i] ?? 15,
      max_temp_c: daily?.temperature_2m_max?.[i] ?? 25,
      condition: codeToCondition(weatherCode),
      rain_probability: Math.round(daily?.precipitation_probability_max?.[i] ?? 0),
      uv_index: daily?.uv_index_max?.[i] ?? 5
    });
  }

  setCache(cacheKey, forecast);
  return forecast;
};

const getWeatherByCity = async (city) => {
  const { lat, lon, display_name } = await geocodeCity(city);
  const current = await fetchCurrentWeather(lat, lon);
  const forecast = await fetchForecast(lat, lon, 7);
  return {
    location: { city: display_name.split(',')[0] || city, country: display_name.split(',')[2]?.trim() || 'Unknown' },
    current,
    forecast
  };
};

const getCachedCities = () => {
  const locations = [
    { city: 'Cebu', country: 'PH', lat: 10.3157, lon: 123.8854 },
    { city: 'Manila', country: 'PH', lat: 14.5995, lon: 120.9842 },
    { city: 'Calamba', country: 'PH', lat: 14.2000, lon: 121.0500 }
  ];
  return locations.map(l => ({ city: l.city, country: l.country }));
};

module.exports = {
  geocodeCity,
  fetchCurrentWeather,
  fetchForecast,
  getWeatherByCity,
  getCachedCities
};