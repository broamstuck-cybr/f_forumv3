import React, { useState } from 'react';
import { ExternalLink, Maximize2, Minimize2, RotateCw, X } from 'lucide-react';
import type { WorkspaceFile } from '../../types/index';
import {
  buildStandalonePreviewDoc,
  LivePreviewFrame,
  PREVIEW_VIEWPORTS,
  type PreviewViewport,
} from './LivePreviewFrame';

interface LiveStageProps {
  files: WorkspaceFile[];
  title: string;
  viewport: PreviewViewport;
  onViewportChange: (viewport: PreviewViewport) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  onClose: () => void;
}

export const LiveStage: React.FC<LiveStageProps> = ({
  files,
  title,
  viewport,
  onViewportChange,
  expanded,
  onToggleExpanded,
  onClose,
}) => {
  const [reloadNonce, setReloadNonce] = useState(0);

  const openInTab = () => {
    const url = URL.createObjectURL(
      new Blob([buildStandalonePreviewDoc(files, title)], { type: 'text/html' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <section className="ws-live" aria-label="Live View">
      <header className="ws-head ws-live-bar">
        <h2 className="ws-head-title ws-live-title">Live View</h2>
        <div className="ws-seg" role="group" aria-label="Khổ màn hình">
          {PREVIEW_VIEWPORTS.map((width) => (
            <button
              key={width}
              type="button"
              className="ws-seg-item ws-seg-mono"
              aria-pressed={viewport === width}
              onClick={() => onViewportChange(width)}
            >
              {width}
            </button>
          ))}
        </div>
        <div className="ws-live-tools">
          <button
            type="button"
            className="icon-btn"
            aria-label="Tải lại"
            title="Tải lại"
            onClick={() => setReloadNonce((value) => value + 1)}
          >
            <RotateCw size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Mở tab mới"
            title="Mở tab mới"
            onClick={openInTab}
          >
            <ExternalLink size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={expanded ? 'Thu nhỏ' : 'Toàn màn hình'}
            title={expanded ? 'Thu nhỏ' : 'Toàn màn hình'}
            onClick={onToggleExpanded}
          >
            {expanded ? (
              <Minimize2 size={18} aria-hidden="true" />
            ) : (
              <Maximize2 size={18} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="icon-btn ws-live-close"
            aria-label="Đóng Live View"
            title="Đóng Live View"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </header>
      <LivePreviewFrame files={files} title={title} viewport={viewport} reloadNonce={reloadNonce} />
    </section>
  );
};
