import React, { useEffect, useRef, useState } from 'react';
import type { DimensionView } from '../../types/index';
import { STAGE_CHIP_PREVIEW, TIDEWELL_CARDS, type KineticStageCard } from './landingContent';
import { usePrefersReducedMotion } from './useLandingMotion';
import './tidewell.css';

interface TidewellStageProps {
  onNavigate: (view: DimensionView) => void;
}

const SCATTER_SLOTS: Array<[number, number, number]> = [
  [-0.42, -0.34, -9],
  [0.42, -0.34, 8],
  [-0.44, -0.04, -5],
  [0.44, -0.04, 6],
  [-0.41, 0.3, 7],
  [0.41, 0.3, -8],
  [-0.26, 0.38, -6],
  [0.26, 0.38, 6],
  [-0.25, -0.37, 5],
  [0.25, -0.37, -5],
  [0.0, 0.4, 3],
  [0.0, -0.39, -3],
];

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const StageCardView: React.FC<{
  card: KineticStageCard;
  index: number;
  cardRef?: (el: HTMLDivElement | null) => void;
}> = ({ card, index, cardRef }) => {
  const [src, setSrc] = useState(card.imageUrl);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div ref={cardRef} className="tw-card">
      <div className="tw-card-media">
        <div
          className="tw-card-fallback"
          data-loaded={loaded ? 'true' : undefined}
          style={{
            background: `radial-gradient(circle at 20% 20%, ${card.tone}38, transparent 62%), linear-gradient(155deg, #24221f 0%, #161513 100%)`,
          }}
          aria-hidden="true"
        >
          <span className="tw-card-fallback-tag">{card.category}</span>
        </div>
        <img
          src={src}
          alt={`${card.title}, ${card.category}`}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          data-failed={failed ? 'true' : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (src !== card.fallbackUrl) {
              setSrc(card.fallbackUrl);
            } else {
              setFailed(true);
            }
          }}
          className="tw-card-img"
        />
      </div>
      <div className="tw-card-foot">
        <span className="tw-card-title">{card.title}</span>
        <span className="tw-card-idx">{String(index + 1).padStart(2, '0')}</span>
      </div>
    </div>
  );
};

export const TidewellStage: React.FC<TidewellStageProps> = ({ onNavigate }) => {
  const reduced = usePrefersReducedMotion();
  const stageRef = useRef<HTMLElement>(null);
  const centerCopyRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const windowRef = useRef<HTMLDivElement>(null);
  const floatWrapRef = useRef<HTMLDivElement>(null);
  const floatFrameRef = useRef<HTMLDivElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);
  const [chipSrc, setChipSrc] = useState(STAGE_CHIP_PREVIEW.imageUrl);
  const [chipFailed, setChipFailed] = useState(false);

  useEffect(() => {
    if (reduced || typeof window === 'undefined') return;

    const n = TIDEWELL_CARDS.length;
    const curX = new Float64Array(n);
    const curY = new Float64Array(n);
    const curRot = new Float64Array(n);
    const curScale = new Float64Array(n).fill(1);
    const curOp = new Float64Array(n).fill(1);

    let smoothP = 0;
    let pointerYaw = 0;
    let targetYaw = 0;
    let windowUnlocked = false;
    let rafId = 0;

    const onPointerMove = (e: PointerEvent) => {
      const vw = window.innerWidth || 1440;
      const nx = (e.clientX / vw) * 2 - 1;
      targetYaw = clamp(nx * 10, -10, 10);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const tick = (now: number) => {
      const stage = stageRef.current;
      if (!stage) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const rect = stage.getBoundingClientRect();
      const vw = window.innerWidth || 1440;
      const vh = window.innerHeight || 900;
      const scrollable = Math.max(1, rect.height - vh);
      const rawP = clamp(-rect.top / scrollable, 0, 1);

      smoothP += (rawP - smoothP) * 0.14;
      const p = Math.abs(rawP - smoothP) < 0.0005 ? rawP : smoothP;

      const isMobile = vw < 768;
      const cw =
        vw >= 960
          ? Math.min(184, vw * 0.128)
          : vw >= 768
            ? Math.min(152, vw * 0.19)
            : Math.min(104, vw * 0.27);
      const ch = Math.round(cw * 1.24);

      const minRingR = (1.05 * cw) / (2 * Math.sin(Math.PI / 12));
      const maxFitR = isMobile ? Math.min((vw - cw * 0.88) * 0.48, vh * 0.3) : Math.min(vw * 0.4, vh * 0.42);
      const R = isMobile ? maxFitR : Math.min(Math.max(minRingR, Math.min(vw, vh) * 0.36), maxFitR);
      const rx = isMobile ? maxFitR : Math.min(vw * 0.45, 620);
      const ry = isMobile ? maxFitR : Math.min(vh * 0.44, 395);
      const effectiveCw = isMobile ? cw * 0.68 : cw;
      const rawStep = 2 * Math.asin(clamp((1.05 * effectiveCw) / (2 * Math.max(1, R)), 0, 0.95));
      const step = Math.min((Math.PI * 2) / 12, rawStep);

      const scatterT = smoothstep(0.02, 0.22, p);
      const gatherT = smoothstep(0.24, 0.36, p);
      const orbitT = smoothstep(0.36, 0.48, p);
      const wheelProg = clamp((p - 0.38) / 0.28, 0, 1);
      const wheelRot = -3 * wheelProg;

      let maxDeltaPx = 0;
      let maxDeltaDeg = 0;

      for (let i = 0; i < n; i += 1) {
        const cardEl = cardRefs.current[i];
        if (!cardEl) continue;

        const fanAngle = (i - (n - 1) / 2) * (isMobile ? 3.2 : 4.4);
        const fanX = (i - (n - 1) / 2) * (isMobile ? 11 : 18);
        const fanY = vh * 0.24 + Math.abs(i - (n - 1) / 2) * (isMobile ? 3 : 4.5);

        const slot = SCATTER_SLOTS[i % SCATTER_SLOTS.length];
        const scatX = slot[0] * vw;
        const scatY = slot[1] * vh;
        const scatRot = slot[2];

        const pileX = ((i % 3) - 1) * 4;
        const pileY = (Math.floor(i / 3) - 1.5) * 3;
        const pileRot = (i % 2 === 0 ? 1 : -1) * (i * 1.4);

        const theta = i * step + wheelRot - Math.PI / 2;
        const ringX = Math.cos(theta) * rx;
        const ringY = Math.sin(theta) * ry;
        const ringRot = (theta * 180) / Math.PI + 90;

        let targetX = lerp(fanX, scatX, scatterT);
        let targetY = lerp(fanY, scatY, scatterT);
        let targetRot = lerp(fanAngle, scatRot, scatterT);
        let targetScale = lerp(0.9, isMobile ? 0.92 : 0.98, scatterT);

        if (p >= 0.24) {
          targetX = lerp(targetX, pileX, gatherT);
          targetY = lerp(targetY, pileY, gatherT);
          targetRot = lerp(targetRot, pileRot, gatherT);
          targetScale = lerp(targetScale, isMobile ? 0.84 : 0.92, gatherT);
        }

        if (p >= 0.36) {
          targetX = lerp(targetX, ringX, orbitT);
          targetY = lerp(targetY, ringY, orbitT);
          targetRot = lerp(targetRot, ringRot, orbitT);
          targetScale = lerp(targetScale, isMobile ? 0.82 : 0.96, orbitT);
        }

        const w = 0.055 + (i % 4) * 0.008;
        curX[i] += (targetX - curX[i]) * w;
        curY[i] += (targetY - curY[i]) * w;
        curRot[i] += (targetRot - curRot[i]) * w;
        curScale[i] += (targetScale - curScale[i]) * w;

        const dx = Math.abs(targetX - curX[i]);
        const dy = Math.abs(targetY - curY[i]);
        const dRot = Math.abs(targetRot - curRot[i]);
        maxDeltaPx = Math.max(maxDeltaPx, Math.hypot(dx, dy));
        maxDeltaDeg = Math.max(maxDeltaDeg, dRot);

        const targetOp = p > 0.68 ? clamp(1 - (p - 0.68) * 5, 0, 1) : 1;
        curOp[i] += (targetOp - curOp[i]) * 0.14;

        cardEl.style.width = `${cw}px`;
        cardEl.style.height = `${ch}px`;
        cardEl.style.transform = `translate3d(calc(-50% + ${curX[i].toFixed(2)}px), calc(-50% + ${curY[i].toFixed(
          2
        )}px), 0) rotate(${curRot[i].toFixed(2)}deg) scale(${curScale[i].toFixed(3)})`;
        cardEl.style.opacity = curOp[i].toFixed(3);
      }

      if (centerCopyRef.current) {
        const copyIn = smoothstep(0.03, 0.14, p);
        const copyOut = 1 - smoothstep(0.21, 0.28, p);
        const wheelCopyIn = smoothstep(0.43, 0.5, p) * (1 - smoothstep(0.62, 0.68, p));
        const copyOp = Math.max(copyIn * copyOut, wheelCopyIn);
        const copyScale = lerp(0.95, 1, Math.max(copyIn, smoothstep(0.43, 0.5, p)));
        centerCopyRef.current.style.opacity = copyOp.toFixed(3);
        centerCopyRef.current.style.transform = `scale(${copyScale.toFixed(3)})`;
      }

      if (p < 0.62) {
        windowUnlocked = false;
      } else if (p >= 0.66 && ((maxDeltaPx <= 3 && maxDeltaDeg <= 1) || p >= 0.72)) {
        windowUnlocked = true;
      }

      const winEl = windowRef.current;
      if (winEl) {
        if (!windowUnlocked) {
          winEl.style.opacity = '0';
          winEl.style.pointerEvents = 'none';
          winEl.style.clipPath = 'inset(32% 34% 32% 34% round 14px)';
        } else {
          const winOpen = smoothstep(0.66, 0.84, p);
          const insetV = lerp(31, 0, winOpen);
          const insetH = lerp(33, 0, winOpen);
          const radius = lerp(14, 0, winOpen);
          winEl.style.opacity = smoothstep(0.65, 0.7, p).toFixed(3);
          winEl.style.pointerEvents = winOpen > 0.35 ? 'auto' : 'none';
          winEl.style.clipPath = `inset(${insetV.toFixed(2)}% ${insetH.toFixed(2)}% ${insetV.toFixed(
            2
          )}% ${insetH.toFixed(2)}% round ${radius.toFixed(1)}px)`;
        }
      }

      const q = clamp((p - 0.84) / 0.16, 0, 1);

      if (floatWrapRef.current) {
        const zoomScale = 1 + q * q * (isMobile ? 14 : 28);
        const bobY = Math.sin(now * 0.0016) * 6 * (1 - q);
        floatWrapRef.current.style.transform = `translate3d(0, ${bobY.toFixed(2)}px, 0) scale(${zoomScale.toFixed(3)})`;
      }

      if (floatFrameRef.current) {
        pointerYaw += (targetYaw - pointerYaw) * 0.08;
        const scrollYaw = Math.sin(p * Math.PI * 3) * 4 * (1 - q);
        const totalYaw = clamp(pointerYaw + scrollYaw, -10, 10);
        const pitch = Math.cos(now * 0.0011) * 2.2 * (1 - q);
        floatFrameRef.current.style.transform = `rotateY(${totalYaw.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg)`;
      }

      if (blackoutRef.current) {
        const blackOp = smoothstep(0.42, 0.96, q);
        blackoutRef.current.style.opacity = blackOp.toFixed(3);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <section
        id="quy-trinh"
        ref={stageRef}
        data-reduced="true"
        aria-label="Quy trình kiến tạo và sản phẩm F-Forum"
        className="tw-stage scene-paper"
      >
        <div id="san-pham" className="tw-anchor-product" aria-hidden="true" />
        <div className="wrap-wide">
          <div className="tw-center-copy" style={{ marginInline: 'auto', pointerEvents: 'auto' }}>
            <p className="tw-kicker">quy trình kiến tạo</p>
            <h2 className="tw-phrase">
              Từ phác thảo{' '}
              <span className="tw-chip">
                <img
                  src={chipSrc}
                  alt={STAGE_CHIP_PREVIEW.label}
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (chipSrc !== STAGE_CHIP_PREVIEW.fallbackUrl) setChipSrc(STAGE_CHIP_PREVIEW.fallbackUrl);
                    else setChipFailed(true);
                  }}
                  style={chipFailed ? { opacity: 0 } : undefined}
                />
              </span>{' '}
              đến sản phẩm
              <span className="tw-subphrase">dựng qua quy trình thực</span>
            </h2>
          </div>

          <div className="tw-reduced-grid">
            {TIDEWELL_CARDS.map((card, index) => (
              <div key={card.id} className="tw-reduced-card">
                <div className="tw-reduced-media">
                  <StageCardView card={card} index={index} />
                </div>
              </div>
            ))}
          </div>

          <div className="tw-reduced-showcase">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p className="tw-corner-label">Không chỉ là hình ảnh</p>
                <h3 className="tw-corner-title">Sản phẩm chạy thật trong Live View</h3>
              </div>
              <div className="lp-actions">
                <button type="button" className="btn btn-line" onClick={() => onNavigate('explore')}>
                  Khám phá
                </button>
                <button type="button" className="btn btn-red" onClick={() => onNavigate('workspace')}>
                  Live View
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="quy-trinh"
      ref={stageRef}
      aria-label="Quy trình kiến tạo 12 mẫu và cửa sổ sản phẩm"
      className="tw-stage scene-paper"
    >
      <div id="san-pham" className="tw-anchor-product" aria-hidden="true" />
      <div className="tw-sticky">
        <div className="tw-grid-bg" aria-hidden="true" />

        <div ref={centerCopyRef} className="tw-center-copy">
          <p className="tw-kicker">quy trình 12 thành phần</p>
          <h2 className="tw-phrase">
            Từ phác thảo{' '}
            <span className="tw-chip" aria-hidden="true">
              <img
                src={chipSrc}
                alt=""
                loading="eager"
                referrerPolicy="no-referrer"
                onError={() => {
                  if (chipSrc !== STAGE_CHIP_PREVIEW.fallbackUrl) setChipSrc(STAGE_CHIP_PREVIEW.fallbackUrl);
                  else setChipFailed(true);
                }}
                style={chipFailed ? { opacity: 0 } : undefined}
              />
            </span>{' '}
            đến sản phẩm
            <span className="tw-subphrase">dựng qua quy trình thực</span>
          </h2>
          <p className="tw-telemetry">196 cấu trúc · 6.770 mẫu · 6 phép kiểm</p>
        </div>

        <div className="tw-cards-layer">
          {TIDEWELL_CARDS.map((card, index) => (
            <StageCardView
              key={card.id}
              card={card}
              index={index}
              cardRef={(el) => {
                cardRefs.current[index] = el;
              }}
            />
          ))}
        </div>

        <div ref={windowRef} className="tw-window-shell" style={{ opacity: 0 }}>
          <div className="tw-window-backdrop" aria-hidden="true" />
          <div className="tw-window-stripes" aria-hidden="true">
            <div className="tw-window-col">
              <span>01 · LIVE VIEW</span>
              <span>sandbox=&quot;allow-scripts&quot;</span>
            </div>
            <div className="tw-window-col">
              <span>02 · DIFF &amp; CHECK</span>
              <span>390px / 768px / 1440px</span>
            </div>
            <div className="tw-window-col">
              <span>03 · XUẤT BẢN</span>
              <span>Quét khóa · Đóng gói ZIP</span>
            </div>
          </div>

          <div className="tw-corner-top">
            <p className="tw-corner-label">01 · kiểm chứng trực tiếp</p>
            <h3 className="tw-corner-title">Không chỉ là hình ảnh</h3>
          </div>

          <div ref={floatWrapRef} className="tw-float-wrap">
            <div ref={floatFrameRef} className="tw-float-frame">
              <div className="tw-frame-bar">
                <div className="tw-frame-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span>F-Forum · Live View &amp; Diff</span>
                <span>0đ</span>
              </div>
              <div className="tw-frame-body">
                <div className="tw-frame-preview">
                  <div className="tw-frame-pane">
                    <span style={{ color: '#ddad95' }}>NHẬT KÝ PHẢN BIỆN</span>
                    <span style={{ color: '#efe9dd', fontSize: '13px', fontFamily: 'var(--font-display)' }}>
                      Kiểm tra cấu trúc DOM và khung nhìn 390px
                    </span>
                    <span style={{ color: '#8e887e' }}>6 phép kiểm · 0 rò rỉ khóa</span>
                  </div>
                  <div className="tw-frame-pane">
                    <span style={{ color: '#7da3bb' }}>BẢN DỰNG CÔ LẬP</span>
                    <span style={{ color: '#7fd69b' }}>+ viewport meta hợp lệ</span>
                    <span style={{ color: '#b5afa3' }}>noreferrer · no same-origin</span>
                  </div>
                </div>
                <div className="tw-frame-checks">
                  <div className="tw-frame-check">
                    <span>HTML</span>
                    <b>đạt</b>
                  </div>
                  <div className="tw-frame-check">
                    <span>Cú pháp</span>
                    <b>đạt</b>
                  </div>
                  <div className="tw-frame-check">
                    <span>390px</span>
                    <b>đạt</b>
                  </div>
                </div>
                <div className="tw-frame-actions">
                  <button type="button" className="btn btn-line btn-sm" onClick={() => onNavigate('explore')}>
                    Khám phá
                  </button>
                  <button type="button" className="btn btn-red btn-sm" onClick={() => onNavigate('workspace')}>
                    Live View
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="tw-corner-bottom">
            <p className="tw-corner-label">02 · thực thi cô lập</p>
            <h3 className="tw-corner-title">Sản phẩm chạy thật</h3>
          </div>
        </div>

        <div ref={blackoutRef} className="tw-blackout" style={{ opacity: 0 }} aria-hidden="true" />
      </div>
    </section>
  );
};

export default TidewellStage;
