import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DimensionView } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  REELMARK_POSTER_URL,
  REELMARK_VIDEO_URL,
  buildRandomInterleaved25,
  buildRoundedQuadClipPath,
  type ReelmarkExperienceCard,
  type ReelmarkLibraryKind,
} from '../../data/reelmarkCarouselData';
import { PinUIPlayground } from '../pinui';
import { usePrefersReducedMotion } from './useLandingMotion';
import './tidewell.css';

export interface TidewellStageProps {
  onNavigate: (view: DimensionView) => void;
}

export {
  REELMARK_POSTER_URL,
  REELMARK_VIDEO_URL,
  buildRandomInterleaved25,
  buildRoundedQuadClipPath,
  type ReelmarkExperienceCard,
  type ReelmarkLibraryKind,
};

export const TidewellStage: React.FC<TidewellStageProps> = ({ onNavigate }) => {
  const { launchPromptToWorkspace, openExperience } = useAppStore();
  const reduced = usePrefersReducedMotion();

  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1000000) + 1);
  const cards = useMemo(() => buildRandomInterleaved25(seed), [seed]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ReelmarkExperienceCard | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const trackLayerRef = useRef<HTMLDivElement>(null);
  const cardElsRef = useRef<Array<HTMLDivElement | null>>([]);
  const tileHostElsRef = useRef<Array<HTMLDivElement | null>>([]);
  const videoElsRef = useRef<Array<HTMLVideoElement | null>>([]);

  const offsetRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const targetStepDeltaRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const pointerStartXRef = useRef<number>(0);
  const pointerLastXRef = useRef<number>(0);
  const pointerLastTimeRef = useRef<number>(0);
  const dragDistanceRef = useRef<number>(0);

  const PITCH = 196;
  const TOTAL_CARDS = cards.length;
  const RING_SPAN = TOTAL_CARDS * PITCH;

  const stepCarousel = useCallback((direction: -1 | 1) => {
    targetStepDeltaRef.current += direction * PITCH;
    velocityRef.current = 0;
  }, []);

  const handleReshuffle = useCallback(() => {
    isDraggingRef.current = false;
    setDragging(false);
    targetStepDeltaRef.current = 0;
    velocityRef.current = 0;
    setSeed((prev) => prev + Math.floor(Math.random() * 9973) + 17);
  }, []);

  useEffect(() => {
    if (reduced || typeof window === 'undefined') return undefined;
    const frame = frameRef.current;
    if (!frame || typeof frame.animate !== 'function') return undefined;

    const anims: Animation[] = [];
    const runAnim = (
      selector: string,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions
    ) => {
      const els = frame.querySelectorAll<HTMLElement | SVGElement>(selector);
      els.forEach((el) => {
        if (typeof el.animate === 'function') {
          anims.push(el.animate(keyframes, { fill: 'both', easing: 'cubic-bezier(0.22, 1, 0.36, 1)', ...options }));
        }
      });
    };

    runAnim('.rm-topbar', [{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420 });
    runAnim('.rm-badge', [{ opacity: 0, transform: 'translateX(-50%) scale(0.86)' }, { opacity: 1, transform: 'translateX(-50%) scale(1)' }], { duration: 420, delay: 60 });
    runAnim('.rm-headline-line1', [{ opacity: 0, transform: 'translateY(18px)', filter: 'blur(8px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }], { duration: 480, delay: 110 });
    runAnim('.rm-headline-line2', [{ opacity: 0, transform: 'translateY(18px)', filter: 'blur(8px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }], { duration: 480, delay: 170 });
    runAnim('.rm-subline', [{ opacity: 0, transform: 'translateX(-50%) translateY(14px)' }, { opacity: 1, transform: 'translateX(-50%) translateY(0)' }], { duration: 460, delay: 220 });
    runAnim('.rm-carousel-layer', [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 520, delay: 260 });
    runAnim('.rm-cta-ring', [{ opacity: 0, transform: 'scale(0.86)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 440, delay: 320 });
    runAnim('.rm-note-beseen, .rm-note-zerocost', [{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: 360 });

    const clearStylesTimeout = window.setTimeout(() => {
      anims.forEach((a) => a.cancel());
    }, 950);

    return () => {
      window.clearTimeout(clearStylesTimeout);
      anims.forEach((a) => a.cancel());
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return undefined;
    const master = videoElsRef.current[0];
    if (!master) return undefined;

    const syncAll = () => {
      const t = master.currentTime;
      for (let i = 1; i < videoElsRef.current.length; i += 1) {
        const v = videoElsRef.current[i];
        if (v && Math.abs(v.currentTime - t) > 0.18) {
          try {
            v.currentTime = t;
          } catch {
            void 0;
          }
        }
      }
    };

    const interval = window.setInterval(syncAll, 1500);
    return () => window.clearInterval(interval);
  }, [reduced, cards]);

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
      const vh = window.innerHeight || 1080;
      const isPhone = vw <= 820;
      const frameW = frameEl.clientWidth || vw;
      const u = isPhone ? frameW / 640 : frameW > 0 ? frameW / 1440 : Math.min(vw / 1440, vh / 1080);

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
              offsetRef.current -= 50 * dt;
            }
          }
        }
      }

      offsetRef.current = ((offsetRef.current % RING_SPAN) + RING_SPAN) % RING_SPAN;

      let closestIdx = 0;
      let closestDist = Infinity;

      for (let i = 0; i < TOTAL_CARDS; i += 1) {
        const cardEl = cardElsRef.current[i];
        const tileHostEl = tileHostElsRef.current[i];
        if (!cardEl) continue;

        let t = i * PITCH + offsetRef.current;
        t = ((((t + RING_SPAN / 2) % RING_SPAN) + RING_SPAN) % RING_SPAN) - RING_SPAN / 2;

        const absT = Math.abs(t);
        if (absT < closestDist) {
          closestDist = absT;
          closestIdx = i;
        }

        if (absT > 940) {
          cardEl.style.display = 'none';
          continue;
        }
        cardEl.style.display = 'block';

        const pushedX = 720 + t * (1 + 0.083 * Math.pow(t / 706, 2));
        const d = Math.abs(pushedX - 720) / 706;
        const cardW = 170 + 48 * d * d;

        const xL = pushedX - cardW * 0.5;
        const xR = pushedX + cardW * 0.5;
        const qL = Math.abs(xL - 720) / 706;
        const qR = Math.abs(xR - 720) / 706;

        const hL = 280 + 92 * Math.pow(qL, 2.6);
        const hR = 280 + 92 * Math.pow(qR, 2.6);
        const layerHeight = layerEl.clientHeight || (isPhone ? 250 : 1080 * u);
        const phoneCenterU = layerHeight / Math.max(0.2, u) * 0.5 + 8;
        const cy = isPhone ? phoneCenterU - 10 * d * d : 687 - 12 * d * d;

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
        const cornerR = 15 * u;

        cardEl.style.width = `${pxW.toFixed(1)}px`;
        cardEl.style.height = `${pxH.toFixed(1)}px`;
        cardEl.style.transform = `translate3d(${pxLeft.toFixed(1)}px, ${pxTop.toFixed(1)}px, 0)`;
        cardEl.style.clipPath = buildRoundedQuadClipPath(pxW, topL, pxHL, topR, pxHR, cornerR);
        cardEl.style.zIndex = String(100 - Math.round(d * 40));

        if (tileHostEl) {
          const tileIdx = i % 10;
          const col = tileIdx % 5;
          const row = Math.floor(tileIdx / 5);
          const tileH = Math.max(pxH, pxW / 0.7111);
          const tileW = tileH * 0.7111;
          tileHostEl.style.width = `${(tileW * 5).toFixed(1)}px`;
          tileHostEl.style.height = `${(tileH * 2).toFixed(1)}px`;
          tileHostEl.style.transform = `translate3d(${(-col * tileW).toFixed(1)}px, ${(-row * tileH).toFixed(1)}px, 0)`;
        }
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
    pointerStartXRef.current = e.clientX;
    pointerLastXRef.current = e.clientX;
    pointerLastTimeRef.current = performance.now();
    dragDistanceRef.current = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const vw = window.innerWidth || 1440;
    const vh = window.innerHeight || 1080;
    const isPhone = vw <= 820;
    const u = isPhone ? vw / 640 : Math.min(vw / 1440, vh / 1080);

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

  const handleCardClick = (card: ReelmarkExperienceCard) => {
    if (dragDistanceRef.current > 10) return;
    setSelectedCard(card);
  };

  const activeCard = cards[activeIndex] ?? cards[0];

  const handleLaunchActiveInWorkspace = (card: ReelmarkExperienceCard) => {
    setSelectedCard(null);
    void launchPromptToWorkspace(card.promptText);
  };

  const handleOpenInExperienceView = (card: ReelmarkExperienceCard) => {
    setSelectedCard(null);
    openExperience(card.sourceId);
  };

  return (
    <section
      id="quy-trinh"
      aria-label="Reelmark — Trải nghiệm dải thẻ cong 25 mẫu ngẫu nhiên xen kẽ PinUI và Motion AI"
      className="rm-stage"
    >
      <div id="san-pham" className="rm-anchor-product" aria-hidden="true" />

      <div className="rm-viewport">
        <div ref={frameRef} className="rm-frame">
          <header className="rm-topbar">
            <button
              type="button"
              className="rm-logo"
              onClick={() => onNavigate('explore')}
            >
              <svg
                viewBox="0 0 28 28"
                fill="none"
                className="rm-logo-leaf"
                aria-hidden="true"
              >
                <path
                  d="M23.5 4.5C15.2 4.5 7.5 9.6 5.4 18.2C4.9 20.3 5.2 22.4 5.2 22.4C5.2 22.4 7.3 22.7 9.4 22.2C18 20.1 23.5 12.8 23.5 4.5Z"
                  fill="currentColor"
                />
                <path
                  d="M5.5 22.5C10.5 16.5 15.8 12.2 22.2 8.5"
                  stroke="#F5F8EF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>Reelmark</span>
            </button>

            <nav className="rm-nav" aria-label="Điều hướng bộ sưu tập">
              <button type="button" className="rm-nav-item" onClick={() => onNavigate('experience')}>
                Brands
              </button>
              <button type="button" className="rm-nav-item" onClick={() => onNavigate('explore')}>
                Creators
              </button>
              <button type="button" className="rm-nav-item" onClick={() => onNavigate('workspace')}>
                Pricing
              </button>
              <button type="button" className="rm-nav-item" onClick={() => onNavigate('community')}>
                Use Cases
              </button>
              <button type="button" className="rm-nav-item" onClick={handleReshuffle}>
                Contact
              </button>
            </nav>

            <button
              type="button"
              className="rm-btn-login"
              onClick={handleReshuffle}
              title="Trộn ngẫu nhiên 25 trải nghiệm PinUI & Motion AI"
            >
              Log in
            </button>
            <button
              type="button"
              className="rm-btn-signup"
              onClick={() => onNavigate('explore')}
            >
              Sign up
            </button>
          </header>

          <div className="rm-badge">
            Trusted by 120,000+ indie makers · 25 mẫu PinUI &amp; Motion AI
          </div>

          <h2 className="rm-headline">
            <span className="rm-headline-line1">Captivate Crowds</span>
            <span className="rm-headline-line2">with Snackable Reels</span>
          </h2>

          <p className="rm-subline">
            Grow your brand with short, snappy product clips by our handpicked video makers.
            Kéo ngang dải thẻ cong hoặc nhấn &lt;- hay -&gt; để trải nghiệm 25 mẫu ngẫu nhiên xen kẽ giữa PinUI và Motion AI.
          </p>

          <svg
            viewBox="0 0 44 48"
            fill="none"
            className="rm-doodle-slashes"
            aria-hidden="true"
          >
            <path
              d="M16 6 C12 18 8 30 4 42 M34 4 C29 17 24 30 19 43"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              className="rm-draw-path"
            />
          </svg>

          <div className="rm-note-beseen" aria-hidden="true">
            Be seen
            <br />
            with clips
          </div>

          <svg
            viewBox="0 0 96 124"
            fill="none"
            className="rm-arrow-beseen"
            aria-hidden="true"
          >
            <path
              d="M42 6 C68 28 74 72 40 112"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              className="rm-draw-path"
            />
            <path
              d="M35 98 L39 114 L55 107"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rm-draw-path"
            />
          </svg>

          <div
            ref={trackLayerRef}
            className="rm-carousel-layer"
            data-dragging={dragging ? 'true' : 'false'}
            role="region"
            aria-label="Băng chuyền cong 25 trải nghiệm ngẫu nhiên xen kẽ từ PinUI và Motion AI"
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
            {cards.map((card, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  cardElsRef.current[idx] = el;
                }}
                className="rm-card"
                role="button"
                tabIndex={-1}
                aria-label={`${card.library}: ${card.title} (${card.category})`}
                onClick={() => handleCardClick(card)}
              >
                <div
                  ref={(el) => {
                    tileHostElsRef.current[idx] = el;
                  }}
                  className="rm-card-tile-host"
                  aria-hidden="true"
                >
                  <img
                    src={REELMARK_POSTER_URL}
                    alt=""
                    className="rm-card-poster"
                    loading="eager"
                    decoding="async"
                  />
                  {!reduced && (
                    <video
                      ref={(el) => {
                        videoElsRef.current[idx] = el;
                      }}
                      src={REELMARK_VIDEO_URL}
                      className="rm-card-video"
                      data-ready={videoReady ? 'true' : 'false'}
                      muted
                      loop
                      playsInline
                      autoPlay
                      onLoadedData={() => setVideoReady(true)}
                    />
                  )}
                </div>

                <img
                  src={card.imageUrl}
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

                <div className="rm-card-shade" aria-hidden="true" />

                <div className="rm-card-top">
                  <span className="rm-card-lib" data-lib={card.library}>
                    {card.library}
                  </span>
                  <span className="rm-card-num">
                    {String(idx + 1).padStart(2, '0')}/25
                  </span>
                </div>

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
            ))}
          </div>

          <div className="rm-note-zerocost" aria-hidden="true">
            Zero cost
          </div>
          <svg
            viewBox="0 0 48 36"
            fill="none"
            className="rm-arrow-zerocost"
            aria-hidden="true"
          >
            <path
              d="M4 28 C18 30 30 22 42 10"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="rm-draw-path"
            />
            <path
              d="M33 8 L43 9 L41 19"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rm-draw-path"
            />
          </svg>

          <div className="rm-cta-ring">
            <button
              type="button"
              className="rm-cta-btn"
              onClick={() => setSelectedCard(activeCard)}
            >
              Make a Reel
            </button>
          </div>

          <div className="rm-arrow-controls" role="group" aria-label="Điều khiển lướt 25 trải nghiệm">
            <button
              type="button"
              className="rm-step-btn"
              onClick={() => stepCarousel(1)}
              aria-label="Trải nghiệm trước (<-)"
            >
              <span>&lt;-</span>
              <span>Trước</span>
            </button>

            <span className="rm-active-pill" aria-live="polite">
              {String(activeIndex + 1).padStart(2, '0')}/25 · {activeCard?.library} · {activeCard?.title}
            </span>

            <button
              type="button"
              className="rm-step-btn"
              onClick={() => stepCarousel(-1)}
              aria-label="Trải nghiệm tiếp theo (->)"
            >
              <span>Tiếp</span>
              <span>-&gt;</span>
            </button>

            <button
              type="button"
              className="rm-step-btn"
              onClick={handleReshuffle}
              aria-label="Trộn ngẫu nhiên 25 trải nghiệm PinUI và Motion AI"
            >
              Trộn ngẫu nhiên
            </button>
          </div>
        </div>
      </div>

      {selectedCard && (
        <div
          className="rm-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Trải nghiệm ${selectedCard.title}`}
          onClick={() => setSelectedCard(null)}
        >
          <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rm-modal-head">
              <div className="rm-modal-title-group">
                <span className="rm-modal-badge">{selectedCard.library}</span>
                <h3 className="rm-modal-title">{selectedCard.title}</h3>
                <span style={{ fontSize: 13, color: '#5e5e61' }}>· {selectedCard.category}</span>
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
                  &lt;- Mẫu trước
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
                  Mẫu tiếp -&gt;
                </button>
                <button
                  type="button"
                  className="rm-modal-btn"
                  onClick={() => handleOpenInExperienceView(selectedCard)}
                >
                  Mở Bàn soi
                </button>
                <button
                  type="button"
                  className="rm-modal-btn rm-modal-btn--primary"
                  onClick={() => handleLaunchActiveInWorkspace(selectedCard)}
                >
                  Dựng trong Workspace
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
              <p style={{ fontSize: 14.5, color: '#3b423c', lineHeight: 1.55 }}>
                {selectedCard.summaryVi}
              </p>

              <div className="rm-modal-stage">
                {selectedCard.library === 'PinUI' ? (
                  <div style={{ width: '100%', padding: 16 }}>
                    <PinUIPlayground itemId={selectedCard.sourceId} theme="dark" />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      padding: 24,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 20,
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={selectedCard.imageUrl}
                      alt={selectedCard.title}
                      style={{
                        width: '100%',
                        maxHeight: 320,
                        objectFit: 'cover',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.14)',
                      }}
                      onError={(e) => {
                        if (e.currentTarget.src !== selectedCard.fallbackUrl) {
                          e.currentTarget.src = selectedCard.fallbackUrl;
                        }
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#dae7c7',
                        }}
                      >
                        Đặc tả chuyển động · Motion AI
                      </span>
                      <pre
                        style={{
                          margin: 0,
                          padding: 14,
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.06)',
                          color: '#e5ece0',
                          fontSize: 12.5,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          maxHeight: 220,
                          overflowY: 'auto',
                        }}
                      >
                        {selectedCard.promptText}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TidewellStage;
