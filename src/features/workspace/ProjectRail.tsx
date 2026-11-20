import React, { useMemo, useState } from 'react';
import { SearchCard } from '../../components/pinui/SearchCard';
import type { WorkspaceProject } from '../../types/index';
import { formatStamp } from './time';

export interface ProjectRailProps {
  projects: WorkspaceProject[];
  activeProjectId: string;
  onSelect: (projectId: string) => void;
  onCreate: () => void;
  onRename?: (projectId: string, name: string) => void;
  onDelete?: (projectId: string) => void;
  onTogglePin?: (projectId: string) => void;
  dismiss?: React.ReactNode;
}

export const ProjectRail: React.FC<ProjectRailProps> = ({
  projects,
  activeProjectId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onTogglePin,
  dismiss,
}) => {
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const archivedCount = useMemo(
    () => projects.filter((project) => project.archived).length,
    [projects]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return projects
      .filter((project) => showArchived || !project.archived || project.id === activeProjectId)
      .filter(
        (project) =>
          !needle ||
          project.name.toLowerCase().includes(needle) ||
          project.description.toLowerCase().includes(needle)
      )
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  }, [projects, query, showArchived, activeProjectId]);

  const pinned = visible.filter((project) => project.pinned);
  const recent = visible.filter((project) => !project.pinned);

  const startRename = (project: WorkspaceProject) => {
    setConfirmDeleteId(null);
    setEditingId(project.id);
    setEditDraft(project.name);
  };

  const submitInlineRename = (event: React.FormEvent, projectId: string) => {
    event.preventDefault();
    const cleaned = editDraft.trim();
    if (cleaned && onRename) {
      onRename(projectId, cleaned);
    }
    setEditingId(null);
  };

  const renderRows = (rows: WorkspaceProject[]) => (
    <ul className="ws-rail-rows">
      {rows.map((project) => {
        const isCurrent = project.id === activeProjectId;
        const isEditing = editingId === project.id;
        const isDeleting = confirmDeleteId === project.id;

        return (
          <li
            key={project.id}
            className="ws-rail-item"
            data-active={isCurrent ? 'true' : undefined}
            data-archived={project.archived ? 'true' : undefined}
          >
            {isEditing ? (
              <form
                className="ws-rail-inline-form"
                onSubmit={(event) => submitInlineRename(event, project.id)}
              >
                <input
                  type="text"
                  className="field ws-rail-inline-input"
                  value={editDraft}
                  aria-label="Tên phiên làm việc"
                  autoFocus
                  onChange={(event) => setEditDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setEditingId(null);
                  }}
                />
                <div className="ws-rail-inline-btns">
                  <button type="submit" className="btn btn-solid btn-sm">
                    Lưu
                  </button>
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => setEditingId(null)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : isDeleting ? (
              <div className="ws-rail-inline-confirm">
                <span className="ws-rail-confirm-text">Xóa “{project.name}”?</span>
                <div className="ws-rail-inline-btns">
                  <button
                    type="button"
                    className="btn btn-red btn-sm"
                    onClick={() => {
                      onDelete?.(project.id);
                      setConfirmDeleteId(null);
                    }}
                  >
                    Xóa
                  </button>
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="ws-rail-row"
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => onSelect(project.id)}
                >
                  <span className="ws-rail-name">{project.name}</span>
                  <span className="ws-rail-meta">
                    <span>{project.files.length} tệp</span>
                    <time dateTime={project.updatedAt}>{formatStamp(project.updatedAt)}</time>
                  </span>
                </button>
                <div className="ws-rail-actions">
                  {onRename && (
                    <button
                      type="button"
                      className="ws-rail-act"
                      aria-label={`Đổi tên ${project.name}`}
                      onClick={() => startRename(project)}
                    >
                      Sửa
                    </button>
                  )}
                  {onTogglePin && (
                    <button
                      type="button"
                      className="ws-rail-act"
                      aria-label={project.pinned ? `Bỏ ghim ${project.name}` : `Ghim ${project.name}`}
                      onClick={() => onTogglePin(project.id)}
                    >
                      {project.pinned ? 'Bỏ ghim' : 'Ghim'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="ws-rail-act ws-rail-act-danger"
                      aria-label={`Xóa ${project.name}`}
                      onClick={() => {
                        setEditingId(null);
                        setConfirmDeleteId(project.id);
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <header className="ws-head ws-rail-head">
        <h2 className="ws-head-title">Phiên</h2>
        <button type="button" className="btn btn-red btn-sm" onClick={onCreate}>
          + Phiên mới
        </button>
        {dismiss}
      </header>

      <div className="ws-rail-search">
        <SearchCard
          value={query}
          onChange={setQuery}
          placeholder="Tìm phiên hoặc chủ đề..."
          compact
        />
      </div>

      <nav className="ws-rail-list" aria-label="Danh sách phiên làm việc">
        {pinned.length > 0 && <p className="t-label ws-rail-cap">Đã ghim</p>}
        {pinned.length > 0 && renderRows(pinned)}
        {pinned.length > 0 && recent.length > 0 && <p className="t-label ws-rail-cap">Gần đây</p>}
        {recent.length > 0 && renderRows(recent)}
        {visible.length === 0 && <p className="ws-empty">Không tìm thấy phiên phù hợp.</p>}
      </nav>

      {archivedCount > 0 && (
        <footer className="ws-rail-foot">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-pressed={showArchived}
            onClick={() => setShowArchived((value) => !value)}
          >
            Lưu trữ
          </button>
          <span className="t-label">{archivedCount}</span>
        </footer>
      )}
    </>
  );
};
