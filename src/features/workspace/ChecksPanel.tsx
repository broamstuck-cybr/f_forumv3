import React, { useMemo } from 'react';
import { IconAlertTriangle, IconRotateCw, IconTrash2 } from '../../ui/icons';
import { TaskCard, type TaskCardItem, type TaskStatus } from '../../components/pinui/TaskCard';
import type {
  CheckCategory,
  ChecksReport,
  CheckStatus,
  ProcessItem,
  ProcessStatus,
} from '../../types/index';
import type { PreviewRuntimeError } from './LivePreviewFrame';
import { formatClock } from './time';

export interface ChecksPanelProps {
  report: ChecksReport | null;
  processes: ProcessItem[];
  onRunChecks: () => void;
  onSelectFile: (path: string) => void;
  runtimeErrors?: PreviewRuntimeError[];
  onClearRuntimeErrors?: () => void;
}

const PROCESS_WORDS: Record<ProcessStatus, string> = {
  completed: 'xong',
  running: 'đang chạy',
  failed: 'lỗi',
};

const CATEGORY_TITLES: Record<CheckCategory, string> = {
  html_structure: '1. Cấu trúc HTML5',
  js_syntax: '2. Cú pháp CSS & JS',
  responsive_layout: '3. Khung nhìn Responsive',
  internal_links: '4. Liên kết & Neo DOM',
  secret_scan: '5. Quét Bảo mật & Bí mật',
  accessibility: '6. Truy cập A11y',
};

function mapCheckToTaskStatus(status: CheckStatus): TaskStatus {
  if (status === 'pass') return 'completed';
  if (status === 'warn') return 'approval';
  return 'failed';
}

export const ChecksPanel: React.FC<ChecksPanelProps> = ({
  report,
  processes,
  onRunChecks,
  onSelectFile,
  runtimeErrors = [],
  onClearRuntimeErrors,
}) => {
  const taskItems = useMemo<TaskCardItem[]>(() => {
    if (!report) return [];
    return report.results.map((item) => ({
      id: item.id,
      label: CATEGORY_TITLES[item.category] || item.title,
      status: mapCheckToTaskStatus(item.status),
      detail: `${item.summary} · ${item.durationMs}ms`,
    }));
  }, [report]);

  const allIssues = useMemo(() => {
    if (!report) return [];
    return report.results.flatMap((item) =>
      item.issues.map((issue, index) => ({
        key: `${item.id}-${issue.ruleId}-${index}`,
        checkTitle: CATEGORY_TITLES[item.category] || item.title,
        issue,
      }))
    );
  }, [report]);

  return (
    <div className="ws-checks">
      <div className="ws-checks-head">
        {report ? (
          <div className="ws-checks-meta">
            <p className="ws-count ws-checks-sum">
              <span data-on={report.passCount > 0} className="ws-add">
                {report.passCount} đạt,
              </span>
              <span data-on={report.warnCount > 0} className="ws-warn">
                {report.warnCount} cảnh báo,
              </span>
              <span data-on={report.failCount > 0} className="ws-del">
                {report.failCount} lỗi
              </span>
            </p>
            <span className="t-label">{formatClock(report.ranAt)}</span>
          </div>
        ) : (
          <p className="ws-checks-none">Chưa chạy kiểm định 6 lớp trên phiên này.</p>
        )}
        <button
          type="button"
          className="ws-icon-pill"
          aria-label={report ? 'Chạy lại kiểm định 6 lớp' : 'Chạy kiểm định 6 lớp'}
          title={report ? 'Chạy lại' : 'Chạy kiểm định'}
          onClick={onRunChecks}
        >
          <IconRotateCw size={15} />
        </button>
      </div>

      {runtimeErrors.length > 0 && (
        <section className="ws-runtime-panel" aria-label="Lỗi Runtime Live View">
          <div className="ws-runtime-head">
            <span className="ws-runtime-title">
              <IconAlertTriangle size={14} />
              <span>Lỗi Runtime ({runtimeErrors.length})</span>
            </span>
            {onClearRuntimeErrors && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClearRuntimeErrors}
              >
                <IconTrash2 size={13} />
                <span>Xóa log</span>
              </button>
            )}
          </div>
          <ul className="ws-runtime-list">
            {runtimeErrors.map((err) => (
              <li key={err.id} className="ws-runtime-item">
                <div className="ws-runtime-meta">
                  <span className="ws-runtime-kind">{err.kind}</span>
                  <span className="t-label">
                    {err.line ? `Dòng ${err.line}${err.column ? `:${err.column}` : ''} · ` : ''}
                    {formatClock(err.timestamp)}
                  </span>
                </div>
                <p className="ws-runtime-msg">{err.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report ? (
        <div className="ws-checks-body">
          <TaskCard
            className="ws-checks-taskcard"
            title="Kiểm định chất lượng 6 lớp"
            subtitle={`Cập nhật lúc ${formatClock(report.ranAt)}`}
            progressLabel={`${report.passCount}/${report.results.length} đạt`}
            tasks={taskItems}
          />

          {allIssues.length > 0 && (
            <section className="ws-issues-panel" aria-label="Chi tiết cảnh báo và lỗi">
              <p className="t-label">Chi tiết cần xử lý ({allIssues.length})</p>
              <ul className="ws-issues">
                {allIssues.map(({ key, issue }) => (
                  <li key={key} className="ws-issue-card">
                    <div className="ws-issue-where">
                      <button
                        type="button"
                        className="ws-filelink"
                        onClick={() => onSelectFile(issue.file)}
                      >
                        {issue.file}
                        {issue.line ? `:${issue.line}` : ''}
                      </button>
                      <span className="t-label">{issue.ruleId}</span>
                    </div>
                    <p className="ws-issue-msg">{issue.message}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="ws-checks-empty">
          <button
            type="button"
            className="btn btn-line btn-sm"
            aria-label="Chạy kiểm định 6 lớp"
            onClick={onRunChecks}
          >
            Chạy kiểm định
          </button>
        </div>
      )}

      {processes.length > 0 && (
        <details className="ws-log">
          <summary>
            Nhật ký tiến trình <span className="ws-count">{processes.length}</span>
          </summary>
          <ul>
            {processes.map((process) => (
              <li key={process.id} data-status={process.status}>
                <p className="ws-log-name">{process.name}</p>
                <p className="t-label">
                  <span className="ws-log-status">{PROCESS_WORDS[process.status]}</span>
                  <span>{process.detail}</span>
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};
