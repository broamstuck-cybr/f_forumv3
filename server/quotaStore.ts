import fs from 'node:fs';
import path from 'node:path';
import type { QuotaState, User } from '../src/types/index';

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
let envLoaded = false;

export function ensureLocalEnvLoaded(): void {
  if (envLoaded) return;
  envLoaded = true;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    return;
  }
}

ensureLocalEnvLoaded();

function getRuntimeFilePath(): string {
  return path.resolve(process.cwd(), 'data', 'runtime-state.json');
}

export function readPersistedSection<T>(sectionKey: string, fallback: T): T {
  try {
    const filePath = getRuntimeFilePath();
    if (!fs.existsSync(filePath)) return fallback;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && sectionKey in parsed) {
      return parsed[sectionKey] as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writePersistedSection<T>(sectionKey: string, value: T): void {
  try {
    const filePath = getRuntimeFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let existing: Record<string, unknown> = {};
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
      } catch {
        existing = {};
      }
    }
    existing[sectionKey] = value;
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf8');
  } catch {
    return;
  }
}

function getQuotaMap(): Record<string, StoredQuotaEntry> {
  const persisted = readPersistedSection<PersistedQuotaMap>('quotaStore', { quotas: {} });
  for (const [k, v] of Object.entries(persisted.quotas || {})) {
    if (!memoryQuotas[k]) {
      memoryQuotas[k] = v;
    }
  }
  return memoryQuotas;
}

function saveQuotaMap(): void {
  writePersistedSection<PersistedQuotaMap>('quotaStore', { quotas: memoryQuotas });
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
  quotas[current.subjectId] = {
    subjectId: current.subjectId,
    subjectType: current.subjectType,
    used: nextUsed,
    updatedAt: now,
  };
  saveQuotaMap();

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
  quotas[subjectId] = {
    subjectId,
    subjectType,
    used: 0,
    updatedAt: now,
  };
  saveQuotaMap();

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
