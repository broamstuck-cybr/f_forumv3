import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import type { WorkspaceFile } from '../../types/index';
import type { ComposeStreamProgress } from '../../engine/repoWebComposer';
import type { BundleDiagnostic } from '../../engine/workspaceBundler';
import { sanitizeFilesForZipExport } from '../../services/secretScanner';
import { handleLiquidPointerLeave, handleLiquidPointerMove } from '../../utils/liquidGlassPointer';
import { CodeEditorPane } from './CodeEditorPane';
import { ConsoleDrawer, type ConsoleLogEntry } from './ConsoleDrawer';
import { FileExplorerTree } from './FileExplorerTree';

export type PreviewDeviceMode = 'desktop' | 'tablet' | 'mobile';

export interface ArenaRunnerPaneProps {
  files: WorkspaceFile[];
  activeFilePath: string;
  openTabs: string[];
  modifiedPaths: Set<string>;
  previewHtml: string;
  standaloneHtml: string;
  projectMode: 'html' | 'react-tsx';
  bundleDiagnostics: BundleDiagnostic[];
  pageTitle: string;
  publishedSlug: string | null;
  publishing: boolean;
  busy: boolean;
  streamProgress?: ComposeStreamProgress | null;
  viewMode: 'preview' | 'code';
  pointerShield?: boolean;
  onChangeViewMode: (mode: 'preview' | 'code') => void;
  onSelectFile: (filePath: string) => void;
  onCloseTab: (filePath: string) => void;
  onCreateFile: (filePath: string) => void;
  onDeleteFile: (filePath: string) => void;
  onChangeFileContent: (filePath: string, nextContent: string) => void;
  onPublish: () => void;
  onFixConsoleErrors?: (errorSummary: string) => void;
  onNotify: (title: string, message?: string) => void;
}

export const ArenaRunnerPane: React.FC<ArenaRunnerPaneProps> = ({
  files,
  activeFilePath,
  openTabs,
  modifiedPaths,
  previewHtml,
  standaloneHtml,
  projectMode,
  bundleDiagnostics,
  pageTitle,
  publishedSlug,
  publishing,
  busy,
  streamProgress = null,
  viewMode,
  pointerShield = false,
  onChangeViewMode,
  onSelectFile,
  onCloseTab,
  onCreateFile,
  onDeleteFile,
  onChangeFileContent,
  onPublish,
  onFixConsoleErrors,
  onNotify,
}) => {
  const [reloadNonce, setReloadNonce] = useState(0);
  const [device, setDevice] = useState<PreviewDeviceMode>('desktop');
  const [virtualPath, setVirtualPath] = useState<string>('/');
  const [fullscreen, setFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [runtimeLogs, setRuntimeLogs] = useState<ConsoleLogEntry[]>([]);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hasProject = files.length > 0 && Boolean(previewHtml || standaloneHtml);

  const publicUrl = useMemo(() => {
    if (!publishedSlug) return null;
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}/p/${publishedSlug}`;
    }
    return `https://fforum3.vercel.app/p/${publishedSlug}`;
  }, [publishedSlug]);

  // Reset virtual path & clear stale runtime logs whenever preview rebuilds
  useEffect(() => {
    setRuntimeLogs([]);
    setVirtualPath('/');
  }, [previewHtml, reloadNonce]);

  // Close fullscreen cleanly on Escape
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  // Receive live console & virtual navigation messages from sandboxed preview iframe
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (!iframeRef.current || ev.source !== iframeRef.current.contentWindow) return;
      const data = ev.data;
      if (!data || typeof data !== 'object') return;

      if (data.source === 'ff-preview-console') {
        const level: ConsoleLogEntry['level'] =
          data.level === 'error' || data.level === 'warn' ? data.level : 'info';
        const message = typeof data.message === 'string' ? data.message : '';
        if (!message) return;
        const entry: ConsoleLogEntry = {
          id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          level,
          source: 'runtime',
          message,
          file: typeof data.file === 'string' && data.file ? data.file : undefined,
          line: typeof data.line === 'number' ? data.line : undefined,
          timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
        };
        setRuntimeLogs((prev) => [...prev.slice(-79), entry]);
      } else if (data.source === 'ff-preview-nav' && typeof data.path === 'string') {
        setVirtualPath(data.path.slice(0, 80) || '/');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const combinedConsoleEntries = useMemo<ConsoleLogEntry[]>(() => {
    const bundlerEntries: ConsoleLogEntry[] = bundleDiagnostics.map((d, idx) => ({
      id: `bd-${idx}-${d.file || 'global'}`,
      level: d.level,
      source: 'bundler',
      message: d.message,
      file: d.file,
      line: d.line,
      timestamp: Date.now(),
    }));
    return [...bundlerEntries, ...runtimeLogs];
  }, [bundleDiagnostics, runtimeLogs]);

  const displayPath = publishedSlug ? `/p/${publishedSlug}` : virtualPath;

  const handleCopyLink = async () => {
    const target = publicUrl || (typeof window !== 'undefined' ? window.location.href : '');
    try {
      await navigator.clipboard.writeText(target);
      setCopiedLink(true);
      onNotify(
        publicUrl ? 'Đã sao chép liên kết' : 'Chưa xuất bản',
        publicUrl || 'Bấm Xuất bản để tạo liên kết công khai.'
      );
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      onNotify('Không sao chép được', 'Trình duyệt không cấp quyền bảng nhớ tạm.');
    }
  };

  const handleOpenNewTab = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  const handleDownloadZip = async () => {
    if (!hasProject) return;
    try {
      const zip = new JSZip();
      const safeSlug =
        (publishedSlug || pageTitle || 'fforum-project')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'fforum-project';

      const { sanitizedFiles, findings } = sanitizeFilesForZipExport(files);
      for (const file of sanitizedFiles) {
        zip.file(file.path, file.content);
      }

      if (standaloneHtml) {
        zip.file('standalone.html', standaloneHtml);
      }

      if (!sanitizedFiles.some((f) => f.path.toLowerCase() === 'readme.md')) {
        zip.file(
          'README.md',
          `# ${pageTitle || 'F-Forum Studio Project'}\n\nMở tệp \`standalone.html\` bằng trình duyệt bất kỳ để chạy ngay ngoại tuyến.\n`
        );
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const kbSize = (blob.size / 1024).toFixed(1);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeSlug}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);

      onNotify(
        'Đã xuất gói ZIP đa tệp',
        findings.length > 0
          ? `${safeSlug}.zip (${sanitizedFiles.length} tệp + standalone.html · đã ẩn ${findings.length} khóa nhạy cảm)`
          : `${safeSlug}.zip (${sanitizedFiles.length} tệp + standalone.html · ${kbSize} KB)`
      );
    } catch {
      onNotify('Xuất ZIP thất bại', 'Vui lòng thử lại sau vài giây.');
    }
  };

  const handleJumpToFile = useCallback(
    (filePath: string) => {
      const matched = files.find((f) => f.path === filePath || f.path.endsWith(`/${filePath}`));
      if (!matched) return;
      onSelectFile(matched.path);
      onChangeViewMode('code');
    },
    [files, onChangeViewMode, onSelectFile]
  );

  return (
    <section
      className={`ws-runner lg-glass lg-glass--matte${fullscreen ? ' is-fullscreen' : ''}`}
      aria-label="Khung xem trước, trình soạn thảo mã và xuất bản"
    >
      <div className="ws-runner__bar">
        <div className="ws-runner__left">
          <div className="ws-seg ws-seg--labeled" role="tablist" aria-label="Chế độ làm việc">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'preview'}
              className={`ws-seg__btn ws-seg__btn--labeled${viewMode === 'preview' ? ' is-active' : ''}`}
              onClick={() => onChangeViewMode('preview')}
              aria-label="Xem trước trực tiếp"
              title="Preview"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Preview</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'code'}
              className={`ws-seg__btn ws-seg__btn--labeled${viewMode === 'code' ? ' is-active' : ''}`}
              onClick={() => onChangeViewMode('code')}
              aria-label="Trình soạn thảo mã đa tệp"
              title="Code"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>Code</span>
            </button>
          </div>
        </div>

        <div className="ws-runner__center">
          <div className="ws-deviceGroup" role="group" aria-label="Khung thiết bị">
            <button
              type="button"
              className={`ws-devBtn${device === 'desktop' ? ' is-active' : ''}`}
              onClick={() => {
                setDevice('desktop');
                if (viewMode !== 'preview') onChangeViewMode('preview');
              }}
              aria-label="Màn hình máy tính"
              title="Desktop"
              aria-pressed={device === 'desktop'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </button>
            <button
              type="button"
              className={`ws-devBtn${device === 'tablet' ? ' is-active' : ''}`}
              onClick={() => {
                setDevice('tablet');
                if (viewMode !== 'preview') onChangeViewMode('preview');
              }}
              aria-label="Màn hình máy tính bảng"
              title="Tablet (768px)"
              aria-pressed={device === 'tablet'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              className={`ws-devBtn${device === 'mobile' ? ' is-active' : ''}`}
              onClick={() => {
                setDevice('mobile');
                if (viewMode !== 'preview') onChangeViewMode('preview');
              }}
              aria-label="Màn hình điện thoại"
              title="Mobile (390px)"
              aria-pressed={device === 'mobile'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="6" y="2" width="12" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </button>
          </div>

          <div className="ws-address">
            <span
              className={`ws-address__dot${publishedSlug ? ' is-live' : ''}`}
              aria-hidden="true"
            />
            <span className="ws-address__text" title={displayPath}>
              {displayPath}
            </span>
            {publishedSlug && (
              <button
                type="button"
                className="ws-address__act"
                onClick={handleCopyLink}
                aria-label="Sao chép liên kết"
                title={copiedLink ? 'Đã sao chép' : 'Sao chép liên kết'}
              >
                {copiedLink ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            )}
            <button
              type="button"
              className="ws-address__act"
              disabled={!hasProject}
              onClick={() => setReloadNonce((n) => n + 1)}
              aria-label="Tải lại bản xem trước"
              title="Tải lại"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
            </button>
            <button
              type="button"
              className="ws-address__act"
              disabled={!hasProject}
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? 'Thu nhỏ khung xem' : 'Phóng to khung xem'}
              title={fullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {fullscreen ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="ws-address__act"
              disabled={!hasProject}
              onClick={handleOpenNewTab}
              aria-label="Mở ở tab mới"
              title="Mở tab mới"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="ws-runner__right">
          <button
            type="button"
            className="ws-ctaBtn ws-ctaBtn--primary"
            disabled={!hasProject || publishing || busy}
            onClick={onPublish}
          >
            {publishing ? 'Đang xuất...' : 'Xuất bản'}
          </button>
          <button
            type="button"
            className="ws-ctaBtn ws-ctaBtn--ghost"
            disabled={!hasProject || busy}
            onClick={handleDownloadZip}
            aria-label="Xuất gói ZIP đa tệp"
            title="Xuất ZIP"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="ws-hideSm">Xuất ZIP</span>
          </button>
        </div>
      </div>

      <div className="ws-runner__body">
        {!hasProject && !busy && (
          <div
            className="ws-runner__empty lg-glass lg-glass--matte"
            onPointerMove={handleLiquidPointerMove}
            onPointerLeave={handleLiquidPointerLeave}
          >
            <div className="ws-runner__emptyGlyph" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2.5" />
                <path d="M3 9h18" />
                <path d="M8 14h4" />
              </svg>
            </div>
            <h3>Khung xem trước trực tiếp</h3>
            <p>
              Chọn một ý tưởng gợi ý hoặc mô tả sản phẩm bên khung Chat. AI sẽ tự thiết kế, viết mã đa tệp và chạy bản xem trước tại đây.
            </p>
          </div>
        )}

        {!hasProject && busy && (
          <div className="ws-runner__skeleton" role="status" aria-live="polite">
            <div className="ws-skel ws-skel--nav" />
            <div className="ws-skel ws-skel--hero" />
            <div className="ws-skelRow">
              <div className="ws-skel ws-skel--card" />
              <div className="ws-skel ws-skel--card" />
              <div className="ws-skel ws-skel--card" />
            </div>
            <span className="ws-skelLabel">
              {streamProgress?.activeFiles.length
                ? `AI đang viết ${streamProgress.activeFiles.map((f) => f.path).join(' · ')}`
                : streamProgress?.model && streamProgress.model !== 'auto'
                  ? `Đang nhận mã nguồn trực tiếp từ ${streamProgress.model.replace(/^.*\//, '')}...`
                  : 'AI đang thiết kế giao diện và viết mã đa tệp...'}
            </span>
          </div>
        )}

        {hasProject && viewMode === 'preview' && (
          <div className={`ws-previewStage ws-previewStage--${device}`}>
            <div className={`ws-iframeWrap ws-iframeWrap--${device}`}>
              <iframe
                ref={iframeRef}
                key={`${reloadNonce}-${publishedSlug || 'local'}`}
                className="ws-iframe"
                title={`Xem trước: ${pageTitle || 'Dự án'}`}
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                referrerPolicy="no-referrer"
              />
              {pointerShield && <div className="ws-iframeShield" aria-hidden="true" />}
            </div>
          </div>
        )}

        {hasProject && viewMode === 'code' && (
          <div className="ws-ideShell">
            {explorerOpen && (
              <FileExplorerTree
                files={files}
                activeFilePath={activeFilePath}
                modifiedPaths={modifiedPaths}
                onSelectFile={onSelectFile}
                onCreateFile={onCreateFile}
                onDeleteFile={onDeleteFile}
              />
            )}
            <CodeEditorPane
              files={files}
              openTabs={openTabs}
              activeFilePath={activeFilePath}
              modifiedPaths={modifiedPaths}
              explorerOpen={explorerOpen}
              onToggleExplorer={() => setExplorerOpen((v) => !v)}
              onSelectTab={onSelectFile}
              onCloseTab={onCloseTab}
              onChangeFileContent={onChangeFileContent}
              onNotify={onNotify}
            />
          </div>
        )}

        {hasProject && (
          <ConsoleDrawer
            entries={combinedConsoleEntries}
            open={consoleOpen}
            projectMode={projectMode}
            fileCount={files.length}
            busy={busy}
            onToggle={() => setConsoleOpen((v) => !v)}
            onClear={() => setRuntimeLogs([])}
            onJumpToFile={handleJumpToFile}
            onFixErrors={onFixConsoleErrors}
          />
        )}
      </div>
    </section>
  );
};
