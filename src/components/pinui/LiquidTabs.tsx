import React, { useId, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Transition } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import './liquid-tabs.css';

export interface LiquidTabItem {
  id: string;
  label: string;
  count?: number;
}

export interface LiquidTabsProps {
  tabs: LiquidTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

export interface LiquidTabsCardItem {
  id: string;
  tabId: string;
  initials: string;
  title: string;
  meta: string;
}

export interface LiquidTabsCardProps {
  tabs: LiquidTabItem[];
  overflowTabs?: LiquidTabItem[];
  items: LiquidTabsCardItem[];
  activeId?: string;
  onTabChange?: (id: string) => void;
  onSelectItem?: (item: LiquidTabsCardItem) => void;
  className?: string;
}

const blobSpring: Transition = { type: 'spring', visualDuration: 0.55, bounce: 0.12 };

export const LiquidTabs: React.FC<LiquidTabsProps> = ({
  tabs,
  activeId,
  onChange,
  className = '',
  ariaLabel = 'Chuyển thẻ',
}) => {
  const uid = useId().replace(/:/g, '');
  const reduced = Boolean(useReducedMotion());

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`pltabs-bar overflow-x-auto ff-scrollbar ${className}`}
    >
      <div className="pltabs-gooTrack">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-active={isActive}
              className="pltabs-btn"
              onClick={() => onChange(tab.id)}
            >
              {isActive && (
                <motion.span
                  layoutId={`pltabs-pill-${uid}`}
                  className="pltabs-pill"
                  transition={reduced ? { duration: 0.01 } : blobSpring}
                  aria-hidden="true"
                />
              )}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[11px] font-mono leading-none"
                  style={{
                    background: isActive ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                    color: isActive ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const LiquidTabsCard: React.FC<LiquidTabsCardProps> = ({
  tabs,
  overflowTabs = [],
  items,
  activeId,
  onTabChange,
  onSelectItem,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const gooId = `pltabs-card-goo-${uid}`;
  const reduced = Boolean(useReducedMotion());
  const [internalTab, setInternalTab] = useState(tabs[0]?.id ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentTab = activeId ?? internalTab;
  const setTab = (id: string) => {
    if (activeId === undefined) setInternalTab(id);
    onTabChange?.(id);
  };

  const visibleItems = items.filter((item) => item.tabId === currentTab);

  return (
    <div className={`pltabs-card ${className}`}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <filter id={gooId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
            />
          </filter>
        </defs>
      </svg>

      <LayoutGroup id={`pltabs-card-${uid}`}>
        <div className="pltabs-card__header" role="tablist" aria-label="Phân mục">
          {tabs.slice(0, 3).map((tab) => {
            const active = tab.id === currentTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-active={active}
                className="pltabs-card__tab"
                onClick={() => setTab(tab.id)}
              >
                {active && (
                  <motion.span
                    layoutId={`pltabs-card-blob-${uid}`}
                    className="pltabs-card__blob"
                    style={{ filter: reduced ? undefined : `url(#${gooId})` }}
                    transition={reduced ? { duration: 0.01 } : blobSpring}
                    aria-hidden="true"
                  >
                    <span className="pltabs-card__underline" />
                  </motion.span>
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}

          {overflowTabs.length > 0 && (
            <button
              type="button"
              className="pltabs-card__overflowBtn"
              aria-label="Thêm mục"
              title="Thêm mục"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {menuOpen && overflowTabs.length > 0 && (
            <motion.div
              className="pltabs-card__menu"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.16 }}
            >
              {overflowTabs.map((t) => {
                const selected = t.id === currentTab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    data-selected={selected}
                    className="pltabs-card__menuItem"
                    onClick={() => {
                      setTab(t.id);
                      setMenuOpen(false);
                    }}
                  >
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pltabs-card__list" onPointerLeave={() => setHoveredRow(null)}>
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleItems.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  data-selected={isSelected}
                  className="pltabs-card__row"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(3px)' }}
                  transition={{ duration: 0.22 }}
                  onPointerEnter={() => setHoveredRow(item.id)}
                  onClick={() => {
                    setSelectedId(item.id);
                    onSelectItem?.(item);
                  }}
                >
                  {hoveredRow === item.id && (
                    <motion.span
                      layoutId="row-hover"
                      className="pltabs-card__rowHover"
                      transition={{ type: 'spring', visualDuration: 0.28, bounce: 0.12 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="pltabs-card__avatar">{item.initials}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold" style={{ color: 'var(--ink-primary)' }}>
                      {item.title}
                    </span>
                    <span className="block truncate text-[12px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                      {item.meta}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  );
};

export default LiquidTabs;
