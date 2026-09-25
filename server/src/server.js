import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { FleetSimulator } from './simulator.js';
import { historyBuffer } from './historyBuffer.js';
import { generateAlternativeRoutes } from './routing.js';
import { parseDistressMessage } from './aiService.js';
import { getActiveStormCells } from './weather.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load fleetData.json
const fleetRaw = fs.readFileSync(path.join(__dirname, 'fleetData.json'), 'utf-8');
const fleetData = JSON.parse(fleetRaw);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Initialize fleet simulator
const simulator = new FleetSimulator(fleetData);
simulator.start();

// Connected WebSocket clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WebSocket] Client connected. Total active clients: ${clients.size}`);

  // Send initial state immediately
  const initialPayload = {
    type: 'INIT_STATE',
    scenario: simulator.scenario,
    boundingBox: simulator.boundingBox,
    navigableWater: simulator.navigableWater,
    ports: simulator.ports,
    ships: simulator.ships,
    restrictedZones: simulator.restrictedZones,
    alerts: Array.from(simulator.activeAlerts.values()),
    stormCells: getActiveStormCells(),
    timeScale: simulator.timeScale
  };
  ws.send(JSON.stringify(initialPayload));

  // Handle incoming messages from clients
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      await handleClientAction(data, ws);
    } catch (err) {
      console.error('[WebSocket] Error handling message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WebSocket] Client disconnected. Active clients: ${clients.size}`);
  });
});

// Broadcast 1 Hz simulation tick to all connected clients
simulator.onTick((payload) => {
  const tickMessage = JSON.stringify({
    type: 'FLEET_TICK',
    ...payload,
    stormCells: getActiveStormCells()
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(tickMessage);
    }
  }
});

// Centralized action handler (supports both WS and REST)
async function handleClientAction(action, originWs = null) {
  switch (action.type) {
    case 'DRAW_ZONE': {
      const newZone = simulator.addRestrictedZone(action.zone);
      broadcastEvent({ type: 'ZONE_ADDED', zone: newZone });
      break;
    }
    case 'DELETE_ZONE': {
      simulator.removeRestrictedZone(action.zoneId);
      broadcastEvent({ type: 'ZONE_DELETED', zoneId: action.zoneId });
      break;
    }
    case 'ISSUE_DIRECTIVE': {
      const directive = simulator.issueDirective(action.shipId, action.directive);
      broadcastEvent({ type: 'DIRECTIVE_ISSUED', directive, shipId: action.shipId });
      break;
    }
    case 'CAPTAIN_RESPONSE': {
      const result = await simulator.captainResponse(action.shipId, action.action, action.payload || {});
      broadcastEvent({
        type: 'CAPTAIN_RESPONSE_LOGGED',
        shipId: action.shipId,
        action: action.action,
        result
      });
      break;
    }
    case 'ACKNOWLEDGE_ALERT': {
      simulator.acknowledgeAlert(action.alertId);
      broadcastEvent({ type: 'ALERT_ACKNOWLEDGED', alertId: action.alertId });
      break;
    }
    case 'SET_TIMESCALE': {
      simulator.setTimeScale(action.scale);
      broadcastEvent({ type: 'TIMESCALE_UPDATED', scale: simulator.timeScale });
      break;
    }
    default:
      console.warn('Unknown action type:', action.type);
  }
}

function broadcastEvent(eventData) {
  const msg = JSON.stringify(eventData);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// REST Endpoints
app.get('/api/fleet', (req, res) => {
  res.json({
    scenario: simulator.scenario,
    ports: simulator.ports,
    ships: simulator.ships,
    restrictedZones: simulator.restrictedZones,
    alerts: Array.from(simulator.activeAlerts.values()),
    stormCells: getActiveStormCells()
  });
});

app.get('/api/history', (req, res) => {
  const timeline = historyBuffer.getTimeline();
  res.json(timeline);
});

app.get('/api/alternatives/:shipId', (req, res) => {
  const ship = simulator.ships.find(s => s.shipId === req.params.shipId);
  if (!ship) return res.status(404).json({ error: 'Ship not found' });

  const port = simulator.ports.find(p => p.id === ship.destination);
  if (!port) return res.status(404).json({ error: 'Port not found' });

  const alternatives = generateAlternativeRoutes(
    ship.position,
    port.position,
    simulator.navigableWater,
    simulator.restrictedZones
  );
  res.json(alternatives);
});

app.post('/api/zone', (req, res) => {
  const newZone = simulator.addRestrictedZone(req.body);
  broadcastEvent({ type: 'ZONE_ADDED', zone: newZone });
  res.json(newZone);
});

app.delete('/api/zone/:id', (req, res) => {
  simulator.removeRestrictedZone(req.params.id);
  broadcastEvent({ type: 'ZONE_DELETED', zoneId: req.params.id });
  res.json({ success: true });
});

app.post('/api/directive', (req, res) => {
  const directive = simulator.issueDirective(req.body.shipId, req.body.directive);
  broadcastEvent({ type: 'DIRECTIVE_ISSUED', directive, shipId: req.body.shipId });
  res.json(directive);
});

app.post('/api/captain/response', async (req, res) => {
  const result = await simulator.captainResponse(req.body.shipId, req.body.action, req.body.payload || {});
  broadcastEvent({
    type: 'CAPTAIN_RESPONSE_LOGGED',
    shipId: req.body.shipId,
    action: req.body.action,
    result
  });
  res.json(result);
});

app.post('/api/alerts/acknowledge', (req, res) => {
  simulator.acknowledgeAlert(req.body.alertId);
  broadcastEvent({ type: 'ALERT_ACKNOWLEDGED', alertId: req.body.alertId });
  res.json({ success: true });
});

app.post('/api/timescale', (req, res) => {
  simulator.setTimeScale(req.body.scale);
  broadcastEvent({ type: 'TIMESCALE_UPDATED', scale: simulator.timeScale });
  res.json({ timeScale: simulator.timeScale });
});

// MAYDAY Distress Endpoint — triggers AI analysis + simulator distress state
app.post('/api/distress', async (req, res) => {
  const { shipId, message } = req.body;
  if (!shipId || !message) return res.status(400).json({ error: 'shipId and message required' });
  const ship = simulator.ships.find(s => s.shipId === shipId);
  if (!ship) return res.status(404).json({ error: 'Ship not found' });

  // AI NLP analysis
  const analysis = await parseDistressMessage(message, ship);
  console.log(`[MAYDAY] ${ship.name} (${shipId}): ${analysis.incidentType} [${analysis.severity}]`);

  // Mark ship as distressed in simulator
  simulator.setShipDistress(shipId, message, analysis);

  // Broadcast alert to all clients
  const alert = {
    id: `mayday-${shipId}-${Date.now()}`,
    type: 'MAYDAY_DISTRESS',
    severity: analysis.severity || 'HIGH',
    shipId,
    shipName: ship.name,
    message: `[MAYDAY] ${ship.name}: ${message.substring(0, 120)}`,
    aiAnalysis: analysis,
    timestamp: Date.now(),
    acknowledged: false
  };
  simulator.activeAlerts.set(alert.id, alert);
  broadcastEvent({ type: 'FLEET_TICK', ships: simulator.ships, alerts: Array.from(simulator.activeAlerts.values()), restrictedZones: simulator.restrictedZones, aiAdvisor: simulator.currentAdvisory });

  res.json({ ok: true, analysis, alertId: alert.id });
});

server.listen(PORT, () => {
  console.log(`[CrisisOps Server] Running on http://localhost:${PORT}`);
  console.log(`[CrisisOps Server] WebSocket Server listening on ws://localhost:${PORT}`);
});
