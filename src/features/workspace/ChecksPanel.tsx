import React from 'react';
import type { ChecksReport, CheckStatus, ProcessItem, ProcessStatus } from '../../types/index';
import { formatClock } from './time';

export interface ChecksPanelProps {
  report: ChecksReport | null;
  processes: ProcessItem[];
  onRunChecks: () => void;
  onSelectFile: (path: string) => void;
}

const STATUS_WORDS: Record<CheckStatus, string> = {
  pass: 'đạt',
  warn: 'cảnh báo',
  fail: 'lỗi',
};

const PROCESS_WORDS: Record<ProcessStatus, string> = {
  completed: 'xong',
  running: 'đang chạy',
  failed: 'lỗi',
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
          <p className="ws-count ws-checks-sum">
            <span data-on={report.passCount > 0} className="ws-add">
              {report.passCount} đạt
            </span>
            <span data-on={report.warnCount > 0} className="ws-warn">
              {report.warnCount} cảnh báo
            </span>
            <span data-on={report.failCount > 0} className="ws-del">
              {report.failCount} lỗi
            </span>
          </p>
        ) : (
          <p className="ws-checks-none">Chưa chạy kiểm tra.</p>
        )}
        <button type="button" className="btn btn-line btn-sm" onClick={onRunChecks}>
          {report ? 'Chạy lại' : 'Chạy'}
        </button>
      </div>

      {report && (
        <ol className="ws-pipe">
          {report.results.map((item) => (
            <li key={item.id} className="ws-pipe-step" data-status={item.status}>
              <span className="ws-pipe-status">{STATUS_WORDS[item.status]}</span>
              <div className="ws-pipe-body">
                <h3 className="ws-pipe-title">{item.title}</h3>
                {item.status !== 'pass' && <p className="ws-pipe-summary">{item.summary}</p>}
                {item.issues.length > 0 && (
                  <ul className="ws-issues">
                    {item.issues.map((issue, index) => (
                      <li key={`${issue.ruleId}-${index}`}>
                        <p className="ws-issue-where">
                          <button
                            type="button"
                            className="ws-filelink"
                            onClick={() => onSelectFile(issue.file)}
                          >
                            {issue.file}
                            {issue.line ? `:${issue.line}` : ''}
                          </button>
                          <span className="t-label">{issue.ruleId}</span>
                        </p>
                        <p>{issue.message}</p>
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

      {report && <p className="t-label ws-checks-ran">Chạy lúc {formatClock(report.ranAt)}</p>}

      {processes.length > 0 && (
        <details className="ws-log">
          <summary>
            Tiến trình <span className="ws-count">{processes.length}</span>
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
