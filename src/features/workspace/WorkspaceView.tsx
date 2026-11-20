import React, { useId, useMemo, useRef, useState } from 'react';
import { Ellipsis, PanelLeft, PanelLeftClose, X } from 'lucide-react';
import { DynamicDropZone, PromptComposer } from '../../components/pinui';
import { useAppStore } from '../../store/appStore';
import { AiProjectSetupDrawer } from './AiProjectSetupDrawer';
import { DiffViewer, type DiffViewMode } from './DiffViewer';
import type { PreviewViewport } from './LivePreviewFrame';
import { LiveStage } from './LiveStage';
import { Modal } from './Modal';
import { Popover } from './Popover';
import { ProjectRail } from './ProjectRail';
import { ReviewZone, type ReviewTab } from './ReviewZone';
import { stripModeTag, Thread, type StarterPrompt } from './Thread';
import { formatStamp } from './time';
import { useMediaQuery } from './useMediaQuery';
import './workspace.css';

type AgentExecutionMode = 'Build' | 'Refine' | 'Audit';
type MobileZone = 'chat' | 'review';

const AGENT_MODES: Array<{ id: AgentExecutionMode; label: string }> = [
  { id: 'Build', label: 'Dựng' },
  { id: 'Refine', label: 'Tinh chỉnh' },
  { id: 'Audit', label: 'Kiểm định' },
];

const MODEL_OPTIONS = [
  { id: 'auto', name: 'Định tuyến', note: 'Cấu hình Gateway mặc định' },
  { id: 'studio-smart-route', name: 'Smart Route', note: 'Cân bằng tốc độ và chiều sâu' },
  { id: 'studio-heavy-route', name: 'Heavy Route', note: 'Kiến trúc đa tệp phức tạp' },
  { id: 'ag/gemini-3.8-flash-low', name: 'Gemini Flash', note: 'Phản hồi nhanh' },
  { id: 'ag/gemini-4-argon-high', name: 'Gemini Argon', note: 'Phân tích hệ thống' },
  { id: 'ag/claude-sonnet-5-5-medium', name: 'Sonnet 5.5', note: 'Thiết kế UI tinh gọn' },
];

const STARTERS: StarterPrompt[] = [
  {
    label: 'Trang câu lạc bộ',
    prompt:
      'Dựng trang giới thiệu câu lạc bộ: lời chào, lịch sinh hoạt theo tuần và mẫu đăng ký thành viên.',
  },
  {
    label: 'Bảng điểm lớp',
    prompt:
      'Dựng bảng điểm lớp học có lọc theo môn, sắp xếp theo điểm và hiển thị tốt trên điện thoại.',
  },
  {
    label: 'Hồ sơ cá nhân',
    prompt: 'Dựng trang hồ sơ cá nhân một cột: giới thiệu ngắn, dự án nổi bật và liên hệ.',
  },
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
    setAuthModalOpen,
    addToast,
  } = useAppStore();

  const isWide = useMediaQuery('(min-width: 1180px)');
  const isCompact = useMediaQuery('(max-width: 719px)');
  const layout = isWide ? 'wide' : isCompact ? 'compact' : 'mid';

  const [zone, setZone] = useState<MobileZone>('chat');
  const [reviewTab, setReviewTab] = useState<ReviewTab>('diff');
  const [railOpen, setRailOpen] = useState(true);
  const [railSheetOpen, setRailSheetOpen] = useState(false);

  const [liveOpen, setLiveOpen] = useState(false);
  const [liveExpanded, setLiveExpanded] = useState(false);
  const [viewport, setViewport] = useState<PreviewViewport>(() =>
    window.matchMedia('(max-width: 719px)').matches ? 390 : 1440
  );

  const [viewer, setViewer] = useState<{ mode: DiffViewMode; nonce: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [composerValue, setComposerValue] = useState('');
  const [agentMode, setAgentMode] = useState<AgentExecutionMode>('Build');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [dropZoneOpen, setDropZoneOpen] = useState(false);
  const [setupDrawerOpen, setSetupDrawerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dockRef = useRef<HTMLDivElement>(null);
  const renameId = useId();

  const diffTotals = useMemo(
    () =>
      activeProject.diffs.reduce(
        (sum, entry) => ({
          added: sum.added + entry.additions,
          removed: sum.removed + entry.deletions,
        }),
        { added: 0, removed: 0 }
      ),
    [activeProject.diffs]
  );

  const isGenerating = aiActivity === 'thinking' || aiActivity === 'streaming';
  const quotaBlocked = !quota.unlimited && quota.exhausted;
  const quotaLabel = quota.unlimited
    ? 'không giới hạn'
    : quota.limit === null
      ? `${quota.used} lượt`
      : `${quota.used}/${quota.limit} lượt`;

  const railInline = isWide && railOpen;
  const threadHidden = isCompact ? liveOpen || zone !== 'chat' : !isWide && liveOpen;
  const reviewHidden = isCompact ? liveOpen || zone !== 'review' : liveOpen;

  const closeLive = () => {
    setLiveOpen(false);
    setLiveExpanded(false);
  };

  const sendPrompt = async (text: string) => {
    const raw = text.trim();
    if (!raw || isGenerating) return;
    await sendWorkspacePrompt(`[Mode: ${agentMode}] ${raw}`, { model: selectedModel, agentMode });
  };

  const handleRetry = () => {
    const lastUserTurn = [...activeProject.messages].reverse().find((message) => message.role === 'user');
    if (lastUserTurn) void sendPrompt(stripModeTag(lastUserTurn.content));
  };

  const handlePickStarter = (prompt: string) => {
    setComposerValue(prompt);
    dockRef.current?.querySelector<HTMLElement>('input, textarea')?.focus();
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
          ? 'Không thấy chuỗi nhạy cảm trong gói ZIP.'
          : `Đã ẩn ${result.findingsCount} chuỗi nhạy cảm trước khi đóng gói.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Xuất ZIP thất bại',
        message: 'Không tạo được tệp nén từ Workspace.',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleFilesDropped = (incoming: Array<{ name: string; content: string }>) => {
    if (!incoming.length) return;
    addWorkspaceFiles(
      incoming.map((file) => ({
        path: file.name,
        content: file.content,
        summary: 'Tệp đính kèm cục bộ',
      }))
    );
    attachItemToWorkspace({
      id: `upload-${Date.now()}`,
      kind: 'blueprint',
      title: incoming.map((file) => file.name).join(', '),
      summary: `${incoming.length} tệp từ thiết bị`,
    });
    setDropZoneOpen(false);
  };

  const handleRunChecks = () => {
    const report = runChecksOnActiveProject();
    addToast({
      type: report.overallStatus === 'fail' ? 'warning' : 'success',
      title: `Kiểm tra: ${report.passCount}/${report.results.length} đạt`,
    });
  };

  const openViewer = (path: string | null, mode: DiffViewMode) => {
    if (path) setActiveFilePath(path);
    setViewer({ mode, nonce: Date.now() });
  };

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    setRenaming(false);
    setRailSheetOpen(false);
    setZone('chat');
  };

  const handleCreateProject = () => {
    createProject(`Bản nháp ${projects.length + 1}`);
    setRenaming(false);
    setRailSheetOpen(false);
    setZone('chat');
  };

  const submitRename = (event: React.FormEvent) => {
    event.preventDefault();
    renameProject(activeProject.id, renameDraft);
    setRenaming(false);
  };

  const liveStage = (
    <LiveStage
      files={activeProject.files}
      title={activeProject.name}
      viewport={viewport}
      onViewportChange={setViewport}
      expanded={liveExpanded}
      onToggleExpanded={() => setLiveExpanded((value) => !value)}
      onClose={closeLive}
    />
  );

  const rail = (dismiss: React.ReactNode) => (
    <ProjectRail
      projects={projects}
      activeProjectId={activeProject.id}
      onSelect={handleSelectProject}
      onCreate={handleCreateProject}
      dismiss={dismiss}
    />
  );

  return (
    <div
      className="ws"
      data-layout={layout}
      data-rail={railInline ? 'open' : 'closed'}
      data-live={liveOpen ? 'true' : 'false'}
      data-density={settings.compactDensity ? 'compact' : 'roomy'}
    >
      {railInline && (
        <aside className="ws-rail" aria-label="Dự án">
          {rail(
            <button
              type="button"
              className="icon-btn"
              aria-label="Thu gọn"
              title="Thu gọn"
              onClick={() => setRailOpen(false)}
            >
              <PanelLeftClose size={18} aria-hidden="true" />
            </button>
          )}
        </aside>
      )}

      <section className="ws-thread" aria-label="Hội thoại" hidden={threadHidden}>
        <header className="ws-head">
          {!railInline && (
            <button
              type="button"
              className="icon-btn"
              aria-label="Dự án"
              title="Dự án"
              onClick={() => (isWide ? setRailOpen(true) : setRailSheetOpen(true))}
            >
              <PanelLeft size={18} aria-hidden="true" />
            </button>
          )}
          {renaming ? (
            <form className="ws-rename" onSubmit={submitRename}>
              <label className="sr-only" htmlFor={renameId}>
                Tên dự án
              </label>
              <input
                id={renameId}
                className="field"
                value={renameDraft}
                autoFocus
                onChange={(event) => setRenameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setRenaming(false);
                }}
              />
              <button type="submit" className="btn btn-line btn-sm">
                Lưu
              </button>
            </form>
          ) : (
            <h1 className="ws-head-title ws-title">{activeProject.name}</h1>
          )}
          <Popover label="Tùy chọn dự án" icon={<Ellipsis size={18} aria-hidden="true" />}>
            {(close) => (
              <ul className="ws-menu">
                <li>
                  <button
                    type="button"
                    className="ws-menu-item"
                    onClick={() => {
                      setRenameDraft(activeProject.name);
                      setRenaming(true);
                      close();
                    }}
                  >
                    Đổi tên
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="ws-menu-item"
                    onClick={() => {
                      togglePinProject(activeProject.id);
                      close();
                    }}
                  >
                    {activeProject.pinned ? 'Bỏ ghim' : 'Ghim'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="ws-menu-item"
                    onClick={() => {
                      toggleArchiveProject(activeProject.id);
                      close();
                    }}
                  >
                    {activeProject.archived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="ws-menu-item ws-menu-danger"
                    onClick={() => {
                      close();
                      setConfirmDelete(true);
                    }}
                  >
                    Xóa
                  </button>
                </li>
              </ul>
            )}
          </Popover>
        </header>

        <Thread
          messages={activeProject.messages}
          activity={aiActivity}
          userName={currentUser?.name || 'Bạn'}
          starters={STARTERS}
          onPickStarter={handlePickStarter}
          onOpenFile={(path) => openViewer(path, 'unified')}
          onRetry={handleRetry}
          canRetry={!isGenerating && !quotaBlocked}
        />

        <footer className="ws-dock">
          <div ref={dockRef} className="ws-measure ws-dock-inner">
            {activeProject.attachedItems.length > 0 && (
              <ul className="ws-attached" aria-label="Ngữ cảnh đính kèm">
                {activeProject.attachedItems.map((item) => (
                  <li key={item.id}>
                    <span className="ws-attached-name">{item.title}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Gỡ ${item.title}`}
                      title="Gỡ"
                      onClick={() => detachItemFromWorkspace(item.id)}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {dropZoneOpen && (
              <div className="ws-drop">
                <DynamicDropZone onFilesAdded={handleFilesDropped} label="Thả tệp HTML, CSS, JS" compact />
                <div className="ws-drop-side">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('explore')}>
                    Khám phá
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Đóng khung nạp tệp"
                    title="Đóng"
                    onClick={() => setDropZoneOpen(false)}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {quotaBlocked && (
              <div className="ws-quota" role="status">
                <p>
                  Đã dùng hết <span className="ws-count">{quotaLabel}</span>. Tài khoản Admin không bị giới
                  hạn.
                </p>
                {!currentUser && (
                  <button type="button" className="btn btn-line btn-sm" onClick={() => setAuthModalOpen(true)}>
                    Đăng nhập
                  </button>
                )}
              </div>
            )}

            <div className="ws-dock-row">
              <div className="ws-seg" role="group" aria-label="Chế độ">
                {AGENT_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className="ws-seg-item"
                    aria-pressed={agentMode === mode.id}
                    onClick={() => setAgentMode(mode.id)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <PromptComposer
              layoutId="ff-prompt-composer"
              value={composerValue}
              onChange={setComposerValue}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              models={MODEL_OPTIONS}
              showFan={false}
              onAttachClick={() => setDropZoneOpen((value) => !value)}
              onSend={(text) => {
                setComposerValue('');
                void sendPrompt(text);
              }}
              disabled={isGenerating || quotaBlocked}
            />
          </div>
        </footer>
      </section>

      <ReviewZone
        project={activeProject}
        totals={diffTotals}
        tab={reviewTab}
        onTabChange={setReviewTab}
        onOpenViewer={openViewer}
        onRunChecks={handleRunChecks}
        hidden={reviewHidden}
        actions={
          <>
            {!isCompact && (
              <button type="button" className="btn btn-red ws-live-open" onClick={() => setLiveOpen(true)}>
                Live View
              </button>
            )}
            <Popover label="Thêm" icon={<Ellipsis size={18} aria-hidden="true" />}>
              {(close) => (
                <>
                  <ul className="ws-menu">
                    <li>
                      <button
                        type="button"
                        className="ws-menu-item"
                        onClick={() => createProjectSnapshot()}
                      >
                        Lưu mốc
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="ws-menu-item"
                        disabled={exporting}
                        onClick={() => void handleExportZip()}
                      >
                        {exporting ? 'Đang nén' : 'Xuất ZIP'}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="ws-menu-item"
                        onClick={() => {
                          close();
                          setSetupDrawerOpen(true);
                        }}
                      >
                        Thiết lập
                      </button>
                    </li>
                  </ul>
                  <section className="ws-snaps" aria-label="Mốc lưu">
                    <p className="ws-snaps-head">
                      <span>Mốc lưu</span>
                      <span className="ws-count">{activeProject.snapshots.length}</span>
                    </p>
                    {activeProject.snapshots.length === 0 ? (
                      <p className="ws-empty">Chưa có mốc lưu.</p>
                    ) : (
                      <ul>
                        {activeProject.snapshots.map((snapshot) => (
                          <li key={snapshot.id}>
                            <span className="ws-snap-name">{snapshot.label}</span>
                            <time className="t-label" dateTime={snapshot.createdAt}>
                              {formatStamp(snapshot.createdAt)}
                            </time>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                restoreProjectSnapshot(snapshot.id);
                                close();
                              }}
                            >
                              Khôi phục
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </Popover>
          </>
        }
      />

      {liveOpen && !liveExpanded && liveStage}

      {isCompact && (
        <nav className="ws-switch" aria-label="Vùng làm việc">
          <button
            type="button"
            className="ws-switch-item"
            aria-pressed={!liveOpen && zone === 'chat'}
            onClick={() => {
              closeLive();
              setZone('chat');
            }}
          >
            Chat
          </button>
          <button
            type="button"
            className="ws-switch-item"
            aria-pressed={!liveOpen && zone === 'review'}
            onClick={() => {
              closeLive();
              setZone('review');
            }}
          >
            Diff
          </button>
          <button
            type="button"
            className="ws-switch-item ws-switch-live"
            aria-pressed={liveOpen}
            onClick={() => setLiveOpen(true)}
          >
            Live
          </button>
        </nav>
      )}

      <Modal
        open={railSheetOpen && !isWide}
        onClose={() => setRailSheetOpen(false)}
        label="Dự án"
        className="ws-modal ws-modal-left"
      >
        <div className="ws-rail">
          {rail(
            <button
              type="button"
              className="icon-btn"
              aria-label="Đóng"
              title="Đóng"
              onClick={() => setRailSheetOpen(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </Modal>

      <Modal
        open={liveOpen && liveExpanded}
        onClose={() => setLiveExpanded(false)}
        label="Live View"
        className="ws-modal ws-modal-full"
      >
        {liveStage}
      </Modal>

      <Modal
        open={viewer !== null}
        onClose={() => setViewer(null)}
        label="Diff & Check"
        className="ws-modal ws-modal-viewer"
      >
        <div className="ws-viewer">
          <header className="ws-head">
            <h2 className="ws-head-title">Diff &amp; Check</h2>
            <p className="ws-count ws-viewer-totals">
              <span className="ws-add">+{diffTotals.added}</span>
              <span className="ws-del">−{diffTotals.removed}</span>
            </p>
            <button
              type="button"
              className="icon-btn"
              aria-label="Đóng"
              title="Đóng"
              onClick={() => setViewer(null)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          {viewer && (
            <DiffViewer
              key={viewer.nonce}
              files={activeProject.files}
              diffs={activeProject.diffs}
              activeFilePath={activeProject.activeFilePath}
              onSelectFile={setActiveFilePath}
              onUpdateFile={updateWorkspaceFile}
              initialMode={viewer.mode}
            />
          )}
        </div>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        label="Xóa dự án"
        className="ws-modal ws-modal-confirm"
      >
        <div className="ws-confirm">
          <h2>Xóa dự án?</h2>
          <p>Hội thoại, tệp và mốc lưu của “{activeProject.name}” sẽ mất hẳn.</p>
          <div className="ws-confirm-actions">
            <button type="button" className="btn btn-line" onClick={() => setConfirmDelete(false)}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-red"
              onClick={() => {
                deleteProject(activeProject.id);
                setConfirmDelete(false);
              }}
            >
              Xóa
            </button>
          </div>
        </div>
      </Modal>

      <AiProjectSetupDrawer
        open={setupDrawerOpen}
        onClose={() => setSetupDrawerOpen(false)}
        project={activeProject}
        defaultTarget={settings.defaultExportTarget}
        onInjectFiles={(incoming) => {
          addWorkspaceFiles(incoming);
          addToast({
            type: 'success',
            title: `Đã thêm ${incoming.length} tệp thiết lập`,
          });
        }}
      />
    </div>
  );
};
