/**
 * Weather Service
 * Fetches real weather from Open-Meteo (free tier, no key required)
 * and determines if a vessel coordinate is undergoing adverse weather conditions.
 * Adverse weather causes +30% fuel consumption.
 */

// Key weather sample points across the Persian Gulf, Strait of Hormuz, and Gulf of Oman
const WEATHER_STATIONS = [
  { name: 'Persian Gulf North (Kuwait)', lat: 29.5, lng: 48.5 },
  { name: 'Persian Gulf Central (Bahrain/Qatar)', lat: 26.5, lng: 51.5 },
  { name: 'Strait of Hormuz (Chokepoint)', lat: 26.5, lng: 56.2 },
  { name: 'Gulf of Oman North (Sohar)', lat: 24.7, lng: 57.0 },
  { name: 'Gulf of Oman South (Muscat)', lat: 23.9, lng: 58.6 }
];

let weatherCache = {
  timestamp: 0,
  stations: []
};

// Simulated adverse weather storm cells that evolve over time if offline or for demonstration
let dynamicStormCells = [
  {
    id: 'storm-hormuz-1',
    name: 'Shamals High-Wind Gale',
    center: [26.4, 55.8],
    radiusKm: 75,
    severity: 'Severe Gale (Wind 38 kts, Swell 3.2m)',
    windSpeedKts: 38,
    waveHeightM: 3.2
  },
  {
    id: 'storm-oman-1',
    name: 'Gulf of Oman Squall Line',
    center: [24.4, 58.0],
    radiusKm: 60,
    severity: 'Squall / Heavy Seas (Wind 32 kts, Swell 2.8m)',
    windSpeedKts: 32,
    waveHeightM: 2.8
  }
];

export async function fetchRealWeather() {
  const now = Date.now();
  if (now - weatherCache.timestamp < 10 * 60 * 1000 && weatherCache.stations.length > 0) {
    return weatherCache;
  }

  try {
    const results = await Promise.allSettled(
      WEATHER_STATIONS.map(async station => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lng}&current_weather=true&hourly=wave_height&models=best_match`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
        const data = await res.json();
        const cur = data.current_weather || {};
        const windSpeedKts = (cur.windspeed || 15) * 0.539957; // km/h to knots
        const isAdverse = windSpeedKts > 24 || (cur.weathercode && cur.weathercode >= 60);

        return {
          ...station,
          windSpeedKts: Math.round(windSpeedKts),
          windDirection: cur.winddirection || 120,
          temperatureC: cur.temperature || 31,
          weatherCode: cur.weathercode || 1,
          isAdverse
        };
      })
    );

    const stations = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        ...WEATHER_STATIONS[i],
        windSpeedKts: 22,
        windDirection: 140,
        temperatureC: 32,
        weatherCode: 2,
        isAdverse: i === 2 // default strait station adverse
      };
    });

    weatherCache = { timestamp: now, stations };
  } catch (err) {
    console.warn('Weather API unreachable, using resilient synthetic weather telemetry:', err.message);
    weatherCache = {
      timestamp: now,
      stations: WEATHER_STATIONS.map((s, idx) => ({
        ...s,
        windSpeedKts: idx === 2 ? 34 : 18,
        windDirection: 135,
        temperatureC: 33,
        weatherCode: idx === 2 ? 65 : 1,
        isAdverse: idx === 2
      }))
    };
  }

  return weatherCache;
}

/**
 * Checks if a vessel at [lat, lng] is currently facing adverse weather.
 * Returns { isAdverse: boolean, penaltyMultiplier: number, condition: string, details: string }
 */
export function evaluateShipWeather(position, weatherData) {
  const [lat, lng] = position;

  // Check proximity to dynamic storm cells
  for (const storm of dynamicStormCells) {
    const dLat = (storm.center[0] - lat) * 111.0;
    const dLng = (storm.center[1] - lng) * 111.0 * Math.cos((lat * Math.PI) / 180);
    const distKm = Math.sqrt(dLat * dLat + dLng * dLng);

    if (distKm <= storm.radiusKm) {
      return {
        isAdverse: true,
        penaltyMultiplier: 1.30, // 30% extra fuel penalty
        condition: 'ADVERSE_WEATHER',
        details: `${storm.name} - ${storm.severity} (Dist to core: ${distKm.toFixed(1)} km)`,
        windSpeedKts: storm.windSpeedKts,
        waveHeightM: storm.waveHeightM
      };
    }
  }

  // Also check closest weather station if it reported adverse
  if (weatherData && weatherData.stations) {
    let closestStation = null;
    let minDist = Infinity;

    for (const station of weatherData.stations) {
      const dLat = (station.lat - lat) * 111.0;
      const dLng = (station.lng - lng) * 111.0 * Math.cos((lat * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDist) {
        minDist = dist;
        closestStation = station;
      }
    }

    if (closestStation && closestStation.isAdverse && minDist < 100) {
      return {
        isAdverse: true,
        penaltyMultiplier: 1.30, // 30% extra fuel penalty
        condition: 'ADVERSE_WEATHER',
        details: `Adverse conditions near ${closestStation.name} (Wind: ${closestStation.windSpeedKts} kts)`,
        windSpeedKts: closestStation.windSpeedKts,
        waveHeightM: 2.2
      };
    }
  }

  return {
    isAdverse: false,
    penaltyMultiplier: 1.0,
    condition: 'FAIR_WEATHER',
    details: 'Calm to moderate seas (Wind < 20 kts)',
    windSpeedKts: 14,
    waveHeightM: 0.8
  };
}

export function getActiveStormCells() {
  return dynamicStormCells;
}

export function updateStormCells(newCells) {
  dynamicStormCells = newCells;
}
