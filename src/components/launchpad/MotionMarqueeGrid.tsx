import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MOTION_MARQUEE_ITEMS,
  type MotionMarqueeItem,
  type MotionMarqueeRow,
} from '../../data/motionShowcaseCatalog';
import { useAppStore } from '../../store/appStore';
import { SandboxPreview } from '../../features/explore/SandboxPreview';
import {
  buildMotionThemeOverrideCss,
  type PreviewTheme,
  type PreviewViewport,
} from '../../features/explore/catalog';

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
  liveHtml?: string;
  css?: string;
  code?: string;
  codeLang?: string;
  previewImage?: string;
  previewVideo?: string;
  tags: string[];
}

type ModalTab = 'video' | 'live' | 'code' | 'prompt' | 'specs';
type CodeSubTab = 'code' | 'html' | 'css';

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

function splitLiveHtmlCss(rawLiveHtml: string | undefined): { html: string; css: string } | null {
  if (!rawLiveHtml || rawLiveHtml.trim().length === 0) return null;
  const isFullDoc = /^\s*(?:<!doctype\s+html|<html[\s>])/i.test(rawLiveHtml);
  if (isFullDoc) {
    return { html: rawLiveHtml.trim(), css: '' };
  }
  const styleBlocks: string[] = [];
  const html = rawLiveHtml
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, cssBody: string) => {
      if (cssBody && cssBody.trim()) styleBlocks.push(cssBody.trim());
      return '';
    })
    .trim();
  if (!html) return null;
  return { html, css: styleBlocks.join('\n\n') };
}

function resolveMotionRecord(
  map: Record<string, MotionSiteFullRecord>,
  itemId: string
): MotionSiteFullRecord | undefined {
  const bare = itemId.replace(/^ms-/, '');
  return map[itemId] || map[bare] || map[`ms-${bare}`];
}

const MotionVideoThumb: React.FC<{
  item: MotionMarqueeItem;
  posterSrc: string;
  videoSrc: string;
  eager?: boolean;
  hovered?: boolean;
  reduced?: boolean;
}> = ({ item, posterSrc, videoSrc, hovered = false, reduced = false }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [inView, setInView] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setVideoReady(false);
    setVideoFailed(false);
  }, [videoSrc]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || !videoSrc || reduced || typeof IntersectionObserver !== 'function') {
      setInView(false);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { rootMargin: '80px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [videoSrc, reduced]);

  const shouldMountVideo = !reduced && Boolean(videoSrc) && !videoFailed && (inView || hovered);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (shouldMountVideo) {
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [shouldMountVideo]);

  return (
    <div ref={hostRef} className="mmq-thumb-host">
      {(!imgLoaded || imgFailed) && (
        <div
          className="mmq-thumb-plate"
          role={imgFailed ? 'img' : undefined}
          aria-label={imgFailed ? item.title : undefined}
          aria-hidden={imgFailed ? undefined : 'true'}
        >
          <span className="t-label">{item.category}</span>
          <strong className="mmq-thumb-plate-title">{item.title}</strong>
        </div>
      )}
      {!imgFailed && posterSrc && (
        <img
          className="mmq-thumb-img"
          src={posterSrc}
          alt={`${item.title} · ${item.category}`}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
        />
      )}
      {shouldMountVideo && (
        <video
          ref={videoRef}
          className="mmq-thumb-video"
          data-ready={videoReady ? 'true' : 'false'}
          src={videoSrc}
          poster={posterSrc}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
        />
      )}
    </div>
  );
};

export const MotionMarqueeGrid: React.FC<MotionMarqueeGridProps> = ({
  onLaunchPrompt,
  reduced = false,
}) => {
  const { savedItemIds, toggleSavedItem, theme } = useAppStore();

  const [fullMap, setFullMap] = useState<Record<string, MotionSiteFullRecord>>(
    () => cachedMotionSites ?? {}
  );
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<MotionMarqueeItem | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('video');
  const [codeSubTab, setCodeSubTab] = useState<CodeSubTab>('code');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [viewport, setViewport] = useState<PreviewViewport>(1440);
  const [stageTheme, setStageTheme] = useState<PreviewTheme>(theme);
  const [nonce, setNonce] = useState(0);
  const userPickedTabRef = useRef(false);

  useEffect(() => {
    setStageTheme(theme);
  }, [theme]);

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
    const rec = resolveMotionRecord(fullMap, item.id);
    if (rec && typeof rec.promptText === 'string' && rec.promptText.trim().length > 0) {
      return rec.promptText;
    }
    return item.promptText;
  };

  const handleOpenItem = (item: MotionMarqueeItem) => {
    if (Object.keys(fullMap).length === 0) {
      void loadMotionSitesFull().then((items) => setFullMap(items));
    }
    const rec = resolveMotionRecord(fullMap, item.id);
    const hasLive = Boolean(splitLiveHtmlCss(rec?.liveHtml));
    const hasVideo = Boolean(item.videoUrl || (item.id !== 'ms-nike-hover' && rec?.previewVideo));
    userPickedTabRef.current = false;
    setActiveItem(item);
    setActiveTab(hasLive ? 'live' : 'video');
    if (!hasLive && !hasVideo) {
      setActiveTab('code');
    }
    setCodeSubTab('code');
    setCopiedCode(false);
    setViewport(1440);
    setNonce((n) => n + 1);
  };

  const selectTab = (tab: ModalTab) => {
    userPickedTabRef.current = true;
    setActiveTab(tab);
  };

  const copyRawText = async (text: string): Promise<void> => {
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
  };

  const handleCopyPrompt = async (item: MotionMarqueeItem) => {
    const text = getVerbatimPrompt(item);
    await copyRawText(text);
    setCopiedId(item.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev));
    }, 2000);
  };

  const handleCopyCodeText = async (text: string) => {
    if (!text) return;
    await copyRawText(text);
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1800);
  };

  const renderCard = (item: MotionMarqueeItem, isClone: boolean) => {
    const rec = resolveMotionRecord(fullMap, item.id);
    const posterSrc = item.imageUrl || rec?.previewImage || '';
    const videoSrc = item.videoUrl || (item.id !== 'ms-nike-hover' ? rec?.previewVideo || '' : '');
    const cardKey = isClone ? `${item.id}-clone` : item.id;
    const isEager = rowsData.some((row) => row.slice(0, 6).includes(item));

    return (
      <article
        key={cardKey}
        className="mmq-card"
        aria-hidden={isClone ? 'true' : undefined}
        onMouseEnter={() => setHoveredKey(cardKey)}
        onMouseLeave={() => setHoveredKey((prev) => (prev === cardKey ? null : prev))}
        onClick={() => handleOpenItem(item)}
      >
        <div className="mmq-card-media">
          <MotionVideoThumb
            item={item}
            posterSrc={posterSrc}
            videoSrc={videoSrc}
            eager={isEager}
            hovered={hoveredKey === cardKey}
            reduced={reduced}
          />
        </div>

        <button
          type="button"
          className="mmq-card-bar mmq-card-footer-btn"
          tabIndex={isClone ? -1 : 0}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenItem(item);
          }}
        >
          <span className="mmq-card-title">{item.title}</span>
          <span className="mmq-card-cat">{item.category}</span>
        </button>
      </article>
    );
  };

  const activeFull = activeItem ? resolveMotionRecord(fullMap, activeItem.id) : undefined;
  const activeVideoUrl = activeItem
    ? activeItem.videoUrl || (activeItem.id !== 'ms-nike-hover' ? activeFull?.previewVideo || '' : '')
    : '';
  const activePosterUrl = activeItem ? activeItem.imageUrl || activeFull?.previewImage || '' : '';
  const activeVerbatimPrompt = activeItem ? getVerbatimPrompt(activeItem) : '';
  const activeTags = activeItem ? activeFull?.tags ?? activeItem.tags : [];
  const liveParts = useMemo(
    () => (activeItem ? splitLiveHtmlCss(activeFull?.liveHtml) : null),
    [activeFull?.liveHtml, activeItem]
  );

  useEffect(() => {
    if (!activeItem || !liveParts || userPickedTabRef.current) return;
    setActiveTab('live');
  }, [activeItem, liveParts]);

  const stageCss = useMemo(() => {
    if (!liveParts) return '';
    const override = activeFull?.liveHtml
      ? buildMotionThemeOverrideCss(activeFull.liveHtml, stageTheme)
      : '';
    return [liveParts.css, override].filter(Boolean).join('\n\n');
  }, [liveParts, activeFull?.liveHtml, stageTheme]);
  const activeCodeBlocks = useMemo(() => {
    const list: Array<{ id: CodeSubTab; label: string; content: string }> = [];
    if (activeFull?.code?.trim()) {
      list.push({
        id: 'code',
        label: (activeFull.codeLang || 'TSX').toUpperCase(),
        content: activeFull.code.trim(),
      });
    }
    if (liveParts?.html) {
      list.push({ id: 'html', label: 'HTML', content: liveParts.html });
    }
    const mergedCss = activeFull?.css?.trim() || liveParts?.css || '';
    if (mergedCss) {
      list.push({ id: 'css', label: 'CSS', content: mergedCss });
    }
    return list;
  }, [activeFull, liveParts]);

  const resolvedCodeBlock =
    activeCodeBlocks.find((b) => b.id === codeSubTab) || activeCodeBlocks[0] || null;

  const modalSaved = activeItem ? savedItemIds.includes(activeItem.id) : false;
  const isCopied = activeItem ? copiedId === activeItem.id : false;

  return (
    <section aria-label="Thư viện MotionSites" className="stry-band mmq-band">
      <div className="wrap-wide">
        <header className="mmq-head">
          <div className="mmq-head-copy">
            <h2 className="t-title">Tài nguyên tương tác</h2>
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
              aria-label={`Dùng thử ${activeItem.title}`}
            >
              <header className="mmq-modal-head">
                <div className="mmq-modal-title-wrap">
                  <div className="mmq-modal-kicker">
                    <span className="tag tag-red">{activeItem.category}</span>
                    <span className="t-label">{activeItem.specs.responsive}</span>
                  </div>
                  <h3 className="mmq-modal-title">{activeItem.title}</h3>
                </div>

                <div className="mmq-modal-head-actions">
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
                    Nạp vào Workspace
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
                <div className="mmq-modal-tabs" role="tablist" aria-label="Chế độ xem thử">
                  {liveParts && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'live'}
                      className="mmq-modal-tab"
                      onClick={() => selectTab('live')}
                    >
                      Live HTML
                    </button>
                  )}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'video'}
                    className="mmq-modal-tab"
                    onClick={() => selectTab('video')}
                  >
                    Video Trial
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'code'}
                    className="mmq-modal-tab"
                    onClick={() => selectTab('code')}
                  >
                    Mã nguồn
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'prompt'}
                    className="mmq-modal-tab"
                    onClick={() => selectTab('prompt')}
                  >
                    Prompt gốc
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'specs'}
                    className="mmq-modal-tab"
                    onClick={() => selectTab('specs')}
                  >
                    Kiến trúc
                  </button>
                </div>

                {activeTab === 'live' && liveParts && (
                  <div className="mmq-vp-controls" role="group" aria-label="Khung nhìn chạy thử">
                    {(
                      [
                        { vp: 1440, label: 'Máy tính' },
                        { vp: 768, label: 'Máy tính bảng' },
                        { vp: 390, label: 'Điện thoại' },
                      ] as Array<{ vp: PreviewViewport; label: string }>
                    ).map((opt) => (
                      <button
                        key={opt.vp}
                        type="button"
                        className="mmq-vp-btn"
                        aria-pressed={viewport === opt.vp}
                        onClick={() => setViewport(opt.vp)}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="mmq-vp-btn"
                      onClick={() => setStageTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                    >
                      {stageTheme === 'dark' ? 'Nền tối' : 'Nền sáng'}
                    </button>
                    <button
                      type="button"
                      className="mmq-vp-btn"
                      onClick={() => setNonce((n) => n + 1)}
                    >
                      Chạy lại
                    </button>
                  </div>
                )}
              </div>

              <div className="mmq-modal-body ff-scrollbar">
                {activeTab === 'video' && (
                  <div className="mmq-video-trial-stage">
                    <video
                      key={activeVideoUrl}
                      src={activeVideoUrl}
                      poster={activePosterUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="mmq-trial-video"
                    />
                  </div>
                )}

                {activeTab === 'live' && liveParts && (
                  <div className="mmq-live-pane">
                    <div className="mmq-modal-sandbox" data-viewport={viewport}>
                      <SandboxPreview
                        title={activeItem.title}
                        html={liveParts.html}
                        css={stageCss}
                        theme={stageTheme}
                        viewport={viewport}
                        nonce={nonce}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="mmq-modal-prompt-col">
                    {resolvedCodeBlock ? (
                      <>
                        <div className="mmq-prompt-bar">
                          <div className="mmq-code-subtabs" role="tablist" aria-label="Tệp mã nguồn">
                            {activeCodeBlocks.map((block) => (
                              <button
                                key={block.id}
                                type="button"
                                role="tab"
                                aria-selected={resolvedCodeBlock.id === block.id}
                                className="mmq-vp-btn"
                                aria-pressed={resolvedCodeBlock.id === block.id}
                                onClick={() => setCodeSubTab(block.id)}
                              >
                                {block.label}
                              </button>
                            ))}
                          </div>
                          <div className="mmq-prompt-actions">
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              onClick={() => void handleCopyCodeText(resolvedCodeBlock.content)}
                            >
                              {copiedCode ? 'Đã chép mã' : `Chép ${resolvedCodeBlock.label}`}
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
                              Nạp vào Workspace
                            </button>
                          </div>
                        </div>
                        <pre className="mmq-prompt-pre ff-scrollbar">
                          <code>{resolvedCodeBlock.content}</code>
                        </pre>
                      </>
                    ) : (
                      <div className="mmq-prompt-bar">
                        <div>
                          <span className="t-label">Đặc tả Prompt</span>
                          <p className="mmq-prompt-note">
                            Dùng trực tiếp Prompt gốc để dựng mã trong Workspace.
                          </p>
                        </div>
                        <div className="mmq-prompt-actions">
                          <button
                            type="button"
                            className="btn btn-line btn-sm"
                            onClick={() => selectTab('prompt')}
                          >
                            Mở Prompt gốc
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
                            Nạp vào Workspace
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'prompt' && (
                  <div className="mmq-modal-prompt-col">
                    <div className="mmq-prompt-bar">
                      <div>
                        <span className="t-label">
                          Prompt gốc · {activeVerbatimPrompt.length.toLocaleString('vi-VN')} ký tự
                        </span>
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
                          Nạp vào Workspace
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
                        <dt className="t-label">Hiển thị</dt>
                        <dd>{activeItem.specs.responsive}</dd>
                      </div>
                    </dl>

                    <div className="mmq-tags-block">
                      <span className="t-label">Thẻ</span>
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
