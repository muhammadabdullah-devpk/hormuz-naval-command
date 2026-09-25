import {
  BrainCircuit, Users, Fuel, Zap,
  TrendingUp, X, ChevronRight, Sparkles, Check,
  ShieldCheck, Activity, Compass, AlertCircle
} from 'lucide-react';

const REC_TYPE_CFG = {
  FUEL_CRITICAL: { icon: Fuel,       color: 'var(--red)',    bg: 'var(--red-bg)',    border: 'var(--red-border)' },
  MUTUAL_AID:    { icon: Users,      color: 'var(--amber)',  bg: 'var(--amber-bg)',  border: 'var(--amber-border)' },
  PREDICTIVE:    { icon: TrendingUp, color: 'var(--purple)', bg: 'var(--purple-bg)', border: 'var(--purple-border)' },
  DEFAULT:       { icon: Zap,        color: 'var(--blue)',   bg: 'var(--blue-muted)',border: 'var(--blue-border)' },
};

const PRIORITY_CFG = {
  CRITICAL: { label: 'Critical', color: 'var(--red)',   bg: 'var(--red-bg)',    border: 'var(--red-border)' },
  HIGH:     { label: 'High',     color: 'var(--amber)', bg: 'var(--amber-bg)',  border: 'var(--amber-border)' },
  MEDIUM:   { label: 'Medium',   color: 'var(--blue)',  bg: 'var(--blue-muted)',border: 'var(--blue-border)' },
};

export function AIFleetAdvisor({
  recommendations = [],
  onAdoptRecommendation,
  onDismissRecommendation,
  role,
  onClose,
  fleetState
}) {
  const hasRecommendations = recommendations.length > 0;
  const ships = fleetState?.ships || [];

  return (
    <div
      className="animate-fade-down"
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 20
      }}
    >
      {/* Top accent - purple gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, var(--purple) 30%, var(--blue) 70%, transparent 100%)'
      }} />

      <div style={{ padding: '12px 18px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* AI Brain Icon */}
            <div style={{
              width: '34px', height: '34px',
              background: 'linear-gradient(135deg, var(--purple), #5b21b6)',
              borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <BrainCircuit style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '15px', fontFamily: 'var(--font)',
                  fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em'
                }}>
                  AI Fleet Strategic Advisor
                </span>
                <span style={{
                  fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  color: 'var(--purple)', background: 'var(--purple-bg)',
                  border: '1px solid var(--purple-border)', borderRadius: 'var(--r-full)', padding: '2px 8px',
                }}>
                  Gemini AI
                </span>
                <span style={{
                  fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  color: hasRecommendations ? 'var(--amber)' : 'var(--green)',
                  background: hasRecommendations ? 'var(--amber-bg)' : 'var(--green-bg, rgba(16,185,129,0.1))',
                  border: `1px solid ${hasRecommendations ? 'var(--amber-border)' : 'var(--green-border, rgba(16,185,129,0.3))'}`,
                  borderRadius: 'var(--r-full)', padding: '2px 8px',
                }}>
                  {hasRecommendations ? `${recommendations.length} Active Advisories` : 'Operational Nominal'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font)', marginTop: '1px' }}>
                {hasRecommendations
                  ? `${recommendations.length} proactive advisory signal${recommendations.length > 1 ? 's' : ''} · Real-time fleet trajectory optimization`
                  : 'Continuous autonomous strategic surveillance & crisis prediction active across Strait of Hormuz'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close advisor"
            title="Close Advisor Panel"
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

        {/* Content Section */}
        {!hasRecommendations ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px',
            padding: '4px 0'
          }}>
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <div style={{
                padding: '7px', borderRadius: 'var(--r-sm)',
                background: 'var(--green-bg, rgba(16,185,129,0.12))',
                border: '1px solid var(--green-border, rgba(16,185,129,0.25))'
              }}>
                <ShieldCheck style={{ width: '16px', height: '16px', color: 'var(--green)' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>Vessel Trajectories</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>15/15 vessels on designated sea-lanes</div>
              </div>
            </div>

            <div style={{
              padding: '10px 14px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <div style={{
                padding: '7px', borderRadius: 'var(--r-sm)',
                background: 'var(--purple-bg)',
                border: '1px solid var(--purple-border)'
              }}>
                <Sparkles style={{ width: '16px', height: '16px', color: 'var(--purple)' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>Gemini AI Sentinel</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Real-time collision & distress triage standby</div>
              </div>
            </div>

            <div style={{
              padding: '10px 14px', borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <div style={{
                padding: '7px', borderRadius: 'var(--r-sm)',
                background: 'var(--blue-muted)',
                border: '1px solid var(--blue-border)'
              }}>
                <Activity style={{ width: '16px', height: '16px', color: 'var(--blue)' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>Autonomous SAR Protocol</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Automatic mutual-aid pairing armed</div>
              </div>
            </div>
          </div>
        ) : (
          /* Recommendation Cards */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '10px'
        }}>
          {recommendations.map(rec => {
            const typeCfg = REC_TYPE_CFG[rec.type] || REC_TYPE_CFG.DEFAULT;
            const priCfg = PRIORITY_CFG[rec.priority] || PRIORITY_CFG.MEDIUM;
            const Icon = typeCfg.icon;

            return (
              <div
                key={rec.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--surface-2)',
                  border: `1px solid ${typeCfg.border}`,
                  position: 'relative', overflow: 'hidden',
                  transition: 'all var(--t)',
                  boxShadow: 'var(--shadow-xs)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--purple-border)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = typeCfg.border;
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
              >
                {/* Top color accent */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: `linear-gradient(90deg, ${typeCfg.color}, transparent)`
                }} />

                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      padding: '6px', borderRadius: 'var(--r-sm)',
                      background: typeCfg.bg, border: `1px solid ${typeCfg.border}`
                    }}>
                      <Icon style={{ width: '13px', height: '13px', color: typeCfg.color }} />
                    </div>
                    <span style={{
                      fontSize: '13px', fontFamily: 'var(--font)',
                      fontWeight: 700, color: 'var(--text)'
                    }}>
                      {rec.title}
                    </span>
                  </div>

                  {/* Priority badge + Individual dismiss button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '10px', fontFamily: 'var(--font)', fontWeight: 700,
                      color: priCfg.color, background: priCfg.bg, border: `1px solid ${priCfg.border}`,
                      borderRadius: 'var(--r-full)', padding: '2px 9px', flexShrink: 0
                    }}>
                      {priCfg.label}
                    </span>

                    {onDismissRecommendation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismissRecommendation(rec.id);
                        }}
                        title="Dismiss this advisory"
                        style={{
                          padding: '3px', borderRadius: '4px', cursor: 'pointer',
                          background: 'transparent', border: 'none',
                          color: 'var(--text-3)', display: 'flex', alignItems: 'center'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                      >
                        <X style={{ width: '13px', height: '13px' }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <p style={{
                  fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.5,
                  margin: '0 0 8px', fontFamily: 'var(--font)'
                }}>
                  {rec.reason}
                </p>

                {/* Suggestion box */}
                {rec.suggestion && (
                  <div style={{
                    background: 'var(--blue-muted)',
                    border: '1px solid var(--blue-border)',
                    borderRadius: 'var(--r-sm)', padding: '7px 10px', marginBottom: '9px'
                  }}>
                    <p style={{ fontSize: '11px', color: 'var(--blue)', lineHeight: 1.45, margin: 0, fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Sparkles style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                      <span>{rec.suggestion}</span>
                    </p>
                  </div>
                )}

                {/* Execute Button */}
                {role === 'COMMAND' && (
                  <button
                    onClick={() => onAdoptRecommendation(rec)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      width: '100%', padding: '7px 12px',
                      borderRadius: 'var(--r-sm)', cursor: 'pointer',
                      fontSize: '12px', fontFamily: 'var(--font)',
                      fontWeight: 700,
                      background: 'var(--purple-bg)', border: '1px solid var(--purple-border)',
                      color: 'var(--purple)', transition: 'all var(--t)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--purple)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = 'var(--purple)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--purple-bg)';
                      e.currentTarget.style.color = 'var(--purple)';
                      e.currentTarget.style.borderColor = 'var(--purple-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Sparkles style={{ width: '12px', height: '12px' }} />
                    Execute Advisory Recommendation
                    <ChevronRight style={{ width: '12px', height: '12px' }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
