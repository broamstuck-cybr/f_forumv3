import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  IconArrowLeft,
  IconBookmark,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconHeart,
  IconMonitor,
  IconMoon,
  IconRotateCw,
  IconSearch,
  IconSmartphone,
  IconSun,
  IconTablet,
  IconX,
} from '../../ui/icons';
import type { SourceCatalogItem } from '../../types/index';
import type { AgentShowcaseProduct, MotionRecipeItem } from '../../types/workspaceV4';
import { AGENT_SHOWCASE_15 } from '../../data/agentShowcase15';
import { useAppStore } from '../../store/appStore';
import { PinUIPlayground } from '../../components/pinui';
import { previewFor } from '../../ui/Media';
import { SpecimenMedia } from './SpecimenMedia';
import {
  LIBRARY_LABEL,
  buildVaultWorkspaceSeed,
  compileSpecimenSrcDoc,
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
  type MotionSiteFullEntry,
  type PinUISourceEntry,
  type PreviewTheme,
  type PreviewViewport,
} from './catalog';
import { ThreeUIPreview } from './ThreeUIPreview';
import { SandboxPreview } from './SandboxPreview';
import {
  VAULT_LIBRARY_LABELS,
  fetchMotionRecipes,
  fetchVaultIndex,
  fetchVaultShard,
  getCachedMotionRecipes,
  getCachedVaultIndex,
  getCachedVaultShard,
  type VaultIndexItem,
  type VaultLibraryKey,
  type VaultShardPayload,
} from './vaultLoader';
import './explore.css';

type ExperienceCategory =
  | 'all'
  | VaultLibraryKey
  | 'motion-recipes'
  | 'showcase-15'
  | 'saved';

type SortOption = 'recommended' | 'newest' | 'popular';
type CodeTab = 'html' | 'css' | 'js' | 'prompt';

const PAGE_SIZE = 24;

const COST_LABELS: Record<MotionRecipeItem['cost'], string> = {
  light: 'Nhẹ',
  medium: 'Vừa',
  heavy: 'Nặng',
};

type SelectedTarget =
  | { kind: 'vault'; item: VaultIndexItem }
  | { kind: 'recipe'; item: MotionRecipeItem }
  | { kind: 'showcase'; item: AgentShowcaseProduct };

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

function cleanRecipeSummary(raw: string): string {
  return raw
    .replace(/\*\*What\s*\/\s*when:\*\*/gi, '')
    .replace(/\*\*Premium parameters(?:\s*\/\s*variants)?:\*\*/gi, '')
    .replace(/\*\*Premium parameters(?:\s*\/\s*variants)?\*\*/gi, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ShowcaseMiniCardPreview: React.FC<{
  title: string;
  html: string;
  theme: PreviewTheme;
}> = ({ title, html, theme }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [box, setBox] = useState({ scale: 0, height: 780 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1]?.isIntersecting) setVisible(true);
      },
      { rootMargin: '220px' }
    );
    io.observe(host);
    const ro = new ResizeObserver((entries) => {
      const rect = entries[entries.length - 1]?.contentRect;
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const scale = rect.width / 1200;
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
    <div
      ref={hostRef}
      className="relative w-full aspect-[16/10] overflow-hidden border-b"
      style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)' }}
    >
      {visible && box.scale > 0 ? (
        <div
          className="absolute top-0 left-0 pointer-events-none origin-top-left"
          style={{
            width: 1200,
            height: box.height,
            transform: `scale(${box.scale})`,
          }}
        >
          <iframe
            title={`Xem trước ${title}`}
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            loading="lazy"
            tabIndex={-1}
            className="block w-full h-full border-0"
          />
        </div>
      ) : null}
    </div>
  );
};

export const ExperienceView: React.FC = () => {
  const {
    sourceCatalog,
    savedItemIds,
    toggleSavedItem,
    toggleLikedItem,
    isItemLiked,
    getHeartCount,
    experienceItemId,
    setExperienceItemId,
    navigate,
    openInWorkspace,
    recordSignal,
    behaviorScores,
    onboardingProfile,
    addToast,
    theme,
  } = useAppStore();

  const reduced = Boolean(useReducedMotion());

  const [category, setCategory] = useState<ExperienceCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [activeTag, setActiveTag] = useState('');
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    const incoming = window.sessionStorage.getItem('ff_experience_query') || '';
    if (incoming) window.sessionStorage.removeItem('ff_experience_query');
    return incoming;
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [vaultItems, setVaultItems] = useState<VaultIndexItem[]>(
    () => getCachedVaultIndex()?.items ?? []
  );
  const [recipes, setRecipes] = useState<MotionRecipeItem[]>(
    () => getCachedMotionRecipes() ?? []
  );
  const [vaultLoading, setVaultLoading] = useState(() => !getCachedVaultIndex());
  const [vaultError, setVaultError] = useState<string | null>(null);

  const [pinuiMap, setPinuiMap] = useState<Record<string, PinUISourceEntry> | null>(
    () => getCachedPinUISourceMap()
  );
  const [motionMap, setMotionMap] = useState<Record<string, MotionSiteFullEntry> | null>(
    () => getCachedMotionSitesFullMap()
  );

  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const [viewport, setViewport] = useState<PreviewViewport>(1440);
  const [stageTheme, setStageTheme] = useState<PreviewTheme>(theme);
  const [nonce, setNonce] = useState(0);
  const [codeTab, setCodeTab] = useState<CodeTab>('html');
  const [copiedTarget, setCopiedTarget] = useState<'code' | 'prompt' | null>(null);

  const [shardPayload, setShardPayload] = useState<VaultShardPayload | null>(null);
  const [shardLoading, setShardLoading] = useState(false);
  const [shardError, setShardError] = useState<string | null>(null);
  const [shardRetryTick, setShardRetryTick] = useState(0);

  const query = search.trim().toLowerCase();

  useEffect(() => {
    setStageTheme(theme);
  }, [theme]);

  const loadData = useCallback(() => {
    setVaultLoading(true);
    setVaultError(null);
    Promise.all([
      fetchVaultIndex(),
      fetchMotionRecipes().catch(() => [] as MotionRecipeItem[]),
      fetchPinUISourceMap().catch(() => ({} as Record<string, PinUISourceEntry>)),
      fetchMotionSitesFullMap().catch(() => ({} as Record<string, MotionSiteFullEntry>)),
    ])
      .then(([indexData, loadedRecipes, loadedPinui, loadedMotion]) => {
        setVaultItems(indexData.items);
        setRecipes(loadedRecipes);
        setPinuiMap(loadedPinui);
        setMotionMap(loadedMotion);
        setVaultLoading(false);
      })
      .catch(() => {
        setVaultError('Không thể tải chỉ mục kho tài nguyên. Vui lòng thử lại.');
        setVaultLoading(false);
      });
  }, []);

  useEffect(() => {
    if (vaultItems.length > 0 && recipes.length > 0 && pinuiMap && motionMap) {
      setVaultLoading(false);
      return;
    }
    loadData();
  }, [loadData, vaultItems.length, recipes.length, pinuiMap, motionMap]);

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

  useEffect(() => {
    if (!experienceItemId || experienceItemId === 'vault') return;
    const stripped = experienceItemId.replace(/^ms-/, '');
    const foundVault = allVaultItems.find(
      (item) => item.i === experienceItemId || item.i === stripped
    );
    if (foundVault) {
      setSelected({ kind: 'vault', item: foundVault });
      return;
    }
    const foundRecipe = recipes.find((item) => item.id === experienceItemId);
    if (foundRecipe) {
      setSelected({ kind: 'recipe', item: foundRecipe });
      return;
    }
    const foundShowcase = AGENT_SHOWCASE_15.find(
      (item) => item.id === experienceItemId || item.slug === experienceItemId
    );
    if (foundShowcase) {
      setSelected({ kind: 'showcase', item: foundShowcase });
    }
  }, [experienceItemId, allVaultItems, recipes]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelected(null);
        setExperienceItemId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, setExperienceItemId]);

  const counts = useMemo(() => {
    const savedSet = new Set(savedItemIds);
    const map: Record<ExperienceCategory, number> = {
      all: allVaultItems.length,
      pinui: 0,
      threeui: 0,
      lucianlabs: 0,
      motionsites: 0,
      codefronts: 0,
      'motion-recipes': recipes.length,
      'showcase-15': AGENT_SHOWCASE_15.length,
      saved: 0,
    };
    for (const item of allVaultItems) {
      map[item.l] = (map[item.l] ?? 0) + 1;
      if (savedSet.has(item.i)) map.saved += 1;
    }
    return map;
  }, [allVaultItems, recipes.length, savedItemIds]);

  const libraryPills: Array<{ id: ExperienceCategory; label: string; count: number }> = useMemo(
    () => [
      { id: 'all', label: 'Tất cả', count: counts.all },
      { id: 'pinui', label: 'Pin UI', count: counts.pinui },
      { id: 'threeui', label: 'ThreeUI 3D', count: counts.threeui },
      { id: 'lucianlabs', label: 'lucianLabs', count: counts.lucianlabs },
      { id: 'motionsites', label: 'MotionSites Free', count: counts.motionsites },
      { id: 'codefronts', label: 'CodeFronts', count: counts.codefronts },
      { id: 'motion-recipes', label: 'Kỹ thuật động', count: counts['motion-recipes'] },
      { id: 'showcase-15', label: 'Mẫu Agent', count: counts['showcase-15'] },
    ],
    [counts]
  );

  const vaultCategoryPool = useMemo(() => {
    if (category === 'motion-recipes' || category === 'showcase-15') return [];
    const savedSet = new Set(savedItemIds);
    return allVaultItems.filter((item) => {
      if (category === 'saved') return savedSet.has(item.i);
      if (category !== 'all' && item.l !== category) return false;
      return true;
    });
  }, [allVaultItems, category, savedItemIds]);

  const topTags = useMemo(() => {
    if (vaultCategoryPool.length === 0) return [];
    const freq = new Map<string, number>();
    for (const item of vaultCategoryPool) {
      for (const raw of item.tg) {
        const tag = raw.trim().toLowerCase();
        if (!tag || tag.length < 2) continue;
        freq.set(tag, (freq.get(tag) ?? 0) + 1);
      }
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [vaultCategoryPool]);

  const filteredVaultItems = useMemo(() => {
    const profileDomain = onboardingProfile?.domain?.toLowerCase() ?? '';
    const savedSet = new Set(savedItemIds);
    const matched = vaultCategoryPool.filter((item) => {
      if (activeTag && !item.tg.some((t) => t.toLowerCase() === activeTag)) return false;
      if (!query) return true;
      const hay = `${item.t} ${item.c} ${VAULT_LIBRARY_LABELS[item.l]} ${item.tg.join(' ')}`.toLowerCase();
      return hay.includes(query);
    });

    if (sortBy === 'newest') {
      return [...matched].reverse();
    }

    if (sortBy === 'popular') {
      return [...matched].sort((a, b) => {
        const recA = behaviorScores[a.i];
        const recB = behaviorScores[b.i];
        const scoreA = (recA?.likes ?? 0) * 4 + (recA?.uses ?? 0) * 6 + a.d;
        const scoreB = (recB?.likes ?? 0) * 4 + (recB?.uses ?? 0) * 6 + b.d;
        return scoreB - scoreA;
      });
    }

    return [...matched].sort((a, b) => {
      const recA = behaviorScores[a.i];
      const recB = behaviorScores[b.i];
      const bonusA =
        (recA?.score ?? 0) * 6 +
        (savedSet.has(a.i) ? 5 : 0) +
        (a.d ? 2 : 0) +
        (profileDomain && `${a.t} ${a.c} ${a.tg.join(' ')}`.toLowerCase().includes(profileDomain) ? 8 : 0);
      const bonusB =
        (recB?.score ?? 0) * 6 +
        (savedSet.has(b.i) ? 5 : 0) +
        (b.d ? 2 : 0) +
        (profileDomain && `${b.t} ${b.c} ${b.tg.join(' ')}`.toLowerCase().includes(profileDomain) ? 8 : 0);
      return bonusB - bonusA;
    });
  }, [vaultCategoryPool, activeTag, query, sortBy, behaviorScores, savedItemIds, onboardingProfile]);

  const filteredRecipes = useMemo(() => {
    if (category !== 'motion-recipes') return [];
    const matched = recipes.filter((item) => {
      if (!query) return true;
      const hay = `${item.title} ${item.category} ${item.useWhen} ${item.summary} ${item.file}`.toLowerCase();
      return hay.includes(query);
    });
    if (sortBy === 'popular') {
      return [...matched].sort((a, b) => (behaviorScores[b.id]?.score ?? 0) - (behaviorScores[a.id]?.score ?? 0));
    }
    return matched;
  }, [category, recipes, query, sortBy, behaviorScores]);

  const filteredShowcase = useMemo(() => {
    if (category !== 'showcase-15') return [];
    return AGENT_SHOWCASE_15.filter((item) => {
      if (!query) return true;
      const hay = `${item.title} ${item.subtitle} ${item.categoryLabel} ${item.authorLabel}`.toLowerCase();
      return hay.includes(query);
    });
  }, [category, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, activeTag, query, sortBy]);

  const visibleVaultItems = useMemo(
    () => filteredVaultItems.slice(0, visibleCount),
    [filteredVaultItems, visibleCount]
  );

  const visibleRecipes = useMemo(
    () => filteredRecipes.slice(0, visibleCount),
    [filteredRecipes, visibleCount]
  );

  const activeVaultItem = selected?.kind === 'vault' ? selected.item : null;

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
        setShardError('Không tải được mã nguồn của mẫu này.');
        setShardLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeVaultItem, shardRetryTick]);

  const activeCatalogItem = useMemo(() => {
    if (!activeVaultItem) return null;
    return catalogById.get(activeVaultItem.i) ?? catalogById.get(`ms-${activeVaultItem.i}`) ?? null;
  }, [activeVaultItem, catalogById]);

  const isPinUI = activeVaultItem?.l === 'pinui';
  const isThreeUI = activeVaultItem?.l === 'threeui';
  const isMotion = activeVaultItem?.l === 'motionsites';

  const pinuiSource = useMemo(
    () => (activeVaultItem && isPinUI ? resolvePinUISource(pinuiMap, activeVaultItem.i) : null),
    [activeVaultItem, isPinUI, pinuiMap]
  );

  const motionEntry = useMemo(
    () => (activeVaultItem && isMotion ? resolveMotionSiteEntry(motionMap, activeVaultItem.i) : null),
    [activeVaultItem, isMotion, motionMap]
  );

  const activeHtml = useMemo(() => {
    if (!selected) return '';
    if (selected.kind === 'showcase') return selected.item.html;
    if (selected.kind === 'recipe') {
      return selected.item.lang === 'html' ? selected.item.code : '';
    }
    if (!activeVaultItem) return '';
    if (isPinUI) return pinuiSource?.tsx ?? '';
    if (shardPayload?.h) return sanitizeSnippetCode(shardPayload.h);
    if (isMotion && motionEntry?.liveHtml) return sanitizeSnippetCode(motionEntry.liveHtml);
    if (activeCatalogItem?.previewHtml) return sanitizeSnippetCode(activeCatalogItem.previewHtml);
    return '';
  }, [selected, activeVaultItem, isPinUI, isMotion, pinuiSource, shardPayload, motionEntry, activeCatalogItem]);

  const activeCss = useMemo(() => {
    if (!selected) return '';
    if (selected.kind === 'recipe') {
      return selected.item.lang === 'css' ? selected.item.code : '';
    }
    if (!activeVaultItem) return '';
    if (isPinUI) return pinuiSource?.css ?? '';
    if (shardPayload?.c) return sanitizeSnippetCode(shardPayload.c);
    if (isMotion && motionEntry?.css) return sanitizeSnippetCode(motionEntry.css);
    if (activeCatalogItem?.previewCss) return sanitizeSnippetCode(activeCatalogItem.previewCss);
    return '';
  }, [selected, activeVaultItem, isPinUI, isMotion, pinuiSource, shardPayload, motionEntry, activeCatalogItem]);

  const activeJs = useMemo(() => {
    if (!selected) return '';
    if (selected.kind === 'recipe') {
      return selected.item.lang !== 'html' && selected.item.lang !== 'css' ? selected.item.code : '';
    }
    if (!activeVaultItem || isPinUI) return '';
    if (shardPayload?.j) return sanitizeSnippetCode(shardPayload.j);
    if (isMotion && motionEntry?.code) return sanitizeSnippetCode(motionEntry.code);
    return '';
  }, [selected, activeVaultItem, isPinUI, isMotion, shardPayload, motionEntry]);

  const activeJsLang = useMemo(() => {
    if (selected?.kind === 'recipe') return (selected.item.lang || 'js').toLowerCase();
    if (!activeVaultItem || isPinUI) return 'js';
    return (shardPayload?.cl || (isMotion ? motionEntry?.codeLang : '') || 'js').toLowerCase();
  }, [selected, activeVaultItem, isPinUI, isMotion, shardPayload, motionEntry]);

  const executableSandboxJs = useMemo(() => {
    if (!activeJs) return undefined;
    if (['tsx', 'jsx', 'ts', 'glsl'].includes(activeJsLang)) return undefined;
    return activeJs;
  }, [activeJs, activeJsLang]);

  const activePrompt = useMemo(() => {
    if (!selected) return '';
    if (selected.kind === 'showcase') return selected.item.userPrompt;
    if (selected.kind === 'recipe') {
      return `Áp dụng kỹ thuật "${selected.item.title}" (${selected.item.category}) vào trang web hiện tại. Khi dùng: ${selected.item.useWhen}.`;
    }
    if (!activeVaultItem) return '';
    if (isPinUI && pinuiSource?.prompt) return sanitizeBrandText(pinuiSource.prompt);
    if (shardPayload?.p) return sanitizeBrandText(shardPayload.p);
    if (isMotion && motionEntry?.promptText) return sanitizeBrandText(motionEntry.promptText);
    if (activeCatalogItem?.promptSpec) return sanitizeBrandText(activeCatalogItem.promptSpec);
    return `Dựng trang dựa trên mẫu "${sanitizeBrandText(activeVaultItem.t)}" (${VAULT_LIBRARY_LABELS[activeVaultItem.l]} · ${activeVaultItem.c}).`;
  }, [selected, activeVaultItem, isPinUI, isMotion, pinuiSource, shardPayload, motionEntry, activeCatalogItem]);

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

  const selectedId =
    selected?.kind === 'vault'
      ? selected.item.i
      : selected?.kind === 'recipe'
        ? selected.item.id
        : selected?.kind === 'showcase'
          ? selected.item.id
          : '';

  const selectedTitle =
    selected?.kind === 'vault'
      ? sanitizeBrandText(selected.item.t)
      : selected?.kind === 'recipe'
        ? selected.item.title
        : selected?.kind === 'showcase'
          ? selected.item.title
          : '';

  const selectedLibrary =
    selected?.kind === 'vault'
      ? VAULT_LIBRARY_LABELS[selected.item.l]
      : selected?.kind === 'recipe'
        ? selected.item.category
        : selected?.kind === 'showcase'
          ? selected.item.categoryLabel
          : '';

  const openVaultInspector = (item: VaultIndexItem) => {
    setSelected({ kind: 'vault', item });
    setViewport(1440);
    setNonce((n) => n + 1);
    setCopiedTarget(null);
    recordSignal(item.i, 'view', item.l);
  };

  const openRecipeInspector = (item: MotionRecipeItem) => {
    setSelected({ kind: 'recipe', item });
    setViewport(1440);
    setNonce((n) => n + 1);
    setCopiedTarget(null);
    recordSignal(item.id, 'view', 'motionsites');
  };

  const openShowcaseInspector = (item: AgentShowcaseProduct) => {
    setSelected({ kind: 'showcase', item });
    setViewport(1440);
    setNonce((n) => n + 1);
    setCopiedTarget(null);
    recordSignal(item.id, 'view', 'showcase');
  };

  const closeInspector = () => {
    setSelected(null);
    setExperienceItemId(null);
  };

  const handleUseVaultItem = (item: VaultIndexItem, overridePayload?: VaultShardPayload | null) => {
    recordSignal(item.i, 'use', item.l);
    const cachedShard = overridePayload ?? (item.s && item.s !== 'pinui' ? getCachedVaultShard(item.s)?.[item.i] : null);
    const cat = catalogById.get(item.i) ?? catalogById.get(`ms-${item.i}`);
    const pSrc = item.l === 'pinui' ? resolvePinUISource(pinuiMap, item.i) : null;
    const mSrc = item.l === 'motionsites' ? resolveMotionSiteEntry(motionMap, item.i) : null;
    openInWorkspace(
      buildVaultWorkspaceSeed({
        id: item.i,
        title: item.t,
        library: item.l,
        prompt: cachedShard?.p || pSrc?.prompt || mSrc?.promptText || cat?.promptSpec,
        html: cachedShard?.h || pSrc?.tsx || mSrc?.liveHtml || cat?.previewHtml,
        css: cachedShard?.c || pSrc?.css || mSrc?.css || cat?.previewCss,
        js: cachedShard?.j || mSrc?.code,
      })
    );
  };

  const handleUseSelectedInWorkspace = () => {
    if (!selected) return;
    if (selected.kind === 'vault') {
      handleUseVaultItem(selected.item, shardPayload);
      return;
    }
    if (selected.kind === 'recipe') {
      recordSignal(selected.item.id, 'use', 'motionsites');
      openInWorkspace({
        kind: 'motion-recipe',
        id: selected.item.id,
        title: selected.item.title,
        sourceLibrary: selected.item.category,
        prompt: activePrompt,
        sourceCode: selected.item.code,
      });
      return;
    }
    recordSignal(selected.item.id, 'use', 'showcase');
    openInWorkspace({
      kind: 'showcase-15',
      id: selected.item.id,
      title: selected.item.title,
      sourceLibrary: selected.item.categoryLabel,
      prompt: selected.item.userPrompt,
      html: selected.item.html,
      profile: selected.item.profile,
    });
  };

  const handleCopy = async (text: string, target: 'code' | 'prompt', title: string) => {
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
      setCopiedTarget(target);
      window.setTimeout(() => setCopiedTarget((prev) => (prev === target ? null : prev)), 1800);
      addToast({ type: 'success', title, message: selectedTitle });
    } else {
      addToast({ type: 'error', title: 'Không chép được' });
    }
  };

  const stepVault = (delta: 1 | -1) => {
    if (selected?.kind === 'vault') {
      const idx = filteredVaultItems.findIndex((it) => it.i === selected.item.i);
      const next = filteredVaultItems[idx + delta];
      if (next) openVaultInspector(next);
    } else if (selected?.kind === 'recipe') {
      const idx = filteredRecipes.findIndex((it) => it.id === selected.item.id);
      const next = filteredRecipes[idx + delta];
      if (next) openRecipeInspector(next);
    } else if (selected?.kind === 'showcase') {
      const idx = filteredShowcase.findIndex((it) => it.id === selected.item.id);
      const next = filteredShowcase[idx + delta];
      if (next) openShowcaseInspector(next);
    }
  };

  const activePreview = activeCatalogItem ? previewFor(activeCatalogItem.id) : null;
  const activeOriginalVideo = shardPayload?.vid || (isMotion ? motionEntry?.previewVideo || '' : '');
  const activeOriginalImage =
    shardPayload?.img ||
    activeCatalogItem?.previewImage ||
    (isMotion ? motionEntry?.previewImage || '' : '') ||
    (activePreview?.kind === 'image' ? activePreview.src : '') ||
    '';

  const totalShownList =
    category === 'motion-recipes'
      ? filteredRecipes.length
      : category === 'showcase-15'
        ? filteredShowcase.length
        : filteredVaultItems.length;

  const remainingCount =
    category === 'motion-recipes'
      ? Math.max(0, filteredRecipes.length - visibleRecipes.length)
      : category === 'showcase-15'
        ? 0
        : Math.max(0, filteredVaultItems.length - visibleVaultItems.length);

  return (
    <div className="wrap-wide flex flex-col gap-5 py-6 sm:py-8 min-w-0 overflow-x-clip">
      <header
        className="flex flex-col gap-4 pb-5 border-b"
        style={{ borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('explore')}
              aria-label="Quay lại Khám phá"
              title="Quay lại Khám phá"
              className="inline-grid place-items-center w-11 h-11 rounded-full border shrink-0 cursor-pointer"
              style={{
                background: 'var(--bg-raised)',
                borderColor: 'var(--line)',
                color: 'var(--fg)',
              }}
            >
              <IconArrowLeft size={18} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h1
                className="text-2xl sm:text-3xl font-semibold tracking-tight m-0"
                style={{ color: 'var(--fg)', fontFamily: 'var(--font-display)' }}
              >
                Kho Trải nghiệm Tài nguyên
              </h1>
              <p className="text-xs sm:text-sm mt-1 m-0" style={{ color: 'var(--fg-muted)' }}>
                {formatCount(counts.all)} mẫu mở · {counts['motion-recipes']} kỹ thuật · {counts['showcase-15']}&nbsp;mẫu Agent
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <label
              className="flex items-center gap-2 w-full sm:flex-1 lg:w-[300px] min-w-[220px] min-h-[44px] px-3.5 rounded-full border"
              style={{
                background: 'var(--bg-raised)',
                borderColor: 'var(--line-strong)',
                color: 'var(--fg)',
              }}
            >
              <IconSearch size={16} aria-hidden="true" style={{ color: 'var(--fg-faint)' }} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mẫu, thẻ, hiệu ứng, cảnh 3D..."
                aria-label="Tìm trong kho tài nguyên"
                className="w-full min-w-0 bg-transparent border-0 outline-none text-sm"
                style={{ color: 'var(--fg)' }}
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Xóa tìm kiếm"
                  title="Xóa"
                  onClick={() => setSearch('')}
                  className="inline-grid place-items-center w-7 h-7 rounded-full border-0 bg-transparent cursor-pointer"
                  style={{ color: 'var(--fg-faint)' }}
                >
                  <IconX size={14} aria-hidden="true" />
                </button>
              ) : null}
            </label>

            <div
              className="inline-flex items-center gap-1 p-1 rounded-full border"
              style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)' }}
              role="group"
              aria-label="Sắp xếp tài nguyên"
            >
              {(
                [
                  { id: 'recommended', label: 'Hợp gu bạn' },
                  { id: 'newest', label: 'Mới nhất' },
                  { id: 'popular', label: 'Phổ biến' },
                ] as Array<{ id: SortOption; label: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={sortBy === opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className="min-h-[36px] px-3 rounded-full border-0 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  style={{
                    background: sortBy === opt.id ? 'var(--bg-raised)' : 'transparent',
                    color: sortBy === opt.id ? 'var(--accent)' : 'var(--fg-muted)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-pressed={category === 'saved'}
              onClick={() => setCategory((prev) => (prev === 'saved' ? 'all' : 'saved'))}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border text-xs font-semibold cursor-pointer whitespace-nowrap"
              style={{
                background: category === 'saved' ? 'var(--accent-soft)' : 'var(--bg-raised)',
                borderColor: category === 'saved' ? 'var(--accent)' : 'var(--line)',
                color: category === 'saved' ? 'var(--accent)' : 'var(--fg-muted)',
              }}
            >
              <IconBookmark size={14} filled={category === 'saved'} aria-hidden="true" />
              <span>Đã lưu ({counts.saved})</span>
            </button>
          </div>
        </div>

        <div
          className="flex flex-nowrap lg:flex-wrap items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
          role="tablist"
          aria-label="Kho thư viện miễn phí"
        >
          {libraryPills.map((pill) => {
            const active = category === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setCategory(pill.id);
                  setActiveTag('');
                }}
                className="inline-flex items-center gap-1.5 flex-none min-h-[40px] px-3.5 rounded-full border text-xs font-semibold whitespace-nowrap cursor-pointer"
                style={{
                  background: active ? 'var(--accent-soft)' : 'var(--bg-raised)',
                  borderColor: active ? 'var(--accent)' : 'var(--line)',
                  color: active ? 'var(--accent)' : 'var(--fg-muted)',
                  transition: 'border-color 140ms ease, background-color 140ms ease, color 140ms ease',
                }}
              >
                <span>{pill.label}</span>
                <span className="font-mono text-[11px] opacity-80">
                  ({formatCount(pill.count)})
                </span>
              </button>
            );
          })}
        </div>

        {topTags.length > 0 ? (
          <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Lọc theo thẻ">
            <button
              type="button"
              aria-pressed={activeTag === ''}
              onClick={() => setActiveTag('')}
              className="flex-none min-h-[32px] px-3 rounded-full border font-mono text-[11.5px] cursor-pointer"
              style={{
                background: activeTag === '' ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                borderColor: activeTag === '' ? 'var(--accent)' : 'var(--line)',
                color: activeTag === '' ? 'var(--accent)' : 'var(--fg-muted)',
              }}
            >
              #tất-cả
            </button>
            {topTags.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={activeTag === tag}
                onClick={() => setActiveTag((prev) => (prev === tag ? '' : tag))}
                className="flex-none min-h-[32px] px-3 rounded-full border font-mono text-[11.5px] cursor-pointer"
                style={{
                  background: activeTag === tag ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                  borderColor: activeTag === tag ? 'var(--accent)' : 'var(--line)',
                  color: activeTag === tag ? 'var(--accent)' : 'var(--fg-muted)',
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="t-label">
          Đang hiển thị {formatCount(category === 'motion-recipes' ? visibleRecipes.length : category === 'showcase-15' ? filteredShowcase.length : visibleVaultItems.length)} / {formatCount(totalShownList)} mục
        </span>
        {(search || activeTag || category !== 'all') ? (
          <button
            type="button"
            className="ex-text"
            onClick={() => {
              setSearch('');
              setActiveTag('');
              setCategory('all');
            }}
          >
            Đặt lại
          </button>
        ) : null}
      </div>

      {vaultLoading ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}
          aria-busy="true"
          aria-label="Đang tải kho tài nguyên"
        >
          {Array.from({ length: 12 }, (_, idx) => (
            <div
              key={idx}
              className="h-[168px] rounded-[14px] border opacity-65"
              style={{ background: 'var(--bg-raised)', borderColor: 'var(--line)' }}
            />
          ))}
        </div>
      ) : vaultError ? (
        <div
          role="alert"
          className="grid place-items-center gap-3 p-10 rounded-[16px] border text-center"
          style={{ background: 'var(--bg-raised)', borderColor: 'var(--line)' }}
        >
          <p className="text-sm m-0" style={{ color: 'var(--fg-muted)' }}>
            {vaultError}
          </p>
          <button type="button" className="btn btn-line" onClick={loadData}>
            Thử lại
          </button>
        </div>
      ) : totalShownList === 0 ? (
        <div
          className="grid place-items-center gap-3 p-10 rounded-[16px] border text-center"
          style={{ background: 'var(--bg-raised)', borderColor: 'var(--line)' }}
        >
          <p className="text-sm m-0" style={{ color: 'var(--fg-muted)' }}>
            {category === 'saved'
              ? 'Bạn chưa lưu mẫu nào. Bấm biểu tượng đánh dấu trên thẻ mẫu để lưu lại.'
              : 'Không tìm thấy tài nguyên nào khớp bộ lọc hiện tại.'}
          </p>
          <button
            type="button"
            className="btn btn-line"
            onClick={() => {
              setSearch('');
              setActiveTag('');
              setCategory('all');
            }}
          >
            Xem tất cả
          </button>
        </div>
      ) : category === 'showcase-15' ? (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}
        >
          {filteredShowcase.map((item) => {
            const liked = isItemLiked(item.id);
            return (
              <article
                key={item.id}
                className="flex flex-col rounded-[16px] border overflow-hidden min-w-0"
                style={{
                  background: 'var(--bg-raised)',
                  borderColor: 'var(--line)',
                  boxShadow: 'var(--shadow-1)',
                }}
              >
                <button
                  type="button"
                  onClick={() => openShowcaseInspector(item)}
                  className="text-left p-0 border-0 bg-transparent cursor-pointer"
                  aria-label={`Xem thử ${item.title}`}
                >
                  <ShowcaseMiniCardPreview title={item.title} html={item.html} theme={stageTheme} />
                </button>
                <div className="flex flex-col gap-2 p-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px]" style={{ color: 'var(--accent)' }}>
                      {item.categoryLabel}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--fg-faint)' }}>
                      {item.authorLabel}
                    </span>
                  </div>
                  <h2
                    className="text-base font-bold m-0 truncate"
                    style={{ color: 'var(--fg)', fontFamily: 'var(--font-ui)' }}
                  >
                    {item.title}
                  </h2>
                  <p className="text-xs m-0 line-clamp-2" style={{ color: 'var(--fg-muted)' }}>
                    {item.subtitle}
                  </p>
                </div>
                <div
                  className="flex items-center justify-between gap-2 px-4 py-3 border-t"
                  style={{ borderColor: 'var(--line)', background: 'var(--bg-sunken)' }}
                >
                  <button
                    type="button"
                    aria-pressed={liked}
                    aria-label={`${liked ? 'Bỏ thích' : 'Thích'} ${item.title}`}
                    onClick={() => toggleLikedItem(item.id, 'showcase')}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-full border font-mono text-xs cursor-pointer"
                    style={{
                      background: liked ? 'var(--danger-soft)' : 'var(--bg-raised)',
                      borderColor: liked ? 'var(--danger)' : 'var(--line)',
                      color: liked ? 'var(--danger)' : 'var(--fg-muted)',
                    }}
                  >
                    <IconHeart size={14} filled={liked} aria-hidden="true" />
                    <span>{getHeartCount(item.id)}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openShowcaseInspector(item)}
                      className="min-h-[40px] px-3.5 rounded-full border text-xs font-semibold cursor-pointer"
                      style={{
                        background: 'transparent',
                        borderColor: 'var(--line-strong)',
                        color: 'var(--fg)',
                      }}
                    >
                      Xem thử
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        recordSignal(item.id, 'use', 'showcase');
                        openInWorkspace({
                          kind: 'showcase-15',
                          id: item.id,
                          title: item.title,
                          sourceLibrary: item.categoryLabel,
                          prompt: item.userPrompt,
                          html: item.html,
                          profile: item.profile,
                        });
                      }}
                      className="min-h-[40px] px-3.5 rounded-full border text-xs font-bold cursor-pointer"
                      style={{
                        background: 'var(--accent-soft)',
                        borderColor: 'var(--accent)',
                        color: 'var(--accent)',
                      }}
                    >
                      Dùng mẫu
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : category === 'motion-recipes' ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}
        >
          {visibleRecipes.map((item) => {
            const liked = isItemLiked(item.id);
            const costTone =
              item.cost === 'light'
                ? { bg: 'var(--green-soft)', fg: 'var(--green)' }
                : item.cost === 'medium'
                  ? { bg: 'var(--amber-soft)', fg: 'var(--amber)' }
                  : { bg: 'var(--danger-soft)', fg: 'var(--danger)' };
            return (
              <article
                key={item.id}
                className="flex flex-col justify-between gap-3 p-4 rounded-[14px] border min-w-0"
                style={{ background: 'var(--bg-raised)', borderColor: 'var(--line)' }}
              >
                <button
                  type="button"
                  onClick={() => openRecipeInspector(item)}
                  className="flex flex-col gap-2 text-left p-0 border-0 bg-transparent cursor-pointer min-w-0"
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="font-mono text-[11px] truncate" style={{ color: 'var(--fg-faint)' }}>
                      {item.category}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold shrink-0"
                      style={{ background: costTone.bg, color: costTone.fg }}
                    >
                      {COST_LABELS[item.cost]}
                    </span>
                  </div>
                  <h2
                    className="text-sm font-bold m-0 leading-snug"
                    style={{ color: 'var(--fg)', fontFamily: 'var(--font-ui)' }}
                  >
                    {item.title}
                  </h2>
                  <p className="text-xs m-0 line-clamp-2" style={{ color: 'var(--fg-muted)' }}>
                    {item.useWhen || cleanRecipeSummary(item.summary)}
                  </p>
                </button>
                <div
                  className="flex items-center justify-between gap-2 pt-3 border-t"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <button
                    type="button"
                    aria-pressed={liked}
                    aria-label={`${liked ? 'Bỏ thích' : 'Thích'} ${item.title}`}
                    onClick={() => toggleLikedItem(item.id, 'motionsites')}
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-3 rounded-full border font-mono text-xs cursor-pointer"
                    style={{
                      background: liked ? 'var(--danger-soft)' : 'var(--bg-sunken)',
                      borderColor: liked ? 'var(--danger)' : 'var(--line)',
                      color: liked ? 'var(--danger)' : 'var(--fg-muted)',
                    }}
                  >
                    <IconHeart size={14} filled={liked} aria-hidden="true" />
                    <span>{getHeartCount(item.id)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openRecipeInspector(item)}
                    className="min-h-[38px] px-3.5 rounded-full border text-xs font-semibold cursor-pointer"
                    style={{
                      background: 'var(--accent-soft)',
                      borderColor: 'var(--accent)',
                      color: 'var(--accent)',
                    }}
                  >
                    Xem mã
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}
        >
          {visibleVaultItems.map((item) => {
            const title = sanitizeBrandText(item.t);
            const liked = isItemLiked(item.i);
            const saved = savedItemIds.includes(item.i);
            const libLabel = VAULT_LIBRARY_LABELS[item.l];
            return (
              <article
                key={`${item.l}:${item.i}`}
                className="flex flex-col justify-between gap-3 p-4 rounded-[14px] border min-w-0"
                style={{
                  background: 'var(--bg-raised)',
                  borderColor: 'var(--line)',
                  transition: 'border-color 160ms ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => openVaultInspector(item)}
                  className="flex flex-col gap-2 text-left p-0 border-0 bg-transparent cursor-pointer min-w-0"
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span
                      className="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      {libLabel}
                    </span>
                    <span className="font-mono text-[11px] truncate" style={{ color: 'var(--fg-faint)' }}>
                      {item.c}
                    </span>
                  </div>
                  <h2
                    className="text-sm font-bold m-0 leading-snug line-clamp-2"
                    style={{ color: 'var(--fg)', fontFamily: 'var(--font-ui)' }}
                  >
                    {title}
                  </h2>
                  {item.tg.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tg.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md font-mono text-[10.5px]"
                          style={{ background: 'var(--bg-sunken)', color: 'var(--fg-muted)' }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>

                <div
                  className="flex items-center justify-between gap-2 pt-3 border-t"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-pressed={liked}
                      aria-label={`${liked ? 'Bỏ thích' : 'Thích'} ${title}`}
                      onClick={() => toggleLikedItem(item.i, item.l)}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-2.5 rounded-full border font-mono text-xs cursor-pointer"
                      style={{
                        background: liked ? 'var(--danger-soft)' : 'var(--bg-sunken)',
                        borderColor: liked ? 'var(--danger)' : 'var(--line)',
                        color: liked ? 'var(--danger)' : 'var(--fg-muted)',
                      }}
                    >
                      <IconHeart size={14} filled={liked} aria-hidden="true" />
                      <span>{getHeartCount(item.i)}</span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={saved}
                      aria-label={`${saved ? 'Bỏ lưu' : 'Lưu'} ${title}`}
                      title={saved ? 'Bỏ lưu' : 'Lưu mẫu'}
                      onClick={() => toggleSavedItem(item.i)}
                      className="inline-grid place-items-center w-[38px] h-[38px] rounded-full border cursor-pointer"
                      style={{
                        background: saved ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                        borderColor: saved ? 'var(--accent)' : 'var(--line)',
                        color: saved ? 'var(--accent)' : 'var(--fg-muted)',
                      }}
                    >
                      <IconBookmark size={14} filled={saved} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openVaultInspector(item)}
                      className="min-h-[38px] px-3 rounded-full border text-xs font-semibold cursor-pointer"
                      style={{
                        background: 'transparent',
                        borderColor: 'var(--line-strong)',
                        color: 'var(--fg)',
                      }}
                    >
                      Chạy thử
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseVaultItem(item)}
                      className="min-h-[38px] px-3 rounded-full border text-xs font-bold cursor-pointer"
                      style={{
                        background: 'var(--accent-soft)',
                        borderColor: 'var(--accent)',
                        color: 'var(--accent)',
                      }}
                    >
                      Dùng
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {remainingCount > 0 ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="btn btn-line"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          >
            Xem thêm {Math.min(PAGE_SIZE, remainingCount)} mẫu ({formatCount(remainingCount)} còn lại)
          </button>
        </div>
      ) : null}

      <AnimatePresence>
        {selected ? (
          <motion.div
            key="xp-inspector-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={`Trình xem mẫu ${selectedTitle}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeInspector}
            className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4"
            style={{ background: 'var(--bg-veil)', backdropFilter: 'blur(10px)' }}
          >
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="grid grid-rows-[auto_minmax(0,1fr)_auto] w-full max-w-[1320px] h-[94dvh] sm:h-[90dvh] rounded-[16px] border overflow-hidden"
              style={{
                background: 'var(--bg-raised)',
                borderColor: 'var(--line-strong)',
                boxShadow: 'var(--shadow-3)',
              }}
            >
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b"
                style={{ borderColor: 'var(--line)', background: 'var(--bg-raised)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold shrink-0"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    {selectedLibrary}
                  </span>
                  <h2
                    className="text-sm sm:text-base font-bold m-0 truncate"
                    style={{ color: 'var(--fg)', fontFamily: 'var(--font-ui)' }}
                  >
                    {selectedTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Mẫu trước"
                    title="Mẫu trước"
                    onClick={() => stepVault(-1)}
                    className="inline-grid place-items-center w-10 h-10 rounded-full border cursor-pointer"
                    style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)', color: 'var(--fg)' }}
                  >
                    <IconChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Mẫu tiếp theo"
                    title="Mẫu sau"
                    onClick={() => stepVault(1)}
                    className="inline-grid place-items-center w-10 h-10 rounded-full border cursor-pointer"
                    style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)', color: 'var(--fg)' }}
                  >
                    <IconChevronRight size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Đổi khung nhìn (${viewport}px)`}
                    title={`Khung ${viewport}px`}
                    onClick={() => setViewport((prev) => (prev === 1440 ? 768 : prev === 768 ? 390 : 1440))}
                    className="inline-grid place-items-center w-10 h-10 rounded-full border cursor-pointer"
                    style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)', color: 'var(--fg)' }}
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
                    aria-label={stageTheme === 'dark' ? 'Nền sân khấu sáng' : 'Nền sân khấu tối'}
                    title={stageTheme === 'dark' ? 'Nền sáng' : 'Nền tối'}
                    onClick={() => setStageTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                    className="inline-grid place-items-center w-10 h-10 rounded-full border cursor-pointer"
                    style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)', color: 'var(--fg)' }}
                  >
                    {stageTheme === 'dark' ? (
                      <IconSun size={16} aria-hidden="true" />
                    ) : (
                      <IconMoon size={16} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Chạy lại sân khấu"
                    title="Chạy lại"
                    onClick={() => setNonce((n) => n + 1)}
                    className="inline-grid place-items-center w-10 h-10 rounded-full border cursor-pointer"
                    style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)', color: 'var(--fg)' }}
                  >
                    <IconRotateCw size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Đóng"
                    title="Đóng"
                    onClick={closeInspector}
                    className="inline-grid place-items-center w-10 h-10 rounded-full border cursor-pointer"
                    style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)', color: 'var(--fg)' }}
                  >
                    <IconX size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] min-h-0 overflow-y-auto lg:overflow-hidden">
                <div
                  className="flex items-stretch justify-center p-3 sm:p-4 min-h-[340px] lg:min-h-0 overflow-auto border-b lg:border-b-0 lg:border-r"
                  style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)' }}
                >
                  <div
                    className="w-full h-full min-h-[320px] rounded-[12px] overflow-hidden border"
                    style={{
                      maxWidth: viewport === 1440 ? '100%' : `${viewport}px`,
                      borderColor: 'var(--line)',
                      background: 'var(--bg)',
                    }}
                  >
                    {selected.kind === 'showcase' ? (
                      <SandboxPreview
                        title={selected.item.title}
                        html={selected.item.html}
                        css=""
                        theme={stageTheme}
                        viewport={viewport}
                        nonce={nonce}
                      />
                    ) : selected.kind === 'recipe' ? (
                      <div className="flex flex-col gap-4 p-5 h-full overflow-y-auto" style={{ color: 'var(--fg)' }}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="px-2.5 py-1 rounded-full font-mono text-xs"
                            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                          >
                            {selected.item.category}
                          </span>
                          <span
                            className="px-2.5 py-1 rounded-full font-mono text-xs"
                            style={{ background: 'var(--bg-raised)', color: 'var(--fg-muted)' }}
                          >
                            Mức tải: {COST_LABELS[selected.item.cost]}
                          </span>
                          <span className="font-mono text-xs" style={{ color: 'var(--fg-faint)' }}>
                            {selected.item.file}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold m-0" style={{ fontFamily: 'var(--font-display)' }}>
                          {selected.item.title}
                        </h3>
                        <p className="text-sm m-0" style={{ color: 'var(--accent-secondary)' }}>
                          Khi dùng: {selected.item.useWhen}
                        </p>
                        <p className="text-sm leading-relaxed m-0" style={{ color: 'var(--fg-muted)' }}>
                          {cleanRecipeSummary(selected.item.summary)}
                        </p>
                      </div>
                    ) : shardLoading ? (
                      <div className="grid place-items-center h-full min-h-[320px] p-6 text-center" role="status">
                        <span className="t-label">Đang tải sân khấu chạy thử...</span>
                      </div>
                    ) : shardError ? (
                      <div className="grid place-items-center gap-3 h-full min-h-[320px] p-6 text-center" role="alert">
                        <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>
                          {shardError}
                        </span>
                        <button
                          type="button"
                          className="btn btn-line btn-sm"
                          onClick={() => setShardRetryTick((t) => t + 1)}
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : isPinUI && activeVaultItem ? (
                      <PinUIPlayground
                        key={`${activeVaultItem.i}-${nonce}`}
                        itemId={activeVaultItem.i}
                        theme={stageTheme}
                      />
                    ) : isThreeUI && activeVaultItem ? (
                      <ThreeUIPreview
                        key={`${activeVaultItem.i}-3ui-${nonce}`}
                        itemId={activeVaultItem.i}
                        title={selectedTitle}
                        image={activeOriginalImage || undefined}
                        videoUrl={activeOriginalVideo || undefined}
                      />
                    ) : activeHtml ? (
                      <SandboxPreview
                        title={selectedTitle}
                        html={shardPayload?.h || activeCatalogItem?.previewHtml || activeHtml}
                        css={activeCss}
                        js={executableSandboxJs}
                        theme={stageTheme}
                        viewport={viewport}
                        nonce={nonce}
                      />
                    ) : activeOriginalVideo ? (
                      <SpecimenMedia
                        key={`${selectedId}-vid`}
                        preview={{
                          kind: 'video',
                          src: activeOriginalVideo,
                          poster: activeOriginalImage || undefined,
                          credit: 'motionsites.ai',
                        }}
                        title={selectedTitle}
                        fallbackLabel={selectedLibrary}
                        fit="contain"
                        activePlay
                      />
                    ) : activeOriginalImage ? (
                      <SpecimenMedia
                        key={`${selectedId}-img`}
                        preview={{
                          kind: 'image',
                          src: activeOriginalImage,
                          credit: selectedLibrary,
                        }}
                        title={selectedTitle}
                        fallbackLabel={selectedLibrary}
                        fit="contain"
                      />
                    ) : activePreview ? (
                      <SpecimenMedia
                        key={selectedId}
                        preview={activePreview}
                        title={selectedTitle}
                        fallbackLabel={selectedLibrary}
                        fit="contain"
                        activePlay
                      />
                    ) : (
                      <div className="grid place-items-center h-full min-h-[320px] p-6 text-center">
                        <div>
                          <p className="t-label m-0">{selectedLibrary}</p>
                          <p className="text-xl font-semibold mt-2 m-0" style={{ fontFamily: 'var(--font-display)' }}>
                            {selectedTitle}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-h-0 bg-[var(--bg-raised)]">
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <div className="inline-flex items-center gap-1 p-1 rounded-full border" style={{ borderColor: 'var(--line)', background: 'var(--bg-sunken)' }} role="tablist" aria-label="Ngăn mã nguồn">
                      {availableTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={resolvedCodeTab === tab.id}
                          onClick={() => setCodeTab(tab.id)}
                          className="min-h-[32px] px-3 rounded-full border-0 font-mono text-[11.5px] font-semibold cursor-pointer"
                          style={{
                            background: resolvedCodeTab === tab.id ? 'var(--accent-soft)' : 'transparent',
                            color: resolvedCodeTab === tab.id ? 'var(--accent)' : 'var(--fg-muted)',
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Chép đoạn mã đang xem"
                        title={copiedTarget === 'code' ? 'Đã chép mã' : 'Chép mã'}
                        onClick={() => void handleCopy(activeCode, 'code', 'Đã chép mã')}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full border text-xs font-semibold cursor-pointer"
                        style={{
                          background: 'var(--bg-sunken)',
                          borderColor: copiedTarget === 'code' ? 'var(--green)' : 'var(--line)',
                          color: copiedTarget === 'code' ? 'var(--green)' : 'var(--fg)',
                        }}
                      >
                        {copiedTarget === 'code' ? (
                          <IconCheck size={14} aria-hidden="true" />
                        ) : (
                          <IconCopy size={14} aria-hidden="true" />
                        )}
                        <span>{copiedTarget === 'code' ? 'Đã chép' : 'Chép mã'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCopy(activePrompt, 'prompt', 'Đã chép Prompt')}
                        className="min-h-[36px] px-3 rounded-full border text-xs font-semibold cursor-pointer"
                        style={{
                          background: 'transparent',
                          borderColor: copiedTarget === 'prompt' ? 'var(--green)' : 'var(--line)',
                          color: copiedTarget === 'prompt' ? 'var(--green)' : 'var(--fg-muted)',
                        }}
                      >
                        {copiedTarget === 'prompt' ? 'Đã chép' : 'Chép Prompt'}
                      </button>
                    </div>
                  </div>

                  <pre
                    className="flex-1 m-0 p-4 overflow-auto font-mono text-xs leading-relaxed"
                    style={{ background: 'var(--bg-sunken)', color: 'var(--fg)' }}
                  >
                    <code>
                      {shardLoading
                        ? 'Đang tải mã nguồn...'
                        : activeCode || 'Chưa có đoạn mã cho ngăn này.'}
                    </code>
                  </pre>
                </div>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t"
                style={{ borderColor: 'var(--line)', background: 'var(--bg-raised)' }}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={isItemLiked(selectedId)}
                    aria-label={`${isItemLiked(selectedId) ? 'Bỏ thích' : 'Thích'} ${selectedTitle}`}
                    onClick={() =>
                      toggleLikedItem(
                        selectedId,
                        selected.kind === 'vault'
                          ? selected.item.l
                          : selected.kind === 'recipe'
                            ? 'motionsites'
                            : 'showcase'
                      )
                    }
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full border font-mono text-xs cursor-pointer"
                    style={{
                      background: isItemLiked(selectedId) ? 'var(--danger-soft)' : 'var(--bg-sunken)',
                      borderColor: isItemLiked(selectedId) ? 'var(--danger)' : 'var(--line)',
                      color: isItemLiked(selectedId) ? 'var(--danger)' : 'var(--fg)',
                    }}
                  >
                    <IconHeart size={15} filled={isItemLiked(selectedId)} aria-hidden="true" />
                    <span>{getHeartCount(selectedId)}</span>
                  </button>

                  {selected.kind === 'vault' ? (
                    <button
                      type="button"
                      aria-pressed={savedItemIds.includes(selectedId)}
                      aria-label={savedItemIds.includes(selectedId) ? 'Bỏ lưu mẫu' : 'Lưu mẫu'}
                      title={savedItemIds.includes(selectedId) ? 'Bỏ lưu' : 'Lưu mẫu'}
                      onClick={() => toggleSavedItem(selectedId)}
                      className="inline-grid place-items-center w-11 h-11 rounded-full border cursor-pointer"
                      style={{
                        background: savedItemIds.includes(selectedId) ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                        borderColor: savedItemIds.includes(selectedId) ? 'var(--accent)' : 'var(--line)',
                        color: savedItemIds.includes(selectedId) ? 'var(--accent)' : 'var(--fg)',
                      }}
                    >
                      <IconBookmark size={16} filled={savedItemIds.includes(selectedId)} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={handleUseSelectedInWorkspace}
                  className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-full border-0 text-sm font-semibold cursor-pointer"
                  style={{ background: 'var(--accent-fill)', color: 'var(--on-accent)' }}
                >
                  Dùng trong Workspace
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ExperienceView;
