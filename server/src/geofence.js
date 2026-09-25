import * as turf from '@turf/turf';

/**
 * Normalizes [lat, lng] to GeoJSON [lng, lat]
 */
export function toGeoJsonCoord(coord) {
  return [coord[1], coord[0]];
}

/**
 * Converts a polygon in [[lat, lng], ...] format to a Turf.js GeoJSON Polygon
 */
export function toTurfPolygon(polygonCoords) {
  const ring = polygonCoords.map(c => [c[1], c[0]]);
  // Ensure closed ring
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push([...ring[0]]);
  }
  return turf.polygon([ring]);
}

/**
 * Checks if a point [lat, lng] is inside a polygon [[lat, lng], ...]
 */
export function isPointInPolygon(point, polygonCoords) {
  if (!polygonCoords || polygonCoords.length < 3) return false;
  try {
    const pt = turf.point([point[1], point[0]]);
    const poly = toTurfPolygon(polygonCoords);
    return turf.booleanPointInPolygon(pt, poly);
  } catch (err) {
    console.error('Error in isPointInPolygon:', err);
    return false;
  }
}

/**
 * Checks if a line path [[lat, lng], ...] intersects a polygon [[lat, lng], ...]
 */
export function doesPathIntersectPolygon(pathCoords, polygonCoords) {
  if (!pathCoords || pathCoords.length < 2 || !polygonCoords || polygonCoords.length < 3) return false;
  try {
    const line = turf.lineString(pathCoords.map(c => [c[1], c[0]]));
    const poly = toTurfPolygon(polygonCoords);
    return turf.booleanIntersects(line, poly);
  } catch (err) {
    console.error('Error in doesPathIntersectPolygon:', err);
    return false;
  }
}

/**
 * Checks all ships against all active restricted zones
 * Returns array of breach events: { shipId, shipName, zoneId, zoneName, timestamp }
 */
export function checkGeofenceBreaches(ships, restrictedZones) {
  const breaches = [];
  if (!restrictedZones || restrictedZones.length === 0) return breaches;

  for (const ship of ships) {
    for (const zone of restrictedZones) {
      if (isPointInPolygon(ship.position, zone.polygon)) {
        breaches.push({
          id: `breach-${ship.shipId}-${zone.id}`,
          shipId: ship.shipId,
          shipName: ship.name,
          zoneId: zone.id,
          zoneName: zone.name || 'Restricted Zone',
          timestamp: Date.now(),
          type: 'GEOFENCE_BREACH',
          severity: 'CRITICAL',
          message: `SECURITY ALERT: ${ship.name} (${ship.shipId}) breached restricted zone "${zone.name || zone.id}" at [${ship.position[0].toFixed(3)}, ${ship.position[1].toFixed(3)}]`
        });
      }
    }
  }
  return breaches;
}
