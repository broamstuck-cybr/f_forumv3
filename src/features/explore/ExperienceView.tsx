import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconMonitor,
  IconMoon,
  IconRotateCw,
  IconSearch,
  IconSmartphone,
  IconSun,
  IconTablet,
  IconZoomIn,
  IconZoomOut,
} from '../../ui/icons';
import type { AttachedContextItem, SourceCatalogItem } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  Chips,
  Magnify,
  PinHeartButton,
  PinUIPlayground,
  SearchCard,
  type ChipItem,
} from '../../components/pinui';
import { previewFor } from '../../ui/Media';
import { SpecimenMedia } from './SpecimenMedia';
import {
  LIBRARY_LABEL,
  copyText,
  fetchMotionSitesFullMap,
  fetchPinUISourceMap,
  formatCount,
  getCachedMotionSitesFullMap,
  getCachedPinUISourceMap,
  resolveMotionSiteEntry,
  resolvePinUISource,
  sanitizeBrandText,
  sanitizeSnippetCode,
  templateContext,
  type MotionSiteFullEntry,
  type PinUISourceEntry,
  type PreviewTheme,
  type PreviewViewport,
} from './catalog';
import { BackgroundLab } from './BackgroundLab';
import { ThreeUIPreview } from './ThreeUIPreview';
import { SandboxPreview } from './SandboxPreview';
import {
  VAULT_LIBRARY_LABELS,
  fetchVaultIndex,
  fetchVaultShard,
  getCachedVaultIndex,
  getCachedVaultShard,
  type VaultIndexItem,
  type VaultLibraryKey,
  type VaultShardPayload,
} from './vaultLoader';
import './explore.css';

type CategoryTab = 'all' | VaultLibraryKey | 'saved';
type CodeTab = 'html' | 'css' | 'js' | 'prompt';

const PAGE_STEP = 120;

const CATEGORY_ORDER: Array<{ id: CategoryTab; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pinui', label: 'Tương tác' },
  { id: 'lucianlabs', label: 'Hiệu ứng' },
  { id: 'threeui', label: 'Không gian 3D' },
  { id: 'motionsites', label: 'Chuyển động' },
  { id: 'codefronts', label: 'Bố cục' },
  { id: 'glacier', label: 'Nền & Lớp' },
  { id: 'saved', label: 'Đã lưu' },
];

function catalogToVaultEntry(item: SourceCatalogItem): VaultIndexItem {
  return {
    i: item.id,
    t: sanitizeBrandText(item.title).replace(/\s+Three\.js Component/i, ''),
    l: item.sourceLibrary,
    g: LIBRARY_LABEL[item.sourceLibrary],
    c: item.category,
    tg: item.tags.slice(0, 4),
    s: item.sourceLibrary === 'pinui' ? 'pinui' : '',
    d: item.previewHtml ? 1 : 0,
  };
}

export const ExperienceView: React.FC = () => {
  const {
    sourceCatalog,
    savedItemIds,
    toggleSavedItem,
    toggleLikedItem,
    isItemLiked,
    getHeartCount,
    experienceItemId,
    openExperience,
    navigate,
    openInWorkspace,
    attachItemToWorkspace,
    activeProject,
    addToast,
    theme,
  } = useAppStore();

  const [category, setCategory] = useState<CategoryTab>('all');
  const [activeTag, setActiveTag] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    const incoming = window.sessionStorage.getItem('ff_experience_query') || '';
    if (incoming) window.sessionStorage.removeItem('ff_experience_query');
    return incoming;
  });
  const [visibleLimit, setVisibleLimit] = useState(PAGE_STEP);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewport, setViewport] = useState<PreviewViewport>(1440);
  const [stageZoomed, setStageZoomed] = useState(false);
  const [magnifyOpen, setMagnifyOpen] = useState(false);
  const [stageTheme, setStageTheme] = useState<PreviewTheme>(theme);
  const [nonce, setNonce] = useState(0);
  const [codeTab, setCodeTab] = useState<CodeTab>('html');
  const [copiedTarget, setCopiedTarget] = useState<'code' | 'prompt' | null>(null);

  const [vaultItems, setVaultItems] = useState<VaultIndexItem[]>(
    () => getCachedVaultIndex()?.items ?? []
  );
  const [vaultLoading, setVaultLoading] = useState(() => !getCachedVaultIndex());
  const [vaultError, setVaultError] = useState<string | null>(null);

  const [pinuiMap, setPinuiMap] = useState<Record<string, PinUISourceEntry> | null>(
    () => getCachedPinUISourceMap()
  );
  const [motionMap, setMotionMap] = useState<Record<string, MotionSiteFullEntry> | null>(
    () => getCachedMotionSitesFullMap()
  );
  const [shardPayload, setShardPayload] = useState<VaultShardPayload | null>(null);
  const [shardLoading, setShardLoading] = useState(false);
  const [shardError, setShardError] = useState<string | null>(null);
  const [shardRetryTick, setShardRetryTick] = useState(0);

  const query = search.trim().toLowerCase();

  useEffect(() => {
    setStageTheme(theme);
  }, [theme]);

  const loadVault = useCallback(() => {
    setVaultLoading(true);
    setVaultError(null);
    Promise.all([
      fetchVaultIndex(),
      fetchPinUISourceMap().catch(() => ({} as Record<string, PinUISourceEntry>)),
      fetchMotionSitesFullMap().catch(() => ({} as Record<string, MotionSiteFullEntry>)),
    ])
      .then(([indexData, loadedPinui, loadedMotion]) => {
        setVaultItems(indexData.items);
        setPinuiMap(loadedPinui);
        setMotionMap(loadedMotion);
        setVaultLoading(false);
      })
      .catch(() => {
        setVaultError('Không thể tải chỉ mục kho tài nguyên. Thử tải lại.');
        setVaultLoading(false);
      });
  }, []);

  useEffect(() => {
    if (vaultItems.length > 0 && pinuiMap && motionMap) {
      setVaultLoading(false);
      return;
    }
    loadVault();
  }, [loadVault, vaultItems.length, pinuiMap, motionMap]);

  const catalogById = useMemo(() => {
    const map = new Map<string, SourceCatalogItem>();
    for (const item of sourceCatalog) {
      map.set(item.id, item);
      if (item.sourceLibrary === 'motionsites') {
        map.set(item.id.replace(/^ms-/, ''), item);
      }
    }
    return map;
  }, [sourceCatalog]);

  const allVaultItems = useMemo(() => {
    if (vaultItems.length > 0) return vaultItems;
    return sourceCatalog.map(catalogToVaultEntry);
  }, [vaultItems, sourceCatalog]);

  const countsByCategory = useMemo(() => {
    const counts: Record<CategoryTab, number> = {
      all: allVaultItems.length,
      pinui: 0,
      lucianlabs: 0,
      threeui: 0,
      motionsites: 0,
      codefronts: 0,
      glacier: 0,
      saved: 0,
    };
    const savedSet = new Set(savedItemIds);
    for (const item of allVaultItems) {
      counts[item.l] = (counts[item.l] ?? 0) + 1;
      if (savedSet.has(item.i)) counts.saved += 1;
    }
    return counts;
  }, [allVaultItems, savedItemIds]);

  const categoryPool = useMemo(() => {
    const savedSet = new Set(savedItemIds);
    return allVaultItems.filter((item) => {
      if ((savedOnly || category === 'saved') && !savedSet.has(item.i)) return false;
      if (category !== 'all' && category !== 'saved' && item.l !== category) return false;
      return true;
    });
  }, [allVaultItems, savedOnly, category, savedItemIds]);

  const topTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const item of categoryPool) {
      for (const rawTag of item.tg) {
        const tag = rawTag.trim().toLowerCase();
        if (!tag || tag.length < 2) continue;
        freq.set(tag, (freq.get(tag) ?? 0) + 1);
      }
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [categoryPool]);

  const filteredItems = useMemo(() => {
    const matched = categoryPool.filter((item) => {
      if (activeTag && !item.tg.some((t) => t.toLowerCase() === activeTag)) {
        return false;
      }
      if (!query) return true;
      const haystack = `${item.t} ${item.c} ${item.g} ${item.tg.join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
    if (category === 'motionsites' && motionMap) {
      const scoreMotion = (it: VaultIndexItem): number => {
        const m = resolveMotionSiteEntry(motionMap, it.i);
        if (m?.liveHtml) return 3;
        if (m?.previewImage && /\.(gif|webp)(\?|$)/i.test(m.previewImage)) return 2;
        if (m?.previewImage) return 1;
        return 0;
      };
      return [...matched].sort((a, b) => scoreMotion(b) - scoreMotion(a));
    }
    return matched;
  }, [categoryPool, activeTag, query, category, motionMap]);

  useEffect(() => {
    setVisibleLimit(PAGE_STEP);
  }, [category, activeTag, savedOnly, query]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleLimit),
    [filteredItems, visibleLimit]
  );

  const activeVaultItem: VaultIndexItem | null = useMemo(() => {
    const hasFilter = category !== 'all' || savedOnly || Boolean(activeTag) || Boolean(query);
    if (experienceItemId && experienceItemId !== 'vault') {
      const stripped = experienceItemId.replace(/^ms-/, '');
      if (hasFilter) {
        const inFiltered = filteredItems.find(
          (item) => item.i === experienceItemId || item.i === stripped
        );
        if (inFiltered) return inFiltered;
        return filteredItems[0] ?? null;
      }
      const exact = allVaultItems.find((item) => item.i === experienceItemId);
      if (exact) return exact;
      const byStripped = allVaultItems.find((item) => item.i === stripped);
      if (byStripped) return byStripped;
      const fromCatalog = catalogById.get(experienceItemId);
      if (fromCatalog) return catalogToVaultEntry(fromCatalog);
    }
    return filteredItems[0] ?? allVaultItems[0] ?? null;
  }, [
    experienceItemId,
    allVaultItems,
    filteredItems,
    catalogById,
    category,
    savedOnly,
    activeTag,
    query,
  ]);

  const activeCatalogItem = useMemo(() => {
    if (!activeVaultItem) return null;
    return (
      catalogById.get(activeVaultItem.i) ??
      catalogById.get(`ms-${activeVaultItem.i}`) ??
      null
    );
  }, [activeVaultItem, catalogById]);

  useEffect(() => {
    let cancelled = false;
    setShardError(null);
    if (!activeVaultItem || !activeVaultItem.s || activeVaultItem.s === 'pinui') {
      setShardPayload(null);
      setShardLoading(false);
      return;
    }

    const cached = getCachedVaultShard(activeVaultItem.s);
    if (cached) {
      setShardPayload(cached[activeVaultItem.i] ?? null);
      setShardLoading(false);
      return;
    }

    setShardPayload(null);
    setShardLoading(true);
    fetchVaultShard(activeVaultItem.s)
      .then((shard) => {
        if (cancelled) return;
        setShardPayload(shard[activeVaultItem.i] ?? null);
        setShardLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setShardError('Không tải được tệp nguồn của mẫu này.');
        setShardLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeVaultItem, shardRetryTick]);

  const activeId = activeVaultItem?.i ?? '';
  const activeTitle = activeVaultItem ? sanitizeBrandText(activeVaultItem.t) : 'Thành phần';
  const activeGroupLabel = activeVaultItem
    ? VAULT_LIBRARY_LABELS[activeVaultItem.l] || activeVaultItem.g
    : 'Kho mẫu';
  const activeLiked = activeId ? isItemLiked(activeId) : false;
  const activeSaved = activeId ? savedItemIds.includes(activeId) : false;
  const activeHearts = activeId ? getHeartCount(activeId) : 10;

  const isPinUI = activeVaultItem?.l === 'pinui';
  const isThreeUI = activeVaultItem?.l === 'threeui';
  const isMotion = activeVaultItem?.l === 'motionsites';
  const isGlacier = activeVaultItem?.l === 'glacier';

  const pinuiSource = useMemo(
    () => (activeVaultItem && isPinUI ? resolvePinUISource(pinuiMap, activeVaultItem.i) : null),
    [activeVaultItem, isPinUI, pinuiMap]
  );

  const motionEntry = useMemo(
    () =>
      activeVaultItem && isMotion ? resolveMotionSiteEntry(motionMap, activeVaultItem.i) : null,
    [activeVaultItem, isMotion, motionMap]
  );

  const activePreview = activeCatalogItem ? previewFor(activeCatalogItem.id) : null;
  const activeOriginalVideo =
    shardPayload?.vid || (isMotion ? motionEntry?.previewVideo || '' : '');
  const activeOriginalImage =
    shardPayload?.img ||
    activeCatalogItem?.previewImage ||
    (isMotion ? motionEntry?.previewImage || '' : '') ||
    (activePreview?.kind === 'image' ? activePreview.src : '') ||
    '';

  const [motionStageMode, setMotionStageMode] = useState<'html' | 'video'>('html');

  const activeHtml = useMemo(() => {
    if (!activeVaultItem) return '';
    if (isPinUI) return pinuiSource?.tsx ?? '';
    if (shardPayload?.h) return sanitizeSnippetCode(shardPayload.h);
    if (isMotion && motionEntry?.liveHtml) return sanitizeSnippetCode(motionEntry.liveHtml);
    if (activeCatalogItem?.previewHtml) return sanitizeSnippetCode(activeCatalogItem.previewHtml);
    return '';
  }, [activeVaultItem, isPinUI, isMotion, pinuiSource, shardPayload, motionEntry, activeCatalogItem]);

  const activeCss = useMemo(() => {
    if (!activeVaultItem) return '';
    if (isPinUI) return pinuiSource?.css ?? '';
    if (shardPayload?.c) return sanitizeSnippetCode(shardPayload.c);
    if (isMotion && motionEntry?.css) return sanitizeSnippetCode(motionEntry.css);
    if (activeCatalogItem?.previewCss) return sanitizeSnippetCode(activeCatalogItem.previewCss);
    return '';
  }, [activeVaultItem, isPinUI, isMotion, pinuiSource, shardPayload, motionEntry, activeCatalogItem]);

  const activeJsLang = useMemo(() => {
    if (!activeVaultItem || isPinUI) return 'js';
    const raw = shardPayload?.cl || (isMotion ? motionEntry?.codeLang : '') || 'js';
    return raw.toLowerCase();
  }, [activeVaultItem, isPinUI, isMotion, shardPayload, motionEntry]);

  const activeJs = useMemo(() => {
    if (!activeVaultItem || isPinUI) return '';
    if (shardPayload?.j) return sanitizeSnippetCode(shardPayload.j);
    if (isMotion && motionEntry?.code) return sanitizeSnippetCode(motionEntry.code);
    return '';
  }, [activeVaultItem, isPinUI, isMotion, shardPayload, motionEntry]);

  const executableSandboxJs = useMemo(() => {
    if (!activeJs) return undefined;
    if (activeJsLang === 'tsx' || activeJsLang === 'jsx' || activeJsLang === 'ts' || activeJsLang === 'glsl') {
      return undefined;
    }
    return activeJs;
  }, [activeJs, activeJsLang]);

  const activePrompt = useMemo(() => {
    if (!activeVaultItem) return '';
    if (isPinUI && pinuiSource?.prompt) return sanitizeBrandText(pinuiSource.prompt);
    if (shardPayload?.p) return sanitizeBrandText(shardPayload.p);
    if (isMotion && motionEntry?.promptText) return sanitizeBrandText(motionEntry.promptText);
    if (activeCatalogItem?.promptSpec) return sanitizeBrandText(activeCatalogItem.promptSpec);
    return `${activeTitle}\nNhóm: ${activeGroupLabel}\nDanh mục: ${activeVaultItem.c}\nTừ khóa: ${activeVaultItem.tg.join(', ')}`;
  }, [
    activeVaultItem,
    isPinUI,
    isMotion,
    pinuiSource,
    shardPayload,
    motionEntry,
    activeCatalogItem,
    activeTitle,
    activeGroupLabel,
  ]);

  const snippetCssWithTheme = useMemo(() => {
    if (!activeVaultItem || isPinUI) return '';
    const rawCss =
      shardPayload?.c ||
      (isMotion ? motionEntry?.css : '') ||
      activeCatalogItem?.previewCss ||
      '';
    if (isThreeUI || isMotion || isGlacier) return rawCss;
    return rawCss;
  }, [activeVaultItem, isPinUI, isThreeUI, isMotion, isGlacier, shardPayload, motionEntry, activeCatalogItem]);

  useEffect(() => {
    if (!activeId) return;
    setNonce((n) => n + 1);
    setCopiedTarget(null);
    setMotionStageMode('video');
  }, [activeId]);

  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: CodeTab; label: string }> = [];
    if (activeHtml) tabs.push({ id: 'html', label: isPinUI ? 'TSX' : 'HTML' });
    if (activeCss) tabs.push({ id: 'css', label: 'CSS' });
    if (activeJs) tabs.push({ id: 'js', label: activeJsLang.toUpperCase() });
    tabs.push({ id: 'prompt', label: 'Prompt' });
    return tabs;
  }, [activeHtml, activeCss, activeJs, activeJsLang, isPinUI]);

  const resolvedCodeTab: CodeTab = useMemo(() => {
    if (availableTabs.some((t) => t.id === codeTab)) return codeTab;
    return availableTabs[0]?.id ?? 'prompt';
  }, [availableTabs, codeTab]);

  const activeCode =
    resolvedCodeTab === 'html'
      ? activeHtml
      : resolvedCodeTab === 'css'
        ? activeCss
        : resolvedCodeTab === 'js'
          ? activeJs
          : activePrompt;

  const buildWorkspaceContext = useCallback((): AttachedContextItem | null => {
    if (!activeVaultItem) return null;
    if (activeCatalogItem) {
      return templateContext(activeCatalogItem, activePrompt || undefined);
    }
    const codeBundle = [
      activePrompt,
      activeHtml ? `\n--- HTML ---\n${activeHtml}` : '',
      activeCss ? `\n--- CSS ---\n${activeCss}` : '',
      activeJs ? `\n--- JS ---\n${activeJs}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    return {
      id: activeVaultItem.i,
      kind: 'template',
      title: activeTitle,
      sourceLibrary: activeGroupLabel,
      summary: `${activeGroupLabel} · ${activeVaultItem.c}`,
      payload: codeBundle,
      tags: activeVaultItem.tg,
    };
  }, [activeVaultItem, activeCatalogItem, activePrompt, activeHtml, activeCss, activeJs, activeTitle, activeGroupLabel]);

  const handleSelectItem = (item: VaultIndexItem) => {
    openExperience(item.i);
    setDrawerOpen(false);
  };

  const handleCopy = async (content: string, kind: 'code' | 'prompt', label: string) => {
    if (!content) return;
    const ok = await copyText(content);
    if (ok) {
      setCopiedTarget(kind);
      window.setTimeout(() => {
        setCopiedTarget((prev) => (prev === kind ? null : prev));
      }, 1800);
    }
    addToast(
      ok
        ? { type: 'success', title: label, message: activeTitle }
        : { type: 'error', title: 'Không chép được', message: activeTitle }
    );
  };

  const handleAttach = () => {
    const ctx = buildWorkspaceContext();
    if (!ctx) return;
    if (activeProject.attachedItems.some((entry) => entry.id === ctx.id)) {
      addToast({ type: 'info', title: 'Đã đính kèm từ trước', message: activeTitle });
      return;
    }
    attachItemToWorkspace(ctx);
  };

  const handleOpenWorkspace = () => {
    const ctx = buildWorkspaceContext();
    if (ctx) openInWorkspace(ctx);
  };

  const copyCodeContent =
    resolvedCodeTab === 'css'
      ? activeCss || activeHtml
      : resolvedCodeTab === 'js'
        ? activeJs || activeHtml
        : activeHtml || activeCss || activeJs;

  const categoryChipItems: ChipItem[] = useMemo(
    () =>
      CATEGORY_ORDER.map((tab) => ({
        id: tab.id,
        label: `${tab.label} (${formatCount(countsByCategory[tab.id] ?? 0)})`,
      })),
    [countsByCategory]
  );

  const cycleViewport = () => {
    setViewport((prev) => (prev === 1440 ? 768 : prev === 768 ? 390 : 1440));
  };

  const remainingCount = Math.max(0, filteredItems.length - visibleItems.length);

  return (
    <div className="ex-xp">
      <header className="ex-xp-topbar">
        <div className="wrap-wide ex-xp-topbar-inner">
          <div className="ex-xp-lead">
            <button
              type="button"
              className="btn btn-line ex-xp-back"
              onClick={() => navigate('explore')}
            >
              Quay lại Khám phá
            </button>
            <button
              type="button"
              className="btn btn-ghost ex-xp-drawer-btn"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((prev) => !prev)}
            >
              {drawerOpen ? 'Đóng kho' : `Kho mẫu (${formatCount(filteredItems.length)})`}
            </button>
            {activeVaultItem ? (
              <nav className="ex-xp-crumb" aria-label="Đường dẫn thành phần">
                <span className="t-label">{activeGroupLabel}</span>
                <span className="ex-xp-crumb-sep" aria-hidden="true">
                  /
                </span>
                <strong className="ex-xp-crumb-title">{activeTitle}</strong>
              </nav>
            ) : null}
          </div>

          <div className="ex-xp-search-wrap">
            <SearchCard
              value={search}
              onChange={setSearch}
              placeholder="Tìm trong toàn bộ kho mẫu, hiệu ứng, cảnh 3D..."
              recentSearches={['glass', 'hero', 'button', 'shader', 'card', 'menu']}
              compact
              className="ex-pinui-search ex-xp-search-card"
            />
          </div>

          <div className="ex-xp-actions">
            <button
              type="button"
              className="ex-pill"
              aria-pressed={savedOnly || category === 'saved'}
              onClick={() => setSavedOnly((prev) => !prev)}
            >
              <span className="ex-mark-dot" aria-hidden="true" />
              <span>Đã lưu ({countsByCategory.saved})</span>
            </button>

            {activeVaultItem ? (
              <>
                <button
                  type="button"
                  className="ex-react-btn"
                  aria-pressed={activeSaved}
                  onClick={() => toggleSavedItem(activeId)}
                >
                  <span className="ex-mark-dot" aria-hidden="true" />
                  <span>{activeSaved ? 'Đã lưu' : 'Lưu'}</span>
                </button>

                <PinHeartButton
                  liked={activeLiked}
                  count={activeHearts}
                  ariaLabel={`${activeLiked ? 'Bỏ tim' : 'Thả tim'} ${activeTitle}`}
                  onToggle={() => toggleLikedItem(activeId)}
                />

                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={handleOpenWorkspace}
                >
                  Mở Workspace
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {vaultLoading ? (
        <div className="wrap-wide ex-xp-status-wrap">
          <div className="ex-xp-status-banner" role="status">
            <span className="t-label">Đang đồng bộ chỉ mục toàn kho...</span>
          </div>
        </div>
      ) : vaultError ? (
        <div className="wrap-wide ex-xp-status-wrap">
          <div className="ex-xp-status-banner ex-xp-status-banner--err" role="alert">
            <span className="t-note">{vaultError}</span>
            <button type="button" className="btn btn-line btn-sm" onClick={loadVault}>
              Thử tải lại
            </button>
          </div>
        </div>
      ) : null}

      <div className="wrap-wide ex-xp-workbench">
        <aside
          className="ex-xp-sidebar"
          data-open={drawerOpen ? 'true' : 'false'}
          aria-label="Kho tài nguyên trải nghiệm"
        >
          <Chips
            items={categoryChipItems}
            selectedIds={[category]}
            onToggle={(id) => {
              const nextCat = id as CategoryTab;
              setCategory(nextCat);
              setActiveTag('');
              if (nextCat === 'saved') setSavedOnly(false);
              openExperience('vault');
            }}
            multi={false}
            variant="filter"
            theme={theme}
            className="ex-xp-cat-chips"
          />

          {topTags.length > 0 ? (
            <div className="ex-xp-tag-strip" role="group" aria-label="Lọc theo thẻ">
              <button
                type="button"
                className="ex-vault-tag"
                aria-pressed={activeTag === ''}
                onClick={() => setActiveTag('')}
              >
                #tất-cả
              </button>
              {topTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="ex-vault-tag"
                  aria-pressed={activeTag === tag}
                  onClick={() => setActiveTag((prev) => (prev === tag ? '' : tag))}
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : null}

          <div className="ex-xp-list-meta">
            <span className="t-label">
              {formatCount(filteredItems.length)} / {formatCount(allVaultItems.length)} mẫu
            </span>
            {search || savedOnly || category !== 'all' || activeTag ? (
              <button
                type="button"
                className="ex-text ex-xp-reset-btn"
                onClick={() => {
                  setSearch('');
                  setSavedOnly(false);
                  setCategory('all');
                  setActiveTag('');
                }}
              >
                Đặt lại
              </button>
            ) : null}
          </div>

          {visibleItems.length > 0 ? (
            <div className="ex-xp-list-scroll ff-scrollbar">
              <ul className="ex-xp-compact-list">
                {visibleItems.map((item) => {
                  const selected = activeVaultItem?.i === item.i;
                  const saved = savedItemIds.includes(item.i);
                  return (
                    <li
                      key={item.i}
                      className="ex-xp-vault-row"
                      data-active={selected ? 'true' : undefined}
                    >
                      <button
                        type="button"
                        className="ex-xp-vault-btn"
                        aria-current={selected ? 'true' : undefined}
                        title={`${item.t} · ${item.c}`}
                        onClick={() => handleSelectItem(item)}
                      >
                        <span className="ex-xp-vault-title">{sanitizeBrandText(item.t)}</span>
                        <span className="ex-xp-vault-pill">{item.tg[0] || item.g}</span>
                      </button>
                      <button
                        type="button"
                        className="ex-xp-vault-save"
                        aria-pressed={saved}
                        aria-label={`${saved ? 'Bỏ lưu' : 'Lưu'} ${item.t}`}
                        onClick={() => toggleSavedItem(item.i)}
                      >
                        <span className="ex-mark-dot" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              {remainingCount > 0 ? (
                <div className="ex-vault-more">
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => setVisibleLimit((prev) => prev + PAGE_STEP)}
                  >
                    Hiển thị thêm ({formatCount(remainingCount)} mẫu còn lại)
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="ex-xp-empty">
              <p className="t-note">Không có thành phần khớp bộ lọc hiện tại.</p>
              <button
                type="button"
                className="btn btn-line btn-sm"
                onClick={() => {
                  setSearch('');
                  setSavedOnly(false);
                  setCategory('all');
                  setActiveTag('');
                }}
              >
                Xem tất cả
              </button>
            </div>
          )}
        </aside>

        <div className="ex-xp-main">
          <section className="ex-xp-center" aria-label="Sân khấu trải nghiệm">
            <div className="ex-xp-toolbar">
              <div className="ex-xp-tool-meta">
                {activeHtml && activeOriginalVideo ? (
                  <div className="ex-source-tabs" role="group" aria-label="Chế độ xem mẫu">
                    <button
                      type="button"
                      className="ex-source-tab"
                      aria-pressed={motionStageMode === 'html'}
                      onClick={() => setMotionStageMode('html')}
                    >
                      Bản chạy HTML
                    </button>
                    <button
                      type="button"
                      className="ex-source-tab"
                      aria-pressed={motionStageMode === 'video'}
                      onClick={() => setMotionStageMode('video')}
                    >
                      Video gốc
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="ex-stage-controls" role="group" aria-label="Điều khiển sân khấu">
                <button
                  type="button"
                  className="ex-stage-icon-btn"
                  aria-label="Đổi kích thước khung nhìn"
                  title="Đổi khung nhìn"
                  onClick={cycleViewport}
                >
                  {viewport === 1440 ? (
                    <IconMonitor size={16} aria-hidden="true" />
                  ) : viewport === 768 ? (
                    <IconTablet size={16} aria-hidden="true" />
                  ) : (
                    <IconSmartphone size={16} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  className="ex-stage-icon-btn"
                  aria-pressed={stageZoomed}
                  aria-label={stageZoomed ? 'Thu nhỏ sân khấu về 100%' : 'Phóng to sân khấu 115%'}
                  title={stageZoomed ? 'Thu nhỏ' : 'Phóng to'}
                  onClick={() => setStageZoomed((z) => !z)}
                >
                  {stageZoomed ? (
                    <IconZoomOut size={16} aria-hidden="true" />
                  ) : (
                    <IconZoomIn size={16} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  className="ex-stage-icon-btn"
                  aria-label={stageTheme === 'dark' ? 'Chuyển sân khấu sang nền sáng' : 'Chuyển sân khấu sang nền tối'}
                  title={stageTheme === 'dark' ? 'Nền sáng' : 'Nền tối'}
                  onClick={() => setStageTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                >
                  {stageTheme === 'dark' ? (
                    <IconMoon size={16} aria-hidden="true" />
                  ) : (
                    <IconSun size={16} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  className="ex-stage-icon-btn"
                  aria-label="Đặt lại sân khấu"
                  title="Đặt lại"
                  onClick={() => setNonce((n) => n + 1)}
                >
                  <IconRotateCw size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="ex-stage-icon-btn"
                  aria-pressed={magnifyOpen}
                  aria-label={magnifyOpen ? 'Tắt kính lúp soi chi tiết' : 'Bật kính lúp soi chi tiết'}
                  title={magnifyOpen ? 'Tắt kính lúp' : 'Kính lúp'}
                  onClick={() => setMagnifyOpen((m) => !m)}
                >
                  <IconSearch size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            {magnifyOpen && activeVaultItem ? (
              <div className="ex-xp-magnify-drawer" aria-label="Kính lúp soi chi tiết">
                <Magnify
                  glyph={activeTitle.charAt(0).toUpperCase() || 'F'}
                  microText={`${activeTitle.toUpperCase()} · ${activeGroupLabel.toUpperCase()} · ${activeVaultItem.c.toUpperCase()} · `}
                  hintText={`Di chuyển để soi chi tiết ${activeTitle}`}
                  theme={stageTheme}
                  size={420}
                />
              </div>
            ) : null}

            <div
              className="ex-xp-stage"
              data-theme={stageTheme}
              data-viewport={viewport}
            >
              {activeVaultItem ? (
                <div
                  className="ex-xp-stage-frame"
                  data-viewport={viewport}
                  data-zoomed={stageZoomed ? 'true' : 'false'}
                  data-playground={isPinUI ? 'true' : 'false'}
                >
                  {shardLoading ? (
                    <div className="ex-xp-loading" role="status">
                      <span className="t-label">Đang nạp mã nguồn &amp; sân khấu chạy thử...</span>
                    </div>
                  ) : shardError ? (
                    <div className="ex-xp-loading" role="alert">
                      <span className="t-label">{shardError}</span>
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => {
                          setShardRetryTick((tick) => tick + 1);
                          setNonce((n) => n + 1);
                        }}
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : isPinUI ? (
                    <PinUIPlayground
                      key={`${activeVaultItem.i}-${nonce}`}
                      itemId={activeVaultItem.i}
                      theme={stageTheme}
                    />
                  ) : isThreeUI ? (
                    <ThreeUIPreview
                      key={`${activeVaultItem.i}-3ui`}
                      itemId={activeVaultItem.i}
                      title={activeTitle}
                      image={activeOriginalImage || undefined}
                      videoUrl={activeOriginalVideo || undefined}
                    />
                  ) : (Boolean(activeHtml && (/<(?:!doctype|html|section|main|header|body)[\s>]/i.test(activeHtml) || Boolean(snippetCssWithTheme?.trim()) || activeHtml.trim().length >= 220)) && (motionStageMode === 'html' || !activeOriginalVideo)) ? (
                    <SandboxPreview
                      title={activeTitle}
                      html={shardPayload?.h || activeCatalogItem?.previewHtml || activeHtml}
                      css={snippetCssWithTheme}
                      js={executableSandboxJs}
                      theme={stageTheme}
                      viewport={viewport}
                      nonce={nonce}
                    />
                  ) : isGlacier && activeOriginalVideo ? (
                    <BackgroundLab
                      key={`${activeVaultItem.i}-lab`}
                      title={activeTitle}
                      videoSrc={activeOriginalVideo}
                      poster={activeOriginalImage || undefined}
                    />
                  ) : activeOriginalVideo ? (
                    <SpecimenMedia
                      key={`${activeVaultItem.i}-vid`}
                      preview={{
                        kind: 'video',
                        src: activeOriginalVideo,
                        poster: activeOriginalImage || undefined,
                        credit: isGlacier ? 'getlayers.ai' : 'motionsites.ai',
                      }}
                      title={activeTitle}
                      fallbackLabel={activeGroupLabel}
                      fit="contain"
                      activePlay
                    />
                  ) : activeOriginalImage ? (
                    <div className="ex-xp-original-media">
                      <SpecimenMedia
                        key={`${activeVaultItem.i}-img`}
                        preview={{
                          kind: 'image',
                          src: activeOriginalImage,
                          credit: isThreeUI ? '3D WebGL' : isGlacier ? 'Nền động' : 'Motion AI',
                        }}
                        title={activeTitle}
                        fallbackLabel={activeGroupLabel}
                        fit="contain"
                      />
                    </div>
                  ) : activePreview ? (
                    <SpecimenMedia
                      key={activeVaultItem.i}
                      preview={activePreview}
                      title={activeTitle}
                      fallbackLabel={activeGroupLabel}
                      fit="contain"
                      activePlay
                    />
                  ) : (
                    <div className="ex-spec-type">
                      <span className="t-label">{activeGroupLabel} · {activeVaultItem.c}</span>
                      <span className="ex-spec-word">{activeTitle}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ex-xp-loading">
                  <span className="t-label">Chọn một mẫu ở danh sách bên trái để trải nghiệm.</span>
                </div>
              )}
            </div>

            {activeVaultItem ? (
              <div className="ex-xp-summary">
                <div className="ex-xp-summary-main">
                  <span className="t-label">
                    {activeGroupLabel} · {activeVaultItem.c}
                  </span>
                  <h1 className="t-title ex-xp-title">{activeTitle}</h1>
                  {activeCatalogItem?.description ? (
                    <p className="ex-bench-desc">
                      {sanitizeBrandText(activeCatalogItem.description)}
                    </p>
                  ) : null}
                </div>
                <div className="ex-xp-summary-tags">
                  {activeVaultItem.tg.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="ex-vault-tag"
                      onClick={() => setActiveTag((prev) => (prev === tag.toLowerCase() ? '' : tag.toLowerCase()))}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="ex-xp-card ex-xp-source-drawer" aria-label="Mã nguồn và Prompt nguyên bản">
            <div className="ex-source-editor">
              <div className="ex-source-editor-head">
                <div className="ex-source-tabs" role="tablist" aria-label="Tệp mã nguồn và Prompt">
                  {availableTabs.map((tab) => {
                    const active = resolvedCodeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className="ex-source-tab"
                        onClick={() => setCodeTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div className="ex-xp-copy-bar">
                  {copyCodeContent ? (
                    <button
                      type="button"
                      className="ex-text"
                      onClick={() => void handleCopy(copyCodeContent, 'code', 'Đã chép mã')}
                    >
                      {copiedTarget === 'code' ? 'Đã chép' : 'Chép mã'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="ex-text"
                    disabled={!activePrompt}
                    onClick={() => void handleCopy(activePrompt, 'prompt', 'Đã chép Prompt')}
                  >
                    {copiedTarget === 'prompt' ? 'Đã chép' : 'Chép Prompt'}
                  </button>
                </div>
              </div>

              <pre className="ex-code-pre ex-xp-pre">
                <code>
                  {shardLoading
                    ? 'Đang tải mã nguồn và prompt nguyên bản...'
                    : activeCode || 'Chưa có dữ liệu cho ngăn này.'}
                </code>
              </pre>
            </div>

            {activeVaultItem ? (
              <div className="ex-xp-card-foot">
                <button type="button" className="btn btn-line" onClick={handleAttach}>
                  Đính kèm vào dự án
                </button>
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={handleOpenWorkspace}
                >
                  Mở Workspace
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ExperienceView;
