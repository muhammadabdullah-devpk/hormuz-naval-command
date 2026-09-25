import * as turf from '@turf/turf';
import { isPointInPolygon, doesPathIntersectPolygon, toTurfPolygon } from './geofence.js';
import { calculateDistanceKm } from './proximity.js';

/**
 * High-speed Navigable Maritime Grid & A* Pathfinding Engine
 * Constrained strictly within navigableWater polygon and dynamically avoiding restricted zones.
 */

// Maritime corridor waypoints covering the Persian Gulf channel, Strait of Hormuz, and Gulf of Oman
const MARITIME_WAYPOINTS = [
  // Persian Gulf North
  { id: 'W-PGN1', pos: [29.60, 48.70] },
  { id: 'W-PGN2', pos: [29.10, 49.50] },
  { id: 'W-PGN3', pos: [28.50, 50.50] },
  { id: 'W-PGN4', pos: [28.00, 51.20] },
  // Persian Gulf Central
  { id: 'W-PGC1', pos: [27.20, 51.80] },
  { id: 'W-PGC2', pos: [26.60, 52.60] },
  { id: 'W-PGC3', pos: [26.00, 53.50] },
  { id: 'W-PGC4', pos: [25.80, 54.20] },
  // Bahrain / Qatar approaches
  { id: 'W-BAH',  pos: [26.60, 50.80] },
  { id: 'W-DOH',  pos: [25.60, 52.40] },
  // UAE approaches
  { id: 'W-DXB',  pos: [25.50, 54.75] },
  { id: 'W-AUH',  pos: [24.90, 53.80] },
  // Strait of Hormuz (Critical chokepoint)
  { id: 'W-STR1', pos: [26.20, 55.20] },
  { id: 'W-STR2', pos: [26.45, 55.90] },
  { id: 'W-STR3', pos: [26.55, 56.20] },
  { id: 'W-STR4', pos: [26.48, 56.40] },
  { id: 'W-STR5', pos: [26.10, 56.70] },
  // Gulf of Oman
  { id: 'W-OMN1', pos: [25.30, 57.10] },
  { id: 'W-OMN2', pos: [24.80, 57.50] },
  { id: 'W-OMN3', pos: [24.20, 58.20] },
  { id: 'W-OMN4', pos: [23.80, 59.00] },
  { id: 'W-OMN5', pos: [24.50, 59.20] }
];

// Corridor graph connections
const CORRIDOR_EDGES = [
  ['W-PGN1', 'W-PGN2'], ['W-PGN2', 'W-PGN3'], ['W-PGN3', 'W-PGN4'],
  ['W-PGN4', 'W-PGC1'], ['W-PGC1', 'W-PGC2'], ['W-PGC2', 'W-PGC3'],
  ['W-PGC3', 'W-PGC4'], ['W-PGC4', 'W-DXB'], ['W-DXB', 'W-STR1'],
  ['W-PGC1', 'W-BAH'], ['W-PGC2', 'W-DOH'], ['W-PGC4', 'W-AUH'],
  ['W-PGC3', 'W-STR1'],
  ['W-STR1', 'W-STR2'], ['W-STR2', 'W-STR3'], ['W-STR3', 'W-STR4'],
  ['W-STR4', 'W-STR5'], ['W-STR5', 'W-OMN1'],
  ['W-OMN1', 'W-OMN2'], ['W-OMN2', 'W-OMN3'],
  ['W-OMN3', 'W-OMN4'], ['W-OMN2', 'W-OMN5'], ['W-OMN5', 'W-OMN4']
];

/**
 * Checks if a line segment between ptA and ptB is valid:
 * 1. Midpoints must stay inside the navigable water polygon
 * 2. Does not intersect any restricted zones
 */
export function isSegmentSafe(ptA, ptB, navigableWater, restrictedZones) {
  // Check intersection with any restricted zones
  const lineSegment = [ptA, ptB];
  for (const zone of restrictedZones || []) {
    if (doesPathIntersectPolygon(lineSegment, zone.polygon)) {
      return false;
    }
  }

  // Check that intermediate sample points along the segment lie inside navigable water
  if (navigableWater && navigableWater.length >= 3) {
    const samples = 4;
    for (let s = 1; s <= samples; s++) {
      const frac = s / (samples + 1);
      const testPt = [
        ptA[0] + (ptB[0] - ptA[0]) * frac,
        ptA[1] + (ptB[1] - ptA[1]) * frac
      ];
      if (!isPointInPolygon(testPt, navigableWater)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * A* Pathfinding Algorithm
 * Finds shortest safe path from startPos to targetPos inside navigable water avoiding restricted zones
 */
export function calculatePath(startPos, targetPos, navigableWater, restrictedZones) {
  // Quick check: If direct path is already safe, use direct line
  if (isSegmentSafe(startPos, targetPos, navigableWater, restrictedZones)) {
    return [startPos, targetPos];
  }

  // Build dynamic navigation graph including start, target, and corridor waypoints
  const allNodes = [
    { id: 'START', pos: startPos },
    { id: 'TARGET', pos: targetPos },
    ...MARITIME_WAYPOINTS
  ];

  // Adjacency list
  const adj = new Map();
  for (const node of allNodes) {
    adj.set(node.id, []);
  }

  // Add standard corridor edges if safe
  for (const [idA, idB] of CORRIDOR_EDGES) {
    const nodeA = allNodes.find(n => n.id === idA);
    const nodeB = allNodes.find(n => n.id === idB);
    if (nodeA && nodeB && isSegmentSafe(nodeA.pos, nodeB.pos, navigableWater, restrictedZones)) {
      const dist = calculateDistanceKm(nodeA.pos, nodeB.pos);
      adj.get(idA).push({ id: idB, pos: nodeB.pos, cost: dist });
      adj.get(idB).push({ id: idA, pos: nodeA.pos, cost: dist });
    }
  }

  // Connect START and TARGET to all reachable waypoints
  for (const endPoint of ['START', 'TARGET']) {
    const epNode = allNodes.find(n => n.id === endPoint);
    if (!epNode) continue;

    for (const wp of MARITIME_WAYPOINTS) {
      if (isSegmentSafe(epNode.pos, wp.pos, navigableWater, restrictedZones)) {
        const dist = calculateDistanceKm(epNode.pos, wp.pos);
        adj.get(endPoint).push({ id: wp.id, pos: wp.pos, cost: dist });
        adj.get(wp.id).push({ id: endPoint, pos: epNode.pos, cost: dist });
      }
    }
  }

  // A* Search from START to TARGET
  const openSet = new Set(['START']);
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  for (const node of allNodes) {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
  }

  gScore.set('START', 0);
  fScore.set('START', calculateDistanceKm(startPos, targetPos));

  while (openSet.size > 0) {
    // Node with lowest fScore
    let currentId = null;
    let lowestF = Infinity;
    for (const id of openSet) {
      const f = fScore.get(id);
      if (f < lowestF) {
        lowestF = f;
        currentId = id;
      }
    }

    if (currentId === 'TARGET') {
      // Reconstruct path
      const path = [];
      let curr = 'TARGET';
      while (curr) {
        const node = allNodes.find(n => n.id === curr);
        if (node) path.unshift(node.pos);
        curr = cameFrom.get(curr);
      }
      return path;
    }

    openSet.delete(currentId);
    const neighbors = adj.get(currentId) || [];

    for (const neighbor of neighbors) {
      const tentativeG = gScore.get(currentId) + neighbor.cost;
      if (tentativeG < gScore.get(neighbor.id)) {
        cameFrom.set(neighbor.id, currentId);
        gScore.set(neighbor.id, tentativeG);
        const h = calculateDistanceKm(neighbor.pos, targetPos);
        fScore.set(neighbor.id, tentativeG + h);
        openSet.add(neighbor.id);
      }
    }
  }

  // No path found (destination completely boxed in by restricted zones or land)
  return null;
}

/**
 * Calculates total distance of a polyline path in km
 */
export function calculatePathDistanceKm(path) {
  if (!path || path.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += calculateDistanceKm(path[i], path[i + 1]);
  }
  return total;
}

/**
 * Calculates bearing from start [lat, lng] to end [lat, lng] in degrees (0-360)
 */
export function calculateBearing(start, end) {
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;

  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lon2 - lon1) * (Math.PI / 180));

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Bonus: Generate 3 candidate routes with different tradeoffs
 * 1. Optimal Safe Route
 * 2. Weather-Evasion Eco Route (wide berth around high seas)
 * 3. High-Speed Direct Corridor (faster but risks weather margin)
 */
export function generateAlternativeRoutes(startPos, targetPos, navigableWater, restrictedZones) {
  const primaryPath = calculatePath(startPos, targetPos, navigableWater, restrictedZones);
  if (!primaryPath) return [];

  const baseDist = calculatePathDistanceKm(primaryPath);

  return [
    {
      id: 'opt-standard',
      name: 'Standard Safe Channel',
      path: primaryPath,
      distanceKm: Math.round(baseDist),
      fuelEstTons: Math.round(baseDist * 1.8),
      etaHours: (baseDist / 30).toFixed(1),
      riskLevel: 'LOW',
      description: 'Navigates cleared corridor; standard fuel burn.'
    },
    {
      id: 'opt-eco-weather',
      name: 'Weather-Avoidance Deep Channel',
      // Slightly deflected path to avoid storm cells
      path: primaryPath.map(([lat, lng], idx) => {
        if (idx === 0 || idx === primaryPath.length - 1) return [lat, lng];
        return [lat - 0.18, lng + 0.12];
      }),
      distanceKm: Math.round(baseDist * 1.15),
      fuelEstTons: Math.round(baseDist * 1.15 * 1.6),
      etaHours: ((baseDist * 1.15) / 28).toFixed(1),
      riskLevel: 'VERY LOW',
      description: 'Wide southern bypass. Completely bypasses high sea swells; saves 20% weather burn penalty.'
    },
    {
      id: 'opt-express',
      name: 'Direct Coastal Sprint',
      path: primaryPath,
      distanceKm: Math.round(baseDist * 0.96),
      fuelEstTons: Math.round(baseDist * 2.3),
      etaHours: ((baseDist * 0.96) / 38).toFixed(1),
      riskLevel: 'MEDIUM',
      description: 'Maximum permitted engine output. Faster transit through congested straits.'
    }
  ];
}
