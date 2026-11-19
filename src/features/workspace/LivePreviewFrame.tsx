import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Monitor,
  PictureInPicture2,
  RefreshCw,
  Smartphone,
  X,
} from 'lucide-react';
import type { WorkspaceFile } from '../../types/index';

export type PreviewViewportMode = 'desktop' | 'mobile' | 'fullscreen' | 'pip';

export interface LivePreviewFrameProps {
  files: WorkspaceFile[];
  mode: PreviewViewportMode;
  onModeChange: (mode: PreviewViewportMode) => void;
  title?: string;
}

function instrumentLoopGuard(jsSource: string): string {
  const guardHeader = `var __ffLoopStart = Date.now();
function __ffGuard() {
  if (Date.now() - __ffLoopStart > 1200) {
    throw new Error('Execution halted: blocking loop guard triggered');
  }
}
`;
  const guarded = jsSource.replace(
    /\b(while\s*\([^)]*\)\s*\{|for\s*\([^)]*\)\s*\{)/g,
    '$1 __ffGuard();'
  );
  return `${guardHeader}try {\n${guarded}\n} catch (e) {\n  var banner = document.createElement('div');\n  banner.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;padding:10px 14px;border-radius:8px;background:#7f1d1d;color:#fecaca;font:12px/1.4 monospace;z-index:9999;';\n  banner.textContent = 'Runtime error: ' + (e && e.message ? e.message : String(e));\n  document.body.appendChild(banner);\n}`;
}

export function compileWorkspaceSrcDoc(files: WorkspaceFile[]): string {
  const htmlFile = files.find((f) => f.path === 'index.html') || files.find((f) => f.path.endsWith('.html'));
  const cssFiles = files.filter((f) => f.path.endsWith('.css'));
  const jsFiles = files.filter((f) => f.path.endsWith('.js') || f.path.endsWith('.mjs'));

  const combinedCss = cssFiles.map((f) => f.content).join('\n\n');
  const combinedJs = jsFiles.map((f) => instrumentLoopGuard(f.content)).join('\n\n');
  const cspMeta =
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data: https:; font-src data: https:;" />';

  let doc = htmlFile
    ? htmlFile.content
    : `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Preview</title></head><body><main style="padding:24px;font-family:system-ui,sans-serif;">No index.html found in workspace.</main></body></html>`;

  doc = doc
    .replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<script[^>]+src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '');

  const injectedHead = `${cspMeta}\n<style>\n${combinedCss}\n</style>`;
  if (/<\/head>/i.test(doc)) {
    doc = doc.replace(/<\/head>/i, `${injectedHead}\n</head>`);
  } else {
    doc = `${injectedHead}\n${doc}`;
  }

  const injectedScript = combinedJs.trim() ? `<script>\n${combinedJs}\n</script>` : '';
  if (injectedScript) {
    if (/<\/body>/i.test(doc)) {
      doc = doc.replace(/<\/body>/i, `${injectedScript}\n</body>`);
    } else {
      doc = `${doc}\n${injectedScript}`;
    }
  }

  return doc;
}

export const LivePreviewFrame: React.FC<LivePreviewFrameProps> = ({
  files,
  mode,
  onModeChange,
  title = 'Sandboxed Live Preview',
}) => {
  const [reloadNonce, setReloadNonce] = useState(0);
  const [pipOffset, setPipOffset] = useState({ x: 0, y: 0 });
  const dragOriginRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  const srcDoc = useMemo(() => compileWorkspaceSrcDoc(files), [files]);

  useEffect(() => {
    if (mode !== 'fullscreen') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onModeChange('desktop');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, onModeChange]);

  const handlePipPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'pip') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOriginRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pipOffset.x,
      origY: pipOffset.y,
    };
  };

  const handlePipPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'pip' || !dragOriginRef.current) return;
    const dx = e.clientX - dragOriginRef.current.startX;
    const dy = e.clientY - dragOriginRef.current.startY;
    setPipOffset({
      x: Math.max(-520, Math.min(24, dragOriginRef.current.origX + dx)),
      y: Math.max(-420, Math.min(24, dragOriginRef.current.origY + dy)),
    });
  };

  const handlePipPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragOriginRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragOriginRef.current = null;
    }
  };

  const iframeElement = (
    <iframe
      key={`${mode}-${reloadNonce}`}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      className="w-full h-full border-0 block bg-white"
    />
  );

  if (mode === 'pip') {
    return (
      <div
        role="region"
        aria-label="Floating Live Preview"
        style={{
          transform: `translate3d(${pipOffset.x}px, ${pipOffset.y}px, 0)`,
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.45)',
        }}
        className="fixed bottom-5 right-5 z-40 w-[340px] max-w-[calc(100vw-24px)] h-[240px] rounded-2xl border overflow-hidden flex flex-col"
      >
        <div
          onPointerDown={handlePipPointerDown}
          onPointerMove={handlePipPointerMove}
          onPointerUp={handlePipPointerUp}
          style={{
            background: 'var(--bg-panel)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--ink-primary)',
          }}
          className="h-9 px-3 border-b flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none shrink-0"
        >
          <span className="text-xs font-medium truncate">PiP Live Preview</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setReloadNonce((n) => n + 1)}
              aria-label="Refresh preview"
              style={{ color: 'var(--ink-secondary)' }}
              className="p-1 rounded-md hover:opacity-80"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onModeChange('desktop')}
              aria-label="Dock preview"
              style={{ color: 'var(--ink-secondary)' }}
              className="p-1 rounded-md hover:opacity-80"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setPipOffset({ x: 0, y: 0 });
                onModeChange('desktop');
              }}
              aria-label="Close PiP"
              style={{ color: 'var(--ink-secondary)' }}
              className="p-1 rounded-md hover:opacity-80"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">{iframeElement}</div>
      </div>
    );
  }

  if (mode === 'fullscreen') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen Live Preview"
        style={{ background: 'var(--bg-canvas)' }}
        className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      >
        <div
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--ink-primary)',
          }}
          className="h-12 px-4 border-b flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold truncate">{title}</span>
            <span
              style={{
                background: 'var(--bg-panel)',
                color: 'var(--accent-verdigris)',
                borderColor: 'var(--border-subtle)',
              }}
              className="text-xs px-2 py-0.5 rounded-full border shrink-0"
            >
              sandbox=&quot;allow-scripts&quot;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReloadNonce((n) => n + 1)}
              style={{
                background: 'var(--bg-panel)',
                color: 'var(--ink-primary)',
                borderColor: 'var(--border-subtle)',
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload
            </button>
            <button
              type="button"
              onClick={() => onModeChange('desktop')}
              style={{
                background: 'var(--accent-primary)',
                color: '#0b0d12',
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              Thoát toàn màn hình
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 p-3 overflow-hidden">
          <div
            style={{ borderColor: 'var(--border-strong)' }}
            className="w-full h-full rounded-xl border overflow-hidden"
          >
            {iframeElement}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
      className="flex flex-col h-full min-h-[380px] rounded-2xl border overflow-hidden"
    >
      <div
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--ink-secondary)',
        }}
        className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: 'var(--ink-primary)' }} className="text-xs font-medium truncate">
            {title}
          </span>
          <span
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--accent-jade)',
              borderColor: 'var(--border-subtle)',
            }}
            className="text-[11px] px-2 py-0.5 rounded-full border shrink-0"
          >
            CSP Isolated
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onModeChange('desktop')}
            aria-pressed={mode === 'desktop'}
            aria-label="Desktop preview"
            style={{
              background: mode === 'desktop' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'desktop' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
              borderColor: mode === 'desktop' ? 'var(--border-strong)' : 'transparent',
            }}
            className="p-1.5 rounded-lg border"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onModeChange('mobile')}
            aria-pressed={mode === 'mobile'}
            aria-label="Mobile 390px preview"
            style={{
              background: mode === 'mobile' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'mobile' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
              borderColor: mode === 'mobile' ? 'var(--border-strong)' : 'transparent',
            }}
            className="p-1.5 rounded-lg border"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onModeChange('pip')}
            aria-label="Floating PiP preview"
            style={{ color: 'var(--ink-secondary)' }}
            className="p-1.5 rounded-lg hover:opacity-80"
          >
            <PictureInPicture2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onModeChange('fullscreen')}
            aria-label="Fullscreen preview"
            style={{ color: 'var(--ink-secondary)' }}
            className="p-1.5 rounded-lg hover:opacity-80"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setReloadNonce((n) => n + 1)}
            aria-label="Refresh sandboxed iframe"
            style={{ color: 'var(--ink-secondary)' }}
            className="p-1.5 rounded-lg hover:opacity-80"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        style={{ background: 'var(--bg-canvas)' }}
        className="flex-1 min-h-0 p-3 flex items-stretch justify-center overflow-auto"
      >
        {mode === 'mobile' ? (
          <div
            style={{
              borderColor: 'var(--border-strong)',
              background: 'var(--bg-panel)',
            }}
            className="w-[390px] max-w-full min-h-[520px] rounded-[24px] border-2 p-2 overflow-hidden flex flex-col shrink-0"
          >
            <div className="flex-1 rounded-[16px] overflow-hidden">{iframeElement}</div>
          </div>
        ) : (
          <div
            style={{ borderColor: 'var(--border-subtle)' }}
            className="w-full h-full min-h-[360px] rounded-xl border overflow-hidden"
          >
            {iframeElement}
          </div>
        )}
      </div>
    </div>
  );
};
