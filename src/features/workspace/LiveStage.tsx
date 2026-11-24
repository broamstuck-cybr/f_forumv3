import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  GitCompareArrows,
  Globe,
  Maximize2,
  Minimize2,
  RotateCw,
  Share2,
  ShieldCheck,
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
  hasArtifact?: boolean;
  hidden?: boolean;
}

const VIEWPORT_OPTIONS: Array<{ value: PreviewViewport; badge: string; label: string }> = [
  { value: 'fit', badge: 'Fit', label: 'Tràn khung 100%' },
  { value: 1440, badge: '1440', label: 'Desktop 1440px' },
  { value: 768, badge: '768', label: 'Tablet 768px' },
  { value: 390, badge: '390', label: 'Mobile 390px' },
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
  onOpenPublish,
  onCreateSnapshot,
  onRestoreSnapshot,
  expanded,
  onToggleExpanded,
  compact = false,
  onEnterSplit,
  onExitSplit,
  hasArtifact = true,
  hidden = false,
}) => {
  const [reloadNonce, setReloadNonce] = useState(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [compactTab, setCompactTab] = useState<'diff' | 'checks'>('diff');

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

  const handlePickViewport = (next: PreviewViewport) => {
    onViewportChange(next);
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

  const checkCount = project.checksReport ? project.checksReport.passCount : 0;
  const totalCheckCount = project.checksReport ? project.checksReport.results.length : 6;

  if (compact) {
    return (
      <aside className="ws-compact-aside" aria-label="Bảng trạng thái bản dựng" hidden={hidden}>
        <div className="ws-compact-card">
          <div className="ws-compact-head">
            <div className="ws-compact-tabs" role="tablist" aria-label="Chuyển Đối chiếu hoặc Kiểm định">
              <button
                type="button"
                role="tab"
                aria-selected={compactTab === 'diff'}
                className="ws-compact-tab"
                onClick={() => setCompactTab('diff')}
              >
                <span>Đối chiếu</span>
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
                <span>Kiểm định</span>
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
              title="Mở khung xem trực tiếp chia đôi màn hình"
            >
              <Globe size={14} className="ws-compact-globe" aria-hidden="true" />
              <span className="ws-compact-preview-name">Xem trực tiếp · {project.name}</span>
            </button>
            <button
              type="button"
              className="ws-compact-refresh"
              aria-label="Làm mới và mở xem trực tiếp"
              title="Làm mới khung xem trực tiếp"
              onClick={() => {
                handleRefresh();
                onEnterSplit?.('preview');
              }}
            >
              <RotateCw size={12} aria-hidden="true" />
            </button>
          </div>

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
                <span>Xem mọi thay đổi</span>
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
                <span>Mở bảng kiểm định chi tiết</span>
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          {onOpenPublish && (
            <button
              type="button"
              className="ws-compact-all-btn"
              onClick={onOpenPublish}
            >
              <span>Đăng lên Tri thức</span>
              <Share2 size={13} aria-hidden="true" />
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <section
      className="ws-live"
      aria-label="Không gian hiển thị & Mã nguồn"
      hidden={hidden}
    >
      <header className="ws-head ws-arena-stage-bar">
        <div className="ws-arena-stage-tabs" role="tablist" aria-label="Chế độ xem bản dựng">
          <button
            type="button"
            role="tab"
            aria-selected={stageTab === 'preview'}
            className="ws-arena-tab"
            data-active={stageTab === 'preview' ? 'true' : undefined}
            onClick={() => onStageTabChange('preview')}
            title="Live View — Xem trực tiếp bản dựng"
          >
            <Eye size={13} aria-hidden="true" />
            <span>Live View</span>
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
            <span>Mã nguồn</span>
            <span className="ws-arena-tab-count">{project.files.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={stageTab === 'review'}
            className="ws-arena-tab"
            data-active={stageTab === 'review' ? 'true' : undefined}
            onClick={() => onStageTabChange('review')}
            title="Đối chiếu & Kiểm định 6 lớp"
          >
            <ShieldCheck size={13} aria-hidden="true" />
            <span>Kiểm định &amp; Diff</span>
            <span className="ws-arena-diff-stat">
              <span className="ws-add">+{totals.added}</span>
              <span className="ws-del">−{totals.removed}</span>
            </span>
            <span className="ws-arena-tab-count">{checkCount}/{totalCheckCount}</span>
          </button>
        </div>

        <div className="ws-arena-stage-tools">
          <div className="ws-vp-pills" role="group" aria-label="Khung nhìn xem trước">
            {VIEWPORT_OPTIONS.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                className="ws-vp-pill"
                aria-pressed={viewport === option.value}
                aria-label={option.label}
                title={option.label}
                onClick={() => handlePickViewport(option.value)}
              >
                {option.badge}
              </button>
            ))}
          </div>

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
              className="ws-stage-action-pill ws-stage-action-pill--accent"
              aria-label="Đăng bản dựng lên Tri thức"
              title="Đăng lên Tri thức"
              onClick={onOpenPublish}
            >
              <Share2 size={13} aria-hidden="true" />
              <span>Đăng Tri thức</span>
            </button>
          )}

          <button
            type="button"
            className="ws-stage-action-pill"
            aria-label={exporting ? 'Đang nén gói ZIP' : 'Xuất gói ZIP'}
            title={exporting ? 'Đang nén gói ZIP...' : 'Xuất ZIP'}
            disabled={exporting}
            onClick={onExportZip}
          >
            <Download size={13} aria-hidden="true" />
            <span>{exporting ? 'Đang nén...' : 'Export ZIP'}</span>
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
          (hasArtifact ? (
            <LivePreviewFrame
              files={project.files}
              title={project.name}
              viewport={viewport}
              reloadNonce={reloadNonce}
            />
          ) : (
            <div className="ws-stage-empty" role="status">
              <Globe size={28} aria-hidden="true" />
              <h3>Chưa có bản dựng web trong phiên này</h3>
              <p>
                Nhập mô tả giao diện ở khung chat để Agent sinh mã nguồn HTML/CSS/JS. Khung Xem trực tiếp sẽ tự động mở ngay khi tệp web được tạo.
              </p>
            </div>
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
