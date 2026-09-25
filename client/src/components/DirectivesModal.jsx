import React, { useState } from 'react';
import { X, Navigation, Send, Anchor, MapPin, Zap } from 'lucide-react';

const FLabel = ({ children }) => (
  <label style={{
    display: 'block', marginBottom: '6px',
    fontSize: '10px', fontFamily: "var(--font-sans)",
    fontWeight: 600, color: 'var(--text-3)',
    letterSpacing: '0.06em', textTransform: 'uppercase'
  }}>
    {children}
  </label>
);

const FInput = ({ type = 'text', value, onChange, min, max, step, placeholder }) => (
  <input
    type={type} value={value} onChange={onChange}
    min={min} max={max} step={step} placeholder={placeholder}
    style={{
      width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)', background: 'var(--surface-2)',
      color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '13px', outline: 'none',
    }}
    onFocus={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(10,95,168,0.10)'; }}
    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
  />
);

const FSelect = ({ value, onChange, children }) => (
  <select
    value={value} onChange={onChange}
    style={{
      width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)', background: 'var(--surface-2)',
      color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '13px',
      outline: 'none', cursor: 'pointer',
    }}
  >
    {children}
  </select>
);

export function DirectivesModal({ ship, ports, onClose, onIssueDirective }) {
  const [directiveType, setDirectiveType] = useState('REROUTE_PORT');
  const [selectedPortId, setSelectedPortId] = useState(ports[0]?.id || '');
  const [waypointLat, setWaypointLat] = useState(ship.position[0].toFixed(4));
  const [waypointLng, setWaypointLng] = useState(ship.position[1].toFixed(4));
  const [speedKnots, setSpeedKnots] = useState(ship.speed);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const directive = { type: directiveType, speedKnots: Number(speedKnots), notes };
    if (directiveType === 'REROUTE_PORT') directive.targetPortId = selectedPortId;
    else if (directiveType === 'DIVERT_WAYPOINT') directive.waypoint = [Number(waypointLat), Number(waypointLng)];
    onIssueDirective(ship.shipId, directive);
    onClose();
  };

  const TYPES = [
    { id: 'REROUTE_PORT',    label: 'Reroute',  sub: 'to Port',    Icon: Anchor },
    { id: 'DIVERT_WAYPOINT', label: 'Divert',   sub: 'Waypoint',   Icon: MapPin },
    { id: 'CHANGE_SPEED',    label: 'Speed',    sub: 'Adjustment', Icon: Zap },
  ];

  return (
    /* Backdrop */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(13,27,42,0.55)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '16px'
    }}>
      {/* Modal card */}
      <div className="animate-fade-in" style={{
        width: '100%', maxWidth: '460px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden'
      }}>

        {/* Blue top accent */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--blue), var(--blue-light), transparent)' }} />

        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px',
              background: 'var(--blue-muted)',
              border: '1px solid var(--blue-border)',
              borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-blue)'
            }}>
              <Navigation style={{ width: '18px', height: '18px', color: 'var(--blue)' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '16px', fontFamily: 'var(--font)',
                fontWeight: 800, color: 'var(--text)',
                margin: 0, letterSpacing: '-0.02em'
              }}>
                Fleet Directive Dispatch
              </h3>
              <p style={{
                fontSize: '11px', fontFamily: 'var(--font-sans)',
                color: 'var(--text-3)', margin: '2px 0 0'
              }}>
                Target: <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{ship.name} · {ship.shipId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '7px', borderRadius: 'var(--r-md)', cursor: 'pointer',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text-3)', transition: 'all var(--t)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red-border)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Directive Type */}
          <div>
            <FLabel>Directive Type</FLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {TYPES.map(({ id, label, sub, Icon }) => (
                <button
                  key={id} type="button" onClick={() => setDirectiveType(id)}
                  style={{
                    padding: '12px 8px', borderRadius: 'var(--r-md)',
                    border: `1px solid ${directiveType === id ? 'var(--blue-border)' : 'var(--border)'}`,
                    background: directiveType === id ? 'var(--blue-muted)' : 'var(--surface-2)',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all var(--t)',
                    boxShadow: directiveType === id ? 'var(--shadow-blue)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                    <Icon style={{ width: '18px', height: '18px', color: directiveType === id ? 'var(--blue)' : 'var(--text-3)' }} />
                  </div>
                  <div style={{
                    fontSize: '12px', fontFamily: 'var(--font)',
                    fontWeight: 700, color: directiveType === id ? 'var(--blue)' : 'var(--text-2)'
                  }}>{label}</div>
                  <div style={{
                    fontSize: '10px', fontFamily: 'var(--font-sans)',
                    color: directiveType === id ? 'var(--blue)' : 'var(--text-3)', marginTop: '2px'
                  }}>{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Port selector */}
          {directiveType === 'REROUTE_PORT' && (
            <div>
              <FLabel>Target Port</FLabel>
              <FSelect value={selectedPortId} onChange={e => setSelectedPortId(e.target.value)}>
                {ports.map(port => (
                  <option key={port.id} value={port.id}>{port.name}</option>
                ))}
              </FSelect>
            </div>
          )}

          {/* Waypoint coords */}
          {directiveType === 'DIVERT_WAYPOINT' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <FLabel>Latitude</FLabel>
                <FInput type="number" value={waypointLat} onChange={e => setWaypointLat(e.target.value)} step="0.0001" placeholder="e.g. 26.500" />
              </div>
              <div>
                <FLabel>Longitude</FLabel>
                <FInput type="number" value={waypointLng} onChange={e => setWaypointLng(e.target.value)} step="0.0001" placeholder="e.g. 56.800" />
              </div>
            </div>
          )}

          {/* Speed */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <FLabel>Ordered Speed</FLabel>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--blue)' }}>
                {speedKnots} kts
              </span>
            </div>
            <input
              type="range" min="0" max="25" step="0.5" value={speedKnots}
              onChange={e => setSpeedKnots(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--blue)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)', marginTop: '4px' }}>
              <span>0 kts — Stop</span>
              <span>25 kts — Full Speed</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <FLabel>Operational Notes (optional)</FLabel>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add tactical context for this directive..."
              rows={2}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)', background: 'var(--surface-2)',
                color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '13px',
                outline: 'none', resize: 'vertical', minHeight: '64px', lineHeight: 1.5
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button" onClick={onClose}
              style={{
                flex: 1, padding: '11px', borderRadius: 'var(--r-md)',
                cursor: 'pointer', fontSize: '13px',
                fontFamily: 'var(--font)', fontWeight: 600,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text-3)', transition: 'all var(--t)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-3)'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 2, padding: '11px', borderRadius: 'var(--r-md)',
                cursor: 'pointer', fontSize: '13px',
                fontFamily: 'var(--font)', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'var(--blue)', color: 'white', border: '1px solid transparent',
                boxShadow: 'var(--shadow-blue)', transition: 'all var(--t)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--blue)'; }}
            >
              <Send style={{ width: '15px', height: '15px' }} />
              Transmit Directive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
