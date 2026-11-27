import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconEye,
  IconGlobe,
  IconHeart,
  IconMaximize2,
  IconMonitor,
  IconRefreshCw,
  IconSearch,
  IconSmartphone,
  IconTablet,
  IconX,
} from '../../ui/icons';
import type {
  BrandPersonality,
  OnboardingProfile,
  PublishedPageCategory,
  PublishedPageRecord,
} from '../../types/workspaceV4';
import { apiClient } from '../../services/apiClient';
import { useAppStore } from '../../store/appStore';
import { compileSpecimenSrcDoc, copyText, type PreviewViewport } from '../explore/catalog';
import { KnowledgeView } from '../knowledge/KnowledgeView';
import { hardenPreviewHtml } from '../../utils/hardenPreviewHtml';
import { handleLiquidPointerLeave, handleLiquidPointerMove } from '../../utils/liquidGlassPointer';
import './community.css';

type CommunityTopTab = 'remix' | 'knowledge';
type RemixFilterKey = 'featured' | 'presentation' | 'event' | 'portfolio' | 'business-tech';

interface GalleryEntry {
  id: string;
  slug: string;
  title: string;
  summary: string;
  authorName: string;
  authorRole: string;
  category: PublishedPageCategory;
  categoryLabel: string;
  html: string;
  liveUrl?: string;
  views: number;
  likes: number;
  remixes: number;
  createdAt: string;
  personality: BrandPersonality;
  prompt: string;
  profile?: Partial<OnboardingProfile>;
}

const FILTER_PILLS: Array<{ id: RemixFilterKey; label: string }> = [
  { id: 'featured', label: 'Tất cả' },
  { id: 'presentation', label: 'Học tập & Diễn đàn' },
  { id: 'event', label: 'Sự kiện CLB' },
  { id: 'portfolio', label: 'Hồ sơ' },
  { id: 'business-tech', label: 'Sản phẩm & Tech' },
];

const CATEGORY_LABELS: Record<PublishedPageCategory, string> = {
  presentation: 'Học tập & Diễn đàn',
  event: 'Sự kiện CLB',
  portfolio: 'Hồ sơ cá nhân',
  business: 'Kinh doanh',
  tech: 'Công nghệ',
};

const AUTHOR_ROLE_LABELS: Record<string, string> = {
  student: 'Học sinh / SV',
  beginner: 'Người mới',
  business: 'Kinh doanh',
  tech: 'Công nghệ',
  member: 'Thành viên',
  guest: 'Thành viên',
};

function formatAuthorRole(raw?: string): string {
  const clean = (raw || '').trim();
  if (!clean) return 'Đã xuất bản';
  return AUTHOR_ROLE_LABELS[clean.toLowerCase()] || clean;
}

function hostOf(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

const PREVIEW_CANVAS_WIDTH = 1280;

function computeCommunityBentoSpans(total: number): number[] {
  if (total <= 0) return [];
  if (total === 1) return [12];
  if (total === 2) return [7, 5];
  if (total === 3) return [4, 4, 4];

  const spans: number[] = [8, 4];
  let remaining = total - 2;
  let preferPair = false;

  while (remaining > 0) {
    if (remaining === 4) {
      spans.push(6, 6, 6, 6);
      break;
    }
    if (remaining === 2) {
      spans.push(6, 6);
      break;
    }
    if (remaining === 1) {
      spans.push(12);
      break;
    }
    if (preferPair && remaining >= 5 && remaining !== 6) {
      spans.push(6, 6);
      remaining -= 2;
    } else {
      spans.push(4, 4, 4);
      remaining -= 3;
    }
    preferPair = !preferPair;
  }
  return spans;
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'F'
  );
}

interface MiniPageStageProps {
  title: string;
  html: string;
  liveUrl?: string;
  theme: 'dark' | 'light';
}

const MiniPageStage: React.FC<MiniPageStageProps> = ({ title, html, liveUrl, theme }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [box, setBox] = useState({ scale: 0, height: 800 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1]?.isIntersecting) {
          setVisible(true);
        }
      },
      { rootMargin: '260px' }
    );
    io.observe(host);

    const ro = new ResizeObserver((entries) => {
      const rect = entries[entries.length - 1]?.contentRect;
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const scale = rect.width / PREVIEW_CANVAS_WIDTH;
      setBox({ scale, height: Math.ceil(rect.height / scale) });
    });
    ro.observe(host);

    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  const srcDoc = useMemo(
    () => (visible && !liveUrl && html ? hardenPreviewHtml(compileSpecimenSrcDoc(html, '', theme)) : ''),
    [visible, liveUrl, html, theme]
  );

  return (
    <div ref={hostRef} className="cm-stage-iframe-host">
      {visible && box.scale > 0 ? (
        <div
          className="cm-stage-canvas"
          style={{
            width: PREVIEW_CANVAS_WIDTH,
            height: box.height,
            transform: `scale(${box.scale})`,
          }}
        >
          {liveUrl ? (
            <iframe
              className="cm-stage-iframe"
              title={`Xem trực tiếp ${title}`}
              src={liveUrl}
              loading="lazy"
              referrerPolicy="no-referrer"
              tabIndex={-1}
            />
          ) : (
            <iframe
              className="cm-stage-iframe"
              title={`Xem trước ${title}`}
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              loading="lazy"
              tabIndex={-1}
            />
          )}
        </div>
      ) : null}
    </div>
  );
};

export const CommunityView: React.FC = () => {
  const { navigate, openInWorkspace, recordSignal, theme, addToast } = useAppStore();
  const reduced = Boolean(useReducedMotion());

  const [topTab, setTopTab] = useState<CommunityTopTab>('remix');
  const [filter, setFilter] = useState<RemixFilterKey>('featured');
  const [search, setSearch] = useState('');
  const [publishedPages, setPublishedPages] = useState<PublishedPageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedPublishedSlugs, setLikedPublishedSlugs] = useState<Record<string, boolean>>({});
  const [previewEntry, setPreviewEntry] = useState<GalleryEntry | null>(null);
  const [modalViewport, setModalViewport] = useState<PreviewViewport>(1440);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const loadPublished = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient
      .listPublishedPages()
      .then((res) => {
        const pages = Array.isArray(res?.pages) ? res.pages : [];
        setPublishedPages(pages);
        setLoading(false);
      })
      .catch(() => {
        setError('Chưa kết nối được danh sách sản phẩm thật từ máy chủ. Bấm Thử lại sau vài giây.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadPublished();
  }, [loadPublished]);

  useEffect(() => {
    if (!previewEntry) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewEntry(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewEntry]);

  // WHY: Community displays strictly authentic published products with real server metrics (zero built-in placeholder showcases).
  const allEntries = useMemo<GalleryEntry[]>(() => {
    return publishedPages.map((page) => ({
      id: `pub:${page.slug}`,
      slug: page.slug,
      title: page.title,
      summary: page.summary || 'Sản phẩm web đã xuất bản bởi thành viên F-Forum.',
      authorName: page.authorName || 'Thành viên F-Forum',
      authorRole: formatAuthorRole(page.authorRole),
      category: page.category,
      categoryLabel: CATEGORY_LABELS[page.category] || 'Trang web',
      html: page.html || '',
      liveUrl: page.liveUrl,
      views: typeof page.views === 'number' && page.views >= 0 ? page.views : 0,
      likes: typeof page.likes === 'number' && page.likes >= 0 ? page.likes : 0,
      remixes: typeof page.remixes === 'number' && page.remixes >= 0 ? page.remixes : 0,
      createdAt: page.updatedAt || page.createdAt,
      personality: page.personality,
      prompt: `Remix từ trang "${page.title}": giữ cấu trúc tổng thể và điều chỉnh nội dung theo yêu cầu của tôi.`,
      profile: {
        siteName: page.title,
        personality: page.personality,
      },
    }));
  }, [publishedPages]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = allEntries.filter((entry) => {
      if (filter === 'presentation' && entry.category !== 'presentation') return false;
      if (filter === 'event' && entry.category !== 'event') return false;
      if (filter === 'portfolio' && entry.category !== 'portfolio') return false;
      if (filter === 'business-tech' && entry.category !== 'business' && entry.category !== 'tech') {
        return false;
      }
      if (!q) return true;
      const hay = `${entry.title} ${entry.summary} ${entry.authorName} ${entry.categoryLabel} ${entry.liveUrl || ''}`.toLowerCase();
      return hay.includes(q);
    });

    if (filter === 'featured') {
      return [...matched].sort((a, b) => {
        const scoreA = a.likes * 3 + a.remixes * 5 + a.views;
        const scoreB = b.likes * 3 + b.remixes * 5 + b.views;
        return scoreB - scoreA;
      });
    }
    return matched;
  }, [allEntries, filter, search]);

  const trackRealView = useCallback(
    (entry: GalleryEntry) => {
      recordSignal(entry.slug, 'view', 'community');
      setPublishedPages((prev) =>
        prev.map((page) =>
          page.slug === entry.slug ? { ...page, views: (page.views || 0) + 1 } : page
        )
      );
      void apiClient
        .viewPublishedPage(entry.slug)
        .then((res) => {
          setPublishedPages((prev) =>
            prev.map((page) =>
              page.slug === entry.slug ? { ...page, views: Math.max(0, res.views) } : page
            )
          );
        })
        .catch(() => undefined);
    },
    [recordSignal]
  );

  const handleOpenPreview = useCallback(
    (entry: GalleryEntry) => {
      setModalViewport(1440);
      setPreviewEntry(entry);
      trackRealView(entry);
    },
    [trackRealView]
  );

  const handleToggleHeart = async (entry: GalleryEntry) => {
    const nextLiked = !likedPublishedSlugs[entry.slug];
    setLikedPublishedSlugs((prev) => ({ ...prev, [entry.slug]: nextLiked }));
    setPublishedPages((prev) =>
      prev.map((page) =>
        page.slug === entry.slug
          ? { ...page, likes: Math.max(0, (page.likes || 0) + (nextLiked ? 1 : -1)) }
          : page
      )
    );
    if (nextLiked) recordSignal(entry.slug, 'like', 'community');
    try {
      const res = await apiClient.likePublishedPage(entry.slug);
      setLikedPublishedSlugs((prev) => ({ ...prev, [entry.slug]: Boolean(res.liked) }));
      setPublishedPages((prev) =>
        prev.map((page) =>
          page.slug === entry.slug ? { ...page, likes: Math.max(0, res.likes) } : page
        )
      );
    } catch {
      return;
    }
  };

  const handleRemix = (entry: GalleryEntry) => {
    setPreviewEntry(null);
    recordSignal(entry.slug, 'use', 'community');
    void apiClient
      .remixPublishedPage(entry.slug)
      .then((res) => {
        setPublishedPages((prev) =>
          prev.map((page) =>
            page.slug === entry.slug ? { ...page, remixes: res.remixes } : page
          )
        );
      })
      .catch(() => undefined);

    openInWorkspace({
      kind: 'remix-page',
      id: entry.slug,
      title: entry.title,
      sourceLibrary: 'Cộng đồng F-Forum',
      prompt: entry.prompt,
      html: entry.html,
      profile: entry.profile,
    });
  };

  const handleCopyShareUrl = async (entry: GalleryEntry) => {
    const url = entry.liveUrl || `${window.location.origin}/p/${encodeURIComponent(entry.slug)}`;
    const ok = await copyText(url);
    if (ok) {
      setCopiedSlug(entry.slug);
      window.setTimeout(() => {
        setCopiedSlug((prev) => (prev === entry.slug ? null : prev));
      }, 1800);
      addToast({ type: 'success', title: 'Đã chép liên kết trang', message: url });
    }
  };

  const modalSrcDoc = useMemo(
    () =>
      previewEntry && !previewEntry.liveUrl && previewEntry.html
        ? hardenPreviewHtml(compileSpecimenSrcDoc(previewEntry.html, '', theme))
        : '',
    [previewEntry, theme]
  );

  const liveModalPage = previewEntry
    ? publishedPages.find((p) => p.slug === previewEntry.slug)
    : undefined;

  const spring = reduced ? { duration: 0.01 } : { type: 'spring' as const, stiffness: 320, damping: 30 };
  const communityBentoSpans = useMemo(
    () => computeCommunityBentoSpans(filteredEntries.length),
    [filteredEntries.length]
  );

  return (
    <div className="wrap-wide cm">
      <header
        className="cm-head lg-glass lg-glass--matte"
        onPointerMove={handleLiquidPointerMove}
        onPointerLeave={handleLiquidPointerLeave}
      >
        <div className="cm-head-copy">
          <h1 className="cm-title">Cộng đồng F-Forum</h1>
          <p className="cm-sub">
            Nơi trưng bày các trang web chạy thật từ thành viên với lượt xem và lượt thích thực tế, cùng sổ tay 58 kỹ thuật giao diện.
          </p>
        </div>

        <div className="cm-head-actions">
          <button
            type="button"
            className="cm-share-btn"
            onClick={() => navigate('workspace')}
          >
            Đăng trang từ Workspace
          </button>
        </div>
      </header>

      <div className="cm-tabs-row">
        <div className="cm-tabs" role="tablist" aria-label="Phân mục Cộng đồng">
          <button
            type="button"
            role="tab"
            className="cm-tab"
            aria-selected={topTab === 'remix'}
            onClick={() => setTopTab('remix')}
          >
            {topTab === 'remix' ? (
              <motion.span layoutId="cm-tab-pill" className="cm-tab-bg" transition={spring} aria-hidden="true" />
            ) : null}
            <span>Sản phẩm thật</span>
          </button>
          <button
            type="button"
            role="tab"
            className="cm-tab"
            aria-selected={topTab === 'knowledge'}
            onClick={() => setTopTab('knowledge')}
          >
            {topTab === 'knowledge' ? (
              <motion.span layoutId="cm-tab-pill" className="cm-tab-bg" transition={spring} aria-hidden="true" />
            ) : null}
            <span>Sổ tay<span className="cm-tab-suffix"> (58 kỹ thuật)</span></span>
          </button>
        </div>

        {topTab === 'remix' ? (
          <span className="t-label">
            {filteredEntries.length} sản phẩm thực tế
          </span>
        ) : null}
      </div>

      {topTab === 'knowledge' ? (
        <KnowledgeView />
      ) : (
        <>
          <div className="cm-toolbar">
            <div className="cm-filters" role="group" aria-label="Lọc theo nhóm trang">
              {FILTER_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  className="cm-filter-pill"
                  aria-pressed={filter === pill.id}
                  onClick={() => setFilter(pill.id)}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="cm-tools-right">
              <label className="cm-search">
                <IconSearch size={16} aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm trang theo tên, tác giả..."
                  aria-label="Tìm trang cộng đồng"
                />
                {search ? (
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}
                    aria-label="Xóa từ khóa"
                    title="Xóa"
                    onClick={() => setSearch('')}
                  >
                    <IconX size={14} aria-hidden="true" />
                  </button>
                ) : null}
              </label>

              <button
                type="button"
                className="cm-icon-btn"
                aria-label="Làm mới danh sách"
                title="Làm mới"
                onClick={loadPublished}
              >
                <IconRefreshCw size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {error ? (
            <div className="cm-banner-err" role="status">
              <span>{error}</span>
              <button type="button" className="btn btn-line btn-sm" onClick={loadPublished}>
                Thử lại
              </button>
            </div>
          ) : null}

          {loading && allEntries.length === 0 ? (
            <div className="cm-grid" aria-busy="true" aria-label="Đang tải danh sách sản phẩm">
              {Array.from({ length: 2 }, (_, idx) => (
                <div key={idx} className="cm-skeleton" data-bento-span={idx === 0 ? 7 : 5}>
                  <div className="cm-skeleton-media" />
                  <div className="cm-skeleton-lines">
                    <div className="cm-skeleton-bar" style={{ width: '68%' }} />
                    <div className="cm-skeleton-bar" style={{ width: '92%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="cm-state">
              <p className="t-lead">
                {allEntries.length === 0
                  ? 'Cộng đồng chưa có sản phẩm nào được xuất bản.'
                  : 'Chưa có sản phẩm nào trong nhóm lọc hiện tại.'}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {allEntries.length > 0 ? (
                  <button
                    type="button"
                    className="btn btn-line"
                    onClick={() => {
                      setFilter('featured');
                      setSearch('');
                    }}
                  >
                    Xem tất cả
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() => navigate('workspace')}
                >
                  Xuất bản trang đầu tiên
                </button>
              </div>
            </div>
          ) : (
            <div className="cm-grid">
              {filteredEntries.map((entry, idx) => {
                const liked = Boolean(likedPublishedSlugs[entry.slug]);
                const bentoSpan = communityBentoSpans[idx] ?? 4;
                const isFeatured = bentoSpan >= 8;
                const isSingleHero = bentoSpan === 12;
                const domainLabel = hostOf(entry.liveUrl);

                return (
                  <article
                    key={entry.id}
                    className={`cm-card lg-glass lg-glass--matte${isFeatured ? ' cm-card--featured' : ''}${isSingleHero ? ' cm-card--flagship' : ''}`}
                    data-bento-span={bentoSpan}
                    onPointerMove={handleLiquidPointerMove}
                    onPointerLeave={handleLiquidPointerLeave}
                  >
                    <div className="cm-stage">
                      <MiniPageStage
                        title={entry.title}
                        html={entry.html}
                        liveUrl={entry.liveUrl}
                        theme={theme}
                      />
                      <span className="cm-stage-badge">
                        {domainLabel ? (
                          <span className="cm-stage-badge__live">
                            <IconGlobe size={12} aria-hidden="true" />
                            <span>{domainLabel}</span>
                          </span>
                        ) : (
                          entry.categoryLabel
                        )}
                      </span>
                      <button
                        type="button"
                        className="cm-stage-trigger"
                        aria-label={`Xem trực tiếp ${entry.title}`}
                        onClick={() => handleOpenPreview(entry)}
                      />
                      <button
                        type="button"
                        className="cm-stage-expand"
                        aria-label={`Mở lớn ${entry.title}`}
                        title="Xem lớn"
                        onClick={() => handleOpenPreview(entry)}
                      >
                        <IconMaximize2 size={15} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="cm-card-content">
                      <div className="cm-card-body">
                        <div className="cm-card-eyebrow">
                          <span className="cm-origin-tag">{entry.categoryLabel}</span>
                          {entry.liveUrl ? (
                            <span className="cm-live-pill">Web chạy thật</span>
                          ) : null}
                        </div>
                        <h2 className="cm-card-title" title={entry.title}>
                          {entry.title}
                        </h2>
                        <p className="cm-card-summary">{entry.summary}</p>
                        <div className="cm-author-row">
                          <span className="cm-author">
                            <span className="cm-author-avatar" aria-hidden="true">
                              {initialsOf(entry.authorName)}
                            </span>
                            <span className="cm-author-name">{entry.authorName}</span>
                          </span>
                          <span className="cm-origin-tag">{entry.authorRole}</span>
                        </div>
                      </div>

                      <div className="cm-card-foot">
                        <div className="cm-card-metrics">
                          <button
                            type="button"
                            className="cm-heart-btn"
                            aria-pressed={liked}
                            aria-label={`${liked ? 'Bỏ thích' : 'Thích'} ${entry.title}`}
                            onClick={() => void handleToggleHeart(entry)}
                          >
                            <IconHeart size={15} filled={liked} aria-hidden="true" />
                            <span>{entry.likes}</span>
                          </button>
                          <span className="cm-stat-pill" title="Lượt xem thực tế">
                            <IconEye size={14} aria-hidden="true" />
                            <span>{entry.views}</span>
                          </span>
                          {entry.remixes > 0 ? (
                            <span className="cm-remix-stat">{entry.remixes} remix</span>
                          ) : null}
                        </div>

                        <div className="cm-card-actions">
                          {entry.liveUrl ? (
                            <>
                              <button
                                type="button"
                                className="cm-ghost-btn"
                                onClick={() => handleOpenPreview(entry)}
                              >
                                Xem trực tiếp
                              </button>
                              <a
                                href={entry.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cm-remix-btn"
                                onClick={() => trackRealView(entry)}
                              >
                                <span>Mở trang thật</span>
                                <IconExternalLink size={14} aria-hidden="true" />
                              </a>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="cm-remix-btn"
                              onClick={() => handleRemix(entry)}
                            >
                              Remix ngay
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {previewEntry ? (
          <motion.div
            key="cm-preview-modal"
            className="cm-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={`Xem trực tiếp ${previewEntry.title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setPreviewEntry(null)}
          >
            <motion.div
              className="cm-modal lg-chrome"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="cm-modal-head">
                <div className="cm-modal-meta">
                  <h2 className="cm-modal-title">{previewEntry.title}</h2>
                  <span className="t-label">
                    {previewEntry.authorName} · {previewEntry.categoryLabel}
                    {previewEntry.liveUrl ? ` · ${hostOf(previewEntry.liveUrl)}` : ''}
                  </span>
                </div>

                <div className="cm-modal-tools">
                  <button
                    type="button"
                    className="cm-icon-btn"
                    aria-pressed={modalViewport === 1440}
                    aria-label="Khung máy tính"
                    title="Máy tính (1440px)"
                    onClick={() => setModalViewport(1440)}
                  >
                    <IconMonitor size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="cm-icon-btn"
                    aria-pressed={modalViewport === 768}
                    aria-label="Khung máy tính bảng"
                    title="Máy tính bảng (768px)"
                    onClick={() => setModalViewport(768)}
                  >
                    <IconTablet size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="cm-icon-btn"
                    aria-pressed={modalViewport === 390}
                    aria-label="Khung điện thoại"
                    title="Điện thoại (390px)"
                    onClick={() => setModalViewport(390)}
                  >
                    <IconSmartphone size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="cm-icon-btn"
                    aria-label="Chép liên kết"
                    title={copiedSlug === previewEntry.slug ? 'Đã chép liên kết' : 'Chép liên kết'}
                    onClick={() => void handleCopyShareUrl(previewEntry)}
                  >
                    {copiedSlug === previewEntry.slug ? (
                      <IconCheck size={16} aria-hidden="true" />
                    ) : (
                      <IconCopy size={16} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="cm-icon-btn"
                    aria-label="Đóng"
                    title="Đóng"
                    onClick={() => setPreviewEntry(null)}
                  >
                    <IconX size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="cm-modal-stage">
                <div className="cm-modal-frame" data-viewport={modalViewport}>
                  {previewEntry.liveUrl ? (
                    <iframe
                      title={`Bản chạy trực tiếp ${previewEntry.title}`}
                      src={previewEntry.liveUrl}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <iframe
                      title={`Bản chạy thử ${previewEntry.title}`}
                      srcDoc={modalSrcDoc}
                      sandbox="allow-scripts"
                    />
                  )}
                </div>
              </div>

              <div className="cm-modal-foot">
                <div className="cm-card-metrics">
                  <button
                    type="button"
                    className="cm-heart-btn"
                    aria-pressed={Boolean(likedPublishedSlugs[previewEntry.slug])}
                    onClick={() => void handleToggleHeart(previewEntry)}
                  >
                    <IconHeart
                      size={16}
                      filled={Boolean(likedPublishedSlugs[previewEntry.slug])}
                      aria-hidden="true"
                    />
                    <span>{liveModalPage?.likes ?? previewEntry.likes}</span>
                  </button>
                  <span className="cm-stat-pill">
                    <IconEye size={15} aria-hidden="true" />
                    <span>{liveModalPage?.views ?? previewEntry.views} lượt xem</span>
                  </span>
                </div>

                {previewEntry.liveUrl ? (
                  <a
                    href={previewEntry.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cm-share-btn"
                  >
                    <span>Mở trang thật</span>
                    <IconExternalLink size={15} aria-hidden="true" />
                  </a>
                ) : (
                  <button
                    type="button"
                    className="cm-share-btn"
                    onClick={() => handleRemix(previewEntry)}
                  >
                    Remix ngay
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CommunityView;
