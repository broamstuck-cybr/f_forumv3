import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store/appStore';
import type { SourceLibraryName } from '../../types/index';
import { LiquidTabs, SearchCard, type LiquidTabItem } from '../../components/pinui';
import { Mark } from '../../ui/Mark';
import {
  LIBRARY_LABEL,
  LIBRARY_ORDER,
  RANKED_REPOS,
  type ExploreMode,
} from './catalog';
import { PlateTable, type LibraryFilter } from './PlateTable';
import { RepoChart } from './RepoChart';
import { ToolIndex } from './ToolIndex';
import { useCalm } from './useCalm';
import './explore.css';

const MODES: Array<{ id: ExploreMode; label: string }> = [
  { id: 'plates', label: 'Mẫu' },
  { id: 'tools', label: 'Công cụ' },
  { id: 'repos', label: 'Repo' },
];

const RECENT_SEARCHES = ['Glass', '3D', 'Hero', 'Button', 'Pricing', 'Terminal'];

function resolveIncomingMode(value: string | undefined | null): ExploreMode | null {
  if (value === 'leaderboard' || value === 'github' || value === 'repos') return 'repos';
  if (value === 'resources' || value === 'tools') return 'tools';
  if (value === 'templates' || value === 'plates') return 'plates';
  return null;
}

export const ExploreView: React.FC = () => {
  const { sourceCatalog, resourceLibrary, savedItemIds, openExperience } = useAppStore();
  const calm = useCalm();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [mode, setMode] = useState<ExploreMode>(() => {
    if (typeof window === 'undefined') return 'plates';
    return resolveIncomingMode(window.sessionStorage.getItem('ff_explore_mode')) ?? 'plates';
  });
  const [library, setLibrary] = useState<LibraryFilter>('all');
  const [search, setSearch] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const query = search.trim().toLowerCase();

  useEffect(() => {
    const stored = resolveIncomingMode(window.sessionStorage.getItem('ff_explore_mode'));
    if (stored) {
      setMode(stored);
      window.sessionStorage.removeItem('ff_explore_mode');
    }
    const onExploreMode = (event: Event) => {
      const detail = (event as CustomEvent<string | { mode?: string }>).detail;
      const next = resolveIncomingMode(typeof detail === 'string' ? detail : detail?.mode);
      if (next) setMode(next);
    };
    window.addEventListener('ff:explore-mode', onExploreMode);
    return () => window.removeEventListener('ff:explore-mode', onExploreMode);
  }, []);

  const counts: Record<ExploreMode, number> = {
    plates: sourceCatalog.length,
    tools: resourceLibrary.length,
    repos: RANKED_REPOS.length,
  };

  const libraryTabs: LiquidTabItem[] = useMemo(() => {
    const byLib = new Map<SourceLibraryName, number>();
    for (const item of sourceCatalog) {
      byLib.set(item.sourceLibrary, (byLib.get(item.sourceLibrary) ?? 0) + 1);
    }
    return [
      { id: 'all', label: 'Tất cả', count: sourceCatalog.length },
      ...LIBRARY_ORDER.map((name) => ({
        id: name,
        label: LIBRARY_LABEL[name],
        count: byLib.get(name) ?? 0,
      })),
    ];
  }, [sourceCatalog]);

  const handleTabKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % MODES.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + MODES.length) % MODES.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = MODES.length - 1;
    if (next < 0) return;
    event.preventDefault();
    setMode(MODES[next].id);
    tabRefs.current[next]?.focus();
  };

  const clearSearch = () => setSearch('');

  return (
    <div className="ex">
      <header className="wrap-wide ex-head">
        <h1 className="t-display ex-title">
          <span className="t-script ex-title-cap">B</span>àn soi
        </h1>
        <div className="ex-aside">
          <p className="ex-lede">Đặt mẫu lên bàn, soi từng bản, rồi mang vào Workspace.</p>
          <SearchCard
            value={search}
            onChange={setSearch}
            placeholder="Tìm mẫu, công cụ, repo..."
            recentSearches={RECENT_SEARCHES}
            onSelectRecent={(value) => setSearch(value)}
            className="ex-pinui-search"
          />
          <div className="ex-quick">
            <button
              type="button"
              className="ex-pill"
              aria-pressed={savedOnly}
              onClick={() => setSavedOnly((prev) => !prev)}
            >
              <span className="ex-mark-dot" aria-hidden="true" />
              <span>Đã lưu ({savedItemIds.length})</span>
            </button>
            {sourceCatalog[0] ? (
              <button
                type="button"
                className="ex-pill"
                onClick={() => openExperience(sourceCatalog[0].id)}
              >
                Trải nghiệm thành phần
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="wrap-wide">
        <div className="ex-modes" role="tablist" aria-label="Chế độ bàn soi">
          {MODES.map((entry, index) => {
            const selected = entry.id === mode;
            return (
              <button
                key={entry.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`ex-tab-${entry.id}`}
                className="ex-mode"
                aria-selected={selected}
                aria-controls="ex-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setMode(entry.id)}
                onKeyDown={(event) => handleTabKey(event, index)}
              >
                <span className="ex-mode-word">
                  {selected ? (
                    <Mark kind="underline" active>
                      {entry.label}
                    </Mark>
                  ) : (
                    entry.label
                  )}
                </span>
                <span className="t-label ex-mode-count">
                  {counts[entry.id]}
                  <span className="sr-only"> mục</span>
                </span>
              </button>
            );
          })}
        </div>

        {mode === 'plates' ? (
          <div className="ex-lib-tabs-bar">
            <LiquidTabs
              tabs={libraryTabs}
              activeId={library}
              onChange={(nextId) => setLibrary(nextId as LibraryFilter)}
              ariaLabel="Nhóm mẫu giao diện"
              className="ex-pinui-tabs"
            />
          </div>
        ) : null}
      </div>

      <motion.section
        key={mode}
        id="ex-panel"
        role="tabpanel"
        aria-labelledby={`ex-tab-${mode}`}
        className="ex-panel"
        initial={calm ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {mode === 'plates' ? (
          <PlateTable
            query={query}
            onClearQuery={clearSearch}
            savedOnly={savedOnly}
            onShowAll={() => setSavedOnly(false)}
            onToggleSavedOnly={() => setSavedOnly((v) => !v)}
            library={library}
            onLibraryChange={setLibrary}
          />
        ) : null}
        {mode === 'tools' ? (
          <ToolIndex
            query={query}
            onClearQuery={clearSearch}
            savedOnly={savedOnly}
            onShowAll={() => setSavedOnly(false)}
            onToggleSavedOnly={() => setSavedOnly((v) => !v)}
          />
        ) : null}
        {mode === 'repos' ? (
          <RepoChart
            query={query}
            onClearQuery={clearSearch}
            savedOnly={savedOnly}
            onShowAll={() => setSavedOnly(false)}
            onToggleSavedOnly={() => setSavedOnly((v) => !v)}
          />
        ) : null}
      </motion.section>
    </div>
  );
};
