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
import { listAllUsers, toggleUserRole } from './authEngine';
import { getCommunityState, resolveModerationReport } from './communityStore';
import {
  ensureLocalEnvLoaded,
  listAllQuotaEntries,
  MAX_STANDARD_TURNS,
  readPersistedSection,
  resetSubjectQuota,
  writePersistedSection,
} from './quotaStore';

ensureLocalEnvLoaded();

interface PersistedAdminData {
  gateway: AdminGatewayOverride;
  telemetryCounters: {
    totalAiRequests: number;
    successfulAiRequests: number;
    fallbackAiRequests: number;
    quotaBlockedRequests: number;
    lastRequestAt: string | null;
  };
  auditLogs: AdminAuditLogEntry[];
  changelog: AdminChangelogEntry[];
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
    model: (process.env.AI_MODEL || 'gpt-4o-mini').trim(),
    apiKey: '',
    hasCustomApiKey: false,
    systemPromptSuffix: '',
    standardTurnLimit: MAX_STANDARD_TURNS,
    guestSandboxEnabled: true,
    updatedAt: new Date().toISOString(),
  };
}

function ensureAdminData(): PersistedAdminData {
  if (memoryAdmin) return memoryAdmin;
  const persisted = readPersistedSection<PersistedAdminData | null>('adminStore', null);
  if (persisted && persisted.gateway && persisted.telemetryCounters) {
    memoryAdmin = persisted;
    return memoryAdmin;
  }

  memoryAdmin = {
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
  };
  writePersistedSection('adminStore', memoryAdmin);
  return memoryAdmin;
}

function saveAdminData(): void {
  if (!memoryAdmin) return;
  writePersistedSection('adminStore', memoryAdmin);
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
  saveAdminData();
  return entry;
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
  saveAdminData();
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
  saveAdminData();

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
  saveAdminData();
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
  };
}
