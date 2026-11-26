import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconFileCode2,
  IconGitCompareArrows,
  IconGlobe,
  IconMaximize2,
  IconMinimize2,
  IconPlus,
  IconRotateCw,
  IconSearch,
  IconShare2,
  IconShieldCheck,
  IconTrash2,
  IconX,
} from '../../ui/icons';
import { FileBox, type FileBoxTab } from '../../components/pinui/FileBox';
import { sanitizeFilesForZipExport } from '../../services/secretScanner';
import type { WorkspaceProject } from '../../types/index';
import {
  buildStandalonePreviewDoc,
  compileWorkspaceSrcDoc,
  LivePreviewFrame,
  type PreviewRuntimeError,
  type PreviewViewport,
} from './LivePreviewFrame';
import { Popover } from './Popover';
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
  onDeleteFile?: (path: string) => void;
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
  isGenerating?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  onNotify?: (toast: { type?: 'info' | 'success' | 'warning' | 'error'; title: string; message?: string }) => void;
  hidden?: boolean;
}

const VIEWPORT_OPTIONS: Array<{ value: PreviewViewport; badge: string; label: string }> = [
  { value: 'fit', badge: 'Fit', label: 'Tràn khung' },
  { value: 1440, badge: '1440', label: 'Desktop 1440px' },
  { value: 768, badge: '768', label: 'Tablet 768px' },
  { value: 390, badge: '390', label: 'Mobile 390px' },
];

const VALID_FILE_PATH = /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,63}$/;

function countLines(text: string): number {
  if (!text) return 1;
  let lines = 1;
  let idx = text.indexOf('\n');
  while (idx !== -1) {
    lines += 1;
    idx = text.indexOf('\n', idx + 1);
  }
  return lines;
}

function starterTemplateFor(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    return '<!DOCTYPE html>\n<html lang="vi">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Trang mới</title>\n</head>\n<body>\n  <main></main>\n</body>\n</html>\n';
  }
  if (lower.endsWith('.css')) {
    return ':root {\n  --surface-gap: 16px;\n}\n';
  }
  if (lower.endsWith('.json')) {
    return '{\n  "name": "workspace-module"\n}\n';
  }
  if (lower.endsWith('.md')) {
    return '# Tài liệu mới\n';
  }
  if (lower.endsWith('.txt')) {
    return 'Ghi chú mới\n';
  }
  if (lower.endsWith('.tsx') || lower.endsWith('.jsx')) {
    return 'export function Component() {\n  return null;\n}\n';
  }
  if (lower.endsWith('.ts')) {
    return 'export function init(): boolean {\n  return true;\n}\n';
  }
  return 'function init() {\n  return true;\n}\n';
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CodeLineGutter: React.FC<{ lineCount: number }> = React.memo(({ lineCount }) => {
  const gutterText = useMemo(() => {
    const safeCount = Math.max(1, lineCount);
    const nums = new Array<string>(safeCount);
    for (let i = 0; i < safeCount; i += 1) {
      nums[i] = String(i + 1);
    }
    return nums.join('\n');
  }, [lineCount]);

  return (
    <pre className="ws-source-gutter" aria-hidden="true">
      {gutterText}
    </pre>
  );
});

CodeLineGutter.displayName = 'CodeLineGutter';

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
  onDeleteFile,
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
  isGenerating = false,
  hasError = false,
  onRetry,
  onNotify,
  hidden = false,
}) => {
  const [reloadNonce, setReloadNonce] = useState(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [compactTab, setCompactTab] = useState<'diff' | 'checks'>('diff');
  const [runtimeErrors, setRuntimeErrors] = useState<PreviewRuntimeError[]>([]);

  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);

  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState(false);

  const findInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);

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
        meta: `${file.language.toUpperCase()} · ${countLines(file.content)} dòng`,
      })),
    [project.files]
  );

  const lineCount = useMemo(
    () => (activeFile ? countLines(activeFile.content) : 0),
    [activeFile]
  );

  const filesSignature = useMemo(
    () => project.files.map((file) => `${file.path}:${file.content.length}:${file.content}`).join('\n'),
    [project.files]
  );

  useEffect(() => {
    setRuntimeErrors([]);
  }, [project.id, reloadNonce, filesSignature]);

  useEffect(() => {
    setConfirmDeleteFile(false);
  }, [activeFile?.path, project.id]);

  useEffect(() => {
    if (stageTab !== 'source' || hidden || compact) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setFindOpen(true);
        window.requestAnimationFrame(() => {
          findInputRef.current?.focus();
          findInputRef.current?.select();
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stageTab, hidden, compact]);

  const matches = useMemo(() => {
    if (!findOpen || !activeFile) return [] as number[];
    const needle = findQuery.trim().toLowerCase();
    if (!needle) return [] as number[];
    const haystack = activeFile.content.toLowerCase();
    const hits: number[] = [];
    let pos = haystack.indexOf(needle);
    while (pos !== -1 && hits.length < 500) {
      hits.push(pos);
      pos = haystack.indexOf(needle, pos + needle.length);
    }
    return hits;
  }, [findOpen, activeFile, findQuery]);

  const safeMatchIndex = matches.length > 0 ? Math.min(matchIndex, matches.length - 1) : 0;

  const jumpToMatch = useCallback(
    (index: number) => {
      if (!activeFile || matches.length === 0) return;
      const bounded = ((index % matches.length) + matches.length) % matches.length;
      setMatchIndex(bounded);
      const start = matches[bounded];
      const len = findQuery.trim().length;
      const editor = editorRef.current;
      const wrap = editorWrapRef.current;
      if (editor) {
        editor.focus({ preventScroll: true });
        editor.setSelectionRange(start, start + len);
      }
      if (wrap && lineCount > 0) {
        const lineBefore = countLines(activeFile.content.slice(0, start)) - 1;
        const ratio = lineBefore / Math.max(1, lineCount);
        wrap.scrollTop = Math.max(0, ratio * wrap.scrollHeight - wrap.clientHeight * 0.35);
      }
    },
    [activeFile, matches, findQuery, lineCount]
  );

  const handleRuntimeError = useCallback((err: PreviewRuntimeError) => {
    setRuntimeErrors((prev) => {
      if (prev.length >= 20) return [...prev.slice(1), err];
      return [...prev, err];
    });
  }, []);

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

  const handleExportHtml = () => {
    const { clean, findings, sanitizedFiles } = sanitizeFilesForZipExport(project.files);
    let htmlDoc = compileWorkspaceSrcDoc(sanitizedFiles, { includeErrorBridge: false });
    if (!/<title\b[^>]*>/i.test(htmlDoc)) {
      const safeTitle = project.name.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      if (/<head\b[^>]*>/i.test(htmlDoc)) {
        htmlDoc = htmlDoc.replace(/<head\b[^>]*>/i, (match) => `${match}<title>${safeTitle}</title>`);
      } else {
        htmlDoc = `<title>${safeTitle}</title>\n${htmlDoc}`;
      }
    }
    const slug = slugifyName(project.name) || 'f-forum-build';
    const filename = `${slug}.html`;
    const url = URL.createObjectURL(new Blob([htmlDoc], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    onNotify?.({
      type: clean ? 'success' : 'warning',
      title: `Đã tải ${filename}`,
      message: clean
        ? 'Đã quét bảo mật: 0 chuỗi nhạy cảm trong tệp HTML.'
        : `Đã ẩn ${findings.length} chuỗi nhạy cảm trước khi xuất HTML.`,
    });
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

  const handleCreateFileSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = newFileName
      .trim()
      .replace(/^(?:\.\/)+/, '')
      .replace(/\/{2,}/g, '/');
    if (
      !clean ||
      !VALID_FILE_PATH.test(clean) ||
      clean.includes('..') ||
      clean.split('/').includes('.') ||
      clean.endsWith('/')
    ) {
      setFileError('Tên tệp không hợp lệ');
      return;
    }
    const lowerClean = clean.toLowerCase();
    if (project.files.some((file) => file.path.toLowerCase() === lowerClean)) {
      setFileError('Tệp đã tồn tại');
      return;
    }
    onUpdateFile(clean, starterTemplateFor(clean));
    onSelectFile(clean);
    setNewFileName('');
    setFileError(null);
    setCreatingFile(false);
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
              aria-label={exporting ? 'Đang nén ZIP' : 'Tải ZIP'}
              title={exporting ? 'Đang nén' : 'Tải ZIP'}
              disabled={exporting}
              onClick={onExportZip}
            >
              <IconDownload size={13} />
            </button>
          </div>

          <div className="ws-compact-preview-row">
            <button
              type="button"
              className="ws-compact-preview-trigger"
              onClick={() => onEnterSplit?.('preview')}
              title="Mở Live View"
            >
              <IconGlobe size={14} className="ws-compact-globe" />
              <span className="ws-compact-preview-name">Live View · {project.name}</span>
            </button>
            <button
              type="button"
              className="ws-compact-refresh"
              aria-label="Làm mới Live View"
              title="Làm mới"
              onClick={() => {
                handleRefresh();
                onEnterSplit?.('preview');
              }}
            >
              <IconRotateCw size={12} />
            </button>
          </div>

          {compactTab === 'diff' ? (
            <>
              <ul className="ws-compact-files" aria-label="Tệp trong phiên">
                {project.files.map((file) => {
                  const diffEntry = project.diffs.find((d) => d.path === file.path);
                  const adds = diffEntry?.additions ?? countLines(file.content);
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
                <span>Xem Diff</span>
                <IconChevronRight size={14} />
              </button>
            </>
          ) : (
            <div className="ws-compact-checks">
              <div className="ws-compact-check-stat">
                <IconShieldCheck size={14} />
                <span>
                  {checkCount}/{totalCheckCount} phép kiểm đạt chuẩn
                </span>
              </div>
              <button
                type="button"
                className="ws-compact-all-btn"
                onClick={() => onEnterSplit?.('review', 'check')}
              >
                <span>Mở kiểm định</span>
                <IconChevronRight size={14} />
              </button>
            </div>
          )}

          {onOpenPublish && (
            <button
              type="button"
              className="ws-compact-all-btn"
              onClick={onOpenPublish}
            >
              <span>Đăng Tri thức</span>
              <IconShare2 size={13} />
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
            title="Live View (Ctrl+1)"
          >
            <IconEye size={13} />
            <span>Live View</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={stageTab === 'source'}
            className="ws-arena-tab"
            data-active={stageTab === 'source' ? 'true' : undefined}
            onClick={() => onStageTabChange('source')}
            title="Mã nguồn (Ctrl+2)"
          >
            <IconFileCode2 size={13} />
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
            title="Kiểm định Diff"
          >
            <IconShieldCheck size={13} />
            <span>Kiểm định</span>
            <span className="ws-arena-tab-count">{checkCount}/{totalCheckCount}</span>
            {runtimeErrors.length > 0 && (
              <span className="ws-runtime-count" title="Lỗi runtime">
                {runtimeErrors.length}
              </span>
            )}
          </button>
        </div>

        <div className="ws-arena-stage-tools">
          {stageTab === 'preview' && (
            <>
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
                <IconRotateCw size={14} />
              </button>

              <button
                type="button"
                className="ws-icon-pill ws-icon-pill--sm"
                aria-label="Mở bản xem trước ở tab mới"
                title="Tab mới"
                onClick={openInTab}
              >
                <IconExternalLink size={14} />
              </button>
            </>
          )}

          {onOpenPublish && (
            <button
              type="button"
              className="ws-stage-action-pill ws-stage-action-pill--accent"
              aria-label="Đăng bản dựng lên Tri thức"
              title="Đăng Tri thức"
              onClick={onOpenPublish}
            >
              <IconShare2 size={13} />
              <span>Đăng Tri thức</span>
            </button>
          )}

          <Popover
            label="Tải xuống"
            triggerClassName="ws-icon-pill ws-icon-pill--sm"
            align="right"
            trigger={<IconDownload size={14} />}
          >
            {(close) => (
              <ul className="ws-menu ws-download-menu">
                <li>
                  <button
                    type="button"
                    className="ws-menu-item"
                    disabled={exporting}
                    onClick={() => {
                      close();
                      onExportZip();
                    }}
                  >
                    {exporting ? 'Đang nén...' : 'Tải gói ZIP'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="ws-menu-item"
                    onClick={() => {
                      close();
                      handleExportHtml();
                    }}
                  >
                    Xuất HTML
                  </button>
                </li>
              </ul>
            )}
          </Popover>

          <button
            type="button"
            className="ws-icon-pill ws-icon-pill--sm"
            aria-label={expanded ? 'Thu nhỏ khung kết quả' : 'Mở toàn màn hình'}
            title={expanded ? 'Thu nhỏ' : 'Toàn màn hình'}
            onClick={onToggleExpanded}
          >
            {expanded ? <IconMinimize2 size={14} /> : <IconMaximize2 size={14} />}
          </button>

          {onExitSplit && (
            <button
              type="button"
              className="ws-icon-pill ws-icon-pill--sm"
              aria-label="Đóng khung xem trước"
              title="Đóng"
              onClick={onExitSplit}
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="ws-stage-body">
        {stageTab === 'preview' &&
          (isGenerating && !hasArtifact ? (
            <div className="ws-stage-skeleton" role="status" aria-busy="true" aria-label="Đang dựng giao diện">
              <div className="ws-skel-bar" />
              <div className="ws-skel-hero" />
              <div className="ws-skel-grid">
                <div className="ws-skel-card" />
                <div className="ws-skel-card" />
              </div>
              <p className="ws-skel-label">Đang dựng giao diện...</p>
            </div>
          ) : hasError && !hasArtifact ? (
            <div className="ws-stage-error" role="alert">
              <IconAlertTriangle size={26} />
              <h3>Không thể sinh bản dựng</h3>
              <p>Phiên gặp sự cố khi gọi AI hoặc hết hạn mức. Kiểm tra cấu hình BYOK hoặc thử gửi lại yêu cầu.</p>
              {onRetry && (
                <button type="button" className="btn btn-line btn-sm" onClick={onRetry}>
                  Thử lại
                </button>
              )}
            </div>
          ) : hasArtifact ? (
            <>
              <LivePreviewFrame
                files={project.files}
                title={project.name}
                viewport={viewport}
                reloadNonce={reloadNonce}
                onRuntimeError={handleRuntimeError}
              />
              {runtimeErrors.length > 0 && (
                <div className="ws-runtime-banner" role="status">
                  <div className="ws-runtime-banner-info">
                    <IconAlertTriangle size={14} />
                    <span className="ws-runtime-banner-msg">
                      {runtimeErrors[runtimeErrors.length - 1].message}
                    </span>
                    <span className="ws-runtime-count">{runtimeErrors.length}</span>
                  </div>
                  <div className="ws-runtime-banner-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        onReviewTabChange('check');
                        onStageTabChange('review');
                      }}
                    >
                      Kiểm định
                    </button>
                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--xs"
                      aria-label="Xóa log lỗi"
                      title="Xóa log"
                      onClick={() => setRuntimeErrors([])}
                    >
                      <IconX size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="ws-stage-empty" role="status">
              <IconGlobe size={28} />
              <h3>Chưa có bản dựng web trong phiên này</h3>
              <p>
                Nhập mô tả giao diện ở khung chat để Agent sinh mã nguồn HTML/CSS/JS. Khung Live View sẽ tự động mở ngay khi tệp web được tạo.
              </p>
            </div>
          ))}

        {stageTab === 'source' && (
          <div className="ws-source">
            <div className="ws-source-layout">
              <aside className="ws-source-filebox" aria-label="Danh sách tệp mã nguồn">
                <div className="ws-source-filehead">
                  <span className="t-label">Tệp ({project.files.length})</span>
                  <div className="ws-source-filehead-acts">
                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--xs"
                      aria-label="Tạo tệp"
                      title="Tạo tệp"
                      onClick={() => {
                        setConfirmDeleteFile(false);
                        setFileError(null);
                        setCreatingFile((val) => !val);
                      }}
                    >
                      <IconPlus size={13} />
                    </button>
                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--xs"
                      aria-label="Xóa tệp"
                      title="Xóa tệp"
                      disabled={project.files.length <= 1 || !onDeleteFile || !activeFile}
                      onClick={() => {
                        setCreatingFile(false);
                        setConfirmDeleteFile((val) => !val);
                      }}
                    >
                      <IconTrash2 size={13} />
                    </button>
                  </div>
                </div>

                {creatingFile && (
                  <form className="ws-source-create-form" onSubmit={handleCreateFileSubmit}>
                    <input
                      type="text"
                      className="field ws-source-create-input"
                      aria-label="Nhập tên tệp"
                      placeholder="Nhập tên tệp..."
                      value={newFileName}
                      autoFocus
                      onChange={(event) => {
                        setNewFileName(event.target.value);
                        setFileError(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setCreatingFile(false);
                          setFileError(null);
                        }
                      }}
                    />
                    <div className="ws-source-create-btns">
                      <button type="submit" className="btn btn-solid btn-sm">
                        Tạo
                      </button>
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => {
                          setCreatingFile(false);
                          setFileError(null);
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                    {fileError && <p className="ws-source-file-err">{fileError}</p>}
                  </form>
                )}

                {confirmDeleteFile && activeFile && onDeleteFile && (
                  <div className="ws-source-delete-confirm">
                    <span className="ws-source-delete-text">Xóa {activeFile.path}?</span>
                    <div className="ws-source-create-btns">
                      <button
                        type="button"
                        className="btn btn-red btn-sm"
                        onClick={() => {
                          onDeleteFile(activeFile.path);
                          setConfirmDeleteFile(false);
                        }}
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => setConfirmDeleteFile(false)}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

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
                      aria-label="Tìm trong mã"
                      title="Tìm (Ctrl+F)"
                      aria-pressed={findOpen}
                      disabled={!activeFile}
                      onClick={() => {
                        setFindOpen((val) => {
                          const next = !val;
                          if (next) {
                            window.requestAnimationFrame(() => findInputRef.current?.focus());
                          }
                          return next;
                        });
                      }}
                    >
                      <IconSearch size={14} />
                    </button>

                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--sm"
                      aria-label={copiedFile === activeFile?.path ? 'Đã chép mã' : 'Chép mã'}
                      title={copiedFile === activeFile?.path ? 'Đã chép' : 'Sao chép'}
                      disabled={!activeFile}
                      data-active={copiedFile === activeFile?.path ? 'true' : undefined}
                      onClick={() => void handleCopySource()}
                    >
                      {copiedFile === activeFile?.path ? (
                        <IconCheck size={14} />
                      ) : (
                        <IconCopy size={14} />
                      )}
                    </button>

                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--sm"
                      aria-label="So sánh Diff"
                      title="Diff"
                      onClick={() => {
                        onReviewTabChange('diff');
                        onStageTabChange('review');
                      }}
                    >
                      <IconGitCompareArrows size={14} />
                    </button>
                  </div>
                </div>

                {findOpen && activeFile && (
                  <div className="ws-find-bar" role="search" aria-label="Tìm trong mã nguồn">
                    <input
                      ref={findInputRef}
                      type="search"
                      className="field ws-find-input"
                      aria-label="Tìm trong mã"
                      placeholder="Tìm trong mã..."
                      value={findQuery}
                      onChange={(event) => {
                        setFindQuery(event.target.value);
                        setMatchIndex(0);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          setFindOpen(false);
                          editorRef.current?.focus();
                        } else if (event.key === 'Enter') {
                          event.preventDefault();
                          jumpToMatch(event.shiftKey ? safeMatchIndex - 1 : safeMatchIndex + 1);
                        }
                      }}
                    />
                    <span className="ws-find-count">
                      {matches.length > 0 ? `${safeMatchIndex + 1}/${matches.length}` : '0/0'}
                    </span>
                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--xs"
                      aria-label="Kết quả trước"
                      title="Trước"
                      disabled={matches.length === 0}
                      onClick={() => jumpToMatch(safeMatchIndex - 1)}
                    >
                      <IconChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--xs"
                      aria-label="Kết quả sau"
                      title="Tiếp"
                      disabled={matches.length === 0}
                      onClick={() => jumpToMatch(safeMatchIndex + 1)}
                    >
                      <IconChevronRight size={13} />
                    </button>
                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--xs"
                      aria-label="Đóng tìm kiếm"
                      title="Đóng"
                      onClick={() => setFindOpen(false)}
                    >
                      <IconX size={13} />
                    </button>
                  </div>
                )}

                {activeFile ? (
                  <div ref={editorWrapRef} className="ws-source-editor-wrap">
                    <CodeLineGutter lineCount={lineCount} />
                    <textarea
                      ref={editorRef}
                      className="ws-source-editor"
                      aria-label={`Trình sửa mã ${activeFile.path}`}
                      rows={Math.max(20, lineCount)}
                      wrap="off"
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
            runtimeErrors={runtimeErrors}
            onClearRuntimeErrors={() => setRuntimeErrors([])}
          />
        )}
      </div>
    </section>
  );
};
