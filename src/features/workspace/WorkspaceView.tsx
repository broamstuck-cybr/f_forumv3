import React, { useMemo, useRef, useState } from 'react';
import {
  Archive,
  Check,
  GitBranch,
  Maximize2,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  PictureInPicture2,
  Pin,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import {
  Chips,
  DynamicDropZone,
  LiquidTabs,
  PromptComposer,
  SearchCard,
  TaskCard,
  type ChipItem,
} from '../../components/pinui';
import { useAppStore } from '../../store/appStore';
import { AiProjectSetupDrawer } from './AiProjectSetupDrawer';
import { ChecksPanel } from './ChecksPanel';
import { DiffViewer } from './DiffViewer';
import { LivePreviewFrame, type PreviewViewportMode } from './LivePreviewFrame';

type CenterPaneMode = 'chat' | 'preview' | 'code';
type MobileColumnTab = 'history' | 'arena' | 'inspector';
type AgentExecutionMode = 'Build' | 'Refine' | 'Audit';

const CHIP_ACTIONS: ChipItem[] = [
  {
    id: 'Build',
    label: 'Dựng',
    accent: 'var(--accent-primary)',
    lip: 'var(--accent-copper)',
    bg: 'var(--accent-soft)',
    ink: 'var(--accent-primary)',
  },
  {
    id: 'Refine',
    label: 'Tinh chỉnh',
    accent: 'var(--accent-verdigris)',
    lip: 'var(--accent-verdigris)',
    bg: 'var(--accent-verdigris-soft)',
    ink: 'var(--accent-verdigris)',
  },
  {
    id: 'Audit',
    label: 'Kiểm định',
    accent: 'var(--accent-jade)',
    lip: 'var(--accent-jade)',
    bg: 'var(--accent-jade-soft)',
    ink: 'var(--accent-jade)',
  },
  {
    id: 'Design',
    label: 'Thiết kế',
    accent: 'var(--accent-copper)',
    lip: 'var(--accent-copper)',
    bg: 'var(--accent-soft)',
    ink: 'var(--accent-copper)',
  },
];

const MODEL_OPTIONS = [
  { id: 'auto', name: 'Định tuyến', note: 'Cấu hình Gateway mặc định' },
  { id: 'studio-smart-route', name: 'Smart Route', note: 'Cân bằng tốc độ và chiều sâu' },
  { id: 'studio-heavy-route', name: 'Heavy Route', note: 'Kiến trúc đa tệp phức tạp' },
  { id: 'ag/gemini-3.8-flash-low', name: 'Gemini Flash', note: 'Phản hồi nhanh' },
  { id: 'ag/gemini-4-argon-high', name: 'Gemini Argon', note: 'Phân tích hệ thống' },
  { id: 'ag/claude-sonnet-5-5-medium', name: 'Sonnet 5.5', note: 'Thiết kế UI tinh gọn' },
];

function isSameCalendarDay(iso: string, now: Date): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export const WorkspaceView: React.FC = () => {
  const {
    projects,
    activeProject,
    createProject,
    selectProject,
    deleteProject,
    renameProject,
    togglePinProject,
    toggleArchiveProject,
    setActiveFilePath,
    updateWorkspaceFile,
    addWorkspaceFiles,
    attachItemToWorkspace,
    detachItemFromWorkspace,
    sendWorkspacePrompt,
    runChecksOnActiveProject,
    createProjectSnapshot,
    restoreProjectSnapshot,
    exportActiveProjectZip,
    aiActivity,
    quota,
    currentUser,
    settings,
    navigate,
    addToast,
  } = useAppStore();

  const [centerMode, setCenterMode] = useState<CenterPaneMode>('chat');
  const [previewMode, setPreviewMode] = useState<PreviewViewportMode>('desktop');
  const [rightTab, setRightTab] = useState<'diff' | 'checks'>('diff');
  const [mobileColumn, setMobileColumn] = useState<MobileColumnTab>('arena');
  const [railCollapsed, setRailCollapsed] = useState(false);

  const [historyQuery, setHistoryQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const [composerValue, setComposerValue] = useState('');
  const [agentMode, setAgentMode] = useState<AgentExecutionMode>('Build');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [dropZoneOpen, setDropZoneOpen] = useState(false);
  const [setupDrawerOpen, setSetupDrawerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [githubConnected, setGithubConnected] = useState(false);
  const [githubScope, setGithubScope] = useState<'read-only' | 'pr-push'>('read-only');

  const [leftWidthPct, setLeftWidthPct] = useState(19);
  const [rightWidthPct, setRightWidthPct] = useState(26);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredProjects = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    return [...projects]
      .filter((p) => (showArchived ? true : !p.archived))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [projects, historyQuery, showArchived]);

  const groupedProjects = useMemo(() => {
    const now = new Date();
    const today: typeof filteredProjects = [];
    const older: typeof filteredProjects = [];
    for (const proj of filteredProjects) {
      if (isSameCalendarDay(proj.updatedAt, now)) {
        today.push(proj);
      } else {
        older.push(proj);
      }
    }
    return { today, older };
  }, [filteredProjects]);

  const diffTotals = useMemo(() => {
    let added = 0;
    let deleted = 0;
    for (const d of activeProject.diffs) {
      added += d.additions;
      deleted += d.deletions;
    }
    return { added, deleted };
  }, [activeProject.diffs]);

  const taskCardItems = useMemo(() => {
    return activeProject.processes.slice(0, 4).map((proc) => ({
      id: proc.id,
      label: proc.name,
      status: (proc.status === 'completed'
        ? 'completed'
        : proc.status === 'running'
          ? 'running'
          : 'failed') as 'completed' | 'running' | 'waiting' | 'failed' | 'approval',
      detail: proc.detail,
    }));
  }, [activeProject.processes]);

  const isGenerating = aiActivity === 'thinking' || aiActivity === 'streaming';
  const quotaBlocked = !quota.unlimited && quota.exhausted;

  const handleChipToggle = (id: string) => {
    if (id === 'Design') {
      setDropZoneOpen((v) => !v);
      return;
    }
    if (id === 'Build' || id === 'Refine' || id === 'Audit') {
      setAgentMode(id);
    }
  };

  const handleSendPrompt = async (overrideText?: string) => {
    const raw = (overrideText !== undefined ? overrideText : composerValue).trim();
    if (!raw || isGenerating) return;
    setComposerValue('');
    const taggedPrompt = `[Mode: ${agentMode}] ${raw}`;
    await sendWorkspacePrompt(taggedPrompt, { model: selectedModel, agentMode });
  };

  const handleExportZip = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await exportActiveProjectZip(true, settings.defaultExportTarget);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: result.clean ? 'success' : 'warning',
        title: `Đã xuất ${result.filename}`,
        message: result.clean
          ? 'Không phát hiện chuỗi nhạy cảm trong gói ZIP.'
          : `Đã ẩn ${result.findingsCount} chuỗi nhạy cảm trước khi đóng gói.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Xuất ZIP thất bại',
        message: 'Không thể khởi tạo tệp nén từ Workspace.',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleFilesDropped = (incoming: Array<{ name: string; content: string }>) => {
    if (!incoming.length) return;
    addWorkspaceFiles(
      incoming.map((f) => ({
        path: f.name,
        content: f.content,
        summary: 'Tệp đính kèm cục bộ',
      }))
    );
    attachItemToWorkspace({
      id: `upload-${Date.now()}`,
      kind: 'blueprint',
      title: incoming.map((f) => f.name).join(', '),
      summary: `${incoming.length} tệp từ thiết bị`,
    });
    setDropZoneOpen(false);
  };

  const handleDividerPointerDown =
    (_side: 'left' | 'right') => (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
    };

  const handleDividerPointerMove =
    (side: 'left' | 'right') => (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId) || !gridContainerRef.current) return;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      if (side === 'left') {
        setLeftWidthPct(Math.max(15, Math.min(28, Math.round(pct))));
      } else {
        const fromRight = 100 - pct;
        setRightWidthPct(Math.max(20, Math.min(34, Math.round(fromRight))));
      }
    };

  const handleDividerKeyDown =
    (side: 'left' | 'right') => (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!['ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Escape') {
        setLeftWidthPct(19);
        setRightWidthPct(26);
        return;
      }
      const delta = e.key === 'ArrowRight' ? 2 : -2;
      if (side === 'left') {
        setLeftWidthPct((v) => Math.max(15, Math.min(28, v + delta)));
      } else {
        setRightWidthPct((v) => Math.max(20, Math.min(34, v - delta)));
      }
    };

  const handleJumpToFile = (filePath: string) => {
    setActiveFilePath(filePath);
    setCenterMode('code');
    setMobileColumn('arena');
  };

  const renderProjectRow = (proj: (typeof filteredProjects)[number]) => {
    const isActive = proj.id === activeProject.id;
    const isRenaming = renamingId === proj.id;

    return (
      <li
        key={proj.id}
        style={{
          background: isActive ? 'var(--bg-panel)' : 'transparent',
          borderColor: isActive ? 'var(--border-strong)' : 'transparent',
        }}
        className="group rounded-xl border px-2.5 py-2 transition-colors"
      >
        {isRenaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              renameProject(proj.id, renameDraft);
              setRenamingId(null);
            }}
            className="flex items-center gap-1"
          >
            <input
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              autoFocus
              aria-label="Tên dự án"
              style={{
                background: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
                color: 'var(--ink-primary)',
              }}
              className="flex-1 min-w-0 px-2 py-1 rounded-md border text-xs outline-none"
            />
            <button
              type="submit"
              aria-label="Lưu tên"
              title="Lưu tên"
              style={{ color: 'var(--accent-jade)' }}
              className="p-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => {
                selectProject(proj.id);
                setMobileColumn('arena');
              }}
              className="text-left flex-1 min-w-0 cursor-pointer"
            >
              <span
                style={{ color: isActive ? 'var(--ink-primary)' : 'var(--ink-secondary)' }}
                className="text-[13px] font-medium truncate block"
              >
                {proj.name}
              </span>
            </button>

            <div
              className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
                proj.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={() => togglePinProject(proj.id)}
                aria-label="Ghim"
                title="Ghim"
                style={{
                  color: proj.pinned ? 'var(--accent-primary)' : 'var(--ink-muted)',
                }}
                className="p-1 rounded hover:opacity-80 cursor-pointer"
              >
                <Pin className="w-3 h-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setRenamingId(proj.id);
                  setRenameDraft(proj.name);
                }}
                aria-label="Đổi tên"
                title="Đổi tên"
                style={{ color: 'var(--ink-muted)' }}
                className="p-1 rounded hover:opacity-80 cursor-pointer"
              >
                <Pencil className="w-3 h-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => toggleArchiveProject(proj.id)}
                aria-label="Lưu trữ"
                title="Lưu trữ"
                style={{
                  color: proj.archived ? 'var(--accent-copper)' : 'var(--ink-muted)',
                }}
                className="p-1 rounded hover:opacity-80 cursor-pointer"
              >
                <Archive className="w-3 h-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => deleteProject(proj.id)}
                aria-label="Xóa"
                title="Xóa"
                style={{ color: 'var(--ink-muted)' }}
                className="p-1 rounded hover:opacity-80 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </li>
    );
  };

  const desktopGridColumns = railCollapsed
    ? `minmax(0,1fr) 8px minmax(260px,${rightWidthPct}%)`
    : `minmax(210px,${leftWidthPct}%) 8px minmax(0,1fr) 8px minmax(260px,${rightWidthPct}%)`;

  const selectedChipIds = dropZoneOpen ? [agentMode, 'Design'] : [agentMode];

  return (
    <main
      style={{
        background: 'var(--bg-canvas)',
        color: 'var(--ink-primary)',
      }}
      className="min-h-[calc(100vh-64px)] w-full flex flex-col overflow-x-clip"
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
        className="lg:hidden px-3 py-2 border-b flex items-center justify-between gap-2"
      >
        <div className="grid grid-cols-3 gap-1.5 w-full">
          {(
            [
              { id: 'history', label: 'Hội thoại' },
              { id: 'arena', label: 'Sân khấu' },
              { id: 'inspector', label: 'Diff & Check' },
            ] as Array<{ id: MobileColumnTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileColumn(tab.id)}
              aria-pressed={mobileColumn === tab.id}
              style={{
                background: mobileColumn === tab.id ? 'var(--bg-panel)' : 'transparent',
                borderColor:
                  mobileColumn === tab.id ? 'var(--border-strong)' : 'var(--border-subtle)',
                color:
                  mobileColumn === tab.id ? 'var(--accent-primary)' : 'var(--ink-secondary)',
              }}
              className="py-1.5 px-2 rounded-lg border text-xs font-medium truncate cursor-pointer"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={gridContainerRef}
        style={
          {
            '--ff-ws-grid': desktopGridColumns,
          } as React.CSSProperties
        }
        className="flex-1 min-h-0 flex flex-col lg:grid lg:[grid-template-columns:var(--ff-ws-grid)]"
      >
        {!railCollapsed && (
          <aside
            aria-label="Lịch sử hội thoại"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            className={`${
              mobileColumn === 'history' ? 'flex' : 'hidden'
            } lg:flex flex-col gap-3 p-3.5 border-r min-w-0 overflow-y-auto ff-scrollbar`}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  createProject(`Phiên dựng #${projects.length + 1}`);
                  setCenterMode('chat');
                  setMobileColumn('arena');
                }}
                style={{
                  background: 'var(--accent-primary)',
                  color: 'var(--ink-inverse)',
                }}
                className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tạo mới
              </button>
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                aria-pressed={showArchived}
                aria-label="Hiện lưu trữ"
                title="Hiện lưu trữ"
                style={{
                  background: showArchived ? 'var(--bg-panel)' : 'transparent',
                  borderColor: 'var(--border-subtle)',
                  color: showArchived ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                }}
                className="p-2 rounded-xl border cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setRailCollapsed(true)}
                aria-label="Thu gọn thanh bên"
                title="Thu gọn thanh bên"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-secondary)',
                }}
                className="hidden lg:inline-flex p-2 rounded-xl border cursor-pointer"
              >
                <PanelLeftClose className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <SearchCard
              value={historyQuery}
              onChange={setHistoryQuery}
              placeholder="Tìm chuỗi hội thoại..."
              compact
            />

            <div className="flex-1 min-h-0 overflow-y-auto ff-scrollbar space-y-4 pr-0.5">
              {groupedProjects.today.length > 0 && (
                <section aria-label="Hôm nay" className="space-y-1">
                  <div
                    className="px-2.5 text-[11px] font-medium"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    Hôm nay
                  </div>
                  <ul className="m-0 p-0 list-none flex flex-col gap-0.5">
                    {groupedProjects.today.map(renderProjectRow)}
                  </ul>
                </section>
              )}

              {groupedProjects.older.length > 0 && (
                <section aria-label="Trước đó" className="space-y-1">
                  <div
                    className="px-2.5 text-[11px] font-medium"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    Trước đó
                  </div>
                  <ul className="m-0 p-0 list-none flex flex-col gap-0.5">
                    {groupedProjects.older.map(renderProjectRow)}
                  </ul>
                </section>
              )}

              {filteredProjects.length === 0 && (
                <p className="px-2.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Chưa có phiên phù hợp.
                </p>
              )}
            </div>
          </aside>
        )}

        {!railCollapsed && (
          <button
            type="button"
            role="separator"
            aria-orientation="vertical"
            aria-label="Điều chỉnh thanh lịch sử"
            aria-valuemin={15}
            aria-valuemax={28}
            aria-valuenow={leftWidthPct}
            onPointerDown={handleDividerPointerDown('left')}
            onPointerMove={handleDividerPointerMove('left')}
            onKeyDown={handleDividerKeyDown('left')}
            style={{ background: 'var(--bg-canvas)' }}
            className="hidden lg:flex items-center justify-center cursor-col-resize select-none border-0 p-0"
          >
            <span
              style={{ background: 'var(--border-subtle)' }}
              className="w-px h-14 rounded-full"
            />
          </button>
        )}

        <section
          aria-label="Sân khấu chính"
          className={`${
            mobileColumn === 'arena' ? 'flex' : 'hidden'
          } lg:flex flex-col min-w-0 min-h-0 px-3 py-3 lg:px-5 lg:py-4 gap-3.5`}
        >
          <header
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-2xl border px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              {railCollapsed && (
                <button
                  type="button"
                  onClick={() => setRailCollapsed(false)}
                  aria-label="Mở thanh lịch sử"
                  title="Mở thanh lịch sử"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-secondary)',
                  }}
                  className="hidden lg:inline-flex p-1.5 rounded-lg border cursor-pointer"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
              <h1
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                className="m-0 text-base sm:text-lg font-semibold truncate"
              >
                {activeProject.name}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCenterMode('chat')}
                aria-pressed={centerMode === 'chat'}
                style={{
                  background: centerMode === 'chat' ? 'var(--bg-panel)' : 'transparent',
                  borderColor: centerMode === 'chat' ? 'var(--border-strong)' : 'transparent',
                  color: centerMode === 'chat' ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer"
              >
                Hội thoại
              </button>
              <button
                type="button"
                onClick={() => setCenterMode('code')}
                aria-pressed={centerMode === 'code'}
                style={{
                  background: centerMode === 'code' ? 'var(--bg-panel)' : 'transparent',
                  borderColor: centerMode === 'code' ? 'var(--border-strong)' : 'transparent',
                  color: centerMode === 'code' ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer"
              >
                Mã nguồn
              </button>

              {centerMode === 'preview' && (
                <div
                  style={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                  }}
                  className="inline-flex items-center rounded-xl border p-0.5"
                >
                  {(
                    [
                      { id: 'desktop', label: 'Màn hình lớn', icon: Monitor },
                      { id: 'mobile', label: 'Di động 390px', icon: Smartphone },
                      { id: 'fullscreen', label: 'Toàn màn hình', icon: Maximize2 },
                      { id: 'pip', label: 'Cửa sổ nổi', icon: PictureInPicture2 },
                    ] as const
                  ).map((vp) => {
                    const Icon = vp.icon;
                    const active = previewMode === vp.id;
                    return (
                      <button
                        key={vp.id}
                        type="button"
                        onClick={() => setPreviewMode(vp.id)}
                        aria-pressed={active}
                        aria-label={vp.label}
                        title={vp.label}
                        style={{
                          background: active ? 'var(--bg-surface)' : 'transparent',
                          color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                        }}
                        className="p-1.5 rounded-lg cursor-pointer"
                      >
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleExportZip()}
                disabled={exporting}
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--ink-primary)',
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-medium disabled:opacity-60 cursor-pointer"
              >
                {exporting ? 'Đang nén' : 'Xuất ZIP'}
              </button>
            </div>
          </header>

          {activeProject.attachedItems.length > 0 && (
            <div className="flex items-center justify-between gap-2 flex-wrap px-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {activeProject.attachedItems.map((item) => (
                  <span
                    key={item.id}
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--ink-primary)',
                    }}
                    className="inline-flex items-center gap-1.5 max-w-[260px] px-2.5 py-1 rounded-full border text-[11px]"
                  >
                    <span className="truncate">{item.title}</span>
                    <button
                      type="button"
                      onClick={() => detachItemFromWorkspace(item.id)}
                      aria-label={`Gỡ ${item.title}`}
                      title={`Gỡ ${item.title}`}
                      style={{ color: 'var(--ink-muted)' }}
                      className="cursor-pointer hover:opacity-80"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('explore')}
                style={{ color: 'var(--accent-primary)' }}
                className="text-xs font-medium hover:underline cursor-pointer"
              >
                Khám phá
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0 flex flex-col">
            {centerMode === 'preview' ? (
              <LivePreviewFrame
                files={activeProject.files}
                mode={previewMode === 'pip' ? 'desktop' : previewMode}
                onModeChange={setPreviewMode}
                title={activeProject.name}
              />
            ) : centerMode === 'code' ? (
              <DiffViewer
                files={activeProject.files}
                diffs={activeProject.diffs}
                activeFilePath={activeProject.activeFilePath}
                onSelectFile={setActiveFilePath}
                onUpdateFile={updateWorkspaceFile}
              />
            ) : (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="flex-1 min-h-[300px] max-h-[62vh] rounded-2xl border px-5 py-5 overflow-y-auto ff-scrollbar flex flex-col gap-5"
              >
                {activeProject.messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isSystem = msg.role === 'system';
                  return (
                    <article
                      key={msg.id}
                      style={{
                        background: isUser
                          ? 'var(--bg-panel)'
                          : isSystem
                            ? 'var(--accent-soft)'
                            : 'transparent',
                        borderColor: isSystem
                          ? 'var(--border-accent)'
                          : isUser
                            ? 'var(--border-subtle)'
                            : 'var(--border-subtle)',
                      }}
                      className={`${
                        isUser || isSystem ? 'rounded-xl border px-4 py-3.5' : 'border-b pb-5 last:border-b-0'
                      } flex flex-col gap-2 overflow-hidden`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span
                          style={{
                            color: isUser
                              ? 'var(--accent-primary)'
                              : isSystem
                                ? 'var(--accent-copper)'
                                : 'var(--accent-verdigris)',
                          }}
                          className="font-semibold"
                        >
                          {isUser
                            ? currentUser?.name || 'Bạn'
                            : isSystem
                              ? 'Thông báo'
                              : 'F-Forum'}
                        </span>
                        <span style={{ color: 'var(--ink-muted)' }} className="font-mono">
                          {msg.modelUsed ? `${msg.modelUsed} · ` : ''}
                          {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p
                        style={{ color: 'var(--ink-primary)' }}
                        className="m-0 text-sm leading-relaxed whitespace-pre-wrap break-words"
                      >
                        {msg.content}
                      </p>

                      {msg.changedFiles && msg.changedFiles.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {msg.changedFiles.map((filePath) => (
                            <button
                              key={filePath}
                              type="button"
                              onClick={() => handleJumpToFile(filePath)}
                              style={{
                                background: 'var(--bg-panel)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--accent-primary)',
                              }}
                              className="px-2.5 py-1 rounded-lg border font-mono text-[11px] cursor-pointer hover:opacity-90"
                            >
                              {filePath}
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-2xl border p-3 flex flex-col gap-2.5 shrink-0"
          >
            {dropZoneOpen && (
              <div
                style={{ borderColor: 'var(--border-subtle)' }}
                className="rounded-xl border p-2.5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Nạp tệp thiết kế hoặc mã nguồn
                  </span>
                  <button
                    type="button"
                    onClick={() => setDropZoneOpen(false)}
                    aria-label="Đóng khung nạp tệp"
                    title="Đóng"
                    style={{ color: 'var(--ink-muted)' }}
                    className="p-1 rounded-lg cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                <DynamicDropZone
                  onFilesAdded={handleFilesDropped}
                  label="Thả tệp HTML, CSS, JS hoặc ảnh mẫu vào đây"
                  compact
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Chips
                items={CHIP_ACTIONS}
                selectedIds={selectedChipIds}
                onToggle={handleChipToggle}
                multi={false}
                variant="tactile"
                corner={10}
              />

              <div className="ml-auto flex items-center gap-2 flex-wrap shrink-0">
                <span
                  style={{ color: 'var(--ink-secondary)' }}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap"
                >
                  <GitBranch className="w-3.5 h-3.5" style={{ color: 'var(--accent-verdigris)' }} aria-hidden="true" />
                  <span>main</span>
                  <span style={{ color: 'var(--accent-jade)' }}>+{diffTotals.added}</span>
                </span>

                <span
                  style={{
                    background: quota.unlimited
                      ? 'var(--accent-jade-soft)'
                      : quotaBlocked
                        ? 'var(--accent-danger-soft)'
                        : 'var(--bg-panel)',
                    color: quota.unlimited
                      ? 'var(--accent-jade)'
                      : quotaBlocked
                        ? 'var(--accent-danger)'
                        : 'var(--ink-secondary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                  className="px-2.5 py-1 rounded-full border font-mono text-[11px] whitespace-nowrap"
                >
                  {quota.unlimited ? '∞ Admin' : `${quota.used}/${quota.limit ?? 15}`}
                </span>

                <button
                  type="button"
                  onClick={() => setCenterMode((prev) => (prev === 'preview' ? 'chat' : 'preview'))}
                  aria-pressed={centerMode === 'preview'}
                  style={{
                    background: centerMode === 'preview' ? 'var(--bg-panel)' : 'var(--accent-primary)',
                    color: centerMode === 'preview' ? 'var(--accent-primary)' : 'var(--ink-inverse)',
                    borderColor: centerMode === 'preview' ? 'var(--border-accent)' : 'transparent',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  className="px-4 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                >
                  Live View
                </button>
              </div>
            </div>

            {quotaBlocked && (
              <div
                style={{
                  background: 'var(--accent-danger-soft)',
                  borderColor: 'var(--accent-copper)',
                  color: 'var(--ink-primary)',
                }}
                className="rounded-xl border px-3 py-2 text-xs flex items-center justify-between gap-2 flex-wrap"
              >
                <span>Đã dùng hết 15/15 lượt miễn phí. Chuyển sang khóa riêng hoặc đăng nhập Admin.</span>
                <button
                  type="button"
                  onClick={() => navigate('settings')}
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'var(--ink-inverse)',
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Cài đặt
                </button>
              </div>
            )}

            <PromptComposer
              layoutId="ff-prompt-composer"
              value={composerValue}
              onChange={setComposerValue}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              models={MODEL_OPTIONS}
              showFan={false}
              onAttachClick={() => setDropZoneOpen((v) => !v)}
              onSend={(text) => {
                void handleSendPrompt(text);
              }}
              disabled={isGenerating || quotaBlocked}
            />
          </div>
        </section>

        <button
          type="button"
          role="separator"
          aria-orientation="vertical"
          aria-label="Điều chỉnh thanh kiểm định"
          aria-valuemin={20}
          aria-valuemax={34}
          aria-valuenow={rightWidthPct}
          onPointerDown={handleDividerPointerDown('right')}
          onPointerMove={handleDividerPointerMove('right')}
          onKeyDown={handleDividerKeyDown('right')}
          style={{ background: 'var(--bg-canvas)' }}
          className="hidden lg:flex items-center justify-center cursor-col-resize select-none border-0 p-0"
        >
          <span
            style={{ background: 'var(--border-subtle)' }}
            className="w-px h-14 rounded-full"
          />
        </button>

        <aside
          aria-label="Diff & Check"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
          className={`${
            mobileColumn === 'inspector' ? 'flex' : 'hidden'
          } lg:flex flex-col gap-3.5 p-3.5 border-l min-w-0 overflow-y-auto ff-scrollbar`}
        >
          <div className="flex items-center justify-between gap-2 px-0.5">
            <h2
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
              className="m-0 text-base font-semibold"
            >
              Diff & Check
            </h2>
            <span className="font-mono text-[11px]" style={{ color: 'var(--ink-secondary)' }}>
              <span style={{ color: 'var(--accent-jade)' }}>+{diffTotals.added}</span>
              {' / '}
              <span style={{ color: 'var(--accent-copper)' }}>-{diffTotals.deleted}</span>
            </span>
          </div>

          <LiquidTabs
            tabs={[
              { id: 'diff', label: 'Thay đổi', count: activeProject.files.length },
              {
                id: 'checks',
                label: 'Kiểm định',
                count: activeProject.checksReport?.results.length || 6,
              },
            ]}
            activeId={rightTab}
            onChange={(id) => setRightTab(id === 'checks' ? 'checks' : 'diff')}
          />

          {rightTab === 'diff' ? (
            <div className="flex flex-col gap-1.5">
              {activeProject.diffs.map((entry) => (
                <button
                  key={entry.path}
                  type="button"
                  onClick={() => handleJumpToFile(entry.path)}
                  style={{
                    background:
                      activeProject.activeFilePath === entry.path
                        ? 'var(--bg-panel)'
                        : 'transparent',
                    borderColor:
                      activeProject.activeFilePath === entry.path
                        ? 'var(--border-strong)'
                        : 'var(--border-subtle)',
                  }}
                  className="w-full text-left rounded-xl border px-3 py-2 flex items-center justify-between gap-2 overflow-hidden cursor-pointer"
                >
                  <span
                    style={{ color: 'var(--ink-primary)' }}
                    className="font-mono text-xs truncate min-w-0"
                  >
                    {entry.path}
                  </span>
                  <span className="font-mono text-[11px] shrink-0 flex items-center gap-1.5">
                    <span style={{ color: 'var(--accent-jade)' }}>+{entry.additions}</span>
                    <span style={{ color: 'var(--accent-copper)' }}>-{entry.deletions}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <ChecksPanel
              report={activeProject.checksReport}
              onRunChecks={() => {
                const report = runChecksOnActiveProject();
                addToast({
                  type: report.overallStatus === 'fail' ? 'warning' : 'success',
                  title: `Kiểm định: ${report.passCount}/${report.results.length} đạt`,
                });
              }}
              onSelectFile={handleJumpToFile}
            />
          )}

          <section
            aria-label="Mốc lưu"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-xl border p-3 flex flex-col gap-2 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--ink-primary)' }}>
                Mốc lưu ({activeProject.snapshots.length})
              </span>
              <button
                type="button"
                onClick={() => createProjectSnapshot()}
                style={{ color: 'var(--accent-primary)' }}
                className="text-xs font-medium cursor-pointer"
              >
                Lưu mốc
              </button>
            </div>
            {activeProject.snapshots.length === 0 ? (
              <p className="m-0 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                Chưa có mốc lưu.
              </p>
            ) : (
              <ul className="m-0 p-0 list-none flex flex-col gap-1 max-h-32 overflow-y-auto ff-scrollbar">
                {activeProject.snapshots.slice(0, 5).map((snap) => (
                  <li
                    key={snap.id}
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                    className="rounded-lg border px-2.5 py-1.5 flex items-center justify-between gap-2"
                  >
                    <span className="text-[11px] truncate">{snap.label}</span>
                    <button
                      type="button"
                      onClick={() => restoreProjectSnapshot(snap.id)}
                      style={{ color: 'var(--accent-verdigris)' }}
                      className="text-[11px] font-medium shrink-0 cursor-pointer"
                    >
                      Khôi phục
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {taskCardItems.length > 0 && (
            <TaskCard
              title="Tiến trình"
              progressLabel={`${activeProject.processes.filter((p) => p.status === 'completed').length}/${activeProject.processes.length}`}
              tasks={taskCardItems}
            />
          )}

          <section
            aria-label="GitHub"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-xl border p-3 flex flex-col gap-2 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--ink-primary)' }}>
                GitHub
              </span>
              <button
                type="button"
                onClick={() => setGithubConnected((v) => !v)}
                style={{
                  background: githubConnected ? 'var(--accent-jade-soft)' : 'var(--bg-surface)',
                  color: githubConnected ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer"
              >
                {githubConnected ? 'Ngắt' : 'Kết nối'}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setGithubScope('read-only')}
                aria-pressed={githubScope === 'read-only'}
                style={{
                  background: githubScope === 'read-only' ? 'var(--bg-surface)' : 'transparent',
                  borderColor:
                    githubScope === 'read-only' ? 'var(--border-strong)' : 'var(--border-subtle)',
                  color:
                    githubScope === 'read-only' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                }}
                className="flex-1 py-1 rounded-lg border text-[11px] font-medium cursor-pointer"
              >
                Chỉ đọc
              </button>
              <button
                type="button"
                onClick={() => setGithubScope('pr-push')}
                aria-pressed={githubScope === 'pr-push'}
                style={{
                  background: githubScope === 'pr-push' ? 'var(--bg-surface)' : 'transparent',
                  borderColor:
                    githubScope === 'pr-push' ? 'var(--border-strong)' : 'var(--border-subtle)',
                  color:
                    githubScope === 'pr-push' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                }}
                className="flex-1 py-1 rounded-lg border text-[11px] font-medium cursor-pointer"
              >
                PR & Push
              </button>
            </div>
          </section>

          <button
            type="button"
            onClick={() => setSetupDrawerOpen(true)}
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-strong)',
              color: 'var(--ink-primary)',
            }}
            className="w-full px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer"
          >
            Thiết lập
          </button>
        </aside>
      </div>

      {previewMode === 'pip' && (
        <LivePreviewFrame
          files={activeProject.files}
          mode="pip"
          onModeChange={setPreviewMode}
          title={activeProject.name}
        />
      )}

      {previewMode === 'fullscreen' && centerMode !== 'preview' && (
        <LivePreviewFrame
          files={activeProject.files}
          mode="fullscreen"
          onModeChange={setPreviewMode}
          title={activeProject.name}
        />
      )}

      <AiProjectSetupDrawer
        open={setupDrawerOpen}
        onClose={() => setSetupDrawerOpen(false)}
        project={activeProject}
        defaultTarget={settings.defaultExportTarget}
        onInjectFiles={(incoming) => {
          addWorkspaceFiles(incoming);
          addToast({
            type: 'success',
            title: 'Đã thêm 5 tệp cấu hình vào Workspace',
          });
        }}
      />
    </main>
  );
};
