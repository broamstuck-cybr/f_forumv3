import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  BROAMSTUCK_REPOS,
  MARQUEE_ROW_1,
  STACKING_PROJECTS,
} from '../../data/realShowcaseData';
import { handleImageError } from '../../utils/mediaFallback';
import '../../styles/story.css';

export interface ScrollStoryEngineProps {
  onNavigate: (route: AppRoute) => void;
  onLaunchPrompt: (prompt: string) => Promise<void> | void;
  onOpenLeaderboard?: () => void;
}

export const ScrollStoryEngine: React.FC<ScrollStoryEngineProps> = ({
  onNavigate,
  onLaunchPrompt,
  onOpenLeaderboard,
}) => {
  const { reducedMotion } = useAppStore();
  const [osReduced, setOsReduced] = useState(false);
  const [activeChapter, setActiveChapter] = useState<0 | 1 | 2>(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const reduced = reducedMotion || osReduced;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setOsReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  useEffect(() => {
    if (reduced) return;
    return scrollYProgress.on('change', (v) => {
      if (v < 0.34) setActiveChapter(0);
      else if (v < 0.68) setActiveChapter(1);
      else setActiveChapter(2);
    });
  }, [scrollYProgress, reduced]);

  const railX = useTransform(scrollYProgress, [0, 1], [120, -560]);
  const repoScale = useTransform(scrollYProgress, [0.35, 0.85], [0.96, 1]);
  const repoOpacity = useTransform(scrollYProgress, [0.25, 0.6], [0.55, 1]);

  const openLeaderboard = () => {
    if (onOpenLeaderboard) {
      onOpenLeaderboard();
      return;
    }
    try {
      window.sessionStorage.setItem('ff_explore_mode', 'leaderboard');
    } catch {
      void 0;
    }
    window.dispatchEvent(new CustomEvent('ff:explore-mode', { detail: 'leaderboard' }));
    onNavigate('explore');
  };

  const featuredVisuals = useMemo(() => MARQUEE_ROW_1.slice(0, 6), []);
  const featuredRepos = useMemo(() => BROAMSTUCK_REPOS.slice(0, 3), []);

  const jumpToStage = (stage: 0 | 1 | 2) => {
    setActiveChapter(stage);
    if (!trackRef.current || typeof window === 'undefined') return;
    const rect = trackRef.current.getBoundingClientRect();
    const startTop = rect.top + window.scrollY - 64;
    const span = Math.max(1, trackRef.current.offsetHeight - window.innerHeight);
    const ratios: Record<0 | 1 | 2, number> = { 0: 0.05, 1: 0.45, 2: 0.85 };
    window.scrollTo({
      top: startTop + span * ratios[stage],
      behavior: reduced ? 'auto' : 'smooth',
    });
  };

  if (reduced) {
    return (
      <section aria-label="Hệ sinh thái thực chiến F-Forum" className="ff-story-root">
        <div className="ff-container ff-story-static">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                className="m-0 text-[26px] sm:text-[34px] font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Mẫu thật từ MotionSites &amp; SOURCEOFKNOWLEDGFORAI
              </h2>
              <p className="mt-2 max-w-2xl text-[14.5px]" style={{ color: 'var(--ink-secondary)' }}>
                6.770 thành phần chuẩn hóa cùng bản dựng chạy trong Live View cô lập và Diff &amp; Check.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className="rounded-full border px-4 py-2 text-[12.5px] font-medium cursor-pointer"
                style={{
                  borderColor: 'var(--border-strong)',
                  background: 'var(--bg-surface)',
                  color: 'var(--ink-primary)',
                }}
              >
                Khám phá
              </button>
              <button
                type="button"
                onClick={openLeaderboard}
                className="rounded-full border-0 px-4 py-2 text-[12.5px] font-semibold cursor-pointer"
                style={{ background: 'var(--accent-gradient)', color: 'var(--ink-inverse)' }}
              >
                Xếp hạng
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredVisuals.map((item) => (
              <article key={item.id} className="ff-story-specimen-card w-full">
                <div className="aspect-[16/10] w-full overflow-hidden bg-[#0b0d14]">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => handleImageError(e, item.fallbackUrl)}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold">{item.title}</div>
                    <div className="text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                      MotionSites · {item.category}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void onLaunchPrompt(
                        `Xây dựng giao diện lấy cảm hứng từ ${item.title} (${item.category}) với Live View cô lập và Diff & Check.`
                      )
                    }
                    className="rounded-full border px-3 py-1.5 text-[11.5px] font-medium cursor-pointer"
                    style={{
                      borderColor: 'var(--border-accent)',
                      background: 'var(--accent-soft)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    Dùng ngay
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Hành trình thực chiến F-Forum" className="ff-story-root">
      <div ref={trackRef} className="ff-story-track">
        <div className="ff-story-sticky">
          <div className="ff-story-backdrop" aria-hidden="true" />
          <div className="ff-story-grid" aria-hidden="true" />

          <div className="ff-container relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
                6.770 THÀNH PHẦN · 12 CHƯƠNG SHOPIFY WINTER · MOTION THẬT
              </div>
              <h2
                className="mt-1 m-0 text-[24px] sm:text-[34px] font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Từ mẫu thực tế đến Workspace kiểm định
              </h2>
            </div>

            <nav aria-label="Chuyển nhịp trình diễn" className="ff-story-rail">
              {(
                [
                  [0, 'Mẫu thật'],
                  [1, 'Kho mã'],
                  [2, 'Kiểm định'],
                ] as const
              ).map(([idx, label]) => (
                <button
                  key={idx}
                  type="button"
                  data-active={activeChapter === idx}
                  onClick={() => jumpToStage(idx)}
                  className="ff-story-rail-btn"
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="relative z-10 w-full overflow-hidden py-4">
            <motion.div style={{ x: railX }} className="flex w-max gap-5 px-6 sm:px-12">
              {featuredVisuals.map((item) => (
                <article key={item.id} className="ff-story-specimen-card">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[#0b0d14]">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => handleImageError(e, item.fallbackUrl)}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold">{item.title}</div>
                      <div className="mt-0.5 font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                        {item.category}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void onLaunchPrompt(
                          `Dựng giao diện lấy cảm hứng từ ${item.title} (${item.category}) tuân thủ Live View và Diff & Check.`
                        )
                      }
                      className="rounded-full border px-3 py-1.5 text-[11.5px] font-medium cursor-pointer shrink-0"
                      style={{
                        borderColor: 'var(--border-accent)',
                        background: 'var(--accent-soft)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      Dùng ngay
                    </button>
                  </div>
                </article>
              ))}
            </motion.div>
          </div>

          <motion.div
            style={{ scale: repoScale, opacity: repoOpacity }}
            className="ff-container relative z-10"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {featuredRepos.map((repo, idx) => {
                const projectMeta = STACKING_PROJECTS[idx];
                return (
                  <article
                    key={repo.id}
                    className="rounded-2xl border p-4 flex flex-col justify-between gap-3"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-strong)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[10.5px]" style={{ color: 'var(--accent-primary)' }}>
                          {projectMeta?.category ?? repo.language}
                        </div>
                        <h3 className="mt-1 m-0 truncate text-[15px] font-semibold">
                          {repo.name}
                        </h3>
                      </div>
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Mở ${repo.name}`}
                        title={`Mở ${repo.name}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-secondary)',
                        }}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>

                    <p className="m-0 text-[12.5px] leading-relaxed line-clamp-2" style={{ color: 'var(--ink-secondary)' }}>
                      {repo.summaryVi}
                    </p>

                    <div className="flex items-center justify-between border-t pt-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                      <span className="font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                        {repo.metrics[0]?.label}: {repo.metrics[0]?.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('explore')}
                        className="rounded-full border-0 bg-transparent p-0 text-[12px] font-medium cursor-pointer"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        Khám phá
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="ff-story-manifesto-band py-10">
        <div className="ff-container flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="font-mono text-[11px] text-[#c89b54]">
              DIFF &amp; CHECK · LIVE VIEW
            </div>
            <p
              className="mt-1.5 m-0 text-[17px] sm:text-[21px] font-semibold text-[#f4f1ea]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Mọi sản phẩm trên F-Forum đều đi qua kiểm chứng trực quan trước khi bàn giao.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="rounded-full border-0 px-5 py-2.5 text-[13px] font-semibold cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #e5c384 0%, #c89b54 100%)',
                color: '#090a0d',
              }}
            >
              Workspace
            </button>
            <button
              type="button"
              onClick={openLeaderboard}
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-[13px] font-medium text-[#f4f1ea] cursor-pointer"
            >
              Xếp hạng
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollStoryEngine;
