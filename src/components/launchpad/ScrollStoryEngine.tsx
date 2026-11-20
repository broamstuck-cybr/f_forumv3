import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  HOME_MOTION_SHOWCASES,
  type HomeMotionShowcaseFile,
  type HomeMotionShowcaseItem,
} from '../../data/homeMotionShowcases';
import { Mark } from '../../ui/Mark';
import '../../styles/story.css';

export interface ScrollStoryEngineProps {
  onNavigate: (route: AppRoute) => void;
  onLaunchPrompt: (prompt: string) => Promise<void> | void;
  onOpenShowcase?: (item: HomeMotionShowcaseItem) => void;
  onOpenLeaderboard?: () => void;
}

function buildShowcaseSrcDoc(files: HomeMotionShowcaseFile[]): string {
  const htmlFile = files.find((f) => f.path === 'index.html') ?? files.find((f) => f.language === 'html');
  const cssCode = files
    .filter((f) => f.language === 'css')
    .map((f) => f.content)
    .join('\n');
  const jsCode = files
    .filter((f) => f.language === 'javascript')
    .map((f) => f.content)
    .join('\n');

  const cspMeta =
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data: https:; font-src data: https:;" />';

  let doc = htmlFile
    ? htmlFile.content
    : '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>';

  doc = doc
    .replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<script[^>]+src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '');

  const headInject = `${cspMeta}<style>${cssCode}</style>`;
  if (/<\/head>/i.test(doc)) {
    doc = doc.replace(/<\/head>/i, `${headInject}</head>`);
  } else {
    doc = `${headInject}${doc}`;
  }

  if (jsCode.trim()) {
    const scriptInject = `<script>${jsCode}</script>`;
    if (/<\/body>/i.test(doc)) {
      doc = doc.replace(/<\/body>/i, `${scriptInject}</body>`);
    } else {
      doc = `${doc}${scriptInject}`;
    }
  }

  return doc;
}

const ShowcaseImage: React.FC<{
  item: HomeMotionShowcaseItem;
  className?: string;
  priority?: boolean;
}> = ({ item, className = '', priority = false }) => {
  const [gifLoaded, setGifLoaded] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const loadingMode = priority ? 'eager' : 'lazy';

  return (
    <div className={`stry-img-stack ${className}`}>
      {posterFailed ? (
        <div className="stry-img-plate" role="img" aria-label={item.title}>
          <span className="t-label">{item.category}</span>
          <strong className="stry-img-plate-title">{item.title}</strong>
          <span className="t-label">{item.motionConfig.pattern}</span>
        </div>
      ) : (
        <img
          className="stry-img-poster"
          src={item.fallbackUrl}
          alt=""
          aria-hidden="true"
          loading={loadingMode}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setPosterFailed(true)}
        />
      )}
      {!gifFailed && (
        <img
          className="stry-img-gif"
          src={item.gifUrl}
          alt={`${item.title}, ${item.category}`}
          loading={loadingMode}
          decoding="async"
          referrerPolicy="no-referrer"
          data-loaded={gifLoaded ? 'true' : undefined}
          onLoad={() => setGifLoaded(true)}
          onError={() => setGifFailed(true)}
        />
      )}
    </div>
  );
};

const MotionTelemetry: React.FC<{ item: HomeMotionShowcaseItem; compact?: boolean }> = ({
  item,
  compact = false,
}) => (
  <dl className={compact ? 'stry-telemetry stry-telemetry--compact' : 'stry-telemetry'}>
    <div>
      <dt className="t-label">mẫu nhịp</dt>
      <dd>{item.motionConfig.pattern}</dd>
    </div>
    <div>
      <dt className="t-label">đường cong</dt>
      <dd>{item.motionConfig.easing}</dd>
    </div>
    <div>
      <dt className="t-label">thời lượng</dt>
      <dd>{item.motionConfig.durationMs} ms</dd>
    </div>
    <div>
      <dt className="t-label">giảm chuyển động</dt>
      <dd>{item.motionConfig.reducedFallback}</dd>
    </div>
  </dl>
);

const ShowcaseActions: React.FC<{
  item: HomeMotionShowcaseItem;
  onOpenWorkspace: (item: HomeMotionShowcaseItem) => void;
  onInspect: (item: HomeMotionShowcaseItem) => void;
}> = ({ item, onOpenWorkspace, onInspect }) => (
  <div className="stry-actions">
    <button type="button" className="btn btn-red btn-sm" onClick={() => onOpenWorkspace(item)}>
      Mở Workspace
    </button>
    <button type="button" className="btn btn-line btn-sm" onClick={() => onInspect(item)}>
      Soi mẫu
    </button>
    <a
      href={item.liveUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Mở tham chiếu ${item.title}`}
      className="icon-btn"
    >
      <ArrowUpRight size={17} aria-hidden="true" />
    </a>
  </div>
);

export const ScrollStoryEngine: React.FC<ScrollStoryEngineProps> = ({
  onNavigate,
  onLaunchPrompt,
  onOpenShowcase,
  onOpenLeaderboard,
}) => {
  const { reducedMotion } = useAppStore();
  const [osReduced, setOsReduced] = useState(false);

  const [modalItem, setModalItem] = useState<HomeMotionShowcaseItem | null>(null);
  const [modalTab, setModalTab] = useState<'preview' | 'html' | 'css' | 'js'>('preview');

  const [s1Mode, setS1Mode] = useState<'live' | 'preview'>('live');
  const [s4Mode, setS4Mode] = useState<'live' | 'spec'>('live');
  const [s5Paused, setS5Paused] = useState(false);
  const [s6Tilt, setS6Tilt] = useState(14);
  const [s7Lang, setS7Lang] = useState<'html' | 'css' | 'javascript'>('html');

  const s1StageRef = useRef<HTMLDivElement>(null);
  const s3BandRef = useRef<HTMLElement>(null);
  const s8BandRef = useRef<HTMLElement>(null);
  const s8SpotRef = useRef<HTMLDivElement>(null);

  const reduced = reducedMotion || osReduced;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setOsReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!modalItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalItem]);

  const { scrollYProgress: s3Progress } = useScroll({
    target: s3BandRef,
    offset: ['start end', 'end start'],
  });
  const s3Scale = useTransform(s3Progress, [0, 0.5, 1], [0.91, 1, 0.97]);

  const { scrollYProgress: s8Progress } = useScroll({
    target: s8BandRef,
    offset: ['start end', 'end start'],
  });
  const s8Drift = useTransform(s8Progress, [0, 1], [-22, 22]);

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

  const inspectShowcase = (item: HomeMotionShowcaseItem) => {
    try {
      window.sessionStorage.setItem('ff_explore_mode', 'plates');
      window.sessionStorage.setItem('ff_explore_showcase_id', item.id);
    } catch {
      void 0;
    }
    window.dispatchEvent(new CustomEvent('ff:explore-mode', { detail: 'plates' }));
    onNavigate('explore');
  };

  const openWorkspace = (item: HomeMotionShowcaseItem) => {
    if (onOpenShowcase) {
      onOpenShowcase(item);
      return;
    }
    void onLaunchPrompt(
      `Xây dựng giao diện ${item.title} (${item.category}) theo nhịp ${item.motionConfig.pattern}, tương thích 390px, 768px và 1440px.`
    );
  };

  const openPlates = () => {
    try {
      window.sessionStorage.setItem('ff_explore_mode', 'plates');
    } catch {
      void 0;
    }
    window.dispatchEvent(new CustomEvent('ff:explore-mode', { detail: 'plates' }));
    onNavigate('explore');
  };

  const handleS1PointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || !s1StageRef.current) return;
    const rect = s1StageRef.current.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ry = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    s1StageRef.current.style.setProperty('--sp-x', rx.toFixed(3));
    s1StageRef.current.style.setProperty('--sp-y', ry.toFixed(3));
  };

  const handleS1PointerLeave = () => {
    if (!s1StageRef.current) return;
    s1StageRef.current.style.setProperty('--sp-x', '0');
    s1StageRef.current.style.setProperty('--sp-y', '0');
  };

  const handleS8PointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || !s8SpotRef.current) return;
    const rect = s8SpotRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    s8SpotRef.current.style.setProperty('--lx-x', `${xPct.toFixed(1)}%`);
    s8SpotRef.current.style.setProperty('--lx-y', `${yPct.toFixed(1)}%`);
  };

  const [s1, s2, s3, s4, s5, s6, s7, s8] = HOME_MOTION_SHOWCASES;

  const s7File = s7 ? s7.files.find((f) => f.language === s7Lang) ?? s7.files[0] : undefined;

  return (
    <div className="stry">
      <section aria-label="Bộ sưu tập 8 mẫu chuyển động" className="stry-band stry-reel-head">
        <div className="wrap-wide">
          <div className="stry-head">
            <div className="stry-head-copy">
              <p className="t-label">8 bản mẫu tương tác · mã nguồn chạy thật</p>
              <h2 className="t-title">
                Từ nhịp cuộn đến <Mark kind="underline">bản chạy thử</Mark>
              </h2>
              <p className="t-lead">
                Mỗi bản mẫu đi kèm thông số easing, fallback giảm chuyển động và bộ tệp HTML, CSS, JS mở thẳng sang
                Workspace.
              </p>
            </div>
            <div className="stry-actions">
              <button type="button" className="btn btn-line" onClick={openPlates}>
                Bàn soi
              </button>
              <button type="button" className="btn btn-solid" onClick={openLeaderboard}>
                Xếp hạng
              </button>
            </div>
          </div>
        </div>
      </section>

      {s1 && (
        <section aria-label={s1.title} className="stry-band stry-s1-band">
          <div className="wrap-wide">
            <div
              ref={s1StageRef}
              className="stry-s1"
              onPointerMove={handleS1PointerMove}
              onPointerLeave={handleS1PointerLeave}
            >
              <div className="stry-s1-glow" aria-hidden="true" />
              <div className="stry-s1-reticle" aria-hidden="true" />
              <div className="stry-s1-copy">
                <div className="stry-kicker-row">
                  <span className="stry-num">01</span>
                  <span className="tag tag-red">{s1.category}</span>
                </div>
                <h3 className="stry-s-title">{s1.title}</h3>
                <p className="t-lead">{s1.summaryVi}</p>
                <MotionTelemetry item={s1} />
                <ShowcaseActions item={s1} onOpenWorkspace={openWorkspace} onInspect={inspectShowcase} />
              </div>

              <div className="stry-s1-stage">
                <div className="stry-s4-bar">
                  <span className="t-label">sân khấu chiều sâu</span>
                  <div className="stry-toggle-group" role="group" aria-label="Chế độ xem bản mẫu 01">
                    <button
                      type="button"
                      className="stry-toggle-btn"
                      aria-pressed={s1Mode === 'live'}
                      onClick={() => setS1Mode('live')}
                    >
                      Trực tiếp
                    </button>
                    <button
                      type="button"
                      className="stry-toggle-btn"
                      aria-pressed={s1Mode === 'preview'}
                      onClick={() => setS1Mode('preview')}
                    >
                      Bản quay
                    </button>
                  </div>
                </div>

                {s1Mode === 'live' ? (
                  <div className="stry-iframe-box">
                    <iframe
                      title={`Chạy thử ${s1.title}`}
                      srcDoc={buildShowcaseSrcDoc(s1.files)}
                      sandbox="allow-scripts"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="plate stry-media stry-s1-plate">
                    <ShowcaseImage item={s1} priority />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {s2 && (
        <section aria-label={s2.title} className="stry-band">
          <div className="wrap-wide">
            <div className="stry-s2">
              <div className="stry-s2-typo">
                <span className="stry-s2-index" aria-hidden="true">
                  02
                </span>
                <span className="tag">{s2.category}</span>
                <h3 className="stry-s-title">{s2.title}</h3>
                <p className="t-lead">{s2.summaryVi}</p>
                <MotionTelemetry item={s2} compact />
                <div className="stry-actions">
                  <button
                    type="button"
                    className="btn btn-solid btn-sm"
                    onClick={() => {
                      setModalItem(s2);
                      setModalTab('preview');
                    }}
                  >
                    Chạy thử
                  </button>
                  <button type="button" className="btn btn-red btn-sm" onClick={() => openWorkspace(s2)}>
                    Mở Workspace
                  </button>
                  <button type="button" className="btn btn-line btn-sm" onClick={() => inspectShowcase(s2)}>
                    Soi mẫu
                  </button>
                </div>
              </div>

              <div className="stry-s2-offset">
                <div className="plate stry-media stry-s2-media">
                  <ShowcaseImage item={s2} priority />
                </div>
                <div className="stry-s2-caption">
                  <span className="t-label">{s2.files.length} tệp nguồn</span>
                  <span className="t-label">{s2.motionConfig.pattern}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {s3 && (
        <section ref={s3BandRef} aria-label={s3.title} className="stry-band sheet scene-paper">
          <div className="wrap-wide">
            <div className="stry-s3-top">
              <div className="stry-s3-meta">
                <span className="stry-num">03</span>
                <span className="tag">{s3.category}</span>
                <h3 className="stry-s-title">{s3.title}</h3>
              </div>
              <ShowcaseActions item={s3} onOpenWorkspace={openWorkspace} onInspect={inspectShowcase} />
            </div>

            <motion.div style={reduced ? undefined : { scale: s3Scale }} className="stry-s3-strip">
              <div className="plate stry-s3-frame">
                <ShowcaseImage item={s3} priority />
              </div>
            </motion.div>

            <div className="stry-s3-foot">
              <p className="t-lead">{s3.summaryVi}</p>
              <MotionTelemetry item={s3} compact />
            </div>
          </div>
        </section>
      )}

      {s4 && (
        <section aria-label={s4.title} className="stry-band">
          <div className="wrap-wide">
            <div className="stry-s4">
              <div className="stry-s4-visual">
                <div className="stry-kicker-row">
                  <span className="stry-num">04</span>
                  <span className="tag tag-red">{s4.category}</span>
                </div>
                <h3 className="stry-s-title">{s4.title}</h3>
                <p className="t-lead">{s4.summaryVi}</p>
                <div className="plate stry-media">
                  <ShowcaseImage item={s4} />
                </div>
                <ShowcaseActions item={s4} onOpenWorkspace={openWorkspace} onInspect={inspectShowcase} />
              </div>

              <div className="stry-s4-deck">
                <div className="stry-s4-bar">
                  <span className="t-label">khung kiểm chứng song song</span>
                  <div className="stry-toggle-group" role="group" aria-label="Chế độ xem bản mẫu 04">
                    <button
                      type="button"
                      className="stry-toggle-btn"
                      aria-pressed={s4Mode === 'spec'}
                      onClick={() => setS4Mode('spec')}
                    >
                      Đặc tả
                    </button>
                    <button
                      type="button"
                      className="stry-toggle-btn"
                      aria-pressed={s4Mode === 'live'}
                      onClick={() => setS4Mode('live')}
                    >
                      Chạy thử
                    </button>
                  </div>
                </div>

                {s4Mode === 'live' ? (
                  <div className="stry-iframe-box">
                    <iframe
                      title={`Chạy thử ${s4.title}`}
                      srcDoc={buildShowcaseSrcDoc(s4.files)}
                      sandbox="allow-scripts"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="stry-s4-spec">
                    <MotionTelemetry item={s4} />
                    <ul className="stry-file-list">
                      {s4.files.map((file) => (
                        <li key={file.path} className="stry-file-item">
                          <span className="stry-file-name">{file.path}</span>
                          <span className="t-label">{file.content.length} ký tự</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {(s5 || s6) && (
        <section aria-label="Cặp trưng bày quỹ đạo và độ nghiêng" className="stry-band">
          <div className="wrap-wide">
            <div className="stry-s56">
              {s5 && (
                <article className="stry-s5-card">
                  <div className="stry-kicker-row">
                    <span className="stry-num">05</span>
                    <span className="tag">{s5.category}</span>
                    <button
                      type="button"
                      className="btn btn-line btn-sm"
                      onClick={() => setS5Paused((p) => !p)}
                    >
                      {s5Paused ? 'Tiếp tục' : 'Tạm dừng'}
                    </button>
                  </div>
                  <h3 className="stry-s-title">{s5.title}</h3>
                  <p className="t-lead">{s5.summaryVi}</p>

                  <div className="stry-s5-stage">
                    <div className="plate stry-media">
                      <ShowcaseImage item={s5} />
                    </div>
                    <div
                      className="stry-s5-orbit"
                      data-paused={s5Paused || reduced ? 'true' : undefined}
                      aria-hidden="true"
                    >
                      <span className="stry-s5-node">HTML</span>
                      <span className="stry-s5-node">CSS</span>
                      <span className="stry-s5-node">JS</span>
                    </div>
                  </div>

                  <MotionTelemetry item={s5} compact />
                  <ShowcaseActions item={s5} onOpenWorkspace={openWorkspace} onInspect={inspectShowcase} />
                </article>
              )}

              {s6 && (
                <article className="stry-s6-card">
                  <div className="stry-kicker-row">
                    <span className="stry-num">06</span>
                    <span className="tag">{s6.category}</span>
                  </div>
                  <h3 className="stry-s-title">{s6.title}</h3>
                  <p className="t-lead">{s6.summaryVi}</p>

                  <div className="stry-s6-stage">
                    <div className="plate stry-media">
                      <ShowcaseImage item={s6} />
                    </div>
                    <div className="stry-s6-ctl">
                      <label htmlFor="stry-s6-range" className="t-label">
                        góc nghiêng {s6Tilt} deg
                      </label>
                      <input
                        id="stry-s6-range"
                        type="range"
                        min={-28}
                        max={28}
                        value={s6Tilt}
                        onChange={(e) => setS6Tilt(Number(e.target.value))}
                      />
                      <span
                        className="stry-s6-ring"
                        style={{ transform: `rotate(${s6Tilt}deg)` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <MotionTelemetry item={s6} compact />
                  <ShowcaseActions item={s6} onOpenWorkspace={openWorkspace} onInspect={inspectShowcase} />
                </article>
              )}
            </div>
          </div>
        </section>
      )}

      {s7 && (
        <section aria-label={s7.title} className="stry-band sheet scene-paper">
          <div className="wrap-wide">
            <div className="stry-s7">
              <div className="stry-s7-side">
                <div className="stry-kicker-row">
                  <span className="stry-num">07</span>
                  <span className="tag">{s7.category}</span>
                </div>
                <h3 className="stry-s-title">{s7.title}</h3>
                <p className="t-lead">{s7.summaryVi}</p>

                <div className="stry-s7-thumb-row">
                  <div className="plate stry-media stry-s7-thumb">
                    <ShowcaseImage item={s7} />
                  </div>
                </div>

                <div className="stry-s7-codebox">
                  <div className="stry-toggle-group" role="tablist" aria-label="Tệp mã nguồn bản mẫu 07">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={s7Lang === 'html'}
                      className="stry-toggle-btn"
                      onClick={() => setS7Lang('html')}
                    >
                      HTML
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={s7Lang === 'css'}
                      className="stry-toggle-btn"
                      onClick={() => setS7Lang('css')}
                    >
                      CSS
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={s7Lang === 'javascript'}
                      className="stry-toggle-btn"
                      onClick={() => setS7Lang('javascript')}
                    >
                      JS
                    </button>
                  </div>
                  {s7File && (
                    <pre className="stry-code-pre ff-scrollbar">
                      <code>{s7File.content}</code>
                    </pre>
                  )}
                </div>

                <MotionTelemetry item={s7} compact />
                <ShowcaseActions item={s7} onOpenWorkspace={openWorkspace} onInspect={inspectShowcase} />
              </div>

              <div className="stry-s7-deck">
                <div className="stry-iframe-box stry-iframe-box--tall">
                  <iframe
                    title={`Bàn chạy trực tiếp ${s7.title}`}
                    srcDoc={buildShowcaseSrcDoc(s7.files)}
                    sandbox="allow-scripts"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {s8 && (
        <section ref={s8BandRef} aria-label={s8.title} className="stry-band">
          <div className="wrap-wide">
            <motion.div style={reduced ? undefined : { x: s8Drift }} className="stry-s8-wrap">
              <div
                ref={s8SpotRef}
                className="stry-s8"
                onPointerMove={handleS8PointerMove}
              >
                <div className="stry-s8-spot" aria-hidden="true" />
                <div className="stry-s8-copy">
                  <div className="stry-kicker-row">
                    <span className="stry-num">08</span>
                    <span className="tag tag-red">{s8.category}</span>
                  </div>
                  <h3 className="stry-s-title">{s8.title}</h3>
                  <p className="t-lead">{s8.summaryVi}</p>
                  <MotionTelemetry item={s8} />
                  <ShowcaseActions item={s8} onOpenWorkspace={openWorkspace} onInspect={inspectShowcase} />
                </div>

                <div className="stry-s8-media">
                  <div className="plate stry-media">
                    <ShowcaseImage item={s8} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {modalItem && (
        <div
          className="stry-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalItem(null);
          }}
        >
          <div
            className="stry-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Chạy thử ${modalItem.title}`}
          >
            <div className="stry-modal-head">
              <div>
                <p className="t-label">{modalItem.category}</p>
                <h3 className="stry-modal-title">{modalItem.title}</h3>
              </div>
              <div className="stry-actions">
                <button
                  type="button"
                  className="btn btn-red btn-sm"
                  onClick={() => {
                    const target = modalItem;
                    setModalItem(null);
                    openWorkspace(target);
                  }}
                >
                  Mở Workspace
                </button>
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  onClick={() => setModalItem(null)}
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="stry-modal-tabs" role="tablist" aria-label="Chế độ hộp chạy thử">
              <button
                type="button"
                role="tab"
                aria-selected={modalTab === 'preview'}
                className="stry-toggle-btn"
                onClick={() => setModalTab('preview')}
              >
                Chạy thử
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={modalTab === 'html'}
                className="stry-toggle-btn"
                onClick={() => setModalTab('html')}
              >
                HTML
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={modalTab === 'css'}
                className="stry-toggle-btn"
                onClick={() => setModalTab('css')}
              >
                CSS
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={modalTab === 'js'}
                className="stry-toggle-btn"
                onClick={() => setModalTab('js')}
              >
                JS
              </button>
            </div>

            {modalTab === 'preview' ? (
              <div className="stry-iframe-box stry-iframe-box--modal">
                <iframe
                  title={`Hộp chạy ${modalItem.title}`}
                  srcDoc={buildShowcaseSrcDoc(modalItem.files)}
                  sandbox="allow-scripts"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <pre className="stry-code-pre stry-code-pre--modal ff-scrollbar">
                <code>
                  {modalItem.files.find((f) =>
                    modalTab === 'js' ? f.language === 'javascript' : f.language === modalTab
                  )?.content ?? ''}
                </code>
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrollStoryEngine;
