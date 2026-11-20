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
  const reduced = Boolean(useReducedMotion());
  const busy = activity === 'thinking' || activity === 'streaming';
  const stroke = activity === 'verified' ? 'var(--green)' : 'var(--red)';
  const isError = activity === 'error';

  return (
    <span className={`inline-flex items-center gap-2 ${className}`} style={{ color: 'var(--fg)' }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M7 5h17v4.6H12v4.6h9.5v4.4H12V27H7V5Z" fill="currentColor" />
        {isError ? (
          <path d="M17 20.5l8 7M25 20.5l-8 7" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
        ) : (
          <motion.path
            d="M15.6 23.4l3.3 3.4 7.3-9.6"
            stroke={stroke}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={busy && !reduced ? { pathLength: [0.15, 1, 1], opacity: [0.5, 1, 1] } : { pathLength: 1, opacity: 1 }}
            transition={
              busy && !reduced
                ? { duration: activity === 'streaming' ? 0.9 : 1.5, repeat: Infinity, ease: [0.55, 0.1, 0.35, 1] }
                : { duration: 0.4 }
            }
          />
        )}
      </svg>
      {showWordmark && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: Math.round(size * 0.72),
            fontWeight: 560,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          F-Forum
        </span>
      )}
    </span>
  );
};

export default KineticLogo;
