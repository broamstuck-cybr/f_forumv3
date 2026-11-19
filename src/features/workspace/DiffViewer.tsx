import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { DiffEntry, WorkspaceFile } from '../../types/index';

export interface DiffViewerProps {
  files: WorkspaceFile[];
  diffs: DiffEntry[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  initialMode?: 'unified' | 'split' | 'edit';
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  files,
  diffs,
  activeFilePath,
  onSelectFile,
  onUpdateFile,
  initialMode = 'unified',
}) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split' | 'edit'>(initialMode);
  const [collapseUnchanged, setCollapseUnchanged] = useState(false);
  const [treeExpanded, setTreeExpanded] = useState(true);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [hunkDecision, setHunkDecision] = useState<Record<string, 'accepted' | 'reverted'>>({});

  const activeFile = useMemo(
    () => files.find((f) => f.path === activeFilePath) || files[0] || null,
    [files, activeFilePath]
  );

  const activeDiff = useMemo(
    () =>
      diffs.find((d) => d.path === (activeFile?.path || activeFilePath)) ||
      diffs[0] ||
      null,
    [diffs, activeFile, activeFilePath]
  );

  const totalAdditions = useMemo(
    () => diffs.reduce((sum, d) => sum + d.additions, 0),
    [diffs]
  );
  const totalDeletions = useMemo(
    () => diffs.reduce((sum, d) => sum + d.deletions, 0),
    [diffs]
  );

  const handleCopyCode = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedPath(activeFile.path);
      setTimeout(() => setCopiedPath(null), 1600);
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
    return lines.filter((l, idx, arr) => {
      if (l.type !== 'context') return true;
      const nearBefore = arr.slice(Math.max(0, idx - 2), idx).some((x) => x.type !== 'context');
      const nearAfter = arr.slice(idx + 1, idx + 3).some((x) => x.type !== 'context');
      return nearBefore || nearAfter;
    });
  }, [activeDiff, collapseUnchanged]);

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--ink-primary)',
      }}
      className="flex flex-col lg:grid lg:grid-cols-[220px_minmax(0,1fr)] h-full min-h-[420px] rounded-2xl border overflow-hidden"
    >
      <aside
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-subtle)',
        }}
        className="border-b lg:border-b-0 lg:border-r p-3 flex flex-col gap-2 min-w-0"
      >
        <div className="flex items-center justify-between gap-2 py-1">
          <button
            type="button"
            onClick={() => setTreeExpanded((v) => !v)}
            aria-label={treeExpanded ? 'Thu gọn danh sách tệp' : 'Mở rộng danh sách tệp'}
            title={treeExpanded ? 'Thu gọn' : 'Mở rộng'}
            className="p-0.5 rounded cursor-pointer"
            style={{ color: 'var(--ink-secondary)' }}
          >
            {treeExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
          <span className="text-xs font-semibold flex-1 truncate" style={{ color: 'var(--ink-primary)' }}>
            Tệp ({files.length})
          </span>
          <span className="font-mono text-[11px] shrink-0" style={{ color: 'var(--ink-secondary)' }}>
            +{totalAdditions} -{totalDeletions}
          </span>
        </div>

        {treeExpanded && (
          <ul className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto pb-1 lg:pb-0">
            {files.map((file) => {
              const entry = diffs.find((d) => d.path === file.path);
              const isSelected = activeFile?.path === file.path;
              return (
                <li key={file.path} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectFile(file.path)}
                    style={{
                      background: isSelected ? 'var(--bg-surface)' : 'transparent',
                      borderColor: isSelected ? 'var(--border-strong)' : 'transparent',
                      color: isSelected ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg border flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <span className="font-mono truncate">{file.path}</span>
                    {entry && (entry.additions > 0 || entry.deletions > 0) && (
                      <span className="font-mono text-[10px] shrink-0 flex items-center gap-1">
                        {entry.additions > 0 && (
                          <span style={{ color: 'var(--accent-jade)' }}>+{entry.additions}</span>
                        )}
                        {entry.deletions > 0 && (
                          <span style={{ color: 'var(--accent-copper)' }}>-{entry.deletions}</span>
                        )}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <div className="flex flex-col min-w-0 min-h-0 flex-1">
        <div
          style={{
            background: 'var(--bg-panel)',
            borderColor: 'var(--border-subtle)',
          }}
          className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-semibold truncate">
              {activeFile?.path || 'index.html'}
            </span>
            {activeDiff && (
              <span
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-secondary)',
                }}
                className="text-[11px] font-mono px-2 py-0.5 rounded-full border shrink-0"
              >
                {activeDiff.status} (+{activeDiff.additions} / -{activeDiff.deletions})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              aria-pressed={viewMode === 'unified'}
              style={{
                background: viewMode === 'unified' ? 'var(--bg-surface)' : 'transparent',
                borderColor: viewMode === 'unified' ? 'var(--border-strong)' : 'var(--border-subtle)',
                color: viewMode === 'unified' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
              }}
              className="px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer"
            >
              Gộp
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              aria-pressed={viewMode === 'split'}
              style={{
                background: viewMode === 'split' ? 'var(--bg-surface)' : 'transparent',
                borderColor: viewMode === 'split' ? 'var(--border-strong)' : 'var(--border-subtle)',
                color: viewMode === 'split' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
              }}
              className="px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer"
            >
              Tách
            </button>
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              aria-pressed={viewMode === 'edit'}
              style={{
                background: viewMode === 'edit' ? 'var(--bg-surface)' : 'transparent',
                borderColor: viewMode === 'edit' ? 'var(--border-strong)' : 'var(--border-subtle)',
                color: viewMode === 'edit' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
              }}
              className="px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer"
            >
              Sửa
            </button>
            {viewMode !== 'edit' && (
              <button
                type="button"
                onClick={() => setCollapseUnchanged((v) => !v)}
                aria-pressed={collapseUnchanged}
                style={{
                  background: collapseUnchanged ? 'var(--bg-surface)' : 'transparent',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-secondary)',
                }}
                className="px-2.5 py-1 rounded-lg border text-xs cursor-pointer"
              >
                {collapseUnchanged ? 'Mở rộng' : 'Thu gọn'}
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleCopyCode()}
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: copiedPath === activeFile?.path ? 'var(--accent-jade)' : 'var(--ink-primary)',
              }}
              className="px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer"
            >
              {copiedPath === activeFile?.path ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>
        </div>

        {activeDiff && activeDiff.status !== 'unchanged' && viewMode !== 'edit' && (
          <div
            style={{
              background: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
            }}
            className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap shrink-0"
          >
            <span className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
              {hunkDecision[activeDiff.path] === 'accepted'
                ? 'Đã xác nhận thay đổi cho tệp này.'
                : hunkDecision[activeDiff.path] === 'reverted'
                  ? 'Đã khôi phục nguyên bản.'
                  : 'Xác nhận thay đổi cho tệp đang chọn:'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptHunk}
                style={{
                  background: 'var(--accent-primary)',
                  color: 'var(--ink-inverse)',
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Chấp nhận
              </button>
              <button
                type="button"
                onClick={handleKeepOriginal}
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--ink-primary)',
                }}
                className="px-2.5 py-1 rounded-lg border text-xs cursor-pointer"
              >
                Hoàn tác
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-auto">
          {viewMode === 'edit' && activeFile ? (
            <textarea
              aria-label={`Edit ${activeFile.path}`}
              value={activeFile.content}
              onChange={(e) => onUpdateFile(activeFile.path, e.target.value)}
              spellCheck={false}
              style={{
                background: 'var(--bg-canvas)',
                color: 'var(--ink-primary)',
              }}
              className="w-full h-full min-h-[340px] p-4 font-mono text-xs leading-relaxed border-0 outline-none resize-none"
            />
          ) : viewMode === 'split' && activeDiff ? (
            <div className="min-w-[540px] font-mono text-xs">
              {activeDiff.splitRows.map((row, idx) => (
                <div
                  key={idx}
                  style={{ borderColor: 'var(--border-subtle)' }}
                  className="grid grid-cols-2 border-b last:border-b-0"
                >
                  <div
                    style={{
                      background:
                        row.leftType === 'del'
                          ? 'rgba(224, 122, 56, 0.14)'
                          : 'transparent',
                      borderColor: 'var(--border-subtle)',
                    }}
                    className="grid grid-cols-[36px_minmax(0,1fr)] border-r px-2 py-0.5"
                  >
                    <span style={{ color: 'var(--ink-muted)' }} className="select-none text-right pr-2">
                      {row.leftLineNumber ?? ''}
                    </span>
                    <pre className="whitespace-pre-wrap break-all m-0">{row.leftContent}</pre>
                  </div>
                  <div
                    style={{
                      background:
                        row.rightType === 'add'
                          ? 'rgba(52, 211, 153, 0.12)'
                          : 'transparent',
                    }}
                    className="grid grid-cols-[36px_minmax(0,1fr)] px-2 py-0.5"
                  >
                    <span style={{ color: 'var(--ink-muted)' }} className="select-none text-right pr-2">
                      {row.rightLineNumber ?? ''}
                    </span>
                    <pre className="whitespace-pre-wrap break-all m-0">{row.rightContent}</pre>
                  </div>
                </div>
              ))}
            </div>
          ) : activeFile ? (
            <div className="font-mono text-xs">
              {activeDiff && visibleUnifiedLines.length > 0 ? (
                visibleUnifiedLines.map((line, idx) => (
                  <div
                    key={idx}
                    style={{
                      background:
                        line.type === 'add'
                          ? 'rgba(52, 211, 153, 0.12)'
                          : line.type === 'del'
                            ? 'rgba(224, 122, 56, 0.14)'
                            : 'transparent',
                    }}
                    className="grid grid-cols-[40px_40px_18px_minmax(0,1fr)] px-2 py-0.5 leading-relaxed"
                  >
                    <span style={{ color: 'var(--ink-muted)' }} className="select-none text-right pr-2">
                      {line.oldLineNumber ?? ''}
                    </span>
                    <span style={{ color: 'var(--ink-muted)' }} className="select-none text-right pr-2">
                      {line.newLineNumber ?? ''}
                    </span>
                    <span
                      style={{
                        color:
                          line.type === 'add'
                            ? 'var(--accent-jade)'
                            : line.type === 'del'
                              ? 'var(--accent-copper)'
                              : 'var(--ink-muted)',
                      }}
                      className="select-none font-bold"
                    >
                      {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
                    </span>
                    <pre className="whitespace-pre-wrap break-all m-0">{line.content}</pre>
                  </div>
                ))
              ) : (
                activeFile.content.split(/\r?\n/).map((text, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[44px_minmax(0,1fr)] px-2 py-0.5 leading-relaxed"
                  >
                    <span style={{ color: 'var(--ink-muted)' }} className="select-none text-right pr-3">
                      {idx + 1}
                    </span>
                    <pre className="whitespace-pre-wrap break-all m-0">{text}</pre>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
