import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, CheckCircle2, Clock, Loader2, ShieldAlert } from 'lucide-react';

export type TaskStatus = 'completed' | 'running' | 'waiting' | 'failed' | 'approval';

export interface TaskCardItem {
  id: string;
  label: string;
  status: TaskStatus;
  detail?: string;
}

export interface TaskCardProps {
  title: string;
  subtitle?: string;
  progressLabel?: string;
  tasks: TaskCardItem[];
  className?: string;
}

const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  completed: { label: 'Hoàn tất', color: 'var(--accent-jade)', bg: 'var(--accent-jade-soft)' },
  running: { label: 'Đang chạy', color: 'var(--accent-primary)', bg: 'var(--accent-soft)' },
  waiting: { label: 'Đang chờ', color: 'var(--ink-muted)', bg: 'var(--bg-panel)' },
  failed: { label: 'Thất bại', color: 'var(--accent-danger)', bg: 'var(--accent-danger-soft)' },
  approval: { label: 'Cần duyệt', color: 'var(--accent-verdigris)', bg: 'var(--accent-verdigris-soft)' },
};

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;
  if (status === 'failed') return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
  if (status === 'approval') return <ShieldAlert className="h-4 w-4" aria-hidden="true" />;
  return <Clock className="h-4 w-4" aria-hidden="true" />;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  title,
  subtitle,
  progressLabel,
  tasks,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const total = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <section className={`ptask-card ${className}`} aria-label={title}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[12px]" style={{ color: 'var(--ink-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-mono font-semibold"
          style={{
            background: pct === 100 ? 'var(--accent-jade-soft)' : 'var(--bg-panel)',
            color: pct === 100 ? 'var(--accent-jade)' : 'var(--ink-secondary)',
          }}
        >
          {progressLabel ?? `${completedCount}/${total}`}
        </span>
      </header>

      <div
        className="mt-3 h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: 'var(--bg-panel)' }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <motion.div
          className="h-full rounded-full origin-left"
          style={{ background: pct === 100 ? 'var(--accent-jade)' : 'var(--accent-primary)' }}
          initial={false}
          animate={{ scaleX: pct / 100 }}
          transition={reduced ? { duration: 0.01 } : { type: 'spring', stiffness: 260, damping: 28 }}
        />
      </div>

      <ul className="mt-4 m-0 p-0 list-none relative">
        {tasks.map((task, idx) => {
          const meta = STATUS_META[task.status];
          const isLast = idx === tasks.length - 1;
          return (
            <li key={task.id} className="relative pl-6 pb-3 last:pb-0">
              <span
                className="absolute left-[7px] top-0 w-[1.5px]"
                style={{
                  bottom: isLast ? '50%' : '0',
                  background: 'var(--border-strong)',
                }}
                aria-hidden="true"
              />
              <span
                className="absolute left-[7px] top-[11px] w-3 h-[1.5px]"
                style={{ background: 'var(--border-strong)' }}
                aria-hidden="true"
              />
              <div className="flex items-start justify-between gap-2 rounded-xl px-2.5 py-2" style={{ background: 'var(--bg-panel)' }}>
                <div className="flex items-start gap-2 min-w-0">
                  <span className="mt-0.5 shrink-0" style={{ color: meta.color }}>
                    <StatusIcon status={task.status} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium leading-snug" style={{ color: 'var(--ink-primary)' }}>
                      {task.label}
                    </div>
                    {task.detail && (
                      <div className="mt-0.5 text-[11px] leading-snug truncate" style={{ color: 'var(--ink-muted)' }}>
                        {task.detail}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-mono font-medium whitespace-nowrap"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default TaskCard;
