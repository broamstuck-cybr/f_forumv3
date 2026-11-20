import React, { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { DimensionView } from '../../../types/index';
import { STACKING_PROJECTS, type StackingProjectItem } from '../../../data/realShowcaseData';
import { Mark } from '../../../ui/Mark';
import { usePrefersReducedMotion } from '../useLandingMotion';

interface LandingProjectsProps {
  onNavigate: (view: DimensionView) => void;
}

interface StackingPlateProps {
  project: StackingProjectItem;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduced: boolean;
  onExplore: () => void;
}

function buildProjectSrcDoc(project: StackingProjectItem): string {
  const html = project.previewHtml || '';
  const css = project.previewCss || '';
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8" /><style>${css}</style></head><body>${html}</body></html>`;
}

const PINUI_THREEUI_FALLBACK_DOC =
  '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8" /><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#121110;color:#efe9dd;font-family:system-ui,sans-serif}.pt-stage{width:min(380px,90vw);padding:24px;border:1px solid rgba(239,233,221,0.22);background:#1a1917}.pt-kicker{font-family:monospace;font-size:11px;color:#ff6450}.pt-stage h3{margin:10px 0 8px;font-family:Georgia,serif;font-size:20px;font-weight:400}.pt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.pt-cell{padding:10px;border:1px solid rgba(239,233,221,0.14);background:#0c0b0a;font-family:monospace;font-size:11px;color:#efe9dd}</style></head><body><div class="pt-stage"><div class="pt-kicker">UNIFIED MOTION SYSTEM</div><h3>PinUI, ThreeUI, LucianLabs</h3><div class="pt-grid"><div class="pt-cell">41 PinUI</div><div class="pt-cell">961 ThreeUI</div><div class="pt-cell">400 Lucian</div></div></div></body></html>';

const StackingPlate: React.FC<StackingPlateProps> = ({
  project,
  index,
  total,
  progress,
  reduced,
  onExplore,
}) => {
  const targetScale = 1 - (total - 1 - index) * 0.03;
  const startRange = index / total;
  const scale = useTransform(progress, [startRange, 1], [1, targetScale]);
  const mainSrcDoc = project.previewHtml ? buildProjectSrcDoc(project) : PINUI_THREEUI_FALLBACK_DOC;

  return (
    <div className="lp-stack-slot" style={reduced ? undefined : { top: `calc(var(--nav-h) + ${16 + index * 22}px)` }}>
      <motion.article style={reduced ? undefined : { scale }} className="lp-stack-card">
        <div className="lp-stack-grid">
          <div className="lp-stack-info">
            <div className="lp-stack-top">
              <div className="lp-stack-bar">
                <span className="t-label">{project.category}</span>
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Mở kho ${project.title}`}
                  className="icon-btn"
                >
                  <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              </div>
              <h3 className="lp-stack-title">{project.title}</h3>
              <p className="t-lead">{project.subtitle}</p>
            </div>

            <div>
              <dl className="lp-stack-metrics">
                {project.metrics.slice(0, 3).map((m) => (
                  <div key={m.label}>
                    <dt className="t-label">{m.label}</dt>
                    <dd>{m.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="lp-actions" style={{ marginTop: 'var(--space-5)' }}>
                <button type="button" className="btn btn-red" onClick={onExplore}>
                  Khám phá
                </button>
              </div>
            </div>
          </div>

          <div className="lp-stack-stage">
            <div className="lp-stack-frame">
              <iframe
                title={`Xem trước ${project.title}`}
                srcDoc={mainSrcDoc}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>

            <div className="lp-stack-thumbs">
              {project.images.slice(1, 3).map((imgUrl, idx) => {
                const metric = project.metrics[idx] ?? project.metrics[0];
                return (
                  <div key={`${project.id}-sub-${idx}`} className="plate lp-stack-thumb">
                    <div className="lp-plate-fallback" aria-hidden="true">
                      <span className="t-label">{metric?.label}</span>
                      <span className="lp-plate-fallback-title">{metric?.value}</span>
                    </div>
                    <img
                      src={imgUrl}
                      alt={`${project.title} bản xem ${idx + 2}`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0';
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
};

export const LandingProjects: React.FC<LandingProjectsProps> = ({ onNavigate }) => {
  const reduced = usePrefersReducedMotion();
  const stackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ['start start', 'end end'],
  });

  return (
    <section id="du-an" aria-label="Dự án Thực chiến" className="lp-section sheet lp-sheet-lift scene-ink">
      <div className="wrap-wide">
        <div className="lp-head">
          <div className="lp-head-copy">
            <p className="t-label">dữ liệu nguồn mở có thể truy vết</p>
            <h2 className="t-title">
              Dự án thực chiến, <Mark kind="underline">xếp lớp</Mark> kiểm chứng
            </h2>
            <p className="t-lead">
              Mỗi hệ thống đều xuất phát từ kho lưu trữ mở và số liệu thật đã được kiểm đếm.
            </p>
          </div>
        </div>

        <div ref={stackRef} className="lp-stack">
          {STACKING_PROJECTS.map((project, idx) => (
            <StackingPlate
              key={project.id}
              project={project}
              index={idx}
              total={STACKING_PROJECTS.length}
              progress={scrollYProgress}
              reduced={reduced}
              onExplore={() => onNavigate('explore')}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingProjects;
