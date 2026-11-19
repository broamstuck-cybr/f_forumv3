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
} from './persistence';

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
}

interface PersistedAuthData {
  users: Record<string, StoredUserRecord>;
}

const memoryUsers: Record<string, StoredUserRecord> = {};
const fallbackEphemeralSecret = crypto.randomBytes(32).toString('hex');

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
  const rows = await sbSelect<Record<string, unknown>>('ff_users', 'select=*');
  for (const row of rows) {
    const parsed = fromUserRow(row);
    if (parsed) {
      memoryUsers[parsed.id] = parsed;
    }
  }
});

function getSessionSecret(): string {
  ensureLocalEnvLoaded();
  return process.env.SESSION_SECRET || fallbackEphemeralSecret;
}

function getUsersMap(): Record<string, StoredUserRecord> {
  if (!isSupabaseEnabled()) {
    const persisted = readLocalSection<PersistedAuthData>('authStore', { users: {} });
    for (const [id, rec] of Object.entries(persisted.users || {})) {
      if (!memoryUsers[id]) {
        memoryUsers[id] = rec;
      }
    }
  }
  return memoryUsers;
}

function saveUserRecord(record: StoredUserRecord): void {
  if (isSupabaseEnabled()) {
    enqueueWrite(sbUpsert('ff_users', [toUserRow(record)], 'id'));
    return;
  }
  writeLocalSection<PersistedAuthData>('authStore', { users: memoryUsers });
}

export function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPasswordHash(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
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
    if (k) out[k] = decodeURIComponent(v);
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
  const token = signSessionToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  });
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secureFlag}`;
  appendSetCookie(res, cookie);
  return token;
}

export function clearAuthCookies(res: ServerResponse): void {
  const cookie = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  appendSetCookie(res, cookie);
}

export function resolveGuestSessionId(req: IncomingMessage, res?: ServerResponse): string {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[GUEST_COOKIE_NAME]) {
    return cookies[GUEST_COOKIE_NAME];
  }
  const headerGuest = req.headers['x-ff-guest-id'];
  if (typeof headerGuest === 'string' && headerGuest.trim().length >= 6) {
    return headerGuest.trim().slice(0, 64);
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket?.remoteAddress || 'local-guest';
  const generated = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 20);
  if (res) {
    const cookie = `${GUEST_COOKIE_NAME}=${encodeURIComponent(generated)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
    appendSetCookie(res, cookie);
  }
  return generated;
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
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const rawToken = cookies[SESSION_COOKIE_NAME] || bearerToken;
  if (!rawToken) return null;

  const payload = verifySessionToken(rawToken);
  if (!payload) return null;

  if (payload.userId === 'sys-admin-root' && payload.role === 'admin') {
    return getEnvAdminUser();
  }

  const users = getUsersMap();
  const found = users[payload.userId];
  if (!found) return null;
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

  if (username.length < 3 || !/^[a-z0-9_.-]+$/.test(username)) {
    return { ok: false, error: 'Username phải từ 3 ký tự và chỉ gồm chữ thường, số, dấu gạch.' };
  }
  if (!email.includes('@') || email.length < 5) {
    return { ok: false, error: 'Email không hợp lệ.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Mật khẩu phải từ 6 ký tự trở lên.' };
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
  if (!identifier || !password) {
    return { ok: false, error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.' };
  }

  const users = getUsersMap();
  const matched = Object.values(users).find(
    (u) => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier
  );
  if (!matched || !verifyPasswordHash(password, matched.passwordHash)) {
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
  const expectedUsername = (process.env.ADMIN_USERNAME || '').trim();
  const configuredHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
  const bootstrapPassword = (process.env.ADMIN_BOOTSTRAP_PASSWORD || '').trim();

  if (expectedUsername && username.toLowerCase() === expectedUsername.toLowerCase()) {
    if (configuredHash && verifyPasswordHash(password, configuredHash)) {
      return { ok: true, user: getEnvAdminUser() };
    }
    if (bootstrapPassword && safeCompareStrings(password, bootstrapPassword)) {
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
  const target = users[userId];
  if (!target) return null;
  target.role = target.role === 'admin' ? 'user' : 'admin';
  saveUserRecord(target);
  return toPublicUser(target);
}
