import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  IconCheck,
  IconCopy,
  IconHeart,
  IconMaximize2,
  IconMonitor,
  IconRefreshCw,
  IconSearch,
  IconSmartphone,
  IconTablet,
  IconX,
} from '../../ui/icons';
import { AGENT_SHOWCASE_15 } from '../../data/agentShowcase15';
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
  likes: number;
  remixes: number;
  source: 'published' | 'showcase';
  createdAt: string;
  personality: BrandPersonality;
  prompt: string;
  profile?: Partial<OnboardingProfile>;
}

const FILTER_PILLS: Array<{ id: RemixFilterKey; label: string }> = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'presentation', label: 'Thuyết trình' },
  { id: 'event', label: 'Sự kiện CLB' },
  { id: 'portfolio', label: 'Hồ sơ' },
  { id: 'business-tech', label: 'Sản phẩm & Tech' },
];

const CATEGORY_LABELS: Record<PublishedPageCategory, string> = {
  presentation: 'Thuyết trình',
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
  guest: 'Khách trải nghiệm',
};

function formatAuthorRole(raw?: string): string {
  const clean = (raw || '').trim();
  if (!clean) return 'Đã xuất bản';
  return AUTHOR_ROLE_LABELS[clean.toLowerCase()] || clean;
}

const PREVIEW_CANVAS_WIDTH = 1280;

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

interface MiniHtmlStageProps {
  title: string;
  html: string;
  theme: 'dark' | 'light';
}

const MiniHtmlStage: React.FC<MiniHtmlStageProps> = ({ title, html, theme }) => {
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
    () => (visible ? compileSpecimenSrcDoc(html, '', theme) : ''),
    [visible, html, theme]
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
          <iframe
            className="cm-stage-iframe"
            title={`Xem trước ${title}`}
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            loading="lazy"
            tabIndex={-1}
          />
        </div>
      ) : null}
    </div>
  );
};

export const CommunityView: React.FC = () => {
  const {
    navigate,
    openInWorkspace,
    recordSignal,
    isItemLiked,
    toggleLikedItem,
    getHeartCount,
    theme,
    addToast,
  } = useAppStore();
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
        setError('Chưa kết nối được danh sách trang xuất bản từ máy chủ. Bạn vẫn có thể chạy thử và Remix 15 trang mẫu bên dưới.');
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

  const allEntries = useMemo<GalleryEntry[]>(() => {
    const publishedEntries: GalleryEntry[] = publishedPages.map((page) => ({
      id: `pub:${page.slug}`,
      slug: page.slug,
      title: page.title,
      summary: page.summary || 'Trang web được xuất bản trực tiếp từ Workspace.',
      authorName: page.authorName || 'Thành viên F-Forum',
      authorRole: formatAuthorRole(page.authorRole),
      category: page.category,
      categoryLabel: CATEGORY_LABELS[page.category] || 'Trang web',
      html: page.html,
      likes: typeof page.likes === 'number' && page.likes >= 0 ? page.likes : 0,
      remixes: typeof page.remixes === 'number' && page.remixes >= 0 ? page.remixes : 0,
      source: 'published',
      createdAt: page.updatedAt || page.createdAt,
      personality: page.personality,
      prompt: `Remix từ trang "${page.title}": giữ cấu trúc tổng thể và điều chỉnh nội dung theo yêu cầu của tôi.`,
      profile: {
        siteName: page.title,
        personality: page.personality,
      },
    }));

    const seenSlugs = new Set(publishedEntries.map((entry) => entry.slug));

    const showcaseEntries: GalleryEntry[] = AGENT_SHOWCASE_15.filter(
      (item) => !seenSlugs.has(item.slug)
    ).map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      summary: item.subtitle,
      authorName: item.authorLabel,
      authorRole: 'Mẫu Agent',
      category: item.category,
      categoryLabel: item.categoryLabel || CATEGORY_LABELS[item.category],
      html: item.html,
      likes: getHeartCount(item.id),
      remixes: 0,
      source: 'showcase',
      createdAt: '',
      personality: item.profile.personality,
      prompt: item.userPrompt,
      profile: item.profile,
    }));

    return [...publishedEntries, ...showcaseEntries];
  }, [publishedPages, getHeartCount]);

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
      const hay = `${entry.title} ${entry.summary} ${entry.authorName} ${entry.categoryLabel}`.toLowerCase();
      return hay.includes(q);
    });

    if (filter === 'featured') {
      return [...matched].sort((a, b) => {
        const scoreA = a.likes * 3 + a.remixes * 5 + (a.source === 'published' ? 2 : 0);
        const scoreB = b.likes * 3 + b.remixes * 5 + (b.source === 'published' ? 2 : 0);
        return scoreB - scoreA;
      });
    }
    return matched;
  }, [allEntries, filter, search]);

  const handleToggleHeart = async (entry: GalleryEntry) => {
    if (entry.source === 'published') {
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
      return;
    }

    toggleLikedItem(entry.id, 'showcase');
  };

  const handleRemix = (entry: GalleryEntry) => {
    setPreviewEntry(null);
    if (entry.source === 'published') {
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
        sourceLibrary: 'Cộng đồng Remix',
        prompt: entry.prompt,
        html: entry.html,
        profile: entry.profile,
      });
      return;
    }

    recordSignal(entry.id, 'use', 'showcase');
    openInWorkspace({
      kind: 'showcase-15',
      id: entry.id,
      title: entry.title,
      sourceLibrary: entry.categoryLabel,
      prompt: entry.prompt,
      html: entry.html,
      profile: entry.profile,
    });
  };

  const handleCopyRemixUrl = async (entry: GalleryEntry) => {
    const url = `${window.location.origin}/?remix=${encodeURIComponent(entry.slug)}`;
    const ok = await copyText(url);
    if (ok) {
      setCopiedSlug(entry.slug);
      window.setTimeout(() => {
        setCopiedSlug((prev) => (prev === entry.slug ? null : prev));
      }, 1800);
      addToast({ type: 'success', title: 'Đã chép liên kết Remix', message: entry.title });
    }
  };

  const modalSrcDoc = useMemo(
    () => (previewEntry ? compileSpecimenSrcDoc(previewEntry.html, '', theme) : ''),
    [previewEntry, theme]
  );

  const spring = reduced ? { duration: 0.01 } : { type: 'spring' as const, stiffness: 320, damping: 30 };

  return (
    <div className="wrap-wide cm">
      <header className="cm-head">
        <div className="cm-head-copy">
          <h1 className="cm-title">Cộng đồng Remix</h1>
          <p className="cm-sub">
            Xem các trang đã xuất bản, mở lại trong Workspace để chỉnh theo ý bạn, hoặc tra 58 kỹ thuật chuyển động.
          </p>
        </div>

        <div className="cm-head-actions">
          <button
            type="button"
            className="cm-share-btn"
            onClick={() => navigate('workspace')}
          >
            Chia sẻ trang
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
            <span>Cộng đồng Remix</span>
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
            {filteredEntries.length} trang chạy thật
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
            <div className="cm-grid" aria-busy="true" aria-label="Đang tải danh sách trang">
              {Array.from({ length: 6 }, (_, idx) => (
                <div key={idx} className="cm-skeleton">
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
              <p className="t-lead">Chưa có trang nào khớp bộ lọc hiện tại.</p>
              <div className="flex flex-wrap justify-center gap-3">
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
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() => navigate('workspace')}
                >
                  Tạo trang mới
                </button>
              </div>
            </div>
          ) : (
            <div className="cm-grid">
              {filteredEntries.map((entry) => {
                const liked =
                  entry.source === 'published'
                    ? Boolean(likedPublishedSlugs[entry.slug])
                    : isItemLiked(entry.id);
                const heartCount =
                  entry.source === 'published' ? entry.likes : getHeartCount(entry.id);

                return (
                  <article key={entry.id} className="cm-card">
                    <div className="cm-stage">
                      <MiniHtmlStage title={entry.title} html={entry.html} theme={theme} />
                      <span className="cm-stage-badge">{entry.categoryLabel}</span>
                      <button
                        type="button"
                        className="cm-stage-trigger"
                        aria-label={`Xem thử trực tiếp ${entry.title}`}
                        onClick={() => {
                          setModalViewport(1440);
                          setPreviewEntry(entry);
                          recordSignal(
                            entry.source === 'published' ? entry.slug : entry.id,
                            'view',
                            entry.source === 'published' ? 'community' : 'showcase'
                          );
                        }}
                      />
                      <button
                        type="button"
                        className="cm-stage-expand"
                        aria-label={`Mở lớn ${entry.title}`}
                        title="Xem thử"
                        onClick={() => {
                          setModalViewport(1440);
                          setPreviewEntry(entry);
                        }}
                      >
                        <IconMaximize2 size={15} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="cm-card-body">
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
                          <span>{heartCount}</span>
                        </button>
                        {entry.remixes > 0 ? (
                          <span className="cm-remix-stat">{entry.remixes} remix</span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="cm-remix-btn"
                        onClick={() => handleRemix(entry)}
                      >
                        Remix ngay
                      </button>
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
            aria-label={`Xem thử ${previewEntry.title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setPreviewEntry(null)}
          >
            <motion.div
              className="cm-modal"
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
                    aria-label="Chép liên kết Remix"
                    title={copiedSlug === previewEntry.slug ? 'Đã chép liên kết' : 'Chép liên kết Remix'}
                    onClick={() => void handleCopyRemixUrl(previewEntry)}
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
                  <iframe
                    title={`Bản chạy thử ${previewEntry.title}`}
                    srcDoc={modalSrcDoc}
                    sandbox="allow-scripts"
                  />
                </div>
              </div>

              <div className="cm-modal-foot">
                <button
                  type="button"
                  className="cm-heart-btn"
                  aria-pressed={
                    previewEntry.source === 'published'
                      ? Boolean(likedPublishedSlugs[previewEntry.slug])
                      : isItemLiked(previewEntry.id)
                  }
                  onClick={() => void handleToggleHeart(previewEntry)}
                >
                  <IconHeart
                    size={16}
                    filled={
                      previewEntry.source === 'published'
                        ? Boolean(likedPublishedSlugs[previewEntry.slug])
                        : isItemLiked(previewEntry.id)
                    }
                    aria-hidden="true"
                  />
                  <span>
                    {previewEntry.source === 'published'
                      ? publishedPages.find((p) => p.slug === previewEntry.slug)?.likes ?? previewEntry.likes
                      : getHeartCount(previewEntry.id)}
                  </span>
                </button>

                <button
                  type="button"
                  className="cm-share-btn"
                  onClick={() => handleRemix(previewEntry)}
                >
                  Remix ngay
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CommunityView;
