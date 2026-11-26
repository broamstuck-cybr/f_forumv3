import type { QuotaState, User } from '../src/types/index';
import type { TokenCounter } from './keyPool.js';
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

export {
  ensureLocalEnvLoaded,
  readLocalSection as readPersistedSection,
  writeLocalSection as writePersistedSection,
};

export const MAX_STANDARD_TURNS = 15;
export const DEFAULT_DAILY_IP_LIMIT = 45;

export interface QuotaPolicyConfig {
  dailyUserLimit: number;
  dailyIpLimit: number;
  guestSandboxEnabled: boolean;
}

export interface StoredQuotaEntry {
  subjectId: string;
  subjectType: 'guest' | 'user' | 'admin' | 'ip';
  used: number;
  dayKey: string;
  customLimit?: number | null;
  blocked?: boolean;
  tokensPrompt: number;
  tokensCompletion: number;
  tokensTotal: number;
  updatedAt: string;
}

export interface ServerQuotaState extends QuotaState {
  dailyUsed: number;
  dailyLimit: number | null;
  ipUsed: number;
  ipLimit: number | null;
  resetAt: string;
  role: 'guest' | 'user' | 'admin';
  sandboxEnabled: boolean;
  blocked: boolean;
  tokensTotal: number;
}

interface PersistedQuotaMap {
  quotas: Record<string, StoredQuotaEntry>;
}

const RESERVED_PROTOTYPE_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'toLocaleString',
  'isPrototypeOf',
  'propertyIsEnumerable',
]);

export function isReservedPrototypeKey(rawKey: string): boolean {
  const clean = rawKey.trim();
  if (!clean) return false;
  if (RESERVED_PROTOTYPE_KEYS.has(clean)) return true;
  const colonIdx = clean.indexOf(':');
  if (colonIdx > 0 && RESERVED_PROTOTYPE_KEYS.has(clean.slice(colonIdx + 1))) return true;
  return false;
}

const memoryQuotas: Record<string, StoredQuotaEntry> = Object.create(null) as Record<
  string,
  StoredQuotaEntry
>;

let quotaPolicyProvider: () => QuotaPolicyConfig = () => ({
  dailyUserLimit: MAX_STANDARD_TURNS,
  dailyIpLimit: DEFAULT_DAILY_IP_LIMIT,
  guestSandboxEnabled: true,
});

export function setQuotaPolicyProvider(provider: () => QuotaPolicyConfig): void {
  quotaPolicyProvider = provider;
}

export function getQuotaPolicy(): QuotaPolicyConfig {
  const raw = quotaPolicyProvider();
  return {
    dailyUserLimit: Math.max(1, Math.min(500, Math.round(raw.dailyUserLimit || MAX_STANDARD_TURNS))),
    dailyIpLimit: Math.max(1, Math.min(2000, Math.round(raw.dailyIpLimit || DEFAULT_DAILY_IP_LIMIT))),
    guestSandboxEnabled: raw.guestSandboxEnabled !== false,
  };
}

ensureLocalEnvLoaded();

export function getUtcDayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getNextUtcResetIso(now = new Date()): string {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return next.toISOString();
}

function inferSubjectType(subjectId: string, rawType?: unknown): StoredQuotaEntry['subjectType'] {
  if (rawType === 'admin' || subjectId.startsWith('admin:')) return 'admin';
  if (rawType === 'ip' || subjectId.startsWith('ip:')) return 'ip';
  if (rawType === 'user' || subjectId.startsWith('user:')) return 'user';
  return 'guest';
}

function normalizeQuotaEntry(raw: Partial<StoredQuotaEntry> & { subjectId: string }): StoredQuotaEntry {
  const today = getUtcDayKey();
  const dayKey = typeof raw.dayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dayKey) ? raw.dayKey : today;
  const isSameDay = dayKey === today;
  return {
    subjectId: raw.subjectId,
    subjectType: inferSubjectType(raw.subjectId, raw.subjectType),
    used: isSameDay && typeof raw.used === 'number' && Number.isFinite(raw.used) ? Math.max(0, raw.used) : 0,
    dayKey: today,
    customLimit: typeof raw.customLimit === 'number' && Number.isFinite(raw.customLimit) ? Math.max(1, Math.round(raw.customLimit)) : null,
    blocked: Boolean(raw.blocked),
    tokensPrompt: typeof raw.tokensPrompt === 'number' && Number.isFinite(raw.tokensPrompt) ? Math.max(0, raw.tokensPrompt) : 0,
    tokensCompletion: typeof raw.tokensCompletion === 'number' && Number.isFinite(raw.tokensCompletion) ? Math.max(0, raw.tokensCompletion) : 0,
    tokensTotal: typeof raw.tokensTotal === 'number' && Number.isFinite(raw.tokensTotal) ? Math.max(0, raw.tokensTotal) : 0,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : new Date().toISOString(),
  };
}

function toQuotaRow(entry: StoredQuotaEntry): Record<string, unknown> {
  return {
    subject_id: entry.subjectId,
    subject_type: entry.subjectType,
    used: entry.used,
    updated_at: entry.updatedAt,
  };
}

function fromQuotaRow(row: Record<string, unknown>): StoredQuotaEntry | null {
  const subjectId = typeof row.subject_id === 'string' ? row.subject_id.trim() : '';
  if (!subjectId) return null;
  const used = typeof row.used === 'number' ? row.used : Number(row.used || 0);
  const updatedAt =
    typeof row.updated_at === 'string' && row.updated_at
      ? row.updated_at
      : new Date().toISOString();
  return normalizeQuotaEntry({
    subjectId,
    subjectType: inferSubjectType(subjectId, row.subject_type),
    used,
    dayKey: updatedAt.slice(0, 10),
    updatedAt,
  });
}

registerHydrator('quotas', async () => {
  const [rows, metaRows] = await Promise.all([
    sbSelect<Record<string, unknown>>('ff_quotas', 'select=*'),
    sbSelect<Record<string, unknown>>('ff_admin_config', 'select=*&key=eq.quotaMeta'),
  ]);
  const metaMap =
    metaRows[0] && metaRows[0].value && typeof metaRows[0].value === 'object'
      ? (metaRows[0].value as Record<string, Partial<StoredQuotaEntry>>)
      : {};
  for (const row of rows) {
    const parsed = fromQuotaRow(row);
    if (parsed && !isReservedPrototypeKey(parsed.subjectId)) {
      const meta = Object.hasOwn(metaMap, parsed.subjectId) ? metaMap[parsed.subjectId] : undefined;
      memoryQuotas[parsed.subjectId] = meta
        ? normalizeQuotaEntry({ ...parsed, ...meta, subjectId: parsed.subjectId })
        : parsed;
    }
  }
});

function getQuotaMap(): Record<string, StoredQuotaEntry> {
  if (!isSupabaseEnabled()) {
    const persisted = readLocalSection<PersistedQuotaMap>('quotaStore', { quotas: {} });
    for (const [k, v] of Object.entries(persisted.quotas || {})) {
      if (!k || isReservedPrototypeKey(k)) continue;
      if (!Object.hasOwn(memoryQuotas, k) && v) {
        memoryQuotas[k] = normalizeQuotaEntry({ ...v, subjectId: k });
      }
    }
  }
  const today = getUtcDayKey();
  for (const [k, v] of Object.entries(memoryQuotas)) {
    if (v.dayKey !== today) {
      memoryQuotas[k] = normalizeQuotaEntry(v);
    }
  }
  return memoryQuotas;
}

function saveQuotaEntries(entries: StoredQuotaEntry[]): void {
  if (isSupabaseEnabled()) {
    enqueueWrite(sbUpsert('ff_quotas', entries.map(toQuotaRow), 'subject_id'));
    const metaPayload: Record<string, Partial<StoredQuotaEntry>> = Object.create(null) as Record<
      string,
      Partial<StoredQuotaEntry>
    >;
    for (const [k, v] of Object.entries(memoryQuotas)) {
      if (isReservedPrototypeKey(k)) continue;
      metaPayload[k] = {
        dayKey: v.dayKey,
        customLimit: v.customLimit ?? null,
        blocked: Boolean(v.blocked),
        tokensPrompt: v.tokensPrompt,
        tokensCompletion: v.tokensCompletion,
        tokensTotal: v.tokensTotal,
      };
    }
    enqueueWrite(
      sbUpsert(
        'ff_admin_config',
        [{ key: 'quotaMeta', value: metaPayload, updated_at: new Date().toISOString() }],
        'key'
      )
    );
    return;
  }
  writeLocalSection<PersistedQuotaMap>('quotaStore', { quotas: memoryQuotas });
}

export function resolveSubjectKey(user: User | null, guestSessionId: string): {
  subjectId: string;
  subjectType: 'guest' | 'user' | 'admin';
} {
  if (user && user.role === 'admin') {
    return { subjectId: `admin:${user.id}`, subjectType: 'admin' };
  }
  if (user) {
    return { subjectId: `user:${user.id}`, subjectType: 'user' };
  }
  const cleanGuest = guestSessionId.trim() || 'anonymous-guest';
  return { subjectId: `guest:${cleanGuest}`, subjectType: 'guest' };
}

export function getQuotaState(
  user: User | null,
  guestSessionId: string,
  ipHash?: string
): ServerQuotaState {
  const { subjectId, subjectType } = resolveSubjectKey(user, guestSessionId);
  const quotas = getQuotaMap();
  const policy = getQuotaPolicy();
  const existing = Object.hasOwn(quotas, subjectId) ? quotas[subjectId] : undefined;
  const ipSubjectId = ipHash ? `ip:${ipHash}` : '';
  const ipEntry = ipSubjectId && Object.hasOwn(quotas, ipSubjectId) ? quotas[ipSubjectId] : undefined;
  const used = existing ? existing.used : 0;
  const updatedAt = existing ? existing.updatedAt : new Date().toISOString();
  const resetAt = getNextUtcResetIso();

  if (subjectType === 'admin') {
    return {
      subjectId,
      subjectType: 'admin',
      used,
      limit: null,
      remaining: null,
      unlimited: true,
      exhausted: false,
      updatedAt,
      dailyUsed: used,
      dailyLimit: null,
      ipUsed: ipEntry ? ipEntry.used : 0,
      ipLimit: null,
      resetAt,
      role: 'admin',
      sandboxEnabled: true,
      blocked: false,
      tokensTotal: existing ? existing.tokensTotal : 0,
    };
  }

  const userLimit = existing?.customLimit ?? policy.dailyUserLimit;
  const ipLimit = ipEntry?.customLimit ?? policy.dailyIpLimit;
  const ipUsed = ipEntry ? ipEntry.used : 0;
  const sandboxEnabled = subjectType === 'user' ? true : policy.guestSandboxEnabled;
  const blocked = Boolean(existing?.blocked || ipEntry?.blocked);
  const userRemaining = Math.max(0, userLimit - used);
  const ipRemaining = ipHash ? Math.max(0, ipLimit - ipUsed) : userRemaining;
  const remaining = !sandboxEnabled || blocked ? 0 : Math.min(userRemaining, ipRemaining);
  const exhausted =
    blocked || !sandboxEnabled || used >= userLimit || (Boolean(ipHash) && ipUsed >= ipLimit);

  return {
    subjectId,
    subjectType,
    used,
    limit: userLimit,
    remaining,
    unlimited: false,
    exhausted,
    updatedAt,
    dailyUsed: used,
    dailyLimit: userLimit,
    ipUsed,
    ipLimit,
    resetAt,
    role: subjectType,
    sandboxEnabled,
    blocked,
    tokensTotal: existing ? existing.tokensTotal : 0,
  };
}

export function consumeQuotaTurn(
  user: User | null,
  guestSessionId: string,
  ipHash?: string
): {
  allowed: boolean;
  reason?: 'blocked' | 'sandbox_disabled' | 'user_limit' | 'ip_limit';
  quota: ServerQuotaState;
} {
  const current = getQuotaState(user, guestSessionId, ipHash);
  if (!current.unlimited) {
    if (current.blocked) {
      return { allowed: false, reason: 'blocked', quota: current };
    }
    if (!current.sandboxEnabled) {
      return { allowed: false, reason: 'sandbox_disabled', quota: current };
    }
    if (current.dailyLimit !== null && current.used >= current.dailyLimit) {
      return { allowed: false, reason: 'user_limit', quota: current };
    }
    if (ipHash && current.ipLimit !== null && current.ipUsed >= current.ipLimit) {
      return { allowed: false, reason: 'ip_limit', quota: current };
    }
  }

  const quotas = getQuotaMap();
  const now = new Date().toISOString();
  const today = getUtcDayKey();
  const prevSubject = Object.hasOwn(quotas, current.subjectId) ? quotas[current.subjectId] : undefined;
  const nextSubject = normalizeQuotaEntry({
    ...(prevSubject || {}),
    subjectId: current.subjectId,
    subjectType: current.subjectType,
    used: (prevSubject?.used ?? 0) + 1,
    dayKey: today,
    updatedAt: now,
  });
  quotas[current.subjectId] = nextSubject;

  const updatedEntries = [nextSubject];
  if (ipHash && current.subjectType !== 'admin') {
    const ipSubjectId = `ip:${ipHash}`;
    const prevIp = Object.hasOwn(quotas, ipSubjectId) ? quotas[ipSubjectId] : undefined;
    const nextIp = normalizeQuotaEntry({
      ...(prevIp || {}),
      subjectId: ipSubjectId,
      subjectType: 'ip',
      used: (prevIp?.used ?? 0) + 1,
      dayKey: today,
      updatedAt: now,
    });
    quotas[ipSubjectId] = nextIp;
    updatedEntries.push(nextIp);
  }

  saveQuotaEntries(updatedEntries);

  return {
    allowed: true,
    quota: getQuotaState(user, guestSessionId, ipHash),
  };
}

export function recordQuotaTokens(
  subjectId: string,
  ipHash: string | null | undefined,
  tokens: TokenCounter | undefined
): void {
  if (!tokens || tokens.total <= 0) return;
  const quotas = getQuotaMap();
  const now = new Date().toISOString();
  const today = getUtcDayKey();
  const entriesToSave: StoredQuotaEntry[] = [];

  const applyTokens = (id: string, type: StoredQuotaEntry['subjectType']) => {
    if (isReservedPrototypeKey(id)) return;
    const prev = Object.hasOwn(quotas, id) ? quotas[id] : undefined;
    const next = normalizeQuotaEntry({
      ...(prev || {}),
      subjectId: id,
      subjectType: prev?.subjectType || type,
      used: prev?.used ?? 0,
      dayKey: prev?.dayKey || today,
      tokensPrompt: (prev?.tokensPrompt ?? 0) + Math.max(0, tokens.prompt || 0),
      tokensCompletion: (prev?.tokensCompletion ?? 0) + Math.max(0, tokens.completion || 0),
      tokensTotal: (prev?.tokensTotal ?? 0) + Math.max(0, tokens.total || 0),
      updatedAt: now,
    });
    quotas[id] = next;
    entriesToSave.push(next);
  };

  applyTokens(subjectId, inferSubjectType(subjectId));
  if (ipHash && !subjectId.startsWith('admin:')) {
    applyTokens(`ip:${ipHash}`, 'ip');
  }

  saveQuotaEntries(entriesToSave);
}

export function updateSubjectQuotaControl(input: {
  subjectId: string;
  customLimit?: number | null;
  blocked?: boolean;
  reset?: boolean;
}): StoredQuotaEntry {
  if (isReservedPrototypeKey(input.subjectId)) {
    throw new Error('Invalid reserved subjectId');
  }
  const quotas = getQuotaMap();
  const existing = Object.hasOwn(quotas, input.subjectId) ? quotas[input.subjectId] : undefined;
  const now = new Date().toISOString();
  const today = getUtcDayKey();

  const next = normalizeQuotaEntry({
    ...(existing || {}),
    subjectId: input.subjectId,
    subjectType: existing?.subjectType || inferSubjectType(input.subjectId),
    used: input.reset ? 0 : (existing?.used ?? 0),
    dayKey: today,
    customLimit:
      input.customLimit === null
        ? null
        : typeof input.customLimit === 'number' && Number.isFinite(input.customLimit)
          ? Math.max(1, Math.min(5000, Math.round(input.customLimit)))
          : existing?.customLimit ?? null,
    blocked: typeof input.blocked === 'boolean' ? input.blocked : Boolean(existing?.blocked),
    updatedAt: now,
  });

  quotas[input.subjectId] = next;
  saveQuotaEntries([next]);
  return next;
}

export function resetSubjectQuota(subjectId: string): ServerQuotaState {
  const next = updateSubjectQuotaControl({ subjectId, reset: true });
  const policy = getQuotaPolicy();
  const resetAt = getNextUtcResetIso();

  if (next.subjectType === 'admin') {
    return {
      subjectId,
      subjectType: 'admin',
      used: 0,
      limit: null,
      remaining: null,
      unlimited: true,
      exhausted: false,
      updatedAt: next.updatedAt,
      dailyUsed: 0,
      dailyLimit: null,
      ipUsed: 0,
      ipLimit: null,
      resetAt,
      role: 'admin',
      sandboxEnabled: true,
      blocked: false,
      tokensTotal: next.tokensTotal,
    };
  }

  const limit =
    next.customLimit ??
    (next.subjectType === 'ip' ? policy.dailyIpLimit : policy.dailyUserLimit);

  return {
    subjectId,
    subjectType: next.subjectType === 'ip' ? 'guest' : next.subjectType,
    used: 0,
    limit,
    remaining: next.blocked ? 0 : limit,
    unlimited: false,
    exhausted: Boolean(next.blocked),
    updatedAt: next.updatedAt,
    dailyUsed: 0,
    dailyLimit: limit,
    ipUsed: next.subjectType === 'ip' ? 0 : 0,
    ipLimit: policy.dailyIpLimit,
    resetAt,
    role: next.subjectType === 'user' ? 'user' : 'guest',
    sandboxEnabled: next.subjectType === 'user' ? true : policy.guestSandboxEnabled,
    blocked: Boolean(next.blocked),
    tokensTotal: next.tokensTotal,
  };
}

export function listAllQuotaEntries(): StoredQuotaEntry[] {
  const quotas = getQuotaMap();
  return Object.values(quotas).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
