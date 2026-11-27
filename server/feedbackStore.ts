import crypto from 'node:crypto';
import {
  isSupabaseEnabled,
  readLocalSection,
  registerHydrator,
  sbInsert,
  sbPatch,
  sbSelect,
  writeLocalSection,
} from './persistence.js';

export type FeedbackCategory = 'feature' | 'bug' | 'ui' | 'other';
export type FeedbackStatus = 'unread' | 'read' | 'resolved';
export type FeedbackEmailStatus = 'sent' | 'failed' | 'skipped' | 'pending';

export interface FeedbackRecord {
  id: string;
  category: FeedbackCategory;
  rating: number;
  message: string;
  senderName: string;
  senderEmail: string;
  pageUrl: string;
  userId: string | null;
  status: FeedbackStatus;
  emailStatus: FeedbackEmailStatus;
  emailProvider: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface CreateFeedbackInput {
  category?: unknown;
  rating?: unknown;
  message?: unknown;
  senderName?: unknown;
  senderEmail?: unknown;
  pageUrl?: unknown;
  userId?: string | null;
}

export interface FeedbackValidationResult {
  ok: true;
  data: {
    category: FeedbackCategory;
    rating: number;
    message: string;
    senderName: string;
    senderEmail: string;
    pageUrl: string;
    userId: string | null;
  };
}

export interface FeedbackValidationError {
  ok: false;
  error: string;
}

const FEEDBACK_TABLE = 'ff_feedback';
const ADMIN_CONFIG_TABLE = 'ff_admin_config';
const FEEDBACK_CONFIG_KEY = 'feedback';
const LOCAL_SECTION_KEY = 'feedbackStore';
const MAX_LOCAL_RECORDS = 400;
const EMAIL_TIMEOUT_MS = 8_000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  feature: 'Góp ý tính năng',
  bug: 'Báo lỗi',
  ui: 'Giao diện',
  other: 'Khác',
};

const CATEGORY_ALIASES: Record<string, FeedbackCategory> = {
  feature: 'feature',
  'góp ý tính năng': 'feature',
  'gop y tinh nang': 'feature',
  bug: 'bug',
  'báo lỗi': 'bug',
  'bao loi': 'bug',
  ui: 'ui',
  'giao diện': 'ui',
  'giao dien': 'ui',
  other: 'other',
  'khác': 'other',
  khac: 'other',
};

let loadedDataDirKey: string | null = null;
let memoryFeedbacks: FeedbackRecord[] = [];
let configuredRecipientEmail = '';

async function resolveFeedbackRecipientEmail(): Promise<string> {
  const fromEnv = (process.env.FEEDBACK_TO_EMAIL || '').trim();
  if (fromEnv && EMAIL_REGEX.test(fromEnv)) return fromEnv;
  if (configuredRecipientEmail && EMAIL_REGEX.test(configuredRecipientEmail)) {
    return configuredRecipientEmail;
  }
  if (isSupabaseEnabled()) {
    try {
      const cfgRows = await sbSelect<{ value?: { recipientEmail?: unknown } }>(
        ADMIN_CONFIG_TABLE,
        `select=value&key=eq.${encodeURIComponent(FEEDBACK_CONFIG_KEY)}&limit=1`
      );
      const dbEmail =
        typeof cfgRows[0]?.value?.recipientEmail === 'string'
          ? cfgRows[0].value.recipientEmail.trim()
          : '';
      if (dbEmail && EMAIL_REGEX.test(dbEmail)) {
        configuredRecipientEmail = dbEmail;
        return dbEmail;
      }
    } catch {
      // Ignore config lookup error; feedback is still persisted in DB/Admin inbox.
    }
  }
  return '';
}

function getDataDirKey(): string {
  return (process.env.FF_DATA_DIR || '').trim() || '__default__';
}

function stripControlChars(raw: string): string {
  // WHY: Preserve newlines/tabs for readable messages while stripping unsafe ASCII control chars.
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function sanitizeSingleLine(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return stripControlChars(raw).replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function sanitizeMessage(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return stripControlChars(raw)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
    .slice(0, maxLen);
}

function sanitizePageUrl(raw: unknown): string {
  const cleaned = sanitizeSingleLine(raw, 260);
  if (!cleaned) return '/';
  if (/^(javascript|data|vbscript):/i.test(cleaned)) return '/';
  return cleaned;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeFeedbackCategory(raw: unknown): FeedbackCategory | null {
  if (typeof raw !== 'string') return null;
  const key = raw.trim().toLowerCase();
  return CATEGORY_ALIASES[key] ?? null;
}

export function isValidFeedbackStatus(raw: unknown): raw is FeedbackStatus {
  return raw === 'unread' || raw === 'read' || raw === 'resolved';
}

export function getFeedbackCategoryLabel(category: FeedbackCategory): string {
  return CATEGORY_LABELS[category] ?? CATEGORY_LABELS.other;
}

export function validateFeedbackInput(
  input: CreateFeedbackInput
): FeedbackValidationResult | FeedbackValidationError {
  const category = normalizeFeedbackCategory(input.category);
  if (!category) {
    return { ok: false, error: 'Danh mục góp ý không hợp lệ.' };
  }

  const rawRating =
    typeof input.rating === 'number'
      ? input.rating
      : typeof input.rating === 'string' && input.rating.trim()
        ? Number(input.rating)
        : Number.NaN;
  if (!Number.isInteger(rawRating) || rawRating < 1 || rawRating > 5) {
    return { ok: false, error: 'Vui lòng chọn mức đánh giá từ 1 đến 5 sao.' };
  }

  const message = sanitizeMessage(input.message, 2000);
  if (message.length < 3) {
    return { ok: false, error: 'Nội dung góp ý cần ít nhất 3 ký tự.' };
  }

  const senderName = sanitizeSingleLine(input.senderName, 100) || 'Ẩn danh';
  const senderEmail = sanitizeSingleLine(input.senderEmail, 160);
  if (senderEmail && !EMAIL_REGEX.test(senderEmail)) {
    return { ok: false, error: 'Địa chỉ email chưa đúng định dạng.' };
  }

  const pageUrl = sanitizePageUrl(input.pageUrl);
  const userId =
    typeof input.userId === 'string' && input.userId.trim()
      ? sanitizeSingleLine(input.userId, 128)
      : null;

  return {
    ok: true,
    data: {
      category,
      rating: rawRating,
      message,
      senderName,
      senderEmail,
      pageUrl,
      userId,
    },
  };
}

function toDbRow(record: FeedbackRecord): Record<string, unknown> {
  return {
    id: record.id,
    category: record.category,
    rating: record.rating,
    message: record.message,
    sender_name: record.senderName,
    sender_email: record.senderEmail,
    page_url: record.pageUrl,
    user_id: record.userId,
    status: record.status,
    email_status: record.emailStatus,
    email_provider: record.emailProvider,
    created_at: record.createdAt,
    resolved_at: record.resolvedAt,
    resolved_by: record.resolvedBy,
  };
}

function fromDbRow(row: Record<string, unknown>): FeedbackRecord | null {
  const id = typeof row.id === 'string' ? row.id.trim() : '';
  if (!id) return null;
  const category = normalizeFeedbackCategory(row.category) ?? 'other';
  const rawRating = typeof row.rating === 'number' ? row.rating : Number(row.rating);
  const rating = Number.isFinite(rawRating)
    ? Math.min(5, Math.max(1, Math.round(rawRating)))
    : 5;
  const rawStatus = row.status;
  const status: FeedbackStatus = isValidFeedbackStatus(rawStatus) ? rawStatus : 'unread';
  const rawEmailStatus = row.email_status ?? row.emailStatus;
  const emailStatus: FeedbackEmailStatus =
    rawEmailStatus === 'sent' ||
    rawEmailStatus === 'failed' ||
    rawEmailStatus === 'skipped' ||
    rawEmailStatus === 'pending'
      ? rawEmailStatus
      : 'pending';

  return {
    id,
    category,
    rating,
    message: typeof row.message === 'string' ? row.message : '',
    senderName:
      typeof row.sender_name === 'string'
        ? row.sender_name
        : typeof row.senderName === 'string'
          ? row.senderName
          : 'Ẩn danh',
    senderEmail:
      typeof row.sender_email === 'string'
        ? row.sender_email
        : typeof row.senderEmail === 'string'
          ? row.senderEmail
          : '',
    pageUrl:
      typeof row.page_url === 'string'
        ? row.page_url
        : typeof row.pageUrl === 'string'
          ? row.pageUrl
          : '/',
    userId:
      typeof row.user_id === 'string'
        ? row.user_id
        : typeof row.userId === 'string'
          ? row.userId
          : null,
    status,
    emailStatus,
    emailProvider:
      typeof row.email_provider === 'string'
        ? row.email_provider
        : typeof row.emailProvider === 'string'
          ? row.emailProvider
          : 'none',
    createdAt:
      typeof row.created_at === 'string'
        ? row.created_at
        : typeof row.createdAt === 'string'
          ? row.createdAt
          : new Date().toISOString(),
    resolvedAt:
      typeof row.resolved_at === 'string'
        ? row.resolved_at
        : typeof row.resolvedAt === 'string'
          ? row.resolvedAt
          : null,
    resolvedBy:
      typeof row.resolved_by === 'string'
        ? row.resolved_by
        : typeof row.resolvedBy === 'string'
          ? row.resolvedBy
          : null,
  };
}

function sortNewestFirst(items: FeedbackRecord[]): FeedbackRecord[] {
  return [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function ensureLocalLoaded(): void {
  const dirKey = getDataDirKey();
  if (loadedDataDirKey === dirKey) return;
  loadedDataDirKey = dirKey;
  const persisted = readLocalSection<unknown>(LOCAL_SECTION_KEY, []);
  if (!Array.isArray(persisted)) {
    memoryFeedbacks = [];
    return;
  }
  const normalized: FeedbackRecord[] = [];
  for (const item of persisted) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const parsed = fromDbRow(item as Record<string, unknown>);
    if (parsed) normalized.push(parsed);
  }
  memoryFeedbacks = sortNewestFirst(normalized).slice(0, MAX_LOCAL_RECORDS);
}

function saveLocalFeedbacks(): void {
  writeLocalSection<FeedbackRecord[]>(
    LOCAL_SECTION_KEY,
    sortNewestFirst(memoryFeedbacks).slice(0, MAX_LOCAL_RECORDS)
  );
}

registerHydrator('feedbackStore', async () => {
  await resolveFeedbackRecipientEmail();
  const rows = await sbSelect<Record<string, unknown>>(
    FEEDBACK_TABLE,
    'select=*&order=created_at.desc&limit=300'
  );
  if (rows.length === 0) return;
  const parsed: FeedbackRecord[] = [];
  for (const row of rows) {
    const rec = fromDbRow(row);
    if (rec) parsed.push(rec);
  }
  if (parsed.length > 0) {
    memoryFeedbacks = sortNewestFirst(parsed);
  }
});

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = EMAIL_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function dispatchFeedbackEmail(
  record: FeedbackRecord
): Promise<{ emailStatus: FeedbackEmailStatus; emailProvider: string }> {
  if (
    process.env.NODE_ENV === 'test' &&
    process.env.FEEDBACK_ENABLE_EMAIL_IN_TEST !== '1'
  ) {
    return { emailStatus: 'skipped', emailProvider: 'test-mode' };
  }

  const recipient = await resolveFeedbackRecipientEmail();
  if (!recipient) {
    return { emailStatus: 'skipped', emailProvider: 'unconfigured' };
  }
  const categoryLabel = getFeedbackCategoryLabel(record.category);
  const subject = `[F-Forum Feedback] ${categoryLabel} (${record.rating}/5 sao) — ${record.senderName}`;

  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendApiKey) {
    try {
      const fromAddress = (
        process.env.RESEND_FROM_EMAIL || 'F-Forum Feedback <onboarding@resend.dev>'
      ).trim();
      const htmlBody = [
        '<div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#111816;max-width:600px">',
        `<h2 style="margin:0 0 12px;color:#0a6e50">Phản hồi mới từ F-Forum (${record.rating}/5 sao)</h2>`,
        '<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">',
        `<tr><td style="padding:6px 0;color:#4a5a55;width:130px">Danh mục</td><td style="padding:6px 0"><strong>${escapeHtml(categoryLabel)}</strong></td></tr>`,
        `<tr><td style="padding:6px 0;color:#4a5a55">Đánh giá</td><td style="padding:6px 0">${record.rating} / 5 sao</td></tr>`,
        `<tr><td style="padding:6px 0;color:#4a5a55">Người gửi</td><td style="padding:6px 0">${escapeHtml(record.senderName)}</td></tr>`,
        `<tr><td style="padding:6px 0;color:#4a5a55">Email</td><td style="padding:6px 0">${escapeHtml(record.senderEmail || 'Không cung cấp')}</td></tr>`,
        `<tr><td style="padding:6px 0;color:#4a5a55">Trang gửi</td><td style="padding:6px 0"><code>${escapeHtml(record.pageUrl)}</code></td></tr>`,
        `<tr><td style="padding:6px 0;color:#4a5a55">Mã phản hồi</td><td style="padding:6px 0"><code>${escapeHtml(record.id)}</code></td></tr>`,
        '</table>',
        '<div style="padding:14px 16px;border-radius:12px;background:#f3f7f5;border:1px solid #d5e2dc;white-space:pre-wrap">',
        escapeHtml(record.message),
        '</div>',
        '</div>',
      ].join('');

      const textBody = [
        `Phản hồi mới từ F-Forum`,
        `Danh mục: ${categoryLabel}`,
        `Đánh giá: ${record.rating}/5 sao`,
        `Người gửi: ${record.senderName}`,
        `Email: ${record.senderEmail || 'Không cung cấp'}`,
        `Trang gửi: ${record.pageUrl}`,
        `Mã phản hồi: ${record.id}`,
        `Thời gian: ${record.createdAt}`,
        '',
        record.message,
      ].join('\n');

      const resendRes = await fetchWithTimeout('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipient],
          ...(record.senderEmail ? { reply_to: record.senderEmail } : {}),
          subject,
          text: textBody,
          html: htmlBody,
        }),
      });

      if (resendRes.ok) {
        return { emailStatus: 'sent', emailProvider: 'resend' };
      }
    } catch {
      // Fall through to FormSubmit backup
    }
  }

  try {
    const formSubmitUrl = `https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`;
    const formRes = await fetchWithTimeout(formSubmitUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: 'https://fforum3.vercel.app',
        Referer: 'https://fforum3.vercel.app/',
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        ...(record.senderEmail ? { _replyto: record.senderEmail } : {}),
        'Danh mục': categoryLabel,
        'Đánh giá': `${record.rating}/5 sao`,
        'Người gửi': record.senderName,
        Email: record.senderEmail || 'Không cung cấp',
        'Trang gửi': record.pageUrl,
        'Nội dung': record.message,
        'Mã phản hồi': record.id,
        'Thời gian': record.createdAt,
      }),
    });

    if (formRes.ok) {
      const payload = (await formRes.json().catch(() => ({}))) as { success?: unknown };
      const succeeded = payload.success === true || payload.success === 'true' || payload.success === undefined;
      if (succeeded) {
        return { emailStatus: 'sent', emailProvider: 'formsubmit' };
      }
    }
    return { emailStatus: 'failed', emailProvider: 'formsubmit' };
  } catch {
    return { emailStatus: 'failed', emailProvider: 'formsubmit' };
  }
}

export async function createFeedbackEntry(
  validated: FeedbackValidationResult['data']
): Promise<{ feedback: FeedbackRecord; emailStatus: FeedbackEmailStatus }> {
  const nowIso = new Date().toISOString();
  const record: FeedbackRecord = {
    id: `fb-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`,
    category: validated.category,
    rating: validated.rating,
    message: validated.message,
    senderName: validated.senderName,
    senderEmail: validated.senderEmail,
    pageUrl: validated.pageUrl,
    userId: validated.userId,
    status: 'unread',
    emailStatus: 'pending',
    emailProvider: 'none',
    createdAt: nowIso,
    resolvedAt: null,
    resolvedBy: null,
  };

  if (isSupabaseEnabled()) {
    await sbInsert(FEEDBACK_TABLE, toDbRow(record));
    memoryFeedbacks = sortNewestFirst([record, ...memoryFeedbacks.filter((f) => f.id !== record.id)]);
  } else {
    ensureLocalLoaded();
    memoryFeedbacks = sortNewestFirst([record, ...memoryFeedbacks]).slice(0, MAX_LOCAL_RECORDS);
    saveLocalFeedbacks();
  }

  const emailResult = await dispatchFeedbackEmail(record);
  record.emailStatus = emailResult.emailStatus;
  record.emailProvider = emailResult.emailProvider;

  if (isSupabaseEnabled()) {
    await sbPatch(FEEDBACK_TABLE, `id=eq.${encodeURIComponent(record.id)}`, {
      email_status: record.emailStatus,
      email_provider: record.emailProvider,
    });
  } else {
    saveLocalFeedbacks();
  }

  return { feedback: record, emailStatus: record.emailStatus };
}

export async function listFeedbackEntries(): Promise<{
  items: FeedbackRecord[];
  unreadCount: number;
}> {
  if (isSupabaseEnabled()) {
    const rows = await sbSelect<Record<string, unknown>>(
      FEEDBACK_TABLE,
      'select=*&order=created_at.desc&limit=300'
    );
    const parsed: FeedbackRecord[] = [];
    for (const row of rows) {
      const rec = fromDbRow(row);
      if (rec) parsed.push(rec);
    }
    const items = sortNewestFirst(parsed.length > 0 ? parsed : memoryFeedbacks);
    memoryFeedbacks = items;
    const unreadCount = items.filter((item) => item.status === 'unread').length;
    return { items, unreadCount };
  }

  ensureLocalLoaded();
  const items = sortNewestFirst(memoryFeedbacks);
  const unreadCount = items.filter((item) => item.status === 'unread').length;
  return { items, unreadCount };
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  actorUsername: string
): Promise<{ feedback: FeedbackRecord; unreadCount: number } | null> {
  const cleanId = id.trim();
  if (!cleanId) return null;

  const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
  const resolvedBy = status === 'resolved' ? actorUsername : null;

  if (isSupabaseEnabled()) {
    const existingRows = await sbSelect<Record<string, unknown>>(
      FEEDBACK_TABLE,
      `select=*&id=eq.${encodeURIComponent(cleanId)}&limit=1`
    );
    const existing = existingRows[0] ? fromDbRow(existingRows[0]) : memoryFeedbacks.find((f) => f.id === cleanId) ?? null;
    if (!existing) return null;

    const updated: FeedbackRecord = {
      ...existing,
      status,
      resolvedAt,
      resolvedBy,
    };

    await sbPatch(FEEDBACK_TABLE, `id=eq.${encodeURIComponent(cleanId)}`, {
      status,
      resolved_at: resolvedAt,
      resolved_by: resolvedBy,
    });

    memoryFeedbacks = sortNewestFirst([
      updated,
      ...memoryFeedbacks.filter((item) => item.id !== cleanId),
    ]);
    const list = await listFeedbackEntries();
    return { feedback: updated, unreadCount: list.unreadCount };
  }

  ensureLocalLoaded();
  const idx = memoryFeedbacks.findIndex((item) => item.id === cleanId);
  if (idx < 0) return null;

  const updated: FeedbackRecord = {
    ...memoryFeedbacks[idx],
    status,
    resolvedAt,
    resolvedBy,
  };
  memoryFeedbacks[idx] = updated;
  saveLocalFeedbacks();

  const unreadCount = memoryFeedbacks.filter((item) => item.status === 'unread').length;
  return { feedback: updated, unreadCount };
}
