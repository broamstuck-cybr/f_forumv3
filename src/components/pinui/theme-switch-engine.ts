import type { ThemeEffect } from '../../types/index';

export interface ThemeSwitchEngineOptions {
  root: HTMLElement;
  button: HTMLButtonElement;
  fx: HTMLElement;
  getTheme: () => 'light' | 'dark';
  getEffect: () => ThemeEffect;
  isSoundEnabled: () => boolean;
  onCommit: (next: 'light' | 'dark') => void;
}

export interface ThemeSwitchEngineHandle {
  trigger: () => void;
  destroy: () => void;
}

class SwitchSoundEngine {
  private ctx: AudioContext | null = null;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  playDroplet() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.09);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playRain() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.45));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1900, now);
    filter.Q.value = 1.4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  playDiwali() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(54, now + 0.16);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  dispose() {
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }
}

export function createThemeSwitch(opts: ThemeSwitchEngineOptions): ThemeSwitchEngineHandle {
  const WATCHDOG_MS = 5000;
  const sound = new SwitchSoundEngine();
  let busy = false;
  let rafId = 0;
  let watchdogId = 0;

  const cleanup = () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (watchdogId) window.clearTimeout(watchdogId);
    rafId = 0;
    watchdogId = 0;
    opts.fx.innerHTML = '';
    busy = false;
  };

  const commit = (next: 'light' | 'dark') => {
    cleanup();
    opts.onCommit(next);
  };

  const trigger = () => {
    if (busy) return;
    const current = opts.getTheme();
    const next: 'light' | 'dark' = current === 'dark' ? 'light' : 'dark';
    const effect = opts.getEffect();

    const prefersReduced =
      typeof window !== 'undefined' &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.classList.contains('reduce-motion') ||
        document.visibilityState !== 'visible');

    if (prefersReduced) {
      opts.onCommit(next);
      return;
    }

    busy = true;
    const rect = opts.root.getBoundingClientRect();
    const btnRect = opts.button.getBoundingClientRect();
    const originX = btnRect.left - rect.left + btnRect.width / 2;
    const originY = btnRect.top - rect.top + btnRect.height / 2;
    const w = Math.max(rect.width, 320);
    const h = Math.max(rect.height, 280);
    const floodColor = next === 'dark' ? '#090a0d' : '#f7f5f0';
    const accentColor = next === 'dark' ? '#c89b54' : '#9a6e28';

    watchdogId = window.setTimeout(() => commit(next), WATCHDOG_MS);

    if (opts.isSoundEnabled()) {
      if (effect === 'droplet') sound.playDroplet();
      else if (effect === 'rain') sound.playRain();
      else sound.playDiwali();
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'pts__canvas';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    opts.fx.innerHTML = '';
    opts.fx.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      commit(next);
      return;
    }
    ctx.scale(dpr, dpr);

    const maxR = Math.hypot(Math.max(originX, w - originX), Math.max(originY, h - originY)) + 16;
    const start = performance.now();

    if (effect === 'droplet') {
      const dropStartY = Math.max(12, originY - 88);
      const dropTime = 240;
      const floodTime = 480;
      const total = dropTime + floodTime;

      const step = (now: number) => {
        const elapsed = now - start;
        ctx.clearRect(0, 0, w, h);

        if (elapsed < dropTime) {
          const t = elapsed / dropTime;
          const y = dropStartY + (originY - dropStartY) * (t * t);
          ctx.beginPath();
          ctx.fillStyle = accentColor;
          ctx.ellipse(originX, y, 4.2 - t * 0.8, 7 + t * 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const ft = Math.min(1, (elapsed - dropTime) / floodTime);
          const ease = 1 - Math.pow(1 - ft, 3);
          const radius = ease * maxR;

          ctx.beginPath();
          ctx.arc(originX, originY, radius, 0, Math.PI * 2);
          ctx.fillStyle = floodColor;
          ctx.fill();

          if (ft < 0.72) {
            ctx.beginPath();
            ctx.arc(originX, originY, Math.min(maxR, 14 + ease * 110), 0, Math.PI * 2);
            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = (1 - ft / 0.72) * 0.75;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        if (elapsed < total) {
          rafId = requestAnimationFrame(step);
        } else {
          commit(next);
        }
      };

      rafId = requestAnimationFrame(step);
      return;
    }

    if (effect === 'rain') {
      const drops = Array.from({ length: 42 }, (_, i) => ({
        x: ((i + 0.5) / 42) * w + (Math.random() - 0.5) * 18,
        y: -Math.random() * h * 0.5,
        vy: 560 + Math.random() * 340,
        len: 16 + Math.random() * 14,
      }));
      const puddles = Array.from({ length: 7 }, (_, i) => {
        const px = ((i + 0.6) / 7) * w + (Math.random() - 0.5) * 32;
        const py = h * (0.22 + (i % 2 === 0 ? 0.15 : 0.45) + Math.random() * 0.22);
        const targetR = Math.hypot(Math.max(px, w - px), Math.max(py, h - py)) + 16;
        return {
          x: px,
          y: py,
          delay: 90 + i * 32,
          targetR,
        };
      });
      const windRad = (9 * Math.PI) / 180;
      const total = 680;
      let lastT = start;

      const step = (now: number) => {
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;
        const elapsed = now - start;
        ctx.clearRect(0, 0, w, h);

        for (const p of puddles) {
          if (elapsed > p.delay) {
            const pt = Math.min(1, (elapsed - p.delay) / 350);
            const pr = (1 - Math.pow(1 - pt, 2.5)) * p.targetR;
            ctx.beginPath();
            ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
            ctx.fillStyle = floodColor;
            ctx.fill();
          }
        }

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = Math.max(0.15, 1 - elapsed / total);
        for (const d of drops) {
          d.y += d.vy * dt;
          d.x += Math.tan(windRad) * d.vy * dt;
          if (d.y > h) d.y = -20;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + Math.tan(windRad) * d.len, d.y + d.len);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        if (elapsed < total) {
          rafId = requestAnimationFrame(step);
        } else {
          commit(next);
        }
      };

      rafId = requestAnimationFrame(step);
      return;
    }

    const particles = Array.from({ length: 34 }, (_, i) => {
      const ang = (i / 34) * Math.PI * 2 + Math.random() * 0.14;
      const spd = 140 + Math.random() * 210;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        r: 2 + Math.random() * 2.4,
      };
    });
    const total = 740;
    let lastT = start;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);

      const ft = Math.min(1, elapsed / total);
      const floodEase = Math.pow(ft, 1.8);
      ctx.beginPath();
      ctx.arc(originX, originY, floodEase * maxR, 0, Math.PI * 2);
      ctx.fillStyle = floodColor;
      ctx.fill();

      for (const p of particles) {
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 + 210 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = Math.max(0, 1 - ft * 1.1);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (elapsed < total) {
        rafId = requestAnimationFrame(step);
      } else {
        commit(next);
      }
    };

    rafId = requestAnimationFrame(step);
  };

  return {
    trigger,
    destroy: () => {
      cleanup();
      sound.dispose();
    },
  };
}
