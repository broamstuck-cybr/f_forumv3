import crypto from 'node:crypto';
import type {
  AdminAuditLogEntry,
  AdminChangelogEntry,
  AdminGatewayOverride,
  AdminState,
  AdminTelemetrySnapshot,
  AdminUserQuotaRecord,
  AIProtocol,
  ModerationReportStatus,
} from '../src/types/index';
import { listAllUsers, toggleUserRole } from './authEngine.js';
import { getCommunityState, resolveModerationReport } from './communityStore.js';
import {
  enqueueWrite,
  ensureLocalEnvLoaded,
  isSupabaseEnabled,
  readLocalSection,
  registerHydrator,
  sbSelect,
  sbUpsert,
  writeLocalSection,
} from './persistence.js';
import { listAllQuotaEntries, MAX_STANDARD_TURNS, resetSubjectQuota } from './quotaStore.js';

ensureLocalEnvLoaded();

interface TelemetryCounters {
  totalAiRequests: number;
  successfulAiRequests: number;
  fallbackAiRequests: number;
  quotaBlockedRequests: number;
  lastRequestAt: string | null;
}

/**
 * Một ngày đo đếm thật của hệ thống. Chỉ ghi những gì server thực sự biết:
 * số lượt AI, số lượt thành công / dự phòng / bị chặn hạn mức, và số tài khoản
 * tạo mới trong ngày. Không suy diễn, không làm mượt, không bịa xu hướng.
 */
interface TelemetryDayPoint {
  date: string;
  aiRequests: number;
  success: number;
  fallback: number;
  quotaBlocked: number;
  newUsers: number;
}

interface PersistedAdminData {
  gateway: AdminGatewayOverride;
  telemetryCounters: TelemetryCounters;
  telemetryHistory: TelemetryDayPoint[];
  auditLogs: AdminAuditLogEntry[];
  changelog: AdminChangelogEntry[];
}

const TELEMETRY_HISTORY_DAYS = 30;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function totalsFromHistory(history: TelemetryDayPoint[]): TelemetryCounters {
  return history.reduce<TelemetryCounters>(
    (acc, day) => ({
      totalAiRequests: acc.totalAiRequests + day.aiRequests,
      successfulAiRequests: acc.successfulAiRequests + day.success,
      fallbackAiRequests: acc.fallbackAiRequests + day.fallback,
      quotaBlockedRequests: acc.quotaBlockedRequests + day.quotaBlocked,
      lastRequestAt: acc.lastRequestAt,
    }),
    {
      totalAiRequests: 0,
      successfulAiRequests: 0,
      fallbackAiRequests: 0,
      quotaBlockedRequests: 0,
      lastRequestAt: null,
    }
  );
}

const serverStartTimeMs = Date.now();
let memoryAdmin: PersistedAdminData | null = null;

function getDefaultGateway(): AdminGatewayOverride {
  ensureLocalEnvLoaded();
  const rawProtocol = (process.env.AI_PROTOCOL || 'openai-compatible').trim();
  const protocol: AIProtocol =
    rawProtocol === 'anthropic' || rawProtocol === 'gemini' ? rawProtocol : 'openai-compatible';
  return {
    enabled: false,
    protocol,
    baseUrl: (process.env.AI_BASE_URL || 'https://api.openai.com/v1').trim(),
    model: (process.env.AI_MODEL || 'studio-smart-route').trim(),
    apiKey: '',
    hasCustomApiKey: false,
    systemPromptSuffix: '',
    standardTurnLimit: MAX_STANDARD_TURNS,
    guestSandboxEnabled: true,
    updatedAt: new Date().toISOString(),
  };
}

function buildDefaultAdminData(): PersistedAdminData {
  return {
    gateway: getDefaultGateway(),
    telemetryCounters: {
      totalAiRequests: 0,
      successfulAiRequests: 0,
      fallbackAiRequests: 0,
      quotaBlockedRequests: 0,
      lastRequestAt: null,
    },
    telemetryHistory: [],
    auditLogs: [
      {
        id: 'audit-init-01',
        timestamp: new Date().toISOString(),
        actor: 'system',
        action: 'RUNTIME_INITIALIZED',
        target: 'server/adminStore',
        detail: 'Khởi tạo hệ thống quản trị F-FORUM v3 với chế độ đo lường thực.',
      },
    ],
    changelog: [
      {
        id: 'cl-v3-0-0',
        version: '3.0.0',
        title: 'F-FORUM v3 Architecture Release',
        notes:
          'Ra mắt Spatial Home Launchpad, Explore 8-Group Library & 60/40 Split-Stage Template Collection, 3-Column Arena Work space, Source of Knowledge Forum và Admin Console.',
        publishedAt: '2026-11-19T00:00:00Z',
        author: 'System Administrator',
      },
    ],
  };
}

function toChangelogRow(entry: AdminChangelogEntry): Record<string, unknown> {
  return {
    id: entry.id,
    version: entry.version,
    title: entry.title,
    notes: entry.notes,
    published_at: entry.publishedAt,
    author: entry.author,
  };
}

function fromChangelogRow(row: Record<string, unknown>): AdminChangelogEntry {
  return {
    id: String(row.id),
    version: String(row.version || '3.0.0'),
    title: String(row.title || 'System Update'),
    notes: String(row.notes || ''),
    publishedAt: String(row.published_at || new Date().toISOString()),
    author: String(row.author || 'System Administrator'),
  };
}

function fromAuditRow(row: Record<string, unknown>): AdminAuditLogEntry {
  return {
    id: String(row.id),
    timestamp: String(row.timestamp || new Date().toISOString()),
    actor: String(row.actor || 'system'),
    action: String(row.action || ''),
    target: String(row.target || ''),
    detail: String(row.detail || ''),
  };
}

registerHydrator('admin', async () => {
  const [configRows, auditRows, changelogRows] = await Promise.all([
    sbSelect<Record<string, unknown>>('ff_admin_config', 'select=*'),
    sbSelect<Record<string, unknown>>('ff_audit_logs', 'select=*&order=timestamp.desc&limit=200'),
    sbSelect<Record<string, unknown>>('ff_changelog', 'select=*&order=published_at.desc'),
  ]);

  const defaults = buildDefaultAdminData();
  let gateway = defaults.gateway;
  let telemetryCounters = defaults.telemetryCounters;
  let telemetryHistory = defaults.telemetryHistory;
  let hasGateway = false;
  let hasTelemetry = false;

  for (const row of configRows) {
    if (row.key === 'gateway' && row.value && typeof row.value === 'object') {
      gateway = { ...defaults.gateway, ...(row.value as Partial<AdminGatewayOverride>) };
      hasGateway = true;
    } else if (row.key === 'telemetryCounters' && row.value && typeof row.value === 'object') {
      telemetryCounters = {
        ...defaults.telemetryCounters,
        ...(row.value as Partial<TelemetryCounters>),
      };
      hasTelemetry = true;
    } else if (row.key === 'telemetryHistory' && Array.isArray(row.value)) {
      telemetryHistory = (row.value as TelemetryDayPoint[]).slice(-TELEMETRY_HISTORY_DAYS);
    }
  }

  const configSeedRows: Array<Record<string, unknown>> = [];
  if (!hasGateway) {
    configSeedRows.push({
      key: 'gateway',
      value: gateway,
      updated_at: new Date().toISOString(),
    });
  }
  if (!hasTelemetry) {
    configSeedRows.push({
      key: 'telemetryCounters',
      value: telemetryCounters,
      updated_at: new Date().toISOString(),
    });
  }
  if (configSeedRows.length > 0) {
    await sbUpsert('ff_admin_config', configSeedRows, 'key');
  }

  let auditLogs: AdminAuditLogEntry[];
  if (auditRows.length === 0) {
    auditLogs = defaults.auditLogs;
    await sbUpsert('ff_audit_logs', auditLogs, 'id');
  } else {
    auditLogs = auditRows.map(fromAuditRow);
  }

  let changelog: AdminChangelogEntry[];
  if (changelogRows.length === 0) {
    changelog = defaults.changelog;
    await sbUpsert('ff_changelog', changelog.map(toChangelogRow), 'id');
  } else {
    changelog = changelogRows.map(fromChangelogRow);
  }

  memoryAdmin = {
    gateway,
    telemetryCounters,
    telemetryHistory,
    auditLogs,
    changelog,
  };
});

function ensureAdminData(): PersistedAdminData {
  if (memoryAdmin) return memoryAdmin;
  if (!isSupabaseEnabled()) {
    const persisted = readLocalSection<PersistedAdminData | null>('adminStore', null);
    if (persisted && persisted.gateway && persisted.telemetryCounters) {
      /* Bản ghi cũ chưa có chuỗi ngày: giữ nguyên số liệu, chỉ thêm mảng rỗng. */
      memoryAdmin = {
        ...persisted,
        telemetryHistory: Array.isArray(persisted.telemetryHistory) ? persisted.telemetryHistory : [],
      };
      return memoryAdmin;
    }
  }

  memoryAdmin = buildDefaultAdminData();
  if (!isSupabaseEnabled()) {
    writeLocalSection('adminStore', memoryAdmin);
  }
  return memoryAdmin;
}

function saveAdminData(): void {
  if (!memoryAdmin) return;
  writeLocalSection('adminStore', memoryAdmin);
}

export function appendAuditLog(actor: string, action: string, target: string, detail: string): AdminAuditLogEntry {
  const store = ensureAdminData();
  const entry: AdminAuditLogEntry = {
    id: `audit-${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    target,
    detail,
  };
  store.auditLogs.unshift(entry);
  if (store.auditLogs.length > 200) {
    store.auditLogs = store.auditLogs.slice(0, 200);
  }
  if (isSupabaseEnabled()) {
    enqueueWrite(sbUpsert('ff_audit_logs', [entry], 'id'));
  } else {
    saveAdminData();
  }
  return entry;
}

function dayPointOf(store: PersistedAdminData, date = todayKey()): TelemetryDayPoint {
  let point = store.telemetryHistory.find((entry) => entry.date === date);
  if (!point) {
    point = { date, aiRequests: 0, success: 0, fallback: 0, quotaBlocked: 0, newUsers: 0 };
    store.telemetryHistory.push(point);
    store.telemetryHistory.sort((a, b) => a.date.localeCompare(b.date));
    if (store.telemetryHistory.length > TELEMETRY_HISTORY_DAYS) {
      store.telemetryHistory = store.telemetryHistory.slice(-TELEMETRY_HISTORY_DAYS);
    }
  }
  return point;
}

function persistTelemetry(store: PersistedAdminData): void {
  if (isSupabaseEnabled()) {
    enqueueWrite(
      sbUpsert(
        'ff_admin_config',
        [
          {
            key: 'telemetryCounters',
            value: store.telemetryCounters,
            updated_at: new Date().toISOString(),
          },
          {
            key: 'telemetryHistory',
            value: store.telemetryHistory,
            updated_at: new Date().toISOString(),
          },
        ],
        'key'
      )
    );
  } else {
    saveAdminData();
  }
}

export function recordAiTelemetry(event: 'success' | 'fallback' | 'quota_blocked'): void {
  const store = ensureAdminData();
  store.telemetryCounters.totalAiRequests += 1;
  store.telemetryCounters.lastRequestAt = new Date().toISOString();
  const day = dayPointOf(store);
  day.aiRequests += 1;
  if (event === 'success') {
    store.telemetryCounters.successfulAiRequests += 1;
    day.success += 1;
  } else if (event === 'fallback') {
    store.telemetryCounters.fallbackAiRequests += 1;
    day.fallback += 1;
  } else if (event === 'quota_blocked') {
    store.telemetryCounters.quotaBlockedRequests += 1;
    day.quotaBlocked += 1;
  }
  persistTelemetry(store);
}

export function getInternalGatewayOverride(): AdminGatewayOverride {
  return ensureAdminData().gateway;
}

export function updateGatewayOverride(
  input: Partial<AdminGatewayOverride>,
  actor: string
): AdminGatewayOverride {
  const store = ensureAdminData();
  const current = store.gateway;
  if (typeof input.enabled === 'boolean') current.enabled = input.enabled;
  if (
    input.protocol === 'openai-compatible' ||
    input.protocol === 'anthropic' ||
    input.protocol === 'gemini'
  ) {
    current.protocol = input.protocol;
  }
  if (typeof input.baseUrl === 'string' && input.baseUrl.trim()) {
    current.baseUrl = input.baseUrl.trim();
  }
  if (typeof input.model === 'string' && input.model.trim()) {
    current.model = input.model.trim();
  }
  if (typeof input.apiKey === 'string') {
    const trimmedKey = input.apiKey.trim();
    if (trimmedKey) {
      current.apiKey = trimmedKey;
      current.hasCustomApiKey = true;
    }
  }
  if (typeof input.systemPromptSuffix === 'string') {
    current.systemPromptSuffix = input.systemPromptSuffix.trim();
  }
  if (typeof input.standardTurnLimit === 'number' && Number.isFinite(input.standardTurnLimit)) {
    current.standardTurnLimit = Math.max(1, Math.min(100, Math.round(input.standardTurnLimit)));
  }
  if (typeof input.guestSandboxEnabled === 'boolean') {
    current.guestSandboxEnabled = input.guestSandboxEnabled;
  }
  current.updatedAt = new Date().toISOString();
  if (isSupabaseEnabled()) {
    enqueueWrite(
      sbUpsert(
        'ff_admin_config',
        [
          {
            key: 'gateway',
            value: current,
            updated_at: current.updatedAt,
          },
        ],
        'key'
      )
    );
  } else {
    saveAdminData();
  }

  appendAuditLog(
    actor,
    'UPDATE_GATEWAY_OVERRIDE',
    'aiGateway',
    `Cap nhat gateway override: enabled=${current.enabled}, protocol=${current.protocol}, model=${current.model}`
  );

  return {
    ...current,
    apiKey: undefined,
    hasCustomApiKey: Boolean(current.apiKey),
  };
}

export function buildUsersAndQuotasRegistry(): AdminUserQuotaRecord[] {
  const users = listAllUsers();
  const quotas = listAllQuotaEntries();
  const quotaMap = new Map(quotas.map((q) => [q.subjectId, q]));
  const records: AdminUserQuotaRecord[] = [];
  const seenSubjects = new Set<string>();

  for (const u of users) {
    const prefix = u.role === 'admin' ? 'admin' : 'user';
    const subjectId = `${prefix}:${u.id}`;
    const altSubjectId = u.role === 'admin' ? `user:${u.id}` : `admin:${u.id}`;
    const q = quotaMap.get(subjectId) || quotaMap.get(altSubjectId);
    seenSubjects.add(subjectId);
    seenSubjects.add(altSubjectId);
    records.push({
      subjectId,
      subjectType: u.role === 'admin' ? 'admin' : 'user',
      username: u.username,
      email: u.email,
      role: u.role,
      used: q ? q.used : 0,
      limit: u.role === 'admin' ? null : MAX_STANDARD_TURNS,
      unlimited: u.role === 'admin',
      updatedAt: q ? q.updatedAt : u.createdAt,
    });
  }

  for (const q of quotas) {
    if (seenSubjects.has(q.subjectId)) continue;
    records.push({
      subjectId: q.subjectId,
      subjectType: q.subjectType,
      username: q.subjectId,
      role: q.subjectType === 'admin' ? 'admin' : 'user',
      used: q.used,
      limit: q.subjectType === 'admin' ? null : MAX_STANDARD_TURNS,
      unlimited: q.subjectType === 'admin',
      updatedAt: q.updatedAt,
    });
  }

  return records;
}

export function adminResetQuota(subjectId: string, actor: string): void {
  resetSubjectQuota(subjectId);
  appendAuditLog(actor, 'RESET_QUOTA', subjectId, `Reset luot su dung AI ve 0 cho ${subjectId}`);
}

export function adminToggleUserRole(userId: string, actor: string): void {
  const updated = toggleUserRole(userId);
  if (updated) {
    appendAuditLog(
      actor,
      'TOGGLE_USER_ROLE',
      userId,
      `Chuyen vai tro cua ${updated.username} sang ${updated.role}`
    );
  }
}

export function adminModerateReport(
  reportId: string,
  status: ModerationReportStatus,
  actor: string
): void {
  const resolved = resolveModerationReport(reportId, status, actor);
  if (resolved) {
    appendAuditLog(
      actor,
      'MODERATE_REPORT',
      reportId,
      `Cap nhat bao cao ${reportId} (${resolved.targetTitle}) sang trang thai ${status}`
    );
  }
}

export function adminAddChangelog(
  input: { version: string; title: string; notes: string },
  actor: string
): AdminChangelogEntry {
  const store = ensureAdminData();
  const entry: AdminChangelogEntry = {
    id: `cl-${crypto.randomBytes(4).toString('hex')}`,
    version: input.version.trim() || '3.0.1',
    title: input.title.trim() || 'System Update',
    notes: input.notes.trim(),
    publishedAt: new Date().toISOString(),
    author: actor,
  };
  store.changelog.unshift(entry);
  if (isSupabaseEnabled()) {
    enqueueWrite(sbUpsert('ff_changelog', [toChangelogRow(entry)], 'id'));
  } else {
    saveAdminData();
  }
  appendAuditLog(actor, 'PUBLISH_CHANGELOG', entry.version, `Dang tải changelog ${entry.version}: ${entry.title}`);
  return entry;
}

export function getPublicChangelog(): AdminChangelogEntry[] {
  return ensureAdminData().changelog;
}

export function getAdminStateSnapshot(): AdminState {
  const store = ensureAdminData();
  const community = getCommunityState(true);
  const users = listAllUsers();
  const quotas = listAllQuotaEntries();
  const pendingReports = community.reports.filter((r) => r.status === 'pending').length;

  dayPointOf(store);
  const history = store.telemetryHistory.slice(-TELEMETRY_HISTORY_DAYS);

  /* Tăng trưởng người dùng đọc thẳng từ createdAt của tài khoản thật. */
  const signupsByDay = new Map<string, number>();
  for (const user of users) {
    const key = (user.createdAt || '').slice(0, 10);
    if (key) signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
  }
  const firstDay = history.length ? history[0].date : todayKey();
  const growth: Array<{ date: string; newUsers: number; totalUsers: number }> = [];
  let running = users.filter((user) => (user.createdAt || '').slice(0, 10) < firstDay).length;
  for (const day of history) {
    const created = signupsByDay.get(day.date) ?? 0;
    running += created;
    growth.push({ date: day.date, newUsers: created, totalUsers: running });
  }

  const telemetry: AdminTelemetrySnapshot = {
    totalAiRequests: store.telemetryCounters.totalAiRequests,
    successfulAiRequests: store.telemetryCounters.successfulAiRequests,
    fallbackAiRequests: store.telemetryCounters.fallbackAiRequests,
    quotaBlockedRequests: store.telemetryCounters.quotaBlockedRequests,
    activeSessionsCount: quotas.length,
    registeredUsersCount: users.length,
    communityPostsCount: community.posts.length,
    pendingModerationCount: pendingReports,
    uptimeSeconds: Math.max(1, Math.floor((Date.now() - serverStartTimeMs) / 1000)),
    lastRequestAt: store.telemetryCounters.lastRequestAt,
  };
  return {
    gateway: {
      ...store.gateway,
      apiKey: undefined,
      hasCustomApiKey: Boolean(store.gateway.apiKey),
    },
    moderationQueue: community.reports,
    usersAndQuotas: buildUsersAndQuotasRegistry(),
    telemetry,
    telemetryHistory: history.map((day) => ({ ...day })),
    userGrowth: growth,
    auditLogs: store.auditLogs,
    changelog: store.changelog,
  };
}
