import React, { useState } from 'react';
import type { WorkspaceProject } from '../../types/index';
import { ChecksPanel } from './ChecksPanel';
import { DiffViewer, type DiffViewMode } from './DiffViewer';
import { formatStamp } from './time';

export type ReviewTab = 'diff' | 'check' | 'files';

export interface ReviewZoneProps {
  project: WorkspaceProject;
  totals: { added: number; removed: number };
  tab: ReviewTab;
  onTabChange: (tab: ReviewTab) => void;
  onSelectFile: (path: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  onRunChecks: () => void;
  onCreateSnapshot?: () => void;
  onRestoreSnapshot?: (snapshotId: string) => void;
}

export const ReviewZone: React.FC<ReviewZoneProps> = ({
  project,
  totals,
  tab,
  onTabChange,
  onSelectFile,
  onUpdateFile,
  onRunChecks,
  onCreateSnapshot,
  onRestoreSnapshot,
}) => {
  const [diffMode, setDiffMode] = useState<DiffViewMode>('unified');
  const report = project.checksReport;

  const openFileInEditor = (path: string) => {
    onSelectFile(path);
    setDiffMode('edit');
    onTabChange('diff');
  };

  return (
    <div className="ws-review" aria-label="Diff & Check">
      <div className="ws-review-subbar">
        <div className="ws-seg" role="tablist" aria-label="Chế độ kiểm tra">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'check'}
            className="ws-seg-item"
            aria-pressed={tab === 'check'}
            onClick={() => onTabChange('check')}
          >
            Kiểm định 6 lớp ({report ? `${report.passCount}/${report.results.length}` : '0/6'})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'diff'}
            className="ws-seg-item"
            aria-pressed={tab === 'diff'}
            onClick={() => {
              setDiffMode('unified');
              onTabChange('diff');
            }}
          >
            Diff (+{totals.added} / −{totals.removed})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'files'}
            className="ws-seg-item"
            aria-pressed={tab === 'files'}
            onClick={() => onTabChange('files')}
          >
            Mốc lưu ({project.snapshots.length})
          </button>
        </div>

        <div className="ws-review-actions">
          {onCreateSnapshot && (
            <button type="button" className="btn btn-line btn-sm" onClick={onCreateSnapshot}>
              Lưu mốc
            </button>
          )}
          <button type="button" className="btn btn-line btn-sm" onClick={onRunChecks}>
            Chạy kiểm định
          </button>
        </div>
      </div>

      <div className="ws-review-body">
        {tab === 'check' && (
          <ChecksPanel
            report={report}
            processes={project.processes}
            onRunChecks={onRunChecks}
            onSelectFile={openFileInEditor}
          />
        )}

        {tab === 'diff' && (
          <DiffViewer
            files={project.files}
            diffs={project.diffs}
            activeFilePath={project.activeFilePath}
            onSelectFile={onSelectFile}
            onUpdateFile={onUpdateFile}
            initialMode={diffMode}
          />
        )}

        {tab === 'files' && (
          <div className="ws-snaps-panel">
            <div className="ws-snaps-head">
              <span>Lịch sử mốc lưu dự án</span>
              <span className="ws-count">{project.snapshots.length} mốc</span>
            </div>
            {project.snapshots.length === 0 ? (
              <p className="ws-empty">Chưa có mốc lưu nào cho phiên này.</p>
            ) : (
              <ul className="ws-snaps-list">
                {project.snapshots.map((snapshot) => (
                  <li key={snapshot.id} className="ws-snap-row">
                    <div className="ws-snap-info">
                      <span className="ws-snap-name">{snapshot.label}</span>
                      <time className="t-label" dateTime={snapshot.createdAt}>
                        {formatStamp(snapshot.createdAt)} · {snapshot.files.length} tệp
                      </time>
                    </div>
                    {onRestoreSnapshot && (
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => onRestoreSnapshot(snapshot.id)}
                      >
                        Khôi phục
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
