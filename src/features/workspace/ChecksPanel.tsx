import React from 'react';
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

const STATUS_WORDS: Record<CheckStatus, string> = {
  pass: 'ĐẠT',
  warn: 'CẢNH BÁO',
  fail: 'LỖI',
};

const PROCESS_WORDS: Record<ProcessStatus, string> = {
  completed: 'xong',
  running: 'đang chạy',
  failed: 'lỗi',
};

const CATEGORY_TITLES: Record<CheckCategory, string> = {
  html_structure: '1. Cấu trúc tài liệu HTML5 (DOCTYPE, head, title, body)',
  js_syntax: '2. Cú pháp CSS & JavaScript (Parser runtime)',
  responsive_layout: '3. Khung nhìn Responsive (390px · 768px · 1440px)',
  internal_links: '4. Liên kết tài nguyên & Neo DOM nội bộ',
  secret_scan: '5. Quét rò rỉ khóa API & Chuỗi bí mật',
  accessibility: '6. Khả năng truy cập & Thẻ ngữ nghĩa (A11y)',
};

export const ChecksPanel: React.FC<ChecksPanelProps> = ({
  report,
  processes,
  onRunChecks,
  onSelectFile,
}) => {
  return (
    <div className="ws-checks">
      <div className="ws-checks-head">
        {report ? (
          <div className="ws-checks-meta">
            <p className="ws-count ws-checks-sum">
              <span data-on={report.passCount > 0} className="ws-add">
                {report.passCount}/6 đạt
              </span>
              <span data-on={report.warnCount > 0} className="ws-warn">
                {report.warnCount} cảnh báo
              </span>
              <span data-on={report.failCount > 0} className="ws-del">
                {report.failCount} lỗi
              </span>
            </p>
            <span className="t-label">Chạy lúc {formatClock(report.ranAt)}</span>
          </div>
        ) : (
          <p className="ws-checks-none">Chưa chạy kiểm định 6 lớp trên phiên này.</p>
        )}
        <button type="button" className="btn btn-line btn-sm" onClick={onRunChecks}>
          {report ? 'Kiểm định lại' : 'Chạy 6 kiểm định'}
        </button>
      </div>

      {report && (
        <ol className="ws-pipe" aria-label="6 lớp kiểm định tự động">
          {report.results.map((item) => (
            <li key={item.id} className="ws-pipe-step" data-status={item.status}>
              <span className="ws-pipe-status">{STATUS_WORDS[item.status]}</span>
              <div className="ws-pipe-body">
                <h3 className="ws-pipe-title">
                  {CATEGORY_TITLES[item.category] || item.title}
                </h3>
                <p className="ws-pipe-summary">{item.summary}</p>
                {item.issues.length > 0 && (
                  <ul className="ws-issues">
                    {item.issues.map((issue, index) => (
                      <li key={`${issue.ruleId}-${index}`} className="ws-issue-card">
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
                )}
              </div>
              <span className="t-label">{item.durationMs}ms</span>
            </li>
          ))}
        </ol>
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
