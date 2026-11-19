import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { STACKING_PROJECTS } from '../../data/realShowcaseData';
import type { ResourceItem, SourceCatalogItem, SourceLibraryName } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { LiquidTabs, Magnify, ReaderCard, SearchCard } from '../../components/pinui';
import { GitHubShowcase } from './GitHubShowcase';
import { RepoLeaderboard } from './RepoLeaderboard';

type ExploreMode = 'templates' | 'github' | 'leaderboard';
type SortMode = 'popular' | 'recent' | 'minimal';

const LIBRARY_PILLS: Array<{ id: 'all' | SourceLibraryName; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'threeui', label: 'ThreeUI' },
  { id: 'pinui', label: 'PinUI' },
  { id: 'motionsites', label: 'MotionSites' },
  { id: 'lucianlabs', label: 'LucianLabs' },
  { id: 'codefronts', label: 'CodeFronts' },
];

const SORT_PILLS: Array<{ id: SortMode; label: string }> = [
  { id: 'popular', label: 'Phổ biến' },
  { id: 'recent', label: 'Mới nhất' },
  { id: 'minimal', label: 'Tối giản' },
];

const LIBRARY_DISPLAY: Record<SourceLibraryName, string> = {
  threeui: 'ThreeUI',
  pinui: 'PinUI',
  motionsites: 'MotionSites',
  lucianlabs: 'LucianLabs',
  codefronts: 'CodeFronts',
};

function escapeHtml(raw: string): string {
  return raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function splitOrnate(raw: string): { cap: string; rest: string } {
  const text = raw.trim();
  if (!text) return { cap: '', rest: '' };
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('vi', { granularity: 'grapheme' });
    const first = seg.segment(text)[Symbol.iterator]().next().value;
    const cap = first ? first.segment : text.slice(0, 1);
    return { cap, rest: text.slice(cap.length) };
  }
  return { cap: text.slice(0, 1), rest: text.slice(1) };
}

function buildTemplatePreviewDoc(item: SourceCatalogItem, theme: 'dark' | 'light'): string {
  const isDark = theme === 'dark';
  const bg = isDark ? '#090a0d' : '#f7f5f0';
  const surface = isDark ? '#0f1117' : '#fbfbfa';
  const panel = isDark ? '#141720' : '#efece4';
  const border = isDark ? 'rgba(244,241,234,0.14)' : 'rgba(20,20,19,0.14)';
  const ink = isDark ? '#f4f1ea' : '#141413';
  const muted = isDark ? '#adb3bf' : '#52514d';
  const accent = isDark ? '#c89b54' : '#825b1d';
  const inverse = isDark ? '#090a0d' : '#fbfbfa';
  const verdigris = isDark ? '#2dd4bf' : '#0f766e';

  if (item.previewHtml) {
    return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:${bg};color:${ink};font-family:'Be Vietnam Pro',system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:20px}
      ${item.previewCss || ''}
    </style></head><body>${item.previewHtml}</body></html>`;
  }

  const safeTitle = escapeHtml(item.title);
  const safeLib = escapeHtml(LIBRARY_DISPLAY[item.sourceLibrary]);
  const safeSub = escapeHtml(`${item.category} · ${item.subcategory}`);
  const safeDesc = escapeHtml(item.description);
  const safeRuntime = escapeHtml(item.runtime.slice(0, 56));
  const safeTags = item.tags
    .slice(0, 4)
    .map((t) => `<span class="chip">${escapeHtml(t)}</span>`)
    .join('');

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${bg};color:${ink};font-family:'Be Vietnam Pro',system-ui,sans-serif;min-height:100vh;padding:18px;display:flex;flex-direction:column;gap:14px;overflow:hidden}
    .bar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:14px;background:${surface};border:1px solid ${border};font-size:11px}
    .lib{font-family:'JetBrains Mono',monospace;color:${accent};font-weight:600;letter-spacing:0.08em}
    .stage{flex:1;display:grid;grid-template-columns:1.3fr 1fr;gap:12px}
    .panel{border-radius:18px;background:${surface};border:1px solid ${border};padding:18px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
    .kicker{font-family:'JetBrains Mono',monospace;font-size:10px;color:${verdigris};letter-spacing:0.12em}
    h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;line-height:1.15;margin-top:8px;font-weight:600}
    p{font-size:12px;color:${muted};line-height:1.55;margin-top:8px}
    .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
    .chip{font-family:'JetBrains Mono',monospace;font-size:10px;padding:3px 9px;border-radius:999px;border:1px solid ${border};background:${panel};color:${muted}}
    .meter{height:5px;border-radius:999px;background:${panel};overflow:hidden;margin-top:10px}
    .fill{height:100%;width:82%;background:${accent}}
    .btn{margin-top:14px;align-self:flex-start;padding:8px 16px;border-radius:999px;background:${accent};color:${inverse};font-size:11px;font-weight:600;border:0;cursor:pointer}
    @media(max-width:520px){.stage{grid-template-columns:1fr}}
  </style></head><body>
    <div class="bar"><span class="lib">${safeLib}</span><span style="color:${muted}">${safeSub}</span></div>
    <div class="stage">
      <div class="panel">
        <div>
          <div class="kicker">LIVE VIEW · SANDBOX</div>
          <h1>${safeTitle}</h1>
          <p>${safeDesc}</p>
        </div>
        <button class="btn" id="ping" type="button">Thử nghiệm</button>
      </div>
      <div class="panel">
        <div>
          <div class="kicker">${safeRuntime}</div>
          <div class="chips">${safeTags}</div>
        </div>
        <div>
          <div style="font-size:11px;display:flex;justify-content:space-between;color:${muted}"><span>Trạng thái</span><strong style="color:${ink}" id="st">Sẵn sàng</strong></div>
          <div class="meter"><div class="fill"></div></div>
        </div>
      </div>
    </div>
    <script>
      var c=0;
      var b=document.getElementById('ping');
      var s=document.getElementById('st');
      if(b&&s){b.addEventListener('click',function(){c+=1;s.textContent='Nhịp #' + c;});}
    </script>
  </body></html>`;
}

function resolveIncomingMode(value: string | undefined | null): ExploreMode | null {
  if (value === 'leaderboard') return 'leaderboard';
  if (value === 'github') return 'github';
  if (value === 'templates' || value === 'resources') return 'templates';
  return null;
}

export const ExploreView: React.FC = () => {
  const {
    sourceCatalog,
    resourceLibrary,
    savedItemIds,
    toggleSavedItem,
    attachItemToWorkspace,
    createProject,
    theme,
  } = useAppStore();

  const [mode, setMode] = useState<ExploreMode>(() => {
    if (typeof window === 'undefined') return 'templates';
    return resolveIncomingMode(window.sessionStorage.getItem('ff_explore_mode')) || 'templates';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'PinUI',
    'ThreeUI',
    'Liquid Glass',
    'Shopify Winter',
  ]);
  const [selectedLibrary, setSelectedLibrary] = useState<'all' | SourceLibraryName>('all');
  const [sortMode, setSortMode] = useState<SortMode>('popular');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(sourceCatalog[0]?.id || '');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = resolveIncomingMode(window.sessionStorage.getItem('ff_explore_mode'));
    if (stored) {
      setMode(stored);
      window.sessionStorage.removeItem('ff_explore_mode');
    }
    const onExploreMode = (event: Event) => {
      const detail = (event as CustomEvent<string | { mode?: string }>).detail;
      const raw = typeof detail === 'string' ? detail : detail?.mode;
      const next = resolveIncomingMode(raw);
      if (next) setMode(next);
    };
    window.addEventListener('ff:explore-mode', onExploreMode);
    return () => window.removeEventListener('ff:explore-mode', onExploreMode);
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = sourceCatalog.filter((item) => {
      if (selectedLibrary !== 'all' && item.sourceLibrary !== selectedLibrary) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.runtime.toLowerCase().includes(q) ||
        item.sourceLibrary.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    const sorted = [...list];
    if (sortMode === 'recent') {
      sorted.reverse();
    } else if (sortMode === 'minimal') {
      sorted.sort((a, b) => a.runtime.length - b.runtime.length);
    } else {
      const rank: Record<SourceLibraryName, number> = {
        pinui: 1,
        lucianlabs: 2,
        motionsites: 3,
        threeui: 4,
        codefronts: 5,
      };
      sorted.sort((a, b) => rank[a.sourceLibrary] - rank[b.sourceLibrary]);
    }
    return sorted;
  }, [sourceCatalog, selectedLibrary, searchQuery, sortMode]);

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return resourceLibrary.slice(0, 12);
    return resourceLibrary.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [resourceLibrary, searchQuery]);

  const selectedTemplate = useMemo(() => {
    return (
      filteredTemplates.find((item) => item.id === selectedTemplateId) ||
      filteredTemplates[0] ||
      sourceCatalog[0] ||
      null
    );
  }, [filteredTemplates, selectedTemplateId, sourceCatalog]);

  useEffect(() => {
    if (selectedTemplate && selectedTemplate.id !== selectedTemplateId) {
      setSelectedTemplateId(selectedTemplate.id);
    }
  }, [selectedTemplate, selectedTemplateId]);

  const handleSelectRecent = (term: string) => {
    setSearchQuery(term);
    setRecentSearches((prev) => [term, ...prev.filter((item) => item !== term)].slice(0, 5));
  };

  const handleOpenTemplateInWorkspace = (tpl: SourceCatalogItem) => {
    createProject(tpl.title, `${LIBRARY_DISPLAY[tpl.sourceLibrary]} — ${tpl.description}`);
    attachItemToWorkspace(
      {
        id: tpl.id,
        kind: 'template',
        title: tpl.title,
        sourceLibrary: tpl.sourceLibrary,
        summary: tpl.description,
        payload: tpl.promptSpec || `${tpl.archivePath}\nRuntime: ${tpl.runtime}\nStyle: ${tpl.style}`,
        tags: tpl.tags,
      },
      true
    );
  };

  const handleUseResource = (item: ResourceItem) => {
    attachItemToWorkspace(
      {
        id: item.id,
        kind: 'resource',
        title: item.title,
        summary: item.description,
        payload: item.snippet || `${item.title} (${item.officialUrl})`,
        tags: item.tags,
      },
      true
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLibrary('all');
    setSortMode('popular');
  };

  const headingSplit = splitOrnate('Kho tàng Giao diện');
  const specimenParagraphs = useMemo(() => {
    if (!selectedTemplate) return undefined;
    return [
      selectedTemplate.description,
      `Thuộc hệ thống ${LIBRARY_DISPLAY[selectedTemplate.sourceLibrary]} (${selectedTemplate.category} / ${selectedTemplate.subcategory}), mẫu này vận hành trên nền tảng ${selectedTemplate.runtime} với ngôn ngữ tạo hình ${selectedTemplate.style}.`,
      selectedTemplate.promptSpec ||
        `Đường dẫn lưu trữ chuẩn hóa tại ${selectedTemplate.archivePath}, giữ nguyên tỷ lệ nhịp 8px, độ tương phản rõ nét ở cả nền tối lẫn nền sáng và sẵn sàng đưa sang Workspace.`,
      `Giấy phép phát hành: ${selectedTemplate.license}. Bạn có thể kiểm định trực tiếp trong Live View trước khi đối chiếu Diff & Check.`,
    ];
  }, [selectedTemplate]);

  const isFiltered = Boolean(searchQuery.trim() || selectedLibrary !== 'all' || sortMode !== 'popular');
  const selectedSaved = selectedTemplate ? savedItemIds.includes(selectedTemplate.id) : false;

  return (
    <div className="ff-container pt-8 pb-24 space-y-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b pb-8" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-2xl space-y-3">
          <p className="font-mono text-[11px] tracking-[0.22em]" style={{ color: 'var(--accent-primary)' }}>
            F-FORUM · KHO MẪU &amp; MÃ NGUỒN
          </p>
          <h1
            className="m-0 font-semibold tracking-tight leading-[1.05]"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.2rem, 4.4vw, 3.5rem)',
              color: 'var(--ink-primary)',
            }}
          >
            <span className="ornate-cap">{headingSplit.cap}</span>
            {headingSplit.rest}
          </h1>
          <p className="m-0 text-[15px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
            Những cấu trúc giao diện được tuyển chọn từ PinUI, ThreeUI, MotionSites, LucianLabs và các kho lưu trữ mở, sẵn sàng kiểm định trong Live View.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:w-[440px]">
          <div className="min-w-0 flex-1">
            <SearchCard
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm mẫu, thư viện, kho lưu trữ..."
              recentSearches={recentSearches}
              onSelectRecent={handleSelectRecent}
              compact
            />
          </div>
          {isFiltered ? (
            <button
              type="button"
              onClick={resetFilters}
              aria-label="Đặt lại bộ lọc"
              title="Đặt lại bộ lọc"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--ink-primary)',
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <LiquidTabs
          tabs={[
            { id: 'templates', label: 'Kho mẫu' },
            { id: 'github', label: 'GitHub' },
            { id: 'leaderboard', label: 'Xếp hạng' },
          ]}
          activeId={mode}
          onChange={(id) => setMode(id as ExploreMode)}
          ariaLabel="Chế độ khám phá"
        />

        {mode === 'templates' ? (
          <div className="flex flex-wrap items-center gap-2">
            {SORT_PILLS.map((opt) => {
              const active = sortMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortMode(opt.id)}
                  className="rounded-full border px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface)',
                    borderColor: active ? 'var(--border-accent)' : 'var(--border-subtle)',
                    color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {mode === 'github' ? (
        <GitHubShowcase searchQuery={searchQuery} />
      ) : mode === 'leaderboard' ? (
        <RepoLeaderboard
          searchQuery={searchQuery}
          onResetSearch={() => setSearchQuery('')}
          onOpenGitHubShowcase={() => setMode('github')}
        />
      ) : (
        <section aria-label="Trưng bày mẫu giao diện" className="space-y-12">
          <div className="flex gap-2 overflow-x-auto pb-1 ff-scrollbar">
            {LIBRARY_PILLS.map((pill) => {
              const active = selectedLibrary === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedLibrary(pill.id)}
                  className="shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    color: active ? 'var(--ink-inverse)' : 'var(--ink-secondary)',
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {selectedTemplate ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-6 items-stretch">
              <div className="min-w-0 flex flex-col">
                <ReaderCard
                  title={selectedTemplate.title}
                  subtitle={`${LIBRARY_DISPLAY[selectedTemplate.sourceLibrary]} · ${selectedTemplate.category}`}
                  paragraphs={specimenParagraphs}
                  openLabel="Đọc sâu"
                  theme={theme}
                  className="w-full flex-1"
                />
              </div>

              <div className="flex items-center justify-center">
                <Magnify
                  glyph={selectedTemplate.title.trim().slice(0, 1).toUpperCase() || 'F'}
                  microText={`${selectedTemplate.title.toUpperCase()} · ${LIBRARY_DISPLAY[selectedTemplate.sourceLibrary].toUpperCase()} · ${selectedTemplate.style.toUpperCase()} · `}
                  hintText="Rê kính soi chi tiết · Chạm để phóng đại"
                  theme={theme}
                  size={340}
                />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-start">
            <div className="min-w-0 space-y-10">
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h2
                    className="text-xl font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                  >
                    Dải mẫu Tuyển chọn
                  </h2>
                  <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {filteredTemplates.length} mẫu
                  </span>
                </div>

                {filteredTemplates.length === 0 ? (
                  <div
                    className="rounded-[22px] border p-10 text-center space-y-3"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <p className="text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                      Không có mẫu phù hợp với bộ lọc hiện tại
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="h-9 rounded-full px-4 text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--ink-inverse)',
                      }}
                    >
                      Đặt lại
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-5 overflow-x-auto pb-4 snap-x ff-scrollbar">
                    {filteredTemplates.slice(0, 24).map((tpl, idx) => {
                      const active = selectedTemplate?.id === tpl.id;
                      const isSaved = savedItemIds.includes(tpl.id);
                      return (
                        <article
                          key={tpl.id}
                          className="min-w-[295px] max-w-[330px] shrink-0 snap-start rounded-[22px] border p-5 flex flex-col justify-between gap-4 transition-colors"
                          style={{
                            backgroundColor: active ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                            borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          }}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                              <span style={{ color: 'var(--accent-primary)' }}>
                                {LIBRARY_DISPLAY[tpl.sourceLibrary]}
                              </span>
                              <span style={{ color: 'var(--ink-muted)' }}>
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <h3
                              className="truncate text-lg font-semibold"
                              style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                            >
                              {tpl.title}
                            </h3>
                            <p className="line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                              {tpl.description}
                            </p>
                            <p className="truncate font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                              {tpl.runtime}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedTemplateId(tpl.id)}
                              className="h-9 rounded-full border px-3.5 text-xs font-medium cursor-pointer"
                              style={{
                                backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-panel)',
                                borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                                color: active ? 'var(--accent-primary)' : 'var(--ink-primary)',
                              }}
                            >
                              Xem mẫu
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenTemplateInWorkspace(tpl)}
                              className="h-9 rounded-full px-4 text-xs font-semibold cursor-pointer"
                              style={{
                                backgroundColor: 'var(--accent-primary)',
                                color: 'var(--ink-inverse)',
                              }}
                            >
                              Workspace
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSavedItem(tpl.id)}
                              aria-label={isSaved ? `Bỏ lưu ${tpl.title}` : `Lưu ${tpl.title}`}
                              title={isSaved ? 'Bỏ lưu' : 'Lưu mẫu'}
                              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                              style={{
                                backgroundColor: 'var(--bg-panel)',
                                borderColor: isSaved ? 'var(--accent-jade)' : 'var(--border-subtle)',
                                color: isSaved ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                              }}
                            >
                              {isSaved ? (
                                <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                            </button>
                            <a
                              href={tpl.officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Mở nguồn ${tpl.title}`}
                              title="Trang nguồn"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                              style={{
                                backgroundColor: 'var(--bg-panel)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--ink-secondary)',
                              }}
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h2
                    className="text-xl font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                  >
                    Khảo cứu Kiến trúc
                  </h2>
                  <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {STACKING_PROJECTS.length} chuyên đề
                  </span>
                </div>

                <div className="flex gap-5 overflow-x-auto pb-4 snap-x ff-scrollbar">
                  {STACKING_PROJECTS.map((proj) => (
                    <article
                      key={proj.id}
                      className="min-w-[320px] max-w-[380px] shrink-0 snap-start rounded-[22px] border overflow-hidden flex flex-col justify-between"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div>
                        <img
                          src={proj.images[0]}
                          alt={proj.title}
                          loading="lazy"
                          className="h-44 w-full object-cover block border-b"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        />
                        <div className="p-5 space-y-2.5">
                          <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                            <span style={{ color: 'var(--accent-primary)' }}>{proj.category}</span>
                            <span style={{ color: 'var(--ink-muted)' }}>{proj.indexLabel}</span>
                          </div>
                          <h3
                            className="text-lg font-semibold"
                            style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                          >
                            {proj.title}
                          </h3>
                          <p className="line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                            {proj.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 flex items-center justify-between gap-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <button
                          type="button"
                          onClick={() =>
                            attachItemToWorkspace(
                              {
                                id: proj.id,
                                kind: 'blueprint',
                                title: proj.title,
                                summary: proj.subtitle,
                                payload: proj.previewHtml || proj.liveUrl,
                                tags: [proj.category],
                              },
                              true
                            )
                          }
                          className="h-9 rounded-full px-4 text-xs font-semibold cursor-pointer"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'var(--ink-inverse)',
                          }}
                        >
                          Workspace
                        </button>
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Mở ${proj.title}`}
                          title="Mở liên kết"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--accent-verdigris)',
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {filteredTools.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                    <h2
                      className="text-xl font-semibold"
                      style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                    >
                      Công cụ Kỹ thuật
                    </h2>
                    <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                      {filteredTools.length} mục
                    </span>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-3 snap-x ff-scrollbar">
                    {filteredTools.map((tool) => {
                      const isSaved = savedItemIds.includes(tool.id);
                      return (
                        <article
                          key={tool.id}
                          className="min-w-[270px] max-w-[300px] shrink-0 snap-start rounded-[20px] border p-4 flex flex-col justify-between gap-3"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        >
                          <div className="space-y-1.5">
                            <span className="block font-mono text-[11px]" style={{ color: 'var(--accent-verdigris)' }}>
                              {tool.group}
                            </span>
                            <h3 className="truncate text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                              {tool.title}
                            </h3>
                            <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                              {tool.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                            <button
                              type="button"
                              onClick={() => handleUseResource(tool)}
                              className="h-8 rounded-full px-3.5 text-xs font-semibold cursor-pointer"
                              style={{
                                backgroundColor: 'var(--accent-primary)',
                                color: 'var(--ink-inverse)',
                              }}
                            >
                              Workspace
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSavedItem(tool.id)}
                              aria-label={isSaved ? `Bỏ lưu ${tool.title}` : `Lưu ${tool.title}`}
                              title={isSaved ? 'Bỏ lưu' : 'Lưu'}
                              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border cursor-pointer"
                              style={{
                                backgroundColor: 'var(--bg-panel)',
                                borderColor: isSaved ? 'var(--accent-jade)' : 'var(--border-subtle)',
                                color: isSaved ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                              }}
                            >
                              {isSaved ? (
                                <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                            </button>
                            <a
                              href={tool.officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Mở ${tool.title}`}
                              title="Trang chủ"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
                              style={{
                                backgroundColor: 'var(--bg-panel)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--ink-secondary)',
                              }}
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {selectedTemplate ? (
              <aside
                aria-label="Sân khấu Live View"
                className="xl:sticky xl:top-24 rounded-[26px] border overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="min-w-0">
                    <span className="block font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
                      {LIBRARY_DISPLAY[selectedTemplate.sourceLibrary]} · LIVE VIEW
                    </span>
                    <h3
                      className="truncate text-lg font-semibold"
                      style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                    >
                      {selectedTemplate.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleSavedItem(selectedTemplate.id)}
                      aria-label={selectedSaved ? `Bỏ lưu ${selectedTemplate.title}` : `Lưu ${selectedTemplate.title}`}
                      title={selectedSaved ? 'Bỏ lưu' : 'Lưu mẫu'}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: selectedSaved ? 'var(--accent-jade)' : 'var(--border-subtle)',
                        color: selectedSaved ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                      }}
                    >
                      {selectedSaved ? (
                        <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Bookmark className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                    <a
                      href={selectedTemplate.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Mở nguồn ${selectedTemplate.title}`}
                      title="Trang nguồn"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-primary)',
                      }}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenTemplateInWorkspace(selectedTemplate)}
                      className="h-9 rounded-full px-4 text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--ink-inverse)',
                      }}
                    >
                      Workspace
                    </button>
                  </div>
                </div>

                <iframe
                  title={`Xem trực tiếp ${selectedTemplate.title}`}
                  loading="eager"
                  sandbox="allow-scripts"
                  referrerPolicy="no-referrer"
                  srcDoc={buildTemplatePreviewDoc(selectedTemplate, theme)}
                  className="h-[360px] w-full border-0 block"
                  style={{ backgroundColor: 'var(--bg-canvas)' }}
                />

                <div
                  className="grid grid-cols-3 gap-4 border-t px-5 py-4"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="min-w-0">
                    <span className="block font-mono text-[10px]" style={{ color: 'var(--ink-muted)' }}>
                      Nền tảng
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium" style={{ color: 'var(--ink-primary)' }}>
                      {selectedTemplate.runtime}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block font-mono text-[10px]" style={{ color: 'var(--ink-muted)' }}>
                      Phong cách
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium" style={{ color: 'var(--ink-primary)' }}>
                      {selectedTemplate.style}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block font-mono text-[10px]" style={{ color: 'var(--ink-muted)' }}>
                      Giấy phép
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium" style={{ color: 'var(--ink-primary)' }}>
                      {selectedTemplate.license}
                    </span>
                  </div>
                </div>
              </aside>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
};

export default ExploreView;
