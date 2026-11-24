import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Compass,
  KeyRound,
  Layers,
  PanelLeft,
  PanelLeftClose,
  Share2,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { DynamicDropZone } from '../../components/pinui/DynamicDropZone';
import { PromptComposer } from '../../components/pinui/PromptComposer';
import { apiClient } from '../../services/apiClient';
import { formatUserDisplayName, useAppStore } from '../../store/appStore';
import type {
  CommunityPost,
  CommunityShowcaseSnippet,
  WorkspaceProject,
} from '../../types/index';
import { AiProjectSetupDrawer } from './AiProjectSetupDrawer';
import type { PreviewViewport } from './LivePreviewFrame';
import { LiveStage, type StageTabId } from './LiveStage';
import { Modal } from './Modal';
import { Popover } from './Popover';
import { ProjectRail } from './ProjectRail';
import type { ReviewTab } from './ReviewZone';
import {
  stripModeTag,
  Thread,
} from './Thread';
import { useMediaQuery } from './useMediaQuery';
import './workspace.css';

type AgentExecutionMode = 'Build' | 'Refine' | 'Audit';
type MobilePane = 'chat' | 'stage';

const AGENT_MODE_OPTIONS: AgentExecutionMode[] = ['Build', 'Refine', 'Audit'];

const MODEL_OPTIONS = [
  { id: 'auto', name: 'Tự động', note: 'Gateway mặc định' },
  { id: 'studio-smart-route', name: 'Smart Route', note: 'Cân bằng tốc độ' },
  { id: 'studio-heavy-route', name: 'Heavy Route', note: 'Kiến trúc đa tệp' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', note: 'Phản hồi nhanh' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', note: 'Tư duy hệ thống' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', note: 'Giao diện tinh gọn' },
];

const COMMUNITY_POSTS_STORAGE_KEY = 'fforum_v3_community_posts_v7';

const STARTER_PROMPTS = [
  {
    label: 'Landing SaaS',
    note: 'Hero + proof + CTA',
    prompt: 'Dựng landing page SaaS tối giản, hero lớn, ba thẻ lợi ích và CTA rõ ràng. Dùng HTML/CSS thuần, responsive 390/1440.',
  },
  {
    label: 'Dashboard vận hành',
    note: 'Bảng số liệu + trạng thái',
    prompt: 'Dựng dashboard vận hành một màn hình: KPI thật, bảng log, trạng thái dịch vụ và bộ lọc thời gian. Ưu tiên tương phản và bàn phím.',
  },
  {
    label: 'Component có trạng thái',
    note: 'Loading / empty / error',
    prompt: 'Dựng một component card có đủ bốn trạng thái loading, empty, error và populated; có nút thử lại thật và không dùng dữ liệu giả.',
  },
  {
    label: 'Soi bản dựng hiện tại',
    note: 'Audit 6 lớp',
    prompt: 'Soi bản dựng hiện tại: kiểm tra tương phản, bàn phím, responsive 390/768/1440, overflow và trạng thái lỗi. Chỉ sửa lỗi thật, giữ bố cục.',
  },
];

const DEFAULT_SYSTEM_PROMPT =
  'Ưu tiên HTML/CSS thuần, không thêm thư viện ngoài. Giữ bố cục hiện có nếu người dùng không yêu cầu đổi. Mọi trạng thái phải dùng được bằng bàn phím.';

function derivePublishTags(project: WorkspaceProject): string {
  const collected: string[] = [];
  for (const item of project.attachedItems) {
    if (item.tags) {
      for (const tag of item.tags) {
        const clean = tag.trim().toLowerCase();
        if (clean && !collected.includes(clean)) {
          collected.push(clean);
        }
      }
    }
  }
  if (collected.length === 0) return 'html, css, ui';
  return collected.slice(0, 5).join(', ');
}

function buildPublishSummary(project: WorkspaceProject): string {
  const report = project.checksReport;
  const checkNote = report
    ? `Kiểm định ${report.passCount}/${report.results.length} phép kiểm đạt${report.failCount > 0 ? `, ${report.failCount} lỗi` : ''}${report.warnCount > 0 ? `, ${report.warnCount} cảnh báo` : ''}.`
    : 'Chưa chạy kiểm định 6 lớp.';
  const fileNames = project.files.map((file) => file.path).join(', ');
  const baseDesc = project.description.trim();
  return [
    baseDesc || `Bản dựng từ phiên ${project.name}.`,
    `Đóng gói ${project.files.length} tệp (${fileNames}). ${checkNote}`,
  ].join(' ');
}

function packageDemoSnippet(project: WorkspaceProject): CommunityShowcaseSnippet {
  const htmlFile =
    project.files.find((file) => file.path === 'index.html') ||
    project.files.find((file) => file.path.endsWith('.html'));
  const cssFile =
    project.files.find((file) => file.path === 'styles.css') ||
    project.files.find((file) => file.path.endsWith('.css'));
  const jsFile =
    project.files.find((file) => file.path === 'app.js') ||
    project.files.find((file) => file.path.endsWith('.js'));

  const rawHtml = (htmlFile?.content || '').trim();
  const cleanHtml = rawHtml
    .replace(/<link[^>]+href=["'](?:\.\/)?styles\.css["'][^>]*>/gi, '')
    .replace(/<script[^>]+src=["'](?:\.\/)?app\.js["'][^>]*>\s*<\/script>/gi, '')
    .trim();

  return {
    html: cleanHtml || `<main><h1>${project.name}</h1></main>`,
    css: (cssFile?.content || '').trim(),
    js: (jsFile?.content || '').trim() || undefined,
  };
}

function prependCommunityPostToLocalStorage(post: CommunityPost): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(COMMUNITY_POSTS_STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as CommunityPost[]) : [];
    const list = Array.isArray(existing) ? existing : [];
    const next = [post, ...list.filter((entry) => entry.id !== post.id)];
    window.localStorage.setItem(COMMUNITY_POSTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    return;
  }
}

function hasRealWorkspaceContent(project: WorkspaceProject): boolean {
  if (project.files.length === 0) return false;
  if (project.files.length > 3) return true;

  for (const file of project.files) {
    if (file.path !== 'index.html' && file.path !== 'styles.css' && file.path !== 'app.js') {
      if (file.content.trim().length > 0) return true;
    }
    if (file.path === 'styles.css' || file.path === 'app.js') {
      if (file.content.trim().length > 0) return true;
    }
    if (file.path === 'index.html') {
      const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(file.content);
      const bodyInner = (bodyMatch ? bodyMatch[1] : file.content)
        .replace(/<script\b[^>]*src=["'](?:\.\/)?app\.js["'][^>]*>\s*<\/script>/gi, '')
        .trim();
      if (bodyInner.length > 0) return true;
    }
  }

  return false;
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
    regenerateLastPrompt,
    runChecksOnActiveProject,
    createProjectSnapshot,
    restoreProjectSnapshot,
    exportActiveProjectZip,
    aiActivity,
    aiStreamingStage,
    aiStreamingPreview,
    aiModelUsed,
    quota,
    currentUser,
    settings,
    navigate,
    setAuthModalOpen,
    addToast,
  } = useAppStore();

  const isDesktop = useMediaQuery('(min-width: 1080px)');
  const layout = isDesktop ? 'wide' : 'compact';

  const [mobilePane, setMobilePane] = useState<MobilePane>('chat');
  const [stageTab, setStageTab] = useState<StageTabId>('preview');
  const [reviewTab, setReviewTab] = useState<ReviewTab>('check');
  const [railOpen, setRailOpen] = useState(true);
  const [railSheetOpen, setRailSheetOpen] = useState(false);
  const [stageExpanded, setStageExpanded] = useState(false);

  const [viewport, setViewport] = useState<PreviewViewport>(() => {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 719px)').matches
      ? 390
      : 'fit';
  });

  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [composerValue, setComposerValue] = useState('');
  const [agentMode, setAgentMode] = useState<AgentExecutionMode>('Build');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [studioOpen, setStudioOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState(0.2);

  const hasGeneratedArtifact = useMemo(
    () => hasRealWorkspaceContent(activeProject),
    [activeProject]
  );

  const [rightMode, setRightMode] = useState<'compact' | 'split' | 'closed'>(() =>
    hasGeneratedArtifact ? 'split' : 'closed'
  );
  const rightOpen = rightMode !== 'closed';
  const prevProjectIdRef = useRef(activeProject.id);
  const prevArtifactRef = useRef(hasGeneratedArtifact);

  useEffect(() => {
    const projectChanged = prevProjectIdRef.current !== activeProject.id;
    const artifactAppeared = !prevArtifactRef.current && hasGeneratedArtifact;
    prevProjectIdRef.current = activeProject.id;
    prevArtifactRef.current = hasGeneratedArtifact;

    if (projectChanged) {
      setRightMode(hasGeneratedArtifact ? 'split' : 'closed');
      return;
    }
    if (!hasGeneratedArtifact) {
      setRightMode('closed');
      return;
    }
    if (artifactAppeared || (aiActivity === 'streaming' && hasGeneratedArtifact)) {
      setStageTab('preview');
      setRightMode('split');
    }
  }, [activeProject.id, hasGeneratedArtifact, aiActivity]);

  const [dropZoneOpen, setDropZoneOpen] = useState(false);
  const [setupDrawerOpen, setSetupDrawerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishBody, setPublishBody] = useState('');
  const [publishTags, setPublishTags] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);

  const dockRef = useRef<HTMLDivElement>(null);
  const wsContainerRef = useRef<HTMLDivElement>(null);
  const renameId = useId();
  const publishTitleId = useId();
  const publishBodyId = useId();
  const publishTagsId = useId();

  const [splitRatio, setSplitRatio] = useState<number>(() => {
    if (typeof window === 'undefined') return 40;
    try {
      const saved = window.localStorage.getItem('fforum_ws_split_ratio');
      if (saved) {
        const val = Number(saved);
        if (!Number.isNaN(val) && val >= 20 && val <= 80) return val;
      }
    } catch {
      void 0;
    }
    return 40;
  });
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (downEvent: React.PointerEvent) => {
    downEvent.preventDefault();
    setIsResizing(true);

    const onPointerMove = (e: PointerEvent) => {
      if (!wsContainerRef.current) return;
      const rect = wsContainerRef.current.getBoundingClientRect();
      const railOffset = railOpen && isDesktop ? 240 : 0;
      const usableWidth = rect.width - railOffset - 10;
      if (usableWidth <= 100) return;
      const currentX = e.clientX - rect.left - railOffset;
      const newRatio = Math.round(Math.min(80, Math.max(20, (currentX / usableWidth) * 100)));
      setSplitRatio(newRatio);
      try {
        window.localStorage.setItem('fforum_ws_split_ratio', String(newRatio));
      } catch {
        void 0;
      }
    };

    const onPointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const cycleSplitPresets = () => {
    const presets = [35, 50, 65, 45];
    setSplitRatio((prev) => {
      const idx = presets.indexOf(prev);
      const next = presets[(idx + 1) % presets.length];
      try {
        window.localStorage.setItem('fforum_ws_split_ratio', String(next));
      } catch {
        void 0;
      }
      return next;
    });
  };

  const handleShareToKnowledge = () => {
    setPublishTitle(activeProject.name);
    setPublishBody(
      `Mẫu giao diện đa tệp "${activeProject.name}" được xây dựng và kiểm định trực tiếp trong F-Forum Workspace.`
    );
    setPublishTags('workspace, demo, ui-design');
    setPublishOpen(true);
  };

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

  const isGenerating =
    aiActivity === 'thinking' ||
    aiActivity === 'streaming' ||
    aiStreamingStage === 'routing' ||
    aiStreamingStage === 'generating' ||
    aiStreamingStage === 'checking';

  const quotaBlocked = !quota.unlimited && quota.exhausted;
  const quotaLabel = quota.unlimited
    ? 'không giới hạn'
    : quota.limit === null
      ? `${quota.used} lượt`
      : `${quota.used}/${quota.limit} lượt`;

  const railInline = isDesktop && railOpen;
  const stageInline = isDesktop && rightOpen;
  const isSplitStage = isDesktop && rightMode === 'split';
  const stageDataAttr = !isDesktop ? 'open' : rightMode;
  const threadHidden = !isDesktop && mobilePane !== 'chat';
  const stageHidden = (isDesktop && rightMode === 'closed') || (!isDesktop && mobilePane !== 'stage');
  const checksPassLabel = activeProject.checksReport
    ? `${activeProject.checksReport.passCount}/${activeProject.checksReport.results.length} phép kiểm đạt`
    : 'Kiểm định 6 lớp';

  const sendPrompt = async (text: string) => {
    const raw = text.trim();
    if (!raw || isGenerating) return;
    await sendWorkspacePrompt(`[Mode: ${agentMode}] ${raw}`, {
      model: selectedModel,
      agentMode,
      stream: true,
      systemPrompt: systemPrompt.trim() || undefined,
      temperature,
    });
  };

  const handleRetry = () => {
    const lastUserTurn = [...activeProject.messages].reverse().find((message) => message.role === 'user');
    if (lastUserTurn) void sendPrompt(stripModeTag(lastUserTurn.content));
  };

  const handleRegenerate = () => {
    if (isGenerating || quotaBlocked) return;
    void regenerateLastPrompt({
      model: selectedModel,
      agentMode,
      systemPrompt: systemPrompt.trim() || undefined,
      temperature,
    });
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
        title: `Đã tải ${result.filename}`,
        message: result.clean
          ? 'Đã quét bảo mật: 0 chuỗi nhạy cảm trong gói ZIP.'
          : `Đã ẩn ${result.findingsCount} chuỗi nhạy cảm trước khi đóng gói.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Xuất ZIP thất bại',
        message: 'Không tạo được tệp nén từ phiên làm việc.',
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
      title: `Kiểm định 6 lớp: ${report.passCount}/${report.results.length} đạt`,
    });
  };

  const handleOpenFileInStage = (path: string) => {
    setActiveFilePath(path);
    setStageTab('source');
    setRightMode('split');
    if (!isDesktop) {
      setMobilePane('stage');
    }
  };

  const handleOpenPreviewStage = () => {
    setStageTab('preview');
    setRightMode('split');
    if (!isDesktop) {
      setMobilePane('stage');
    }
  };

  const handleOpenDiffStage = () => {
    setReviewTab('diff');
    setStageTab('review');
    setRightMode('split');
    if (!isDesktop) {
      setMobilePane('stage');
    }
  };

  const handleOpenChecksStage = () => {
    setReviewTab('check');
    setStageTab('review');
    setRightMode('split');
    if (!isDesktop) {
      setMobilePane('stage');
    }
  };

  const openPublishModal = () => {
    setPublishTitle(activeProject.name);
    setPublishBody(buildPublishSummary(activeProject));
    setPublishTags(derivePublishTags(activeProject));
    setPublishedPostId(null);
    setPublishOpen(true);
  };

  const handleGoToCommunity = () => {
    if (publishedPostId && typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('ff_community_post_id', publishedPostId);
      } catch {
        void 0;
      }
    }
    setPublishOpen(false);
    navigate('community');
  };

  const handlePublishSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanTitle = publishTitle.trim();
    if (!cleanTitle || publishing) return;

    setPublishing(true);
    const cleanBody = publishBody.trim() || buildPublishSummary(activeProject);
    const parsedTags = publishTags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    const finalTags = parsedTags.length > 0 ? parsedTags : ['html', 'css', 'ui'];
    const demoSnippet = packageDemoSnippet(activeProject);
    const now = new Date().toISOString();

    const fallbackPost: CommunityPost = {
      id: `post-ws-${Date.now()}`,
      channel: 'showcase',
      title: cleanTitle,
      body: cleanBody,
      description: cleanBody,
      category: 'Workspace Build',
      tags: finalTags,
      createdAt: now,
      votes: 1,
      likes: 1,
      views: 1,
      author: {
        id: currentUser?.id || 'guest-builder',
        name: currentUser?.name || 'Builder Cộng đồng',
        handle: currentUser?.username || 'builder_vn',
        role: currentUser?.role === 'admin' ? 'Điều hành' : 'Thành viên',
      },
      demoSnippet,
      answers: [],
    };

    try {
      let publishedPost = fallbackPost;
      try {
        const res = await apiClient.createCommunityPost({
          channel: 'showcase',
          title: cleanTitle,
          body: cleanBody,
          category: 'Workspace Build',
          tags: finalTags,
          demoSnippet,
        });
        publishedPost = {
          ...res.post,
          demoSnippet: res.post.demoSnippet || demoSnippet,
        };
      } catch {
        publishedPost = fallbackPost;
      }

      prependCommunityPostToLocalStorage(publishedPost);
      setPublishedPostId(publishedPost.id);
      addToast({
        type: 'success',
        title: 'Đã đăng bản dựng lên Tri thức',
        message: publishedPost.title,
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    setRenaming(false);
    setRailSheetOpen(false);
  };

  const handleCreateProject = () => {
    createProject(`Phiên làm việc ${projects.length + 1}`);
    setRenaming(false);
    setRailSheetOpen(false);
    setRightMode('closed');
    setMobilePane('chat');
  };

  const submitRename = (event: React.FormEvent) => {
    event.preventDefault();
    renameProject(activeProject.id, renameDraft);
    setRenaming(false);
  };

  const liveStageElement = (isExpandedView: boolean) => (
    <LiveStage
      project={activeProject}
      totals={diffTotals}
      stageTab={stageTab}
      onStageTabChange={(nextTab) => {
        setStageTab(nextTab);
        if (!isDesktop) setMobilePane('stage');
      }}
      reviewTab={reviewTab}
      onReviewTabChange={setReviewTab}
      viewport={viewport}
      onViewportChange={setViewport}
      onSelectFile={setActiveFilePath}
      onUpdateFile={updateWorkspaceFile}
      onRunChecks={handleRunChecks}
      onExportZip={() => void handleExportZip()}
      exporting={exporting}
      onOpenPublish={openPublishModal}
      onCreateSnapshot={() => createProjectSnapshot()}
      onRestoreSnapshot={restoreProjectSnapshot}
      expanded={isExpandedView}
      onToggleExpanded={() => setStageExpanded((value) => !value)}
      compact={!isExpandedView && isDesktop && rightMode === 'compact'}
      onEnterSplit={(nextTab, nextReview) => {
        setStageTab(nextTab);
        if (nextReview) setReviewTab(nextReview);
        setRightMode('split');
        if (!isDesktop) setMobilePane('stage');
      }}
      onExitSplit={() => setRightMode('compact')}
      hasArtifact={hasGeneratedArtifact}
      hidden={!isExpandedView && stageHidden}
    />
  );

  const renderProjectRail = (dismiss: React.ReactNode) => (
    <ProjectRail
      projects={projects}
      activeProjectId={activeProject.id}
      onSelect={handleSelectProject}
      onCreate={handleCreateProject}
      onRename={renameProject}
      onDelete={deleteProject}
      onTogglePin={togglePinProject}
      onNavigate={navigate}
      userName={formatUserDisplayName(currentUser?.name, 'Khách')}
      quotaLabel={quotaLabel}
      theme={settings.theme}
      dismiss={dismiss}
    />
  );

  return (
    <div
      ref={wsContainerRef}
      className="ws"
      data-layout={layout}
      data-rail={railInline ? 'open' : 'closed'}
      data-stage={stageDataAttr}
      data-density={settings.compactDensity ? 'compact' : 'roomy'}
      data-resizing={isResizing ? 'true' : undefined}
      style={{ '--ws-split-ratio': splitRatio } as React.CSSProperties}
    >
      {railInline && (
        <aside className="ws-rail" aria-label="Danh sách phiên làm việc">
          {renderProjectRail(
            <button
              type="button"
              className="ws-icon-pill"
              aria-label="Thu gọn danh sách phiên"
              title="Thu gọn"
              onClick={() => setRailOpen(false)}
            >
              <PanelLeftClose size={16} aria-hidden="true" />
            </button>
          )}
        </aside>
      )}

      <section className="ws-thread" aria-label="Bảng hội thoại Agent" hidden={threadHidden}>
        <header className="ws-head ws-chat-head">
          {!railInline && (
            <button
              type="button"
              className="ws-icon-pill"
              aria-label="Mở danh sách phiên"
              title="Danh sách phiên"
              onClick={() => (isDesktop ? setRailOpen(true) : setRailSheetOpen(true))}
            >
              <PanelLeft size={16} aria-hidden="true" />
            </button>
          )}

          {renaming ? (
            <form className="ws-rename" onSubmit={submitRename}>
              <label className="sr-only" htmlFor={renameId}>
                Tên phiên làm việc
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
            <Popover
              label={`Phiên: ${activeProject.name}`}
              triggerClassName="ws-arena-session-drop"
              align="left"
              trigger={
                <>
                  <h1 className="ws-head-title ws-title" title={activeProject.name}>
                    {activeProject.name}
                  </h1>
                  <ChevronDown size={14} aria-hidden="true" />
                </>
              }
            >
              {(close) => (
                <div className="ws-menu-wrap">
                  <div className="ws-menu-quota">
                    <span className="t-label">Hạn mức</span>
                    <span className="ws-count">{quotaLabel}</span>
                  </div>
                  <ul className="ws-menu">
                    <li>
                      <button
                        type="button"
                        className="ws-menu-item"
                        onClick={() => {
                          close();
                          setSetupDrawerOpen(true);
                        }}
                      >
                        Cấu hình Model &amp; BYOK
                      </button>
                    </li>
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
                        Đổi tên phiên
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
                        {activeProject.pinned ? 'Bỏ ghim phiên' : 'Ghim phiên'}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="ws-menu-item"
                        onClick={() => {
                          createProjectSnapshot();
                          close();
                        }}
                      >
                        Lưu mốc phiên
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
                        Xóa phiên
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </Popover>
          )}

          <div className="ws-chat-controls">
            {isDesktop && hasGeneratedArtifact && (
              <button
                type="button"
                className="ws-icon-pill ws-icon-pill--sm"
                aria-label={rightOpen ? 'Thu gọn panel workspace phải' : 'Mở panel xem trước & mã nguồn'}
                title={rightOpen ? 'Đóng Xem trước & Mã nguồn' : 'Mở Xem trước & Mã nguồn'}
                onClick={() => setRightMode(rightOpen ? 'closed' : 'split')}
              >
                {rightOpen ? (
                  <ChevronsRight size={15} aria-hidden="true" />
                ) : (
                  <ChevronsLeft size={15} aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </header>

        <Thread
          messages={activeProject.messages}
          activity={aiActivity}
          streamingStage={aiStreamingStage}
          streamingPreview={aiStreamingPreview}
          modelUsed={aiModelUsed}
          userName={formatUserDisplayName(currentUser?.name, 'Bạn')}
          onOpenByok={() => setSetupDrawerOpen(true)}
          onOpenExplore={() => navigate('explore')}
          onOpenUpload={() => setDropZoneOpen(true)}
          onOpenFile={handleOpenFileInStage}
          onOpenPreview={handleOpenPreviewStage}
          onOpenDiff={handleOpenDiffStage}
          onOpenChecks={handleOpenChecksStage}
          checksPassLabel={checksPassLabel}
          onRetry={handleRetry}
          onRegenerate={handleRegenerate}
          canRetry={!isGenerating && !quotaBlocked}
          canRegenerate={!isGenerating && !quotaBlocked}
          starters={STARTER_PROMPTS}
          onUseStarter={(prompt) => setComposerValue(prompt)}
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
                      className="ws-icon-pill ws-icon-pill--xs"
                      aria-label={`Gỡ ${item.title}`}
                      title="Gỡ"
                      onClick={() => detachItemFromWorkspace(item.id)}
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {dropZoneOpen && (
              <div className="ws-drop">
                <DynamicDropZone
                  onFilesAdded={handleFilesDropped}
                  label="Thả tệp HTML, CSS, JS hoặc ảnh tham chiếu"
                  compact
                />
                <div className="ws-drop-side">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('explore')}
                  >
                    Kho mẫu
                  </button>
                  <button
                    type="button"
                    className="ws-icon-pill"
                    aria-label="Đóng khung nạp tệp"
                    title="Đóng"
                    onClick={() => setDropZoneOpen(false)}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {quotaBlocked && (
              <div className="ws-quota" role="status">
                <p>
                  Đã dùng hết <span className="ws-count">{quotaLabel}</span>. Mở BYOK để gắn khóa riêng.
                </p>
                <div className="ws-quota-actions">
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => setSetupDrawerOpen(true)}
                  >
                    Gắn BYOK
                  </button>
                  {!currentUser && (
                    <button
                      type="button"
                      className="btn btn-red btn-sm"
                      onClick={() => setAuthModalOpen(true)}
                    >
                      Đăng nhập
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="ws-arena-composer-shell">
              {studioOpen && (
                <section className="ws-studio-panel" aria-label="Chỉ dẫn phiên AI">
                  <div className="ws-studio-head">
                    <div className="ws-studio-title">
                      <Sparkles size={15} aria-hidden="true" />
                      <span>
                        <strong>Chỉ dẫn phiên</strong>
                        <small>Áp dụng cho lượt gửi tiếp theo</small>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--xs"
                      aria-label="Đóng chỉ dẫn phiên"
                      onClick={() => setStudioOpen(false)}
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>

                  <label className="ws-studio-field">
                    <span>System instructions</span>
                    <textarea
                      value={systemPrompt}
                      rows={3}
                      maxLength={2000}
                      onChange={(event) => setSystemPrompt(event.target.value)}
                      placeholder="Ví dụ: giữ bố cục hiện tại, chỉ sửa phần tiếp cận..."
                    />
                  </label>

                  <div className="ws-studio-row">
                    <label className="ws-studio-range">
                      <span>
                        Temperature
                        <output>{temperature.toFixed(1)}</output>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={temperature}
                        onChange={(event) => setTemperature(Number(event.target.value))}
                      />
                    </label>
                    <div className="ws-studio-model">
                      <span>Model</span>
                      <strong>
                        {MODEL_OPTIONS.find((model) => model.id === selectedModel)?.name ?? 'Tự động'}
                      </strong>
                      <button
                        type="button"
                        className="ws-studio-link"
                        onClick={() => setSetupDrawerOpen(true)}
                      >
                        Đổi model / BYOK
                      </button>
                    </div>
                  </div>

                  <div className="ws-studio-presets" aria-label="Mẫu chỉ dẫn">
                    <button
                      type="button"
                      className="ws-studio-preset"
                      onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                    >
                      Tối giản
                    </button>
                    <button
                      type="button"
                      className="ws-studio-preset"
                      onClick={() =>
                        setSystemPrompt(
                          'Bám sát mẫu đã đính kèm. Giữ hệ thống chữ, nhịp khoảng cách và tương phản; chỉ thay nội dung khi được yêu cầu.'
                        )
                      }
                    >
                      Bám thiết kế
                    </button>
                    <button
                      type="button"
                      className="ws-studio-preset"
                      onClick={() =>
                        setSystemPrompt(
                          'Đóng vai kỹ sư kiểm định: rà soát bàn phím, tương phản, overflow 390/768/1440 và bốn trạng thái dữ liệu. Nêu lỗi cụ thể trước khi sửa.'
                        )
                      }
                    >
                      Kiểm định
                    </button>
                  </div>
                </section>
              )}

              <div className="ws-arena-repo-strip">
                <div className="ws-arena-repo-pills">
                  <span className="ws-arena-repo-name" title={`Dự án: ${activeProject.name}`}>
                    <Layers size={12} aria-hidden="true" />
                    <span>{activeProject.name}</span>
                  </span>
                  {hasGeneratedArtifact && (
                    <span className="ws-arena-branch-name" title="Số tệp mã nguồn trong phiên">
                      {activeProject.files.length} tệp
                    </span>
                  )}
                </div>

                <div className="ws-arena-actions">
                  {hasGeneratedArtifact ? (
                    <>
                      <button
                        type="button"
                        className="ws-arena-diff-pill"
                        onClick={handleOpenDiffStage}
                        title="Mở bảng đối chiếu Diff"
                      >
                        <span className="ws-add">+{diffTotals.added}</span>
                        <span className="ws-del">−{diffTotals.removed}</span>
                        <span aria-hidden="true">›</span>
                      </button>
                      <button
                        type="button"
                        className="ws-arena-action-btn ws-arena-action-btn--accent"
                        onClick={handleShareToKnowledge}
                        title="Chia sẻ mẫu giao diện này lên Tri thức cộng đồng"
                      >
                        <Share2 size={12} aria-hidden="true" />
                        <span>Đăng Tri thức</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="ws-arena-action-btn"
                        onClick={() => setSetupDrawerOpen(true)}
                        title="Mở Cài đặt -> Khóa riêng (BYOK)"
                      >
                        <KeyRound size={12} aria-hidden="true" />
                        <span>BYOK</span>
                      </button>
                      <button
                        type="button"
                        className="ws-arena-action-btn ws-arena-action-btn--accent"
                        onClick={() => navigate('explore')}
                        title="Duyệt và nạp mẫu thật từ Kho 8.322 mẫu"
                      >
                        <Compass size={12} aria-hidden="true" />
                        <span>Kho 8.322 mẫu</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <PromptComposer
                layoutId="ff-prompt-composer"
                theme={settings.theme}
                menuPlacement="up"
                value={composerValue}
                onChange={setComposerValue}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                models={MODEL_OPTIONS}
                showFan={false}
                extraControls={
                  <div className="ws-arena-inline-controls">
                    <div className="ws-arena-mode-inline" role="group" aria-label="Chế độ thực thi">
                      {AGENT_MODE_OPTIONS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className="ws-arena-mode-chip"
                          aria-pressed={agentMode === m}
                          onClick={() => setAgentMode(m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="ws-arena-mini-icon"
                      aria-pressed={studioOpen}
                      aria-label="Chỉ dẫn phiên và temperature"
                      title="Chỉ dẫn phiên và temperature"
                      onClick={() => setStudioOpen((open) => !open)}
                    >
                      <Sparkles size={13} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="ws-arena-mini-icon"
                      aria-label="Cấu hình Model & BYOK"
                      title="Cấu hình Model & BYOK"
                      onClick={() => setSetupDrawerOpen(true)}
                    >
                      <SlidersHorizontal size={13} aria-hidden="true" />
                    </button>
                  </div>
                }
                placeholder="Bạn muốn dựng hoặc chỉnh sửa giao diện gì? (Enter để gửi)..."
                onAttachClick={() => setDropZoneOpen((value) => !value)}
                onSend={(text) => {
                  setComposerValue('');
                  void sendPrompt(text);
                }}
                disabled={isGenerating || quotaBlocked}
              />
            </div>
          </div>
        </footer>
      </section>

      {isSplitStage && layout === 'wide' && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={splitRatio}
          aria-valuemin={20}
          aria-valuemax={80}
          aria-label="Kéo để thay đổi kích thước chia màn hình"
          tabIndex={0}
          className={`ws-resizer ${isResizing ? 'is-dragging' : ''}`}
          onPointerDown={startResizing}
          onDoubleClick={cycleSplitPresets}
          title={`Kéo đổi tỷ lệ (${splitRatio}% / ${100 - splitRatio}%) · Nhấp đúp để đổi mốc (35%, 50%, 65%)`}
        >
          <div className="ws-resizer-line" aria-hidden="true" />
          <div className="ws-resizer-handle" aria-hidden="true" />
          <div className="ws-resizer-badge" aria-hidden="true">
            {splitRatio}%
          </div>
        </div>
      )}

      {liveStageElement(false)}

      {!isDesktop && (
        <nav className="ws-switch" aria-label="Chuyển vùng làm việc">
          <button
            type="button"
            className="ws-switch-item"
            aria-pressed={mobilePane === 'chat'}
            onClick={() => setMobilePane('chat')}
          >
            Hội thoại
          </button>
          <button
            type="button"
            className="ws-switch-item"
            aria-pressed={mobilePane === 'stage' && stageTab === 'preview'}
            onClick={() => {
              setStageTab('preview');
              setMobilePane('stage');
            }}
          >
            Xem
          </button>
          <button
            type="button"
            className="ws-switch-item"
            aria-pressed={mobilePane === 'stage' && stageTab === 'source'}
            onClick={() => {
              setStageTab('source');
              setMobilePane('stage');
            }}
          >
            Mã
          </button>
          <button
            type="button"
            className="ws-switch-item"
            aria-pressed={mobilePane === 'stage' && stageTab === 'review'}
            onClick={() => {
              setStageTab('review');
              setMobilePane('stage');
            }}
          >
            Kiểm
          </button>
        </nav>
      )}

      <Modal
        open={railSheetOpen && !isDesktop}
        onClose={() => setRailSheetOpen(false)}
        label="Danh sách phiên làm việc"
        className="ws-modal ws-modal-left"
      >
        <div className="ws-rail">
          {renderProjectRail(
            <button
              type="button"
              className="ws-icon-pill"
              aria-label="Đóng danh sách phiên"
              title="Đóng"
              onClick={() => setRailSheetOpen(false)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </Modal>

      <Modal
        open={stageExpanded}
        onClose={() => setStageExpanded(false)}
        label="Toàn màn hình Live Artifact Stage"
        className="ws-modal ws-modal-full"
      >
        {liveStageElement(true)}
      </Modal>

      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        label="Đăng bản dựng lên Tri thức"
        className="ws-modal ws-modal-publish"
      >
        <div className="ws-publish">
          <header className="ws-publish-head">
            <div className="ws-publish-title-wrap">
              <Share2 size={16} aria-hidden="true" />
              <h2>Đăng lên Tri thức</h2>
            </div>
            <button
              type="button"
              className="ws-icon-pill"
              aria-label="Đóng hộp thoại đăng bài"
              title="Đóng"
              onClick={() => setPublishOpen(false)}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </header>

          {publishedPostId ? (
            <div className="ws-publish-done" role="status">
              <div className="ws-publish-done-row">
                <CheckCircle2 size={20} aria-hidden="true" />
                <div>
                  <p className="ws-publish-done-title">Bản dựng đã lên bảng Tri thức</p>
                  <p className="ws-publish-done-sub">
                    Mã HTML, CSS và JS kèm bản xem trước tương tác đã được đóng gói vào kênh Showcase.
                  </p>
                </div>
              </div>
              <div className="ws-publish-actions">
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() => setPublishOpen(false)}
                >
                  Ở lại Workspace
                </button>
                <button
                  type="button"
                  className="btn btn-red"
                  onClick={handleGoToCommunity}
                >
                  <span>Mở Tri thức</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <form className="ws-publish-form" onSubmit={(event) => void handlePublishSubmit(event)}>
              <div className="ws-publish-field">
                <label className="t-label" htmlFor={publishTitleId}>
                  Tiêu đề bản dựng
                </label>
                <input
                  id={publishTitleId}
                  type="text"
                  className="field"
                  value={publishTitle}
                  onChange={(event) => setPublishTitle(event.target.value)}
                  required
                  maxLength={120}
                />
              </div>

              <div className="ws-publish-field">
                <label className="t-label" htmlFor={publishBodyId}>
                  Tóm tắt kỹ thuật
                </label>
                <textarea
                  id={publishBodyId}
                  className="field ws-publish-textarea"
                  rows={3}
                  value={publishBody}
                  onChange={(event) => setPublishBody(event.target.value)}
                />
              </div>

              <div className="ws-publish-field">
                <label className="t-label" htmlFor={publishTagsId}>
                  Thẻ phân loại (phân cách bằng dấu phẩy)
                </label>
                <input
                  id={publishTagsId}
                  type="text"
                  className="field"
                  value={publishTags}
                  onChange={(event) => setPublishTags(event.target.value)}
                  placeholder="html, css, ui"
                />
              </div>

              <div className="ws-publish-meta">
                <span>{checksPassLabel}</span>
                <span>{activeProject.files.length} tệp đính kèm</span>
              </div>

              <div className="ws-publish-actions">
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() => setPublishOpen(false)}
                  disabled={publishing}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-red"
                  disabled={publishing || !publishTitle.trim()}
                >
                  {publishing ? 'Đang đăng...' : 'Đăng bản dựng'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        label="Xóa phiên làm việc"
        className="ws-modal ws-modal-confirm"
      >
        <div className="ws-confirm">
          <h2>Xóa phiên làm việc?</h2>
          <p>Hội thoại, tệp mã nguồn và mốc lưu của “{activeProject.name}” sẽ bị xóa vĩnh viễn.</p>
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
              Xóa phiên
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
