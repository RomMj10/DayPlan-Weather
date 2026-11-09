const API_BASE = '/v1';

let clockInterval = null;
let activeCity = null;

// ===== HELPERS =====

function isNightTime(sunrise, sunset) {
  const nowUtc = Math.floor(Date.now() / 1000);
  return nowUtc < sunrise || nowUtc > sunset;
}

function conditionEmoji(condition, isNight) {
  const c = condition.toLowerCase();
  if (c.includes('thunderstorm')) return '\u26C8\uFE0F';
  if (c.includes('rain') || c.includes('drizzle')) return '\uD83C\uDF27\uFE0F';
  if (c.includes('snow')) return '\u2744\uFE0F';
  if (c.includes('wind')) return '\uD83D\uDCA8';
  if (c.includes('clear') || c.includes('sunny') || c.includes('hot')) return isNight ? '\uD83C\uDF19' : '\u2600\uFE0F';
  if (c.includes('few clouds') || c.includes('partly') || c.includes('scattered')) return isNight ? '\uD83C\uDF19' : '\u26C5';
  if (c.includes('cloud') || c.includes('overcast') || c.includes('broken')) return isNight ? '\uD83C\uDF11' : '\u2601\uFE0F';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return '\uD83C\uDF2B\uFE0F';
  return isNight ? '\uD83C\uDF19' : '\uD83C\uDF24\uFE0F';
}

function getCityLocalTime(timezoneOffset) {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + timezoneOffset * 1000);
}

function unixToLocalTime(unix, tzOffset) {
  const d = new Date((unix + tzOffset) * 1000);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatHour(dtUnix, tzOffset) {
  const d = new Date((dtUnix + tzOffset) * 1000);
  let h = d.getUTCHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h} ${ampm}`;
}

function formatDay(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatRiskType(type) {
  return type.replace(/_/g, ' ');
}

function val(v, fallback) {
  return (v !== undefined && v !== null && !Number.isNaN(v)) ? v : fallback;
}

// ===== SIDEBAR =====

async function loadCities() {
  try {
    const res = await fetch(`${API_BASE}/weather/cities`);
    const cities = await res.json();
    renderCityList(cities);
    preloadCityWeather(cities);
  } catch {
    console.error('Failed to load cities');
  }
}

function renderCityList(cities) {
  const list = document.getElementById('city-list');
  list.innerHTML = cities.map(c => {
    const key = c.city.replace(/\s/g, '_');
    return `
    <div class="city-item" data-city="${c.city}" onclick="selectCity('${c.city.replace(/'/g, "\\'")}')">
      <div class="city-item-info">
        <div class="city-item-name">${c.city}</div>
        <div class="city-item-condition" id="sidebar-cond-${key}">--</div>
      </div>
      <div style="text-align:right">
        <div class="city-item-temp" id="sidebar-temp-${key}">--</div>
      </div>
    </div>`;
  }).join('');
}

async function preloadCityWeather(cities) {
  const fetches = cities.map(c =>
    fetch(`${API_BASE}/weather/current?city=${encodeURIComponent(c.city)}`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
  );
  const results = await Promise.all(fetches);
  results.forEach((data, i) => {
    if (!data) return;
    const key = cities[i].city.replace(/\s/g, '_');
    const tempEl = document.getElementById(`sidebar-temp-${key}`);
    const condEl = document.getElementById(`sidebar-cond-${key}`);
    if (tempEl) tempEl.textContent = `${data.temperature_c}\u00B0`;
    if (condEl) condEl.textContent = data.condition;
  });
}

function setupSearch() {
  const input = document.getElementById('city-search');
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll('.city-item').forEach(el => {
      el.style.display = el.dataset.city.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// ===== SELECT CITY =====

async function selectCity(city) {
  activeCity = city;

  document.querySelectorAll('.city-item').forEach(el => {
    el.classList.toggle('active', el.dataset.city === city);
  });

  const content = document.getElementById('weather-content');
  const placeholder = document.getElementById('placeholder');
  placeholder.classList.add('hidden');
  content.classList.remove('hidden');

  document.getElementById('hero').innerHTML = '<div class="loading-spinner"><div class="spinner"></div><div>Loading...</div></div>';

  try {
    const [weatherRes, forecastRes, activitiesRes, risksRes] = await Promise.all([
      fetch(`${API_BASE}/weather/current?city=${encodeURIComponent(city)}`),
      fetch(`${API_BASE}/weather/forecast?city=${encodeURIComponent(city)}&days=5`),
      fetch(`${API_BASE}/activities/suggestions?city=${encodeURIComponent(city)}`),
      fetch(`${API_BASE}/activities/risks?city=${encodeURIComponent(city)}`)
    ]);

    if (!weatherRes.ok || !forecastRes.ok) throw new Error('API error');

    const [weather, forecast, activities, risks] = await Promise.all([
      weatherRes.json(),
      forecastRes.json(),
      activitiesRes.ok ? activitiesRes.json() : null,
      risksRes.ok ? risksRes.json() : null
    ]);

    if (activeCity !== city) return;

    renderHero(weather, forecast);
    renderHourly(forecast, weather);
    renderForecast(forecast);
    renderDetailCards(weather);
    renderActivities(activities);
    renderRisks(risks);
    startClock(weather);
  } catch {
    document.getElementById('hero').innerHTML = '<div class="loading-spinner"><div style="color:#f87171">Failed to load weather data. Try again.</div></div>';
  }
}

// ===== RENDERERS =====

function renderHero(weather, forecast) {
  const night = isNightTime(weather.sunrise, weather.sunset);
  const emoji = conditionEmoji(weather.condition, night);
  const todayForecast = forecast.forecast?.[0];
  const hi = todayForecast ? todayForecast.max_temp_c : weather.temperature_c;
  const lo = todayForecast ? todayForecast.min_temp_c : weather.temperature_c;

  const main = document.getElementById('main-content');
  main.style.background = night
    ? 'linear-gradient(180deg, #0f1528 0%, #0a0e1a 40%, #080b14 100%)'
    : 'linear-gradient(180deg, #1e3a5f 0%, #1a2d4a 40%, #0f1a2e 100%)';

  document.getElementById('hero').innerHTML = `
    <div class="hero-city">${weather.location.city}</div>
    <div class="hero-temp">${weather.temperature_c}\u00B0</div>
    <div class="hero-condition">${emoji} ${weather.condition}</div>
    <div class="hero-hilo">H:${hi}\u00B0  L:${lo}\u00B0</div>
    <div class="hero-clock" id="hero-clock"></div>
  `;
}

function renderHourly(forecast, weather) {
  const section = document.getElementById('hourly-section');
  const scroll = document.getElementById('hourly-scroll');

  if (!forecast.hourly || !forecast.hourly.length) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  const tz = weather.timezone_offset;

  scroll.innerHTML = forecast.hourly.map((h, i) => {
    const isN = h.icon ? h.icon.endsWith('n') : false;
    const icon = conditionEmoji(h.condition, isN);
    const label = i === 0 ? 'Now' : formatHour(h.dt, tz);
    return `
      <div class="hourly-item">
        <div class="hourly-time">${label}</div>
        <div class="hourly-icon">${icon}</div>
        <div class="hourly-temp">${h.temp_c}\u00B0</div>
      </div>`;
  }).join('');
}

function renderForecast(data) {
  const section = document.getElementById('forecast-section');
  if (!data.forecast || !data.forecast.length) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  const list = document.getElementById('forecast-list');
  const allTemps = data.forecast.flatMap(d => [d.min_temp_c, d.max_temp_c]);
  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);
  const range = globalMax - globalMin || 1;

  list.innerHTML = data.forecast.map(day => {
    const left = ((day.min_temp_c - globalMin) / range) * 100;
    const width = ((day.max_temp_c - day.min_temp_c) / range) * 100;
    const icon = conditionEmoji(day.condition, false);
    return `
      <div class="forecast-row">
        <div class="forecast-day">${formatDay(day.date)}</div>
        <div class="forecast-icon">${icon}</div>
        <div class="forecast-low">${day.min_temp_c}\u00B0</div>
        <div class="forecast-bar-container">
          <div class="forecast-bar" style="left:${left}%;width:${Math.max(width, 8)}%"></div>
        </div>
        <div class="forecast-high">${day.max_temp_c}\u00B0</div>
      </div>`;
  }).join('');
}

function renderDetailCards(w) {
  const night = isNightTime(w.sunrise, w.sunset);
  const sunriseTime = unixToLocalTime(w.sunrise, w.timezone_offset);
  const sunsetTime = unixToLocalTime(w.sunset, w.timezone_offset);

  // Sunrise/Sunset
  document.getElementById('sunrise-card').innerHTML = `
    <div class="card-label">${night ? 'SUNSET' : 'SUNRISE'}</div>
    <div class="detail-large">${night ? sunsetTime : sunriseTime}</div>
    <div class="sunrise-arc"><svg viewBox="0 0 200 60"><defs><linearGradient id="arcGrad"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#f97316"/></linearGradient></defs><path d="M 10 55 Q 100 -20 190 55" stroke="url(#arcGrad)" stroke-width="2" fill="none" stroke-dasharray="4,4" opacity="0.4"/><line x1="10" y1="55" x2="190" y2="55" stroke="rgba(255,255,255,0.15)" stroke-width="1"/></svg></div>
    <div class="detail-sub">${night ? 'Sunrise: ' + sunriseTime : 'Sunset: ' + sunsetTime}</div>
  `;

  // Humidity
  document.getElementById('humidity-card').innerHTML = `
    <div class="card-label">HUMIDITY</div>
    <div class="detail-value">${val(w.humidity_percent, '--')}%</div>
    <div class="detail-sub">${w.humidity_percent >= 70 ? 'High humidity. It may feel warmer.' : w.humidity_percent >= 40 ? 'Comfortable humidity levels.' : 'Low humidity. Stay hydrated.'}</div>
  `;

  // Wind
  const windDir = val(w.wind_direction, '');
  const gustText = w.wind_gust_kph ? ` \u00B7 Gusts: ${w.wind_gust_kph} km/h` : '';
  document.getElementById('wind-card').innerHTML = `
    <div class="card-label">WIND</div>
    <div class="detail-value">${val(w.wind_kph, '--')} <span style="font-size:14px;font-weight:400">km/h</span></div>
    <div class="detail-sub">${windDir}${gustText}</div>
  `;

  // Feels Like
  const feelsLike = val(w.feels_like_c, null);
  if (feelsLike !== null) {
    document.getElementById('feels-card').innerHTML = `
      <div class="card-label">FEELS LIKE</div>
      <div class="detail-value">${feelsLike}\u00B0</div>
      <div class="detail-sub">${feelsLike > w.temperature_c ? 'Humidity is making it feel warmer.' : feelsLike < w.temperature_c ? 'Wind is making it feel cooler.' : 'Similar to the actual temperature.'}</div>
    `;
    document.getElementById('feels-card').classList.remove('hidden');
  } else {
    document.getElementById('feels-card').classList.add('hidden');
  }

  // Visibility
  const vis = val(w.visibility_km, null);
  if (vis !== null) {
    document.getElementById('visibility-card').innerHTML = `
      <div class="card-label">VISIBILITY</div>
      <div class="detail-value">${vis} <span style="font-size:14px;font-weight:400">km</span></div>
      <div class="detail-sub">${vis >= 10 ? 'Perfectly clear view.' : vis >= 5 ? 'Moderate visibility.' : 'Low visibility. Drive carefully.'}</div>
    `;
    document.getElementById('visibility-card').classList.remove('hidden');
  } else {
    document.getElementById('visibility-card').classList.add('hidden');
  }

  // Pressure
  const pressure = val(w.pressure_hpa, null);
  if (pressure !== null) {
    document.getElementById('pressure-card').innerHTML = `
      <div class="card-label">PRESSURE</div>
      <div class="detail-value">${pressure} <span style="font-size:14px;font-weight:400">hPa</span></div>
      <div class="detail-sub">${pressure >= 1013 ? 'High pressure. Stable conditions.' : 'Low pressure. Weather may change.'}</div>
    `;
    document.getElementById('pressure-card').classList.remove('hidden');
  } else {
    document.getElementById('pressure-card').classList.add('hidden');
  }

  // AQI
  const aqiLabel = val(w.aqi_label, null);
  const aqiVal = val(w.air_quality_index, null);
  if (aqiVal !== null) {
    const aqiPos = Math.min((aqiVal / 300) * 100, 100);
    document.getElementById('aqi-card').innerHTML = `
      <div class="card-label">AIR QUALITY</div>
      <div class="detail-value">${aqiVal}${aqiLabel ? ' <span style="font-size:14px;font-weight:400">- ' + aqiLabel + '</span>' : ''}</div>
      <div class="aqi-bar"><div class="aqi-dot" style="left:${aqiPos}%"></div></div>
      <div class="detail-sub">${aqiVal <= 50 ? 'Air quality is good.' : aqiVal <= 100 ? 'Moderate. Sensitive groups should limit outdoor exposure.' : 'Unhealthy. Consider wearing a mask outdoors.'}</div>
    `;
    document.getElementById('aqi-card').classList.remove('hidden');
  } else {
    document.getElementById('aqi-card').classList.add('hidden');
  }

  // Rain
  const rain = val(w.rain_probability, null);
  if (rain !== null) {
    document.getElementById('rain-card').innerHTML = `
      <div class="card-label">RAIN PROBABILITY</div>
      <div class="detail-value">${rain}%</div>
      <div class="detail-sub">${rain >= 60 ? 'High chance of rain. Bring an umbrella.' : rain >= 30 ? 'Some chance of rain today.' : 'Rain is unlikely right now.'}</div>
    `;
    document.getElementById('rain-card').classList.remove('hidden');
  } else {
    document.getElementById('rain-card').classList.add('hidden');
  }
}

function renderActivities(data) {
  const section = document.getElementById('activities-section');
  if (!data || !data.suggestions) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  const recs = data.suggestions.recommendations;
  let html = '';

  if (recs.outdoors.length) {
    html += `
      <div class="activity-group">
        <div class="activity-group-title outdoor">Outdoor Activities</div>
        <div class="activity-tags">${recs.outdoors.map(a => `<span class="activity-tag">${a}</span>`).join('')}</div>
      </div>`;
  }

  if (recs.indoors.length) {
    html += `
      <div class="activity-group">
        <div class="activity-group-title indoor">Indoor Activities</div>
        <div class="activity-tags">${recs.indoors.map(a => `<span class="activity-tag">${a}</span>`).join('')}</div>
      </div>`;
  }

  if (recs.avoid.length) {
    html += `
      <div class="activity-group">
        <div class="activity-group-title avoid">Avoid</div>
        <div class="activity-tags">${recs.avoid.map(a => `<span class="activity-tag">${a}</span>`).join('')}</div>
      </div>`;
  }

  if (recs.safety_note) {
    html += `<div class="safety-note">${recs.safety_note}</div>`;
  }

  document.getElementById('activity-details').innerHTML = html;
}

function renderRisks(data) {
  const section = document.getElementById('risks-section');
  if (!data) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  const container = document.getElementById('risk-details');
  if (!data.risks || data.risks.length === 0) {
    container.innerHTML = '<div class="no-risks">No significant weather risks detected. Enjoy your day!</div>';
    return;
  }

  container.innerHTML = `<div class="risk-items">${data.risks.map(risk => {
    const cls = 'risk-' + risk.level.toLowerCase();
    return `
      <div class="risk-item ${cls}">
        <div class="risk-item-type">${formatRiskType(risk.type)}</div>
        <div class="risk-item-desc">${risk.description}</div>
      </div>`;
  }).join('')}</div>`;
}

// ===== CLOCK =====

function startClock(weather) {
  if (clockInterval) clearInterval(clockInterval);

  function update() {
    const el = document.getElementById('hero-clock');
    if (!el) return;
    const local = getCityLocalTime(weather.timezone_offset);
    el.textContent = local.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    }) + '  \u00B7  ' + local.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
    });
  }

  update();
  clockInterval = setInterval(update, 1000);
}

// ===== MOBILE MENU =====

function setupMobileMenu() {
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }

  menuBtn.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  overlay.addEventListener('click', closeSidebar);

  // Close sidebar when a city is selected on mobile
  document.getElementById('city-list').addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && e.target.closest('.city-item')) {
      closeSidebar();
    }
  });
}

// ===== INIT =====

setupSearch();
setupMobileMenu();
loadCities();
