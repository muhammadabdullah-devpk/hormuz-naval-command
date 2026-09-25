import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useFleetSocket } from './hooks/useFleetSocket.js';
import { useAudioAlert } from './hooks/useAudioAlert.js';
import { TacticalMap } from './components/TacticalMap.jsx';
import { RoleSelector } from './components/RoleSelector.jsx';
import { AlertsPanel } from './components/AlertsPanel.jsx';
import { ShipDetailsDrawer } from './components/ShipDetailsDrawer.jsx';
import { PortDetailsDrawer } from './components/PortDetailsDrawer.jsx';
import { MarineToolDock } from './components/MarineToolDock.jsx';
import { DirectivesModal } from './components/DirectivesModal.jsx';
import { CaptainView } from './components/CaptainView.jsx';
import { AIFleetAdvisor } from './components/AIFleetAdvisor.jsx';
import { TimelineScrubber } from './components/TimelineScrubber.jsx';
import { VESSEL_REGISTRY } from './data/maritimeDirectory.js';

export default function App() {
  const { playAlarm, isMuted, toggleMute } = useAudioAlert();

  const handleAlertTriggered = useCallback((alert) => {
    playAlarm(alert.severity || 'HIGH');
  }, [playAlarm]);

  const {
    isConnected, fleetState, drawZone, deleteZone,
    issueDirective, captainResponse, acknowledgeAlert, setTimeScale
  } = useFleetSocket(handleAlertTriggered);

  const [role, setRole] = useState('COMMAND');
  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedPort, setSelectedPort] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCaptainShipId, setSelectedCaptainShipId] = useState('MV-1');
  const [isDirectivesModalOpen, setIsDirectivesModalOpen] = useState(false);
  const [historySnapshot, setHistorySnapshot] = useState(null);
  const [isPlayingHistory, setIsPlayingHistory] = useState(false);
  const [showAIAdvisor, setShowAIAdvisor] = useState(false);
  const [uiTheme, setUiTheme] = useState('light'); // 'light' = MarineTraffic, 'dark' = night ops

  // Distance measuring tool state
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [showWeatherLayer, setShowWeatherLayer] = useState(false);

  useEffect(() => {
    document.body.className = `theme-${uiTheme}`;
  }, [uiTheme]);

  // Active ships
  const displayShips = isPlayingHistory && historySnapshot
    ? historySnapshot.ships
    : (fleetState.ships || []);

  const breachCount = (fleetState.alerts || []).filter(a => a.type === 'GEOFENCE_BREACH').length;
  const distressCount = (fleetState.alerts || []).filter(a => a.type === 'MAYDAY_DISTRESS').length;
  const critCount = (fleetState.alerts || []).filter(a => a.severity === 'CRITICAL').length;
  // AI Advisor dismissal & persistence state
  const [dismissedAdvisorIds, setDismissedAdvisorIds] = useState(new Set());
  const [isAdvisorClosedByUser, setIsAdvisorClosedByUser] = useState(false);
  const seenAdvisoriesRef = useRef(new Set());

  // Active un-dismissed recommendations
  const activeRecommendations = useMemo(() => {
    return (fleetState.aiAdvisor || []).filter(r => !dismissedAdvisorIds.has(r.id));
  }, [fleetState.aiAdvisor, dismissedAdvisorIds]);

  // Only auto-open if brand-new never-seen recommendations arrived and user hasn't explicitly closed it
  useEffect(() => {
    const rawList = fleetState.aiAdvisor || [];
    if (rawList.length === 0) return;

    let hasBrandNew = false;
    for (const rec of rawList) {
      if (!seenAdvisoriesRef.current.has(rec.id)) {
        seenAdvisoriesRef.current.add(rec.id);
        hasBrandNew = true;
      }
    }

    // Only auto-open if brand new recommendation appeared and user hasn't closed panel
    if (hasBrandNew && !isAdvisorClosedByUser) {
      setShowAIAdvisor(true);
    }
  }, [fleetState.aiAdvisor, isAdvisorClosedByUser]);

  const handleCloseAdvisor = () => {
    setShowAIAdvisor(false);
    setIsAdvisorClosedByUser(true);
    setDismissedAdvisorIds(prev => {
      const next = new Set(prev);
      (fleetState.aiAdvisor || []).forEach(r => next.add(r.id));
      return next;
    });
  };

  const handleDismissRecommendation = (recId) => {
    setDismissedAdvisorIds(prev => {
      const next = new Set(prev);
      next.add(recId);
      return next;
    });
  };

  const handleToggleAIAdvisor = () => {
    if (showAIAdvisor) {
      setShowAIAdvisor(false);
      setIsAdvisorClosedByUser(true);
    } else {
      setShowAIAdvisor(true);
      setIsAdvisorClosedByUser(false);
      setDismissedAdvisorIds(new Set());
    }
  };

  const handleSelectShip = (ship) => {
    setSelectedShip(ship);
    setSelectedPort(null); // close port drawer when vessel clicked
    if (role === 'CAPTAIN') setSelectedCaptainShipId(ship.shipId);
  };

  const handleSelectPort = (port) => {
    setSelectedPort(port);
    setSelectedShip(null); // close ship drawer when port clicked
  };

  const handleToggleMeasuring = () => {
    setIsMeasuring(prev => {
      const next = !prev;
      if (!next) setMeasurePoints([]);
      return next;
    });
  };

  const handleMeasurePointAdded = (pt) => {
    setMeasurePoints(prev => {
      if (prev.length >= 2) return [pt];
      return [...prev, pt];
    });
  };

  const handleAdoptAdvisorRecommendation = (rec) => {
    handleDismissRecommendation(rec.id);
    if (rec.type === 'MUTUAL_AID' && rec.targetShipId && rec.coordinates) {
      issueDirective(rec.targetShipId, {
        type: 'DIVERT_WAYPOINT',
        waypoint: rec.coordinates,
        notes: `AI Fleet Advisor — SAR rendezvous to assist distressed vessel.`
      });
    } else if (rec.type === 'FUEL_CRITICAL' && rec.targetShipId) {
      issueDirective(rec.targetShipId, {
        type: 'REROUTE_PORT',
        targetPortId: 'DXB-1',
        speedKnots: 10,
        notes: `AI Fleet Advisor — Emergency fuel conservation diversion.`
      });
    }
  };

  // Filter vessels by category if selected
  const categoryFilteredShips = useMemo(() => {
    if (activeCategory === 'all') return displayShips;
    return displayShips.filter(s => {
      const reg = VESSEL_REGISTRY[s.shipId];
      return reg && reg.category === activeCategory;
    });
  }, [displayShips, activeCategory]);

  const liveSelectedShip = useMemo(() => {
    if (!selectedShip) return null;
    return displayShips.find(s => s.shipId === selectedShip.shipId) || selectedShip;
  }, [
    selectedShip?.shipId,
    displayShips.find(s => s.shipId === selectedShip?.shipId)?.status,
    displayShips.find(s => s.shipId === selectedShip?.shipId)?.fuel,
    displayShips.find(s => s.shipId === selectedShip?.shipId)?.speed,
    displayShips.find(s => s.shipId === selectedShip?.shipId)?.isAdverseWeather,
  ]);

  const isLight = uiTheme === 'light';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw',
      background: isLight
        ? 'linear-gradient(160deg, #f0f4f8 0%, #e8f0fb 100%)'
        : 'linear-gradient(135deg, #020509 0%, #030811 40%, #060e1f 100%)',
      color: isLight ? '#0f172a' : '#e2e8f0',
      overflow: 'hidden', position: 'relative',
      transition: 'background 0.4s ease, color 0.3s ease'
    }}>

      {/* Real-World Maritime Header */}
      <RoleSelector
        role={role}
        onSelectRole={setRole}
        timeScale={fleetState.timeScale || 12}
        onChangeTimeScale={setTimeScale}
        activeShipCount={displayShips.length}
        activeBreachCount={breachCount}
        distressCount={distressCount}
        critCount={critCount}
        isConnected={isConnected}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        alertCount={(fleetState.alerts || []).length}
        showAIAdvisor={showAIAdvisor}
        onToggleAIAdvisor={handleToggleAIAdvisor}
        aiAdvisorCount={activeRecommendations.length}
        uiTheme={uiTheme}
        onToggleTheme={() => setUiTheme(t => t === 'light' ? 'dark' : 'light')}
        ships={displayShips}
        ports={fleetState.ports || []}
        onSelectShip={handleSelectShip}
        onSelectPort={handleSelectPort}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', zIndex: 1 }}>

        {/* Left Drawer: Captain Console OR Ship Details OR Port Details */}
        {role === 'CAPTAIN' ? (
          <CaptainView
            ships={displayShips}
            selectedCaptainShipId={selectedCaptainShipId}
            onSelectCaptainShip={setSelectedCaptainShipId}
            onCaptainResponse={captainResponse}
            onTriggerAlarm={playAlarm}
          />
        ) : liveSelectedShip ? (
          <ShipDetailsDrawer
            ship={liveSelectedShip}
            ports={fleetState.ports}
            onClose={() => setSelectedShip(null)}
            onOpenDirectives={() => setIsDirectivesModalOpen(true)}
            role={role}
            allShips={displayShips}
            onIssueDirective={issueDirective}
          />
        ) : selectedPort ? (
          <PortDetailsDrawer
            port={selectedPort}
            ships={displayShips}
            onClose={() => setSelectedPort(null)}
            onSelectShip={handleSelectShip}
            role={role}
          />
        ) : null}

        {/* Map Center & Marine Tools Dock */}
        <div style={{ flex: 1, position: 'relative', height: '100%', minWidth: 0 }}>
          {/* Floating Real-World MarineToolDock (Fleet, Ports, Ruler, Weather) */}
          <MarineToolDock
            ships={displayShips}
            ports={fleetState.ports || []}
            onSelectShip={handleSelectShip}
            onSelectPort={handleSelectPort}
            activeFilter={activeCategory}
            onChangeFilter={setActiveCategory}
            isMeasuring={isMeasuring}
            onToggleMeasuring={handleToggleMeasuring}
            measurePoints={measurePoints}
            onClearMeasure={() => setMeasurePoints([])}
            showWeatherLayer={showWeatherLayer}
            onToggleWeatherLayer={() => setShowWeatherLayer(v => !v)}
          />

          <TacticalMap
            fleetState={{ ...fleetState, ships: categoryFilteredShips }}
            selectedShip={selectedShip}
            onSelectShip={handleSelectShip}
            selectedPort={selectedPort}
            onSelectPort={handleSelectPort}
            role={role}
            onDrawZone={drawZone}
            onDeleteZone={deleteZone}
            isPlayingHistory={isPlayingHistory}
            uiTheme={uiTheme}
            isMeasuring={isMeasuring}
            onMeasurePointAdded={handleMeasurePointAdded}
            measurePoints={measurePoints}
            activeCategory={activeCategory}
          />
        </div>

        {/* Right Panel: Alerts & Radio Log */}
        <div style={{ width: '308px', flexShrink: 0, height: '100%', zIndex: 5 }}>
          <AlertsPanel
            alerts={fleetState.alerts}
            onAcknowledge={acknowledgeAlert}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        </div>
      </div>

      {/* AI Fleet Strategic Advisor */}
      {role === 'COMMAND' && showAIAdvisor && (
        <AIFleetAdvisor
          recommendations={activeRecommendations}
          onAdoptRecommendation={handleAdoptAdvisorRecommendation}
          onDismissRecommendation={handleDismissRecommendation}
          role={role}
          onClose={handleCloseAdvisor}
          fleetState={fleetState}
        />
      )}

      {/* Timeline Scrubber */}
      <TimelineScrubber
        isPlayingHistory={isPlayingHistory}
        onToggleHistoryMode={setIsPlayingHistory}
        onSeekSnapshot={(snap) => setHistorySnapshot(snap)}
      />

      {/* Course Directives Modal */}
      {isDirectivesModalOpen && liveSelectedShip && (
        <DirectivesModal
          ship={liveSelectedShip}
          ports={fleetState.ports || []}
          onClose={() => setIsDirectivesModalOpen(false)}
          onIssueDirective={issueDirective}
        />
      )}
    </div>
  );
}
