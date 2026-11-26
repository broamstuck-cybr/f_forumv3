import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { User } from '../src/types/index';
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

ensureLocalEnvLoaded();

const SESSION_COOKIE_NAME = 'ff_session';
const GUEST_COOKIE_NAME = 'ff_guest_sid';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface StoredUserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  bio: string;
  createdAt: string;
  tokenVersion?: number;
}

interface PersistedAuthData {
  users: Record<string, StoredUserRecord>;
  revokedTokens?: Record<string, number>;
}

const memoryUsers: Record<string, StoredUserRecord> = Object.create(null) as Record<
  string,
  StoredUserRecord
>;
const memoryRevokedTokens: Record<string, number> = Object.create(null) as Record<string, number>;
let revokedLoaded = false;
const fallbackEphemeralSecret = crypto.randomBytes(32).toString('hex');
let warnedMissingSecret = false;

function isProdCookie(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

function getSessionSecret(): string {
  ensureLocalEnvLoaded();
  const configured = (process.env.SESSION_SECRET || '').trim();
  if (!configured && isProdCookie() && !warnedMissingSecret) {
    warnedMissingSecret = true;
    console.error('[SECURITY] SESSION_SECRET is missing in production environment.');
  }
  return configured || fallbackEphemeralSecret;
}

function toUserRow(rec: StoredUserRecord): Record<string, unknown> {
  return {
    id: rec.id,
    username: rec.username,
    name: rec.name,
    email: rec.email,
    password_hash: rec.passwordHash,
    role: rec.role,
    bio: rec.bio,
    created_at: rec.createdAt,
  };
}

function fromUserRow(row: Record<string, unknown>): StoredUserRecord | null {
  const id = typeof row.id === 'string' ? row.id.trim() : '';
  const username = typeof row.username === 'string' ? row.username.trim() : '';
  const email = typeof row.email === 'string' ? row.email.trim() : '';
  const passwordHash = typeof row.password_hash === 'string' ? row.password_hash : '';
  if (!id || !username || !email || !passwordHash) return null;
  return {
    id,
    username,
    name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : username,
    email,
    passwordHash,
    role: row.role === 'admin' ? 'admin' : 'user',
    bio: typeof row.bio === 'string' ? row.bio : '',
    createdAt:
      typeof row.created_at === 'string' && row.created_at
        ? row.created_at
        : new Date().toISOString(),
  };
}

registerHydrator('users', async () => {
  const [rows, revokedRows] = await Promise.all([
    sbSelect<Record<string, unknown>>('ff_users', 'select=*'),
    sbSelect<Record<string, unknown>>('ff_admin_config', 'select=*&key=eq.revokedTokens'),
  ]);
  for (const row of rows) {
    const parsed = fromUserRow(row);
    if (parsed) {
      memoryUsers[parsed.id] = parsed;
    }
  }
  const revRow = revokedRows[0];
  if (revRow && revRow.value && typeof revRow.value === 'object') {
    const now = Date.now();
    for (const [k, exp] of Object.entries(revRow.value as Record<string, unknown>)) {
      if (typeof exp === 'number' && exp > now) {
        memoryRevokedTokens[k] = exp;
      }
    }
  }
  revokedLoaded = true;
});

function getUsersMap(): Record<string, StoredUserRecord> {
  if (!isSupabaseEnabled()) {
    const persisted = readLocalSection<PersistedAuthData>('authStore', { users: {} });
    for (const [id, rec] of Object.entries(persisted.users || {})) {
      if (!Object.hasOwn(memoryUsers, id)) {
        memoryUsers[id] = rec;
      }
    }
    if (!revokedLoaded && persisted.revokedTokens && typeof persisted.revokedTokens === 'object') {
      const now = Date.now();
      for (const [k, exp] of Object.entries(persisted.revokedTokens)) {
        if (typeof exp === 'number' && exp > now) {
          memoryRevokedTokens[k] = exp;
        }
      }
      revokedLoaded = true;
    }
  }
  return memoryUsers;
}

function getRevokedTokensMap(): Record<string, number> {
  getUsersMap();
  const now = Date.now();
  for (const [k, exp] of Object.entries(memoryRevokedTokens)) {
    if (exp <= now) {
      delete memoryRevokedTokens[k];
    }
  }
  return memoryRevokedTokens;
}

function hashTokenForRevocation(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex').slice(0, 32);
}

function saveRevokedTokens(): void {
  const map = getRevokedTokensMap();
  if (isSupabaseEnabled()) {
    enqueueWrite(
      sbUpsert(
        'ff_admin_config',
        [{ key: 'revokedTokens', value: map, updated_at: new Date().toISOString() }],
        'key'
      )
    );
    return;
  }
  writeLocalSection<PersistedAuthData>('authStore', {
    users: memoryUsers,
    revokedTokens: map,
  });
}

function saveUserRecord(record: StoredUserRecord): void {
  if (isSupabaseEnabled()) {
    enqueueWrite(sbUpsert('ff_users', [toUserRow(record)], 'id'));
    return;
  }
  writeLocalSection<PersistedAuthData>('authStore', {
    users: memoryUsers,
    revokedTokens: getRevokedTokensMap(),
  });
}

export function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPasswordHash(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex || !/^[0-9a-f]+$/i.test(keyHex) || keyHex.length !== 128) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function safeCompareStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

interface SessionPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  exp: number;
  jti?: string;
  tokenVersion?: number;
}

export function signSessionToken(payload: SessionPayload): string {
  const dataB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(dataB64)
    .digest('base64url');
  return `${dataB64}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [dataB64, sig] = token.split('.');
  if (!dataB64 || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(dataB64)
    .digest('base64url');
  if (!safeCompareStrings(sig, expectedSig)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) continue;
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

function appendSetCookie(res: ServerResponse, cookieValue: string): void {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', [cookieValue]);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing.map(String), cookieValue]);
    return;
  }
  res.setHeader('Set-Cookie', [String(existing), cookieValue]);
}

export function setAuthCookies(res: ServerResponse, user: User): string {
  const users = getUsersMap();
  const stored = Object.hasOwn(users, user.id) ? users[user.id] : undefined;
  const token = signSessionToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    jti: crypto.randomBytes(8).toString('hex'),
    tokenVersion: stored?.tokenVersion ?? 0,
  });
  const secureFlag = isProdCookie() ? '; Secure' : '';
  const cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secureFlag}`;
  appendSetCookie(res, cookie);
  return token;
}

export function extractRequestSessionToken(req: IncomingMessage): string {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  const bearerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
  return cookies[SESSION_COOKIE_NAME] || bearerToken;
}

export function revokeSessionFromRequest(req: IncomingMessage): void {
  const rawToken = extractRequestSessionToken(req);
  if (!rawToken) return;
  const payload = verifySessionToken(rawToken);
  if (!payload) return;
  const revoked = getRevokedTokensMap();
  const tokenKey = payload.jti || hashTokenForRevocation(rawToken);
  revoked[tokenKey] = payload.exp;
  saveRevokedTokens();
}

export function clearAuthCookies(res: ServerResponse): void {
  const secureFlag = isProdCookie() ? '; Secure' : '';
  const cookie = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`;
  appendSetCookie(res, cookie);
}

export function resolveTrustProxy(): number | false {
  const raw = (process.env.TRUST_PROXY || '').trim().toLowerCase();
  if (raw === '0' || raw === 'false') return false;
  if (raw === '1' || raw === 'true') return 1;
  const hops = Number(raw);
  if (Number.isInteger(hops) && hops > 0 && hops <= 10) return hops;
  if (process.env.VERCEL === '1') return 1;
  if (process.env.NODE_ENV === 'test') return 1;
  return false;
}

export function getClientIp(req: IncomingMessage): string {
  if (process.env.VERCEL === '1') {
    const vercelHeader = req.headers['x-vercel-forwarded-for'];
    const rawVercel = Array.isArray(vercelHeader) ? vercelHeader[0] : vercelHeader;
    const cleanVercel = typeof rawVercel === 'string' ? rawVercel.split(',')[0].trim() : '';
    if (cleanVercel) return cleanVercel;
  }

  const trustProxy = resolveTrustProxy();
  if (trustProxy !== false) {
    const expressIp = (req as { ip?: string }).ip;
    if (expressIp && expressIp.trim()) return expressIp.trim();

    if (process.env.NODE_ENV === 'test') {
      const forwarded = req.headers['x-forwarded-for'];
      const rawForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const cleanForwarded = typeof rawForwarded === 'string' ? rawForwarded.split(',')[0].trim() : '';
      if (cleanForwarded) return cleanForwarded;
    }
  }

  return (req.socket?.remoteAddress || '127.0.0.1').trim();
}

export function getClientIpHash(req: IncomingMessage): string {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(`ip:${getClientIp(req)}`)
    .digest('hex')
    .slice(0, 24);
}

function signGuestId(gid: string, ipHash: string): string {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(`guest:${gid}:${ipHash}`)
    .digest('hex')
    .slice(0, 24);
}

export function resolveGuestSessionId(req: IncomingMessage, res?: ServerResponse): string {
  const cookies = parseCookies(req.headers.cookie);
  const ipHash = getClientIpHash(req);
  const rawCookie = cookies[GUEST_COOKIE_NAME];
  if (rawCookie && rawCookie.includes('.')) {
    const [gid, sig] = rawCookie.split('.');
    if (gid && sig && /^[a-f0-9]{16,32}$/i.test(gid)) {
      const expected = signGuestId(gid, ipHash);
      if (safeCompareStrings(sig, expected)) {
        return gid;
      }
    }
  }
  const gid = ipHash;
  const sig = signGuestId(gid, ipHash);
  if (res) {
    const secureFlag = isProdCookie() ? '; Secure' : '';
    const cookie = `${GUEST_COOKIE_NAME}=${encodeURIComponent(`${gid}.${sig}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secureFlag}`;
    appendSetCookie(res, cookie);
  }
  return gid;
}

export type SafeClientUser = Omit<User, 'email' | 'scopedClubIds'>;

export function toSafeClientUser(user: User): SafeClientUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
    level: user.level,
    xp: user.xp,
  };
}

function toPublicUser(rec: StoredUserRecord): User {
  return {
    id: rec.id,
    username: rec.username,
    name: rec.name,
    email: rec.email,
    role: rec.role,
    bio: rec.bio,
    createdAt: rec.createdAt,
    level: rec.role === 'admin' ? 99 : 1,
    xp: rec.role === 'admin' ? 9900 : 100,
    scopedClubIds: [],
  };
}

export function getEnvAdminUser(): User {
  ensureLocalEnvLoaded();
  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
  return {
    id: 'sys-admin-root',
    username: adminUsername,
    name: 'System Administrator',
    email: adminUsername.includes('@') ? adminUsername : `${adminUsername}@fforum.local`,
    role: 'admin',
    bio: 'System Administrator & Runtime Controller',
    createdAt: '2026-11-19T00:00:00.000Z',
    level: 99,
    xp: 9900,
    scopedClubIds: [],
  };
}

export function getAuthenticatedUser(req: IncomingMessage): User | null {
  const rawToken = extractRequestSessionToken(req);
  if (!rawToken) return null;

  const payload = verifySessionToken(rawToken);
  if (!payload) return null;

  const revoked = getRevokedTokensMap();
  const tokenKey = payload.jti || hashTokenForRevocation(rawToken);
  if (Object.hasOwn(revoked, tokenKey)) {
    return null;
  }

  if (payload.userId === 'sys-admin-root' && payload.role === 'admin') {
    return getEnvAdminUser();
  }

  const users = getUsersMap();
  const found = Object.hasOwn(users, payload.userId) ? users[payload.userId] : undefined;
  if (!found) return null;
  if (
    typeof payload.tokenVersion === 'number' &&
    payload.tokenVersion !== (found.tokenVersion ?? 0)
  ) {
    return null;
  }
  return toPublicUser(found);
}

export function registerStandardUser(input: {
  username: string;
  email: string;
  password: string;
  name?: string;
}): { ok: true; user: User } | { ok: false; error: string } {
  const username = (input.username || '').trim().toLowerCase();
  const email = (input.email || '').trim().toLowerCase();
  const password = input.password || '';
  const name = (input.name || input.username || '').trim();

  if (username.length < 3 || username.length > 40 || !/^[a-z0-9_.-]+$/.test(username)) {
    return {
      ok: false,
      error: 'Username phải từ 3 đến 40 ký tự và chỉ gồm chữ thường, số, dấu gạch.',
    };
  }
  if (name.length > 80) {
    return { ok: false, error: 'Tên hiển thị tối đa 80 ký tự.' };
  }
  if (!email.includes('@') || email.length < 5 || email.length > 160) {
    return { ok: false, error: 'Email không hợp lệ.' };
  }
  if (password.length < 6 || password.length > 128) {
    return { ok: false, error: 'Mật khẩu phải từ 6 đến 128 ký tự.' };
  }

  const envAdminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  if (username === envAdminUsername) {
    return { ok: false, error: 'Username này đã được bảo lưu cho quản trị viên hệ thống.' };
  }

  const users = getUsersMap();
  for (const existing of Object.values(users)) {
    if (existing.username.toLowerCase() === username) {
      return { ok: false, error: 'Username đã tồn tại.' };
    }
    if (existing.email.toLowerCase() === email) {
      return { ok: false, error: 'Email đã được đăng ký.' };
    }
  }

  const id = `usr-${crypto.randomBytes(6).toString('hex')}`;
  const record: StoredUserRecord = {
    id,
    username,
    name: name || username,
    email,
    passwordHash: hashPassword(password),
    role: 'user',
    bio: 'Developer trên F-FORUM v3',
    createdAt: new Date().toISOString(),
  };
  users[id] = record;
  saveUserRecord(record);

  return { ok: true, user: toPublicUser(record) };
}

export function loginStandardUser(input: {
  identifier: string;
  password: string;
}): { ok: true; user: User } | { ok: false; error: string } {
  const identifier = (input.identifier || '').trim().toLowerCase();
  const password = input.password || '';
  if (!identifier || !password || identifier.length > 160 || password.length > 128) {
    return { ok: false, error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu hợp lệ.' };
  }

  const users = getUsersMap();
  const matched = Object.values(users).find(
    (u) => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier
  );
  if (!matched || matched.role === 'admin' || !verifyPasswordHash(password, matched.passwordHash)) {
    return { ok: false, error: 'Thông tin đăng nhập không chính xác.' };
  }

  return { ok: true, user: toPublicUser(matched) };
}

export function loginAdminUser(input: {
  username: string;
  password: string;
}): { ok: true; user: User } | { ok: false; error: string } {
  ensureLocalEnvLoaded();
  const username = (input.username || '').trim();
  const password = input.password || '';
  if (!username || !password || username.length > 160 || password.length > 128) {
    return { ok: false, error: 'Thông tin xác thực Admin không hợp lệ.' };
  }
  const expectedUsername = (process.env.ADMIN_USERNAME || '').trim();
  const configuredHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
  const bootstrapPassword = (process.env.ADMIN_BOOTSTRAP_PASSWORD || '').trim();

  if (expectedUsername && username.toLowerCase() === expectedUsername.toLowerCase()) {
    if (configuredHash && verifyPasswordHash(password, configuredHash)) {
      return { ok: true, user: getEnvAdminUser() };
    }
    if (
      process.env.NODE_ENV !== 'production' &&
      !configuredHash &&
      bootstrapPassword &&
      safeCompareStrings(password, bootstrapPassword)
    ) {
      return { ok: true, user: getEnvAdminUser() };
    }
  }

  const users = getUsersMap();
  const promotedAdmin = Object.values(users).find(
    (u) =>
      u.role === 'admin' &&
      (u.username.toLowerCase() === username.toLowerCase() ||
        u.email.toLowerCase() === username.toLowerCase())
  );
  if (promotedAdmin && verifyPasswordHash(password, promotedAdmin.passwordHash)) {
    return { ok: true, user: toPublicUser(promotedAdmin) };
  }

  return { ok: false, error: 'Thông tin xác thực Admin không hợp lệ.' };
}

const LOGIN_LOCKOUT_WINDOW_MS = 15 * 60_000;
const MAX_LOGIN_FAILURE_KEYS = 5000;
const MAX_TIMESTAMPS_PER_KEY = 20;
const MAX_LOCKOUT_IDENTIFIER_LEN = 120;
const loginFailures = new Map<string, number[]>();

function buildLockoutKeys(scope: 'user' | 'admin', ipHash: string, identifier: string): string[] {
  const keys = [`${scope}:ip:${ipHash}`];
  const cleanId = identifier.trim().toLowerCase().slice(0, MAX_LOCKOUT_IDENTIFIER_LEN);
  if (cleanId) keys.push(`${scope}:ip:${ipHash}:id:${cleanId}`);
  return keys;
}

function pruneLoginFailures(now: number): void {
  if (loginFailures.size < MAX_LOGIN_FAILURE_KEYS) return;
  for (const [key, timestamps] of loginFailures.entries()) {
    const fresh = timestamps.filter((ts) => now - ts < LOGIN_LOCKOUT_WINDOW_MS);
    if (fresh.length === 0) {
      loginFailures.delete(key);
    } else {
      loginFailures.set(key, fresh.slice(-MAX_TIMESTAMPS_PER_KEY));
    }
  }
  if (loginFailures.size >= MAX_LOGIN_FAILURE_KEYS) {
    for (const oldestKey of loginFailures.keys()) {
      loginFailures.delete(oldestKey);
      if (loginFailures.size < MAX_LOGIN_FAILURE_KEYS) break;
    }
  }
}

export function getLoginFailuresSizeForTest(): number {
  return loginFailures.size;
}

export function checkLoginLockout(
  scope: 'user' | 'admin',
  ipHash: string,
  identifier: string
): { locked: boolean; retryAfterSec: number } {
  const maxFailures = scope === 'admin' ? 5 : 10;
  const now = Date.now();
  const keys = buildLockoutKeys(scope, ipHash, identifier);

  let maxRetrySec = 0;
  let locked = false;
  for (const key of keys) {
    const list = (loginFailures.get(key) || [])
      .filter((ts) => now - ts < LOGIN_LOCKOUT_WINDOW_MS)
      .slice(-MAX_TIMESTAMPS_PER_KEY);
    if (list.length === 0) {
      loginFailures.delete(key);
    } else {
      loginFailures.set(key, list);
    }
    if (list.length >= maxFailures) {
      locked = true;
      const oldest = list[0] || now;
      maxRetrySec = Math.max(maxRetrySec, Math.ceil((oldest + LOGIN_LOCKOUT_WINDOW_MS - now) / 1000));
    }
  }
  return { locked, retryAfterSec: maxRetrySec };
}

export function recordLoginFailure(
  scope: 'user' | 'admin',
  ipHash: string,
  identifier: string
): void {
  const now = Date.now();
  const keys = buildLockoutKeys(scope, ipHash, identifier);
  for (const key of keys) {
    const list = (loginFailures.get(key) || []).filter((ts) => now - ts < LOGIN_LOCKOUT_WINDOW_MS);
    list.push(now);
    loginFailures.delete(key);
    if (loginFailures.size >= MAX_LOGIN_FAILURE_KEYS) {
      pruneLoginFailures(now);
    }
    loginFailures.set(key, list.slice(-MAX_TIMESTAMPS_PER_KEY));
  }
}

export function clearLoginFailures(
  scope: 'user' | 'admin',
  ipHash: string,
  identifier: string
): void {
  for (const key of buildLockoutKeys(scope, ipHash, identifier)) {
    loginFailures.delete(key);
  }
}

export function listAllUsers(): User[] {
  const users = getUsersMap();
  const list = Object.values(users).map(toPublicUser);
  return [getEnvAdminUser(), ...list];
}

export function toggleUserRole(userId: string): User | null {
  if (userId === 'sys-admin-root') {
    return getEnvAdminUser();
  }
  const users = getUsersMap();
  const target = Object.hasOwn(users, userId) ? users[userId] : undefined;
  if (!target) return null;
  target.role = target.role === 'admin' ? 'user' : 'admin';
  target.tokenVersion = (target.tokenVersion ?? 0) + 1;
  saveUserRecord(target);
  return toPublicUser(target);
}

export function getGoogleClientId(): string {
  ensureLocalEnvLoaded();
  return (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}

export async function verifyGoogleIdToken(
  credential: string
): Promise<
  | { ok: true; email: string; name: string; sub: string; picture?: string }
  | { ok: false; error: string }
> {
  const token = (credential || '').trim();
  if (!token || token.split('.').length !== 3) {
    return { ok: false, error: 'Google ID token không hợp lệ.' };
  }

  const expectedClientId = getGoogleClientId();
  if (!expectedClientId) {
    return {
      ok: false,
      error: 'Máy chủ chưa cấu hình GOOGLE_CLIENT_ID trong biến môi trường.',
    };
  }

  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
      { method: 'GET' }
    );
    if (!response.ok) {
      return { ok: false, error: 'Google từ chối xác minh mã đăng nhập.' };
    }
    const payload = (await response.json()) as Record<string, string | boolean | undefined>;
    const aud = String(payload.aud || '');
    const iss = String(payload.iss || '');
    const email = String(payload.email || '').trim().toLowerCase();
    const sub = String(payload.sub || '').trim();
    const exp = Number(payload.exp || 0);
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';

    if (aud !== expectedClientId) {
      return { ok: false, error: 'Google Client ID không khớp với hệ thống.' };
    }
    if (iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com') {
      return { ok: false, error: 'Nguồn phát hành token Google không hợp lệ.' };
    }
    if (!emailVerified || !email || !sub) {
      return { ok: false, error: 'Tài khoản Google chưa xác minh email.' };
    }
    if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) {
      return { ok: false, error: 'Phiên xác thực Google đã hết hạn, vui lòng thử lại.' };
    }

    const name = String(payload.name || email.split('@')[0] || 'Thành viên Google').trim();
    const picture = typeof payload.picture === 'string' ? payload.picture : undefined;
    return { ok: true, email, name, sub, picture };
  } catch {
    return { ok: false, error: 'Không thể kết nối máy chủ xác minh Google.' };
  }
}

export function loginOrRegisterGoogleUser(profile: {
  email: string;
  name: string;
  sub: string;
  picture?: string;
}): { ok: true; user: User; isNew: boolean } | { ok: false; error: string } {
  const email = profile.email.trim().toLowerCase();
  const users = getUsersMap();
  const existing = Object.values(users).find((u) => u.email.toLowerCase() === email);
  if (existing) {
    if (existing.role === 'admin') {
      return { ok: false, error: 'Tài khoản quản trị phải đăng nhập qua cổng Admin.' };
    }
    if (profile.name && existing.name !== profile.name) {
      existing.name = profile.name;
      saveUserRecord(existing);
    }
    return { ok: true, user: toPublicUser(existing), isNew: false };
  }

  const baseUsername = email
    .split('@')[0]
    .replace(/[^a-z0-9_.-]/gi, '')
    .toLowerCase()
    .slice(0, 20) || 'google_user';
  let username = baseUsername;
  let suffix = 1;
  while (Object.values(users).some((u) => u.username.toLowerCase() === username)) {
    username = `${baseUsername}${suffix++}`;
  }

  const id = `gg-${crypto.createHash('sha256').update(profile.sub).digest('hex').slice(0, 12)}`;
  const record: StoredUserRecord = {
    id,
    username,
    name: profile.name || username,
    email,
    passwordHash: hashPassword(crypto.randomBytes(24).toString('hex')),
    role: 'user',
    bio: 'Thành viên xác thực qua Google trên F-FORUM',
    createdAt: new Date().toISOString(),
  };
  users[id] = record;
  saveUserRecord(record);
  return { ok: true, user: toPublicUser(record), isNew: true };
}
