import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Monitor, Moon, RotateCw, Smartphone, Sun, Tablet, ZoomIn, ZoomOut } from 'lucide-react';
import type { SourceCatalogItem, SourceLibraryName } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { PinUIPlayground, type FileBoxTab } from '../../components/pinui';
import { previewFor } from '../../ui/Media';
import { Reveal } from '../../ui/Reveal';
import {
  LIBRARY_LABEL,
  LIBRARY_ORDER,
  buildSnippetThemeOverrideCss,
  copyText,
  fetchMotionSitesFullMap,
  fetchPinUISourceMap,
  formatCount,
  getCachedMotionSitesFullMap,
  getCachedPinUISourceMap,
  matchesQuery,
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
import { PlateRibbon } from './PlateRibbon';
import { SandboxPreview } from './SandboxPreview';
import { SpecimenMedia } from './SpecimenMedia';
import { ReactionBar, SpecimenSheet } from './SpecimenSheet';
import { useCalm } from './useCalm';

export type LibraryFilter = 'all' | SourceLibraryName;
type BenchTab = 'html' | 'css' | 'code' | 'spec';

interface PlateTableProps {
  query: string;
  onClearQuery: () => void;
  savedOnly: boolean;
  onShowAll: () => void;
  onToggleSavedOnly: () => void;
  library?: LibraryFilter;
  onLibraryChange?: (library: LibraryFilter) => void;
}

export const PlateTable: React.FC<PlateTableProps> = ({
  query,
  onClearQuery,
  savedOnly,
  onShowAll,
  onToggleSavedOnly,
  library: controlledLibrary,
  onLibraryChange,
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

  const savedPlateCount = useMemo(
    () => sourceCatalog.filter((item) => savedItemIds.includes(item.id)).length,
    [sourceCatalog, savedItemIds]
  );

  const ribbons = useMemo(
    () =>
      LIBRARY_ORDER.map((name) => {
        const all = sourceCatalog.filter((item) => item.sourceLibrary === name);
        const items = all.filter(
          (item) =>
            (!savedOnly || savedItemIds.includes(item.id)) &&
            matchesQuery(query, [
              item.title,
              item.description,
              item.category,
              item.subcategory,
              item.runtime,
              item.style,
              LIBRARY_LABEL[item.sourceLibrary],
              ...item.tags,
            ])
        );
        return { name, all, items };
      }),
    [sourceCatalog, query, savedOnly, savedItemIds]
  );

  const shown = ribbons.filter(
    (ribbon) => (library === 'all' || ribbon.name === library) && ribbon.items.length > 0
  );
  const flat = shown.flatMap((ribbon) => ribbon.items);

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
    if (activeItem.sourceLibrary === 'pinui' && !pinuiMap) {
      void fetchPinUISourceMap().then((loaded) => setPinuiMap(loaded));
    }
    if (activeItem.sourceLibrary === 'motionsites' && !motionMap) {
      void fetchMotionSitesFullMap().then((loaded) => setMotionMap(loaded));
    }
  }, [activeItem?.id, activeItem?.sourceLibrary, pinuiMap, motionMap]);

  useEffect(() => {
    if (!activeItem) return;
    setNonce((n) => n + 1);
    setBenchTab('html');
    setCopiedCode(false);
  }, [activeItem?.id]);

  const handleSelectPlate = (item: SourceCatalogItem) => {
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

  const handleAttach = (item: SourceCatalogItem) => {
    const title = sanitizeBrandText(item.title);
    if (activeProject.attachedItems.some((attached) => attached.id === item.id)) {
      addToast({ type: 'info', title: 'Đã đính kèm từ trước', message: title });
      return;
    }
    attachItemToWorkspace(templateContext(item));
  };

  const activePreview = activeItem ? previewFor(activeItem.id) : null;
  const activeTitle = activeItem ? sanitizeBrandText(activeItem.title) : '';
  const activeDesc = activeItem ? sanitizeBrandText(activeItem.description) : '';
  const isPinUI = activeItem?.sourceLibrary === 'pinui';
  const isThreeUI = activeItem?.sourceLibrary === 'threeui';
  const isMotion = activeItem?.sourceLibrary === 'motionsites';

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
    if (isMotion && motionEntry?.liveHtml && motionEntry.liveHtml.length > (activeItem.previewHtml?.length ?? 0)) {
      return sanitizeSnippetCode(motionEntry.liveHtml);
    }
    return sanitizeSnippetCode(activeItem.previewHtml);
  }, [activeItem, isPinUI, isMotion, pinuiSource, motionEntry]);

  const activeCss = useMemo(() => {
    if (!activeItem) return '';
    if (isPinUI) return pinuiSource?.css ?? '';
    if (isMotion && motionEntry?.css && !activeItem.previewCss) {
      return sanitizeSnippetCode(motionEntry.css);
    }
    return sanitizeSnippetCode(activeItem.previewCss);
  }, [activeItem, isPinUI, isMotion, pinuiSource, motionEntry]);

  const activeScriptCode = useMemo(() => {
    if (!activeItem || !isMotion) return '';
    return motionEntry?.code ? sanitizeSnippetCode(motionEntry.code) : '';
  }, [activeItem, isMotion, motionEntry]);

  const activeScriptLabel = (motionEntry?.codeLang || 'TSX').toUpperCase();

  const activePrompt = useMemo(() => {
    if (!activeItem) return '';
    if (isPinUI && pinuiSource?.prompt) return pinuiSource.prompt;
    if (isMotion && motionEntry?.promptText) return motionEntry.promptText;
    return (
      sanitizeBrandText(activeItem.promptSpec) ||
      `${activeTitle}\nNhóm: ${LIBRARY_LABEL[activeItem.sourceLibrary]}\nRuntime: ${activeItem.runtime}\nPhong cách: ${activeItem.style}\n\n${activeDesc}`
    );
  }, [activeItem, isPinUI, isMotion, pinuiSource, motionEntry, activeTitle, activeDesc]);

  const snippetCssWithTheme = useMemo(() => {
    if (!activeItem || isPinUI) return '';
    if (isThreeUI || isMotion) return activeItem.previewCss ?? '';
    const extra = buildSnippetThemeOverrideCss(
      activeItem.sourceLibrary,
      activeItem.previewCss,
      stageTheme
    );
    return extra ? `${extra}\n${activeItem.previewCss ?? ''}` : activeItem.previewCss ?? '';
  }, [activeItem, isPinUI, isThreeUI, isMotion, stageTheme]);

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
    if (activeScriptCode) {
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
  }, [activeHtml, activeCss, activeScriptCode, activeScriptLabel, isPinUI]);

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
          ? activeScriptCode || activePrompt
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
              {LIBRARY_ORDER.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="ex-text"
                  aria-pressed={library === name}
                  onClick={() => setLibrary(name)}
                >
                  {LIBRARY_LABEL[name]}
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

      <p className="sr-only" role="status">
        {query ? `${flat.length} mẫu khớp` : ''}
      </p>

      {activeItem ? (
        <section ref={benchRef} className="wrap-wide ex-bench" aria-label="Sân khấu tương tác trực tiếp">
          <div className="ex-bench-stage-wrap">
            <div className="ex-bench-bar">
              <div className="ex-bench-id">
                <span className="t-label">{LIBRARY_LABEL[activeItem.sourceLibrary]}</span>
                <span className="t-label">
                  {String(activeIndex + 1).padStart(2, '0')} / {flat.length}
                </span>
              </div>
              <div className="ex-stage-controls">
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
                ) : activeHtml ? (
                  <SandboxPreview
                    title={activeTitle}
                    html={activeHtml}
                    css={snippetCssWithTheme}
                    theme={stageTheme}
                    viewport={viewport}
                    nonce={nonce}
                  />
                ) : activePreview ? (
                  <SpecimenMedia
                    key={activeItem.id}
                    preview={activePreview}
                    title={activeTitle}
                    fallbackLabel={LIBRARY_LABEL[activeItem.sourceLibrary]}
                    fit="contain"
                    activePlay
                  />
                ) : activeItem.previewImage ? (
                  <img
                    src={activeItem.previewImage}
                    alt={activeTitle}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <div className="ex-spec-type">
                    <span className="ex-spec-word">{activeTitle}</span>
                    <span className="t-label">{LIBRARY_LABEL[activeItem.sourceLibrary]}</span>
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
        const index = LIBRARY_ORDER.indexOf(ribbon.name);
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
                {LIBRARY_LABEL[ribbon.name]}
              </h2>
              <dl className="ex-meta">
                <div>
                  <dt>{query ? 'khớp' : 'trên bàn'}</dt>
                  <dd>{formatCount(ribbon.items.length)}</dd>
                </div>
              </dl>
            </Reveal>
            <PlateRibbon
              label={LIBRARY_LABEL[ribbon.name]}
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
              : query
                ? `Không có mẫu nào khớp “${query}”.`
                : 'Danh mục này chưa có mẫu trên bàn.'}
          </p>
          <button
            type="button"
            className="ex-text"
            onClick={() => {
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
