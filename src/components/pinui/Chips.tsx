import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './chips.css';

export interface ChipItem {
  id: string;
  label: string;
  group?: string;
  accent?: string;
  lip?: string;
  bg?: string;
  ink?: string;
}

export interface ChipsProps {
  items: ChipItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  multi?: boolean;
  className?: string;
  variant?: 'tactile' | 'filter';
  sound?: boolean;
  corner?: number;
  shadow?: number;
  theme?: 'light' | 'dark';
  itemRole?: 'option' | 'button';
}

function playChipTone(kind: 'press' | 'select') {
  if (typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(kind === 'select' ? 480 : 320, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'select' ? 760 : 180, now + 0.045);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
    window.setTimeout(() => void ctx.close().catch(() => undefined), 120);
  } catch {
    return;
  }
}

export const Chips: React.FC<ChipsProps> = ({
  items,
  selectedIds,
  onToggle,
  multi = true,
  className = '',
  variant = 'tactile',
  sound = false,
  corner,
  shadow,
  theme,
  itemRole = 'option',
}) => {
  const reduced = Boolean(useReducedMotion());
  const lastSoundRef = useRef(0);

  const fireTone = (kind: 'press' | 'select') => {
    if (!sound) return;
    const now = Date.now();
    if (now - lastSoundRef.current < 45) return;
    lastSoundRef.current = now;
    playChipTone(kind);
  };

  return (
    <div
      className={`pchips-wrap ${className}`}
      role={itemRole === 'button' ? 'group' : 'listbox'}
      aria-multiselectable={itemRole === 'option' ? multi : undefined}
      aria-label="Bộ chọn"
      data-theme={theme}
      style={
        {
          ...(corner !== undefined ? { '--pchips-corner': `${corner}px` } : {}),
          ...(shadow !== undefined ? { '--pchips-shadow': shadow } : {}),
        } as React.CSSProperties
      }
    >
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <motion.button
            key={item.id}
            type="button"
            role={itemRole === 'option' ? 'option' : undefined}
            aria-selected={itemRole === 'option' ? selected : undefined}
            aria-pressed={itemRole === 'button' ? selected : undefined}
            data-selected={selected}
            className={`pchips-btn ${variant === 'tactile' ? 'pchips-btn--tactile' : ''}`}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 28 }}
            style={
              {
                ...(item.accent ? { '--chip-accent': item.accent } : {}),
                ...(item.lip ? { '--chip-lip': item.lip } : {}),
                ...(item.bg ? { '--chip-bg': item.bg } : {}),
                ...(item.ink ? { '--chip-ink': item.ink } : {}),
              } as React.CSSProperties
            }
            onPointerDown={() => fireTone('press')}
            onClick={() => {
              fireTone('select');
              onToggle(item.id);
            }}
          >
            <span>{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default Chips;
