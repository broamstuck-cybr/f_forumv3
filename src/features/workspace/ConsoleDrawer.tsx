import React from 'react';

export interface ConsoleLogEntry {
  id: string;
  level: 'error' | 'warn' | 'info';
  source: 'runtime' | 'bundler';
  message: string;
  file?: string;
  line?: number;
  timestamp: number;
}

export interface ConsoleDrawerProps {
  entries: ConsoleLogEntry[];
  open: boolean;
  projectMode: 'html' | 'react-tsx';
  fileCount: number;
  busy?: boolean;
  onToggle: () => void;
  onClear: () => void;
  onJumpToFile?: (filePath: string) => void;
  onFixErrors?: (errorSummary: string) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export const ConsoleDrawer: React.FC<ConsoleDrawerProps> = ({
  entries,
  open,
  projectMode,
  fileCount,
  busy = false,
  onToggle,
  onClear,
  onJumpToFile,
  onFixErrors,
}) => {
  const errorEntries = entries.filter((e) => e.level === 'error');
  const errorCount = errorEntries.length;
  const warnCount = entries.filter((e) => e.level === 'warn').length;
  const infoCount = entries.filter((e) => e.level === 'info').length;

  const handleTriggerFix = () => {
    if (!onFixErrors || errorEntries.length === 0 || busy) return;
    const summary = errorEntries
      .slice(0, 6)
      .map((e) => {
        const loc = e.file ? `[${e.file}${e.line ? `:${e.line}` : ''}] ` : '';
        return `- ${loc}${e.message}`;
      })
      .join('\n');
    onFixErrors(summary);
  };

  return (
    <div className={`ws-console${open ? ' is-open' : ''}`} aria-label="Bảng điều khiển và chẩn đoán">
      <div className="ws-console__bar">
        <button
          type="button"
          className="ws-console__toggle"
          onClick={onToggle}
          aria-expanded={open}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`ws-console__chev${open ? ' is-open' : ''}`}
            aria-hidden="true"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
          <span className="ws-console__label">Console</span>
          <span className="ws-console__modeTag">
            {projectMode === 'react-tsx' ? 'React TSX' : 'HTML'} · {fileCount} tệp
          </span>
        </button>

        <div className="ws-console__badges">
          {errorCount > 0 && onFixErrors && (
            <button
              type="button"
              className="ws-console__fixBtn"
              disabled={busy}
              onClick={handleTriggerFix}
              title="Gửi lỗi này cho AI tự sửa trực tiếp"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              <span>AI sửa lỗi</span>
            </button>
          )}

          <button
            type="button"
            className={`ws-console__stat${errorCount > 0 ? ' is-error' : ''}`}
            onClick={onToggle}
            aria-label={`${errorCount} lỗi`}
            title="Lỗi runtime & biên dịch"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
            <span>{errorCount}</span>
          </button>

          <button
            type="button"
            className={`ws-console__stat${warnCount > 0 ? ' is-warn' : ''}`}
            onClick={onToggle}
            aria-label={`${warnCount} cảnh báo`}
            title="Cảnh báo"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{warnCount}</span>
          </button>

          <button
            type="button"
            className="ws-console__stat is-info"
            onClick={onToggle}
            aria-label={`${infoCount} thông tin`}
            title="Nhật ký console"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{infoCount}</span>
          </button>

          {open && entries.length > 0 && (
            <button
              type="button"
              className="ws-console__clearBtn"
              onClick={onClear}
              aria-label="Xóa nhật ký console"
              title="Xóa log"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="ws-console__body" role="log" aria-live="polite">
          {entries.length === 0 ? (
            <div className="ws-console__empty">
              Chưa có lỗi hay nhật ký chạy thử. Mọi console.log, cảnh báo hoặc lỗi runtime từ bản xem trước sẽ hiển thị tại đây.
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className={`ws-console__row is-${entry.level}`}>
                <span className="ws-console__time">{formatTime(entry.timestamp)}</span>
                <span className={`ws-console__lvl is-${entry.level}`}>
                  {entry.level === 'error' ? 'ERR' : entry.level === 'warn' ? 'WARN' : 'LOG'}
                </span>
                <span className="ws-console__msg">{entry.message}</span>
                {entry.file && onJumpToFile && (
                  <button
                    type="button"
                    className="ws-console__fileLink"
                    onClick={() => onJumpToFile(entry.file!)}
                  >
                    {entry.file}
                    {entry.line ? `:${entry.line}` : ''}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
