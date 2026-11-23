import fs from 'node:fs';
import path from 'node:path';

export interface SiteMetrics {
  visitors: number;
  activeSeconds: number;
  lastUpdatedAt: string;
}

export interface SiteVisitResult {
  counted: boolean;
  metrics: SiteMetrics;
}

export type HeartbeatError = 'invalid_session' | 'invalid_delta' | 'rate_limited';

export interface SiteHeartbeatResult {
  ok: boolean;
  addedSeconds: number;
  error?: HeartbeatError;
  metrics: SiteMetrics;
}

const VISITORS_BASELINE = 195;
const ACTIVE_SECONDS_BASELINE = 91 * 3600;
const MAX_TRACKED_VISITORS = 5000;
const MAX_TRACKED_SESSIONS = 2000;
const SESSION_WINDOW_MS = 60_000;
const SESSION_WINDOW_LIMIT_SECONDS = 60;
const SESSION_STALE_MS = 10 * 60_000;

interface SessionBucket {
  windowStartMs: number;
  usedSeconds: number;
  lastSeenMs: number;
}

interface MetricsState {
  visitors: number;
  activeSeconds: number;
  lastUpdatedAt: string;
  visitorIds: string[];
  sessions: Record<string, SessionBucket>;
}

const PRIMARY_FILE = path.resolve(process.cwd(), '.data', 'metrics.json');
const FALLBACK_FILE = path.resolve('/tmp', 'fforum_metrics.json');

let memoryState: MetricsState | null = null;

function createDefaultState(): MetricsState {
  return {
    visitors: VISITORS_BASELINE,
    activeSeconds: ACTIVE_SECONDS_BASELINE,
    lastUpdatedAt: new Date().toISOString(),
    visitorIds: [],
    sessions: {},
  };
}

function toSnapshot(state: MetricsState): SiteMetrics {
  return {
    visitors: state.visitors,
    activeSeconds: state.activeSeconds,
    lastUpdatedAt: state.lastUpdatedAt,
  };
}

function parseCount(value: unknown, min: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const normalized = Math.floor(value);
  return normalized >= min ? normalized : null;
}

function normalizeSessions(raw: unknown): Record<string, SessionBucket> {
  if (!raw || typeof raw !== 'object') return {};
  const sessions: Record<string, SessionBucket> = {};
  for (const [sessionId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!sessionId || !value || typeof value !== 'object') continue;
    const bucket = value as Partial<SessionBucket>;
    if (typeof bucket.windowStartMs !== 'number' || !Number.isFinite(bucket.windowStartMs)) continue;
    if (typeof bucket.lastSeenMs !== 'number' || !Number.isFinite(bucket.lastSeenMs)) continue;
    if (typeof bucket.usedSeconds !== 'number' || !Number.isFinite(bucket.usedSeconds)) continue;
    sessions[sessionId] = {
      windowStartMs: bucket.windowStartMs,
      usedSeconds: Math.max(0, Math.min(SESSION_WINDOW_LIMIT_SECONDS, bucket.usedSeconds)),
      lastSeenMs: bucket.lastSeenMs,
    };
  }
  return sessions;
}

function parseState(raw: string): MetricsState | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;
    const visitors = parseCount(parsed.visitors, VISITORS_BASELINE);
    const activeSeconds = parseCount(parsed.activeSeconds, ACTIVE_SECONDS_BASELINE);
    if (visitors === null || activeSeconds === null) return null;
    return {
      visitors,
      activeSeconds,
      lastUpdatedAt:
        typeof parsed.lastUpdatedAt === 'string' && !Number.isNaN(Date.parse(parsed.lastUpdatedAt))
          ? parsed.lastUpdatedAt
          : new Date().toISOString(),
      visitorIds: Array.isArray(parsed.visitorIds)
        ? parsed.visitorIds
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
            .slice(-MAX_TRACKED_VISITORS)
        : [],
      sessions: normalizeSessions(parsed.sessions),
    };
  } catch {
    return null;
  }
}

function readStateFile(filePath: string): MetricsState | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return parseState(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function ensureState(): MetricsState {
  if (memoryState) return memoryState;
  for (const candidate of [PRIMARY_FILE, FALLBACK_FILE]) {
    const parsed = readStateFile(candidate);
    if (parsed) {
      memoryState = parsed;
      return memoryState;
    }
  }
  memoryState = createDefaultState();
  return memoryState;
}

function persistState(state: MetricsState): void {
  const serialized = JSON.stringify(state);
  for (const candidate of [PRIMARY_FILE, FALLBACK_FILE]) {
    try {
      fs.mkdirSync(path.dirname(candidate), { recursive: true });
      fs.writeFileSync(candidate, serialized, 'utf8');
      return;
    } catch {
      continue;
    }
  }
}

function pruneSessions(state: MetricsState, nowMs: number): void {
  const entries = Object.entries(state.sessions).filter(
    ([, bucket]) => nowMs - bucket.lastSeenMs <= SESSION_STALE_MS
  );
  if (entries.length === Object.keys(state.sessions).length) return;

  state.sessions = {};
  if (entries.length <= MAX_TRACKED_SESSIONS) {
    for (const [sessionId, bucket] of entries) state.sessions[sessionId] = bucket;
    return;
  }
  entries.sort((a, b) => b[1].lastSeenMs - a[1].lastSeenMs);
  for (const [sessionId, bucket] of entries.slice(0, MAX_TRACKED_SESSIONS)) {
    state.sessions[sessionId] = bucket;
  }
}

export function getSiteMetrics(): SiteMetrics {
  return toSnapshot(ensureState());
}

export function recordSiteVisit(visitorId: string): SiteVisitResult {
  const state = ensureState();
  const normalizedId = typeof visitorId === 'string' ? visitorId.trim() : '';
  if (!normalizedId) {
    return { counted: false, metrics: toSnapshot(state) };
  }

  const knownVisitors = new Set(state.visitorIds);
  if (knownVisitors.has(normalizedId)) {
    return { counted: false, metrics: toSnapshot(state) };
  }

  knownVisitors.add(normalizedId);
  state.visitorIds = Array.from(knownVisitors).slice(-MAX_TRACKED_VISITORS);
  state.visitors += 1;
  state.lastUpdatedAt = new Date().toISOString();
  persistState(state);
  return { counted: true, metrics: toSnapshot(state) };
}

export function recordSiteHeartbeat(sessionId: string, deltaSeconds: number): SiteHeartbeatResult {
  const state = ensureState();
  const normalizedSession = typeof sessionId === 'string' ? sessionId.trim() : '';
  if (!normalizedSession || normalizedSession.length > 128) {
    return {
      ok: false,
      addedSeconds: 0,
      error: 'invalid_session',
      metrics: toSnapshot(state),
    };
  }

  if (
    typeof deltaSeconds !== 'number' ||
    !Number.isFinite(deltaSeconds) ||
    deltaSeconds < 1 ||
    deltaSeconds > 60
  ) {
    return {
      ok: false,
      addedSeconds: 0,
      error: 'invalid_delta',
      metrics: toSnapshot(state),
    };
  }

  const nowMs = Date.now();
  pruneSessions(state, nowMs);

  const previous = state.sessions[normalizedSession];
  const bucket: SessionBucket =
    !previous || nowMs - previous.windowStartMs >= SESSION_WINDOW_MS
      ? { windowStartMs: nowMs, usedSeconds: 0, lastSeenMs: nowMs }
      : previous;

  if (bucket.usedSeconds + deltaSeconds > SESSION_WINDOW_LIMIT_SECONDS) {
    return {
      ok: false,
      addedSeconds: 0,
      error: 'rate_limited',
      metrics: toSnapshot(state),
    };
  }

  bucket.usedSeconds += deltaSeconds;
  bucket.lastSeenMs = nowMs;
  state.sessions[normalizedSession] = bucket;
  state.activeSeconds += deltaSeconds;
  state.lastUpdatedAt = new Date(nowMs).toISOString();
  persistState(state);
  return { ok: true, addedSeconds: deltaSeconds, metrics: toSnapshot(state) };
}
