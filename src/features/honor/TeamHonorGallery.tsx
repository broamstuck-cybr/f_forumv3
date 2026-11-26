import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type * as THREE from './threeSubset';
import type { AppRoute, DimensionView } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCompass,
  IconMinimize2,
  IconSearch,
  IconX,
} from '../../ui/icons';
import {
  HONOR_EXHIBITS,
  createHonorArtwork,
  disposeHonorArtworkTextures,
  getHonorPlateDataUrl,
  type HonorExhibit,
} from './teamHonorData';
import './team-honor.css';

const LazySearchCard = lazy(() =>
  import('../../components/pinui/SearchCard').then((m) => ({ default: m.SearchCard }))
);

export interface TeamHonorGalleryProps {
  onBack?: () => void;
  onNavigate?: (view: AppRoute | DimensionView) => void;
}

interface FrameMeta {
  frameIndex: number;
  exhibitIndex: number;
  th: number;
  r: number;
  y: number;
  focusR: number;
  focusYaw: number;
  group: THREE.Group;
  artMesh: THREE.Mesh;
}

interface RectSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
}

const CORRIDOR_R = 18;
const CORRIDOR_H = 6.2;
const N_FRAMES = HONOR_EXHIBITS.length;
const ARC_MIN = -0.52;
const ARC_MAX = 0.52;
const WALK_R = 11.8;
const WALK_Y = 2.78;
const WALK_PITCH = 0.01;
const FOCUS_R = CORRIDOR_R - 3.2;
const INIT_TH = -0.26;
const FOCUS_GLIDE_SEC = 0.85;

function clampArc(th: number): number {
  return Math.max(ARC_MIN - 0.04, Math.min(ARC_MAX + 0.04, th));
}

function shortestAngleDelta(from: number, to: number): number {
  const twoPi = Math.PI * 2;
  let d = (to - from) % twoPi;
  if (d > Math.PI) d -= twoPi;
  if (d < -Math.PI) d += twoPi;
  return d;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

function easeOutQuart(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u * u;
}

function createCorridorWallTexture(
  three: typeof THREE,
  isDark: boolean,
  isSoftwareRenderer = false
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = isSoftwareRenderer ? 64 : 256;
  c.height = isSoftwareRenderer ? 32 : 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.setTransform(c.width / 256, 0, 0, c.height / 128, 0, 0);
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    if (isDark) {
      grad.addColorStop(0, '#0c1211');
      grad.addColorStop(0.18, '#131b1a');
      grad.addColorStop(0.8, '#111817');
      grad.addColorStop(1, '#090e0d');
    } else {
      grad.addColorStop(0, '#ded9cc');
      grad.addColorStop(0.18, '#ebe7dd');
      grad.addColorStop(0.8, '#e8e3d8');
      grad.addColorStop(1, '#d3cdbe');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    ctx.strokeStyle = isDark ? 'rgba(244, 247, 245, 0.05)' : 'rgba(19, 28, 26, 0.07)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < 256; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 128);
      ctx.stroke();
    }
    ctx.strokeStyle = isDark ? 'rgba(56, 201, 154, 0.16)' : 'rgba(19, 28, 26, 0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 104);
    ctx.lineTo(256, 104);
    ctx.stroke();

    ctx.fillStyle = isDark ? 'rgba(244, 247, 245, 0.02)' : 'rgba(19, 28, 26, 0.035)';
    ctx.fillRect(0, 105, 256, 23);
  }
  const tex = new three.CanvasTexture(c);
  tex.colorSpace = three.SRGBColorSpace;
  tex.wrapS = three.RepeatWrapping;
  tex.repeat.set(6, 1);
  if (isSoftwareRenderer) {
    tex.generateMipmaps = false;
    tex.minFilter = three.LinearFilter;
    tex.magFilter = three.LinearFilter;
  }
  return tex;
}

function createRadialFloorTexture(
  three: typeof THREE,
  isDark: boolean,
  isSoftwareRenderer = false
): THREE.CanvasTexture {
  const size = isSoftwareRenderer ? 128 : 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, half * 0.45, half, half, half);
    if (isDark) {
      grad.addColorStop(0, '#0a0f0e');
      grad.addColorStop(0.55, '#111817');
      grad.addColorStop(1, '#080c0b');
    } else {
      grad.addColorStop(0, '#cfc9ba');
      grad.addColorStop(0.55, '#dcd7c9');
      grad.addColorStop(1, '#c7c0b0');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = isDark ? 'rgba(244, 247, 245, 0.06)' : 'rgba(19, 28, 26, 0.09)';
    ctx.lineWidth = 1.25;
    for (let i = 0; i < 32; i += 1) {
      const a = (i / 32) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(half + Math.cos(a) * half * 0.58, half + Math.sin(a) * half * 0.58);
      ctx.lineTo(half + Math.cos(a) * half, half + Math.sin(a) * half);
      ctx.stroke();
    }
    for (const ringFrac of [0.68, 0.84, 0.96]) {
      ctx.beginPath();
      ctx.arc(half, half, half * ringFrac, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const tex = new three.CanvasTexture(c);
  tex.colorSpace = three.SRGBColorSpace;
  if (isSoftwareRenderer) {
    tex.generateMipmaps = false;
    tex.minFilter = three.LinearFilter;
    tex.magFilter = three.LinearFilter;
  }
  return tex;
}

function createRadialCeilingTexture(
  three: typeof THREE,
  isDark: boolean,
  isSoftwareRenderer = false
): THREE.CanvasTexture {
  const size = isSoftwareRenderer ? 64 : 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, half * 0.4, half, half, half);
    if (isDark) {
      grad.addColorStop(0, '#121918');
      grad.addColorStop(0.6, '#161e1c');
      grad.addColorStop(1, '#0e1413');
    } else {
      grad.addColorStop(0, '#efece3');
      grad.addColorStop(0.6, '#f6f3ec');
      grad.addColorStop(1, '#e4dfd3');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = isDark ? 'rgba(244, 247, 245, 0.05)' : 'rgba(19, 28, 26, 0.06)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(half + Math.cos(a) * half * 0.58, half + Math.sin(a) * half * 0.58);
      ctx.lineTo(half + Math.cos(a) * half, half + Math.sin(a) * half);
      ctx.stroke();
    }
  }
  const tex = new three.CanvasTexture(c);
  tex.colorSpace = three.SRGBColorSpace;
  if (isSoftwareRenderer) {
    tex.generateMipmaps = false;
    tex.minFilter = three.LinearFilter;
    tex.magFilter = three.LinearFilter;
  }
  return tex;
}

export const TeamHonorGallery: React.FC<TeamHonorGalleryProps> = ({ onBack, onNavigate }) => {
  const { navigate, reducedMotion: storeReducedMotion, theme } = useAppStore();

  const [loadStage, setLoadStage] = useState<'prewarm' | 'loading' | 'ready'>('prewarm');
  const isLoading = loadStage !== 'ready';
  const loadingMountedAtRef = useRef<number>(0);
  const [viewMode, setViewMode] = useState<'3d' | 'list'>('3d');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSheetExhibitId, setActiveSheetExhibitId] = useState<string | null>(null);
  const [focusedExhibitIndex, setFocusedExhibitIndex] = useState<number | null>(null);
  const [hoveredPill, setHoveredPill] = useState<{
    exhibitIndex: number;
    x: number;
    y: number;
  } | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [sceneRetryKey, setSceneRetryKey] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetBackdropRef = useRef<HTMLElement>(null);
  const sheetCloseBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusedBeforeSheetRef = useRef<HTMLElement | null>(null);
  const wasSheetOpenRef = useRef(false);
  const hudOpenBtnRef = useRef<HTMLButtonElement>(null);
  const nav3dBtnRef = useRef<HTMLButtonElement>(null);
  const sheetInnerRef = useRef<HTMLDivElement>(null);
  const sheetMatImgRef = useRef<HTMLImageElement>(null);
  const pendingFlyRectRef = useRef<RectSnapshot | null>(null);
  const sheetOpenRef = useRef(false);
  const pendingFocusExhibitIdRef = useRef<string | null>(null);
  const sceneControlRef = useRef<{
    focusFrameByIndex: (frameIdx: number) => void;
    focusExhibitId: (exhibitId: string) => void;
    stepWalk: (delta: number) => void;
    exitFocus: () => void;
    projectFocusedRect: () => RectSnapshot | null;
    markDirty: () => void;
    setPaused: (paused: boolean) => void;
    setTheme: (isDark: boolean) => void;
    setReducedMotion: (reduced: boolean) => void;
    resize: () => void;
  } | null>(null);

  const systemReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  const isReducedMotion = storeReducedMotion || systemReducedMotion;
  const isDarkTheme = theme === 'dark';

  const isDarkThemeRef = useRef(isDarkTheme);
  const isReducedMotionRef = useRef(isReducedMotion);
  const viewModeRef = useRef(viewMode);
  isDarkThemeRef.current = isDarkTheme;
  isReducedMotionRef.current = isReducedMotion;
  viewModeRef.current = viewMode;

  const exhibitById = useMemo(() => {
    const map = new Map<string, HonorExhibit>();
    for (const item of HONOR_EXHIBITS) {
      map.set(item.id, item);
    }
    return map;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || loadStage !== 'prewarm') return undefined;
    let cancelled = false;
    const rafId = window.requestAnimationFrame(() => {
      if (!cancelled) setLoadStage('loading');
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [loadStage]);

  useLayoutEffect(() => {
    if (loadStage === 'loading' && typeof performance !== 'undefined') {
      loadingMountedAtRef.current = performance.now();
    }
  }, [loadStage]);

  useEffect(() => {
    if (typeof window === 'undefined' || loadStage !== 'loading') return undefined;
    let cancelled = false;
    let painted = false;
    let floorElapsed = false;
    let settled = false;
    let postPaintTimerId = 0;

    const settle = () => {
      if (cancelled || settled) return;
      settled = true;
      setLoadStage('ready');
    };

    const scheduleSettleAfterPaint = () => {
      if (cancelled || settled || postPaintTimerId) return;
      // WHY: Yield 1 macrotask so the rAF frame paints .thg-loading before unmounting it.
      postPaintTimerId = window.setTimeout(settle, 0);
    };

    const maybeSettle = (fromRaf: boolean) => {
      if (!painted || !floorElapsed) return;
      if (fromRaf) {
        scheduleSettleAfterPaint();
      } else {
        settle();
      }
    };

    const rafId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      painted = true;
      maybeSettle(true);
    });

    const mountedAt = loadingMountedAtRef.current || performance.now();
    const elapsed = Math.max(0, performance.now() - mountedAt);
    const floorDelay = Math.max(0, 340 - elapsed);
    // WHY: Emergency cap only if rAF is suspended (e.g., background tab); visible tabs always require painted=true.
    const ceilDelay = Math.max(0, 2000 - elapsed);

    const floorTimerId = window.setTimeout(() => {
      if (cancelled) return;
      floorElapsed = true;
      maybeSettle(false);
    }, floorDelay);

    const ceilTimerId = window.setTimeout(settle, ceilDelay);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(floorTimerId);
      window.clearTimeout(ceilTimerId);
      if (postPaintTimerId) window.clearTimeout(postPaintTimerId);
    };
  }, [loadStage]);

  useEffect(() => {
    sheetOpenRef.current = Boolean(activeSheetExhibitId);
    if (!activeSheetExhibitId) {
      sceneControlRef.current?.markDirty();
    }
  }, [activeSheetExhibitId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const paramId = new URLSearchParams(window.location.search).get('exhibit');
    if (paramId && exhibitById.has(paramId)) {
      setActiveSheetExhibitId(paramId);
    }
  }, [exhibitById]);

  const [plateTick, setPlateTick] = useState(0);
  const notifyPlateUpdate = useCallback(() => {
    setPlateTick((t) => t + 1);
  }, []);

  const plateUrls = useMemo(() => {
    void plateTick;
    const map = new Map<string, string>();
    if (typeof document === 'undefined') return map;
    if (viewMode !== 'list' && !activeSheetExhibitId) return map;

    const targets =
      viewMode === 'list'
        ? HONOR_EXHIBITS
        : (() => {
            const active = exhibitById.get(activeSheetExhibitId!);
            if (!active) return [];
            const list: HonorExhibit[] = [active];
            for (const relId of active.relatedIds) {
              const rel = exhibitById.get(relId);
              if (rel) list.push(rel);
            }
            return list;
          })();

    for (const ex of targets) {
      map.set(ex.id, getHonorPlateDataUrl(ex, notifyPlateUpdate));
    }
    return map;
  }, [activeSheetExhibitId, exhibitById, notifyPlateUpdate, plateTick, viewMode]);

  const filteredExhibits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return HONOR_EXHIBITS;
    return HONOR_EXHIBITS.filter(
      (ex) =>
        ex.title.toLowerCase().includes(q) ||
        ex.subtitle.toLowerCase().includes(q) ||
        ex.track.toLowerCase().includes(q) ||
        ex.code.includes(q) ||
        ex.dossier.roleTitle.toLowerCase().includes(q) ||
        ex.dossier.coreContribution.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeExhibit = activeSheetExhibitId ? exhibitById.get(activeSheetExhibitId) ?? null : null;
  const activeExhibitIndex = activeExhibit
    ? HONOR_EXHIBITS.findIndex((item) => item.id === activeExhibit.id)
    : -1;

  const stepDossier = useCallback(
    (delta: -1 | 1) => {
      if (activeExhibitIndex < 0) return;
      const nextIdx = (activeExhibitIndex + delta + HONOR_EXHIBITS.length) % HONOR_EXHIBITS.length;
      const next = HONOR_EXHIBITS[nextIdx];
      if (next) setActiveSheetExhibitId(next.id);
    },
    [activeExhibitIndex]
  );

  const handleGoBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('home');
    } else {
      navigate('home');
    }
  }, [navigate, onBack, onNavigate]);

  const openExhibitSheet = useCallback(
    (exhibitId: string, sourceRect?: RectSnapshot | null) => {
      const targetEx = exhibitById.get(exhibitId);
      if (!targetEx) return;
      if (
        !wasSheetOpenRef.current &&
        typeof document !== 'undefined' &&
        document.activeElement instanceof HTMLElement
      ) {
        lastFocusedBeforeSheetRef.current = document.activeElement;
      }
      pendingFlyRectRef.current = sourceRect ?? null;
      setActiveSheetExhibitId(exhibitId);
      setSearchOpen(false);
    },
    [exhibitById]
  );

  const openExhibitSheetRef = useRef(openExhibitSheet);
  openExhibitSheetRef.current = openExhibitSheet;

  useEffect(() => {
    const ctrl = sceneControlRef.current;
    if (!ctrl) return;
    const paused = viewMode !== '3d';
    ctrl.setPaused(paused);
    if (!paused) {
      ctrl.resize();
      if (pendingFocusExhibitIdRef.current) {
        const focusId = pendingFocusExhibitIdRef.current;
        pendingFocusExhibitIdRef.current = null;
        ctrl.focusExhibitId(focusId);
      } else {
        ctrl.markDirty();
      }
    }
  }, [viewMode]);

  useEffect(() => {
    sceneControlRef.current?.setTheme(isDarkTheme);
  }, [isDarkTheme]);

  useEffect(() => {
    sceneControlRef.current?.setReducedMotion(isReducedMotion);
  }, [isReducedMotion]);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (activeSheetExhibitId) {
      if (!wasSheetOpenRef.current) {
        if (
          !lastFocusedBeforeSheetRef.current &&
          document.activeElement instanceof HTMLElement
        ) {
          lastFocusedBeforeSheetRef.current = document.activeElement;
        }
        wasSheetOpenRef.current = true;
        sheetCloseBtnRef.current?.focus({ preventScroll: true });
      }
      return undefined;
    }

    if (wasSheetOpenRef.current) {
      wasSheetOpenRef.current = false;
      const returnEl = lastFocusedBeforeSheetRef.current;
      lastFocusedBeforeSheetRef.current = null;
      if (returnEl && returnEl.isConnected && returnEl !== document.body) {
        returnEl.focus({ preventScroll: true });
      } else if (hudOpenBtnRef.current && hudOpenBtnRef.current.isConnected) {
        hudOpenBtnRef.current.focus({ preventScroll: true });
      } else if (nav3dBtnRef.current && nav3dBtnRef.current.isConnected) {
        nav3dBtnRef.current.focus({ preventScroll: true });
      }
    }
    return undefined;
  }, [activeSheetExhibitId]);

  // WHY: Compositor-only FLIP/clip reveal (transform + opacity + clip-path, zero layout left/top/width/height thrashing).
  useEffect(() => {
    if (!activeSheetExhibitId) return undefined;
    const srcRect = pendingFlyRectRef.current;
    pendingFlyRectRef.current = null;
    if (isReducedMotion) return undefined;

    const innerEl = sheetInnerRef.current;
    const matEl = sheetMatImgRef.current;
    if (!innerEl || typeof innerEl.animate !== 'function') return undefined;

    if (srcRect && matEl && srcRect.width > 12 && srcRect.height > 12) {
      const destRect = matEl.getBoundingClientRect();
      if (destRect.width > 12 && destRect.height > 12) {
        const dx = srcRect.left + srcRect.width * 0.5 - (destRect.left + destRect.width * 0.5);
        const dy = srcRect.top + srcRect.height * 0.5 - (destRect.top + destRect.height * 0.5);
        const sx = Math.max(0.35, Math.min(1.2, srcRect.width / destRect.width));
        matEl.animate(
          [
            {
              transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${sx.toFixed(3)})`,
              opacity: 0.72,
            },
            {
              transform: 'translate3d(0px, 0px, 0) scale(1)',
              opacity: 1,
            },
          ],
          {
            duration: 320,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
          }
        );
      }
    }

    innerEl.animate(
      [
        { opacity: 0, clipPath: 'inset(2% 0% 4% 0% round 16px)', transform: 'translate3d(0, 12px, 0)' },
        { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 0px)', transform: 'translate3d(0, 0, 0)' },
      ],
      {
        duration: 280,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'both',
      }
    );
    return undefined;
  }, [activeSheetExhibitId, isReducedMotion]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
        } else if (activeSheetExhibitId) {
          setActiveSheetExhibitId(null);
        } else if (focusedExhibitIndex !== null) {
          sceneControlRef.current?.exitFocus();
        }
        return;
      }

      if (isInput) return;

      if (activeSheetExhibitId) {
        if (e.key === 'Tab') {
          const sheetEl = sheetBackdropRef.current;
          if (!sheetEl) return;
          const focusables = Array.from(
            sheetEl.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.getClientRects().length > 0);
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = document.activeElement as HTMLElement | null;
          if (e.shiftKey) {
            if (!active || !sheetEl.contains(active) || active === first) {
              e.preventDefault();
              last.focus();
            }
          } else if (!active || !sheetEl.contains(active) || active === last) {
            e.preventDefault();
            first.focus();
          }
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          stepDossier(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          stepDossier(-1);
        }
        return;
      }

      if (viewMode !== '3d') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'd' || e.key === 'w') {
        e.preventDefault();
        sceneControlRef.current?.stepWalk(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'a' || e.key === 's') {
        e.preventDefault();
        sceneControlRef.current?.stepWalk(-1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSheetExhibitId, focusedExhibitIndex, searchOpen, stepDossier, viewMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (isLoading || !canvas || typeof window === 'undefined') return undefined;

    let cancelled = false;
    let cleanupScene: (() => void) | undefined;
    let yieldRafId = 0;
    let yieldTimerId = 0;
    let chainRafId = 0;
    let chainTimerId = 0;
    let probeGl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
    let contextLost = false;
    let cancelSceneLoop: (() => void) | null = null;
    let glListenersAttached = false;

    const scheduleNextStep = (fn: () => void) => {
      if (cancelled) return;
      chainRafId = window.requestAnimationFrame(() => {
        if (cancelled) return;
        chainTimerId = window.setTimeout(() => {
          if (!cancelled) fn();
        }, 16);
      });
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      cancelSceneLoop?.();
      setWebglUnavailable(true);
    };
    const onContextRestored = () => {
      contextLost = false;
      setWebglUnavailable(false);
      setSceneRetryKey((k) => k + 1);
    };

    const initThreeScene = (THREE: typeof import('./threeSubset')): (() => void) | undefined => {
      if (cancelled || contextLost || !probeGl || probeGl.isContextLost()) {
        setWebglUnavailable(true);
        return undefined;
      }

      let isSoftwareRenderer = false;
      try {
        const dbg = probeGl.getExtension('WEBGL_debug_renderer_info');
        const gpuName = dbg ? String(probeGl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
        isSoftwareRenderer = /swiftshader|llvmpipe|software|angle.*swiftshader/i.test(gpuName);
      } catch {
        isSoftwareRenderer = false;
      }

      let renderer: THREE.WebGLRenderer | null = null;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          context: probeGl,
          antialias: false,
          powerPreference: isSoftwareRenderer ? 'default' : 'high-performance',
        });
      } catch {
        setWebglUnavailable(true);
        return undefined;
      }

      setWebglUnavailable(false);
      let currentDarkTheme = isDarkThemeRef.current;
      let currentReducedMotion = isReducedMotionRef.current;
      let paused = viewModeRef.current !== '3d';

      const dprCap = isSoftwareRenderer ? 0.4 : 1.5;
      renderer.setPixelRatio(
        isSoftwareRenderer ? dprCap : Math.min(window.devicePixelRatio || 1, dprCap)
      );
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = isSoftwareRenderer ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = currentDarkTheme ? 1.0 : 1.04;

      const maxAniso = isSoftwareRenderer ? 1 : renderer.capabilities.getMaxAnisotropy();

      const scene = new THREE.Scene();
      const bgHex = currentDarkTheme ? '#0e1413' : '#eae6dc';
      const fogColor = new THREE.Color(bgHex);
      scene.background = fogColor;
      scene.fog = isSoftwareRenderer ? null : new THREE.FogExp2(bgHex, 0.022);

      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 90);

      let hemiLight: THREE.HemisphereLight | null = null;
      let keyLight: THREE.DirectionalLight | null = null;
      if (!isSoftwareRenderer) {
        hemiLight = new THREE.HemisphereLight(
          currentDarkTheme ? 0xeef5f2 : 0xfffdf8,
          currentDarkTheme ? 0x1a2623 : 0xcac3b2,
          1.4
        );
        scene.add(hemiLight);
        keyLight = new THREE.DirectionalLight(currentDarkTheme ? 0xf2f7f5 : 0xfff7ea, 0.85);
        keyLight.position.set(12, 18, 10);
        scene.add(keyLight);
      }

      const placeholderTex = new THREE.DataTexture(
        new Uint8Array([255, 255, 255, 255]),
        1,
        1,
        THREE.RGBAFormat
      );
      placeholderTex.colorSpace = THREE.SRGBColorSpace;
      placeholderTex.minFilter = THREE.LinearFilter;
      placeholderTex.magFilter = THREE.LinearFilter;
      placeholderTex.generateMipmaps = false;
      placeholderTex.needsUpdate = true;

      let wallTex: THREE.CanvasTexture | null = null;
      let floorTex: THREE.CanvasTexture | null = null;
      let ceilingTex: THREE.CanvasTexture | null = null;

      const radialSegs = isSoftwareRenderer ? 18 : 40;
      const makeRoomMat = (
        colorHex: string,
        side: THREE.Side
      ): THREE.MeshBasicMaterial | THREE.MeshLambertMaterial =>
        isSoftwareRenderer
          ? new THREE.MeshBasicMaterial({ color: colorHex, map: placeholderTex, side })
          : new THREE.MeshLambertMaterial({ color: colorHex, map: placeholderTex, side });

      const outerWallGeo = new THREE.CylinderGeometry(
        CORRIDOR_R,
        CORRIDOR_R,
        CORRIDOR_H,
        radialSegs,
        1,
        true
      );
      outerWallGeo.scale(-1, 1, 1);
      const outerWallMat = makeRoomMat(currentDarkTheme ? '#111817' : '#e8e3d8', THREE.FrontSide);
      const outerWall = new THREE.Mesh(outerWallGeo, outerWallMat);
      outerWall.position.y = CORRIDOR_H * 0.5;
      scene.add(outerWall);

      const floorGeo = new THREE.CircleGeometry(CORRIDOR_R, radialSegs);
      const floorMat = makeRoomMat(currentDarkTheme ? '#0e1413' : '#d8d2c4', THREE.FrontSide);
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI * 0.5;
      floorMesh.position.y = 0;
      scene.add(floorMesh);

      const ceilingGeo = new THREE.CircleGeometry(CORRIDOR_R, radialSegs);
      const ceilingMat = makeRoomMat(currentDarkTheme ? '#141c1a' : '#efece3', THREE.FrontSide);
      const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
      ceilingMesh.rotation.x = Math.PI * 0.5;
      ceilingMesh.position.y = CORRIDOR_H;
      scene.add(ceilingMesh);

      const frameW = 1.62;
      const frameH = frameW * (763 / 567);
      const backingGeo = new THREE.BoxGeometry(frameW + 0.16, frameH + 0.16, 0.06);
      const matGeo = new THREE.PlaneGeometry(frameW + 0.07, frameH + 0.07);
      const artGeo = new THREE.PlaneGeometry(frameW, frameH);

      const backingMat = isSoftwareRenderer
        ? new THREE.MeshBasicMaterial({ color: '#18211f', map: placeholderTex })
        : new THREE.MeshLambertMaterial({ color: '#18211f' });
      const matBoardMat = isSoftwareRenderer
        ? new THREE.MeshBasicMaterial({ color: '#faf7f0', map: placeholderTex })
        : new THREE.MeshLambertMaterial({ color: '#faf7f0' });

      const exhibitMaterials = HONOR_EXHIBITS.map(
        (exhibit) =>
          new THREE.MeshBasicMaterial({
            color: exhibit.palette.bgTop,
            map: placeholderTex,
          })
      );

      const frames: FrameMeta[] = [];
      const hitMeshes: THREE.Mesh[] = [];

      const addFrame = (frameIndex: number, exhibitIndex: number, th: number, y: number) => {
        const rWall = CORRIDOR_R - 0.16;

        const group = new THREE.Group();
        group.position.set(rWall * Math.cos(th), y, rWall * Math.sin(th));
        group.lookAt(0, y, 0);

        const backing = new THREE.Mesh(backingGeo, backingMat);
        group.add(backing);

        const matMesh = new THREE.Mesh(matGeo, matBoardMat);
        matMesh.position.z = 0.032;
        group.add(matMesh);

        const artMesh = new THREE.Mesh(artGeo, exhibitMaterials[exhibitIndex]);
        artMesh.position.z = 0.036;
        artMesh.userData = { frameIndex, exhibitIndex };
        group.add(artMesh);

        scene.add(group);
        hitMeshes.push(artMesh);
        frames.push({
          frameIndex,
          exhibitIndex,
          th,
          r: rWall,
          y,
          focusR: FOCUS_R,
          focusYaw: 0,
          group,
          artMesh,
        });
      };

      for (let i = 0; i < N_FRAMES; i += 1) {
        const th = ARC_MIN + (i / Math.max(1, N_FRAMES - 1)) * (ARC_MAX - ARC_MIN);
        const y = 2.86 + (i % 2 === 0 ? 0.06 : -0.06);
        addFrame(i, i, th, y);
      }

      const pose = {
        th: INIT_TH,
        targetTh: INIT_TH,
        r: WALK_R,
        y: WALK_Y,
        yaw: 0,
        pitch: WALK_PITCH,
      };

      const pointerNorm = { x: 0, y: 0 };
      let hoveredFrameIdx: number | null = null;
      let focusedFrameIdx: number | null = null;
      let prevMs = performance.now();
      let rafId = 0;
      let renderedOnce = false;
      let needsRender = true;
      let canvasReadyForRender = false;

      cancelSceneLoop = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      };

      interface GlideAnim {
        active: boolean;
        elapsed: number;
        duration: number;
        startTh: number;
        dTh: number;
        startR: number;
        targetR: number;
        startY: number;
        targetY: number;
        startYaw: number;
        dYaw: number;
        startPitch: number;
        targetPitch: number;
        onDone?: () => void;
      }

      const glide: GlideAnim = {
        active: false,
        elapsed: 0,
        duration: FOCUS_GLIDE_SEC,
        startTh: 0,
        dTh: 0,
        startR: WALK_R,
        targetR: WALK_R,
        startY: WALK_Y,
        targetY: WALK_Y,
        startYaw: 0,
        dYaw: 0,
        startPitch: WALK_PITCH,
        targetPitch: WALK_PITCH,
      };

      const forwardVec = new THREE.Vector3();
      const rightVec = new THREE.Vector3();
      const lookDir = new THREE.Vector3();
      const upVec = new THREE.Vector3(0, 1, 0);

      const projectFrameRect = (frameIdx: number): RectSnapshot | null => {
        const f = frames[frameIdx];
        if (!f || !renderer) return null;
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        const hw = frameW * 0.5;
        const hh = frameH * 0.5;
        const corners = [
          new THREE.Vector3(-hw, -hh, 0.036),
          new THREE.Vector3(hw, -hh, 0.036),
          new THREE.Vector3(-hw, hh, 0.036),
          new THREE.Vector3(hw, hh, 0.036),
        ];
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        f.group.updateMatrixWorld(true);
        for (const pt of corners) {
          pt.applyMatrix4(f.group.matrixWorld);
          pt.project(camera);
          const sx = rect.left + (pt.x * 0.5 + 0.5) * rect.width;
          const sy = rect.top + (-pt.y * 0.5 + 0.5) * rect.height;
          minX = Math.min(minX, sx);
          maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy);
          maxY = Math.max(maxY, sy);
        }
        if (!Number.isFinite(minX)) return null;
        return {
          left: minX,
          top: minY,
          width: Math.max(20, maxX - minX),
          height: Math.max(20, maxY - minY),
        };
      };

      const tick = (nowMs: number) => {
        rafId = 0;
        if (cancelled || contextLost || paused || !renderer) return;
        if (sheetOpenRef.current && renderedOnce) {
          prevMs = nowMs;
          return;
        }

        const dt = Math.min(0.05, Math.max(0.001, (nowMs - prevMs) * 0.001));
        prevMs = nowMs;

        let moving = false;
        if (glide.active) {
          moving = true;
          glide.elapsed += dt;
          const u = Math.min(1, glide.elapsed / glide.duration);
          const eTh = easeOutQuart(u);
          const eYaw = easeOutQuad(u);
          const ePos = easeOutCubic(u);

          pose.th = glide.startTh + glide.dTh * eTh;
          pose.targetTh = pose.th;
          pose.yaw = glide.startYaw + glide.dYaw * eYaw;
          pose.r = glide.startR + (glide.targetR - glide.startR) * ePos;
          pose.y = glide.startY + (glide.targetY - glide.startY) * ePos;
          pose.pitch = glide.startPitch + (glide.targetPitch - glide.startPitch) * ePos;

          if (u >= 1) {
            glide.active = false;
            glide.onDone?.();
          }
        } else if (focusedFrameIdx === null) {
          const damp = currentReducedMotion ? 1 : 1 - Math.exp(-dt / 0.36);
          const parallaxYaw = currentReducedMotion ? 0 : pointerNorm.x * 0.14;
          const parallaxPitch = currentReducedMotion
            ? WALK_PITCH
            : WALK_PITCH - pointerNorm.y * 0.06;
          const dTh = pose.targetTh - pose.th;
          const dR = WALK_R - pose.r;
          const dY = WALK_Y - pose.y;
          const dYaw = parallaxYaw - pose.yaw;
          const dPitch = parallaxPitch - pose.pitch;

          if (
            Math.abs(dTh) > 0.0002 ||
            Math.abs(dR) > 0.0005 ||
            Math.abs(dY) > 0.0005 ||
            Math.abs(dYaw) > 0.0002 ||
            Math.abs(dPitch) > 0.0002
          ) {
            moving = true;
            pose.th += dTh * damp;
            pose.r += dR * damp;
            pose.y += dY * damp;
            pose.yaw += dYaw * Math.min(1, dt * 6);
            pose.pitch += dPitch * Math.min(1, dt * 6);
          } else {
            pose.th = pose.targetTh;
            pose.r = WALK_R;
            pose.y = WALK_Y;
            pose.yaw = parallaxYaw;
            pose.pitch = parallaxPitch;
          }
        }

        if (!renderedOnce || needsRender || moving) {
          const cosT = Math.cos(pose.th);
          const sinT = Math.sin(pose.th);
          camera.position.set(pose.r * cosT, pose.y, pose.r * sinT);

          // WHY: Radial outward forwardVec faces the single curved front gallery arc (-0.52..+0.52 rad) directly without corridor blind spots.
          forwardVec.set(cosT, 0, sinT);
          rightVec.set(-sinT, 0, cosT);

          lookDir
            .copy(forwardVec)
            .multiplyScalar(Math.cos(pose.yaw))
            .addScaledVector(rightVec, Math.sin(pose.yaw))
            .multiplyScalar(Math.cos(pose.pitch))
            .addScaledVector(upVec, Math.sin(pose.pitch))
            .normalize();

          camera.lookAt(
            camera.position.x + lookDir.x,
            camera.position.y + lookDir.y,
            camera.position.z + lookDir.z
          );

          if (hoveredFrameIdx !== null && focusedFrameIdx === null) {
            const pr = projectFrameRect(hoveredFrameIdx);
            if (pr) {
              setHoveredPill((prev) =>
                prev
                  ? { ...prev, x: pr.left + pr.width * 0.5, y: Math.max(88, pr.top - 10) }
                  : null
              );
            }
          }

          renderer.render(scene, camera);
          renderedOnce = true;
          needsRender = false;
        }

        if (moving || glide.active) {
          rafId = requestAnimationFrame(tick);
        }
      };

      const scheduleTick = () => {
        if (cancelled || contextLost || paused || !renderer || !canvasReadyForRender || rafId !== 0) return;
        prevMs = performance.now();
        rafId = requestAnimationFrame(tick);
      };

      const markDirty = () => {
        needsRender = true;
        scheduleTick();
      };

      const startGlide = (
        targetTh: number,
        targetR: number,
        targetY: number,
        targetYaw: number,
        targetPitch: number,
        onDone?: () => void
      ) => {
        const dTh = shortestAngleDelta(pose.th, targetTh);
        const dYaw = shortestAngleDelta(pose.yaw, targetYaw);
        if (currentReducedMotion) {
          pose.th += dTh;
          pose.targetTh = pose.th;
          pose.r = targetR;
          pose.y = targetY;
          pose.yaw = targetYaw;
          pose.pitch = targetPitch;
          glide.active = false;
          onDone?.();
          markDirty();
          return;
        }
        glide.active = true;
        glide.elapsed = 0;
        glide.duration = FOCUS_GLIDE_SEC;
        glide.startTh = pose.th;
        glide.dTh = dTh;
        glide.startR = pose.r;
        glide.targetR = targetR;
        glide.startY = pose.y;
        glide.targetY = targetY;
        glide.startYaw = pose.yaw;
        glide.dYaw = dYaw;
        glide.startPitch = pose.pitch;
        glide.targetPitch = targetPitch;
        glide.onDone = onDone;
        markDirty();
      };

      const focusFrame = (frameIdx: number) => {
        const f = frames[frameIdx];
        if (!f) return;
        focusedFrameIdx = frameIdx;
        setFocusedExhibitIndex(f.exhibitIndex);
        startGlide(f.th, f.focusR, f.y, f.focusYaw, 0);
      };

      const exitFocus = () => {
        if (focusedFrameIdx === null) return;
        focusedFrameIdx = null;
        setFocusedExhibitIndex(null);
        pose.targetTh = pose.th;
        startGlide(pose.th, WALK_R, WALK_Y, 0, WALK_PITCH);
      };

      let lastW = 0;
      let lastH = 0;
      const updateSize = (shouldMarkDirty = true) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        if (w === lastW && h === lastH) return;
        lastW = w;
        lastH = h;
        renderer?.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w <= 640 ? 56 : 48;
        camera.updateProjectionMatrix();
        if (shouldMarkDirty) markDirty();
      };

      let dragging = false;
      sceneControlRef.current = {
        focusFrameByIndex: (idx: number) => focusFrame(idx),
        focusExhibitId: (exhibitId: string) => {
          const exIdx = HONOR_EXHIBITS.findIndex((e) => e.id === exhibitId);
          if (exIdx >= 0 && frames[exIdx]) {
            focusFrame(frames[exIdx].frameIndex);
          }
        },
        stepWalk: (delta: number) => {
          if (focusedFrameIdx !== null) {
            const nextIdx = Math.max(0, Math.min(frames.length - 1, focusedFrameIdx + delta));
            focusFrame(nextIdx);
          } else {
            const step = (ARC_MAX - ARC_MIN) / Math.max(1, N_FRAMES - 1);
            pose.targetTh = clampArc(pose.targetTh + delta * step);
            markDirty();
          }
        },
        exitFocus,
        projectFocusedRect: () =>
          focusedFrameIdx !== null ? projectFrameRect(focusedFrameIdx) : null,
        markDirty,
        setPaused: (nextPaused: boolean) => {
          paused = nextPaused;
          if (paused) {
            dragging = false;
            hoveredFrameIdx = null;
            canvas.classList.remove('is-dragging', 'is-pointer');
            setHoveredPill(null);
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = 0;
            }
          } else {
            updateSize(false);
            markDirty();
          }
        },
        setTheme: (nextDark: boolean) => {
          if (currentDarkTheme === nextDark) return;
          currentDarkTheme = nextDark;
          if (!renderer) return;
          renderer.toneMappingExposure = nextDark ? 1.0 : 1.04;
          const nextBg = nextDark ? '#0e1413' : '#eae6dc';
          scene.background = new THREE.Color(nextBg);
          if (scene.fog instanceof THREE.FogExp2) {
            scene.fog.color.set(nextBg);
          }
          if (hemiLight) {
            hemiLight.color.setHex(nextDark ? 0xeef5f2 : 0xfffdf8);
            hemiLight.groundColor.setHex(nextDark ? 0x1a2623 : 0xcac3b2);
          }
          if (keyLight) {
            keyLight.color.setHex(nextDark ? 0xf2f7f5 : 0xfff7ea);
          }
          if (wallTex) {
            wallTex.dispose();
            wallTex = createCorridorWallTexture(THREE, nextDark, isSoftwareRenderer);
            outerWallMat.map = wallTex;
          } else {
            outerWallMat.color.set(nextDark ? '#111817' : '#e8e3d8');
          }
          if (floorTex) {
            floorTex.dispose();
            floorTex = createRadialFloorTexture(THREE, nextDark, isSoftwareRenderer);
            floorMat.map = floorTex;
          } else {
            floorMat.color.set(nextDark ? '#0e1413' : '#d8d2c4');
          }
          if (ceilingTex) {
            ceilingTex.dispose();
            ceilingTex = createRadialCeilingTexture(THREE, nextDark, isSoftwareRenderer);
            ceilingMat.map = ceilingTex;
          } else {
            ceilingMat.color.set(nextDark ? '#141c1a' : '#efece3');
          }
          markDirty();
        },
        setReducedMotion: (reduced: boolean) => {
          currentReducedMotion = reduced;
        },
        resize: () => {
          updateSize(true);
        },
      };

      if (pendingFocusExhibitIdRef.current) {
        const focusId = pendingFocusExhibitIdRef.current;
        pendingFocusExhibitIdRef.current = null;
        sceneControlRef.current.focusExhibitId(focusId);
      } else {
        setFocusedExhibitIndex(null);
      }

      const ro = new ResizeObserver(() => {
        if (!paused) updateSize(true);
      });
      ro.observe(canvas);
      updateSize(false);

      const raycaster = new THREE.Raycaster();
      const pointerNDC = new THREE.Vector2();
      let dragMoved = 0;
      let lastX = 0;

      const pickFrameAt = (clientX: number, clientY: number): number | null => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects(hitMeshes, false);
        if (hits.length > 0 && hits[0].distance < 22) {
          const idx = hits[0].object.userData.frameIndex;
          return typeof idx === 'number' ? idx : null;
        }
        return null;
      };

      const onPointerDown = (e: PointerEvent) => {
        if (paused || contextLost) return;
        dragging = true;
        dragMoved = 0;
        lastX = e.clientX;
        canvas.classList.add('is-dragging');
        markDirty();
      };

      const onPointerMove = (e: PointerEvent) => {
        if (paused || contextLost) return;
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        pointerNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNorm.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

        if (dragging) {
          const dx = e.clientX - lastX;
          lastX = e.clientX;
          dragMoved += Math.abs(dx);
          if (dragMoved > 5) {
            if (focusedFrameIdx !== null) {
              focusedFrameIdx = null;
              setFocusedExhibitIndex(null);
              glide.active = false;
              pose.r = WALK_R;
              pose.y = WALK_Y;
              pose.yaw = 0;
              pose.pitch = WALK_PITCH;
            }
            pose.targetTh = clampArc(pose.targetTh - dx * 0.0022);
          }
          markDirty();
          return;
        }

        if (!currentReducedMotion) {
          markDirty();
        }

        const picked = pickFrameAt(e.clientX, e.clientY);
        hoveredFrameIdx = picked;
        if (picked !== null) {
          canvas.classList.add('is-pointer');
          const pr = projectFrameRect(picked);
          if (pr) {
            setHoveredPill({
              exhibitIndex: frames[picked].exhibitIndex,
              x: pr.left + pr.width * 0.5,
              y: Math.max(88, pr.top - 10),
            });
          }
        } else {
          canvas.classList.remove('is-pointer');
          setHoveredPill(null);
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        canvas.classList.remove('is-dragging');
        if (paused || contextLost) return;

        if (dragMoved < 6) {
          const picked = pickFrameAt(e.clientX, e.clientY);
          if (picked !== null) {
            if (focusedFrameIdx === picked) {
              const rectSnap = projectFrameRect(picked);
              const exhibit = HONOR_EXHIBITS[frames[picked].exhibitIndex];
              if (exhibit) openExhibitSheetRef.current(exhibit.id, rectSnap);
            } else {
              focusFrame(picked);
            }
          } else if (focusedFrameIdx !== null) {
            exitFocus();
          }
        }
        markDirty();
      };

      const onWheel = (e: WheelEvent) => {
        if (paused || contextLost) return;
        e.preventDefault();
        if (focusedFrameIdx !== null) {
          exitFocus();
        }
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        pose.targetTh = clampArc(pose.targetTh + delta * 0.00055);
        markDirty();
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('wheel', onWheel, { passive: false });

      const hydrateExhibit = (idx: number) => {
        const exhibit = HONOR_EXHIBITS[idx];
        const mat = exhibitMaterials[idx];
        if (!exhibit || !mat) return;
        const art = createHonorArtwork(
          exhibit,
          maxAniso,
          () => markDirty(),
          true,
          isSoftwareRenderer,
          THREE
        );
        if (art.texture) {
          mat.map = art.texture;
          mat.color.set('#ffffff');
        }
      };

      const hydrateOrder = [2, 3, 1, 4, 0, 5, 6, 7, 8].filter((i) => i < HONOR_EXHIBITS.length);
      const hydrationSteps: Array<() => void> = [
        () => {
          // Slice 1: Pre-warm shader program(s) in a 1x1 offscreen render target (0 <canvas> ReadPixels)
          const rt = new THREE.WebGLRenderTarget(1, 1);
          const warmScene = new THREE.Scene();
          const warmGeo = new THREE.PlaneGeometry(1, 1);
          const warmArt = new THREE.Mesh(warmGeo, exhibitMaterials[0]);
          warmArt.frustumCulled = false;
          warmScene.add(warmArt);
          let warmHemi: THREE.HemisphereLight | null = null;
          let warmKey: THREE.DirectionalLight | null = null;
          if (!isSoftwareRenderer) {
            if (hemiLight) {
              warmHemi = hemiLight.clone();
              warmScene.add(warmHemi);
            }
            if (keyLight) {
              warmKey = keyLight.clone();
              warmScene.add(warmKey);
            }
            const warmWall = new THREE.Mesh(warmGeo, outerWallMat);
            warmWall.frustumCulled = false;
            warmScene.add(warmWall);
            const warmBacking = new THREE.Mesh(warmGeo, backingMat);
            warmBacking.frustumCulled = false;
            warmScene.add(warmBacking);
          }
          const prevTarget = renderer.getRenderTarget();
          renderer.setRenderTarget(rt);
          renderer.render(warmScene, camera);
          renderer.setRenderTarget(prevTarget);
          warmScene.clear();
          warmHemi?.dispose();
          warmKey?.dispose();
          warmGeo.dispose();
          rt.dispose();
        },
        () => {
          // Slice 2: First <canvas> paint with pre-compiled shader(s)
          canvasReadyForRender = true;
          if (!paused) markDirty();
        },
        () => {
          wallTex = createCorridorWallTexture(THREE, currentDarkTheme, isSoftwareRenderer);
          outerWallMat.map = wallTex;
          outerWallMat.color.set('#ffffff');
          if (!paused) markDirty();
        },
        () => {
          floorTex = createRadialFloorTexture(THREE, currentDarkTheme, isSoftwareRenderer);
          floorMat.map = floorTex;
          floorMat.color.set('#ffffff');
        },
        () => {
          ceilingTex = createRadialCeilingTexture(THREE, currentDarkTheme, isSoftwareRenderer);
          ceilingMat.map = ceilingTex;
          ceilingMat.color.set('#ffffff');
          if (!paused) markDirty();
        },
        ...hydrateOrder.map((idx, k) => () => {
          hydrateExhibit(idx);
          if (!paused && (k % 3 === 2 || k === hydrateOrder.length - 1)) {
            markDirty();
          }
        }),
      ];

      let stepCursor = 0;
      const runNextHydrationStep = () => {
        if (cancelled || contextLost) return;
        const stepFn = hydrationSteps[stepCursor];
        stepCursor += 1;
        if (!stepFn) return;
        stepFn();
        if (stepCursor < hydrationSteps.length) {
          scheduleNextStep(runNextHydrationStep);
        }
      };

      scheduleNextStep(runNextHydrationStep);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        cancelSceneLoop = null;
        ro.disconnect();
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('wheel', onWheel);
        sceneControlRef.current = null;

        outerWallGeo.dispose();
        outerWallMat.dispose();
        floorGeo.dispose();
        floorMat.dispose();
        ceilingGeo.dispose();
        ceilingMat.dispose();
        wallTex?.dispose();
        floorTex?.dispose();
        ceilingTex?.dispose();
        placeholderTex.dispose();
        backingGeo.dispose();
        backingMat.dispose();
        matGeo.dispose();
        matBoardMat.dispose();
        artGeo.dispose();
        exhibitMaterials.forEach((m) => m.dispose());
        disposeHonorArtworkTextures();
        renderer?.dispose();
      };
    };

    const startWebglAndThree = () => {
      if (cancelled) return;
      const ctxOpts: WebGLContextAttributes = {
        alpha: false,
        antialias: false,
        stencil: false,
        powerPreference: 'high-performance',
      };
      probeGl =
        (canvas.getContext('webgl2', ctxOpts) as WebGL2RenderingContext | null) ||
        (canvas.getContext('webgl', ctxOpts) as WebGLRenderingContext | null);

      if (!probeGl || probeGl.isContextLost()) {
        setWebglUnavailable(true);
        return;
      }

      glListenersAttached = true;
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);

      void import('./threeSubset')
        .then((THREE) => {
          if (cancelled) return;
          scheduleNextStep(() => {
            if (cancelled) return;
            cleanupScene = initThreeScene(THREE);
          });
        })
        .catch(() => {
          if (!cancelled) setWebglUnavailable(true);
        });
    };

    // WHY: Yield rAF + 16ms after loadStage settles so .thg-loading removal paints cleanly before WebGL/threeSubset boot.
    yieldRafId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      yieldTimerId = window.setTimeout(startWebglAndThree, 16);
    });

    return () => {
      cancelled = true;
      if (yieldRafId) window.cancelAnimationFrame(yieldRafId);
      if (yieldTimerId) window.clearTimeout(yieldTimerId);
      if (chainRafId) window.cancelAnimationFrame(chainRafId);
      if (chainTimerId) window.clearTimeout(chainTimerId);
      if (glListenersAttached) {
        canvas.removeEventListener('webglcontextlost', onContextLost);
        canvas.removeEventListener('webglcontextrestored', onContextRestored);
      }
      cleanupScene?.();
      if (probeGl && !probeGl.isContextLost()) {
        try {
          probeGl.getExtension('WEBGL_lose_context')?.loseContext();
        } catch {
          // ignore
        }
      }
    };
  }, [isLoading, sceneRetryKey]);

  const focusedExhibit =
    focusedExhibitIndex !== null ? HONOR_EXHIBITS[focusedExhibitIndex] ?? null : null;

  return (
    <div
      className="thg-root"
      data-honor-settled={loadStage === 'ready' ? 'true' : undefined}
    >
      <header className="thg-header" aria-hidden={Boolean(activeExhibit)}>
        <div className="thg-brand" aria-label="F-Forum · Vinh Danh">
          <span className="thg-brand-mark" aria-hidden="true">
            <IconCompass size={14} />
          </span>
          <span>F-Forum · Vinh Danh</span>
        </div>

        <nav className="thg-nav" aria-label="Điều hướng Sổ Vinh Danh">
          <button
            ref={nav3dBtnRef}
            type="button"
            className={`thg-nav-link ${viewMode === '3d' && !activeSheetExhibitId ? 'is-active' : ''}`}
            onClick={() => {
              pendingFocusExhibitIdRef.current = null;
              setActiveSheetExhibitId(null);
              setFocusedExhibitIndex(null);
              setHoveredPill(null);
              if (viewMode === '3d') {
                sceneControlRef.current?.exitFocus();
              } else {
                setViewMode('3d');
              }
            }}
          >
            Hành lang 3D
          </button>
          <button
            type="button"
            className={`thg-nav-link ${viewMode === 'list' && !activeSheetExhibitId ? 'is-active' : ''}`}
            onClick={() => {
              pendingFocusExhibitIdRef.current = null;
              setActiveSheetExhibitId(null);
              setFocusedExhibitIndex(null);
              setHoveredPill(null);
              setViewMode('list');
            }}
          >
            Danh sách
          </button>
          <button
            type="button"
            className="thg-nav-link thg-nav-link--back"
            onClick={handleGoBack}
          >
            Quay lại
          </button>
        </nav>

        <div className="thg-header-actions">
          <button
            type="button"
            className={`thg-icon-btn ${searchOpen ? 'is-active' : ''}`}
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Tìm kiếm"
            title="Tìm kiếm"
            aria-expanded={searchOpen}
          >
            {searchOpen ? <IconX size={17} aria-hidden="true" /> : <IconSearch size={17} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="thg-search-bar" role="search" aria-label="Tìm kiếm hồ sơ vinh danh">
          <Suspense
            fallback={
              <div className="psearch-shell thg-pinui-search">
                <div className="psearch-bar" style={{ minHeight: '38px' }}>
                  <IconSearch size={16} aria-hidden="true" />
                  <input
                    type="search"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm vai trò, khảo sát 195, kiến trúc, bảo mật..."
                    aria-label="Tìm vai trò, khảo sát 195, kiến trúc, bảo mật..."
                    className="w-full min-w-0 bg-transparent border-0 outline-none text-[13.5px]"
                  />
                </div>
              </div>
            }
          >
            <LazySearchCard
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm vai trò, khảo sát 195, kiến trúc, bảo mật..."
              compact
              autoFocus
              className="thg-pinui-search"
            />
          </Suspense>
          <div className="thg-search-results">
            {filteredExhibits.length === 0 ? (
              <div className="thg-empty thg-empty--compact">
                <p>Không tìm thấy hồ sơ khớp với &ldquo;{searchQuery}&rdquo;.</p>
                <button
                  type="button"
                  className="thg-ghost-btn"
                  onClick={() => setSearchQuery('')}
                >
                  Hiện tất cả
                </button>
              </div>
            ) : (
              filteredExhibits.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  className="thg-search-item"
                  onClick={() => {
                    setSearchOpen(false);
                    if (viewMode === '3d') {
                      setActiveSheetExhibitId(null);
                      sceneControlRef.current?.focusExhibitId(ex.id);
                    } else {
                      openExhibitSheet(ex.id);
                    }
                  }}
                >
                  <div>
                    <div className="thg-search-item-title">{ex.title}</div>
                    <div className="thg-search-item-sub">{ex.dossier.roleTitle}</div>
                  </div>
                  <span className="thg-search-item-code">{ex.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div
        className={viewMode === '3d' ? 'thg-stage-wrap' : 'thg-stage-wrap is-hidden'}
        aria-hidden={Boolean(activeExhibit) || viewMode !== '3d'}
      >
        <canvas
          key={sceneRetryKey}
          ref={canvasRef}
          className="thg-canvas"
          aria-label="Hành lang trưng bày 3D Đội ngũ Phát triển F-Forum"
        />

        {loadStage === 'prewarm' && <div className="thg-curtain" aria-hidden="true" />}

        {loadStage === 'loading' && (
          <div
            className="thg-loading skeleton"
            aria-busy="true"
            data-loading="true"
            aria-live="polite"
          >
            <div className="thg-loading-grid" aria-hidden="true">
              <div className="thg-loading-card" />
              <div className="thg-loading-card thg-loading-card--center" />
              <div className="thg-loading-card" />
            </div>
            <span className="thg-loading-label">Đang dựng phòng vinh danh...</span>
          </div>
        )}

        {viewMode === '3d' && webglUnavailable && !activeSheetExhibitId && (
          <div className="thg-webgl-fallback">
            <p className="thg-hud-kicker">PHÒNG VINH DANH F-FORUM</p>
            <h1 className="thg-hud-headline">Trình duyệt tạm tắt WebGL 3D</h1>
            <p className="thg-hud-sub">
              Bạn vẫn có thể duyệt toàn bộ 9 hồ sơ đội ngũ phát triển dưới dạng thẻ biên tập.
            </p>
            <div className="thg-fallback-actions">
              <button
                type="button"
                className="thg-primary-btn"
                onClick={() => setViewMode('list')}
              >
                Danh sách
              </button>
              <button
                type="button"
                className="thg-ghost-btn"
                onClick={() => {
                  setWebglUnavailable(false);
                  setSceneRetryKey((k) => k + 1);
                }}
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {viewMode === '3d' && !activeSheetExhibitId && !webglUnavailable && (
          <div className="thg-hud">
            <div className="thg-hud-top">
              {loadStage === 'ready' && (
                <div className="thg-hud-hint-box">
                  <span>
                    {focusedExhibit
                      ? `Đang soi Bản ghi ${focusedExhibit.code} · Nhấp lại khung tranh để mở hồ sơ · Esc để lùi`
                      : 'Kéo ngang hoặc cuộn để dạo hành lang · Nhấp vào khung tranh để soi'}
                  </span>
                </div>
              )}
            </div>

            {loadStage === 'ready' && (
              <div className="thg-hud-arrows">
                <button
                  type="button"
                  className="thg-circle-arrow"
                  onClick={() => sceneControlRef.current?.stepWalk(-1)}
                  aria-label="Khung trước"
                  title="Khung trước"
                >
                  <IconChevronLeft size={22} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="thg-circle-arrow"
                  onClick={() => sceneControlRef.current?.stepWalk(1)}
                  aria-label="Khung tiếp theo"
                  title="Khung tiếp theo"
                >
                  <IconChevronRight size={22} aria-hidden="true" />
                </button>
              </div>
            )}

            {loadStage === 'ready' && hoveredPill && !focusedExhibit && (
              <button
                type="button"
                className="thg-inspect-pill"
                style={{ left: hoveredPill.x, top: hoveredPill.y }}
                onClick={() => {
                  const ex = HONOR_EXHIBITS[hoveredPill.exhibitIndex];
                  if (ex) openExhibitSheet(ex.id);
                }}
              >
                Mở hồ sơ
              </button>
            )}

            <div className="thg-hud-bottom">
              <div className="thg-hud-title-block">
                <p className="thg-hud-kicker">
                  {focusedExhibit
                    ? `${focusedExhibit.kicker} · ${focusedExhibit.milestone}`
                    : 'CỘNG ĐỒNG F-FORUM · SỔ TAY TRI ÂN'}
                </p>
                <h1 className="thg-hud-headline">
                  {focusedExhibit ? focusedExhibit.title : 'ĐỘI NGŨ F-FORUM'}
                </h1>
                <p className="thg-hud-sub">
                  {focusedExhibit
                    ? focusedExhibit.subtitle
                    : '9 bản ghi kiến tạo nền tảng học tập web mở, minh bạch và chống AI Slop.'}
                </p>
              </div>

              {loadStage === 'ready' && focusedExhibit && (
                <div className="thg-hud-bottom-actions">
                  <button
                    type="button"
                    className="thg-icon-btn"
                    onClick={() => sceneControlRef.current?.exitFocus()}
                    aria-label="Thu gọn"
                    title="Thu gọn"
                  >
                    <IconMinimize2 size={17} aria-hidden="true" />
                  </button>
                  <button
                    ref={hudOpenBtnRef}
                    type="button"
                    className="thg-primary-btn"
                    onClick={() =>
                      openExhibitSheet(
                        focusedExhibit.id,
                        sceneControlRef.current?.projectFocusedRect()
                      )
                    }
                  >
                    Mở hồ sơ
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {viewMode === 'list' && (
        <section
          className="thg-list-view"
          aria-label="Danh sách 9 bản ghi đội ngũ F-Forum"
          aria-hidden={Boolean(activeExhibit)}
        >
          <div className="thg-list-head">
            <div>
              <p className="thg-hud-kicker">PHÒNG VINH DANH ĐỘI NGŨ PHÁT TRIỂN · CỘNG ĐỒNG F-FORUM</p>
              <h1 className="thg-list-title">Sổ Tay Đóng Góp F-Forum</h1>
            </div>
            <p className="thg-list-lede">
              Chín phân khu ghi nhận tập thể tác giả, thầy cô cố vấn, khảo sát thực chứng 195 học sinh và kiến trúc mở phía sau F-Forum.
            </p>
          </div>

          {filteredExhibits.length === 0 ? (
            <div className="thg-empty">
              <p className="thg-hud-kicker">KHÔNG TÌM THẤY KẾT QUẢ</p>
              <h2 className="thg-empty-title">Không có hồ sơ khớp với &ldquo;{searchQuery}&rdquo;</h2>
              <p className="thg-empty-copy">
                Thử xóa bộ lọc tìm kiếm để hiển thị đầy đủ 9 hồ sơ đội ngũ phát triển và cố vấn F-Forum.
              </p>
              <button
                type="button"
                className="thg-primary-btn"
                onClick={() => setSearchQuery('')}
              >
                Hiện tất cả
              </button>
            </div>
          ) : (
            <div className="thg-grid">
              {filteredExhibits.map((ex) => {
                const src = plateUrls.get(ex.id) || '';
                const isBroken = Boolean(brokenImages[ex.id]) || !src;
                return (
                  <article key={ex.id} data-exhibit-id={ex.id} className="thg-card">
                    <figure className="thg-card-plate-wrap">
                      {!isBroken ? (
                        <img
                          src={src}
                          alt={`Bản ghi ${ex.code}: ${ex.title}`}
                          className="thg-card-plate"
                          loading="lazy"
                          onError={() => setBrokenImages((prev) => ({ ...prev, [ex.id]: true }))}
                        />
                      ) : (
                        <div className="thg-card-plate-fallback" aria-hidden="true">
                          <span>{ex.code}</span>
                          <strong>{ex.title}</strong>
                        </div>
                      )}
                    </figure>
                    <div className="thg-card-body">
                      <div className="thg-card-meta">
                        <span>{ex.kicker}</span>
                        <span>{ex.milestone}</span>
                      </div>
                      <h2 className="thg-card-title">{ex.title}</h2>
                      <p className="thg-card-role">{ex.dossier.roleTitle}</p>
                      <p className="thg-card-sub">{ex.subtitle}</p>
                      <div className="thg-card-actions">
                        <button
                          type="button"
                          className="thg-primary-btn"
                          style={{ flex: 1 }}
                          data-card-trigger
                          onClick={(ev) => {
                            const card = ev.currentTarget.closest('.thg-card');
                            const img = card?.querySelector('img');
                            const r = img?.getBoundingClientRect();
                            openExhibitSheet(
                              ex.id,
                              r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null
                            );
                          }}
                        >
                          Mở hồ sơ
                        </button>
                        <button
                          type="button"
                          className="thg-icon-btn"
                          onClick={() => {
                            pendingFocusExhibitIdRef.current = ex.id;
                            setViewMode('3d');
                          }}
                          aria-label={`Soi ${ex.title} 3D`}
                          title="Soi 3D"
                        >
                          <IconCompass size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeExhibit && (
        <section
          ref={sheetBackdropRef}
          id="honor-sheet"
          className="thg-sheet-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="thg-sheet-heading"
        >
          <div ref={sheetInnerRef} className="thg-sheet-inner">
            <div className="thg-sheet-topbar">
              <div className="thg-sheet-stepper">
                <span className="thg-sheet-counter">
                  Hồ sơ {String(activeExhibitIndex + 1).padStart(2, '0')} /{' '}
                  {String(HONOR_EXHIBITS.length).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  className="thg-icon-btn"
                  onClick={() => stepDossier(-1)}
                  aria-label="Hồ sơ trước"
                  title="Hồ sơ trước"
                >
                  <IconChevronLeft size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="thg-icon-btn"
                  onClick={() => stepDossier(1)}
                  aria-label="Hồ sơ sau"
                  title="Hồ sơ sau"
                >
                  <IconChevronRight size={17} aria-hidden="true" />
                </button>
              </div>

              <button
                ref={sheetCloseBtnRef}
                type="button"
                className="thg-icon-btn"
                onClick={() => setActiveSheetExhibitId(null)}
                aria-label="Đóng hồ sơ"
                title="Đóng"
              >
                <IconX size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="thg-sheet-layout">
              <div className="thg-sheet-mat">
                {!brokenImages[activeExhibit.id] ? (
                  <img
                    ref={sheetMatImgRef}
                    src={
                      plateUrls.get(activeExhibit.id) ||
                      getHonorPlateDataUrl(activeExhibit, notifyPlateUpdate)
                    }
                    alt={`Bản vẽ vinh danh ${activeExhibit.title}`}
                    className="thg-sheet-img"
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [activeExhibit.id]: true }))
                    }
                  />
                ) : (
                  <div className="thg-card-plate-fallback" aria-hidden="true">
                    <span>{activeExhibit.code}</span>
                    <strong>{activeExhibit.title}</strong>
                  </div>
                )}
              </div>

              <div className="thg-sheet-content">
                <header className="thg-dossier-head">
                  <p className="thg-sheet-kicker">
                    {activeExhibit.kicker} · {activeExhibit.track}
                  </p>
                  <h1 id="thg-sheet-heading" className="thg-sheet-title">
                    {activeExhibit.title}
                  </h1>
                  <p className="thg-sheet-subtitle">{activeExhibit.subtitle}</p>
                </header>

                <dl className="thg-dossier-meta-grid" aria-label="Thông số hồ sơ">
                  <div className="thg-dossier-meta-cell">
                    <dt>Vai trò</dt>
                    <dd>{activeExhibit.dossier.roleTitle}</dd>
                  </div>
                  <div className="thg-dossier-meta-cell">
                    <dt>Phân hệ</dt>
                    <dd>{activeExhibit.dossier.focusArea}</dd>
                  </div>
                  <div className="thg-dossier-meta-cell">
                    <dt>Giai đoạn</dt>
                    <dd>{activeExhibit.dossier.cycle}</dd>
                  </div>
                </dl>

                <div className="thg-sheet-metrics">
                  {activeExhibit.metrics.map((m) => (
                    <div key={m.label} className="thg-metric-box">
                      <span className="thg-metric-val" data-metric>
                        {m.value}
                      </span>
                      <span className="thg-metric-lbl">{m.label}</span>
                    </div>
                  ))}
                </div>

                <div className="thg-dossier-sections">
                  <article className="thg-dossier-section">
                    <h2 className="thg-dossier-section-title">Tiểu sử &amp; Định hướng</h2>
                    <p className="thg-dossier-prose">{activeExhibit.dossier.bio}</p>
                  </article>

                  <article className="thg-dossier-section">
                    <h2 className="thg-dossier-section-title">Đóng góp Kiến trúc Cốt lõi</h2>
                    <p className="thg-dossier-prose">{activeExhibit.dossier.coreContribution}</p>
                    <p className="thg-dossier-prose">{activeExhibit.dossier.architectureResults}</p>
                  </article>

                  <article className="thg-dossier-section">
                    <h2 className="thg-dossier-section-title">Vinh danh &amp; Ghi nhận</h2>
                    <p className="thg-dossier-prose">{activeExhibit.dossier.honors}</p>
                  </article>
                </div>

                <div className="thg-dossier-nav">
                  <button
                    type="button"
                    className="thg-ghost-btn"
                    onClick={() => stepDossier(-1)}
                  >
                    Hồ sơ trước
                  </button>
                  <button
                    type="button"
                    className="thg-ghost-btn"
                    onClick={() => stepDossier(1)}
                  >
                    Hồ sơ sau
                  </button>
                </div>
              </div>
            </div>

            <div className="thg-related">
              <p className="thg-related-head">HỒ SƠ LIÊN QUAN</p>
              <div className="thg-related-grid">
                {activeExhibit.relatedIds.map((relId) => {
                  const rel = exhibitById.get(relId);
                  if (!rel) return null;
                  const relSrc = plateUrls.get(rel.id) || '';
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      className="thg-related-card"
                      data-card-trigger
                      onClick={() => openExhibitSheet(rel.id)}
                    >
                      {relSrc && !brokenImages[rel.id] && (
                        <img
                          src={relSrc}
                          alt=""
                          className="thg-related-thumb"
                          aria-hidden="true"
                          onError={() => setBrokenImages((prev) => ({ ...prev, [rel.id]: true }))}
                        />
                      )}
                      <div>
                        <span className="thg-search-item-code">{rel.kicker}</span>
                        <h2 className="thg-related-title">{rel.title}</h2>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default TeamHonorGallery;
