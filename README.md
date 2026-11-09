# DayPlan-Weather

A weather-based activity suggestion API that provides current weather, forecasts, and personalized activity recommendations based on outdoor conditions.

## Setup

```bash
npm install
cp .env.example .env  # Configure environment variables
npm start
```

## API Endpoints

### Weather Routes (`/v1/weather`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/current` | GET | Get current weather for a city (requires `city` query param) |
| `/forecast` | GET | Get weather forecast (requires `city`, optional `days` 1-7) |
| `/cities` | GET | List available cities |

### Activity Routes (`/v1/activities`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/suggestions` | GET | Get activity suggestions based on weather (requires `city`, optional `period`: morning/afternoon/evening/night/all-day) |
| `/risks` | GET | Get risk assessment for a city (requires `city` or omit for all cities) |

## Data Sources

This API uses free, open data sources:

- **Weather Data** - [Open-Meteo](https://open-meteo.com) - Global weather forecasts with UV index, precipitation probability, and air quality. No API key required.
- **Geocoding** - [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org) - City name to coordinates conversion. No API key required.

## Architecture

```
routes/
├── weather.routes.js    → GET /current, /forecast, /cities
├── activity.routes.js   → GET /suggestions, /risks

controllers/
├── weather.controller.js   → Weather request handlers
├── activity.controller.js  → Activity suggestion handlers

data/
├── weather.data.js   → Weather data retrieval (live API + mock fallback)
└── activity.data.js  → Risk analysis & recommendations

services/
└── weather.service.js → External API integration (Open-Meteo, Nominatim)
```

## Default Cities

The API supports global locations via geocoding. Pre-configured fallback cities: Cebu, Manila, Calamba (Philippines).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `CACHE_TTL_MINUTES` | 15 | Cache duration for weather data |

## Error Responses

| Code | Message | When |
|------|---------|------|
| `MISSING_CITY` | City parameter is required | City query param missing |
| `INVALID_PERIOD` | Invalid period option | Period not in valid list |
| `INVALID_DAYS` | Days parameter must be 1-7 | Invalid days value |
| `CITY_NOT_FOUND` | Weather data not found for city | Unknown city requested |

## License

ISC