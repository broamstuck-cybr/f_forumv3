import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  GitCompareArrows,
  Maximize2,
  Minimize2,
  Monitor,
  RotateCw,
  Share2,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { FileBox, type FileBoxTab } from '../../components/pinui/FileBox';
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
  onOpenPublish?: () => void;
  onCreateSnapshot: () => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  hidden?: boolean;
}

const VIEWPORT_CYCLE: PreviewViewport[] = [1440, 768, 390];

function getViewportMeta(viewport: PreviewViewport): {
  next: PreviewViewport;
  label: string;
  title: string;
} {
  const index = VIEWPORT_CYCLE.indexOf(viewport);
  const next = VIEWPORT_CYCLE[(index + 1) % VIEWPORT_CYCLE.length];
  if (viewport === 1440) {
    return {
      next,
      label: 'Đổi khung nhìn (hiện tại Desktop 1440px, kế tiếp Tablet 768px)',
      title: 'Khung nhìn: Desktop 1440px · Nhấn để chuyển Tablet 768px',
    };
  }
  if (viewport === 768) {
    return {
      next,
      label: 'Đổi khung nhìn (hiện tại Tablet 768px, kế tiếp Mobile 390px)',
      title: 'Khung nhìn: Tablet 768px · Nhấn để chuyển Mobile 390px',
    };
  }
  return {
    next,
    label: 'Đổi khung nhìn (hiện tại Mobile 390px, kế tiếp Desktop 1440px)',
    title: 'Khung nhìn: Mobile 390px · Nhấn để chuyển Desktop 1440px',
  };
}

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
  onOpenPublish,
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
      { id: 'preview', label: 'Xem' },
      { id: 'source', label: 'Mã', count: project.files.length },
      {
        id: 'review',
        label: 'Kiểm',
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

  const fileBoxTabs = useMemo<FileBoxTab[]>(
    () =>
      project.files.map((file) => ({
        id: file.path,
        label: file.path,
        meta: `${file.language.toUpperCase()} · ${file.content.split(/\r?\n/).length} dòng`,
      })),
    [project.files]
  );

  const lineCount = useMemo(
    () => (activeFile ? activeFile.content.split(/\r?\n/).length : 0),
    [activeFile]
  );

  const vpMeta = getViewportMeta(viewport);

  const handleCycleViewport = () => {
    onViewportChange(vpMeta.next);
    if (stageTab !== 'preview') {
      onStageTabChange('preview');
    }
  };

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

        <div className="ws-live-tools">
          <button
            type="button"
            className="ws-icon-pill"
            aria-label={vpMeta.label}
            title={vpMeta.title}
            data-viewport={viewport}
            onClick={handleCycleViewport}
          >
            {viewport === 1440 ? (
              <Monitor size={16} aria-hidden="true" />
            ) : viewport === 768 ? (
              <Tablet size={16} aria-hidden="true" />
            ) : (
              <Smartphone size={16} aria-hidden="true" />
            )}
          </button>
          <span className="ws-vp-readout" aria-hidden="true">
            {viewport}px
          </span>

          <button
            type="button"
            className="ws-icon-pill"
            aria-label="Làm mới khung xem trực tiếp"
            title="Làm mới"
            onClick={handleRefresh}
          >
            <RotateCw size={15} aria-hidden="true" />
          </button>

          {onOpenPublish && (
            <button
              type="button"
              className="ws-icon-pill"
              aria-label="Đăng bản dựng lên Tri thức"
              title="Đăng lên Tri thức"
              onClick={onOpenPublish}
            >
              <Share2 size={15} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            className="ws-icon-pill"
            aria-label={exporting ? 'Đang nén gói ZIP' : 'Tải gói ZIP'}
            title={exporting ? 'Đang nén gói ZIP...' : 'Tải ZIP'}
            disabled={exporting}
            onClick={onExportZip}
          >
            <Download size={15} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="ws-icon-pill"
            aria-label="Mở bản xem trước ở tab mới"
            title="Mở tab mới"
            onClick={openInTab}
          >
            <ExternalLink size={15} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="ws-icon-pill"
            aria-label={expanded ? 'Thu nhỏ khung kết quả' : 'Mở toàn màn hình'}
            title={expanded ? 'Thu nhỏ' : 'Toàn màn hình'}
            onClick={onToggleExpanded}
          >
            {expanded ? (
              <Minimize2 size={15} aria-hidden="true" />
            ) : (
              <Maximize2 size={15} aria-hidden="true" />
            )}
          </button>
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
            <div className="ws-source-layout">
              <aside className="ws-source-filebox" aria-label="Danh sách tệp mã nguồn">
                <FileBox
                  title="Tệp dự án"
                  tabs={fileBoxTabs}
                  activeId={activeFile?.path}
                  onSelect={onSelectFile}
                />
              </aside>

              <div className="ws-source-main">
                <div className="ws-source-bar">
                  <div className="ws-source-meta">
                    <span className="ws-source-filename">{activeFile?.path || 'Chưa chọn tệp'}</span>
                    {activeFile && (
                      <span className="t-label">
                        {lineCount} dòng · {activeFile.content.length} ký tự
                      </span>
                    )}
                  </div>

                  <div className="ws-source-actions">
                    <button
                      type="button"
                      className="ws-icon-pill"
                      aria-label={copiedFile === activeFile?.path ? 'Đã chép mã nguồn' : 'Chép mã nguồn'}
                      title={copiedFile === activeFile?.path ? 'Đã chép mã' : 'Chép mã nguồn'}
                      disabled={!activeFile}
                      data-active={copiedFile === activeFile?.path ? 'true' : undefined}
                      onClick={() => void handleCopySource()}
                    >
                      {copiedFile === activeFile?.path ? (
                        <Check size={15} aria-hidden="true" />
                      ) : (
                        <Copy size={15} aria-hidden="true" />
                      )}
                    </button>

                    <button
                      type="button"
                      className="ws-icon-pill"
                      aria-label="So sánh Diff"
                      title="So sánh Diff"
                      onClick={() => {
                        onReviewTabChange('diff');
                        onStageTabChange('review');
                      }}
                    >
                      <GitCompareArrows size={15} aria-hidden="true" />
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
            </div>
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
