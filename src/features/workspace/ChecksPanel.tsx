import React, { useMemo } from 'react';
import { RotateCw } from 'lucide-react';
import { TaskCard, type TaskCardItem, type TaskStatus } from '../../components/pinui/TaskCard';
import type {
  CheckCategory,
  ChecksReport,
  CheckStatus,
  ProcessItem,
  ProcessStatus,
} from '../../types/index';
import { formatClock } from './time';

export interface ChecksPanelProps {
  report: ChecksReport | null;
  processes: ProcessItem[];
  onRunChecks: () => void;
  onSelectFile: (path: string) => void;
}

const PROCESS_WORDS: Record<ProcessStatus, string> = {
  completed: 'xong',
  running: 'đang chạy',
  failed: 'lỗi',
};

const CATEGORY_TITLES: Record<CheckCategory, string> = {
  html_structure: '1. Cấu trúc tài liệu HTML5',
  js_syntax: '2. Cú pháp CSS & JavaScript',
  responsive_layout: '3. Khung nhìn 390 · 768 · 1440px',
  internal_links: '4. Liên kết tài nguyên & Neo DOM',
  secret_scan: '5. Quét rò rỉ khóa API & Bí mật',
  accessibility: '6. Truy cập & Ngữ nghĩa A11y',
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
          title={report ? 'Chạy lại kiểm định 6 lớp' : 'Chạy kiểm định 6 lớp'}
          onClick={onRunChecks}
        >
          <RotateCw size={15} aria-hidden="true" />
        </button>
      </div>

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
          <button type="button" className="btn btn-line btn-sm" onClick={onRunChecks}>
            Chạy kiểm định 6 lớp
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
