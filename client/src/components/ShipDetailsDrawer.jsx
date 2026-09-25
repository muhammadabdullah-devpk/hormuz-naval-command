import React, { useState, useEffect } from 'react';
import {
  X, Navigation, Fuel, Gauge, Compass, Box, Wind,
  ShieldAlert, CheckCircle, Route, AlertTriangle,
  MapPin, Package, Anchor, Zap, Clock, TrendingDown,
  Users, Radio, ArrowRight, Info, Shield, Ship as ShipIcon,
  Ruler, Scale, Send, Check, CloudRain, Sun
} from 'lucide-react';
import { VESSEL_REGISTRY } from '../data/maritimeDirectory.js';

// Status configuration using unified tokens
const STATUS_CFG = {
  normal:            { label: 'NORMAL',    color: 'var(--green)',  bg: 'var(--green-bg)',  border: 'var(--green-border)' },
  rerouting:         { label: 'REROUTING', color: 'var(--blue)',   bg: 'var(--blue-muted)',border: 'var(--blue-border)' },
  distressed:        { label: 'DISTRESS',  color: 'var(--red)',    bg: 'var(--red-bg)',    border: 'var(--red-border)' },
  stopped:           { label: 'STOPPED',   color: 'var(--text-3)', bg: 'var(--surface-2)', border: 'var(--border)' },
  stranded:          { label: 'STRANDED',  color: 'var(--red)',    bg: 'var(--red-bg)',    border: 'var(--red-border)' },
  arrived:           { label: 'ARRIVED',   color: 'var(--green)',  bg: 'var(--green-bg)',  border: 'var(--green-border)' },
  insufficient_fuel: { label: 'LOW FUEL',  color: 'var(--amber)',  bg: 'var(--amber-bg)',  border: 'var(--amber-border)' },
};

const MetricTile = ({ icon: Icon, label, value, unit, iconColor = 'var(--blue)' }) => (
  <div
    style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      padding: '10px 12px',
      transition: 'border-color var(--t), box-shadow var(--t)'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'var(--blue-border)';
      e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
      <Icon style={{ width: '12px', height: '12px', color: iconColor }} />
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: '10px',
        fontWeight: 600, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.05em'
      }}>
        {label}
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{
        fontSize: '16px', fontFamily: 'var(--font-mono)',
        fontWeight: 800, color: 'var(--text)', lineHeight: 1
      }}>
        {value}
      </span>
      {unit && (
        <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          {unit}
        </span>
      )}
    </div>
  </div>
);

const StatusBanner = ({ status, distressReason }) => {
  if (status === 'distressed') {
    return (
      <div style={{
        padding: '11px 14px', borderRadius: 'var(--r-md)', marginBottom: '12px',
        background: 'var(--red-bg)',
        border: '1px solid var(--red-border)',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
          <ShieldAlert style={{ width: '15px', height: '15px', color: 'var(--red)' }} />
          <span style={{
            fontSize: '11px', fontFamily: 'var(--font)',
            fontWeight: 800, color: 'var(--red)', letterSpacing: '0.04em'
          }}>
            MAYDAY / DISTRESS DECLARED
          </span>
        </div>
        <p style={{
          fontSize: '11px', color: 'var(--text)',
          lineHeight: 1.5, margin: 0, fontFamily: 'var(--font)'
        }}>
          {distressReason || 'Vessel has escalated emergency distress to fleet command.'}
        </p>
      </div>
    );
  }
  if (status === 'stranded') {
    return (
      <div style={{
        padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: '12px',
        background: 'var(--amber-bg)', border: '1px solid var(--amber-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <AlertTriangle style={{ width: '14px', height: '14px', color: 'var(--amber)' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 800, color: 'var(--amber)' }}>
            VESSEL STRANDED — All transit channels restricted
          </span>
        </div>
      </div>
    );
  }
  if (status === 'arrived') {
    return (
      <div style={{
        padding: '9px 14px', borderRadius: 'var(--r-md)', marginBottom: '12px',
        background: 'var(--green-bg)', border: '1px solid var(--green-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <CheckCircle style={{ width: '14px', height: '14px', color: 'var(--green)' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 800, color: 'var(--green)' }}>
            VESSEL ARRIVED — Safely docked in port
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Predictive alerts computation
function computePredictions(ship, allShips, restrictedZones) {
  const predictions = [];
  if (!ship || ship.status === 'arrived' || ship.status === 'stopped') return predictions;

  // 1. Fuel depletion projection
  if (ship.fuel < (ship.requiredFuelToPort || 1000) * 1.2 && ship.fuel > 0) {
    const hoursLeft = Math.round(ship.fuel / (ship.speed * 2.5 || 25));
    predictions.push({
      id: 'pred-fuel',
      type: 'FUEL_PROJECTION',
      severity: ship.fuel < (ship.requiredFuelToPort || 1000) ? 'CRITICAL' : 'WARNING',
      icon: Fuel,
      color: 'var(--amber)',
      message: `Reserve depletion in ~${hoursLeft}h at current speed (${ship.speed} kts). Reroute suggested.`
    });
  }

  // 2. Weather trajectory risk
  if (ship.isAdverseWeather) {
    predictions.push({
      id: 'pred-weather',
      type: 'WEATHER_TRAJECTORY',
      severity: 'WARNING',
      icon: Wind,
      color: 'var(--amber)',
      message: 'Persistent gale force swell. +30% burn rate sustained.'
    });
  }

  return predictions;
}

// Realistic Maritime Vessel Visual Card with real profile illustration, ocean waves & specs
function VesselVisualCard({ ship, reg }) {
  const category = reg.category || 'tanker';
  
  return (
    <div style={{
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      background: 'linear-gradient(180deg, #1b324f 0%, #0d1e34 70%, #081423 100%)',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      marginBottom: '6px'
    }}>
      {/* Top Banner with Vessel Class & Operator */}
      <div style={{
        padding: '7px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {reg.flag ? <span style={{ fontSize: '13px' }}>{reg.flag}</span> : <ShipIcon style={{ width: '13px', height: '13px', color: '#38bdf8' }} />}
          <span style={{
            fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 700,
            color: '#ffffff', letterSpacing: '0.01em'
          }}>
            {reg.vesselType || 'Commercial Cargo Vessel'}
          </span>
        </div>
        <span style={{
          fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: '#38bdf8', background: 'rgba(56,189,248,0.15)',
          padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.3)'
        }}>
          IMO {reg.imo || '9812450'}
        </span>
      </div>

      {/* Realistic Vessel Side Silhouette / Graphic Illustration */}
      <div style={{
        height: '92px',
        position: 'relative',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: '14px',
        overflow: 'hidden'
      }}>
        {/* Sky / Grid Background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(56,189,248,0.15), transparent 75%)',
          pointerEvents: 'none'
        }} />

        {/* Detailed Maritime Vessel SVG Side Profile */}
        <svg width="280" height="68" viewBox="0 0 280 68" style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.7))', zIndex: 2 }}>
          {/* Exhaust Funnel Smoke */}
          <circle cx="218" cy="10" r="3" fill="rgba(255,255,255,0.2)" />
          <circle cx="222" cy="7" r="4.5" fill="rgba(255,255,255,0.15)" />
          <circle cx="227" cy="4" r="6" fill="rgba(255,255,255,0.08)" />

          {/* Radar Mast & Antenna */}
          <line x1="210" y1="12" x2="210" y2="24" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="206" y1="15" x2="214" y2="15" stroke="#38bdf8" strokeWidth="1.5" />

          {/* Bridge / Superstructure Tower */}
          <polygon points="195,44 195,24 225,24 225,44" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
          {/* Bridge Windows */}
          <rect x="198" y="27" width="24" height="4" rx="0.5" fill="#0284c7" />
          {/* Bridge Funnel */}
          <polygon points="216,24 216,14 222,14 223,24" fill="#ef4444" />
          <rect x="216" y="14" width="6" height="3" fill="#0f172a" />

          {/* Cargo Deck Features depending on vessel type */}
          {category === 'container' ? (
            <g>
              <rect x="36" y="24" width="22" height="20" rx="1" fill="#f59e0b" stroke="#0f172a" strokeWidth="0.5" />
              <rect x="60" y="20" width="24" height="24" rx="1" fill="#ef4444" stroke="#0f172a" strokeWidth="0.5" />
              <rect x="86" y="18" width="26" height="26" rx="1" fill="#0284c7" stroke="#0f172a" strokeWidth="0.5" />
              <rect x="114" y="20" width="26" height="24" rx="1" fill="#10b981" stroke="#0f172a" strokeWidth="0.5" />
              <rect x="142" y="18" width="26" height="26" rx="1" fill="#8b5cf6" stroke="#0f172a" strokeWidth="0.5" />
              <rect x="170" y="22" width="22" height="22" rx="1" fill="#d97706" stroke="#0f172a" strokeWidth="0.5" />
            </g>
          ) : category === 'lng' ? (
            <g>
              <path d="M 45 44 A 14 14 0 0 1 73 44 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
              <path d="M 80 44 A 14 14 0 0 1 108 44 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
              <path d="M 115 44 A 14 14 0 0 1 143 44 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
              <path d="M 150 44 A 14 14 0 0 1 178 44 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
              <line x1="40" y1="42" x2="185" y2="42" stroke="#38bdf8" strokeWidth="1" />
            </g>
          ) : (
            <g>
              <line x1="70" y1="44" x2="70" y2="30" stroke="#94a3b8" strokeWidth="2" />
              <line x1="70" y1="30" x2="90" y2="34" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="130" y1="44" x2="130" y2="30" stroke="#94a3b8" strokeWidth="2" />
              <line x1="130" y1="30" x2="150" y2="34" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="40" y="40" width="145" height="4" fill="#334155" />
              <rect x="85" y="36" width="30" height="5" fill="#f59e0b" rx="1" />
            </g>
          )}

          {/* Lower Hull (Bulbous Bow, Waterline & Stern) */}
          <path d="M 14 44 C 18 44, 25 45, 30 47 L 245 47 L 242 55 C 235 59, 215 60, 190 60 L 40 60 C 22 60, 16 56, 12 50 C 10 47, 11 44, 14 44 Z"
            fill="#0f172a" stroke="#334155" strokeWidth="1" />
          {/* Antifouling Red Bottom Coating */}
          <path d="M 12 50 C 16 56, 22 60, 40 60 L 190 60 C 215 60, 235 59, 242 55 L 243 57 C 235 62, 210 63, 185 63 L 38 63 C 18 63, 11 58, 8 52 Z"
            fill="#c0392b" />
          {/* Waterline Stripe */}
          <line x1="14" y1="48" x2="244" y2="48" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />

          {/* Hull Vessel Name Marking */}
          <text x="32" y="54" fill="#ffffff" fontSize="6" fontFamily="'JetBrains Mono',monospace" fontWeight="700" letterSpacing="0.5">
            {ship.name.toUpperCase()}
          </text>
        </svg>

        {/* Dynamic Ocean Wave Water Line */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '14px',
          background: 'linear-gradient(180deg, rgba(6,182,212,0.3) 0%, rgba(10,95,168,0.7) 100%)',
          borderTop: '1.5px solid rgba(255,255,255,0.4)',
          zIndex: 3
        }}>
          <div style={{
            position: 'absolute', top: '-4px', left: '10px', width: '70px', height: '2px',
            background: 'rgba(255,255,255,0.7)', borderRadius: '2px'
          }} />
          <div style={{
            position: 'absolute', top: '-2px', right: '30px', width: '90px', height: '2px',
            background: 'rgba(255,255,255,0.5)', borderRadius: '2px'
          }} />
        </div>
      </div>

      {/* Bottom Technical Spec Bar */}
      <div style={{
        padding: '6px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.45)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: '10px', color: '#94a3b8',
        fontFamily: 'var(--font-mono)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Ruler style={{ width: '11px', height: '11px', color: '#94a3b8' }} />
          {reg.dimensions || '333m × 60m'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Scale style={{ width: '11px', height: '11px', color: '#94a3b8' }} />
          {reg.grossTonnage || '160,200 GT'}
        </span>
        <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Anchor style={{ width: '11px', height: '11px' }} />
          {reg.operator ? reg.operator.split(' ')[0] : 'Naval'}
        </span>
      </div>
    </div>
  );
}

export function ShipDetailsDrawer({
  ship,
  ports = [],
  onClose,
  onOpenDirectives,
  role = 'COMMAND',
  allShips = [],
  onIssueDirective
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [alternatives, setAlternatives] = useState([]);
  const [loadingAlts, setLoadingAlts] = useState(false);

  useEffect(() => {
    if (!ship?.shipId) return;
    setLoadingAlts(true);
    fetch(`http://localhost:3001/api/routes/${ship.shipId}/alternatives`)
      .then(res => res.json())
      .then(data => {
        setAlternatives(data.alternatives || []);
        setLoadingAlts(false);
      })
      .catch(() => setLoadingAlts(false));
  }, [ship?.shipId]);

  if (!ship) return null;

  const cfg = STATUS_CFG[ship.status] || STATUS_CFG.normal;
  const reg = VESSEL_REGISTRY[ship.shipId] || {};
  const destPort = ports.find(p => p.portId === ship.destination || p.id === ship.destination);
  const fuelPct = Math.min(100, Math.max(0, Math.round((ship.fuel / (ship.maxFuel || 10000)) * 100)));
  const fuelColor = fuelPct < 20 ? 'var(--red)' : fuelPct < 40 ? 'var(--amber)' : 'var(--green)';
  const fuelGrad = fuelPct < 20
    ? 'linear-gradient(90deg, #c0392b, #e74c3c)'
    : fuelPct < 40
    ? 'linear-gradient(90deg, #b45309, #f59e0b)'
    : 'linear-gradient(90deg, #0a5fa8, #0f7743)';
  const isAdverse = Boolean(ship.isAdverseWeather);

  const predictions = computePredictions(ship, allShips, []);

  // Filter nearest ships for Ship-to-Ship assist
  const nearbyShips = allShips
    .filter(s => s.shipId !== ship.shipId && s.status === 'normal')
    .map(s => {
      const dLat = (s.position[0] - ship.position[0]) * 111;
      const dLng = (s.position[1] - ship.position[1]) * 111;
      return { ...s, distKm: Math.round(Math.sqrt(dLat * dLat + dLng * dLng)) };
    })
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 3);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'ais',      label: 'AIS Specs' },
    { id: 'routes',   label: 'Routes' },
    { id: 'assist',   label: 'S2S Assist', show: role === 'COMMAND' },
  ].filter(t => t.show !== false);

  return (
    <div
      className="animate-slide-left"
      style={{
        width: '320px', flexShrink: 0, height: '100%',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-md)',
        zIndex: 10
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '14px 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0
      }}>
        {/* Accent line */}
        <div style={{
          height: '2px', borderRadius: '2px', marginBottom: '12px',
          background: 'linear-gradient(90deg, var(--blue), var(--blue-light), transparent)'
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
              {reg.flag ? <span style={{ fontSize: '14px' }}>{reg.flag}</span> : <ShipIcon style={{ width: '14px', height: '14px', color: 'var(--blue)' }} />}
              <span style={{
                fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: 'var(--blue)', background: 'var(--blue-muted)',
                border: '1px solid var(--blue-border)', borderRadius: 'var(--r-sm)', padding: '2px 7px'
              }}>
                {ship.shipId}
              </span>
              <span style={{
                fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 800,
                color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                borderRadius: 'var(--r-sm)', padding: '2px 7px', letterSpacing: '0.04em'
              }}>
                {cfg.label}
              </span>
            </div>

            {/* Ship Name */}
            <h2 style={{
              fontSize: '18px', fontWeight: 800, color: 'var(--text)',
              fontFamily: 'var(--font)', letterSpacing: '-0.02em',
              margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {ship.name}
            </h2>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font)', marginTop: '2px', fontWeight: 500 }}>
              {reg.vesselType || ship.cargo} · {reg.flagName || 'Commercial'}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close ship details"
            style={{
              flexShrink: 0, padding: '6px',
              borderRadius: 'var(--r-sm)', cursor: 'pointer',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text-3)', transition: 'all var(--t)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--red-bg)';
              e.currentTarget.style.color = 'var(--red)';
              e.currentTarget.style.borderColor = 'var(--red-border)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface-2)';
              e.currentTarget.style.color = 'var(--text-3)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <X style={{ width: '15px', height: '15px' }} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: '4px 10px', borderRadius: 'var(--r-full)',
                fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 600,
                cursor: 'pointer', transition: 'all var(--t)',
                background: activeTab === id ? 'var(--blue)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--text-2)',
                border: `1px solid ${activeTab === id ? 'var(--blue)' : 'var(--border)'}`,
                boxShadow: activeTab === id ? 'var(--shadow-xs)' : 'none'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            <StatusBanner status={ship.status} distressReason={ship.distressReason} />

            {/* Realistic Maritime Vessel Visual Card */}
            <VesselVisualCard ship={ship} reg={reg} />

            {/* Predictive Alerts */}
            {predictions.length > 0 && (
              <div style={{
                padding: '10px 12px', borderRadius: 'var(--r-md)',
                background: 'var(--purple-bg)', border: '1px solid var(--purple-border)'
              }}>
                <div style={{
                  fontSize: '10px', fontFamily: 'var(--font)', fontWeight: 800,
                  color: 'var(--purple)', letterSpacing: '0.04em', marginBottom: '6px',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <Zap style={{ width: '11px', height: '11px' }} />
                  PREDICTIVE ALERTS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {predictions.map(p => (
                    <div key={p.id} style={{
                      fontSize: '11px', color: 'var(--text)', lineHeight: 1.4,
                      display: 'flex', alignItems: 'flex-start', gap: '6px',
                      fontFamily: 'var(--font)'
                    }}>
                      <p.icon style={{ width: '12px', height: '12px', color: p.color, flexShrink: 0, marginTop: '2px' }} />
                      <span>{p.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <MetricTile icon={Gauge}      label="Speed (SOG)"  value={Math.round(ship.speed)} unit="kts" />
              <MetricTile icon={Compass}    label="Course (COG)" value={`${Math.round(ship.heading)}°`} unit="N" iconColor="var(--blue)" />
              <MetricTile icon={Package}    label="Cargo"        value={ship.cargo} iconColor="var(--amber)" />
              <MetricTile icon={Navigation} label="Destination"  value={destPort?.name || ship.destination || '---'} iconColor="var(--green)" />
            </div>

            {/* GPS Coordinates */}
            <div style={{
              padding: '9px 12px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin style={{ width: '12px', height: '12px', color: 'var(--blue)' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  GPS Position
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--blue)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {ship.position[0].toFixed(4)}°N {ship.position[1].toFixed(4)}°E
              </span>
            </div>

            {/* Fuel Gauge */}
            <div style={{
              padding: '12px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)',
              border: `1px solid ${fuelPct < 25 ? 'var(--red-border)' : 'var(--border)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Fuel style={{ width: '13px', height: '13px', color: 'var(--amber)' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Fuel Reserves
                  </span>
                </div>
                <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: fuelColor }}>
                  {Math.round(ship.fuel)} t
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{
                background: 'var(--border)', borderRadius: 'var(--r-full)', height: '8px',
                overflow: 'hidden', marginBottom: '10px'
              }}>
                <div style={{
                  height: '100%', width: `${fuelPct}%`,
                  background: fuelGrad, borderRadius: 'var(--r-full)',
                  transition: 'width 0.5s ease',
                }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                {[
                  { label: 'Level',   val: `${fuelPct}%`,   color: fuelColor },
                  { label: 'To Port', val: `~${ship.requiredFuelToPort || '---'}t`, color: 'var(--text-2)' },
                  { label: 'Status',  val: ship.status === 'insufficient_fuel' ? 'LOW' : 'OPTIMAL', color: ship.status === 'insufficient_fuel' ? 'var(--amber)' : 'var(--green)' }
                ].map(({ label, val, color }) => (
                  <div key={label} style={{
                    background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '6px 8px',
                    border: '1px solid var(--border)', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '11px', color, fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather Alert */}
            <div style={{
              padding: '10px 12px', borderRadius: 'var(--r-md)',
              background: isAdverse ? 'var(--amber-bg)' : 'var(--surface-2)',
              border: isAdverse ? '1px solid var(--amber-border)' : '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Wind style={{ width: '13px', height: '13px', color: isAdverse ? 'var(--amber)' : 'var(--blue)' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Marine Weather
                  </span>
                </div>
                {isAdverse && (
                  <span style={{
                    fontSize: '9px', fontFamily: 'var(--font)', fontWeight: 700,
                    color: 'var(--amber)', background: 'var(--amber-bg)',
                    border: '1px solid var(--amber-border)', borderRadius: 'var(--r-full)', padding: '2px 8px'
                  }}>
                    +30% Fuel Penalty
                  </span>
                )}
              </div>
              <p style={{
                fontSize: '11px', color: isAdverse ? 'var(--amber)' : 'var(--text-2)',
                lineHeight: 1.45, margin: 0, fontFamily: 'var(--font)'
              }}>
                {ship.weatherDetails || 'Calm to moderate seas (Wind < 20 kts, Swell < 1.5m)'}
              </p>
            </div>
          </>
        )}

        {/* ── AIS SPECS TAB (Real-World Marine Registry) ── */}
        {activeTab === 'ais' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* AIS Transponder Banner */}
            <div style={{
              padding: '10px 12px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Radio style={{ width: '14px', height: '14px', color: 'var(--blue)' }} />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                  Class A VHF Marine AIS
                </span>
              </div>
              <span style={{
                fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 800,
                color: 'var(--green)', background: 'var(--green-bg)',
                border: '1px solid var(--green-border)', borderRadius: 'var(--r-full)', padding: '2px 8px'
              }}>
                ONLINE · 12.5 W
              </span>
            </div>

            {/* Vessel Identity Card */}
            <div style={{
              padding: '12px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: '7px'
            }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Official Maritime Identification
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', fontFamily: 'var(--font)' }}>
                <div><strong>IMO:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{reg.imo || '9812450'}</span></div>
                <div><strong>MMSI:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{reg.mmsi || '636018241'}</span></div>
                <div><strong>Call Sign:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{reg.callSign || 'V7GQ8'}</span></div>
                <div><strong>Flag:</strong> {reg.flag} {reg.flagName || 'Liberia'}</div>
                <div><strong>Built Year:</strong> {reg.builtYear || '2020'}</div>
                <div><strong>Home Port:</strong> {reg.homePort || 'Monrovia'}</div>
              </div>
            </div>

            {/* Vessel Dimensions & Capacity */}
            <div style={{
              padding: '12px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: '7px'
            }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Dimensions & Tonnage
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', fontFamily: 'var(--font)' }}>
                <div><strong>Dimensions:</strong> {reg.dimensions || '333m × 60m'}</div>
                <div><strong>Draught:</strong> {reg.draught || '16.5m'}</div>
                <div><strong>Gross Tonnage:</strong> {reg.grossTonnage || '160,200 GT'}</div>
                <div><strong>Deadweight:</strong> {reg.deadweight || '318,500 DWT'}</div>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font)', marginTop: '2px', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                <strong>Fleet Operator:</strong> {reg.operator || 'Commercial Tanker Management'}
              </div>
            </div>

            {/* Voyage History & Tracking */}
            <div style={{
              padding: '12px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Current Voyage Transit
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontFamily: 'var(--font)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send style={{ width: '12px', height: '12px', color: 'var(--blue)' }} />
                  <span><strong>Departure:</strong> {reg.departurePort || 'Ras Tanura'} ({reg.departureTime || '12h ago'})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Anchor style={{ width: '12px', height: '12px', color: 'var(--green)' }} />
                  <span><strong>Destination:</strong> {destPort?.name || ship.destination || 'Muscat'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass style={{ width: '12px', height: '12px', color: 'var(--amber)' }} />
                  <span><strong>True Heading:</strong> {Math.round(ship.heading)}° (Gyro Synchronized)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap style={{ width: '12px', height: '12px', color: 'var(--blue)' }} />
                  <span><strong>Speed Over Ground:</strong> {Math.round(ship.speed)} kts (GPS Doppler)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ROUTES TAB ── */}
        {activeTab === 'routes' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Route style={{ width: '13px', height: '13px', color: 'var(--blue)' }} />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                  Alternative Route Trajectories
                </span>
              </div>
              {loadingAlts ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ height: '70px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
                  ))}
                </div>
              ) : alternatives.length === 0 ? (
                <p style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font)', padding: '12px 0' }}>
                  No alternative routes computed for this vessel.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {alternatives.map((alt, idx) => (
                    <div
                      key={alt.id}
                      style={{
                        padding: '10px 12px', borderRadius: 'var(--r-md)',
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        cursor: 'pointer', transition: 'all var(--t)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--blue-border)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {idx === 0 ? <CheckCircle style={{ width: '12px', height: '12px', color: 'var(--green)' }} /> :
                           idx === 1 ? <Sun style={{ width: '12px', height: '12px', color: 'var(--amber)' }} /> :
                           <Zap style={{ width: '12px', height: '12px', color: 'var(--blue)' }} />}
                          {alt.name}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--blue)', fontWeight: 800 }}>
                          {alt.distanceKm} km
                        </span>
                      </div>
                      <div style={{
                        display: 'flex', gap: '10px', fontSize: '10px',
                        fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginBottom: '4px'
                      }}>
                        <span><Clock style={{ width: '10px', height: '10px', display: 'inline', marginRight: '3px' }} />{alt.etaHours}h</span>
                        <span><Fuel style={{ width: '10px', height: '10px', display: 'inline', marginRight: '3px' }} />~{alt.fuelEstTons}t</span>
                        <span style={{ color: alt.riskLevel === 'LOW' || alt.riskLevel === 'VERY LOW' ? 'var(--green)' : 'var(--amber)' }}>
                          ● {alt.riskLevel}
                        </span>
                      </div>
                      {alt.description && (
                        <p style={{ fontSize: '11px', color: 'var(--text-2)', margin: 0, lineHeight: 1.4, fontFamily: 'var(--font)' }}>
                          {alt.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ASSIST TAB (Ship-to-Ship) ── */}
        {activeTab === 'assist' && role === 'COMMAND' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Users style={{ width: '13px', height: '13px', color: 'var(--blue)' }} />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                  Nearby Vessels (for Mutual Aid)
                </span>
              </div>
              {nearbyShips.length === 0 ? (
                <p style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font)' }}>
                  No operational fleet vessels within immediate range.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {nearbyShips.map(nearby => (
                    <div
                      key={nearby.shipId}
                      style={{
                        padding: '10px 12px', borderRadius: 'var(--r-md)',
                        background: 'var(--surface-2)', border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                            {nearby.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                            {nearby.distKm} km · {nearby.speed} kts · {Math.round(nearby.fuel)}t fuel
                          </div>
                        </div>
                        <span style={{
                          fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                          color: 'var(--green)', background: 'var(--green-bg)',
                          border: '1px solid var(--green-border)', borderRadius: 'var(--r-sm)', padding: '2px 7px'
                        }}>
                          NORMAL
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                        {['FUEL TRANSFER', 'ESCORT', 'MEDICAL AID', 'CARGO OFFLOAD'].map(action => (
                          <button
                            key={action}
                            onClick={() => {
                              const msg = `Ship-to-ship ${action.toLowerCase()} request from ${ship.name} to ${nearby.name}`;
                              if (onIssueDirective) {
                                onIssueDirective(nearby.shipId, {
                                  type: 'DIVERT_WAYPOINT',
                                  waypoint: ship.position,
                                  notes: msg
                                });
                              }
                            }}
                            style={{
                              padding: '5px 8px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                              fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                              background: 'var(--blue-muted)',
                              color: 'var(--blue)', border: '1px solid var(--blue-border)',
                              transition: 'all var(--t)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'var(--blue)';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'var(--blue-muted)';
                              e.currentTarget.style.color = 'var(--blue)';
                            }}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer: Issue Directive Button ── */}
      {role === 'COMMAND' && activeTab === 'overview' && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0
        }}>
          <button
            onClick={onOpenDirectives}
            style={{
              width: '100%', padding: '11px 18px',
              borderRadius: 'var(--r-md)', cursor: 'pointer',
              fontSize: '12px', fontFamily: 'var(--font)',
              fontWeight: 700, letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'var(--blue)', color: 'white',
              border: 'none', boxShadow: 'var(--shadow-blue)',
              transition: 'all var(--t)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--blue)'}
          >
            <Navigation style={{ width: '14px', height: '14px' }} />
            Issue Course Directive
            <ArrowRight style={{ width: '13px', height: '13px' }} />
          </button>
        </div>
      )}
    </div>
  );
}
