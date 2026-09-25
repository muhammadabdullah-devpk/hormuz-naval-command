import React, { useState, useEffect } from 'react';
import { History, Play, Pause, Radio, RotateCcw } from 'lucide-react';

export function TimelineScrubber({ isPlayingHistory, onToggleHistoryMode, onSeekSnapshot }) {
  const [timelineData, setTimelineData] = useState({ snapshots: [], events: [] });
  const [sliderIndex, setSliderIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchTimeline = () => {
    fetch(`http://${window.location.hostname || 'localhost'}:3001/api/history`)
      .then(res => res.json())
      .then(data => {
        setTimelineData(data);
        if (data.snapshots?.length > 0 && !isPlayingHistory) {
          setSliderIndex(data.snapshots.length - 1);
        }
      })
      .catch(err => console.warn('History fetch error:', err));
  };

  useEffect(() => {
    fetchTimeline();
    const iv = setInterval(fetchTimeline, 10000);
    return () => clearInterval(iv);
  }, []);

  const totalSnapshots = timelineData.snapshots?.length || 0;

  const handleSliderChange = (e) => {
    const idx = parseInt(e.target.value, 10);
    setSliderIndex(idx);
    if (!isPlayingHistory) onToggleHistoryMode(true);
    const snap = timelineData.snapshots[idx];
    if (snap) onSeekSnapshot(snap);
  };

  const handleLiveReturn = () => {
    setIsPlaying(false);
    onToggleHistoryMode(false);
    setSliderIndex(totalSnapshots - 1);
  };

  useEffect(() => {
    let t = null;
    if (isPlaying && totalSnapshots > 0) {
      t = setInterval(() => {
        setSliderIndex(prev => {
          if (prev >= totalSnapshots - 1) { setIsPlaying(false); return prev; }
          const next = prev + 1;
          const snap = timelineData.snapshots[next];
          if (snap) onSeekSnapshot(snap);
          return next;
        });
      }, 1000);
    }
    return () => { if (t) clearInterval(t); };
  }, [isPlaying, totalSnapshots, timelineData]);

  const currentSnapshot = timelineData.snapshots?.[sliderIndex];
  const currentTimeLabel = currentSnapshot
    ? new Date(currentSnapshot.timestamp).toLocaleTimeString()
    : '––:––:––';

  // Progress percent for visual indicator
  const pct = totalSnapshots > 1 ? Math.round((sliderIndex / (totalSnapshots - 1)) * 100) : 0;

  return (
    <div style={{
      height: '44px',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '14px',
      flexShrink: 0,
      boxShadow: 'var(--shadow-xs)',
      zIndex: 15
    }}>
      {/* Mode Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <History style={{ width: '14px', height: '14px', color: 'var(--blue)' }} />
        <span style={{
          fontSize: '12px', fontFamily: 'var(--font)',
          fontWeight: 700, color: 'var(--text-3)'
        }}>
          Timeline
        </span>
        {isPlayingHistory ? (
          <span style={{
            fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 700,
            color: 'var(--amber)', background: 'var(--amber-bg)',
            border: '1px solid var(--amber-border)',
            borderRadius: 'var(--r-full)', padding: '2px 9px'
          }}>
            ◀ Replay · {currentTimeLabel}
          </span>
        ) : (
          <span style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 700,
            color: 'var(--green)', background: 'var(--green-bg)',
            border: '1px solid var(--green-border)',
            borderRadius: 'var(--r-full)', padding: '2px 9px'
          }}>
            <span className="animate-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            Live
          </span>
        )}
      </div>

      {/* Slider */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSnapshots - 1)}
          value={sliderIndex}
          disabled={totalSnapshots < 2}
          onChange={handleSliderChange}
          style={{ width: '100%', accentColor: 'var(--blue)', cursor: 'pointer' }}
        />
        <span style={{
          fontSize: '10px', fontFamily: 'var(--font-mono)',
          color: 'var(--text-3)', whiteSpace: 'nowrap', flexShrink: 0
        }}>
          {pct}% · {totalSnapshots} pts
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {isPlayingHistory && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause replay' : 'Play replay'}
            style={{
              padding: '5px 8px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              background: isPlaying ? 'var(--amber-bg)' : 'var(--blue-muted)',
              border: `1px solid ${isPlaying ? 'var(--amber-border)' : 'var(--blue-border)'}`,
              color: isPlaying ? 'var(--amber)' : 'var(--blue)', transition: 'all var(--t)'
            }}
          >
            {isPlaying
              ? <Pause style={{ width: '13px', height: '13px' }} />
              : <Play style={{ width: '13px', height: '13px' }} />
            }
          </button>
        )}

        {isPlayingHistory ? (
          <button
            onClick={handleLiveReturn}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 700,
              background: 'var(--blue)',
              border: 'none',
              color: 'white',
              boxShadow: 'var(--shadow-blue)',
              transition: 'all var(--t)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--blue)'}
          >
            <Radio style={{ width: '12px', height: '12px' }} />
            Go Live
          </button>
        ) : (
          <button
            onClick={() => {
              onToggleHistoryMode(true);
              setSliderIndex(Math.max(0, totalSnapshots - 10));
            }}
            disabled={totalSnapshots < 2}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              fontSize: '11px', fontFamily: 'var(--font)', fontWeight: 700,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-3)', transition: 'all var(--t)',
              opacity: totalSnapshots < 2 ? 0.4 : 1
            }}
            onMouseEnter={e => {
              if (totalSnapshots >= 2) {
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.background = 'var(--blue-muted)';
                e.currentTarget.style.borderColor = 'var(--blue-border)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-3)';
              e.currentTarget.style.background = 'var(--surface-2)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <RotateCcw style={{ width: '11px', height: '11px' }} />
            History
          </button>
        )}
      </div>
    </div>
  );
}
