import { KERALA_CITIES } from '../data/keralaCitiesData';
import { Geolocation } from '@capacitor/geolocation';

/** Haversine distance in km */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns the KERALA_CITIES key of the city whose hub is closest to (lat, lon).
 */
export function nearestCityKey(lat, lon) {
  let best = null;
  let bestDist = Infinity;
  for (const [key, city] of Object.entries(KERALA_CITIES)) {
    const hub = city.hub;
    if (!hub?.lat || !hub?.lng) continue;
    const d = haversine(lat, lon, hub.lat, hub.lng);
    if (d < bestDist) {
      bestDist = d;
      best = key;
    }
  }
  return best;
}

/**
 * Acquires GPS position using native Capacitor Geolocation (which triggers
 * the official Android OS "Allow Location Permission" dialog) with fallback
 * to HTML5 navigator.geolocation for browser mode.
 */
export async function acquireGPS({ onSuccess, onError }) {
  let resolved = false;

  // 0. Instant Cache Hydration: if we have a recent GPS position (< 10 mins), resolve immediately
  try {
    const cached = JSON.parse(localStorage.getItem('spot_undoo_cached_gps') || 'null');
    if (cached && cached.lat && cached.lon && (Date.now() - (cached.time || 0) < 600000)) {
      onSuccess?.(cached);
    }
  } catch {}

  const resolve = (lat, lon, label) => {
    if (resolved) return;
    resolved = true;
    const cityKey = nearestCityKey(lat, lon);
    const city = KERALA_CITIES[cityKey];
    const finalLabel = label || (city ? `Near ${city.name}` : 'Live GPS');
    const result = { lat, lon, label: finalLabel, cityKey };
    try {
      localStorage.setItem('spot_undoo_cached_gps', JSON.stringify({ ...result, time: Date.now() }));
    } catch {}
    onSuccess?.(result);
  };

  // 1. Try Native Capacitor Geolocation first (fast 3.5s timeout, allow cached location)
  try {
    const permStatus = await Geolocation.checkPermissions();
    if (permStatus.location !== 'granted') {
      const requested = await Geolocation.requestPermissions();
      if (requested.location !== 'granted') {
        console.warn('Native GPS permission not granted');
      }
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 3500,
      maximumAge: 30000,
    });

    if (pos && pos.coords) {
      resolve(pos.coords.latitude, pos.coords.longitude);
      return;
    }
  } catch (nativeErr) {
    console.warn('Native Capacitor Geolocation fallback to web API:', nativeErr);
  }

  // 2. Web fallback (for browser testing)
  if (!navigator.geolocation) {
    onError?.('Geolocation not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => resolve(pos.coords.latitude, pos.coords.longitude, 'Browser GPS'),
    () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords.latitude, pos.coords.longitude, 'Cached GPS'),
        (err) => onError?.(err.message || 'GPS denied'),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    },
    { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
  );
}
