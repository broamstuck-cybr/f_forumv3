import React, { useMemo, useRef, useState } from 'react';
import {
  Archive,
  Check,
  Code2,
  Compass,
  Download,
  Eye,
  FileCode2,
  GitBranch,
  History,
  Layers,
  MessageSquare,
  Monitor,
  Pencil,
  PictureInPicture2,
  Pin,
  Plus,
  ShieldCheck,
  Smartphone,
  Maximize2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  DynamicDropZone,
  LiquidTabs,
  PromptComposer,
  SearchCard,
  TaskCard,
} from '../../components/pinui';
import { useAppStore } from '../../store/appStore';
import { AiProjectSetupDrawer } from './AiProjectSetupDrawer';
import { ChecksPanel } from './ChecksPanel';
import { DiffViewer } from './DiffViewer';
import { LivePreviewFrame, type PreviewViewportMode } from './LivePreviewFrame';

type CenterPaneMode = 'chat' | 'preview' | 'code';
type MobileColumnTab = 'history' | 'arena' | 'inspector';
type AgentExecutionMode = 'Build' | 'Refine' | 'Audit';

const AGENT_MODES: Array<{ id: AgentExecutionMode; label: string; description: string }> = [
  { id: 'Build', label: 'Build', description: 'Tạo mới bộ tệp HTML/CSS/JS từ đầu' },
  { id: 'Refine', label: 'Refine', description: 'Tinh chỉnh giao diện, tokens và responsive' },
  { id: 'Audit', label: 'Audit', description: 'Rà soát lỗi truy cập, DOM và tối ưu hóa' },
];

const MODEL_OPTIONS = [
  { id: 'auto', name: 'Auto (9Router Smart)', note: 'Dùng cấu hình Gateway 9Router mặc định' },
  { id: 'studio-smart-route', name: 'Studio Smart Route', note: 'Cân bằng tốc độ và chất lượng' },
  { id: 'studio-heavy-route', name: 'Studio Heavy Route', note: 'Tối ưu kiến trúc phức tạp' },
  { id: 'ag/gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Fast)', note: 'Phản hồi siêu nhanh đa tệp' },
  { id: 'ag/gemini-4-argon-high', name: 'Gemini 4 Argon', note: 'Phân tích hệ thống chuyên sâu' },
  { id: 'ag/claude-sonnet-5-5-medium', name: 'Claude Sonnet 5.5', note: 'Thiết kế UI & logic tinh gọn' },
];

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

  const [leftWidthPct, setLeftWidthPct] = useState(21);
  const [rightWidthPct, setRightWidthPct] = useState(25);
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
    return activeProject.processes.slice(0, 6).map((proc) => ({
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
        title: `Đã xuất gói ${result.filename}`,
        message: result.clean
          ? 'Secret scanner xác nhận 0 chuỗi nhạy cảm trong gói ZIP.'
          : `Đã tự động ẩn ${result.findingsCount} chuỗi nhạy cảm trước khi nén ZIP.`,
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
        summary: 'Uploaded via DynamicDropZone',
      }))
    );
    attachItemToWorkspace({
      id: `upload-${Date.now()}`,
      kind: 'blueprint',
      title: incoming.map((f) => f.name).join(', '),
      summary: `Tệp đính kèm từ thiết bị (${incoming.length} tệp)`,
    });
    setDropZoneOpen(false);
  };

  const handleDividerPointerDown =
    (side: 'left' | 'right') => (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
    };

  const handleDividerPointerMove =
    (side: 'left' | 'right') => (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId) || !gridContainerRef.current) return;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      if (side === 'left') {
        setLeftWidthPct(Math.max(16, Math.min(30, Math.round(pct))));
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
        setLeftWidthPct(21);
        setRightWidthPct(25);
        return;
      }
      const delta = e.key === 'ArrowRight' ? 2 : -2;
      if (side === 'left') {
        setLeftWidthPct((v) => Math.max(16, Math.min(30, v + delta)));
      } else {
        setRightWidthPct((v) => Math.max(20, Math.min(34, v - delta)));
      }
    };

  const handleJumpToFile = (filePath: string) => {
    setActiveFilePath(filePath);
    setCenterMode('code');
    setMobileColumn('arena');
  };

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
        <div className="grid grid-cols-3 gap-1 w-full">
          {(
            [
              { id: 'history', label: 'Dự án & Tệp' },
              { id: 'arena', label: 'Arena & Preview' },
              { id: 'inspector', label: 'Diff & Checks' },
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
              className="py-1.5 px-2 rounded-lg border text-xs font-medium truncate"
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
            '--ff-ws-left': `${leftWidthPct}%`,
            '--ff-ws-right': `${rightWidthPct}%`,
          } as React.CSSProperties
        }
        className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[minmax(220px,var(--ff-ws-left))_10px_minmax(0,1fr)_10px_minmax(260px,var(--ff-ws-right))]"
      >
        <aside
          aria-label="Workspace History and Context"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
          className={`${
            mobileColumn === 'history' ? 'flex' : 'hidden'
          } lg:flex flex-col gap-3 p-3 border-r min-w-0 overflow-y-auto`}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                createProject(`Arena Build #${projects.length + 1}`);
                setCenterMode('chat');
                setMobileColumn('arena');
              }}
              style={{
                background: 'var(--accent-primary)',
                color: '#0b0d12',
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              aria-pressed={showArchived}
              aria-label="Toggle archived projects"
              style={{
                background: showArchived ? 'var(--bg-panel)' : 'transparent',
                borderColor: 'var(--border-subtle)',
                color: showArchived ? 'var(--accent-primary)' : 'var(--ink-secondary)',
              }}
              className="p-2 rounded-xl border"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          </div>

          <SearchCard
            value={historyQuery}
            onChange={setHistoryQuery}
            placeholder="Tìm dự án Workspace..."
            compact
          />

          <section aria-label="Project History" className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span style={{ color: 'var(--ink-secondary)' }} className="text-xs font-medium">
                Lịch sử dự án ({filteredProjects.length})
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {filteredProjects.map((proj) => {
                const isActive = proj.id === activeProject.id;
                const isRenaming = renamingId === proj.id;
                return (
                  <li
                    key={proj.id}
                    style={{
                      background: isActive ? 'var(--bg-panel)' : 'transparent',
                      borderColor: isActive ? 'var(--border-strong)' : 'var(--border-subtle)',
                    }}
                    className="rounded-xl border p-2.5 overflow-hidden"
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
                          style={{
                            background: 'var(--bg-canvas)',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--ink-primary)',
                          }}
                          className="flex-1 min-w-0 px-2 py-1 rounded-md border text-xs"
                        />
                        <button
                          type="submit"
                          aria-label="Save project name"
                          style={{ color: 'var(--accent-jade)' }}
                          className="p-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            selectProject(proj.id);
                            setMobileColumn('arena');
                          }}
                          className="text-left flex-1 min-w-0"
                        >
                          <div className="flex items-center gap-1.5">
                            {proj.pinned && (
                              <Pin
                                className="w-3 h-3 shrink-0"
                                style={{ color: 'var(--accent-primary)' }}
                              />
                            )}
                            <span
                              style={{ color: 'var(--ink-primary)' }}
                              className="text-xs font-semibold truncate block"
                            >
                              {proj.name}
                            </span>
                          </div>
                          <span
                            style={{ color: 'var(--ink-muted)' }}
                            className="text-[11px] font-mono block mt-0.5"
                          >
                            {proj.files.length} tệp | {proj.messages.length} lượt
                          </span>
                        </button>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => togglePinProject(proj.id)}
                            aria-label="Pin project"
                            style={{
                              color: proj.pinned ? 'var(--accent-primary)' : 'var(--ink-muted)',
                            }}
                            className="p-1 rounded hover:opacity-80"
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingId(proj.id);
                              setRenameDraft(proj.name);
                            }}
                            aria-label="Rename project"
                            style={{ color: 'var(--ink-muted)' }}
                            className="p-1 rounded hover:opacity-80"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleArchiveProject(proj.id)}
                            aria-label="Archive project"
                            style={{
                              color: proj.archived ? 'var(--accent-copper)' : 'var(--ink-muted)',
                            }}
                            className="p-1 rounded hover:opacity-80"
                          >
                            <Archive className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProject(proj.id)}
                            aria-label="Delete project"
                            style={{ color: 'var(--ink-muted)' }}
                            className="p-1 rounded hover:opacity-80"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            aria-label="Attached Explore Context"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-xl border p-3 flex flex-col gap-2 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">Ngữ cảnh đính kèm</span>
              <button
                type="button"
                onClick={() => navigate('explore')}
                style={{ color: 'var(--accent-primary)' }}
                className="inline-flex items-center gap-1 text-[11px] font-medium"
              >
                <Compass className="w-3 h-3" />
                Explore
              </button>
            </div>
            {activeProject.attachedItems.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)' }} className="text-[11px]">
                Chưa đính kèm mẫu UI hoặc tài nguyên từ Explore.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {activeProject.attachedItems.map((item) => (
                  <span
                    key={item.id}
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--ink-primary)',
                    }}
                    className="inline-flex items-center gap-1.5 max-w-full px-2 py-1 rounded-full border text-[11px]"
                  >
                    <span className="truncate">{item.title}</span>
                    <button
                      type="button"
                      onClick={() => detachItemFromWorkspace(item.id)}
                      aria-label={`Remove ${item.title}`}
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section
            aria-label="Project Snapshots"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-xl border p-3 flex flex-col gap-2 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <History className="w-3.5 h-3.5" style={{ color: 'var(--accent-verdigris)' }} />
                Snapshots ({activeProject.snapshots.length})
              </span>
              <button
                type="button"
                onClick={() => createProjectSnapshot()}
                style={{ color: 'var(--accent-primary)' }}
                className="text-[11px] font-medium"
              >
                Lưu mốc
              </button>
            </div>
            <ul className="flex flex-col gap-1 max-h-36 overflow-y-auto">
              {activeProject.snapshots.slice(0, 6).map((snap) => (
                <li
                  key={snap.id}
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                  className="rounded-lg border px-2 py-1.5 flex items-center justify-between gap-2"
                >
                  <span className="text-[11px] truncate">{snap.label}</span>
                  <button
                    type="button"
                    onClick={() => restoreProjectSnapshot(snap.id)}
                    style={{ color: 'var(--accent-verdigris)' }}
                    className="text-[11px] font-medium shrink-0"
                  >
                    Khôi phục
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <button
          type="button"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize left history panel"
          aria-valuemin={16}
          aria-valuemax={30}
          aria-valuenow={leftWidthPct}
          onPointerDown={handleDividerPointerDown('left')}
          onPointerMove={handleDividerPointerMove('left')}
          onKeyDown={handleDividerKeyDown('left')}
          style={{ background: 'var(--bg-canvas)' }}
          className="hidden lg:flex items-center justify-center cursor-col-resize select-none border-0 p-0"
        >
          <span
            style={{ background: 'var(--border-strong)' }}
            className="w-0.5 h-12 rounded-full"
          />
        </button>

        <section
          aria-label="Arena Work space Main Stage"
          className={`${
            mobileColumn === 'arena' ? 'flex' : 'hidden'
          } lg:flex flex-col min-w-0 min-h-0 p-3 gap-3`}
        >
          <header
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-2xl border px-3.5 py-2.5 flex items-center justify-between gap-2 flex-wrap shrink-0"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'chat', label: 'Hội thoại AI', icon: MessageSquare },
                  { id: 'preview', label: 'Live Preview', icon: Eye },
                  { id: 'code', label: 'Code & Diff', icon: Code2 },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = centerMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCenterMode(tab.id)}
                    aria-pressed={active}
                    style={{
                      background: active ? 'var(--bg-panel)' : 'transparent',
                      borderColor: active ? 'var(--border-strong)' : 'transparent',
                      color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <div
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="inline-flex items-center rounded-xl border p-0.5"
              >
                {(
                  [
                    { id: 'desktop', label: 'Desktop', icon: Monitor },
                    { id: 'mobile', label: 'Mobile', icon: Smartphone },
                    { id: 'fullscreen', label: 'Full', icon: Maximize2 },
                    { id: 'pip', label: 'PiP', icon: PictureInPicture2 },
                  ] as const
                ).map((vp) => {
                  const Icon = vp.icon;
                  const active = previewMode === vp.id;
                  return (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => {
                        setPreviewMode(vp.id);
                        if (vp.id !== 'pip' && centerMode !== 'preview') {
                          setCenterMode('preview');
                        }
                      }}
                      aria-pressed={active}
                      aria-label={`Viewport ${vp.label}`}
                      style={{
                        background: active ? 'var(--bg-surface)' : 'transparent',
                        color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{vp.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => void handleExportZip()}
                disabled={exporting}
                style={{
                  background: 'var(--accent-primary)',
                  color: '#0b0d12',
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                {exporting ? 'Đang nén...' : 'Export ZIP'}
              </button>
            </div>
          </header>

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
                className="flex-1 min-h-[300px] max-h-[54vh] rounded-2xl border p-4 overflow-y-auto flex flex-col gap-3"
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
                            ? 'rgba(224, 122, 56, 0.12)'
                            : 'var(--bg-canvas)',
                        borderColor: isSystem ? 'var(--accent-copper)' : 'var(--border-subtle)',
                      }}
                      className="rounded-xl border p-3.5 flex flex-col gap-2 overflow-hidden"
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
                            ? currentUser?.name || 'Developer'
                            : isSystem
                              ? 'System Notice'
                              : 'F-FORUM Synthesis Engine'}
                        </span>
                        <span style={{ color: 'var(--ink-muted)' }} className="font-mono">
                          {msg.modelUsed ? `${msg.modelUsed} | ` : ''}
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p
                        style={{ color: 'var(--ink-primary)' }}
                        className="text-sm leading-relaxed whitespace-pre-wrap break-words"
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
                                color: 'var(--ink-primary)',
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border font-mono text-[11px]"
                            >
                              <FileCode2 className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
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
            className="rounded-2xl border p-3 flex flex-col gap-2.5 shrink-0 overflow-hidden"
          >
            {dropZoneOpen && (
              <div className="pb-1">
                <DynamicDropZone
                  onFilesAdded={handleFilesDropped}
                  label="Thả tệp HTML/CSS/JS/JSON hoặc đặc tả để đính kèm vào Workspace"
                  compact
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {AGENT_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAgentMode(m.id)}
                    aria-pressed={agentMode === m.id}
                    title={m.description}
                    style={{
                      background: agentMode === m.id ? 'var(--bg-panel)' : 'transparent',
                      borderColor:
                        agentMode === m.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      color:
                        agentMode === m.id ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                    }}
                    className="px-2.5 py-1 rounded-lg border text-xs font-medium"
                  >
                    {m.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDropZoneOpen((v) => !v)}
                  style={{
                    background: dropZoneOpen ? 'var(--bg-panel)' : 'transparent',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-secondary)',
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Design-to-Code
                </button>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span
                  style={{ color: 'var(--ink-secondary)' }}
                  className="inline-flex items-center gap-1"
                >
                  <GitBranch className="w-3.5 h-3.5" style={{ color: 'var(--accent-verdigris)' }} />
                  main
                  <span style={{ color: 'var(--accent-jade)' }}>+{diffTotals.added}</span>
                  <span style={{ color: 'var(--accent-copper)' }}>-{diffTotals.deleted}</span>
                </span>
                <span
                  style={{
                    background: quota.unlimited
                      ? 'rgba(52, 211, 153, 0.14)'
                      : quotaBlocked
                        ? 'rgba(224, 122, 56, 0.18)'
                        : 'var(--bg-panel)',
                    color: quota.unlimited
                      ? 'var(--accent-jade)'
                      : quotaBlocked
                        ? 'var(--accent-copper)'
                        : 'var(--accent-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                  className="px-2.5 py-0.5 rounded-full border font-semibold"
                >
                  {quota.unlimited ? '∞ Admin' : `${quota.used}/${quota.limit ?? 15} lượt AI`}
                </span>
              </div>
            </div>

            {quotaBlocked && (
              <div
                style={{
                  background: 'rgba(224, 122, 56, 0.12)',
                  borderColor: 'var(--accent-copper)',
                  color: 'var(--ink-primary)',
                }}
                className="rounded-xl border px-3 py-2 text-xs flex items-center justify-between gap-2 flex-wrap"
              >
                <span>
                  Đã sử dụng hết 15/15 lượt miễn phí. Cấu hình khóa API riêng (BYOK) trong Cài đặt
                  hoặc đăng nhập Admin để sử dụng không giới hạn.
                </span>
                <button
                  type="button"
                  onClick={() => navigate('settings')}
                  style={{
                    background: 'var(--accent-primary)',
                    color: '#0b0d12',
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0"
                >
                  Mở Cài đặt BYOK
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

            <p style={{ color: 'var(--ink-muted)' }} className="text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-verdigris)' }} />
              Mã nguồn do AI tổng hợp cần được đối chiếu qua Live Preview và kiểm định Static/DOM trước khi triển khai.
            </p>
          </div>
        </section>

        <button
          type="button"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize right inspector panel"
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
            style={{ background: 'var(--border-strong)' }}
            className="w-0.5 h-12 rounded-full"
          />
        </button>

        <aside
          aria-label="Diff Checks and Processes Inspector"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
          className={`${
            mobileColumn === 'inspector' ? 'flex' : 'hidden'
          } lg:flex flex-col gap-3 p-3 border-l min-w-0 overflow-y-auto`}
        >
          <LiquidTabs
            tabs={[
              { id: 'diff', label: 'Diff', count: activeProject.files.length },
              {
                id: 'checks',
                label: 'Checks',
                count: activeProject.checksReport?.results.length || 6,
              },
            ]}
            activeId={rightTab}
            onChange={(id) => setRightTab(id === 'checks' ? 'checks' : 'diff')}
          />

          {rightTab === 'diff' ? (
            <div className="flex flex-col gap-2">
              {activeProject.diffs.map((entry) => (
                <button
                  key={entry.path}
                  type="button"
                  onClick={() => handleJumpToFile(entry.path)}
                  style={{
                    background: 'var(--bg-panel)',
                    borderColor:
                      activeProject.activeFilePath === entry.path
                        ? 'var(--border-strong)'
                        : 'var(--border-subtle)',
                  }}
                  className="w-full text-left rounded-xl border p-2.5 flex items-center justify-between gap-2 overflow-hidden"
                >
                  <div className="min-w-0">
                    <span
                      style={{ color: 'var(--ink-primary)' }}
                      className="font-mono text-xs font-medium block truncate"
                    >
                      {entry.path}
                    </span>
                    <span style={{ color: 'var(--ink-muted)' }} className="text-[11px] block">
                      {entry.status}
                    </span>
                  </div>
                  <div className="font-mono text-xs shrink-0 flex items-center gap-1.5">
                    <span style={{ color: 'var(--accent-jade)' }}>+{entry.additions}</span>
                    <span style={{ color: 'var(--accent-copper)' }}>-{entry.deletions}</span>
                  </div>
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
                  title: `Hoàn tất kiểm định: ${report.passCount}/${report.results.length} Pass`,
                });
              }}
              onSelectFile={handleJumpToFile}
            />
          )}

          <TaskCard
            title="Processes"
            subtitle="Thực thi thời gian thực trong Workspace"
            progressLabel={`${activeProject.processes.filter((p) => p.status === 'completed').length}/${activeProject.processes.length}`}
            tasks={taskCardItems}
          />

          <section
            aria-label="GitHub Connectors"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-xl border p-3 flex flex-col gap-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">Connectors (GitHub)</span>
              <button
                type="button"
                onClick={() => setGithubConnected((v) => !v)}
                style={{
                  background: githubConnected ? 'rgba(52, 211, 153, 0.14)' : 'var(--bg-surface)',
                  color: githubConnected ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold"
              >
                {githubConnected ? 'Đã kết nối' : 'Kết nối'}
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
                className="flex-1 py-1.5 rounded-lg border text-[11px] font-medium"
              >
                Read-only
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
                className="flex-1 py-1.5 rounded-lg border text-[11px] font-medium"
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
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold"
          >
            <Layers className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            Mở AI Project Setup Bundle
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
            title: 'Đã thêm 5 tệp cấu hình AI Setup vào Workspace',
          });
        }}
      />
    </main>
  );
};
