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

export type KeySlotStatus = 'active' | 'cooldown' | 'disabled' | 'error';

export interface TokenCounter {
  prompt: number;
  completion: number;
  total: number;
}

export interface KeyPoolSlotSnapshot {
  id: string;
  mask: string;
  status: KeySlotStatus;
  cooldownUntil: string | null;
  requests: number;
  failovers: number;
  lastError: string | null;
  tokens: TokenCounter;
}

export interface SharedAccountQuotaSnapshot {
  dailyLimit: number;
  dailyUsed: number;
  rpmLimit: number;
  rpmUsed: number;
  remaining: number;
  dateKey: string;
}

export interface AdminKeyPoolSnapshot {
  provider: string;
  model: string;
  parentAccountLabel: string;
  sharedAccountQuota: SharedAccountQuotaSnapshot;
  keys: KeyPoolSlotSnapshot[];
  totalTokens: TokenCounter;
}

export interface PoolCandidate {
  id: string;
  mask: string;
  rawKey: string;
}

interface PersistedKeyPoolData {
  dateKey: string;
  dailyUsed: number;
  slots: Record<string, KeyPoolSlotSnapshot>;
}

interface RuntimeSlot {
  snapshot: KeyPoolSlotSnapshot;
  rawKey: string;
  cooldownMs: number;
}

const RPM_WINDOW_MS = 60_000;
let rrCursor = 0;
let lastEnvSignature = '';
let runtimeSlots: RuntimeSlot[] = [];
let persistedCache: PersistedKeyPoolData | null = null;
let rpmTimestamps: number[] = [];

export function sanitizeErrorText(raw: string): string {
  return raw
    .replace(/AQ\.[a-zA-Z0-9_-]{10,}/g, 'AQ.[REDACTED]')
    .replace(/sk-[a-zA-Z0-9_-]{8,}/g, 'sk-[REDACTED]')
    .replace(/AIza[a-zA-Z0-9_-]{10,}/g, 'AIza[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]')
    .slice(0, 280);
}

export function maskApiKey(raw: string): string {
  const clean = raw.trim();
  if (!clean) return '';
  if (clean.startsWith('AQ.') && clean.length > 8) {
    return `AQ.***${clean.slice(-5)}`;
  }
  if (clean.length > 8) {
    return `${clean.slice(0, 3)}***${clean.slice(-4)}`;
  }
  return '***';
}

function getUtcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function emptyTokens(): TokenCounter {
  return { prompt: 0, completion: 0, total: 0 };
}

function ensurePersistedState(): PersistedKeyPoolData {
  const today = getUtcDayKey();
  if (!persistedCache) {
    if (!isSupabaseEnabled()) {
      const stored = readLocalSection<PersistedKeyPoolData | null>('keyPoolStore', null);
      if (stored && typeof stored === 'object' && stored.slots) {
        persistedCache = {
          dateKey: stored.dateKey === today ? today : today,
          dailyUsed: stored.dateKey === today && typeof stored.dailyUsed === 'number' ? Math.max(0, stored.dailyUsed) : 0,
          slots: stored.slots || {},
        };
      }
    }
    if (!persistedCache) {
      persistedCache = {
        dateKey: today,
        dailyUsed: 0,
        slots: {},
      };
    }
  }
  if (persistedCache.dateKey !== today) {
    persistedCache.dateKey = today;
    persistedCache.dailyUsed = 0;
  }
  return persistedCache;
}

function savePersistedState(): void {
  const state = ensurePersistedState();
  const safeSlots: Record<string, KeyPoolSlotSnapshot> = {};
  for (const slot of runtimeSlots) {
    safeSlots[slot.snapshot.id] = {
      id: slot.snapshot.id,
      mask: slot.snapshot.mask,
      status: slot.snapshot.status,
      cooldownUntil: slot.snapshot.cooldownUntil,
      requests: slot.snapshot.requests,
      failovers: slot.snapshot.failovers,
      lastError: slot.snapshot.lastError,
      tokens: { ...slot.snapshot.tokens },
    };
  }
  state.slots = { ...state.slots, ...safeSlots };
  if (isSupabaseEnabled()) {
    enqueueWrite(
      sbUpsert(
        'ff_admin_config',
        [
          {
            key: 'keyPool',
            value: state,
            updated_at: new Date().toISOString(),
          },
        ],
        'key'
      )
    );
  } else {
    writeLocalSection<PersistedKeyPoolData>('keyPoolStore', state);
  }
}

registerHydrator('keyPool', async () => {
  const rows = await sbSelect<Record<string, unknown>>('ff_admin_config', 'select=*&key=eq.keyPool');
  const row = rows[0];
  if (row && row.value && typeof row.value === 'object') {
    const raw = row.value as Partial<PersistedKeyPoolData>;
    const today = getUtcDayKey();
    persistedCache = {
      dateKey: today,
      dailyUsed: raw.dateKey === today && typeof raw.dailyUsed === 'number' ? Math.max(0, raw.dailyUsed) : 0,
      slots: raw.slots && typeof raw.slots === 'object' ? raw.slots : {},
    };
    lastEnvSignature = '';
    syncPoolKeysFromEnv();
  }
});

function collectEnvKeys(): string[] {
  ensureLocalEnvLoaded();
  const ordered: string[] = [];
  const seen = new Set<string>();
  const add = (val: string | undefined) => {
    const trimmed = (val || '').trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    ordered.push(trimmed);
  };

  add(process.env.AI_API_KEY_1);
  add(process.env.AI_API_KEY_2);
  if (process.env.AI_API_KEYS) {
    for (const part of process.env.AI_API_KEYS.split(',')) {
      add(part);
    }
  }
  if (ordered.length === 0) {
    add(process.env.AI_API_KEY);
  }
  return ordered;
}

function syncPoolKeysFromEnv(): RuntimeSlot[] {
  const keys = collectEnvKeys();
  const signature = keys.join('|');
  if (signature === lastEnvSignature && runtimeSlots.length === keys.length) {
    return runtimeSlots;
  }
  lastEnvSignature = signature;
  const persisted = ensurePersistedState();
  const now = Date.now();

  runtimeSlots = keys.map((rawKey, index) => {
    const id = `key-${index + 1}`;
    const mask = maskApiKey(rawKey);
    const prev = persisted.slots[id];
    if (prev && prev.mask === mask) {
      const cdMs = prev.cooldownUntil ? Date.parse(prev.cooldownUntil) : 0;
      const expired = !Number.isFinite(cdMs) || cdMs <= now;
      return {
        rawKey,
        cooldownMs: expired ? 0 : cdMs,
        snapshot: {
          id,
          mask,
          status: prev.status === 'disabled' ? 'disabled' : expired ? 'active' : prev.status,
          cooldownUntil: expired ? null : prev.cooldownUntil,
          requests: Math.max(0, prev.requests || 0),
          failovers: Math.max(0, prev.failovers || 0),
          lastError: prev.lastError ? sanitizeErrorText(prev.lastError) : null,
          tokens: {
            prompt: Math.max(0, prev.tokens?.prompt || 0),
            completion: Math.max(0, prev.tokens?.completion || 0),
            total: Math.max(0, prev.tokens?.total || 0),
          },
        },
      };
    }
    return {
      rawKey,
      cooldownMs: 0,
      snapshot: {
        id,
        mask,
        status: 'active',
        cooldownUntil: null,
        requests: 0,
        failovers: 0,
        lastError: null,
        tokens: emptyTokens(),
      },
    };
  });

  return runtimeSlots;
}

function pruneCooldownsAndRpm(): void {
  const now = Date.now();
  rpmTimestamps = rpmTimestamps.filter((ts) => now - ts < RPM_WINDOW_MS);
  for (const slot of runtimeSlots) {
    if (slot.snapshot.status !== 'disabled' && slot.cooldownMs > 0 && slot.cooldownMs <= now) {
      slot.cooldownMs = 0;
      slot.snapshot.status = 'active';
      slot.snapshot.cooldownUntil = null;
    }
  }
}

export function isFailoverHttpStatus(status: number): boolean {
  return status === 429 || status === 401 || status === 403 || status >= 500;
}

export function hasConfiguredPoolKeys(): boolean {
  return syncPoolKeysFromEnv().length > 0;
}

export function checkSharedPoolQuota(): {
  allowed: boolean;
  reason?: 'daily_limit' | 'rpm_limit';
  snapshot: SharedAccountQuotaSnapshot;
} {
  syncPoolKeysFromEnv();
  const state = ensurePersistedState();
  pruneCooldownsAndRpm();

  const dailyLimit = clampInt(process.env.AI_ACCOUNT_DAILY_LIMIT, 1500, 1, 1_000_000);
  const rpmLimit = clampInt(process.env.AI_ACCOUNT_RPM_LIMIT, 30, 1, 10_000);
  const snapshot: SharedAccountQuotaSnapshot = {
    dailyLimit,
    dailyUsed: state.dailyUsed,
    rpmLimit,
    rpmUsed: rpmTimestamps.length,
    remaining: Math.max(0, dailyLimit - state.dailyUsed),
    dateKey: state.dateKey,
  };

  if (state.dailyUsed >= dailyLimit) {
    return { allowed: false, reason: 'daily_limit', snapshot };
  }
  if (rpmTimestamps.length >= rpmLimit) {
    return { allowed: false, reason: 'rpm_limit', snapshot };
  }
  return { allowed: true, snapshot };
}

export function selectPoolCandidates(preferredKeyId?: string): PoolCandidate[] {
  const slots = syncPoolKeysFromEnv();
  ensurePersistedState();
  pruneCooldownsAndRpm();
  if (slots.length === 0) return [];

  if (preferredKeyId) {
    const match = slots.find((s) => s.snapshot.id === preferredKeyId && s.snapshot.status !== 'disabled');
    if (match) {
      return [{ id: match.snapshot.id, mask: match.snapshot.mask, rawKey: match.rawKey }];
    }
    return [];
  }

  const now = Date.now();
  const enabled = slots.filter((s) => s.snapshot.status !== 'disabled');
  if (enabled.length === 0) return [];

  const startIdx = rrCursor % enabled.length;
  rrCursor = (rrCursor + 1) % 1_000_000;
  const rotated = [...enabled.slice(startIdx), ...enabled.slice(0, startIdx)];
  const active = rotated.filter(
    (s) => s.snapshot.status === 'active' && s.cooldownMs <= now
  );

  return active.map((s) => ({
    id: s.snapshot.id,
    mask: s.snapshot.mask,
    rawKey: s.rawKey,
  }));
}

export interface FailoverSimHandle {
  keyId: string;
  prevStatus: KeySlotStatus;
  prevCooldownMs: number;
  prevCooldownUntil: string | null;
  prevLastError: string | null;
}

export function beginFailoverSim(
  keyId = 'key-1'
): { candidate: PoolCandidate; handle: FailoverSimHandle } | null {
  syncPoolKeysFromEnv();
  const slot = runtimeSlots.find((s) => s.snapshot.id === keyId && s.snapshot.status !== 'disabled');
  if (!slot) return null;
  const handle: FailoverSimHandle = {
    keyId: slot.snapshot.id,
    prevStatus: slot.snapshot.status,
    prevCooldownMs: slot.cooldownMs,
    prevCooldownUntil: slot.snapshot.cooldownUntil,
    prevLastError: slot.snapshot.lastError,
  };
  slot.snapshot.failovers += 1;
  slot.snapshot.status = 'cooldown';
  slot.cooldownMs = Date.now() + 60_000;
  slot.snapshot.cooldownUntil = new Date(slot.cooldownMs).toISOString();
  slot.snapshot.lastError = 'Simulated 429 rate-limit failover probe';
  return {
    candidate: { id: slot.snapshot.id, mask: slot.snapshot.mask, rawKey: slot.rawKey },
    handle,
  };
}

export function endFailoverSim(handle: FailoverSimHandle): void {
  const slot = runtimeSlots.find((s) => s.snapshot.id === handle.keyId);
  if (!slot) return;
  slot.snapshot.status = handle.prevStatus;
  slot.cooldownMs = handle.prevCooldownMs;
  slot.snapshot.cooldownUntil = handle.prevCooldownUntil;
  slot.snapshot.lastError = handle.prevLastError;
  savePersistedState();
}

export function recordPoolAttempt(keyId: string): void {
  syncPoolKeysFromEnv();
  const state = ensurePersistedState();
  const slot = runtimeSlots.find((s) => s.snapshot.id === keyId);
  if (slot) {
    slot.snapshot.requests += 1;
  }
  state.dailyUsed += 1;
  rpmTimestamps.push(Date.now());
  pruneCooldownsAndRpm();
  savePersistedState();
}

export function recordPoolSuccess(keyId: string, tokens?: TokenCounter): void {
  syncPoolKeysFromEnv();
  const slot = runtimeSlots.find((s) => s.snapshot.id === keyId);
  if (!slot) return;
  slot.cooldownMs = 0;
  slot.snapshot.status = 'active';
  slot.snapshot.cooldownUntil = null;
  slot.snapshot.lastError = null;
  if (tokens) {
    slot.snapshot.tokens.prompt += Math.max(0, tokens.prompt || 0);
    slot.snapshot.tokens.completion += Math.max(0, tokens.completion || 0);
    slot.snapshot.tokens.total += Math.max(0, tokens.total || 0);
  }
  savePersistedState();
}

export function recordPoolFailure(
  keyId: string,
  reason: number | 'network',
  errorMessage: string
): void {
  syncPoolKeysFromEnv();
  const slot = runtimeSlots.find((s) => s.snapshot.id === keyId);
  if (!slot) return;

  let cooldownDurationMs = 30_000;
  let nextStatus: KeySlotStatus = 'cooldown';
  if (reason === 429) {
    cooldownDurationMs = 60_000;
    nextStatus = 'cooldown';
  } else if (reason === 401 || reason === 403) {
    cooldownDurationMs = 300_000;
    nextStatus = 'error';
  } else if (reason === 'network' || reason >= 500) {
    cooldownDurationMs = 30_000;
    nextStatus = 'cooldown';
  } else {
    cooldownDurationMs = 15_000;
    nextStatus = 'error';
  }

  slot.snapshot.failovers += 1;
  slot.snapshot.lastError = sanitizeErrorText(errorMessage);
  slot.snapshot.status = nextStatus;
  slot.cooldownMs = Date.now() + cooldownDurationMs;
  slot.snapshot.cooldownUntil = new Date(slot.cooldownMs).toISOString();
  savePersistedState();
}

export function clearPoolSlotCooldown(keyId: string): void {
  syncPoolKeysFromEnv();
  const slot = runtimeSlots.find((s) => s.snapshot.id === keyId);
  if (!slot) return;
  slot.cooldownMs = 0;
  if (slot.snapshot.status !== 'disabled') {
    slot.snapshot.status = 'active';
  }
  slot.snapshot.cooldownUntil = null;
  savePersistedState();
}

export function getKeyPoolSnapshot(modelOverride?: string, protocolOverride?: string): AdminKeyPoolSnapshot {
  syncPoolKeysFromEnv();
  const state = ensurePersistedState();
  pruneCooldownsAndRpm();

  const dailyLimit = clampInt(process.env.AI_ACCOUNT_DAILY_LIMIT, 1500, 1, 1_000_000);
  const rpmLimit = clampInt(process.env.AI_ACCOUNT_RPM_LIMIT, 30, 1, 10_000);
  const parentAccountLabel = (
    process.env.AI_PARENT_ACCOUNT_LABEL || 'Google Cloud Gemini Account'
  ).trim();
  const provider = (protocolOverride || process.env.AI_PROTOCOL || 'gemini').trim();
  const model = (modelOverride || process.env.AI_MODEL || 'gemini-3-flash-preview').trim();

  const keys: KeyPoolSlotSnapshot[] = runtimeSlots.map((s) => ({
    ...s.snapshot,
    tokens: { ...s.snapshot.tokens },
  }));

  const totalTokens = keys.reduce<TokenCounter>(
    (acc, k) => ({
      prompt: acc.prompt + k.tokens.prompt,
      completion: acc.completion + k.tokens.completion,
      total: acc.total + k.tokens.total,
    }),
    emptyTokens()
  );

  return {
    provider,
    model,
    parentAccountLabel,
    sharedAccountQuota: {
      dailyLimit,
      dailyUsed: state.dailyUsed,
      rpmLimit,
      rpmUsed: rpmTimestamps.length,
      remaining: Math.max(0, dailyLimit - state.dailyUsed),
      dateKey: state.dateKey,
    },
    keys,
    totalTokens,
  };
}
