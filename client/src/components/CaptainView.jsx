import React, { useState, useRef } from 'react';
import {
  Radio, Send, AlertTriangle, Gauge, Fuel, Compass,
  Navigation, Wind, Activity, Signal, ChevronDown,
  CloudRain, Check, X, Flame, ShieldAlert, Crosshair, Wrench, AlertOctagon
} from 'lucide-react';

const CAPTAIN_DISTRESS_TEMPLATES = [
  {
    category: 'SECURITY',
    Icon: ShieldAlert,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    text: 'Drone attack on port bow! Hull breach confirmed. 2 crew injured. Requesting immediate naval escort.'
  },
  {
    category: 'FIRE',
    Icon: Flame,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.3)',
    text: 'Engine room fire — propulsion at 30%. Taking on water through hull crack. Medical evacuation urgently needed.'
  },
  {
    category: 'WEATHER',
    Icon: CloudRain,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.3)',
    text: 'Severe gale force winds, taking on water. Swell 4m+. Risk of capsizing. Request immediate SAR assistance.'
  },
  {
    category: 'PIRACY',
    Icon: Crosshair,
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.12)',
    border: 'rgba(220, 38, 38, 0.3)',
    text: 'Armed boarding by unidentified vessel. 3 crew held hostage. Fuel reserves critically low.'
  },
  {
    category: 'MECHANICAL',
    Icon: Wrench,
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(234, 179, 8, 0.3)',
    text: 'Engine failure — dead in water. Drifting into shipping lane. Tug assistance requested.'
  }
];

export function CaptainView({
  ships = [], selectedCaptainShipId, onSelectCaptainShip, onCaptainResponse, onTriggerAlarm
}) {
  const [distressMsg, setDistressMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [responseNote, setResponseNote] = useState('');
  const [showShipSelect, setShowShipSelect] = useState(false);
  const textareaRef = useRef(null);

  const captainShip = ships.find(s => s.shipId === selectedCaptainShipId) || ships[0];
  const fuelPct = captainShip ? Math.min(100, Math.round((captainShip.fuel / 9000) * 100)) : 0;
  const fuelColor = fuelPct < 15 ? 'var(--red)' : fuelPct < 35 ? 'var(--amber)' : 'var(--green)';
  const fuelGrad = fuelPct < 15
    ? 'linear-gradient(90deg, #c0392b, #e74c3c)'
    : fuelPct < 35
    ? 'linear-gradient(90deg, #b45309, #f59e0b)'
    : 'linear-gradient(90deg, #0a5fa8, #0f7743)';

  const handleSendDistress = async () => {
    if (!distressMsg.trim() || !captainShip) return;
    setSending(true);
    if (onTriggerAlarm) onTriggerAlarm('CRITICAL');
    try {
      const res = await fetch(
        `http://${window.location.hostname || 'localhost'}:3001/api/distress`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipId: captainShip.shipId, message: distressMsg })
        }
      );
      if (res.ok) {
        setSent(true);
        setDistressMsg('');
        setTimeout(() => setSent(false), 4000);
      }
    } catch (e) {
      console.error('Distress send failed:', e);
    }
    setSending(false);
  };

  const handleCaptainAction = (action) => {
    if (!captainShip) return;
    onCaptainResponse(captainShip.shipId, action, { notes: responseNote });
  };

  if (!captainShip) {
    return (
      <div style={{
        width: '300px', flexShrink: 0, height: '100%', padding: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        color: 'var(--text-3)', fontFamily: 'var(--font)', fontSize: '13px', textAlign: 'center'
      }}>
        No vessels assigned. Check server connection.
      </div>
    );
  }

  return (
    <div
      className="animate-slide-left"
      style={{
        width: '300px', flexShrink: 0, height: '100%',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-md)',
        zIndex: 10
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '14px 15px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0
      }}>
        {/* Amber accent line */}
        <div style={{
          height: '2px', borderRadius: '2px', marginBottom: '12px',
          background: 'linear-gradient(90deg, var(--amber), #f59e0b, transparent)'
        }} />

        {/* Radio + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ position: 'relative' }}>
            <img
              src="/logos/logo2_captain_badge.jpg"
              alt="Captain Insignia"
              style={{
                width: '38px', height: '38px',
                borderRadius: 'var(--r-md)',
                objectFit: 'cover',
                boxShadow: 'var(--shadow-sm)',
                border: '1.5px solid var(--amber-border)',
                display: 'block'
              }}
            />
            <div style={{
              position: 'absolute', bottom: '-1px', right: '-1px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: 'var(--green)',
              border: '2px solid var(--surface)'
            }} />
          </div>

          <div>
            <div style={{
              fontSize: '16px', fontFamily: 'var(--font)',
              fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em'
            }}>
              Captain Console
            </div>
            <div style={{
              fontSize: '10px', color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)', marginTop: '1px'
            }}>
              CH-16 · VHF Maritime Radio · Encrypted
            </div>
          </div>
        </div>

        {/* Ship Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowShipSelect(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderRadius: 'var(--r-md)',
              background: 'var(--amber-bg)',
              border: '1px solid var(--amber-border)',
              color: 'var(--amber)', cursor: 'pointer', transition: 'all var(--t)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation style={{ width: '13px', height: '13px' }} />
              <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '13px' }}>
                {captainShip.name}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-3)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                {captainShip.shipId}
              </span>
            </div>
            <ChevronDown style={{ width: '13px', height: '13px', transform: showShipSelect ? 'rotate(180deg)' : 'none', transition: 'transform var(--t)', flexShrink: 0 }} />
          </button>

          {showShipSelect && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '220px', overflowY: 'auto'
            }}>
              {ships.map(ship => (
                <button
                  key={ship.shipId}
                  onClick={() => { onSelectCaptainShip(ship.shipId); setShowShipSelect(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', border: 'none', cursor: 'pointer',
                    background: ship.shipId === selectedCaptainShipId ? 'var(--amber-bg)' : 'transparent',
                    color: ship.shipId === selectedCaptainShipId ? 'var(--amber)' : 'var(--text-2)',
                    transition: 'all var(--t)',
                    borderBottom: '1px solid var(--border)',
                    fontFamily: 'var(--font)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber-bg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ship.shipId === selectedCaptainShipId ? 'var(--amber-bg)' : 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                      background: ship.status === 'normal' ? 'var(--green)' : ship.status === 'distressed' ? 'var(--red)' : 'var(--amber)',
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font)' }}>
                      {ship.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                    {ship.shipId}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Ship Vitals ── */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
          {[
            { icon: Gauge,   label: 'Speed',   val: `${Math.round(captainShip.speed)} kts`, color: 'var(--blue)' },
            { icon: Compass, label: 'Heading', val: `${Math.round(captainShip.heading)}°N`, color: 'var(--purple)' },
          ].map(({ icon: Icon, label, val, color }) => (
            <div key={label} style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '9px 11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Icon style={{ width: '11px', height: '11px', color }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              </div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 800, color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Fuel */}
        <div style={{
          background: 'var(--surface-2)', border: `1px solid ${fuelPct < 25 ? 'var(--red-border)' : 'var(--border)'}`,
          borderRadius: 'var(--r-md)', padding: '9px 11px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Fuel style={{ width: '12px', height: '12px', color: 'var(--amber)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fuel Level</span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: fuelColor }}>
              {Math.round(captainShip.fuel)}t ({fuelPct}%)
            </span>
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${fuelPct}%`,
              background: fuelGrad,
              borderRadius: 'var(--r-full)', transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Status + Weather badges */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '10px', fontFamily: 'var(--font)', fontWeight: 700,
            padding: '3px 10px', borderRadius: 'var(--r-full)',
            background: captainShip.status === 'normal' ? 'var(--green-bg)' : captainShip.status === 'distressed' ? 'var(--red-bg)' : 'var(--amber-bg)',
            border: `1px solid ${captainShip.status === 'normal' ? 'var(--green-border)' : captainShip.status === 'distressed' ? 'var(--red-border)' : 'var(--amber-border)'}`,
            color: captainShip.status === 'normal' ? 'var(--green)' : captainShip.status === 'distressed' ? 'var(--red)' : 'var(--amber)',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
            {captainShip.status?.toUpperCase().replace('_', ' ')}
          </span>
          {captainShip.isAdverseWeather && (
            <span style={{
              fontSize: '10px', fontFamily: 'var(--font)', fontWeight: 700,
              color: 'var(--amber)', background: 'var(--amber-bg)',
              border: '1px solid var(--amber-border)', borderRadius: 'var(--r-full)', padding: '3px 10px',
              display: 'inline-flex', alignItems: 'center', gap: '4px'
            }}>
              <CloudRain style={{ width: '11px', height: '11px' }} />
              +30% Fuel Penalty
            </span>
          )}
        </div>
      </div>

      {/* ── Scroll Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Command Directive */}
        {captainShip.status === 'rerouting' && (
          <div style={{
            padding: '12px 13px', borderRadius: 'var(--r-md)',
            background: 'var(--blue-muted)', border: '1px solid var(--blue-border)'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Radio style={{ width: '13px', height: '13px', color: 'var(--blue)' }} />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--blue)' }}>
                  Command Directive Received
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '4px', lineHeight: 1.5, fontFamily: 'var(--font)' }}>
                Fleet Command has issued a new course directive. Confirm compliance or report obstacle.
              </p>
            </div>
            <textarea
              value={responseNote}
              onChange={e => setResponseNote(e.target.value)}
              placeholder="Optional status note for Fleet Command..."
              rows={2}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 'var(--r-sm)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '12px',
                resize: 'none', marginBottom: '8px', outline: 'none',
                transition: 'border-color var(--t)'
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                onClick={() => handleCaptainAction('ACKNOWLEDGE')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  padding: '8px', borderRadius: 'var(--r-sm)', fontSize: '11px',
                  fontFamily: 'var(--font)', fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  background: 'var(--green)', color: 'white',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <Check style={{ width: '12px', height: '12px' }} />
                Comply
              </button>
              <button
                onClick={() => handleCaptainAction('OVERRIDE')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  padding: '8px', borderRadius: 'var(--r-sm)', fontSize: '11px',
                  fontFamily: 'var(--font)', fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  background: 'var(--red)', color: 'white',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <X style={{ width: '12px', height: '12px' }} />
                Override
              </button>
            </div>
          </div>
        )}

        {/* Quick MAYDAY Templates */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Signal style={{ width: '12px', height: '12px', color: 'var(--red)' }} />
            <span style={{ fontFamily: 'var(--font)', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
              Quick MAYDAY Templates
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {CAPTAIN_DISTRESS_TEMPLATES.map((tmpl, i) => {
              const Icon = tmpl.Icon;
              return (
                <button
                  key={i}
                  onClick={() => setDistressMsg(`[${tmpl.category}] ${tmpl.text}`)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '9px 12px',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)', cursor: 'pointer', color: 'var(--text-2)',
                    fontSize: '11px', fontFamily: 'var(--font)',
                    transition: 'all var(--t)', lineHeight: 1.4,
                    display: 'flex', alignItems: 'center', gap: '9px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--red-bg)';
                    e.currentTarget.style.borderColor = 'var(--red-border)';
                    e.currentTarget.style.color = 'var(--red)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--surface-2)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-2)';
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: tmpl.bg, border: `1px solid ${tmpl.border}`,
                    color: tmpl.color, padding: '2px 7px', borderRadius: 'var(--r-sm)',
                    fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 800,
                    flexShrink: 0
                  }}>
                    <Icon style={{ width: '12px', height: '12px' }} />
                    {tmpl.category}
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {tmpl.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAYDAY Compose */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <AlertOctagon style={{ width: '14px', height: '14px', color: 'var(--red)' }} />
            <span style={{ fontFamily: 'var(--font)', fontSize: '12px', fontWeight: 800, color: 'var(--red)', letterSpacing: '0.02em' }}>
              Compose MAYDAY Message
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={distressMsg}
            onChange={e => setDistressMsg(e.target.value)}
            placeholder="Describe the emergency clearly: type of incident, casualties, damage, assistance needed..."
            rows={4}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)',
              background: distressMsg.length > 0 ? 'var(--red-bg)' : 'var(--surface-2)',
              border: `1px solid ${distressMsg.length > 0 ? 'var(--red-border)' : 'var(--border)'}`,
              color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '12px',
              resize: 'vertical', marginBottom: '8px',
              minHeight: '85px', lineHeight: 1.5, outline: 'none',
              transition: 'border-color var(--t)'
            }}
          />
          {distressMsg.length > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '8px', fontSize: '10px',
              fontFamily: 'var(--font-mono)', color: 'var(--text-3)'
            }}>
              <span>{distressMsg.length} chars</span>
              <span>AI analysis on transmit</span>
            </div>
          )}
          <button
            onClick={handleSendDistress}
            disabled={!distressMsg.trim() || sending}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 'var(--r-md)',
              cursor: distressMsg.trim() && !sending ? 'pointer' : 'not-allowed',
              fontSize: '13px', fontFamily: 'var(--font)',
              fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              border: 'none', transition: 'all var(--t)',
              background: sent
                ? 'var(--green)'
                : sending
                ? 'var(--red-border)'
                : distressMsg.trim()
                ? 'var(--red)'
                : 'var(--surface-2)',
              color: sent ? 'white' : distressMsg.trim() ? 'white' : 'var(--text-3)',
              boxShadow: sent || distressMsg.trim() ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none'
            }}
          >
            {sent ? (
              <>
                <Check style={{ width: '16px', height: '16px' }} />
                <span>MAYDAY Transmitted</span>
              </>
            ) : sending ? (
              <>
                <Radio style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                <span>Broadcasting Distress Signal...</span>
              </>
            ) : (
              <>
                <Radio style={{ width: '16px', height: '16px' }} />
                <Send style={{ width: '15px', height: '15px' }} />
                <span>Transmit MAYDAY</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
