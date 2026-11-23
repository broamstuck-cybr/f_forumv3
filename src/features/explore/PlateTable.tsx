import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Monitor, Moon, RotateCw, Smartphone, Sun, Tablet, ZoomIn, ZoomOut } from 'lucide-react';
import type { SourceCatalogItem } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { PinUIPlayground, type FileBoxTab } from '../../components/pinui';
import { previewFor } from '../../ui/Media';
import { Reveal } from '../../ui/Reveal';
import {
  LIBRARY_LABEL,
  buildSnippetThemeOverrideCss,
  copyText,
  fetchMotionSitesFullMap,
  fetchPinUISourceMap,
  formatCount,
  getCachedMotionSitesFullMap,
  getCachedPinUISourceMap,
  matchesQuery,
  matchesTopicChip,
  resolveMotionSiteEntry,
  resolvePinUISource,
  sanitizeBrandText,
  sanitizeSnippetCode,
  templateContext,
  type ExplorePlateItem,
  type MotionSiteFullEntry,
  type PinUISourceEntry,
  type PreviewTheme,
  type PreviewViewport,
} from './catalog';
import {
  VAULT_LIBRARY_LABELS,
  VAULT_LIBRARY_ORDER,
  fetchVaultShard,
  getCachedVaultShard,
  resolveOriginalLiveUrl,
  type VaultIndexItem,
  type VaultLibraryKey,
  type VaultShardPayload,
} from './vaultLoader';
import { PlateRibbon } from './PlateRibbon';
import { SandboxPreview } from './SandboxPreview';
import { SpecimenMedia } from './SpecimenMedia';
import { ReactionBar, SpecimenSheet } from './SpecimenSheet';
import { useCalm } from './useCalm';

export type LibraryFilter = 'all' | VaultLibraryKey;
type BenchTab = 'html' | 'css' | 'code' | 'spec';

const RIBBON_CAP = 24;
const PREFETCH_SHARD_CAP = 10;

const TOPIC_LABEL: Record<string, string> = {
  hero: 'Hero & Mở đầu',
  card: 'Thẻ & Bento',
  button: 'Nút tương tác',
  '3d': 'WebGL & 3D',
  pricing: 'Bảng giá',
};

interface PlateTableProps {
  query: string;
  topicChip?: string;
  onClearTopic?: () => void;
  onClearQuery: () => void;
  savedOnly: boolean;
  onShowAll: () => void;
  onToggleSavedOnly: () => void;
  library?: LibraryFilter;
  onLibraryChange?: (library: LibraryFilter) => void;
  vaultItems?: VaultIndexItem[];
  onOpenVaultQuery?: (q: string) => void;
}

export const PlateTable: React.FC<PlateTableProps> = ({
  query,
  topicChip = '',
  onClearTopic,
  onClearQuery,
  savedOnly,
  onShowAll,
  onToggleSavedOnly,
  library: controlledLibrary,
  onLibraryChange,
  vaultItems = [],
  onOpenVaultQuery,
}) => {
  const {
    sourceCatalog,
    savedItemIds,
    attachItemToWorkspace,
    openInWorkspace,
    openExperience,
    activeProject,
    addToast,
    theme,
  } = useAppStore();
  const calm = useCalm();
  const benchRef = useRef<HTMLElement>(null);
  const [coarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );
  const [internalLibrary, setInternalLibrary] = useState<LibraryFilter>('all');
  const library = controlledLibrary ?? internalLibrary;
  const setLibrary = onLibraryChange ?? setInternalLibrary;

  const [driftOn, setDriftOn] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewport, setViewport] = useState<PreviewViewport>(1440);
  const [stageZoomed, setStageZoomed] = useState(false);
  const [stageTheme, setStageTheme] = useState<PreviewTheme>(theme);
  const [nonce, setNonce] = useState(0);
  const [benchCodeOpen, setBenchCodeOpen] = useState(true);
  const [benchTab, setBenchTab] = useState<BenchTab>('html');
  const [copiedCode, setCopiedCode] = useState(false);
  const [motionStageMode, setMotionStageMode] = useState<'html' | 'video'>('html');
  const [shardVersion, setShardVersion] = useState(0);
  const [pinuiMap, setPinuiMap] = useState<Record<string, PinUISourceEntry> | null>(
    () => getCachedPinUISourceMap()
  );
  const [motionMap, setMotionMap] = useState<Record<string, MotionSiteFullEntry> | null>(
    () => getCachedMotionSitesFullMap()
  );

  const canDrift = !calm && !coarse;

  useEffect(() => {
    setStageTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!motionMap) {
      void fetchMotionSitesFullMap().then((loaded) => setMotionMap(loaded));
    }
  }, [motionMap]);

  const catalogById = useMemo(() => {
    const map = new Map<string, SourceCatalogItem>();
    for (const item of sourceCatalog) {
      map.set(item.id, item);
      if (item.sourceLibrary === 'motionsites') {
        map.set(item.id.replace(/^ms-/, ''), item);
      }
      if (item.id.startsWith('glacier/')) {
        map.set(item.id.replace(/^glacier\//, ''), item);
      }
    }
    return map;
  }, [sourceCatalog]);

  const unifiedPool: ExplorePlateItem[] = useMemo(() => {
    if (vaultItems.length === 0) {
      return sourceCatalog.map((item) => {
        const isGl = item.id.startsWith('glacier/');
        const vaultLibrary: VaultLibraryKey = isGl ? 'glacier' : item.sourceLibrary;
        const motionEntry =
          vaultLibrary === 'motionsites' ? resolveMotionSiteEntry(motionMap, item.id) : null;
        return {
          ...item,
          vaultLibrary,
          previewVideo: motionEntry?.previewVideo,
          previewImage: item.previewImage || motionEntry?.previewImage,
          officialUrl: item.officialUrl || motionEntry?.liveUrl || '',
          hasRichMedia: Boolean(
            item.previewHtml ||
              item.previewImage ||
              motionEntry?.previewVideo ||
              motionEntry?.previewImage ||
              previewFor(item.id)
          ),
        };
      });
    }

    return vaultItems.map((vi) => {
      const cat =
        catalogById.get(vi.i) ??
        catalogById.get(`ms-${vi.i}`) ??
        catalogById.get(`glacier/${vi.i}`);
      const shard = vi.s && vi.s !== 'pinui' ? getCachedVaultShard(vi.s)?.[vi.i] : undefined;
      const motionEntry =
        vi.l === 'motionsites' ? resolveMotionSiteEntry(motionMap, vi.i) : null;

      const sourceLibrary =
        vi.l === 'glacier' ? 'threeui' : vi.l;
      const previewHtml = shard?.h || cat?.previewHtml || motionEntry?.liveHtml;
      const previewCss = shard?.c || cat?.previewCss || motionEntry?.css;
      const previewVideo = shard?.vid || motionEntry?.previewVideo;
      const previewImage = shard?.img || cat?.previewImage || motionEntry?.previewImage;
      const officialUrl = resolveOriginalLiveUrl(
        vi.l,
        vi.i,
        shard?.u || motionEntry?.liveUrl || cat?.officialUrl
      );

      const resolvedId = cat?.id ?? vi.i;
      return {
        id: resolvedId,
        title: cat?.title ?? vi.t,
        sourceLibrary,
        vaultLibrary: vi.l,
        category: cat?.category ?? vi.c,
        subcategory: cat?.subcategory ?? '',
        tags: Array.from(new Set([...(cat?.tags ?? []), ...vi.tg])),
        runtime: cat?.runtime ?? shard?.m?.runtime ?? (vi.l === 'glacier' ? 'Three.js / WebGL' : VAULT_LIBRARY_LABELS[vi.l]),
        style: cat?.style ?? shard?.m?.layout ?? vi.c,
        license: cat?.license ?? 'Source Archive',
        officialUrl,
        archivePath: cat?.archivePath ?? '',
        description:
          cat?.description ??
          `${VAULT_LIBRARY_LABELS[vi.l]} · ${vi.c} (${vi.tg.slice(0, 3).join(', ')})`,
        previewHtml,
        previewCss,
        previewImage,
        previewVideo,
        promptSpec: shard?.p || cat?.promptSpec || motionEntry?.promptText,
        shard: vi.s,
        hasRichMedia: Boolean(
          cat || vi.d === 1 || previewHtml || previewVideo || previewImage || previewFor(resolvedId)
        ),
      };
    });
  }, [vaultItems, sourceCatalog, catalogById, motionMap, shardVersion]);

  const savedSet = useMemo(() => new Set(savedItemIds), [savedItemIds]);

  const savedPlateCount = useMemo(
    () =>
      unifiedPool.filter(
        (item) => savedSet.has(item.id) || savedSet.has(item.id.replace(/^(ms-|glacier\/)/, ''))
      ).length,
    [unifiedPool, savedSet]
  );

  const hasActiveFilter = Boolean(query || topicChip || savedOnly);

  const ribbons = useMemo(() => {
    return VAULT_LIBRARY_ORDER.map((name) => {
      const all = unifiedPool.filter((item) => item.vaultLibrary === name);
      const matches = all.filter((item) => {
        const isSaved =
          savedSet.has(item.id) || savedSet.has(item.id.replace(/^(ms-|glacier\/)/, ''));
        if (savedOnly && !isSaved) return false;
        const fields = [
          item.title,
          item.description,
          item.category,
          item.subcategory,
          item.runtime,
          item.style,
          VAULT_LIBRARY_LABELS[item.vaultLibrary],
          LIBRARY_LABEL[item.sourceLibrary],
          ...item.tags,
        ];
        if (!matchesTopicChip(topicChip, fields)) return false;
        if (!matchesQuery(query, fields)) return false;
        return true;
      });
      const richnessScore = (item: ExplorePlateItem): number => {
        if (item.vaultLibrary === 'pinui') return 4;
        if (item.previewHtml) return 4;
        if (item.previewImage && /\.(gif|webp)(\?|$)/i.test(item.previewImage)) return 3;
        if (item.previewImage) return 2;
        if (item.previewVideo) return 1;
        return item.hasRichMedia ? 1 : 0;
      };
      const prioritized = [...matches].sort((a, b) => richnessScore(b) - richnessScore(a));
      return {
        name,
        allCount: all.length,
        totalMatches: matches.length,
        items: prioritized.slice(0, RIBBON_CAP),
      };
    });
  }, [unifiedPool, query, topicChip, savedOnly, savedSet]);

  const shown = ribbons.filter(
    (ribbon) => (library === 'all' || ribbon.name === library) && ribbon.items.length > 0
  );
  const totalMatchedAcrossAll = ribbons.reduce((sum, r) => sum + r.totalMatches, 0);
  const flat = shown.flatMap((ribbon) => ribbon.items);

  useEffect(() => {
    const neededShards = new Set<string>();
    for (const ribbon of shown) {
      for (const item of ribbon.items) {
        if (
          item.shard &&
          item.shard !== 'pinui' &&
          !getCachedVaultShard(item.shard) &&
          neededShards.size < PREFETCH_SHARD_CAP
        ) {
          neededShards.add(item.shard);
        }
      }
    }
    if (neededShards.size === 0) return;
    let cancelled = false;
    void Promise.all(
      Array.from(neededShards).map((shard) => fetchVaultShard(shard).catch(() => null))
    ).then(() => {
      if (!cancelled) setShardVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [shown]);

  const activeIndex = useMemo(() => {
    if (flat.length === 0) return -1;
    if (activeId) {
      const idx = flat.findIndex((item) => item.id === activeId);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [flat, activeId]);

  const activeItem = activeIndex >= 0 ? flat[activeIndex] : null;
  const sheetItem = sheetOpen ? activeItem : null;

  useEffect(() => {
    if (!activeItem) return;
    if (activeItem.vaultLibrary === 'pinui' && !pinuiMap) {
      void fetchPinUISourceMap().then((loaded) => setPinuiMap(loaded));
    }
    if (activeItem.vaultLibrary === 'motionsites' && !motionMap) {
      void fetchMotionSitesFullMap().then((loaded) => setMotionMap(loaded));
    }
    if (activeItem.shard && activeItem.shard !== 'pinui' && !getCachedVaultShard(activeItem.shard)) {
      void fetchVaultShard(activeItem.shard)
        .then(() => setShardVersion((v) => v + 1))
        .catch(() => undefined);
    }
  }, [activeItem?.id, activeItem?.vaultLibrary, activeItem?.shard, pinuiMap, motionMap]);

  useEffect(() => {
    if (!activeItem) return;
    setNonce((n) => n + 1);
    setBenchTab('html');
    setCopiedCode(false);
    setMotionStageMode('html');
  }, [activeItem?.id]);

  const handleSelectPlate = (item: ExplorePlateItem) => {
    setActiveId(item.id);
    const bench = benchRef.current;
    if (bench) {
      const rect = bench.getBoundingClientRect();
      if (rect.top < 56 || rect.bottom > window.innerHeight) {
        bench.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest' });
      }
    }
  };

  const handleStep = (delta: 1 | -1) => {
    const next = flat[activeIndex + delta];
    if (next) setActiveId(next.id);
  };

  const handleAttach = (item: ExplorePlateItem) => {
    const title = sanitizeBrandText(item.title);
    if (activeProject.attachedItems.some((attached) => attached.id === item.id)) {
      addToast({ type: 'info', title: 'Đã đính kèm từ trước', message: title });
      return;
    }
    attachItemToWorkspace(templateContext(item));
  };

  const activeVaultKey = activeItem?.id.replace(/^(ms-|glacier\/)/, '') ?? '';
  const activeShard: VaultShardPayload | null =
    activeItem?.shard && activeItem.shard !== 'pinui'
      ? (getCachedVaultShard(activeItem.shard)?.[activeItem.id] ??
        getCachedVaultShard(activeItem.shard)?.[activeVaultKey] ??
        null)
      : null;

  const activePreview = activeItem ? previewFor(activeItem.id) : null;
  const activeTitle = activeItem ? sanitizeBrandText(activeItem.title) : '';
  const activeDesc = activeItem ? sanitizeBrandText(activeItem.description) : '';
  const vaultLib: VaultLibraryKey = activeItem?.vaultLibrary ?? 'codefronts';
  const activeLibLabel = VAULT_LIBRARY_LABELS[vaultLib];
  const isPinUI = vaultLib === 'pinui';
  const isThreeUI = vaultLib === 'threeui';
  const isMotion = vaultLib === 'motionsites';
  const isGlacier = vaultLib === 'glacier';

  const pinuiSource = useMemo(
    () => (activeItem && isPinUI ? resolvePinUISource(pinuiMap, activeItem.id) : null),
    [activeItem, isPinUI, pinuiMap]
  );

  const motionEntry = useMemo(
    () => (activeItem && isMotion ? resolveMotionSiteEntry(motionMap, activeItem.id) : null),
    [activeItem, isMotion, motionMap]
  );

  const activeHtml = useMemo(() => {
    if (!activeItem) return '';
    if (isPinUI) return pinuiSource?.tsx ?? '';
    if (activeShard?.h) return sanitizeSnippetCode(activeShard.h);
    if (isMotion && motionEntry?.liveHtml && motionEntry.liveHtml.length > (activeItem.previewHtml?.length ?? 0)) {
      return sanitizeSnippetCode(motionEntry.liveHtml);
    }
    return sanitizeSnippetCode(activeItem.previewHtml);
  }, [activeItem, isPinUI, isMotion, pinuiSource, activeShard, motionEntry]);

  const activeCss = useMemo(() => {
    if (!activeItem) return '';
    if (isPinUI) return pinuiSource?.css ?? '';
    if (activeShard?.c) return sanitizeSnippetCode(activeShard.c);
    if (isMotion && motionEntry?.css && !activeItem.previewCss) {
      return sanitizeSnippetCode(motionEntry.css);
    }
    return sanitizeSnippetCode(activeItem.previewCss);
  }, [activeItem, isPinUI, isMotion, pinuiSource, activeShard, motionEntry]);

  const activeJs = useMemo(() => {
    if (!activeItem || isPinUI) return '';
    if (activeShard?.j) return sanitizeSnippetCode(activeShard.j);
    if (isMotion && motionEntry?.code) return sanitizeSnippetCode(motionEntry.code);
    return '';
  }, [activeItem, isPinUI, isMotion, activeShard, motionEntry]);

  const activeScriptLabel = (activeShard?.cl || motionEntry?.codeLang || 'TSX').toUpperCase();

  const activeVideo =
    activeShard?.vid ||
    activeItem?.previewVideo ||
    (isMotion ? motionEntry?.previewVideo || '' : '');
  const activeImage =
    activeShard?.img ||
    activeItem?.previewImage ||
    (isMotion ? motionEntry?.previewImage || '' : '') ||
    (activePreview?.kind === 'image' ? activePreview.src : '');
  const activeOriginalUrl = activeItem
    ? resolveOriginalLiveUrl(
        vaultLib,
        activeItem.id,
        activeShard?.u || (isMotion ? motionEntry?.liveUrl : '') || activeItem.officialUrl
      )
    : '';

  const activePrompt = useMemo(() => {
    if (!activeItem) return '';
    if (isPinUI && pinuiSource?.prompt) return pinuiSource.prompt;
    if (activeShard?.p) return activeShard.p;
    if (isMotion && motionEntry?.promptText) return motionEntry.promptText;
    return (
      sanitizeBrandText(activeItem.promptSpec) ||
      `${activeTitle}\nNhóm: ${activeLibLabel}\nRuntime: ${activeItem.runtime}\nPhong cách: ${activeItem.style}\n\n${activeDesc}`
    );
  }, [activeItem, isPinUI, isMotion, pinuiSource, activeShard, motionEntry, activeTitle, activeLibLabel, activeDesc]);

  const snippetCssWithTheme = useMemo(() => {
    if (!activeItem || isPinUI) return '';
    const baseCss = activeShard?.c || (isMotion ? motionEntry?.css : '') || activeItem.previewCss || '';
    if (isThreeUI || isMotion || isGlacier) return baseCss;
    const extra = buildSnippetThemeOverrideCss(
      activeItem.sourceLibrary,
      baseCss,
      stageTheme
    );
    return extra ? `${extra}\n${baseCss}` : baseCss;
  }, [activeItem, isPinUI, isThreeUI, isMotion, isGlacier, activeShard, motionEntry, stageTheme]);

  const cycleViewport = () => {
    setViewport((prev) => (prev === 1440 ? 768 : prev === 768 ? 390 : 1440));
  };

  const fileBoxTabs: FileBoxTab[] = useMemo(() => {
    const list: FileBoxTab[] = [];
    if (activeHtml) {
      list.push({
        id: 'html',
        label: isPinUI ? 'TSX' : 'HTML',
        meta: isPinUI ? 'Thành phần React TSX' : 'Cấu trúc HTML',
      });
    }
    if (activeCss) {
      list.push({
        id: 'css',
        label: 'CSS',
        meta: 'Định dạng & Biến giao diện',
      });
    }
    if (activeJs) {
      list.push({
        id: 'code',
        label: activeScriptLabel,
        meta: `Mã nguồn ${activeScriptLabel}`,
      });
    }
    list.push({
      id: 'spec',
      label: 'Prompt',
      meta: 'Đặc tả kiến trúc & Prompt',
    });
    return list;
  }, [activeHtml, activeCss, activeJs, activeScriptLabel, isPinUI]);

  const resolvedBenchTab: BenchTab = useMemo(() => {
    if (fileBoxTabs.some((tab) => tab.id === benchTab)) return benchTab;
    return (fileBoxTabs[0]?.id as BenchTab | undefined) ?? 'spec';
  }, [fileBoxTabs, benchTab]);

  const shownCode =
    resolvedBenchTab === 'html'
      ? activeHtml || activePrompt
      : resolvedBenchTab === 'css'
        ? activeCss || activePrompt
        : resolvedBenchTab === 'code'
          ? activeJs || activePrompt
          : activePrompt;

  const handleCopyCode = async () => {
    if (!shownCode) return;
    const ok = await copyText(shownCode);
    if (ok) {
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    }
    addToast(
      ok
        ? { type: 'success', title: 'Đã chép mã', message: activeTitle }
        : { type: 'error', title: 'Không chép được', message: activeTitle }
    );
  };

  return (
    <>
      <div className="wrap-wide ex-controls">
        <div className="ex-filter" role="group" aria-label="Bộ lọc nhanh">
          {!onLibraryChange ? (
            <>
              <button
                type="button"
                className="ex-text"
                aria-pressed={library === 'all'}
                onClick={() => setLibrary('all')}
              >
                Tất cả
              </button>
              {VAULT_LIBRARY_ORDER.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="ex-text"
                  aria-pressed={library === name}
                  onClick={() => setLibrary(name)}
                >
                  {VAULT_LIBRARY_LABELS[name]}
                </button>
              ))}
            </>
          ) : null}
          <button
            type="button"
            className="ex-text"
            aria-pressed={savedOnly}
            onClick={onToggleSavedOnly}
          >
            Đã lưu ({savedPlateCount})
          </button>
        </div>
        {canDrift ? (
          <button
            type="button"
            className="ex-text"
            aria-pressed={!driftOn}
            onClick={() => setDriftOn((value) => !value)}
          >
            {driftOn ? 'Dừng trôi' : 'Cho trôi'}
          </button>
        ) : null}
      </div>

      {hasActiveFilter ? (
        <div className="wrap-wide ex-filter-summary" role="status">
          <div className="ex-filter-summary-copy">
            <span className="t-label">
              Khớp {formatCount(totalMatchedAcrossAll)} / {formatCount(unifiedPool.length)} mẫu
            </span>
            {topicChip ? (
              <span className="ex-badge ex-badge-info">
                Chủ đề: {TOPIC_LABEL[topicChip] ?? topicChip}
              </span>
            ) : null}
            {query ? <span className="ex-badge">Từ khóa: “{query}”</span> : null}
          </div>
          <div className="ex-filter-summary-actions">
            {onOpenVaultQuery && totalMatchedAcrossAll > 0 ? (
              <button
                type="button"
                className="ex-text ex-text-strong"
                onClick={() => onOpenVaultQuery(query || topicChip)}
              >
                Mở {formatCount(totalMatchedAcrossAll)} kết quả trong Trải nghiệm →
              </button>
            ) : null}
            <button
              type="button"
              className="ex-text"
              onClick={() => {
                onClearTopic?.();
                onClearQuery();
                if (savedOnly) onShowAll();
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      ) : null}

      {activeItem ? (
        <section ref={benchRef} className="wrap-wide ex-bench" aria-label="Sân khấu tương tác trực tiếp">
          <div className="ex-bench-stage-wrap">
            <div className="ex-bench-bar">
              <div className="ex-bench-id">
                <span className="t-label">{activeLibLabel}</span>
                <span className="t-label">
                  {String(activeIndex + 1).padStart(2, '0')} / {flat.length}
                </span>
                {activeHtml && activeVideo ? (
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
              <div className="ex-stage-controls">
                {activeOriginalUrl ? (
                  <a
                    href={activeOriginalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-line btn-sm ex-xp-origin-link"
                    title="Xem trang gốc của thư viện nguồn"
                  >
                    <span>Trang gốc</span>
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                ) : null}
                <button
                  type="button"
                  className="ex-stage-icon-btn"
                  aria-label={`Khung nhìn ${viewport}px — Bấm để đổi kích thước`}
                  title={`Khung nhìn ${viewport}px (1440 / 768 / 390)`}
                  onClick={cycleViewport}
                >
                  {viewport === 1440 ? (
                    <Monitor size={16} aria-hidden="true" />
                  ) : viewport === 768 ? (
                    <Tablet size={16} aria-hidden="true" />
                  ) : (
                    <Smartphone size={16} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  className="ex-stage-icon-btn"
                  aria-pressed={stageZoomed}
                  aria-label={stageZoomed ? 'Thu nhỏ sân khấu về 100%' : 'Phóng to sân khấu 115%'}
                  title={stageZoomed ? 'Thu nhỏ sân khấu (100%)' : 'Phóng to sân khấu (115%)'}
                  onClick={() => setStageZoomed((z) => !z)}
                >
                  {stageZoomed ? (
                    <ZoomOut size={16} aria-hidden="true" />
                  ) : (
                    <ZoomIn size={16} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  className="ex-stage-icon-btn"
                  aria-label={stageTheme === 'dark' ? 'Chuyển sân khấu sang nền sáng' : 'Chuyển sân khấu sang nền tối'}
                  title={stageTheme === 'dark' ? 'Nền tối — Bấm để đổi nền sáng' : 'Nền sáng — Bấm để đổi nền tối'}
                  onClick={() => setStageTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                >
                  {stageTheme === 'dark' ? (
                    <Moon size={16} aria-hidden="true" />
                  ) : (
                    <Sun size={16} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  className="ex-stage-icon-btn"
                  aria-label="Đặt lại sân khấu"
                  title="Đặt lại sân khấu chạy thử"
                  onClick={() => setNonce((n) => n + 1)}
                >
                  <RotateCw size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="ex-text"
                  onClick={() => setSheetOpen(true)}
                >
                  Xem nhanh
                </button>
                <button
                  type="button"
                  className="ex-text ex-text-strong"
                  onClick={() => openExperience(activeItem.id)}
                >
                  Trải nghiệm
                </button>
              </div>
            </div>

            <div
              className={`ex-bench-stage${stageTheme === 'light' ? ' ex-stage-paper' : ''}`}
              data-playground={isPinUI ? 'true' : 'false'}
              data-viewport={viewport}
            >
              <div
                className="ex-bench-stage-frame"
                data-viewport={viewport}
                data-zoomed={stageZoomed ? 'true' : 'false'}
              >
                {isPinUI ? (
                  <PinUIPlayground
                    key={`${activeItem.id}-${nonce}`}
                    itemId={activeItem.id}
                    theme={stageTheme}
                    compact
                  />
                ) : activeHtml && (motionStageMode === 'html' || !activeVideo) ? (
                  <SandboxPreview
                    title={activeTitle}
                    html={activeHtml}
                    css={snippetCssWithTheme}
                    js={activeShard?.j || undefined}
                    theme={stageTheme}
                    viewport={viewport}
                    nonce={nonce}
                  />
                ) : activeVideo ? (
                  <SpecimenMedia
                    key={`${activeItem.id}-vid`}
                    preview={{
                      kind: 'video',
                      src: activeVideo,
                      poster: activeImage || undefined,
                      credit: isGlacier ? 'getlayers.ai' : 'motionsites.ai',
                    }}
                    title={activeTitle}
                    fallbackLabel={activeLibLabel}
                    fit="contain"
                    activePlay
                  />
                ) : activeImage ? (
                  <SpecimenMedia
                    key={`${activeItem.id}-img`}
                    preview={{
                      kind: 'image',
                      src: activeImage,
                      credit: isThreeUI ? 'threeui.com' : isGlacier ? 'getlayers.ai' : 'motionsites.ai',
                    }}
                    title={activeTitle}
                    fallbackLabel={activeLibLabel}
                    fit="contain"
                  />
                ) : activePreview ? (
                  <SpecimenMedia
                    key={activeItem.id}
                    preview={activePreview}
                    title={activeTitle}
                    fallbackLabel={activeLibLabel}
                    fit="contain"
                    activePlay
                  />
                ) : (
                  <div className="ex-spec-type">
                    <span className="ex-spec-word">{activeTitle}</span>
                    <span className="t-label">{activeLibLabel}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="ex-bench-dossier">
            <div className="ex-bench-head">
              <span className="t-caps ex-bench-cat">{activeItem.category}</span>
              <h2 className="t-title ex-bench-title">{activeTitle}</h2>
              <p className="ex-bench-desc">{activeDesc}</p>
            </div>

            <dl className="ex-meta ex-meta-stack">
              <div>
                <dt>runtime</dt>
                <dd>{activeItem.runtime}</dd>
              </div>
              <div>
                <dt>phong cách</dt>
                <dd>{activeItem.style}</dd>
              </div>
            </dl>

            <div className="ex-spec-actions">
              <button
                type="button"
                className="btn btn-solid"
                onClick={() => openExperience(activeItem.id)}
              >
                Trải nghiệm
              </button>
              <button
                type="button"
                className="btn btn-line"
                onClick={() => openInWorkspace(templateContext(activeItem, activePrompt || undefined))}
              >
                Dùng ngay
              </button>
              <button
                type="button"
                className="btn btn-line"
                onClick={() => handleAttach(activeItem)}
              >
                Đính kèm
              </button>
              {activeOriginalUrl ? (
                <a
                  href={activeOriginalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-line ex-xp-origin-link"
                >
                  <span>Trang gốc</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
              <ReactionBar id={activeItem.id} title={activeTitle} showLabel />
              <button
                type="button"
                className="btn btn-ghost"
                aria-expanded={benchCodeOpen}
                onClick={() => setBenchCodeOpen((prev) => !prev)}
              >
                {benchCodeOpen ? 'Ẩn mã' : 'Xem mã'}
              </button>
            </div>

            {benchCodeOpen ? (
              <div className="ex-code-drawer">
                <div className="ex-source-editor">
                  <div className="ex-source-editor-head">
                    <div className="ex-source-tabs" role="tablist" aria-label="Tệp mã nguồn và Prompt">
                      {fileBoxTabs.map((tab) => {
                        const active = resolvedBenchTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className="ex-source-tab"
                            onClick={() => setBenchTab(tab.id as BenchTab)}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="ex-text"
                      onClick={() => void handleCopyCode()}
                    >
                      {copiedCode ? 'Đã chép' : 'Chép mã'}
                    </button>
                  </div>
                  <pre className="ex-code-pre">
                    <code>{shownCode}</code>
                  </pre>
                </div>
              </div>
            ) : null}

            <div className="ex-bench-step">
              <button
                type="button"
                className="ex-text"
                disabled={activeIndex <= 0}
                onClick={() => handleStep(-1)}
              >
                Trước
              </button>
              <button
                type="button"
                className="ex-text"
                disabled={activeIndex >= flat.length - 1}
                onClick={() => handleStep(1)}
              >
                Sau
              </button>
            </div>
          </aside>
        </section>
      ) : null}

      {shown.map((ribbon) => {
        const index = VAULT_LIBRARY_ORDER.indexOf(ribbon.name);
        const direction = index % 2 === 0 ? 1 : -1;
        const lit = ribbon.name === 'lucianlabs';
        const scene = lit ? (theme === 'dark' ? ' ex-lib-lit scene-paper' : ' ex-lib-lit scene-ink') : '';
        return (
          <section
            key={ribbon.name}
            className={`ex-lib${scene}`}
            aria-labelledby={`ex-lib-${ribbon.name}`}
          >
            <Reveal as="header" className="wrap-wide ex-lib-head">
              <h2 id={`ex-lib-${ribbon.name}`} className="t-mega ex-lib-name">
                {VAULT_LIBRARY_LABELS[ribbon.name]}
              </h2>
              <dl className="ex-meta">
                <div>
                  <dt>{hasActiveFilter ? 'khớp' : 'kho gốc'}</dt>
                  <dd>{formatCount(ribbon.totalMatches)}</dd>
                </div>
                {ribbon.totalMatches > ribbon.items.length ? (
                  <div>
                    <dt>trên bàn</dt>
                    <dd>
                      {ribbon.items.length} ·{' '}
                      <button
                        type="button"
                        className="ex-inline-link"
                        onClick={() => openExperience(ribbon.items[0]?.id ?? 'vault')}
                      >
                        xem tất cả →
                      </button>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </Reveal>
            <PlateRibbon
              label={VAULT_LIBRARY_LABELS[ribbon.name]}
              items={ribbon.items}
              savedIds={savedItemIds}
              activeId={activeItem?.id ?? null}
              direction={direction}
              startAtEnd={canDrift && direction === -1}
              drift={canDrift && driftOn && !sheetOpen}
              calm={calm}
              onSelect={handleSelectPlate}
              onExperience={(item) => openExperience(item.id)}
            />
          </section>
        );
      })}

      {shown.length === 0 ? (
        <div className="wrap-wide ex-empty">
          <p className="ex-empty-line">
            {savedOnly
              ? 'Chưa có mẫu nào được lưu.'
              : query || topicChip
                ? `Không có mẫu nào khớp bộ lọc hiện tại.`
                : 'Danh mục này chưa có mẫu trên bàn.'}
          </p>
          <button
            type="button"
            className="ex-text"
            onClick={() => {
              onClearTopic?.();
              onClearQuery();
              onShowAll();
              setLibrary('all');
            }}
          >
            Xem tất cả
          </button>
        </div>
      ) : null}

      <SpecimenSheet
        item={sheetItem}
        position={activeIndex + 1}
        total={flat.length}
        onClose={() => setSheetOpen(false)}
        onStep={handleStep}
        onExperience={(item) => openExperience(item.id)}
        onUse={(item) => openInWorkspace(templateContext(item))}
        onAttach={handleAttach}
      />
    </>
  );
};
