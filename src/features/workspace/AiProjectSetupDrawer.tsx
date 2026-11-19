import React, { useMemo, useState } from 'react';
import { Check, Copy, FilePlus2, Layers, X } from 'lucide-react';
import type { ProjectSetupTarget, WorkspaceProject } from '../../types/index';
import { generateProjectSetupBundle } from '../../services/projectSetupGenerator';

export interface AiProjectSetupDrawerProps {
  open: boolean;
  onClose: () => void;
  project: WorkspaceProject;
  defaultTarget: ProjectSetupTarget;
  onInjectFiles: (files: Array<{ path: string; content: string; summary?: string }>) => void;
}

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

  const bundle = useMemo(
    () => generateProjectSetupBundle(project, target),
    [project, target]
  );

  const currentDoc = useMemo(
    () => bundle.files.find((f) => f.path === selectedDocPath) || bundle.files[0],
    [bundle, selectedDocPath]
  );

  if (!open) return null;

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
      bundle.files.map((f) => ({
        path: f.path,
        content: f.content,
        summary: `Generated ${target} setup dossier`,
      }))
    );
    setInjected(true);
    setTimeout(() => setInjected(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Project Setup Bundle Generator"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          color: 'var(--ink-primary)',
        }}
        className="w-full max-w-2xl h-full border-l flex flex-col overflow-hidden"
      >
        <header
          style={{
            background: 'var(--bg-panel)',
            borderColor: 'var(--border-subtle)',
          }}
          className="px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Layers className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">
                AI Project Setup Bundle (Antigravity / Cursor)
              </h2>
              <p style={{ color: 'var(--ink-secondary)' }} className="text-xs truncate">
                Tạo đồng bộ README, RULES, SKILLS, TASKS và PROJECT_CONTEXT để xuất ZIP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup drawer"
            style={{ color: 'var(--ink-secondary)' }}
            className="p-2 rounded-lg hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="px-5 py-3 border-b flex items-center justify-between gap-3 flex-wrap shrink-0"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTarget('antigravity')}
              aria-pressed={target === 'antigravity'}
              style={{
                background: target === 'antigravity' ? 'var(--accent-primary)' : 'var(--bg-panel)',
                color: target === 'antigravity' ? '#0b0d12' : 'var(--ink-primary)',
                borderColor: 'var(--border-subtle)',
              }}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
            >
              Antigravity Target
            </button>
            <button
              type="button"
              onClick={() => setTarget('cursor')}
              aria-pressed={target === 'cursor'}
              style={{
                background: target === 'cursor' ? 'var(--accent-primary)' : 'var(--bg-panel)',
                color: target === 'cursor' ? '#0b0d12' : 'var(--ink-primary)',
                borderColor: 'var(--border-subtle)',
              }}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
            >
              Cursor Target
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddAllToWorkspace}
            style={{
              background: injected ? 'var(--accent-jade)' : 'var(--bg-panel)',
              color: injected ? '#0b0d12' : 'var(--ink-primary)',
              borderColor: 'var(--border-strong)',
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
          >
            {injected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Đã thêm 5 tệp vào Workspace
              </>
            ) : (
              <>
                <FilePlus2 className="w-3.5 h-3.5" />
                Thêm 5 tệp vào cây dự án
              </>
            )}
          </button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] overflow-hidden">
          <nav
            aria-label="Generated setup files"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
            }}
            className="border-b md:border-b-0 md:border-r p-3 flex flex-row md:flex-col gap-1 overflow-x-auto"
          >
            {bundle.files.map((doc) => {
              const selected = currentDoc?.path === doc.path;
              return (
                <button
                  key={doc.path}
                  type="button"
                  onClick={() => setSelectedDocPath(doc.path)}
                  style={{
                    background: selected ? 'var(--bg-surface)' : 'transparent',
                    borderColor: selected ? 'var(--border-strong)' : 'transparent',
                    color: selected ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                  }}
                  className="text-left px-2.5 py-2 rounded-lg border font-mono text-xs shrink-0"
                >
                  {doc.path}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-col min-w-0 min-h-0">
            <div
              style={{ borderColor: 'var(--border-subtle)' }}
              className="px-4 py-2 border-b flex items-center justify-between gap-2 shrink-0"
            >
              <span className="font-mono text-xs font-semibold">{currentDoc?.path}</span>
              <button
                type="button"
                onClick={() => void handleCopy()}
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-primary)',
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs"
              >
                {copiedPath === currentDoc?.path ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép
                  </>
                )}
              </button>
            </div>
            <pre
              style={{
                background: 'var(--bg-canvas)',
                color: 'var(--ink-primary)',
              }}
              className="flex-1 min-h-0 overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words m-0"
            >
              {currentDoc?.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
