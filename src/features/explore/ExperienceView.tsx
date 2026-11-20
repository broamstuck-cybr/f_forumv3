import React, { useEffect, useMemo, useState } from 'react';
import type { SourceCatalogItem } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { previewFor } from '../../ui/Media';
import {
  LIBRARY_LABEL,
  copyText,
  matchesQuery,
  sanitizeBrandText,
  sanitizeSnippetCode,
  shortTitle,
  templateContext,
  whiteLabelArchivePath,
  type PreviewTheme,
  type PreviewViewport,
} from './catalog';
import { SandboxPreview } from './SandboxPreview';
import { SpecimenMedia } from './SpecimenMedia';
import './explore.css';

type CategoryTab = 'all' | 'pinui' | 'lucianlabs' | 'threeui' | 'motionsites' | 'codefronts' | 'saved';
type BackdropMode = 'plain' | 'grid' | 'dots';
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

const VIEWPORTS: PreviewViewport[] = [1440, 768, 390];
const ACCENTS = [
  { id: '#d83823', label: 'Đỏ son' },
  { id: '#1d56d8', label: 'Lam điện' },
  { id: '#188856', label: 'Ngọc lục' },
  { id: '#c87a12', label: 'Hổ phách' },
  { id: '#8a3bd8', label: 'Tím thạch' },
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
  const [stageTheme, setStageTheme] = useState<PreviewTheme>(theme);
  const [backdrop, setBackdrop] = useState<BackdropMode>('grid');
  const [scale, setScale] = useState(100);
  const [padding, setPadding] = useState(24);
  const [radius, setRadius] = useState(14);
  const [speed, setSpeed] = useState(1);
  const [accent, setAccent] = useState(ACCENTS[0].id);
  const [nonce, setNonce] = useState(0);
  const [codeTab, setCodeTab] = useState<CodeTab>('html');

  const query = search.trim().toLowerCase();

  useEffect(() => {
    setStageTheme(theme);
  }, [theme]);

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

  const activeHasCode = Boolean(activeItem?.previewHtml);
  const activeHtml = activeItem ? sanitizeSnippetCode(activeItem.previewHtml) : '';
  const activeCss = activeItem ? sanitizeSnippetCode(activeItem.previewCss) : '';

  useEffect(() => {
    if (!activeItem) return;
    setNonce((n) => n + 1);
    setCodeTab(activeItem.previewHtml ? 'html' : activeItem.previewCss ? 'css' : 'prompt');
  }, [activeItem?.id]);

  const activePreview = activeItem ? previewFor(activeItem.id) : null;
  const activeTitle = activeItem ? sanitizeBrandText(activeItem.title) : 'Thành phần';
  const activeDesc = activeItem ? sanitizeBrandText(activeItem.description) : '';
  const activeLiked = activeItem ? isItemLiked(activeItem.id) : false;
  const activeSaved = activeItem ? savedItemIds.includes(activeItem.id) : false;
  const activeHearts = activeItem ? getHeartCount(activeItem.id) : 10;

  const activePrompt = activeItem
    ? sanitizeBrandText(activeItem.promptSpec) ||
      `${activeTitle}\nNhóm: ${LIBRARY_LABEL[activeItem.sourceLibrary]}\nRuntime: ${activeItem.runtime}\nPhong cách: ${activeItem.style}\nTỉ lệ: ${scale}% · Đệm: ${padding}px · Bo góc: ${radius}px · Điểm nhấn: ${accent}\n\n${activeDesc}`
    : '';

  const customVariablesBlock = `:root {\n  --ff-scale: ${(scale / 100).toFixed(2)};\n  --ff-pad: ${padding}px;\n  --ff-radius: ${radius}px;\n  --ff-accent: ${accent};\n  --ff-speed: ${speed};\n}`;

  const customizedLiveCss = useMemo(() => {
    if (!activeHasCode) return activeCss;
    const scaleRatio = (scale / 100).toFixed(2);
    const speedRule =
      speed !== 1
        ? `*,*::before,*::after{animation-duration:calc(1.2s / ${speed})!important;transition-duration:calc(280ms / ${speed})!important}`
        : '';
    return `${customVariablesBlock}\nbody{padding:${padding}px!important}\nbody>*{transform:scale(${scaleRatio});transform-origin:center;--accent:${accent};--primary:${accent};border-radius:${radius}px}\n${speedRule}\n${activeCss}`;
  }, [activeHasCode, activeCss, customVariablesBlock, scale, padding, radius, accent, speed]);

  const displayCss = activeCss ? `${customVariablesBlock}\n\n${activeCss}` : '';
  const activeCode = codeTab === 'html' ? activeHtml : codeTab === 'css' ? displayCss : activePrompt;

  const handleSelectItem = (item: SourceCatalogItem) => {
    openExperience(item.id);
    setDrawerOpen(false);
  };

  const handleResetTune = () => {
    setScale(100);
    setPadding(24);
    setRadius(14);
    setSpeed(1);
    setAccent(ACCENTS[0].id);
    setNonce((n) => n + 1);
  };

  const handleCopy = async (content: string, label: string) => {
    if (!content) return;
    const ok = await copyText(content);
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
    attachItemToWorkspace(templateContext(activeItem));
  };

  return (
    <div className="ex-xp">
      <header className="ex-xp-topbar">
        <div className="wrap-wide ex-xp-topbar-inner">
          <div className="ex-xp-lead">
            <button type="button" className="btn btn-line ex-xp-back" onClick={() => navigate('explore')}>
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
                  onClick={() => openInWorkspace(templateContext(activeItem))}
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
          <div className="ex-xp-cat-tabs" role="tablist" aria-label="Nhóm thành phần">
            {CATEGORY_TABS.map((tab) => {
              const selected = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className="ex-pill"
                  aria-pressed={selected}
                  onClick={() => {
                    setCategory(tab.id);
                    if (tab.id === 'saved') setSavedOnly(false);
                  }}
                >
                  {tab.id === 'saved' ? `Đã lưu (${savedCount})` : tab.label}
                </button>
              );
            })}
          </div>

          <div className="ex-xp-list-meta">
            <span className="t-label">{filteredItems.length} mẫu hiển thị</span>
            {(search || savedOnly || category !== 'all') ? (
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
                const hasCode = Boolean(item.previewHtml);
                return (
                  <li key={item.id} className="ex-xp-item-row" data-active={selected ? 'true' : undefined}>
                    <button
                      type="button"
                      className="ex-xp-item-btn"
                      aria-current={selected ? 'true' : undefined}
                      onClick={() => handleSelectItem(item)}
                    >
                      <span className="ex-xp-item-top">
                        <span className="t-label">{LIBRARY_LABEL[item.sourceLibrary]}</span>
                        {hasCode ? <span className="t-label ex-plate-live">live</span> : null}
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

        <section className="ex-xp-center" aria-label="Sân khấu trải nghiệm">
          <div className="ex-xp-toolbar">
            <div className="ex-xp-tool-group" role="group" aria-label="Khung nhìn">
              {VIEWPORTS.map((vp) => (
                <button
                  key={vp}
                  type="button"
                  className="ex-text"
                  aria-pressed={viewport === vp}
                  onClick={() => setViewport(vp)}
                >
                  {vp}px
                </button>
              ))}
            </div>

            <div className="ex-xp-tool-group" role="group" aria-label="Bề mặt sáng tối">
              <button
                type="button"
                className="ex-text"
                aria-pressed={stageTheme === 'light'}
                onClick={() => setStageTheme('light')}
              >
                Sáng
              </button>
              <button
                type="button"
                className="ex-text"
                aria-pressed={stageTheme === 'dark'}
                onClick={() => setStageTheme('dark')}
              >
                Tối
              </button>
            </div>

            <div className="ex-xp-tool-group" role="group" aria-label="Phông nền sân khấu">
              <button
                type="button"
                className="ex-text"
                aria-pressed={backdrop === 'plain'}
                onClick={() => setBackdrop('plain')}
              >
                Trơn
              </button>
              <button
                type="button"
                className="ex-text"
                aria-pressed={backdrop === 'grid'}
                onClick={() => setBackdrop('grid')}
              >
                Lưới
              </button>
              <button
                type="button"
                className="ex-text"
                aria-pressed={backdrop === 'dots'}
                onClick={() => setBackdrop('dots')}
              >
                Chấm
              </button>
            </div>

            <div className="ex-xp-tool-group" role="group" aria-label="Tỉ lệ và đệm nhanh">
              <button
                type="button"
                className="ex-text"
                aria-pressed={scale === 90}
                onClick={() => setScale(90)}
              >
                90%
              </button>
              <button
                type="button"
                className="ex-text"
                aria-pressed={scale === 100}
                onClick={() => setScale(100)}
              >
                100%
              </button>
              <button
                type="button"
                className="ex-text"
                aria-pressed={scale === 115}
                onClick={() => setScale(115)}
              >
                115%
              </button>
              <button
                type="button"
                className="ex-text"
                aria-pressed={padding === 16}
                onClick={() => setPadding(padding === 16 ? 32 : 16)}
              >
                Đệm {padding}px
              </button>
              <button
                type="button"
                className="ex-text"
                onClick={() => setNonce((n) => n + 1)}
              >
                Chạy lại
              </button>
            </div>
          </div>

          <div
            className="ex-xp-stage"
            data-theme={stageTheme}
            data-backdrop={backdrop}
          >
            {activeItem ? (
              <div
                className="ex-xp-stage-frame"
                style={
                  {
                    '--xp-vp': `${viewport}px`,
                    '--xp-pad': `${padding}px`,
                    '--xp-radius': `${radius}px`,
                    '--xp-scale': (scale / 100).toFixed(2),
                  } as React.CSSProperties
                }
              >
                {activeHasCode ? (
                  <SandboxPreview
                    title={activeTitle}
                    html={activeItem.previewHtml ?? ''}
                    css={customizedLiveCss}
                    theme={stageTheme}
                    viewport={viewport}
                    nonce={nonce}
                  />
                ) : activePreview ? (
                  <div className="ex-xp-media-box">
                    <SpecimenMedia
                      key={`${activeItem.id}-${nonce}`}
                      preview={activePreview}
                      title={activeTitle}
                      fallbackLabel={LIBRARY_LABEL[activeItem.sourceLibrary]}
                      fit="contain"
                      activePlay
                    />
                  </div>
                ) : (
                  <div className="ex-spec-type">
                    <span className="ex-spec-word">{activeTitle}</span>
                    <span className="t-label">{LIBRARY_LABEL[activeItem.sourceLibrary]}</span>
                  </div>
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
                <div>
                  <dt>giấy phép</dt>
                  <dd>{sanitizeBrandText(activeItem.license)}</dd>
                </div>
                <div>
                  <dt>mã hồ sơ</dt>
                  <dd>{whiteLabelArchivePath(activeItem)}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </section>

        <aside className="ex-xp-inspector" aria-label="Bảng tùy chỉnh và mã nguồn">
          {activeHasCode ? (
            <section className="ex-xp-card" aria-labelledby="ex-xp-tune-heading">
              <div className="ex-xp-card-head">
                <h2 id="ex-xp-tune-heading" className="t-label">
                  Tùy chỉnh
                </h2>
                <button type="button" className="ex-text" onClick={handleResetTune}>
                  Đặt lại
                </button>
              </div>

              <div className="ex-xp-sliders">
                <label className="ex-tune-field">
                  <span className="t-label">Tỉ lệ hiển thị ({scale}%)</span>
                  <input
                    type="range"
                    min={65}
                    max={135}
                    step={5}
                    value={scale}
                    onChange={(event) => setScale(Number(event.target.value))}
                  />
                </label>

                <label className="ex-tune-field">
                  <span className="t-label">Khoảng đệm ({padding}px)</span>
                  <input
                    type="range"
                    min={0}
                    max={64}
                    step={4}
                    value={padding}
                    onChange={(event) => setPadding(Number(event.target.value))}
                  />
                </label>

                <label className="ex-tune-field">
                  <span className="t-label">Bo góc ({radius}px)</span>
                  <input
                    type="range"
                    min={0}
                    max={36}
                    step={2}
                    value={radius}
                    onChange={(event) => setRadius(Number(event.target.value))}
                  />
                </label>

                <label className="ex-tune-field">
                  <span className="t-label">Tốc độ chuyển động ({speed}x)</span>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.25}
                    value={speed}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                  />
                </label>

                <div className="ex-tune-field">
                  <span className="t-label">Điểm nhấn màu</span>
                  <div className="ex-xp-swatches" role="group" aria-label="Chọn màu nhấn">
                    {ACCENTS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="ex-xp-swatch"
                        style={{ '--swatch': item.id } as React.CSSProperties}
                        aria-pressed={accent === item.id}
                        onClick={() => setAccent(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="ex-xp-card" aria-label="Mã nguồn và Prompt">
            <div className="ex-code-tabs">
              <div className="ex-filter" role="tablist" aria-label="Ngăn mã nguồn">
                {activeHtml ? (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={codeTab === 'html'}
                    className="ex-text"
                    aria-pressed={codeTab === 'html'}
                    onClick={() => setCodeTab('html')}
                  >
                    HTML / TSX
                  </button>
                ) : null}
                {displayCss ? (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={codeTab === 'css'}
                    className="ex-text"
                    aria-pressed={codeTab === 'css'}
                    onClick={() => setCodeTab('css')}
                  >
                    CSS
                  </button>
                ) : null}
                <button
                  type="button"
                  role="tab"
                  aria-selected={codeTab === 'prompt'}
                  className="ex-text"
                  aria-pressed={codeTab === 'prompt'}
                  onClick={() => setCodeTab('prompt')}
                >
                  Prompt
                </button>
              </div>
              <div className="ex-xp-copy-bar">
                {(activeHtml || displayCss) ? (
                  <button
                    type="button"
                    className="ex-text"
                    onClick={() =>
                      void handleCopy(
                        codeTab === 'css' ? displayCss : activeHtml || displayCss,
                        'Đã chép mã'
                      )
                    }
                  >
                    Chép mã
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ex-text"
                  onClick={() => void handleCopy(activePrompt, 'Đã chép Prompt')}
                >
                  Chép Prompt
                </button>
              </div>
            </div>

            <pre className="ex-code-pre ex-xp-pre">
              <code>{activeCode}</code>
            </pre>

            {activeItem ? (
              <div className="ex-xp-card-foot">
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={handleAttach}
                >
                  Đính kèm vào dự án
                </button>
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() => openInWorkspace(templateContext(activeItem))}
                >
                  Mở Workspace
                </button>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ExperienceView;
