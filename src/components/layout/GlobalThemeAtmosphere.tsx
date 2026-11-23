import React, { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useAppStore } from '../../store/appStore';

export const PINUI_THEME_EVENT = 'ff:pinui-theme-toggle';

export function triggerPinuiThemeToggle(sourceEl?: HTMLElement | null): void {
  if (typeof window === 'undefined') return;
  const rect = sourceEl?.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent(PINUI_THEME_EVENT, {
      detail: rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, w: rect.width, h: rect.height }
        : null,
    })
  );
}

class AtmosphereAudio {
  private ctx: AudioContext | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  playDroplet() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(1220, now + 0.09);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.075, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playRain() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.22);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.52));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1850, now);
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  playBurst() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.18);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  dispose() {
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }
}

function buildRainCurtainKeyframes(): string[] {
  const steps = 6;
  const offsets = [0, 6, -5, 8, -4, 5, -3];
  const frames: string[] = [];
  for (let s = 0; s <= steps; s += 1) {
    const p = s / steps;
    const base = -10 + p * 124;
    const pts = offsets
      .map((off, idx) => {
        const x = Math.round((idx / (offsets.length - 1)) * 100);
        const wave = Math.sin(p * Math.PI) * off;
        const y = Math.max(0, Math.min(100, Math.round(base + wave)));
        return `${x}% ${y}%`;
      })
      .reverse();
    frames.push(`polygon(0% 0%, 100% 0%, ${pts.join(', ')})`);
  }
  return frames;
}

export const GlobalThemeAtmosphere: React.FC = () => {
  const { theme, setTheme, themeEffect, reducedMotion } = useAppStore();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);
  const effectRef = useRef(themeEffect);
  const reducedRef = useRef(reducedMotion);
  const busyRef = useRef(false);

  useEffect(() => {
    themeRef.current = theme;
    effectRef.current = themeEffect;
    reducedRef.current = reducedMotion;
  }, [theme, themeEffect, reducedMotion]);

  useEffect(() => {
    const sound = new AtmosphereAudio();
    let rafId = 0;
    let safetyTimer = 0;
    let activeRun = 0;
    let activeAnims: Animation[] = [];

    const cleanup = () => {
      if (safetyTimer) {
        window.clearTimeout(safetyTimer);
        safetyTimer = 0;
      }
      for (const anim of activeAnims) {
        try {
          anim.cancel();
        } catch {
          undefined;
        }
      }
      activeAnims = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (hostRef.current) {
        hostRef.current.removeAttribute('data-active');
      }
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      busyRef.current = false;
    };

    const commitWithTransition = (
      nextTheme: 'light' | 'dark',
      clipKeyframes: string[],
      durationMs: number,
      easing: string,
      onReady?: () => void,
      onFinish?: () => void
    ) => {
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
      };
      if (typeof doc.startViewTransition !== 'function') {
        setTheme(nextTheme);
        cleanup();
        onFinish?.();
        return;
      }

      const runToken = activeRun;
      if (hostRef.current) {
        hostRef.current.setAttribute('data-active', 'true');
      }
      safetyTimer = window.setTimeout(() => {
        if (runToken === activeRun) {
          cleanup();
          onFinish?.();
        }
      }, durationMs + 1400);

      try {
        const vt = doc.startViewTransition(() => {
          flushSync(() => {
            setTheme(nextTheme);
          });
        });

        void vt.ready
          .then(() => {
            if (runToken !== activeRun) return;
            const oldHold = document.documentElement.animate(
              { opacity: [1, 1] },
              {
                duration: durationMs,
                easing: 'linear',
                pseudoElement: '::view-transition-old(root)',
                fill: 'forwards',
              }
            );
            const newReveal = document.documentElement.animate(
              { clipPath: clipKeyframes },
              {
                duration: durationMs,
                easing,
                pseudoElement: '::view-transition-new(root)',
                fill: 'forwards',
              }
            );
            activeAnims = [oldHold, newReveal];
            onReady?.();
          })
          .catch(() => undefined);

        void vt.finished.finally(() => {
          if (runToken === activeRun) {
            cleanup();
            onFinish?.();
          }
        });
      } catch {
        setTheme(nextTheme);
        cleanup();
        onFinish?.();
      }
    };

    const onTrigger = (event: Event) => {
      const detail = (event as CustomEvent<{ x?: number; y?: number } | null>).detail;
      const current = themeRef.current;
      const next: 'light' | 'dark' = current === 'dark' ? 'light' : 'dark';
      const activeEffect = effectRef.current;
      const prefersReduced =
        reducedRef.current ||
        (typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches);

      if (prefersReduced || activeEffect === 'none' || document.visibilityState !== 'visible') {
        cleanup();
        setTheme(next);
        return;
      }

      if (busyRef.current) return;
      busyRef.current = true;
      activeRun += 1;
      const myRun = activeRun;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d') || null;
      if (canvas && ctx) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const cx = detail?.x ?? w - 96;
      const cy = detail?.y ?? 30;
      const maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 32;
      const accent = next === 'dark' ? '#38c99a' : '#0b7a59';
      const highlight = next === 'dark' ? '#f4f7f5' : '#111816';

      if (activeEffect === 'rain') {
        sound.playRain();
        const sweepMs = 620;
        const drops = Array.from({ length: 48 }, (_, idx) => ({
          x: ((idx + 0.4) / 48) * w + (Math.random() - 0.5) * 28,
          y: Math.random() * h * 0.85 - h * 0.1,
          vy: 1260 + Math.random() * 540,
          len: 22 + Math.random() * 24,
          alpha: 0.42 + Math.random() * 0.42,
        }));

        const startRain = () => {
          const t0 = performance.now();
          let prev = t0;
          const rainTick = (now: number) => {
            if (myRun !== activeRun || !busyRef.current) return;
            const dt = Math.min(0.05, (now - prev) / 1000);
            prev = now;
            const p = Math.min(1, (now - t0) / sweepMs);
            const fade = p > 0.72 ? Math.max(0, 1 - (p - 0.72) / 0.28) : 1;
            if (ctx) {
              ctx.clearRect(0, 0, w, h);
              for (const d of drops) {
                d.y += d.vy * dt;
                d.x += d.vy * dt * 0.14;
                if (d.y > h + 24) {
                  d.y = -24;
                  d.x = Math.random() * w;
                }
                ctx.strokeStyle = accent;
                ctx.globalAlpha = d.alpha * fade;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + d.len * 0.14, d.y + d.len);
                ctx.stroke();
              }
              ctx.globalAlpha = 1;
            }
            if (p < 1) {
              rafId = requestAnimationFrame(rainTick);
            }
          };
          rafId = requestAnimationFrame(rainTick);
        };

        commitWithTransition(
          next,
          buildRainCurtainKeyframes(),
          sweepMs,
          'cubic-bezier(0.32, 0.04, 0.24, 1)',
          startRain
        );
        return;
      }

      if (activeEffect === 'droplet') {
        sound.playDroplet();
        const spreadMs = 560;
        const startRipple = () => {
          const t0 = performance.now();
          const rippleTick = (now: number) => {
            if (myRun !== activeRun || !busyRef.current) return;
            const p = Math.min(1, (now - t0) / spreadMs);
            const ease = 1 - Math.pow(1 - p, 3);
            const radius = ease * maxR;
            const fade = Math.max(0, 1 - p);
            if (ctx) {
              ctx.clearRect(0, 0, w, h);
              ctx.strokeStyle = accent;
              ctx.globalAlpha = 0.62 * fade;
              ctx.lineWidth = 2.4 * (1 - p * 0.5);
              ctx.beginPath();
              ctx.arc(cx, cy, Math.max(2, radius), 0, Math.PI * 2);
              ctx.stroke();

              if (radius > 34) {
                ctx.strokeStyle = highlight;
                ctx.globalAlpha = 0.28 * fade;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(cx, cy, Math.max(2, radius - 26), 0, Math.PI * 2);
                ctx.stroke();
              }
              ctx.globalAlpha = 1;
            }
            if (p < 1) {
              rafId = requestAnimationFrame(rippleTick);
            }
          };
          rafId = requestAnimationFrame(rippleTick);
        };

        commitWithTransition(
          next,
          [
            `circle(0px at ${cx}px ${cy}px)`,
            `circle(${maxR.toFixed(1)}px at ${cx}px ${cy}px)`,
          ],
          spreadMs,
          'cubic-bezier(0.22, 1, 0.36, 1)',
          startRipple
        );
        return;
      }

      sound.playBurst();
      const burstMs = 600;
      const sparks = Array.from({ length: 24 }, (_, idx) => {
        const angle = (idx / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.16;
        return {
          angle,
          speed: 220 + Math.random() * 240,
          size: 2 + Math.random() * 2.4,
        };
      });
      const startSparks = () => {
        const t0 = performance.now();
        const sparkTick = (now: number) => {
          if (myRun !== activeRun || !busyRef.current) return;
          const p = Math.min(1, (now - t0) / burstMs);
          const ease = 1 - Math.pow(1 - p, 3);
          const fade = Math.max(0, 1 - p);
          if (ctx) {
            ctx.clearRect(0, 0, w, h);
            for (const sp of sparks) {
              const dist = ease * sp.speed;
              const px = cx + Math.cos(sp.angle) * dist;
              const py = cy + Math.sin(sp.angle) * dist;
              ctx.fillStyle = accent;
              ctx.globalAlpha = 0.78 * fade;
              ctx.beginPath();
              ctx.arc(px, py, sp.size * (1 - p * 0.4), 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
          if (p < 1) {
            rafId = requestAnimationFrame(sparkTick);
          }
        };
        rafId = requestAnimationFrame(sparkTick);
      };
      commitWithTransition(
        next,
        [
          `circle(0px at ${cx}px ${cy}px)`,
          `circle(${maxR.toFixed(1)}px at ${cx}px ${cy}px)`,
        ],
        burstMs,
        'cubic-bezier(0.16, 1, 0.3, 1)',
        startSparks
      );
    };

    window.addEventListener(PINUI_THEME_EVENT, onTrigger);
    return () => {
      window.removeEventListener(PINUI_THEME_EVENT, onTrigger);
      cleanup();
      sound.dispose();
    };
  }, [setTheme]);

  return (
    <div ref={hostRef} className="ff-pinui-theme-host" aria-hidden="true">
      <canvas ref={canvasRef} className="ff-pinui-fx-canvas" />
    </div>
  );
};

export default GlobalThemeAtmosphere;
