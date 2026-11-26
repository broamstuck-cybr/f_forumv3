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
  getKeyPoolSnapshot,
  sanitizeErrorText,
  type AdminKeyPoolSnapshot,
  type TokenCounter,
} from './keyPool.js';
import {
  enqueueWrite,
  ensureHydrated,
  ensureLocalEnvLoaded,
  isSupabaseEnabled,
  readLocalSection,
  registerHydrator,
  sbSelect,
  sbUpsert,
  writeLocalSection,
} from './persistence.js';
import {
  DEFAULT_DAILY_IP_LIMIT,
  listAllQuotaEntries,
  MAX_STANDARD_TURNS,
  resetSubjectQuota,
  setQuotaPolicyProvider,
  updateSubjectQuotaControl,
} from './quotaStore.js';

ensureLocalEnvLoaded();

export interface ServerAdminGatewayOverride extends AdminGatewayOverride {
  dailyUserLimit: number;
  dailyIpLimit: number;
}

export interface ServerAdminUserQuotaRecord extends AdminUserQuotaRecord {
  kind: 'user' | 'ip';
  dailyUsed: number;
  dailyLimit: number | null;
  ipUsed?: number;
  ipLimit?: number | null;
  blocked: boolean;
  tokensTotal: number;
  customLimit?: number | null;
}

export interface AdminSecurityEvent {
  id: string;
  timestamp: string;
  type:
    | 'auth_failed'
    | 'auth_locked'
    | 'unauthorized_admin'
    | 'forbidden_admin'
    | 'rate_limited'
    | 'quota_blocked'
    | 'cors_blocked'
    | 'idor_denied'
    | 'invalid_input';
  status: number;
  route: string;
  ipHash: string;
  actor?: string;
  detail: string;
}

export interface ServerAdminState extends AdminState {
  gateway: ServerAdminGatewayOverride;
  usersAndQuotas: ServerAdminUserQuotaRecord[];
  keyPool: AdminKeyPoolSnapshot;
  totalTokens: TokenCounter;
  securityEvents: AdminSecurityEvent[];
}

interface PersistedAdminData {
  gateway: ServerAdminGatewayOverride;
  telemetryCounters: {
    totalAiRequests: number;
    successfulAiRequests: number;
    fallbackAiRequests: number;
    quotaBlockedRequests: number;
    lastRequestAt: string | null;
  };
  auditLogs: AdminAuditLogEntry[];
  changelog: AdminChangelogEntry[];
  securityEvents: AdminSecurityEvent[];
}

const serverStartTimeMs = Date.now();
let memoryAdmin: PersistedAdminData | null = null;
let adminHydrated = false;
const pendingPreHydrationEvents: AdminSecurityEvent[] = [];

function getDefaultGateway(): ServerAdminGatewayOverride {
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
    dailyUserLimit: MAX_STANDARD_TURNS,
    dailyIpLimit: DEFAULT_DAILY_IP_LIMIT,
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
    securityEvents: [],
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
  let securityEvents = defaults.securityEvents;
  let hasGateway = false;
  let hasTelemetry = false;

  for (const row of configRows) {
    if (row.key === 'gateway' && row.value && typeof row.value === 'object') {
      gateway = { ...defaults.gateway, ...(row.value as Partial<ServerAdminGatewayOverride>) };
      hasGateway = true;
    } else if (row.key === 'telemetryCounters' && row.value && typeof row.value === 'object') {
      telemetryCounters = {
        ...defaults.telemetryCounters,
        ...(row.value as Partial<PersistedAdminData['telemetryCounters']>),
      };
      hasTelemetry = true;
    } else if (row.key === 'securityEvents' && Array.isArray(row.value)) {
      securityEvents = (row.value as AdminSecurityEvent[]).slice(0, 200);
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

  adminHydrated = true;
  const queued = pendingPreHydrationEvents.splice(0);
  if (queued.length > 0) {
    const seen = new Set<string>();
    const merged: AdminSecurityEvent[] = [];
    for (const evt of [...queued, ...securityEvents]) {
      if (seen.has(evt.id)) continue;
      seen.add(evt.id);
      merged.push(evt);
      if (merged.length >= 200) break;
    }
    securityEvents = merged;
  }

  memoryAdmin = {
    gateway,
    telemetryCounters,
    auditLogs,
    changelog,
    securityEvents,
  };
  if (queued.length > 0) {
    enqueueWrite(
      sbUpsert(
        'ff_admin_config',
        [
          {
            key: 'securityEvents',
            value: memoryAdmin.securityEvents,
            updated_at: new Date().toISOString(),
          },
        ],
        'key'
      )
    );
  }
});

function ensureAdminData(): PersistedAdminData {
  if (memoryAdmin) return memoryAdmin;
  if (!isSupabaseEnabled()) {
    const persisted = readLocalSection<Partial<PersistedAdminData> | null>('adminStore', null);
    if (persisted && persisted.gateway && persisted.telemetryCounters) {
      const defaults = buildDefaultAdminData();
      memoryAdmin = {
        gateway: { ...defaults.gateway, ...persisted.gateway },
        telemetryCounters: { ...defaults.telemetryCounters, ...persisted.telemetryCounters },
        auditLogs: Array.isArray(persisted.auditLogs) ? persisted.auditLogs : defaults.auditLogs,
        changelog: Array.isArray(persisted.changelog) ? persisted.changelog : defaults.changelog,
        securityEvents: Array.isArray(persisted.securityEvents) ? persisted.securityEvents.slice(0, 200) : [],
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

setQuotaPolicyProvider(() => {
  const gw = ensureAdminData().gateway;
  return {
    dailyUserLimit: gw.dailyUserLimit ?? gw.standardTurnLimit ?? MAX_STANDARD_TURNS,
    dailyIpLimit: gw.dailyIpLimit ?? DEFAULT_DAILY_IP_LIMIT,
    guestSandboxEnabled: gw.guestSandboxEnabled !== false,
  };
});

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
    detail: sanitizeErrorText(detail),
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

export function recordSecurityEvent(input: {
  type: AdminSecurityEvent['type'];
  status: number;
  route: string;
  ipHash: string;
  actor?: string;
  detail: string;
}): AdminSecurityEvent {
  const event: AdminSecurityEvent = {
    id: `sec-${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString(),
    type: input.type,
    status: input.status,
    route: input.route.slice(0, 120),
    ipHash: input.ipHash.slice(0, 24),
    actor: input.actor ? input.actor.slice(0, 80) : undefined,
    detail: sanitizeErrorText(input.detail),
  };
  if (isSupabaseEnabled() && !adminHydrated) {
    pendingPreHydrationEvents.unshift(event);
    if (pendingPreHydrationEvents.length > 50) {
      pendingPreHydrationEvents.length = 50;
    }
    void ensureHydrated().catch(() => undefined);
    return event;
  }
  const store = ensureAdminData();
  store.securityEvents.unshift(event);
  if (store.securityEvents.length > 200) {
    store.securityEvents = store.securityEvents.slice(0, 200);
  }
  if (isSupabaseEnabled()) {
    enqueueWrite(
      sbUpsert(
        'ff_admin_config',
        [
          {
            key: 'securityEvents',
            value: store.securityEvents,
            updated_at: event.timestamp,
          },
        ],
        'key'
      )
    );
  } else {
    saveAdminData();
  }
  return event;
}

export function getSecurityEvents(limit = 50): AdminSecurityEvent[] {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.round(limit))) : 50;
  return ensureAdminData().securityEvents.slice(0, safeLimit);
}

export function recordAiTelemetry(event: 'success' | 'fallback' | 'quota_blocked'): void {
  const store = ensureAdminData();
  store.telemetryCounters.totalAiRequests += 1;
  store.telemetryCounters.lastRequestAt = new Date().toISOString();
  if (event === 'success') {
    store.telemetryCounters.successfulAiRequests += 1;
  } else if (event === 'fallback') {
    store.telemetryCounters.fallbackAiRequests += 1;
  } else if (event === 'quota_blocked') {
    store.telemetryCounters.quotaBlockedRequests += 1;
  }
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
        ],
        'key'
      )
    );
  } else {
    saveAdminData();
  }
}

export function getInternalGatewayOverride(): ServerAdminGatewayOverride {
  return ensureAdminData().gateway;
}

export function updateGatewayOverride(
  input: Partial<ServerAdminGatewayOverride> & { clearApiKey?: boolean },
  actor: string
): ServerAdminGatewayOverride {
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
  if (input.clearApiKey === true) {
    current.apiKey = '';
    current.hasCustomApiKey = false;
  } else if (typeof input.apiKey === 'string') {
    const trimmedKey = input.apiKey.trim();
    if (trimmedKey) {
      current.apiKey = trimmedKey;
      current.hasCustomApiKey = true;
    } else {
      current.apiKey = '';
      current.hasCustomApiKey = false;
    }
  }
  if (typeof input.systemPromptSuffix === 'string') {
    current.systemPromptSuffix = input.systemPromptSuffix.trim();
  }
  const hasStdTurn = typeof input.standardTurnLimit === 'number' && Number.isFinite(input.standardTurnLimit);
  const hasDailyUser = typeof input.dailyUserLimit === 'number' && Number.isFinite(input.dailyUserLimit);
  if (hasStdTurn) {
    current.standardTurnLimit = Math.max(1, Math.min(500, Math.round(input.standardTurnLimit!)));
    if (!hasDailyUser) {
      current.dailyUserLimit = current.standardTurnLimit;
    }
  }
  if (hasDailyUser) {
    current.dailyUserLimit = Math.max(1, Math.min(500, Math.round(input.dailyUserLimit!)));
    if (!hasStdTurn) {
      current.standardTurnLimit = current.dailyUserLimit;
    }
  }
  if (typeof input.dailyIpLimit === 'number' && Number.isFinite(input.dailyIpLimit)) {
    current.dailyIpLimit = Math.max(1, Math.min(2000, Math.round(input.dailyIpLimit)));
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

export function buildUsersAndQuotasRegistry(): ServerAdminUserQuotaRecord[] {
  const store = ensureAdminData();
  const defaultUserLimit = store.gateway.dailyUserLimit ?? store.gateway.standardTurnLimit ?? MAX_STANDARD_TURNS;
  const defaultIpLimit = store.gateway.dailyIpLimit ?? DEFAULT_DAILY_IP_LIMIT;
  const users = listAllUsers();
  const quotas = listAllQuotaEntries();
  const quotaMap = new Map(quotas.map((q) => [q.subjectId, q]));
  const records: ServerAdminUserQuotaRecord[] = [];
  const seenSubjects = new Set<string>();

  for (const u of users) {
    const prefix = u.role === 'admin' ? 'admin' : 'user';
    const subjectId = `${prefix}:${u.id}`;
    const altSubjectId = u.role === 'admin' ? `user:${u.id}` : `admin:${u.id}`;
    const q = quotaMap.get(subjectId) || quotaMap.get(altSubjectId);
    seenSubjects.add(subjectId);
    seenSubjects.add(altSubjectId);
    const effectiveLimit = u.role === 'admin' ? null : q?.customLimit ?? defaultUserLimit;
    const used = q ? q.used : 0;
    records.push({
      subjectId,
      subjectType: u.role === 'admin' ? 'admin' : 'user',
      kind: 'user',
      username: u.username,
      email: u.email,
      role: u.role,
      used,
      limit: effectiveLimit,
      dailyUsed: used,
      dailyLimit: effectiveLimit,
      unlimited: u.role === 'admin',
      blocked: Boolean(q?.blocked),
      tokensTotal: q ? q.tokensTotal : 0,
      customLimit: q?.customLimit ?? null,
      updatedAt: q ? q.updatedAt : u.createdAt,
    });
  }

  for (const q of quotas) {
    if (seenSubjects.has(q.subjectId)) continue;
    const isIp = q.subjectType === 'ip';
    const isAdmin = q.subjectType === 'admin';
    const normalizedSubjectType: 'guest' | 'user' | 'admin' =
      q.subjectType === 'admin' ? 'admin' : q.subjectType === 'user' ? 'user' : 'guest';
    const effectiveLimit = isAdmin ? null : q.customLimit ?? (isIp ? defaultIpLimit : defaultUserLimit);
    records.push({
      subjectId: q.subjectId,
      subjectType: normalizedSubjectType,
      kind: isIp ? 'ip' : 'user',
      username: q.subjectId,
      role: isAdmin ? 'admin' : 'user',
      used: q.used,
      limit: effectiveLimit,
      dailyUsed: q.used,
      dailyLimit: effectiveLimit,
      ipUsed: isIp ? q.used : undefined,
      ipLimit: isIp ? effectiveLimit : undefined,
      unlimited: isAdmin,
      blocked: Boolean(q.blocked),
      tokensTotal: q.tokensTotal,
      customLimit: q.customLimit ?? null,
      updatedAt: q.updatedAt,
    });
  }

  return records;
}

export function adminResetQuota(subjectId: string, actor: string): void {
  resetSubjectQuota(subjectId);
  appendAuditLog(actor, 'RESET_QUOTA', subjectId, `Reset luot su dung AI ve 0 cho ${subjectId}`);
}

export function resolveAdminQuotaSubjectId(rawSubjectId: string, kind?: unknown): string {
  const clean = rawSubjectId.trim();
  if (!clean) return clean;
  if (
    clean.startsWith('user:') ||
    clean.startsWith('admin:') ||
    clean.startsWith('guest:') ||
    clean.startsWith('ip:')
  ) {
    return clean;
  }
  if (kind === 'ip') return `ip:${clean}`;
  if (kind === 'guest') return `guest:${clean}`;
  const matchedUser = listAllUsers().find((u) => u.id === clean);
  if (matchedUser) {
    return `${matchedUser.role === 'admin' ? 'admin' : 'user'}:${matchedUser.id}`;
  }
  if (kind === 'user') return `user:${clean}`;
  const quotas = listAllQuotaEntries();
  for (const prefix of ['user:', 'ip:', 'guest:']) {
    if (quotas.some((q) => q.subjectId === `${prefix}${clean}`)) {
      return `${prefix}${clean}`;
    }
  }
  return clean;
}

export function adminUpdateQuotaControl(
  input: {
    subjectId: string;
    kind?: 'user' | 'ip' | 'guest';
    customLimit?: number | null;
    blocked?: boolean;
    reset?: boolean;
  },
  actor: string
): void {
  const resolvedSubjectId = resolveAdminQuotaSubjectId(input.subjectId, input.kind);
  const updated = updateSubjectQuotaControl({
    subjectId: resolvedSubjectId,
    customLimit: input.customLimit,
    blocked: input.blocked,
    reset: input.reset,
  });
  appendAuditLog(
    actor,
    'UPDATE_QUOTA_CONTROL',
    updated.subjectId,
    `Quota control: used=${updated.used}, customLimit=${updated.customLimit ?? 'default'}, blocked=${Boolean(updated.blocked)}`
  );
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

export function getAdminStateSnapshot(): ServerAdminState {
  const store = ensureAdminData();
  const community = getCommunityState(true);
  const users = listAllUsers();
  const quotas = listAllQuotaEntries();
  const pendingReports = community.reports.filter((r) => r.status === 'pending').length;
  const activeModel = store.gateway.enabled ? store.gateway.model : process.env.AI_MODEL || store.gateway.model;
  const activeProtocol = store.gateway.enabled
    ? store.gateway.protocol
    : process.env.AI_PROTOCOL || store.gateway.protocol;
  const keyPool = getKeyPoolSnapshot(activeModel, activeProtocol);

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
    auditLogs: store.auditLogs,
    changelog: store.changelog,
    keyPool,
    totalTokens: keyPool.totalTokens,
    securityEvents: store.securityEvents,
  };
}
