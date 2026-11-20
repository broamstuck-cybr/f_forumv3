import React, { useMemo } from 'react';
import {
  compileSpecimenSrcDoc,
  type PreviewTheme,
  type PreviewViewport,
} from './catalog';

interface SandboxPreviewProps {
  title: string;
  html: string;
  css: string;
  theme: PreviewTheme;
  viewport: PreviewViewport;
  nonce: number;
  className?: string;
}

export const SandboxPreview: React.FC<SandboxPreviewProps> = ({
  title,
  html,
  css,
  theme,
  viewport,
  nonce,
  className,
}) => {
  const srcDoc = useMemo(
    () => compileSpecimenSrcDoc(html, css, theme),
    [html, css, theme]
  );

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
          key={`${title}-${theme}-${viewport}-${nonce}`}
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
