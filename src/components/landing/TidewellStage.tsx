import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import type { DimensionView } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  buildRandomInterleaved25,
  buildRoundedQuadClipPath,
  buildShowcase50,
  type ShowcaseExperienceCard,
  type ShowcaseFilterMode,
  type ShowcaseLibraryKind,
} from '../../data/reelmarkCarouselData';
import { PinUIPlayground } from '../pinui';
import { usePrefersReducedMotion } from './useLandingMotion';
import './tidewell.css';

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
  promptText?: string;
}

let motionFullCache: Record<string, MotionFullEntry> | null = null;
let motionFullPromise: Promise<Record<string, MotionFullEntry>> | null = null;

async function fetchMotionSitesFull(): Promise<Record<string, MotionFullEntry>> {
  if (motionFullCache) return motionFullCache;
  if (!motionFullPromise) {
    motionFullPromise = fetch('/data/motionsites-full.json')
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

class PinUIMiniBoundary extends React.Component<
  { children: React.ReactNode; fallbackTitle: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallbackTitle: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rm-card-pinui-fallback" aria-hidden="true">
          <strong>{this.props.fallbackTitle}</strong>
        </div>
      );
    }
    return this.props.children;
  }
}

export const TidewellStage: React.FC<TidewellStageProps> = () => {
  const { launchPromptToWorkspace, openExperience, theme } = useAppStore();
  const reduced = usePrefersReducedMotion();

  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1000000) + 1);
  const cards = useMemo(() => buildShowcase50(seed, 'all'), [seed]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ShowcaseExperienceCard | null>(null);
  const [modalMode, setModalMode] = useState<'interactive' | 'video'>('interactive');
  const [pinuiModalTheme, setPinuiModalTheme] = useState<'dark' | 'light'>(theme);
  const [liveHtmlContent, setLiveHtmlContent] = useState<string | null>(null);
  const [liveHtmlLoading, setLiveHtmlLoading] = useState(false);
  const [readyVideos, setReadyVideos] = useState<Record<string, boolean>>({});

  const frameRef = useRef<HTMLDivElement>(null);
  const trackLayerRef = useRef<HTMLDivElement>(null);
  const cardElsRef = useRef<Array<HTMLDivElement | null>>([]);
  const lastPinuiScaleRef = useRef<string>('');

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
  }, []);

  const handleReshuffle = useCallback(() => {
    isDraggingRef.current = false;
    setDragging(false);
    targetStepDeltaRef.current = 0;
    velocityRef.current = 0;
    offsetRef.current = 0;
    setActiveIndex(0);
    setSeed((prev) => prev + Math.floor(Math.random() * 9973) + 17);
  }, []);

  useEffect(() => {
    if (!selectedCard) {
      setLiveHtmlContent(null);
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
      setLiveHtmlLoading(false);
    } else if (selectedCard.hasLiveHtml && selectedCard.motionsitesSlug) {
      setModalMode('video');
      setLiveHtmlLoading(true);
      let cancelled = false;
      void fetchMotionSitesFull().then((items) => {
        if (cancelled) return;
        const entry = items[selectedCard.motionsitesSlug!];
        setLiveHtmlContent(entry?.liveHtml ?? null);
        setLiveHtmlLoading(false);
      });
      return () => {
        cancelled = true;
        window.removeEventListener('keydown', onKeyDown);
      };
    } else {
      setModalMode('video');
      setLiveHtmlContent(null);
      setLiveHtmlLoading(false);
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedCard]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let rafId = 0;
    let prevTime = performance.now();

    const clockAnim =
      typeof document !== 'undefined' && typeof document.documentElement?.animate === 'function'
        ? document.documentElement.animate([], { duration: 1e9 })
        : null;

    const tick = (nowFallback: number) => {
      rafId = requestAnimationFrame(tick);
      const clockNow =
        clockAnim && typeof clockAnim.currentTime === 'number'
          ? Number(clockAnim.currentTime)
          : nowFallback;
      const dt = Math.min(0.06, Math.max(0.001, (clockNow - prevTime) / 1000));
      prevTime = clockNow;

      const frameEl = frameRef.current;
      const layerEl = trackLayerRef.current;
      if (!frameEl || !layerEl) return;

      const vw = window.innerWidth || 1440;
      const isPhone = vw <= 820;
      const frameW = frameEl.clientWidth || vw;
      const u = isPhone ? Math.min(1.02, frameW / 520) : frameW / 1440;

      const pinuiScale = (u * 0.54).toFixed(3);
      if (lastPinuiScaleRef.current !== pinuiScale) {
        lastPinuiScaleRef.current = pinuiScale;
        frameEl.style.setProperty('--rm-pinui-scale', pinuiScale);
      }

      if (!isDraggingRef.current) {
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

        if (absT > 1050) {
          cardEl.style.display = 'none';
          continue;
        }
        cardEl.style.display = 'block';

        const pushedX = 720 + t * (1 + 0.088 * Math.pow(t / 706, 2));
        const d = Math.abs(pushedX - 720) / 706;
        const cardW = 226 + 64 * d * d;

        const xL = pushedX - cardW * 0.5;
        const xR = pushedX + cardW * 0.5;
        const qL = Math.abs(xL - 720) / 706;
        const qR = Math.abs(xR - 720) / 706;

        const hL = 356 + 116 * Math.pow(qL, 2.6);
        const hR = 356 + 116 * Math.pow(qR, 2.6);
        const layerHeight = layerEl.clientHeight || (isPhone ? 320 : 952 * u);
        const phoneCenterU = (layerHeight / Math.max(0.2, u)) * 0.5;
        const cy = isPhone ? phoneCenterU - 6 * d * d : 550 - 14 * d * d;

        const boxH = Math.max(hL, hR);
        const boxTop = cy - boxH * 0.5;
        const topL = (cy - hL * 0.5 - boxTop) * u;
        const topR = (cy - hR * 0.5 - boxTop) * u;

        const layerWidth = layerEl.clientWidth || vw;
        const pxLeft = isPhone ? layerWidth * 0.5 + (xL - 720) * u : xL * u;
        const pxTop = boxTop * u;
        const pxW = cardW * u;
        const pxH = boxH * u;
        const pxHL = hL * u;
        const pxHR = hR * u;
        const cornerR = 18 * u;

        cardEl.style.width = `${pxW.toFixed(1)}px`;
        cardEl.style.height = `${pxH.toFixed(1)}px`;
        cardEl.style.transform = `translate3d(${pxLeft.toFixed(1)}px, ${pxTop.toFixed(1)}px, 0)`;
        cardEl.style.clipPath = buildRoundedQuadClipPath(pxW, topL, pxHL, topR, pxHR, cornerR);
        cardEl.style.zIndex = String(100 - Math.round(d * 40));
      }

      setActiveIndex((prev) => (prev === closestIdx ? prev : closestIdx));
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clockAnim?.cancel();
    };
  }, [RING_SPAN, TOTAL_CARDS, reduced, selectedCard]);

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
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const vw = window.innerWidth || 1440;
    const isPhone = vw <= 820;
    const frameW = frameRef.current?.clientWidth || vw;
    const u = isPhone ? Math.min(1.02, frameW / 520) : frameW / 1440;

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
      id="quy-trinh"
      aria-label="Băng chuyền template giao diện mẫu"
      className="rm-stage"
    >
      <div id="san-pham" className="rm-anchor-product" aria-hidden="true" />

      <div className="rm-viewport">
        <div ref={frameRef} className="rm-frame">
          <h2 className="rm-headline">
            <span className="rm-headline-line1">Chạm Mẫu Sống,</span>
            <span className="rm-headline-line2">Học Từ Bản Gốc</span>
          </h2>

          <p className="rm-subline">
            25 mẫu PinUI tương tác trực tiếp và 25 bố cục Motion AI trích xuất nguyên bản — kéo dải thẻ hoặc nhấn phím &lt;- / -&gt; để kiểm tra trước khi đưa vào Workspace.
          </p>

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
              const shouldMountPinUI = isPinUI && !selectedCard && dist <= 3;
              const shouldPlayVideo =
                !isPinUI && !reduced && !selectedCard && dist <= 4 && Boolean(card.videoUrl);
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
                      {shouldMountPinUI ? (
                        <div className="rm-card-pinui-scale">
                          <PinUIMiniBoundary fallbackTitle={card.title}>
                            <PinUIPlayground itemId={card.sourceId} theme={theme} compact />
                          </PinUIMiniBoundary>
                        </div>
                      ) : (
                        <div className="rm-card-pinui-fallback">
                          <strong>{card.title}</strong>
                        </div>
                      )}
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
              Mở mẫu đang chọn
            </button>
          </div>

          <div className="rm-arrow-controls" role="group" aria-label="Điều khiển băng chuyền trải nghiệm">
            <button
              type="button"
              className="rm-step-btn"
              onClick={() => stepCarousel(1)}
              aria-label="Trải nghiệm trước"
            >
              <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
              <span>Trước</span>
            </button>

            <button
              type="button"
              className="rm-step-btn"
              onClick={() => stepCarousel(-1)}
              aria-label="Trải nghiệm tiếp theo"
            >
              <span>Tiếp</span>
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="rm-step-btn"
              onClick={handleReshuffle}
              aria-label="Trộn ngẫu nhiên các trải nghiệm"
            >
              <Shuffle size={14} strokeWidth={2} aria-hidden="true" />
              <span>Trộn ngẫu nhiên</span>
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
                    Mở trong Khám phá
                  </button>
                  <button
                    type="button"
                    className="rm-modal-btn rm-modal-btn--primary"
                    onClick={() => handleLaunchActiveInWorkspace(selectedCard)}
                  >
                    Nạp vào Workspace
                  </button>
                  <button
                    type="button"
                    className="rm-modal-btn"
                    onClick={() => setSelectedCard(null)}
                  >
                    Đóng
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
                      <button
                        type="button"
                        className="rm-modal-tab"
                        aria-pressed={modalMode === 'video'}
                        onClick={() => setModalMode('video')}
                      >
                        Video gốc
                      </button>
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
                    </div>
                  )}
                </div>

                <div className="rm-modal-stage">
                  {selectedCard.library === 'PinUI' ? (
                    <div className="rm-modal-pinui-wrap">
                      <PinUIPlayground itemId={selectedCard.sourceId} theme={pinuiModalTheme} />
                    </div>
                  ) : selectedCard.library === 'Motion AI' && modalMode === 'interactive' ? (
                    liveHtmlLoading ? (
                      <div className="rm-modal-status">Đang nạp mã HTML tương tác...</div>
                    ) : liveHtmlContent ? (
                      <iframe
                        title={`Trình diễn gốc ${selectedCard.title}`}
                        srcDoc={liveHtmlContent}
                        sandbox="allow-scripts"
                        className="rm-modal-iframe"
                      />
                    ) : (
                      <div className="rm-modal-status">Đang hiển thị video minh họa mẫu giao diện.</div>
                    )
                  ) : (
                    <div className="rm-modal-video-grid">
                      <div className="rm-modal-video-wrap">
                        <video
                          key={selectedCard.videoUrl}
                          src={selectedCard.videoUrl}
                          poster={selectedCard.imageUrl || selectedCard.fallbackUrl}
                          controls
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="rm-modal-video"
                        />
                      </div>
                      <div className="rm-modal-spec">
                        <span className="rm-modal-spec-label">
                          Đặc tả kỹ thuật · {selectedCard.library}
                        </span>
                        <pre className="rm-modal-spec-pre">{selectedCard.promptText}</pre>
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
