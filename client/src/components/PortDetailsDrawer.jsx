import React from 'react';
import {
  Anchor, X, Navigation, Wind, CheckCircle, ShieldAlert,
  Clock, Gauge, Compass, Fuel, ArrowRight, ExternalLink,
  Radio, Ship
} from 'lucide-react';
import { PORT_REGISTRY, VESSEL_REGISTRY } from '../data/maritimeDirectory.js';

export function PortDetailsDrawer({
  port,
  ships = [],
  onClose,
  onSelectShip,
  role,
  onOpenDirectivesForShip
}) {
  if (!port) return null;

  const portMeta = PORT_REGISTRY[port.id || port.portId] || {
    name: port.name,
    country: 'Persian Gulf',
    flag: null,
    locode: port.id,
    type: 'Commercial Marine Terminal',
    berths: 20,
    occupancy: '80%',
    weather: 'Fair · 29°C · Wind 12 kts',
    bunkering: 'Available',
    pilotage: 'Compulsory'
  };

  // Find all vessels destined for this port
  const incomingVessels = ships.filter(
    s => s.destination === port.id || s.destination === port.portId
  );

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
        {/* Accent Bar */}
        <div style={{
          height: '2px', borderRadius: '2px', marginBottom: '12px',
          background: 'linear-gradient(90deg, var(--blue), var(--blue-light), transparent)'
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Country & LOCODE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '15px' }}>{portMeta.flag}</span>
              <span style={{
                fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: 'var(--blue)', background: 'var(--blue-muted)',
                border: '1px solid var(--blue-border)', borderRadius: 'var(--r-sm)', padding: '1px 6px'
              }}>
                {portMeta.locode || port.id}
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 600, color: 'var(--text-3)' }}>
                {portMeta.country}
              </span>
            </div>

            {/* Port Name */}
            <h2 style={{
              fontSize: '18px', fontWeight: 800, color: 'var(--text)',
              fontFamily: 'var(--font)', margin: 0, letterSpacing: '-0.02em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {portMeta.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close port details"
            style={{
              padding: '6px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
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

        {/* Port Type Badge */}
        <div style={{
          marginTop: '8px', fontSize: '11px', color: 'var(--text-2)',
          fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: '5px'
        }}>
          <Anchor style={{ width: '12px', height: '12px', color: 'var(--blue)' }} />
          <span>{portMeta.type}</span>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Port Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '10px 12px'
          }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
              Active Berths
            </div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text)' }}>
              {portMeta.berths} Berths
            </div>
          </div>

          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '10px 12px'
          }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
              Occupancy
            </div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--amber)' }}>
              {portMeta.occupancy}
            </div>
          </div>
        </div>

        {/* GPS Coordinates */}
        <div style={{
          padding: '9px 12px', borderRadius: 'var(--r-md)',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Port Coordinates
          </span>
          <span style={{ fontSize: '11px', color: 'var(--blue)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {port.position ? `${port.position[0].toFixed(4)}°N ${port.position[1].toFixed(4)}°E` : '---'}
          </span>
        </div>

        {/* Local Maritime Weather */}
        <div style={{
          padding: '11px 13px', borderRadius: 'var(--r-md)',
          background: 'var(--surface-2)', border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Wind style={{ width: '13px', height: '13px', color: 'var(--blue)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Port Weather & Sea State
            </span>
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font)', color: 'var(--text)', lineHeight: 1.45 }}>
            {portMeta.weather}
          </div>
        </div>

        {/* Marine Services */}
        <div style={{
          padding: '11px 13px', borderRadius: 'var(--r-md)',
          background: 'var(--surface-2)', border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Terminal Services & Facilities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontFamily: 'var(--font)', color: 'var(--text-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Fuel style={{ width: '13px', height: '13px', color: 'var(--blue)' }} />
              <span><strong>Bunkering:</strong> {portMeta.bunkering}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass style={{ width: '13px', height: '13px', color: 'var(--amber)' }} />
              <span><strong>Pilotage:</strong> {portMeta.pilotage}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio style={{ width: '13px', height: '13px', color: 'var(--green)' }} />
              <span><strong>VHF Traffic:</strong> CH-12 / CH-16 (24/7 Radar Watch)</span>
            </div>
          </div>
        </div>

        {/* Incoming Fleet Vessels */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
              Inbound Fleet ({incomingVessels.length})
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
              ETA Tracked
            </span>
          </div>

          {incomingVessels.length === 0 ? (
            <div style={{
              padding: '16px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              textAlign: 'center', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font)'
            }}>
              No active fleet vessels currently destined for this port.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {incomingVessels.map(v => {
                const reg = VESSEL_REGISTRY[v.shipId] || {};
                const dLat = (v.position[0] - port.position[0]) * 111;
                const dLng = (v.position[1] - port.position[1]) * 111;
                const distKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
                const distNM = Math.round(distKm * 0.539957);
                const etaHours = v.speed > 0 ? (distNM / v.speed).toFixed(1) : '---';

                return (
                  <div
                    key={v.shipId}
                    onClick={() => onSelectShip && onSelectShip(v)}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {reg.flag ? <span>{reg.flag}</span> : <Ship style={{ width: '13px', height: '13px', color: 'var(--blue)' }} />}
                        <span style={{ fontSize: '13px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                          {v.name}
                        </span>
                        <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--blue)', background: 'var(--blue-muted)', padding: '1px 5px', borderRadius: '4px' }}>
                          {v.shipId}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 800,
                        color: v.status === 'normal' ? 'var(--green)' : v.status === 'distressed' ? 'var(--red)' : 'var(--amber)'
                      }}>
                        ● {v.status?.toUpperCase()}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)'
                    }}>
                      <span>{v.speed} kts · {v.cargo}</span>
                      <span>{distNM} NM (~{etaHours}h)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
