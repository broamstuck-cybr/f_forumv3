import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { DimensionView } from '../../../types/index';
import { MARQUEE_ROW_1, MARQUEE_ROW_2, type MarqueeShowcaseItem } from '../../../data/realShowcaseData';
import { IconArrowUpRight } from '../../../ui/icons';
import { Mark } from '../../../ui/Mark';
import { handleImageError } from '../../../utils/mediaFallback';
import { usePrefersReducedMotion } from '../useLandingMotion';

interface LandingShowcaseProps {
  onNavigate: (view: DimensionView) => void;
}

const ShowcasePlate: React.FC<{
  item: MarqueeShowcaseItem;
  onOpenExplore: () => void;
}> = ({ item, onOpenExplore }) => (
  <article className="lp-plate-card">
    <div className="plate lp-plate-media">
      <div className="lp-plate-fallback" aria-hidden="true">
        <span className="t-label">F-Forum</span>
        <span className="lp-plate-fallback-title">{item.title}</span>
      </div>
      <img
        src={item.imageUrl}
        alt={`${item.title}, ${item.category}`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={(e) => handleImageError(e, item.fallbackUrl)}
        className="lp-plate-img"
      />
    </div>
    <div className="lp-plate-foot">
      <div className="lp-plate-meta">
        <p className="lp-plate-name">{item.title}</p>
        <p className="t-label">{item.category}</p>
      </div>
      <div className="lp-plate-btns">
        <button
          type="button"
          aria-label={`Xem ${item.title} trong Explore`}
          title="Soi mẫu"
          className="icon-btn"
          data-card-trigger
          onClick={onOpenExplore}
        >
          <IconArrowUpRight size={17} aria-hidden="true" />
        </button>
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

  const row1X = useTransform(scrollYProgress, [0, 1], [-180, 120]);
  const row2X = useTransform(scrollYProgress, [0, 1], [120, -180]);

  return (
    <section
      ref={sectionRef}
      aria-label="Không chỉ là hình ảnh, sản phẩm chạy thật"
      className="lp-section sheet"
    >
      <div className="wrap-wide">
        <div className="lp-head">
          <div className="lp-head-copy">
            <p className="t-label">không chỉ là hình ảnh</p>
            <h2 className="t-title">
              Sản phẩm <Mark kind="circle">chạy thật</Mark> với mẫu &amp; mã nguồn
            </h2>
            <p className="t-lead">
              21 chuyển động thực tế từ kho F-Forum: cuộn xuống để kéo hai dải bản in ngược chiều, cuộn ngược để tua lại.
            </p>
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

      <div className="lp-marquee-wrap">
        <motion.div
          style={reduced ? undefined : { x: row1X }}
          data-reduced={reduced ? 'true' : undefined}
          className="lp-marquee-row"
        >
          {MARQUEE_ROW_1.map((item) => (
            <ShowcasePlate key={item.id} item={item} onOpenExplore={() => onNavigate('explore')} />
          ))}
        </motion.div>

        <motion.div
          style={reduced ? undefined : { x: row2X }}
          data-reduced={reduced ? 'true' : undefined}
          className="lp-marquee-row"
        >
          {MARQUEE_ROW_2.map((item) => (
            <ShowcasePlate key={item.id} item={item} onOpenExplore={() => onNavigate('explore')} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LandingShowcase;
