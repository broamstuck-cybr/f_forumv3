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
import type {
  AIActivityState,
  AIStreamingStage,
  AppRoute,
  AttachedContextItem,
  BYOKConfig,
  ChecksReport,
  ClubHandoverDossier,
  CommunityAuthor,
  CommunityChannel,
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
  UiMode,
  User,
  WallpaperPreset,
  WorkspaceFile,
  WorkspaceProject,
} from '../types/index';
import type {
  BehaviorItemScore,
  BehaviorSignalType,
  OnboardingProfile,
  WorkspaceLaunchSeed,
} from '../types/workspaceV4';
import { apiClient, normalizeCommunityChannels } from '../services/apiClient';
import { runWorkspaceChecks } from '../services/checksRunner';
import { computeWorkspaceDiffs } from '../services/diffEngine';
import { generateProjectSetupBundle } from '../services/projectSetupGenerator';
import { sanitizeFilesForZipExport } from '../services/secretScanner';

const STORAGE_PROJECTS_KEY = 'fforum_v3_workspace_projects';
const STORAGE_ACTIVE_PROJECT_KEY = 'fforum_v3_active_project_id';
const STORAGE_SETTINGS_KEY = 'fforum_v3_settings';
const STORAGE_SAVED_ITEMS_KEY = 'fforum_v3_saved_items';
const STORAGE_LIKED_ITEMS_KEY = 'fforum_v3_liked_items';
const STORAGE_ONBOARDING_KEY = 'ff_onboarding_profile_v4';
const STORAGE_BEHAVIOR_SCORES_KEY = 'ff_behavior_scores_v4';

const SIGNAL_WEIGHTS: Record<BehaviorSignalType, number> = {
  view: 1,
  like: 3,
  use: 5,
  publish: 8,
  satisfied: 4,
  unsatisfied: -3,
};

function mergeBehaviorScores(
  local: Record<string, BehaviorItemScore>,
  remote: Record<string, BehaviorItemScore>
): Record<string, BehaviorItemScore> {
  const merged: Record<string, BehaviorItemScore> = { ...local };
  for (const [key, entry] of Object.entries(remote)) {
    if (!entry || typeof entry !== 'object') continue;
    const prev = merged[key];
    if (!prev) {
      merged[key] = entry;
      continue;
    }
    merged[key] = {
      score: Math.max(prev.score || 0, entry.score || 0),
      likes: Math.max(prev.likes || 0, entry.likes || 0),
      uses: Math.max(prev.uses || 0, entry.uses || 0),
      publishes: Math.max(prev.publishes || 0, entry.publishes || 0),
      updatedAt: entry.updatedAt || prev.updatedAt,
    };
  }
  return merged;
}

function isWorkspaceLaunchSeed(
  input: WorkspaceLaunchSeed | AttachedContextItem
): input is WorkspaceLaunchSeed {
  return (
    input.kind === 'vault-item' ||
    input.kind === 'remix-page' ||
    input.kind === 'showcase-15' ||
    input.kind === 'motion-recipe'
  );
}

function detectSystemTheme(): ThemeMode {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export type AppLanguage = 'vi' | 'en';
export type AppSettingsState = SettingsState & {
  language: AppLanguage;
};

const LEGACY_WALLPAPER_ALIAS: Record<string, WallpaperPreset> = {
  video: 'dark',
  auto: 'dark',
  constellation: 'ember',
  indigo: 'aurora',
  sunset: 'ember',
  'godray-amber': 'ember',
  'godray-prism': 'harbour',
  'mesh-aurora': 'aurora',
  'silk-twilight': 'aurora',
  'obsidian-glass': 'dark',
  'paper-warm': 'light',
};

const VALID_WALLPAPER_PRESETS: ReadonlySet<WallpaperPreset> = new Set([
  'dark',
  'aurora',
  'ember',
  'lagoon',
  'light',
  'sage',
  'harbour',
  'lilac',
]);

const DARK_ONLY_WALLPAPERS = new Set<WallpaperPreset>([
  'dark',
  'aurora',
  'ember',
  'lagoon',
]);

const LIGHT_ONLY_WALLPAPERS = new Set<WallpaperPreset>([
  'light',
  'sage',
  'harbour',
  'lilac',
]);

function reconcileWallpaperForTheme(
  current: WallpaperPreset | undefined,
  theme: ThemeMode,
  explicit?: WallpaperPreset
): WallpaperPreset {
  if (explicit) {
    const normalized = normalizeWallpaperPreset(explicit, theme);
    if (theme === 'light' && DARK_ONLY_WALLPAPERS.has(normalized)) return 'light';
    if (theme === 'dark' && LIGHT_ONLY_WALLPAPERS.has(normalized)) return 'dark';
    return normalized;
  }
  const preset = normalizeWallpaperPreset(current, theme);
  if (theme === 'light' && DARK_ONLY_WALLPAPERS.has(preset)) return 'light';
  if (theme === 'dark' && LIGHT_ONLY_WALLPAPERS.has(preset)) return 'dark';
  return preset;
}

function normalizeWallpaperPreset(raw: unknown, fallbackTheme: ThemeMode = 'dark'): WallpaperPreset {
  if (typeof raw === 'string') {
    if (raw === 'auto') return fallbackTheme === 'light' ? 'light' : 'dark';
    if (VALID_WALLPAPER_PRESETS.has(raw as WallpaperPreset)) {
      return raw as WallpaperPreset;
    }
    if (raw in LEGACY_WALLPAPER_ALIAS) {
      return LEGACY_WALLPAPER_ALIAS[raw];
    }
  }
  return fallbackTheme === 'light' ? 'light' : 'dark';
}

const DEFAULT_SETTINGS: AppSettingsState = {
  theme: 'dark',
  themePreference: 'dark',
  language: 'vi',
  uiMode: 'balanced',
  ambientVideo: true,
  wallpaperPreset: 'dark',
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

function syncLanguageDomAndPhone(lang: AppLanguage): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('iphone18-lang', lang);
    } catch {
      // Ignore storage quota or privacy-mode errors.
    }
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    const frames = document.querySelectorAll<HTMLIFrameElement>(
      'iframe[src*="iphone18-simulator.html"]'
    );
    frames.forEach((frame) => {
      try {
        frame.contentWindow?.postMessage({ type: 'ff-set-lang', lang }, window.location.origin);
      } catch {
        return;
      }
    });
  }
}

function syncThemeDom(
  theme: ThemeMode,
  reducedMotion?: boolean,
  ambientVideo?: boolean,
  compactDensity?: boolean,
  wallpaperPreset?: WallpaperPreset,
  themeEffect?: ThemeEffect,
  uiMode?: UiMode
): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.dataset.uiMode = uiMode || 'balanced';
    root.setAttribute('data-ambient', ambientVideo === false ? 'off' : 'on');
    root.setAttribute('data-wallpaper', wallpaperPreset || (theme === 'light' ? 'light' : 'dark'));
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
      meta.setAttribute('content', theme === 'dark' ? '#0b0e10' : '#f8faf8');
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
      summary: 'Trang HTML trống',
      updatedAt: now,
      content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dự án mới</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <script src="app.js"></script>
</body>
</html>`,
    },
    { path: 'styles.css', language: 'css', summary: 'Tệp CSS trống', updatedAt: now, content: '' },
    { path: 'app.js', language: 'javascript', summary: 'Tệp JS trống', updatedAt: now, content: '' },
  ];
}

export function formatUserDisplayName(name?: string | null, fallback = 'Khách'): string {
  const cleaned = (name ?? '').trim();
  if (!cleaned) return fallback;
  if (/^system\s+administrator$/i.test(cleaned)) return 'Quản trị viên';
  return cleaned;
}

function cleanTextLabel(raw: string): string {
  return raw
    .replace(/^Phiên Arena\b/i, 'Phiên làm việc')
    .replace(/^Obsidian Spatial Workbench$/i, 'Dự án khởi đầu')
    .replace(/^Initial Baseline$/i, 'Bản khởi tạo')
    .replace(/^Workspace Initialized & Static Checks Passed$/i, 'Khởi tạo phiên và hoàn tất kiểm định tĩnh')
    .replace(/^Automated Static & DOM Checks$/i, 'Kiểm định tĩnh & cấu trúc giao diện')
    .replace(/^Synthesizing:\s*(?:\[Mode:\s*[^\]]+\]\s*)?/i, 'Cập nhật: ')
    .replace(/^\[Mode:\s*[^\]]+\]\s*/i, '')
    .replace(/^Added (\d+) file\(s\) to virtual tree$/i, 'Đã thêm $1 tệp vào cây mã nguồn')
    .replace(/^Exported (.+)$/i, 'Đã xuất gói $1')
    .replace(/^(\d+)\/(\d+)\s+checks passed$/i, '$1/$2 phép kiểm đạt')
    .replace(/^Updated (\d+) files \((\d+)\/(\d+) checks pass\)$/i, 'Đã cập nhật $1 tệp ($2/$3 phép kiểm đạt)');
}

function sanitizeProjectLabels(project: WorkspaceProject): WorkspaceProject {
  const nextName = cleanTextLabel(project.name || 'Dự án mới');
  const nextDesc =
    project.description === 'Starter multi-file project with 8px token rhythm and live preview.' ||
    project.description === 'Synthesized multi-file project'
      ? 'Dự án đa tệp chuẩn lưới 8px kèm khung xem trực tiếp.'
      : project.description;
  return {
    ...project,
    name: nextName,
    description: nextDesc,
    snapshots: Array.isArray(project.snapshots)
      ? project.snapshots.map((snap) => ({
          ...snap,
          label: cleanTextLabel(snap.label || 'Mốc lưu'),
        }))
      : [],
    processes: Array.isArray(project.processes)
      ? project.processes.map((proc) => ({
          ...proc,
          name: cleanTextLabel(proc.name || 'Tác vụ phiên'),
          detail: proc.detail ? cleanTextLabel(proc.detail) : proc.detail,
        }))
      : [],
  };
}

function createInitialProject(
  name = 'Dự án khởi đầu',
  description = 'Dự án đa tệp chuẩn lưới 8px kèm khung xem trực tiếp.'
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
        label: 'Bản khởi tạo',
        createdAt: now,
        files: starterFiles,
      },
    ],
    messages: [],
    attachedItems: [],
    diffs: initialDiffs,
    checksReport: initialChecks,
    processes: [],
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
  if (clean === '/honor') return 'honor';
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
    target === 'honor' ||
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
  return { qa: [], showcase: [], drops: [], clubs: [] };
}

function upsertPostInChannels(
  prev: CommunityChannelsData,
  post: CommunityPost | null | undefined,
  options?: { prepend?: boolean }
): CommunityChannelsData {
  const safePrev = normalizeCommunityChannels({ channels: prev });
  if (!post || typeof post !== 'object' || !post.id) return safePrev;
  const ch: CommunityChannel =
    post.channel === 'showcase' || post.channel === 'drops' || post.channel === 'clubs'
      ? post.channel
      : 'qa';
  const next: CommunityChannelsData = {
    qa: safePrev.qa.filter((p) => p.id !== post.id || ch === 'qa'),
    showcase: safePrev.showcase.filter((p) => p.id !== post.id || ch === 'showcase'),
    drops: safePrev.drops.filter((p) => p.id !== post.id || ch === 'drops'),
    clubs: safePrev.clubs.filter((p) => p.id !== post.id || ch === 'clubs'),
  };
  const list = next[ch];
  if (list.some((p) => p.id === post.id)) {
    next[ch] = list.map((p) => (p.id === post.id ? { ...p, ...post } : p));
  } else {
    next[ch] = options?.prepend === false ? [...list, post] : [post, ...list];
  }
  return next;
}

function applyCommunityMutationResponse(
  prev: CommunityChannelsData,
  res: { channels?: CommunityChannelsData; post?: CommunityPost } | null | undefined,
  options?: { prepend?: boolean }
): CommunityChannelsData {
  if (res?.channels && typeof res.channels === 'object') {
    return normalizeCommunityChannels({ channels: res.channels }, prev);
  }
  if (res?.post) {
    return upsertPostInChannels(prev, res.post, options);
  }
  return normalizeCommunityChannels({ channels: prev });
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
  toggleLikedItem: (id: string, library?: string) => void;
  isItemLiked: (id: string) => boolean;
  getHeartCount: (id: string) => number;
  experienceItemId: string | null;
  setExperienceItemId: (id: string | null) => void;
  openExperience: (itemId: string) => void;
  pendingWorkspaceSeed: WorkspaceLaunchSeed | null;
  clearWorkspaceSeed: () => void;
  onboardingProfile: OnboardingProfile | null;
  setOnboardingProfile: (profile: OnboardingProfile | null) => void;
  behaviorScores: Record<string, BehaviorItemScore>;
  recordSignal: (itemId: string, signal: BehaviorSignalType, library?: string) => void;
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
  deleteWorkspaceFile: (filePath: string) => void;
  addWorkspaceFiles: (files: Array<{ path: string; content: string; summary?: string }>) => void;
  attachItemToWorkspace: (item: AttachedContextItem, navigateToWorkspace?: boolean) => void;
  openInWorkspace: (item: WorkspaceLaunchSeed | AttachedContextItem) => void;
  detachItemFromWorkspace: (itemId: string) => void;
  launchPromptToWorkspace: (
    prompt: string,
    attached?: AttachedContextItem[],
    options?: { model?: string }
  ) => Promise<void>;
  sendWorkspacePrompt: (
    prompt: string,
    options?: {
      model?: string;
      agentMode?: string;
      attachedItems?: AttachedContextItem[];
      stream?: boolean;
      systemPrompt?: string;
      temperature?: number;
    }
  ) => Promise<void>;
  regenerateLastPrompt: (options?: {
    model?: string;
    agentMode?: string;
    systemPrompt?: string;
    temperature?: number;
  }) => Promise<void>;
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
  aiRuntime: import('../types/index').PublicAiRuntimeInfo | null;
  currentUser: User | null;
  quota: QuotaState;
  refreshAuthAndQuota: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<User>;
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
  settings: AppSettingsState;
  updateSettings: (partial: Partial<AppSettingsState>) => void;
  updateByok: (partial: Partial<BYOKConfig>) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
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
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string')
        : [];
    } catch {
      return [];
    }
  });

  const [likedItemIds, setLikedItemIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_LIKED_ITEMS_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string')
        : [];
    } catch {
      return [];
    }
  });

  const [experienceItemId, setExperienceItemId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? parseExperienceItemFromSearch(window.location.search) : null
  );

  const [pendingWorkspaceSeed, setPendingWorkspaceSeed] = useState<WorkspaceLaunchSeed | null>(null);

  const [onboardingProfile, setOnboardingProfileState] = useState<OnboardingProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_ONBOARDING_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as OnboardingProfile)
        : null;
    } catch {
      return null;
    }
  });

  const [behaviorScores, setBehaviorScores] = useState<Record<string, BehaviorItemScore>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_BEHAVIOR_SCORES_KEY);
      if (!raw) return {};
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, BehaviorItemScore>)
        : {};
    } catch {
      return {};
    }
  });

  const onboardingProfileRef = useRef(onboardingProfile);
  onboardingProfileRef.current = onboardingProfile;
  const likedItemIdsRef = useRef(likedItemIds);
  likedItemIdsRef.current = likedItemIds;

  const setOnboardingProfile = useCallback((profile: OnboardingProfile | null) => {
    setOnboardingProfileState(profile);
    if (typeof window === 'undefined') return;
    try {
      if (profile) {
        window.localStorage.setItem(STORAGE_ONBOARDING_KEY, JSON.stringify(profile));
      } else {
        window.localStorage.removeItem(STORAGE_ONBOARDING_KEY);
      }
    } catch {
      return;
    }
  }, []);

  const clearWorkspaceSeed = useCallback(() => {
    setPendingWorkspaceSeed(null);
  }, []);

  const [settings, setSettings] = useState<AppSettingsState>(() => {
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
        const initTheme = legacyTheme ?? 'dark';
        return {
          ...DEFAULT_SETTINGS,
          theme: initTheme,
          themePreference: initTheme,
          wallpaperPreset: initTheme === 'light' ? 'light' : 'dark',
          language: 'vi',
        };
      }
      const parsedRaw: unknown = JSON.parse(raw);
      if (!parsedRaw || typeof parsedRaw !== 'object' || Array.isArray(parsedRaw)) {
        const initTheme = legacyTheme ?? 'dark';
        return {
          ...DEFAULT_SETTINGS,
          theme: initTheme,
          themePreference: initTheme,
          wallpaperPreset: initTheme === 'light' ? 'light' : 'dark',
          language: 'vi',
        };
      }
      const parsed = parsedRaw as Partial<AppSettingsState>;
      const safeByok =
        parsed.byok && typeof parsed.byok === 'object' && !Array.isArray(parsed.byok)
          ? parsed.byok
          : {};
      const resolvedPref =
        parsed.themePreference === 'light' ||
        parsed.themePreference === 'dark' ||
        parsed.themePreference === 'system'
          ? parsed.themePreference
          : parsed.theme === 'light' || parsed.theme === 'dark'
            ? parsed.theme
            : legacyTheme ?? 'dark';
      const resolvedTheme: ThemeMode =
        resolvedPref === 'system'
          ? sysTheme
          : resolvedPref === 'light' || resolvedPref === 'dark'
            ? resolvedPref
            : parsed.theme === 'light' || parsed.theme === 'dark'
              ? parsed.theme
              : 'dark';
      const resolvedEffect: ThemeEffect =
        parsed.themeEffect === 'droplet' ||
        parsed.themeEffect === 'rain' ||
        parsed.themeEffect === 'diwali' ||
        parsed.themeEffect === 'none'
          ? parsed.themeEffect
          : 'droplet';
      const resolvedWallpaper = reconcileWallpaperForTheme(
        normalizeWallpaperPreset(parsed.wallpaperPreset, resolvedTheme),
        resolvedTheme
      );
      const resolvedLanguage: AppLanguage = parsed.language === 'en' ? 'en' : 'vi';
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        theme: resolvedTheme,
        themePreference: resolvedPref,
        themeEffect: resolvedEffect,
        wallpaperPreset: resolvedWallpaper,
        language: resolvedLanguage,
        byok: {
          ...DEFAULT_SETTINGS.byok,
          ...safeByok,
        },
      };
    } catch {
      const initTheme = legacyTheme ?? sysTheme;
      return {
        ...DEFAULT_SETTINGS,
        theme: initTheme,
        themePreference: legacyTheme ?? 'system',
        wallpaperPreset: initTheme === 'light' ? 'light' : 'dark',
        language: 'vi',
      };
    }
  });

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const VALID_FILE_LANGUAGES = new Set<WorkspaceFile['language']>([
  'html',
  'css',
  'javascript',
  'typescript',
  'json',
  'markdown',
]);

function normalizeStoredWorkspaceFile(raw: unknown, fallbackTime: string): WorkspaceFile | null {
  if (
    !isPlainRecord(raw) ||
    typeof raw.path !== 'string' ||
    !raw.path.trim() ||
    typeof raw.content !== 'string'
  ) {
    return null;
  }
  const language: WorkspaceFile['language'] =
    typeof raw.language === 'string' && VALID_FILE_LANGUAGES.has(raw.language as WorkspaceFile['language'])
      ? (raw.language as WorkspaceFile['language'])
      : 'html';
  return {
    path: raw.path,
    content: raw.content,
    language,
    summary: typeof raw.summary === 'string' ? raw.summary : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : fallbackTime,
  };
}

function normalizeStoredProject(raw: unknown): WorkspaceProject | null {
  if (!isPlainRecord(raw) || typeof raw.id !== 'string' || !raw.id.trim() || !Array.isArray(raw.files)) {
    return null;
  }
  const now = new Date().toISOString();
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : now;
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt;
  const files = raw.files
    .map((f) => normalizeStoredWorkspaceFile(f, updatedAt))
    .filter((f): f is WorkspaceFile => f !== null);
  if (raw.files.length > 0 && files.length === 0) {
    return null;
  }
  const previousFiles = Array.isArray(raw.previousFiles)
    ? raw.previousFiles
        .map((f) => normalizeStoredWorkspaceFile(f, updatedAt))
        .filter((f): f is WorkspaceFile => f !== null)
    : files;
  const snapshots: WorkspaceProject['snapshots'] = Array.isArray(raw.snapshots)
    ? raw.snapshots
        .filter(
          (s): s is Record<string, unknown> =>
            isPlainRecord(s) && typeof s.id === 'string' && Array.isArray(s.files)
        )
        .map((s) => ({
          id: s.id as string,
          label: typeof s.label === 'string' ? s.label : 'Mốc lưu',
          createdAt: typeof s.createdAt === 'string' ? s.createdAt : updatedAt,
          files: (s.files as unknown[])
            .map((f) => normalizeStoredWorkspaceFile(f, updatedAt))
            .filter((f): f is WorkspaceFile => f !== null),
        }))
    : [];
  const messages = Array.isArray(raw.messages)
    ? raw.messages.filter(
        (m): m is WorkspaceProject['messages'][number] =>
          isPlainRecord(m) &&
          typeof m.id === 'string' &&
          (m.role === 'user' || m.role === 'assistant' || m.role === 'system') &&
          typeof m.content === 'string'
      )
    : [];
  const attachedItems = Array.isArray(raw.attachedItems)
    ? raw.attachedItems.filter(
        (a): a is AttachedContextItem =>
          isPlainRecord(a) &&
          typeof a.id === 'string' &&
          typeof a.title === 'string' &&
          typeof a.summary === 'string'
      )
    : [];
  const diffs = Array.isArray(raw.diffs)
    ? raw.diffs.filter(
        (d): d is WorkspaceProject['diffs'][number] =>
          isPlainRecord(d) && typeof d.path === 'string' && Array.isArray(d.hunks) && Array.isArray(d.splitRows)
      )
    : [];
  const processes = Array.isArray(raw.processes)
    ? raw.processes.filter(
        (proc): proc is ProcessItem =>
          isPlainRecord(proc) &&
          typeof proc.id === 'string' &&
          typeof proc.name === 'string' &&
          typeof proc.detail === 'string'
      )
    : [];
  const checksReport =
    isPlainRecord(raw.checksReport) && Array.isArray(raw.checksReport.results)
      ? (raw.checksReport as unknown as ChecksReport)
      : null;
  const activeFilePath =
    typeof raw.activeFilePath === 'string' && files.some((f) => f.path === raw.activeFilePath)
      ? raw.activeFilePath
      : files[0]?.path || 'index.html';

  return sanitizeProjectLabels({
    id: raw.id,
    name: typeof raw.name === 'string' ? raw.name : 'Dự án mới',
    description: typeof raw.description === 'string' ? raw.description : '',
    createdAt,
    updatedAt,
    activeFilePath,
    files,
    previousFiles,
    snapshots,
    messages,
    attachedItems,
    diffs,
    checksReport,
    processes,
    pinned: typeof raw.pinned === 'boolean' ? raw.pinned : undefined,
    archived: typeof raw.archived === 'boolean' ? raw.archived : undefined,
  });
}

  const [projects, setProjects] = useState<WorkspaceProject[]>(() => {
    if (typeof window === 'undefined') return [createInitialProject()];
    try {
      const raw = window.localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (!raw) return [createInitialProject()];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [createInitialProject()];
      const valid = parsed
        .map(normalizeStoredProject)
        .filter((p): p is WorkspaceProject => p !== null);
      return valid.length > 0 ? valid : [createInitialProject()];
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
  const [aiRuntime, setAiRuntime] = useState<import('../types/index').PublicAiRuntimeInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [quota, setQuota] = useState<QuotaState>(() => ({
    ...DEFAULT_QUOTA,
  }));

  const [communityChannels, setCommunityChannels] = useState<CommunityChannelsData>(() =>
    buildFallbackSeedChannels()
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const syncedProjectsRef = useRef<Map<string, WorkspaceProject>>(new Map());
  const hydratedUserIdRef = useRef<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const pendingWallpaperRef = useRef<{
    theme: ThemeMode;
    preset: WallpaperPreset;
    ts: number;
  } | null>(null);

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
      ...(Array.isArray(communityChannels.qa) ? communityChannels.qa : []),
      ...(Array.isArray(communityChannels.showcase) ? communityChannels.showcase : []),
      ...(Array.isArray(communityChannels.drops) ? communityChannels.drops : []),
      ...(Array.isArray(communityChannels.clubs) ? communityChannels.clubs : []),
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
    syncThemeDom(
      settings.theme,
      settings.reducedMotion,
      settings.ambientVideo !== false,
      settings.compactDensity,
      settings.wallpaperPreset,
      settings.themeEffect,
      settings.uiMode
    );
  }, [
    settings.theme,
    settings.reducedMotion,
    settings.ambientVideo,
    settings.compactDensity,
    settings.wallpaperPreset,
    settings.themeEffect,
    settings.uiMode,
  ]);

  useEffect(() => {
    syncLanguageDomAndPhone(settings.language);
  }, [settings.language]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handlePhoneLangMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as { type?: string; lang?: unknown } | null;
      if (payload?.type !== 'ff-set-lang') return;
      const nextLang: AppLanguage | null =
        payload.lang === 'vi' || payload.lang === 'en' ? payload.lang : null;
      if (!nextLang) return;
      setSettings((prev) => {
        if (prev.language === nextLang) return prev;
        const next: AppSettingsState = { ...prev, language: nextLang };
        settingsRef.current = next;
        try {
          window.localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(next));
        } catch {
          return next;
        }
        return next;
      });
    };
    window.addEventListener('message', handlePhoneLangMessage);
    return () => window.removeEventListener('message', handlePhoneLangMessage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    if ((settings.themePreference ?? 'system') !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystem = () => {
      const next: ThemeMode = mq.matches ? 'dark' : 'light';
      setSettings((prev) => {
        const nextWallpaper = reconcileWallpaperForTheme(prev.wallpaperPreset, next);
        if (prev.theme === next && prev.wallpaperPreset === nextWallpaper) return prev;
        return { ...prev, theme: next, wallpaperPreset: nextWallpaper };
      });
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
      } else if (nextRoute === 'community') {
        window.dispatchEvent(new CustomEvent('ff:community-sync-url'));
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
      if (data?.aiRuntime) {
        setAiRuntime(data.aiRuntime);
      }
    } catch {
      return;
    }
  }, []);

  const refreshCommunity = useCallback(async () => {
    try {
      const data = await apiClient.fetchCommunityState();
      if (data) {
        setCommunityChannels((prev) => normalizeCommunityChannels(data, prev));
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    void refreshAuthAndQuota();
  }, [refreshAuthAndQuota]);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getBehaviorScores()
      .then((res) => {
        if (cancelled || !res?.scores || typeof res.scores !== 'object') return;
        setBehaviorScores((prev) => mergeBehaviorScores(prev, res.scores));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_BEHAVIOR_SCORES_KEY, JSON.stringify(behaviorScores));
    } catch {
      return;
    }
  }, [behaviorScores]);

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
        const remote = Array.isArray(data.projects)
          ? data.projects.map(sanitizeProjectLabels)
          : [];
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

  const recordSignal = useCallback(
    (itemId: string, signal: BehaviorSignalType, library?: string) => {
      const cleanId = itemId.trim();
      if (!cleanId) return;
      const now = new Date().toISOString();
      const delta = SIGNAL_WEIGHTS[signal] ?? 1;
      setBehaviorScores((prev) => {
        const current = prev[cleanId] ?? { score: 0, likes: 0, uses: 0, publishes: 0 };
        return {
          ...prev,
          [cleanId]: {
            score: Math.max(0, (current.score || 0) + delta),
            likes: (current.likes || 0) + (signal === 'like' ? 1 : 0),
            uses: (current.uses || 0) + (signal === 'use' ? 1 : 0),
            publishes: (current.publishes || 0) + (signal === 'publish' ? 1 : 0),
            updatedAt: now,
          },
        };
      });
      void apiClient
        .recordBehaviorSignal({
          itemId: cleanId,
          signal,
          library,
          profileTag: onboardingProfileRef.current?.domain,
        })
        .catch(() => undefined);
    },
    []
  );

  const toggleSavedItem = useCallback((id: string) => {
    setSavedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleLikedItem = useCallback(
    (id: string, library?: string) => {
      const alreadyLiked = likedItemIdsRef.current.includes(id);
      setLikedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      if (!alreadyLiked) {
        recordSignal(id, 'like', library);
      } else {
        setBehaviorScores((prev) => {
          const current = prev[id];
          if (!current) return prev;
          return {
            ...prev,
            [id]: {
              ...current,
              likes: Math.max(0, (current.likes || 0) - 1),
              score: Math.max(0, (current.score || 0) - SIGNAL_WEIGHTS.like),
            },
          };
        });
      }
    },
    [recordSignal]
  );

  const isItemLiked = useCallback((id: string) => likedItemIds.includes(id), [likedItemIds]);

  const getHeartCount = useCallback(
    (id: string) => {
      const recorded = behaviorScores[id]?.likes;
      if (typeof recorded === 'number' && Number.isFinite(recorded) && recorded >= 0) {
        return recorded;
      }
      return likedItemIds.includes(id) ? 1 : 0;
    },
    [behaviorScores, likedItemIds]
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
        name.trim() || 'Phiên làm việc mới',
        description?.trim() || 'Dự án đa tệp chuẩn lưới 8px kèm khung xem trực tiếp.'
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

  const deleteWorkspaceFile = useCallback(
    (filePath: string) => {
      const target = filePath.trim();
      if (!target) return;
      const now = new Date().toISOString();
      updateActiveProject((proj) => {
        if (proj.files.length <= 1) return proj;
        const nextFiles = proj.files.filter((f) => f.path !== target);
        if (nextFiles.length === proj.files.length) return proj;
        const nextActive =
          proj.activeFilePath === target ? (nextFiles[0]?.path || '') : proj.activeFilePath;
        const nextDiffs = computeWorkspaceDiffs(proj.previousFiles, nextFiles);
        const nextChecks = runWorkspaceChecks(nextFiles);
        return {
          ...proj,
          updatedAt: now,
          activeFilePath: nextActive,
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
            summary: item.summary || 'Đã thêm vào Workspace',
            updatedAt: now,
          });
        }
        const nextFiles = Array.from(map.values());
        const nextDiffs = computeWorkspaceDiffs(proj.previousFiles, nextFiles);
        const nextChecks = runWorkspaceChecks(nextFiles);
        const setupProc: ProcessItem = {
          id: `proc-files-${Date.now()}`,
          name: `Đã thêm ${incoming.length} tệp vào cây mã nguồn`,
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
    (item: WorkspaceLaunchSeed | AttachedContextItem) => {
      if (isWorkspaceLaunchSeed(item)) {
        setPendingWorkspaceSeed(item);
        navigate('workspace');
        return;
      }
      setPendingWorkspaceSeed({
        kind: 'vault-item',
        id: item.id,
        title: item.title,
        prompt: item.payload || item.summary || `Dựng giao diện dựa trên ${item.title}`,
        sourceLibrary: item.sourceLibrary,
        sourceCode: item.payload,
      });
      attachItemToWorkspace(item, true);
    },
    [attachItemToWorkspace, navigate]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const remixSlug = params.get('remix')?.trim();
    if (!remixSlug) return;
    let cancelled = false;

    const loadRemix = async () => {
      try {
        const res = await apiClient.getPublishedPage(remixSlug);
        if (!cancelled && res?.page) {
          openInWorkspace({
            kind: 'remix-page',
            id: res.page.slug,
            title: res.page.title,
            sourceLibrary: 'Cộng đồng Remix',
            prompt: `Remix trang "${res.page.title}" (${res.page.summary || 'Bản xuất bản cộng đồng'}): giữ bố cục và nâng cấp theo yêu cầu của tôi.`,
            html: res.page.html,
            profile: {
              siteName: res.page.title,
              personality: res.page.personality,
            },
          });
          return;
        }
      } catch {
        void 0;
      }

      try {
        const mod = await import('../data/agentShowcase15');
        const matched = mod.AGENT_SHOWCASE_15.find(
          (entry) => entry.slug === remixSlug || entry.id === remixSlug
        );
        if (!cancelled && matched) {
          openInWorkspace({
            kind: 'showcase-15',
            id: matched.id,
            title: matched.title,
            sourceLibrary: matched.categoryLabel,
            prompt: matched.userPrompt,
            html: matched.html,
            profile: matched.profile,
          });
        }
      } catch {
        return;
      }
    };

    void loadRemix();
    return () => {
      cancelled = true;
    };
  }, [openInWorkspace]);

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
      name: 'Kiểm định tĩnh & cấu trúc giao diện',
      kind: 'static_checks',
      status: report.overallStatus === 'fail' ? 'failed' : 'completed',
      startedAt: now,
      completedAt: now,
      detail: `${report.passCount} đạt, ${report.warnCount} cảnh báo, ${report.failCount} lỗi`,
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
      options?: {
        model?: string;
        agentMode?: string;
        attachedItems?: AttachedContextItem[];
        stream?: boolean;
        systemPrompt?: string;
        temperature?: number;
      }
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
      const cleanBrief = trimmed.replace(/^\[Mode:\s*[^\]]+\]\s*/i, '').trim();
      const runningProc: ProcessItem = {
        id: procId,
        name: `Cập nhật: ${cleanBrief.slice(0, 42)}`,
        kind: 'ai_generation',
        status: 'running',
        startedAt,
        detail: 'Đang định tuyến mô hình AI...',
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
        systemPrompt: options?.systemPrompt,
        temperature: options?.temperature,
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
              return apiClient.sendAiChat(requestPayload, activeByok, { signal: controller.signal });
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
                label: cleanBrief.slice(0, 36) || 'Bản cập nhật',
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
                    detail: `Đã cập nhật ${response.files.length} tệp (${nextChecks.passCount}/${nextChecks.results.length} phép kiểm đạt)`,
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
    async (options?: {
      model?: string;
      agentMode?: string;
      systemPrompt?: string;
      temperature?: number;
    }) => {
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
        systemPrompt: options?.systemPrompt,
        temperature: options?.temperature,
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
            label: label?.trim() || `Mốc lưu ${proj.snapshots.length + 1}`,
            createdAt: now,
            files: proj.files,
          },
          ...proj.snapshots,
        ].slice(0, 15),
      }));
      addToast({
        type: 'success',
        title: 'Đã lưu mốc khôi phục',
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
        title: 'Đã khôi phục mốc đã lưu',
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
        name: `Đã xuất gói ${filename}`,
        kind: 'zip_export',
        status: 'completed',
        startedAt: now,
        completedAt: now,
        detail: clean
          ? 'Quét bảo mật đạt chuẩn (0 chuỗi nhạy cảm)'
          : `Đã ẩn tự động ${findings.length} chuỗi nhạy cảm trước khi đóng gói`,
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
        title: `Xin chào, ${formatUserDisplayName(res.user.name)}`,
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
      setCommunityChannels((prev) => applyCommunityMutationResponse(prev, res, { prepend: true }));
      addToast({
        type: 'success',
        title: 'Đã đăng bài lên Cộng đồng',
      });
      return res.post;
    },
    [addToast]
  );

  const upvotePost = useCallback(async (postId: string) => {
    const res = await apiClient.upvoteCommunityPost(postId);
    setCommunityChannels((prev) => applyCommunityMutationResponse(prev, res));
  }, []);

  const answerPost = useCallback(
    async (postId: string, content: string) => {
      const res = await apiClient.addCommunityAnswer(postId, content);
      setCommunityChannels((prev) => applyCommunityMutationResponse(prev, res));
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
      setCommunityChannels((prev) => applyCommunityMutationResponse(prev, res));
      addToast({
        type: 'success',
        title: 'Đã chọn lời giải chuẩn',
      });
    },
    [addToast]
  );

  const forkPostToWorkspace = useCallback(
    (post: CommunityPost) => {
      void apiClient
        .forkCommunityItem(post.id)
        .then((res) => {
          setCommunityChannels((prev) => applyCommunityMutationResponse(prev, res));
        })
        .catch(() => undefined);

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
      setCommunityChannels((prev) => applyCommunityMutationResponse(prev, res));
      addToast({
        type: 'success',
        title: 'Đã cập nhật hồ sơ bàn giao CLB',
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

  const persistSettingsSync = useCallback((next: AppSettingsState) => {
    settingsRef.current = next;
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', next.theme);
      root.setAttribute(
        'data-wallpaper',
        next.wallpaperPreset || (next.theme === 'light' ? 'light' : 'dark')
      );
      root.setAttribute('data-ambient', next.ambientVideo === false ? 'off' : 'on');
    }
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(next));
      window.localStorage.setItem('fforum_theme', next.theme);
    } catch {
      return;
    }
  }, []);

  const updateSettings = useCallback(
    (partial: Partial<AppSettingsState>) => {
      const currentTheme = settingsRef.current.theme;
      let plannedTheme = partial.theme ?? currentTheme;
      if (partial.themePreference === 'system' && !partial.theme) {
        plannedTheme = detectSystemTheme();
      } else if (partial.themePreference === 'light' || partial.themePreference === 'dark') {
        plannedTheme = partial.themePreference;
      }

      let explicitWallpaper = partial.wallpaperPreset;
      if (explicitWallpaper) {
        const rawPreset = VALID_WALLPAPER_PRESETS.has(explicitWallpaper)
          ? explicitWallpaper
          : LEGACY_WALLPAPER_ALIAS[explicitWallpaper];
        if (rawPreset) {
          const wantsLight = LIGHT_ONLY_WALLPAPERS.has(rawPreset);
          const wantsDark = DARK_ONLY_WALLPAPERS.has(rawPreset);
          if (
            (plannedTheme === 'dark' && wantsLight) ||
            (plannedTheme === 'light' && wantsDark)
          ) {
            // Stash cross-theme wallpaper until the accompanying theme transition commits.
            pendingWallpaperRef.current = {
              theme: wantsLight ? 'light' : 'dark',
              preset: rawPreset,
              ts: Date.now(),
            };
            explicitWallpaper = undefined;
          } else {
            pendingWallpaperRef.current = null;
          }
        }
      } else if (plannedTheme !== currentTheme) {
        const pending = pendingWallpaperRef.current;
        if (pending && pending.theme === plannedTheme && Date.now() - pending.ts < 2000) {
          explicitWallpaper = pending.preset;
        }
        pendingWallpaperRef.current = null;
      }

      setSettings((prev) => {
        const nextPref = partial.themePreference ?? prev.themePreference ?? 'system';
        let nextTheme = partial.theme ?? prev.theme;
        if (partial.themePreference === 'system' && !partial.theme) {
          nextTheme = detectSystemTheme();
        } else if (partial.themePreference === 'light' || partial.themePreference === 'dark') {
          nextTheme = partial.themePreference;
        }
        const nextWallpaper = reconcileWallpaperForTheme(
          prev.wallpaperPreset,
          nextTheme,
          explicitWallpaper
        );
        const nextLang: AppLanguage =
          partial.language === 'en' || partial.language === 'vi'
            ? partial.language
            : prev.language;
        const next: AppSettingsState = {
          ...prev,
          ...partial,
          themePreference: nextPref,
          theme: nextTheme,
          wallpaperPreset: nextWallpaper,
          language: nextLang,
        };
        persistSettingsSync(next);
        return next;
      });
    },
    [persistSettingsSync]
  );

  const setLanguage = useCallback(
    (lang: AppLanguage) => {
      updateSettings({ language: lang });
      syncLanguageDomAndPhone(lang);
    },
    [updateSettings]
  );

  const updateByok = useCallback((partial: Partial<BYOKConfig>) => {
    setSettings((prev) => ({
      ...prev,
      byok: {
        ...prev.byok,
        ...partial,
      },
    }));
  }, []);

  const setTheme = useCallback(
    (theme: ThemeMode) => {
      const pending = pendingWallpaperRef.current;
      const pendingPreset =
        pending && pending.theme === theme && Date.now() - pending.ts < 2000
          ? pending.preset
          : undefined;
      pendingWallpaperRef.current = null;
      const prev = settingsRef.current;
      const prevWallpaper = reconcileWallpaperForTheme(prev.wallpaperPreset, theme, pendingPreset);
      if (prev.theme !== theme || prev.themePreference !== theme || prev.wallpaperPreset !== prevWallpaper) {
        persistSettingsSync({ ...prev, theme, themePreference: theme, wallpaperPreset: prevWallpaper });
      }
      setSettings((current) => {
        const nextWallpaper = reconcileWallpaperForTheme(
          current.wallpaperPreset,
          theme,
          pendingPreset
        );
        if (
          current.theme === theme &&
          current.themePreference === theme &&
          current.wallpaperPreset === nextWallpaper
        ) {
          return current;
        }
        const next: AppSettingsState = {
          ...current,
          theme,
          themePreference: theme,
          wallpaperPreset: nextWallpaper,
        };
        persistSettingsSync(next);
        return next;
      });
    },
    [persistSettingsSync]
  );

  const toggleTheme = useCallback(() => {
    pendingWallpaperRef.current = null;
    const prev = settingsRef.current;
    const nextTheme: ThemeMode = prev.theme === 'dark' ? 'light' : 'dark';
    persistSettingsSync({
      ...prev,
      theme: nextTheme,
      themePreference: nextTheme,
      wallpaperPreset: reconcileWallpaperForTheme(prev.wallpaperPreset, nextTheme),
    });
    setSettings((current) => {
      const resolvedTheme: ThemeMode = current.theme === 'dark' ? 'light' : 'dark';
      const next: AppSettingsState = {
        ...current,
        theme: resolvedTheme,
        themePreference: resolvedTheme,
        wallpaperPreset: reconcileWallpaperForTheme(current.wallpaperPreset, resolvedTheme),
      };
      persistSettingsSync(next);
      return next;
    });
  }, [persistSettingsSync]);

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
      pendingWorkspaceSeed,
      clearWorkspaceSeed,
      onboardingProfile,
      setOnboardingProfile,
      behaviorScores,
      recordSignal,
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
      deleteWorkspaceFile,
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
      aiRuntime,
      currentUser,
      quota,
      refreshAuthAndQuota,
      login,
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
      language: settings.language,
      setLanguage,
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
      pendingWorkspaceSeed,
      clearWorkspaceSeed,
      onboardingProfile,
      setOnboardingProfile,
      behaviorScores,
      recordSignal,
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
      aiRuntime,
      currentUser,
      quota,
      refreshAuthAndQuota,
      login,
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
      setLanguage,
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
