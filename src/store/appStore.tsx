import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import sourceCatalogJson from '../data/sourceCatalog.json';
import resourceLibraryJson from '../data/resourceLibrary.json';
import communitySeedJson from '../data/communitySeed.json';
import type {
  AIActivityState,
  AIStreamingStage,
  AppRoute,
  AttachedContextItem,
  BYOKConfig,
  ChecksReport,
  ClubHandoverDossier,
  CommunityAuthor,
  CommunityChannelsData,
  CommunityPost,
  DimensionView,
  ProcessItem,
  ProjectSetupTarget,
  QuotaState,
  ResourceItem,
  SettingsState,
  SourceCatalogItem,
  ThemeEffect,
  ThemeMode,
  ToastItem,
  User,
  WallpaperPreset,
  WorkspaceFile,
  WorkspaceProject,
} from '../types/index';
import { apiClient, getOrCreateClientGuestId } from '../services/apiClient';
import { writeThemeToDom } from '../components/layout/theme-transition';
import { runWorkspaceChecks } from '../services/checksRunner';
import { computeWorkspaceDiffs } from '../services/diffEngine';
import { generateProjectSetupBundle } from '../services/projectSetupGenerator';
import { sanitizeFilesForZipExport } from '../services/secretScanner';

const STORAGE_PROJECTS_KEY = 'fforum_v3_workspace_projects';
const STORAGE_ACTIVE_PROJECT_KEY = 'fforum_v3_active_project_id';
const STORAGE_SETTINGS_KEY = 'fforum_v3_settings';
const STORAGE_SAVED_ITEMS_KEY = 'fforum_v3_saved_items';
const STORAGE_LIKED_ITEMS_KEY = 'fforum_v3_liked_items';

function baseHeartCount(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 10 + ((h >>> 0) % 91);
}

function detectSystemTheme(): ThemeMode {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'dark',
  themePreference: 'system',
  ambientVideo: true,
  wallpaperPreset: 'ember',
  autoRunChecks: true,
  defaultViewport: 1440,
  themeEffect: 'droplet',
  reducedMotion: false,
  compactDensity: false,
  defaultExportTarget: 'antigravity',
  byok: {
    enabled: false,
    protocol: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    model: 'studio-smart-route',
    apiKey: '',
  },
};

function applyThemeToDom(
  theme: ThemeMode,
  reducedMotion?: boolean,
  ambientVideo?: boolean,
  compactDensity?: boolean,
  wallpaperPreset?: WallpaperPreset,
  themeEffect?: ThemeEffect
): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-ambient', ambientVideo === false ? 'off' : 'on');
    root.setAttribute('data-wallpaper', wallpaperPreset || 'ember');
    root.setAttribute('data-effect', themeEffect || 'droplet');
    root.setAttribute('data-density', compactDensity ? 'compact' : 'roomy');
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.style.colorScheme = theme;
    if (typeof reducedMotion === 'boolean') {
      root.classList.toggle('reduce-motion', reducedMotion);
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#121110' : '#f4f0e6');
    }
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('fforum_theme', theme);
    } catch {
      return;
    }
  }
}

const DEFAULT_QUOTA: QuotaState = {
  subjectId: 'guest:local',
  subjectType: 'guest',
  used: 0,
  limit: 15,
  remaining: 15,
  unlimited: false,
  exhausted: false,
  updatedAt: new Date().toISOString(),
};

function createStarterFiles(): WorkspaceFile[] {
  const now = new Date().toISOString();
  return [
    {
      path: 'index.html',
      language: 'html',
      summary: 'Semantic HTML5 entry document with accessible landmarks',
      updatedAt: now,
      content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>F-FORUM v3 Workspace Artifact</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="site-header" role="banner">
    <div class="brand-title">F-FORUM WORKSPACE</div>
    <nav class="site-nav" aria-label="Main">
      <a href="#stage">Stage</a>
      <a href="#metrics">Metrics</a>
    </nav>
  </header>
  <main class="stage-container" id="stage">
    <section class="hero-card">
      <p class="kicker">OBSIDIAN FOUNDRY TOKENS</p>
      <h1>Spatial Interface Workbench</h1>
      <p class="subtitle">Multi-file sandboxed preview with real-time DOM checks, line diffs, and secret-scanned ZIP export.</p>
      <div class="cta-row">
        <button type="button" id="inspect-btn" class="btn-primary">Verify Runtime State</button>
      </div>
    </section>
    <section class="metrics-strip" id="metrics" aria-label="System Metrics">
      <div class="metric-tile">
        <span class="metric-label">Grid Base</span>
        <strong class="metric-val">8px Spatial</strong>
      </div>
      <div class="metric-tile">
        <span class="metric-label">Status</span>
        <strong class="metric-val" id="runtime-readout">Verified Ready</strong>
      </div>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
    },
    {
      path: 'styles.css',
      language: 'css',
      summary: 'Obsidian Foundry & Editorial Stone token styles',
      updatedAt: now,
      content: `:root {
  --bg: #0b0d12;
  --surface: #12161f;
  --border: rgba(255, 255, 255, 0.1);
  --text: #f1f5f9;
  --muted: #94a3b8;
  --accent: #f59e0b;
  --emerald: #10b981;
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

.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
}

.brand-title {
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.06em;
}

.site-nav {
  display: flex;
  gap: 16px;
}

.site-nav a {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.875rem;
}

.stage-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kicker {
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.subtitle {
  color: var(--muted);
  max-width: 62ch;
}

.btn-primary {
  background: var(--accent);
  color: #0b0d12;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-weight: 600;
  cursor: pointer;
}

.metrics-strip {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.metric-tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  color: var(--muted);
  font-size: 0.75rem;
}

.metric-val {
  color: var(--emerald);
  font-size: 1.125rem;
}

@media (max-width: 640px) {
  .metrics-strip {
    grid-template-columns: 1fr;
  }
}`,
    },
    {
      path: 'app.js',
      language: 'javascript',
      summary: 'Interactive runtime diagnostic script',
      updatedAt: now,
      content: `(function () {
  var btn = document.getElementById('inspect-btn');
  var readout = document.getElementById('runtime-readout');
  var clicks = 0;
  if (btn && readout) {
    btn.addEventListener('click', function () {
      clicks += 1;
      readout.textContent = 'Verified Check #' + clicks;
    });
  }
})();`,
    },
  ];
}

function createInitialProject(
  name = 'Obsidian Spatial Workbench',
  description = 'Starter multi-file project with 8px token rhythm and live preview.'
): WorkspaceProject {
  const now = new Date().toISOString();
  const starterFiles = createStarterFiles();
  const initialChecks = runWorkspaceChecks(starterFiles);
  const initialDiffs = computeWorkspaceDiffs(starterFiles, starterFiles);

  return {
    id: `proj-${Math.random().toString(36).slice(2, 9)}`,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    activeFilePath: 'index.html',
    files: starterFiles,
    previousFiles: starterFiles,
    snapshots: [
      {
        id: 'snap-initial',
        label: 'Initial Baseline',
        createdAt: now,
        files: starterFiles,
      },
    ],
    messages: [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content:
          'Workspace đã sẵn sàng. Nhập yêu cầu thiết kế hoặc đính kèm mẫu từ Explore để tổng hợp mã nguồn HTML/CSS/JS và chạy kiểm định tự động.',
        createdAt: now,
        changedFiles: ['index.html', 'styles.css', 'app.js'],
      },
    ],
    attachedItems: [],
    diffs: initialDiffs,
    checksReport: initialChecks,
    processes: [
      {
        id: 'proc-init',
        name: 'Workspace Initialized & Static Checks Passed',
        kind: 'static_checks',
        status: 'completed',
        startedAt: now,
        completedAt: now,
        detail: `${initialChecks.passCount}/${initialChecks.results.length} checks passed`,
      },
    ],
  };
}

const PROJECT_SYNC_DEBOUNCE_MS = 900;

function isUntouchedStarter(project: WorkspaceProject): boolean {
  return project.createdAt === project.updatedAt && project.attachedItems.length === 0;
}

function mergeRemoteProjects(
  local: WorkspaceProject[],
  remote: WorkspaceProject[]
): WorkspaceProject[] {
  if (remote.length === 0) return local;
  const localById = new Map(local.map((p) => [p.id, p]));
  const merged = remote.map((remoteProject) => {
    const localProject = localById.get(remoteProject.id);
    if (!localProject) return remoteProject;
    return Date.parse(localProject.updatedAt) > Date.parse(remoteProject.updatedAt)
      ? localProject
      : remoteProject;
  });
  const remoteIds = new Set(remote.map((p) => p.id));
  const localOnly = local.filter((p) => !remoteIds.has(p.id));
  const keptLocal =
    localOnly.length === 1 && local.length === 1 && isUntouchedStarter(localOnly[0])
      ? []
      : localOnly;
  return [...merged, ...keptLocal];
}

function parseRouteFromPathname(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return 'landing';
  if (clean === '/home') return 'home';
  if (clean === '/explore/experience') return 'experience';
  if (clean === '/explore') return 'explore';
  if (clean === '/workspace') return 'workspace';
  if (clean === '/community') return 'community';
  if (clean === '/profile') return 'profile';
  if (clean === '/settings') return 'settings';
  if (clean === '/admin') return 'admin';
  return 'not-found';
}

function parseExperienceItemFromSearch(search: string): string | null {
  if (!search) return null;
  try {
    const params = new URLSearchParams(search);
    const val = params.get('item');
    return val ? val.trim() : null;
  } catch {
    return null;
  }
}

function routeToPathname(route: AppRoute): string {
  if (route === 'landing') return '/';
  if (route === 'experience') return '/explore/experience';
  if (route === 'not-found') return '/404';
  return `/${route}`;
}

function normalizeRouteTarget(target: AppRoute | DimensionView): AppRoute {
  if (
    target === 'landing' ||
    target === 'home' ||
    target === 'explore' ||
    target === 'experience' ||
    target === 'workspace' ||
    target === 'community' ||
    target === 'profile' ||
    target === 'settings' ||
    target === 'admin' ||
    target === 'not-found'
  ) {
    return target;
  }
  if (target === 'clubs' || target === 'qa' || target === 'threads' || target === 'chat') {
    return 'community';
  }
  if (target === 'exam-vault' || target === 'exam-viewer' || target === 'memory' || target === 'chronicles') {
    return 'explore';
  }
  return 'home';
}

function buildFallbackSeedChannels(): CommunityChannelsData {
  const raw = (communitySeedJson as { channels?: Record<string, Array<Record<string, unknown>>> }).channels || {};
  const mapChannel = (items: Array<Record<string, unknown>> | undefined, channel: 'qa' | 'showcase' | 'drops' | 'clubs'): CommunityPost[] =>
    (items || []).map((item, idx) => ({
      id: String(item.id || `${channel}-${idx}`),
      channel,
      title: String(item.title || item.name || 'Community Post'),
      author: (item.author as CommunityPost['author']) || {
        id: 'seed-author',
        name: String(item.lead || 'Core Architect'),
        handle: String(item.slug || 'architect'),
        role: 'Thành viên',
      },
      category: String(item.category || channel.toUpperCase()),
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [channel],
      createdAt: String(item.createdAt || '2026-11-18T10:00:00Z'),
      votes: typeof item.votes === 'number' ? item.votes : typeof item.likes === 'number' ? item.likes : 0,
      body: typeof item.body === 'string' ? item.body : typeof item.description === 'string' ? item.description : '',
      description: typeof item.description === 'string' ? item.description : typeof item.body === 'string' ? item.body : '',
      answersCount: typeof item.answersCount === 'number' ? item.answersCount : item.acceptedAnswer ? 1 : 0,
      isAccepted: Boolean(item.isAccepted || item.acceptedAnswer),
      acceptedAnswer: item.acceptedAnswer as CommunityPost['acceptedAnswer'],
      answers: item.acceptedAnswer ? [item.acceptedAnswer as NonNullable<CommunityPost['acceptedAnswer']>] : [],
      likes: typeof item.likes === 'number' ? item.likes : 0,
      views: typeof item.views === 'number' ? item.views : 40,
      demoSnippet: item.demoSnippet as CommunityPost['demoSnippet'],
      forks: typeof item.forks === 'number' ? item.forks : 0,
      fileType: typeof item.fileType === 'string' ? item.fileType : undefined,
      payload: typeof item.payload === 'string' ? item.payload : undefined,
      name: typeof item.name === 'string' ? item.name : undefined,
      slug: typeof item.slug === 'string' ? item.slug : undefined,
      lead: typeof item.lead === 'string' ? item.lead : undefined,
      membersCount: typeof item.membersCount === 'number' ? item.membersCount : undefined,
      activeDossier: item.activeDossier as CommunityPost['activeDossier'],
    }));

  return {
    qa: mapChannel(raw.qa, 'qa'),
    showcase: mapChannel(raw.showcase, 'showcase'),
    drops: mapChannel(raw.drops, 'drops'),
    clubs: mapChannel(raw.clubs, 'clubs'),
  };
}

export interface AppStoreContextValue {
  currentRoute: AppRoute;
  navigate: (route: AppRoute | DimensionView) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  sourceCatalog: SourceCatalogItem[];
  resourceLibrary: ResourceItem[];
  savedItemIds: string[];
  toggleSavedItem: (id: string) => void;
  likedItemIds: string[];
  toggleLikedItem: (id: string) => void;
  isItemLiked: (id: string) => boolean;
  getHeartCount: (id: string) => number;
  experienceItemId: string | null;
  setExperienceItemId: (id: string | null) => void;
  openExperience: (itemId: string) => void;
  projects: WorkspaceProject[];
  activeProjectId: string;
  activeProject: WorkspaceProject;
  createProject: (
    name: string,
    description?: string,
    initialAttached?: AttachedContextItem[]
  ) => WorkspaceProject;
  selectProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
  togglePinProject: (projectId: string) => void;
  toggleArchiveProject: (projectId: string) => void;
  setActiveFilePath: (filePath: string) => void;
  updateWorkspaceFile: (filePath: string, content: string) => void;
  addWorkspaceFiles: (files: Array<{ path: string; content: string; summary?: string }>) => void;
  attachItemToWorkspace: (item: AttachedContextItem, navigateToWorkspace?: boolean) => void;
  openInWorkspace: (item: AttachedContextItem) => void;
  detachItemFromWorkspace: (itemId: string) => void;
  launchPromptToWorkspace: (
    prompt: string,
    attached?: AttachedContextItem[],
    options?: { model?: string }
  ) => Promise<void>;
  sendWorkspacePrompt: (
    prompt: string,
    options?: { model?: string; agentMode?: string; attachedItems?: AttachedContextItem[]; stream?: boolean }
  ) => Promise<void>;
  regenerateLastPrompt: (options?: { model?: string; agentMode?: string }) => Promise<void>;
  runChecksOnActiveProject: () => ChecksReport;
  createProjectSnapshot: (label?: string) => void;
  restoreProjectSnapshot: (snapshotId: string) => void;
  exportActiveProjectZip: (
    includeSetupBundle?: boolean,
    target?: ProjectSetupTarget
  ) => Promise<{ blob: Blob; filename: string; clean: boolean; findingsCount: number }>;
  aiActivity: AIActivityState;
  setAiActivity: (state: AIActivityState) => void;
  aiStreamingStage: AIStreamingStage;
  aiStreamingPreview: string;
  aiModelUsed: string | null;
  currentUser: User | null;
  quota: QuotaState;
  refreshAuthAndQuota: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<User>;
  loginAdmin: (username: string, password: string) => Promise<User>;
  register: (input: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  communityChannels: CommunityChannelsData;
  communityPosts: CommunityPost[];
  refreshCommunity: () => Promise<void>;
  createPost: (
    input: Parameters<typeof apiClient.createCommunityPost>[0]
  ) => Promise<CommunityPost>;
  upvotePost: (postId: string) => Promise<void>;
  answerPost: (postId: string, content: string) => Promise<void>;
  acceptAnswer: (postId: string, answerId: string) => Promise<void>;
  forkPostToWorkspace: (post: CommunityPost) => void;
  updateDossier: (clubId: string, dossier: ClubHandoverDossier) => Promise<void>;
  reportPost: (targetId: string, reason: string) => Promise<void>;
  settings: SettingsState;
  updateSettings: (partial: Partial<SettingsState>) => void;
  updateByok: (partial: Partial<BYOKConfig>) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  themeEffect: ThemeEffect;
  setThemeEffect: (effect: ThemeEffect) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  toasts: ToastItem[];
  addToast: (toast: { type?: ToastItem['type']; title: string; message?: string }) => void;
  dismissToast: (id: string) => void;
  viewingProfileUser: CommunityAuthor | null;
  openUserProfile: (author: CommunityAuthor) => void;
  clearViewingProfileUser: () => void;
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? parseRouteFromPathname(window.location.pathname) : 'landing'
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const sourceCatalog = useMemo(
    () => (sourceCatalogJson as unknown as SourceCatalogItem[]) || [],
    []
  );
  const resourceLibrary = useMemo(
    () => (resourceLibraryJson as unknown as ResourceItem[]) || [],
    []
  );

  const [savedItemIds, setSavedItemIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_SAVED_ITEMS_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [likedItemIds, setLikedItemIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_LIKED_ITEMS_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [experienceItemId, setExperienceItemId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? parseExperienceItemFromSearch(window.location.search) : null
  );

  const [settings, setSettings] = useState<SettingsState>(() => {
    const sysTheme = detectSystemTheme();
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS, theme: sysTheme };
    let legacyTheme: ThemeMode | null = null;
    try {
      const legacyRaw = window.localStorage.getItem('fforum_theme');
      if (legacyRaw === 'light' || legacyRaw === 'dark') {
        legacyTheme = legacyRaw;
      }
    } catch {
      legacyTheme = null;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (!raw) {
        return {
          ...DEFAULT_SETTINGS,
          theme: legacyTheme ?? sysTheme,
          themePreference: legacyTheme ?? 'system',
        };
      }
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      const resolvedPref =
        parsed.themePreference === 'light' ||
        parsed.themePreference === 'dark' ||
        parsed.themePreference === 'system'
          ? parsed.themePreference
          : parsed.theme === 'light' || parsed.theme === 'dark'
            ? parsed.theme
            : legacyTheme ?? 'system';
      const resolvedTheme: ThemeMode =
        resolvedPref === 'system'
          ? sysTheme
          : resolvedPref === 'light' || resolvedPref === 'dark'
            ? resolvedPref
            : parsed.theme === 'light' || parsed.theme === 'dark'
              ? parsed.theme
              : sysTheme;
      const resolvedEffect: ThemeEffect =
        parsed.themeEffect === 'droplet' ||
        parsed.themeEffect === 'rain' ||
        parsed.themeEffect === 'diwali' ||
        parsed.themeEffect === 'none'
          ? parsed.themeEffect
          : 'droplet';
      const resolvedWallpaper: WallpaperPreset =
        parsed.wallpaperPreset === 'auto' ||
        parsed.wallpaperPreset === 'dark' ||
        parsed.wallpaperPreset === 'light' ||
        parsed.wallpaperPreset === 'ember' ||
        parsed.wallpaperPreset === 'harbour' ||
        parsed.wallpaperPreset === 'aurora' ||
        parsed.wallpaperPreset === 'constellation' ||
        parsed.wallpaperPreset === 'indigo'
          ? parsed.wallpaperPreset
          : 'ember';
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        theme: resolvedTheme,
        themePreference: resolvedPref,
        themeEffect: resolvedEffect,
        wallpaperPreset: resolvedWallpaper,
        byok: {
          ...DEFAULT_SETTINGS.byok,
          ...(parsed.byok || {}),
        },
      };
    } catch {
      return {
        ...DEFAULT_SETTINGS,
        theme: legacyTheme ?? sysTheme,
        themePreference: legacyTheme ?? 'system',
      };
    }
  });

  const [projects, setProjects] = useState<WorkspaceProject[]>(() => {
    if (typeof window === 'undefined') return [createInitialProject()];
    try {
      const raw = window.localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (!raw) return [createInitialProject()];
      const parsed = JSON.parse(raw) as WorkspaceProject[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [createInitialProject()];
    } catch {
      return [createInitialProject()];
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem(STORAGE_ACTIVE_PROJECT_KEY) || '';
    } catch {
      return '';
    }
  });

  const [aiActivity, setAiActivity] = useState<AIActivityState>('idle');
  const [aiStreamingStage, setAiStreamingStage] = useState<AIStreamingStage>('idle');
  const [aiStreamingPreview, setAiStreamingPreview] = useState<string>('');
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [quota, setQuota] = useState<QuotaState>(() => ({
    ...DEFAULT_QUOTA,
    subjectId: `guest:${getOrCreateClientGuestId()}`,
  }));

  const [communityChannels, setCommunityChannels] = useState<CommunityChannelsData>(() =>
    buildFallbackSeedChannels()
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const syncedProjectsRef = useRef<Map<string, WorkspaceProject>>(new Map());
  const hydratedUserIdRef = useRef<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  const activeProject = useMemo(() => {
    const found = projects.find((p) => p.id === activeProjectId);
    return found || projects[0] || createInitialProject();
  }, [projects, activeProjectId]);

  const activeProjectRef = useRef(activeProject);
  activeProjectRef.current = activeProject;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const communityPosts = useMemo(
    () => [
      ...communityChannels.qa,
      ...communityChannels.showcase,
      ...communityChannels.drops,
      ...communityChannels.clubs,
    ],
    [communityChannels]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      setCurrentRoute(parseRouteFromPathname(window.location.pathname));
      setExperienceItemId(parseExperienceItemFromSearch(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    applyThemeToDom(
      settings.theme,
      settings.reducedMotion,
      settings.ambientVideo !== false,
      settings.compactDensity,
      settings.wallpaperPreset,
      settings.themeEffect
    );
  }, [
    settings.theme,
    settings.reducedMotion,
    settings.ambientVideo,
    settings.compactDensity,
    settings.wallpaperPreset,
    settings.themeEffect,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    if ((settings.themePreference ?? 'system') !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystem = () => {
      const next: ThemeMode = mq.matches ? 'dark' : 'light';
      setSettings((prev) => (prev.theme === next ? prev : { ...prev, theme: next }));
    };
    mq.addEventListener('change', syncSystem);
    return () => mq.removeEventListener('change', syncSystem);
  }, [settings.themePreference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_SETTINGS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as Partial<SettingsState>;
          if (parsed.theme === 'light' || parsed.theme === 'dark') {
            setSettings((prev) => ({
              ...prev,
              ...parsed,
              theme: parsed.theme as ThemeMode,
              byok: {
                ...prev.byok,
                ...(parsed.byok || {}),
              },
            }));
          }
        } catch {
          return;
        }
      } else if (e.key === 'fforum_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        const nextTheme = e.newValue;
        setSettings((prev) => (prev.theme === nextTheme ? prev : { ...prev, theme: nextTheme }));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      return;
    }
  }, [settings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_SAVED_ITEMS_KEY, JSON.stringify(savedItemIds));
    } catch {
      return;
    }
  }, [savedItemIds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_LIKED_ITEMS_KEY, JSON.stringify(likedItemIds));
    } catch {
      return;
    }
  }, [likedItemIds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
      window.localStorage.setItem(STORAGE_ACTIVE_PROJECT_KEY, activeProject.id);
    } catch {
      return;
    }
  }, [projects, activeProject.id]);

  const addToast = useCallback(
    (input: { type?: ToastItem['type']; title: string; message?: string }) => {
      const item: ToastItem = {
        id: `toast-${Math.random().toString(36).slice(2, 9)}`,
        type: input.type || 'info',
        title: input.title,
        message: input.message,
        createdAt: Date.now(),
      };
      setToasts((prev) => [item, ...prev].slice(0, 5));
    },
    []
  );

  const [viewingProfileUser, setViewingProfileUser] = useState<CommunityAuthor | null>(null);

  const openUserProfile = useCallback((author: CommunityAuthor) => {
    setViewingProfileUser(author);
    setCurrentRoute('profile');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/profile');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const clearViewingProfileUser = useCallback(() => {
    setViewingProfileUser(null);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = useCallback((target: AppRoute | DimensionView) => {
    const nextRoute = normalizeRouteTarget(target);
    setCurrentRoute(nextRoute);
    if (typeof window !== 'undefined') {
      const nextPath = routeToPathname(nextRoute);
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath);
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const refreshAuthAndQuota = useCallback(async () => {
    try {
      const data = await apiClient.fetchCurrentUser();
      if (data && 'user' in data) {
        setCurrentUser(data.user ?? null);
      }
      if (data?.quota && typeof data.quota.unlimited === 'boolean') {
        setQuota(data.quota);
      }
    } catch {
      return;
    }
  }, []);

  const refreshCommunity = useCallback(async () => {
    try {
      const data = await apiClient.fetchCommunityState();
      if (data && data.channels) {
        setCommunityChannels(data.channels);
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    void refreshAuthAndQuota();
    void refreshCommunity();
  }, [refreshAuthAndQuota, refreshCommunity]);

  const currentUserId = currentUser ? currentUser.id : null;

  useEffect(() => {
    syncedProjectsRef.current = new Map();
    hydratedUserIdRef.current = null;
    if (!currentUserId) return;
    let cancelled = false;
    apiClient
      .fetchUserProjects()
      .then((data) => {
        if (cancelled || !data.authenticated) return;
        const remote = Array.isArray(data.projects) ? data.projects : [];
        syncedProjectsRef.current = new Map(remote.map((p) => [p.id, p]));
        hydratedUserIdRef.current = currentUserId;
        setProjects((prev) => mergeRemoteProjects(prev, remote));
      })
      .catch(() => {
        syncedProjectsRef.current = new Map();
        hydratedUserIdRef.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || hydratedUserIdRef.current !== currentUserId) return;
    const timer = window.setTimeout(() => {
      const synced = syncedProjectsRef.current;
      for (const project of projects) {
        if (synced.get(project.id) === project) continue;
        synced.set(project.id, project);
        apiClient.syncUserProject(project).catch(() => {
          if (synced.get(project.id) === project) synced.delete(project.id);
        });
      }
    }, PROJECT_SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [projects, currentUserId]);

  const toggleSavedItem = useCallback((id: string) => {
    setSavedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleLikedItem = useCallback((id: string) => {
    setLikedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const isItemLiked = useCallback((id: string) => likedItemIds.includes(id), [likedItemIds]);

  const getHeartCount = useCallback(
    (id: string) => baseHeartCount(id) + (likedItemIds.includes(id) ? 1 : 0),
    [likedItemIds]
  );

  const openExperience = useCallback((itemId: string) => {
    setExperienceItemId(itemId);
    setCurrentRoute('experience');
    if (typeof window !== 'undefined') {
      const nextUrl = `/explore/experience?item=${encodeURIComponent(itemId)}`;
      if (window.location.pathname + window.location.search !== nextUrl) {
        window.history.pushState({}, '', nextUrl);
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const updateActiveProject = useCallback(
    (updater: (proj: WorkspaceProject) => WorkspaceProject) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProject.id ? updater(p) : p))
      );
    },
    [activeProject.id]
  );

  const createProject = useCallback(
    (
      name: string,
      description?: string,
      initialAttached: AttachedContextItem[] = []
    ): WorkspaceProject => {
      const created = createInitialProject(
        name.trim() || 'Untitled Workspace',
        description?.trim() || 'Synthesized multi-file project'
      );
      created.attachedItems = initialAttached;
      setProjects((prev) => [created, ...prev]);
      setActiveProjectId(created.id);
      return created;
    },
    []
  );

  const selectProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
  }, []);

  const deleteProject = useCallback(
    (projectId: string) => {
      setProjects((prev) => {
        const remaining = prev.filter((p) => p.id !== projectId);
        return remaining.length > 0 ? remaining : [createInitialProject()];
      });
      if (!currentUserId) return;
      syncedProjectsRef.current.delete(projectId);
      apiClient.deleteUserProject(projectId).catch(() => undefined);
    },
    [currentUserId]
  );

  const renameProject = useCallback((projectId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, name: trimmed, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  const togglePinProject = useCallback((projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, pinned: !p.pinned } : p))
    );
  }, []);

  const toggleArchiveProject = useCallback((projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, archived: !p.archived } : p))
    );
  }, []);

  const setActiveFilePath = useCallback(
    (filePath: string) => {
      updateActiveProject((proj) => ({
        ...proj,
        activeFilePath: filePath,
      }));
    },
    [updateActiveProject]
  );

  const updateWorkspaceFile = useCallback(
    (filePath: string, content: string) => {
      const now = new Date().toISOString();
      updateActiveProject((proj) => {
        const prevFiles = proj.files;
        const exists = prevFiles.some((f) => f.path === filePath);
        const language: WorkspaceFile['language'] = filePath.endsWith('.css')
          ? 'css'
          : filePath.endsWith('.js')
            ? 'javascript'
            : filePath.endsWith('.json')
              ? 'json'
              : filePath.endsWith('.md')
                ? 'markdown'
                : 'html';
        const nextFiles = exists
          ? prevFiles.map((f) => (f.path === filePath ? { ...f, content, updatedAt: now } : f))
          : [...prevFiles, { path: filePath, content, language, updatedAt: now }];
        const nextDiffs = computeWorkspaceDiffs(proj.previousFiles, nextFiles);
        const nextChecks = runWorkspaceChecks(nextFiles);
        return {
          ...proj,
          updatedAt: now,
          files: nextFiles,
          diffs: nextDiffs,
          checksReport: nextChecks,
        };
      });
    },
    [updateActiveProject]
  );

  const addWorkspaceFiles = useCallback(
    (incoming: Array<{ path: string; content: string; summary?: string }>) => {
      if (!incoming.length) return;
      const now = new Date().toISOString();
      updateActiveProject((proj) => {
        const prevFiles = proj.files;
        const map = new Map(prevFiles.map((f) => [f.path, f]));
        for (const item of incoming) {
          const cleanPath = item.path.trim();
          if (!cleanPath) continue;
          const language: WorkspaceFile['language'] = cleanPath.endsWith('.css')
            ? 'css'
            : cleanPath.endsWith('.js')
              ? 'javascript'
              : cleanPath.endsWith('.ts') || cleanPath.endsWith('.tsx')
                ? 'typescript'
                : cleanPath.endsWith('.json')
                  ? 'json'
                  : cleanPath.endsWith('.md')
                    ? 'markdown'
                    : 'html';
          map.set(cleanPath, {
            path: cleanPath,
            content: item.content,
            language,
            summary: item.summary || 'Added to workspace',
            updatedAt: now,
          });
        }
        const nextFiles = Array.from(map.values());
        const nextDiffs = computeWorkspaceDiffs(proj.previousFiles, nextFiles);
        const nextChecks = runWorkspaceChecks(nextFiles);
        const setupProc: ProcessItem = {
          id: `proc-files-${Date.now()}`,
          name: `Added ${incoming.length} file(s) to virtual tree`,
          kind: 'setup_bundle',
          status: 'completed',
          startedAt: now,
          completedAt: now,
          detail: incoming.map((i) => i.path).join(', '),
        };
        return {
          ...proj,
          updatedAt: now,
          files: nextFiles,
          diffs: nextDiffs,
          checksReport: nextChecks,
          processes: [setupProc, ...proj.processes].slice(0, 20),
        };
      });
    },
    [updateActiveProject]
  );

  const attachItemToWorkspace = useCallback(
    (item: AttachedContextItem, navigateToWorkspace = false) => {
      if (activeProject.archived) {
        const fallbackProj = projects.find((p) => !p.archived);
        if (!fallbackProj) {
          if (navigateToWorkspace) {
            createProject(item.title || 'Workspace Mới', item.summary, [item]);
            addToast({
              type: 'success',
              title: 'Đã đính kèm vào Workspace',
              message: item.title,
            });
            navigate('workspace');
          } else {
            addToast({
              type: 'warning',
              title: 'Dự án đang lưu trữ',
              message: 'Hãy bỏ lưu trữ hoặc tạo dự án mới để đính kèm.',
            });
          }
          return;
        }
        setActiveProjectId(fallbackProj.id);
        const alreadyInFallback = fallbackProj.attachedItems.some((a) => a.id === item.id);
        if (!alreadyInFallback) {
          const now = new Date().toISOString();
          setProjects((prev) =>
            prev.map((p) =>
              p.id === fallbackProj.id
                ? { ...p, updatedAt: now, attachedItems: [...p.attachedItems, item] }
                : p
            )
          );
          addToast({
            type: 'success',
            title: 'Đã đính kèm vào Workspace',
            message: item.title,
          });
        }
        if (navigateToWorkspace) {
          navigate('workspace');
        }
        return;
      }

      const already = activeProject.attachedItems.some((a) => a.id === item.id);
      if (!already) {
        updateActiveProject((proj) => {
          if (proj.attachedItems.some((a) => a.id === item.id)) return proj;
          return {
            ...proj,
            updatedAt: new Date().toISOString(),
            attachedItems: [...proj.attachedItems, item],
          };
        });
        addToast({
          type: 'success',
          title: 'Đã đính kèm vào Workspace',
          message: item.title,
        });
      }
      if (navigateToWorkspace) {
        navigate('workspace');
      }
    },
    [activeProject, projects, createProject, updateActiveProject, addToast, navigate]
  );

  const openInWorkspace = useCallback(
    (item: AttachedContextItem) => {
      attachItemToWorkspace(item, true);
    },
    [attachItemToWorkspace]
  );

  const detachItemFromWorkspace = useCallback(
    (itemId: string) => {
      updateActiveProject((proj) => ({
        ...proj,
        attachedItems: proj.attachedItems.filter((a) => a.id !== itemId),
      }));
    },
    [updateActiveProject]
  );

  const runChecksOnActiveProject = useCallback((): ChecksReport => {
    const report = runWorkspaceChecks(activeProject.files);
    const now = new Date().toISOString();
    const nextProc: ProcessItem = {
      id: `proc-chk-${Date.now()}`,
      name: 'Automated Static & DOM Checks',
      kind: 'static_checks',
      status: report.overallStatus === 'fail' ? 'failed' : 'completed',
      startedAt: now,
      completedAt: now,
      detail: `${report.passCount} pass, ${report.warnCount} warn, ${report.failCount} fail`,
    };
    updateActiveProject((proj) => ({
      ...proj,
      checksReport: report,
      processes: [nextProc, ...proj.processes].slice(0, 20),
    }));
    setAiActivity(report.overallStatus === 'fail' ? 'error' : 'verified');
    return report;
  }, [activeProject.files, updateActiveProject]);

  const sendWorkspacePrompt = useCallback(
    async (
      prompt: string,
      options?: { model?: string; agentMode?: string; attachedItems?: AttachedContextItem[]; stream?: boolean }
    ) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      const projectSnapshot = activeProjectRef.current;
      const targetProjectId = projectSnapshot.id;
      const updateTargetProject = (updater: (proj: WorkspaceProject) => WorkspaceProject) => {
        setProjects((prev) => prev.map((p) => (p.id === targetProjectId ? updater(p) : p)));
      };

      streamAbortRef.current?.abort();
      const controller = new AbortController();
      streamAbortRef.current = controller;

      const userMsgId = `msg-u-${Date.now()}`;
      const procId = `proc-ai-${Date.now()}`;
      const startedAt = new Date().toISOString();
      const runningProc: ProcessItem = {
        id: procId,
        name: `Synthesizing: ${trimmed.slice(0, 42)}`,
        kind: 'ai_generation',
        status: 'running',
        startedAt,
        detail: 'Routing multi-protocol AI Engine...',
      };

      setAiActivity('thinking');
      setAiStreamingStage('routing');
      setAiStreamingPreview('');
      if (options?.model && options.model !== 'auto') {
        setAiModelUsed(options.model);
      }

      updateTargetProject((proj) => ({
        ...proj,
        updatedAt: startedAt,
        messages: [
          ...proj.messages,
          {
            id: userMsgId,
            role: 'user',
            content: trimmed,
            createdAt: startedAt,
          },
        ],
        processes: [runningProc, ...proj.processes].slice(0, 20),
      }));

      const requestPayload = {
        projectId: targetProjectId,
        prompt: trimmed,
        model: options?.model,
        agentMode: options?.agentMode,
        files: projectSnapshot.files.map((f) => ({ path: f.path, content: f.content })),
        attachedItems: options?.attachedItems ?? projectSnapshot.attachedItems,
        history: projectSnapshot.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-6)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
      };

      try {
        const useStream = options?.stream !== false;
        const activeByok = settingsRef.current.byok;
        const response = useStream
          ? await apiClient.streamAiChat(requestPayload, activeByok, {
              signal: controller.signal,
              onStage: (ev) => {
                setAiStreamingStage(ev.stage);
                if (ev.model) setAiModelUsed(ev.model);
                if (ev.stage === 'generating') {
                  setAiActivity('streaming');
                }
              },
              onDelta: (ev) => {
                setAiActivity('streaming');
                setAiStreamingPreview((prev) => (prev + ev.text).slice(-4000));
              },
            })
          : await (() => {
              setAiActivity('streaming');
              setAiStreamingStage('generating');
              return apiClient.sendAiChat(requestPayload, activeByok);
            })();

        if (controller.signal.aborted) return;

        if (response?.quota && typeof response.quota.unlimited === 'boolean') {
          setQuota(response.quota);
        }
        setAiModelUsed(response.modelUsed || null);
        setAiStreamingStage('done');
        setAiStreamingPreview('');
        const completedAt = new Date().toISOString();

        updateTargetProject((proj) => {
          const previousFiles = proj.files;
          const updatedMap = new Map(previousFiles.map((f) => [f.path, f]));

          for (const generatedFile of response.files) {
            const lang: WorkspaceFile['language'] = generatedFile.path.endsWith('.css')
              ? 'css'
              : generatedFile.path.endsWith('.js')
                ? 'javascript'
                : generatedFile.path.endsWith('.json')
                  ? 'json'
                  : 'html';
            updatedMap.set(generatedFile.path, {
              path: generatedFile.path,
              content: generatedFile.content,
              language: lang,
              summary: generatedFile.summary,
              updatedAt: completedAt,
            });
          }

          const nextFiles = Array.from(updatedMap.values());
          const nextDiffs = computeWorkspaceDiffs(previousFiles, nextFiles);
          const nextChecks = runWorkspaceChecks(nextFiles);

          return {
            ...proj,
            updatedAt: completedAt,
            previousFiles,
            files: nextFiles,
            diffs: nextDiffs,
            checksReport: nextChecks,
            snapshots: [
              {
                id: `snap-${Date.now()}`,
                label: trimmed.slice(0, 36),
                createdAt: completedAt,
                files: nextFiles,
              },
              ...proj.snapshots,
            ].slice(0, 15),
            messages: [
              ...proj.messages,
              {
                id: `msg-a-${Date.now()}`,
                role: 'assistant',
                content: response.message,
                createdAt: completedAt,
                changedFiles: response.files.map((f) => f.path),
                fallback: response.fallback,
                upstreamError: response.upstreamError,
                modelUsed: response.modelUsed,
                protocolUsed: response.protocolUsed,
              },
            ],
            processes: proj.processes.map((p) =>
              p.id === procId
                ? {
                    ...p,
                    status: 'completed',
                    completedAt,
                    detail: `Updated ${response.files.length} files (${nextChecks.passCount}/${nextChecks.results.length} checks pass)`,
                  }
                : p
            ),
          };
        });

        setAiActivity('verified');
      } catch (err) {
        if (controller.signal.aborted) return;
        const errMsg = err instanceof Error ? err.message : 'Không thể kết nối AI Engine.';
        const failedAt = new Date().toISOString();
        setAiStreamingStage('error');
        setAiStreamingPreview('');
        setAiActivity('error');
        void refreshAuthAndQuota();

        updateTargetProject((proj) => ({
          ...proj,
          messages: [
            ...proj.messages,
            {
              id: `msg-err-${Date.now()}`,
              role: 'system',
              content: errMsg,
              createdAt: failedAt,
            },
          ],
          processes: proj.processes.map((p) =>
            p.id === procId
              ? {
                  ...p,
                  status: 'failed',
                  completedAt: failedAt,
                  detail: errMsg,
                }
              : p
          ),
        }));

        addToast({
          type: 'error',
          title: 'Yêu cầu AI bị từ chối',
          message: errMsg,
        });
      } finally {
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null;
        }
      }
    },
    [refreshAuthAndQuota, addToast]
  );

  const regenerateLastPrompt = useCallback(
    async (options?: { model?: string; agentMode?: string }) => {
      const latestProject = activeProjectRef.current;
      const lastUserTurn = [...latestProject.messages].reverse().find((m) => m.role === 'user');
      if (!lastUserTurn) return;
      const cleanContent = lastUserTurn.content.replace(/^\[Mode:\s*[^\]]+\]\s*/i, '').trim();
      const promptText = options?.agentMode
        ? `[Mode: ${options.agentMode}] ${cleanContent}`
        : lastUserTurn.content;
      await sendWorkspacePrompt(promptText, {
        model: options?.model,
        agentMode: options?.agentMode,
        stream: true,
      });
    },
    [sendWorkspacePrompt]
  );

  const launchPromptToWorkspace = useCallback(
    async (
      prompt: string,
      attached: AttachedContextItem[] = [],
      options?: { model?: string }
    ) => {
      const current = activeProjectRef.current;
      let nextAttached = current.attachedItems;
      if (attached.length > 0 && !current.archived) {
        const existingIds = new Set(current.attachedItems.map((a) => a.id));
        const additions = attached.filter((a) => !existingIds.has(a.id));
        if (additions.length > 0) {
          nextAttached = [...current.attachedItems, ...additions];
          const targetId = current.id;
          setProjects((prev) =>
            prev.map((proj) => {
              if (proj.id !== targetId) return proj;
              const ids = new Set(proj.attachedItems.map((a) => a.id));
              const added = attached.filter((a) => !ids.has(a.id));
              return added.length > 0
                ? { ...proj, attachedItems: [...proj.attachedItems, ...added] }
                : proj;
            })
          );
        }
      }
      navigate('workspace');
      await sendWorkspacePrompt(prompt, {
        attachedItems: nextAttached,
        model: options?.model,
        stream: true,
      });
    },
    [navigate, sendWorkspacePrompt]
  );

  const createProjectSnapshot = useCallback(
    (label?: string) => {
      const now = new Date().toISOString();
      updateActiveProject((proj) => ({
        ...proj,
        snapshots: [
          {
            id: `snap-${Date.now()}`,
            label: label?.trim() || `Snapshot ${proj.snapshots.length + 1}`,
            createdAt: now,
            files: proj.files,
          },
          ...proj.snapshots,
        ].slice(0, 15),
      }));
      addToast({
        type: 'success',
        title: 'Đã lưu Snapshot Workspace',
      });
    },
    [updateActiveProject, addToast]
  );

  const restoreProjectSnapshot = useCallback(
    (snapshotId: string) => {
      updateActiveProject((proj) => {
        const snap = proj.snapshots.find((s) => s.id === snapshotId);
        if (!snap) return proj;
        const nextDiffs = computeWorkspaceDiffs(proj.files, snap.files);
        const nextChecks = runWorkspaceChecks(snap.files);
        return {
          ...proj,
          updatedAt: new Date().toISOString(),
          previousFiles: proj.files,
          files: snap.files,
          diffs: nextDiffs,
          checksReport: nextChecks,
        };
      });
      addToast({
        type: 'info',
        title: 'Đã khôi phục Snapshot',
      });
    },
    [updateActiveProject, addToast]
  );

  const exportActiveProjectZip = useCallback(
    async (includeSetupBundle = true, target?: ProjectSetupTarget) => {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const { clean, findings, sanitizedFiles } = sanitizeFilesForZipExport(activeProject.files);

      for (const file of sanitizedFiles) {
        zip.file(file.path, file.content);
      }

      if (includeSetupBundle) {
        const bundle = generateProjectSetupBundle(
          { ...activeProject, files: sanitizedFiles },
          target || settings.defaultExportTarget
        );
        for (const docFile of bundle.files) {
          if (!sanitizedFiles.some((f) => f.path === docFile.path)) {
            zip.file(docFile.path, docFile.content);
          }
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const slug = activeProject.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'fforum-workspace';
      const filename = `${slug}-v3.zip`;

      const now = new Date().toISOString();
      const zipProc: ProcessItem = {
        id: `proc-zip-${Date.now()}`,
        name: `Exported ${filename}`,
        kind: 'zip_export',
        status: 'completed',
        startedAt: now,
        completedAt: now,
        detail: clean
          ? 'Secret scanner passed (0 sensitive strings)'
          : `Auto-redacted ${findings.length} secret pattern(s) before packaging`,
      };
      updateActiveProject((proj) => ({
        ...proj,
        processes: [zipProc, ...proj.processes].slice(0, 20),
      }));

      return {
        blob,
        filename,
        clean,
        findingsCount: findings.length,
      };
    },
    [activeProject, settings.defaultExportTarget, updateActiveProject]
  );

  const login = useCallback(
    async (identifier: string, password: string): Promise<User> => {
      const res = await apiClient.loginUser({ identifier, password });
      setCurrentUser(res.user);
      if (res?.quota && typeof res.quota.unlimited === 'boolean') {
        setQuota(res.quota);
      }
      setAuthModalOpen(false);
      addToast({
        type: 'success',
        title: `Xin chào, ${res.user.name}`,
        message: res.user.role === 'admin' ? 'Quyền Admin không giới hạn lượt AI' : undefined,
      });
      return res.user;
    },
    [addToast]
  );

  const loginAdmin = useCallback(
    async (username: string, password: string): Promise<User> => {
      const res = await apiClient.loginAdmin({ username, password });
      setCurrentUser(res.user);
      if (res?.quota && typeof res.quota.unlimited === 'boolean') {
        setQuota(res.quota);
      }
      setAuthModalOpen(false);
      addToast({
        type: 'success',
        title: 'Đã xác thực System Admin',
        message: 'Chế độ Unlimited AI Quota đã kích hoạt.',
      });
      return res.user;
    },
    [addToast]
  );

  const register = useCallback(
    async (input: {
      username: string;
      email: string;
      password: string;
      name?: string;
    }): Promise<User> => {
      const res = await apiClient.registerUser(input);
      setCurrentUser(res.user);
      if (res?.quota && typeof res.quota.unlimited === 'boolean') {
        setQuota(res.quota);
      }
      setAuthModalOpen(false);
      addToast({
        type: 'success',
        title: 'Đăng ký tài khoản thành công',
        message: `Chào mừng ${res.user.username} đến với F-FORUM v3.`,
      });
      return res.user;
    },
    [addToast]
  );

  const logout = useCallback(async () => {
    const res = await apiClient.logoutUser();
    setCurrentUser(null);
    if (res?.quota && typeof res.quota.unlimited === 'boolean') {
      setQuota(res.quota);
    }
    addToast({
      type: 'info',
      title: 'Đã đăng xuất phiên làm việc',
    });
  }, [addToast]);

  const createPost = useCallback(
    async (input: Parameters<typeof apiClient.createCommunityPost>[0]) => {
      const res = await apiClient.createCommunityPost(input);
      setCommunityChannels(res.channels);
      addToast({
        type: 'success',
        title: 'Đã đăng bài lên Source of Knowledge',
      });
      return res.post;
    },
    [addToast]
  );

  const upvotePost = useCallback(async (postId: string) => {
    const res = await apiClient.upvoteCommunityPost(postId);
    setCommunityChannels(res.channels);
  }, []);

  const answerPost = useCallback(
    async (postId: string, content: string) => {
      const res = await apiClient.addCommunityAnswer(postId, content);
      setCommunityChannels(res.channels);
      addToast({
        type: 'success',
        title: 'Đã gửi phản hồi kỹ thuật',
      });
    },
    [addToast]
  );

  const acceptAnswer = useCallback(
    async (postId: string, answerId: string) => {
      const res = await apiClient.acceptCommunityAnswer(postId, answerId);
      setCommunityChannels(res.channels);
      addToast({
        type: 'success',
        title: 'Đã đánh dấu Accepted Solution',
      });
    },
    [addToast]
  );

  const forkPostToWorkspace = useCallback(
    (post: CommunityPost) => {
      void apiClient.forkCommunityItem(post.id).then((res) => {
        setCommunityChannels(res.channels);
      }).catch(() => undefined);

      attachItemToWorkspace(
        {
          id: `fork-${post.id}`,
          kind: 'community-drop',
          title: post.title,
          summary: post.description || post.body || post.category,
          payload:
            post.payload ||
            (post.demoSnippet
              ? `${post.demoSnippet.html}\n<style>${post.demoSnippet.css}</style>`
              : post.body),
          tags: post.tags,
        },
        true
      );
    },
    [attachItemToWorkspace]
  );

  const updateDossier = useCallback(
    async (clubId: string, dossier: ClubHandoverDossier) => {
      const res = await apiClient.updateClubDossier(clubId, dossier);
      setCommunityChannels(res.channels);
      addToast({
        type: 'success',
        title: 'Đã cập nhật Project Continuity Dossier',
      });
    },
    [addToast]
  );

  const reportPost = useCallback(
    async (targetId: string, reason: string) => {
      await apiClient.submitModerationReport(targetId, reason);
      addToast({
        type: 'info',
        title: 'Đã gửi báo cáo lên Hàng đợi kiểm duyệt',
      });
    },
    [addToast]
  );

  const updateSettings = useCallback((partial: Partial<SettingsState>) => {
    setSettings((prev) => {
      const nextPref = partial.themePreference ?? prev.themePreference ?? 'system';
      let nextTheme = partial.theme ?? prev.theme;
      if (partial.themePreference === 'system' && !partial.theme) {
        nextTheme = detectSystemTheme();
      } else if (partial.themePreference === 'light' || partial.themePreference === 'dark') {
        nextTheme = partial.themePreference;
      }
      return {
        ...prev,
        ...partial,
        themePreference: nextPref,
        theme: nextTheme,
      };
    });
  }, []);

  const updateByok = useCallback((partial: Partial<BYOKConfig>) => {
    setSettings((prev) => ({
      ...prev,
      byok: {
        ...prev.byok,
        ...partial,
      },
    }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    /*
     * Ghi DOM ngay trong cùng frame với hiệu ứng PinUI: nếu chờ effect
     * của React thì theme đổi sau khi hiệu ứng đã phủ xong → đúng cái
     * "khựng" cần loại bỏ. Effect bên dưới vẫn ghi lại (cùng giá trị).
     */
    writeThemeToDom(theme);
    setSettings((prev) =>
      prev.theme === theme && prev.themePreference === theme
        ? prev
        : { ...prev, theme, themePreference: theme }
    );
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => {
      const nextTheme: ThemeMode = prev.theme === 'dark' ? 'light' : 'dark';
      return {
        ...prev,
        theme: nextTheme,
        themePreference: nextTheme,
      };
    });
  }, []);

  const setThemeEffect = useCallback((themeEffect: ThemeEffect) => {
    setSettings((prev) => ({ ...prev, themeEffect }));
  }, []);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setSettings((prev) => ({ ...prev, reducedMotion }));
  }, []);

  const value = useMemo<AppStoreContextValue>(
    () => ({
      currentRoute,
      navigate,
      authModalOpen,
      setAuthModalOpen,
      sourceCatalog,
      resourceLibrary,
      savedItemIds,
      toggleSavedItem,
      likedItemIds,
      toggleLikedItem,
      isItemLiked,
      getHeartCount,
      experienceItemId,
      setExperienceItemId,
      openExperience,
      projects,
      activeProjectId: activeProject.id,
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
      openInWorkspace,
      detachItemFromWorkspace,
      launchPromptToWorkspace,
      sendWorkspacePrompt,
      regenerateLastPrompt,
      runChecksOnActiveProject,
      createProjectSnapshot,
      restoreProjectSnapshot,
      exportActiveProjectZip,
      aiActivity,
      setAiActivity,
      aiStreamingStage,
      aiStreamingPreview,
      aiModelUsed,
      currentUser,
      quota,
      refreshAuthAndQuota,
      login,
      loginAdmin,
      register,
      logout,
      communityChannels,
      communityPosts,
      refreshCommunity,
      createPost,
      upvotePost,
      answerPost,
      acceptAnswer,
      forkPostToWorkspace,
      updateDossier,
      reportPost,
      settings,
      updateSettings,
      updateByok,
      theme: settings.theme,
      setTheme,
      toggleTheme,
      themeEffect: settings.themeEffect ?? 'droplet',
      setThemeEffect,
      reducedMotion: settings.reducedMotion,
      setReducedMotion,
      toasts,
      addToast,
      dismissToast,
      viewingProfileUser,
      openUserProfile,
      clearViewingProfileUser,
    }),
    [
      currentRoute,
      navigate,
      authModalOpen,
      sourceCatalog,
      resourceLibrary,
      savedItemIds,
      toggleSavedItem,
      likedItemIds,
      toggleLikedItem,
      isItemLiked,
      getHeartCount,
      experienceItemId,
      setExperienceItemId,
      openExperience,
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
      openInWorkspace,
      detachItemFromWorkspace,
      launchPromptToWorkspace,
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
      currentUser,
      quota,
      refreshAuthAndQuota,
      login,
      loginAdmin,
      register,
      logout,
      communityChannels,
      communityPosts,
      refreshCommunity,
      createPost,
      upvotePost,
      answerPost,
      acceptAnswer,
      forkPostToWorkspace,
      updateDossier,
      reportPost,
      settings,
      updateSettings,
      updateByok,
      setTheme,
      toggleTheme,
      setThemeEffect,
      setReducedMotion,
      toasts,
      addToast,
      dismissToast,
      viewingProfileUser,
      openUserProfile,
      clearViewingProfileUser,
    ]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
};

export const AppProvider = AppStoreProvider;

export function useAppStore(): AppStoreContextValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return ctx;
}
