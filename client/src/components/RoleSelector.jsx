import React, { useState, useRef, useEffect } from 'react';
import {
  Shield, Radio, Activity, Clock, Wifi, WifiOff,
  AlertTriangle, Anchor, BrainCircuit,
  Ship, Sun, Moon, Bell, BellOff, Search, X, ChevronDown,
  Waves, Zap, Fuel, Package, Snowflake, Layers
} from 'lucide-react';
import { VESSEL_REGISTRY, PORT_REGISTRY, VESSEL_CATEGORIES } from '../data/maritimeDirectory.js';

export function RoleSelector({
  role, onSelectRole, timeScale, onChangeTimeScale,
  activeShipCount, activeBreachCount, distressCount, critCount,
  isConnected, isMuted, onToggleMute, alertCount,
  showAIAdvisor, onToggleAIAdvisor, aiAdvisorCount,
  uiTheme = 'light', onToggleTheme,
  ships = [], ports = [], onSelectShip, onSelectPort,
  activeCategory = 'all', onSelectCategory
}) {
  const isLight = uiTheme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const [speedToast, setSpeedToast] = useState(null);
  const speedToastTimer = useRef(null);

  const handleSpeedSelect = (scale) => {
    onChangeTimeScale(scale);
    setSpeedToast(scale);
    if (speedToastTimer.current) clearTimeout(speedToastTimer.current);
    speedToastTimer.current = setTimeout(() => {
      setSpeedToast(null);
    }, 2400);
  };

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter ships and ports for search results
  const searchResults = searchQuery.trim().length > 0 ? {
    ships: ships.filter(s => {
      const reg = VESSEL_REGISTRY[s.shipId] || {};
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.shipId.toLowerCase().includes(q) ||
        (reg.imo && reg.imo.includes(q)) ||
        (reg.mmsi && reg.mmsi.includes(q)) ||
        (reg.vesselType && reg.vesselType.toLowerCase().includes(q)) ||
        (s.cargo && s.cargo.toLowerCase().includes(q))
      );
    }),
    ports: ports.filter(p => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.id && p.id.toLowerCase().includes(q))
      );
    })
  } : { ships: [], ports: [] };

  const hasResults = searchResults.ships.length > 0 || searchResults.ports.length > 0;

  return (
    <header
      style={{
        background: isLight ? 'var(--surface)' : 'rgba(5,10,20,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        flexShrink: 0,
        zIndex: 100,
        position: 'relative',
      }}
    >
      {/* ── Main Nav Row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', height: '56px',
        padding: '0 16px', gap: '12px'
      }}>

        {/* ── Brand Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: '36px', height: '36px' }}>
            <img
              src="/logos/logo1_hormuz_shield.jpg"
              alt="Hormuz Naval Command"
              style={{
                width: '36px', height: '36px',
                borderRadius: 'var(--r-md)',
                objectFit: 'cover',
                boxShadow: 'var(--shadow-blue)',
                border: '1.5px solid var(--blue-border)',
                display: 'block'
              }}
            />
            {isConnected && (
              <div className="sonar-alert" style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '10px', height: '10px', borderRadius: '50%',
                background: 'var(--green)',
                border: '2px solid var(--surface)'
              }} />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <h1 style={{
                fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em',
                fontFamily: 'var(--font)', color: 'var(--text)',
                lineHeight: 1, margin: 0
              }}>
                Hormuz MarineTraffic
              </h1>
              <span style={{
                fontSize: '9px', fontFamily: 'var(--font-mono)',
                fontWeight: 800, letterSpacing: '0.08em',
                background: 'var(--red-bg)',
                border: '1px solid var(--red-border)',
                color: 'var(--red)', padding: '2px 7px', borderRadius: 'var(--r-full)',
                animation: 'pulse-dot 2s infinite'
              }}>
                ● TSS RED ZONE
              </span>
            </div>
            <p style={{
              fontSize: '10px', fontFamily: 'var(--font)',
              color: 'var(--text-3)', margin: '2px 0 0', letterSpacing: '0.01em'
            }}>
              Strait of Hormuz AIS · 15 Commercial Vessels · 10 Active Terminals
            </p>
          </div>
        </div>

        {/* ── Real-World Global Search Bar ── */}
        <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '360px', minWidth: '180px' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-full)', padding: '6px 12px', gap: '8px',
            transition: 'border-color var(--t), box-shadow var(--t)'
          }}>
            <Search style={{ width: '14px', height: '14px', color: 'var(--text-3)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search 15 Vessels, 10 Ports, IMO, MMSI..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                width: '100%', fontSize: '11px', fontFamily: 'var(--font)',
                color: 'var(--text)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-3)' }}
              >
                <X style={{ width: '13px', height: '13px' }} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchQuery.trim() && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-xl)',
                maxHeight: '340px', overflowY: 'auto', zIndex: 110, padding: '6px'
              }}
            >
              {!hasResults && (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font)' }}>
                  No vessel or port matching "{searchQuery}"
                </div>
              )}

              {/* Matching Vessels */}
              {searchResults.ships.length > 0 && (
                <div>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', padding: '6px 8px', letterSpacing: '0.06em' }}>
                    Vessels ({searchResults.ships.length})
                  </div>
                  {searchResults.ships.map(s => {
                    const reg = VESSEL_REGISTRY[s.shipId] || {};
                    return (
                      <div
                        key={s.shipId}
                        onClick={() => {
                          onSelectShip && onSelectShip(s);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        style={{
                          padding: '7px 9px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'background var(--t)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {reg.flag ? <span style={{ fontSize: '14px' }}>{reg.flag}</span> : <Ship style={{ width: '14px', height: '14px', color: 'var(--blue)' }} />}
                          <div>
                            <div style={{ fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                              {s.name} <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 400 }}>({s.shipId})</span>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font)' }}>
                              {reg.vesselType || s.cargo} · {s.speed} kts
                            </div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                          color: s.status === 'normal' ? 'var(--green)' : s.status === 'distressed' ? 'var(--red)' : 'var(--amber)'
                        }}>
                          ● {s.status?.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Matching Ports */}
              {searchResults.ports.length > 0 && (
                <div style={{ marginTop: '4px', borderTop: searchResults.ships.length > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', padding: '6px 8px', letterSpacing: '0.06em' }}>
                    Ports ({searchResults.ports.length})
                  </div>
                  {searchResults.ports.map(p => {
                    const meta = PORT_REGISTRY[p.id || p.portId] || {};
                    return (
                      <div
                        key={p.id || p.name}
                        onClick={() => {
                          onSelectPort && onSelectPort(p);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        style={{
                          padding: '7px 9px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'background var(--t)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {meta.flag ? <span style={{ fontSize: '14px' }}>{meta.flag}</span> : <Anchor style={{ width: '14px', height: '14px', color: 'var(--blue)' }} />}
                          <div>
                            <div style={{ fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font)' }}>
                              {meta.country} · {meta.locode || p.id}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Anchor style={{ width: '11px', height: '11px', color: 'var(--blue)' }} />
                          {meta.berths || 20} Berths
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Status Telemetry Badges ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          borderLeft: '1px solid var(--border)', paddingLeft: '10px'
        }}>
          <MTChip
            icon={isConnected ? Wifi : WifiOff}
            label={isConnected ? 'AIS LIVE' : 'OFFLINE'}
            color={isConnected ? 'var(--green)' : 'var(--red)'}
            bg={isConnected ? 'var(--green-bg)' : 'var(--red-bg)'}
            border={isConnected ? 'var(--green-border)' : 'var(--red-border)'}
          />
          <MTChip
            icon={Ship}
            label={`${activeShipCount} Vessels`}
            color="var(--blue)"
            bg="var(--blue-muted)"
            border="var(--blue-border)"
          />
          {critCount > 0 && (
            <MTChip
              icon={AlertTriangle}
              label={`${critCount} Alert`}
              color="var(--red)"
              bg="var(--red-bg)"
              border="var(--red-border)"
              pulse
            />
          )}
        </div>

        {/* ── Right Controls: Speed, AI, Sound, Theme, Roles ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginLeft: 'auto' }}>

          {/* Time Scale */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '2px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '2px 4px'
          }}>
            <Clock style={{ width: '12px', height: '12px', color: 'var(--text-3)', margin: '0 4px' }} />
            {[1, 5, 12, 30].map((scale) => (
              <button
                key={scale}
                onClick={() => handleSpeedSelect(scale)}
                data-tooltip-bottom={`${scale}× time speed`}
                style={{
                  padding: '3px 8px', borderRadius: 'var(--r-sm)',
                  fontSize: '11px', fontFamily: 'var(--font-mono)',
                  fontWeight: 700, cursor: 'pointer',
                  transition: 'all var(--t)',
                  border: 'none',
                  background: timeScale === scale ? 'var(--blue)' : 'transparent',
                  color: timeScale === scale ? 'white' : 'var(--text-3)',
                }}
              >
                {scale}×
              </button>
            ))}
          </div>

          {/* AI Advisor Badge - Always visible */}
          <button
            onClick={onToggleAIAdvisor}
            data-tooltip="AI Fleet Advisor (Gemini/NLP)"
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: 'var(--r-md)', cursor: 'pointer',
              fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 700,
              background: showAIAdvisor ? 'var(--purple-bg)' : 'var(--surface-2)',
              color: showAIAdvisor ? 'var(--purple)' : (aiAdvisorCount > 0 ? 'var(--purple)' : 'var(--text-3)'),
              border: `1px solid ${showAIAdvisor ? 'var(--purple-border)' : (aiAdvisorCount > 0 ? 'var(--purple-border)' : 'var(--border)')}`,
              boxShadow: showAIAdvisor ? 'var(--shadow-sm)' : 'none',
              transition: 'all var(--t)'
            }}
          >
            <BrainCircuit style={{ width: '13px', height: '13px', color: aiAdvisorCount > 0 || showAIAdvisor ? 'var(--purple)' : 'inherit' }} />
            <span>AI Advisor</span>
            {aiAdvisorCount > 0 ? (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'var(--purple)',
                border: '2px solid var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', color: 'white', fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                fontStyle: 'normal',
                animation: 'pulse-dot 2s infinite'
              }}>
                {aiAdvisorCount}
              </span>
            ) : (
              <span style={{
                fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: 'var(--green)', background: 'var(--green-bg, rgba(16,185,129,0.12))',
                border: '1px solid var(--green-border, rgba(16,185,129,0.25))',
                borderRadius: 'var(--r-full)', padding: '1px 5px', marginLeft: '2px'
              }}>
                ONLINE
              </span>
            )}
          </button>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            data-tooltip={isMuted ? 'Unmute Alarms' : 'Mute Alarms'}
            style={{
              padding: '7px 9px', borderRadius: 'var(--r-md)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'var(--surface-2)',
              color: isMuted ? 'var(--text-3)' : 'var(--blue)',
              border: '1px solid var(--border)',
              transition: 'all var(--t)'
            }}
          >
            {isMuted
              ? <BellOff style={{ width: '14px', height: '14px' }} />
              : <Bell style={{ width: '14px', height: '14px' }} />
            }
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            data-tooltip={isLight ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 11px', borderRadius: 'var(--r-md)', cursor: 'pointer',
              fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 600,
              background: isLight ? 'var(--surface-2)' : 'rgba(251,191,36,0.08)',
              color: isLight ? 'var(--text-3)' : '#fbbf24',
              border: `1px solid ${isLight ? 'var(--border)' : 'rgba(251,191,36,0.3)'}`,
              transition: 'all var(--t)'
            }}
          >
            {isLight
              ? <><Moon style={{ width: '13px', height: '13px' }} /> Night</>
              : <><Sun style={{ width: '13px', height: '13px' }} /> Day</>
            }
          </button>

          {/* Role Toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '2px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '3px'
          }}>
            <RoleBtn
              active={role === 'COMMAND'}
              onClick={() => onSelectRole('COMMAND')}
              icon={Shield}
              label="Command"
              activeBg="var(--blue)"
              activeText="white"
            />
            <RoleBtn
              active={role === 'CAPTAIN'}
              onClick={() => onSelectRole('CAPTAIN')}
              icon={Radio}
              label="Captain"
              activeBg="var(--amber)"
              activeText="white"
            />
          </div>
        </div>
      </div>

      {/* ── Sub-Nav: Real-World Category Filter Strip & Live Ticker ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 16px', background: 'var(--surface-2)',
        borderTop: '1px solid var(--border)', fontSize: '11px', gap: '12px'
      }}>
        {/* Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginRight: '4px' }}>
            Filter:
          </span>
          {VESSEL_CATEGORIES.map(cat => {
            const IconComponent = cat.iconType === 'tanker' ? Fuel :
                                 cat.iconType === 'container' ? Package :
                                 cat.iconType === 'lng' ? Snowflake :
                                 cat.iconType === 'bulk' ? Layers : Ship;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '3px 9px', borderRadius: 'var(--r-full)',
                  fontSize: '10px', fontFamily: 'var(--font)', fontWeight: 600,
                  cursor: 'pointer', border: 'none', transition: 'all var(--t)',
                  background: activeCategory === cat.id ? 'var(--blue)' : 'var(--surface)',
                  color: activeCategory === cat.id ? 'white' : 'var(--text-2)',
                  boxShadow: activeCategory === cat.id ? 'var(--shadow-xs)' : 'none'
                }}
              >
                <IconComponent style={{ width: '11px', height: '11px' }} />
                <span>{cat.label} ({cat.count})</span>
              </button>
            );
          })}
        </div>

        {/* Live Maritime Ticker */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)',
          overflow: 'hidden', whiteSpace: 'nowrap'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Waves style={{ width: '12px', height: '12px', color: 'var(--blue)' }} />
            Strait Traffic: <strong>16.4 kts avg</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Zap style={{ width: '12px', height: '12px', color: 'var(--amber)' }} />
            Weather Swell: <strong style={{ color: 'var(--amber)' }}>2.4m Shamal</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Anchor style={{ width: '12px', height: '12px', color: 'var(--blue)' }} />
            10/10 Ports Operational
          </span>
        </div>
      </div>

      {/* ── Bottom HUD Toast for Speed Changes (Niche show hota hai, clean and prominent) ── */}
      {speedToast && (
        <div style={{
          position: 'fixed', bottom: '26px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 99999,
          background: 'rgba(13, 27, 42, 0.94)',
          border: '1px solid rgba(14, 165, 233, 0.5)',
          borderRadius: 'var(--r-full)',
          padding: '8px 22px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 0 16px rgba(14, 165, 233, 0.25)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', gap: '9px',
          color: '#ffffff', fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 600,
          pointerEvents: 'none', animation: 'fade-in 0.2s ease-out'
        }}>
          <Clock style={{ width: '15px', height: '15px', color: '#38bdf8' }} />
          <span>Simulation Speed Set: <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{speedToast}×</strong> Real-Time</span>
        </div>
      )}
    </header>
  );
}

function MTChip({ icon: Icon, label, color, bg, border, pulse }) {
  return (
    <div
      className={pulse ? 'animate-pulse-dot' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        background: bg, border: `1px solid ${border}`,
        borderRadius: 'var(--r-full)', padding: '3px 8px'
      }}
    >
      <Icon style={{ width: '10px', height: '10px', color }} />
      <span style={{
        fontSize: '10px', fontFamily: 'var(--font-mono)',
        fontWeight: 700, color, whiteSpace: 'nowrap'
      }}>
        {label}
      </span>
    </div>
  );
}

function RoleBtn({ active, onClick, icon: Icon, label, activeBg, activeText }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '5px 12px', borderRadius: 'var(--r-sm)',
        fontSize: '12px', fontFamily: 'var(--font)',
        fontWeight: 700,
        border: 'none', cursor: 'pointer', transition: 'all var(--t)',
        background: active ? activeBg : 'transparent',
        color: active ? activeText : 'var(--text-3)',
        boxShadow: active ? 'var(--shadow-xs)' : 'none'
      }}
    >
      <Icon style={{ width: '12px', height: '12px' }} />
      {label}
    </button>
  );
}
