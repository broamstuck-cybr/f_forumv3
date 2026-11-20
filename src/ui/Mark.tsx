/* Hand-drawn annotation adapted from Lucian UX/UI Prompt #392 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#392 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type MarkKind = 'underline' | 'circle' | 'box' | 'strike';

interface MarkProps {
  kind?: MarkKind;
  delay?: number;
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

interface Size {
  w: number;
  h: number;
}

function seeded(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function buildPath(kind: MarkKind, size: Size, pass: number, seed: number): string {
  const rand = seeded(seed + pass * 97);
  const j = (n: number) => (rand() - 0.5) * 2 * n;
  const { w, h } = size;
  const s = pass ? 1.6 : 1;
  if (kind === 'underline') {
    return `M${-2} ${h - 1 + j(1.5)} Q${w / 2} ${h + 3 * s + j(2)} ${w + 3} ${h - 2 + j(1.5)}`;
  }
  if (kind === 'strike') {
    return `M${-3} ${h * 0.55 + j(2)} Q${w / 2} ${h * 0.45 + j(3)} ${w + 3} ${h * 0.52 + j(2)}`;
  }
  if (kind === 'box') {
    const pts = [
      [-4 + j(1.5), -1 + j(1.5)],
      [w + 4 + j(1.5), -2 + j(1.5)],
      [w + 3 + j(1.5), h + 2 + j(1.5)],
      [-3 + j(1.5), h + 1 + j(1.5)],
      [-4 + j(1), -3 + j(1)],
    ];
    return `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')}`;
  }
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 + Math.max(9, w * 0.05);
  const ry = h / 2 + Math.max(5, h * 0.1);
  const a0 = -2.2 + j(0.3);
  const out: string[] = [];
  for (let i = 0; i <= 26; i += 1) {
    const a = a0 + (i / 26) * (Math.PI * 2 + 0.6);
    const k = 1 + j(0.05) + i * 0.004 * s;
    out.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return `M${out.join(' L')}`;
}

export const Mark: React.FC<MarkProps> = ({ kind = 'underline', delay = 0, children, className = '', active }) => {
  const hostRef = useRef<HTMLSpanElement>(null);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const [size, setSize] = useState<Size | null>(null);
  const [seen, setSeen] = useState(false);
  const drawnRef = useRef(false);
  const seedRef = useRef(Math.floor(Math.random() * 100000) + 1);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (typeof active === 'boolean') {
      setSeen(active);
      return;
    }
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  useEffect(() => {
    if (!size) return;
    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('reduce-motion');
    const anims: Animation[] = [];
    pathRefs.current.forEach((p, pass) => {
      if (!p) return;
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len} ${len}`;
      if (!seen) {
        p.style.strokeDashoffset = String(len);
        return;
      }
      if (reduce || !p.animate || drawnRef.current) {
        p.style.strokeDashoffset = '0';
        drawnRef.current = true;
        return;
      }
      const anim = p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
        duration: Math.min(720, 300 + len * 0.85),
        delay: delay + pass * 140,
        easing: 'cubic-bezier(.55,.1,.35,1)',
        fill: 'both',
      });
      anims.push(anim);
      anim.onfinish = () => {
        p.style.strokeDashoffset = '0';
        drawnRef.current = true;
      };
    });
    return () => {
      anims.forEach((anim) => anim.cancel());
    };
  }, [seen, size, delay, kind]);

  return (
    <span ref={hostRef} className={`ff-mark ${className}`} style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      {size && (
        <svg
          aria-hidden="true"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 2 }}
        >
          {[0, 1].map((pass) => (
            <path
              key={pass}
              ref={(node) => {
                pathRefs.current[pass] = node;
              }}
              d={buildPath(kind, size, pass, seedRef.current)}
              fill="none"
              stroke="var(--red)"
              strokeWidth={pass ? Math.max(1.6, size.h * 0.022) : Math.max(2.4, size.h * 0.034)}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={pass ? 0.7 : 1}
            />
          ))}
        </svg>
      )}
    </span>
  );
};
