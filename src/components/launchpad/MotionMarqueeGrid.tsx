import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MOTION_MARQUEE_ITEMS,
  type MotionMarqueeItem,
  type MotionMarqueeRow,
} from '../../data/motionShowcaseCatalog';
import { SandboxPreview } from '../../features/explore/SandboxPreview';
import type { PreviewViewport } from '../../features/explore/catalog';
import { useAppStore } from '../../store/appStore';

export interface MotionMarqueeGridProps {
  onLaunchPrompt: (prompt: string) => Promise<void> | void;
  reduced?: boolean;
}

interface MotionSiteFullRecord {
  id: string;
  slug: string;
  title: string;
  category: string;
  promptText: string;
  liveHtml: string;
  tags: string[];
}

type ModalTab = 'live' | 'prompt' | 'specs';

const ROWS: readonly MotionMarqueeRow[] = [0, 1, 2, 3];

let cachedMotionSites: Record<string, MotionSiteFullRecord> | null = null;
let motionSitesPromise: Promise<Record<string, MotionSiteFullRecord>> | null = null;

function loadMotionSitesFull(): Promise<Record<string, MotionSiteFullRecord>> {
  if (cachedMotionSites) return Promise.resolve(cachedMotionSites);
  if (motionSitesPromise) return motionSitesPromise;
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return Promise.resolve({});
  }
  motionSitesPromise = fetch('/data/motionsites-full.json')
    .then((res) => (res.ok ? res.json() : { items: {} }))
    .then((data: { items?: Record<string, MotionSiteFullRecord> }) => {
      cachedMotionSites = data.items ?? {};
      return cachedMotionSites;
    })
    .catch(() => {
      motionSitesPromise = null;
      return {};
    });
  return motionSitesPromise;
}

function prepareLiveDocument(
  liveHtml: string | undefined,
  posterUrl: string,
  isThumb: boolean
): { html: string; css: string } {
  const safePoster = posterUrl.replace(/"/g, '&quot;');
  if (!liveHtml) {
    return {
      html: `<div class="mmq-fallback-stage" style="width:100%;height:100vh;background-image:url('${safePoster}');background-size:cover;background-position:center;"></div>`,
      css: 'html,body{display:block!important;padding:0!important;margin:0!important;width:100%!important;height:100vh!important;overflow:hidden!important;}',
    };
  }
  const styleMatch = liveHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const bodyMatch = liveHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const rawBody = (bodyMatch ? bodyMatch[1] : liveHtml)
    .replace(/poster=""/g, `poster="${safePoster}"`)
    .replace(/'Be Vietnam Pro',\s*/g, '');
  const rawStyle = (styleMatch ? styleMatch[1] : '').replace(/'Be Vietnam Pro',\s*/g, '');
  const overflowRule = isThumb ? 'overflow:hidden!important;' : 'overflow-x:hidden!important;';
  const resetCss = `html,body{display:block!important;place-items:unset!important;padding:0!important;margin:0!important;width:100%!important;min-height:100vh!important;${overflowRule}}.bg-media{background-image:url("${safePoster}");background-size:cover;background-position:center;}`;
  return {
    html: rawBody,
    css: `${rawStyle}\n${resetCss}`,
  };
}

const MarqueeThumb: React.FC<{
  item: MotionMarqueeItem;
  liveHtml?: string;
  enableLive?: boolean;
  className?: string;
}> = ({ item, liveHtml, enableLive = true, className = '' }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [plateOnly, setPlateOnly] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enableLive || !hostRef.current || typeof IntersectionObserver === 'undefined') return;
    const el = hostRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { rootMargin: '60px', threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enableLive]);

  const src = useFallback ? item.fallbackUrl : item.imageUrl;
  const prepared = useMemo(
    () => (inView && liveHtml ? prepareLiveDocument(liveHtml, src, true) : null),
    [inView, liveHtml, src]
  );

  return (
    <div ref={hostRef} className={`mmq-thumb-host ${className}`.trim()}>
      {(!loaded || plateOnly) && (
        <div className="mmq-thumb-plate" role={plateOnly ? 'img' : undefined} aria-label={plateOnly ? item.title : undefined} aria-hidden={plateOnly ? undefined : 'true'}>
          <span className="t-label">{item.category}</span>
          <strong className="mmq-thumb-plate-title">{item.title}</strong>
          <span className="t-label">{item.specs.layout}</span>
        </div>
      )}
      {!plateOnly && (
        <img
          className="mmq-thumb-img"
          src={src}
          alt={`${item.title} · ${item.category}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          style={loaded ? undefined : { opacity: 0, position: 'absolute', inset: 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!useFallback && item.fallbackUrl && item.fallbackUrl !== item.imageUrl) {
              setUseFallback(true);
            } else {
              setPlateOnly(true);
            }
          }}
        />
      )}
      {prepared && (
        <div className="mmq-mini-live" aria-hidden="true">
          <SandboxPreview
            title={item.title}
            html={prepared.html}
            css={prepared.css}
            theme="dark"
            viewport={1440}
            nonce={0}
            className="mmq-thumb-sandbox"
          />
        </div>
      )}
    </div>
  );
};

export const MotionMarqueeGrid: React.FC<MotionMarqueeGridProps> = ({
  onLaunchPrompt,
  reduced = false,
}) => {
  const {
    savedItemIds,
    toggleSavedItem,
    toggleLikedItem,
    isItemLiked,
    getHeartCount,
  } = useAppStore();

  const [fullMap, setFullMap] = useState<Record<string, MotionSiteFullRecord>>(
    () => cachedMotionSites ?? {}
  );
  const [activeItem, setActiveItem] = useState<MotionMarqueeItem | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('live');
  const [viewport, setViewport] = useState<PreviewViewport>(1440);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMotionSitesFull().then((items) => {
      if (!cancelled) setFullMap(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveItem(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeItem]);

  const rowsData = useMemo(() => {
    return ROWS.map((rowIdx) => {
      const exactRow = MOTION_MARQUEE_ITEMS.filter((item) => item.row === rowIdx);
      if (exactRow.length > 0) return exactRow;
      return MOTION_MARQUEE_ITEMS.filter((_, idx) => idx % 4 === rowIdx);
    });
  }, []);

  const getVerbatimPrompt = (item: MotionMarqueeItem): string => {
    const rec = fullMap[item.id];
    if (rec && typeof rec.promptText === 'string' && rec.promptText.trim().length > 0) {
      return rec.promptText;
    }
    return item.promptText;
  };

  const handleOpenItem = (item: MotionMarqueeItem) => {
    setActiveItem(item);
    setActiveTab('live');
    setViewport(1440);
    setPreviewNonce(0);
  };

  const handleCopyPrompt = async (item: MotionMarqueeItem) => {
    const text = getVerbatimPrompt(item);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(item.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev));
    }, 2000);
  };

  const renderCard = (item: MotionMarqueeItem, isClone: boolean) => {
    const liked = isItemLiked(item.id);
    const hearts = getHeartCount(item.id);
    const fullRecord = fullMap[item.id];

    return (
      <article
        key={isClone ? `${item.id}-clone` : item.id}
        className="mmq-card"
        aria-hidden={isClone ? 'true' : undefined}
        onClick={() => handleOpenItem(item)}
      >
        <div className="mmq-card-media">
          <MarqueeThumb
            item={item}
            liveHtml={fullRecord?.liveHtml}
            enableLive={!isClone}
          />
          <div className="mmq-card-veil" aria-hidden="true">
            <span className="mmq-card-inspect">Xem trực tiếp &amp; Prompt gốc</span>
          </div>
          <span className="mmq-card-badge">{item.category}</span>
        </div>

        <div className="mmq-card-bar">
          <button
            type="button"
            className="mmq-card-title-btn"
            tabIndex={isClone ? -1 : 0}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenItem(item);
            }}
          >
            <span className="mmq-card-title">{item.title}</span>
            <span className="mmq-card-sub">{item.specs.layout}</span>
          </button>

          <button
            type="button"
            className="mmq-heart-btn"
            tabIndex={isClone ? -1 : 0}
            aria-pressed={liked}
            aria-label={`${liked ? 'Bỏ thả tim' : 'Thả tim'} ${item.title} (${hearts})`}
            onClick={(e) => {
              e.stopPropagation();
              toggleLikedItem(item.id);
            }}
          >
            <span className="mmq-heart-icon" aria-hidden="true" />
            <span className="mmq-heart-count">{hearts}</span>
          </button>
        </div>
      </article>
    );
  };

  const activeFull = activeItem ? fullMap[activeItem.id] : undefined;
  const activeVerbatimPrompt = activeItem ? getVerbatimPrompt(activeItem) : '';
  const activeTags = activeItem ? activeFull?.tags ?? activeItem.tags : [];
  const modalDoc = useMemo(() => {
    if (!activeItem) return null;
    return prepareLiveDocument(activeFull?.liveHtml, activeItem.imageUrl, false);
  }, [activeItem, activeFull?.liveHtml]);

  const modalLiked = activeItem ? isItemLiked(activeItem.id) : false;
  const modalHearts = activeItem ? getHeartCount(activeItem.id) : 0;
  const modalSaved = activeItem ? savedItemIds.includes(activeItem.id) : false;
  const isCopied = activeItem ? copiedId === activeItem.id : false;

  return (
    <section aria-label="Tài nguyên đa dạng" className="stry-band mmq-band">
      <div className="wrap-wide">
        <header className="mmq-head">
          <div className="mmq-head-copy">
            <h2 className="t-title">Tài nguyên đa dạng</h2>
            <p className="t-lead">
              Chạm vào mẫu bất kỳ để tương tác trực tiếp trên trang web mẫu, đọc nguyên văn Prompt gốc hoặc mở ngay trong Workspace.
            </p>
          </div>
        </header>
      </div>

      {reduced ? (
        <div className="wrap-wide">
          <div className="mmq-static-grid" role="list">
            {MOTION_MARQUEE_ITEMS.map((item) => (
              <div key={item.id} role="listitem">
                {renderCard(item, false)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mmq-stage-viewport">
          <div className="mmq-stage">
            {rowsData.map((rowItems, idx) => {
              const dir = idx % 2 === 0 ? 'right' : 'left';
              return (
                <div
                  key={`mmq-row-${idx}`}
                  className={`mmq-row mmq-row--${dir}`}
                  data-row={idx}
                >
                  <div className="mmq-track">
                    <div className="mmq-group">
                      {rowItems.map((item) => renderCard(item, false))}
                    </div>
                    <div className="mmq-group" aria-hidden="true">
                      {rowItems.map((item) => renderCard(item, true))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeItem &&
        modalDoc &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="mmq-modal-backdrop"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveItem(null);
            }}
          >
            <div
              className="mmq-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Tài nguyên ${activeItem.title}`}
            >
              <header className="mmq-modal-head">
                <div className="mmq-modal-title-wrap">
                  <div className="mmq-modal-kicker">
                    <span className="tag tag-red">{activeItem.category}</span>
                    <span className="t-label">{activeItem.specs.layout} · {activeItem.specs.responsive}</span>
                  </div>
                  <h3 className="mmq-modal-title">{activeItem.title}</h3>
                </div>

                <div className="mmq-modal-head-actions">
                  <button
                    type="button"
                    className="mmq-heart-btn mmq-heart-btn--modal"
                    aria-pressed={modalLiked}
                    onClick={() => toggleLikedItem(activeItem.id)}
                  >
                    <span className="mmq-heart-icon" aria-hidden="true" />
                    <span className="mmq-heart-count">{modalHearts}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    aria-pressed={modalSaved}
                    onClick={() => toggleSavedItem(activeItem.id)}
                  >
                    {modalSaved ? 'Đã lưu' : 'Lưu mẫu'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => void handleCopyPrompt(activeItem)}
                  >
                    {isCopied ? 'Đã chép Prompt' : 'Chép Prompt'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-red btn-sm"
                    onClick={() => {
                      const prompt = activeVerbatimPrompt;
                      setActiveItem(null);
                      void onLaunchPrompt(prompt);
                    }}
                  >
                    Mở trong Workspace
                  </button>

                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => setActiveItem(null)}
                  >
                    Đóng
                  </button>
                </div>
              </header>

              <div className="mmq-modal-tabs-bar">
                <div className="mmq-modal-tabs" role="tablist" aria-label="Chế độ xem mẫu">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'live'}
                    className="mmq-modal-tab"
                    onClick={() => setActiveTab('live')}
                  >
                    Xem trực tiếp
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'prompt'}
                    className="mmq-modal-tab"
                    onClick={() => setActiveTab('prompt')}
                  >
                    Prompt gốc
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'specs'}
                    className="mmq-modal-tab"
                    onClick={() => setActiveTab('specs')}
                  >
                    Thông số
                  </button>
                </div>

                {activeTab === 'live' && (
                  <div className="mmq-vp-controls" role="group" aria-label="Khung nhìn">
                    <button
                      type="button"
                      className="mmq-vp-btn"
                      aria-pressed={viewport === 1440}
                      onClick={() => setViewport(1440)}
                    >
                      Desktop · 1440px
                    </button>
                    <button
                      type="button"
                      className="mmq-vp-btn"
                      aria-pressed={viewport === 768}
                      onClick={() => setViewport(768)}
                    >
                      Tablet · 768px
                    </button>
                    <button
                      type="button"
                      className="mmq-vp-btn"
                      aria-pressed={viewport === 390}
                      onClick={() => setViewport(390)}
                    >
                      Mobile · 390px
                    </button>
                    <button
                      type="button"
                      className="mmq-vp-btn"
                      onClick={() => setPreviewNonce((n) => n + 1)}
                    >
                      Tải lại
                    </button>
                  </div>
                )}
              </div>

              <div className="mmq-modal-body ff-scrollbar">
                {activeTab === 'live' && (
                  <div className="mmq-live-pane">
                    <SandboxPreview
                      title={activeItem.title}
                      html={modalDoc.html}
                      css={modalDoc.css}
                      theme="dark"
                      viewport={viewport}
                      nonce={previewNonce}
                      className="mmq-modal-sandbox"
                    />
                  </div>
                )}

                {activeTab === 'prompt' && (
                  <div className="mmq-modal-prompt-col">
                    <div className="mmq-prompt-bar">
                      <div>
                        <span className="t-label">
                          Nguyên văn Prompt gốc (.md) · {activeVerbatimPrompt.length.toLocaleString('vi-VN')} ký tự
                        </span>
                        <p className="mmq-prompt-note">{activeItem.summaryVi}</p>
                      </div>
                      <div className="mmq-prompt-actions">
                        <button
                          type="button"
                          className="btn btn-line btn-sm"
                          onClick={() => void handleCopyPrompt(activeItem)}
                        >
                          {isCopied ? 'Đã chép' : 'Chép Prompt'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-red btn-sm"
                          onClick={() => {
                            const prompt = activeVerbatimPrompt;
                            setActiveItem(null);
                            void onLaunchPrompt(prompt);
                          }}
                        >
                          Mở trong Workspace
                        </button>
                      </div>
                    </div>

                    <pre className="mmq-prompt-pre ff-scrollbar">
                      <code>{activeVerbatimPrompt}</code>
                    </pre>
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="mmq-modal-specs-pane">
                    <p className="mmq-modal-summary">{activeItem.summaryVi}</p>

                    <dl className="mmq-specs-grid">
                      <div>
                        <dt className="t-label">Danh mục</dt>
                        <dd>{activeItem.category}</dd>
                      </div>
                      <div>
                        <dt className="t-label">Bố cục</dt>
                        <dd>{activeItem.specs.layout}</dd>
                      </div>
                      <div>
                        <dt className="t-label">Chuyển động</dt>
                        <dd>{activeItem.specs.motion}</dd>
                      </div>
                      <div>
                        <dt className="t-label">Responsive</dt>
                        <dd>{activeItem.specs.responsive}</dd>
                      </div>
                      <div>
                        <dt className="t-label">Thời lượng</dt>
                        <dd>{activeItem.specs.durationMs} ms</dd>
                      </div>
                      <div>
                        <dt className="t-label">Easing</dt>
                        <dd className="mmq-mono">{activeItem.specs.easing}</dd>
                      </div>
                    </dl>

                    <div className="mmq-tags-block">
                      <span className="t-label">Từ khóa kỹ thuật</span>
                      <div className="mmq-tags-list">
                        {activeTags.map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};

export default MotionMarqueeGrid;
