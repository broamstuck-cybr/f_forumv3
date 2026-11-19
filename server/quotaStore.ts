import type { QuotaState, User } from '../src/types/index';
import {
  enqueueWrite,
  ensureLocalEnvLoaded,
  isSupabaseEnabled,
  readLocalSection,
  registerHydrator,
  sbSelect,
  sbUpsert,
  writeLocalSection,
} from './persistence';

export {
  ensureLocalEnvLoaded,
  readLocalSection as readPersistedSection,
  writeLocalSection as writePersistedSection,
};

export const MAX_STANDARD_TURNS = 15;

export interface StoredQuotaEntry {
  subjectId: string;
  subjectType: 'guest' | 'user' | 'admin';
  used: number;
  updatedAt: string;
}

interface PersistedQuotaMap {
  quotas: Record<string, StoredQuotaEntry>;
}

const memoryQuotas: Record<string, StoredQuotaEntry> = {};

ensureLocalEnvLoaded();

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
  const rawType = row.subject_type;
  const subjectType: 'guest' | 'user' | 'admin' =
    rawType === 'admin' ? 'admin' : rawType === 'user' ? 'user' : 'guest';
  const used = typeof row.used === 'number' ? row.used : Number(row.used || 0);
  const updatedAt =
    typeof row.updated_at === 'string' && row.updated_at
      ? row.updated_at
      : new Date().toISOString();
  return {
    subjectId,
    subjectType,
    used: Number.isFinite(used) ? Math.max(0, used) : 0,
    updatedAt,
  };
}

registerHydrator('quotas', async () => {
  const rows = await sbSelect<Record<string, unknown>>('ff_quotas', 'select=*');
  for (const row of rows) {
    const parsed = fromQuotaRow(row);
    if (parsed) {
      memoryQuotas[parsed.subjectId] = parsed;
    }
  }
});

function getQuotaMap(): Record<string, StoredQuotaEntry> {
  if (!isSupabaseEnabled()) {
    const persisted = readLocalSection<PersistedQuotaMap>('quotaStore', { quotas: {} });
    for (const [k, v] of Object.entries(persisted.quotas || {})) {
      if (!memoryQuotas[k]) {
        memoryQuotas[k] = v;
      }
    }
  }
  return memoryQuotas;
}

function saveQuotaEntry(entry: StoredQuotaEntry): void {
  if (isSupabaseEnabled()) {
    enqueueWrite(sbUpsert('ff_quotas', [toQuotaRow(entry)], 'subject_id'));
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

export function getQuotaState(user: User | null, guestSessionId: string): QuotaState {
  const { subjectId, subjectType } = resolveSubjectKey(user, guestSessionId);
  const quotas = getQuotaMap();
  const existing = quotas[subjectId];
  const used = existing ? existing.used : 0;
  const updatedAt = existing ? existing.updatedAt : new Date().toISOString();

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
    };
  }

  const remaining = Math.max(0, MAX_STANDARD_TURNS - used);
  return {
    subjectId,
    subjectType,
    used,
    limit: MAX_STANDARD_TURNS,
    remaining,
    unlimited: false,
    exhausted: used >= MAX_STANDARD_TURNS,
    updatedAt,
  };
}

export function consumeQuotaTurn(
  user: User | null,
  guestSessionId: string
): { allowed: boolean; quota: QuotaState } {
  const current = getQuotaState(user, guestSessionId);
  if (!current.unlimited && current.used >= MAX_STANDARD_TURNS) {
    return { allowed: false, quota: current };
  }

  const quotas = getQuotaMap();
  const nextUsed = current.used + 1;
  const now = new Date().toISOString();
  const entry: StoredQuotaEntry = {
    subjectId: current.subjectId,
    subjectType: current.subjectType,
    used: nextUsed,
    updatedAt: now,
  };
  quotas[current.subjectId] = entry;
  saveQuotaEntry(entry);

  return {
    allowed: true,
    quota: getQuotaState(user, guestSessionId),
  };
}

export function resetSubjectQuota(subjectId: string): QuotaState {
  const quotas = getQuotaMap();
  const existing = quotas[subjectId];
  const subjectType = existing
    ? existing.subjectType
    : subjectId.startsWith('admin:')
      ? 'admin'
      : subjectId.startsWith('user:')
        ? 'user'
        : 'guest';
  const now = new Date().toISOString();
  const entry: StoredQuotaEntry = {
    subjectId,
    subjectType,
    used: 0,
    updatedAt: now,
  };
  quotas[subjectId] = entry;
  saveQuotaEntry(entry);

  if (subjectType === 'admin') {
    return {
      subjectId,
      subjectType: 'admin',
      used: 0,
      limit: null,
      remaining: null,
      unlimited: true,
      exhausted: false,
      updatedAt: now,
    };
  }

  return {
    subjectId,
    subjectType,
    used: 0,
    limit: MAX_STANDARD_TURNS,
    remaining: MAX_STANDARD_TURNS,
    unlimited: false,
    exhausted: false,
    updatedAt: now,
  };
}

export function listAllQuotaEntries(): StoredQuotaEntry[] {
  const quotas = getQuotaMap();
  return Object.values(quotas).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
