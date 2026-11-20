import React, { useId, useMemo } from 'react';
import type { WorkspaceProject } from '../../types/index';
import { ChecksPanel } from './ChecksPanel';
import type { DiffViewMode } from './DiffViewer';

export type ReviewTab = 'diff' | 'check' | 'files';

interface ReviewZoneProps {
  project: WorkspaceProject;
  totals: { added: number; removed: number };
  tab: ReviewTab;
  onTabChange: (tab: ReviewTab) => void;
  onOpenViewer: (path: string | null, mode: DiffViewMode) => void;
  onRunChecks: () => void;
  actions: React.ReactNode;
  hidden: boolean;
}

const TAB_ORDER: ReviewTab[] = ['diff', 'check', 'files'];

export const ReviewZone: React.FC<ReviewZoneProps> = ({
  project,
  totals,
  tab,
  onTabChange,
  onOpenViewer,
  onRunChecks,
  actions,
  hidden,
}) => {
  const baseId = useId();
  const report = project.checksReport;

  const changed = useMemo(
    () => project.diffs.filter((entry) => entry.status !== 'unchanged'),
    [project.diffs]
  );

  const handleTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : TAB_ORDER.length - 1;
    const next = TAB_ORDER[(TAB_ORDER.indexOf(tab) + step) % TAB_ORDER.length];
    onTabChange(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  const tabProps = (id: ReviewTab) => ({
    id: `${baseId}-tab-${id}`,
    type: 'button' as const,
    role: 'tab',
    className: 'ws-tab',
    'data-tab': id,
    'aria-selected': tab === id,
    'aria-controls': `${baseId}-panel`,
    tabIndex: tab === id ? 0 : -1,
    onClick: () => onTabChange(id),
  });

  return (
    <aside className="ws-review" aria-label="Diff & Check" hidden={hidden}>
      <header className="ws-head">
        <h2 className="ws-head-title">Diff &amp; Check</h2>
        {actions}
      </header>

      <div className="ws-tabs" role="tablist" aria-label="Diff & Check" onKeyDown={handleTabKey}>
        <button {...tabProps('diff')}>
          Diff
          <span className="ws-count ws-add">+{totals.added}</span>
          <span className="ws-count ws-del">−{totals.removed}</span>
        </button>
        <button {...tabProps('check')}>
          Check
          {report ? (
            <>
              <span
                className={report.passCount === report.results.length ? 'ws-count ws-add' : 'ws-count'}
              >
                {report.passCount}/{report.results.length}
              </span>
              {report.failCount > 0 && <span className="ws-count ws-del">{report.failCount} lỗi</span>}
            </>
          ) : (
            <span className="ws-count">chưa chạy</span>
          )}
        </button>
        <button {...tabProps('files')}>
          Tệp
          <span className="ws-count">{project.files.length}</span>
        </button>
      </div>

      <div
        id={`${baseId}-panel`}
        className="ws-panel"
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${tab}`}
        tabIndex={-1}
      >
        {tab === 'diff' && (
          <>
            {changed.length === 0 ? (
              <p className="ws-empty">Chưa có thay đổi. Gửi yêu cầu hoặc sửa một tệp để thấy khác biệt.</p>
            ) : (
              <ul className="ws-rows">
                {changed.map((entry) => (
                  <li key={entry.path}>
                    <button
                      type="button"
                      className="ws-row"
                      onClick={() => onOpenViewer(entry.path, 'unified')}
                    >
                      <span className="ws-row-path">{entry.path}</span>
                      <span className="ws-count ws-add">+{entry.additions}</span>
                      <span className="ws-count ws-del">−{entry.deletions}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="ws-more" onClick={() => onOpenViewer(null, 'unified')}>
              <span className="link">Xem tất cả</span>
            </button>
          </>
        )}

        {tab === 'check' && (
          <ChecksPanel
            report={report}
            processes={project.processes}
            onRunChecks={onRunChecks}
            onSelectFile={(path) => onOpenViewer(path, 'edit')}
          />
        )}

        {tab === 'files' && (
          <ul className="ws-rows">
            {project.files.map((file) => (
              <li key={file.path}>
                <button type="button" className="ws-row" onClick={() => onOpenViewer(file.path, 'edit')}>
                  <span className="ws-row-path">{file.path}</span>
                  <span className="t-label">{file.language}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};
