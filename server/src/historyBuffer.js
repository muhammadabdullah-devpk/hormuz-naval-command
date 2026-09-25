/**
 * History Buffer for Fleet Playback & Timeline Scrubber
 * Maintains 1 hour of fleet telemetry snapshots and critical event logs.
 */

const MAX_SNAPSHOTS = 120; // At 30s intervals = 1 hour, or higher resolution
const SNAPSHOT_INTERVAL_MS = 5000; // Save snapshot every 5 seconds for smooth playback

export class HistoryBuffer {
  constructor(maxSnapshots = 200) {
    this.maxSnapshots = maxSnapshots;
    this.snapshots = [];
    this.events = [];
    this.lastSavedTime = 0;
  }

  /**
   * Records a snapshot if interval has elapsed
   */
  recordTick(fleetState, alerts = []) {
    const now = Date.now();
    if (now - this.lastSavedTime < SNAPSHOT_INTERVAL_MS) {
      return;
    }
    this.lastSavedTime = now;

    const snapshot = {
      timestamp: now,
      ships: fleetState.map(s => ({
        shipId: s.shipId,
        name: s.name,
        position: [...s.position],
        speed: s.speed,
        heading: s.heading,
        fuel: Math.round(s.fuel),
        status: s.status,
        destination: s.destination,
        isAdverseWeather: s.isAdverseWeather
      })),
      activeAlertsCount: alerts.length
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * Records a major operational event (Breach, Distress, Directive, Reroute)
   */
  logEvent(event) {
    this.events.push({
      ...event,
      timestamp: event.timestamp || Date.now()
    });
    if (this.events.length > 300) {
      this.events.shift();
    }
  }

  /**
   * Retrieves timeline range and all snapshots
   */
  getTimeline() {
    return {
      startTime: this.snapshots.length > 0 ? this.snapshots[0].timestamp : Date.now(),
      endTime: this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1].timestamp : Date.now(),
      count: this.snapshots.length,
      snapshots: this.snapshots,
      events: this.events
    };
  }

  /**
   * Gets closest snapshot to a specific timestamp
   */
  getSnapshotAtTime(targetTime) {
    if (this.snapshots.length === 0) return null;

    let closest = this.snapshots[0];
    let minDiff = Math.abs(targetTime - closest.timestamp);

    for (const snap of this.snapshots) {
      const diff = Math.abs(targetTime - snap.timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = snap;
      }
    }

    return closest;
  }
}

export const historyBuffer = new HistoryBuffer();
