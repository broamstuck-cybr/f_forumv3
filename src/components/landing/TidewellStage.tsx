import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DimensionView } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { IconX } from '../../ui/icons';
import {
  buildRandomInterleaved25,
  buildRoundedQuadClipPath,
  buildShowcase50,
  type ShowcaseExperienceCard,
  type ShowcaseFilterMode,
  type ShowcaseLibraryKind,
} from '../../data/reelmarkCarouselData';
import { VAULT_CACHE_VERSION } from '../../features/explore/vaultLoader';
import { useInView, usePrefersReducedMotion } from './useLandingMotion';
import './tidewell.css';

const PinUIPlayground = React.lazy(() =>
  import('../pinui').then((m) => ({ default: m.PinUIPlayground }))
);
const SandboxPreview = React.lazy(() =>
  import('../../features/explore/SandboxPreview').then((m) => ({ default: m.SandboxPreview }))
);

export interface TidewellStageProps {
  onNavigate?: (view: DimensionView) => void;
}

export {
  buildRandomInterleaved25,
  buildRoundedQuadClipPath,
  buildShowcase50,
  type ShowcaseExperienceCard,
  type ShowcaseFilterMode,
  type ShowcaseLibraryKind,
};

interface MotionFullEntry {
  liveHtml?: string;
  css?: string;
  promptText?: string;
}

function splitLiveHtmlCss(rawLiveHtml: string | undefined, extraCss?: string): { html: string; css: string } | null {
  if (!rawLiveHtml || rawLiveHtml.trim().length === 0) return null;
  const isFullDoc = /^\s*(?:<!doctype\s+html|<html[\s>])/i.test(rawLiveHtml);
  if (isFullDoc) {
    return { html: rawLiveHtml.trim(), css: extraCss?.trim() || '' };
  }
  const styleBlocks: string[] = [];
  if (extraCss && extraCss.trim()) styleBlocks.push(extraCss.trim());
  const html = rawLiveHtml
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, cssBody: string) => {
      if (cssBody && cssBody.trim()) styleBlocks.push(cssBody.trim());
      return '';
    })
    .trim();
  if (!html) return null;
  return { html, css: styleBlocks.join('\n\n') };
}

let motionFullCache: Record<string, MotionFullEntry> | null = null;
let motionFullPromise: Promise<Record<string, MotionFullEntry>> | null = null;

async function fetchMotionSitesFull(): Promise<Record<string, MotionFullEntry>> {
  if (motionFullCache) return motionFullCache;
  if (!motionFullPromise) {
    motionFullPromise = fetch(`/data/motionsites-full.json?v=${VAULT_CACHE_VERSION}`)
      .then((res) => (res.ok ? res.json() : { items: {} }))
      .then((data: { items?: Record<string, MotionFullEntry> }) => {
        motionFullCache = data.items || {};
        return motionFullCache;
      })
      .catch(() => {
        motionFullCache = {};
        return {};
      });
  }
  return motionFullPromise;
}

function circularIndexDistance(i: number, active: number, total: number): number {
  const diff = Math.abs(i - active);
  return Math.min(diff, total - diff);
}

interface CardStyleSnapshot {
  display: string;
  width: string;
  height: string;
  transform: string;
  clipPath: string;
  zIndex: string;
}

export const TidewellStage: React.FC<TidewellStageProps> = () => {
  const { launchPromptToWorkspace, openExperience, theme } = useAppStore();
  const reduced = usePrefersReducedMotion();
  const { ref: stageRef, inView: stageInView } = useInView<HTMLElement>({
    once: false,
    threshold: 0.02,
    rootMargin: '0px',
  });

  const [seed] = useState<number>(() => Math.floor(Math.random() * 1000000) + 1);
  const cards = useMemo(() => buildShowcase50(seed, 'all'), [seed]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ShowcaseExperienceCard | null>(null);
  const [modalMode, setModalMode] = useState<'interactive' | 'video'>('interactive');
  const [pinuiModalTheme, setPinuiModalTheme] = useState<'dark' | 'light'>(theme);
  const [liveHtmlContent, setLiveHtmlContent] = useState<string | null>(null);
  const [liveCssContent, setLiveCssContent] = useState<string>('');
  const [themeOverrideCss, setThemeOverrideCss] = useState<string>('');
  const [fullPromptContent, setFullPromptContent] = useState<string | null>(null);
  const [liveHtmlLoading, setLiveHtmlLoading] = useState(false);
  const [readyVideos, setReadyVideos] = useState<Record<string, boolean>>({});

  const frameRef = useRef<HTMLDivElement>(null);
  const trackLayerRef = useRef<HTMLDivElement>(null);
  const cardElsRef = useRef<Array<HTMLDivElement | null>>([]);
  const cardStyleCacheRef = useRef<Array<CardStyleSnapshot | undefined>>([]);
  const scheduleTickRef = useRef<(() => void) | null>(null);
  const dimsRef = useRef({
    vw: 1440,
    isPhone: false,
    frameW: 1440,
    layerWidth: 1440,
    layerHeight: 952,
    u: 1,
    baseW: 300,
    baseH: 480,
  });

  const offsetRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const targetStepDeltaRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const pointerLastXRef = useRef<number>(0);
  const pointerLastTimeRef = useRef<number>(0);
  const dragDistanceRef = useRef<number>(0);

  const PITCH = 252;
  const TOTAL_CARDS = cards.length;
  const RING_SPAN = TOTAL_CARDS * PITCH;

  useEffect(() => {
    setPinuiModalTheme(theme);
  }, [theme]);

  const stepCarousel = useCallback((direction: -1 | 1) => {
    targetStepDeltaRef.current += direction * PITCH;
    velocityRef.current = 0;
    scheduleTickRef.current?.();
  }, []);

  useEffect(() => {
    if (!selectedCard) {
      setLiveHtmlContent(null);
      setLiveCssContent('');
      setFullPromptContent(null);
      setLiveHtmlLoading(false);
      return undefined;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCard(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    if (selectedCard.library === 'PinUI') {
      setModalMode('interactive');
      setLiveHtmlContent(null);
      setLiveCssContent('');
      setFullPromptContent(null);
      setLiveHtmlLoading(false);
    } else if (selectedCard.hasLiveHtml && selectedCard.motionsitesSlug) {
      setModalMode('interactive');
      setLiveHtmlContent(null);
      setLiveCssContent('');
      setFullPromptContent(null);
      setLiveHtmlLoading(true);
      let cancelled = false;
      void fetchMotionSitesFull().then((items) => {
        if (cancelled) return;
        const entry = items[selectedCard.motionsitesSlug!];
        const parts = splitLiveHtmlCss(entry?.liveHtml, entry?.css);
        setLiveHtmlContent(parts?.html ?? null);
        setLiveCssContent(parts?.css ?? '');
        setFullPromptContent(entry?.promptText ?? null);
        setLiveHtmlLoading(false);
        if (!parts?.html) setModalMode('video');
      });
      return () => {
        cancelled = true;
        window.removeEventListener('keydown', onKeyDown);
      };
    } else {
      setModalMode('video');
      setLiveHtmlContent(null);
      setLiveCssContent('');
      setFullPromptContent(null);
      setLiveHtmlLoading(false);
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedCard]);

  useEffect(() => {
    if (!liveHtmlContent) {
      setThemeOverrideCss('');
      return undefined;
    }
    let cancelled = false;
    void import('../../features/explore/catalog').then((m) => {
      if (!cancelled) {
        setThemeOverrideCss(m.buildMotionThemeOverrideCss(liveHtmlContent, theme));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [liveHtmlContent, theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let rafId = 0;
    let prevTime = performance.now();

    const clockAnim =
      typeof document !== 'undefined' && typeof document.documentElement?.animate === 'function'
        ? document.documentElement.animate([], { duration: 1e9 })
        : null;

    const measureDims = () => {
      const frameEl = frameRef.current;
      const layerEl = trackLayerRef.current;
      if (!frameEl || !layerEl) return;
      const vw = window.innerWidth || 1440;
      const isPhone = vw <= 820;
      const frameW = frameEl.clientWidth || vw;
      const u = isPhone ? Math.min(1.02, frameW / 520) : frameW / 1440;
      const layerHeight = layerEl.clientHeight || (isPhone ? 320 : 952 * u);
      const layerWidth = layerEl.clientWidth || vw;
      dimsRef.current = {
        vw,
        isPhone,
        frameW,
        layerWidth,
        layerHeight,
        u,
        baseW: Math.max(1, Math.round(300 * u)),
        baseH: Math.max(1, Math.round(480 * u)),
      };
    };

    const layoutCards = (nowFallback: number, advanceMotion: boolean) => {
      const clockNow =
        clockAnim && typeof clockAnim.currentTime === 'number'
          ? Number(clockAnim.currentTime)
          : nowFallback;
      const dt = Math.min(0.06, Math.max(0.001, (clockNow - prevTime) / 1000));
      prevTime = clockNow;

      const { isPhone, layerHeight, layerWidth, u, baseW, baseH } = dimsRef.current;
      const baseWStr = `${baseW}px`;
      const baseHStr = `${baseH}px`;

      if (advanceMotion && !isDraggingRef.current) {
        if (Math.abs(targetStepDeltaRef.current) > 0.5) {
          const stepChunk = targetStepDeltaRef.current * Math.min(1, dt * 11);
          offsetRef.current += stepChunk;
          targetStepDeltaRef.current -= stepChunk;
        } else {
          targetStepDeltaRef.current = 0;
          if (Math.abs(velocityRef.current) > 1.5) {
            offsetRef.current += velocityRef.current * dt;
            velocityRef.current *= Math.pow(0.05, dt);
          } else {
            velocityRef.current = 0;
            if (!reduced && !selectedCard) {
              offsetRef.current -= 46 * dt;
            }
          }
        }
      }

      offsetRef.current = ((offsetRef.current % RING_SPAN) + RING_SPAN) % RING_SPAN;

      let closestIdx = 0;
      let closestDist = Infinity;

      for (let i = 0; i < TOTAL_CARDS; i += 1) {
        const cardEl = cardElsRef.current[i];
        if (!cardEl) continue;

        let t = i * PITCH + offsetRef.current;
        t = ((((t + RING_SPAN / 2) % RING_SPAN) + RING_SPAN) % RING_SPAN) - RING_SPAN / 2;

        const absT = Math.abs(t);
        if (absT < closestDist) {
          closestDist = absT;
          closestIdx = i;
        }

        let cache = cardStyleCacheRef.current[i];
        if (!cache) {
          cache = {
            display: '',
            width: '',
            height: '',
            transform: '',
            clipPath: '',
            zIndex: '',
          };
          cardStyleCacheRef.current[i] = cache;
        }

        if (absT > 1050) {
          if (cache.display !== 'none') {
            cache.display = 'none';
            cardEl.style.display = 'none';
          }
          continue;
        }
        if (cache.display !== 'block') {
          cache.display = 'block';
          cardEl.style.display = 'block';
        }

        const pushedX = 720 + t * (1 + 0.088 * Math.pow(t / 706, 2));
        const d = Math.abs(pushedX - 720) / 706;
        const cardW = 226 + 64 * d * d;

        const xL = pushedX - cardW * 0.5;
        const xR = pushedX + cardW * 0.5;
        const qL = Math.abs(xL - 720) / 706;
        const qR = Math.abs(xR - 720) / 706;

        const hL = 356 + 116 * Math.pow(qL, 2.6);
        const hR = 356 + 116 * Math.pow(qR, 2.6);
        const phoneCenterU = (layerHeight / Math.max(0.2, u)) * 0.5;
        const cy = isPhone ? phoneCenterU - 6 * d * d : 495 - 14 * d * d;

        const boxH = Math.max(hL, hR);
        const boxTop = cy - boxH * 0.5;
        const topL = (cy - hL * 0.5 - boxTop) * u;
        const topR = (cy - hR * 0.5 - boxTop) * u;

        const pxLeft = isPhone ? layerWidth * 0.5 + (xL - 720) * u : xL * u;
        const pxTop = boxTop * u;
        const pxW = cardW * u;
        const pxH = boxH * u;
        const pxHL = hL * u;
        const pxHR = hR * u;
        const cornerR = 18 * u;

        const sx = pxW / baseW;
        const sy = pxH / baseH;
        const trStr = `translate3d(${pxLeft.toFixed(1)}px, ${pxTop.toFixed(1)}px, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
        const cpStr = buildRoundedQuadClipPath(
          baseW,
          topL / sy,
          pxHL / sy,
          topR / sy,
          pxHR / sy,
          cornerR / Math.max(0.01, Math.min(sx, sy))
        );
        const zStr = String(100 - Math.round(d * 40));

        if (cache.width !== baseWStr) {
          cache.width = baseWStr;
          cardEl.style.width = baseWStr;
        }
        if (cache.height !== baseHStr) {
          cache.height = baseHStr;
          cardEl.style.height = baseHStr;
        }
        if (cache.transform !== trStr) {
          cache.transform = trStr;
          cardEl.style.transform = trStr;
        }
        if (cache.clipPath !== cpStr) {
          cache.clipPath = cpStr;
          cardEl.style.clipPath = cpStr;
        }
        if (cache.zIndex !== zStr) {
          cache.zIndex = zStr;
          cardEl.style.zIndex = zStr;
        }
      }

      setActiveIndex((prev) => (prev === closestIdx ? prev : closestIdx));
    };

    const shouldContinue = () =>
      stageInView &&
      ((!reduced && !selectedCard) ||
        isDraggingRef.current ||
        Math.abs(targetStepDeltaRef.current) > 0.5 ||
        Math.abs(velocityRef.current) > 1.5);

    const tick = (nowFallback: number) => {
      rafId = 0;
      if (!stageInView) return;
      layoutCards(nowFallback, true);
      if (shouldContinue()) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const scheduleTick = () => {
      if (rafId !== 0 || !stageInView) return;
      prevTime =
        clockAnim && typeof clockAnim.currentTime === 'number'
          ? Number(clockAnim.currentTime)
          : performance.now();
      rafId = requestAnimationFrame(tick);
    };
    scheduleTickRef.current = scheduleTick;

    measureDims();
    layoutCards(performance.now(), false);
    if (shouldContinue()) {
      scheduleTick();
    }

    const onResize = () => {
      measureDims();
      layoutCards(performance.now(), false);
    };
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    if (ro && frameRef.current) ro.observe(frameRef.current);
    if (ro && trackLayerRef.current) ro.observe(trackLayerRef.current);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      scheduleTickRef.current = null;
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
      clockAnim?.cancel();
    };
  }, [RING_SPAN, TOTAL_CARDS, reduced, selectedCard, stageInView]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDraggingRef.current = true;
    setDragging(true);
    targetStepDeltaRef.current = 0;
    velocityRef.current = 0;
    pointerLastXRef.current = e.clientX;
    pointerLastTimeRef.current = performance.now();
    dragDistanceRef.current = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    scheduleTickRef.current?.();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const { u } = dimsRef.current;

    const dxPx = e.clientX - pointerLastXRef.current;
    const dxUnits = dxPx / Math.max(0.25, u);
    const now = performance.now();
    const dt = Math.max(0.004, (now - pointerLastTimeRef.current) / 1000);

    offsetRef.current += dxUnits;
    velocityRef.current = dxUnits / dt;
    dragDistanceRef.current += Math.abs(dxPx);
    pointerLastXRef.current = e.clientX;
    pointerLastTimeRef.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleCardClick = (card: ShowcaseExperienceCard) => {
    if (dragDistanceRef.current > 10) return;
    setSelectedCard(card);
  };

  const activeCard = cards[activeIndex] ?? cards[0];

  const handleLaunchActiveInWorkspace = (card: ShowcaseExperienceCard) => {
    setSelectedCard(null);
    void launchPromptToWorkspace(card.promptText);
  };

  const handleOpenInExperienceView = (card: ShowcaseExperienceCard) => {
    setSelectedCard(null);
    openExperience(card.sourceId);
  };

  return (
    <section
      ref={stageRef}
      id="quy-trinh"
      aria-label="Băng chuyền template giao diện mẫu"
      className="rm-stage"
    >
      <div id="san-pham" className="rm-anchor-product" aria-hidden="true" />

      <div className="rm-viewport">
        <div ref={frameRef} className="rm-frame">
          <h2 className="rm-headline">
            <span className="rm-headline-line1">Dùng Thử Trực Tiếp</span>
            <span className="rm-headline-line2">Trên Trình Duyệt</span>
          </h2>

          <div
            ref={trackLayerRef}
            className="rm-carousel-layer"
            data-dragging={dragging ? 'true' : 'false'}
            role="region"
            aria-label="Băng chuyền cong các mẫu giao diện tương tác"
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                stepCarousel(1);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                stepCarousel(-1);
              }
            }}
          >
            {cards.map((card, idx) => {
              const dist = circularIndexDistance(idx, activeIndex, TOTAL_CARDS);
              const isPinUI = card.library === 'PinUI';
              const shouldPlayVideo =
                stageInView && !isPinUI && !reduced && !selectedCard && dist <= 1 && Boolean(card.videoUrl);
              const isVidReady = Boolean(readyVideos[card.id]);

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    cardElsRef.current[idx] = el;
                  }}
                  className="rm-card"
                  data-lib={card.library}
                  role="button"
                  tabIndex={-1}
                  aria-label={`${card.title} (${card.category})`}
                  onClick={() => handleCardClick(card)}
                >
                  {isPinUI ? (
                    <div className="rm-card-pinui-stage" aria-hidden="true">
                      <div className="rm-card-pinui-preview">
                        <div className="rm-pinui-prev-head">
                          <span className="rm-pinui-prev-badge">PINUI</span>
                          <span className="rm-pinui-prev-dots">
                            <i />
                            <i />
                          </span>
                        </div>
                        <div className="rm-pinui-prev-canvas">
                          <span className="rm-pinui-prev-line is-wide" />
                          <span className="rm-pinui-prev-line is-mid" />
                          <div className="rm-pinui-prev-row">
                            <span className="rm-pinui-prev-pill" />
                            <span className="rm-pinui-prev-chip" />
                          </div>
                        </div>
                        <div className="rm-pinui-prev-foot">
                          <strong>{card.title}</strong>
                          <span>{card.category}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={card.imageUrl || card.fallbackUrl}
                        alt={card.title}
                        className="rm-card-thumb"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== card.fallbackUrl) {
                            target.src = card.fallbackUrl;
                          }
                        }}
                      />

                      {shouldPlayVideo && card.videoUrl && (
                        <video
                          key={card.videoUrl}
                          src={card.videoUrl}
                          poster={card.imageUrl || card.fallbackUrl}
                          className="rm-card-video"
                          data-ready={isVidReady ? 'true' : 'false'}
                          muted
                          loop
                          playsInline
                          autoPlay
                          preload="metadata"
                          onLoadedData={() =>
                            setReadyVideos((prev) =>
                              prev[card.id] ? prev : { ...prev, [card.id]: true }
                            )
                          }
                        />
                      )}
                    </>
                  )}

                  <div className="rm-card-shade" aria-hidden="true" />

                  <div className="rm-card-bottom">
                    <span className="rm-card-play" aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
                        <polygon points="4,2.5 13.5,8 4,13.5" />
                      </svg>
                    </span>
                    <div className="rm-card-meta">
                      <span className="rm-card-cat">{card.category}</span>
                      <span className="rm-card-title">{card.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rm-cta-ring">
            <button
              type="button"
              className="rm-cta-btn"
              onClick={() => activeCard && setSelectedCard(activeCard)}
            >
              Dùng thử ngay
            </button>
          </div>
        </div>
      </div>

      {selectedCard &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="rm-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={`Trải nghiệm gốc ${selectedCard.title}`}
            onClick={() => setSelectedCard(null)}
          >
            <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rm-modal-head">
                <div className="rm-modal-title-group">
                  <span className="rm-modal-badge">{selectedCard.library}</span>
                  <h3 className="rm-modal-title">{selectedCard.title}</h3>
                  <span className="rm-modal-cat">· {selectedCard.category}</span>
                </div>

                <div className="rm-modal-actions">
                  <button
                    type="button"
                    className="rm-modal-btn"
                    onClick={() => {
                      const idx = cards.findIndex((c) => c.id === selectedCard.id);
                      const prev = cards[(idx - 1 + cards.length) % cards.length];
                      setSelectedCard(prev);
                    }}
                  >
                    Mẫu trước
                  </button>
                  <button
                    type="button"
                    className="rm-modal-btn"
                    onClick={() => {
                      const idx = cards.findIndex((c) => c.id === selectedCard.id);
                      const next = cards[(idx + 1) % cards.length];
                      setSelectedCard(next);
                    }}
                  >
                    Mẫu tiếp
                  </button>
                  <button
                    type="button"
                    className="rm-modal-btn"
                    onClick={() => handleOpenInExperienceView(selectedCard)}
                  >
                    Khám phá
                  </button>
                  <button
                    type="button"
                    className="rm-modal-btn rm-modal-btn--primary"
                    onClick={() => handleLaunchActiveInWorkspace(selectedCard)}
                  >
                    Mở Workspace
                  </button>
                  <button
                    type="button"
                    className="rm-modal-btn"
                    aria-label="Đóng"
                    title="Đóng"
                    onClick={() => setSelectedCard(null)}
                  >
                    <IconX size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="rm-modal-body">
                <div className="rm-modal-subbar">
                  <p className="rm-modal-summary">{selectedCard.summaryVi}</p>

                  {selectedCard.library === 'PinUI' ? (
                    <div className="rm-modal-mode-tabs" role="group" aria-label="Sắc độ PinUI">
                      <button
                        type="button"
                        className="rm-modal-tab"
                        aria-pressed={pinuiModalTheme === 'dark'}
                        onClick={() => setPinuiModalTheme('dark')}
                      >
                        Nền tối
                      </button>
                      <button
                        type="button"
                        className="rm-modal-tab"
                        aria-pressed={pinuiModalTheme === 'light'}
                        onClick={() => setPinuiModalTheme('light')}
                      >
                        Nền sáng
                      </button>
                    </div>
                  ) : (
                    <div className="rm-modal-mode-tabs" role="group" aria-label="Chế độ xem Motion AI">
                      {selectedCard.hasLiveHtml && (
                        <button
                          type="button"
                          className="rm-modal-tab"
                          aria-pressed={modalMode === 'interactive'}
                          onClick={() => setModalMode('interactive')}
                        >
                          HTML tương tác
                        </button>
                      )}
                      <button
                        type="button"
                        className="rm-modal-tab"
                        aria-pressed={modalMode === 'video'}
                        onClick={() => setModalMode('video')}
                      >
                        {selectedCard.videoUrl ? 'Video & Prompt' : 'Prompt gốc'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="rm-modal-stage">
                  {selectedCard.library === 'PinUI' ? (
                    <div className="rm-modal-pinui-wrap">
                      <React.Suspense fallback={<div className="rm-modal-status">Đang nạp giao diện tương tác...</div>}>
                        <PinUIPlayground itemId={selectedCard.sourceId} theme={pinuiModalTheme} />
                      </React.Suspense>
                    </div>
                  ) : modalMode === 'interactive' && liveHtmlContent ? (
                    <React.Suspense fallback={<div className="rm-modal-status">Đang nạp mã HTML tương tác...</div>}>
                      <SandboxPreview
                        title={selectedCard.title}
                        html={liveHtmlContent}
                        css={[liveCssContent, themeOverrideCss].filter(Boolean).join('\n\n')}
                        theme={theme}
                        viewport={1440}
                        nonce={0}
                        className="rm-modal-iframe"
                      />
                    </React.Suspense>
                  ) : modalMode === 'interactive' && liveHtmlLoading ? (
                    <div className="rm-modal-status">Đang nạp mã HTML tương tác...</div>
                  ) : (
                    <div className="rm-modal-video-grid">
                      <div className="rm-modal-video-wrap">
                        {selectedCard.videoUrl ? (
                          <video
                            key={selectedCard.videoUrl}
                            src={selectedCard.videoUrl}
                            poster={selectedCard.imageUrl || selectedCard.fallbackUrl}
                            controls
                            autoPlay={!reduced}
                            loop
                            muted
                            playsInline
                            className="rm-modal-video"
                          />
                        ) : (
                          <img
                            src={selectedCard.imageUrl || selectedCard.fallbackUrl}
                            alt={selectedCard.title}
                            className="rm-modal-video"
                          />
                        )}
                      </div>
                      <div className="rm-modal-spec">
                        <span className="rm-modal-spec-label">
                          Đặc tả kỹ thuật · {selectedCard.library}
                        </span>
                        <pre className="rm-modal-spec-pre">{fullPromptContent || selectedCard.promptText}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};

export default TidewellStage;
