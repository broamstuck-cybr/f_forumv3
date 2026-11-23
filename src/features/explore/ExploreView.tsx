import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store/appStore';
import {
  Chips,
  LiquidTabs,
  SearchCard,
  type ChipItem,
  type LiquidTabItem,
} from '../../components/pinui';
import OriginalFileBox from '../../components/pinui/original/file-box/FileBox';
import { Mark } from '../../ui/Mark';
import {
  RANKED_REPOS,
  formatCount,
  type ExploreMode,
} from './catalog';
import {
  VAULT_LIBRARY_LABELS,
  VAULT_LIBRARY_ORDER,
  fetchVaultIndex,
  getCachedVaultIndex,
  type VaultIndexItem,
  type VaultLibraryKey,
} from './vaultLoader';
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

const QUICK_CATEGORY_CHIPS: ChipItem[] = [
  { id: '', label: 'Mọi chủ đề' },
  { id: 'hero', label: 'Hero & Mở đầu' },
  { id: 'card', label: 'Thẻ & Bento' },
  { id: 'button', label: 'Nút tương tác' },
  { id: '3d', label: 'WebGL & 3D' },
  { id: 'pricing', label: 'Bảng giá' },
];

function resolveIncomingMode(value: string | undefined | null): ExploreMode | null {
  if (value === 'leaderboard' || value === 'github' || value === 'repos') return 'repos';
  if (value === 'resources' || value === 'tools') return 'tools';
  if (value === 'templates' || value === 'plates') return 'plates';
  return null;
}

export const ExploreView: React.FC = () => {
  const { sourceCatalog, resourceLibrary, savedItemIds, openExperience, theme } = useAppStore();
  const calm = useCalm();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [mode, setMode] = useState<ExploreMode>(() => {
    if (typeof window === 'undefined') return 'plates';
    return resolveIncomingMode(window.sessionStorage.getItem('ff_explore_mode')) ?? 'plates';
  });
  const [library, setLibrary] = useState<LibraryFilter>('all');
  const [topicChip, setTopicChip] = useState('');
  const [search, setSearch] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultIndexItem[]>(
    () => getCachedVaultIndex()?.items ?? []
  );
  const query = search.trim().toLowerCase();

  useEffect(() => {
    if (vaultItems.length > 0) return;
    let cancelled = false;
    void fetchVaultIndex()
      .then((data) => {
        if (!cancelled && data.items.length > 0) setVaultItems(data.items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [vaultItems.length]);

  const enterVaultExperience = (overrideQuery?: string) => {
    const q = (overrideQuery ?? (search.trim() || topicChip)).trim();
    if (typeof window !== 'undefined' && q) {
      window.sessionStorage.setItem('ff_experience_query', q);
    }
    openExperience(sourceCatalog[0]?.id ?? 'vault');
  };

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

  const totalPlatesCount = vaultItems.length > 0 ? vaultItems.length : sourceCatalog.length;

  const counts: Record<ExploreMode, string | number> = {
    plates: formatCount(totalPlatesCount),
    tools: resourceLibrary.length,
    repos: RANKED_REPOS.length,
  };

  const libraryTabs: LiquidTabItem[] = useMemo(() => {
    const byLib = new Map<VaultLibraryKey, number>();
    if (vaultItems.length > 0) {
      for (const item of vaultItems) {
        byLib.set(item.l, (byLib.get(item.l) ?? 0) + 1);
      }
    } else {
      for (const item of sourceCatalog) {
        byLib.set(item.sourceLibrary, (byLib.get(item.sourceLibrary) ?? 0) + 1);
      }
    }
    return [
      { id: 'all', label: 'Tất cả', count: totalPlatesCount },
      ...VAULT_LIBRARY_ORDER.map((name) => ({
        id: name,
        label: VAULT_LIBRARY_LABELS[name],
        count: byLib.get(name) ?? 0,
      })),
    ];
  }, [vaultItems, sourceCatalog, totalPlatesCount]);

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
  const clearTopic = () => setTopicChip('');

  return (
    <div className="ex">
      <header className="wrap-wide ex-head">
        <h1 className="t-display ex-title">
          <span className="t-script ex-title-cap">B</span>àn soi
        </h1>
        <div className="ex-aside">
          <p className="ex-lede">Đặt mẫu lên bàn, thử trực tiếp, rồi mang vào Workspace.</p>
          <div className="ex-search-dock">
            <SearchCard
              value={search}
              onChange={setSearch}
              placeholder="Tìm mẫu, thành phần, hiệu ứng, kho lưu trữ..."
              recentSearches={RECENT_SEARCHES}
              onSelectRecent={(value) => setSearch(value)}
              compact
              className="ex-pinui-search"
            />
            <button
              type="button"
              className="ex-vault-dock-btn"
              onClick={() => enterVaultExperience()}
              title="Mở toàn bộ kho tài nguyên trong không gian trải nghiệm"
            >
              <span className="ex-vault-box-mini" aria-hidden="true">
                <OriginalFileBox theme={theme} />
              </span>
              <span className="ex-vault-dock-copy">
                <span className="ex-vault-hint-text">Nhiều quá? Đơn giản nha!!!</span>
                <span className="ex-vault-dock-sub">Mở kho trải nghiệm</span>
              </span>
            </button>
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
            <Chips
              items={QUICK_CATEGORY_CHIPS}
              selectedIds={[topicChip]}
              onToggle={(chipId) => setTopicChip((prev) => (prev === chipId ? '' : chipId))}
              multi={false}
              variant="filter"
              theme={theme}
              className="ex-pinui-chips"
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
            topicChip={topicChip}
            onClearTopic={clearTopic}
            onClearQuery={clearSearch}
            savedOnly={savedOnly}
            onShowAll={() => setSavedOnly(false)}
            onToggleSavedOnly={() => setSavedOnly((v) => !v)}
            library={library}
            onLibraryChange={setLibrary}
            vaultItems={vaultItems}
            onOpenVaultQuery={(q) => enterVaultExperience(q)}
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
