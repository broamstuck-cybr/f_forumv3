import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SourceCatalogItem, SourceLibraryName } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { previewFor } from '../../ui/Media';
import { Reveal } from '../../ui/Reveal';
import {
  LIBRARY_LABEL,
  LIBRARY_ORDER,
  archiveCount,
  copyText,
  formatCount,
  matchesQuery,
  sanitizeBrandText,
  sanitizeSnippetCode,
  templateContext,
  whiteLabelArchivePath,
  type PreviewTheme,
  type PreviewViewport,
} from './catalog';
import { PlateRibbon } from './PlateRibbon';
import { SandboxPreview } from './SandboxPreview';
import { SpecimenMedia } from './SpecimenMedia';
import { SpecimenSheet } from './SpecimenSheet';
import { useCalm } from './useCalm';

interface PlateTableProps {
  query: string;
  onClearQuery: () => void;
}

type LibraryFilter = 'all' | SourceLibraryName;
type BenchTab = 'html' | 'css' | 'spec';

const VIEWPORTS: PreviewViewport[] = [390, 768, 1440];

export const PlateTable: React.FC<PlateTableProps> = ({ query, onClearQuery }) => {
  const {
    sourceCatalog,
    savedItemIds,
    toggleSavedItem,
    attachItemToWorkspace,
    openInWorkspace,
    activeProject,
    addToast,
    theme,
  } = useAppStore();
  const calm = useCalm();
  const benchRef = useRef<HTMLElement>(null);
  const [coarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );
  const [library, setLibrary] = useState<LibraryFilter>('all');
  const [driftOn, setDriftOn] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewport, setViewport] = useState<PreviewViewport>(1440);
  const [stageTheme, setStageTheme] = useState<PreviewTheme>(theme);
  const [nonce, setNonce] = useState(0);
  const [benchCodeOpen, setBenchCodeOpen] = useState(false);
  const [benchTab, setBenchTab] = useState<BenchTab>('html');

  const canDrift = !calm && !coarse;

  useEffect(() => {
    setStageTheme(theme);
  }, [theme]);

  const ribbons = useMemo(
    () =>
      LIBRARY_ORDER.map((name) => {
        const all = sourceCatalog.filter((item) => item.sourceLibrary === name);
        const items = all.filter((item) =>
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
    [sourceCatalog, query]
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
    setNonce((n) => n + 1);
    setBenchTab(activeItem.previewHtml ? 'html' : 'spec');
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
  const activeHasCode = Boolean(activeItem?.previewHtml);
  const activeTitle = activeItem ? sanitizeBrandText(activeItem.title) : '';
  const activeDesc = activeItem ? sanitizeBrandText(activeItem.description) : '';
  const activeSaved = activeItem ? savedItemIds.includes(activeItem.id) : false;
  const activeHtml = activeItem ? sanitizeSnippetCode(activeItem.previewHtml) : '';
  const activeCss = activeItem ? sanitizeSnippetCode(activeItem.previewCss) : '';
  const activeSpec = activeItem
    ? sanitizeBrandText(activeItem.promptSpec) ||
      `${activeTitle}\nNhóm: ${LIBRARY_LABEL[activeItem.sourceLibrary]}\nRuntime: ${activeItem.runtime}\nPhong cách: ${activeItem.style}\n\n${activeDesc}`
    : '';
  const shownCode = benchTab === 'html' ? activeHtml : benchTab === 'css' ? activeCss : activeSpec;

  const handleCopyCode = async () => {
    if (!shownCode) return;
    const ok = await copyText(shownCode);
    addToast(
      ok
        ? { type: 'success', title: 'Đã chép mã', message: activeTitle }
        : { type: 'error', title: 'Không chép được', message: activeTitle }
    );
  };

  return (
    <>
      <div className="wrap-wide ex-controls">
        <div className="ex-filter" role="group" aria-label="Lọc theo danh mục">
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
                <span className="t-note">{activeHasCode ? 'chạy trực tiếp' : 'xem chuyển động'}</span>
              </div>
              <div className="ex-stage-controls">
                {activeHasCode ? (
                  <>
                    {VIEWPORTS.map((vp) => (
                      <button
                        key={vp}
                        type="button"
                        className="ex-text"
                        aria-pressed={viewport === vp}
                        onClick={() => setViewport(vp)}
                      >
                        {vp}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="ex-text"
                      aria-pressed={stageTheme === 'dark'}
                      onClick={() => setStageTheme('dark')}
                    >
                      Mực
                    </button>
                    <button
                      type="button"
                      className="ex-text"
                      aria-pressed={stageTheme === 'light'}
                      onClick={() => setStageTheme('light')}
                    >
                      Giấy
                    </button>
                    <button
                      type="button"
                      className="ex-text"
                      onClick={() => setNonce((n) => n + 1)}
                    >
                      Chạy lại
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="ex-text"
                  onClick={() => setSheetOpen(true)}
                >
                  Phóng to
                </button>
              </div>
            </div>

            <div className={`ex-bench-stage${stageTheme === 'light' ? ' ex-stage-paper' : ''}`}>
              {activeHasCode ? (
                <SandboxPreview
                  title={activeTitle}
                  html={activeItem.previewHtml ?? ''}
                  css={activeItem.previewCss ?? ''}
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
              ) : (
                <div className="ex-spec-type">
                  <span className="ex-spec-word">{activeTitle}</span>
                  <span className="t-label">{LIBRARY_LABEL[activeItem.sourceLibrary]}</span>
                </div>
              )}
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
              <div>
                <dt>giấy phép</dt>
                <dd>{sanitizeBrandText(activeItem.license)}</dd>
              </div>
              <div>
                <dt>mã mẫu</dt>
                <dd>{whiteLabelArchivePath(activeItem)}</dd>
              </div>
            </dl>

            <div className="ex-spec-actions">
              <button
                type="button"
                className="btn btn-solid"
                onClick={() => openInWorkspace(templateContext(activeItem))}
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
              <button
                type="button"
                className="btn btn-line"
                aria-pressed={activeSaved}
                onClick={() => toggleSavedItem(activeItem.id)}
              >
                {activeSaved ? 'Đã lưu' : 'Lưu'}
              </button>
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
                <div className="ex-code-tabs">
                  <div className="ex-filter" role="tablist" aria-label="Nguồn mã mẫu">
                    {activeHtml ? (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={benchTab === 'html'}
                        className="ex-text"
                        aria-pressed={benchTab === 'html'}
                        onClick={() => setBenchTab('html')}
                      >
                        HTML
                      </button>
                    ) : null}
                    {activeCss ? (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={benchTab === 'css'}
                        className="ex-text"
                        aria-pressed={benchTab === 'css'}
                        onClick={() => setBenchTab('css')}
                      >
                        CSS
                      </button>
                    ) : null}
                    <button
                      type="button"
                      role="tab"
                      aria-selected={benchTab === 'spec'}
                      className="ex-text"
                      aria-pressed={benchTab === 'spec'}
                      onClick={() => setBenchTab('spec')}
                    >
                      Đặc tả
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ex-text"
                    onClick={() => void handleCopyCode()}
                  >
                    Chép mã
                  </button>
                </div>
                <pre className="ex-code-pre">
                  <code>{shownCode}</code>
                </pre>
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
        const archived = archiveCount(ribbon.name);
        const licence = sanitizeBrandText(ribbon.all[0]?.license);
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
                {archived !== null ? (
                  <div>
                    <dt>kho tham chiếu</dt>
                    <dd>{formatCount(archived)}</dd>
                  </div>
                ) : null}
                {licence ? (
                  <div>
                    <dt>giấy phép</dt>
                    <dd>{licence}</dd>
                  </div>
                ) : null}
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
            />
          </section>
        );
      })}

      {shown.length === 0 ? (
        <div className="wrap-wide ex-empty">
          <p className="ex-empty-line">
            {query ? `Không có mẫu nào khớp “${query}”.` : 'Danh mục này chưa có mẫu trên bàn.'}
          </p>
          <button
            type="button"
            className="ex-text"
            onClick={() => {
              onClearQuery();
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
        saved={sheetItem ? savedItemIds.includes(sheetItem.id) : false}
        onClose={() => setSheetOpen(false)}
        onStep={handleStep}
        onToggleSave={(item) => toggleSavedItem(item.id)}
        onUse={(item) => openInWorkspace(templateContext(item))}
        onAttach={handleAttach}
      />
    </>
  );
};
