import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ToastItem } from '../../types/index';
import { useAppStore } from '../../store/appStore';

const ToastRow: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, 4600);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const accentVar =
    toast.type === 'success'
      ? 'var(--accent-jade)'
      : toast.type === 'warning'
        ? 'var(--accent-primary)'
        : toast.type === 'error'
          ? 'var(--accent-copper)'
          : 'var(--accent-verdigris)';

  const IconComponent =
    toast.type === 'success'
      ? CheckCircle2
      : toast.type === 'warning'
        ? AlertTriangle
        : toast.type === 'error'
          ? XCircle
          : Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      role="status"
      aria-live="polite"
      className="pointer-events-auto relative flex w-full max-w-[360px] items-start gap-3 overflow-hidden rounded-[16px] border px-4 py-3.5"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 88%, transparent)',
        borderColor: 'var(--border-strong)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 20px 44px -20px rgba(0, 0, 0, 0.6)',
      }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-0 w-[3px]"
        style={{ backgroundColor: accentVar }}
      />
      <IconComponent className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentVar }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
          {toast.title}
        </p>
        {toast.message ? (
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
            {toast.message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Đóng thông báo"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ color: 'var(--ink-muted)' }}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </motion.div>
  );
};

export const ToastStack: React.FC = () => {
  const { toasts, dismissToast } = useAppStore();

  return (
    <div
      aria-label="Thông báo hệ thống"
      className="pointer-events-none fixed right-4 bottom-4 z-[90] flex w-[calc(100%-2rem)] max-w-[360px] flex-col gap-2.5 sm:right-6 sm:bottom-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastRow key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
