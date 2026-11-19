import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { DimensionView } from '../../../types/index';
import { MARQUEE_ROW_1, MARQUEE_ROW_2, type MarqueeShowcaseItem } from '../../../data/realShowcaseData';
import { handleImageError } from '../../../utils/mediaFallback';
import { SectionHeading } from '../LandingPrimitives';
import { usePrefersReducedMotion } from '../useLandingMotion';

interface LandingShowcaseProps {
  onNavigate: (view: DimensionView) => void;
}

const MarqueeCard: React.FC<{
  item: MarqueeShowcaseItem;
  onOpenExplore: () => void;
}> = ({ item, onOpenExplore }) => (
  <article
    className="group relative w-[300px] sm:w-[390px] shrink-0 overflow-hidden rounded-[24px] border border-[var(--ff-border)] bg-[var(--ff-bg-soft)]"
  >
    <div
      className="relative aspect-[16/10] w-full overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 70% 60% at 30% 30%, rgba(200,155,84,0.16), transparent 65%), linear-gradient(155deg, #12151e 0%, #090b10 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 font-mono text-[11px] text-[#adb3bf]/70">
        <span>{item.source === 'motionsites' ? 'MotionSites' : 'SOURCEOFKNOWLEDGFORAI'}</span>
        <span className="text-[14px] font-semibold text-[#f4f1ea]/85">{item.title}</span>
      </div>
      <img
        src={item.imageUrl}
        alt={item.title}
        loading="eager"
        decoding="async"
        onError={(e) => handleImageError(e, item.fallbackUrl)}
        className="relative z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    </div>
    <div className="flex items-center justify-between gap-3 border-t border-[var(--ff-border)] px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold text-[var(--ff-text)]">
          {item.title}
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-[var(--ff-text-dim)]">
          {item.source === 'motionsites' ? 'MotionSites' : 'SOURCEOFKNOWLEDGFORAI'} · {item.category}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenExplore}
          className="rounded-full border border-[var(--ff-border-strong)] bg-transparent px-3 py-1.5 text-[11.5px] font-medium text-[var(--ff-text)] cursor-pointer hover:border-[var(--ff-amber)]"
        >
          Khám phá
        </button>
        <a
          href={item.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Xem nguồn ${item.title}`}
          title={`Xem nguồn ${item.title}`}
          className="grid h-8 w-8 place-items-center rounded-full border border-[var(--ff-border)] text-[var(--ff-text-soft)] hover:text-[var(--ff-text)] hover:border-[var(--ff-amber)]"
        >
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  </article>
);

export const LandingShowcase: React.FC<LandingShowcaseProps> = ({ onNavigate }) => {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const row1X = useTransform(scrollYProgress, [0, 1], [-220, 140]);
  const row2X = useTransform(scrollYProgress, [0, 1], [140, -220]);

  return (
    <section
      id="san-pham"
      ref={sectionRef}
      aria-label="Không chỉ là hình ảnh — Sản phẩm chạy thật"
      className="relative w-full overflow-hidden border-t border-[var(--ff-border)] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            align="left"
            title={
              <>
                <span className="ff-serif-editorial">Không chỉ là hình ảnh</span>
                <span className="block mt-1 text-[var(--ff-amber-ink)]">Sản phẩm chạy thật</span>
              </>
            }
            description="21 chuyển động thực tế từ MotionSites cùng học liệu SOURCEOFKNOWLEDGFORAI — cuộn xuống để kéo hai dòng trưng bày ngược chiều và cuộn ngược lại để tua về."
          />

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="ff-btn ff-btn-ghost px-5 py-2.5 text-[13px]"
            >
              Khám phá
            </button>
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="ff-btn ff-btn-primary px-5 py-2.5 text-[13px]"
            >
              Live View
            </button>
          </div>
        </div>
      </div>

      <div className="mt-14 space-y-5">
        <motion.div
          style={reduced ? undefined : { x: row1X }}
          className={`flex gap-4 px-4 sm:px-8 ${reduced ? 'overflow-x-auto ff-scrollbar pb-2' : 'w-max'}`}
        >
          {MARQUEE_ROW_1.map((item) => (
            <MarqueeCard
              key={item.id}
              item={item}
              onOpenExplore={() => onNavigate('explore')}
            />
          ))}
        </motion.div>

        <motion.div
          style={reduced ? undefined : { x: row2X }}
          className={`flex gap-4 px-4 sm:px-8 ${reduced ? 'overflow-x-auto ff-scrollbar pb-2' : 'w-max'}`}
        >
          {MARQUEE_ROW_2.map((item) => (
            <MarqueeCard
              key={item.id}
              item={item}
              onOpenExplore={() => onNavigate('explore')}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LandingShowcase;
