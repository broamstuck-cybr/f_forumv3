import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Cpu,
  ExternalLink,
  Filter,
  Layers,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Trophy,
} from 'lucide-react';
import repoLeaderboardJson from '../../data/repoLeaderboard.json';
import type {
  ResourceGroup,
  ResourceItem,
  SourceCatalogItem,
  SourceLibraryName,
  VerificationStatus,
} from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { Chips, FileBox, LiquidTabs, SearchCard } from '../../components/pinui';
import { RepoLeaderboard } from './RepoLeaderboard';

type ExploreMode = 'resources' | 'templates' | 'leaderboard';

const LEADERBOARD_TOTAL = Array.isArray((repoLeaderboardJson as { items?: unknown[] }).items)
  ? (repoLeaderboardJson as { items: unknown[] }).items.length
  : 0;

const RESOURCE_GROUPS: Array<'all' | ResourceGroup> = [
  'all',
  'AI Tools',
  'Prompts',
  'GitHub Repositories',
  'Skills & Rules',
  'UI/UX',
  'Documentation',
  'Learning',
  'Dev Tools',
];

const RESOURCE_TAG_CHIPS: Array<{ id: string; label: string; group: string }> = [
  { id: 'tech:React', label: 'React', group: 'Tech' },
  { id: 'tech:Next.js', label: 'Next.js', group: 'Tech' },
  { id: 'tech:Tailwind', label: 'Tailwind', group: 'Tech' },
  { id: 'tech:Python', label: 'Python', group: 'Tech' },
  { id: 'tech:TypeScript', label: 'TypeScript', group: 'Tech' },
  { id: 'platform:Antigravity', label: 'Antigravity', group: 'Platform' },
  { id: 'platform:Cursor', label: 'Cursor', group: 'Platform' },
  { id: 'platform:GitHub', label: 'GitHub', group: 'Platform' },
  { id: 'platform:Web', label: 'Web', group: 'Platform' },
  { id: 'level:Beginner', label: 'Beginner', group: 'Level' },
  { id: 'level:Intermediate', label: 'Intermediate', group: 'Level' },
  { id: 'level:Advanced', label: 'Advanced', group: 'Level' },
  { id: 'cost:Free', label: 'Free', group: 'Cost' },
  { id: 'cost:Freemium', label: 'Freemium', group: 'Cost' },
  { id: 'cost:Paid', label: 'Paid', group: 'Cost' },
];

const STYLE_FILTERS = [
  { id: 'Liquid Glass', label: 'Liquid Glass' },
  { id: 'Editorial', label: 'Editorial' },
  { id: 'Minimal', label: 'Minimal' },
  { id: '3D/Motion', label: '3D/Motion' },
  { id: 'Interactive', label: 'Interactive' },
];

type SortMode = 'popular' | 'recent' | 'minimal';

function extractTagValue(tags: string[], prefix: string, fallback: string): string {
  const match = tags.find((t) => t.toLowerCase().startsWith(`${prefix}:`));
  return match ? match.slice(prefix.length + 1) : fallback;
}

function getVerificationMeta(status: VerificationStatus): {
  label: string;
  color: string;
  bg: string;
} {
  if (status === 'verified_tested') {
    return {
      label: 'Đã kiểm thử',
      color: 'var(--accent-jade)',
      bg: 'color-mix(in srgb, var(--accent-jade) 14%, transparent)',
    };
  }
  if (status === 'verified_info') {
    return {
      label: 'Đã kiểm tra thông tin',
      color: 'var(--accent-verdigris)',
      bg: 'color-mix(in srgb, var(--accent-verdigris) 14%, transparent)',
    };
  }
  return {
    label: 'Chưa xác minh',
    color: 'var(--accent-primary)',
    bg: 'color-mix(in srgb, var(--accent-primary) 14%, transparent)',
  };
}

function classifyRuntimeBudget(item: SourceCatalogItem): {
  tier: 'CSS/DOM' | 'Motion' | 'WebGL/Three.js Direction';
  color: string;
  note: string;
} {
  const raw = `${item.runtime} ${item.sourceLibrary} ${item.style}`.toLowerCase();
  if (raw.includes('webgl') || raw.includes('three.js') || item.sourceLibrary === 'threeui') {
    return {
      tier: 'WebGL/Three.js Direction',
      color: 'var(--accent-copper)',
      note: 'Hướng thiết kế 3D/Shader — cần giảm FPS hoặc fallback tĩnh khi bật Reduced Motion.',
    };
  }
  if (raw.includes('gsap') || raw.includes('motion') || item.sourceLibrary === 'motionsites' || item.sourceLibrary === 'lucianlabs') {
    return {
      tier: 'Motion',
      color: 'var(--accent-primary)',
      note: 'Chuyển động spring/GPU transform — tối ưu 60fps trên viewport desktop & mobile.',
    };
  }
  return {
    tier: 'CSS/DOM',
    color: 'var(--accent-jade)',
    note: 'Nhẹ tải trình duyệt — chạy thuần CSS/DOM và React primitives.',
  };
}

function matchesStyleFilter(item: SourceCatalogItem, selectedStyles: string[]): boolean {
  if (selectedStyles.length === 0) return true;
  const hay = `${item.style} ${item.category} ${item.subcategory} ${item.description} ${item.tags.join(' ')} ${item.sourceLibrary}`.toLowerCase();
  return selectedStyles.some((styleId) => {
    if (styleId === 'Liquid Glass') {
      return hay.includes('glass') || hay.includes('liquid') || item.sourceLibrary === 'lucianlabs' || item.sourceLibrary === 'pinui';
    }
    if (styleId === 'Editorial') {
      return hay.includes('editorial') || hay.includes('hero') || hay.includes('curated') || item.sourceLibrary === 'motionsites';
    }
    if (styleId === 'Minimal') {
      return hay.includes('minimal') || hay.includes('pure css') || hay.includes('tailwind') || item.sourceLibrary === 'codefronts';
    }
    if (styleId === '3D/Motion') {
      return hay.includes('3d') || hay.includes('webgl') || hay.includes('motion') || item.sourceLibrary === 'threeui';
    }
    if (styleId === 'Interactive') {
      return hay.includes('interactive') || hay.includes('component') || hay.includes('micro') || item.sourceLibrary === 'pinui';
    }
    return true;
  });
}

function buildTemplatePreviewDoc(item: SourceCatalogItem, theme: 'dark' | 'light'): string {
  const isDark = theme === 'dark';
  const bg = isDark ? '#080b12' : '#f5f3ec';
  const surface = isDark ? '#121722' : '#ffffff';
  const border = isDark ? 'rgba(241,239,233,0.12)' : 'rgba(15,20,30,0.12)';
  const ink = isDark ? '#f1efe9' : '#0f141e';
  const muted = isDark ? '#9ea8b8' : '#475264';
  const accent = isDark ? '#f59e0b' : '#b45309';
  const accent2 = isDark ? '#2dd4bf' : '#0f766e';

  if (item.previewHtml) {
    return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:${bg};color:${ink};font-family:system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:20px}
      ${item.previewCss || ''}
    </style></head><body>${item.previewHtml}</body></html>`;
  }

  const safeTitle = item.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeLib = item.sourceLibrary.toUpperCase();
  const safeSub = `${item.category} / ${item.subcategory}`.replace(/</g, '&lt;');
  const safeRuntime = item.runtime.slice(0, 48).replace(/</g, '&lt;');

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${bg};color:${ink};font-family:system-ui,-apple-system,sans-serif;min-height:100vh;padding:18px;display:flex;flex-direction:column;gap:14px;overflow:hidden}
    .bar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:12px;background:${surface};border:1px solid ${border};font-size:11px}
    .pill{padding:3px 9px;border-radius:999px;background:rgba(245,158,11,0.16);color:${accent};font-weight:700;letter-spacing:0.04em}
    .stage{flex:1;display:grid;grid-template-columns:1.35fr 1fr;gap:12px}
    .panel{border-radius:16px;background:${surface};border:1px solid ${border};padding:16px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
    .panel::after{content:'';position:absolute;inset:auto -20% -40% auto;width:140px;height:140px;border-radius:999px;background:radial-gradient(circle, rgba(45,212,191,0.18), transparent 70%);pointer-events:none}
    h1{font-size:17px;line-height:1.25;margin-top:8px}
    p{font-size:12px;color:${muted};line-height:1.5;margin-top:6px}
    .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
    .chip{font-size:10px;padding:3px 8px;border-radius:999px;border:1px solid ${border};color:${muted}}
    .meter{height:6px;border-radius:999px;background:${border};overflow:hidden;margin-top:8px}
    .fill{height:100%;width:78%;background:linear-gradient(90deg,${accent},${accent2})}
    .btn{margin-top:12px;display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;border-radius:10px;background:${accent};color:#06080d;font-size:11px;font-weight:700;border:0;cursor:pointer}
  </style></head><body>
    <div class="bar"><span class="pill">${safeLib}</span><span style="color:${muted}">${safeSub}</span></div>
    <div class="stage">
      <div class="panel">
        <div>
          <div style="font-size:10px;color:${accent2};font-weight:700">ARCHITECTURAL STAGE</div>
          <h1>${safeTitle}</h1>
          <p>${safeRuntime}</p>
        </div>
        <button class="btn" id="ping">Kiểm tra tương tác</button>
      </div>
      <div class="panel">
        <div>
          <div style="font-size:10px;color:${muted};font-weight:700">TOKEN TELEMETRY</div>
          <div class="chips">${item.tags.slice(0, 4).map((t) => `<span class="chip">${t.replace(/</g, '&lt;')}</span>`).join('')}</div>
        </div>
        <div>
          <div style="font-size:11px;display:flex;justify-content:space-between;color:${muted}"><span>Surface Fit</span><strong style="color:${ink}" id="st">Sẵn sàng</strong></div>
          <div class="meter"><div class="fill"></div></div>
        </div>
      </div>
    </div>
    <script>
      var c=0;
      var b=document.getElementById('ping');
      var s=document.getElementById('st');
      if(b&&s){b.addEventListener('click',function(){c+=1;s.textContent='Tương tác #' + c;});}
    </script>
  </body></html>`;
}

export const ExploreView: React.FC = () => {
  const {
    resourceLibrary,
    sourceCatalog,
    savedItemIds,
    toggleSavedItem,
    attachItemToWorkspace,
    createProject,
    theme,
    reducedMotion,
  } = useAppStore();

  const [mode, setMode] = useState<ExploreMode>(() => {
    if (typeof window === 'undefined') return 'resources';
    const stored = window.sessionStorage.getItem('ff_explore_mode');
    if (stored === 'leaderboard' || stored === 'templates' || stored === 'resources') {
      return stored;
    }
    return 'resources';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Liquid Glass',
    'skills',
    'Presence Cards',
    'opencode',
  ]);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [dockCompact, setDockCompact] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<'all' | ResourceGroup>('all');
  const [selectedResourceTags, setSelectedResourceTags] = useState<string[]>([]);

  const [selectedLibrary, setSelectedLibrary] = useState<'all' | SourceLibraryName>('all');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('popular');
  const [visibleCount, setVisibleCount] = useState(18);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(sourceCatalog[0]?.id || '');
  const [stageFileTab, setStageFileTab] = useState<string>('arch');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.sessionStorage.getItem('ff_explore_mode');
    if (stored === 'leaderboard' || stored === 'templates' || stored === 'resources') {
      setMode(stored);
      window.sessionStorage.removeItem('ff_explore_mode');
    }
    const onExploreMode = (event: Event) => {
      const detail = (event as CustomEvent<string | { mode?: string }>).detail;
      const next = typeof detail === 'string' ? detail : detail?.mode;
      if (next === 'leaderboard' || next === 'templates' || next === 'resources') {
        setMode(next);
      }
    };
    window.addEventListener('ff:explore-mode', onExploreMode);
    return () => window.removeEventListener('ff:explore-mode', onExploreMode);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setDockCompact(window.scrollY > 72);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSelectRecent = (term: string) => {
    setSearchQuery(term);
    setRecentSearches((prev) => [term, ...prev.filter((item) => item !== term)].slice(0, 6));
  };

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resourceLibrary.filter((item) => {
      if (selectedGroup !== 'all' && item.group !== selectedGroup) return false;
      if (selectedResourceTags.length > 0) {
        const matchesAll = selectedResourceTags.every((tag) => item.tags.includes(tag));
        if (!matchesAll) return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.compatibility.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [resourceLibrary, selectedGroup, selectedResourceTags, searchQuery]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = sourceCatalog.filter((item) => {
      if (selectedLibrary !== 'all' && item.sourceLibrary !== selectedLibrary) return false;
      if (!matchesStyleFilter(item, selectedStyles)) return false;
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
  }, [sourceCatalog, selectedLibrary, selectedStyles, searchQuery, sortMode]);

  const selectedTemplate = useMemo(() => {
    const found = filteredTemplates.find((item) => item.id === selectedTemplateId);
    return found || filteredTemplates[0] || sourceCatalog[0] || null;
  }, [filteredTemplates, selectedTemplateId, sourceCatalog]);

  useEffect(() => {
    if (selectedTemplate && selectedTemplate.id !== selectedTemplateId) {
      setSelectedTemplateId(selectedTemplate.id);
    }
  }, [selectedTemplate, selectedTemplateId]);

  const activeFilterCount =
    mode === 'resources'
      ? (selectedGroup !== 'all' ? 1 : 0) + selectedResourceTags.length
      : mode === 'templates'
        ? (selectedLibrary !== 'all' ? 1 : 0) + selectedStyles.length
        : 0;

  const handleUseResource = (item: ResourceItem) => {
    attachItemToWorkspace(
      {
        id: item.id,
        kind: 'resource',
        title: item.title,
        summary: item.description,
        payload: item.snippet || `${item.title} (${item.officialUrl}) — ${item.compatibility}`,
        tags: item.tags,
      },
      true
    );
  };

  const handleOpenTemplateInWorkspace = (tpl: SourceCatalogItem) => {
    createProject(tpl.title, `${tpl.sourceLibrary.toUpperCase()} — ${tpl.description}`);
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

  const toggleTag = (tagId: string) => {
    setSelectedResourceTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleStyle = (styleId: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleId) ? prev.filter((id) => id !== styleId) : [...prev, styleId]
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    if (mode === 'resources') {
      setSelectedGroup('all');
      setSelectedResourceTags([]);
    } else {
      setSelectedLibrary('all');
      setSelectedStyles([]);
      setSortMode('popular');
    }
  };

  const leadResource = filteredResources[0] || null;
  const showcaseResources = filteredResources.slice(1, 5);
  const ledgerResources = filteredResources.slice(5);

  const visibleTemplates = filteredTemplates.slice(0, visibleCount);

  const libraryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sourceCatalog.length };
    for (const item of sourceCatalog) {
      counts[item.sourceLibrary] = (counts[item.sourceLibrary] || 0) + 1;
    }
    return counts;
  }, [sourceCatalog]);

  const templateGroups = useMemo(() => {
    const blocks: Array<
      | { kind: 'spotlight'; item: SourceCatalogItem }
      | { kind: 'pair'; primary: SourceCatalogItem; secondary?: SourceCatalogItem; invert: boolean }
    > = [];
    let index = 0;
    let pairToggle = false;
    while (index < visibleTemplates.length) {
      blocks.push({ kind: 'spotlight', item: visibleTemplates[index] });
      index += 1;
      if (index < visibleTemplates.length) {
        blocks.push({
          kind: 'pair',
          primary: visibleTemplates[index],
          secondary: visibleTemplates[index + 1],
          invert: pairToggle,
        });
        pairToggle = !pairToggle;
        index += 2;
      }
    }
    return blocks;
  }, [visibleTemplates]);

  const runtimeBudget = selectedTemplate ? classifyRuntimeBudget(selectedTemplate) : null;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-20 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
            style={{ color: 'var(--ink-primary)', overflowWrap: 'break-word' }}
          >
            Explore — Thư viện Tài nguyên & Kho Template
          </h1>
          <p className="mt-1.5 max-w-[68ch] text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Chọn lọc công cụ kỹ thuật có kiểm chứng, 121 mẫu UI/UX từ 5 thư viện nguồn mở và bảng xếp hạng Repo thực tế, đính kèm trực tiếp vào Work space.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Layers className="h-3.5 w-3.5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
            <span>{resourceLibrary.length} tài nguyên</span>
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--accent-verdigris)' }} aria-hidden="true" />
            <span>{sourceCatalog.length} mẫu UI/UX</span>
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Trophy className="h-3.5 w-3.5" style={{ color: 'var(--accent-jade)' }} aria-hidden="true" />
            <span>{LEADERBOARD_TOTAL} repo xếp hạng</span>
          </span>
        </div>
      </header>

      <div
        className="sticky top-16 z-30 mb-8 rounded-[22px] border p-3 sm:p-4"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-surface) 84%, transparent)',
          borderColor: 'var(--border-strong)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 22px 48px -28px rgba(0, 0, 0, 0.55)',
          transform: dockCompact && !reducedMotion ? 'translateY(-4px) scale(0.99)' : 'translateY(0) scale(1)',
          transition: reducedMotion ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-full overflow-x-auto pb-1 xl:pb-0">
            <LiquidTabs
              tabs={[
                { id: 'resources', label: 'Thư viện Tài nguyên', count: filteredResources.length },
                { id: 'templates', label: 'Kho Template UI/UX', count: filteredTemplates.length },
                { id: 'leaderboard', label: 'Bảng Xếp Hạng Repo & Skills', count: LEADERBOARD_TOTAL },
              ]}
              activeId={mode}
              onChange={(id) => setMode(id as ExploreMode)}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center xl:max-w-[460px]">
            <div className="min-w-0 flex-1">
              <SearchCard
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={
                  mode === 'resources'
                    ? 'Tìm AI tools, prompts, skills, repo...'
                    : mode === 'templates'
                      ? 'Tìm mẫu PinUI, ThreeUI, MotionSites, lucianLabs...'
                      : 'Tìm repo, skills, tác giả, topic...'
                }
                recentSearches={recentSearches}
                onSelectRecent={handleSelectRecent}
                compact
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {mode !== 'leaderboard' ? (
                <button
                  type="button"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  aria-expanded={filtersOpen}
                  className="inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: filtersOpen
                      ? 'color-mix(in srgb, var(--accent-primary) 14%, transparent)'
                      : 'var(--bg-panel)',
                    borderColor: filtersOpen ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    color: filtersOpen ? 'var(--accent-primary)' : 'var(--ink-primary)',
                  }}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Bộ lọc</span>
                  {activeFilterCount > 0 ? (
                    <span
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[11px]"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: '#06080d',
                      }}
                    >
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
              ) : null}

              {activeFilterCount > 0 || searchQuery ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  aria-label="Xóa tất cả bộ lọc"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {filtersOpen && mode === 'resources' ? (
          <div className="mt-3.5 space-y-3 border-t pt-3.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {RESOURCE_GROUPS.map((group) => {
                const active = selectedGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className="shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-panel)',
                      borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      color: active ? '#06080d' : 'var(--ink-secondary)',
                    }}
                  >
                    {group === 'all' ? 'Tất cả 8 nhóm' : group}
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-2">
              <span
                className="mt-1.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium"
                style={{ color: 'var(--ink-muted)' }}
              >
                <Filter className="h-3 w-3" aria-hidden="true" />
                <span>Đa trục:</span>
              </span>
              <div className="min-w-0 flex-1">
                <Chips
                  items={RESOURCE_TAG_CHIPS}
                  selectedIds={selectedResourceTags}
                  onToggle={toggleTag}
                  multi
                />
              </div>
            </div>
          </div>
        ) : null}

        {filtersOpen && mode === 'templates' ? (
          <div className="mt-3.5 space-y-3 border-t pt-3.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="overflow-x-auto pb-1 xl:pb-0">
                <LiquidTabs
                  tabs={[
                    { id: 'all', label: 'Tất cả', count: libraryCounts.all },
                    { id: 'threeui', label: 'ThreeUI', count: libraryCounts.threeui || 0 },
                    { id: 'pinui', label: 'PinUI', count: libraryCounts.pinui || 0 },
                    { id: 'motionsites', label: 'MotionSites', count: libraryCounts.motionsites || 0 },
                    { id: 'lucianlabs', label: 'lucianLabs', count: libraryCounts.lucianlabs || 0 },
                    { id: 'codefronts', label: 'CodeFronts', count: libraryCounts.codefronts || 0 },
                  ]}
                  activeId={selectedLibrary}
                  onChange={(id) => {
                    setSelectedLibrary(id as 'all' | SourceLibraryName);
                    setVisibleCount(18);
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                  Sắp xếp:
                </span>
                {(
                  [
                    { id: 'popular', label: 'Phổ biến' },
                    { id: 'recent', label: 'Mới cập nhật' },
                    { id: 'minimal', label: 'Tối giản' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortMode(opt.id)}
                    className="rounded-full border px-3 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      backgroundColor:
                        sortMode === opt.id
                          ? 'color-mix(in srgb, var(--accent-verdigris) 16%, transparent)'
                          : 'var(--bg-panel)',
                      borderColor: sortMode === opt.id ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                      color: sortMode === opt.id ? 'var(--accent-verdigris)' : 'var(--ink-secondary)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                Phong cách:
              </span>
              <Chips
                items={STYLE_FILTERS}
                selectedIds={selectedStyles}
                onToggle={toggleStyle}
                multi
              />
            </div>
          </div>
        ) : null}
      </div>

      {mode === 'leaderboard' ? (
        <RepoLeaderboard
          searchQuery={searchQuery}
          onResetSearch={() => setSearchQuery('')}
        />
      ) : mode === 'resources' ? (
        <section aria-label="Thư viện tài nguyên kỹ thuật" className="space-y-8">
          {filteredResources.length === 0 ? (
            <div
              className="rounded-[24px] border p-12 text-center"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <p className="text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                Không có tài nguyên nào khớp bộ lọc hiện tại
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
                Thử bỏ bớt tag hoặc chuyển nhóm danh mục để xem toàn bộ 8 nhóm tài nguyên.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#06080d',
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Đặt lại bộ lọc</span>
              </button>
            </div>
          ) : (
            <>
              {leadResource ? (
                <article
                  className="overflow-hidden rounded-[24px] border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-strong)',
                  }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                    <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)',
                              color: 'var(--accent-primary)',
                            }}
                          >
                            {leadResource.group}
                          </span>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: getVerificationMeta(leadResource.status).bg,
                              color: getVerificationMeta(leadResource.status).color,
                            }}
                          >
                            {getVerificationMeta(leadResource.status).label}
                          </span>
                          <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                            {leadResource.category}
                          </span>
                        </div>

                        <h2
                          className="mt-4 text-2xl font-semibold tracking-tight"
                          style={{ color: 'var(--ink-primary)' }}
                        >
                          {leadResource.title}
                        </h2>
                        <p
                          className="mt-2.5 max-w-[62ch] text-sm leading-relaxed"
                          style={{ color: 'var(--ink-secondary)' }}
                        >
                          {leadResource.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {leadResource.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border px-2.5 py-0.5 font-mono text-[11px]"
                              style={{
                                backgroundColor: 'var(--bg-panel)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--ink-secondary)',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => handleUseResource(leadResource)}
                          className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: '#06080d',
                          }}
                        >
                          <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Use in Project</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSavedItem(leadResource.id)}
                          className="inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{
                            backgroundColor: savedItemIds.includes(leadResource.id)
                              ? 'color-mix(in srgb, var(--accent-jade) 14%, transparent)'
                              : 'var(--bg-panel)',
                            borderColor: savedItemIds.includes(leadResource.id)
                              ? 'var(--accent-jade)'
                              : 'var(--border-subtle)',
                            color: savedItemIds.includes(leadResource.id)
                              ? 'var(--accent-jade)'
                              : 'var(--ink-primary)',
                          }}
                        >
                          {savedItemIds.includes(leadResource.id) ? (
                            <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{savedItemIds.includes(leadResource.id) ? 'Đã lưu' : 'Save'}</span>
                        </button>

                        <a
                          href={leadResource.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          <span>Nguồn chính thức</span>
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>

                    <div
                      className="flex flex-col justify-between gap-4 border-t p-6 lg:border-t-0 lg:border-l sm:p-8"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between gap-4 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                          <span style={{ color: 'var(--ink-muted)' }}>Giấy phép / Chi phí</span>
                          <span className="font-semibold" style={{ color: 'var(--ink-primary)' }}>
                            {leadResource.license} ({extractTagValue(leadResource.tags, 'cost', 'Free')})
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                          <span style={{ color: 'var(--ink-muted)' }}>Tương thích</span>
                          <span className="text-right font-medium" style={{ color: 'var(--ink-primary)' }}>
                            {leadResource.compatibility}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                          <span style={{ color: 'var(--ink-muted)' }}>Độ khó</span>
                          <span className="font-mono font-medium" style={{ color: 'var(--accent-verdigris)' }}>
                            {extractTagValue(leadResource.tags, 'level', 'Intermediate')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span style={{ color: 'var(--ink-muted)' }}>Kiểm chứng lần cuối</span>
                          <span className="inline-flex items-center gap-1 font-mono" style={{ color: 'var(--ink-secondary)' }}>
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {leadResource.lastVerified}
                          </span>
                        </div>
                      </div>

                      <div
                        className="rounded-[14px] border p-3.5 text-xs"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-secondary)',
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--ink-primary)' }}>
                          <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--accent-jade)' }} aria-hidden="true" />
                          <span>Tích hợp Work space</span>
                        </div>
                        <p className="mt-1 leading-relaxed">
                          Nhấn Use in Project để nạp ngữ cảnh kỹ thuật này trực tiếp vào phiên AI Builder hiện tại.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ) : null}

              {showcaseResources.length > 0 ? (
                <div className="space-y-4">
                  {[0, 2].map((startIdx) => {
                    const pair = showcaseResources.slice(startIdx, startIdx + 2);
                    if (pair.length === 0) return null;
                    const gridTemplate =
                      startIdx === 0
                        ? 'lg:grid-cols-[minmax(0,1.26fr)_minmax(0,1fr)]'
                        : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.26fr)]';
                    return (
                      <div key={startIdx} className={`grid grid-cols-1 gap-4 ${gridTemplate}`}>
                        {pair.map((item) => {
                          const ver = getVerificationMeta(item.status);
                          const isSaved = savedItemIds.includes(item.id);
                          const difficulty = extractTagValue(item.tags, 'level', 'Intermediate');
                          const cost = extractTagValue(item.tags, 'cost', 'Free');
                          return (
                            <article
                              key={item.id}
                              className="flex flex-col justify-between gap-5 overflow-hidden rounded-[22px] border p-6"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            >
                              <div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span
                                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                    style={{
                                      backgroundColor: 'var(--bg-panel)',
                                      color: 'var(--ink-secondary)',
                                    }}
                                  >
                                    {item.group}
                                  </span>
                                  <span
                                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                    style={{ backgroundColor: ver.bg, color: ver.color }}
                                  >
                                    {ver.label}
                                  </span>
                                </div>

                                <h3 className="mt-3 text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                                  {item.title}
                                </h3>
                                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                                  {item.description}
                                </p>

                                <div className="mt-3.5 flex flex-wrap gap-1.5">
                                  {item.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
                                      style={{
                                        borderColor: 'var(--border-subtle)',
                                        color: 'var(--ink-muted)',
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
                                  <span>
                                    {item.license} / {cost}
                                  </span>
                                  <span>{difficulty}</span>
                                  <span>{item.compatibility}</span>
                                  <span className="font-mono">{item.lastVerified}</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleUseResource(item)}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold"
                                    style={{
                                      backgroundColor: 'var(--accent-primary)',
                                      color: '#06080d',
                                    }}
                                  >
                                    <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>Use in Project</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleSavedItem(item.id)}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium"
                                    style={{
                                      backgroundColor: 'var(--bg-panel)',
                                      borderColor: isSaved ? 'var(--accent-jade)' : 'var(--border-subtle)',
                                      color: isSaved ? 'var(--accent-jade)' : 'var(--ink-primary)',
                                    }}
                                  >
                                    {isSaved ? (
                                      <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                    ) : (
                                      <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                                    )}
                                    <span>{isSaved ? 'Đã lưu' : 'Save'}</span>
                                  </button>
                                  <a
                                    href={item.officialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto inline-flex h-9 items-center gap-1 text-xs font-medium hover:underline"
                                    style={{ color: 'var(--accent-verdigris)' }}
                                  >
                                    <span>Trang gốc</span>
                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                  </a>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {ledgerResources.length > 0 ? (
                <div
                  className="overflow-hidden rounded-[22px] border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div
                    className="flex items-center justify-between border-b px-5 py-3.5 text-xs font-semibold"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-secondary)',
                    }}
                  >
                    <span>Danh mục kỹ thuật chi tiết</span>
                    <span className="font-mono">{ledgerResources.length} mục</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {ledgerResources.map((item) => {
                      const ver = getVerificationMeta(item.status);
                      const isSaved = savedItemIds.includes(item.id);
                      const difficulty = extractTagValue(item.tags, 'level', 'Intermediate');
                      const cost = extractTagValue(item.tags, 'cost', 'Free');
                      return (
                        <article
                          key={item.id}
                          className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                                {item.title}
                              </h3>
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                style={{
                                  backgroundColor: 'var(--bg-panel)',
                                  color: 'var(--ink-secondary)',
                                }}
                              >
                                {item.group}
                              </span>
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                style={{ backgroundColor: ver.bg, color: ver.color }}
                              >
                                {ver.label}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                              {item.description}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                              <span>{item.license} ({cost})</span>
                              <span>{item.compatibility}</span>
                              <span>{difficulty}</span>
                              <span className="font-mono">{item.lastVerified}</span>
                              <a
                                href={item.officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:underline"
                                style={{ color: 'var(--accent-verdigris)' }}
                              >
                                <span>Official</span>
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSavedItem(item.id)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium"
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
                              <span>{isSaved ? 'Đã lưu' : 'Save'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUseResource(item)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold"
                              style={{
                                backgroundColor: 'var(--accent-primary)',
                                color: '#06080d',
                              }}
                            >
                              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Use in Project</span>
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : (
        <section
          aria-label="Kho Template UI UX Split Stage"
          className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
        >
          <div className="space-y-4">
            {filteredTemplates.length === 0 ? (
              <div
                className="rounded-[24px] border p-12 text-center"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <p className="text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  Không tìm thấy mẫu nào khớp điều kiện lọc
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#06080d',
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Hiển thị tất cả 121 mẫu</span>
                </button>
              </div>
            ) : (
              <>
                {templateGroups.map((block, bIdx) => {
                  if (block.kind === 'spotlight') {
                    const item = block.item;
                    const active = selectedTemplate?.id === item.id;
                    const budget = classifyRuntimeBudget(item);
                    const isSaved = savedItemIds.includes(item.id);
                    return (
                      <article
                        key={`spot-${item.id}`}
                        onClick={() => setSelectedTemplateId(item.id)}
                        className="cursor-pointer overflow-hidden rounded-[22px] border p-5 sm:p-6"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          boxShadow: active
                            ? '0 0 0 1px var(--accent-primary), 0 18px 40px -24px rgba(0,0,0,0.6)'
                            : 'none',
                          transition: 'border-color 180ms ease, box-shadow 180ms ease',
                        }}
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                          <div className="flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold"
                                  style={{
                                    backgroundColor: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)',
                                    color: 'var(--accent-primary)',
                                  }}
                                >
                                  {item.sourceLibrary}
                                </span>
                                <span
                                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                  style={{
                                    backgroundColor: 'var(--bg-panel)',
                                    color: budget.color,
                                  }}
                                >
                                  {budget.tier}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                                  {item.category}
                                </span>
                              </div>
                              <h3 className="mt-2.5 text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                                {item.title}
                              </h3>
                              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                                {item.description}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {item.tags.slice(0, 4).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
                                  style={{
                                    borderColor: 'var(--border-subtle)',
                                    color: 'var(--ink-muted)',
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleSavedItem(item.id);
                                }}
                                aria-label={isSaved ? 'Bỏ lưu mẫu' : 'Lưu mẫu'}
                                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border"
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
                            </div>
                          </div>

                          <div className="min-w-0">
                            <FileBox
                              title={item.style}
                              tabs={[
                                { id: 'runtime', label: 'Runtime', meta: item.runtime.slice(0, 26) },
                                { id: 'path', label: 'Archive', meta: item.archivePath.split('/').slice(-1)[0] },
                              ]}
                              activeId="runtime"
                            />
                          </div>
                        </div>
                      </article>
                    );
                  }

                  const pairCols = block.invert
                    ? 'md:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)]'
                    : 'md:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)]';

                  return (
                    <div key={`pair-${bIdx}`} className={`grid grid-cols-1 gap-4 ${pairCols}`}>
                      {[block.primary, block.secondary]
                        .filter((x): x is SourceCatalogItem => Boolean(x))
                        .map((item, slotIdx) => {
                          const active = selectedTemplate?.id === item.id;
                          const budget = classifyRuntimeBudget(item);
                          const isTallCard = (block.invert && slotIdx === 1) || (!block.invert && slotIdx === 0);
                          return (
                            <article
                              key={item.id}
                              onClick={() => setSelectedTemplateId(item.id)}
                              className={`flex cursor-pointer flex-col justify-between overflow-hidden rounded-[22px] border p-5 ${
                                isTallCard ? 'min-h-[228px]' : 'min-h-[188px]'
                              }`}
                              style={{
                                backgroundColor: isTallCard ? 'var(--bg-surface)' : 'var(--bg-panel)',
                                borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                                boxShadow: active ? '0 0 0 1px var(--accent-primary)' : 'none',
                                transition: 'border-color 180ms ease, box-shadow 180ms ease',
                              }}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className="font-mono text-[11px] font-semibold"
                                    style={{ color: 'var(--accent-verdigris)' }}
                                  >
                                    {item.sourceLibrary}
                                  </span>
                                  <span className="font-mono text-[11px]" style={{ color: budget.color }}>
                                    {budget.tier}
                                  </span>
                                </div>
                                <h3 className="mt-2 text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                                  {item.title}
                                </h3>
                                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                                  {item.description}
                                </p>
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3 text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                                <span className="truncate font-mono" style={{ color: 'var(--ink-muted)' }}>
                                  {item.runtime}
                                </span>
                                <span className="shrink-0 font-semibold" style={{ color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)' }}>
                                  {active ? 'Đang xem' : 'Xem Stage'}
                                </span>
                              </div>
                            </article>
                          );
                        })}
                    </div>
                  );
                })}

                {visibleCount < filteredTemplates.length ? (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 18)}
                      className="inline-flex h-10 items-center gap-2 rounded-full border px-6 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-strong)',
                        color: 'var(--ink-primary)',
                      }}
                    >
                      <span>
                        Hiển thị thêm ({filteredTemplates.length - visibleCount} mẫu còn lại)
                      </span>
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <aside aria-label="Sticky Live Stage" className="lg:sticky lg:top-28">
            {selectedTemplate && runtimeBudget ? (
              <div
                className="overflow-hidden rounded-[24px] border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  boxShadow: '0 24px 56px -32px rgba(0, 0, 0, 0.65)',
                }}
              >
                <div
                  className="flex items-center justify-between gap-2 border-b px-5 py-3.5"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {selectedTemplate.sourceLibrary}
                    </span>
                    <span className="truncate text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                      Live Stage Preview
                    </span>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 65%, transparent)',
                      color: runtimeBudget.color,
                    }}
                  >
                    <Cpu className="h-3 w-3" aria-hidden="true" />
                    <span>{runtimeBudget.tier}</span>
                  </span>
                </div>

                <div
                  className="relative h-[250px] w-full overflow-hidden border-b"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-canvas)',
                  }}
                >
                  <iframe
                    key={`${selectedTemplate.id}-${theme}`}
                    title={`Preview ${selectedTemplate.title}`}
                    sandbox="allow-scripts"
                    referrerPolicy="no-referrer"
                    srcDoc={buildTemplatePreviewDoc(selectedTemplate, theme)}
                    className="h-full w-full border-0"
                  />
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                      {selectedTemplate.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                      {selectedTemplate.description}
                    </p>
                  </div>

                  <FileBox
                    title="Thông số kiến trúc"
                    tabs={[
                      { id: 'arch', label: 'Kiến trúc', meta: selectedTemplate.style },
                      { id: 'runtime', label: 'Runtime', meta: runtimeBudget.tier },
                      { id: 'origin', label: 'Nguồn MIT', meta: selectedTemplate.sourceLibrary },
                    ]}
                    activeId={stageFileTab}
                    onSelect={setStageFileTab}
                  />

                  <div
                    className="rounded-[16px] border p-3.5 text-xs"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-secondary)',
                    }}
                  >
                    {stageFileTab === 'arch' ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between gap-2">
                          <span style={{ color: 'var(--ink-muted)' }}>Danh mục</span>
                          <span className="font-medium" style={{ color: 'var(--ink-primary)' }}>
                            {selectedTemplate.category} / {selectedTemplate.subcategory}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span style={{ color: 'var(--ink-muted)' }}>Archive Path</span>
                          <code className="truncate font-mono" style={{ color: 'var(--accent-verdigris)' }}>
                            {selectedTemplate.archivePath}
                          </code>
                        </div>
                      </div>
                    ) : stageFileTab === 'runtime' ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 font-semibold" style={{ color: runtimeBudget.color }}>
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Ngân sách hiệu năng: {runtimeBudget.tier}</span>
                        </div>
                        <p className="leading-relaxed">{runtimeBudget.note}</p>
                        <p className="font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                          Stack: {selectedTemplate.runtime}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="font-semibold" style={{ color: 'var(--ink-primary)' }}>
                          {selectedTemplate.license}
                        </p>
                        <p className="font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                          {selectedTemplate.archivePath}
                        </p>
                        <a
                          href={selectedTemplate.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium hover:underline"
                          style={{ color: 'var(--accent-verdigris)' }}
                        >
                          <span>Mở tài liệu gốc</span>
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenTemplateInWorkspace(selectedTemplate)}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: '#06080d',
                      }}
                    >
                      <Terminal className="h-4 w-4" aria-hidden="true" />
                      <span>Mở vào Work space</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSavedItem(selectedTemplate.id)}
                      className="inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: savedItemIds.includes(selectedTemplate.id)
                          ? 'var(--accent-jade)'
                          : 'var(--border-subtle)',
                        color: savedItemIds.includes(selectedTemplate.id)
                          ? 'var(--accent-jade)'
                          : 'var(--ink-primary)',
                      }}
                    >
                      {savedItemIds.includes(selectedTemplate.id) ? (
                        <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Bookmark className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>{savedItemIds.includes(selectedTemplate.id) ? 'Đã lưu' : 'Lưu'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </section>
      )}
    </div>
  );
};
