import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  IconArrowUpRight,
  IconCheckCircle2,
  IconChevronDown,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayers,
  IconPanelLeft,
  IconPanelLeftClose,
  IconShare2,
  IconSlidersHorizontal,
  IconSparkles,
  IconX,
} from '../../ui/icons';
import { DynamicDropZone } from '../../components/pinui/DynamicDropZone';
import { PromptComposer } from '../../components/pinui/PromptComposer';
import { formatUserDisplayName, useAppStore } from '../../store/appStore';
import { runWorkspaceChecks } from '../../services/checksRunner';
import { generateProjectSetupBundle } from '../../services/projectSetupGenerator';
import { sanitizeFilesForZipExport } from '../../services/secretScanner';
import type {
  ChecksReport,
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
const SPLIT_RATIO_STORAGE_KEY = 'fforum_ws_split_ratio';

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

function readDeletedPaths(projectId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`fforum_v3_ws_deleted_files_${projectId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeDeletedPaths(projectId: string, paths: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (paths.length === 0) {
      window.localStorage.removeItem(`fforum_v3_ws_deleted_files_${projectId}`);
    } else {
      window.localStorage.setItem(`fforum_v3_ws_deleted_files_${projectId}`, JSON.stringify(paths));
    }
  } catch {
    return;
  }
}

function readSnapshotDeletedMap(projectId: string): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`fforum_v3_ws_snap_deleted_${projectId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) {
        out[k] = v.filter((item): item is string => typeof item === 'string');
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeSnapshotDeletedMap(projectId: string, map: Record<string, string[]>): void {
  if (typeof window === 'undefined') return;
  try {
    if (Object.keys(map).length === 0) {
      window.localStorage.removeItem(`fforum_v3_ws_snap_deleted_${projectId}`);
    } else {
      window.localStorage.setItem(`fforum_v3_ws_snap_deleted_${projectId}`, JSON.stringify(map));
    }
  } catch {
    return;
  }
}

function extractAttributionLines(project: WorkspaceProject): string[] {
  const lines: string[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(`fforum_v3_ws_attribution_${project.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { label?: string; author?: string };
        if (parsed?.label) {
          lines.push(`Dựa trên: ${parsed.label}${parsed.author ? ` (${parsed.author})` : ''}.`);
        }
      }
    } catch {
      void 0;
    }
  }
  for (const item of project.attachedItems) {
    if (item.id.startsWith('fork-')) {
      const line = `Nguồn fork: ${item.title}.`;
      if (!lines.includes(line)) lines.push(line);
    } else if (item.kind === 'template' || item.kind === 'blueprint' || item.kind === 'resource') {
      const sourceNote = item.sourceLibrary ? ` (${item.sourceLibrary})` : '';
      const line = `Nguồn mẫu: ${item.title}${sourceNote}.`;
      if (!lines.includes(line)) lines.push(line);
    }
  }
  return lines;
}

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
  const attribution = extractAttributionLines(project);
  return [
    baseDesc || `Bản dựng từ phiên ${project.name}.`,
    `Đóng gói ${project.files.length} tệp (${fileNames}). ${checkNote}`,
    ...attribution,
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

  const safeName = project.name
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return {
    html: cleanHtml || `<main><h1>${safeName}</h1></main>`,
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
    deleteWorkspaceFile,
    addWorkspaceFiles,
    attachItemToWorkspace,
    detachItemFromWorkspace,
    sendWorkspacePrompt,
    regenerateLastPrompt,
    runChecksOnActiveProject,
    createProjectSnapshot,
    restoreProjectSnapshot,
    exportActiveProjectZip,
    createPost,
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

  const [deletedPaths, setDeletedPaths] = useState<string[]>(() =>
    readDeletedPaths(activeProject.id)
  );
  const [snapDeletedMap, setSnapDeletedMap] = useState<Record<string, string[]>>(() =>
    readSnapshotDeletedMap(activeProject.id)
  );
  const [localChecksByProject, setLocalChecksByProject] = useState<Record<string, ChecksReport>>({});
  const pendingSnapshotRef = useRef<{
    projectId: string;
    prevTopId: string | null;
    deleted: string[];
  } | null>(null);

  useEffect(() => {
    setDeletedPaths(readDeletedPaths(activeProject.id));
    setSnapDeletedMap(readSnapshotDeletedMap(activeProject.id));
  }, [activeProject.id]);

  useEffect(() => {
    const pending = pendingSnapshotRef.current;
    if (!pending || pending.projectId !== activeProject.id) return;
    const topId = activeProject.snapshots[0]?.id ?? null;
    if (!topId || topId === pending.prevTopId) return;
    pendingSnapshotRef.current = null;
    setSnapDeletedMap((prev) => {
      const next = { ...prev, [topId]: pending.deleted };
      writeSnapshotDeletedMap(activeProject.id, next);
      return next;
    });
  }, [activeProject.id, activeProject.snapshots]);

  const visibleFiles = useMemo(() => {
    const filtered = activeProject.files.filter((file) => !deletedPaths.includes(file.path));
    return filtered.length > 0 ? filtered : activeProject.files.slice(0, 1);
  }, [activeProject.files, deletedPaths]);

  const effectiveDeletedSet = useMemo(() => {
    const visibleSet = new Set(visibleFiles.map((file) => file.path));
    return new Set(deletedPaths.filter((path) => !visibleSet.has(path)));
  }, [deletedPaths, visibleFiles]);

  const effectiveDiffs = useMemo(() => {
    if (effectiveDeletedSet.size === 0) return activeProject.diffs;
    return activeProject.diffs.filter((entry) => !effectiveDeletedSet.has(entry.path));
  }, [activeProject.diffs, effectiveDeletedSet]);

  const effectiveChecksReport = useMemo<ChecksReport | null>(() => {
    const localReport = localChecksByProject[activeProject.id] ?? null;
    const storeReport = activeProject.checksReport;
    const baseReport =
      localReport && (!storeReport || localReport.ranAt >= storeReport.ranAt)
        ? localReport
        : storeReport;
    if (effectiveDeletedSet.size === 0) return baseReport;
    if (!baseReport) return null;
    const recomputed = runWorkspaceChecks(visibleFiles);
    return {
      ...recomputed,
      ranAt: baseReport.ranAt,
    };
  }, [localChecksByProject, activeProject.id, activeProject.checksReport, effectiveDeletedSet, visibleFiles]);

  const effectiveSnapshots = useMemo(
    () =>
      activeProject.snapshots.map((snap) => {
        const hidden = snapDeletedMap[snap.id];
        if (!hidden || hidden.length === 0) return snap;
        const hiddenSet = new Set(hidden);
        const filteredSnapFiles = snap.files.filter((file) => !hiddenSet.has(file.path));
        return {
          ...snap,
          files: filteredSnapFiles.length > 0 ? filteredSnapFiles : snap.files.slice(0, 1),
        };
      }),
    [activeProject.snapshots, snapDeletedMap]
  );

  const effectiveProject = useMemo<WorkspaceProject>(() => {
    const hasCurrent = visibleFiles.some((file) => file.path === activeProject.activeFilePath);
    return {
      ...activeProject,
      files: visibleFiles,
      diffs: effectiveDiffs,
      checksReport: effectiveChecksReport,
      snapshots: effectiveSnapshots,
      activeFilePath: hasCurrent ? activeProject.activeFilePath : (visibleFiles[0]?.path || ''),
    };
  }, [activeProject, visibleFiles, effectiveDiffs, effectiveChecksReport, effectiveSnapshots]);

  const handleUpdateWorkspaceFile = useCallback(
    (path: string, content: string) => {
      if (deletedPaths.includes(path)) {
        const nextDeleted = deletedPaths.filter((item) => item !== path);
        setDeletedPaths(nextDeleted);
        writeDeletedPaths(activeProject.id, nextDeleted);
      }
      updateWorkspaceFile(path, content);
    },
    [deletedPaths, activeProject.id, updateWorkspaceFile]
  );

  const handleDeleteWorkspaceFile = useCallback(
    (path: string) => {
      if (visibleFiles.length <= 1) return;
      deleteWorkspaceFile(path);
      if (deletedPaths.includes(path)) {
        const nextDeleted = deletedPaths.filter((item) => item !== path);
        setDeletedPaths(nextDeleted);
        writeDeletedPaths(activeProject.id, nextDeleted);
      }
      if (effectiveProject.activeFilePath === path) {
        const nextFile = visibleFiles.find((file) => file.path !== path);
        if (nextFile) {
          setActiveFilePath(nextFile.path);
        }
      }
    },
    [
      visibleFiles,
      deletedPaths,
      activeProject.id,
      effectiveProject.activeFilePath,
      deleteWorkspaceFile,
      setActiveFilePath,
    ]
  );

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
    () => hasRealWorkspaceContent(effectiveProject),
    [effectiveProject]
  );

  const isGenerating =
    aiActivity === 'thinking' ||
    aiActivity === 'streaming' ||
    aiStreamingStage === 'routing' ||
    aiStreamingStage === 'generating' ||
    aiStreamingStage === 'checking';

  const hasBuildError = aiActivity === 'error';

  const isWelcome = useMemo(
    () => !hasGeneratedArtifact && activeProject.messages.every((message) => message.role !== 'user'),
    [hasGeneratedArtifact, activeProject.messages]
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
    if (isGenerating || (hasBuildError && !hasGeneratedArtifact)) {
      setStageTab('preview');
      setRightMode('split');
      return;
    }
    if (!hasGeneratedArtifact) {
      setRightMode('closed');
      return;
    }
    if (artifactAppeared) {
      setStageTab('preview');
      setRightMode('split');
    }
  }, [activeProject.id, hasGeneratedArtifact, isGenerating, hasBuildError, aiActivity]);

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
  const resizerRef = useRef<HTMLDivElement>(null);
  const resizerBadgeRef = useRef<HTMLDivElement>(null);
  const renameId = useId();
  const publishTitleId = useId();
  const publishBodyId = useId();
  const publishTagsId = useId();

  const [splitRatio, setSplitRatio] = useState<number>(() => {
    if (typeof window === 'undefined') return 40;
    try {
      const saved = window.localStorage.getItem(SPLIT_RATIO_STORAGE_KEY);
      if (saved) {
        const val = Number(saved);
        if (!Number.isNaN(val) && val >= 20 && val <= 80) return val;
      }
    } catch {
      void 0;
    }
    return 40;
  });
  const splitRatioRef = useRef(splitRatio);
  splitRatioRef.current = splitRatio;

  const syncSplitRatioVar = useCallback((ratio: number) => {
    splitRatioRef.current = ratio;
    wsContainerRef.current?.style.setProperty('--ws-split-ratio', String(ratio));
    resizerRef.current?.setAttribute('aria-valuenow', String(ratio));
    if (resizerBadgeRef.current) {
      resizerBadgeRef.current.textContent = `${ratio}%`;
    }
  }, []);

  const commitSplitRatio = useCallback(
    (ratio: number) => {
      const clamped = Math.round(Math.min(80, Math.max(20, ratio)));
      syncSplitRatioVar(clamped);
      setSplitRatio(clamped);
      try {
        window.localStorage.setItem(SPLIT_RATIO_STORAGE_KEY, String(clamped));
      } catch {
        void 0;
      }
    },
    [syncSplitRatioVar]
  );

  const handleResizerPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (wsContainerRef.current) {
      wsContainerRef.current.dataset.resizing = 'true';
    }
    event.currentTarget.classList.add('is-dragging');
  };

  const handleResizerPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const container = wsContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const railOffset = railOpen && isDesktop ? 240 : 0;
    const usableWidth = rect.width - railOffset - 10;
    if (usableWidth <= 100) return;
    const currentX = event.clientX - rect.left - railOffset;
    const nextRatio = Math.round(Math.min(80, Math.max(20, (currentX / usableWidth) * 100)));
    syncSplitRatioVar(nextRatio);
  };

  const finishResizerDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (wsContainerRef.current) {
      delete wsContainerRef.current.dataset.resizing;
    }
    event.currentTarget.classList.remove('is-dragging');
    commitSplitRatio(splitRatioRef.current);
  };

  const handleResizerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(key)) return;
    event.preventDefault();
    if (key === 'Escape') {
      commitSplitRatio(40);
      return;
    }
    if (key === 'Home') {
      commitSplitRatio(20);
      return;
    }
    if (key === 'End') {
      commitSplitRatio(80);
      return;
    }
    const delta = key === 'ArrowRight' ? 3 : -3;
    commitSplitRatio(splitRatioRef.current + delta);
  };

  const cycleSplitPresets = () => {
    const presets = [35, 50, 65, 45];
    const idx = presets.indexOf(splitRatioRef.current);
    const next = presets[(idx + 1) % presets.length];
    commitSplitRatio(next);
  };

  const diffTotals = useMemo(
    () =>
      effectiveDiffs.reduce(
        (sum, entry) => ({
          added: sum.added + entry.additions,
          removed: sum.removed + entry.deletions,
        }),
        { added: 0, removed: 0 }
      ),
    [effectiveDiffs]
  );

  const quotaBlocked = !quota.unlimited && quota.exhausted;
  const quotaLabel = quota.unlimited
    ? 'không giới hạn'
    : quota.limit === null
      ? `${quota.used} lượt`
      : `${quota.used}/${quota.limit} lượt`;

  const railInline = isDesktop && railOpen;
  const isSplitStage = isDesktop && rightMode === 'split';
  const stageDataAttr = !isDesktop ? 'open' : rightMode;
  const threadHidden = !isDesktop && (hasGeneratedArtifact || isGenerating) && mobilePane !== 'chat';
  const stageHidden = isDesktop
    ? rightMode === 'closed'
    : (!hasGeneratedArtifact && !isGenerating && !hasBuildError) || mobilePane !== 'stage';
  const checksPassLabel = effectiveChecksReport
    ? `${effectiveChecksReport.passCount}/${effectiveChecksReport.results.length} phép kiểm đạt`
    : 'Kiểm định 6 lớp';

  const sendPrompt = useCallback(
    async (text: string) => {
      const raw = text.trim();
      if (!raw || isGenerating) return;
      await sendWorkspacePrompt(`[Mode: ${agentMode}] ${raw}`, {
        model: selectedModel,
        agentMode,
        stream: true,
        systemPrompt: systemPrompt.trim() || undefined,
        temperature,
      });
    },
    [isGenerating, sendWorkspacePrompt, agentMode, selectedModel, systemPrompt, temperature]
  );

  const handleCreateSnapshot = useCallback(() => {
    if (effectiveDeletedSet.size > 0) {
      pendingSnapshotRef.current = {
        projectId: activeProject.id,
        prevTopId: activeProject.snapshots[0]?.id ?? null,
        deleted: Array.from(effectiveDeletedSet),
      };
    } else {
      pendingSnapshotRef.current = null;
    }
    createProjectSnapshot();
  }, [effectiveDeletedSet, activeProject.id, activeProject.snapshots, createProjectSnapshot]);

  const handleRestoreSnapshot = useCallback(
    (snapshotId: string) => {
      const hiddenForSnap = snapDeletedMap[snapshotId] || [];
      setDeletedPaths(hiddenForSnap);
      writeDeletedPaths(activeProject.id, hiddenForSnap);
      setLocalChecksByProject((prev) => {
        if (!(activeProject.id in prev)) return prev;
        const next = { ...prev };
        delete next[activeProject.id];
        return next;
      });
      restoreProjectSnapshot(snapshotId);
    },
    [snapDeletedMap, activeProject.id, restoreProjectSnapshot]
  );

  useEffect(() => {
    const handleShortcuts = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.altKey) return;

      if (event.key === 'Enter') {
        const active = document.activeElement;
        if (
          active &&
          dockRef.current?.contains(active) &&
          !isGenerating &&
          !quotaBlocked &&
          composerValue.trim()
        ) {
          event.preventDefault();
          const text = composerValue;
          setComposerValue('');
          void sendPrompt(text);
        }
        return;
      }

      if (event.shiftKey) return;

      const lower = event.key.toLowerCase();
      if (lower === '1' || lower === '2' || lower === '3') {
        event.preventDefault();
        const nextTab: StageTabId =
          lower === '1' ? 'preview' : lower === '2' ? 'source' : 'review';
        setStageTab(nextTab);
        if (hasGeneratedArtifact) {
          if (isDesktop) {
            setRightMode('split');
          } else {
            setMobilePane('stage');
          }
        }
        return;
      }

      if (lower === 's') {
        event.preventDefault();
        handleCreateSnapshot();
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [
    isGenerating,
    quotaBlocked,
    composerValue,
    sendPrompt,
    hasGeneratedArtifact,
    isDesktop,
    handleCreateSnapshot,
  ]);

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
      let result: { blob: Blob; filename: string; clean: boolean; findingsCount: number };
      if (effectiveDeletedSet.size === 0) {
        result = await exportActiveProjectZip(true, settings.defaultExportTarget);
      } else {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        const { clean, findings, sanitizedFiles } = sanitizeFilesForZipExport(effectiveProject.files);
        for (const file of sanitizedFiles) {
          zip.file(file.path, file.content);
        }
        const bundle = generateProjectSetupBundle(
          { ...effectiveProject, files: sanitizedFiles },
          settings.defaultExportTarget
        );
        for (const docFile of bundle.files) {
          if (!sanitizedFiles.some((file) => file.path === docFile.path)) {
            zip.file(docFile.path, docFile.content);
          }
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        const slug =
          effectiveProject.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'fforum-workspace';
        result = {
          blob,
          filename: `${slug}-v3.zip`,
          clean,
          findingsCount: findings.length,
        };
      }

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
    const nextDeleted = deletedPaths.filter(
      (path) => !incoming.some((file) => file.name === path)
    );
    if (nextDeleted.length !== deletedPaths.length) {
      setDeletedPaths(nextDeleted);
      writeDeletedPaths(activeProject.id, nextDeleted);
    }
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
    if (effectiveDeletedSet.size === 0) {
      const report = runChecksOnActiveProject();
      setLocalChecksByProject((prev) => {
        if (!(activeProject.id in prev)) return prev;
        const next = { ...prev };
        delete next[activeProject.id];
        return next;
      });
      addToast({
        type: report.overallStatus === 'fail' ? 'warning' : 'success',
        title: `Kiểm định 6 lớp: ${report.passCount}/${report.results.length} đạt`,
      });
      return;
    }

    const report = runWorkspaceChecks(visibleFiles);
    setLocalChecksByProject((prev) => ({ ...prev, [activeProject.id]: report }));
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
    setPublishTitle(effectiveProject.name);
    setPublishBody(buildPublishSummary(effectiveProject));
    setPublishTags(derivePublishTags(effectiveProject));
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
    const cleanBody = publishBody.trim() || buildPublishSummary(effectiveProject);
    const parsedTags = publishTags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    const finalTags = parsedTags.length > 0 ? parsedTags : ['html', 'css', 'ui'];
    const demoSnippet = packageDemoSnippet(effectiveProject);
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
        name: formatUserDisplayName(currentUser?.name, 'Builder Cộng đồng'),
        handle: currentUser?.username || 'builder_vn',
        role: currentUser?.role === 'admin' ? 'Điều hành' : 'Thành viên',
      },
      demoSnippet,
      answers: [],
    };

    try {
      let publishedPost = fallbackPost;
      try {
        const created = await createPost({
          channel: 'showcase',
          title: cleanTitle,
          body: cleanBody,
          category: 'Workspace Build',
          tags: finalTags,
          demoSnippet,
        });
        publishedPost = {
          ...created,
          demoSnippet: created.demoSnippet || demoSnippet,
        };
      } catch {
        publishedPost = fallbackPost;
        prependCommunityPostToLocalStorage(publishedPost);
        addToast({
          type: 'success',
          title: 'Đã lưu bản dựng cục bộ',
          message: publishedPost.title,
        });
      }

      setPublishedPostId(publishedPost.id);
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
      project={effectiveProject}
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
      onUpdateFile={handleUpdateWorkspaceFile}
      onDeleteFile={handleDeleteWorkspaceFile}
      onRunChecks={handleRunChecks}
      onExportZip={() => void handleExportZip()}
      exporting={exporting}
      onOpenPublish={openPublishModal}
      onCreateSnapshot={handleCreateSnapshot}
      onRestoreSnapshot={handleRestoreSnapshot}
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
      isGenerating={isGenerating}
      hasError={hasBuildError}
      onRetry={handleRetry}
      onNotify={addToast}
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
      data-welcome={isWelcome ? 'true' : undefined}
      data-density={settings.compactDensity ? 'compact' : 'roomy'}
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
              <IconPanelLeftClose size={16} />
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
              title="Danh sách"
              onClick={() => (isDesktop ? setRailOpen(true) : setRailSheetOpen(true))}
            >
              <IconPanelLeft size={16} />
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
                  <IconChevronDown size={14} />
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
                        Model &amp; BYOK
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
                        {activeProject.pinned ? 'Bỏ ghim' : 'Ghim phiên'}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="ws-menu-item"
                        onClick={() => {
                          handleCreateSnapshot();
                          close();
                        }}
                      >
                        Lưu mốc
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
                aria-label={rightOpen ? 'Thu gọn khung xem trước' : 'Mở khung xem trước'}
                title={rightOpen ? 'Đóng khung' : 'Mở khung'}
                onClick={() => setRightMode(rightOpen ? 'closed' : 'split')}
              >
                {rightOpen ? (
                  <IconChevronsRight size={15} />
                ) : (
                  <IconChevronsLeft size={15} />
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
          onUseStarter={(prompt) => {
            setComposerValue(prompt);
            window.requestAnimationFrame(() => {
              dockRef.current?.querySelector<HTMLInputElement>('.pcmp__input')?.focus({
                preventScroll: true,
              });
            });
          }}
          welcome={isWelcome}
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
                      <IconX size={13} />
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
                    <IconX size={15} />
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
                      <IconSparkles size={15} />
                      <span>
                        <strong>Chỉ dẫn phiên</strong>
                        <small>Áp dụng cho lượt gửi tiếp theo</small>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="ws-icon-pill ws-icon-pill--xs"
                      aria-label="Đóng chỉ dẫn phiên"
                      title="Đóng"
                      onClick={() => setStudioOpen(false)}
                    >
                      <IconX size={13} />
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
                        Đổi Model
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

              {!isWelcome && (
                <div className="ws-arena-repo-strip">
                  <div className="ws-arena-repo-pills">
                    <span className="ws-arena-repo-name" title={`Dự án: ${effectiveProject.name}`}>
                      <IconLayers size={12} />
                      <span>{effectiveProject.name}</span>
                    </span>
                    {hasGeneratedArtifact && (
                      <span className="ws-arena-branch-name" title="Số tệp mã nguồn trong phiên">
                        {effectiveProject.files.length} tệp
                      </span>
                    )}
                  </div>

                  {hasGeneratedArtifact && (
                    <div className="ws-arena-actions">
                      <button
                        type="button"
                        className="ws-arena-diff-pill"
                        onClick={handleOpenDiffStage}
                        title="Đối chiếu Diff"
                      >
                        <span className="ws-add">+{diffTotals.added}</span>
                        <span className="ws-del">−{diffTotals.removed}</span>
                        <span aria-hidden="true">›</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

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
                      aria-label="Chỉ dẫn phiên"
                      title="Chỉ dẫn"
                      onClick={() => setStudioOpen((open) => !open)}
                    >
                      <IconSparkles size={13} />
                    </button>
                    <button
                      type="button"
                      className="ws-arena-mini-icon"
                      aria-label="Cấu hình Model & BYOK"
                      title="BYOK"
                      onClick={() => setSetupDrawerOpen(true)}
                    >
                      <IconSlidersHorizontal size={13} />
                    </button>
                  </div>
                }
                placeholder={
                  isWelcome
                    ? 'Mô tả giao diện bạn muốn dựng, Enter để gửi'
                    : 'Yêu cầu chỉnh sửa tiếp theo, Enter để gửi'
                }
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
          ref={resizerRef}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={splitRatio}
          aria-valuemin={20}
          aria-valuemax={80}
          aria-label="Thay đổi kích thước chia màn hình"
          tabIndex={0}
          className="ws-resizer"
          onPointerDown={handleResizerPointerDown}
          onPointerMove={handleResizerPointerMove}
          onPointerUp={finishResizerDrag}
          onPointerCancel={finishResizerDrag}
          onKeyDown={handleResizerKeyDown}
          onDoubleClick={cycleSplitPresets}
          title="Kéo hoặc phím mũi tên đổi tỷ lệ"
        >
          <div className="ws-resizer-line" aria-hidden="true" />
          <div className="ws-resizer-handle" aria-hidden="true" />
          <div ref={resizerBadgeRef} className="ws-resizer-badge" aria-hidden="true">
            {splitRatio}%
          </div>
        </div>
      )}

      {liveStageElement(false)}

      {!isDesktop && hasGeneratedArtifact && (
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
            Live View
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
            Mã nguồn
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
            Kiểm định
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
              <IconX size={16} />
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
              <IconShare2 size={16} />
              <h2>Đăng lên Tri thức</h2>
            </div>
            <button
              type="button"
              className="ws-icon-pill"
              aria-label="Đóng hộp thoại đăng bài"
              title="Đóng"
              onClick={() => setPublishOpen(false)}
            >
              <IconX size={15} />
            </button>
          </header>

          {publishedPostId ? (
            <div className="ws-publish-done" role="status">
              <div className="ws-publish-done-row">
                <IconCheckCircle2 size={20} />
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
                  Ở lại
                </button>
                <button
                  type="button"
                  className="btn btn-red"
                  onClick={handleGoToCommunity}
                >
                  <span>Mở Tri thức</span>
                  <IconArrowUpRight size={15} />
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
                <span>{effectiveProject.files.length} tệp đính kèm</span>
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
                  {publishing ? 'Đang đăng...' : 'Đăng ngay'}
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
        project={effectiveProject}
        defaultTarget={settings.defaultExportTarget}
        onInjectFiles={(incoming) => {
          const nextDeleted = deletedPaths.filter(
            (path) => !incoming.some((file) => file.path === path)
          );
          if (nextDeleted.length !== deletedPaths.length) {
            setDeletedPaths(nextDeleted);
            writeDeletedPaths(activeProject.id, nextDeleted);
          }
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
