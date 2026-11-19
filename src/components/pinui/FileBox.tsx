import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, FolderOpen } from 'lucide-react';

export interface FileBoxTab {
  id: string;
  label: string;
  meta?: string;
  onOpen?: () => void;
}

export interface FileBoxProps {
  title: string;
  tabs: FileBoxTab[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

const ACCENT_PALETTE = [
  'var(--accent-primary)',
  'var(--accent-verdigris)',
  'var(--accent-jade)',
  'var(--accent-copper)',
];

export const FileBox: React.FC<FileBoxProps> = ({
  title,
  tabs,
  activeId,
  onSelect,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());

  return (
    <div className={`pfbox-card ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
          <h4 className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
            {title}
          </h4>
        </div>
        <span className="text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
          {tabs.length} thẻ
        </span>
      </div>

      <div className="space-y-2">
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeId;
          const accent = ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
          return (
            <motion.div
              key={tab.id}
              whileHover={reduced ? undefined : { y: -3 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor: isActive ? 'var(--border-accent)' : 'var(--border-subtle)',
                background: isActive ? 'var(--bg-elevated)' : 'var(--bg-panel)',
              }}
            >
              <div className="h-1 w-full" style={{ background: accent, opacity: isActive ? 1 : 0.45 }} />
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => onSelect?.(tab.id)}
                  className="flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
                >
                  <div className="text-[13px] font-medium truncate" style={{ color: 'var(--ink-primary)' }}>
                    {tab.label}
                  </div>
                  {tab.meta && (
                    <div className="text-[11px] font-mono truncate mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                      {tab.meta}
                    </div>
                  )}
                </button>
                {tab.onOpen && (
                  <button
                    type="button"
                    onClick={tab.onOpen}
                    aria-label={`Mở ${tab.label}`}
                    title={`Mở ${tab.label}`}
                    className="inline-grid place-items-center h-7 w-7 rounded-lg border shrink-0 cursor-pointer transition-colors"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      background: 'var(--bg-surface)',
                      color: 'var(--ink-secondary)',
                    }}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FileBox;
