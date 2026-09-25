import { calculatePath, calculateBearing, calculatePathDistanceKm, isSegmentSafe } from './routing.js';
import { checkGeofenceBreaches, isPointInPolygon } from './geofence.js';
import { checkProximityWarnings, calculateDistanceKm } from './proximity.js';
import { evaluateShipWeather, fetchRealWeather } from './weather.js';
import { parseDistressMessage, generateFleetAdvisorRecommendations } from './aiService.js';
import { historyBuffer } from './historyBuffer.js';

export class FleetSimulator {
  constructor(initialData) {
    this.scenario = initialData.scenario;
    this.boundingBox = initialData.boundingBox;
    this.navigableWater = initialData.navigableWater;
    this.ports = initialData.ports;
    
    // Configurable time compression: default 12x so ships visibly move in real-time demos
    // (can also run at 1x real-time)
    this.timeScale = 12;
    this.tickRateHz = 1; // 1 Hz tick
    
    this.restrictedZones = [];
    this.activeAlerts = new Map(); // id -> alert
    this.acknowledgedAlertIds = new Set();
    this.pendingDirectives = new Map(); // shipId -> directive
    this.distressLogs = [];
    
    // Initialize 15 ships with computed paths to their destinations
    this.ships = initialData.fleet.map(s => {
      const port = this.ports.find(p => p.id === s.destination);
      const destPos = port ? port.position : s.position;
      const initialPath = calculatePath(s.position, destPos, this.navigableWater, []);

      return {
        ...s,
        currentPath: initialPath || [s.position, destPos],
        targetWaypointIndex: 1,
        activeDirective: null,
        pendingDirective: null,
        weatherCondition: 'FAIR_WEATHER',
        weatherDetails: 'Normal sea state',
        isAdverseWeather: false,
        fuelPenaltyActive: false,
        fuelBurnRatePerKm: 0.12, // tons per km base rate
        requiredFuelToPort: 0,
        distressInfo: null,
        lastBreachTime: 0
      };
    });

    this.latestWeather = null;
    this.timer = null;
    this.onTickCallbacks = [];
    this.currentAdvisory = []; // Store latest AI advisory for REST access
  }

  start() {
    if (this.timer) return;
    console.log('[Simulator] Starting 1 Hz simulation engine for 15 vessels...');
    
    // Initial weather fetch
    fetchRealWeather().then(w => { this.latestWeather = w; });
    setInterval(async () => {
      this.latestWeather = await fetchRealWeather();
    }, 60000);

    // 1 Hz simulation tick
    this.timer = setInterval(() => this.tick(), 1000 / this.tickRateHz);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onTick(callback) {
    this.onTickCallbacks.push(callback);
  }

  tick() {
    const tickDurationSec = 1 / this.tickRateHz;

    for (const ship of this.ships) {
      this.advanceShip(ship, tickDurationSec);
    }

    // 1. Check Geofence Breaches (< 1s requirement)
    const breaches = checkGeofenceBreaches(this.ships, this.restrictedZones);
    for (const breach of breaches) {
      if (!this.acknowledgedAlertIds.has(breach.id)) {
        this.activeAlerts.set(breach.id, breach);
        historyBuffer.logEvent(breach);
      }
    }

    // 2. Check 2 km Proximity Warnings
    const proximityWarnings = checkProximityWarnings(this.ships, 2.0);
    for (const prox of proximityWarnings) {
      if (!this.acknowledgedAlertIds.has(prox.id)) {
        this.activeAlerts.set(prox.id, prox);
      }
    }

    // Remove expired proximity warnings if ships separated
    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.type === 'PROXIMITY_WARNING') {
        const stillInProximity = proximityWarnings.some(p => p.id === id);
        if (!stillInProximity) {
          this.activeAlerts.delete(id);
        }
      }
    }

    // 3. Record snapshot for timeline replay
    const alertsArray = Array.from(this.activeAlerts.values());
    historyBuffer.recordTick(this.ships, alertsArray);

    // 4. Generate AI recommendations for Command
    const aiAdvisor = generateFleetAdvisorRecommendations(
      this.ships,
      this.restrictedZones,
      alertsArray,
      this.latestWeather
    );
    this.currentAdvisory = aiAdvisor; // Cache for REST access

    // 5. Broadcast to connected listeners
    const payload = {
      timestamp: Date.now(),
      ships: this.ships,
      restrictedZones: this.restrictedZones,
      alerts: alertsArray,
      aiAdvisor,
      timeScale: this.timeScale
    };

    for (const cb of this.onTickCallbacks) {
      cb(payload);
    }
  }

  advanceShip(ship, tickDurationSec) {
    // If stopped or arrived or completely out of fuel, skip motion
    if (ship.status === 'stopped' || ship.status === 'arrived') {
      return;
    }

    if (ship.fuel <= 0) {
      ship.fuel = 0;
      ship.speed = 0;
      ship.status = 'stopped';
      this.registerAlert({
        id: `fuel-empty-${ship.shipId}`,
        type: 'FUEL_EXHAUSTED',
        severity: 'CRITICAL',
        shipId: ship.shipId,
        message: `EMERGENCY: ${ship.name} has completely exhausted all fuel reserves. Dead in water.`
      });
      return;
    }

    // Check weather at current position
    const weatherEval = evaluateShipWeather(ship.position, this.latestWeather);
    ship.isAdverseWeather = weatherEval.isAdverse;
    ship.fuelPenaltyActive = weatherEval.isAdverse;
    ship.weatherCondition = weatherEval.condition;
    ship.weatherDetails = weatherEval.details;

    // Advance along current path waypoints
    if (ship.currentPath && ship.currentPath.length >= 2) {
      const targetWaypoint = ship.currentPath[ship.targetWaypointIndex] || ship.currentPath[ship.currentPath.length - 1];
      const distToWpKm = calculateDistanceKm(ship.position, targetWaypoint);

      // Bearing to next waypoint
      ship.heading = Math.round(calculateBearing(ship.position, targetWaypoint));

      // Distance covered in this tick:
      // (speed in knots * 1.852 km/nm) / 3600 sec * (tickDuration * timeScale)
      const distanceTraveledKm = (ship.speed * 1.852 / 3600) * (tickDurationSec * this.timeScale);

      // Fuel consumption: base rate * dist * (1.30 if adverse weather)
      const fuelMultiplier = weatherEval.penaltyMultiplier; // 1.30 if adverse
      const fuelBurned = distanceTraveledKm * ship.fuelBurnRatePerKm * fuelMultiplier;
      ship.fuel = Math.max(0, ship.fuel - fuelBurned);

      // Check if reached destination port
      const port = this.ports.find(p => p.id === ship.destination);
      const distToPort = port ? calculateDistanceKm(ship.position, port.position) : distToWpKm;
      
      // Calculate remaining fuel feasibility
      const remainingPathDistance = calculatePathDistanceKm(
        [ship.position, ...ship.currentPath.slice(ship.targetWaypointIndex)]
      );
      const estFuelNeeded = remainingPathDistance * ship.fuelBurnRatePerKm * (ship.isAdverseWeather ? 1.3 : 1.0);
      ship.requiredFuelToPort = Math.round(estFuelNeeded);

      if (ship.fuel < estFuelNeeded && ship.status !== 'insufficient_fuel' && ship.status !== 'stranded') {
        ship.status = 'insufficient_fuel';
        this.registerAlert({
          id: `fuel-warning-${ship.shipId}`,
          type: 'INSUFFICIENT_FUEL',
          severity: 'HIGH',
          shipId: ship.shipId,
          message: `FUEL WARNING: ${ship.name} has ${Math.round(ship.fuel)}t fuel, but needs estimated ${Math.round(estFuelNeeded)}t to reach ${ship.destination}.`
        });
      }

      if (distToPort <= 2.5) {
        // Arrived at destination port!
        ship.position = [...(port ? port.position : targetWaypoint)];
        ship.status = 'arrived';
        ship.speed = 0;
        return;
      }

      // If arrived at intermediate waypoint, advance to next
      if (distToWpKm <= Math.max(1.0, distanceTraveledKm * 1.2)) {
        if (ship.targetWaypointIndex < ship.currentPath.length - 1) {
          ship.targetWaypointIndex++;
        }
      } else {
        // Step forward towards targetWaypoint
        const frac = Math.min(1.0, distanceTraveledKm / Math.max(0.001, distToWpKm));
        ship.position = [
          ship.position[0] + (targetWaypoint[0] - ship.position[0]) * frac,
          ship.position[1] + (targetWaypoint[1] - ship.position[1]) * frac
        ];
      }
    }

    // Check if inside a restricted zone -> attempt reroute out
    for (const zone of this.restrictedZones) {
      if (isPointInPolygon(ship.position, zone.polygon)) {
        if (Date.now() - ship.lastBreachTime > 5000) {
          ship.lastBreachTime = Date.now();
          this.recomputeShipRoute(ship, `Inside restricted zone ${zone.name}`);
        }
      }
    }
  }

  /**
   * Recomputes path for a ship avoiding all restricted zones
   */
  recomputeShipRoute(ship, reason = 'Obstacle on course') {
    const port = this.ports.find(p => p.id === ship.destination);
    const targetPos = port ? port.position : ship.position;

    const newPath = calculatePath(ship.position, targetPos, this.navigableWater, this.restrictedZones);

    if (!newPath) {
      ship.status = 'stranded';
      this.registerAlert({
        id: `stranded-${ship.shipId}`,
        type: 'VESSEL_STRANDED',
        severity: 'CRITICAL',
        shipId: ship.shipId,
        message: `NAVIGATION FAILURE: ${ship.name} is STRANDED! No safe navigable channel to ${ship.destination} due to restricted zones.`
      });
      return false;
    }

    ship.currentPath = newPath;
    ship.targetWaypointIndex = 1;
    if (ship.status !== 'distressed') {
      ship.status = 'rerouting';
      // Reset back to normal after route adoption
      setTimeout(() => {
        if (ship.status === 'rerouting') ship.status = 'normal';
      }, 3000);
    }

    historyBuffer.logEvent({
      type: 'ROUTE_RECALCULATED',
      shipId: ship.shipId,
      shipName: ship.name,
      reason,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Add a restricted zone drawn by Command operator
   */
  addRestrictedZone(zone) {
    const newZone = {
      id: zone.id || `zone-${Date.now()}`,
      name: zone.name || `Restricted Sector ${this.restrictedZones.length + 1}`,
      polygon: zone.polygon,
      createdAt: Date.now(),
      threatLevel: zone.threatLevel || 'RED_ZONE'
    };

    this.restrictedZones.push(newZone);
    historyBuffer.logEvent({
      type: 'RESTRICTED_ZONE_ESTABLISHED',
      zoneId: newZone.id,
      name: newZone.name,
      timestamp: Date.now()
    });

    // Re-evaluate routes for all ships: if newly drawn zone intersects path, trigger reroute
    for (const ship of this.ships) {
      if (ship.status === 'arrived' || ship.status === 'stopped') continue;

      const remainingPath = [ship.position, ...ship.currentPath.slice(ship.targetWaypointIndex)];
      // Check if new zone intersects path
      let intersects = false;
      for (let i = 0; i < remainingPath.length - 1; i++) {
        if (!isSegmentSafe(remainingPath[i], remainingPath[i + 1], this.navigableWater, [newZone])) {
          intersects = true;
          break;
        }
      }

      if (intersects || isPointInPolygon(ship.position, newZone.polygon)) {
        console.log(`[Simulator] Zone ${newZone.name} intersects path of ${ship.name}. Rerouting...`);
        this.recomputeShipRoute(ship, `Zone ${newZone.name} obstruction`);
      }
    }

    return newZone;
  }

  /**
   * Remove a restricted zone
   */
  removeRestrictedZone(zoneId) {
    this.restrictedZones = this.restrictedZones.filter(z => z.id !== zoneId);
    // Dismiss breach alerts for this zone
    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.zoneId === zoneId) {
        this.activeAlerts.delete(id);
      }
    }
  }

  /**
   * Command issues a directive to a ship
   */
  issueDirective(shipId, directive) {
    const ship = this.ships.find(s => s.shipId === shipId);
    if (!ship) throw new Error(`Ship ${shipId} not found`);

    const directiveObj = {
      id: `dir-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      shipId,
      type: directive.type, // 'REROUTE_PORT', 'DIVERT_WAYPOINT', 'HOLD_POSITION'
      targetPortId: directive.targetPortId,
      waypoint: directive.waypoint,
      speedKnots: directive.speedKnots,
      issuedAt: Date.now(),
      status: 'PENDING_CAPTAIN_APPROVAL',
      notes: directive.notes || ''
    };

    ship.pendingDirective = directiveObj;
    this.pendingDirectives.set(shipId, directiveObj);

    historyBuffer.logEvent({
      type: 'DIRECTIVE_ISSUED',
      shipId,
      shipName: ship.name,
      directive: directiveObj,
      timestamp: Date.now()
    });

    return directiveObj;
  }

  /**
   * Captain responds to pending directive: ACCEPT or ESCALATE_DISTRESS
   */
  async captainResponse(shipId, action, payload = {}) {
    const ship = this.ships.find(s => s.shipId === shipId);
    if (!ship) throw new Error(`Ship ${shipId} not found`);

    const directive = ship.pendingDirective;

    // Support both action name conventions
    if (action === 'ACKNOWLEDGE') action = 'ACCEPT';
    if (action === 'OVERRIDE') action = 'ESCALATE_DISTRESS';

    if (action === 'ACCEPT') {
      if (directive) {
        directive.status = 'ACCEPTED';
        ship.activeDirective = directive;
        ship.pendingDirective = null;
        this.pendingDirectives.delete(shipId);

        // Apply directive changes on next tick
        if (directive.type === 'HOLD_POSITION') {
          ship.status = 'stopped';
          ship.speed = 0;
        } else if (directive.type === 'REROUTE_PORT' && directive.targetPortId) {
          ship.destination = directive.targetPortId;
          this.recomputeShipRoute(ship, `Captain accepted diversion to ${directive.targetPortId}`);
        } else if (directive.type === 'DIVERT_WAYPOINT' && directive.waypoint) {
          const pathToWp = calculatePath(ship.position, directive.waypoint, this.navigableWater, this.restrictedZones);
          if (pathToWp) {
            ship.currentPath = pathToWp;
            ship.targetWaypointIndex = 1;
            ship.status = 'rerouting';
          }
        }
        if (directive.speedKnots) {
          ship.speed = directive.speedKnots;
        }
      }

      historyBuffer.logEvent({
        type: 'DIRECTIVE_ACCEPTED',
        shipId,
        shipName: ship.name,
        timestamp: Date.now()
      });

      return { success: true, action: 'ACCEPTED' };
    } else if (action === 'ESCALATE_DISTRESS') {
      // Captain refuses / reports critical distress
      if (directive) {
        directive.status = 'REJECTED_DISTRESS';
        ship.pendingDirective = null;
        this.pendingDirectives.delete(shipId);
      }

      ship.status = 'distressed';
      const distressText = payload.messageText || 'Emergency situation on board. Unable to execute directive.';
      ship.distressReason = distressText;

      // AI/NLP structured analysis
      const aiAnalysis = await parseDistressMessage(distressText, ship);
      ship.distressInfo = aiAnalysis;

      const distressAlert = {
        id: `distress-${ship.shipId}-${Date.now()}`,
        type: 'MAYDAY_DISTRESS',
        severity: aiAnalysis.severity || 'CRITICAL',
        shipId: ship.shipId,
        shipName: ship.name,
        rawMessage: distressText,
        aiAnalysis,
        timestamp: Date.now(),
        message: `MAYDAY / SOS: ${ship.name} escalated distress! Incident: ${aiAnalysis.incidentType} (${aiAnalysis.severity})`
      };

      this.registerAlert(distressAlert);
      this.distressLogs.unshift(distressAlert);

      historyBuffer.logEvent(distressAlert);

      return { success: true, action: 'ESCALATED', distressAlert };
    }
  }

  registerAlert(alert) {
    this.activeAlerts.set(alert.id, {
      ...alert,
      timestamp: alert.timestamp || Date.now()
    });
  }

  acknowledgeAlert(alertId) {
    this.acknowledgedAlertIds.add(alertId);
    this.activeAlerts.delete(alertId);
  }

  setTimeScale(scale) {
    this.timeScale = Math.max(1, Math.min(60, scale));
  }

  /**
   * Mark a ship as distressed (called from REST /api/distress)
   */
  setShipDistress(shipId, message, aiAnalysis) {
    const ship = this.ships.find(s => s.shipId === shipId);
    if (!ship) return;
    ship.status = 'distressed';
    ship.distressReason = message;
    ship.distressInfo = aiAnalysis;

    // If propulsion is lost, stop the ship
    if (aiAnalysis?.quantifiableImpact?.propulsionLost) {
      ship.speed = 0;
    }

    historyBuffer.logEvent({
      type: 'CAPTAIN_DISTRESS_CALL',
      shipId,
      shipName: ship.name,
      incidentType: aiAnalysis?.incidentType,
      severity: aiAnalysis?.severity,
      timestamp: Date.now()
    });
  }
}
