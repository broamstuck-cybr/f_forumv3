import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { ProjectSetupTarget, WorkspaceProject } from '../../types/index';
import { generateProjectSetupBundle } from '../../services/projectSetupGenerator';
import { Modal } from './Modal';

export interface AiProjectSetupDrawerProps {
  open: boolean;
  onClose: () => void;
  project: WorkspaceProject;
  defaultTarget: ProjectSetupTarget;
  onInjectFiles: (files: Array<{ path: string; content: string; summary?: string }>) => void;
}

const TARGETS: Array<{ id: ProjectSetupTarget; label: string }> = [
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'cursor', label: 'Cursor' },
];

export const AiProjectSetupDrawer: React.FC<AiProjectSetupDrawerProps> = ({
  open,
  onClose,
  project,
  defaultTarget,
  onInjectFiles,
}) => {
  const [target, setTarget] = useState<ProjectSetupTarget>(defaultTarget);
  const [selectedDocPath, setSelectedDocPath] = useState('README.md');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [injected, setInjected] = useState(false);

  const bundle = useMemo(() => generateProjectSetupBundle(project, target), [project, target]);

  const currentDoc = useMemo(
    () => bundle.files.find((file) => file.path === selectedDocPath) || bundle.files[0],
    [bundle, selectedDocPath]
  );

  const handleCopy = async () => {
    if (!currentDoc) return;
    try {
      await navigator.clipboard.writeText(currentDoc.content);
      setCopiedPath(currentDoc.path);
      setTimeout(() => setCopiedPath(null), 1600);
    } catch {
      return;
    }
  };

  const handleAddAllToWorkspace = () => {
    onInjectFiles(
      bundle.files.map((file) => ({
        path: file.path,
        content: file.content,
        summary: `Generated ${target} setup dossier`,
      }))
    );
    setInjected(true);
    setTimeout(() => setInjected(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} label="Thiết lập dự án" className="ws-modal ws-modal-right">
      <div className="ws-setup">
        <header className="ws-head">
          <h2 className="ws-head-title">Thiết lập</h2>
          <button type="button" className="icon-btn" aria-label="Đóng" title="Đóng" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="ws-setup-bar">
          <p className="ws-setup-hint">Bộ tệp hướng dẫn cho trình soạn thảo, kèm theo khi xuất ZIP.</p>
          <div className="ws-seg" role="group" aria-label="Trình soạn thảo">
            {TARGETS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="ws-seg-item"
                aria-pressed={target === item.id}
                onClick={() => setTarget(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-line btn-sm" onClick={handleAddAllToWorkspace}>
            {injected ? 'Đã nạp' : 'Nạp tệp'}
          </button>
        </div>

        <nav className="ws-setup-docs" aria-label="Tệp thiết lập">
          {bundle.files.map((doc) => (
            <button
              key={doc.path}
              type="button"
              className="ws-setup-doc"
              aria-current={currentDoc?.path === doc.path ? 'true' : undefined}
              onClick={() => setSelectedDocPath(doc.path)}
            >
              {doc.path}
            </button>
          ))}
        </nav>

        <div className="ws-setup-view">
          <div className="ws-setup-viewbar">
            <span className="ws-row-path">{currentDoc?.path}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleCopy()}>
              {copiedPath === currentDoc?.path ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>
          <pre className="ws-setup-code">{currentDoc?.content}</pre>
        </div>
      </div>
    </Modal>
  );
};
