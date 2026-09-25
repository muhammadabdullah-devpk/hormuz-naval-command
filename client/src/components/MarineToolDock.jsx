import React, { useState } from 'react';
import {
  Ship, Anchor, Ruler, CloudRain, Layers,
  Search, X, ChevronRight, Filter, Wind, ExternalLink,
  Zap, Fuel, Compass, TrendingUp, AlertTriangle, Waves, Eye,
  Package, Snowflake
} from 'lucide-react';
import { VESSEL_REGISTRY, PORT_REGISTRY, VESSEL_CATEGORIES } from '../data/maritimeDirectory.js';

export function MarineToolDock({
  ships = [],
  ports = [],
  onSelectShip,
  onSelectPort,
  activeFilter,
  onChangeFilter,
  isMeasuring,
  onToggleMeasuring,
  measurePoints = [],
  onClearMeasure,
  showWeatherLayer,
  onToggleWeatherLayer
}) {
  const [activeDrawer, setActiveDrawer] = useState(null); // 'ships' | 'ports' | 'weather' | null
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'speed' | 'fuel'

  const toggleDrawer = (drawerName) => {
    setActiveDrawer(prev => prev === drawerName ? null : drawerName);
  };

  // Filter ships
  const filteredShips = ships.filter(ship => {
    const reg = VESSEL_REGISTRY[ship.shipId] || {};
    const matchesCategory = activeFilter === 'all' || reg.category === activeFilter;
    const matchesSearch = !searchQuery ||
      ship.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.shipId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.vesselType && reg.vesselType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (reg.flagName && reg.flagName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'speed') return b.speed - a.speed;
    if (sortBy === 'fuel') return a.fuel - b.fuel;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      {/* ── Left Floating Vertical Dock ── */}
      <div style={{
        position: 'absolute', top: '70px', left: '14px', zIndex: 30,
        display: 'flex', flexDirection: 'column', gap: '6px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '6px',
        boxShadow: 'var(--shadow-md)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}>
        {/* Fleet Directory Button */}
        <button
          onClick={() => toggleDrawer('ships')}
          data-tooltip="Fleet Directory"
          style={{
            width: '38px', height: '38px', borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: 'none', transition: 'all var(--t)',
            background: activeDrawer === 'ships' ? 'var(--blue)' : 'var(--surface-2)',
            color: activeDrawer === 'ships' ? 'white' : 'var(--text-2)',
            boxShadow: activeDrawer === 'ships' ? 'var(--shadow-blue)' : 'none'
          }}
          title="Fleet Directory (All Vessels)"
        >
          <Ship style={{ width: '18px', height: '18px' }} />
        </button>

        {/* Ports Directory Button */}
        <button
          onClick={() => toggleDrawer('ports')}
          data-tooltip="Ports & Terminals"
          style={{
            width: '38px', height: '38px', borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: 'none', transition: 'all var(--t)',
            background: activeDrawer === 'ports' ? 'var(--blue)' : 'var(--surface-2)',
            color: activeDrawer === 'ports' ? 'white' : 'var(--text-2)',
            boxShadow: activeDrawer === 'ports' ? 'var(--shadow-blue)' : 'none'
          }}
          title="Ports & Terminals Directory"
        >
          <Anchor style={{ width: '18px', height: '18px' }} />
        </button>

        {/* Distance Ruler Tool */}
        <button
          onClick={onToggleMeasuring}
          data-tooltip={isMeasuring ? 'Ruler Active (Click 2 points on map)' : 'Nautical Distance Ruler'}
          style={{
            width: '38px', height: '38px', borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: 'none', transition: 'all var(--t)',
            background: isMeasuring ? 'var(--amber)' : 'var(--surface-2)',
            color: isMeasuring ? 'white' : 'var(--text-2)',
            boxShadow: isMeasuring ? 'var(--shadow-sm)' : 'none'
          }}
          title="Distance & Speed Ruler"
        >
          <Ruler style={{ width: '18px', height: '18px' }} />
        </button>

        {/* Weather & Sea State */}
        <button
          onClick={() => toggleDrawer('weather')}
          data-tooltip="Marine Weather & Sea Conditions"
          style={{
            width: '38px', height: '38px', borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: 'none', transition: 'all var(--t)',
            background: activeDrawer === 'weather' ? 'var(--blue)' : 'var(--surface-2)',
            color: activeDrawer === 'weather' ? 'white' : 'var(--text-2)'
          }}
          title="Weather & Sea Conditions"
        >
          <CloudRain style={{ width: '18px', height: '18px' }} />
        </button>
      </div>

      {/* ── Slide-Out Drawer: Fleet Directory ── */}
      {activeDrawer === 'ships' && (
        <div
          className="animate-slide-left"
          style={{
            position: 'absolute', top: '70px', left: '68px', zIndex: 30,
            width: '320px', maxHeight: 'calc(100vh - 140px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ship style={{ width: '16px', height: '16px', color: 'var(--blue)' }} />
              <span style={{ fontSize: '14px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                Fleet Registry ({filteredShips.length})
              </span>
            </div>
            <button
              onClick={() => setActiveDrawer(null)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-3)', padding: '4px'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* Search + Sort */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '9px', width: '13px', height: '13px', color: 'var(--text-3)' }} />
              <input
                type="text"
                placeholder="Filter by vessel name, IMO, type..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '7px 10px 7px 30px',
                  borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
                  background: 'var(--surface-2)', color: 'var(--text)',
                  fontSize: '11px', fontFamily: 'var(--font)', outline: 'none'
                }}
              />
            </div>

            {/* Category Chips */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
              {VESSEL_CATEGORIES.map(cat => {
                const IconComponent = cat.iconType === 'tanker' ? Fuel :
                                     cat.iconType === 'container' ? Package :
                                     cat.iconType === 'lng' ? Snowflake :
                                     cat.iconType === 'bulk' ? Layers : Ship;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onChangeFilter(cat.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '3px 8px', borderRadius: 'var(--r-full)',
                      fontSize: '10px', fontFamily: 'var(--font)', fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      background: activeFilter === cat.id ? 'var(--blue)' : 'var(--surface-2)',
                      color: activeFilter === cat.id ? 'white' : 'var(--text-3)',
                      border: `1px solid ${activeFilter === cat.id ? 'var(--blue)' : 'var(--border)'}`
                    }}
                  >
                    <IconComponent style={{ width: '11px', height: '11px' }} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Sort row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)' }}>
              <span>Sort by:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['name', 'speed', 'fuel'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '10px', fontFamily: 'var(--font-mono)',
                      color: sortBy === s ? 'var(--blue)' : 'var(--text-3)',
                      fontWeight: sortBy === s ? 700 : 400,
                      textTransform: 'capitalize'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredShips.map(s => {
              const reg = VESSEL_REGISTRY[s.shipId] || {};
              return (
                <div
                  key={s.shipId}
                  onClick={() => {
                    onSelectShip(s);
                    setActiveDrawer(null);
                  }}
                  style={{
                    padding: '9px 11px', borderRadius: 'var(--r-md)',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {reg.flag ? <span>{reg.flag}</span> : <Ship style={{ width: '13px', height: '13px', color: 'var(--blue)' }} />}
                      <span style={{ fontSize: '13px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                        {s.name}
                      </span>
                      <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--blue)', background: 'var(--blue-muted)', padding: '1px 5px', borderRadius: '4px' }}>
                        {s.shipId}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                      color: s.status === 'normal' ? 'var(--green)' : s.status === 'distressed' ? 'var(--red)' : 'var(--amber)'
                    }}>
                      ● {s.status?.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font)', marginBottom: '3px' }}>
                    {reg.vesselType || s.cargo}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap style={{ width: '11px', height: '11px', color: 'var(--amber)' }} />
                      {Math.round(s.speed)} kts
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Fuel style={{ width: '11px', height: '11px', color: 'var(--blue)' }} />
                      {Math.round(s.fuel)}t
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Compass style={{ width: '11px', height: '11px', color: 'var(--text-3)' }} />
                      {Math.round(s.heading)}°
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Slide-Out Drawer: Ports Directory ── */}
      {activeDrawer === 'ports' && (
        <div
          className="animate-slide-left"
          style={{
            position: 'absolute', top: '70px', left: '68px', zIndex: 30,
            width: '320px', maxHeight: 'calc(100vh - 140px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Anchor style={{ width: '16px', height: '16px', color: 'var(--blue)' }} />
              <span style={{ fontSize: '14px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                Ports & Terminals ({ports.length})
              </span>
            </div>
            <button
              onClick={() => setActiveDrawer(null)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-3)', padding: '4px'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ports.map(p => {
              const meta = PORT_REGISTRY[p.id || p.portId] || {};
              const inboundCount = ships.filter(s => s.destination === (p.id || p.portId)).length;

              return (
                <div
                  key={p.id || p.name}
                  onClick={() => {
                    onSelectPort(p);
                    setActiveDrawer(null);
                  }}
                  style={{
                    padding: '9px 11px', borderRadius: 'var(--r-md)',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {meta.flag ? <span style={{ fontSize: '14px' }}>{meta.flag}</span> : <Anchor style={{ width: '14px', height: '14px', color: 'var(--blue)' }} />}
                      <span style={{ fontSize: '13px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                        {p.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--blue)', background: 'var(--blue-muted)', padding: '1px 5px', borderRadius: '4px' }}>
                      {meta.locode || p.id}
                    </span>
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font)', marginBottom: '3px' }}>
                    {meta.country} · {meta.type}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Anchor style={{ width: '11px', height: '11px', color: 'var(--blue)' }} />
                      {meta.berths || 20} Berths
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp style={{ width: '11px', height: '11px', color: 'var(--amber)' }} />
                      {meta.occupancy || '80%'} Occ
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: inboundCount > 0 ? 'var(--blue)' : 'var(--text-3)' }}>
                      <Ship style={{ width: '11px', height: '11px' }} />
                      {inboundCount} Inbound
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Slide-Out Drawer: Marine Weather ── */}
      {activeDrawer === 'weather' && (
        <div
          className="animate-slide-left"
          style={{
            position: 'absolute', top: '70px', left: '68px', zIndex: 30,
            width: '320px', maxHeight: 'calc(100vh - 140px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CloudRain style={{ width: '16px', height: '16px', color: 'var(--blue)' }} />
              <span style={{ fontSize: '14px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
                Hormuz Sea & Weather Ops
              </span>
            </div>
            <button
              onClick={() => setActiveDrawer(null)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-3)', padding: '4px'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              padding: '10px 12px', borderRadius: 'var(--r-md)',
              background: 'var(--amber-bg)', border: '1px solid var(--amber-border)'
            }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--amber)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertTriangle style={{ width: '13px', height: '13px', color: 'var(--amber)' }} />
                High Seas Gale Advisory
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font)', color: 'var(--text-2)', lineHeight: 1.4 }}>
                Strong north-westerly Shamal winds generating 2.5m-3.8m swells across Northern Gulf of Oman. Vessels experience +30% fuel penalty.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '9px 11px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', color: 'var(--text-3)', textTransform: 'uppercase' }}>Surface Wind</div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text)' }}>18 - 26 kts</div>
              </div>
              <div style={{ padding: '9px 11px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', color: 'var(--text-3)', textTransform: 'uppercase' }}>Wave Swell</div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--amber)' }}>2.4 m · 7s</div>
              </div>
              <div style={{ padding: '9px 11px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', color: 'var(--text-3)', textTransform: 'uppercase' }}>Water Temp</div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--blue)' }}>27.4 °C</div>
              </div>
              <div style={{ padding: '9px 11px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '9px', fontFamily: 'var(--font-sans)', color: 'var(--text-3)', textTransform: 'uppercase' }}>Barometer</div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text)' }}>1014.2 hPa</div>
              </div>
            </div>

            <div style={{
              padding: '10px 12px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              fontSize: '11px', fontFamily: 'var(--font)', color: 'var(--text-2)',
              display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Waves style={{ width: '13px', height: '13px', color: 'var(--blue)' }} />
                <span><strong>Tidal Stream:</strong> 1.8 kts flood east, 1.2 kts ebb west</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye style={{ width: '13px', height: '13px', color: 'var(--text-2)' }} />
                <span><strong>Visibility:</strong> 8 - 10 Nautical Miles (Good)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Measuring Tool Floating Bar (when ruler active) ── */}
      {isMeasuring && (
        <div style={{
          position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 40,
          background: 'var(--surface)',
          border: '1px solid var(--amber-border)',
          borderRadius: 'var(--r-full)',
          padding: '6px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Ruler style={{ width: '14px', height: '14px', color: 'var(--amber)' }} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--amber)' }}>
              {measurePoints.length === 0
                ? 'Click starting point on the sea to measure distance'
                : measurePoints.length === 1
                ? 'Click second waypoint to complete distance measurement'
                : 'Measurement Complete'}
            </span>
          </div>

          {measurePoints.length > 0 && (
            <button
              onClick={onClearMeasure}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-full)', padding: '2px 8px',
                fontSize: '10px', fontFamily: 'var(--font)', cursor: 'pointer',
                color: 'var(--text-3)'
              }}
            >
              Reset
            </button>
          )}

          <button
            onClick={onToggleMeasuring}
            style={{
              background: 'var(--red-bg)', border: '1px solid var(--red-border)',
              borderRadius: 'var(--r-full)', padding: '2px 8px',
              fontSize: '10px', fontFamily: 'var(--font)', cursor: 'pointer',
              color: 'var(--red)'
            }}
          >
            Done
          </button>
        </div>
      )}
    </>
  );
}
