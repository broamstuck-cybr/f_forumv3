import React, { useMemo, useState } from 'react';
import {
  Archive,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  Folder,
  Home,
  Moon,
  Pencil,
  Pin,
  PinOff,
  PlusCircle,
  Search,
  Settings,
  Sun,
  Trash2,
} from 'lucide-react';
import type { AppRoute, ThemeMode, WorkspaceProject } from '../../types/index';
import { KineticLogo } from '../../components/brand/KineticLogo';
import { triggerPinuiThemeToggle } from '../../components/layout/GlobalThemeAtmosphere';

export interface ProjectRailProps {
  projects: WorkspaceProject[];
  activeProjectId: string;
  onSelect: (projectId: string) => void;
  onCreate: () => void;
  onRename?: (projectId: string, name: string) => void;
  onDelete?: (projectId: string) => void;
  onTogglePin?: (projectId: string) => void;
  onNavigate?: (route: AppRoute) => void;
  userName?: string;
  quotaLabel?: string;
  theme?: ThemeMode;
  dismiss?: React.ReactNode;
}

type ProjectHealth = 'pass' | 'warn' | 'draft';

function getProjectHealth(project: WorkspaceProject): ProjectHealth {
  const report = project.checksReport;
  if (!report) return 'draft';
  if (report.failCount > 0 || report.warnCount > 0) return 'warn';
  return 'pass';
}

export const ProjectRail: React.FC<ProjectRailProps> = ({
  projects,
  activeProjectId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onTogglePin,
  onNavigate,
  userName = 'Khách',
  quotaLabel,
  theme = 'dark',
  dismiss,
}) => {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
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
                  className="ws-rail-row ws-rail-row--flat"
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => onSelect(project.id)}
                >
                  <Folder size={13} className="ws-rail-branch-icon" aria-hidden="true" />
                  <span className="ws-rail-name">{project.name}</span>
                  <span
                    className="ws-health-dot"
                    data-health={health}
                    aria-hidden="true"
                  />
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
                      <Pencil size={12} aria-hidden="true" />
                    </button>
                  )}
                  {onTogglePin && (
                    <button
                      type="button"
                      className="ws-rail-icon-act"
                      aria-label={project.pinned ? `Bỏ ghim ${project.name}` : `Ghim ${project.name}`}
                      title={project.pinned ? 'Bỏ ghim' : 'Ghim'}
                      aria-pressed={Boolean(project.pinned)}
                      onClick={() => onTogglePin(project.id)}
                    >
                      {project.pinned ? (
                        <PinOff size={12} aria-hidden="true" />
                      ) : (
                        <Pin size={12} aria-hidden="true" />
                      )}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="ws-rail-icon-act ws-rail-act-danger"
                      aria-label={`Xóa ${project.name}`}
                      title="Xóa"
                      onClick={() => {
                        setEditingId(null);
                        setConfirmDeleteId(project.id);
                      }}
                    >
                      <Trash2 size={12} aria-hidden="true" />
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
        <button
          type="button"
          className="ws-rail-brand"
          onClick={() => onNavigate?.('home')}
          title="Về Trang chủ F-Forum"
        >
          <KineticLogo size={18} />
          <span>F-Forum</span>
        </button>
        {dismiss}
      </header>

      <div className="ws-rail-quick">
        <button type="button" className="ws-rail-nav-btn" onClick={onCreate}>
          <PlusCircle size={15} aria-hidden="true" />
          <span>Phiên mới</span>
        </button>
        {onNavigate && (
          <button type="button" className="ws-rail-nav-btn" onClick={() => onNavigate('explore')}>
            <Compass size={15} aria-hidden="true" />
            <span>Khám phá</span>
          </button>
        )}
        <button
          type="button"
          className="ws-rail-nav-btn"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((v) => !v)}
        >
          <Search size={15} aria-hidden="true" />
          <span>Tìm kiếm</span>
        </button>
        {onNavigate && (
          <>
            <button
              type="button"
              className="ws-rail-nav-btn ws-rail-nav-more"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
            >
              {moreOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
              <span>Xem thêm</span>
            </button>
            {moreOpen && (
              <div className="ws-rail-more-group">
                <button type="button" className="ws-rail-nav-btn" onClick={() => onNavigate('home')}>
                  <Home size={14} aria-hidden="true" />
                  <span>Trang chủ</span>
                </button>
                <button type="button" className="ws-rail-nav-btn" onClick={() => onNavigate('community')}>
                  <BookOpen size={14} aria-hidden="true" />
                  <span>Tri thức</span>
                </button>
                <button type="button" className="ws-rail-nav-btn" onClick={() => onNavigate('settings')}>
                  <Settings size={14} aria-hidden="true" />
                  <span>Cài đặt</span>
                </button>
              </div>
            )}
          </>
        )}
        {searchOpen && (
          <input
            type="search"
            className="field ws-rail-inline-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Lọc phiên theo tên..."
            aria-label="Lọc phiên theo tên"
            autoFocus
          />
        )}
      </div>

      <div className="ws-rail-list">
        {pinned.length > 0 && (
          <section aria-label="Phiên đã ghim">
            <p className="t-label ws-rail-cap">ĐÃ GHIM</p>
            {renderRows(pinned)}
          </section>
        )}

        <section aria-label="Phiên gần đây">
          <p className="t-label ws-rail-cap">GẦN ĐÂY</p>
          {recent.length > 0 ? (
            renderRows(recent)
          ) : (
            <p className="ws-empty">Chưa có phiên nào.</p>
          )}
        </section>

        {archivedCount > 0 && (
          <button
            type="button"
            className="ws-rail-archive-toggle"
            aria-pressed={showArchived}
            onClick={() => setShowArchived((value) => !value)}
          >
            <Archive size={13} aria-hidden="true" />
            <span>{showArchived ? 'Ẩn lưu trữ' : `Đã lưu trữ (${archivedCount})`}</span>
          </button>
        )}
      </div>

      <footer className="ws-rail-foot">
        <div className="ws-rail-user-card">
          <button
            type="button"
            className="ws-rail-user-btn"
            onClick={() => onNavigate?.('profile')}
            title="Hồ sơ cá nhân"
          >
            <span className="ws-rail-avatar" aria-hidden="true">
              {(userName.trim()[0] || 'K').toUpperCase()}
            </span>
            <span className="ws-rail-user-meta">
              <span className="ws-rail-user-name" title={userName}>
                {userName === 'System Administrator' ? 'Quản trị viên' : userName}
              </span>
              {quotaLabel && <span className="ws-rail-user-quota">{quotaLabel}</span>}
            </span>
          </button>
          <button
            type="button"
            className="ws-rail-theme-btn"
            onClick={(event) => triggerPinuiThemeToggle(event.currentTarget)}
            aria-label={theme === 'dark' ? 'Chuyển sang Sáng' : 'Chuyển sang Tối'}
            title={theme === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}
          >
            {theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
          </button>
        </div>
        {onNavigate && (
          <div className="ws-rail-legal">
            <button type="button" onClick={() => onNavigate('home')}>
              Trang chủ
            </button>
            <button type="button" onClick={() => onNavigate('community')}>
              Tri thức
            </button>
            <button type="button" onClick={() => onNavigate('settings')}>
              Cài đặt
            </button>
          </div>
        )}
      </footer>
    </>
  );
};
