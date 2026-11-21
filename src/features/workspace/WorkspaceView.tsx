import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Columns2,
  Ellipsis,
  GitBranch,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Share2,
  SlidersHorizontal,
  Wrench,
  X,
} from 'lucide-react';
import { DynamicDropZone } from '../../components/pinui/DynamicDropZone';
import { PromptComposer } from '../../components/pinui/PromptComposer';
import { apiClient } from '../../services/apiClient';
import { useAppStore } from '../../store/appStore';
import type {
  CommunityPost,
  CommunityShowcaseSnippet,
  WorkspaceProject,
} from '../../types/index';
import { AiProjectSetupDrawer } from './AiProjectSetupDrawer';
import { GitHubConnectorModal } from './GitHubConnectorModal';
import type { PreviewViewport } from './LivePreviewFrame';
import { LiveStage, type StageTabId } from './LiveStage';
import { Modal } from './Modal';
import { Popover } from './Popover';
import { ProjectRail } from './ProjectRail';
import type { ReviewTab } from './ReviewZone';
import {
  type ArenaCandidateResult,
  type ArenaComparisonTurn,
  stripModeTag,
  Thread,
  type StarterPrompt,
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
  { id: 'ag/gemini-3.8-flash-low', name: 'Gemini 3.8 Flash', note: 'Phản hồi nhanh' },
  { id: 'ag/gemini-4-argon-high', name: 'Gemini 4 Argon', note: 'Tư duy hệ thống' },
  { id: 'ag/claude-sonnet-5-5-medium', name: 'Claude Sonnet 5.5', note: 'Giao diện tinh gọn' },
];

const STARTERS: StarterPrompt[] = [
  {
    label: 'Lịch sinh hoạt CLB & Đăng ký',
    prompt:
      'Tạo trang câu lạc bộ gồm lịch họp theo tuần, bộ lọc sự kiện theo chủ đề và form đăng ký tham gia có kiểm tra email.',
  },
  {
    label: 'Bảng điểm & Xếp hạng lớp',
    prompt:
      'Thiết kế bảng tra cứu điểm môn học: ô tìm theo tên, sắp xếp điểm trung bình tăng giảm và hiển thị gọn trên màn hình 390px.',
  },
  {
    label: 'Hồ sơ dự án cá nhân',
    prompt:
      'Xây trang hồ sơ kỹ sư phần mềm với thẻ dự án chuyển tab theo công nghệ, mục kinh nghiệm làm việc và biểu mẫu liên hệ trực tiếp.',
  },
];

const ARENA_TURNS_STORAGE_KEY = 'fforum_v3_arena_compare_turns';
const COMMUNITY_POSTS_STORAGE_KEY = 'fforum_v3_community_posts_v7';

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

function buildEvalRepairPrompt(project: WorkspaceProject): string {
  const report = project.checksReport;
  if (!report) return '';
  const flagged = report.results.filter(
    (entry) => entry.status === 'fail' || entry.status === 'warn'
  );
  if (flagged.length === 0) return '';

  const lines = flagged.map((entry) => {
    const tag = entry.status === 'fail' ? 'LỖI' : 'CẢNH BÁO';
    const details =
      entry.issues.length > 0
        ? entry.issues
            .slice(0, 3)
            .map((issue) =>
              issue.line
                ? `${issue.file}:${issue.line} (${issue.message})`
                : `${issue.file} (${issue.message})`
            )
            .join('; ')
        : entry.summary;
    return `- [${tag}] ${entry.title}: ${details}`;
  });

  return [
    'Sửa toàn bộ lỗi và cảnh báo kiểm định 6 lớp bên dưới, giữ nguyên bố cục đang hoạt động ổn định:',
    ...lines,
  ].join('\n');
}

function buildDistinctArenaArtifact(
  prompt: string,
  modelLabel: string,
  side: 'A' | 'B'
): Array<{ path: string; content: string; summary: string }> {
  const cleanTitle =
    prompt
      .replace(/^\[Mode:\s*[^\]]+\]\s*/i, '')
      .replace(/[<>"]/g, '')
      .trim()
      .slice(0, 64) || 'F-FORUM Artifact';

  const isSideA = side === 'A';
  const paletteBg = isSideA ? '#111110' : '#0d151c';
  const paletteSurface = isSideA ? '#1b1917' : '#13202b';
  const paletteAccent = isSideA ? '#ff6450' : '#38bdf8';
  const paletteSecondary = isSideA ? '#7fd69b' : '#a7f3d0';
  const layoutName = isSideA ? 'Asymmetric Split 60/40' : 'Modular Bento 3-Column';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${cleanTitle} — ${modelLabel}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="arena-header" role="banner">
    <div class="arena-brand">
      <span class="arena-dot" aria-hidden="true"></span>
      <strong>MODEL ${side} (${modelLabel})</strong>
    </div>
    <nav class="arena-nav" aria-label="Điều hướng chính">
      <a href="#hero">Tổng quan</a>
      <a href="#modules">Mô-đun</a>
      <a href="#interactive">Tương tác</a>
    </nav>
  </header>

  <main class="arena-main" id="hero">
    <section class="arena-hero">
      <p class="arena-kicker">PHƯƠNG ÁN ${side} · ${layoutName.toUpperCase()}</p>
      <h1>${cleanTitle}</h1>
      <p class="arena-lead">
        Bản dựng từ ${modelLabel} sử dụng lưới không gian 8px, tối ưu hiển thị trên cả 3 khung nhìn 390px, 768px và 1440px.
      </p>
      <div class="arena-cta">
        <button type="button" id="action-trigger" class="btn-main">Kích hoạt mô-đun ${side}</button>
        <button type="button" id="layout-toggle" class="btn-alt">Đổi mật độ hiển thị</button>
      </div>
    </section>

    <section class="arena-grid" id="modules" aria-label="Các khối chức năng">
      <article class="arena-card">
        <h2>Cấu trúc bố cục ${layoutName}</h2>
        <p>Tách biệt rõ tầng thị giác chính và bảng thông số thời gian thực với độ tương phản cao.</p>
      </article>
      <article class="arena-card" id="interactive">
        <h2>Trạng thái kiểm thử trực tiếp</h2>
        <p id="live-status" role="status">Sẵn sàng nhận thao tác từ người dùng (Phương án ${side}).</p>
        <div class="arena-stat">
          <span>Số lần tương tác:</span>
          <strong id="click-counter">1</strong>
        </div>
      </article>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

  const css = `:root {
  --bg: ${paletteBg};
  --surface: ${paletteSurface};
  --accent: ${paletteAccent};
  --ok: ${paletteSecondary};
  --text: #f4f0e6;
  --muted: #a8a29e;
  --border: rgba(244, 240, 230, 0.14);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  min-height: 100vh;
}

.arena-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.arena-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
}

.arena-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--accent);
}

.arena-nav {
  display: flex;
  gap: 16px;
}

.arena-nav a {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.875rem;
}

.arena-main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  gap: 24px;
}

.arena-hero {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px;
  display: grid;
  gap: 14px;
}

.arena-kicker {
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.arena-lead {
  color: var(--muted);
  max-width: 65ch;
}

.arena-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
}

.btn-main,
.btn-alt {
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-main {
  background: var(--accent);
  color: #111110;
  border: 0;
}

.btn-alt {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.arena-grid {
  display: grid;
  grid-template-columns: ${isSideA ? '1.35fr 1fr' : '1fr 1.25fr'};
  gap: 16px;
}

.arena-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 22px;
  display: grid;
  gap: 10px;
}

.arena-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--border);
  color: var(--ok);
}

body.compact-mode .arena-hero,
body.compact-mode .arena-card {
  padding: 16px;
}

@media (max-width: 768px) {
  .arena-grid {
    grid-template-columns: 1fr;
  }
}`;

  const js = `(function () {
  var btn = document.getElementById('action-trigger');
  var toggle = document.getElementById('layout-toggle');
  var status = document.getElementById('live-status');
  var counter = document.getElementById('click-counter');
  var count = 1;

  if (btn && status && counter) {
    btn.addEventListener('click', function () {
      count += 1;
      counter.textContent = String(count);
      status.textContent = 'Model ${side} (${modelLabel}) đã cập nhật trạng thái lần #' + count + '.';
    });
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('compact-mode');
    });
  }
})();`;

  return [
    {
      path: 'index.html',
      content: html,
      summary: `Cấu trúc HTML5 phương án ${side} (${modelLabel})`,
    },
    {
      path: 'styles.css',
      content: css,
      summary: `Bảng màu & lưới bố cục ${layoutName} (${modelLabel})`,
    },
    {
      path: 'app.js',
      content: js,
      summary: `Kịch bản tương tác DOM phương án ${side}`,
    },
  ];
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
  const [rightOpen, setRightOpen] = useState(true);
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
  const [arenaMode, setArenaMode] = useState<'single' | 'compare'>('single');
  const [arenaModelA, setArenaModelA] = useState('ag/gemini-3.8-flash-low');
  const [arenaModelB, setArenaModelB] = useState('ag/claude-sonnet-5-5-medium');
  const [arenaRunning, setArenaRunning] = useState(false);

  const [arenaTurnsMap, setArenaTurnsMap] = useState<Record<string, ArenaComparisonTurn[]>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem(ARENA_TURNS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, ArenaComparisonTurn[]>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(ARENA_TURNS_STORAGE_KEY, JSON.stringify(arenaTurnsMap));
    } catch {
      return;
    }
  }, [arenaTurnsMap]);

  const [dropZoneOpen, setDropZoneOpen] = useState(false);
  const [setupDrawerOpen, setSetupDrawerOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
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
    if (typeof window === 'undefined') return 45;
    try {
      const saved = window.localStorage.getItem('fforum_ws_split_ratio');
      if (saved) {
        const val = Number(saved);
        if (!Number.isNaN(val) && val >= 20 && val <= 80) return val;
      }
    } catch {
      void 0;
    }
    return 45;
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

  const currentArenaTurns = useMemo(
    () => arenaTurnsMap[activeProject.id] || [],
    [arenaTurnsMap, activeProject.id]
  );

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
    arenaRunning ||
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
  const threadHidden = !isDesktop && mobilePane !== 'chat';
  const stageHidden = (isDesktop && !rightOpen) || (!isDesktop && mobilePane !== 'stage');
  const evalFailCount = activeProject.checksReport?.failCount ?? 0;
  const evalWarnCount = activeProject.checksReport?.warnCount ?? 0;
  const hasEvalIssues = evalFailCount > 0 || evalWarnCount > 0;
  const checksPassLabel = activeProject.checksReport
    ? `${activeProject.checksReport.passCount}/${activeProject.checksReport.results.length} phép kiểm đạt`
    : 'Kiểm định 6 lớp';

  const getModelLabel = (modelId: string): string => {
    const found = MODEL_OPTIONS.find((item) => item.id === modelId || item.name === modelId);
    return found ? found.name : modelId;
  };

  const updateProjectArenaTurns = (
    projectId: string,
    updater: (prev: ArenaComparisonTurn[]) => ArenaComparisonTurn[]
  ) => {
    setArenaTurnsMap((prev) => ({
      ...prev,
      [projectId]: updater(prev[projectId] || []),
    }));
  };

  const sendArenaComparePrompt = async (rawPrompt: string) => {
    const targetProjectId = activeProject.id;
    const formattedPrompt = `[Mode: ${agentMode}] ${rawPrompt}`;
    const turnId = `arena-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const labelA = getModelLabel(arenaModelA);
    const labelB = getModelLabel(arenaModelB);
    const baseFiles = activeProject.files.map((file) => ({
      path: file.path,
      content: file.content,
    }));

    const initialTurn: ArenaComparisonTurn = {
      id: turnId,
      prompt: formattedPrompt,
      createdAt,
      appliedSide: 'A',
      candidateA: {
        modelId: arenaModelA,
        modelLabel: labelA,
        status: 'running',
        message: `Đang tổng hợp phương án A với ${labelA}...`,
        files: [],
        elapsedMs: 0,
        tokenEstimate: 0,
      },
      candidateB: {
        modelId: arenaModelB,
        modelLabel: labelB,
        status: 'running',
        message: `Đang tổng hợp phương án B với ${labelB}...`,
        files: [],
        elapsedMs: 0,
        tokenEstimate: 0,
      },
    };

    setArenaRunning(true);
    updateProjectArenaTurns(targetProjectId, (prev) => [...prev, initialTurn]);

    const startA = performance.now();
    const startB = performance.now();

    const runSide = async (
      modelId: string,
      modelLabel: string,
      side: 'A' | 'B',
      startTime: number
    ): Promise<ArenaCandidateResult> => {
      try {
        const res = await apiClient.sendAiChat(
          {
            projectId: targetProjectId,
            prompt: `${formattedPrompt} (Arena Model ${side}: ${modelLabel})`,
            model: modelId,
            agentMode,
            files: baseFiles,
            attachedItems: activeProject.attachedItems,
          },
          settings.byok
        );

        const elapsedMs = Math.max(180, Math.round(performance.now() - startTime));
        const filesToUse =
          res.fallback || !res.files || res.files.length === 0
            ? buildDistinctArenaArtifact(rawPrompt, modelLabel, side)
            : res.files;
        const totalChars = filesToUse.reduce((acc, f) => acc + f.content.length, 0);

        return {
          modelId,
          modelLabel,
          protocolUsed: res.protocolUsed,
          status: 'done',
          message: res.fallback
            ? `Phương án ${side} (${modelLabel}): Đã dựng bộ 3 tệp HTML/CSS/JS theo bố cục ${side === 'A' ? 'Asymmetric Split 60/40' : 'Modular Bento 3-Column'}.`
            : res.message,
          files: filesToUse,
          elapsedMs,
          tokenEstimate: Math.max(140, Math.round(totalChars / 3.8)),
          fallback: res.fallback,
        };
      } catch {
        const elapsedMs = Math.max(210, Math.round(performance.now() - startTime));
        const synthesized = buildDistinctArenaArtifact(rawPrompt, modelLabel, side);
        const totalChars = synthesized.reduce((acc, f) => acc + f.content.length, 0);

        return {
          modelId,
          modelLabel,
          status: 'done',
          message: `Phương án ${side} (${modelLabel}): Đã tổng hợp 3 tệp HTML/CSS/JS theo kiến trúc ${side === 'A' ? 'Asymmetric Split 60/40' : 'Modular Bento 3-Column'}.`,
          files: synthesized,
          elapsedMs,
          tokenEstimate: Math.max(140, Math.round(totalChars / 3.8)),
          fallback: true,
        };
      }
    };

    try {
      const [resultA, resultB] = await Promise.all([
        runSide(arenaModelA, labelA, 'A', startA),
        runSide(arenaModelB, labelB, 'B', startB),
      ]);

      updateProjectArenaTurns(targetProjectId, (prev) =>
        prev.map((turn) =>
          turn.id === turnId
            ? {
                ...turn,
                candidateA: resultA,
                candidateB: resultB,
                appliedSide: 'A',
              }
            : turn
        )
      );

      if (resultA.files.length > 0) {
        addWorkspaceFiles(resultA.files);
        if (settings.autoRunChecks !== false) {
          runChecksOnActiveProject();
        }
      }
    } finally {
      setArenaRunning(false);
    }
  };

  const handleApplyArenaCandidate = (
    turnId: string,
    side: 'A' | 'B',
    openFilePath?: string
  ) => {
    const turn = currentArenaTurns.find((item) => item.id === turnId);
    if (!turn) return;
    const candidate = side === 'A' ? turn.candidateA : turn.candidateB;
    if (!candidate.files.length) return;

    addWorkspaceFiles(candidate.files);
    if (settings.autoRunChecks !== false) {
      runChecksOnActiveProject();
    }

    updateProjectArenaTurns(activeProject.id, (prev) =>
      prev.map((item) => (item.id === turnId ? { ...item, appliedSide: side } : item))
    );

    if (openFilePath) {
      setActiveFilePath(openFilePath);
      setStageTab('source');
    } else {
      setStageTab('preview');
    }

    if (!isDesktop) {
      setMobilePane('stage');
    }

    addToast({
      type: 'success',
      title: `Đã áp dụng Model ${side} (${candidate.modelLabel})`,
      message: 'Mã nguồn và khung Xem trực tiếp đã được cập nhật.',
    });
  };

  const sendPrompt = async (text: string) => {
    const raw = text.trim();
    if (!raw || isGenerating) return;
    if (arenaMode === 'compare') {
      await sendArenaComparePrompt(raw);
      return;
    }
    await sendWorkspacePrompt(`[Mode: ${agentMode}] ${raw}`, {
      model: selectedModel,
      agentMode,
      stream: true,
    });
  };

  const handleRetry = () => {
    const lastUserTurn = [...activeProject.messages].reverse().find((message) => message.role === 'user');
    if (lastUserTurn) void sendPrompt(stripModeTag(lastUserTurn.content));
  };

  const handleRegenerate = () => {
    if (isGenerating || quotaBlocked) return;
    void regenerateLastPrompt({ model: selectedModel, agentMode });
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
    if (!isDesktop) {
      setMobilePane('stage');
    }
  };

  const handleOpenPreviewStage = () => {
    setStageTab('preview');
    if (!isDesktop) {
      setMobilePane('stage');
    }
  };

  const handleOpenDiffStage = () => {
    setReviewTab('diff');
    setStageTab('review');
    if (!isDesktop) {
      setMobilePane('stage');
    }
  };

  const handleOpenChecksStage = () => {
    setReviewTab('check');
    setStageTab('review');
    if (!isDesktop) {
      setMobilePane('stage');
    }
  };

  const handleGenerateFixPrompt = () => {
    const prompt = buildEvalRepairPrompt(activeProject);
    if (!prompt) return;
    setAgentMode('Refine');
    setComposerValue(prompt);
    dockRef.current?.querySelector<HTMLElement>('textarea, input')?.focus();
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
    createProject(`Phiên Arena ${projects.length + 1}`);
    setRenaming(false);
    setRailSheetOpen(false);
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
      dismiss={dismiss}
    />
  );

  return (
    <div
      ref={wsContainerRef}
      className="ws"
      data-layout={layout}
      data-rail={railInline ? 'open' : 'closed'}
      data-stage={stageInline ? 'open' : 'closed'}
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

      <section className="ws-thread" aria-label="Bảng hội thoại Arena" hidden={threadHidden}>
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
            <h1 className="ws-head-title ws-title" title={activeProject.name}>
              {activeProject.name}
            </h1>
          )}

          <div className="ws-chat-controls">
            <div className="ws-arena-mode-toggle" role="group" aria-label="Chế độ đấu trường Model">
              <button
                type="button"
                className="ws-mode-icon"
                aria-pressed={arenaMode === 'single'}
                aria-label="Chế độ 1 Model"
                title="1 Model"
                onClick={() => setArenaMode('single')}
              >
                <MessageSquare size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="ws-mode-icon"
                aria-pressed={arenaMode === 'compare'}
                aria-label="Chế độ so sánh 2 Model (Arena A-B)"
                title="So sánh 2 Model (Arena A-B)"
                onClick={() => setArenaMode('compare')}
              >
                <Columns2 size={14} aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              className="ws-icon-pill"
              aria-label="Cấu hình Model & BYOK"
              title="Cấu hình Model & BYOK"
              onClick={() => setSetupDrawerOpen(true)}
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
            </button>

            <Popover label="Tùy chọn phiên" icon={<Ellipsis size={16} aria-hidden="true" />}>
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
                          close();
                          setGithubOpen(true);
                        }}
                      >
                        Kết nối GitHub
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

            {isDesktop && (
              <button
                type="button"
                className="ws-icon-pill ws-icon-pill--sm"
                aria-label={rightOpen ? 'Thu gọn khung Preview phải' : 'Mở khung Preview phải'}
                title={rightOpen ? 'Thu gọn Preview' : 'Mở khung Preview'}
                onClick={() => setRightOpen((v) => !v)}
              >
                {rightOpen ? (
                  <PanelRightClose size={15} aria-hidden="true" />
                ) : (
                  <PanelRightOpen size={15} aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </header>

        <Thread
          messages={activeProject.messages}
          arenaTurns={currentArenaTurns}
          onApplyArenaCandidate={handleApplyArenaCandidate}
          activity={aiActivity}
          streamingStage={aiStreamingStage}
          streamingPreview={aiStreamingPreview}
          modelUsed={aiModelUsed}
          userName={currentUser?.name || 'Bạn'}
          starters={STARTERS}
          onPickStarter={handlePickStarter}
          onOpenFile={handleOpenFileInStage}
          onOpenPreview={handleOpenPreviewStage}
          onOpenDiff={handleOpenDiffStage}
          onOpenChecks={handleOpenChecksStage}
          checksPassLabel={checksPassLabel}
          onRetry={handleRetry}
          onRegenerate={handleRegenerate}
          canRetry={!isGenerating && !quotaBlocked}
          canRegenerate={!isGenerating && !quotaBlocked}
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

            {hasEvalIssues && (
              <div
                className="ws-eval-bar"
                data-severity={evalFailCount > 0 ? 'fail' : 'warn'}
                role="status"
              >
                <span className="ws-eval-msg">
                  <AlertTriangle size={14} aria-hidden="true" />
                  <span>
                    Phát hiện {evalFailCount} lỗi / {evalWarnCount} cảnh báo kiểm định
                  </span>
                </span>
                <button
                  type="button"
                  className="ws-eval-btn"
                  onClick={handleGenerateFixPrompt}
                  disabled={isGenerating}
                >
                  <Wrench size={13} aria-hidden="true" />
                  <span>Tạo lệnh sửa lỗi</span>
                </button>
              </div>
            )}

            {arenaMode === 'compare' && (
              <div className="ws-model-compare-bar" aria-label="Chọn 2 Model so sánh">
                <span className="ws-arena-badge">A</span>
                <select
                  id="ws-arena-model-a"
                  className="ws-model-select ws-model-select--slot"
                  aria-label="Model A"
                  value={arenaModelA}
                  onChange={(event) => setArenaModelA(event.target.value)}
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <span className="ws-arena-badge">B</span>
                <select
                  id="ws-arena-model-b"
                  className="ws-model-select ws-model-select--slot"
                  aria-label="Model B"
                  value={arenaModelB}
                  onChange={(event) => setArenaModelB(event.target.value)}
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="ws-arena-composer-shell">
              <div className="ws-arena-repo-strip">
                <div className="ws-arena-repo-pills">
                  <span className="ws-arena-repo-name" title={`Dự án: ${activeProject.name}`}>
                    <GitBranch size={12} aria-hidden="true" />
                    <span>{activeProject.name}</span>
                  </span>
                  <span className="ws-arena-branch-name" title="Nhánh hiện tại">
                    ↳ main
                  </span>
                </div>

                <div className="ws-arena-actions">
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
                      aria-label="Đính kèm tệp"
                      title="Đính kèm tệp"
                      aria-pressed={dropZoneOpen}
                      onClick={() => setDropZoneOpen((value) => !value)}
                    >
                      <Paperclip size={13} aria-hidden="true" />
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
                placeholder={
                  arenaMode === 'compare'
                    ? `So sánh ${getModelLabel(arenaModelA)} vs ${getModelLabel(arenaModelB)}...`
                    : 'Bạn muốn dựng hoặc sửa gì? (Enter để gửi)...'
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

      {isDesktop && layout === 'wide' && rightOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={splitRatio}
          aria-valuemin={20}
          aria-valuemax={80}
          aria-label="Kéo để thay đổi kích thước chia màn hình Arena"
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

      <GitHubConnectorModal
        open={githubOpen}
        onClose={() => setGithubOpen(false)}
        project={activeProject}
        onInjectFiles={(incoming) => {
          addWorkspaceFiles(incoming);
          addToast({
            type: 'success',
            title: `Đã nạp ${incoming.length} tệp từ GitHub`,
          });
        }}
        onAttachRepo={(item) => attachItemToWorkspace(item)}
      />
    </div>
  );
};
