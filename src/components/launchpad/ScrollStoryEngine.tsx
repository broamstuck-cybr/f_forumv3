import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  BROAMSTUCK_REPOS,
  MARQUEE_ROW_1,
  MARQUEE_ROW_2,
  SOURCE_KNOWLEDGE_BREAKDOWN,
  type BroamstuckRepoShowcase,
} from '../../data/realShowcaseData';
import { Mark } from '../../ui/Mark';
import { Media, previewFor } from '../../ui/Media';
import { ScrollFillText } from '../../ui/ScrollFillText';
import { handleImageError } from '../../utils/mediaFallback';
import '../../styles/story.css';

export interface ScrollStoryEngineProps {
  onNavigate: (route: AppRoute) => void;
  onLaunchPrompt: (prompt: string) => Promise<void> | void;
  onOpenLeaderboard?: () => void;
}

const ARCHIVE_PARAGRAPH =
  'Mỗi mẫu trong kho tham chiếu đều mang tên thư viện, giấy phép gốc và bản xem thật. Bạn chọn mẫu trên bàn soi, mở thẳng vào Workspace, đối chiếu từng dòng khác biệt và kiểm chứng trong Live View trước khi mang đi.';

const RepoStackPlate: React.FC<{
  repo: BroamstuckRepoShowcase;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduced: boolean;
  onNavigate: (route: AppRoute) => void;
}> = ({ repo, index, total, progress, reduced, onNavigate }) => {
  const targetScale = 1 - (total - 1 - index) * 0.025;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);
  return (
    <div
      className="stry-slot"
      style={reduced ? undefined : { top: `calc(var(--nav-h) + ${16 + index * 18}px)` }}
    >
      <motion.article style={reduced ? undefined : { scale }} className="stry-card">
        <div>
          <div className="stry-card-top">
            <div>
              <p className="t-label">{repo.fullName}</p>
              <h3 className="t-title" style={{ fontSize: 'var(--text-2xl)', marginTop: 'var(--space-2)' }}>
                {repo.name}
              </h3>
            </div>
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Mở ${repo.name}`}
              className="icon-btn"
            >
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
          <p className="t-lead" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}>
            {repo.summaryVi}
          </p>
        </div>

        <div>
          <dl className="stry-card-metrics">
            {repo.metrics.slice(0, 3).map((metric) => (
              <div key={metric.label}>
                <dt className="t-label">{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
          <div className="hm-actions" style={{ marginTop: 'var(--space-4)' }}>
            <button type="button" className="btn btn-red btn-sm" onClick={() => onNavigate('workspace')}>
              Workspace
            </button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => onNavigate('explore')}>
              Khám phá
            </button>
          </div>
        </div>
      </motion.article>
    </div>
  );
};

export const ScrollStoryEngine: React.FC<ScrollStoryEngineProps> = ({
  onNavigate,
  onLaunchPrompt,
  onOpenLeaderboard,
}) => {
  const { reducedMotion, sourceCatalog } = useAppStore();
  const [osReduced, setOsReduced] = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  const reduced = reducedMotion || osReduced;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setOsReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const { scrollYProgress: marqueeProgress } = useScroll({
    target: marqueeRef,
    offset: ['start end', 'end start'],
  });

  const { scrollYProgress: stackProgress } = useScroll({
    target: stackRef,
    offset: ['start start', 'end end'],
  });

  const row1X = useTransform(marqueeProgress, [0, 1], [-140, 100]);
  const row2X = useTransform(marqueeProgress, [0, 1], [100, -140]);

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

  const catalogMediaItems = useMemo(
    () => sourceCatalog.filter((item) => previewFor(item.id) !== null).slice(0, 8),
    [sourceCatalog]
  );

  const featuredMotion = useMemo(() => MARQUEE_ROW_1.slice(0, 6).concat(MARQUEE_ROW_2.slice(0, 2)), []);
  const featuredRepos = useMemo(() => BROAMSTUCK_REPOS.slice(0, 3), []);

  return (
    <div className="stry">
      <section ref={marqueeRef} aria-label="Kho mẫu đang chuyển động" className="stry-band">
        <div className="wrap-wide">
          <div className="stry-head">
            <div className="stry-head-copy">
              <p className="t-label">kho tham chiếu chuyển động</p>
              <h2 className="t-title">
                Từ mẫu thật đến <Mark kind="underline">bản kiểm chứng</Mark>
              </h2>
              <p className="t-lead">
                Xem nhanh các chuyển động thực tế từ PinUI, ThreeUI và MotionSites; bấm một chạm để đưa vào Workspace.
              </p>
            </div>
            <div className="hm-actions">
              <button type="button" className="btn btn-line" onClick={() => onNavigate('explore')}>
                Bàn soi
              </button>
              <button type="button" className="btn btn-solid" onClick={openLeaderboard}>
                Xếp hạng
              </button>
            </div>
          </div>
        </div>

        <div className="stry-marquee">
          <motion.div
            style={reduced ? undefined : { x: row1X }}
            data-reduced={reduced ? 'true' : undefined}
            className="stry-row"
          >
            {catalogMediaItems.map((item) => {
              const preview = previewFor(item.id);
              return (
                <article key={item.id} className="stry-plate">
                  <div className="plate stry-media">
                    {preview && <Media preview={preview} title={item.title} />}
                  </div>
                  <div className="stry-plate-foot">
                    <div className="min-w-0">
                      <p className="stry-plate-title">{item.title}</p>
                      <p className="t-label">{item.sourceLibrary}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-line btn-sm"
                      onClick={() =>
                        void onLaunchPrompt(
                          `Dựng giao diện tham chiếu ${item.title} (${item.sourceLibrary}) tương thích 390px, 768px và 1440px.`
                        )
                      }
                    >
                      Dùng mẫu
                    </button>
                  </div>
                </article>
              );
            })}
          </motion.div>

          <motion.div
            style={reduced ? undefined : { x: row2X }}
            data-reduced={reduced ? 'true' : undefined}
            className="stry-row"
          >
            {featuredMotion.map((item) => (
              <article key={item.id} className="stry-plate">
                <div className="plate stry-media">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => handleImageError(e, item.fallbackUrl)}
                  />
                </div>
                <div className="stry-plate-foot">
                  <div className="min-w-0">
                    <p className="stry-plate-title">{item.title}</p>
                    <p className="t-label">{item.category}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() =>
                      void onLaunchPrompt(
                        `Xây dựng giao diện lấy cảm hứng từ ${item.title} (${item.category}) với Live View cô lập và Diff & Check.`
                      )
                    }
                  >
                    Dùng mẫu
                  </button>
                </div>
              </article>
            ))}
          </motion.div>
        </div>
      </section>

      <section aria-label="Nguyên tắc kiểm chứng" className="stry-band">
        <div className="wrap">
          <p className="t-label">6.770 thành phần chuẩn hóa</p>
          <ScrollFillText text={ARCHIVE_PARAGRAPH} className="stry-fill" />
        </div>
      </section>

      <section aria-label="Năm thư viện tham chiếu" className="stry-band sheet scene-paper">
        <div className="wrap-wide">
          <div className="stry-head">
            <div className="stry-head-copy">
              <p className="t-label">source of knowledge archive</p>
              <h2 className="t-title">Năm thư viện nguồn trên bàn soi</h2>
            </div>
            <button type="button" className="btn btn-solid" onClick={() => onNavigate('explore')}>
              Mở bàn soi
            </button>
          </div>

          <ul className="stry-libs">
            {SOURCE_KNOWLEDGE_BREAKDOWN.libraries.map((lib) => (
              <li key={lib.library} className="stry-lib-row">
                <span className="stry-lib-name">{lib.label}</span>
                <div className="stry-lib-meta">
                  <span>{lib.extraLabel}</span>
                  <span className="t-label">{lib.license}</span>
                </div>
                <span className="stry-lib-count">{lib.count.toLocaleString('vi-VN')}</span>
                <a
                  href={lib.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Mở ${lib.label}`}
                  className="icon-btn"
                >
                  <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="Kho mã cốt lõi" className="stry-band">
        <div className="wrap-wide">
          <div className="stry-head">
            <div className="stry-head-copy">
              <p className="t-label">kho mã nguồn gốc</p>
              <h2 className="t-title">Ba hệ thống nền tảng</h2>
            </div>
            <button type="button" className="btn btn-line" onClick={openLeaderboard}>
              Xem repo
            </button>
          </div>

          <div ref={stackRef} className="stry-stack">
            {featuredRepos.map((repo, idx) => (
              <RepoStackPlate
                key={repo.id}
                repo={repo}
                index={idx}
                total={featuredRepos.length}
                progress={stackProgress}
                reduced={reduced}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollStoryEngine;
