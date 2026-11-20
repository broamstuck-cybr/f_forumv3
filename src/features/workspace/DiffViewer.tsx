import React, { useEffect, useMemo, useState } from 'react';
import type { DiffEntry, WorkspaceFile } from '../../types/index';

export type DiffViewMode = 'unified' | 'split' | 'edit';

export interface DiffViewerProps {
  files: WorkspaceFile[];
  diffs: DiffEntry[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  initialMode?: DiffViewMode;
}

const VIEW_MODES: Array<{ id: DiffViewMode; label: string }> = [
  { id: 'unified', label: 'Gộp dòng' },
  { id: 'split', label: 'So sánh 2 cột' },
  { id: 'edit', label: 'Sửa mã' },
];

const STATUS_LABELS: Record<DiffEntry['status'], string> = {
  added: 'mới',
  modified: 'đã sửa',
  deleted: 'đã xóa',
  unchanged: 'nguyên bản',
};

export const DiffViewer: React.FC<DiffViewerProps> = ({
  files,
  diffs,
  activeFilePath,
  onSelectFile,
  onUpdateFile,
  initialMode = 'unified',
}) => {
  const [viewMode, setViewMode] = useState<DiffViewMode>(initialMode);
  const [collapseUnchanged, setCollapseUnchanged] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [hunkDecision, setHunkDecision] = useState<Record<string, 'accepted' | 'reverted'>>({});

  useEffect(() => {
    setViewMode(initialMode);
  }, [initialMode]);

  const activeFile = useMemo(
    () => files.find((file) => file.path === activeFilePath) || files[0] || null,
    [files, activeFilePath]
  );

  const activeDiff = useMemo(
    () => diffs.find((entry) => entry.path === (activeFile?.path || activeFilePath)) || diffs[0] || null,
    [diffs, activeFile, activeFilePath]
  );

  const handleCopyCode = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedPath(activeFile.path);
      window.setTimeout(() => setCopiedPath(null), 1600);
    } catch {
      return;
    }
  };

  const handleAcceptHunk = () => {
    if (!activeDiff) return;
    setHunkDecision((prev) => ({ ...prev, [activeDiff.path]: 'accepted' }));
  };

  const handleKeepOriginal = () => {
    if (!activeDiff) return;
    onUpdateFile(activeDiff.path, activeDiff.oldContent);
    setHunkDecision((prev) => ({ ...prev, [activeDiff.path]: 'reverted' }));
  };

  const visibleUnifiedLines = useMemo(() => {
    if (!activeDiff) return [];
    const lines = activeDiff.hunks[0]?.lines || [];
    if (!collapseUnchanged) return lines;
    return lines.filter((line, index, all) => {
      if (line.type !== 'context') return true;
      const nearBefore = all.slice(Math.max(0, index - 2), index).some((other) => other.type !== 'context');
      const nearAfter = all.slice(index + 1, index + 3).some((other) => other.type !== 'context');
      return nearBefore || nearAfter;
    });
  }, [activeDiff, collapseUnchanged]);

  const decision = activeDiff ? hunkDecision[activeDiff.path] : undefined;

  return (
    <div className="ws-dv">
      <nav className="ws-dv-files" aria-label="Danh sách tệp">
        <ul>
          {files.map((file) => {
            const entry = diffs.find((item) => item.path === file.path);
            return (
              <li key={file.path}>
                <button
                  type="button"
                  className="ws-row ws-dv-file"
                  aria-current={activeFile?.path === file.path ? 'true' : undefined}
                  onClick={() => onSelectFile(file.path)}
                >
                  <span className="ws-row-path">{file.path}</span>
                  {entry && entry.additions > 0 && <span className="ws-count ws-add">+{entry.additions}</span>}
                  {entry && entry.deletions > 0 && <span className="ws-count ws-del">−{entry.deletions}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="ws-dv-main" aria-label={activeFile?.path || 'Tệp'}>
        <div className="ws-dv-bar">
          <p className="ws-dv-path">
            <span className="ws-row-path">{activeFile?.path}</span>
            {activeDiff && <span className="t-label">{STATUS_LABELS[activeDiff.status]}</span>}
          </p>
          <div className="ws-seg" role="group" aria-label="Kiểu xem">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className="ws-seg-item"
                aria-pressed={viewMode === mode.id}
                onClick={() => setViewMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {viewMode !== 'edit' && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              aria-pressed={collapseUnchanged}
              onClick={() => setCollapseUnchanged((value) => !value)}
            >
              {collapseUnchanged ? 'Mở rộng' : 'Thu gọn'}
            </button>
          )}
          <button type="button" className="btn btn-line btn-sm" onClick={() => void handleCopyCode()}>
            {copiedPath === activeFile?.path ? 'Đã chép' : 'Chép mã'}
          </button>
        </div>

        {activeDiff && activeDiff.status !== 'unchanged' && viewMode !== 'edit' && (
          <div className="ws-dv-decide">
            <p>
              {decision === 'accepted'
                ? 'Đã chấp nhận thay đổi.'
                : decision === 'reverted'
                  ? 'Đã hoàn tác về bản trước.'
                  : 'Giữ thay đổi của tệp này?'}
            </p>
            <button type="button" className="btn btn-solid btn-sm" onClick={handleAcceptHunk}>
              Chấp nhận
            </button>
            <button type="button" className="btn btn-line btn-sm" onClick={handleKeepOriginal}>
              Hoàn tác
            </button>
          </div>
        )}

        <div className="ws-dv-code">
          {viewMode === 'edit' && activeFile ? (
            <textarea
              className="ws-dv-editor"
              aria-label={`Sửa ${activeFile.path}`}
              value={activeFile.content}
              onChange={(event) => onUpdateFile(activeFile.path, event.target.value)}
              spellCheck={false}
            />
          ) : viewMode === 'split' && activeDiff ? (
            <div className="ws-dv-split">
              {activeDiff.splitRows.map((row, index) => (
                <div key={index} className="ws-dv-pair">
                  <div className="ws-dv-half" data-type={row.leftType}>
                    <span className="ws-dv-num">{row.leftLineNumber ?? ''}</span>
                    <pre>{row.leftContent}</pre>
                  </div>
                  <div className="ws-dv-half" data-type={row.rightType}>
                    <span className="ws-dv-num">{row.rightLineNumber ?? ''}</span>
                    <pre>{row.rightContent}</pre>
                  </div>
                </div>
              ))}
            </div>
          ) : activeFile && activeDiff && visibleUnifiedLines.length > 0 ? (
            visibleUnifiedLines.map((line, index) => (
              <div key={index} className="ws-dv-line" data-type={line.type}>
                <span className="ws-dv-num">{line.oldLineNumber ?? ''}</span>
                <span className="ws-dv-num">{line.newLineNumber ?? ''}</span>
                <span className="ws-dv-sign">{line.type === 'add' ? '+' : line.type === 'del' ? '−' : ''}</span>
                <pre>{line.content}</pre>
              </div>
            ))
          ) : activeFile ? (
            activeFile.content.split(/\r?\n/).map((text, index) => (
              <div key={index} className="ws-dv-line ws-dv-plain">
                <span className="ws-dv-num">{index + 1}</span>
                <pre>{text}</pre>
              </div>
            ))
          ) : (
            <p className="ws-empty">Chưa có tệp trong phiên này.</p>
          )}
        </div>
      </section>
    </div>
  );
};
