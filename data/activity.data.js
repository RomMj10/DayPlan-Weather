const weatherData = require('./weather.data');

const ACTIVITY_RECOMMENDATIONS = {
    outdoors: {
    sunny: ['Morning walk', 'Cycling', 'Outdoor yoga', 'Picnic in the park', 'Hiking'],
    cloudy: ['Jogging', 'Outdoor photography', 'Gardening', 'Walking the dog'],
    rainy: ['Museum visit', 'Covered market shopping', 'Indoor sports complex'],
    hot: ['Early morning swim', 'Beach activities (with sun protection)', 'Water sports'],
    cold: ['Winter hiking', 'Ice skating', 'Skiing', 'Snow activities'],
    windy: ['Kite flying', 'Windsurfing', 'Sailing']
  },
  indoors: {
    general: ['Yoga', 'Gym workout', 'Reading', 'Cooking class', 'Movie marathon', 'Board games'],
    hot: ['Indoor swimming', 'Mall walking', 'Indoor rock climbing', 'Spa day'],
    cold: ['Indoor heated pool', 'Sauna', 'Hot yoga', 'Indoor sports'],
    rainy: ['Museum tours', 'Art gallery visits', 'Indoor shopping', 'Café hopping']
  },
  avoid: {
    high_uv: ['Midday jogging', 'Sunbathing', 'Outdoor sports during peak hours'],
    heat_risk: ['Strenuous outdoor activities', 'Long exposure without shade', 'Running during midday'],
    thunderstorm: ['Outdoor activities', 'Water sports', 'Cycling', 'Golf'],
    heavy_rain: ['Hiking', 'Outdoor sports', 'Cycling', 'Beach activities'],
    extreme_cold: ['Extended outdoor exposure', 'Outdoor water activities', 'Camping'],
    high_wind: ['Cycling', 'Outdoor climbing', 'Beach activities', 'Boating']
  }
};

const RISK_THRESHOLDS = {
    UV: {
    MODERATE: { min: 3, max: 5, level: 'MODERATE' },
    HIGH: { min: 6, max: 7, level: 'HIGH' },
    VERY_HIGH: { min: 8, max: 10, level: 'VERY_HIGH' },
    EXTREME: { min: 11, max: Infinity, level: 'EXTREME' }
  },
  HEAT: {
    MODERATE: { min: 30, max: 32, level: 'MODERATE' },
    HIGH: { min: 33, max: 36, level: 'HIGH' },
    EXTREME: { min: 37, max: Infinity, level: 'EXTREME' }
  },
  COLD: {
    MODERATE: { min: 5, max: 10, level: 'MODERATE' },
    HIGH: { min: -5, max: 4, level: 'HIGH' },
    EXTREME: { min: -Infinity, max: -6, level: 'EXTREME' }
  },
  RAIN: {
    MODERATE: { min: 40, max: 59, level: 'MODERATE' },
    HIGH: { min: 60, max: 79, level: 'HIGH' },
    EXTREME: { min: 80, max: 100, level: 'EXTREME' }
  },
  WIND: {
    MODERATE: { min: 20, max: 39, level: 'MODERATE' },
    HIGH: { min: 40, max: 59, level: 'HIGH' },
    EXTREME: { min: 60, max: Infinity, level: 'EXTREME' }
  },
  AIR_QUALITY: {
    MODERATE: { min: 51, max: 100, level: 'MODERATE' },
    HIGH: { min: 101, max: 150, level: 'HIGH' },
    EXTREME: { min: 151, max: Infinity, level: 'EXTREME' }
  }
};

function detectRisks(weather) {
    const risks = [];
    const { temperature_c, uv_index, rain_probability, wind_kph, air_quality_index , condition} = weather;

    if (uv_index >= 8) {
    risks.push({
      type: 'HIGH_UV',
      level: getRiskLevel('UV', uv_index),
      value: uv_index,
      description: `UV index is ${uv_index} - ${getRiskLevel('UV', uv_index).toLowerCase()} risk of sun damage`
    });
  } else if (uv_index >= 6) {
    risks.push({
      type: 'HIGH_UV',
      level: getRiskLevel('UV', uv_index),
      value: uv_index,
      description: `UV index is ${uv_index} - moderate sun protection needed`
    });
  }

  if (weather.temperature_c >= 33) {
    risks.push({
      type: 'HEAT_RISK',
      level: getRiskLevel('HEAT', temperature_c),
      value: temperature_c,
      description: `Temperature is ${temperature_c}°C - risk of heat exhaustion`
    });
  }

  if (temperature_c <= 10) {
    risks.push({
      type: 'COLD_RISK',
      level: getRiskLevel('COLD', temperature_c),
      value: temperature_c,
      description: `Temperature is ${temperature_c}°C - risk of cold exposure`
    });
  }
  if (condition.toLowerCase().includes('thunderstorm')) {
    risks.push({
      type: 'THUNDERSTORM',
      level: 'EXTREME',
      value: rain_probability,
      description: 'Thunderstorm conditions - avoid outdoor activities'
    });
  } else if (rain_probability >= 60) {
    risks.push({
      type: 'HEAVY_RAIN',
      level: getRiskLevel('RAIN', rain_probability),
      value: rain_probability,
      description: `Rain probability is ${rain_probability}% - high chance of rain`
    });
  } else if (rain_probability >= 40) {
    risks.push({
      type: 'RAIN_RISK',
      level: 'MODERATE',
      value: rain_probability,
      description: `Rain probability is ${rain_probability}% - consider bringing umbrella`
    });
  }

  if (wind_kph >= 40) {
    risks.push({
      type: 'HIGH_WIND',
      level: getRiskLevel('WIND', wind_kph),
      value: wind_kph,
      description: `Wind speed is ${wind_kph} km/h - hazardous for outdoor activities`
    });
  } else if (wind_kph >= 20) {
    risks.push({
      type: 'MODERATE_WIND',
      level: 'MODERATE',
      value: wind_kph,
      description: `Wind speed is ${wind_kph} km/h - be cautious with outdoor activities`
    });
  }
  
  if (air_quality_index && air_quality_index >= 100) {
    risks.push({
      type: 'POOR_AIR_QUALITY',
      level: getRiskLevel('AIR_QUALITY', air_quality_index),
      value: air_quality_index,
      description: `Air quality index is ${air_quality_index} - consider limiting outdoor exercise`
    });
  }
  
  return risks;
}

function getRiskLevel(type, value) {
  const thresholds = RISK_THRESHOLDS[type];
  if (!thresholds) return 'LOW';
  
  for (const key of ['EXTREME', 'VERY_HIGH', 'HIGH', 'MODERATE']) {
    const threshold = thresholds[key];
    if (threshold && value >= threshold.min && value <= threshold.max) {
      return threshold.level;
    }
  }
  
  return 'LOW';
}

function generateWeatherSummary(weather, risks) {
  const parts = [];
  if (weather.temperature_c >= 33) {
    parts.push('Hot');
  } else if (weather.temperature_c >= 25) {
    parts.push('Warm');
  } else if (weather.temperature_c >= 15) {
    parts.push('Mild');
  } else if (weather.temperature_c >= 5) {
    parts.push('Cool');
  } else {
    parts.push('Cold');
  }
  
  parts.push(`with ${weather.condition.toLowerCase()} conditions`);
  
  if (weather.uv_index >= 8) {
    parts.push('and very high UV');
  } else if (weather.uv_index >= 6) {
    parts.push('and high UV');
  }
  
  if (weather.rain_probability >= 60) {
    parts.push(`with ${weather.rain_probability}% chance of rain`);
  }
  
  return parts.join(' ');
}


function generateRecommendations(weather, risks, period) {
  const recommendations = {
    outdoors: [],
    indoors: [],
    avoid: [],
    safety_note: ''
  };
  
  const riskTypes = risks.map(r => r.type);
  const hasHighUV = riskTypes.includes('HIGH_UV');
  const hasHeatRisk = riskTypes.includes('HEAT_RISK');
  const hasThunderstorm = riskTypes.includes('THUNDERSTORM');
  const hasHeavyRain = riskTypes.includes('HEAVY_RAIN') || riskTypes.includes('RAIN_RISK');
  const hasColdRisk = riskTypes.includes('COLD_RISK');
  const hasHighWind = riskTypes.includes('HIGH_WIND') || riskTypes.includes('MODERATE_WIND');
  
  //outdoor recommendations
  if (hasThunderstorm || hasHeavyRain) {
    recommendations.outdoors = ACTIVITY_RECOMMENDATIONS.outdoors.rainy;
  } else if (hasHeatRisk) {
    recommendations.outdoors = ['Early morning walk (before 8 AM)', 'Evening stroll (after 6 PM)', 'Shaded park activities'];
  } else if (hasColdRisk) {
    recommendations.outdoors = ACTIVITY_RECOMMENDATIONS.outdoors.cold;
  } else if (hasHighWind) {
    recommendations.outdoors = ACTIVITY_RECOMMENDATIONS.outdoors.windy;
  } else if (weather.condition.toLowerCase().includes('sunny')) {
    recommendations.outdoors = hasHighUV 
      ? ['Early morning walk', 'Late afternoon gardening', 'Evening outdoor sports']
      : ACTIVITY_SUGGESTIONS.outdoors.sunny;
  } else if (weather.condition.toLowerCase().includes('cloudy')) {
    recommendations.outdoors = ACTIVITY_RECOMMENDATIONS.outdoors.cloudy;
  } else {
    recommendations.outdoors = ['Walking', 'Light outdoor activities', 'Photography'];
  }
  
  //indoor recommendations
  if (hasHeatRisk) {
    recommendations.indoors = [...ACTIVITY_RECOMMENDATIONS.indoors.hot, ...ACTIVITY_RECOMMENDATIONS.indoors.general.slice(0, 3)];
  } else if (hasColdRisk) {
    recommendations.indoors = [...ACTIVITY_RECOMMENDATIONS.indoors.cold, ...ACTIVITY_RECOMMENDATIONS.indoors.general.slice(0, 3)];
  } else if (hasHeavyRain || hasThunderstorm) {
    recommendations.indoors = [...ACTIVITY_RECOMMENDATIONS.indoors.rainy, ...ACTIVITY_RECOMMENDATIONS.indoors.general.slice(0, 2)];
  } else {
    recommendations.indoors = ACTIVITY_RECOMMENDATIONS.indoors.general;
  }
  
  //activities to avoid
  if (hasHighUV) {
    recommendations.avoid.push(...ACTIVITY_RECOMMENDATIONS.avoid.high_uv);
  }
  if (hasHeatRisk) {
    recommendations.avoid.push(...ACTIVITY_RECOMMENDATIONS.avoid.heat_risk);
  }
  if (hasThunderstorm) {
    recommendations.avoid.push(...ACTIVITY_RECOMMENDATIONS.avoid.thunderstorm);
  }
  if (hasHeavyRain) {
    recommendations.avoid.push(...ACTIVITY_RECOMMENDATIONS.avoid.heavy_rain);
  }
  if (hasColdRisk) {
    recommendations.avoid.push(...ACTIVITY_RECOMMENDATIONS.avoid.extreme_cold);
  }
  if (hasHighWind) {
    recommendations.avoid.push(...ACTIVITY_RECOMMENDATIONS.avoid.high_wind);
  }
  
  
  recommendations.outdoors = recommendations.outdoors.slice(0, 5);
  recommendations.indoors = recommendations.indoors.slice(0, 5);
  recommendations.avoid = recommendations.avoid.slice(0, 4);
  
  recommendations.safety_note = generateSafetyNote(weather, risks, period);
  
  return recommendations;
}
function generateSafetyNote(weather, risks, period) {
  const notes = [];
  const riskTypes = risks.map(r => r.type);
  
  if (riskTypes.includes('HIGH_UV')) {
    const uvRisk = risks.find(r => r.type === 'HIGH_UV');
    if (uvRisk.level === 'EXTREME' || uvRisk.level === 'VERY_HIGH') {
      notes.push('Apply SPF 50+ sunscreen and wear protective clothing. Avoid direct sun exposure between 10 AM and 4 PM.');
    } else {
      notes.push('Apply sunscreen (SPF 30+) and wear a hat for outdoor activities.');
    }
  }
  
  if (riskTypes.includes('HEAT_RISK')) {
    notes.push('Stay hydrated by drinking water frequently. Take breaks in shaded or air-conditioned areas. Watch for signs of heat exhaustion.');
  }
  
  if (riskTypes.includes('THUNDERSTORM')) {
    notes.push('Stay indoors and avoid windows. Unplug electronic devices. Avoid water and metal objects.');
  }
  
  if (riskTypes.includes('HEAVY_RAIN') || riskTypes.includes('RAIN_RISK')) {
    notes.push('Carry an umbrella or raincoat. Avoid low-lying areas prone to flooding.');
  }
  
  if (riskTypes.includes('COLD_RISK')) {
    notes.push('Dress in layers and cover exposed skin. Limit time outdoors and stay dry.');
  }
  
  if (riskTypes.includes('HIGH_WIND')) {
    notes.push('Secure loose objects. Be cautious of falling branches. Avoid elevated areas.');
  }
  
  if (riskTypes.includes('POOR_AIR_QUALITY')) {
    notes.push('Consider wearing a mask outdoors. Limit strenuous outdoor exercise, especially if you have respiratory conditions.');
  }
  
  if (notes.length === 0) {
    notes.push('Weather conditions are favorable for most activities. Stay aware of any changes.');
  }
  
  return notes.join(' ');
}

function getActivitySuggestions(city, period = 'all-day') {
  const weatherSuggest = weatherData.getWeatherForActivities(city, period);
  
  if (!weatherSuggest) {
    return null;
  }
  
  const { current, forecast } = weatherSuggest;
  
  const risks = detectRisks(current);
  
  const weatherSummary = generateWeatherSummary(current, risks);
  
  const recommendations = generateRecommendations(current, risks, period);
  
  return {
    location: current.location,
    weather_summary: weatherSummary,
    current_conditions: {
      temperature_c: current.temperature_c,
      condition: current.condition,
      uv_index: current.uv_index,
      rain_probability: current.rain_probability
    },
    risks,
    recommendations,
    generated_at: new Date().toISOString()
  };
}

module.exports = {
  getActivitySuggestions,
  detectRisks,
  generateRecommendations,
  generateSafetyNote,
  generateWeatherSummary,
  RISK_THRESHOLDS
};