import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store/appStore';
import { Mark } from '../../ui/Mark';
import { RANKED_REPOS, type ExploreMode } from './catalog';
import { PlateTable } from './PlateTable';
import { RepoChart } from './RepoChart';
import { ToolIndex } from './ToolIndex';
import { useCalm } from './useCalm';
import './explore.css';

const MODES: Array<{ id: ExploreMode; label: string }> = [
  { id: 'plates', label: 'Mẫu' },
  { id: 'tools', label: 'Công cụ' },
  { id: 'repos', label: 'Repo' },
];

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
          <div className="ex-search">
            <label htmlFor="ex-search" className="t-label">
              Tìm
            </label>
            <input
              id="ex-search"
              type="search"
              className="ex-search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="mẫu, công cụ, repo"
              autoComplete="off"
              spellCheck={false}
            />
            {search ? (
              <button type="button" className="ex-text" onClick={clearSearch}>
                Xóa
              </button>
            ) : null}
          </div>
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
          <PlateTable query={query} onClearQuery={clearSearch} savedOnly={savedOnly} onShowAll={() => setSavedOnly(false)} onToggleSavedOnly={() => setSavedOnly((v) => !v)} />
        ) : null}
        {mode === 'tools' ? (
          <ToolIndex query={query} onClearQuery={clearSearch} savedOnly={savedOnly} onShowAll={() => setSavedOnly(false)} onToggleSavedOnly={() => setSavedOnly((v) => !v)} />
        ) : null}
        {mode === 'repos' ? (
          <RepoChart query={query} onClearQuery={clearSearch} savedOnly={savedOnly} onShowAll={() => setSavedOnly(false)} onToggleSavedOnly={() => setSavedOnly((v) => !v)} />
        ) : null}
      </motion.section>
    </div>
  );
};
