import React, { useMemo, useState } from 'react';
import { Archive, Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
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

type ProjectHealth = 'pass' | 'warn' | 'draft';

function getProjectHealth(project: WorkspaceProject): ProjectHealth {
  const report = project.checksReport;
  if (!report) return 'draft';
  if (report.failCount > 0 || report.warnCount > 0) return 'warn';
  return 'pass';
}

function getProjectHealthTitle(project: WorkspaceProject, health: ProjectHealth): string {
  const report = project.checksReport;
  if (health === 'pass' && report) {
    return `Đạt ${report.passCount}/${report.results.length} phép kiểm`;
  }
  if (health === 'warn' && report) {
    return `${report.failCount} lỗi · ${report.warnCount} cảnh báo kiểm định`;
  }
  return 'Chưa chạy kiểm định';
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
        const health = getProjectHealth(project);
        const healthTitle = getProjectHealthTitle(project, health);

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
              <div className="ws-rail-row-wrap">
                <button
                  type="button"
                  className="ws-rail-row"
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => onSelect(project.id)}
                >
                  <span className="ws-rail-name-row">
                    <span
                      className="ws-health-dot"
                      data-health={health}
                      title={healthTitle}
                      aria-hidden="true"
                    />
                    <span className="ws-rail-name">{project.name}</span>
                  </span>
                  <span className="ws-rail-meta">
                    <span>{project.files.length} tệp</span>
                    <time dateTime={project.updatedAt}>{formatStamp(project.updatedAt)}</time>
                  </span>
                </button>
                <div className="ws-rail-actions">
                  {onRename && (
                    <button
                      type="button"
                      className="ws-rail-icon-act"
                      aria-label={`Đổi tên ${project.name}`}
                      title="Đổi tên"
                      onClick={() => startRename(project)}
                    >
                      <Pencil size={13} aria-hidden="true" />
                    </button>
                  )}
                  {onTogglePin && (
                    <button
                      type="button"
                      className="ws-rail-icon-act"
                      aria-label={project.pinned ? `Bỏ ghim ${project.name}` : `Ghim ${project.name}`}
                      title={project.pinned ? 'Bỏ ghim' : 'Ghim phiên'}
                      aria-pressed={Boolean(project.pinned)}
                      onClick={() => onTogglePin(project.id)}
                    >
                      {project.pinned ? (
                        <PinOff size={13} aria-hidden="true" />
                      ) : (
                        <Pin size={13} aria-hidden="true" />
                      )}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="ws-rail-icon-act ws-rail-act-danger"
                      aria-label={`Xóa ${project.name}`}
                      title="Xóa phiên"
                      onClick={() => {
                        setEditingId(null);
                        setConfirmDeleteId(project.id);
                      }}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
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
        <button
          type="button"
          className="ws-icon-pill ws-icon-pill--accent"
          aria-label="Tạo phiên mới"
          title="Tạo phiên mới"
          onClick={onCreate}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
        {dismiss}
      </header>

      <div className="ws-rail-search">
        <SearchCard
          value={query}
          onChange={setQuery}
          placeholder="Tìm phiên..."
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
          <div className="ws-rail-foot-pair">
            <button
              type="button"
              className="ws-icon-pill"
              aria-label={showArchived ? 'Ẩn phiên lưu trữ' : 'Hiện phiên lưu trữ'}
              title={showArchived ? 'Ẩn lưu trữ' : 'Xem phiên lưu trữ'}
              aria-pressed={showArchived}
              onClick={() => setShowArchived((value) => !value)}
            >
              <Archive size={14} aria-hidden="true" />
            </button>
            <span className="t-label">Lưu trữ</span>
          </div>
          <span className="ws-count">{archivedCount}</span>
        </footer>
      )}
    </>
  );
};
