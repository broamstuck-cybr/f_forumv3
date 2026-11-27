import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IconBookmark,
  IconCheck,
  IconCopy,
  IconHeart,
  IconMonitor,
  IconMoon,
  IconRotateCw,
  IconSmartphone,
  IconSun,
  IconTablet,
  IconX,
} from '../../ui/icons';
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
import { VAULT_CACHE_VERSION } from '../../features/explore/vaultLoader';

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

type ModalTab = 'video' | 'live' | 'code' | 'prompt';
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
  motionSitesPromise = fetch(`/data/motionsites-full.json?v=${VAULT_CACHE_VERSION}`)
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
  const trimmed = rawLiveHtml.trim();
  const isFullDoc = /^\s*(?:<!doctype\s+html|<html[\s>])/i.test(trimmed);
  const hasStyleRules = /<style[^>]*>[\s\S]*?\{[\s\S]*?\}[\s\S]*?<\/style>/i.test(trimmed);

  if (isFullDoc) {
    const hasCompleteStructure = /<\/html>/i.test(trimmed) && /<body[\s>]/i.test(trimmed);
    const isEmptyReactShell = /<div\s+id=["']root["']\s*><\/div>/i.test(trimmed) && trimmed.length < 1200;
    if (!hasCompleteStructure || !hasStyleRules || isEmptyReactShell) {
      return null;
    }
    return { html: trimmed, css: '' };
  }

  if (trimmed.length < 1500 || !hasStyleRules) return null;
  if (/@import\s+["']tailwindcss["']/i.test(trimmed)) return null;

  const styleBlocks: string[] = [];
  const html = trimmed
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, cssBody: string) => {
      if (cssBody && cssBody.trim()) styleBlocks.push(cssBody.trim());
      return '';
    })
    .trim();

  const htmlWithoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  if (!html || html.length < 250 || /\bclassName=/.test(htmlWithoutScripts)) return null;
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
  const {
    savedItemIds,
    toggleSavedItem,
    toggleLikedItem,
    isItemLiked,
    getHeartCount,
    theme,
    language,
  } = useAppStore();
  const isEn = language === 'en';

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
    const hasVideo = Boolean(item.videoUrl || rec?.previewVideo || item.imageUrl || rec?.previewImage);
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
    const liked = isItemLiked(item.id);
    const heartCount = getHeartCount(item.id);

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
          </button>
          <button
            type="button"
            className="ff-like-btn"
            tabIndex={isClone ? -1 : 0}
            aria-pressed={liked}
            aria-label={`${liked ? 'Bỏ tim' : 'Thả tim'} ${item.title}`}
            title={liked ? 'Bỏ tim' : 'Thả tim'}
            onClick={(e) => {
              e.stopPropagation();
              toggleLikedItem(item.id, 'motionsites');
            }}
          >
            <IconHeart size={13} filled={liked} aria-hidden="true" />
            <span className="ff-like-count">{heartCount}</span>
          </button>
        </div>
      </article>
    );
  };

  const activeFull = activeItem ? resolveMotionRecord(fullMap, activeItem.id) : undefined;
  const rawActiveVideoUrl = activeItem
    ? activeItem.videoUrl || activeFull?.previewVideo || ''
    : '';
  const isPlayableMp4 =
    Boolean(rawActiveVideoUrl) && !/\.(webp|gif|png|jpe?g|svg)(\?|$)/i.test(rawActiveVideoUrl);
  const activeVideoUrl = isPlayableMp4 ? rawActiveVideoUrl : '';
  const activePosterUrl = activeItem ? activeItem.imageUrl || activeFull?.previewImage || rawActiveVideoUrl : '';
  const activeVerbatimPrompt = activeItem ? getVerbatimPrompt(activeItem) : '';
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
  const modalLiked = activeItem ? isItemLiked(activeItem.id) : false;
  const modalHearts = activeItem ? getHeartCount(activeItem.id) : 0;
  const isCopied = activeItem ? copiedId === activeItem.id : false;

  return (
    <section aria-label={isEn ? 'Resources library' : 'Kho tài nguyên'} className="stry-band mmq-band">
      <div className="wrap-wide">
        <header className="mmq-head">
          <div className="mmq-head-copy">
            <h2 className="t-title">{isEn ? 'Resources' : 'Tài nguyên'}</h2>
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
                  <h3 className="mmq-modal-title">{activeItem.title}</h3>
                </div>

                <div className="mmq-modal-head-actions">
                  <button
                    type="button"
                    className="ff-like-btn ff-like-btn--lg"
                    aria-pressed={modalLiked}
                    aria-label={`${modalLiked ? 'Bỏ tim' : 'Thả tim'} ${activeItem.title}`}
                    title={modalLiked ? 'Bỏ tim' : 'Thả tim'}
                    onClick={() => toggleLikedItem(activeItem.id, 'motionsites')}
                  >
                    <IconHeart size={15} filled={modalLiked} aria-hidden="true" />
                    <span className="ff-like-count">{modalHearts}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-line btn-sm mmq-copy-prompt-btn"
                    onClick={() => void handleCopyPrompt(activeItem)}
                  >
                    {isCopied ? (
                      <IconCheck size={14} aria-hidden="true" />
                    ) : (
                      <IconCopy size={14} aria-hidden="true" />
                    )}
                    <span>{isCopied ? (isEn ? 'Copied' : 'Đã chép') : (isEn ? 'Copy Prompt' : 'Chép Prompt')}</span>
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
                    {isEn ? 'Use template' : 'Dùng mẫu'}
                  </button>

                  <button
                    type="button"
                    className="mmq-icon-btn"
                    aria-pressed={modalSaved}
                    aria-label={modalSaved ? 'Bỏ lưu mẫu' : 'Lưu mẫu'}
                    title={modalSaved ? 'Đã lưu' : 'Lưu mẫu'}
                    onClick={() => toggleSavedItem(activeItem.id)}
                  >
                    <IconBookmark size={16} filled={modalSaved} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="mmq-icon-btn"
                    aria-label={isEn ? 'Close' : 'Đóng'}
                    title={isEn ? 'Close' : 'Đóng'}
                    onClick={() => setActiveItem(null)}
                  >
                    <IconX size={18} aria-hidden="true" />
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
                      Live
                    </button>
                  )}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'video'}
                    className="mmq-modal-tab"
                    onClick={() => selectTab('video')}
                  >
                    Video
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'prompt'}
                    className="mmq-modal-tab"
                    onClick={() => selectTab('prompt')}
                  >
                    Prompt
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
                </div>

                {activeTab === 'live' && liveParts && (
                  <div className="mmq-vp-controls" role="group" aria-label="Điều khiển khung xem">
                    <button
                      type="button"
                      className="mmq-icon-btn"
                      aria-label={`Khung nhìn ${viewport}px`}
                      title={`${viewport}px`}
                      onClick={() =>
                        setViewport((prev) => (prev === 1440 ? 768 : prev === 768 ? 390 : 1440))
                      }
                    >
                      {viewport === 1440 ? (
                        <IconMonitor size={15} aria-hidden="true" />
                      ) : viewport === 768 ? (
                        <IconTablet size={15} aria-hidden="true" />
                      ) : (
                        <IconSmartphone size={15} aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="mmq-icon-btn"
                      aria-label={stageTheme === 'dark' ? 'Đổi nền sáng' : 'Đổi nền tối'}
                      title={stageTheme === 'dark' ? 'Nền sáng' : 'Nền tối'}
                      onClick={() => setStageTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                    >
                      {stageTheme === 'dark' ? (
                        <IconSun size={15} aria-hidden="true" />
                      ) : (
                        <IconMoon size={15} aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="mmq-icon-btn"
                      aria-label="Chạy lại"
                      title="Chạy lại"
                      onClick={() => setNonce((n) => n + 1)}
                    >
                      <IconRotateCw size={15} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mmq-modal-body ff-scrollbar">
                {activeTab === 'video' && (
                  <div className="mmq-video-trial-stage">
                    {activeVideoUrl ? (
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
                    ) : (
                      <img
                        src={activePosterUrl}
                        alt={activeItem.title}
                        referrerPolicy="no-referrer"
                        className="mmq-trial-video"
                      />
                    )}
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

                {(activeTab === 'live' || activeTab === 'video') && activeVerbatimPrompt && (
                  <div className="mmq-prompt-dock">
                    <div className="mmq-prompt-dock-text">
                      <span className="t-label">Prompt</span>
                      <p className="mmq-prompt-dock-preview">{activeVerbatimPrompt}</p>
                    </div>
                    <div className="mmq-prompt-dock-actions">
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => selectTab('prompt')}
                      >
                        Xem đầy đủ
                      </button>
                      <button
                        type="button"
                        className="btn btn-red btn-sm mmq-copy-prompt-btn"
                        onClick={() => void handleCopyPrompt(activeItem)}
                      >
                        {isCopied ? (
                          <IconCheck size={14} aria-hidden="true" />
                        ) : (
                          <IconCopy size={14} aria-hidden="true" />
                        )}
                        <span>{isCopied ? 'Đã chép' : 'Chép Prompt'}</span>
                      </button>
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
                          <button
                            type="button"
                            className="mmq-icon-btn"
                            aria-label={copiedCode ? 'Đã chép mã' : `Chép ${resolvedCodeBlock.label}`}
                            title={copiedCode ? 'Đã chép' : `Chép ${resolvedCodeBlock.label}`}
                            onClick={() => void handleCopyCodeText(resolvedCodeBlock.content)}
                          >
                            {copiedCode ? (
                              <IconCheck size={15} aria-hidden="true" />
                            ) : (
                              <IconCopy size={15} aria-hidden="true" />
                            )}
                          </button>
                        </div>
                        <pre className="mmq-prompt-pre ff-scrollbar">
                          <code>{resolvedCodeBlock.content}</code>
                        </pre>
                      </>
                    ) : (
                      <div className="mmq-prompt-bar">
                        <span className="t-label">Mẫu này dùng trực tiếp Prompt gốc.</span>
                        <button
                          type="button"
                          className="btn btn-line btn-sm"
                          onClick={() => selectTab('prompt')}
                        >
                          Mở Prompt
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'prompt' && (
                  <div className="mmq-modal-prompt-col">
                    <div className="mmq-prompt-bar">
                      <span className="t-label">
                        Prompt · {activeVerbatimPrompt.length.toLocaleString('vi-VN')} ký tự
                      </span>
                      <button
                        type="button"
                        className="btn btn-red btn-sm mmq-copy-prompt-btn"
                        onClick={() => void handleCopyPrompt(activeItem)}
                      >
                        {isCopied ? (
                          <IconCheck size={14} aria-hidden="true" />
                        ) : (
                          <IconCopy size={14} aria-hidden="true" />
                        )}
                        <span>{isCopied ? 'Đã chép' : 'Chép Prompt'}</span>
                      </button>
                    </div>

                    <pre className="mmq-prompt-pre ff-scrollbar">
                      <code>{activeVerbatimPrompt}</code>
                    </pre>
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
