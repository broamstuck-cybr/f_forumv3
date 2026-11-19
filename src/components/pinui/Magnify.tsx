import React, { useEffect, useId, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import './magnify.css';

export interface MagnifyProps {
  glyph?: string;
  microText?: string;
  hintText?: string;
  theme?: 'light' | 'dark';
  size?: number;
  className?: string;
}

const R0 = 50;
const LENS_OUTER = 112;
const RIM = 6;
const LENS_INNER = LENS_OUTER - RIM * 2;
const LENS_SCALE = (R0 * 2) / LENS_INNER;
const MICRO_SIZE = 5.6;
const ROW_H = MICRO_SIZE * 0.93;
const REST_ZOOM = 2.6;
const ZOOM_MAX = 4.2;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const Magnify: React.FC<MagnifyProps> = ({
  glyph = 'F',
  microText = 'TYPOGRAPHY · TỶ LỆ · PHẢN BIỆN · CHẤT LIỆU · KIẾN TRÚC · ',
  hintText = 'Di chuyển để soi · Bấm để phóng đại',
  theme,
  size = 380,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const uid = useId().replace(/:/g, '');
  const grainId = `pmag-grain-${uid}`;
  const clipId = `pmag-clip-${uid}`;
  const posterRef = useRef<HTMLDivElement>(null);

  const [zoomed, setZoomed] = useState(false);
  const [posterWidth, setPosterWidth] = useState(size);
  const [lensPos, setLensPos] = useState({ x: 250, y: 340 });

  const zoom = zoomed ? ZOOM_MAX : REST_ZOOM;
  const k = posterWidth / 500;

  const kMV = useMotionValue(k);
  const zoomTarget = useMotionValue(zoom);
  const zoomMV = useSpring(zoomTarget, { stiffness: 280, damping: 28, mass: 0.8 });

  const targetX = useMotionValue(250 * k);
  const targetY = useMotionValue(340 * k);
  const lensX = useSpring(targetX, { stiffness: 260, damping: 28, mass: 0.9 });
  const lensY = useSpring(targetY, { stiffness: 260, damping: 28, mass: 0.9 });
  const velX = useVelocity(lensX);
  const tilt = useTransform(velX, (v) => (reduced ? 0 : clamp(v / 140, -8, 8)));

  const innerTransform = useTransform(
    [lensX, lensY, kMV, zoomMV],
    ([lx, ly, curK, curZ]: number[]) => {
      const safeK = Math.max(0.1, curK);
      const innerZoom = curZ * safeK * LENS_SCALE;
      const cx = lx / safeK;
      const cy = ly / safeK;
      const innerX = R0 - cx * innerZoom;
      const innerY = R0 - cy * innerZoom;
      return `translate(${innerX}, ${innerY}) scale(${innerZoom})`;
    }
  );

  useEffect(() => {
    const el = posterRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setPosterWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    kMV.set(k);
    targetX.set(lensPos.x * k);
    targetY.set(lensPos.y * k);
    zoomTarget.set(zoom);
    if (reduced) {
      lensX.jump(lensPos.x * k);
      lensY.jump(lensPos.y * k);
      zoomMV.jump(zoom);
    }
  }, [k, lensPos.x, lensPos.y, zoom, reduced, kMV, targetX, targetY, lensX, lensY, zoomTarget, zoomMV]);

  const rows = Array.from({ length: 132 }, (_, idx) => {
    const start = (idx * 7) % microText.length;
    return (microText + microText).slice(start, start + 96);
  });

  const moveBy = (dx: number, dy: number) => {
    setLensPos((prev) => ({
      x: clamp(prev.x + dx, 48, 452),
      y: clamp(prev.y + dy, 48, 632),
    }));
  };

  return (
    <div className={`pmag ${className}`} style={{ maxWidth: `${size}px` }} data-theme={theme}>
      <div
        ref={posterRef}
        className="pmag__poster"
        tabIndex={0}
        role="img"
        aria-label={hintText}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const cw = e.currentTarget.clientWidth || rect.width;
          const ch = e.currentTarget.clientHeight || rect.height;
          const relX = e.clientX - rect.left - e.currentTarget.clientLeft;
          const relY = e.clientY - rect.top - e.currentTarget.clientTop;
          const x = clamp((relX / cw) * 500, 32, 468);
          const y = clamp((relY / ch) * 680, 32, 648);
          setLensPos({ x, y });
        }}
        onClick={() => setZoomed((z) => !z)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 36 : 14;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            moveBy(-step, 0);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            moveBy(step, 0);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveBy(0, -step);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveBy(0, step);
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setZoomed((z) => !z);
          } else if (e.key === 'Escape') {
            setZoomed(false);
          }
        }}
      >
        <svg className="pmag__grain" viewBox="0 0 500 680" aria-hidden="true">
          <filter id={grainId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="500" height="680" filter={`url(#${grainId})`} />
        </svg>

        <div className="pmag__sheen" aria-hidden="true" />

        <svg className="pmag__svg" viewBox="0 0 500 680" aria-hidden="true">
          <text x="250" y="510" textAnchor="middle" className="pmag__glyph-fill">
            {glyph}
          </text>
          <motion.text
            x="250"
            y="510"
            textAnchor="middle"
            className="pmag__glyph-shape"
            initial={reduced ? false : { strokeDasharray: '1800', strokeDashoffset: 1800 }}
            whileInView={{ strokeDashoffset: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {glyph}
          </motion.text>
        </svg>

        <motion.div
          className="pmag__lens"
          style={{
            x: lensX,
            y: lensY,
            rotate: tilt,
          }}
          aria-hidden="true"
        >
          <div className="pmag__handle" />
          <div className="pmag__lensBody">
            <svg viewBox="0 0 100 100" className="w-full h-full block">
              <defs>
                <clipPath id={clipId}>
                  <text
                    x="250"
                    y="510"
                    textAnchor="middle"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '480px',
                      fontWeight: 700,
                    }}
                  >
                    {glyph}
                  </text>
                </clipPath>
              </defs>
              <motion.g transform={innerTransform}>
                <g clipPath={`url(#${clipId})`}>
                  {rows.map((line, i) => (
                    <text
                      key={i}
                      x="0"
                      y={i * ROW_H}
                      fill="var(--accent-primary)"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: `${MICRO_SIZE}px`,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              </motion.g>
            </svg>
          </div>
        </motion.div>
      </div>

      <div className="pmag__hint">{hintText}</div>
    </div>
  );
};

export default Magnify;
