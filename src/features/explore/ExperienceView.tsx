import React, { useEffect, useMemo, useState } from 'react';
import {
  Monitor,
  Moon,
  RotateCw,
  Search,
  Smartphone,
  Sun,
  Tablet,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { SourceCatalogItem } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  Chips,
  FileBox,
  Magnify,
  PinUIPlayground,
  type ChipItem,
  type FileBoxTab,
} from '../../components/pinui';
import { previewFor } from '../../ui/Media';
import { SpecimenMedia } from './SpecimenMedia';
import {
  LIBRARY_LABEL,
  buildSnippetThemeOverrideCss,
  copyText,
  fetchMotionSitesFullMap,
  fetchPinUISourceMap,
  getCachedMotionSitesFullMap,
  getCachedPinUISourceMap,
  matchesQuery,
  resolveMotionSiteEntry,
  resolvePinUISource,
  sanitizeBrandText,
  sanitizeSnippetCode,
  shortTitle,
  templateContext,
  type MotionSiteFullEntry,
  type PinUISourceEntry,
  type PreviewTheme,
  type PreviewViewport,
} from './catalog';
import { SandboxPreview } from './SandboxPreview';
import './explore.css';

type CategoryTab = 'all' | 'pinui' | 'lucianlabs' | 'threeui' | 'motionsites' | 'codefronts' | 'saved';
type CodeTab = 'html' | 'css' | 'prompt';

const CATEGORY_TABS: Array<{ id: CategoryTab; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pinui', label: 'Tương tác' },
  { id: 'lucianlabs', label: 'Hiệu ứng' },
  { id: 'threeui', label: 'Không gian 3D' },
  { id: 'motionsites', label: 'Chuyển động' },
  { id: 'codefronts', label: 'Bố cục' },
  { id: 'saved', label: 'Đã lưu' },
];

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
  const [savedOnly, setSavedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewport, setViewport] = useState<PreviewViewport>(1440);
  const [stageZoomed, setStageZoomed] = useState(false);
  const [magnifyOpen, setMagnifyOpen] = useState(false);
  const [stageTheme, setStageTheme] = useState<PreviewTheme>(theme);
  const [nonce, setNonce] = useState(0);
  const [codeTab, setCodeTab] = useState<CodeTab>('html');
  const [copiedTarget, setCopiedTarget] = useState<'code' | 'prompt' | null>(null);

  const [pinuiMap, setPinuiMap] = useState<Record<string, PinUISourceEntry> | null>(
    () => getCachedPinUISourceMap()
  );
  const [motionMap, setMotionMap] = useState<Record<string, MotionSiteFullEntry> | null>(
    () => getCachedMotionSitesFullMap()
  );
  const [datasetsLoading, setDatasetsLoading] = useState(
    () => !getCachedPinUISourceMap() || !getCachedMotionSitesFullMap()
  );

  const query = search.trim().toLowerCase();

  useEffect(() => {
    setStageTheme(theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    if (pinuiMap && motionMap) {
      setDatasetsLoading(false);
      return;
    }
    setDatasetsLoading(true);
    Promise.all([fetchPinUISourceMap(), fetchMotionSitesFullMap()])
      .then(([loadedPinui, loadedMotion]) => {
        if (!active) return;
        setPinuiMap(loadedPinui);
        setMotionMap(loadedMotion);
        setDatasetsLoading(false);
      })
      .catch(() => {
        if (active) setDatasetsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pinuiMap, motionMap]);

  const savedCount = useMemo(
    () => sourceCatalog.filter((item) => savedItemIds.includes(item.id)).length,
    [sourceCatalog, savedItemIds]
  );

  const filteredItems = useMemo(() => {
    return sourceCatalog.filter((item) => {
      if ((savedOnly || category === 'saved') && !savedItemIds.includes(item.id)) return false;
      if (category !== 'all' && category !== 'saved' && item.sourceLibrary !== category) return false;
      return matchesQuery(query, [
        item.title,
        item.description,
        item.category,
        item.subcategory,
        item.runtime,
        item.style,
        LIBRARY_LABEL[item.sourceLibrary],
        ...item.tags,
      ]);
    });
  }, [sourceCatalog, savedOnly, category, savedItemIds, query]);

  const activeItem: SourceCatalogItem | null = useMemo(() => {
    if (experienceItemId) {
      const exact = sourceCatalog.find((item) => item.id === experienceItemId);
      if (exact) return exact;
    }
    return filteredItems[0] ?? sourceCatalog[0] ?? null;
  }, [experienceItemId, sourceCatalog, filteredItems]);

  const activeTitle = activeItem ? sanitizeBrandText(activeItem.title) : 'Thành phần';
  const activeDesc = activeItem ? sanitizeBrandText(activeItem.description) : '';
  const activeLiked = activeItem ? isItemLiked(activeItem.id) : false;
  const activeSaved = activeItem ? savedItemIds.includes(activeItem.id) : false;
  const activeHearts = activeItem ? getHeartCount(activeItem.id) : 10;

  const library = activeItem?.sourceLibrary;
  const isPinUI = library === 'pinui';
  const isThreeUI = library === 'threeui';
  const isMotion = library === 'motionsites';

  const pinuiSource = useMemo(
    () => (activeItem && isPinUI ? resolvePinUISource(pinuiMap, activeItem.id) : null),
    [activeItem, isPinUI, pinuiMap]
  );

  const motionEntry = useMemo(
    () => (activeItem && isMotion ? resolveMotionSiteEntry(motionMap, activeItem.id) : null),
    [activeItem, isMotion, motionMap]
  );

  const activePreview = activeItem ? previewFor(activeItem.id) : null;
  const activeOriginalImage = activeItem?.previewImage || (motionEntry as { previewImage?: string } | null)?.previewImage || '';
  const activeOriginalUrl = activeItem?.officialUrl || (motionEntry as { sourceUrl?: string } | null)?.sourceUrl || '';

  const activeHtml = useMemo(() => {
    if (!activeItem) return '';
    if (isPinUI) return pinuiSource?.tsx ?? '';
    if (isThreeUI || isMotion) return '';
    return sanitizeSnippetCode(activeItem.previewHtml);
  }, [activeItem, isPinUI, isThreeUI, isMotion, pinuiSource]);

  const activeCss = useMemo(() => {
    if (!activeItem) return '';
    if (isPinUI) return pinuiSource?.css ?? '';
    if (isThreeUI || isMotion) return '';
    return sanitizeSnippetCode(activeItem.previewCss);
  }, [activeItem, isPinUI, isThreeUI, isMotion, pinuiSource]);

  const activePrompt = useMemo(() => {
    if (!activeItem) return '';
    if (isPinUI && pinuiSource?.prompt) return pinuiSource.prompt;
    if (isMotion && motionEntry?.promptText) return motionEntry.promptText;
    return (
      sanitizeBrandText(activeItem.promptSpec) ||
      `${activeTitle}\nNhóm: ${LIBRARY_LABEL[activeItem.sourceLibrary]}\nRuntime: ${activeItem.runtime}\nPhong cách: ${activeItem.style}\nTừ khóa: ${activeItem.tags.join(', ')}\n\n${activeDesc}`
    );
  }, [activeItem, isPinUI, isMotion, pinuiSource, motionEntry, activeTitle, activeDesc]);

  const snippetCssWithTheme = useMemo(() => {
    if (!activeItem || isPinUI || isThreeUI || isMotion) return '';
    const extra = buildSnippetThemeOverrideCss(
      activeItem.sourceLibrary,
      activeItem.previewCss,
      stageTheme
    );
    return extra ? `${extra}\n${activeItem.previewCss ?? ''}` : activeItem.previewCss ?? '';
  }, [activeItem, isPinUI, isThreeUI, isMotion, stageTheme]);

  useEffect(() => {
    if (!activeItem) return;
    setNonce((n) => n + 1);
    setCodeTab('html');
    setCopiedTarget(null);
  }, [activeItem?.id]);

  const activeCode =
    codeTab === 'html' ? activeHtml : codeTab === 'css' ? activeCss : activePrompt;

  const handleSelectItem = (item: SourceCatalogItem) => {
    openExperience(item.id);
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
    if (!activeItem) return;
    if (activeProject.attachedItems.some((entry) => entry.id === activeItem.id)) {
      addToast({ type: 'info', title: 'Đã đính kèm từ trước', message: activeTitle });
      return;
    }
    attachItemToWorkspace(templateContext(activeItem, activePrompt || undefined));
  };

  const copyCodeContent =
    codeTab === 'css' ? activeCss || activeHtml : activeHtml || activeCss;

  const categoryChipItems: ChipItem[] = useMemo(
    () =>
      CATEGORY_TABS.map((tab) => ({
        id: tab.id,
        label: tab.id === 'saved' ? `Đã lưu (${savedCount})` : tab.label,
      })),
    [savedCount]
  );

  const fileBoxTabs: FileBoxTab[] = useMemo(
    () => [
      {
        id: 'html',
        label: 'TSX / HTML',
        meta: isPinUI ? 'Thành phần React TSX' : 'Mã cấu trúc HTML',
      },
      {
        id: 'css',
        label: 'CSS',
        meta: 'Định dạng & Biến giao diện',
      },
      {
        id: 'prompt',
        label: 'Prompt',
        meta: 'Đặc tả Prompt nguyên bản',
      },
    ],
    [isPinUI]
  );

  const cycleViewport = () => {
    setViewport((prev) => (prev === 1440 ? 768 : prev === 768 ? 390 : 1440));
  };

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
              {drawerOpen ? 'Đóng danh mục' : `Danh mục (${filteredItems.length})`}
            </button>
            {activeItem ? (
              <nav className="ex-xp-crumb" aria-label="Đường dẫn thành phần">
                <span className="t-label">{LIBRARY_LABEL[activeItem.sourceLibrary]}</span>
                <span className="ex-xp-crumb-sep" aria-hidden="true">
                  /
                </span>
                <strong className="ex-xp-crumb-title">{activeTitle}</strong>
              </nav>
            ) : null}
          </div>

          <div className="ex-xp-actions">
            <div className="ex-xp-search">
              <label htmlFor="ex-xp-search-input" className="sr-only">
                Tìm thành phần
              </label>
              <input
                id="ex-xp-search-input"
                type="search"
                className="ex-xp-search-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm mẫu thành phần..."
                autoComplete="off"
                spellCheck={false}
              />
              {search ? (
                <button type="button" className="ex-text" onClick={() => setSearch('')}>
                  Xóa
                </button>
              ) : null}
            </div>

            <button
              type="button"
              className="ex-pill"
              aria-pressed={savedOnly || category === 'saved'}
              onClick={() => setSavedOnly((prev) => !prev)}
            >
              <span className="ex-mark-dot" aria-hidden="true" />
              <span>Đã lưu ({savedCount})</span>
            </button>

            {activeItem ? (
              <>
                <button
                  type="button"
                  className="ex-react-btn"
                  aria-pressed={activeSaved}
                  onClick={() => toggleSavedItem(activeItem.id)}
                >
                  <span className="ex-mark-dot" aria-hidden="true" />
                  <span>{activeSaved ? 'Đã lưu' : 'Lưu'}</span>
                </button>

                <button
                  type="button"
                  className="ex-react-btn"
                  aria-pressed={activeLiked}
                  onClick={() => toggleLikedItem(activeItem.id)}
                >
                  <span className="ex-heart-dot" aria-hidden="true" />
                  <span className="ex-react-num">{activeHearts}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() =>
                    openInWorkspace(templateContext(activeItem, activePrompt || undefined))
                  }
                >
                  Mở Workspace
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="wrap-wide ex-xp-workbench">
        <aside
          className="ex-xp-sidebar"
          data-open={drawerOpen ? 'true' : 'false'}
          aria-label="Danh sách thành phần"
        >
          <Chips
            items={categoryChipItems}
            selectedIds={[category]}
            onToggle={(id) => {
              const nextCat = id as CategoryTab;
              setCategory(nextCat);
              if (nextCat === 'saved') setSavedOnly(false);
            }}
            multi={false}
            variant="filter"
            theme={theme}
            className="ex-xp-cat-chips"
          />

          <div className="ex-xp-list-meta">
            <span className="t-label">{filteredItems.length} mẫu hiển thị</span>
            {search || savedOnly || category !== 'all' ? (
              <button
                type="button"
                className="ex-text"
                onClick={() => {
                  setSearch('');
                  setSavedOnly(false);
                  setCategory('all');
                }}
              >
                Đặt lại
              </button>
            ) : null}
          </div>

          {filteredItems.length > 0 ? (
            <ul className="ex-xp-list">
              {filteredItems.map((item) => {
                const selected = activeItem?.id === item.id;
                const saved = savedItemIds.includes(item.id);
                const liked = isItemLiked(item.id);
                const hearts = getHeartCount(item.id);
                const itemTitle = shortTitle(item);
                return (
                  <li
                    key={item.id}
                    className="ex-xp-item-row"
                    data-active={selected ? 'true' : undefined}
                  >
                    <button
                      type="button"
                      className="ex-xp-item-btn"
                      aria-current={selected ? 'true' : undefined}
                      onClick={() => handleSelectItem(item)}
                    >
                      <span className="ex-xp-item-top">
                        <span className="t-label">{LIBRARY_LABEL[item.sourceLibrary]}</span>
                        <span className="t-label ex-plate-live">live</span>
                      </span>
                      <span className="ex-xp-item-title">{itemTitle}</span>
                      <span className="t-note">{item.category}</span>
                    </button>
                    <div className="ex-xp-item-react">
                      <button
                        type="button"
                        className="ex-react-btn"
                        aria-pressed={liked}
                        aria-label={`${liked ? 'Bỏ tim' : 'Thả tim'} ${itemTitle}`}
                        onClick={() => toggleLikedItem(item.id)}
                      >
                        <span className="ex-heart-dot" aria-hidden="true" />
                        <span className="ex-react-num">{hearts}</span>
                      </button>
                      <button
                        type="button"
                        className="ex-react-btn"
                        aria-pressed={saved}
                        aria-label={`${saved ? 'Bỏ lưu' : 'Lưu'} ${itemTitle}`}
                        onClick={() => toggleSavedItem(item.id)}
                      >
                        <span className="ex-mark-dot" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="ex-xp-empty">
              <p className="t-note">Không có thành phần khớp bộ lọc hiện tại.</p>
            </div>
          )}
        </aside>

        <div className="ex-xp-main">
          <section className="ex-xp-center" aria-label="Sân khấu trải nghiệm">
            <div className="ex-xp-toolbar">
              <div className="ex-xp-tool-meta">
                <span className="t-label">
                  {viewport}px · {stageZoomed ? '115%' : '100%'} · {stageTheme === 'dark' ? 'Mực' : 'Giấy'}
                </span>
              </div>

              <div className="ex-stage-controls" role="group" aria-label="Điều khiển sân khấu">
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
                  className="ex-stage-icon-btn"
                  aria-pressed={magnifyOpen}
                  aria-label={magnifyOpen ? 'Tắt kính lúp soi chi tiết' : 'Bật kính lúp soi chi tiết'}
                  title={magnifyOpen ? 'Tắt kính lúp soi chi tiết' : 'Bật kính lúp PinUI Magnify'}
                  onClick={() => setMagnifyOpen((m) => !m)}
                >
                  <Search size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            {magnifyOpen && activeItem ? (
              <div className="ex-xp-magnify-drawer" aria-label="Kính lúp soi chi tiết chữ và cấu trúc">
                <Magnify
                  glyph={activeTitle.charAt(0).toUpperCase() || 'F'}
                  microText={`${activeTitle.toUpperCase()} · ${activeItem.runtime.toUpperCase()} · ${activeItem.style.toUpperCase()} · `}
                  hintText={`Di chuyển để soi chi tiết ${activeTitle} · Bấm để phóng đại`}
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
              {activeItem ? (
                <div
                  className="ex-xp-stage-frame"
                  data-viewport={viewport}
                  data-zoomed={stageZoomed ? 'true' : 'false'}
                  data-playground={isPinUI ? 'true' : 'false'}
                >
                  {isPinUI ? (
                    <PinUIPlayground
                      key={`${activeItem.id}-${nonce}`}
                      itemId={activeItem.id}
                      theme={stageTheme}
                    />
                  ) : isThreeUI || isMotion ? (
                    activePreview ? (
                      <SpecimenMedia
                        key={activeItem.id}
                        preview={activePreview}
                        title={activeTitle}
                        fallbackLabel={LIBRARY_LABEL[activeItem.sourceLibrary]}
                        fit="contain"
                        activePlay
                      />
                    ) : activeOriginalImage ? (
                      <div className="ex-xp-original-media">
                        <img
                          src={activeOriginalImage}
                          alt={activeTitle}
                          loading="eager"
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />
                      </div>
                    ) : (
                      <div className="ex-spec-type">
                        <span className="ex-spec-word">{activeTitle}</span>
                        <span className="t-label">
                          {isThreeUI ? 'ThreeUI Pro MCP · Xem trực tiếp tại trang gốc' : 'MotionSites Prompt · Xem tại trang gốc'}
                        </span>
                        {activeOriginalUrl ? (
                          <a
                            href={activeOriginalUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="btn btn-line btn-sm"
                          >
                            Mở trang gốc
                          </a>
                        ) : null}
                      </div>
                    )
                  ) : (
                    <SandboxPreview
                      title={activeTitle}
                      html={activeItem.previewHtml ?? ''}
                      css={snippetCssWithTheme}
                      theme={stageTheme}
                      viewport={viewport}
                      nonce={nonce}
                    />
                  )}
                </div>
              ) : null}
            </div>

            {activeItem ? (
              <div className="ex-xp-summary">
                <div className="ex-xp-summary-main">
                  <span className="t-label">
                    {LIBRARY_LABEL[activeItem.sourceLibrary]} · {activeItem.category}
                  </span>
                  <h1 className="t-title ex-xp-title">{activeTitle}</h1>
                  <p className="ex-bench-desc">{activeDesc}</p>
                </div>
                <dl className="ex-meta">
                  <div>
                    <dt>runtime</dt>
                    <dd>{activeItem.runtime}</dd>
                  </div>
                  <div>
                    <dt>phong cách</dt>
                    <dd>{activeItem.style}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </section>

          <section className="ex-xp-card ex-xp-source-drawer" aria-label="Mã nguồn và Prompt nguyên bản">
            <div className="ex-code-filebox-wrap">
              <FileBox
                title="Tệp mã nguồn & Prompt"
                tabs={fileBoxTabs}
                activeId={codeTab}
                onSelect={(nextId) => setCodeTab(nextId as CodeTab)}
                className="ex-pinui-filebox"
              />
              <div className="ex-code-tabs">
                <span className="t-label">
                  {codeTab === 'html' ? 'TSX / HTML' : codeTab === 'css' ? 'CSS' : 'Prompt'}
                </span>
                <div className="ex-xp-copy-bar">
                  <button
                    type="button"
                    className="ex-text"
                    disabled={!copyCodeContent}
                    onClick={() => void handleCopy(copyCodeContent, 'code', 'Đã chép mã')}
                  >
                    {copiedTarget === 'code' ? 'Đã chép' : 'Chép mã'}
                  </button>
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
            </div>

            <pre className="ex-code-pre ex-xp-pre">
              <code>
                {activeCode ||
                  (datasetsLoading && (isPinUI || isMotion)
                    ? 'Đang tải mã nguồn nguyên bản...'
                    : 'Không có dữ liệu cho ngăn này.')}
              </code>
            </pre>

            {activeItem ? (
              <div className="ex-xp-card-foot">
                {activeOriginalUrl ? (
                  <a
                    href={activeOriginalUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-line"
                  >
                    Trang gốc
                  </a>
                ) : null}
                <button type="button" className="btn btn-line" onClick={handleAttach}>
                  Đính kèm vào dự án
                </button>
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() =>
                    openInWorkspace(templateContext(activeItem, activePrompt || undefined))
                  }
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
