import React, { useMemo } from 'react';
import type { DimensionView } from '../../../types/index';
import { HOME_MOTION_SHOWCASES, type HomeMotionShowcaseItem } from '../../../data/homeMotionShowcases';
import { Mark } from '../../../ui/Mark';
import { PROJECT_SHOWCASE_THUMBS } from '../landingContent';

interface LandingProjectsProps {
  onNavigate: (view: DimensionView) => void;
}

const PROJECTS = HOME_MOTION_SHOWCASES.filter((item) => item.id in PROJECT_SHOWCASE_THUMBS);

function languageSummary(item: HomeMotionShowcaseItem): string {
  const langs = Array.from(new Set(item.files.map((f) => f.language.toUpperCase().replace('JAVASCRIPT', 'JS'))));
  return langs.join(' · ');
}

function buildShowcaseSrcDoc(item: HomeMotionShowcaseItem): string {
  const htmlFile = item.files.find((f) => f.language === 'html')?.content ?? '';
  const cssFile = item.files.find((f) => f.language === 'css')?.content ?? '';
  const jsFile = item.files.find((f) => f.language === 'javascript')?.content ?? '';
  const safeCss = cssFile.replace(/<\/style/gi, '<\\/style');
  const safeJs = jsFile.replace(/<\/script/gi, '<\\/script');

  let doc = htmlFile.replace(/<link[^>]+href=["']styles\.css["'][^>]*>/i, () => `<style>${safeCss}</style>`);
  doc = doc.replace(/<script[^>]+src=["']app\.js["'][^>]*><\/script>/i, () => `<script>${safeJs}</script>`);
  return doc;
}

const ProjectCard: React.FC<{
  item: HomeMotionShowcaseItem;
  index: number;
  onOpen: () => void;
  onLive: () => void;
}> = ({ item, index, onOpen, onLive }) => {
  const [hovered, setHovered] = React.useState(false);
  const srcDoc = useMemo(() => buildShowcaseSrcDoc(item), [item]);

  return (
    <article
      className="lp-proj-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="lp-proj-media">
        <span className="lp-proj-index">{String(index + 1).padStart(2, '0')}</span>
        <img
          className="lp-proj-img"
          src={`/assets/motion-posters/${item.id}.jpg`}
          alt={`Xem trước ${item.title}`}
          loading="eager"
          decoding="async"
        />
        {hovered && (
          <iframe
            srcDoc={srcDoc}
            title={`Bản chạy thử ${item.title}`}
            sandbox="allow-scripts"
            loading="eager"
            referrerPolicy="no-referrer"
            className="lp-proj-iframe"
          />
        )}
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
            <dd>Đáp ứng đa màn hình</dd>
          </div>
          <div>
            <dt className="t-label">phong cách</dt>
            <dd>{item.category}</dd>
          </div>
        </dl>
        <div className="lp-proj-chips">
          <span className="lp-proj-chip">{languageSummary(item)}</span>
          <span className="lp-proj-chip">{item.motionConfig.pattern}</span>
        </div>
        <div className="lp-proj-actions">
          <button type="button" className="btn btn-accent btn-sm" onClick={onOpen}>
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
    <section id="du-an" aria-label="Dự án thực chiến" className="lp-section sheet lp-sheet-lift">
      <div className="wrap-wide">
        <div className="lp-head">
          <div className="lp-head-copy">
            <h2 className="t-title">
              Bộ khung mẫu chuẩn, <Mark kind="underline">mở là chạy</Mark> được
            </h2>
            <p className="t-lead">
              Mỗi Starter Kit đều được phân loại, kiểm tra tính khả thi trước khi vào Tủ sách tài nguyên — sẵn sàng cho Hỏi đáp, Threads, Kho đề thi và dự án học tập.
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
