/**
 * Proximity Detection Module
 * Calculates pairwise distances between ships and flags when any 2 ships get within 2 km.
 */

const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates distance in kilometers between two [lat, lng] points using Haversine formula
 */
export function calculateDistanceKm(coord1, coord2) {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Checks all unique pairs of ships for proximity (< 2 km)
 * Returns array of proximity alert objects
 */
export function checkProximityWarnings(ships, thresholdKm = 2.0) {
  const warnings = [];

  for (let i = 0; i < ships.length; i++) {
    for (let j = i + 1; j < ships.length; j++) {
      const shipA = ships[i];
      const shipB = ships[j];

      // Skip ships that are already at port or stopped if needed, but spec says "any two ships"
      const distKm = calculateDistanceKm(shipA.position, shipB.position);

      if (distKm <= thresholdKm) {
        warnings.push({
          id: `prox-${shipA.shipId}-${shipB.shipId}`,
          shipA: { id: shipA.shipId, name: shipA.name, position: shipA.position, speed: shipA.speed },
          shipB: { id: shipB.shipId, name: shipB.name, position: shipB.position, speed: shipB.speed },
          distanceKm: parseFloat(distKm.toFixed(2)),
          timestamp: Date.now(),
          type: 'PROXIMITY_WARNING',
          severity: distKm < 1.0 ? 'CRITICAL' : 'HIGH',
          message: `COLLISION RISK: ${shipA.name} and ${shipB.name} are ${distKm.toFixed(2)} km apart (< ${thresholdKm} km threshold)`
        });
      }
    }
  }

  return warnings;
}
