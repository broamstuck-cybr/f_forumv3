import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { DimensionView, User } from '../../../types/index';
import { Mark } from '../../../ui/Mark';
import { HardwareShowcase } from '../../HardwareShowcase';
import { usePrefersReducedMotion } from '../useLandingMotion';

interface LandingHeroProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenLogin: () => void;
  onEnterApp: () => void;
  onNavigate: (view: DimensionView) => void;
}

interface PixelIconSpec {
  id: string;
  label: string;
  grid: string[];
}

const PIXEL_PALETTE: Record<string, string> = {
  D: '#1F2430',
  B: '#7DA3BB',
  L: '#F1ECEA',
  P: '#DDAD95',
};

const PIXEL_ICONS: PixelIconSpec[] = [
  {
    id: 'prompt',
    label: 'Ý tưởng',
    grid: [
      '.......BB',
      '.....BBBB',
      '...BBLLBB',
      '.BBLLPPB.',
      'BLLPPDB..',
      '..BPPB...',
      '...BPD...',
      '...BD....',
      '.........',
    ],
  },
  {
    id: 'syntax',
    label: 'Cấu trúc',
    grid: [
      '..LL.LL..',
      '.LD...DL.',
      '.L.....L.',
      'LD.P.P.DL',
      '.L..B..L.',
      '.L.P.P.L.',
      '.LD...DL.',
      '..LL.LL..',
      '.........',
    ],
  },
  {
    id: 'sandbox',
    label: 'Live View',
    grid: [
      'BBBBBBBBB',
      'BDDDDDDDB',
      'BDP.LL.DB',
      'BDLLLLLDB',
      'BDLBBBLDB',
      'BDLBPBLDB',
      'BDDDDDDDB',
      'BBBBBBBBB',
      '.........',
    ],
  },
  {
    id: 'diff',
    label: 'Đối chiếu',
    grid: [
      'LLLL.PPPP',
      'LDLD.PDPD',
      'L.LL.P.PP',
      'LLLL.PPPP',
      'LDDL.PDDP',
      'LLLL.PPPP',
      'B..B.B..B',
      'BBBB.BBBB',
      '.........',
    ],
  },
  {
    id: 'check',
    label: 'Kiểm tra',
    grid: [
      'DDDDDDDDD',
      'DLLLLLLLD',
      'DLDDDDDLD',
      'DLDDDDPLD',
      'DLDDPPDLD',
      'DLPPDDDLD',
      'DLLLLLLLD',
      'DDDDDDDDD',
      '.........',
    ],
  },
  {
    id: 'catalog',
    label: '6.770 chi tiết',
    grid: [
      'BBB..PPPP',
      'BLB..PLLP',
      'BBB..PPPP',
      '.........',
      'LLL..BBBB',
      'LDL..BPPB',
      'LLL..BBBB',
      '.........',
      '.........',
    ],
  },
  {
    id: 'export',
    label: 'Xuất ZIP',
    grid: [
      '....L....',
      '...LLL...',
      '..L.L.L..',
      '....L....',
      'BB..L..BB',
      'BPPPPPPPB',
      'BPLLLLLPB',
      'BBBBBBBBB',
      '.........',
    ],
  },
];

type Vec2 = [number, number];

const FLIGHT_POINTS: Vec2[] = [
  [-28, 22],
  [74, 8],
  [184, 52],
  [256, 18],
  [146, 68],
  [22, 62],
];

function catmullRomPoint(pts: Vec2[], t: number): { x: number; y: number; angle: number } {
  const n = pts.length - 1;
  const scaled = Math.max(0, Math.min(n - 0.0001, t * n));
  const idx = Math.floor(scaled);
  const u = scaled - idx;

  const p0 = pts[Math.max(0, idx - 1)];
  const p1 = pts[idx];
  const p2 = pts[Math.min(n, idx + 1)];
  const p3 = pts[Math.min(n, idx + 2)];

  const u2 = u * u;
  const u3 = u2 * u;

  const x =
    0.5 *
    (2 * p1[0] +
      (-p0[0] + p2[0]) * u +
      (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 +
      (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3);

  const y =
    0.5 *
    (2 * p1[1] +
      (-p0[1] + p2[1]) * u +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3);

  const dx =
    0.5 *
    ((-p0[0] + p2[0]) +
      2 * (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u +
      3 * (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u2);

  const dy =
    0.5 *
    ((-p0[1] + p2[1]) +
      2 * (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u +
      3 * (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u2);

  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

function buildSplinePath(): string {
  const samples: string[] = [];
  for (let i = 0; i <= 40; i += 1) {
    const { x, y } = catmullRomPoint(FLIGHT_POINTS, i / 40);
    samples.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return samples.join(' ');
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  currentUser,
  onOpenLogin,
  onEnterApp,
  onNavigate,
}) => {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [activeCount, setActiveCount] = useState<number>(() => (reduced ? PIXEL_ICONS.length : 0));
  const [planeState, setPlaneState] = useState<{
    x: number;
    y: number;
    angle: number;
    opacity: number;
    progress: number;
  }>({ x: 22, y: 62, angle: 0, opacity: 0, progress: 0 });
  const [focusedIcon, setFocusedIcon] = useState<number | null>(null);

  const splinePath = useMemo(() => buildSplinePath(), []);

  useEffect(() => {
    if (reduced) {
      setActiveCount(PIXEL_ICONS.length);
      setPlaneState((prev) => ({ ...prev, opacity: 0, progress: 1 }));
      return;
    }

    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;

      if (elapsed >= 0.15 && elapsed <= 1.48) {
        const flightU = Math.max(0, Math.min(1, (elapsed - 0.33) / (1.27 - 0.33)));
        const eased =
          flightU < 0.5 ? 2 * flightU * flightU : 1 - Math.pow(-2 * flightU + 2, 2) / 2;
        const pos = catmullRomPoint(FLIGHT_POINTS, eased);
        const fadeIn = Math.min(1, Math.max(0, (elapsed - 0.15) / 0.18));
        const fadeOut = elapsed > 1.27 ? Math.max(0, 1 - (elapsed - 1.27) / 0.2) : 1;
        setPlaneState({
          x: pos.x,
          y: pos.y,
          angle: pos.angle,
          opacity: fadeIn * fadeOut,
          progress: eased,
        });
      } else if (elapsed > 1.48) {
        setPlaneState((prev) => (prev.opacity === 0 ? prev : { ...prev, opacity: 0, progress: 1 }));
      }

      if (elapsed >= 1.25) {
        const step = Math.min(
          PIXEL_ICONS.length,
          Math.floor((elapsed - 1.25) / 0.32) + 1
        );
        setActiveCount((prev) => (prev >= step ? prev : step));
      }

      if (elapsed < 5.2) {
        rafId = requestAnimationFrame(tick);
      } else {
        setActiveCount(PIXEL_ICONS.length);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reduced]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5, 0.88], [1, 0.92, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -34]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -52]);

  return (
    <section id="top" ref={sectionRef} aria-label="Khởi đầu F-Forum" className="lp-hero scene-ink">
      <motion.div style={reduced ? undefined : { opacity: heroOpacity }} className="wrap-wide">
        <div className="lp-hero-grid">
          <motion.div style={reduced ? undefined : { y: copyY }} className="lp-hero-copy">
            <p className="lp-kicker t-label">
              <span>F-Forum</span>
              <span>xem trước, đọc mã, chia sẻ prompt</span>
            </p>

            <div className="lp-assembly" aria-label="Chuỗi 7 bước từ ý tưởng đến tệp xuất">
              {!reduced && planeState.opacity > 0.01 && (
                <svg
                  className="lp-flight-svg"
                  viewBox="0 0 360 92"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d={splinePath}
                    stroke="#7DA3BB"
                    strokeWidth="1.25"
                    strokeDasharray="4 5"
                    strokeOpacity={0.55 * planeState.opacity}
                    pathLength={1}
                    strokeDashoffset={1 - planeState.progress}
                  />
                  <g
                    transform={`translate(${planeState.x.toFixed(1)}, ${planeState.y.toFixed(1)}) rotate(${planeState.angle.toFixed(1)})`}
                    opacity={planeState.opacity}
                  >
                    <polygon points="10,0 -8,-6 -4,0 -8,6" fill="#F1ECEA" stroke="#1F2430" strokeWidth="1" />
                    <polygon points="10,0 -4,0 -8,6" fill="#7DA3BB" />
                    <line x1="-4" y1="0" x2="8" y2="0" stroke="#DDAD95" strokeWidth="1" />
                  </g>
                </svg>
              )}

              <div className="lp-pixel-rail" role="list">
                {PIXEL_ICONS.map((icon, idx) => {
                  const morphed = idx < activeCount;
                  const active = focusedIcon === idx;
                  return (
                    <button
                      key={icon.id}
                      type="button"
                      role="listitem"
                      className="lp-pixel-chip"
                      data-morphed={morphed}
                      data-active={active}
                      onMouseEnter={() => setFocusedIcon(idx)}
                      onMouseLeave={() => setFocusedIcon(null)}
                      onFocus={() => setFocusedIcon(idx)}
                      onBlur={() => setFocusedIcon(null)}
                      onClick={() => onNavigate(idx >= 5 ? 'explore' : 'workspace')}
                      aria-label={icon.label}
                      title={icon.label}
                    >
                      <svg
                        viewBox="0 0 9 9"
                        width="24"
                        height="24"
                        shapeRendering="crispEdges"
                        aria-hidden="true"
                      >
                        {icon.grid.map((row, y) =>
                          Array.from(row).map((cell, x) => {
                            const fill = PIXEL_PALETTE[cell];
                            if (!fill) return null;
                            return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />;
                          })
                        )}
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            <h1 className="lp-hero-title">
              <span className="lp-hero-line" data-visible={activeCount >= 1}>
                <span className="t-script lp-cap">T</span>ừ phác thảo đến sản phẩm,
              </span>{' '}
              <span className="lp-hero-line" data-visible={activeCount >= 3}>
                <Mark kind="underline" active>
                  xem được
                </Mark>{' '}
                cả mã nguồn.
              </span>
            </h1>

            <p className="lp-hero-lead">
              F-Forum giúp học sinh, giảng viên và người làm web xem giao diện chạy thật, đọc mã HTML, CSS, JS sạch,
              chỉnh thông số trực tiếp và chia sẻ prompt với cộng đồng.
            </p>

            <div className="lp-actions">
              <button type="button" className="btn btn-red btn-lg" onClick={onEnterApp}>
                Bắt đầu
              </button>
              <button type="button" className="btn btn-line btn-lg" onClick={() => onNavigate('explore')}>
                Khám phá
              </button>
              {!currentUser && (
                <button type="button" className="btn btn-ghost btn-lg" onClick={onOpenLogin}>
                  Đăng nhập
                </button>
              )}
            </div>

            <dl className="lp-colophon">
              <div>
                <dt className="t-label">kho tham chiếu</dt>
                <dd>196 giao diện &amp; mã nguồn tham khảo · 6.770 chi tiết UI/UX</dd>
              </div>
              <div>
                <dt className="t-label">khả năng</dt>
                <dd className="lp-colophon-accent">Xem code sạch · Sao chép Prompt · Tùy biến trực tiếp</dd>
              </div>
              <div>
                <dt className="t-label">cộng đồng</dt>
                <dd>195 người truy cập</dd>
              </div>
            </dl>
          </motion.div>

          <motion.div style={reduced ? undefined : { y: phoneY }} className="lp-hero-phone">
            <HardwareShowcase onNavigate={onNavigate} />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default LandingHero;
