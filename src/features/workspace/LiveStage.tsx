import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  GitCompareArrows,
  Maximize2,
  Minimize2,
  Monitor,
  RotateCw,
  Share2,
  ShieldCheck,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { FileBox, type FileBoxTab } from '../../components/pinui/FileBox';
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

const VIEWPORT_CYCLE: PreviewViewport[] = ['fit', 1440, 768, 390];

function getViewportMeta(viewport: PreviewViewport): {
  next: PreviewViewport;
  badge: string;
  label: string;
  title: string;
} {
  const index = VIEWPORT_CYCLE.indexOf(viewport);
  const next = VIEWPORT_CYCLE[(index + 1) % VIEWPORT_CYCLE.length];
  if (viewport === 'fit') {
    return {
      next,
      badge: 'Fit',
      label: 'Chế độ tràn khung (Fit 100%, nhấn chuyển Desktop 1440px)',
      title: 'Tràn khung 100% · Nhấn test 1440px',
    };
  }
  if (viewport === 1440) {
    return {
      next,
      badge: '1440',
      label: 'Đổi khung nhìn (hiện tại Desktop 1440px, kế tiếp Tablet 768px)',
      title: 'Desktop 1440px · Nhấn chuyển 768px',
    };
  }
  if (viewport === 768) {
    return {
      next,
      badge: '768',
      label: 'Đổi khung nhìn (hiện tại Tablet 768px, kế tiếp Mobile 390px)',
      title: 'Tablet 768px · Nhấn chuyển 390px',
    };
  }
  return {
    next,
    badge: '390',
    label: 'Đổi khung nhìn (hiện tại Mobile 390px, kế tiếp Tràn khung Fit)',
    title: 'Mobile 390px · Nhấn chuyển tràn khung',
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

  const checkCount = project.checksReport ? project.checksReport.passCount : 6;

  return (
    <section
      className="ws-live"
      aria-label="Không gian hiển thị & Mã nguồn Arena"
      hidden={hidden}
    >
      <header className="ws-head ws-arena-stage-bar">
        <div className="ws-arena-stage-tabs" role="tablist" aria-label="Chế độ xem Arena">
          <button
            type="button"
            role="tab"
            aria-selected={stageTab === 'preview'}
            className="ws-arena-tab"
            data-active={stageTab === 'preview' ? 'true' : undefined}
            onClick={() => onStageTabChange('preview')}
            title="Xem trực tiếp bản dựng"
          >
            <span className="ws-live-dot" aria-hidden="true" />
            <Eye size={13} aria-hidden="true" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={stageTab === 'source'}
            className="ws-arena-tab"
            data-active={stageTab === 'source' ? 'true' : undefined}
            onClick={() => onStageTabChange('source')}
            title={`Mã nguồn (${project.files.length} tệp)`}
          >
            <FileCode2 size={13} aria-hidden="true" />
            <span>Code</span>
            <span className="ws-arena-tab-count">{project.files.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={stageTab === 'review'}
            className="ws-arena-tab"
            data-active={stageTab === 'review' ? 'true' : undefined}
            onClick={() => onStageTabChange('review')}
            title="Diff & Kiểm định 6 lớp"
          >
            <ShieldCheck size={13} aria-hidden="true" />
            <span>Diff</span>
            <span className="ws-arena-diff-stat">
              <span className="ws-add">+{totals.added}</span>
              <span className="ws-del">−{totals.removed}</span>
            </span>
            <span className="ws-arena-tab-count">{checkCount}/6</span>
          </button>
        </div>

        <div className="ws-arena-url-pill" aria-hidden="true">
          <span>/</span>
        </div>

        <div className="ws-arena-stage-tools">
          <button
            type="button"
            className="ws-stage-vp-btn"
            aria-label={vpMeta.label}
            title={vpMeta.title}
            onClick={handleCycleViewport}
          >
            {viewport === 768 ? (
              <Tablet size={13} aria-hidden="true" />
            ) : viewport === 390 ? (
              <Smartphone size={13} aria-hidden="true" />
            ) : (
              <Monitor size={13} aria-hidden="true" />
            )}
            <span>{vpMeta.badge}</span>
          </button>

          <button
            type="button"
            className="ws-icon-pill ws-icon-pill--sm"
            aria-label="Làm mới khung xem trực tiếp"
            title="Làm mới"
            onClick={handleRefresh}
          >
            <RotateCw size={14} aria-hidden="true" />
          </button>

          {onOpenPublish && (
            <button
              type="button"
              className="ws-icon-pill ws-icon-pill--sm"
              aria-label="Đăng bản dựng lên Tri thức"
              title="Đăng lên Tri thức"
              onClick={onOpenPublish}
            >
              <Share2 size={14} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            className="ws-icon-pill ws-icon-pill--sm"
            aria-label={exporting ? 'Đang nén gói ZIP' : 'Tải gói ZIP'}
            title={exporting ? 'Đang nén gói ZIP...' : 'Tải ZIP'}
            disabled={exporting}
            onClick={onExportZip}
          >
            <Download size={14} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="ws-icon-pill ws-icon-pill--sm"
            aria-label="Mở bản xem trước ở tab mới"
            title="Mở tab mới"
            onClick={openInTab}
          >
            <ExternalLink size={14} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="ws-icon-pill ws-icon-pill--sm"
            aria-label={expanded ? 'Thu nhỏ khung kết quả' : 'Mở toàn màn hình'}
            title={expanded ? 'Thu nhỏ' : 'Toàn màn hình'}
            onClick={onToggleExpanded}
          >
            {expanded ? (
              <Minimize2 size={14} aria-hidden="true" />
            ) : (
              <Maximize2 size={14} aria-hidden="true" />
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
                      className="ws-icon-pill ws-icon-pill--sm"
                      aria-label={copiedFile === activeFile?.path ? 'Đã chép mã nguồn' : 'Chép mã nguồn'}
                      title={copiedFile === activeFile?.path ? 'Đã chép mã' : 'Chép mã nguồn'}
                      disabled={!activeFile}
                      data-active={copiedFile === activeFile?.path ? 'true' : undefined}
                      onClick={() => void handleCopySource()}
                    >
                      {copiedFile === activeFile?.path ? (
                        <Check size={14} aria-hidden="true" />
                      ) : (
                        <Copy size={14} aria-hidden="true" />
                      )}
                    </button>

                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--sm"
                      aria-label="So sánh Diff"
                      title="So sánh Diff"
                      onClick={() => {
                        onReviewTabChange('diff');
                        onStageTabChange('review');
                      }}
                    >
                      <GitCompareArrows size={14} aria-hidden="true" />
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
