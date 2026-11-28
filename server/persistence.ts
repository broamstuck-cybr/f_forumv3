import fs from 'node:fs';
import path from 'node:path';

let envLoaded = false;

export function ensureLocalEnvLoaded(): void {
  if (process.env.FF_DISABLE_DOTENV === '1') {
    envLoaded = true;
    return;
  }
  if (envLoaded) return;
  envLoaded = true;
  for (const filename of ['.env', '.env.local']) {
    try {
      const envPath = path.resolve(process.cwd(), filename);
      if (!fs.existsSync(envPath)) continue;
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
      continue;
    }
  }
}

ensureLocalEnvLoaded();

function getSupabaseConfig(): { url: string; key: string } {
  ensureLocalEnvLoaded();
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { url, key };
}

export function isSupabaseEnabled(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && /^https?:\/\//i.test(url));
}

function getRuntimeFilePath(): string {
  const customDir = (process.env.FF_DATA_DIR || '').trim();
  if (customDir) return path.resolve(customDir, 'runtime-state.json');
  return path.resolve(process.cwd(), 'data', 'runtime-state.json');
}

const RESERVED_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'toString',
  'valueOf',
  'hasOwnProperty',
]);

export function readLocalSection<T>(sectionKey: string, fallback: T): T {
  if (!sectionKey || RESERVED_KEYS.has(sectionKey)) return fallback;
  try {
    const filePath = getRuntimeFilePath();
    if (!fs.existsSync(filePath)) return fallback;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && Object.hasOwn(parsed, sectionKey)) {
      return parsed[sectionKey] as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeLocalSection<T>(sectionKey: string, value: T): void {
  if (!sectionKey || RESERVED_KEYS.has(sectionKey)) return;
  try {
    const filePath = getRuntimeFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let existing: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    if (fs.existsSync(filePath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          for (const [k, v] of Object.entries(raw)) {
            if (!RESERVED_KEYS.has(k)) existing[k] = v;
          }
        }
      } catch {
        existing = Object.create(null) as Record<string, unknown>;
      }
    }
    existing[sectionKey] = value;
    const tmpPath = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(existing, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(
      '[persistence] writeLocalSection failed:',
      err instanceof Error ? err.message : String(err)
    );
  }
}

function buildSupabaseHeaders(extra?: Record<string, string>): Record<string, string> {
  const { key } = getSupabaseConfig();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function sbSelect<T = Record<string, unknown>>(
  table: string,
  query = 'select=*'
): Promise<T[]> {
  if (!isSupabaseEnabled()) return [];
  const { url } = getSupabaseConfig();
  const cleanQuery = query.replace(/^\?/, '') || 'select=*';
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}?${cleanQuery}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const resp = await fetch(endpoint, {
        method: 'GET',
        headers: buildSupabaseHeaders(),
      });
      if (!resp.ok) {
        if (attempt === 0 && resp.status >= 500) continue;
        return [];
      }
      const data = (await resp.json()) as unknown;
      return Array.isArray(data) ? (data as T[]) : [];
    } catch {
      if (attempt === 0) continue;
      return [];
    }
  }
  return [];
}

// WHY: Hydration seeders must NEVER overwrite existing Supabase rows if a transient read returns empty.
export async function sbInsertIfMissing(
  table: string,
  rows: unknown,
  onConflict?: string
): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;
  const { url } = getSupabaseConfig();
  const payload = Array.isArray(rows) ? rows : [rows];
  if (payload.length === 0) return true;
  const conflictParam = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : '';
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}${conflictParam}`;
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: buildSupabaseHeaders({
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      }),
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function sbUpsert(
  table: string,
  rows: unknown,
  onConflict?: string
): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;
  const { url } = getSupabaseConfig();
  const payload = Array.isArray(rows) ? rows : [rows];
  if (payload.length === 0) return true;
  const conflictParam = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : '';
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}${conflictParam}`;
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: buildSupabaseHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function sbInsert(table: string, rows: unknown): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;
  const { url } = getSupabaseConfig();
  const payload = Array.isArray(rows) ? rows : [rows];
  if (payload.length === 0) return true;
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}`;
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: buildSupabaseHeaders({
        Prefer: 'return=minimal',
      }),
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function sbPatch(
  table: string,
  filter: string,
  patch: Record<string, unknown>
): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;
  const { url } = getSupabaseConfig();
  const cleanFilter = filter.replace(/^\?/, '');
  if (!cleanFilter) return false;
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}?${cleanFilter}`;
  try {
    const resp = await fetch(endpoint, {
      method: 'PATCH',
      headers: buildSupabaseHeaders({
        Prefer: 'return=minimal',
      }),
      body: JSON.stringify(patch),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function sbDelete(table: string, filter: string): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;
  const { url } = getSupabaseConfig();
  const cleanFilter = filter.replace(/^\?/, '');
  if (!cleanFilter) return false;
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}?${cleanFilter}`;
  try {
    const resp = await fetch(endpoint, {
      method: 'DELETE',
      headers: buildSupabaseHeaders({
        Prefer: 'return=minimal',
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

const pendingWrites = new Set<Promise<unknown>>();

export function enqueueWrite(promise: Promise<unknown>): void {
  const tracked = promise
    .catch(() => undefined)
    .finally(() => {
      pendingWrites.delete(tracked);
    });
  pendingWrites.add(tracked);
}

export async function flushSupabaseWrites(): Promise<void> {
  if (pendingWrites.size === 0) return;
  await Promise.allSettled(Array.from(pendingWrites));
}

const hydrators = new Map<string, () => Promise<void>>();
let lastHydratedAt = 0;
let activeHydration: Promise<void> | null = null;
const HYDRATION_TTL_MS = 10_000;

export function registerHydrator(name: string, fn: () => Promise<void>): void {
  hydrators.set(name, fn);
}

export async function ensureHydrated(force = false): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const now = Date.now();
  if (!force && lastHydratedAt > 0 && now - lastHydratedAt < HYDRATION_TTL_MS) {
    return;
  }
  if (activeHydration) {
    await activeHydration;
    return;
  }
  activeHydration = (async () => {
    try {
      await Promise.all(
        Array.from(hydrators.values()).map(async (fn) => {
          try {
            await fn();
          } catch {
            return;
          }
        })
      );
      lastHydratedAt = Date.now();
    } finally {
      activeHydration = null;
    }
  })();
  await activeHydration;
}
