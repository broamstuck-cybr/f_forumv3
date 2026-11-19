import React, { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { DimensionView } from '../../../types/index';
import { STACKING_PROJECTS, type StackingProjectItem } from '../../../data/realShowcaseData';
import { SectionHeading } from '../LandingPrimitives';
import { usePrefersReducedMotion } from '../useLandingMotion';

interface LandingProjectsProps {
  onNavigate: (view: DimensionView) => void;
}

interface StackingCardProps {
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
  '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8" /><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090a0d;color:#f4f1ea;font-family:system-ui,sans-serif}.pt-stage{width:min(380px,90vw);padding:22px;border-radius:18px;border:1px solid rgba(200,155,84,0.36);background:linear-gradient(155deg,#161a26 0%,#0d1017 100%)}.pt-kicker{font-family:monospace;font-size:11px;letter-spacing:.12em;color:#2dd4bf}.pt-stage h3{margin:10px 0 8px;font-size:18px;color:#f4f1ea}.pt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.pt-cell{padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);font-family:monospace;font-size:11px;color:#e5c384}</style></head><body><div class="pt-stage"><div class="pt-kicker">UNIFIED MOTION SYSTEM</div><h3>PinUI · ThreeUI · LucianLabs</h3><div class="pt-grid"><div class="pt-cell">41 PinUI</div><div class="pt-cell">961 ThreeUI</div><div class="pt-cell">400 Lucian</div></div></div></body></html>';

const StackingCard: React.FC<StackingCardProps> = ({
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
  const mainSrcDoc = project.previewHtml
    ? buildProjectSrcDoc(project)
    : PINUI_THREEUI_FALLBACK_DOC;

  return (
    <div
      className="sticky top-24 md:top-32"
      style={{ marginTop: index === 0 ? '0px' : '32px' }}
    >
      <motion.article
        style={
          reduced
            ? { top: `${index * 24}px` }
            : {
                scale,
                top: `${index * 24}px`,
                transformOrigin: 'top center',
              }
        }
        className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] border border-[rgba(200,155,84,0.28)] bg-[#11131a] text-[#f4f1ea] shadow-[0_32px_80px_rgba(0,0,0,0.65)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="flex flex-col justify-between gap-8 p-6 sm:p-10 lg:col-span-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-[11.5px] text-[#c89b54]">
                <span>{project.indexLabel} · {project.category}</span>
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Mở kho ${project.title}`}
                  title={`Mở kho ${project.title}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-[#adb3bf] hover:border-[#c89b54] hover:text-[#e5c384]"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>

              <h3
                className="m-0 text-2xl sm:text-3xl font-semibold tracking-tight text-[#f4f1ea]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {project.title}
              </h3>

              <p className="m-0 text-[14.5px] leading-relaxed text-[#adb3bf]">
                {project.subtitle}
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/10 pt-5">
                {project.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="font-mono text-[10.5px] text-[#8891a2]">{m.label}</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-[#e5c384]">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onExplore}
                  className="rounded-full border-0 px-5 py-2.5 text-[13px] font-semibold text-[#090a0d] cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #e5c384 0%, #c89b54 100%)' }}
                >
                  Khám phá
                </button>
              </div>
            </div>
          </div>

          <div className="border-t lg:border-t-0 lg:border-l border-white/10 bg-[#090a0d] p-5 sm:p-8 lg:col-span-7 flex flex-col justify-between gap-4">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px] border border-white/15 bg-[#121620]">
              <iframe
                title={`Xem trước ${project.title}`}
                srcDoc={mainSrcDoc}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                loading="eager"
                className="h-full w-full border-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {project.images.slice(1, 3).map((imgUrl, idx) => {
                const metric = project.metrics[idx] ?? project.metrics[0];
                return (
                  <div
                    key={`${project.id}-sub-${idx}`}
                    className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-[#141720]"
                  >
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 font-mono">
                      <span className="text-[10px] text-[#c89b54]">{metric?.label}</span>
                      <span className="text-base font-semibold text-[#f4f1ea]">{metric?.value}</span>
                    </div>
                    <img
                      src={imgUrl}
                      alt={`${project.title} ${idx + 2}`}
                      loading="eager"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0';
                      }}
                      className="relative z-10 h-full w-full object-cover"
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
    <section
      id="du-an"
      aria-label="Dự án Thực chiến"
      className="relative -mt-10 rounded-t-[40px] md:rounded-t-[60px] bg-[#090a0d] text-[#f4f1ea] px-4 py-24 sm:px-8 sm:py-32"
      style={
        {
          '--ff-text': '#f4f1ea',
          '--ff-text-soft': '#adb3bf',
          '--ff-text-dim': '#8891a2',
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-[1320px]">
        <SectionHeading
          align="left"
          title={
            <>
              <span className="ff-serif-editorial text-[#e5c384]">Dự án Thực chiến</span>
              <span className="block mt-1 text-[#f4f1ea]">Xếp chồng qua từng tầng kiểm chứng</span>
            </>
          }
          description="Mỗi hệ thống đều bắt nguồn từ kho lưu trữ mở và số liệu kiểm định có thể truy vết."
        />

        <div ref={stackRef} className="mt-14 space-y-12 pb-16">
          {STACKING_PROJECTS.map((project, idx) => (
            <StackingCard
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
