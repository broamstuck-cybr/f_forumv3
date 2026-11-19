import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type { ChecksReport, CheckStatus } from '../../types/index';

export interface ChecksPanelProps {
  report: ChecksReport | null;
  onRunChecks: () => void;
  onSelectFile?: (path: string) => void;
}

function getStatusColors(status: CheckStatus): { bg: string; fg: string; label: string } {
  if (status === 'pass') {
    return {
      bg: 'rgba(52, 211, 153, 0.14)',
      fg: 'var(--accent-jade)',
      label: 'Pass',
    };
  }
  if (status === 'warn') {
    return {
      bg: 'rgba(245, 158, 11, 0.15)',
      fg: 'var(--accent-primary)',
      label: 'Warn',
    };
  }
  return {
    bg: 'rgba(224, 122, 56, 0.18)',
    fg: 'var(--accent-copper)',
    label: 'Fail',
  };
}

export const ChecksPanel: React.FC<ChecksPanelProps> = ({
  report,
  onRunChecks,
  onSelectFile,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-subtle)',
        }}
        className="rounded-xl border p-3 flex items-center justify-between gap-2 overflow-hidden"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {report?.overallStatus === 'fail' ? (
              <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-copper)' }} />
            ) : (
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-jade)' }} />
            )}
            <span style={{ color: 'var(--ink-primary)' }} className="text-xs font-semibold truncate">
              Kiểm định tự động (Static & DOM)
            </span>
          </div>
          {report ? (
            <p style={{ color: 'var(--ink-secondary)' }} className="text-[11px] mt-1 font-mono">
              {report.passCount} pass / {report.warnCount} warn / {report.failCount} fail
            </p>
          ) : (
            <p style={{ color: 'var(--ink-secondary)' }} className="text-[11px] mt-1">
              Chưa chạy kiểm định cho bản dựng hiện tại.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onRunChecks}
          style={{
            background: 'var(--accent-primary)',
            color: '#0b0d12',
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0"
        >
          <Play className="w-3.5 h-3.5" />
          Chạy lại
        </button>
      </div>

      {report && (
        <div className="flex flex-col gap-2">
          {report.results.map((item) => {
            const tone = getStatusColors(item.status);
            return (
              <article
                key={item.id}
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="rounded-xl border p-3 overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: tone.fg }} />
                    ) : item.status === 'warn' ? (
                      <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: tone.fg }} />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" style={{ color: tone.fg }} />
                    )}
                    <h4
                      style={{ color: 'var(--ink-primary)' }}
                      className="text-xs font-semibold truncate"
                    >
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span style={{ color: 'var(--ink-muted)' }} className="text-[10px] font-mono">
                      {item.durationMs}ms
                    </span>
                    <span
                      style={{ background: tone.bg, color: tone.fg }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    >
                      {tone.label}
                    </span>
                  </div>
                </div>

                <p style={{ color: 'var(--ink-secondary)' }} className="text-[11px] mt-1.5 leading-relaxed">
                  {item.summary}
                </p>

                {item.issues.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {item.issues.map((issue, idx) => (
                      <li
                        key={`${issue.ruleId}-${idx}`}
                        style={{
                          background: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                        }}
                        className="rounded-lg border px-2.5 py-1.5 text-[11px] flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectFile?.(issue.file)}
                            style={{ color: 'var(--accent-primary)' }}
                            className="font-mono text-left hover:underline"
                          >
                            {issue.file}
                            {issue.line ? `:${issue.line}` : ''}
                          </button>
                          <span style={{ color: 'var(--ink-muted)' }} className="font-mono text-[10px]">
                            {issue.ruleId}
                          </span>
                        </div>
                        <span style={{ color: 'var(--ink-primary)' }}>{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
