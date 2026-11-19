import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

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
}

export const LiquidTabs: React.FC<LiquidTabsProps> = ({
  tabs,
  activeId,
  onChange,
  className = '',
}) => {
  const uid = useId();
  const reduced = Boolean(useReducedMotion());

  return (
    <div
      role="tablist"
      aria-label="Chuyển tab"
      className={`pltabs-bar overflow-x-auto ff-scrollbar ${className}`}
    >
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
                transition={
                  reduced
                    ? { duration: 0.01 }
                    : { type: 'spring', visualDuration: 0.36, bounce: 0.14 }
                }
                aria-hidden="true"
              />
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[11px] font-mono leading-none"
                style={{
                  background: isActive ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--ink-muted)',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default LiquidTabs;
