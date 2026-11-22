import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  GitBranch,
  GitCompareArrows,
  Globe,
  Maximize2,
  Minimize2,
  Monitor,
  Plus,
  RotateCw,
  Share2,
  ShieldCheck,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react';
import { FileBox, type FileBoxTab } from '../../components/pinui/FileBox';
import type { WorkspaceProject } from '../../types/index';
import {
  buildStandalonePreviewDoc,
  LivePreviewFrame,
  type PreviewViewport,
} from './LivePreviewFrame';
import { ReviewZone, type ReviewTab } from './ReviewZone';
import { PreviewWaiting } from './PreviewWaiting';
import { hasGeneratedWebCode } from './LivePreviewFrame';

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
  compact?: boolean;
  onEnterSplit?: (tab: StageTabId, subReview?: ReviewTab) => void;
  onExitSplit?: () => void;
  onOpenGithub?: () => void;
  hidden?: boolean;
  generating?: boolean;
  onInsertPrompt?: (prompt: string) => void;
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
      badge: 'Máy tính',
      label: 'Đang xem ở khung máy tính. Bấm để chuyển sang khung máy tính bảng.',
      title: 'Khung máy tính · Bấm để thu về máy tính bảng',
    };
  }
  if (viewport === 768) {
    return {
      next,
      badge: 'Máy tính bảng',
      label: 'Đang xem ở khung máy tính bảng. Bấm để chuyển sang khung điện thoại.',
      title: 'Khung máy tính bảng · Bấm để thu về điện thoại',
    };
  }
  return {
    next,
    badge: 'Điện thoại',
    label: 'Đang xem ở khung điện thoại. Bấm để mở rộng hết khung.',
    title: 'Khung điện thoại · Bấm để mở rộng',
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
  compact = false,
  onEnterSplit,
  onExitSplit,
  onOpenGithub,
  hidden = false,
  generating = false,
  onInsertPrompt,
}) => {
  const [reloadNonce, setReloadNonce] = useState(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [compactTab, setCompactTab] = useState<'diff' | 'checks'>('diff');
  const [processesOpen, setProcessesOpen] = useState(false);

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
  const totalCheckCount = project.checksReport ? project.checksReport.results.length : 6;

  if (compact) {
    return (
      <aside className="ws-compact-aside" aria-label="Bảng trạng thái Workspace" hidden={hidden}>
        <div className="ws-compact-card">
          <div className="ws-compact-head">
            <div className="ws-compact-tabs" role="tablist" aria-label="Chuyển Diff hoặc Checks">
              <button
                type="button"
                role="tab"
                aria-selected={compactTab === 'diff'}
                className="ws-compact-tab"
                onClick={() => setCompactTab('diff')}
              >
                <span>Diff</span>
                <span className="ws-arena-diff-stat">
                  <span className="ws-add">+{totals.added}</span>
                  <span className="ws-del">−{totals.removed}</span>
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={compactTab === 'checks'}
                className="ws-compact-tab"
                onClick={() => setCompactTab('checks')}
              >
                <span>Checks</span>
                <span className="ws-arena-tab-count">
                  {checkCount}/{totalCheckCount}
                </span>
              </button>
            </div>
            <button
              type="button"
              className="ws-compact-dl"
              aria-label={exporting ? 'Đang nén ZIP' : 'Tải ZIP dự án'}
              title={exporting ? 'Đang nén ZIP...' : 'Tải gói ZIP'}
              disabled={exporting}
              onClick={onExportZip}
            >
              <Download size={13} aria-hidden="true" />
            </button>
          </div>

          <div className="ws-compact-preview-row">
            <button
              type="button"
              className="ws-compact-preview-trigger"
              onClick={() => onEnterSplit?.('preview')}
              title="Mở Live Preview chia đôi màn hình (60%)"
            >
              <Globe size={14} className="ws-compact-globe" aria-hidden="true" />
              <span className="ws-compact-preview-name">{project.name} preview</span>
              <span className="ws-compact-preview-state">· Live</span>
            </button>
            <button
              type="button"
              className="ws-compact-refresh"
              aria-label="Làm mới và mở Preview"
              title="Khởi động lại Preview"
              onClick={() => {
                handleRefresh();
                onEnterSplit?.('preview');
              }}
            >
              <RotateCw size={12} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className="ws-compact-proc-btn"
            aria-expanded={processesOpen}
            onClick={() => setProcessesOpen((v) => !v)}
          >
            {processesOpen ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
            <span>Processes</span>
            <span className="ws-compact-proc-badge">1</span>
          </button>

          {processesOpen && (
            <button
              type="button"
              className="ws-compact-proc-item"
              onClick={() => onEnterSplit?.('preview')}
            >
              <span className="ws-live-dot" aria-hidden="true" />
              <span className="ws-compact-proc-label">Sandbox Preview · Fit</span>
            </button>
          )}

          {compactTab === 'diff' ? (
            <>
              <ul className="ws-compact-files" aria-label="Tệp trong phiên">
                {project.files.map((file) => {
                  const diffEntry = project.diffs.find((d) => d.path === file.path);
                  const adds = diffEntry?.additions ?? file.content.split(/\r?\n/).length;
                  const dels = diffEntry?.deletions ?? 0;
                  return (
                    <li key={file.path}>
                      <button
                        type="button"
                        className="ws-compact-file-row"
                        onClick={() => {
                          onSelectFile(file.path);
                          onEnterSplit?.('source');
                        }}
                      >
                        <span className="ws-compact-file-name">{file.path}</span>
                        <span className="ws-arena-diff-stat">
                          <span className="ws-add">+{adds}</span>
                          {dels > 0 && <span className="ws-del">−{dels}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="ws-compact-all-btn"
                onClick={() => onEnterSplit?.('review', 'diff')}
              >
                <span>View all changes</span>
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </>
          ) : (
            <div className="ws-compact-checks">
              <div className="ws-compact-check-stat">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>
                  {checkCount}/{totalCheckCount} phép kiểm đạt chuẩn
                </span>
              </div>
              <button
                type="button"
                className="ws-compact-all-btn"
                onClick={() => onEnterSplit?.('review', 'check')}
              >
                <span>Mở bảng Checks chi tiết</span>
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="ws-connectors-card">
          <div className="ws-connectors-head">
            <span>Connectors</span>
            <button
              type="button"
              className="ws-compact-dl"
              aria-label="Kết nối GitHub"
              title="Kết nối GitHub"
              onClick={onOpenGithub}
            >
              <Plus size={13} aria-hidden="true" />
            </button>
          </div>
          <button type="button" className="ws-connector-row" onClick={onOpenGithub}>
            <GitBranch size={14} aria-hidden="true" />
            <span>GitHub</span>
          </button>
          {onOpenPublish && (
            <button type="button" className="ws-connector-row" onClick={onOpenPublish}>
              <Share2 size={14} aria-hidden="true" />
              <span>Đăng Tri thức</span>
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <section
      className="ws-live"
      aria-label="Không gian hiển thị và mã nguồn"
      hidden={hidden}
    >
      <header className="ws-head ws-arena-stage-bar">
        <div className="ws-arena-stage-tabs" role="tablist" aria-label="Chế độ xem Workspace">
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

          {onExitSplit && (
            <button
              type="button"
              className="ws-icon-pill ws-icon-pill--sm"
              aria-label="Đóng chia đôi để về thẻ gọn"
              title="Đóng Split-Pane"
              onClick={onExitSplit}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      <div className="ws-stage-body">
        {stageTab === 'preview' &&
          (hasGeneratedWebCode(project.files) ? (
            <LivePreviewFrame
              files={project.files}
              title={project.name}
              viewport={viewport}
              reloadNonce={reloadNonce}
            />
          ) : (
            <PreviewWaiting
              generating={generating}
              projectName={project.name}
              onInsertPrompt={onInsertPrompt}
            />
          ))}

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
