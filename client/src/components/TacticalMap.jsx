import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { ShieldAlert, X, Layers, Navigation2, AlertTriangle, Globe, Waves, Map as MapIcon, Moon, PenTool, Check, Trash2, CloudRain } from 'lucide-react';

/**
 * TacticalMap — Premium 60 FPS Interactive Naval Operations Map
 *
 * Features:
 * - Dead-reckoning interpolation at 60 FPS (no teleporting)
 * - Ship route path visualization
 * - Animated ship markers with heading arrows + status rings
 * - Command-only zone drawing (polygons)
 * - Adverse weather storm cell overlays
 * - Port markers with docking indicators
 * - Navigable water corridor display
 * - Real-time proximity warning halos
 */
export function TacticalMap({
  fleetState, selectedShip, onSelectShip,
  role, onDrawZone, onDeleteZone, isPlayingHistory,
  uiTheme = 'light',
  selectedPort, onSelectPort,
  isMeasuring = false, onMeasurePointAdded, measurePoints = [],
  activeCategory = 'all'
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const shipMarkersRef = useRef(new Map());
  const shipPathsRef = useRef(new Map());
  const targetPositionsRef = useRef(new Map());
  const currentPositionsRef = useRef(new Map());
  const zoneLayersRef = useRef(new Map());
  const stormLayersRef = useRef([]);
  const animFrameRef = useRef(null);
  const fleetStateRef = useRef(fleetState);
  const selectedShipRef = useRef(selectedShip);

  // Measure and Port refs
  const isMeasuringRef = useRef(isMeasuring);
  isMeasuringRef.current = isMeasuring;
  const onMeasurePointRef = useRef(onMeasurePointAdded);
  onMeasurePointRef.current = onMeasurePointAdded;
  const onSelectPortRef = useRef(onSelectPort);
  onSelectPortRef.current = onSelectPort;

  // Zone drawing state
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);
  const tempDrawLayerRef = useRef(null);
  const isDrawingRef = useRef(false);
  isDrawingRef.current = isDrawingZone;

  // Map theme state: 'realmap' (Real World Satellite), 'marine' (MarineTraffic), 'standard' (OpenStreetMap), 'dark' (Tactical)
  const [mapTheme, setMapTheme] = useState('realmap');
  const tileLayersRef = useRef([]);

  // Keep refs updated
  fleetStateRef.current = fleetState;
  selectedShipRef.current = selectedShip;

  // ── Initialize Leaflet Map ─────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [26.0, 54.5],
      zoom: 7,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    // Custom zoom control position
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Custom attribution
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('<span style="color:#64748b;font-size:9px;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> REAL WORLD MARITIME & SATELLITE MAP</span>')
      .addTo(map);

    mapRef.current = map;

    // Zone drawing and Distance measuring click handler
    map.on('click', (e) => {
      const newPt = [
        parseFloat(e.latlng.lat.toFixed(4)),
        parseFloat(e.latlng.lng.toFixed(4))
      ];
      if (isDrawingRef.current) {
        setDrawnPoints(prev => [...prev, newPt]);
        return;
      }
      if (isMeasuringRef.current && onMeasurePointRef.current) {
        onMeasurePointRef.current(newPt);
        return;
      }
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Dynamically Update Map Tile Layers (CartoDB Voyager vs Dark vs Standard) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing tile layers
    tileLayersRef.current.forEach(layer => {
      try { map.removeLayer(layer); } catch (e) {}
    });
    tileLayersRef.current = [];

    const newLayers = [];
    if (mapTheme === 'realmap' || mapTheme === 'satellite') {
      // Real-World Satellite Earth & Oceans (Google Hybrid Satellite + Geographic Data)
      const base = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Earth Satellite Imagery & GIS',
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20
      });
      base.addTo(map);
      newLayers.push(base);
    } else if (mapTheme === 'marine') {
      // High-Visibility Clean Marine Navigation Chart (No API Key Required)
      const base = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '&copy; Maritime Navigation Map',
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20
      });
      base.addTo(map);
      newLayers.push(base);
    } else if (mapTheme === 'dark') {
      // Satellite Ocean & Deep Sea Night Canvas (No API Key Required)
      const base = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '&copy; Satellite Deep Sea Imagery',
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20
      });
      base.addTo(map);
      newLayers.push(base);
    } else {
      // Standard Navigation & OpenStreetMap (No API Key Required)
      const base = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });
      base.addTo(map);
      newLayers.push(base);
    }

    tileLayersRef.current = newLayers;
  }, [mapTheme]);
  // ── Render Navigable Water + Ports ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fleetState.navigableWater || fleetState.navigableWater.length < 3) return;

    // Outer darkening mask (non-navigable areas)
    const outerBounds = [[22, 46], [32, 62]];
    const outer = [
      [22, 46], [32, 46], [32, 62], [22, 62], [22, 46]
    ];

    const navigableWaterPoly = L.polygon(fleetState.navigableWater, {
      color: '#06b6d4',
      weight: 1.5,
      dashArray: '5, 8',
      fillColor: '#0284c7',
      fillOpacity: 0.04,
      interactive: false,
      className: 'navigable-water-poly'
    }).addTo(map);

    // Port markers
    const portGroup = L.layerGroup().addTo(map);
    for (const port of fleetState.ports || []) {
      const icon = L.divIcon({
        className: 'custom-port-marker',
        html: `
          <div style="display:flex;align-items:center;gap:5px;transform:translate(-4px,-8px);cursor:pointer;">
            <div style="
              width:10px;height:10px;border-radius:50%;
              background:rgba(6,182,212,0.2);
              border:1.5px solid #22d3ee;
              box-shadow:0 0 10px rgba(6,182,212,0.6);
              flex-shrink:0;
            ">
              <div style="width:4px;height:4px;border-radius:50%;background:#22d3ee;margin:2px auto;"></div>
            </div>
            <span style="
              font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;
              color:#22d3ee;background:rgba(5,11,22,0.85);
              padding:2px 6px;border-radius:4px;border:1px solid rgba(6,182,212,0.25);
              white-space:nowrap;letter-spacing:0.04em;
            ">${port.name}</span>
          </div>
        `,
        iconSize: [0, 0]
      });

      const marker = L.marker(port.position, { icon, interactive: true });
      marker.on('click', () => {
        if (onSelectPortRef.current) onSelectPortRef.current(port);
      });
      marker.addTo(portGroup);
    }

    return () => {
      navigableWaterPoly.remove();
      portGroup.remove();
    };
  }, [fleetState.navigableWater, fleetState.ports]);

  // ── Camera Fly-To for Selected Vessel or Port ──────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedShip && selectedShip.position) {
      mapRef.current.flyTo(selectedShip.position, Math.max(mapRef.current.getZoom(), 8), {
        duration: 0.9,
        easeLinearity: 0.25
      });
    }
  }, [selectedShip?.shipId]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedPort && selectedPort.position) {
      mapRef.current.flyTo(selectedPort.position, 9, {
        duration: 0.9,
        easeLinearity: 0.25
      });
    }
  }, [selectedPort?.id || selectedPort?.name]);

  // ── Distance & Speed Measuring Tool (Ruler) Layer ─────────────────
  const measureLayerRef = useRef(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (measureLayerRef.current) {
      measureLayerRef.current.remove();
      measureLayerRef.current = null;
    }
    if (!isMeasuring || !measurePoints || measurePoints.length === 0) return;

    const group = L.layerGroup().addTo(map);

    measurePoints.forEach((pt, i) => {
      const icon = L.divIcon({
        className: 'measure-point-marker',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#d97706;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:800;font-family:'JetBrains Mono',monospace;">${i + 1}</div>`,
        iconSize: [16, 16]
      });
      L.marker(pt, { icon, interactive: false }).addTo(group);
    });

    if (measurePoints.length >= 2) {
      const p1 = measurePoints[0];
      const p2 = measurePoints[1];
      const R = 6371; // km
      const dLat = (p2[0] - p1[0]) * Math.PI / 180;
      const dLon = (p2[1] - p1[1]) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = R * c;
      const distNM = distKm * 0.539957;

      const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

      L.polyline([p1, p2], {
        color: '#d97706',
        weight: 3,
        dashArray: '6, 6'
      }).addTo(group);

      const labelIcon = L.divIcon({
        className: 'measure-label',
        html: `<div style="background:rgba(13,27,42,0.95);color:white;border:1px solid #d97706;border-radius:8px;padding:6px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.4);transform:translate(-50%,-100%);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M21.3 15.3l-6.6-6.6a1 1 0 0 0-1.4 0L2.7 19.3a1 1 0 0 0 0 1.4l.6.6a1 1 0 0 0 1.4 0L15.3 10.7"/><path d="m14.5 12.5 2-2"/><path d="m11.5 15.5 2-2"/><path d="m8.5 18.5 2-2"/><path d="m17.5 9.5 2-2"/></svg>${distNM.toFixed(1)} NM (${distKm.toFixed(1)} km)<br/>
          <span style="color:#fbbf24;font-size:10px;">ETA @ 14 kts: ${(distNM / 14).toFixed(1)}h · @ 20 kts: ${(distNM / 20).toFixed(1)}h</span>
        </div>`,
        iconSize: [0, 0]
      });
      L.marker(mid, { icon: labelIcon, interactive: false }).addTo(group);
    }

    measureLayerRef.current = group;
    return () => group.remove();
  }, [isMeasuring, measurePoints]);

  // ── Storm Cells ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    stormLayersRef.current.forEach(l => l.remove());
    stormLayersRef.current = [];

    for (const storm of fleetState.stormCells || []) {
      // Outer warning ring
      const outerRing = L.circle(storm.center, {
        radius: storm.radiusKm * 1000 * 1.3,
        color: '#d97706',
        weight: 0.5,
        dashArray: '3, 10',
        fillColor: 'transparent',
        interactive: false
      }).addTo(map);

      // Main storm cell
      const cell = L.circle(storm.center, {
        radius: storm.radiusKm * 1000,
        color: '#f59e0b',
        weight: 1.5,
        dashArray: '6, 8',
        fillColor: '#b45309',
        fillOpacity: 0.14
      }).addTo(map);

      cell.bindTooltip(`
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;">
          <div style="font-weight:800;color:#fbbf24;margin-bottom:3px;display:flex;align-items:center;gap:4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            ${storm.name}
          </div>
          <div style="color:#94a3b8;font-size:9px;">${storm.severity}</div>
          <div style="color:#fbbf24;font-size:9px;margin-top:2px;font-weight:700;">+30% Fuel Burn Active</div>
        </div>
      `, { sticky: true, opacity: 0.98 });

      // Wind direction indicator
      const windIcon = L.divIcon({
        className: '',
        html: `<div style="display:flex;align-items:center;justify-content:center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px rgba(245,158,11,0.6));">
            <path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>
          </svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const windMarker = L.marker(storm.center, { icon: windIcon, interactive: false }).addTo(map);

      stormLayersRef.current.push(outerRing, cell, windMarker);
    }
  }, [fleetState.stormCells]);

  // ── Restricted Zones ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set((fleetState.restrictedZones || []).map(z => z.id));

    // Remove deleted zones
    for (const [id, layer] of zoneLayersRef.current.entries()) {
      if (!currentIds.has(id)) {
        layer.remove();
        zoneLayersRef.current.delete(id);
      }
    }

    // Add new zones
    for (const zone of fleetState.restrictedZones || []) {
      if (zoneLayersRef.current.has(zone.id)) continue;

      const poly = L.polygon(zone.polygon, {
        color: '#ef4444',
        weight: 2,
        fillColor: '#dc2626',
        fillOpacity: 0.2,
        className: 'restricted-zone-poly'
      }).addTo(map);

      poly.bindPopup(`
        <div style="font-family:'JetBrains Mono',monospace;min-width:180px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(239,68,68,0.3);">
            <span style="font-weight:800;color:#f87171;font-size:11px;display:flex;align-items:center;gap:4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>
              ${zone.name}
            </span>
            <span style="font-size:8px;font-weight:800;color:#fca5a5;background:rgba(127,29,29,0.6);border:1px solid rgba(239,68,68,0.4);border-radius:4px;padding:2px 6px;">RED ZONE</span>
          </div>
          <p style="font-size:10px;color:#94a3b8;margin-bottom:10px;line-height:1.4;">Restricted Maritime Barrier. All vessels trigger geofence alert upon entry.</p>
          ${role === 'COMMAND' ? `
            <button id="del-zone-${zone.id}" style="
              width:100%;padding:7px;background:rgba(127,29,29,0.5);
              border:1px solid rgba(239,68,68,0.4);border-radius:6px;
              color:#fca5a5;font-size:10px;font-family:'JetBrains Mono',monospace;
              font-weight:700;cursor:pointer;letter-spacing:0.05em;display:flex;align-items:center;justify-content:center;gap:5px;
            ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              DECOMMISSION ZONE
            </button>
          ` : ''}
        </div>
      `);

      poly.on('popupopen', () => {
        const btn = document.getElementById(`del-zone-${zone.id}`);
        if (btn) btn.onclick = () => { onDeleteZone(zone.id); map.closePopup(); };
      });

      zoneLayersRef.current.set(zone.id, poly);
    }
  }, [fleetState.restrictedZones, role, onDeleteZone]);

  // ── Temporary Zone Drawing Preview ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tempDrawLayerRef.current) {
      tempDrawLayerRef.current.remove();
      tempDrawLayerRef.current = null;
    }

    if (drawnPoints.length > 0) {
      const lines = L.polyline(drawnPoints, {
        color: '#f43f5e', weight: 2, dashArray: '6, 5'
      }).addTo(map);

      // Corner markers
      const markerGroup = L.layerGroup();
      drawnPoints.forEach((pt, i) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:8px;height:8px;background:#f43f5e;border:2px solid white;border-radius:50%;box-shadow:0 0 6px rgba(244,63,94,0.8);transform:translate(-4px,-4px);"></div>`,
          iconSize: [0, 0]
        });
        L.marker(pt, { icon, interactive: false }).addTo(markerGroup);
      });

      markerGroup.addTo(map);

      // Close preview polygon if ≥3 points
      if (drawnPoints.length >= 3) {
        const preview = L.polygon(drawnPoints, {
          color: '#f43f5e', weight: 1.5,
          fillColor: '#dc2626', fillOpacity: 0.12, dashArray: '4, 4'
        }).addTo(map);
        tempDrawLayerRef.current = { remove: () => { lines.remove(); markerGroup.remove(); preview.remove(); } };
      } else {
        tempDrawLayerRef.current = { remove: () => { lines.remove(); markerGroup.remove(); } };
      }
    }
  }, [drawnPoints]);

  // ── Update Ship Targets from Fleet Ticks ──────────────────────────
  useEffect(() => {
    for (const ship of fleetState.ships || []) {
      targetPositionsRef.current.set(ship.shipId, {
        pos: [...ship.position],
        heading: ship.heading,
        speed: ship.speed,
        status: ship.status,
        name: ship.name,
        fuel: ship.fuel,
        cargo: ship.cargo,
        isAdverseWeather: ship.isAdverseWeather,
        destination: ship.destination,
        shipId: ship.shipId,
        currentPath: ship.currentPath
      });

      if (!currentPositionsRef.current.has(ship.shipId)) {
        currentPositionsRef.current.set(ship.shipId, {
          pos: [...ship.position],
          heading: ship.heading
        });
      }
    }
  }, [fleetState.ships]);

  // ── Ship Route Paths Visualization ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove stale paths
    for (const [id, layer] of shipPathsRef.current.entries()) {
      const exists = (fleetState.ships || []).some(s => s.shipId === id);
      if (!exists) {
        layer.remove();
        shipPathsRef.current.delete(id);
      }
    }

    // Update paths for each ship
    for (const ship of fleetState.ships || []) {
      if (!ship.currentPath || ship.currentPath.length < 2) continue;
      if (ship.status === 'arrived' || ship.status === 'stopped') {
        // Remove path if done
        if (shipPathsRef.current.has(ship.shipId)) {
          shipPathsRef.current.get(ship.shipId).remove();
          shipPathsRef.current.delete(ship.shipId);
        }
        continue;
      }

      const isSelected = selectedShip && selectedShip.shipId === ship.shipId;
      const pathColor = ship.status === 'distressed' ? '#f87171'
        : ship.status === 'rerouting' ? '#22d3ee'
        : ship.status === 'insufficient_fuel' ? '#fbbf24'
        : isSelected ? '#22d3ee'
        : 'rgba(56,189,248,0.2)';

      const existing = shipPathsRef.current.get(ship.shipId);
      if (existing) existing.remove();

      if (isSelected || ship.status !== 'normal') {
        const pathLine = L.polyline(ship.currentPath, {
          color: pathColor,
          weight: isSelected ? 2 : 1.5,
          dashArray: isSelected ? null : '4, 8',
          opacity: isSelected ? 0.7 : 0.45,
          interactive: false
        }).addTo(map);
        shipPathsRef.current.set(ship.shipId, pathLine);
      }
    }
  }, [fleetState.ships, selectedShip]);

  // ── 60 FPS Dead-Reckoning Interpolation Engine ───────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let lastFrameTime = performance.now();

    const animate = (now) => {
      const deltaSec = Math.min(0.1, (now - lastFrameTime) / 1000);
      lastFrameTime = now;
      const lerpFactor = Math.min(1.0, deltaSec * 4.0); // smooth convergence

      for (const [shipId, target] of targetPositionsRef.current.entries()) {
        let current = currentPositionsRef.current.get(shipId);
        if (!current) {
          current = { pos: [...target.pos], heading: target.heading };
          currentPositionsRef.current.set(shipId, current);
        }

        // Smooth position interpolation
        current.pos[0] += (target.pos[0] - current.pos[0]) * lerpFactor;
        current.pos[1] += (target.pos[1] - current.pos[1]) * lerpFactor;

        // Heading interpolation (wrap-safe 0-360)
        let dH = (target.heading - current.heading + 540) % 360 - 180;
        current.heading = (current.heading + dH * lerpFactor + 360) % 360;

        // Status-based rendering
        const isSelected = selectedShipRef.current?.shipId === shipId;
        const isDistressed = target.status === 'distressed' || target.status === 'stranded';
        const isRerouting = target.status === 'rerouting';
        const isLowFuel = target.status === 'insufficient_fuel';
        const isArrived = target.status === 'arrived' || target.status === 'stopped';

        let statusColor = '#10b981'; // Normal: green
        let glowColor = '16,185,129';
        if (isDistressed)     { statusColor = '#ef4444'; glowColor = '239,68,68'; }
        else if (isRerouting) { statusColor = '#22d3ee'; glowColor = '34,211,238'; }
        else if (isLowFuel)   { statusColor = '#f59e0b'; glowColor = '245,158,11'; }
        else if (isArrived)   { statusColor = '#64748b'; glowColor = '100,116,139'; }

        const fuelPct = Math.min(100, Math.round((target.fuel / 9000) * 100));
        const fuelColor = fuelPct < 15 ? '#ef4444' : fuelPct < 35 ? '#f59e0b' : '#10b981';

        const icon = L.divIcon({
          className: 'custom-ship-marker',
          html: `
            <div style="position:relative;transform:translate(-23px,-23px);cursor:pointer;width:46px;height:46px;">
              ${isDistressed ? `
                <div style="position:absolute;inset:-12px;border-radius:50%;border:2px solid #ef4444;animation:radar-pulse 1.2s infinite;"></div>
                <div style="position:absolute;inset:-22px;border-radius:50%;border:1px dashed #ef4444;opacity:0.6;animation:radar-pulse 1.8s infinite;"></div>
              ` : ''}
              ${isSelected ? `
                <div style="position:absolute;inset:-8px;border-radius:50%;border:2.5px solid #0a5fa8;box-shadow:0 0 20px rgba(10,95,168,0.7);animation:pulse-dot 2s infinite;"></div>
              ` : ''}

              <!-- Realistic Naval Vessel Hull Icon -->
              <div style="
                width:46px;height:46px;
                display:flex;align-items:center;justify-content:center;
                transition:all 0.2s ease;
              ">
                <svg width="44" height="44" viewBox="0 0 46 46"
                  style="transform:rotate(${current.heading}deg);transition:transform 0.2s linear;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.65));">
                  <!-- Ship Hull Outer (Pointed Bow, Broad Deck, Tapered Stern) -->
                  <path d="M 23 2 C 29 7, 34 16, 34 32 C 34 40, 30 43, 23 43 C 16 43, 12 40, 12 32 C 12 16, 17 7, 23 2 Z"
                    fill="${statusColor}" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
                  
                  <!-- Forward Cargo Bay / Tanks -->
                  <rect x="17" y="13" width="12" height="4" rx="1.5" fill="#ffffff" opacity="0.85"/>
                  
                  <!-- Midship Cargo Bay -->
                  <rect x="16" y="20" width="14" height="4" rx="1.5" fill="#ffffff" opacity="0.85"/>
                  
                  <!-- Bridge Superstructure Tower -->
                  <rect x="17.5" y="27" width="11" height="7" rx="2" fill="#ffffff" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/>
                  <rect x="19" y="28.5" width="8" height="2.5" rx="0.5" fill="${statusColor}"/>
                  
                  <!-- Bow Direction Arrow Indicator -->
                  <polygon points="23,5 26,10 20,10" fill="#ffffff"/>
                </svg>
              </div>

              <!-- High-Visibility Real Boat Name & Speed Tag -->
              <div style="
                position:absolute;top:44px;left:50%;transform:translateX(-50%);
                background:#ffffff;border:2px solid ${statusColor};
                padding:3px 8px;border-radius:6px;white-space:nowrap;
                display:flex;align-items:center;gap:5px;
                box-shadow:0 4px 12px rgba(0,0,0,0.35);
                pointer-events:none;
              ">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
                  <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
                  <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
                </svg>
                <span style="font-size:11px;font-family:'Inter',sans-serif;font-weight:800;color:#0d1b2a;letter-spacing:-0.02em;">${target.name}</span>
                <span style="font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:700;color:${statusColor};background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;">${Math.round(target.speed)}kt</span>
              </div>

              <!-- Adverse Weather / Distress Badges -->
              ${target.isAdverseWeather ? `
                <div style="position:absolute;top:-6px;right:-6px;background:#ffffff;border:1px solid #d97706;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);" title="Severe Weather">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                    <path d="M16 14v6"/>
                    <path d="M8 14v6"/>
                    <path d="M12 16v6"/>
                  </svg>
                </div>
              ` : ''}
              ${isDistressed ? `
                <div style="position:absolute;top:-6px;left:-6px;font-size:11px;background:#ef4444;color:white;font-weight:800;border-radius:4px;padding:1px 4px;box-shadow:0 2px 6px rgba(239,68,68,0.5);font-family:'JetBrains Mono',monospace;">SOS</div>
              ` : ''}
            </div>
          `,
          iconSize: [46, 46],
          iconAnchor: [23, 23]
        });

        let marker = shipMarkersRef.current.get(shipId);
        if (!marker) {
          marker = L.marker(current.pos, { icon, zIndexOffset: isSelected ? 1000 : 0 })
            .on('click', () => {
              const ship = fleetStateRef.current.ships?.find(s => s.shipId === shipId);
              if (ship) onSelectShip(ship);
            })
            .addTo(map);
          shipMarkersRef.current.set(shipId, marker);
        } else {
          marker.setLatLng(current.pos);
          marker.setIcon(icon);
          if (isSelected) marker.setZIndexOffset(1000);
          else marker.setZIndexOffset(0);
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [onSelectShip]);

  // ── Zone Submit ────────────────────────────────────────────────────
  const handleCompleteZone = useCallback(() => {
    if (drawnPoints.length < 3) {
      alert('Draw at least 3 points to define a restricted zone polygon.');
      return;
    }
    const name = prompt(
      'Designation for this Restricted Red Zone:',
      `Red Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 90 + 10)}`
    );
    if (name) {
      onDrawZone({ name, polygon: drawnPoints, threatLevel: 'RED_ZONE' });
    }
    setDrawnPoints([]);
    setIsDrawingZone(false);
  }, [drawnPoints, onDrawZone]);

  const handleCancelZone = useCallback(() => {
    setDrawnPoints([]);
    setIsDrawingZone(false);
  }, []);

  return (
    <div className="relative w-full h-full" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%', height: '100%', zIndex: 0,
          background: '#cadde8',
          cursor: isDrawingZone || isMeasuring ? 'crosshair' : 'default'
        }}
      />

      {/* ── Top-Left Controls ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: '14px', left: '14px', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        {/* Zone Drawing Controls */}
        {role === 'COMMAND' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '6px 8px',
            boxShadow: 'var(--shadow-md)'
          }}>
            {!isDrawingZone ? (
              <button
                onClick={() => setIsDrawingZone(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                  fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 700,
                  background: 'var(--red-bg)',
                  color: 'var(--red)',
                  border: '1px solid var(--red-border)',
                  transition: 'all var(--t)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
              >
                <ShieldAlert style={{ width: '13px', height: '13px' }} />
                Draw Restricted Zone
              </button>
            ) : (
              <>
                <span style={{
                  fontSize: '11px', fontFamily: 'var(--font-mono)',
                  color: 'var(--amber)', fontWeight: 800,
                  animation: 'pulse-dot 1.5s infinite',
                  padding: '0 6px',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <PenTool style={{ width: '11px', height: '11px' }} />
                  {drawnPoints.length} POINTS — CLICK MAP
                </span>
                <button
                  onClick={handleCompleteZone}
                  disabled={drawnPoints.length < 3}
                  style={{
                    padding: '5px 12px', borderRadius: 'var(--r-sm)',
                    fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800,
                    background: drawnPoints.length >= 3 ? 'var(--green)' : 'var(--surface-2)',
                    color: drawnPoints.length >= 3 ? 'white' : 'var(--text-3)',
                    border: `1px solid ${drawnPoints.length >= 3 ? 'var(--green)' : 'var(--border)'}`,
                    cursor: drawnPoints.length >= 3 ? 'pointer' : 'not-allowed',
                    boxShadow: drawnPoints.length >= 3 ? 'var(--shadow-xs)' : 'none',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <Check style={{ width: '12px', height: '12px' }} />
                  ESTABLISH
                </button>
                <button
                  onClick={handleCancelZone}
                  style={{
                    padding: '5px', borderRadius: 'var(--r-sm)',
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--text-3)', cursor: 'pointer'
                  }}
                >
                  <X style={{ width: '13px', height: '13px' }} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Map Legend */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '6px 12px',
          fontSize: '11px', fontFamily: 'var(--font)',
          boxShadow: 'var(--shadow-md)'
        }}>
          {[
            { color: 'var(--green)', label: 'Normal' },
            { color: 'var(--blue)', label: 'Rerouting' },
            { color: 'var(--red)', label: 'Distressed', pulse: true },
            { color: 'var(--amber)', label: 'Low Fuel' },
            { color: 'var(--text-3)', label: 'Stopped' },
          ].map(({ color, label, pulse }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-2)', fontWeight: 600 }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%', background: color,
                animation: pulse ? 'radar-pulse 2s infinite' : 'none',
                flexShrink: 0
              }} />
              {label}
            </span>
          ))}
        </div>

        {/* Real-World Satellite / Tactical Mode Switcher */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '3px',
          boxShadow: 'var(--shadow-md)'
        }}>
          {[
            { id: 'realmap', label: 'Real Map', Icon: Globe },
            { id: 'marine', label: 'Marine', Icon: Waves },
            { id: 'standard', label: 'OpenStreet', Icon: MapIcon },
            { id: 'dark', label: 'Night', Icon: Moon }
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setMapTheme(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: 'var(--r-sm)',
                fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 800,
                cursor: 'pointer',
                background: mapTheme === id ? 'var(--blue)' : 'transparent',
                color: mapTheme === id ? 'white' : 'var(--text-3)',
                border: 'none',
                boxShadow: mapTheme === id ? 'var(--shadow-xs)' : 'none',
                transition: 'all var(--t)'
              }}
            >
              <Icon style={{ width: '12px', height: '12px' }} />
              {label}
            </button>
          ))}
        </div>

        {/* Real Map Active Badge Indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--surface)',
          border: '1px solid ' + (mapTheme === 'realmap' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border)'),
          borderRadius: 'var(--r-md)', padding: '5px 10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: mapTheme === 'realmap' ? '#10b981' : 'var(--blue)',
            boxShadow: mapTheme === 'realmap' ? '0 0 8px #10b981' : 'none'
          }} />
          <span style={{
            fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800,
            color: mapTheme === 'realmap' ? '#0f7743' : 'var(--text-2)',
            letterSpacing: '0.04em'
          }}>
            {mapTheme === 'realmap' ? 'REAL MAP: SATELLITE' : mapTheme === 'marine' ? 'MARINE CHART' : mapTheme === 'standard' ? 'OPENSTREET' : 'NIGHT TACTICAL'}
          </span>
        </div>
      </div>

      {/* History Mode Banner */}
      {isPlayingHistory && (
        <div style={{
          position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'var(--surface)',
          border: '1px solid var(--amber-border)',
          borderRadius: 'var(--r-full)', padding: '6px 16px',
          display: 'flex', alignItems: 'center', gap: '7px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber)',
            animation: 'pulse-dot 1s infinite'
          }} />
          <span style={{
            fontSize: '12px', fontFamily: 'var(--font)',
            fontWeight: 700, color: 'var(--amber)'
          }}>
            History Replay — Live Updates Paused
          </span>
        </div>
      )}

      {/* Fleet Stats Mini HUD */}
      <div style={{
        position: 'absolute', bottom: '56px', left: '14px', zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: '5px'
      }}>
        {[
          { label: 'Vessels', value: (fleetState.ships || []).length, color: 'var(--blue)' },
          { label: 'Zones', value: (fleetState.restrictedZones || []).length, color: 'var(--red)' },
          { label: 'Alerts', value: (fleetState.alerts || []).length, color: (fleetState.alerts || []).length > 0 ? 'var(--amber)' : 'var(--green)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)', padding: '4px 10px',
            fontSize: '11px', fontFamily: 'var(--font)',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
            <span style={{ color, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
