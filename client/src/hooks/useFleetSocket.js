import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Real-Time WebSocket Hook for Fleet Command
 * Manages persistent connection, auto-reconnect, sub-500ms state updates, and command dispatch.
 */
export function useFleetSocket(onAlertTriggered) {
  const [isConnected, setIsConnected] = useState(false);
  const [fleetState, setFleetState] = useState({
    scenario: null,
    boundingBox: null,
    navigableWater: [],
    ports: [],
    ships: [],
    restrictedZones: [],
    alerts: [],
    aiAdvisor: [],
    stormCells: [],
    timeScale: 12,
    lastUpdate: 0
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const knownAlertIdsRef = useRef(new Set());

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:3001`;

    console.log(`[WebSocket] Connecting to ${wsUrl}...`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected to Fleet Command Server');
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'INIT_STATE') {
          setFleetState(prev => ({
            ...prev,
            scenario: msg.scenario,
            boundingBox: msg.boundingBox,
            navigableWater: msg.navigableWater,
            ports: msg.ports,
            ships: msg.ships,
            restrictedZones: msg.restrictedZones,
            alerts: msg.alerts,
            stormCells: msg.stormCells || [],
            timeScale: msg.timeScale || 12,
            lastUpdate: Date.now()
          }));
        } else if (msg.type === 'FLEET_TICK') {
          setFleetState(prev => ({
            ...prev,
            ships: msg.ships,
            restrictedZones: msg.restrictedZones,
            alerts: msg.alerts,
            aiAdvisor: msg.aiAdvisor || [],
            stormCells: msg.stormCells || prev.stormCells,
            timeScale: msg.timeScale || prev.timeScale,
            lastUpdate: Date.now()
          }));

          // Trigger sound for any new unacknowledged alerts
          if (msg.alerts && msg.alerts.length > 0) {
            for (const alert of msg.alerts) {
              if (!knownAlertIdsRef.current.has(alert.id)) {
                knownAlertIdsRef.current.add(alert.id);
                if (onAlertTriggered) {
                  onAlertTriggered(alert);
                }
              }
            }
          }
        } else if (msg.type === 'ZONE_ADDED') {
          setFleetState(prev => ({
            ...prev,
            restrictedZones: [...prev.restrictedZones.filter(z => z.id !== msg.zone.id), msg.zone]
          }));
        } else if (msg.type === 'ZONE_DELETED') {
          setFleetState(prev => ({
            ...prev,
            restrictedZones: prev.restrictedZones.filter(z => z.id !== msg.zoneId)
          }));
        } else if (msg.type === 'ALERT_ACKNOWLEDGED') {
          setFleetState(prev => ({
            ...prev,
            alerts: prev.alerts.filter(a => a.id !== msg.alertId)
          }));
        } else if (msg.type === 'TIMESCALE_UPDATED') {
          setFleetState(prev => ({ ...prev, timeScale: msg.scale }));
        }
      } catch (err) {
        console.error('[WebSocket] Error parsing server message:', err);
      }
    };

    ws.onclose = () => {
      console.warn('[WebSocket] Connection closed. Retrying in 2 seconds...');
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 2000);
    };

    ws.onerror = (err) => {
      console.error('[WebSocket] Socket error:', err);
      ws.close();
    };
  }, [onAlertTriggered]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  // Command Action Dispatchers
  const sendAction = useCallback((action) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    } else {
      console.warn('[WebSocket] Cannot send action, socket is not connected');
    }
  }, []);

  const drawZone = useCallback((zone) => {
    sendAction({ type: 'DRAW_ZONE', zone });
  }, [sendAction]);

  const deleteZone = useCallback((zoneId) => {
    sendAction({ type: 'DELETE_ZONE', zoneId });
  }, [sendAction]);

  const issueDirective = useCallback((shipId, directive) => {
    sendAction({ type: 'ISSUE_DIRECTIVE', shipId, directive });
  }, [sendAction]);

  const captainResponse = useCallback((shipId, action, payload) => {
    sendAction({ type: 'CAPTAIN_RESPONSE', shipId, action, payload });
  }, [sendAction]);

  const acknowledgeAlert = useCallback((alertId) => {
    sendAction({ type: 'ACKNOWLEDGE_ALERT', alertId });
  }, [sendAction]);

  const setTimeScale = useCallback((scale) => {
    sendAction({ type: 'SET_TIMESCALE', scale });
  }, [sendAction]);

  return {
    isConnected,
    fleetState,
    drawZone,
    deleteZone,
    issueDirective,
    captainResponse,
    acknowledgeAlert,
    setTimeScale
  };
}
