import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { WorkspaceFile } from '../../types/index';

export const PREVIEW_VIEWPORTS = ['fit', 1440, 768, 390] as const;

export type PreviewViewport = (typeof PREVIEW_VIEWPORTS)[number];

export interface LivePreviewFrameProps {
  files: WorkspaceFile[];
  title: string;
  viewport: PreviewViewport;
  reloadNonce: number;
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

/**
 * Chỉ những tệp do người dùng hoặc AI tạo ra mới đáng đưa vào khung xem trước.
 * Ba tệp khung khởi tạo (index.html/styles.css/app.js) là bản nháp rỗng —
 * đếm chúng là "có mã" sẽ biến Live Preview thành một khung giả luôn sáng.
 */
export const STARTER_PATHS = ['index.html', 'styles.css', 'app.js'] as const;

export function hasGeneratedWebCode(files: WorkspaceFile[]): boolean {
  const web = files.filter((file) =>
    /\.(html?|css|m?js)$/i.test(file.path)
  );
  if (!web.length) return false;
  return web.some((file) => {
    if (!STARTER_PATHS.includes(file.path as (typeof STARTER_PATHS)[number])) return true;
    /* Dấu vân tay của khung khởi tạo: nếu vẫn còn nguyên thì đây là bản nháp rỗng. */
    switch (file.path) {
      case 'index.html':
        return !/F-FORUM v3 Workspace Artifact/i.test(file.content);
      case 'styles.css':
        return !/\.stage-container\b/.test(file.content);
      case 'app.js':
        return !/inspect-btn/.test(file.content);
      default:
        return true;
    }
  });
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

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function buildStandalonePreviewDoc(files: WorkspaceFile[], title: string): string {
  const safeTitle = escapeAttribute(title).replace(/</g, '&lt;');
  const frameDoc = escapeAttribute(compileWorkspaceSrcDoc(files));
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="referrer" content="no-referrer" /><title>${safeTitle}</title><style>html,body{margin:0;height:100%}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><iframe title="${safeTitle}" sandbox="allow-scripts" referrerpolicy="no-referrer" srcdoc="${frameDoc}"></iframe></body></html>`;
}

export const LivePreviewFrame: React.FC<LivePreviewFrameProps> = ({
  files,
  title,
  viewport,
  reloadNonce,
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const srcDoc = useMemo(() => compileWorkspaceSrcDoc(files), [files]);

  useLayoutEffect(() => {
    const element = areaRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setArea({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const isFit = viewport === 'fit';
  const numericWidth = typeof viewport === 'number' ? viewport : area.width || 1024;
  const scale = !isFit && area.width > 0 ? Math.min(1, area.width / numericWidth) : 1;
  const shownWidth = isFit ? '100%' : Math.round(numericWidth * scale);

  return (
    <div className="ws-frame-host" data-fit={isFit ? 'true' : undefined}>
      <div ref={areaRef} className="ws-frame-area" data-fit={isFit ? 'true' : undefined}>
        {(isFit || area.width > 0) && (
          <div
            className="ws-frame plate scene-paper"
            style={isFit ? { width: '100%', height: '100%' } : { width: shownWidth, height: area.height }}
          >
            <div className="ws-frame-clip">
              <iframe
                key={reloadNonce}
                title={title}
                srcDoc={srcDoc}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                className="ws-frame-doc"
                style={
                  isFit
                    ? { width: '100%', height: '100%', transform: 'none' }
                    : {
                        width: numericWidth,
                        height: Math.round(area.height / scale),
                        transform: `scale(${scale})`,
                      }
                }
              />
            </div>
          </div>
        )}
      </div>
      {!isFit && (
        <p className="t-label ws-frame-note">
          <span>{viewport} px</span>
          {scale < 1 && <span>thu còn {Math.round(scale * 100)}%</span>}
        </p>
      )}
    </div>
  );
};
