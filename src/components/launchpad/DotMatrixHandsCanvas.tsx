import React, { useEffect, useRef } from 'react';

const SHEET_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261030_025250_100df7b8-31fd-4614-aa4a-c1b7d5b6b273.png&w=1600&q=85';

const TILE_W = 420;
const SHEET_ASPECT = (0.4 * 1520) / (0.47 * 2688);
const TILE_H = Math.round(TILE_W * SHEET_ASPECT);
const LOOP = 20;
const LEVELS = [0, 0.26, 0.52, 0.78, 1];
const LA: Rect = [0, 0.06, 0.47, 0.4];
const LB: Rect = [0, 0.55, 0.47, 0.4];
const INK_LIGHT = '#0d0d0d';
const INK_DARK = '#e6dfd4';

type Rect = [number, number, number, number];
type Pt = [number, number];
type ArmStyle = 'robot' | 'human';
type ArmPose = 'A' | 'B';

interface Chain {
  pts: Pt[];
  w: number[];
}

interface Tiles {
  LA: HTMLCanvasElement;
  LB: HTMLCanvasElement;
  RA: HTMLCanvasElement;
  RB: HTMLCanvasElement;
}

const FINGERS_A: Chain[] = [
  {
    pts: [
      [178, 82],
      [122, 80],
      [72, 84],
      [22, 91],
    ],
    w: [22, 20, 17, 14],
  },
  {
    pts: [
      [180, 99],
      [144, 112],
      [128, 134],
      [130, 154],
    ],
    w: [22, 20, 18, 15],
  },
  {
    pts: [
      [182, 114],
      [152, 129],
      [140, 149],
      [144, 166],
    ],
    w: [21, 19, 17, 14],
  },
  {
    pts: [
      [184, 127],
      [162, 140],
      [154, 156],
      [158, 170],
    ],
    w: [18, 16, 14, 12],
  },
];

const THUMB_A: Chain = {
  pts: [
    [216, 76],
    [184, 62],
    [158, 62],
    [142, 72],
  ],
  w: [24, 20, 17, 15],
};

const FINGERS_B: Chain[] = [
  {
    pts: [
      [178, 80],
      [128, 64],
      [82, 50],
      [36, 40],
    ],
    w: [22, 20, 17, 14],
  },
  {
    pts: [
      [176, 94],
      [124, 88],
      [72, 82],
      [20, 80],
    ],
    w: [22, 20, 18, 15],
  },
  {
    pts: [
      [178, 108],
      [128, 112],
      [82, 118],
      [34, 126],
    ],
    w: [21, 19, 17, 14],
  },
  {
    pts: [
      [182, 122],
      [140, 136],
      [104, 150],
      [68, 166],
    ],
    w: [18, 16, 14, 12],
  },
];

const THUMB_B: Chain = {
  pts: [
    [216, 74],
    [192, 46],
    [162, 30],
    [134, 22],
  ],
  w: [24, 21, 18, 15],
};

const gray = (l: number): string => `rgb(${l},${l},${l})`;
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const fract = (x: number): number => x - Math.floor(x);
const hash = (a: number, b: number): number => fract(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);

const smooth = (a: number, b: number, x: number): number => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};

const mixAt = (t: number, on: number, off: number, dur: number): number =>
  smooth(on, on + dur, t) * (1 - smooth(off, off + dur, t));

const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const shade = (
  g: CanvasRenderingContext2D,
  a: Pt,
  b: Pt,
  width: number,
  tones: [number, number, number]
): CanvasGradient => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const gr = g.createLinearGradient(
    mx + (nx * width) / 2,
    my + (ny * width) / 2,
    mx - (nx * width) / 2,
    my - (ny * width) / 2
  );
  gr.addColorStop(0, gray(tones[0]));
  gr.addColorStop(0.38, gray(tones[1]));
  gr.addColorStop(1, gray(tones[2]));
  return gr;
};

const plate = (
  g: CanvasRenderingContext2D,
  a: Pt,
  b: Pt,
  wa: number,
  wb: number,
  tones: [number, number, number],
  edge: number
): void => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  g.beginPath();
  g.moveTo(a[0] + (nx * wa) / 2, a[1] + (ny * wa) / 2);
  g.lineTo(b[0] + (nx * wb) / 2, b[1] + (ny * wb) / 2);
  g.lineTo(b[0] - (nx * wb) / 2, b[1] - (ny * wb) / 2);
  g.lineTo(a[0] - (nx * wa) / 2, a[1] - (ny * wa) / 2);
  g.closePath();
  g.fillStyle = shade(g, a, b, Math.max(wa, wb), tones);
  g.fill();
  if (edge > 0) {
    g.lineWidth = edge;
    g.lineJoin = 'round';
    g.strokeStyle = gray(24);
    g.stroke();
  }
};

const ball = (
  g: CanvasRenderingContext2D,
  p: Pt,
  r: number,
  tones: [number, number, number]
): void => {
  const gr = g.createRadialGradient(p[0] - r * 0.3, p[1] - r * 0.35, r * 0.1, p[0], p[1], r);
  gr.addColorStop(0, gray(tones[0]));
  gr.addColorStop(0.5, gray(tones[1]));
  gr.addColorStop(1, gray(tones[2]));
  g.beginPath();
  g.arc(p[0], p[1], r, 0, Math.PI * 2);
  g.fillStyle = gr;
  g.fill();
};

const servo = (g: CanvasRenderingContext2D, p: Pt, r: number): void => {
  ball(g, p, r, [196, 126, 66]);
  g.lineWidth = 3;
  g.strokeStyle = gray(22);
  g.beginPath();
  g.arc(p[0], p[1], r, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(p[0], p[1], r * 0.62, 0, Math.PI * 2);
  g.lineWidth = 2;
  g.stroke();
  g.beginPath();
  g.arc(p[0], p[1], r * 0.34, 0, Math.PI * 2);
  g.fillStyle = gray(30);
  g.fill();
  g.beginPath();
  g.arc(p[0] - r * 0.12, p[1] - r * 0.14, r * 0.1, 0, Math.PI * 2);
  g.fillStyle = gray(210);
  g.fill();
};

const ROBOT_TONES: [number, number, number] = [188, 122, 64];
const ROBOT_DARK: [number, number, number] = [140, 84, 40];
const SKIN_TONES: [number, number, number] = [176, 128, 98];

const paintChain = (g: CanvasRenderingContext2D, chain: Chain, style: ArmStyle): void => {
  for (let k = 0; k < chain.pts.length - 1; k += 1) {
    if (style === 'robot') {
      plate(
        g,
        chain.pts[k],
        chain.pts[k + 1],
        chain.w[k] - 2,
        chain.w[k + 1] - 2,
        k % 2 === 0 ? ROBOT_TONES : ROBOT_DARK,
        3.2
      );
    } else {
      ball(g, chain.pts[k], chain.w[k] / 2, SKIN_TONES);
      plate(g, chain.pts[k], chain.pts[k + 1], chain.w[k], chain.w[k + 1], SKIN_TONES, 0);
    }
  }
  const last = chain.pts.length - 1;
  if (style === 'robot') {
    for (let k = 0; k <= last; k += 1) {
      servo(g, chain.pts[k], chain.w[k] * (k === last ? 0.42 : 0.6));
    }
  } else {
    ball(g, chain.pts[last], chain.w[last] / 2, SKIN_TONES);
  }
};

const paintArm = (style: ArmStyle, pose: ArmPose, mirror: boolean): HTMLCanvasElement => {
  const c = makeCanvas(TILE_W, TILE_H);
  const g = c.getContext('2d');
  if (!g) return c;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, TILE_W, TILE_H);
  g.imageSmoothingQuality = 'high';
  if (mirror) {
    g.translate(TILE_W, 0);
    g.scale(-1, 1);
  }

  const wrist: Pt = [256, 104];
  const elbow: Pt = [446, 108];
  const fingers = pose === 'A' ? FINGERS_A : FINGERS_B;
  const thumb = pose === 'A' ? THUMB_A : THUMB_B;

  if (style === 'robot') {
    const sections = 4;
    for (let k = 0; k < sections; k += 1) {
      const t0 = k / sections;
      const t1 = (k + 1) / sections - 0.018;
      const p0: Pt = [elbow[0] + (wrist[0] - elbow[0]) * t0, elbow[1] + (wrist[1] - elbow[1]) * t0];
      const p1: Pt = [elbow[0] + (wrist[0] - elbow[0]) * t1, elbow[1] + (wrist[1] - elbow[1]) * t1];
      plate(g, p0, p1, 92 - 34 * t0, 92 - 34 * t1, k % 2 === 0 ? ROBOT_TONES : ROBOT_DARK, 3.4);
    }
    plate(g, [420, 66], [292, 74], 13, 12, [210, 150, 96], 2.6);
    plate(g, [292, 74], [226, 84], 7, 7, [200, 140, 90], 2);
    servo(g, [420, 66], 9);
    servo(g, [226, 84], 7);
    plate(g, wrist, [176, 100], 74, 66, ROBOT_TONES, 3.6);
    g.fillStyle = gray(52);
    g.fillRect(196, 88, 40, 6);
    g.fillRect(196, 102, 40, 6);
    g.fillRect(196, 116, 40, 6);
    chainOrder(thumb, fingers).forEach((ch) => paintChain(g, ch, 'robot'));
    servo(g, wrist, 34);
  } else {
    plate(g, elbow, wrist, 92, 60, SKIN_TONES, 0);
    ball(g, wrist, 30, SKIN_TONES);
    plate(g, wrist, [176, 100], 72, 64, SKIN_TONES, 0);
    ball(g, [178, 100], 32, SKIN_TONES);
    chainOrder(thumb, fingers).forEach((ch) => paintChain(g, ch, 'human'));
  }
  return c;
};

const chainOrder = (thumb: Chain, fingers: Chain[]): Chain[] => [thumb, ...fingers.slice().reverse()];

const sliceTile = (img: HTMLImageElement, rect: Rect): HTMLCanvasElement => {
  const sw = img.naturalWidth * rect[2];
  const sh = img.naturalHeight * rect[3];
  const c = makeCanvas(TILE_W, Math.max(1, Math.round((TILE_W * sh) / sw)));
  const g = c.getContext('2d');
  if (!g) return c;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, img.naturalWidth * rect[0], img.naturalHeight * rect[1], sw, sh, 0, 0, c.width, c.height);
  return c;
};

const readInk = (): string => {
  const root = document.documentElement;
  const attr = root.getAttribute('data-theme');
  const dark = attr ? attr === 'dark' : root.classList.contains('dark');
  return dark ? INK_DARK : INK_LIGHT;
};

export interface DotMatrixHandsCanvasProps {
  className?: string;
}

export const DotMatrixHandsCanvas: React.FC<DotMatrixHandsCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const fA = makeCanvas(1, 1);
    const fB = makeCanvas(1, 1);
    const fAx = fA.getContext('2d', { willReadFrequently: true });
    const fBx = fB.getContext('2d', { willReadFrequently: true });
    if (!ctx || !fAx || !fBx) return;

    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const tiles: Tiles = {
      LA: paintArm('human', 'A', true),
      LB: paintArm('human', 'B', true),
      RA: paintArm('robot', 'A', false),
      RB: paintArm('robot', 'B', false),
    };

    let W = 0;
    let H = 0;
    let DPR = 1;
    let step = 5;
    let rowStep = 10;
    let cols = 0;
    let rows = 0;
    let R = 2;
    let ink = readInk();
    let raf = 0;
    let visible = true;
    let cancelled = false;
    let t0 = performance.now();

    const placeHand = (
      g: CanvasRenderingContext2D,
      tile: HTMLCanvasElement,
      left: boolean,
      a: number,
      hw: number,
      hh: number,
      cy: number
    ): void => {
      const ph = left ? 0 : Math.PI;
      const reach = (0.035 * Math.sin(a + ph) + 0.012 * Math.sin(2 * a + 1.3 + ph)) * W;
      const sc = 1 + 0.07 * Math.sin(a + 0.9 + ph);
      const rot = (left ? 1 : -1) * 0.045 * Math.sin(a + 2.1 + ph);
      const x = left ? reach - W * 0.045 : W - hw + W * 0.045 - reach;
      const px = left ? x : x + hw;
      g.setTransform(cols / W, 0, 0, rows / H, 0, 0);
      g.translate(px, cy);
      g.rotate(rot);
      g.scale(sc, sc);
      g.translate(-px, -cy);
      g.drawImage(tile, x, cy - hh / 2, hw, hh);
      g.setTransform(1, 0, 0, 1, 0, 0);
    };

    const render = (time: number): void => {
      if (!W || !H) return;
      const t = ((time % LOOP) + LOOP) % LOOP;
      const portrait = H > W;
      const hw = W * (portrait ? 0.66 : 0.53);
      const hh = hw * SHEET_ASPECT;
      const cy = H * (portrait ? 0.66 : 0.54);
      const a = (2 * Math.PI * t) / LOOP;

      for (const g of [fAx, fBx]) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, cols, rows);
      }
      placeHand(fAx, tiles.LA, true, a, hw, hh, cy);
      placeHand(fAx, tiles.RA, false, a, hw, hh, cy);
      placeHand(fBx, tiles.LB, true, a, hw, hh, cy);
      placeHand(fBx, tiles.RB, false, a, hw, hh, cy);
      const dA = fAx.getImageData(0, 0, cols, rows).data;
      const dB = fBx.getImageData(0, 0, cols, rows).data;

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const tick = Math.floor(t * 7);
      const mL = mixAt(t, 6.2, 14.6, 1.6);
      const mR = mixAt(t, 2.4, 10.4, 1.6);
      const qw = portrait ? 0.44 : 0.26;
      const qy = portrait ? 0.34 : 0.44;
      const qh = portrait ? 0.24 : 0.24;
      const paths = LEVELS.map(() => new Path2D());

      for (let j = 0; j < rows; j += 1) {
        const shift = hash(j, tick) > 0.965 ? Math.round((hash(tick, j) - 0.5) * 8) : 0;
        const ey = (((j + 0.5) * rowStep) / H - qy) / qh;
        const py = (j + 0.5) * rowStep;
        for (let i = 0; i < cols; i += 1) {
          const si = clamp(i - shift, 0, cols - 1);
          const seed = 0.55 * hash(i, j) + 0.45 * hash(j * 3.1, 7.7);
          const m = i < cols / 2 ? mL : mR;
          const data = seed < m ? dB : dA;
          const lum = data[(j * cols + si) * 4] / 255;
          let v = clamp((1 - lum - 0.16) / 0.42, 0, 1);
          if (v <= 0) continue;
          if (m > 0.001 && m < 0.999) {
            const d = Math.abs(seed - m);
            if (d < 0.12) {
              v *= d / 0.12;
              if (hash(i + tick, j) <= 0.4) v *= 0.3;
            }
          }
          v *= 0.86 + 0.14 * Math.sin(t * 3.2 + seed * 40);
          const cx = Math.abs((i + 0.5) / cols - 0.5);
          v *= smooth(0.035, 0.11, cx);
          v *= smooth(0.85, 1.25, Math.hypot(cx / qw, ey));
          let lv = 0;
          for (let k = LEVELS.length - 1; k >= 1; k -= 1) {
            if (v >= LEVELS[k] - 0.13) {
              lv = k;
              break;
            }
          }
          if (lv === 0) continue;
          const r = lv === 1 ? R * 0.38 : R * LEVELS[lv];
          const px = (i + 0.5) * step;
          paths[lv].moveTo(px + r, py);
          paths[lv].arc(px, py, r, 0, Math.PI * 2);
        }
      }

      ctx.fillStyle = ink;
      for (let k = 1; k < LEVELS.length; k += 1) ctx.fill(paths[k]);
    };

    const stillFrame = (): void => render(0);
    (window as unknown as { __render?: (time: number) => void }).__render = render;

    const loop = (now: number): void => {
      raf = 0;
      if (cancelled || !visible || reducedMq.matches) return;
      render((now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };

    const start = (): void => {
      if (raf || cancelled) return;
      if (reducedMq.matches) {
        stillFrame();
        return;
      }
      t0 = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const resize = (): void => {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      DPR = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      step = Math.max(5, W / 205);
      rowStep = step * 2.05;
      cols = Math.ceil(W / step);
      rows = Math.ceil(H / rowStep);
      R = step * 0.46;
      fA.width = cols;
      fA.height = rows;
      fB.width = cols;
      fB.height = rows;
      if (reducedMq.matches) stillFrame();
      else if (!visible) render(((performance.now() - t0) / 1000) % LOOP);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    intersection.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      ink = readInk();
      if (reducedMq.matches) stillFrame();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    const onMotionChange = (): void => {
      if (reducedMq.matches) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        stillFrame();
      } else {
        start();
      }
    };
    reducedMq.addEventListener('change', onMotionChange);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      if (cancelled) return;
      tiles.LA = sliceTile(img, LA);
      tiles.LB = sliceTile(img, LB);
      if (reducedMq.matches) stillFrame();
    };
    img.src = SHEET_URL;

    resize();
    start();

    return () => {
      cancelled = true;
      delete (window as unknown as { __render?: (time: number) => void }).__render;
      if (raf) cancelAnimationFrame(raf);
      img.onload = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      reducedMq.removeEventListener('change', onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className={`hm-dots ${className}`.trim()} aria-hidden="true" />;
};

export default DotMatrixHandsCanvas;
