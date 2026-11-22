export type AppRoute =
  | 'landing'
  | 'home'
  | 'explore'
  | 'experience'
  | 'workspace'
  | 'community'
  | 'profile'
  | 'settings'
  | 'admin'
  | 'not-found';

export type DimensionView =
  | AppRoute
  | 'clubs'
  | 'qa'
  | 'threads'
  | 'chat'
  | 'memory'
  | 'chronicles'
  | 'coming-soon'
  | 'exam-vault'
  | 'exam-viewer';

export type AIActivityState = 'idle' | 'thinking' | 'streaming' | 'verified' | 'error';

export type AIStreamingStage = 'idle' | 'routing' | 'generating' | 'checking' | 'done' | 'error';

export type AIProtocol = 'openai-compatible' | 'anthropic' | 'gemini';

export type ThemeMode = 'dark' | 'light';

export type ThemeEffect = 'droplet' | 'rain' | 'diwali' | 'none';

export type WallpaperPreset =
  | 'auto'
  | 'dark'
  | 'light'
  | 'ember'
  | 'harbour'
  | 'aurora'
  | 'constellation'
  | 'indigo'
  | 'godray'
  | 'meshDusk'
  | 'jade'
  | 'rose';

export type UserRole = 'user' | 'admin' | 'SUPER_ADMIN' | 'CLUB_LEADER' | 'STUDENT';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  bio?: string;
  createdAt: string;
  level?: number;
  xp?: number;
  scopedClubIds?: string[];
}

export interface QuotaState {
  subjectId: string;
  subjectType: 'guest' | 'user' | 'admin';
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
  exhausted: boolean;
  updatedAt: string;
}

export type SourceLibraryName = 'threeui' | 'pinui' | 'motionsites' | 'lucianlabs' | 'codefronts';

export interface SourceCatalogItem {
  id: string;
  title: string;
  sourceLibrary: SourceLibraryName;
  category: string;
  subcategory: string;
  tags: string[];
  runtime: string;
  style: string;
  license: string;
  officialUrl: string;
  archivePath: string;
  description: string;
  previewHtml?: string;
  previewCss?: string;
  previewImage?: string;
  promptSpec?: string;
}

export type ResourceGroup =
  | 'AI Tools'
  | 'Prompts'
  | 'GitHub Repositories'
  | 'Skills & Rules'
  | 'UI/UX'
  | 'Documentation'
  | 'Learning'
  | 'Dev Tools';

export type VerificationStatus = 'verified_tested' | 'verified_info' | 'unverified';

export interface ResourceItem {
  id: string;
  title: string;
  group: ResourceGroup;
  category: string;
  tags: string[];
  officialUrl: string;
  license: string;
  compatibility: string;
  lastVerified: string;
  status: VerificationStatus;
  description: string;
  snippet?: string;
}

export interface AttachedContextItem {
  id: string;
  kind: 'template' | 'resource' | 'community-drop' | 'blueprint';
  title: string;
  sourceLibrary?: string;
  summary: string;
  payload?: string;
  tags?: string[];
}

export interface WorkspaceFile {
  path: string;
  content: string;
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'markdown';
  summary?: string;
  updatedAt: string;
}

export interface WorkspaceSnapshot {
  id: string;
  label: string;
  createdAt: string;
  files: WorkspaceFile[];
}

export interface DiffLine {
  type: 'context' | 'add' | 'del';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

export interface DiffSplitRow {
  leftLineNumber: number | null;
  leftContent: string;
  leftType: 'context' | 'del' | 'empty';
  rightLineNumber: number | null;
  rightContent: string;
  rightType: 'context' | 'add' | 'empty';
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffEntry {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'unchanged';
  additions: number;
  deletions: number;
  oldContent: string;
  newContent: string;
  unifiedPatch: string;
  hunks: DiffHunk[];
  splitRows: DiffSplitRow[];
}

export type CheckCategory =
  | 'html_structure'
  | 'js_syntax'
  | 'responsive_layout'
  | 'internal_links'
  | 'secret_scan'
  | 'accessibility';

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface CheckIssue {
  file: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  ruleId: string;
}

export interface CheckResult {
  id: string;
  category: CheckCategory;
  title: string;
  status: CheckStatus;
  summary: string;
  issues: CheckIssue[];
  checkedAt: string;
  durationMs: number;
}

export interface ChecksReport {
  overallStatus: CheckStatus;
  passCount: number;
  warnCount: number;
  failCount: number;
  results: CheckResult[];
  ranAt: string;
}

export type ProcessStatus = 'running' | 'completed' | 'failed';

export interface ProcessItem {
  id: string;
  name: string;
  kind: 'ai_generation' | 'static_checks' | 'diff_compute' | 'zip_export' | 'setup_bundle';
  status: ProcessStatus;
  startedAt: string;
  completedAt?: string;
  detail: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  changedFiles?: string[];
  fallback?: boolean;
  upstreamError?: string;
  modelUsed?: string;
  protocolUsed?: AIProtocol;
}

export interface WorkspaceProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  activeFilePath: string;
  files: WorkspaceFile[];
  previousFiles: WorkspaceFile[];
  snapshots: WorkspaceSnapshot[];
  messages: ChatMessage[];
  attachedItems: AttachedContextItem[];
  diffs: DiffEntry[];
  checksReport: ChecksReport | null;
  processes: ProcessItem[];
  pinned?: boolean;
  archived?: boolean;
}

export type CommunityChannel = 'qa' | 'showcase' | 'drops' | 'clubs';

export interface CommunityAuthor {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  role: string;
  bio?: string;
}

export interface CommunityAnswer {
  id: string;
  author: CommunityAuthor;
  createdAt: string;
  votes: number;
  content: string;
  isAccepted?: boolean;
}

export interface CommunityShowcaseSnippet {
  html: string;
  css: string;
  js?: string;
}

export interface ClubHandoverDossier {
  projectTitle: string;
  handoverNotes: string;
  nextMilestones: string[];
  architectureSummary?: string;
  ownerHandle?: string;
  updatedAt?: string;
}

export interface CommunityPost {
  id: string;
  channel: CommunityChannel;
  title: string;
  author: CommunityAuthor;
  category: string;
  tags: string[];
  createdAt: string;
  votes: number;
  upvotedBy?: string[];
  body?: string;
  description?: string;
  answersCount?: number;
  isAccepted?: boolean;
  acceptedAnswer?: CommunityAnswer;
  answers?: CommunityAnswer[];
  likes?: number;
  views?: number;
  demoSnippet?: CommunityShowcaseSnippet;
  forks?: number;
  fileType?: string;
  payload?: string;
  name?: string;
  slug?: string;
  lead?: string;
  membersCount?: number;
  activeDossier?: ClubHandoverDossier;
  hidden?: boolean;
}

export interface CommunityChannelsData {
  qa: CommunityPost[];
  showcase: CommunityPost[];
  drops: CommunityPost[];
  clubs: CommunityPost[];
}

export type ModerationReportStatus = 'pending' | 'approved' | 'hidden' | 'dismissed';

export interface ModerationReport {
  id: string;
  targetId: string;
  targetChannel: CommunityChannel;
  targetTitle: string;
  reason: string;
  reporterId: string;
  reporterName: string;
  status: ModerationReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AdminGatewayOverride {
  enabled: boolean;
  protocol: AIProtocol;
  baseUrl: string;
  model: string;
  apiKey?: string;
  hasCustomApiKey?: boolean;
  systemPromptSuffix?: string;
  standardTurnLimit?: number;
  guestSandboxEnabled?: boolean;
  updatedAt: string;
}

export interface AdminUserQuotaRecord {
  subjectId: string;
  subjectType: 'guest' | 'user' | 'admin';
  username: string;
  email?: string;
  role: 'user' | 'admin';
  used: number;
  limit: number | null;
  unlimited: boolean;
  updatedAt: string;
}

export interface AdminTelemetrySnapshot {
  totalAiRequests: number;
  successfulAiRequests: number;
  fallbackAiRequests: number;
  quotaBlockedRequests: number;
  activeSessionsCount: number;
  registeredUsersCount: number;
  communityPostsCount: number;
  pendingModerationCount: number;
  uptimeSeconds: number;
  lastRequestAt: string | null;
}

export interface AdminTelemetryDay {
  date: string;
  aiRequests: number;
  success: number;
  fallback: number;
  quotaBlocked: number;
  newUsers: number;
}

export interface AdminUserGrowthPoint {
  date: string;
  newUsers: number;
  totalUsers: number;
}

export interface AdminAuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

export interface AdminChangelogEntry {
  id: string;
  version: string;
  title: string;
  notes: string;
  publishedAt: string;
  author: string;
}

export interface AdminState {
  gateway: AdminGatewayOverride;
  moderationQueue: ModerationReport[];
  usersAndQuotas: AdminUserQuotaRecord[];
  telemetry: AdminTelemetrySnapshot;
  telemetryHistory: AdminTelemetryDay[];
  userGrowth: AdminUserGrowthPoint[];
  auditLogs: AdminAuditLogEntry[];
  changelog: AdminChangelogEntry[];
}

export interface BYOKConfig {
  enabled: boolean;
  protocol: AIProtocol;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface SettingsState {
  theme: ThemeMode;
  themePreference?: ThemePreference;
  ambientVideo?: boolean;
  wallpaperPreset?: WallpaperPreset;
  autoRunChecks?: boolean;
  defaultViewport?: 1440 | 768 | 390;
  themeEffect?: ThemeEffect;
  reducedMotion: boolean;
  compactDensity: boolean;
  defaultExportTarget: 'antigravity' | 'cursor';
  byok: BYOKConfig;
}

export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  createdAt: number;
}

export type ProjectSetupTarget = 'antigravity' | 'cursor';

export interface ProjectSetupBundle {
  target: ProjectSetupTarget;
  files: Array<{
    path: string;
    content: string;
  }>;
}

export interface SecretFinding {
  file: string;
  line: number;
  ruleId: string;
  description: string;
  snippetRedacted: string;
}

export interface SecretScanResult {
  clean: boolean;
  findings: SecretFinding[];
  scannedFilesCount: number;
}

export interface AIChatRequest {
  projectId: string;
  prompt: string;
  model?: string;
  agentMode?: string;
  stream?: boolean;
  files: Array<{ path: string; content: string }>;
  attachedItems?: AttachedContextItem[];
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AIChatResponse {
  message: string;
  files: Array<{
    path: string;
    content: string;
    summary: string;
  }>;
  checksHint: string[];
  quota: QuotaState;
  fallback: boolean;
  upstreamError?: string;
  modelUsed: string;
  protocolUsed: AIProtocol;
}

export interface AIStreamStageEvent {
  stage: 'routing' | 'generating' | 'checking';
  model: string;
  protocol: AIProtocol;
  detail?: string;
}

export interface AIStreamDeltaEvent {
  text: string;
}

export interface AIStreamCallbacks {
  onStage?: (event: AIStreamStageEvent) => void;
  onDelta?: (event: AIStreamDeltaEvent) => void;
  onResult?: (result: AIChatResponse) => void;
  onError?: (error: { message: string; status?: number }) => void;
  signal?: AbortSignal;
}
