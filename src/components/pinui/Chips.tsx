import React from 'react';
import { Check } from 'lucide-react';

export interface ChipItem {
  id: string;
  label: string;
  group?: string;
}

export interface ChipsProps {
  items: ChipItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  multi?: boolean;
  className?: string;
}

export const Chips: React.FC<ChipsProps> = ({
  items,
  selectedIds,
  onToggle,
  multi = true,
  className = '',
}) => {
  return (
    <div
      className={`pchips-wrap ${className}`}
      role="listbox"
      aria-multiselectable={multi}
      aria-label="Bộ lọc thẻ"
    >
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={selected}
            data-selected={selected}
            className="pchips-btn"
            onClick={() => onToggle(item.id)}
          >
            {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Chips;
