import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  GLACIER_BOOKS,
  GLACIER_BOOK_GROUPS,
  type GlacierBookMotif,
  type GlacierBookSettings,
  type GlacierBookSpec,
} from '../../data/glacierBooksData';
import { useAppStore } from '../../store/appStore';
import type { AppRoute } from '../../types';
import './glacier-shelf.css';

export interface GlacierBookShelfProps {
  onNavigate?: (route: AppRoute) => void;
  onLaunchPrompt?: (prompt: string) => void;
}

interface RectPx {
  l: number;
  t: number;
  w: number;
  h: number;
}

interface DialogState {
  idx: number;
  rect: RectPx;
}

interface DragState {
  x: number;
  T0: number;
  moved: boolean;
}

interface Engine {
  s: number;
  T: number;
  active: number;
  hover: number;
  lift: number[];
  tiltX: number;
  tiltY: number;
  mx: number;
  my: number;
  cx: number;
  cy: number;
  inside: boolean;
  overBtn: boolean;
  modal: boolean;
  reduced: boolean;
  drag: DragState | null;
  suppress: boolean;
  wheelAcc: number;
  wheelAt: number;
  H: number;
  ws: number;
  d: number;
  gap: number;
  last: number;
  raf: number;
  cursorState: string;
  ringScale: number;
  lastTransform: string[];
  lastShadeS: number[];
  lastShadeC: number[];
  lastHidden: boolean[];
}

const COUNT = GLACIER_BOOKS.length;
const TOTAL = COUNT * 3;
const EASE = 'cubic-bezier(.2,.8,.2,1)';
const EASE_SHEET = 'cubic-bezier(.76,0,.18,1)';
const START_INDEX = 5;

const SLIDERS: ReadonlyArray<{
  key: keyof GlacierBookSettings;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: 'blurPx', label: 'Blur px', min: 0, max: 40, step: 1 },
  { key: 'opacityPct', label: 'Độ trong %', min: 20, max: 100, step: 1 },
  { key: 'radiusPx', label: 'Bo góc px', min: 0, max: 40, step: 1 },
  { key: 'motionMs', label: 'Chuyển động ms', min: 0, max: 1200, step: 20 },
  { key: 'grainPct', label: 'Hạt nhiễu %', min: 0, max: 30, step: 1 },
];

const INK_CENTERS: ReadonlyArray<readonly [number, number]> = [
  [96, 150],
  [392, 230],
  [236, 440],
  [90, 660],
  [388, 720],
  [250, 850],
  [60, 420],
];

const mod = (n: number, m: number): number => ((n % m) + m) % m;
const relIndex = (v: number, s: number): number => ((((v - s) % TOTAL) + 54) % TOTAL) - 18;
const smooth = (x: number): number => x * x * (3 - 2 * x);
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

const shelfBlend = (r: number): number =>
  Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5;

const prefersReduced = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const insetFor = (rect: RectPx): string => {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  return `inset(${rect.t}px ${Math.max(0, vw - rect.l - rect.w)}px ${Math.max(0, vh - rect.t - rect.h)}px ${rect.l}px round 3px)`;
};

const wrapTitle = (title: string, max: number): string[] => {
  const lines: string[] = [];
  let line = '';
  title.split(' ').forEach((word) => {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  });
  if (line) lines.push(line);
  return lines;
};

const buildCss = (book: GlacierBookSpec, v: GlacierBookSettings): string => {
  const o = book.settings;
  const body = book.cssSnippet
    .replaceAll(`blur(${o.blurPx}px)`, `blur(${v.blurPx}px)`)
    .replaceAll(`${o.motionMs}ms`, `${v.motionMs}ms`)
    .replaceAll(`${o.radiusPx}px`, `${v.radiusPx}px`);
  return `:root {\n  --glacier-live-blur: ${v.blurPx}px;\n  --glacier-live-opacity: ${(v.opacityPct / 100).toFixed(2)};\n  --glacier-live-radius: ${v.radiusPx}px;\n  --glacier-live-motion: ${v.motionMs}ms;\n  --glacier-live-grain: ${(v.grainPct / 100).toFixed(2)};\n}\n\n${body}`;
};

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
};

function MotifShapes({ kind }: { kind: GlacierBookMotif }): React.JSX.Element {
  switch (kind) {
    case 'grid':
      return (
        <>
          {[0, 1, 2].flatMap((i) =>
            [0, 1, 2].map((j) => (
              <rect
                key={`${i}${j}`}
                x={14 + i * 34}
                y={14 + j * 34}
                width={28}
                height={28}
                rx={5}
                className={(i + j) % 2 === 0 ? 'gb-mt' : 'gb-ms'}
              />
            ))
          )}
          <rect x={48} y={48} width={28} height={28} rx={5} className="gb-mf" />
        </>
      );
    case 'orbit':
      return (
        <>
          <ellipse cx={60} cy={60} rx={50} ry={18} transform="rotate(-25 60 60)" className="gb-ms" />
          <ellipse cx={60} cy={60} rx={50} ry={18} transform="rotate(35 60 60)" className="gb-ms" />
          <ellipse cx={60} cy={60} rx={50} ry={18} transform="rotate(95 60 60)" className="gb-ms" />
          <circle cx={60} cy={60} r={10} className="gb-mf" />
          <circle cx={102} cy={40} r={6} className="gb-mt" />
          <circle cx={20} cy={82} r={5} className="gb-mf" />
        </>
      );
    case 'prism':
      return (
        <>
          <polygon points="60,16 100,88 20,88" className="gb-mt" />
          <line x1={60} y1={16} x2={60} y2={88} className="gb-ms" />
          <line x1={2} y1={58} x2={40} y2={58} className="gb-ms" />
          <line x1={80} y1={58} x2={118} y2={36} className="gb-ms" />
          <line x1={84} y1={66} x2={118} y2={66} className="gb-ms" />
          <line x1={80} y1={74} x2={118} y2={96} className="gb-ms" />
        </>
      );
    case 'wave':
      return (
        <>
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M6 ${30 + i * 20} Q 33 ${8 + i * 20} 60 ${30 + i * 20} T 114 ${30 + i * 20}`}
              className="gb-ms"
            />
          ))}
          <circle cx={92} cy={22} r={9} className="gb-mf" />
        </>
      );
    case 'glass':
      return (
        <>
          <rect x={14} y={28} width={72} height={72} rx={14} className="gb-mt" />
          <circle cx={82} cy={44} r={28} className="gb-ms" />
          <circle cx={82} cy={44} r={12} className="gb-mf" />
          <rect x={28} y={80} width={40} height={6} rx={3} className="gb-mf" />
        </>
      );
    case 'type':
      return (
        <>
          <text x={60} y={76} textAnchor="middle" fontSize={72} className="gb-mtext">
            Aa
          </text>
          <line x1={16} y1={92} x2={104} y2={92} className="gb-ms" />
          <line x1={16} y1={102} x2={78} y2={102} className="gb-ms" />
        </>
      );
    case 'layers':
      return (
        <>
          {[0, 1, 2].map((i) => (
            <polygon
              key={i}
              points="60,16 108,38 60,60 12,38"
              transform={`translate(0 ${i * 20})`}
              className={i === 1 ? 'gb-mf' : 'gb-mt'}
            />
          ))}
        </>
      );
    case 'rings':
      return (
        <>
          <circle cx={60} cy={60} r={52} className="gb-mt" />
          <circle cx={60} cy={60} r={40} className="gb-ms" />
          <circle cx={60} cy={60} r={28} className="gb-mt" />
          <circle cx={60} cy={60} r={16} className="gb-ms" />
          <circle cx={60} cy={60} r={6} className="gb-mf" />
        </>
      );
    case 'shader':
      return (
        <>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect
              key={i}
              x={12}
              y={14 + i * 14}
              width={96 - i * 11}
              height={8}
              rx={4}
              className={i % 2 === 0 ? 'gb-mf' : 'gb-mt'}
            />
          ))}
          <circle cx={88} cy={34} r={16} className="gb-mt" />
        </>
      );
    case 'frame':
      return (
        <>
          <rect x={8} y={22} width={84} height={58} rx={5} className="gb-mt" />
          <line x1={8} y1={36} x2={92} y2={36} className="gb-ms" />
          <rect x={72} y={50} width={36} height={58} rx={7} className="gb-mf" />
          <rect x={77} y={58} width={26} height={38} rx={3} className="gb-mt" />
        </>
      );
    case 'matrix':
      return (
        <>
          {[0, 1, 2, 3, 4].flatMap((i) =>
            [0, 1, 2, 3, 4].map((j) => (
              <circle
                key={`${i}${j}`}
                cx={16 + i * 22}
                cy={16 + j * 22}
                r={3 + ((i * 2 + j * 3) % 5) * 1.6}
                className={(i + j) % 2 === 0 ? 'gb-mf' : 'gb-mt'}
              />
            ))
          )}
        </>
      );
    case 'lens':
    default:
      return (
        <>
          <circle cx={54} cy={54} r={36} className="gb-mt" />
          <circle cx={54} cy={54} r={20} className="gb-ms" />
          <line x1={54} y1={12} x2={54} y2={96} className="gb-ms" />
          <line x1={12} y1={54} x2={96} y2={54} className="gb-ms" />
          <line x1={80} y1={80} x2={110} y2={110} className="gb-ms gb-mthick" />
        </>
      );
  }
}

function Motif({ kind }: { kind: GlacierBookMotif }): React.JSX.Element {
  return (
    <svg viewBox="0 0 120 120" className="gb-motif" aria-hidden="true" focusable="false">
      <MotifShapes kind={kind} />
    </svg>
  );
}

function BookSpine({ book }: { book: GlacierBookSpec }): React.JSX.Element {
  return (
    <div className="gb-sp-in">
      <div className="gb-sp-art">
        <Motif kind={book.motif} />
      </div>
      <div className="gb-sp-title">{book.title}</div>
      <div className="gb-sp-foot">
        <span className="gb-sp-code">{book.code}</span>
        <span className="gb-sp-count">{book.countLabel}</span>
      </div>
    </div>
  );
}

function BookCover({ book }: { book: GlacierBookSpec }): React.JSX.Element {
  return (
    <div className="gb-cv-in">
      <div className="gb-cv-top">
        <span>GLACIER · {book.code}</span>
        <span>{book.year}</span>
      </div>
      <h3 className="gb-cv-title">{book.title}</h3>
      <div className="gb-cv-art">
        <Motif kind={book.motif} />
      </div>
      <div className="gb-cv-bot">
        <span className="gb-cv-sub">{book.subtitleEn}</span>
        <span className="gb-cv-badge">{book.countLabel}</span>
      </div>
    </div>
  );
}

interface TapeProps {
  v: number;
  setRef: (v: number, el: HTMLDivElement | null) => void;
  onEnter: (v: number) => void;
  onLeave: (v: number) => void;
}

const Tape = memo(function Tape({ v, setRef, onEnter, onLeave }: TapeProps): React.JSX.Element {
  const book = GLACIER_BOOKS[v % COUNT];
  return (
    <div
      ref={(el) => setRef(v, el)}
      className="gb-tape"
      data-v={v}
      aria-hidden="true"
      style={{ '--ac': book.accent, '--sc': book.secondary } as React.CSSProperties}
      onPointerEnter={() => onEnter(v)}
      onPointerLeave={() => onLeave(v)}
    >
      <div className="gb-sp">
        <BookSpine book={book} />
      </div>
      <div className="gb-cv">
        <BookCover book={book} />
      </div>
    </div>
  );
});

function Rise({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="gb-rise">
      <div className="gb-rise-i" data-rise="">
        {children}
      </div>
    </div>
  );
}

interface DialogProps {
  book: GlacierBookSpec;
  rect: RectPx;
  onClosed: () => void;
  onNavigate?: (route: AppRoute) => void;
  onLaunchPrompt?: (prompt: string) => void;
}

function BookDialog({ book, rect, onClosed, onNavigate, onLaunchPrompt }: DialogProps): React.JSX.Element {
  const { getHeartCount, isItemLiked, toggleLikedItem, savedItemIds, toggleSavedItem } = useAppStore();
  const [vals, setVals] = useState<GlacierBookSettings>(book.settings);
  const [copied, setCopied] = useState('');
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const circlesRef = useRef<Array<SVGCircleElement | null>>([]);
  const closingRef = useRef(false);
  const maskId = `gb-ink-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const titleId = `${maskId}-t`;
  const liked = isItemLiked(book.id);
  const saved = savedItemIds.includes(book.id);
  const cssText = useMemo(() => buildCss(book, vals), [book, vals]);
  const posterLines = useMemo(() => wrapTitle(book.title, 13), [book.title]);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const reduced = prefersReduced();
    sheet.style.transformOrigin = `${rect.l + rect.w / 2}px ${rect.t + rect.h / 2}px`;
    sheet.animate(
      [
        { clipPath: insetFor(rect), transform: 'rotate(-4.5deg)' },
        { clipPath: 'inset(0px round 0px)', transform: 'rotate(0deg)' },
      ],
      { duration: reduced ? 1 : 1050, easing: EASE_SHEET, fill: 'both' }
    );
    if (!reduced) {
      sheet.querySelectorAll<HTMLElement>('[data-rise]').forEach((el, i) => {
        el.animate(
          [{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }],
          { duration: 900, delay: 620 + i * 75, easing: EASE, fill: 'both' }
        );
      });
    }
    closeRef.current?.focus({ preventScroll: true });
  }, [rect]);

  useEffect(() => {
    const reduced = prefersReduced();
    const circles = circlesRef.current;
    if (reduced) {
      circles.forEach((c) => c?.setAttribute('r', '720'));
      return undefined;
    }
    circles.forEach((c) => c?.setAttribute('r', '0'));
    const t0 = performance.now() + 560;
    let raf = 0;
    const step = (now: number) => {
      let done = true;
      circles.forEach((c, i) => {
        const p = clamp01((now - t0 - i * 70) / 1250);
        if (p < 1) done = false;
        c?.setAttribute('r', String(720 * (1 - Math.pow(1 - p, 3))));
      });
      if (!done) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const sheet = sheetRef.current;
    if (!sheet) {
      onClosed();
      return;
    }
    const cs = getComputedStyle(sheet);
    const anim = sheet.animate(
      [
        { clipPath: cs.clipPath, transform: cs.transform },
        { clipPath: insetFor(rect), transform: 'rotate(-4.5deg)' },
      ],
      { duration: prefersReduced() ? 1 : 850, easing: EASE_SHEET, fill: 'both' }
    );
    anim.onfinish = onClosed;
  }, [onClosed, rect]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        close();
        return;
      }
      if (ev.key !== 'Tab' || !sheetRef.current) return;
      const items = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>('button, input, a[href], [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.hasAttribute('disabled'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    if (!copied) return undefined;
    const id = window.setTimeout(() => setCopied(''), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  const doCopy = async (kind: 'css' | 'prompt') => {
    const ok = await copyText(kind === 'css' ? cssText : book.promptTemplate);
    setCopied(ok ? (kind === 'css' ? 'Đã chép CSS' : 'Đã chép prompt') : 'Không chép được');
  };

  const launch = () => {
    if (onLaunchPrompt) onLaunchPrompt(book.promptTemplate);
    else onNavigate?.('workspace');
    close();
  };

  const style = { '--ac': book.accent, '--sc': book.secondary } as React.CSSProperties;
  const pvStyle = {
    '--pv-blur': `${vals.blurPx}px`,
    '--pv-op': vals.opacityPct / 100,
    '--pv-rad': `${vals.radiusPx}px`,
    '--pv-ms': `${vals.motionMs}ms`,
    '--pv-grain': vals.grainPct / 100,
  } as React.CSSProperties;

  return (
    <div className="gb-modal-host" style={style}>
      <div
        ref={sheetRef}
        className="gb-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="gb-sheet-bar">
          <button ref={closeRef} type="button" className="gb-txt-btn" onClick={close}>
            Đóng
          </button>
          <span className="gb-lbl">
            GLACIER ARCHIVE · {book.code}
          </span>
          <span className="gb-lbl gb-bar-r">{book.subtitleEn}</span>
        </div>
        <div className="gb-sheet-grid">
          <aside className="gb-left">
            <div className="gb-poster">
              <svg
                viewBox="0 0 474 900"
                className="gb-poster-svg"
                aria-hidden="true"
                focusable="false"
              >
                <defs>
                  <filter
                    id={`${maskId}-f`}
                    filterUnits="userSpaceOnUse"
                    x={-400}
                    y={-400}
                    width={1300}
                    height={1700}
                  >
                    <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves={3} seed={4} result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale={90} xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  <mask
                    id={maskId}
                    maskUnits="userSpaceOnUse"
                    x={0}
                    y={0}
                    width={474}
                    height={900}
                  >
                    <g filter={`url(#${maskId}-f)`}>
                      {INK_CENTERS.map(([cx, cy], i) => (
                        <circle
                          key={i}
                          ref={(el) => {
                            circlesRef.current[i] = el;
                          }}
                          cx={cx}
                          cy={cy}
                          r={0}
                          fill="#fff"
                        />
                      ))}
                    </g>
                  </mask>
                </defs>
                <rect width={474} height={900} className="gb-pp-rule" />
                <g mask={`url(#${maskId})`}>
                  <rect width={474} height={900} className="gb-pp-bg" />
                  <rect x={18} y={18} width={438} height={864} className="gb-pp-frame" />
                  <text x={38} y={56} className="gb-pp-mono" fontSize={13}>
                    GLACIER ARCHIVE · {book.code}
                  </text>
                  <text x={436} y={56} textAnchor="end" className="gb-pp-mono" fontSize={13}>
                    {book.year}
                  </text>
                  <g transform="translate(47 150) scale(3.3)">
                    <MotifShapes kind={book.motif} />
                  </g>
                  {posterLines.map((line, i) => (
                    <text
                      key={line}
                      x={38}
                      y={640 + i * 60}
                      fontSize={58}
                      className="gb-pp-title"
                    >
                      {line}
                    </text>
                  ))}
                  <text x={38} y={820} className="gb-pp-mono" fontSize={14}>
                    {book.subtitleEn}
                  </text>
                  <rect x={316} y={832} width={120} height={28} className="gb-pp-badge" />
                  <text x={376} y={851} textAnchor="middle" className="gb-pp-badge-t" fontSize={14}>
                    {book.countLabel}
                  </text>
                </g>
              </svg>
            </div>
            <div className="gb-pv">
              <span className="gb-lbl">Xem thử Glacier trực tiếp</span>
              <div className="gb-pv-stage" style={pvStyle}>
                <span className="gb-pv-blob gb-pv-b1" />
                <span className="gb-pv-blob gb-pv-b2" />
                <span className="gb-pv-blob gb-pv-b3" />
                <div className="gb-pv-card">
                  <strong>{book.title}</strong>
                  <span>
                    blur {vals.blurPx}px · {vals.opacityPct}% · r{vals.radiusPx} · {vals.motionMs}ms · hạt {vals.grainPct}%
                  </span>
                </div>
              </div>
            </div>
          </aside>
          <div className="gb-right">
            <Rise>
              <h2 id={titleId} className="gb-d-title">
                {book.title}
              </h2>
            </Rise>
            <Rise>
              <p className="gb-lbl gb-d-meta">
                {book.groupLabel} · {book.year} · {book.countLabel}
              </p>
            </Rise>
            <Rise>
              <p className="gb-d-syn">{book.synopsisVi}</p>
            </Rise>
            <Rise>
              <p className="gb-d-credit">{book.creditVi}</p>
            </Rise>
            <Rise>
              <div className="gb-actions">
                <div className="gb-heart">
                  <button
                    type="button"
                    className="gb-icon-btn"
                    aria-label={liked ? 'Bỏ thích sách này' : 'Thích sách này'}
                    aria-pressed={liked}
                    data-on={liked ? 'true' : 'false'}
                    onClick={() => toggleLikedItem(book.id)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                      <path
                        d="M12 20.5s-7.5-4.6-9.4-9.2C1.2 8 3 4.8 6.3 4.8c2 0 3.4 1.1 4.2 2.4h3c.8-1.3 2.2-2.4 4.2-2.4 3.300 0 5.100 3.200 3.700 6.500-1.900 4.600-9.400 9.200-9.400 9.200z"
                        transform="translate(0 0)"
                      />
                    </svg>
                  </button>
                  <span className="gb-count">{getHeartCount(book.id)}</span>
                </div>
                <button
                  type="button"
                  className="gb-icon-btn"
                  aria-label={saved ? 'Bỏ lưu sách này' : 'Lưu sách này'}
                  aria-pressed={saved}
                  data-on={saved ? 'true' : 'false'}
                  onClick={() => toggleSavedItem(book.id)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <path d="M6 3.5h12v17l-6-4.4-6 4.4z" />
                  </svg>
                </button>
                <button type="button" className="gb-txt-btn" onClick={() => void doCopy('css')}>
                  Chép CSS
                </button>
                <button type="button" className="gb-txt-btn" onClick={() => void doCopy('prompt')}>
                  Chép Prompt
                </button>
                <button type="button" className="gb-txt-btn gb-solid" onClick={launch}>
                  Mở trong Workspace
                </button>
                <span className="gb-toast" role="status" aria-live="polite">
                  {copied}
                </span>
              </div>
            </Rise>
            <Rise>
              <div className="gb-bench">
                <div className="gb-bench-head">
                  <h3 className="gb-h3">Tùy chỉnh Glacier</h3>
                  <button
                    type="button"
                    className="gb-txt-btn"
                    onClick={() => setVals(book.settings)}
                  >
                    Đặt lại
                  </button>
                </div>
                {SLIDERS.map((sl) => (
                  <label key={sl.key} className="gb-sl">
                    <span className="gb-lbl">{sl.label}</span>
                    <input
                      type="range"
                      min={sl.min}
                      max={sl.max}
                      step={sl.step}
                      value={vals[sl.key]}
                      onChange={(ev) => {
                        const n = Number(ev.target.value);
                        setVals((prev) => ({ ...prev, [sl.key]: n }));
                      }}
                    />
                    <output>{vals[sl.key]}</output>
                  </label>
                ))}
                <pre className="gb-code" tabIndex={0} aria-label="CSS Glacier đã tạo">
                  {cssText}
                </pre>
              </div>
            </Rise>
            <Rise>
              <h3 className="gb-h3">
                Tài nguyên tập trung trong sách · {book.resources.length}
              </h3>
            </Rise>
            {book.resources.map((res) => (
              <Rise key={res.title}>
                <article className="gb-res">
                  <header>
                    <h4>{res.title}</h4>
                    <span className="gb-tag">{res.tag}</span>
                  </header>
                  <p>{res.detail}</p>
                </article>
              </Rise>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GlacierBookShelf({ onNavigate, onLaunchPrompt }: GlacierBookShelfProps): React.JSX.Element {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLButtonElement | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const tabEls = useRef<Array<HTMLButtonElement | null>>([]);
  const tapeEls = useRef<Array<HTMLDivElement | null>>([]);
  const capEls = useRef<Array<HTMLDivElement | null>>([]);
  const filterId = `gb-grain-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [activeIdx, setActiveIdx] = useState(START_INDEX);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [indicator, setIndicator] = useState({ w: 0, x: 0 });

  const eng = useRef<Engine>({
    s: START_INDEX + COUNT,
    T: START_INDEX + COUNT,
    active: START_INDEX,
    hover: -1,
    lift: Array.from({ length: TOTAL }, () => 0),
    tiltX: 0,
    tiltY: 0,
    mx: 0,
    my: 0,
    cx: 0,
    cy: 0,
    inside: false,
    overBtn: false,
    modal: false,
    reduced: false,
    drag: null,
    suppress: false,
    wheelAcc: 0,
    wheelAt: 0,
    H: 400,
    ws: 68,
    d: 211,
    gap: 12,
    last: 0,
    raf: 0,
    cursorState: '',
    ringScale: 0,
    lastTransform: Array.from({ length: TOTAL }, () => ''),
    lastShadeS: Array.from({ length: TOTAL }, () => -1),
    lastShadeC: Array.from({ length: TOTAL }, () => -1),
    lastHidden: Array.from({ length: TOTAL }, () => false),
  });

  const activeBook = GLACIER_BOOKS[activeIdx];
  const activeGroupIdx = Math.max(
    0,
    GLACIER_BOOK_GROUPS.findIndex((g) => g.id === activeBook.group)
  );

  const setTapeRef = useCallback((v: number, el: HTMLDivElement | null) => {
    tapeEls.current[v] = el;
  }, []);
  const onTapeEnter = useCallback((v: number) => {
    eng.current.hover = v;
  }, []);
  const onTapeLeave = useCallback((v: number) => {
    if (eng.current.hover === v) eng.current.hover = -1;
  }, []);

  const swapCaption = useCallback((book: GlacierBookSpec, dir: number, instant: boolean) => {
    const texts = [
      book.title,
      `${book.subtitleEn} / ${book.code}`,
      `${book.groupLabel} · ${book.year} · ${book.countLabel}`,
    ];
    const reduced = instant || eng.current.reduced;
    capEls.current.forEach((mask, i) => {
      if (!mask) return;
      const olds = Array.from(mask.children) as HTMLElement[];
      const next = document.createElement('span');
      next.className = 'gb-cap-i';
      next.textContent = texts[i];
      if (reduced) {
        olds.forEach((o) => o.remove());
        mask.appendChild(next);
        return;
      }
      olds.forEach((o) => {
        if (o.dataset.leaving) return;
        o.dataset.leaving = '1';
        const from = getComputedStyle(o).transform;
        const out = o.animate(
          [{ transform: from === 'none' ? 'translateY(0%)' : from }, { transform: `translateY(${-dir * 105}%)` }],
          { duration: 650, easing: EASE, fill: 'both' }
        );
        out.onfinish = () => o.remove();
      });
      mask.appendChild(next);
      next.animate(
        [{ transform: `translateY(${dir * 105}%)` }, { transform: 'translateY(0%)' }],
        { duration: 650, easing: EASE, fill: 'both' }
      );
    });
  }, []);

  const goTo = useCallback(
    (t: number) => {
      const e = eng.current;
      const prev = e.T;
      e.T = t;
      const idx = mod(Math.round(t), COUNT);
      if (idx !== e.active) {
        e.active = idx;
        setActiveIdx(idx);
        swapCaption(GLACIER_BOOKS[idx], t >= prev ? 1 : -1, false);
      }
    },
    [swapCaption]
  );

  const step = useCallback(
    (delta: number) => {
      goTo(Math.round(eng.current.T) + delta);
    },
    [goTo]
  );

  const jumpToGroup = useCallback(
    (groupId: string) => {
      const e = eng.current;
      const target =
        groupId === 'all'
          ? e.active === 0
            ? START_INDEX
            : 0
          : GLACIER_BOOKS.findIndex((b) => b.group === groupId);
      if (target < 0) return;
      const base = Math.round(e.T);
      const delta = mod(target - mod(base, COUNT) + 6, COUNT) - 6;
      if (delta !== 0) goTo(base + delta);
    },
    [goTo]
  );

  const openBook = useCallback(() => {
    const e = eng.current;
    if (e.modal) return;
    let best = 0;
    let bd = Infinity;
    for (let v = 0; v < TOTAL; v += 1) {
      const dist = Math.abs(relIndex(v, e.s));
      if (dist < bd) {
        bd = dist;
        best = v;
      }
    }
    const cover = tapeEls.current[best]?.children[1] as HTMLElement | undefined;
    if (!cover) return;
    const r = cover.getBoundingClientRect();
    e.modal = true;
    setDialog({ idx: e.active, rect: { l: r.left, t: r.top, w: r.width, h: r.height } });
  }, []);

  const onClosed = useCallback(() => {
    eng.current.modal = false;
    setDialog(null);
    stageRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    swapCaption(GLACIER_BOOKS[START_INDEX], 1, true);
  }, [swapCaption]);

  useLayoutEffect(() => {
    const tab = tabEls.current[activeGroupIdx];
    if (!tab) return;
    setIndicator({ w: tab.offsetWidth, x: tab.offsetLeft });
    const strip = tabsRef.current;
    if (strip && strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({
        left: tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2,
        behavior: eng.current.reduced ? 'auto' : 'smooth',
      });
    }
  }, [activeGroupIdx]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return undefined;
    const e = eng.current;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    e.reduced = mq.matches;
    const onMq = () => {
      e.reduced = mq.matches;
    };
    mq.addEventListener('change', onMq);

    const measure = () => {
      const probe = probeRef.current;
      if (!probe) return;
      const H = probe.getBoundingClientRect().height || 400;
      e.H = H;
      e.ws = (H * 142) / 840;
      e.d = (H * 474) / 900;
      e.gap = H * 0.03;
      root.style.setProperty('--h-px', `${H}px`);
      root.style.setProperty('--ws', `${e.ws}px`);
      root.style.setProperty('--d', `${e.d}px`);
      const tab = tabEls.current[Math.max(0, GLACIER_BOOK_GROUPS.findIndex((g) => g.id === GLACIER_BOOKS[e.active].group))];
      if (tab) setIndicator({ w: tab.offsetWidth, x: tab.offsetLeft });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    const tick = (now: number) => {
      e.raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0, (now - e.last) / 1000));
      e.last = now;
      const sr = stage.getBoundingClientRect();
      const rr = root.getBoundingClientRect();
      const { H, ws, d, gap } = e;
      const W = sr.width;
      const scx = sr.left + W / 2;
      const scy = sr.top + sr.height / 2;

      if (e.reduced) {
        e.s = e.T;
      } else {
        const k = e.drag ? 18 : 5.2;
        e.s += (e.T - e.s) * (1 - Math.exp(-k * dt));
        if (Math.abs(e.T - e.s) < 1e-4) e.s = e.T;
      }
      if (Math.abs(e.T) > 360) {
        const shift = TOTAL * Math.floor(e.T / TOTAL);
        e.T -= shift;
        e.s -= shift;
        if (e.drag) e.drag.T0 -= shift;
      }

      const dx = e.mx - scx;
      const dy = e.my - scy;
      const settled = Math.abs(e.T - e.s) < 0.3;
      const onCover =
        e.inside && !e.modal && settled && Math.abs(dx) < 0.55 * d && Math.abs(dy) < 0.55 * H;
      const tyT = e.inside ? (onCover ? (dx / (0.55 * d)) * 9 : (dx / W) * 5) : 0;
      const txT = onCover ? (-dy / (H / 2)) * 6 : 0;
      const ta = e.reduced ? 1 : 1 - Math.exp(-7 * dt);
      e.tiltY += (Math.max(-12, Math.min(12, tyT)) - e.tiltY) * ta;
      e.tiltX += (Math.max(-8, Math.min(8, txT)) - e.tiltX) * ta;

      const la = e.reduced ? 1 : 1 - Math.exp(-12 * dt);
      for (let v = 0; v < TOTAL; v += 1) {
        const tape = tapeEls.current[v];
        if (!tape) continue;
        const r = relIndex(v, e.s);
        const x = r * (ws + gap) + (d - ws + 1.6 * gap) * shelfBlend(r);
        const hide = Math.abs(x) > W / 2 + 1.5 * d;
        if (hide !== e.lastHidden[v]) {
          tape.style.visibility = hide ? 'hidden' : 'visible';
          e.lastHidden[v] = hide;
        }
        if (hide) continue;
        const o = smooth(Math.max(0, 1 - Math.abs(r)));
        const target = e.hover === v && Math.abs(r) > 0.5 ? 1 : 0;
        e.lift[v] += (target - e.lift[v]) * la;
        const y = -o * 0.025 * H - e.lift[v] * 0.045 * H;
        const z = o * 0.2 * H;
        const tf = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateZ(${(-4.5 * o).toFixed(3)}deg) rotateX(${(e.tiltX * o).toFixed(3)}deg) rotateY(${((-90 + e.tiltY) * o).toFixed(3)}deg)`;
        if (tf !== e.lastTransform[v]) {
          tape.style.transform = tf;
          tape.style.zIndex = String(Math.round(100 - Math.abs(r) * 4));
          e.lastTransform[v] = tf;
        }
        const shS = Math.round(o * 0.55 * 1000) / 1000;
        if (shS !== e.lastShadeS[v]) {
          (tape.children[0] as HTMLElement).style.setProperty('--shade', String(shS));
          e.lastShadeS[v] = shS;
        }
        const shC = Math.round((1 - o) * 0.5 * 1000) / 1000;
        if (shC !== e.lastShadeC[v]) {
          (tape.children[1] as HTMLElement).style.setProperty('--shade', String(shC));
          e.lastShadeC[v] = shC;
        }
      }

      const ring = ringRef.current;
      if (ring) {
        const raw = e.modal ? 0 : e.reduced ? (settled ? 1 : 0) : smooth(clamp01(1 - Math.abs(e.T - e.s) * 3));
        if (Math.abs(raw - e.ringScale) > 0.001) {
          e.ringScale = raw;
          ring.style.transform = `translate(${(-0.5 * d - 6).toFixed(2)}px, ${(0.36 * H).toFixed(2)}px) scale(${raw.toFixed(3)})`;
          ring.style.visibility = raw < 0.01 ? 'hidden' : 'visible';
        }
      }

      const cur = cursorRef.current;
      if (cur) {
        const ca = e.reduced ? 1 : 1 - Math.exp(-16 * dt);
        e.cx += (e.mx - e.cx) * ca;
        e.cy += (e.my - e.cy) * ca;
        cur.style.transform = `translate3d(${(e.cx - rr.left).toFixed(1)}px,${(e.cy - rr.top).toFixed(1)}px,0)`;
        const hoverSpine = e.hover >= 0 && Math.abs(relIndex(e.hover, e.s)) > 0.5;
        const state = e.modal
          ? 'off'
          : !e.inside
            ? 'off'
            : e.overBtn
              ? 'btn'
              : onCover
                ? 'open'
                : hoverSpine
                  ? 'spine'
                  : 'idle';
        if (state !== e.cursorState) {
          cur.dataset.state = state;
          cur.className = `gb-cur ${state}`;
          e.cursorState = state;
        }
      }
    };

    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      e.last = performance.now();
      e.raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(e.raf);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(root);

    const onWheel = (ev: WheelEvent) => {
      if (e.modal) return;
      const h = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.shiftKey ? ev.deltaY : 0;
      if (!h) return;
      ev.preventDefault();
      const now = performance.now();
      if (now - e.wheelAt > 220) e.wheelAcc = 0;
      e.wheelAcc += h;
      e.wheelAt = now;
      if (Math.abs(e.wheelAcc) > 40) {
        step(e.wheelAcc > 0 ? 1 : -1);
        e.wheelAcc = 0;
        e.wheelAt = now + 260;
      }
    };
    stage.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mq.removeEventListener('change', onMq);
      stage.removeEventListener('wheel', onWheel);
    };
  }, [step]);

  const onPointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    const e = eng.current;
    if (e.modal || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    e.drag = { x: ev.clientX, T0: e.T, moved: false };
    const move = (m: PointerEvent) => {
      const dr = e.drag;
      if (!dr) return;
      const dx = m.clientX - dr.x;
      if (!dr.moved && Math.abs(dx) > 6) dr.moved = true;
      if (dr.moved) goTo(dr.T0 - dx / (e.ws + e.gap));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const dr = e.drag;
      e.drag = null;
      if (dr?.moved) {
        e.suppress = true;
        window.setTimeout(() => {
          e.suppress = false;
        }, 120);
        goTo(Math.round(e.T));
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const onStageClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    const e = eng.current;
    if (e.suppress) {
      e.suppress = false;
      return;
    }
    const holder = (ev.target as HTMLElement).closest('[data-v]') as HTMLElement | null;
    if (holder) {
      const v = Number(holder.dataset.v);
      const base = Math.round(e.T);
      const r = relIndex(v, base);
      if (Math.abs(relIndex(v, e.s)) > 0.5) goTo(base + r);
      else openBook();
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    const dx = ev.clientX - (sr.left + sr.width / 2);
    const dy = ev.clientY - (sr.top + sr.height / 2);
    if (Math.abs(dy) > 0.55 * e.H) return;
    if (Math.abs(dx) <= 0.55 * e.d) {
      openBook();
      return;
    }
    let bestV = -1;
    let bestDist = Infinity;
    for (let v = 0; v < TOTAL; v += 1) {
      const r = relIndex(v, e.s);
      const x = r * (e.ws + e.gap) + (e.d - e.ws + 1.6 * e.gap) * shelfBlend(r);
      const dist = Math.abs(dx - x);
      if (dist < bestDist && dist <= (e.ws + e.gap) * 0.75) {
        bestDist = dist;
        bestV = v;
      }
    }
    if (bestV >= 0) {
      const base = Math.round(e.T);
      goTo(base + relIndex(bestV, base));
    }
  };

  const onStageKey = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      step(1);
    } else if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      step(-1);
    } else if (ev.key === 'Home') {
      ev.preventDefault();
      goTo(Math.round(eng.current.T) + mod(-eng.current.active, COUNT) - (eng.current.active > 6 ? COUNT : 0));
    } else if (ev.key === 'End') {
      ev.preventDefault();
      goTo(Math.round(eng.current.T) + (COUNT - 1 - eng.current.active));
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      openBook();
    }
  };

  const onRootMove = (ev: React.PointerEvent<HTMLElement>) => {
    const e = eng.current;
    if (e.modal || ev.pointerType === 'touch') return;
    if (!e.inside) {
      e.cx = ev.clientX;
      e.cy = ev.clientY;
    }
    e.inside = true;
    e.mx = ev.clientX;
    e.my = ev.clientY;
  };

  const onRootOver = (ev: React.PointerEvent<HTMLElement>) => {
    eng.current.overBtn = Boolean((ev.target as HTMLElement).closest('button, a, input, label'));
  };

  const onRootLeave = () => {
    const e = eng.current;
    e.inside = false;
    e.hover = -1;
    e.overBtn = false;
  };

  const tapes = useMemo(
    () =>
      Array.from({ length: TOTAL }, (_, v) => (
        <Tape key={v} v={v} setRef={setTapeRef} onEnter={onTapeEnter} onLeave={onTapeLeave} />
      )),
    [setTapeRef, onTapeEnter, onTapeLeave]
  );

  const dialogBook = dialog ? GLACIER_BOOKS[dialog.idx] : null;

  return (
    <section
      ref={rootRef}
      className="gb-shelf-root"
      aria-label="Tủ sách tài nguyên Glacier"
      onPointerMove={onRootMove}
      onPointerOver={onRootOver}
      onPointerLeave={onRootLeave}
    >
      <div ref={probeRef} className="gb-probe" aria-hidden="true" />

      <header className="gb-top">
        <span className="gb-box gb-lbl gb-top-l">[ MỤC LỤC / GLACIER ]</span>
        <div className="gb-mark">
          <span className="gb-mark-a">TỦ SÁCH TÀI NGUYÊN</span>
          <span className="gb-mark-b">GLACIER ARCHIVE</span>
        </div>
        <span className="gb-lbl gb-top-r">12 CUỐN · TÀI NGUYÊN TỔNG HỢP</span>
      </header>

      <div ref={tabsRef} className="gb-tabs" role="tablist" aria-label="Nhóm sách">
        <span
          className="gb-ind"
          aria-hidden="true"
          style={{ width: indicator.w, transform: `translateX(${indicator.x}px)` }}
        />
        {GLACIER_BOOK_GROUPS.map((g, i) => (
          <button
            key={g.id}
            ref={(el) => {
              tabEls.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={i === activeGroupIdx}
            className="gb-tab gb-lbl"
            data-active={i === activeGroupIdx ? 'true' : 'false'}
            onClick={() => jumpToGroup(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div
        ref={stageRef}
        className="gb-stage"
        role="group"
        aria-roledescription="carousel"
        aria-label="Giá sách 3D, dùng phím mũi tên để đổi sách, Enter để mở"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onClick={onStageClick}
        onKeyDown={onStageKey}
      >
        <div className="gb-origin">{tapes}</div>
        <button
          ref={ringRef}
          type="button"
          className="gb-ring"
          aria-label={`Mở sách ${activeBook.title}`}
          onClick={(ev) => {
            ev.stopPropagation();
            openBook();
          }}
        >
          <span className="gb-ring-tri" aria-hidden="true" />
        </button>
      </div>

      <div className="gb-capwrap">
        <button
          type="button"
          className="gb-arrow gb-arrow-l"
          aria-label="Sách trước"
          onClick={() => step(-1)}
        >
          <svg viewBox="0 0 18 10" width="18" height="10" aria-hidden="true" focusable="false">
            <path d="M5 1 L1 5 L5 9 M1 5 H17" />
          </svg>
        </button>
        <div className="gb-cap" aria-hidden="true">
          <div
            ref={(el) => {
              capEls.current[0] = el;
            }}
            className="gb-cap-line gb-cap-title"
          />
          <div
            ref={(el) => {
              capEls.current[1] = el;
            }}
            className="gb-cap-line gb-cap-sub gb-lbl"
          />
          <div
            ref={(el) => {
              capEls.current[2] = el;
            }}
            className="gb-cap-line gb-cap-meta"
          />
        </div>
        <button
          type="button"
          className="gb-arrow gb-arrow-r"
          aria-label="Sách sau"
          onClick={() => step(1)}
        >
          <svg viewBox="0 0 18 10" width="18" height="10" aria-hidden="true" focusable="false">
            <path d="M13 1 L17 5 L13 9 M17 5 H1" />
          </svg>
        </button>
      </div>

      <p className="gb-sr" aria-live="polite">
        {activeBook.title}, {activeBook.groupLabel}, {activeBook.countLabel}
      </p>

      <svg className="gb-grain" aria-hidden="true" focusable="false">
        <filter id={filterId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.42  0 0 0 0 0.38  0 0 0 0.5 0"
          />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>

      <div ref={cursorRef} className="gb-cur off" data-state="off" aria-hidden="true">
        <span className="gb-cur-ring" />
        <span className="gb-cur-dot" />
        <span className="gb-cur-lbl">MỞ</span>
      </div>

      {dialog && dialogBook ? (
        <BookDialog
          book={dialogBook}
          rect={dialog.rect}
          onClosed={onClosed}
          onNavigate={onNavigate}
          onLaunchPrompt={onLaunchPrompt}
        />
      ) : null}
    </section>
  );
}

export default GlacierBookShelf;
