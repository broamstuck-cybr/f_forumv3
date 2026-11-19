import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, Code2, ShieldCheck, Trophy } from 'lucide-react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import '../../styles/story.css';

export interface ScrollStoryEngineProps {
  onNavigate: (route: AppRoute) => void;
  onLaunchPrompt: (prompt: string) => Promise<void> | void;
  onOpenLeaderboard?: () => void;
}

interface PixelGlyphSpec {
  id: string;
  label: string;
  tone: 'amber' | 'verdigris' | 'jade' | 'copper';
  cells: Array<[number, number]>;
}

interface StoryArtifactCard {
  id: string;
  code: string;
  title: string;
  caption: string;
  route: AppRoute;
  leaderboard?: boolean;
  blueprintPrompt?: string;
  accent: string;
  kind:
    | 'navbar'
    | 'composer'
    | 'tabs'
    | 'split'
    | 'arena'
    | 'sandbox'
    | 'diff'
    | 'checks'
    | 'secret'
    | 'dossier'
    | 'reporank'
    | 'kinetic';
}

const PIXEL_GLYPHS: PixelGlyphSpec[] = [
  {
    id: 'terminal',
    label: 'Terminal Prompt',
    tone: 'amber',
    cells: [
      [1, 2], [2, 3], [3, 4], [2, 5], [1, 6],
      [4, 6], [5, 6], [6, 6], [7, 6],
    ],
  },
  {
    id: 'prism',
    label: 'Refraction Prism',
    tone: 'verdigris',
    cells: [
      [4, 1], [3, 2], [5, 2], [2, 3], [6, 3], [1, 4], [4, 4], [7, 4],
      [2, 5], [6, 5], [3, 6], [5, 6], [4, 7],
    ],
  },
  {
    id: 'diff-gate',
    label: 'Diff Gate',
    tone: 'jade',
    cells: [
      [2, 1], [2, 2], [2, 3], [1, 2], [3, 2],
      [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7],
      [6, 6], [7, 6], [5, 6],
    ],
  },
  {
    id: 'grid-break',
    label: 'Asymmetric Layout',
    tone: 'copper',
    cells: [
      [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [4, 2], [1, 3], [2, 3], [3, 3], [4, 3],
      [6, 1], [7, 1], [6, 2], [7, 2], [6, 3], [7, 3], [6, 4], [7, 4], [6, 5], [7, 5],
      [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [4, 6], [1, 7], [2, 7], [3, 7], [4, 7],
    ],
  },
  {
    id: 'sandbox-shield',
    label: 'Sandbox Shield',
    tone: 'verdigris',
    cells: [
      [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
      [2, 2], [6, 2], [2, 3], [4, 3], [6, 3],
      [2, 4], [3, 4], [5, 4], [6, 4],
      [3, 5], [5, 5], [3, 6], [5, 6], [4, 7],
    ],
  },
  {
    id: 'blueprint-spark',
    label: 'Blueprint Spark',
    tone: 'amber',
    cells: [
      [4, 0], [4, 1], [4, 2], [4, 6], [4, 7], [4, 8],
      [0, 4], [1, 4], [2, 4], [6, 4], [7, 4], [8, 4],
      [3, 3], [5, 3], [3, 5], [5, 5], [4, 4],
    ],
  },
  {
    id: 'stack-layers',
    label: 'Stack Layers',
    tone: 'jade',
    cells: [
      [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
      [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4],
      [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
    ],
  },
];

const ARTIFACT_CARDS: StoryArtifactCard[] = [
  {
    id: 'card-navbar',
    code: '01',
    title: 'Single-Line Nav',
    caption: 'Zero wrap 768px-1440px',
    route: 'home',
    accent: 'var(--accent-primary)',
    kind: 'navbar',
  },
  {
    id: 'card-composer',
    code: '02',
    title: 'PromptComposer',
    caption: '5-card spring fan to chip',
    route: 'workspace',
    blueprintPrompt: 'Tạo giao diện Web Workbench theo phong cách Obsidian Foundry với Live Preview và Diff viewer.',
    accent: 'var(--accent-copper)',
    kind: 'composer',
  },
  {
    id: 'card-liquid-tabs',
    code: '03',
    title: 'LiquidTabs',
    caption: 'Fluid spring mode bar',
    route: 'explore',
    accent: 'var(--accent-verdigris)',
    kind: 'tabs',
  },
  {
    id: 'card-split-stage',
    code: '04',
    title: 'SplitStage 60/40',
    caption: '121 MIT UI templates',
    route: 'explore',
    accent: 'var(--accent-jade)',
    kind: 'split',
  },
  {
    id: 'card-arena',
    code: '05',
    title: 'Arena 3-Col',
    caption: 'History, Live, Checks',
    route: 'workspace',
    accent: 'var(--accent-primary)',
    kind: 'arena',
  },
  {
    id: 'card-sandbox',
    code: '06',
    title: 'LiveSandbox',
    caption: 'Strict CSP iframe + PiP',
    route: 'workspace',
    accent: 'var(--accent-verdigris)',
    kind: 'sandbox',
  },
  {
    id: 'card-diff',
    code: '07',
    title: 'UnifiedDiff',
    caption: 'Unified & Split hunks',
    route: 'workspace',
    accent: 'var(--accent-jade)',
    kind: 'diff',
  },
  {
    id: 'card-checks',
    code: '08',
    title: 'ChecksRunner',
    caption: '6 real DOM/JS rules',
    route: 'workspace',
    accent: 'var(--accent-copper)',
    kind: 'checks',
  },
  {
    id: 'card-secret',
    code: '09',
    title: 'SecretScan ZIP',
    caption: 'Zero key leak export',
    route: 'workspace',
    accent: 'var(--accent-primary)',
    kind: 'secret',
  },
  {
    id: 'card-dossier',
    code: '10',
    title: 'ClubDossier',
    caption: 'Handover continuity',
    route: 'community',
    accent: 'var(--accent-verdigris)',
    kind: 'dossier',
  },
  {
    id: 'card-reporank',
    code: '11',
    title: 'RepoRank',
    caption: 'GitHub API verified',
    route: 'explore',
    leaderboard: true,
    accent: 'var(--accent-jade)',
    kind: 'reporank',
  },
  {
    id: 'card-kinetic',
    code: '12',
    title: 'KineticMark',
    caption: 'AI-state F-Aperture',
    route: 'settings',
    accent: 'var(--accent-copper)',
    kind: 'kinetic',
  },
];

const SCATTER_SLOTS: Array<[number, number, number]> = [
  [-0.36, -0.14, -10],
  [-0.31, 0.25, -6],
  [-0.14, 0.31, 5],
  [0.14, 0.31, -5],
  [0.31, 0.25, 7],
  [0.36, -0.14, 11],
];

const ACT1_WORDS = ['Ideas', 'in', 'Motion'];
const ACT2_LINE1 = ['From', 'prompt', 'to', 'product'];
const ACT2_LINE2 = ['built', 'through', 'real', 'craft'];

const MANIFESTO_SEGMENTS: Array<
  | { type: 'text'; text: string }
  | { type: 'badge'; label: string; tilt: number; tone: 'amber' | 'verdigris' | 'jade' | 'copper'; at: number }
> = [
  { type: 'text', text: 'Designing systems that ship' },
  { type: 'badge', label: 'zero slop', tilt: -5, tone: 'amber', at: 0.14 },
  { type: 'text', text: 'Crafting verifiable web products' },
  { type: 'badge', label: 'source-traced', tilt: 4, tone: 'verdigris', at: 0.34 },
  { type: 'text', text: 'Open repos, skills, and community craft' },
  { type: 'badge', label: 'sandboxed', tilt: -4, tone: 'copper', at: 0.54 },
  { type: 'text', text: 'built through architecture, clarity,' },
  { type: 'badge', label: 'open repos', tilt: 5, tone: 'jade', at: 0.72 },
  { type: 'text', text: 'and real checks.' },
  { type: 'badge', label: 'verified checks', tilt: -3, tone: 'amber', at: 0.86 },
];

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function segment(p: number, a: number, b: number): number {
  if (b <= a) return p >= b ? 1 : 0;
  return clamp01((p - a) / (b - a));
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t: number): number {
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function PixelIcon9x9({ cells }: { cells: Array<[number, number]> }) {
  return (
    <svg width="18" height="18" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
      {cells.map(([x, y], idx) => (
        <rect key={`${x}-${y}-${idx}`} x={x} y={y} width="1" height="1" fill="currentColor" />
      ))}
    </svg>
  );
}

function ArtifactMiniUi({ kind, accent }: { kind: StoryArtifactCard['kind']; accent: string }) {
  if (kind === 'navbar') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        <rect x="6" y="14" width="108" height="18" rx="6" fill="var(--bg-surface)" stroke="var(--border-strong)" />
        <rect x="12" y="19" width="8" height="8" rx="2" fill={accent} />
        <rect x="26" y="21" width="16" height="4" rx="2" fill="var(--ink-primary)" opacity="0.85" />
        <rect x="46" y="21" width="14" height="4" rx="2" fill="var(--ink-muted)" opacity="0.6" />
        <rect x="64" y="21" width="18" height="4" rx="2" fill="var(--ink-muted)" opacity="0.6" />
        <rect x="92" y="19" width="16" height="8" rx="4" fill={accent} opacity="0.3" />
        <rect x="14" y="42" width="92" height="16" rx="6" fill="var(--bg-surface)" stroke="var(--border-subtle)" />
      </svg>
    );
  }
  if (kind === 'composer') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        <rect x="22" y="12" width="22" height="26" rx="4" transform="rotate(-10 22 12)" fill="var(--bg-surface)" stroke={accent} />
        <rect x="49" y="8" width="22" height="28" rx="4" fill="var(--bg-surface)" stroke="var(--border-strong)" />
        <rect x="76" y="12" width="22" height="26" rx="4" transform="rotate(9 76 12)" fill="var(--bg-surface)" stroke="var(--accent-verdigris)" />
        <rect x="10" y="38" width="100" height="22" rx="9" fill="var(--bg-surface)" stroke="var(--border-strong)" />
        <circle cx="98" cy="49" r="6" fill={accent} />
      </svg>
    );
  }
  if (kind === 'tabs') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        <rect x="10" y="18" width="100" height="20" rx="10" fill="var(--bg-surface)" stroke="var(--border-subtle)" />
        <rect x="14" y="21" width="44" height="14" rx="7" fill={accent} opacity="0.28" stroke={accent} />
        <rect x="66" y="26" width="32" height="4" rx="2" fill="var(--ink-muted)" />
        <rect x="16" y="46" width="88" height="12" rx="5" fill="var(--bg-surface)" />
      </svg>
    );
  }
  if (kind === 'split') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        <rect x="8" y="10" width="58" height="24" rx="6" fill="var(--bg-surface)" stroke="var(--border-strong)" />
        <rect x="8" y="38" width="27" height="24" rx="6" fill="var(--bg-surface)" stroke="var(--border-subtle)" />
        <rect x="39" y="38" width="27" height="24" rx="6" fill="var(--bg-surface)" stroke="var(--border-subtle)" />
        <rect x="72" y="10" width="40" height="52" rx="8" fill="var(--bg-surface)" stroke={accent} />
        <rect x="78" y="18" width="28" height="18" rx="4" fill={accent} opacity="0.24" />
      </svg>
    );
  }
  if (kind === 'arena') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        <rect x="6" y="10" width="24" height="52" rx="5" fill="var(--bg-surface)" stroke="var(--border-subtle)" />
        <rect x="34" y="10" width="52" height="52" rx="6" fill="var(--bg-surface)" stroke={accent} />
        <rect x="90" y="10" width="24" height="52" rx="5" fill="var(--bg-surface)" stroke="var(--border-subtle)" />
        <rect x="40" y="46" width="40" height="10" rx="4" fill={accent} opacity="0.3" />
      </svg>
    );
  }
  if (kind === 'sandbox') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        <rect x="10" y="10" width="100" height="52" rx="8" fill="var(--bg-surface)" stroke={accent} />
        <line x1="10" y1="22" x2="110" y2="22" stroke="var(--border-subtle)" />
        <circle cx="18" cy="16" r="2.2" fill="var(--accent-copper)" />
        <circle cx="25" cy="16" r="2.2" fill="var(--accent-primary)" />
        <circle cx="32" cy="16" r="2.2" fill="var(--accent-jade)" />
        <rect x="68" y="34" width="34" height="22" rx="5" fill="var(--bg-panel)" stroke={accent} />
      </svg>
    );
  }
  if (kind === 'diff') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        <rect x="10" y="12" width="100" height="12" rx="3" fill="rgba(244,63,94,0.18)" />
        <rect x="10" y="28" width="100" height="12" rx="3" fill="rgba(52,211,153,0.22)" />
        <rect x="10" y="44" width="76" height="12" rx="3" fill="rgba(52,211,153,0.14)" />
        <rect x="16" y="16" width="38" height="4" rx="2" fill="var(--accent-danger)" />
        <rect x="16" y="32" width="58" height="4" rx="2" fill={accent} />
      </svg>
    );
  }
  if (kind === 'checks') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        {[16, 34, 52].map((y, idx) => (
          <g key={y}>
            <circle cx="20" cy={y} r="5" fill={idx === 2 ? accent : 'var(--accent-jade)'} opacity="0.25" />
            <path d={`M17.5 ${y}l1.8 1.8 3.2-3.4`} stroke={idx === 2 ? accent : 'var(--accent-jade)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="32" y={y - 2.5} width={idx === 1 ? 66 : 52} height="5" rx="2.5" fill="var(--ink-secondary)" opacity="0.55" />
          </g>
        ))}
      </svg>
    );
  }
  if (kind === 'secret') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        <path d="M60 10L86 19V36C86 50 75 59 60 64C45 59 34 50 34 36V19L60 10Z" fill="var(--bg-surface)" stroke={accent} strokeWidth="2" />
        <path d="M51 36l6 6 12-13" stroke="var(--accent-jade)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'dossier') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        <rect x="12" y="14" width="96" height="46" rx="8" fill="var(--bg-surface)" stroke="var(--border-strong)" />
        <circle cx="28" cy="28" r="6" fill={accent} opacity="0.4" />
        <circle cx="38" cy="28" r="6" fill="var(--accent-primary)" opacity="0.5" />
        <rect x="52" y="24" width="44" height="4" rx="2" fill="var(--ink-primary)" opacity="0.7" />
        <rect x="22" y="42" width="76" height="6" rx="3" fill={accent} opacity="0.22" />
      </svg>
    );
  }
  if (kind === 'reporank') {
    return (
      <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
        <rect x="14" y="38" width="22" height="22" rx="4" fill="var(--bg-surface)" stroke="var(--border-strong)" />
        <rect x="49" y="16" width="22" height="44" rx="4" fill={accent} opacity="0.3" stroke={accent} />
        <rect x="84" y="28" width="22" height="32" rx="4" fill="var(--bg-surface)" stroke="var(--accent-primary)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 72" className="w-full h-full" fill="none" aria-hidden="true">
      <rect x="40" y="16" width="40" height="40" rx="10" fill="var(--bg-surface)" stroke={accent} strokeWidth="1.8" />
      <path d="M50 26L72 24L69 31L56 32L50 26Z" fill="var(--accent-primary)" />
      <path d="M50 26L56 32V48L50 45V26Z" fill="var(--ink-primary)" />
      <path d="M57 35L68 34L66 40L57 41V35Z" fill="var(--accent-verdigris)" />
    </svg>
  );
}

export const ScrollStoryEngine: React.FC<ScrollStoryEngineProps> = ({
  onNavigate,
  onLaunchPrompt,
  onOpenLeaderboard,
}) => {
  const { reducedMotion } = useAppStore();
  const [osReduced, setOsReduced] = useState(false);
  const [activeAct, setActiveAct] = useState<1 | 2 | 3 | 4>(1);

  const storyTrackRef = useRef<HTMLDivElement>(null);
  const manifestoTrackRef = useRef<HTMLDivElement>(null);

  const act1Ref = useRef<HTMLDivElement>(null);
  const glyphRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const act1CharRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const act2CopyRef = useRef<HTMLDivElement>(null);
  const act2WordRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const portalRef = useRef<HTMLDivElement>(null);
  const portalHeadRef = useRef<HTMLDivElement>(null);
  const vp3dRef = useRef<HTMLDivElement>(null);

  const manifestoLineRef = useRef<HTMLDivElement>(null);
  const manifestoCharRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const manifestoBadgeRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const reduced = reducedMotion || osReduced;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setOsReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const openLeaderboard = () => {
    if (onOpenLeaderboard) {
      onOpenLeaderboard();
      return;
    }
    try {
      window.sessionStorage.setItem('ff_explore_mode', 'leaderboard');
    } catch {
      void 0;
    }
    window.dispatchEvent(new CustomEvent('ff:explore-mode', { detail: 'leaderboard' }));
    onNavigate('explore');
  };

  const handleCardAction = (card: StoryArtifactCard) => {
    if (card.leaderboard) {
      openLeaderboard();
      return;
    }
    if (card.blueprintPrompt) {
      void onLaunchPrompt(card.blueprintPrompt);
      return;
    }
    onNavigate(card.route);
  };

  const jumpToAct = (act: 1 | 2 | 3 | 4) => {
    if (typeof window === 'undefined') return;
    if (act === 4) {
      if (manifestoTrackRef.current) {
        const top = manifestoTrackRef.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
      }
      return;
    }
    if (!storyTrackRef.current) return;
    const track = storyTrackRef.current;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    const scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
    const ratios: Record<1 | 2 | 3, number> = { 1: 0.08, 2: 0.44, 3: 0.84 };
    window.scrollTo({
      top: trackTop + scrollable * ratios[act],
      behavior: reduced ? 'auto' : 'smooth',
    });
  };

  useEffect(() => {
    if (reduced || typeof window === 'undefined') return;

    let rafId = 0;
    let lastTs = performance.now();
    let storyCur = 0;
    let maniCur = 0;
    let lastActReported: 1 | 2 | 3 | 4 = 1;

    const getTrackProgress = (el: HTMLDivElement | null): number => {
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const navOffset = 64;
      const total = Math.max(1, rect.height - (window.innerHeight - navOffset));
      return clamp01((navOffset - rect.top) / total);
    };

    const renderFrame = (now: number) => {
      rafId = window.requestAnimationFrame(renderFrame);
      const dt = Math.min(48, Math.max(8, now - lastTs));
      lastTs = now;

      const storyTarget = getTrackProgress(storyTrackRef.current);
      const maniTarget = getTrackProgress(manifestoTrackRef.current);

      const k = 1 - Math.pow(1 - 0.14, dt / 16.67);
      storyCur += (storyTarget - storyCur) * k;
      maniCur += (maniTarget - maniCur) * k;

      const p = storyCur;
      const mp = maniCur;
      const vw = window.innerWidth;
      const vh = Math.max(540, window.innerHeight - 64);

      const nextAct: 1 | 2 | 3 | 4 = mp > 0.03 ? 4 : p >= 0.68 ? 3 : p >= 0.24 ? 2 : 1;
      if (nextAct !== lastActReported) {
        lastActReported = nextAct;
        setActiveAct(nextAct);
      }

      const act1FadeOut = 1 - easeOutCubic(segment(p, 0.2, 0.26));
      if (act1Ref.current) {
        act1Ref.current.style.opacity = act1FadeOut.toFixed(3);
        act1Ref.current.style.transform = `translate3d(0, ${(-28 * (1 - act1FadeOut)).toFixed(1)}px, 0)`;
      }

      const morphP = segment(p, 0.0, 0.14);
      glyphRefs.current.forEach((el, idx) => {
        if (!el) return;
        const gStart = idx * 0.08;
        const local = clamp01((morphP - gStart) / 0.45);
        const pop = easeOutBack(clamp01(local * 1.4));
        const scale = lerp(0.86, 1.0, clamp01(pop)) * lerp(1, 0.72, segment(p, 0.14, 0.22));
        const y = lerp(10, 0, clamp01(local)) - segment(p, 0.14, 0.22) * 14;
        el.style.opacity = (lerp(0.55, 1, clamp01(local)) * act1FadeOut).toFixed(3);
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      });

      const totalAct1Chars = act1CharRefs.current.length || 1;
      act1CharRefs.current.forEach((el, idx) => {
        if (!el) return;
        const stagger = (idx / totalAct1Chars) * 0.52;
        const local = easeOutBack(clamp01((morphP + 0.28 - stagger) / 0.48));
        const clamped = clamp01(local);
        el.style.opacity = clamped.toFixed(3);
        el.style.transform = `translate3d(0, ${(lerp(18, 0, local)).toFixed(1)}px, 0) scale(${lerp(0.86, 1, clamped).toFixed(3)})`;
      });

      const act2Enter = segment(p, 0.24, 0.38);
      const act2Exit = 1 - easeOutCubic(segment(p, 0.65, 0.71));
      if (act2CopyRef.current) {
        act2CopyRef.current.style.opacity = (clamp01(act2Enter * 1.4) * act2Exit).toFixed(3);
        act2CopyRef.current.style.transform = `translate3d(-50%, ${lerp(18, 0, easeOutCubic(act2Enter)).toFixed(1)}px, 0)`;
      }

      const wordCount = act2WordRefs.current.length || 1;
      act2WordRefs.current.forEach((el, idx) => {
        if (!el) return;
        const wStart = (idx / wordCount) * 0.55;
        const wt = easeOutCubic(clamp01((act2Enter - wStart) / 0.42));
        el.style.opacity = wt.toFixed(3);
        el.style.filter = `blur(${(6 * (1 - wt)).toFixed(2)}px)`;
        el.style.transform = `translate3d(0, ${(16 * (1 - wt)).toFixed(1)}px, 0)`;
      });

      const cw = vw < 768 ? 136 : Math.min(206, Math.max(148, vw * 0.155));
      const fanRise = easeOutBack(segment(p, 0.01, 0.16));
      const scatterT = easeInOutCubic(segment(p, 0.24, 0.36));
      const pileT = easeInOutCubic(segment(p, 0.37, 0.49));
      const wheelT = easeInOutCubic(segment(p, 0.5, 0.6));
      const wheelSpin = segment(p, 0.56, 0.7);
      const portalMask = segment(p, 0.69, 0.76);

      const fanR = Math.max(360, vw * 0.52);
      const fanStep = 2 * Math.asin(Math.min(0.95, (1.05 * cw) / (2 * fanR)));
      const fanBaseY = vh * 0.21;

      const wheelR = Math.max(460, vw * 0.68);
      const wheelStep = 2 * Math.asin(Math.min(0.95, (1.05 * cw) / (2 * wheelR)));
      const wheelBaseY = vh * 0.28;

      cardRefs.current.forEach((el, idx) => {
        if (!el) return;
        const isFirstSix = idx < 6;

        let x = 0;
        let y = vh * 0.55;
        let rot = 0;
        let scale = 0.85;
        let opacity = 0;

        if (isFirstSix) {
          const fanAngle = (idx - 2.5) * fanStep;
          const fx = fanR * Math.sin(fanAngle);
          const fy = fanR * (1 - Math.cos(fanAngle)) + fanBaseY + (1 - fanRise) * 190;
          const fRot = (fanAngle * 180) / Math.PI;

          const slot = SCATTER_SLOTS[idx];
          const sx = slot[0] * Math.min(vw, 1280);
          const sy = slot[1] * vh;
          const sRot = slot[2];

          const px = (idx - 2.5) * 4;
          const py = vh * 0.1 + (idx - 2.5) * 2;
          const pRot = (idx - 2.5) * 3.4;

          x = lerp(fx, sx, scatterT);
          y = lerp(fy, sy, scatterT);
          rot = lerp(fRot, sRot, scatterT);
          scale = lerp(0.96, 0.88, scatterT);

          x = lerp(x, px, pileT);
          y = lerp(y, py, pileT);
          rot = lerp(rot, pRot, pileT);
          scale = lerp(scale, 0.92, pileT);

          opacity = clamp01(fanRise * 1.15);
        } else {
          const extraReveal = easeOutBack(segment(p, 0.41 + (idx - 6) * 0.012, 0.49));
          x = (idx - 8.5) * 3.5;
          y = vh * 0.1 + (idx - 8.5) * 2;
          rot = (idx - 8.5) * 3.2;
          scale = lerp(0.75, 0.92, clamp01(extraReveal));
          opacity = clamp01(extraReveal);
        }

        const wheelIdxOffset = idx - 5.5 - wheelSpin * 5.2;
        const wAngle = wheelIdxOffset * wheelStep;
        const wx = wheelR * Math.sin(wAngle);
        const wy = wheelR * (1 - Math.cos(wAngle)) + wheelBaseY;
        const wRot = (wAngle * 180) / Math.PI;

        x = lerp(x, wx, wheelT);
        y = lerp(y, wy, wheelT);
        rot = lerp(rot, wRot, wheelT);
        scale = lerp(scale, 0.98, wheelT);

        const finalOpacity = opacity * (1 - portalMask);
        el.style.opacity = finalOpacity.toFixed(3);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.pointerEvents = finalOpacity > 0.25 ? 'auto' : 'none';
      });

      const portalOpen = easeInOutCubic(segment(p, 0.68, 0.86));
      const portalZoom = easeInOutCubic(segment(p, 0.84, 1.0));
      if (portalRef.current) {
        if (portalOpen <= 0.002) {
          portalRef.current.style.opacity = '0';
          portalRef.current.dataset.interactive = 'false';
        } else {
          const vInset = lerp(34, 0, portalOpen);
          const hInset = lerp(30, 0, portalOpen);
          const rad = lerp(14, 0, portalOpen);
          portalRef.current.style.opacity = clamp01(portalOpen * 2.2).toFixed(3);
          portalRef.current.style.clipPath = `inset(${vInset.toFixed(2)}% ${hInset.toFixed(2)}% ${vInset.toFixed(2)}% ${hInset.toFixed(2)}% round ${rad.toFixed(1)}px)`;
          portalRef.current.dataset.interactive = portalOpen > 0.45 ? 'true' : 'false';
        }
      }

      if (portalHeadRef.current) {
        const headIn = easeOutCubic(segment(p, 0.74, 0.86));
        portalHeadRef.current.style.opacity = (headIn * (1 - portalZoom * 0.45)).toFixed(3);
        portalHeadRef.current.style.transform = `translate3d(0, ${(18 * (1 - headIn) - portalZoom * 18).toFixed(1)}px, 0)`;
      }

      if (vp3dRef.current) {
        const yaw = lerp(-10, 10, segment(p, 0.72, 0.96));
        const pitch = lerp(5, 0, portalZoom);
        const bob = Math.sin(now * 0.0018) * 5 * (1 - portalZoom * 0.7);
        const vpScale = lerp(0.92, 1.14, portalZoom);
        vp3dRef.current.style.transform = `translate3d(0, ${bob.toFixed(1)}px, 0) rotateY(${yaw.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg) scale(${vpScale.toFixed(3)})`;
      }

      if (manifestoLineRef.current) {
        const lineW = manifestoLineRef.current.scrollWidth;
        const maxTravel = Math.max(0, lineW - vw + 64);
        const tx = -maxTravel * mp;
        manifestoLineRef.current.style.transform = `translate3d(${tx.toFixed(1)}px, 0, 0)`;
      }

      const mChars = manifestoCharRefs.current.length || 1;
      manifestoCharRefs.current.forEach((el, idx) => {
        if (!el) return;
        const cPos = idx / mChars;
        const cReveal = easeOutCubic(clamp01((mp * 1.18 + 0.14 - cPos * 0.85) / 0.16));
        el.style.opacity = cReveal.toFixed(3);
        el.style.transform = `translate3d(0, ${(22 * (1 - cReveal)).toFixed(1)}px, 0)`;
      });

      manifestoBadgeRefs.current.forEach((el, idx) => {
        if (!el) return;
        const badgeAt = Number(el.dataset.at || 0.2);
        const tilt = Number(el.dataset.tilt || 0);
        const bt = clamp01((mp + 0.12 - badgeAt) / 0.14);
        const overshoot = bt < 0.7 ? lerp(0.4, 1.15, easeOutCubic(bt / 0.7)) : lerp(1.15, 1.0, (bt - 0.7) / 0.3);
        el.style.opacity = clamp01(bt * 1.8).toFixed(3);
        el.style.transform = `rotate(${tilt}deg) scale(${(bt <= 0 ? 0.4 : overshoot).toFixed(3)})`;
        if (idx < 0) return;
      });
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [reduced]);

  const act1IndexedChars = useMemo(() => {
    let cursor = 0;
    return ACT1_WORDS.map((word) => ({
      word,
      chars: Array.from(word).map((ch) => ({ ch, idx: cursor++ })),
    }));
  }, []);

  const manifestoBuilt = useMemo(() => {
    let charIndex = 0;
    let badgeIndex = 0;
    return MANIFESTO_SEGMENTS.map((seg, sIdx) => {
      if (seg.type === 'badge') {
        return { ...seg, key: `b-${sIdx}`, bIdx: badgeIndex++ };
      }
      const chars = Array.from(seg.text).map((ch) => ({ ch, cIdx: charIndex++ }));
      return { ...seg, key: `t-${sIdx}`, chars };
    });
  }, []);

  if (reduced) {
    return (
      <section aria-label="Hành trình kiến tạo F-FORUM v3" className="ff-story-root">
        <div className="ff-container ff-story-static">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PIXEL_GLYPHS.map((g) => (
                <span key={g.id} className="ff-story-pixel-chip" data-tone={g.tone} title={g.label}>
                  <PixelIcon9x9 cells={g.cells} />
                </span>
              ))}
            </div>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight">Ideas in Motion</h2>
            <p className="max-w-2xl text-[15px]" style={{ color: 'var(--ink-secondary)' }}>
              From prompt to product — built through real craft. Not just visuals: real products that run inside strict CSP sandboxes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ARTIFACT_CARDS.slice(0, 8).map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardAction(card)}
                className="rounded-2xl border p-4 text-left flex flex-col gap-3 cursor-pointer overflow-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
              >
                <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                  <span>{card.code}</span>
                  <span>{card.route}</span>
                </div>
                <div className="h-24 rounded-xl border p-2" style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
                  <ArtifactMiniUi kind={card.kind} accent={card.accent} />
                </div>
                <div>
                  <div className="text-[14px] font-bold" style={{ color: 'var(--ink-primary)' }}>{card.title}</div>
                  <div className="text-[12px]" style={{ color: 'var(--ink-secondary)' }}>{card.caption}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-[24px] border p-6 sm:p-8 space-y-5" style={{ background: '#06080d', borderColor: 'rgba(241,239,233,0.14)', color: '#f1efe9' }}>
            <p className="text-[20px] sm:text-[26px] font-bold leading-snug m-0">
              Designing systems that ship — Crafting verifiable web products — Open repos, skills, and community craft built through architecture, clarity, and real checks.
            </p>
            <div className="flex flex-wrap gap-2">
              {['zero slop', 'source-traced', 'sandboxed', 'open repos', 'verified checks'].map((tag) => (
                <span key={tag} className="ff-manifesto-badge">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('workspace')}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold border-0 cursor-pointer"
                style={{ background: 'var(--accent-gradient)', color: '#090b10' }}
              >
                <Code2 className="h-4 w-4" aria-hidden="true" />
                <span>Mở Work space</span>
              </button>
              <button
                type="button"
                onClick={openLeaderboard}
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[13.5px] font-semibold cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(241,239,233,0.2)', color: '#f1efe9' }}
              >
                <Trophy className="h-4 w-4" style={{ color: '#fcd34d' }} aria-hidden="true" />
                <span>Xem Bảng Xếp Hạng Repo &amp; Skills</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Hành trình kiến tạo 4 hồi F-FORUM v3" className="ff-story-root">
      <div ref={storyTrackRef} className="ff-story-track">
        <div className="ff-story-sticky">
          <div className="ff-story-backdrop" aria-hidden="true" />
          <div className="ff-story-grid" aria-hidden="true" />

          <nav aria-label="Chuyển nhanh hồi kể chuyện" className="ff-story-rail">
            {(
              [
                [1, '01 Fan'],
                [2, '02 Craft'],
                [3, '03 Portal'],
                [4, '04 Manifesto'],
              ] as const
            ).map(([act, label]) => (
              <button
                key={act}
                type="button"
                className="ff-story-rail-btn"
                data-active={activeAct === act}
                onClick={() => jumpToAct(act)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div ref={act1Ref} className="ff-story-act1">
            <div className="ff-story-glyph-row" aria-hidden="true">
              {PIXEL_GLYPHS.map((g, idx) => (
                <span
                  key={g.id}
                  ref={(el) => {
                    glyphRefs.current[idx] = el;
                  }}
                  className="ff-story-pixel-chip"
                  data-tone={g.tone}
                  title={g.label}
                >
                  <PixelIcon9x9 cells={g.cells} />
                </span>
              ))}
            </div>

            <h2 className="ff-story-h1">
              {act1IndexedChars.map((group) => (
                <span key={group.word} className="inline-flex">
                  {group.chars.map(({ ch, idx }) => (
                    <span
                      key={idx}
                      ref={(el) => {
                        act1CharRefs.current[idx] = el;
                      }}
                      className="ff-story-char"
                    >
                      {ch}
                    </span>
                  ))}
                </span>
              ))}
            </h2>
            <p className="ff-story-sub">
              Cuộn xuống để xem cách ý tưởng biến thành bộ khung UI, sân khấu thực thi và mã nguồn có kiểm định.
            </p>
          </div>

          <div ref={act2CopyRef} className="ff-story-act2-copy" style={{ opacity: 0 }}>
            <h2 className="ff-story-act2-h2">
              <span className="block">
                {ACT2_LINE1.map((word, idx) => (
                  <span
                    key={`l1-${word}`}
                    ref={(el) => {
                      act2WordRefs.current[idx] = el;
                    }}
                    className="ff-story-word"
                  >
                    {word}
                  </span>
                ))}
              </span>
              <span className="block" style={{ color: 'var(--accent-primary)' }}>
                {ACT2_LINE2.map((word, idx) => (
                  <span
                    key={`l2-${word}`}
                    ref={(el) => {
                      act2WordRefs.current[ACT2_LINE1.length + idx] = el;
                    }}
                    className="ff-story-word"
                  >
                    {word}
                  </span>
                ))}
              </span>
            </h2>
          </div>

          <div className="ff-story-cards-stage">
            {ARTIFACT_CARDS.map((card, idx) => (
              <button
                key={card.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                type="button"
                className="ff-story-card"
                onClick={() => handleCardAction(card)}
                aria-label={`${card.title}: ${card.caption}`}
              >
                <span className="ff-story-card-accent" style={{ background: card.accent }} aria-hidden="true" />
                <span className="ff-story-card-head">
                  <span className="ff-story-card-code">{card.code}</span>
                  <span className="ff-story-card-route">{card.leaderboard ? 'ranking' : card.route}</span>
                </span>
                <span className="ff-story-card-preview">
                  <ArtifactMiniUi kind={card.kind} accent={card.accent} />
                </span>
                <span>
                  <span className="block ff-story-card-title">{card.title}</span>
                  <span className="block ff-story-card-caption">{card.caption}</span>
                </span>
              </button>
            ))}
          </div>

          <div
            ref={portalRef}
            className="ff-story-portal"
            data-interactive="false"
            style={{ opacity: 0, clipPath: 'inset(34% 30% 34% 30% round 14px)' }}
          >
            <div className="ff-story-portal-grid" aria-hidden="true" />

            <div ref={portalHeadRef} className="ff-story-portal-head">
              <h2 className="ff-story-portal-title">
                <span className="block">Not just visuals</span>
                <span className="block" style={{ color: '#fcd34d' }}>
                  Real products that run
                </span>
              </h2>
              <p className="ff-story-portal-sub">
                Mỗi bản dựng được biên dịch trong iframe sandbox tách biệt, soi Diff từng dòng và kiểm tra 6 tiêu chí thực tế.
              </p>
            </div>

            <div className="ff-story-viewport-wrap">
              <div ref={vp3dRef} className="ff-story-viewport-3d">
                <div className="ff-story-vp-bar">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-[#f1efe9]">workspace / live-sandbox.html</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>6/6 checks pass</span>
                  </span>
                </div>

                <div className="ff-story-vp-body">
                  <div className="rounded-xl border border-white/10 bg-[#0b0f18] p-3.5 space-y-2.5 text-left">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#a1a9b8]">
                      <span className="text-amber-300">Live Preview · 1440px / 390px</span>
                      <span>CSP Strict</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-[#121722] p-3 space-y-2">
                      <div className="h-2.5 w-24 rounded-full bg-amber-400/75" />
                      <div className="h-2 w-44 rounded-full bg-white/25" />
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="h-12 rounded-lg border border-teal-400/30 bg-teal-400/10" />
                        <div className="h-12 rounded-lg border border-amber-400/30 bg-amber-400/10" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('workspace')}
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold border-0 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)', color: '#090b10' }}
                    >
                      <span>Mở Work space ngay</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0b0f18] p-3.5 space-y-2 text-left font-mono text-[11px]">
                    <div className="flex items-center justify-between text-[#a1a9b8]">
                      <span>Diff &amp; Secret Gate</span>
                      <span className="text-emerald-400">+38 -4</span>
                    </div>
                    <div className="rounded-md bg-emerald-500/12 px-2 py-1 text-emerald-300">
                      + overflow-x: clip;
                    </div>
                    <div className="rounded-md bg-emerald-500/12 px-2 py-1 text-emerald-300">
                      + sandbox=&quot;allow-scripts&quot;
                    </div>
                    <div className="rounded-md bg-white/5 px-2 py-1 text-[#a1a9b8] flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal-400 shrink-0" aria-hidden="true" />
                      <span>0 secrets · ZIP ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={manifestoTrackRef} className="ff-manifesto-track">
        <div className="ff-manifesto-sticky">
          <div className="ff-container flex items-center justify-between gap-3 text-[12px] font-mono text-[#a1a9b8]">
            <span>Act 04 · Architectural Manifesto</span>
            <span>F-FORUM v3 · Open Craft</span>
          </div>

          <div className="ff-manifesto-band">
            <div ref={manifestoLineRef} className="ff-manifesto-line">
              {manifestoBuilt.map((seg) => {
                if (seg.type === 'badge') {
                  return (
                    <span
                      key={seg.key}
                      ref={(el) => {
                        manifestoBadgeRefs.current[seg.bIdx] = el;
                      }}
                      data-at={seg.at}
                      data-tilt={seg.tilt}
                      data-tone={seg.tone}
                      className="ff-manifesto-badge"
                    >
                      {seg.label}
                    </span>
                  );
                }
                return (
                  <span key={seg.key} className="ff-manifesto-phrase">
                    {seg.chars.map(({ ch, cIdx }) => (
                      <span
                        key={cIdx}
                        ref={(el) => {
                          manifestoCharRefs.current[cIdx] = el;
                        }}
                        className="ff-manifesto-glyph"
                      >
                        {ch === ' ' ? '\u00A0' : ch}
                      </span>
                    ))}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="ff-manifesto-actions">
            <p className="m-0 text-[13.5px] text-[#a1a9b8]">
              Chuyển thẳng từ ý tưởng sang Work space hoặc tra cứu Bảng Xếp Hạng Repo &amp; Skills đã xác thực từ GitHub API.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('workspace')}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold border-0 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 48%, #d97706 100%)',
                  color: '#090b10',
                }}
              >
                <Code2 className="h-4 w-4" aria-hidden="true" />
                <span>Mở Work space</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={openLeaderboard}
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[13.5px] font-semibold cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderColor: 'rgba(241, 239, 233, 0.22)',
                  color: '#f1efe9',
                }}
              >
                <Trophy className="h-4 w-4" style={{ color: '#fcd34d' }} aria-hidden="true" />
                <span>Xem Bảng Xếp Hạng Repo &amp; Skills</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollStoryEngine;
