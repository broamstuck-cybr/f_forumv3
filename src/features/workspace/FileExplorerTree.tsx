import React, { useMemo, useState } from 'react';
import type { WorkspaceFile } from '../../types/index';
import { sanitizeVirtualPath } from '../../engine/workspaceBundler';

export interface FileExplorerTreeProps {
  files: WorkspaceFile[];
  activeFilePath: string;
  modifiedPaths?: Set<string>;
  onSelectFile: (filePath: string) => void;
  onCreateFile: (filePath: string) => void;
  onDeleteFile: (filePath: string) => void;
}

interface TreeFolderNode {
  kind: 'folder';
  name: string;
  path: string;
  children: TreeNode[];
}

interface TreeFileNode {
  kind: 'file';
  name: string;
  path: string;
  file: WorkspaceFile;
}

type TreeNode = TreeFolderNode | TreeFileNode;

function buildFileTree(files: WorkspaceFile[]): TreeNode[] {
  const root: TreeFolderNode = { kind: 'folder', name: '', path: '', children: [] };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const curPath = parts.slice(0, i + 1).join('/');
      if (isLast) {
        current.children.push({
          kind: 'file',
          name: part,
          path: file.path,
          file,
        });
      } else {
        let existing = current.children.find(
          (n): n is TreeFolderNode => n.kind === 'folder' && n.name === part
        );
        if (!existing) {
          existing = { kind: 'folder', name: part, path: curPath, children: [] };
          current.children.push(existing);
        }
        current = existing;
      }
    }
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.kind === 'folder') sortNodes(node.children);
    }
    return nodes;
  };

  return sortNodes(root.children);
}

function fileBadgeLabel(filePath: string): { label: string; cls: string } {
  const lower = filePath.toLowerCase();
  if (/\.tsx$/.test(lower)) return { label: 'TSX', cls: 'is-tsx' };
  if (/\.ts$/.test(lower)) return { label: 'TS', cls: 'is-ts' };
  if (/\.jsx$/.test(lower)) return { label: 'JSX', cls: 'is-js' };
  if (/\.m?js$/.test(lower)) return { label: 'JS', cls: 'is-js' };
  if (/\.css$/.test(lower)) return { label: 'CSS', cls: 'is-css' };
  if (/\.html?$/.test(lower)) return { label: 'HTM', cls: 'is-html' };
  if (/\.json$/.test(lower)) return { label: 'JSN', cls: 'is-json' };
  if (/\.md$/.test(lower)) return { label: 'MD', cls: 'is-md' };
  return { label: 'TXT', cls: 'is-plain' };
}

export const FileExplorerTree: React.FC<FileExplorerTreeProps> = ({
  files,
  activeFilePath,
  modifiedPaths,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}) => {
  const [search, setSearch] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, search]);

  const tree = useMemo(() => buildFileTree(filteredFiles), [filteredFiles]);

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderPath]: !prev[folderPath] }));
  };

  const handleSubmitCreate = (ev: React.FormEvent) => {
    ev.preventDefault();
    const safe = sanitizeVirtualPath(newFileName);
    if (!safe) {
      setCreateError('Tên tệp không hợp lệ (ví dụ: src/App.tsx)');
      return;
    }
    if (files.some((f) => f.path.toLowerCase() === safe.toLowerCase())) {
      setCreateError('Tệp này đã tồn tại');
      return;
    }
    onCreateFile(safe);
    setNewFileName('');
    setCreateError(null);
    setCreating(false);
  };

  const renderNodes = (nodes: TreeNode[], depth = 0): React.ReactNode => {
    return nodes.map((node) => {
      if (node.kind === 'folder') {
        const isCollapsed = Boolean(collapsedFolders[node.path]) && !search.trim();
        return (
          <div key={node.path} className="ws-treeGroup">
            <button
              type="button"
              className="ws-treeRow ws-treeRow--folder"
              style={{ paddingLeft: `${10 + depth * 14}px` }}
              aria-expanded={!isCollapsed}
              onClick={() => toggleFolder(node.path)}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`ws-treeChevron${isCollapsed ? '' : ' is-open'}`}
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ws-treeFolderIcon"
                aria-hidden="true"
              >
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
              </svg>
              <span className="ws-treeName">{node.name}</span>
            </button>
            {!isCollapsed && (
              <div className="ws-treeChildren">{renderNodes(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      const isActive = node.path === activeFilePath;
      const isModified = Boolean(modifiedPaths?.has(node.path));
      const badge = fileBadgeLabel(node.path);
      const canDelete = files.length > 1 && node.path.toLowerCase() !== 'index.html';

      return (
        <div
          key={node.path}
          className={`ws-treeFileWrap${isActive ? ' is-active' : ''}`}
        >
          <button
            type="button"
            className={`ws-treeRow ws-treeRow--file${isActive ? ' is-active' : ''}`}
            style={{ paddingLeft: `${14 + depth * 14}px` }}
            onClick={() => onSelectFile(node.path)}
            title={node.path}
          >
            <span className={`ws-fileExt ${badge.cls}`}>{badge.label}</span>
            <span className="ws-treeName">{node.name}</span>
            {isModified && <span className="ws-treeModDot" aria-label="Đã chỉnh sửa" />}
          </button>
          {canDelete && (
            <button
              type="button"
              className="ws-treeDelBtn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(node.path);
              }}
              aria-label={`Xóa tệp ${node.path}`}
              title="Xóa tệp"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <aside className="ws-explorer" aria-label="Cây tệp dự án">
      <div className="ws-explorer__head">
        <span className="ws-explorer__title">Tệp ({files.length})</span>
        <button
          type="button"
          className="ws-explorer__addBtn"
          onClick={() => {
            setCreating((v) => !v);
            setCreateError(null);
          }}
          aria-label="Tạo tệp mới"
          title="Tạo tệp mới"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>

      {creating && (
        <form className="ws-explorer__createForm" onSubmit={handleSubmitCreate}>
          <input
            type="text"
            className="ws-explorer__input"
            value={newFileName}
            onChange={(e) => {
              setNewFileName(e.target.value);
              if (createError) setCreateError(null);
            }}
            placeholder="src/App.tsx"
            aria-label="Đường dẫn tệp mới"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setCreating(false);
                setCreateError(null);
              }
            }}
          />
          <div className="ws-explorer__createActs">
            <button type="submit" className="ws-explorer__confirmBtn">
              Tạo
            </button>
            <button
              type="button"
              className="ws-explorer__cancelBtn"
              onClick={() => {
                setCreating(false);
                setCreateError(null);
              }}
            >
              Hủy
            </button>
          </div>
          {createError && <span className="ws-explorer__err">{createError}</span>}
        </form>
      )}

      <div className="ws-explorer__searchWrap">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ws-explorer__searchIcon"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          className="ws-explorer__search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tệp..."
          aria-label="Tìm tệp trong dự án"
        />
      </div>

      <div className="ws-explorer__tree" role="tree">
        {tree.length === 0 ? (
          <div className="ws-explorer__empty">Không có tệp khớp từ khóa.</div>
        ) : (
          renderNodes(tree)
        )}
      </div>
    </aside>
  );
};
