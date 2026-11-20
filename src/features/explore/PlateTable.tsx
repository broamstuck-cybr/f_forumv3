import React, { useMemo, useState } from 'react';
import type { SourceCatalogItem, SourceLibraryName } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { Reveal } from '../../ui/Reveal';
import {
  LIBRARY_LABEL,
  LIBRARY_ORDER,
  archiveCount,
  copyText,
  formatCount,
  matchesQuery,
  templateContext,
} from './catalog';
import { PlateRibbon } from './PlateRibbon';
import { SpecimenSheet } from './SpecimenSheet';
import { useCalm } from './useCalm';

interface PlateTableProps {
  query: string;
  onClearQuery: () => void;
}

type LibraryFilter = 'all' | SourceLibraryName;

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
  const [coarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );
  const [library, setLibrary] = useState<LibraryFilter>('all');
  const [driftOn, setDriftOn] = useState(true);
  const [specimenId, setSpecimenId] = useState<string | null>(null);

  const canDrift = !calm && !coarse;

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
            item.sourceLibrary,
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
  const specimenIndex = specimenId ? flat.findIndex((item) => item.id === specimenId) : -1;
  const specimen = specimenIndex >= 0 ? flat[specimenIndex] : null;

  const handleStep = (delta: 1 | -1) => {
    const next = flat[specimenIndex + delta];
    if (next) setSpecimenId(next.id);
  };

  const handleAttach = (item: SourceCatalogItem) => {
    if (activeProject.attachedItems.some((attached) => attached.id === item.id)) {
      addToast({ type: 'info', title: 'Đã đính kèm từ trước', message: item.title });
      return;
    }
    attachItemToWorkspace(templateContext(item));
  };

  const handleCopyPath = async (item: SourceCatalogItem) => {
    const ok = await copyText(item.archivePath);
    addToast(
      ok
        ? { type: 'success', title: 'Đã chép đường dẫn', message: item.archivePath }
        : { type: 'error', title: 'Không chép được', message: item.archivePath }
    );
  };

  return (
    <>
      <div className="wrap-wide ex-controls">
        <div className="ex-filter" role="group" aria-label="Lọc theo thư viện">
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

      {shown.map((ribbon) => {
        const index = LIBRARY_ORDER.indexOf(ribbon.name);
        const direction = index % 2 === 0 ? 1 : -1;
        const archived = archiveCount(ribbon.name);
        const licence = ribbon.all[0]?.license;
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
              direction={direction}
              startAtEnd={canDrift && direction === -1}
              drift={canDrift && driftOn && specimen === null}
              calm={calm}
              onSelect={(item) => setSpecimenId(item.id)}
            />
          </section>
        );
      })}

      {shown.length === 0 ? (
        <div className="wrap-wide ex-empty">
          <p className="ex-empty-line">
            {query ? `Không có mẫu nào khớp “${query}”.` : 'Thư viện này chưa có mẫu trên bàn.'}
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
        item={specimen}
        position={specimenIndex + 1}
        total={flat.length}
        saved={specimen ? savedItemIds.includes(specimen.id) : false}
        onClose={() => setSpecimenId(null)}
        onStep={handleStep}
        onToggleSave={(item) => toggleSavedItem(item.id)}
        onUse={(item) => openInWorkspace(templateContext(item))}
        onAttach={handleAttach}
        onCopyPath={(item) => void handleCopyPath(item)}
      />
    </>
  );
};
