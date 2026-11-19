import React, { useRef, type KeyboardEvent } from 'react';
import './selection-list.css';

export interface SelectionListItem {
  id: string;
  label: string;
  swatch?: string;
}

export interface SelectionListProps {
  items: SelectionListItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export const SelectionList: React.FC<SelectionListProps> = ({
  items,
  selectedId,
  onSelect,
  ariaLabel = 'Danh sách chọn',
  className = '',
}) => {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (idx + 1) % items.length;
      refs.current[next]?.focus();
      onSelect(items[next].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (idx - 1 + items.length) % items.length;
      refs.current[prev]?.focus();
      onSelect(items[prev].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      refs.current[0]?.focus();
      if (items[0]) onSelect(items[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = items.length - 1;
      refs.current[last]?.focus();
      if (items[last]) onSelect(items[last].id);
    }
  };

  return (
    <div className={`psel ${className}`} role="listbox" aria-label={ariaLabel}>
      {items.map((item, idx) => {
        const selected = item.id === selectedId;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type="button"
            role="option"
            aria-selected={selected}
            data-selected={selected}
            className="psel__row"
            onClick={() => onSelect(item.id)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
          >
            <span className="psel__left" aria-hidden="true">
              <span
                className="psel__swatch"
                style={{ background: item.swatch ?? 'var(--accent-primary)' }}
              />
            </span>
            <span className="psel__right">
              <span className="psel__fill" aria-hidden="true" />
              <span className="psel__label">{item.label}</span>
              <span className="psel__dot" aria-hidden="true" />
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SelectionList;
