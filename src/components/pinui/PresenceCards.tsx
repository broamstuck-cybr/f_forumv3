import React, { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

export interface PresenceMember {
  name: string;
  role: string;
  status?: string;
}

export interface PresenceCardsProps {
  title: string;
  subtitle?: string;
  members: PresenceMember[];
  children?: ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

const TAG_COLORS = [
  'var(--accent-primary)',
  'var(--accent-verdigris)',
  'var(--accent-jade)',
  'var(--accent-copper)',
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const PresenceCards: React.FC<PresenceCardsProps> = ({
  title,
  subtitle,
  members,
  children,
  onAction,
  actionLabel = 'Cập nhật hồ sơ',
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-[20px] border overflow-hidden ${className}`}
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-panel)' }}
      >
        <div className="min-w-0">
          <h3 className="text-[15.5px] font-semibold leading-snug" style={{ color: 'var(--ink-primary)' }}>
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[12.5px]" style={{ color: 'var(--ink-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m, idx) => (
              <span
                key={`${m.name}-${idx}`}
                title={`${m.name} (${m.role})`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-mono font-bold border-2"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: TAG_COLORS[idx % TAG_COLORS.length],
                  color: 'var(--ink-primary)',
                }}
              >
                {initialsOf(m.name)}
              </span>
            ))}
          </div>
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold cursor-pointer transition-colors"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
                border: '1px solid var(--border-accent)',
              }}
            >
              <span>{actionLabel}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {members.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {members.map((m, idx) => (
              <div
                key={`${m.name}-${m.role}-${idx}`}
                className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[12px]"
                style={{
                  borderColor: 'var(--border-subtle)',
                  background: 'var(--bg-panel)',
                }}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: TAG_COLORS[idx % TAG_COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="font-medium" style={{ color: 'var(--ink-primary)' }}>
                  {m.name}
                </span>
                <span style={{ color: 'var(--ink-muted)' }}>{m.role}</span>
                {m.status && (
                  <span className="font-mono text-[10.5px]" style={{ color: 'var(--accent-verdigris)' }}>
                    {m.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </motion.article>
  );
};

export default PresenceCards;
