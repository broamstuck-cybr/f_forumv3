import React, { useId, useMemo, useState } from 'react';
import type { WorkspaceProject } from '../../types/index';
import { formatStamp } from './time';

interface ProjectRailProps {
  projects: WorkspaceProject[];
  activeProjectId: string;
  onSelect: (projectId: string) => void;
  onCreate: () => void;
  dismiss: React.ReactNode;
}

const SEARCH_THRESHOLD = 6;

export const ProjectRail: React.FC<ProjectRailProps> = ({
  projects,
  activeProjectId,
  onSelect,
  onCreate,
  dismiss,
}) => {
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const searchId = useId();

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

  const renderRows = (rows: WorkspaceProject[]) => (
    <ul className="ws-rail-rows">
      {rows.map((project) => (
        <li key={project.id}>
          <button
            type="button"
            className="ws-rail-row"
            aria-current={project.id === activeProjectId ? 'true' : undefined}
            data-archived={project.archived ? 'true' : undefined}
            onClick={() => onSelect(project.id)}
          >
            <span className="ws-rail-name">{project.name}</span>
            <time className="t-label" dateTime={project.updatedAt}>
              {formatStamp(project.updatedAt)}
            </time>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <header className="ws-head">
        <h2 className="ws-head-title">Dự án</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCreate}>
          Mới
        </button>
        {dismiss}
      </header>

      {projects.length > SEARCH_THRESHOLD && (
        <div className="ws-rail-search">
          <label className="sr-only" htmlFor={searchId}>
            Tìm dự án
          </label>
          <input
            id={searchId}
            type="search"
            className="field"
            placeholder="Tìm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      )}

      <nav className="ws-rail-list" aria-label="Dự án">
        {pinned.length > 0 && <p className="t-label ws-rail-cap">Ghim</p>}
        {pinned.length > 0 && renderRows(pinned)}
        {pinned.length > 0 && recent.length > 0 && <p className="t-label ws-rail-cap">Gần đây</p>}
        {recent.length > 0 && renderRows(recent)}
        {visible.length === 0 && <p className="ws-empty">Không thấy dự án nào.</p>}
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
