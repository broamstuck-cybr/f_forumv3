import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconBookOpen,
  IconBookmark,
  IconCode2,
  IconDatabase,
  IconExternalLink,
  IconFilm,
  IconLayers,
  IconRotateCw,
} from '../../ui/icons';
import {
  PINUI_PLAYGROUND_IDS,
  PinUIPlayground,
  ReaderCard,
  SearchCard,
} from '../../components/pinui';
import { useAppStore } from '../../store/appStore';
import {
  fetchMotionSitesFullMap,
  fetchPinUISourceMap,
  getCachedMotionSitesFullMap,
  getCachedPinUISourceMap,
  resolveMotionSiteEntry,
  resolvePinUISource,
  sanitizeBrandText,
  sanitizeSnippetCode,
  type MotionSiteFullEntry,
  type PinUISourceEntry,
} from '../explore/catalog';
import { SandboxPreview } from '../explore/SandboxPreview';
import { SpecimenMedia } from '../explore/SpecimenMedia';
import {
  fetchVaultIndex,
  fetchVaultShard,
  getCachedVaultIndex,
  getCachedVaultShard,
  resolveOriginalLiveUrl,
  type VaultIndexItem,
  type VaultLibraryKey,
  type VaultShardPayload,
} from '../explore/vaultLoader';
import { isRunnableKnowledge, rankKnowledge } from './knowledgeRanking';
import type { AttachedContextItem } from '../../types/index';
import './knowledge.css';

export interface KnowledgeViewProps {
  embedded?: boolean;
  query?: string;
  onQueryChange?: (nextQuery: string) => void;
  source?: VaultLibraryKey | 'all';
  onSourceChange?: (nextSource: VaultLibraryKey | 'all') => void;
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string | null) => void;
  onOpenFeed?: () => void;
  onOpenChat?: () => void;
}

interface LibraryMeta {
  name: string;
  short: string;
  repo: string;
  note: string;
}

interface FeaturedSpine {
  id: string;
  num: string;
  spine: string;
  source: VaultLibraryKey;
  title: string;
  dek: string;
  meta: string;
}

interface PendingWorkspaceLaunch {
  targetProjectId: string;
  filesToLoad: Array<{ path: string; content: string; summary?: string }>;
  attachedItem: AttachedContextItem;
  attribution: { label: string; author: string };
}

const PAGE_STEP = 24;

const LIBRARY_META: Record<VaultLibraryKey, LibraryMeta> = {
  codefronts: {
    name: 'CodeFronts',
    short: 'CodeFronts',
    repo: 'sources/codefronts',
    note: 'Prompt + HTML/CSS/JS chạy được',
  },
  lucianlabs: {
    name: 'LucianLabs',
    short: 'LucianLabs',
    repo: 'sources/lucianlabs',
    note: 'Prompt + demo MIT',
  },
  pinui: {
    name: 'PinUI',
    short: 'PinUI',
    repo: 'sources/pinui',
    note: 'Registry thành phần tương tác MIT',
  },
  threeui: {
    name: 'ThreeUI',
    short: 'ThreeUI',
    repo: 'sources/threeui',
    note: 'Thành phần không gian 3D MIT',
  },
  motionsites: {
    name: 'MotionSites',
    short: 'MotionSites',
    repo: 'sources/motionsites',
    note: 'Mẫu chuyển động kèm trailer',
  },
  glacier: {
    name: 'GetLayers',
    short: 'GetLayers',
    repo: 'sources/getlayers',
    note: 'Nền không gian 3D & video',
  },
};

const SOURCE_ORDER: VaultLibraryKey[] = [
  'codefronts',
  'lucianlabs',
  'pinui',
  'threeui',
  'motionsites',
  'glacier',
];

const FEATURED_SPINES: FeaturedSpine[] = [
  {
    id: 'spine-codefronts',
    num: '1',
    spine: 'CodeFronts MIT',
    source: 'codefronts',
    title: 'Kiến trúc bố cục hai khung & thanh điều hướng chuẩn',
    dek: 'Hệ lưới độc lập vùng cuộn, chữ rõ nét và CSS thuần nhẹ máy.',
    meta: 'CodeFronts · Mã chạy HTML/CSS',
  },
  {
    id: 'spine-lucianlabs',
    num: '2',
    spine: 'LucianLabs',
    source: 'lucianlabs',
    title: 'Bề mặt vật liệu kính & chuyển động vi mô',
    dek: 'Khối tương tác tiết chế độ mờ, giữ nhịp khung hình 60fps.',
    meta: 'LucianLabs · Demo tương tác',
  },
  {
    id: 'spine-pinui',
    num: '3',
    spine: 'PinUI Registry',
    source: 'pinui',
    title: 'Thành phần thẻ đọc, thanh chuyển & tìm kiếm nhanh',
    dek: 'Bộ thành phần React/Motion đồng bộ token sáng tối toàn hệ thống.',
    meta: 'PinUI · Thành phần trực tiếp',
  },
  {
    id: 'spine-threeui',
    num: '4',
    spine: 'ThreeUI & Motion',
    source: 'motionsites',
    title: 'Sân khấu chuyển động & không gian chiều sâu',
    dek: 'Kịch bản cuộn trang và cảnh nền 3D có kiểm định hiệu năng.',
    meta: 'MotionSites · Trailer & kịch bản',
  },
];

const COMMON_QUERIES = ['hero', 'glass', 'dashboard', '3d', 'pricing', 'button', 'background'];

function formatCount(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function sourceSearchUrl(library: VaultLibraryKey): string {
  return `https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/tree/main/${LIBRARY_META[library].repo}`;
}

function formatLabel(item: VaultIndexItem): string {
  if (isRunnableKnowledge(item)) return 'Mã chạy';
  if (item.l === 'motionsites') return 'Trailer';
  if (item.l === 'glacier') return 'Nền video';
  return 'Demo gốc';
}

function FormatIcon({ item }: { item: VaultIndexItem }) {
  if (isRunnableKnowledge(item)) return <IconCode2 size={12} aria-hidden="true" />;
  if (item.l === 'motionsites') return <IconFilm size={12} aria-hidden="true" />;
  if (item.l === 'glacier') return <IconLayers size={12} aria-hidden="true" />;
  return <IconExternalLink size={12} aria-hidden="true" />;
}

function splitPromptParagraphs(raw: string, fallbackTitle: string, metaLine: string): string[] {
  const cleaned = sanitizeBrandText(raw).trim();
  if (!cleaned) {
    return [
      `${fallbackTitle} — ${metaLine}.`,
      'Chọn nút Mở Workspace hoặc Trải nghiệm để kiểm tra trực tiếp mã nguồn và cấu trúc token.',
    ];
  }
  const blocks = cleaned
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 0);
  if (blocks.length >= 2) return blocks.slice(0, 6);
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (sentences.length >= 2) return sentences.slice(0, 6);
  return [cleaned, metaLine];
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({
  embedded = false,
  query: controlledQuery,
  onQueryChange,
  source: controlledSource,
  onSourceChange,
  selectedItemId: controlledSelectedId,
  onSelectItem,
  onOpenFeed,
  onOpenChat,
}) => {
  const {
    theme,
    savedItemIds,
    toggleSavedItem,
    openExperience,
    openInWorkspace,
    addWorkspaceFiles,
    projects,
    activeProject,
    selectProject,
    createProject,
    addToast,
  } = useAppStore();

  const cached = getCachedVaultIndex();
  const [items, setItems] = useState<VaultIndexItem[]>(cached?.items ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const [internalQuery, setInternalQuery] = useState('');
  const [internalSource, setInternalSource] = useState<VaultLibraryKey | 'all'>('all');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [runnableOnly, setRunnableOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_STEP);
  const [activeSpineId, setActiveSpineId] = useState<string>(FEATURED_SPINES[0].id);
  const [mobileReadingOpen, setMobileReadingOpen] = useState(false);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [pendingLaunch, setPendingLaunch] = useState<PendingWorkspaceLaunch | null>(null);

  useEffect(() => {
    if (!pendingLaunch) return;
    if (activeProject.archived || activeProject.id !== pendingLaunch.targetProjectId) {
      if (!projects.some((p) => p.id === pendingLaunch.targetProjectId)) {
        setPendingLaunch(null);
        setLaunchingId(null);
      }
      return;
    }

    const launch = pendingLaunch;
    setPendingLaunch(null);

    try {
      window.localStorage.setItem(
        `fforum_v3_ws_attribution_${activeProject.id}`,
        JSON.stringify(launch.attribution)
      );
    } catch {
      void 0;
    }

    if (launch.filesToLoad.length > 0) {
      addWorkspaceFiles(launch.filesToLoad);
    }
    openInWorkspace(launch.attachedItem);
    setLaunchingId(null);
  }, [pendingLaunch, activeProject.id, activeProject.archived, projects, addWorkspaceFiles, openInWorkspace]);

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

  const query = controlledQuery !== undefined ? controlledQuery : internalQuery;
  const setQuery = useCallback(
    (next: string) => {
      if (controlledQuery === undefined) setInternalQuery(next);
      onQueryChange?.(next);
    },
    [controlledQuery, onQueryChange]
  );

  const source = controlledSource !== undefined ? controlledSource : internalSource;
  const setSource = useCallback(
    (next: VaultLibraryKey | 'all') => {
      if (controlledSource === undefined) setInternalSource(next);
      onSourceChange?.(next);
    },
    [controlledSource, onSourceChange]
  );

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
  const setSelectedId = useCallback(
    (next: string | null) => {
      if (controlledSelectedId === undefined) setInternalSelectedId(next);
      onSelectItem?.(next);
    },
    [controlledSelectedId, onSelectItem]
  );

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchVaultIndex()
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Không tải được chỉ mục tri thức. Kiểm tra kết nối rồi thử lại.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  useEffect(() => {
    setVisibleLimit(PAGE_STEP);
  }, [deferredQuery, source, category, runnableOnly, savedOnly]);

  const savedSet = useMemo(() => new Set(savedItemIds), [savedItemIds]);

  const counts = useMemo(() => {
    const bySource = {} as Record<VaultLibraryKey, number>;
    for (const library of SOURCE_ORDER) bySource[library] = 0;
    let runnable = 0;
    let trailers = 0;
    let saved = 0;
    for (const item of items) {
      bySource[item.l] += 1;
      if (isRunnableKnowledge(item)) runnable += 1;
      if (item.l === 'motionsites' || item.l === 'glacier') trailers += 1;
      if (savedSet.has(item.i)) saved += 1;
    }
    return { bySource, runnable, trailers, saved };
  }, [items, savedSet]);

  const categoryOptions = useMemo(() => {
    const frequency = new Map<string, number>();
    for (const item of items) {
      if (source !== 'all' && item.l !== source) continue;
      if (savedOnly && !savedSet.has(item.i)) continue;
      frequency.set(item.c, (frequency.get(item.c) ?? 0) + 1);
    }
    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
      .slice(0, 8);
  }, [items, source, savedOnly, savedSet]);

  const ranked = useMemo(() => {
    let pool = items;
    if (savedOnly) {
      pool = pool.filter((item) => savedSet.has(item.i));
    }
    if (category !== 'all') {
      pool = pool.filter((item) => item.c === category);
    }
    return rankKnowledge(pool, deferredQuery, {
      source,
      runnableOnly,
      limit: Number.MAX_SAFE_INTEGER,
    });
  }, [items, deferredQuery, source, category, runnableOnly, savedOnly, savedSet]);

  const visible = useMemo(() => ranked.results.slice(0, visibleLimit), [ranked.results, visibleLimit]);

  const selectedEntry = useMemo(() => {
    if (ranked.results.length === 0) return null;
    if (selectedId) {
      const hit = ranked.results.find((entry) => entry.item.i === selectedId);
      if (hit) return hit;
    }
    return ranked.results[0];
  }, [ranked.results, selectedId]);

  const selectedItem = selectedEntry?.item ?? null;

  useEffect(() => {
    if (!selectedItem) {
      setShardPayload(null);
      setShardLoading(false);
      setShardError(null);
      return;
    }

    let cancelled = false;
    setShardError(null);

    if (selectedItem.l === 'pinui') {
      setShardPayload(null);
      if (pinuiMap) {
        setShardLoading(false);
      } else {
        setShardLoading(true);
        fetchPinUISourceMap()
          .then((map) => {
            if (cancelled) return;
            setPinuiMap(map);
            setShardLoading(false);
          })
          .catch(() => {
            if (cancelled) return;
            setShardLoading(false);
          });
      }
      return () => {
        cancelled = true;
      };
    }

    if (selectedItem.l === 'motionsites' && !motionMap) {
      fetchMotionSitesFullMap()
        .then((map) => {
          if (!cancelled) setMotionMap(map);
        })
        .catch(() => undefined);
    }

    if (!selectedItem.s) {
      setShardPayload(null);
      setShardLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const cachedShard = getCachedVaultShard(selectedItem.s);
    if (cachedShard) {
      setShardPayload(cachedShard[selectedItem.i] ?? null);
      setShardLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setShardPayload(null);
    setShardLoading(true);
    fetchVaultShard(selectedItem.s)
      .then((shard) => {
        if (cancelled) return;
        setShardPayload(shard[selectedItem.i] ?? null);
        setShardLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setShardError('Không tải được mã nguồn chi tiết của bản ghi này.');
        setShardLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedItem, shardRetryTick, pinuiMap, motionMap]);

  const pinuiSource = useMemo(
    () => (selectedItem && selectedItem.l === 'pinui' ? resolvePinUISource(pinuiMap, selectedItem.i) : null),
    [selectedItem, pinuiMap]
  );

  const motionEntry = useMemo(
    () =>
      selectedItem && selectedItem.l === 'motionsites'
        ? resolveMotionSiteEntry(motionMap, selectedItem.i)
        : null,
    [selectedItem, motionMap]
  );

  const previewHtml = useMemo(() => {
    if (!selectedItem) return '';
    if (shardPayload?.h) return sanitizeSnippetCode(shardPayload.h);
    if (motionEntry?.liveHtml) return sanitizeSnippetCode(motionEntry.liveHtml);
    return '';
  }, [selectedItem, shardPayload, motionEntry]);

  const previewCss = useMemo(() => {
    if (!selectedItem) return '';
    if (shardPayload?.c) return sanitizeSnippetCode(shardPayload.c);
    if (motionEntry?.css) return sanitizeSnippetCode(motionEntry.css);
    return '';
  }, [selectedItem, shardPayload, motionEntry]);

  const previewJs = useMemo(() => {
    if (!selectedItem) return undefined;
    const lang = (shardPayload?.cl || motionEntry?.codeLang || 'js').toLowerCase();
    if (lang === 'tsx' || lang === 'jsx' || lang === 'ts' || lang === 'glsl') return undefined;
    const raw = shardPayload?.j || motionEntry?.code || '';
    return raw ? sanitizeSnippetCode(raw) : undefined;
  }, [selectedItem, shardPayload, motionEntry]);

  const normalizedPinuiId = useMemo(
    () => (selectedItem?.l === 'pinui' ? selectedItem.i.replace(/^(component|blocx|registry)\//, '') : ''),
    [selectedItem]
  );

  const canRenderPinuiStage =
    Boolean(selectedItem?.l === 'pinui') &&
    normalizedPinuiId !== 'reader-card' &&
    PINUI_PLAYGROUND_IDS.includes(normalizedPinuiId);

  const readerParagraphs = useMemo(() => {
    if (!selectedItem) return [];
    const promptRaw =
      pinuiSource?.prompt ||
      shardPayload?.p ||
      motionEntry?.promptText ||
      '';
    const metaLine = `${LIBRARY_META[selectedItem.l].name} · ${selectedItem.c} · ${selectedItem.tg.slice(0, 4).join(', ')}`;
    return splitPromptParagraphs(promptRaw, selectedItem.t, metaLine);
  }, [selectedItem, pinuiSource, shardPayload, motionEntry]);

  const activeFilterCount =
    Number(Boolean(query.trim())) +
    Number(source !== 'all') +
    Number(category !== 'all') +
    Number(runnableOnly) +
    Number(savedOnly);

  const showEditorialSpine =
    !query.trim() && source === 'all' && category === 'all' && !savedOnly && !runnableOnly;

  const resetFilters = () => {
    setQuery('');
    setSource('all');
    setCategory('all');
    setRunnableOnly(false);
    setSavedOnly(false);
  };

  const handleOpenWorkspace = async (item: VaultIndexItem) => {
    if (!isRunnableKnowledge(item) || launchingId === item.i) return;
    setLaunchingId(item.i);
    try {
      let html = '';
      let css = '';
      let js = '';
      let prompt = `${item.t}\n${LIBRARY_META[item.l].name} · ${item.c}`;

      if (item.l === 'pinui') {
        const map = pinuiMap ?? (await fetchPinUISourceMap().catch(() => ({})));
        if (!pinuiMap) setPinuiMap(map);
        const resolved = resolvePinUISource(map, item.i);
        if (resolved) {
          const tsxClean = sanitizeSnippetCode(resolved.tsx);
          css = sanitizeSnippetCode(resolved.css);
          html = `<section class="ws-pinui-mount">\n  <h1>${sanitizeBrandText(item.t)}</h1>\n  <p>${sanitizeBrandText(resolved.prompt).slice(0, 240)}</p>\n</section>`;
          js = tsxClean ? `/* TSX reference:\n${tsxClean.slice(0, 3200)}\n*/` : '';
          prompt = sanitizeBrandText(resolved.prompt) || prompt;
        }
      } else if (item.s) {
        const shard =
          getCachedVaultShard(item.s) ??
          (await fetchVaultShard(item.s).catch(() => ({} as Record<string, VaultShardPayload>)));
        const payload = shard[item.i];
        if (payload) {
          html = sanitizeSnippetCode(payload.h);
          css = sanitizeSnippetCode(payload.c);
          js = sanitizeSnippetCode(payload.j);
          prompt = sanitizeBrandText(payload.p) || prompt;
        }
      }

      const filesToLoad: Array<{ path: string; content: string; summary?: string }> = [];
      if (html) {
        filesToLoad.push({
          path: 'index.html',
          content: html,
          summary: `Nạp từ ${LIBRARY_META[item.l].name}`,
        });
      }
      if (css) {
        filesToLoad.push({
          path: 'styles.css',
          content: css,
          summary: `Styles từ ${item.t}`,
        });
      }
      if (js) {
        filesToLoad.push({
          path: 'app.js',
          content: js,
          summary: `Script từ ${item.t}`,
        });
      }
      const codeBundle = [
        prompt,
        html ? `\n--- HTML ---\n${html}` : '',
        css ? `\n--- CSS ---\n${css}` : '',
        js ? `\n--- JS ---\n${js}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const attachedItem: AttachedContextItem = {
        id: item.i,
        kind: 'template',
        title: item.t,
        sourceLibrary: `${LIBRARY_META[item.l].name} · SOURCEOFKNOWLEDGFORAI`,
        summary: `${LIBRARY_META[item.l].name} · ${item.c}`,
        payload: codeBundle,
        tags: item.tg,
      };
      const attribution = {
        label: item.t,
        author: `${LIBRARY_META[item.l].name} · SOURCEOFKNOWLEDGFORAI`,
      };

      if (activeProject.archived) {
        const fallbackProj = projects.find((p) => !p.archived);
        const targetProject =
          fallbackProj ??
          createProject(
            item.t || 'Workspace Mới',
            `${LIBRARY_META[item.l].name} · ${item.c}`,
            [attachedItem]
          );
        if (fallbackProj) {
          selectProject(fallbackProj.id);
        }
        setPendingLaunch({
          targetProjectId: targetProject.id,
          filesToLoad,
          attachedItem,
          attribution,
        });
        return;
      }

      try {
        window.localStorage.setItem(
          `fforum_v3_ws_attribution_${activeProject.id}`,
          JSON.stringify(attribution)
        );
      } catch {
        void 0;
      }

      if (filesToLoad.length > 0) {
        addWorkspaceFiles(filesToLoad);
      }
      openInWorkspace(attachedItem);
      setLaunchingId(null);
    } catch {
      addToast({
        type: 'error',
        title: 'Chưa nạp được vào Workspace',
        message: item.t,
      });
      setLaunchingId(null);
    }
  };

  return (
    <div className="kn">
      {!embedded && (onOpenFeed || onOpenChat) && (
        <div className="wrap-wide kn-topline">
          <div className="kn-repo-row">
            <button type="button" className="kn-text-btn" onClick={onOpenFeed}>
              Bảng tin
            </button>
            <button type="button" className="kn-text-btn" onClick={onOpenChat}>
              Phòng chat
            </button>
          </div>
          <a
            className="kn-repo-link"
            href="https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI"
            target="_blank"
            rel="noreferrer"
          >
            <IconDatabase size={13} aria-hidden="true" />
            <span>SOURCEOFKNOWLEDGFORAI</span>
            <IconArrowUpRight size={12} aria-hidden="true" />
          </a>
        </div>
      )}

      <header className="wrap-wide kn-hero">
        <div className="kn-hero-copy">
          <span className="t-caps kn-kicker">Source of Knowledge · 6 nguồn</span>
          <h1 className="kn-title">
            Tìm mẫu thật.
            <br />
            <em>Đọc sâu trước khi dựng.</em>
          </h1>
          <p className="kn-sub">
            Chỉ mục {items.length > 0 ? formatCount(items.length) : '—'} bản ghi từ
            SOURCEOFKNOWLEDGFORAI, đối chiếu mã chạy trực tiếp và đưa thẳng vào Workspace.
          </p>
          <SearchCard
            value={query}
            onChange={setQuery}
            placeholder="Tìm hero glass, pricing table, shader, 3D scene..."
            recentSearches={COMMON_QUERIES}
            onSelectRecent={setQuery}
            className="kn-search"
          />
          <div className="kn-query-row" aria-label="Truy vấn nhanh">
            <span className="t-label">Thử:</span>
            {COMMON_QUERIES.slice(0, 5).map((term) => (
              <button
                key={term}
                type="button"
                className="kn-query"
                onClick={() => setQuery(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <dl className="kn-stats" aria-label="Thống kê kho tri thức">
          <div>
            <dt>Bản ghi</dt>
            <dd>{items.length > 0 ? formatCount(items.length) : '—'}</dd>
          </div>
          <div>
            <dt>Mã chạy được</dt>
            <dd>{items.length > 0 ? formatCount(counts.runnable) : '—'}</dd>
          </div>
          <div>
            <dt>Trailer / nền</dt>
            <dd>{items.length > 0 ? formatCount(counts.trailers) : '—'}</dd>
          </div>
        </dl>
      </header>

      {showEditorialSpine && (
        <section className="wrap-wide kn-spine numbered-spine" aria-label="Tuyển chọn biên tập">
          <ul className="kn-spine-row" role="list">
            {FEATURED_SPINES.map((entry) => {
              const checked = activeSpineId === entry.id;
              return (
                <li key={entry.id} className="kn-spine-panel">
                  <input
                    type="radio"
                    name="kn-editorial-spine"
                    id={entry.id}
                    checked={checked}
                    onChange={() => setActiveSpineId(entry.id)}
                  />
                  <label className="kn-spine-face" htmlFor={entry.id}>
                    <span className="kn-spine-num" aria-hidden="true">
                      {entry.num}
                    </span>
                    <span className="kn-spine-label">{entry.spine}</span>
                    <span className="kn-spine-spread">
                      <strong>{entry.title}</strong>
                      <p>{entry.dek}</p>
                      <span className="kn-spine-foot">
                        <em>{entry.meta}</em>
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    className="kn-spine-cta"
                    onClick={() => {
                      setSource(entry.source);
                      setCategory('all');
                    }}
                  >
                    Mở nguồn
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="wrap-wide kn-workbench-shell">
        {loading ? (
          <div className="kn-workbench kn-workbench--skeleton" aria-busy="true" aria-label="Đang tải chỉ mục">
            <aside className="kn-rail-pane">
              {Array.from({ length: 7 }).map((_, idx) => (
                <span key={idx} className="kn-skel-line" />
              ))}
            </aside>
            <div className="kn-list-pane">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div className="kn-skeleton-row" key={idx}>
                  <span />
                  <span />
                </div>
              ))}
            </div>
            <div className="kn-read-pane">
              <div className="kn-skeleton-read">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="kn-state" role="alert">
            <IconRotateCw size={22} aria-hidden="true" />
            <h2>Chưa mở được chỉ mục</h2>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-line btn-sm"
              onClick={() => setRetryTick((tick) => tick + 1)}
            >
              Thử lại
            </button>
          </div>
        ) : (
          <section
            className="kn-workbench"
            data-reading-open={mobileReadingOpen ? 'true' : undefined}
            aria-label="Bàn làm việc Tri thức"
          >
            <aside className="kn-rail-pane" aria-label="Bộ lọc tri thức">
              <div className="kn-rail-section">
                <div className="kn-rail-head">
                  <span className="t-caps">Nguồn</span>
                  <span className="kn-rail-count">{SOURCE_ORDER.length}</span>
                </div>
                <div className="kn-source-list">
                  <button
                    type="button"
                    className="kn-source"
                    aria-pressed={source === 'all' && !savedOnly}
                    onClick={() => {
                      setSource('all');
                      setSavedOnly(false);
                      setCategory('all');
                    }}
                  >
                    <span>Tất cả nguồn</span>
                    <strong>{formatCount(items.length)}</strong>
                  </button>
                  <button
                    type="button"
                    className="kn-source"
                    aria-pressed={savedOnly}
                    onClick={() => setSavedOnly((prev) => !prev)}
                  >
                    <span>Mẫu đã lưu</span>
                    <strong>{formatCount(counts.saved)}</strong>
                  </button>
                  {SOURCE_ORDER.map((library) => (
                    <button
                      key={library}
                      type="button"
                      className="kn-source"
                      aria-pressed={source === library && !savedOnly}
                      title={LIBRARY_META[library].note}
                      onClick={() => {
                        setSavedOnly(false);
                        setSource(library);
                        setCategory('all');
                      }}
                    >
                      <span>{LIBRARY_META[library].name}</span>
                      <strong>{formatCount(counts.bySource[library] ?? 0)}</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div className="kn-rail-section">
                <label className="kn-check">
                  <input
                    type="checkbox"
                    checked={runnableOnly}
                    onChange={(event) => setRunnableOnly(event.target.checked)}
                  />
                  <span>
                    Chỉ mã chạy
                    <small>CodeFronts · LucianLabs · PinUI</small>
                  </span>
                </label>
              </div>

              <div className="kn-rail-section">
                <div className="kn-rail-head">
                  <span className="t-caps">Danh mục</span>
                  {category !== 'all' && (
                    <button
                      type="button"
                      className="kn-text-btn"
                      onClick={() => setCategory('all')}
                    >
                      Bỏ lọc
                    </button>
                  )}
                </div>
                <div className="kn-category-list">
                  {categoryOptions.map(([name, count]) => (
                    <button
                      key={name}
                      type="button"
                      className="kn-category"
                      data-repeat-ok
                      aria-pressed={category === name}
                      onClick={() => setCategory((prev) => (prev === name ? 'all' : name))}
                    >
                      <span>{name}</span>
                      <strong>{count}</strong>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div className="kn-list-pane">
              <div className="kn-list-head">
                <div className="kn-list-summary">
                  <span className="t-caps">Kết quả</span>
                  <strong className="kn-results-count">
                    {formatCount(ranked.total)} bản ghi
                  </strong>
                </div>
                {activeFilterCount > 0 && (
                  <button type="button" className="kn-text-btn" onClick={resetFilters}>
                    Đặt lại
                  </button>
                )}
              </div>

              {ranked.total === 0 ? (
                <div className="kn-list-empty">
                  <IconBookOpen size={20} aria-hidden="true" />
                  <h2>Không có bản ghi khớp</h2>
                  <p>Thử từ khóa ngắn hơn hoặc bỏ bớt bộ lọc nguồn và danh mục.</p>
                  <button type="button" className="btn btn-line btn-sm" onClick={resetFilters}>
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div className="kn-list-scroll" role="listbox" aria-label="Danh sách bản ghi tri thức">
                  {visible.map(({ item, relevance }) => {
                    const isSelected = selectedItem?.i === item.i;
                    const isSaved = savedSet.has(item.i);
                    const runnable = isRunnableKnowledge(item);
                    return (
                      <div
                        key={`${item.l}-${item.i}`}
                        role="option"
                        aria-selected={isSelected}
                        className="kn-row kv-row"
                        data-vault-item={item.i}
                        data-source={item.l}
                        data-selected={isSelected ? 'true' : undefined}
                        onClick={() => {
                          setSelectedId(item.i);
                          setMobileReadingOpen(true);
                        }}
                      >
                        <div className="kn-row-hit">
                          <span className="kn-row-meta">
                            <span className="kn-card-source">{LIBRARY_META[item.l].short}</span>
                            <span className="kn-format">
                              <FormatIcon item={item} />
                              <span>{formatLabel(item)}</span>
                            </span>
                            <span className="kn-score">{relevance}</span>
                          </span>
                          <strong className="kn-row-title">{item.t}</strong>
                          <span className="kn-row-cat">{item.c}</span>
                        </div>

                        <div className="kn-row-actions">
                          <button
                            type="button"
                            className="kn-row-trigger"
                            data-card-trigger
                            aria-label={`Xem ${item.t}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(item.i);
                              setMobileReadingOpen(true);
                            }}
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            className="kn-icon-btn"
                            aria-pressed={isSaved}
                            aria-label={isSaved ? `Bỏ lưu ${item.t}` : `Lưu ${item.t}`}
                            title={isSaved ? 'Đã lưu' : 'Lưu mẫu'}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSavedItem(item.i);
                            }}
                          >
                            <IconBookmark size={15} filled={isSaved} aria-hidden="true" />
                          </button>
                          {runnable && (
                            <button
                              type="button"
                              className="kn-icon-btn kn-icon-btn--accent"
                              aria-label={`Mở Workspace ${item.t}`}
                              title="Mở Workspace"
                              disabled={launchingId === item.i}
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleOpenWorkspace(item);
                              }}
                            >
                              <IconArrowUpRight size={15} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {visible.length < ranked.total && (
                    <div className="kn-more">
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => setVisibleLimit((limit) => limit + PAGE_STEP)}
                      >
                        Tải thêm
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <main className="kn-read-pane" aria-label="Khung đọc chi tiết">
              {selectedItem ? (
                <div className="kn-read-inner">
                  <div className="kn-read-topbar">
                    <button
                      type="button"
                      className="kn-back-btn"
                      onClick={() => setMobileReadingOpen(false)}
                    >
                      <IconArrowLeft size={15} aria-hidden="true" />
                      <span>Quay lại</span>
                    </button>
                    <span className="kn-read-kicker">
                      {LIBRARY_META[selectedItem.l].name} · {selectedItem.c}
                    </span>
                    <div className="kn-read-actions">
                      <button
                        type="button"
                        className="kn-icon-btn"
                        aria-pressed={savedSet.has(selectedItem.i)}
                        aria-label={savedSet.has(selectedItem.i) ? 'Bỏ lưu mẫu' : 'Lưu mẫu'}
                        title={savedSet.has(selectedItem.i) ? 'Đã lưu' : 'Lưu mẫu'}
                        onClick={() => toggleSavedItem(selectedItem.i)}
                      >
                        <IconBookmark
                          size={16}
                          filled={savedSet.has(selectedItem.i)}
                          aria-hidden="true"
                        />
                      </button>
                      <a
                        href={resolveOriginalLiveUrl(selectedItem.l, selectedItem.i) || sourceSearchUrl(selectedItem.l)}
                        target="_blank"
                        rel="noreferrer"
                        className="kn-icon-btn"
                        aria-label={`Bản gốc ${selectedItem.t}`}
                        title="Bản gốc"
                      >
                        <IconExternalLink size={16} aria-hidden="true" />
                      </a>
                      {isRunnableKnowledge(selectedItem) && (
                        <button
                          type="button"
                          className="kn-icon-btn kn-icon-btn--accent"
                          aria-label={`Mở Workspace ${selectedItem.t}`}
                          title="Mở Workspace"
                          disabled={launchingId === selectedItem.i}
                          onClick={() => void handleOpenWorkspace(selectedItem)}
                        >
                          <IconArrowUpRight size={16} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="kn-run"
                        onClick={() => openExperience(selectedItem.i)}
                      >
                        Trải nghiệm
                      </button>
                    </div>
                  </div>

                  <h2 className="kn-read-title">{selectedItem.t}</h2>

                  {selectedItem.tg.length > 0 && (
                    <div className="kn-read-tags">
                      {selectedItem.tg.slice(0, 5).map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="kn-stage-box">
                    {shardLoading ? (
                      <div className="kn-stage-skeleton" aria-busy="true" aria-label="Đang tải xem trước">
                        <span />
                        <span />
                      </div>
                    ) : shardError ? (
                      <div className="kn-stage-error" role="alert">
                        <span>{shardError}</span>
                        <button
                          type="button"
                          className="btn btn-line btn-sm"
                          onClick={() => setShardRetryTick((t) => t + 1)}
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : canRenderPinuiStage ? (
                      <PinUIPlayground itemId={selectedItem.i} theme={theme} compact />
                    ) : previewHtml ? (
                      <SandboxPreview
                        title={selectedItem.t}
                        html={previewHtml}
                        css={previewCss}
                        js={previewJs}
                        theme={theme}
                        viewport={1440}
                        nonce={0}
                        className="kn-sandbox"
                      />
                    ) : shardPayload?.vid || shardPayload?.img || motionEntry?.previewVideo || motionEntry?.previewImage ? (
                      <SpecimenMedia
                        preview={{
                          kind: shardPayload?.vid || motionEntry?.previewVideo ? 'video' : 'image',
                          src:
                            shardPayload?.vid ||
                            motionEntry?.previewVideo ||
                            shardPayload?.img ||
                            motionEntry?.previewImage ||
                            '',
                          poster: shardPayload?.img || motionEntry?.previewImage || '',
                          credit: LIBRARY_META[selectedItem.l].name,
                        }}
                        title={selectedItem.t}
                        fallbackLabel={LIBRARY_META[selectedItem.l].name}
                        className="kn-media-preview"
                      />
                    ) : (
                      <div className="kn-stage-placeholder">
                        <span className="t-caps">{LIBRARY_META[selectedItem.l].name}</span>
                        <p>{LIBRARY_META[selectedItem.l].note}</p>
                      </div>
                    )}
                  </div>

                  <ReaderCard
                    title={selectedItem.t}
                    subtitle={`${LIBRARY_META[selectedItem.l].name} · ${selectedItem.c}`}
                    paragraphs={readerParagraphs}
                    openLabel="Đọc sâu"
                    theme={theme}
                    className="kn-reader-card"
                  />
                </div>
              ) : (
                <div className="kn-read-empty">
                  <IconBookOpen size={22} aria-hidden="true" />
                  <p>Chọn một bản ghi ở cột bên để đọc chi tiết và chạy thử mã nguồn.</p>
                </div>
              )}
            </main>
          </section>
        )}
      </div>
    </div>
  );
};

export default KnowledgeView;
