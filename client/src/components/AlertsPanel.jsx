import React, { useState } from 'react';
import {
  AlertTriangle, ShieldAlert, Volume2, VolumeX, CheckCircle,
  Flame, Fuel, Crosshair, Clock, Zap, ChevronDown, Check
} from 'lucide-react';

/* ── Alert type config using unified design tokens ── */
const ALERT_CFG = {
  GEOFENCE_BREACH:   { label: 'Geofence Breach',    icon: ShieldAlert,   accent: 'var(--red)',   accentBg: 'var(--red-bg)',   accentBorder: 'var(--red-border)' },
  MAYDAY_DISTRESS:   { label: 'MAYDAY / SOS',        icon: Flame,         accent: 'var(--red)',   accentBg: 'var(--red-bg)',   accentBorder: 'var(--red-border)' },
  PROXIMITY_WARNING: { label: 'Proximity Warning',   icon: Crosshair,     accent: 'var(--amber)', accentBg: 'var(--amber-bg)', accentBorder: 'var(--amber-border)' },
  INSUFFICIENT_FUEL: { label: 'Low Fuel Alert',      icon: Fuel,          accent: 'var(--amber)', accentBg: 'var(--amber-bg)', accentBorder: 'var(--amber-border)' },
  FUEL_EXHAUSTED:    { label: 'Fuel Exhausted',      icon: Fuel,          accent: 'var(--red)',   accentBg: 'var(--red-bg)',   accentBorder: 'var(--red-border)' },
  VESSEL_STRANDED:   { label: 'Vessel Stranded',     icon: AlertTriangle, accent: 'var(--red)',   accentBg: 'var(--red-bg)',   accentBorder: 'var(--red-border)' },
  PREDICTIVE_ZONE:   { label: 'Predicted Zone Entry',icon: Zap,           accent: 'var(--purple)',accentBg: 'var(--purple-bg)',accentBorder: 'var(--purple-border)' },
};

const PRIORITY_ORDER = {
  MAYDAY_DISTRESS: 0, GEOFENCE_BREACH: 1, FUEL_EXHAUSTED: 2,
  VESSEL_STRANDED: 3, PROXIMITY_WARNING: 4, INSUFFICIENT_FUEL: 5, PREDICTIVE_ZONE: 6
};

/* ── Single alert card ── */
function AlertCard({ alert, onAcknowledge }) {
  const [expanded, setExpanded] = useState(alert.type === 'MAYDAY_DISTRESS');
  const cfg = ALERT_CFG[alert.type] || ALERT_CFG.PROXIMITY_WARNING;
  const { icon: Icon } = cfg;
  const isCritical = alert.severity === 'CRITICAL';

  const timeStr = new Date(alert.timestamp).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <div
      className="animate-fade-in"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${cfg.accent}`,
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow var(--t)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Card header */}
      <div
        style={{ padding: '10px 12px', cursor: alert.aiAnalysis ? 'pointer' : 'default' }}
        onClick={() => alert.aiAnalysis && setExpanded(v => !v)}
      >
        {/* Row 1: icon + type badge + time + ack */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '7px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: 'var(--r-sm)',
              background: cfg.accentBg, border: `1px solid ${cfg.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon style={{ width: '13px', height: '13px', color: cfg.accent }} />
            </div>
            <div>
              <span style={{
                fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 700,
                color: cfg.accent
              }}>{cfg.label}</span>
              {isCritical && (
                <span style={{
                  marginLeft: '6px', fontSize: '9px', fontFamily: 'var(--font-sans)',
                  fontWeight: 700, color: 'var(--red)',
                  background: 'var(--red-bg)', border: '1px solid var(--red-border)',
                  borderRadius: 'var(--r-full)', padding: '1px 7px',
                  animation: 'pulse-dot 1.5s infinite'
                }}>Critical</span>
              )}
            </div>
          </div>

          {/* Right: time + expand + ack */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{
              fontSize: '10px', fontFamily: 'var(--font-mono)',
              color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '3px'
            }}>
              <Clock style={{ width: '9px', height: '9px' }} />
              {timeStr}
            </span>
            {alert.aiAnalysis && (
              <ChevronDown style={{
                width: '12px', height: '12px', color: 'var(--text-3)',
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease'
              }} />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onAcknowledge(alert.id); }}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)', cursor: 'pointer', padding: '3px 9px',
                color: 'var(--text-3)', fontSize: '10px',
                fontFamily: 'var(--font-sans)', fontWeight: 600,
                transition: 'all var(--t)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)'; e.currentTarget.style.borderColor = 'var(--green-border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <Check style={{ width: '11px', height: '11px', display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
              ACK
            </button>
          </div>
        </div>

        {/* Vessel name */}
        {alert.shipName && (
          <div style={{
            fontSize: '12px', fontFamily: 'var(--font)',
            color: 'var(--text-2)', marginBottom: '4px',
            display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)', fontSize: '10px' }}>Vessel:</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{alert.shipName}</span>
            {alert.shipId && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', background: 'var(--surface-3)', padding: '0 5px', borderRadius: '4px', border: '1px solid var(--border)' }}>{alert.shipId}</span>}
          </div>
        )}

        {/* Message */}
        <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font)' }}>
          {alert.message}
        </p>

        {/* Proximity meter */}
        {alert.type === 'PROXIMITY_WARNING' && alert.distanceKm && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '8px', background: 'var(--amber-bg)',
            borderRadius: 'var(--r-sm)', padding: '5px 10px',
            border: '1px solid var(--amber-border)'
          }}>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>Separation</span>
            <span style={{ fontSize: '12px', color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {alert.distanceKm} km <span style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 400 }}>/ 2.0 km limit</span>
            </span>
          </div>
        )}
      </div>

      {/* AI Analysis — collapsible */}
      {expanded && alert.aiAnalysis && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 12px',
          background: 'var(--surface-2)',
          animation: 'fadeInDown 0.2s ease-out'
        }}>
          {/* Impact grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '8px' }}>
            {[
              { k: 'Incident', v: alert.aiAnalysis.incidentType },
              { k: 'Severity', v: alert.aiAnalysis.severity,
                c: alert.aiAnalysis.severity === 'CRITICAL' ? 'var(--red)' : 'var(--amber)' },
              { k: 'Injured', v: `${alert.aiAnalysis.quantifiableImpact?.injuries || 0}` },
              { k: 'Hull Damage', v: `${alert.aiAnalysis.quantifiableImpact?.damagePercent || 0}%` },
            ].map(({ k, v, c }) => (
              <div key={k} style={{
                background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '6px 9px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{k}</div>
                <div style={{ fontSize: '11px', color: c || 'var(--text)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Risk flags */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {alert.aiAnalysis.quantifiableImpact?.sinkingRisk && <RiskFlag label="Sinking Risk" />}
            {alert.aiAnalysis.quantifiableImpact?.propulsionLost && <RiskFlag label="Propulsion Lost" />}
            {alert.aiAnalysis.quantifiableImpact?.fuelLeak && <RiskFlag label="Fuel Leak" color="var(--amber)" bg="var(--amber-bg)" border="var(--amber-border)" />}
          </div>

          {/* AI recommendation */}
          <div style={{
            background: 'var(--blue-muted)', border: '1px solid var(--blue-border)',
            borderRadius: 'var(--r-sm)', padding: '8px 10px'
          }}>
            <div style={{
              fontSize: '9px', color: 'var(--blue)', fontFamily: 'var(--font-sans)',
              fontWeight: 700, letterSpacing: '0.07em', marginBottom: '4px',
              display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase'
            }}>
              <Zap style={{ width: '9px', height: '9px' }} />
              AI Tactical Recommendation
            </div>
            <p style={{ fontSize: '12px', color: 'var(--blue)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font)' }}>
              {alert.aiAnalysis.recommendedAction}
            </p>
          </div>

          {alert.aiAnalysis.summary && (
            <p style={{
              fontSize: '11px', color: 'var(--text-2)', marginTop: '7px',
              lineHeight: 1.5, fontFamily: 'var(--font)'
            }}>
              {alert.aiAnalysis.summary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RiskFlag({ label, color = 'var(--red)', bg = 'var(--red-bg)', border = 'var(--red-border)' }) {
  return (
    <span style={{
      fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 600,
      color, background: bg, border: `1px solid ${border}`,
      borderRadius: 'var(--r-full)', padding: '2px 9px',
      display: 'inline-flex', alignItems: 'center', gap: '3px'
    }}>
      <AlertTriangle style={{ width: '10px', height: '10px' }} />
      {label}
    </span>
  );
}

/* ── Main panel ── */
export function AlertsPanel({ alerts = [], onAcknowledge, isMuted, onToggleMute }) {
  const [filter, setFilter] = useState('ALL');

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const sorted = [...alerts].sort((a, b) =>
    (PRIORITY_ORDER[a.type] ?? 9) - (PRIORITY_ORDER[b.type] ?? 9)
  );
  const filtered = filter === 'ALL' ? sorted
    : filter === 'CRITICAL' ? sorted.filter(a => a.severity === 'CRITICAL')
    : sorted.filter(a => a.type === filter);

  return (
    <div
      className="animate-slide-right"
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-4px 0 20px rgba(13,27,42,0.06)'
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {/* Red/green accent bar */}
        <div style={{
          height: '3px', borderRadius: '2px', marginBottom: '14px',
          background: alerts.length > 0
            ? 'linear-gradient(90deg, var(--red), var(--amber), transparent)'
            : 'linear-gradient(90deg, var(--green), transparent)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Icon badge */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '36px', height: '36px',
                background: alerts.length > 0 ? 'var(--red-bg)' : 'var(--green-bg)',
                border: `1px solid ${alerts.length > 0 ? 'var(--red-border)' : 'var(--green-border)'}`,
                borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldAlert style={{
                  width: '16px', height: '16px',
                  color: alerts.length > 0 ? 'var(--red)' : 'var(--green)'
                }} />
              </div>
              {alerts.length > 0 && (
                <div className="pulse-alert" style={{
                  position: 'absolute', top: '-5px', right: '-5px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: criticalCount > 0 ? 'var(--red)' : 'var(--amber)',
                  border: '2px solid var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', color: 'white', fontWeight: 800,
                  fontFamily: 'var(--font-mono)'
                }}>
                  {alerts.length > 9 ? '9+' : alerts.length}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Crisis Alerts
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)', marginTop: '1px' }}>
                {alerts.length === 0
                  ? 'All sectors secure'
                  : `${criticalCount > 0 ? `${criticalCount} critical · ` : ''}${alerts.length} active`}
              </div>
            </div>
          </div>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute alarms' : 'Mute alarms'}
            style={{
              padding: '8px', borderRadius: 'var(--r-md)', cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              color: isMuted ? 'var(--text-3)' : 'var(--blue)',
              transition: 'all var(--t)', boxShadow: 'var(--shadow-xs)'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-xs)'}
          >
            {isMuted
              ? <VolumeX style={{ width: '14px', height: '14px' }} />
              : <Volume2 style={{ width: '14px', height: '14px' }} />
            }
          </button>
        </div>

        {/* Filter tabs */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', gap: '5px' }}>
            {[
              { id: 'ALL',      label: `All (${alerts.length})` },
              { id: 'CRITICAL', label: `Critical (${criticalCount})` },
            ].map(({ id, label }) => (
              <button
                key={id} onClick={() => setFilter(id)}
                style={{
                  padding: '4px 12px', borderRadius: 'var(--r-full)', cursor: 'pointer',
                  fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600,
                  background: filter === id ? 'var(--blue)' : 'transparent',
                  color: filter === id ? 'white' : 'var(--text-3)',
                  border: `1px solid ${filter === id ? 'var(--blue)' : 'var(--border)'}`,
                  transition: 'all var(--t)'
                }}
              >{label}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Alert Feed ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '200px', gap: '14px'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'var(--green-bg)', border: '2px solid var(--green-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle style={{ width: '26px', height: '26px', color: 'var(--green)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--green)', fontFamily: 'var(--font)', fontWeight: 700, margin: '0 0 4px' }}>
                All Sectors Secure
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0, fontFamily: 'var(--font-sans)' }}>
                No active alerts or hazards
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(alert => (
              <AlertCard key={alert.id} alert={alert} onAcknowledge={onAcknowledge} />
            ))}
          </div>
        )}
      </div>

      {/* ── Acknowledge All ── */}
      {alerts.length > 1 && (
        <div style={{
          padding: '10px 12px', borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)', flexShrink: 0
        }}>
          <button
            onClick={() => alerts.forEach(a => onAcknowledge(a.id))}
            style={{
              width: '100%', padding: '9px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-2)', fontSize: '12px',
              fontFamily: 'var(--font)', fontWeight: 600,
              transition: 'all var(--t)', boxShadow: 'var(--shadow-xs)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'var(--shadow-blue)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
          >
            Acknowledge All ({alerts.length})
          </button>
        </div>
      )}
    </div>
  );
}
