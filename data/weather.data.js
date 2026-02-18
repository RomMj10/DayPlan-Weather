const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const CITIES = {
  manila: { city: 'Manila', country: 'PH', lat: 14.5995, lon: 120.9842 },
  'quezon city': { city: 'Quezon City', country: 'PH', lat: 14.6760, lon: 121.0437 },
  makati: { city: 'Makati', country: 'PH', lat: 14.5547, lon: 121.0244 },
  cebu: { city: 'Cebu', country: 'PH', lat: 10.3157, lon: 123.8854 },
  davao: { city: 'Davao', country: 'PH', lat: 7.1907, lon: 125.4553 },
  calamba: { city: 'Calamba', country: 'PH', lat: 14.2114, lon: 121.1653 },
  baguio: { city: 'Baguio', country: 'PH', lat: 16.4023, lon: 120.5960 },
  tagaytay: { city: 'Tagaytay', country: 'PH', lat: 14.1153, lon: 120.9621 },
  iloilo: { city: 'Iloilo', country: 'PH', lat: 10.7202, lon: 122.5621 },
  zamboanga: { city: 'Zamboanga', country: 'PH', lat: 6.9214, lon: 122.0790 },
  'puerto princesa': { city: 'Puerto Princesa', country: 'PH', lat: 9.7392, lon: 118.7353 },
  boracay: { city: 'Boracay', country: 'PH', lat: 11.9674, lon: 121.9248 },
  vigan: { city: 'Vigan', country: 'PH', lat: 17.5747, lon: 120.3869 },
  legazpi: { city: 'Legazpi', country: 'PH', lat: 13.1391, lon: 123.7438 },
  tacloban: { city: 'Tacloban', country: 'PH', lat: 11.2543, lon: 124.9556 },
  cagayan: { city: 'Cagayan de Oro', country: 'PH', lat: 8.4542, lon: 124.6319 },
  'general santos': { city: 'General Santos', country: 'PH', lat: 6.1164, lon: 125.1716 },
  batangas: { city: 'Batangas', country: 'PH', lat: 13.7565, lon: 121.0583 },
  angeles: { city: 'Angeles', country: 'PH', lat: 15.1450, lon: 120.5887 },
  subic: { city: 'Subic', country: 'PH', lat: 14.8771, lon: 120.2332 }
};

async function fetchFromOWM(endpoint, params) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('appid', API_KEY);
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`OpenWeatherMap API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function getCityCoords(city) {
  const key = city.toLowerCase().trim();
  return CITIES[key] || null;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function estimateRainProbability(owmData) {
  if (owmData.rain) return 85;
  const condition = (owmData.weather[0]?.main || '').toLowerCase();
  if (condition.includes('rain') || condition.includes('thunderstorm') || condition.includes('drizzle')) return 70;
  return 0;
}

function mapAqi(owmAqi) {
  const map = { 1: 25, 2: 60, 3: 110, 4: 160, 5: 250 };
  return map[owmAqi] || 0;
}

function getAqiLabel(owmAqi) {
  const labels = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };
  return labels[owmAqi] || 'Unknown';
}

function windDirection(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

async function getCurrentWeather(city) {
  const coords = getCityCoords(city);
  if (!coords) return null;

  const [weather, airPollution] = await Promise.all([
    fetchFromOWM('weather', { lat: coords.lat, lon: coords.lon, units: 'metric' }),
    fetchFromOWM('air_pollution', { lat: coords.lat, lon: coords.lon })
  ]);

  const aqi = airPollution.list?.[0]?.main?.aqi;

  return {
    location: { city: coords.city, country: coords.country },
    temperature_c: Math.round(weather.main.temp),
    feels_like_c: Math.round(weather.main.feels_like),
    humidity_percent: weather.main.humidity,
    condition: capitalizeFirst(weather.weather[0]?.description || 'Unknown'),
    icon: weather.weather[0]?.icon || '',
    wind_kph: Math.round(weather.wind.speed * 3.6),
    wind_gust_kph: weather.wind.gust ? Math.round(weather.wind.gust * 3.6) : null,
    wind_deg: weather.wind.deg,
    wind_direction: windDirection(weather.wind.deg || 0),
    uv_index: null,
    rain_probability: estimateRainProbability(weather),
    air_quality_index: mapAqi(aqi),
    aqi_raw: aqi,
    aqi_label: getAqiLabel(aqi),
    pressure_hpa: weather.main.pressure,
    visibility_km: Math.round((weather.visibility || 10000) / 1000),
    clouds_percent: weather.clouds?.all || 0,
    timezone_offset: weather.timezone,
    sunrise: weather.sys.sunrise,
    sunset: weather.sys.sunset,
    observed_at: new Date().toISOString()
  };
}

async function getForecast(city, days = 5) {
  const coords = getCityCoords(city);
  if (!coords) return null;

  const data = await fetchFromOWM('forecast', { lat: coords.lat, lon: coords.lon, units: 'metric' });

  const dailyMap = {};
  const hourly = [];

  for (const item of data.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { temps: [], conditions: [], icons: [], pops: [], date };
    }
    dailyMap[date].temps.push(item.main.temp_min, item.main.temp_max);
    dailyMap[date].conditions.push(item.weather[0]?.main || '');
    dailyMap[date].icons.push(item.weather[0]?.icon || '');
    dailyMap[date].pops.push((item.pop || 0) * 100);

    if (hourly.length < 12) {
      hourly.push({
        dt: item.dt,
        time: item.dt_txt,
        temp_c: Math.round(item.main.temp),
        condition: capitalizeFirst(item.weather[0]?.description || ''),
        icon: item.weather[0]?.icon || '',
        pop: Math.round((item.pop || 0) * 100)
      });
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const limitedDays = Math.min(Math.max(1, days), 5);
  const forecast = Object.values(dailyMap)
    .filter(d => d.date >= today)
    .slice(0, limitedDays)
    .map(d => {
      const mostCommon = d.conditions.sort((a, b) =>
        d.conditions.filter(v => v === b).length - d.conditions.filter(v => v === a).length
      )[0];
      const mostCommonIcon = d.icons.sort((a, b) =>
        d.icons.filter(v => v === b).length - d.icons.filter(v => v === a).length
      )[0];
      return {
        date: d.date,
        min_temp_c: Math.round(Math.min(...d.temps)),
        max_temp_c: Math.round(Math.max(...d.temps)),
        condition: capitalizeFirst(mostCommon.toLowerCase()),
        icon: mostCommonIcon,
        rain_probability: Math.round(Math.max(...d.pops)),
        uv_index: null
      };
    });

  return {
    location: { city: coords.city, country: coords.country },
    forecast,
    hourly
  };
}

function getCities() {
  return Object.values(CITIES).map(c => ({
    city: c.city,
    country: c.country
  }));
}

async function getWeatherForActivities(city, period = 'all-day') {
  const current = await getCurrentWeather(city);
  if (!current) return null;

  const forecast = await getForecast(city, 1);

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
