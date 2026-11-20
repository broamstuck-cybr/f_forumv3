import React, { useState } from 'react';
import type { DimensionView } from '../../../types/index';
import { HOME_MOTION_SHOWCASES, type HomeMotionShowcaseItem } from '../../../data/homeMotionShowcases';
import { Mark } from '../../../ui/Mark';
import { PROJECT_SHOWCASE_THUMBS, TIDEWELL_CARDS } from '../landingContent';

interface LandingProjectsProps {
  onNavigate: (view: DimensionView) => void;
}

const PROJECTS = HOME_MOTION_SHOWCASES.filter((item) => item.id in PROJECT_SHOWCASE_THUMBS);

function languageSummary(item: HomeMotionShowcaseItem): string {
  const langs = Array.from(new Set(item.files.map((f) => f.language.toUpperCase().replace('JAVASCRIPT', 'JS'))));
  return langs.join(' · ');
}

const ProjectCard: React.FC<{
  item: HomeMotionShowcaseItem;
  index: number;
  onOpen: () => void;
  onLive: () => void;
}> = ({ item, index, onOpen, onLive }) => {
  const thumb = TIDEWELL_CARDS.find((card) => card.id === PROJECT_SHOWCASE_THUMBS[item.id]);
  const [src, setSrc] = useState(thumb?.imageUrl ?? item.fallbackUrl);
  const [failed, setFailed] = useState(false);

  return (
    <article className="lp-proj-card">
      <div className="lp-proj-media">
        <span className="lp-proj-index">{String(index + 1).padStart(2, '0')}</span>
        <div className="lp-proj-fallback" aria-hidden="true">
          {item.category}
        </div>
        <img
          src={src}
          alt={`Ảnh xem trước ${item.title}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          data-failed={failed ? 'true' : undefined}
          className="lp-proj-img"
          onError={() => {
            if (src !== item.fallbackUrl) setSrc(item.fallbackUrl);
            else setFailed(true);
          }}
        />
      </div>
      <div className="lp-proj-body">
        <p className="t-label">{item.category}</p>
        <h3 className="lp-proj-title">{item.title}</h3>
        <p className="lp-proj-text">{item.summaryVi}</p>
        <dl className="lp-proj-specs">
          <div>
            <dt className="t-label">tệp mã</dt>
            <dd>{item.files.length} tệp</dd>
          </div>
          <div>
            <dt className="t-label">khung nhìn</dt>
            <dd>390 · 768 · 1440</dd>
          </div>
          <div>
            <dt className="t-label">chuyển động</dt>
            <dd>{item.motionConfig.durationMs} ms</dd>
          </div>
        </dl>
        <div className="lp-proj-chips">
          <span className="lp-proj-chip">{languageSummary(item)}</span>
          <span className="lp-proj-chip">{item.motionConfig.pattern}</span>
        </div>
        <div className="lp-proj-actions">
          <button type="button" className="btn btn-red btn-sm" onClick={onOpen}>
            Mở trong Khám phá
          </button>
          <button type="button" className="btn btn-line btn-sm" onClick={onLive}>
            Thử Live View
          </button>
        </div>
      </div>
    </article>
  );
};

export const LandingProjects: React.FC<LandingProjectsProps> = ({ onNavigate }) => {
  return (
    <section id="du-an" aria-label="Dự án thực chiến" className="lp-section sheet lp-sheet-lift scene-ink">
      <div className="wrap-wide">
        <div className="lp-head">
          <div className="lp-head-copy">
            <p className="t-label">mẫu có thể mở và chỉnh ngay</p>
            <h2 className="t-title">
              Dự án thực chiến, <Mark kind="underline">mở là chạy</Mark> được
            </h2>
            <p className="t-lead">
              Mỗi mẫu gồm bản xem trước, bộ tệp HTML, CSS, JS tách riêng và thông số chuyển động để bạn chỉnh theo ý.
            </p>
          </div>
        </div>

        <div className="lp-proj-grid">
          {PROJECTS.map((item, idx) => (
            <ProjectCard
              key={item.id}
              item={item}
              index={idx}
              onOpen={() => onNavigate('explore')}
              onLive={() => onNavigate('workspace')}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingProjects;
