import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export const GlobalThemeAtmosphere: React.FC = () => {
  const { theme, settings, reducedMotion } = useAppStore();
  const effect = settings.themeEffect || 'droplet';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevThemeRef = useRef(theme);
  const burstRef = useRef<{ kind: string; startedAt: number } | null>(null);

  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      prevThemeRef.current = theme;
      if (!reducedMotion && effect !== 'none') {
        burstRef.current = { kind: effect, startedAt: performance.now() };
      }
    }
  }, [theme, effect, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || effect === 'none') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let raf = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const darkPalette =
      effect === 'diwali'
        ? ['#ffb26b', '#ff6450', '#ffe082', '#ddad95']
        : ['#7da3bb', '#bad9e6', '#ffe9d6'];
    const lightPalette =
      effect === 'diwali'
        ? ['#d63a27', '#b45309', '#be123c', '#7c2d12']
        : ['#2c5875', '#4a6b82', '#c85a3a'];

    const spawnAmbient = () => {
      const palette = theme === 'dark' ? darkPalette : lightPalette;
      const color = palette[Math.floor(Math.random() * palette.length)];
      if (effect === 'rain') {
        particles.push({
          x: Math.random() * width,
          y: -16,
          vx: -0.6,
          vy: 5.5 + Math.random() * 4.5,
          r: 1.1 + Math.random() * 1.1,
          alpha: theme === 'dark' ? 0.24 : 0.18,
          life: 0,
          maxLife: 160,
          color,
        });
      } else if (effect === 'diwali') {
        particles.push({
          x: Math.random() * width,
          y: height * (0.15 + Math.random() * 0.7),
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.35 - Math.random() * 0.45,
          r: 1.4 + Math.random() * 1.6,
          alpha: theme === 'dark' ? 0.34 : 0.24,
          life: 0,
          maxLife: 140,
          color,
        });
      }
    };

    let burstSpawned = 0;

    const frame = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      const burst = burstRef.current;
      if (burst) {
        const elapsed = now - burst.startedAt;
        const progress = Math.min(1, elapsed / 1150);
        const palette = theme === 'dark' ? darkPalette : lightPalette;

        if (burst.kind === 'droplet') {
          const maxRadius = Math.hypot(width, height) * 0.72;
          const r1 = maxRadius * Math.pow(progress, 0.75);
          const r2 = maxRadius * Math.pow(Math.max(0, progress - 0.12), 0.78);
          const fade = (1 - progress) * (theme === 'dark' ? 0.42 : 0.32);

          ctx.save();
          ctx.strokeStyle = theme === 'dark' ? `rgba(186, 217, 230, ${fade})` : `rgba(44, 88, 117, ${fade})`;
          ctx.lineWidth = 3 * (1 - progress * 0.6);
          ctx.beginPath();
          ctx.arc(width * 0.84, 34, Math.max(4, r1), 0, Math.PI * 2);
          ctx.stroke();

          if (r2 > 4) {
            ctx.strokeStyle = theme === 'dark' ? `rgba(255, 100, 80, ${fade * 0.75})` : `rgba(200, 90, 58, ${fade * 0.75})`;
            ctx.lineWidth = 2 * (1 - progress * 0.5);
            ctx.beginPath();
            ctx.arc(width * 0.84, 34, r2, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        } else if (burstSpawned !== burst.startedAt) {
          burstSpawned = burst.startedAt;
          const total = burst.kind === 'diwali' ? 54 : 42;
          for (let i = 0; i < total; i += 1) {
            const angle = (Math.PI * 2 * i) / total + Math.random() * 0.25;
            const speed = burst.kind === 'diwali' ? 2.5 + Math.random() * 5.2 : 3.2 + Math.random() * 4;
            particles.push({
              x: burst.kind === 'rain' ? Math.random() * width : width * (0.25 + Math.random() * 0.5),
              y: burst.kind === 'rain' ? -20 - Math.random() * 140 : height * (0.2 + Math.random() * 0.45),
              vx: burst.kind === 'rain' ? -1.1 : Math.cos(angle) * speed,
              vy: burst.kind === 'rain' ? 9 + Math.random() * 6 : Math.sin(angle) * speed,
              r: burst.kind === 'diwali' ? 2 + Math.random() * 2.2 : 1.6,
              alpha: theme === 'dark' ? 0.75 : 0.6,
              life: 0,
              maxLife: 75 + Math.random() * 35,
              color: palette[i % palette.length],
            });
          }
        }

        if (progress >= 1) {
          burstRef.current = null;
        }
      }

      if ((effect === 'rain' || effect === 'diwali') && particles.length < 38 && Math.random() < 0.24) {
        spawnAmbient();
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        if (effect === 'diwali') {
          p.vy += 0.035;
          p.vx *= 0.985;
        }
        const fade = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = p.alpha * fade;
        if (effect === 'rain') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.r;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.1);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (p.life >= p.maxLife || p.y > height + 40) {
          particles.splice(i, 1);
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [theme, effect, reducedMotion]);

  if (reducedMotion || effect === 'none') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 80,
        pointerEvents: 'none',
      }}
    />
  );
};

export default GlobalThemeAtmosphere;
