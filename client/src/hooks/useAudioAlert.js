import { useRef, useCallback, useState } from 'react';

/**
 * Web Audio API Synthesizer Hook
 * Plays tactical warning tones and sirens for geofence breaches & collision warnings
 * without needing any external MP3 files.
 */
export function useAudioAlert() {
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef(null);
  const lastAlertTimeRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playAlarm = useCallback((severity = 'HIGH') => {
    if (isMuted) return;
    const now = Date.now();
    // Throttle sound to once per 1.8 seconds max
    if (now - lastAlertTimeRef.current < 1800) return;
    lastAlertTimeRef.current = now;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const t0 = ctx.currentTime;

      if (severity === 'CRITICAL' || severity === 'MAYDAY') {
        // Authentic Naval Command Klaxon (General Quarters 2-tone resonant horn pulses)
        const playHornPulse = (delay) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, t0 + delay);
          filter.Q.setValueAtTime(2.5, t0 + delay);

          osc1.type = 'triangle';
          osc2.type = 'sawtooth';

          // Resonant naval horn frequencies (440Hz root + 554Hz major 3rd)
          osc1.frequency.setValueAtTime(440, t0 + delay);
          osc1.frequency.linearRampToValueAtTime(370, t0 + delay + 0.35);
          osc2.frequency.setValueAtTime(554, t0 + delay);
          osc2.frequency.linearRampToValueAtTime(466, t0 + delay + 0.35);

          gain.gain.setValueAtTime(0, t0 + delay);
          gain.gain.linearRampToValueAtTime(0.22, t0 + delay + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + delay + 0.4);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(t0 + delay);
          osc2.start(t0 + delay);
          osc1.stop(t0 + delay + 0.42);
          osc2.stop(t0 + delay + 0.42);
        };

        // Double naval klaxon pulse
        playHornPulse(0);
        playHornPulse(0.48);
      } else {
        // Professional Naval Tactical Sonar Ping (Clear, melodic acoustic warning)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, t0); // B5 note
        osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.3); // Smooth downward glide

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(950, t0);
        filter.Q.setValueAtTime(5, t0);

        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.18, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.65);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t0);
        osc.stop(t0 + 0.7);
      }
    } catch (e) {
      console.warn('Naval audio synthesis note:', e);
    }
  }, [isMuted, getAudioContext]);

  return {
    isMuted,
    toggleMute: () => setIsMuted(prev => !prev),
    playAlarm
  };
}
