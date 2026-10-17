import { KERALA_CITIES } from '../data/keralaCitiesData';

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
 * Acquires GPS position as fast as possible.
 * Strategy:
 *  1. Try IP-based location first (instant, no permission needed) as a warm-up.
 *  2. Fire high-accuracy GPS immediately with a short timeout.
 *  3. If high-accuracy times out, fall back to low-accuracy (cached).
 * Calls onSuccess({ lat, lon, label, cityKey }) whenever a fix is obtained.
 * Calls onError(msg) if everything fails.
 */
export function acquireGPS({ onSuccess, onError }) {
  if (!navigator.geolocation) {
    onError?.('Geolocation not supported');
    return;
  }

  let resolved = false;

  const resolve = (lat, lon, label) => {
    if (resolved) return;
    resolved = true;
    const cityKey = nearestCityKey(lat, lon);
    const city = KERALA_CITIES[cityKey];
    const finalLabel = label || (city ? `Near ${city.name}` : 'Live GPS');
    onSuccess?.({ lat, lon, label: finalLabel, cityKey });
  };

  // 1. High-accuracy with a 5-second timeout
  navigator.geolocation.getCurrentPosition(
    (pos) => resolve(pos.coords.latitude, pos.coords.longitude, 'GPS (High Accuracy)'),
    () => {
      // 2. Fallback: low-accuracy / cached fix (faster on mobile)
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords.latitude, pos.coords.longitude, 'GPS (Cached)'),
        (err) => onError?.(err.message || 'GPS denied'),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
  );
}
