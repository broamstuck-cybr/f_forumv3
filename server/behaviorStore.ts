import type { BehaviorItemScore, BehaviorSignalType } from '../src/types/workspaceV4';
import {
  enqueueWrite,
  isSupabaseEnabled,
  readLocalSection,
  registerHydrator,
  sbSelect,
  sbUpsert,
  writeLocalSection,
} from './persistence.js';

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_TRACKED_ITEMS = 10_000;
const MAX_DEDUP_ENTRIES = 20_000;

const SIGNAL_WEIGHTS: Record<BehaviorSignalType, number> = {
  view: 1,
  like: 3,
  use: 5,
  publish: 10,
  satisfied: 8,
  unsatisfied: -2,
};

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

export interface BehaviorSignalInput {
  itemId: string;
  library?: string;
  signal: BehaviorSignalType;
  profileTag?: string;
}

interface PersistedBehaviorData {
  scores: Record<string, BehaviorItemScore>;
  dedup: Record<string, number>;
}

let loadedDataDirKey: string | null = null;
let memoryScores: Record<string, BehaviorItemScore> = Object.create(null) as Record<
  string,
  BehaviorItemScore
>;
let memoryDedup: Record<string, number> = Object.create(null) as Record<string, number>;

function getDataDirKey(): string {
  return (process.env.FF_DATA_DIR || '').trim() || '__default__';
}

function isSafeKey(key: string): boolean {
  return key.length > 0 && key.length <= 160 && !RESERVED_PROTOTYPE_KEYS.has(key);
}

export function isValidBehaviorSignal(value: unknown): value is BehaviorSignalType {
  return typeof value === 'string' && Object.hasOwn(SIGNAL_WEIGHTS, value);
}

function normalizeScoreEntry(raw: unknown): BehaviorItemScore | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const score = typeof obj.score === 'number' && Number.isFinite(obj.score) ? Math.round(obj.score) : 0;
  const likes =
    typeof obj.likes === 'number' && Number.isFinite(obj.likes) ? Math.max(0, Math.floor(obj.likes)) : 0;
  const uses =
    typeof obj.uses === 'number' && Number.isFinite(obj.uses) ? Math.max(0, Math.floor(obj.uses)) : 0;
  const publishes =
    typeof obj.publishes === 'number' && Number.isFinite(obj.publishes)
      ? Math.max(0, Math.floor(obj.publishes))
      : 0;
  const updatedAt =
    typeof obj.updatedAt === 'string' && obj.updatedAt
      ? obj.updatedAt
      : typeof obj.updated_at === 'string' && obj.updated_at
        ? obj.updated_at
        : undefined;
  return {
    score,
    likes,
    uses,
    publishes,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

registerHydrator('behaviorStore', async () => {
  const rows = await sbSelect<Record<string, unknown>>(
    'ff_admin_config',
    'select=*&key=eq.behaviorStore'
  );
  const row = rows[0];
  if (!row || !row.value || typeof row.value !== 'object') return;
  const payload = row.value as Partial<PersistedBehaviorData>;
  if (payload.scores && typeof payload.scores === 'object') {
    for (const [itemId, raw] of Object.entries(payload.scores)) {
      if (!isSafeKey(itemId)) continue;
      const parsed = normalizeScoreEntry(raw);
      if (parsed) memoryScores[itemId] = parsed;
    }
  }
  const now = Date.now();
  if (payload.dedup && typeof payload.dedup === 'object') {
    for (const [k, ts] of Object.entries(payload.dedup)) {
      if (!RESERVED_PROTOTYPE_KEYS.has(k) && typeof ts === 'number' && now - ts < DEDUP_WINDOW_MS) {
        memoryDedup[k] = ts;
      }
    }
  }
});

function ensureLoaded(): void {
  if (isSupabaseEnabled()) return;
  const dirKey = getDataDirKey();
  if (loadedDataDirKey !== dirKey) {
    memoryScores = Object.create(null) as Record<string, BehaviorItemScore>;
    memoryDedup = Object.create(null) as Record<string, number>;
    loadedDataDirKey = dirKey;
  }
  const persisted = readLocalSection<PersistedBehaviorData>('behaviorStore', {
    scores: {},
    dedup: {},
  });
  for (const [itemId, raw] of Object.entries(persisted.scores || {})) {
    if (!isSafeKey(itemId) || Object.hasOwn(memoryScores, itemId)) continue;
    const parsed = normalizeScoreEntry(raw);
    if (parsed) memoryScores[itemId] = parsed;
  }
  const now = Date.now();
  for (const [k, ts] of Object.entries(persisted.dedup || {})) {
    if (
      !RESERVED_PROTOTYPE_KEYS.has(k) &&
      !Object.hasOwn(memoryDedup, k) &&
      typeof ts === 'number' &&
      now - ts < DEDUP_WINDOW_MS
    ) {
      memoryDedup[k] = ts;
    }
  }
}

function pruneState(nowMs: number): void {
  const freshDedup: Array<[string, number]> = [];
  for (const [key, ts] of Object.entries(memoryDedup)) {
    if (!RESERVED_PROTOTYPE_KEYS.has(key) && nowMs - ts < DEDUP_WINDOW_MS) {
      freshDedup.push([key, ts]);
    }
  }
  if (freshDedup.length > MAX_DEDUP_ENTRIES) {
    freshDedup.sort((a, b) => b[1] - a[1]);
    freshDedup.length = MAX_DEDUP_ENTRIES;
  }
  memoryDedup = Object.create(null) as Record<string, number>;
  for (const [key, ts] of freshDedup) {
    memoryDedup[key] = ts;
  }

  const scoreKeys = Object.keys(memoryScores);
  if (scoreKeys.length > MAX_TRACKED_ITEMS) {
    const sorted = scoreKeys
      .map((k) => [k, memoryScores[k]] as const)
      .sort((a, b) => Date.parse(b[1].updatedAt || '') - Date.parse(a[1].updatedAt || ''))
      .slice(0, MAX_TRACKED_ITEMS);
    memoryScores = Object.create(null) as Record<string, BehaviorItemScore>;
    for (const [k, v] of sorted) {
      memoryScores[k] = v;
    }
  }
}

function persistBehaviorState(): void {
  const payload: PersistedBehaviorData = {
    scores: memoryScores,
    dedup: memoryDedup,
  };
  if (isSupabaseEnabled()) {
    enqueueWrite(
      sbUpsert(
        'ff_admin_config',
        [{ key: 'behaviorStore', value: payload, updated_at: new Date().toISOString() }],
        'key'
      )
    );
    return;
  }
  writeLocalSection<PersistedBehaviorData>('behaviorStore', payload);
}

export function recordBehaviorSignal(
  input: BehaviorSignalInput,
  actorId: string
): { ok: true; score: number; deduplicated: boolean } | { ok: false; error: string } {
  ensureLoaded();

  const itemId = typeof input.itemId === 'string' ? input.itemId.trim() : '';
  if (!isSafeKey(itemId)) {
    return { ok: false, error: 'itemId không hợp lệ.' };
  }
  if (!isValidBehaviorSignal(input.signal)) {
    return { ok: false, error: 'Loại tín hiệu hành vi không hợp lệ.' };
  }
  if (input.library !== undefined && (typeof input.library !== 'string' || input.library.length > 64)) {
    return { ok: false, error: 'Tên thư viện không hợp lệ.' };
  }
  if (
    input.profileTag !== undefined &&
    (typeof input.profileTag !== 'string' || input.profileTag.length > 80)
  ) {
    return { ok: false, error: 'profileTag không hợp lệ.' };
  }

  const cleanActor = typeof actorId === 'string' ? actorId.trim().slice(0, 128) : '';
  if (!cleanActor) {
    return { ok: false, error: 'Không xác định được phiên người dùng.' };
  }

  const nowMs = Date.now();
  pruneState(nowMs);

  const existing: BehaviorItemScore = Object.hasOwn(memoryScores, itemId)
    ? memoryScores[itemId]
    : { score: 0, likes: 0, uses: 0, publishes: 0 };

  // WHY: 24h anti-spam window per (actorId, itemId, signal) prevents score inflation.
  const dedupKey = `${cleanActor}|${itemId}|${input.signal}`;
  const lastRecordedMs = Object.hasOwn(memoryDedup, dedupKey) ? memoryDedup[dedupKey] : 0;
  if (lastRecordedMs > 0 && nowMs - lastRecordedMs < DEDUP_WINDOW_MS) {
    return { ok: true, score: existing.score, deduplicated: true };
  }

  const weight = SIGNAL_WEIGHTS[input.signal];
  const updated: BehaviorItemScore = {
    score: existing.score + weight,
    likes: existing.likes + (input.signal === 'like' ? 1 : 0),
    uses: existing.uses + (input.signal === 'use' ? 1 : 0),
    publishes: existing.publishes + (input.signal === 'publish' ? 1 : 0),
    updatedAt: new Date(nowMs).toISOString(),
  };

  memoryScores[itemId] = updated;
  memoryDedup[dedupKey] = nowMs;
  persistBehaviorState();

  return { ok: true, score: updated.score, deduplicated: false };
}

export function getBehaviorScores(): Record<string, BehaviorItemScore> {
  ensureLoaded();
  const out: Record<string, BehaviorItemScore> = {};
  for (const [itemId, entry] of Object.entries(memoryScores)) {
    if (!isSafeKey(itemId)) continue;
    out[itemId] = { ...entry };
  }
  return out;
}
