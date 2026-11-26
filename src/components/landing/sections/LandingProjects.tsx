import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DimensionView } from '../../../types/index';
import { HOME_MOTION_SHOWCASES, type HomeMotionShowcaseItem } from '../../../data/homeMotionShowcases';
import { MOTION_MARQUEE_ITEMS, type MotionMarqueeItem } from '../../../data/motionShowcaseCatalog';
import { useAppStore } from '../../../store/appStore';
import { IconRefreshCw } from '../../../ui/icons';
import { Mark } from '../../../ui/Mark';
import { DEFAULT_CLUB_COVER, handleImageError, handleVideoError } from '../../../utils/mediaFallback';
import { PROJECT_SHOWCASE_THUMBS } from '../landingContent';
import { useInView, usePrefersReducedMotion } from '../useLandingMotion';
import { StarterLiveStage } from './StarterLiveStage';

interface LandingProjectsProps {
  onNavigate: (view: DimensionView) => void;
}

const STARTER_PROJECTS = HOME_MOTION_SHOWCASES.filter((item) => item.id in PROJECT_SHOWCASE_THUMBS);
const ROTATE_INTERVAL_MS = 120_000;
const MOTION_SAMPLE_COUNT = 6;

const EXPLORE_ID_MAP: Record<string, string> = {
  'hms-space-voyage': 'space-voyage',
  'hms-codenest': 'codenest-hero',
  'hms-stellar-ai-v2': 'stellar-ai-hero',
};

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

const ProjectCard = React.memo<{
  item: HomeMotionShowcaseItem;
  index: number;
  onOpen: () => void;
  onLive: () => void;
}>(({ item, index, onOpen, onLive }) => (
  <article className="lp-proj-card">
    <div className="lp-proj-media">
      <span className="lp-proj-index">{String(index + 1).padStart(2, '0')}</span>
      <div className="lp-plate-fallback lp-proj-fallback" aria-hidden="true">
        <span>Starter Kit</span>
        <strong>{item.title}</strong>
      </div>
      <StarterLiveStage item={item} />
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
        <button type="button" className="btn btn-accent btn-sm" data-card-trigger onClick={onOpen}>
          Khám phá
        </button>
        <button type="button" className="btn btn-line btn-sm" data-card-trigger onClick={onLive}>
          Live View
        </button>
      </div>
    </div>
  </article>
));

const MotionSiteCard = React.memo<{
  item: MotionMarqueeItem;
  index: number;
  reduced: boolean;
  onOpen: () => void;
  onLaunchPrompt: () => void;
}>(({ item, index, reduced, onOpen, onLaunchPrompt }) => {
  const mediaUrl = item.videoUrl || item.imageUrl;
  const showVideo = Boolean(item.videoUrl) && isVideoAsset(item.videoUrl);
  const { ref: cardRef, inView } = useInView<HTMLElement>({
    once: false,
    threshold: 0.05,
    rootMargin: '0px',
  });
  const shouldPlay = inView && !reduced;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !showVideo) return;
    if (shouldPlay) {
      vid.muted = true;
      const playPromise = vid.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    } else {
      vid.pause();
    }
  }, [shouldPlay, showVideo]);

  return (
    <article ref={cardRef} className="lp-proj-card">
      <div className="lp-proj-media">
        <span className="lp-proj-index">{String(index + 1).padStart(2, '0')}</span>
        <div className="lp-plate-fallback lp-proj-fallback" aria-hidden="true">
          <span>MotionSites.ai</span>
          <strong>{item.title}</strong>
        </div>
        {showVideo ? (
          <video
            ref={videoRef}
            className="lp-proj-img"
            src={item.videoUrl}
            poster={item.imageUrl || undefined}
            loop
            muted
            playsInline
            preload={shouldPlay ? 'metadata' : 'none'}
            onError={(e) => handleVideoError(e, item.imageUrl || undefined)}
          />
        ) : (
          <img
            className="lp-proj-img"
            src={mediaUrl}
            alt={`Mẫu MotionSites.ai ${item.title}`}
            loading="eager"
            decoding="async"
            onLoad={(e) => {
              delete e.currentTarget.dataset.failed;
            }}
            onError={(e) => {
              e.currentTarget.dataset.failed = 'true';
              handleImageError(e, DEFAULT_CLUB_COVER);
            }}
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
          <button type="button" className="btn btn-accent btn-sm" data-card-trigger onClick={onOpen}>
            Khám phá
          </button>
          <button type="button" className="btn btn-line btn-sm" data-card-trigger onClick={onLaunchPrompt}>
            Mở Workspace
          </button>
        </div>
      </div>
    </article>
  );
});

const RotationCountdown: React.FC<{ onRotate: () => void }> = React.memo(({ onRotate }) => {
  const [secondsLeft, setSecondsLeft] = useState(120);

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          onRotate();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(countdownTimer);
  }, [onRotate]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
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
          className="icon-btn"
          onClick={() => {
            onRotate();
            setSecondsLeft(120);
          }}
          aria-label="Đổi mẫu"
          title={`Đổi mẫu (${mins}:${secs})`}
        >
          <IconRefreshCw size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

export const LandingProjects: React.FC<LandingProjectsProps> = ({ onNavigate }) => {
  const reduced = usePrefersReducedMotion();
  const {
    projects,
    activeProjectId,
    createProject,
    selectProject,
    addWorkspaceFiles,
    navigate,
    openExperience,
    launchPromptToWorkspace,
  } = useAppStore();

  const pendingStarterRef = useRef<{
    projectId: string;
    files: Array<{ path: string; content: string; summary: string }>;
  } | null>(null);

  useEffect(() => {
    const pending = pendingStarterRef.current;
    if (!pending || activeProjectId !== pending.projectId) return;
    pendingStarterRef.current = null;
    addWorkspaceFiles(pending.files);
    navigate('workspace');
  }, [activeProjectId, addWorkspaceFiles, navigate]);

  const handleLiveStarter = useCallback(
    (item: HomeMotionShowcaseItem) => {
      if (pendingStarterRef.current) return;
      const existing = projects.find(
        (p) => !p.archived && p.attachedItems.some((attached) => attached.id === item.id)
      );
      if (existing) {
        selectProject(existing.id);
        navigate('workspace');
        return;
      }

      const created = createProject(item.title, item.summaryVi, [
        {
          id: item.id,
          kind: 'template',
          title: item.title,
          summary: item.summaryVi,
          tags: [item.category, item.motionConfig.pattern],
        },
      ]);

      pendingStarterRef.current = {
        projectId: created.id,
        files: item.files.map((file) => ({
          path: file.path,
          content: file.content,
          summary: `${item.title} (${file.path})`,
        })),
      };
    },
    [createProject, navigate, projects, selectProject]
  );

  const [motionBatch, setMotionBatch] = useState<MotionMarqueeItem[]>(() =>
    shuffleSample(MOTION_MARQUEE_ITEMS, MOTION_SAMPLE_COUNT)
  );

  const rotateMotionBatch = useCallback(() => {
    setMotionBatch(shuffleSample(MOTION_MARQUEE_ITEMS, MOTION_SAMPLE_COUNT));
  }, []);

  useEffect(
    () => () => {
      pendingStarterRef.current = null;
    },
    []
  );

  return (
    <section id="du-an" aria-label="Dự án thực chiến" className="lp-section sheet lp-sheet-lift">
      <div className="wrap-wide">
        <RotationCountdown onRotate={rotateMotionBatch} />

        <div className="lp-proj-grid">
          {motionBatch.map((item, idx) => (
            <MotionSiteCard
              key={item.id}
              item={item}
              index={idx}
              reduced={reduced}
              onOpen={() => onNavigate('explore')}
              onLaunchPrompt={() => void launchPromptToWorkspace(item.promptText || item.title)}
            />
          ))}
          {STARTER_PROJECTS.slice(0, 3).map((item, idx) => (
            <ProjectCard
              key={item.id}
              item={item}
              index={motionBatch.length + idx}
              onOpen={() => openExperience(EXPLORE_ID_MAP[item.id] ?? item.id)}
              onLive={() => handleLiveStarter(item)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingProjects;
