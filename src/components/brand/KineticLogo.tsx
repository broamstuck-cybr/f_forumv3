import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { AIActivityState } from '../../types/index';

export interface KineticLogoProps {
  size?: number;
  activity?: AIActivityState;
  showWordmark?: boolean;
  className?: string;
}

export const KineticLogo: React.FC<KineticLogoProps> = ({
  size = 28,
  activity = 'idle',
  showWordmark = false,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const reduced = Boolean(prefersReduced);

  const isThinking = activity === 'thinking';
  const isStreaming = activity === 'streaming';
  const isVerified = activity === 'verified';
  const isError = activity === 'error';

  const topColor = isError
    ? 'var(--accent-danger)'
    : isVerified
      ? 'var(--accent-jade)'
      : 'var(--accent-primary)';

  const midColor = isError
    ? 'var(--accent-copper)'
    : isStreaming
      ? 'var(--accent-verdigris)'
      : isVerified
        ? 'var(--accent-jade)'
        : 'var(--accent-verdigris)';

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="F-FORUM Kinetic Mark"
        className="shrink-0 overflow-visible"
        animate={
          reduced
            ? undefined
            : isThinking
              ? { scale: [1, 1.05, 1] }
              : isError
                ? { x: [0, -1.5, 1.5, 0] }
                : { scale: 1, x: 0 }
        }
        transition={
          isThinking
            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            : isError
              ? { duration: 0.35, ease: 'easeOut' }
              : { duration: 0.28, ease: 'easeOut' }
        }
      >
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          fill="var(--bg-surface)"
          stroke="var(--border-strong)"
          strokeWidth="1.2"
        />

        <motion.path
          d="M8 8.5L13.2 12.6V24.5L8 22V8.5Z"
          fill="var(--ink-primary)"
          initial={false}
          animate={
            reduced
              ? undefined
              : {
                  opacity: isThinking ? [0.75, 1, 0.75] : 1,
                }
          }
          transition={
            isThinking
              ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.25 }
          }
        />

        <motion.path
          d="M8 8.5L24.5 6.8L22.2 12.2L13.2 12.6L8 8.5Z"
          fill={topColor}
          initial={false}
          animate={
            reduced
              ? undefined
              : isStreaming
                ? { x: [0, 1.2, 0], opacity: [0.9, 1, 0.9] }
                : isThinking
                  ? { y: [0, -0.8, 0] }
                  : { x: 0, y: 0, opacity: 1 }
          }
          transition={
            isStreaming || isThinking
              ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.25 }
          }
        />

        <motion.path
          d="M14.4 15.2L22.6 14.3L20.8 18.9L14.4 19.4V15.2Z"
          fill={midColor}
          initial={false}
          animate={
            reduced
              ? undefined
              : isStreaming
                ? { scaleX: [0.85, 1.08, 0.85], opacity: [0.8, 1, 0.8] }
                : isVerified
                  ? { scale: [0.94, 1.06, 1] }
                  : { scaleX: 1, scale: 1, opacity: 1 }
          }
          style={{ transformOrigin: '14.4px 17px' }}
          transition={
            isStreaming
              ? { duration: 0.95, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3, ease: 'easeOut' }
          }
        />
      </motion.svg>

      {showWordmark && (
        <span
          className="font-semibold tracking-tight whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--ink-primary)',
            fontSize: `${Math.max(15, Math.round(size * 0.62))}px`,
          }}
        >
          F-FORUM
        </span>
      )}
    </span>
  );
};

export default KineticLogo;
