import React, { useMemo } from 'react';
import {
  compileSpecimenSrcDoc,
  type PreviewTheme,
  type PreviewViewport,
} from './catalog';

interface SandboxPreviewProps {
  itemKey?: string;
  title: string;
  html: string;
  css: string;
  js?: string;
  theme: PreviewTheme;
  viewport: PreviewViewport;
  nonce: number;
  className?: string;
}

export const SandboxPreview: React.FC<SandboxPreviewProps> = ({
  itemKey,
  title,
  html,
  css,
  js,
  theme,
  viewport,
  nonce,
  className,
}) => {
  const srcDoc = useMemo(
    () => compileSpecimenSrcDoc(html, css, theme, js),
    [html, css, theme, js]
  );

  // WHY: Include itemKey + content fingerprint so switching cards always mounts a fresh iframe with zero stale srcDoc.
  const frameKey = `${itemKey || title}-${theme}-${viewport}-${nonce}-${srcDoc.length}`;

  return (
    <div
      className={`ex-sandbox ${className ?? ''}`}
      data-preview-theme={theme}
      data-viewport={viewport}
    >
      <div
        className="ex-sandbox-viewport"
        style={{ '--ex-vp': `${viewport}px` } as React.CSSProperties}
      >
        <iframe
          key={frameKey}
          title={`Bản chạy thử ${title}`}
          className="ex-sandbox-frame"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          srcDoc={srcDoc}
        />
      </div>
    </div>
  );
};
