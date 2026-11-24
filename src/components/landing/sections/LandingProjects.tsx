import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { DimensionView } from '../../../types/index';
import { HOME_MOTION_SHOWCASES, type HomeMotionShowcaseItem } from '../../../data/homeMotionShowcases';
import { MOTION_MARQUEE_ITEMS, type MotionMarqueeItem } from '../../../data/motionShowcaseCatalog';
import { useAppStore } from '../../../store/appStore';
import { Mark } from '../../../ui/Mark';
import { PROJECT_SHOWCASE_THUMBS } from '../landingContent';

interface LandingProjectsProps {
  onNavigate: (view: DimensionView) => void;
}

const STARTER_PROJECTS = HOME_MOTION_SHOWCASES.filter((item) => item.id in PROJECT_SHOWCASE_THUMBS);
const ROTATE_INTERVAL_MS = 120_000;
const MOTION_SAMPLE_COUNT = 6;

function shuffleSample<T>(pool: T[], count: number): T[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function isVideoAsset(url: string): boolean {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

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
  const [hovered, setHovered] = useState(false);
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
            <dd>390–1440px</dd>
          </div>
          <div>
            <dt className="t-label">nguồn</dt>
            <dd>Starter Kit</dd>
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

const MotionSiteCard: React.FC<{
  item: MotionMarqueeItem;
  index: number;
  onOpen: () => void;
  onLaunchPrompt: () => void;
}> = ({ item, index, onOpen, onLaunchPrompt }) => {
  const mediaUrl = item.videoUrl || item.imageUrl;
  const showVideo = Boolean(item.videoUrl) && isVideoAsset(item.videoUrl);

  return (
    <article className="lp-proj-card">
      <div className="lp-proj-media">
        <span className="lp-proj-index">{String(index + 1).padStart(2, '0')}</span>
        {showVideo ? (
          <video
            className="lp-proj-img"
            src={item.videoUrl}
            poster={item.imageUrl || undefined}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            className="lp-proj-img"
            src={mediaUrl}
            alt={`Mẫu MotionSites.ai ${item.title}`}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className="lp-proj-body">
        <p className="t-label">MotionSites.ai · {item.category}</p>
        <h3 className="lp-proj-title">{item.title}</h3>
        <p className="lp-proj-text">
          Mẫu trang web gốc từ MotionSites.ai kèm trailer đầy đủ và đặc tả prompt chạy thẳng trong Workspace.
        </p>
        <dl className="lp-proj-specs">
          <div>
            <dt className="t-label">bố cục</dt>
            <dd>{item.specs.layout}</dd>
          </div>
          <div>
            <dt className="t-label">khung nhìn</dt>
            <dd>390–1440px</dd>
          </div>
          <div>
            <dt className="t-label">nguồn</dt>
            <dd>MotionSites</dd>
          </div>
        </dl>
        <div className="lp-proj-chips">
          <span className="lp-proj-chip">MotionSites.ai</span>
          <span className="lp-proj-chip">{item.specs.motion}</span>
        </div>
        <div className="lp-proj-actions">
          <button type="button" className="btn btn-accent btn-sm" onClick={onOpen}>
            Mở trong Khám phá
          </button>
          <button type="button" className="btn btn-line btn-sm" onClick={onLaunchPrompt}>
            Dựng trong Workspace
          </button>
        </div>
      </div>
    </article>
  );
};

export const LandingProjects: React.FC<LandingProjectsProps> = ({ onNavigate }) => {
  const { launchPromptToWorkspace } = useAppStore();
  const [motionBatch, setMotionBatch] = useState<MotionMarqueeItem[]>(() =>
    shuffleSample(MOTION_MARQUEE_ITEMS, MOTION_SAMPLE_COUNT)
  );
  const [secondsLeft, setSecondsLeft] = useState(120);

  const rotateMotionBatch = useCallback(() => {
    setMotionBatch(shuffleSample(MOTION_MARQUEE_ITEMS, MOTION_SAMPLE_COUNT));
    setSecondsLeft(120);
  }, []);

  useEffect(() => {
    const rotateTimer = window.setInterval(rotateMotionBatch, ROTATE_INTERVAL_MS);
    const countdownTimer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 120 : prev - 1));
    }, 1000);
    return () => {
      window.clearInterval(rotateTimer);
      window.clearInterval(countdownTimer);
    };
  }, [rotateMotionBatch]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <section id="du-an" aria-label="Dự án thực chiến" className="lp-section sheet lp-sheet-lift">
      <div className="wrap-wide">
        <div className="lp-head">
          <div className="lp-head-copy">
            <h2 className="t-title">
              Bộ khung mẫu chuẩn, <Mark kind="underline">mở là chạy</Mark> được
            </h2>
            <p className="t-lead">
              Kết hợp Starter Kit kiểm định sẵn cùng các mẫu web gốc từ MotionSites.ai — tự động đổi bộ mẫu ngẫu nhiên mỗi lần tải trang và sau mỗi 2 phút ({mins}:{secs}).
            </p>
          </div>
          <div className="lp-head-actions">
            <button
              type="button"
              className="btn btn-line btn-sm"
              onClick={rotateMotionBatch}
              title="Đổi ngẫu nhiên bộ mẫu MotionSites.ai ngay"
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span>Đổi mẫu MotionSites ({mins}:{secs})</span>
            </button>
          </div>
        </div>

        <div className="lp-proj-grid">
          {motionBatch.map((item, idx) => (
            <MotionSiteCard
              key={item.id}
              item={item}
              index={idx}
              onOpen={() => onNavigate('explore')}
              onLaunchPrompt={() => void launchPromptToWorkspace(item.promptText || item.title)}
            />
          ))}
          {STARTER_PROJECTS.slice(0, 3).map((item, idx) => (
            <ProjectCard
              key={item.id}
              item={item}
              index={motionBatch.length + idx}
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
