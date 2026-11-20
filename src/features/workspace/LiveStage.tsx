import React, { useMemo, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { LiquidTabs, type LiquidTabItem } from '../../components/pinui/LiquidTabs';
import type { WorkspaceProject } from '../../types/index';
import {
  buildStandalonePreviewDoc,
  LivePreviewFrame,
  type PreviewViewport,
} from './LivePreviewFrame';
import { ReviewZone, type ReviewTab } from './ReviewZone';

export type StageTabId = 'preview' | 'source' | 'review';

export interface LiveStageProps {
  project: WorkspaceProject;
  totals: { added: number; removed: number };
  stageTab: StageTabId;
  onStageTabChange: (tab: StageTabId) => void;
  reviewTab: ReviewTab;
  onReviewTabChange: (tab: ReviewTab) => void;
  viewport: PreviewViewport;
  onViewportChange: (viewport: PreviewViewport) => void;
  onSelectFile: (path: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  onRunChecks: () => void;
  onExportZip: () => void;
  exporting: boolean;
  onCreateSnapshot: () => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  hidden?: boolean;
}

const VIEWPORT_ITEMS: Array<{ value: PreviewViewport; label: string }> = [
  { value: 1440, label: 'Desktop' },
  { value: 768, label: '768px' },
  { value: 390, label: '390px' },
];

export const LiveStage: React.FC<LiveStageProps> = ({
  project,
  totals,
  stageTab,
  onStageTabChange,
  reviewTab,
  onReviewTabChange,
  viewport,
  onViewportChange,
  onSelectFile,
  onUpdateFile,
  onRunChecks,
  onExportZip,
  exporting,
  onCreateSnapshot,
  onRestoreSnapshot,
  expanded,
  onToggleExpanded,
  hidden = false,
}) => {
  const [reloadNonce, setReloadNonce] = useState(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const stageTabs = useMemo<LiquidTabItem[]>(
    () => [
      { id: 'preview', label: 'Xem trực tiếp' },
      { id: 'source', label: 'Mã nguồn', count: project.files.length },
      {
        id: 'review',
        label: 'Diff & Check',
        count: project.checksReport ? project.checksReport.passCount : 6,
      },
    ],
    [project.files.length, project.checksReport]
  );

  const activeFile = useMemo(
    () =>
      project.files.find((file) => file.path === project.activeFilePath) ||
      project.files[0] ||
      null,
    [project.files, project.activeFilePath]
  );

  const lineCount = useMemo(
    () => (activeFile ? activeFile.content.split(/\r?\n/).length : 0),
    [activeFile]
  );

  const handleRefresh = () => {
    setReloadNonce((value) => value + 1);
  };

  const openInTab = () => {
    const url = URL.createObjectURL(
      new Blob([buildStandalonePreviewDoc(project.files, project.name)], { type: 'text/html' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const handleCopySource = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedFile(activeFile.path);
      window.setTimeout(() => setCopiedFile(null), 1600);
    } catch {
      return;
    }
  };

  return (
    <section
      className="ws-live"
      aria-label="Không gian hiển thị & Mã nguồn"
      hidden={hidden}
    >
      <header className="ws-head ws-live-bar">
        <div className="ws-live-tabs">
          <LiquidTabs
            tabs={stageTabs}
            activeId={stageTab}
            onChange={(id) => onStageTabChange(id as StageTabId)}
            ariaLabel="Chế độ khung kết quả"
          />
        </div>

        <div className="ws-live-controls">
          <div className="ws-vp-group" role="group" aria-label="Khổ màn hình">
            {VIEWPORT_ITEMS.map((item) => (
              <button
                key={item.value}
                type="button"
                className="ws-vp-btn"
                aria-pressed={viewport === item.value}
                onClick={() => {
                  onViewportChange(item.value);
                  if (stageTab !== 'preview') onStageTabChange('preview');
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="ws-live-tools">
            <button
              type="button"
              className="btn btn-line btn-sm"
              onClick={handleRefresh}
            >
              Làm mới
            </button>
            <button
              type="button"
              className="btn btn-line btn-sm"
              disabled={exporting}
              onClick={onExportZip}
            >
              {exporting ? 'Đang nén' : 'Tải ZIP'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={openInTab}
            >
              Mở tab
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={expanded ? 'Thu nhỏ' : 'Toàn màn hình'}
              title={expanded ? 'Thu nhỏ' : 'Toàn màn hình'}
              onClick={onToggleExpanded}
            >
              {expanded ? (
                <Minimize2 size={17} aria-hidden="true" />
              ) : (
                <Maximize2 size={17} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="ws-stage-body">
        {stageTab === 'preview' && (
          <LivePreviewFrame
            files={project.files}
            title={project.name}
            viewport={viewport}
            reloadNonce={reloadNonce}
          />
        )}

        {stageTab === 'source' && (
          <div className="ws-source">
            <div className="ws-source-bar">
              <div className="ws-source-files" role="tablist" aria-label="Tệp mã nguồn">
                {project.files.map((file) => {
                  const isActive = activeFile?.path === file.path;
                  return (
                    <button
                      key={file.path}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className="ws-source-file-tab"
                      data-active={isActive ? 'true' : undefined}
                      onClick={() => onSelectFile(file.path)}
                    >
                      <span>{file.path}</span>
                      <span className="ws-source-lang">{file.language}</span>
                    </button>
                  );
                })}
              </div>

              <div className="ws-source-actions">
                {activeFile && (
                  <span className="t-label">
                    {lineCount} dòng · {activeFile.content.length} ký tự
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  onClick={() => void handleCopySource()}
                >
                  {copiedFile === activeFile?.path ? 'Đã chép' : 'Chép mã'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    onReviewTabChange('diff');
                    onStageTabChange('review');
                  }}
                >
                  So sánh Diff
                </button>
              </div>
            </div>

            {activeFile ? (
              <div className="ws-source-editor-wrap">
                <div className="ws-source-gutter" aria-hidden="true">
                  {Array.from({ length: lineCount }, (_, index) => (
                    <span key={index + 1}>{index + 1}</span>
                  ))}
                </div>
                <textarea
                  className="ws-source-editor"
                  aria-label={`Trình sửa mã ${activeFile.path}`}
                  value={activeFile.content}
                  onChange={(event) => onUpdateFile(activeFile.path, event.target.value)}
                  spellCheck={false}
                />
              </div>
            ) : (
              <p className="ws-empty">Chưa có tệp mã nguồn nào trong phiên này.</p>
            )}
          </div>
        )}

        {stageTab === 'review' && (
          <ReviewZone
            project={project}
            totals={totals}
            tab={reviewTab}
            onTabChange={onReviewTabChange}
            onSelectFile={onSelectFile}
            onUpdateFile={onUpdateFile}
            onRunChecks={onRunChecks}
            onCreateSnapshot={onCreateSnapshot}
            onRestoreSnapshot={onRestoreSnapshot}
          />
        )}
      </div>
    </section>
  );
};
