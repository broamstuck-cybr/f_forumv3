import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { DimensionView, User } from '../../../types/index';
import { Mark } from '../../../ui/Mark';
import { HardwareShowcase } from '../../HardwareShowcase';
import { usePrefersReducedMotion } from '../useLandingMotion';
import { formatActiveDurationVi, useLiveMetrics } from '../useLiveMetrics';

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
  D: '#161D1D',
  B: '#38C99A',
  L: '#F4F7F5',
  P: '#E6B385',
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
    label: 'Thư viện mẫu',
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
  onEnterApp,
  onNavigate,
}) => {
  const reduced = usePrefersReducedMotion();
  const { visitors, activeSeconds } = useLiveMetrics();
  const sectionRef = useRef<HTMLElement>(null);
  const flightSvgRef = useRef<SVGSVGElement>(null);
  const flightPathRef = useRef<SVGPathElement>(null);
  const flightPlaneRef = useRef<SVGGElement>(null);
  const [activeCount, setActiveCount] = useState<number>(() => (reduced ? PIXEL_ICONS.length : 0));
  const [focusedIcon, setFocusedIcon] = useState<number | null>(null);
  const [showPhone, setShowPhone] = useState(false);

  const splinePath = useMemo(() => buildSplinePath(), []);

  useEffect(() => {
    let rafId = 0;
    let timerId = 0;
    rafId = requestAnimationFrame(() => {
      timerId = window.setTimeout(() => setShowPhone(true), 120);
    });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) window.clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    if (reduced) {
      setActiveCount(PIXEL_ICONS.length);
      return undefined;
    }

    let rafId = 0;
    let stepInterval = 0;
    const start = performance.now();

    const tickFlight = (now: number) => {
      const elapsed = (now - start) / 1000;
      const svg = flightSvgRef.current;
      const path = flightPathRef.current;
      const plane = flightPlaneRef.current;

      if (elapsed <= 1.52) {
        if (elapsed >= 0.15 && svg && path && plane) {
          const flightU = Math.max(0, Math.min(1, (elapsed - 0.33) / (1.27 - 0.33)));
          const eased =
            flightU < 0.5 ? 2 * flightU * flightU : 1 - Math.pow(-2 * flightU + 2, 2) / 2;
          const pos = catmullRomPoint(FLIGHT_POINTS, eased);
          const fadeIn = Math.min(1, Math.max(0, (elapsed - 0.15) / 0.18));
          const fadeOut = elapsed > 1.27 ? Math.max(0, 1 - (elapsed - 1.27) / 0.2) : 1;
          const opacity = fadeIn * fadeOut;

          svg.style.opacity = opacity > 0.01 ? '1' : '0';
          path.setAttribute('stroke-opacity', (0.55 * opacity).toFixed(3));
          path.setAttribute('stroke-dashoffset', (1 - eased).toFixed(4));
          plane.setAttribute(
            'transform',
            `translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) rotate(${pos.angle.toFixed(1)})`
          );
          plane.setAttribute('opacity', opacity.toFixed(3));
        }
        rafId = requestAnimationFrame(tickFlight);
      } else if (svg) {
        svg.style.opacity = '0';
      }
    };

    rafId = requestAnimationFrame(tickFlight);

    const stepStartTimer = window.setTimeout(() => {
      setActiveCount((prev) => (prev >= 1 ? prev : 1));
      stepInterval = window.setInterval(() => {
        setActiveCount((prev) => {
          const next = prev + 1;
          if (next >= PIXEL_ICONS.length) {
            window.clearInterval(stepInterval);
            return PIXEL_ICONS.length;
          }
          return next;
        });
      }, 320);
    }, 1250);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.clearTimeout(stepStartTimer);
      if (stepInterval) window.clearInterval(stepInterval);
    };
  }, [reduced]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 0.96, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -34]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -52]);

  return (
    <section id="top" ref={sectionRef} aria-label="Khởi đầu F-Forum" className="lp-hero">
      <motion.div style={reduced ? undefined : { opacity: heroOpacity }} className="wrap-wide">
        <div className="lp-hero-grid">
          <motion.div style={reduced ? undefined : { y: copyY }} className="lp-hero-copy">
            <div className="lp-assembly" aria-label="Chuỗi 7 bước từ ý tưởng đến tệp xuất">
              {!reduced && (
                <svg
                  ref={flightSvgRef}
                  className="lp-flight-svg"
                  viewBox="0 0 360 92"
                  fill="none"
                  aria-hidden="true"
                  style={{ opacity: 0 }}
                >
                  <path
                    ref={flightPathRef}
                    d={splinePath}
                    stroke="#38C99A"
                    strokeWidth="1.25"
                    strokeDasharray="4 5"
                    strokeOpacity={0}
                    pathLength={1}
                    strokeDashoffset={1}
                  />
                  <g ref={flightPlaneRef} transform="translate(22, 62) rotate(0)" opacity={0}>
                    <polygon points="10,0 -8,-6 -4,0 -8,6" fill="#F4F7F5" stroke="#161D1D" strokeWidth="1" />
                    <polygon points="10,0 -4,0 -8,6" fill="#38C99A" />
                    <line x1="-4" y1="0" x2="8" y2="0" stroke="#E6B385" strokeWidth="1" />
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
                <span className="t-script lp-cap">T</span>ừ ý tưởng đến{' '}
                <em className="t-italic lp-hero-em">sản phẩm thật</em>,
              </span>{' '}
              <span className="lp-hero-line" data-visible={activeCount >= 3}>
                <Mark kind="underline" active>
                  làm chủ AI
                </Mark>{' '}
                không rập khuôn.
              </span>
            </h1>

            <p className="lp-hero-lead">
              Xưởng dựng web tiếng Việt quy tụ 5.994 mẫu giao diện miễn phí, 58 kỹ thuật chuyển động và 122 repo — giúp bạn biến ý tưởng thành sản phẩm chạy thật, không rập khuôn.
            </p>

            <div className="lp-actions">
              <button type="button" className="btn btn-red btn-lg" onClick={onEnterApp}>
                Mở Workspace
              </button>
              <button type="button" className="btn btn-line btn-lg" onClick={() => onNavigate('explore')}>
                Kho mẫu
              </button>
            </div>

            <dl className="lp-colophon" aria-label="Số liệu thực của F-Forum">
              <div>
                <dt className="t-label">Kho tài nguyên mở</dt>
                <dd className="lp-colophon-value">5.994 mẫu miễn phí</dd>
                <dd className="lp-colophon-sub">58 kỹ thuật · 60 công cụ · 122 repo</dd>
              </div>
              <div>
                <dt className="t-label">Tổng người truy cập</dt>
                <dd className="lp-colophon-value lp-colophon-num">
                  {visitors.toLocaleString('vi-VN')}
                </dd>
                <dd className="lp-colophon-sub">Ghi nhận thực theo trình duyệt</dd>
              </div>
              <div>
                <dt className="t-label">Tổng thời gian truy cập thực</dt>
                <dd className="lp-colophon-value lp-colophon-accent lp-colophon-num">
                  {formatActiveDurationVi(activeSeconds)}
                </dd>
                <dd className="lp-colophon-sub">Chỉ tính khi tab đang mở</dd>
              </div>
            </dl>
          </motion.div>

          <motion.div
            style={
              reduced
                ? { minHeight: 'clamp(590px, 78vh, 790px)' }
                : { y: phoneY, minHeight: 'clamp(590px, 78vh, 790px)' }
            }
            className="lp-hero-phone"
          >
            {showPhone && <HardwareShowcase onNavigate={onNavigate} />}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default LandingHero;
