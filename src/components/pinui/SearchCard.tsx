import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Search, X } from 'lucide-react';

export interface SearchCardProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  recentSearches?: string[];
  onSelectRecent?: (q: string) => void;
  compact?: boolean;
  className?: string;
}

export const SearchCard: React.FC<SearchCardProps> = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm tài nguyên, template, dự án...',
  recentSearches = [],
  onSelectRecent,
  compact = false,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const filteredRecents = recentSearches.filter((item) =>
    value.trim() ? item.toLowerCase().includes(value.trim().toLowerCase()) : true
  );

  return (
    <div ref={rootRef} className={`psearch-shell ${className}`}>
      <div
        className="psearch-bar"
        data-open={open}
        style={{ minHeight: compact ? '38px' : '42px' }}
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-muted)' }} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              if (value) onChange('');
              else {
                setOpen(false);
                inputRef.current?.blur();
              }
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full min-w-0 bg-transparent border-0 outline-none text-[13.5px]"
          style={{ color: 'var(--ink-primary)' }}
        />
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Xóa từ khóa tìm kiếm"
            title="Xóa"
            className="inline-grid place-items-center h-6 w-6 rounded-full cursor-pointer"
            style={{ color: 'var(--ink-muted)', background: 'var(--bg-panel)' }}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && filteredRecents.length > 0 && (
          <motion.div
            className="psearch-dropdown"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-2.5 py-1.5 text-[11px] font-medium" style={{ color: 'var(--ink-muted)' }}>
              Tìm kiếm gần đây
            </div>
            <ul className="m-0 p-0 list-none space-y-0.5">
              {filteredRecents.slice(0, 5).map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[13px] cursor-pointer transition-colors"
                    style={{ color: 'var(--ink-primary)' }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(item);
                      onSelectRecent?.(item);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{item}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchCard;
