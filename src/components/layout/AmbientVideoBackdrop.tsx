import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import type { ThemeMode, WallpaperPreset } from '../../types/index';
import './ambient-video.css';

const LIGHT_VIDEO = '/assets/videos/Gradient_Lab_001.mp4';
const DARK_VIDEO = '/assets/videos/Gradient_Lab_002.mp4';
const LIGHT_POSTER = '/assets/videos/Gradient_Lab_001_poster.jpg';
const DARK_POSTER = '/assets/videos/Gradient_Lab_002_poster.jpg';
const LOOP_CROSSFADE_S = 1.35;

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

function shouldUseStaticPoster(ambientEnabled: boolean, reducedMotion: boolean): boolean {
  if (!ambientEnabled || reducedMotion) return true;
  if (typeof window === 'undefined') return true;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  const nav = navigator as Navigator & { connection?: NetworkInformationLike };
  if (nav.connection?.saveData) {
    return true;
  }
  if (nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g') {
    return true;
  }
  return false;
}

const AuroraCanvasLayer: React.FC<{ theme: ThemeMode; reduced: boolean }> = ({ theme, reduced }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const S = 72;
    canvas.width = S;
    canvas.height = S;

    const darkColors = [
      [214, 58, 39],
      [125, 163, 187],
      [176, 174, 198],
      [221, 173, 149],
      [61, 139, 255],
    ];
    const lightColors = [
      [221, 173, 149],
      [186, 217, 230],
      [176, 174, 198],
      [125, 163, 187],
      [242, 200, 176],
    ];
    const col = theme === 'dark' ? darkColors : lightColors;
    const bg = theme === 'dark' ? [12, 11, 16] : [244, 240, 230];
    const blobs = [0, 1, 2, 3, 4].map((i) => ({
      bx: 0.2 + ((i * 0.37) % 0.7),
      by: 0.25 + ((i * 0.53) % 0.6),
      r: 0.4 + (i % 3) * 0.1,
      ph: i * 1.7,
      sp: 0.16 + i * 0.03,
    }));

    let ptr: { x: number; y: number } | null = null;
    const follow = { x: 0.5, y: 0.5 };
    let raf = 0;
    let last = performance.now();
    let t = 0;

    const draw = (time: number) => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgb(${bg.join(',')})`;
      ctx.fillRect(0, 0, S, S);
      ctx.globalCompositeOperation = theme === 'dark' ? 'lighter' : 'multiply';
      blobs.forEach((b, i) => {
        let x = b.bx + Math.sin(time * b.sp + b.ph) * 0.18;
        let y = b.by + Math.cos(time * b.sp * 0.8 + b.ph * 1.3) * 0.16;
        if (ptr) {
          x += (ptr.x - x) * 0.14;
          y += (ptr.y - y) * 0.14;
        }
        if (i === 0) {
          x = follow.x;
          y = follow.y;
        }
        const c = col[i];
        const g = ctx.createRadialGradient(x * S, y * S, 0, x * S, y * S, b.r * S);
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${theme === 'dark' ? 0.52 : 0.45})`);
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, S, S);
      });
    };

    const onMove = (e: PointerEvent) => {
      ptr = { x: e.clientX / Math.max(1, window.innerWidth), y: e.clientY / Math.max(1, window.innerHeight) };
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    if (reduced) {
      draw(2);
      return () => window.removeEventListener('pointermove', onMove);
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      t += dt;
      const aim = ptr || { x: 0.35 + Math.sin(t * 0.21) * 0.15, y: 0.35 + Math.cos(t * 0.17) * 0.12 };
      follow.x += (aim.x - follow.x) * (1 - Math.pow(0.15, dt));
      follow.y += (aim.y - follow.y) * (1 - Math.pow(0.15, dt));
      draw(t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [theme, reduced]);

  return <canvas ref={canvasRef} className="ambient-aurora-canvas" aria-hidden="true" />;
};

const ConstellationCanvasLayer: React.FC<{ theme: ThemeMode; reduced: boolean }> = ({ theme, reduced }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes = Array.from({ length: 58 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 18,
    }));

    let ptr: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      ptr = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      ptr = null;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);

    const LINK = 135;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let a = 0; a < nodes.length; a += 1) {
        for (let b = a + 1; b < nodes.length; b += 1) {
          const dx = nodes[a].x - nodes[b].x;
          const dy = nodes[a].y - nodes[b].y;
          if (Math.abs(dx) > LINK || Math.abs(dy) > LINK) continue;
          const d = Math.hypot(dx, dy);
          if (d > LINK) continue;
          const alpha = (1 - d / LINK) * (theme === 'dark' ? 0.28 : 0.22);
          ctx.strokeStyle = theme === 'dark' ? `rgba(186, 217, 230, ${alpha})` : `rgba(44, 88, 117, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[a].x, nodes[a].y);
          ctx.lineTo(nodes[b].x, nodes[b].y);
          ctx.stroke();
        }
      }
      if (ptr) {
        nodes.forEach((p) => {
          const d = Math.hypot(p.x - ptr!.x, p.y - ptr!.y);
          if (d > 170) return;
          const alpha = (1 - d / 170) * 0.45;
          ctx.strokeStyle = theme === 'dark' ? `rgba(255, 196, 128, ${alpha})` : `rgba(200, 90, 58, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ptr!.x, ptr!.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        });
      }
      nodes.forEach((p) => {
        ctx.fillStyle = theme === 'dark' ? 'rgba(231, 236, 255, 0.72)' : 'rgba(25, 42, 60, 0.56)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.7, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    if (reduced) {
      draw();
      return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerleave', onLeave);
      };
    }

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      nodes.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        p.x = Math.max(0, Math.min(W, p.x));
        p.y = Math.max(0, Math.min(H, p.y));
      });
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [theme, reduced]);

  return <canvas ref={canvasRef} className="ambient-constellation-canvas" aria-hidden="true" />;
};

const SeamlessLoopVideo: React.FC<{
  src: string;
  poster: string;
  active: boolean;
}> = ({ src, poster, active }) => {
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const [slot, setSlot] = useState<'a' | 'b'>('a');
  const [failed, setFailed] = useState(false);
  const switchingRef = useRef(false);

  useEffect(() => {
    switchingRef.current = false;
    setSlot('a');
    const va = videoARef.current;
    const vb = videoBRef.current;
    if (!active) {
      va?.pause();
      vb?.pause();
      return undefined;
    }
    if (va) {
      va.currentTime = 0;
      va.play().catch(() => undefined);
    }
    return undefined;
  }, [src, active]);

  useEffect(() => {
    if (!active || failed) return undefined;
    const activeEl = slot === 'a' ? videoARef.current : videoBRef.current;
    const nextEl = slot === 'a' ? videoBRef.current : videoARef.current;
    if (!activeEl || !nextEl) return undefined;

    const onTimeUpdate = () => {
      const dur = activeEl.duration;
      if (!Number.isFinite(dur) || dur <= 2.4) return;
      if (!switchingRef.current && activeEl.currentTime >= dur - LOOP_CROSSFADE_S) {
        switchingRef.current = true;
        nextEl.currentTime = 0.04;
        nextEl.play().catch(() => undefined);
        setSlot((prev) => (prev === 'a' ? 'b' : 'a'));
        window.setTimeout(() => {
          activeEl.pause();
          activeEl.currentTime = 0;
          switchingRef.current = false;
        }, 1250);
      }
    };

    activeEl.addEventListener('timeupdate', onTimeUpdate);
    return () => activeEl.removeEventListener('timeupdate', onTimeUpdate);
  }, [slot, active, failed, src]);

  if (failed) {
    return (
      <img
        className="ambient-layer ambient-layer--poster"
        data-active={active ? 'true' : 'false'}
        src={poster}
        alt=""
      />
    );
  }

  return (
    <>
      <video
        ref={videoARef}
        className="ambient-layer ambient-layer--seamless"
        data-active={active && slot === 'a' ? 'true' : 'false'}
        src={src}
        poster={poster}
        muted
        playsInline
        preload={active ? 'auto' : 'metadata'}
        onError={() => setFailed(true)}
      />
      <video
        ref={videoBRef}
        className="ambient-layer ambient-layer--seamless"
        data-active={active && slot === 'b' ? 'true' : 'false'}
        src={src}
        poster={poster}
        muted
        playsInline
        preload={active ? 'auto' : 'metadata'}
        onError={() => setFailed(true)}
      />
    </>
  );
};

export const AmbientVideoBackdrop: React.FC = () => {
  const { theme, settings, reducedMotion } = useAppStore();
  const ambientEnabled = settings.ambientVideo !== false;
  const preset: WallpaperPreset = settings.wallpaperPreset || 'ember';
  const [posterOnly, setPosterOnly] = useState<boolean>(() =>
    shouldUseStaticPoster(ambientEnabled, reducedMotion)
  );

  useEffect(() => {
    const syncStaticMode = () => {
      setPosterOnly(shouldUseStaticPoster(ambientEnabled, reducedMotion));
    };
    syncStaticMode();
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    mqMotion.addEventListener('change', syncStaticMode);
    return () => mqMotion.removeEventListener('change', syncStaticMode);
  }, [ambientEnabled, reducedMotion]);

  if (!ambientEnabled && (preset === 'dark' || preset === 'light' || preset === 'auto')) {
    return null;
  }

  const isVideoPreset =
    preset === 'ember' || preset === 'harbour' || preset === 'auto';
  const useLightAsset =
    preset === 'harbour' || (preset === 'auto' && theme === 'light') || (preset === 'ember' && theme === 'light');
  const activeVideoSrc = useLightAsset ? LIGHT_VIDEO : DARK_VIDEO;
  const activePoster = useLightAsset ? LIGHT_POSTER : DARK_POSTER;

  return (
    <div className="ambient-backdrop" aria-hidden="true" data-mode={theme} data-preset={preset}>
      {isVideoPreset && ambientEnabled && (
        posterOnly ? (
          <img
            className="ambient-layer ambient-layer--poster"
            data-active="true"
            src={activePoster}
            alt=""
          />
        ) : (
          <SeamlessLoopVideo src={activeVideoSrc} poster={activePoster} active />
        )
      )}

      {preset === 'aurora' && <AuroraCanvasLayer theme={theme} reduced={reducedMotion} />}
      {preset === 'constellation' && <ConstellationCanvasLayer theme={theme} reduced={reducedMotion} />}

      <div className="ambient-scrim" />
    </div>
  );
};

export default AmbientVideoBackdrop;
