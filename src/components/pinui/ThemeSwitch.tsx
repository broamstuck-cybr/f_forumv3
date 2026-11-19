import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';

export interface ThemeSwitchProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
  compact?: boolean;
  className?: string;
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({
  theme,
  onToggle,
  compact = false,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const isDark = theme === 'dark';

  const handleClick = () => {
    const next = isDark ? 'light' : 'dark';
    try {
      window.localStorage.setItem('fforum_theme', next);
    } catch {
      return onToggle();
    }
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-pressed={isDark}
      className={`pts-toggle ${compact ? 'w-9 px-0' : 'px-3'} ${className}`}
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
      {!compact && (
        <span className="text-[12.5px] font-medium whitespace-nowrap" style={{ color: 'var(--ink-secondary)' }}>
          {isDark ? 'Obsidian' : 'Stone'}
        </span>
      )}
    </button>
  );
};

export default ThemeSwitch;
