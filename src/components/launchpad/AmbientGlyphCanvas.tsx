import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore';

interface GlyphParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  glyph: string;
  alpha: number;
  size: number;
  tone: 'amber' | 'verdigris' | 'ink';
}

const GLYPHS = ['+', '/', ':', '.', '*', '=', '-', '<', '>'];

export const AmbientGlyphCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, reducedMotion } = useAppStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: GlyphParticle[] = [];
    let rafId = 0;
    let lastDraw = 0;
    const frameInterval = 1000 / 30;

    const palette =
      theme === 'dark'
        ? {
            amber: 'rgba(245, 158, 11, ',
            verdigris: 'rgba(45, 212, 191, ',
            ink: 'rgba(241, 239, 233, ',
          }
        : {
            amber: 'rgba(180, 83, 9, ',
            verdigris: 'rgba(15, 118, 110, ',
            ink: 'rgba(15, 20, 30, ',
          };

    const seed = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width));
      height = Math.max(240, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(48, Math.max(18, Math.floor((width * height) / 26000)));
      particles = Array.from({ length: count }, (_, i) => {
        const tones: Array<GlyphParticle['tone']> = ['amber', 'verdigris', 'ink'];
        return {
          x: ((i * 97) % width) + (Math.random() * 24 - 12),
          y: ((i * 61) % height) + (Math.random() * 24 - 12),
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.22,
          glyph: GLYPHS[i % GLYPHS.length],
          alpha: 0.12 + (i % 4) * 0.055,
          size: 11 + (i % 3) * 2,
          tone: tones[i % 3],
        };
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const p of particles) {
        ctx.font = `500 ${p.size}px "JetBrains Mono", monospace`;
        ctx.fillStyle = `${palette[p.tone]}${p.alpha.toFixed(2)})`;
        ctx.fillText(p.glyph, p.x, p.y);
      }
    };

    const tick = (now: number) => {
      rafId = window.requestAnimationFrame(tick);
      if (document.hidden || now - lastDraw < frameInterval) return;
      lastDraw = now;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.992;
        p.vy *= 0.992;
        if (Math.abs(p.vx) < 0.08) p.vx += (Math.random() - 0.5) * 0.04;
        if (Math.abs(p.vy) < 0.08) p.vy += (Math.random() - 0.5) * 0.04;

        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;
        if (p.y < -12) p.y = height + 12;
        if (p.y > height + 12) p.y = -12;
      }

      draw();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (prefersReduced) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      if (cx < 0 || cy < 0 || cx > rect.width || cy > rect.height) return;
      for (const p of particles) {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < 170) {
          const force = (1 - dist / 170) * 2.2;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
    };

    seed();
    draw();

    const ro = new ResizeObserver(() => {
      seed();
      draw();
    });
    ro.observe(canvas);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    if (!prefersReduced) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [theme, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
};

export default AmbientGlyphCanvas;
