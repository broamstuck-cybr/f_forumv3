import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import type { ThemeEffect } from '../../types/index';
import { createThemeSwitch, type ThemeSwitchEngineHandle } from './theme-switch-engine';
import './theme-switch.css';

export interface ThemeSwitchProps {
  theme: 'light' | 'dark';
  onToggle?: () => void;
  onThemeChange?: (theme: 'light' | 'dark') => void;
  effect?: ThemeEffect;
  defaultEffect?: ThemeEffect;
  onEffectChange?: (effect: ThemeEffect) => void;
  sound?: boolean;
  fill?: boolean;
  compact?: boolean;
  variant?: 'compact' | 'stage';
  className?: string;
}

const EFFECTS: Array<{ id: ThemeEffect; label: string }> = [
  { id: 'droplet', label: 'Giọt nước' },
  { id: 'rain', label: 'Mưa rơi' },
  { id: 'diwali', label: 'Ánh sáng' },
];

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({
  theme,
  onToggle,
  onThemeChange,
  effect,
  defaultEffect = 'droplet',
  onEffectChange,
  sound = true,
  fill = false,
  compact = false,
  variant,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const isDark = theme === 'dark';
  const resolvedVariant = variant ?? (compact ? 'compact' : 'stage');

  const [internalEffect, setInternalEffect] = useState<ThemeEffect>(defaultEffect);
  const activeEffect = effect ?? internalEffect;

  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThemeSwitchEngineHandle | null>(null);
  const latestThemeRef = useRef(theme);
  const latestEffectRef = useRef(activeEffect);
  const latestSoundRef = useRef(sound);
  const onToggleRef = useRef(onToggle);
  const onThemeChangeRef = useRef(onThemeChange);

  latestThemeRef.current = theme;
  latestEffectRef.current = activeEffect;
  latestSoundRef.current = sound;
  onToggleRef.current = onToggle;
  onThemeChangeRef.current = onThemeChange;

  useEffect(() => {
    if (resolvedVariant !== 'stage') return;
    if (!rootRef.current || !btnRef.current || !fxRef.current) return;
    const handle = createThemeSwitch({
      root: rootRef.current,
      button: btnRef.current,
      fx: fxRef.current,
      getTheme: () => latestThemeRef.current,
      getEffect: () => latestEffectRef.current,
      isSoundEnabled: () => latestSoundRef.current,
      onCommit: (next) => {
        if (onThemeChangeRef.current) {
          onThemeChangeRef.current(next);
        } else {
          onToggleRef.current?.();
        }
      },
    });
    engineRef.current = handle;
    return () => {
      handle.destroy();
      engineRef.current = null;
    };
  }, [resolvedVariant]);

  if (resolvedVariant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => {
          if (onThemeChange) {
            onThemeChange(isDark ? 'light' : 'dark');
          } else {
            onToggle?.();
          }
        }}
        aria-label={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
        title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
        aria-pressed={isDark}
        className={`pts-toggle w-9 px-0 ${className}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={theme}
            className="inline-flex items-center justify-center"
            initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.7 }}
            transition={{ type: 'spring', visualDuration: 0.28, bounce: 0.18 }}
            style={{ color: isDark ? 'var(--accent-primary)' : 'var(--accent-copper)' }}
          >
            {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </motion.span>
        </AnimatePresence>
      </button>
    );
  }

  const effectIdx = Math.max(
    0,
    EFFECTS.findIndex((e) => e.id === activeEffect)
  );

  return (
    <div
      ref={rootRef}
      className={`pts ${className}`}
      data-theme={theme}
      data-fill={fill ? 'true' : undefined}
    >
      <div ref={fxRef} className="pts__fx" aria-hidden="true" />

      <button
        ref={btnRef}
        type="button"
        className="pts__toggle"
        aria-label={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
        title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
        aria-pressed={isDark}
        onClick={() => {
          if (engineRef.current) {
            engineRef.current.trigger();
          } else if (onThemeChange) {
            onThemeChange(isDark ? 'light' : 'dark');
          } else {
            onToggle?.();
          }
        }}
      >
        <Sun className="pts__icon pts__icon--sun" aria-hidden="true" />
        <Moon className="pts__icon pts__icon--moon" aria-hidden="true" />
      </button>

      <div className="pts__effects" role="radiogroup" aria-label="Hiệu ứng chuyển">
        <span
          className="pts__thumb"
          style={{ transform: `translateX(${effectIdx * 100}%)` }}
          aria-hidden="true"
        />
        {EFFECTS.map((item) => {
          const active = item.id === activeEffect;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              data-active={active}
              className="pts__seg"
              onClick={() => {
                if (effect === undefined) setInternalEffect(item.id);
                onEffectChange?.(item.id);
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSwitch;
