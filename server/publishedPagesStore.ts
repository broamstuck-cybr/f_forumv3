import crypto from 'node:crypto';
import type {
  BrandPersonality,
  PublishedPageCategory,
  PublishedPageRecord,
} from '../src/types/workspaceV4';
import {
  enqueueWrite,
  isSupabaseEnabled,
  readLocalSection,
  registerHydrator,
  sbSelect,
  sbUpsert,
  writeLocalSection,
} from './persistence.js';

const MAX_HTML_BYTES = 350 * 1024;
const MAX_STORED_PAGES = 500;
const MAX_LIKED_BY = 5000;
const SITE_ORIGIN = 'https://fforum3.vercel.app';
const OG_IMAGE_URL = `${SITE_ORIGIN}/og-cover.png`;

const VALID_CATEGORIES = new Set<PublishedPageCategory>([
  'presentation',
  'event',
  'portfolio',
  'business',
  'tech',
]);

const VALID_PERSONALITIES = new Set<BrandPersonality>([
  'professional',
  'friendly',
  'minimal',
  'playful',
  'bold',
  'modern',
]);

const RESERVED_SLUGS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'toLocaleString',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'api',
  'assets',
  'data',
  'admin',
  'workspace',
  'explore',
  'community',
  'profile',
  'settings',
  'home',
  'p',
]);

interface StoredPublishedPage extends PublishedPageRecord {
  likedBy: string[];
}

interface PersistedPublishedPagesData {
  pages: Record<string, StoredPublishedPage>;
}

export interface PublishPageInput {
  title: string;
  summary?: string;
  category: PublishedPageCategory;
  personality: BrandPersonality;
  html: string;
  sourceIds?: string[];
  authorName?: string;
  authorRole?: string;
  slug?: string;
}

let loadedDataDirKey: string | null = null;
let memoryPages: Record<string, StoredPublishedPage> = Object.create(null) as Record<
  string,
  StoredPublishedPage
>;

function getDataDirKey(): string {
  return (process.env.FF_DATA_DIR || '').trim() || '__default__';
}

function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) && !RESERVED_SLUGS.has(slug);
}

function normalizeStoredPage(raw: unknown): StoredPublishedPage | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const slug = typeof obj.slug === 'string' ? obj.slug.trim().toLowerCase() : '';
  const title = typeof obj.title === 'string' ? obj.title.trim() : '';
  const html = typeof obj.html === 'string' ? obj.html : '';
  if (!isValidSlugFormat(slug) || !title || !html) return null;

  const category = VALID_CATEGORIES.has(obj.category as PublishedPageCategory)
    ? (obj.category as PublishedPageCategory)
    : 'presentation';
  const personality = VALID_PERSONALITIES.has(obj.personality as BrandPersonality)
    ? (obj.personality as BrandPersonality)
    : 'modern';
  const likedBy = Array.isArray(obj.likedBy)
    ? obj.likedBy
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        .slice(-MAX_LIKED_BY)
    : Array.isArray(obj.liked_by)
      ? obj.liked_by
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
          .slice(-MAX_LIKED_BY)
      : [];
  const rawLikes = typeof obj.likes === 'number' && Number.isFinite(obj.likes) ? Math.max(0, Math.floor(obj.likes)) : 0;
  const rawRemixes = typeof obj.remixes === 'number' && Number.isFinite(obj.remixes) ? Math.max(0, Math.floor(obj.remixes)) : 0;
  const rawSources = Array.isArray(obj.sourceIds)
    ? obj.sourceIds
    : Array.isArray(obj.source_ids)
      ? obj.source_ids
      : [];
  const sourceIds = rawSources
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim().slice(0, 120))
    .slice(0, 24);
  const nowIso = new Date().toISOString();
  const createdAt =
    typeof obj.createdAt === 'string' && obj.createdAt
      ? obj.createdAt
      : typeof obj.created_at === 'string' && obj.created_at
        ? obj.created_at
        : nowIso;
  const updatedAt =
    typeof obj.updatedAt === 'string' && obj.updatedAt
      ? obj.updatedAt
      : typeof obj.updated_at === 'string' && obj.updated_at
        ? obj.updated_at
        : createdAt;
  const authorName =
    typeof obj.authorName === 'string' && obj.authorName.trim()
      ? obj.authorName.trim().slice(0, 60)
      : typeof obj.author_name === 'string' && obj.author_name.trim()
        ? obj.author_name.trim().slice(0, 60)
        : 'Thành viên F-FORUM';
  const authorRole =
    typeof obj.authorRole === 'string' && obj.authorRole.trim()
      ? obj.authorRole.trim().slice(0, 60)
      : typeof obj.author_role === 'string' && obj.author_role.trim()
        ? obj.author_role.trim().slice(0, 60)
        : undefined;

  return {
    slug,
    title: title.slice(0, 120),
    summary: typeof obj.summary === 'string' ? obj.summary.trim().slice(0, 400) : '',
    authorName,
    ...(authorRole ? { authorRole } : {}),
    category,
    personality,
    html,
    sourceIds,
    likes: Math.max(rawLikes, likedBy.length),
    remixes: rawRemixes,
    createdAt,
    updatedAt,
    likedBy,
  };
}

function toSupabaseRow(rec: StoredPublishedPage): Record<string, unknown> {
  return {
    slug: rec.slug,
    title: rec.title,
    summary: rec.summary,
    author_name: rec.authorName,
    author_role: rec.authorRole || null,
    category: rec.category,
    personality: rec.personality,
    html: rec.html,
    source_ids: rec.sourceIds,
    likes: rec.likes,
    remixes: rec.remixes,
    liked_by: rec.likedBy,
    created_at: rec.createdAt,
    updated_at: rec.updatedAt,
  };
}

registerHydrator('publishedPages', async () => {
  // WHY: sbSelect gracefully returns [] if ff_published_pages does not exist in Supabase yet.
  const rows = await sbSelect<Record<string, unknown>>(
    'ff_published_pages',
    'select=*&order=created_at.desc&limit=200'
  );
  for (const row of rows) {
    const parsed = normalizeStoredPage(row);
    if (parsed) {
      memoryPages[parsed.slug] = parsed;
    }
  }
});

function getPagesMap(): Record<string, StoredPublishedPage> {
  const dirKey = getDataDirKey();
  if (!isSupabaseEnabled()) {
    if (loadedDataDirKey !== dirKey) {
      memoryPages = Object.create(null) as Record<string, StoredPublishedPage>;
      loadedDataDirKey = dirKey;
    }
    const persisted = readLocalSection<PersistedPublishedPagesData>('publishedPagesStore', {
      pages: {},
    });
    for (const [slug, raw] of Object.entries(persisted.pages || {})) {
      if (!isValidSlugFormat(slug) || Object.hasOwn(memoryPages, slug)) continue;
      const parsed = normalizeStoredPage(raw);
      if (parsed) memoryPages[parsed.slug] = parsed;
    }
  }
  return memoryPages;
}

function pruneOldPages(pages: Record<string, StoredPublishedPage>): void {
  const entries = Object.values(pages);
  if (entries.length <= MAX_STORED_PAGES) return;
  entries.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  for (const stale of entries.slice(MAX_STORED_PAGES)) {
    delete pages[stale.slug];
  }
}

function persistPageRecord(record: StoredPublishedPage): void {
  const pages = getPagesMap();
  pruneOldPages(pages);
  if (isSupabaseEnabled()) {
    enqueueWrite(sbUpsert('ff_published_pages', [toSupabaseRow(record)], 'slug'));
    return;
  }
  writeLocalSection<PersistedPublishedPagesData>('publishedPagesStore', {
    pages,
  });
}

function toPublicPage(rec: StoredPublishedPage): PublishedPageRecord {
  const { likedBy: _likedBy, ...publicRecord } = rec;
  return {
    ...publicRecord,
    sourceIds: [...rec.sourceIds],
  };
}

export function slugifyPageSlug(raw: string): string {
  const ascii = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 60)
    .replace(/-+$/g, '');

  if (!ascii || RESERVED_SLUGS.has(ascii)) {
    return `trang-${crypto.randomBytes(3).toString('hex')}`;
  }
  return ascii;
}

export function sanitizePublishedHtml(rawHtml: string): string {
  // WHY: Neutralize javascript:/vbscript:/data:text/html URIs, base hijacking, and meta refresh while preserving standalone interactive HTML/CSS/JS.
  return rawHtml
    .replace(/\0/g, '')
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?\s*refresh\b[^>]*>/gi, '')
    .replace(
      /\b(href|src|action|formaction|xlink:href)\s*=\s*(["'])\s*(?:javascript|vbscript|data\s*:\s*text\/html)\s*:[\s\S]*?\2/gi,
      '$1="#"'
    )
    .replace(
      /\b(href|src|action|formaction|xlink:href)\s*=\s*(?:javascript|vbscript|data:text\/html):[^\s>]+/gi,
      '$1="#"'
    );
}

export function listPublishedPages(): PublishedPageRecord[] {
  const pages = getPagesMap();
  return Object.values(pages)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(toPublicPage);
}

export function getPublishedPageBySlug(slug: string): PublishedPageRecord | null {
  const clean = typeof slug === 'string' ? slug.trim().toLowerCase() : '';
  if (!isValidSlugFormat(clean)) return null;
  const pages = getPagesMap();
  const found = Object.hasOwn(pages, clean) ? pages[clean] : undefined;
  return found ? toPublicPage(found) : null;
}

export function publishUserPage(
  input: PublishPageInput
): { ok: true; page: PublishedPageRecord } | { ok: false; error: string; status?: number } {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length < 2 || title.length > 120) {
    return { ok: false, error: 'Tiêu đề trang phải từ 2 đến 120 ký tự.', status: 400 };
  }

  const summary =
    typeof input.summary === 'string' && input.summary.trim()
      ? input.summary.trim().slice(0, 400)
      : title;
  if (typeof input.summary === 'string' && input.summary.trim().length > 400) {
    return { ok: false, error: 'Mô tả tóm tắt không vượt quá 400 ký tự.', status: 400 };
  }

  if (!VALID_CATEGORIES.has(input.category)) {
    return { ok: false, error: 'Danh mục trang không hợp lệ.', status: 400 };
  }
  if (!VALID_PERSONALITIES.has(input.personality)) {
    return { ok: false, error: 'Phong cách thương hiệu không hợp lệ.', status: 400 };
  }

  const rawHtml = typeof input.html === 'string' ? input.html.trim() : '';
  if (rawHtml.length < 10) {
    return { ok: false, error: 'Nội dung HTML không được để trống.', status: 400 };
  }
  if (Buffer.byteLength(rawHtml, 'utf8') > MAX_HTML_BYTES) {
    return {
      ok: false,
      error: 'Dung lượng trang HTML vượt quá giới hạn tối đa 350 KB.',
      status: 413,
    };
  }

  const sanitizedHtml = sanitizePublishedHtml(rawHtml);
  const sourceIds = Array.isArray(input.sourceIds)
    ? input.sourceIds
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 120))
        .slice(0, 24)
    : [];
  const authorName =
    typeof input.authorName === 'string' && input.authorName.trim()
      ? input.authorName.trim().slice(0, 60)
      : 'Thành viên F-FORUM';
  const authorRole =
    typeof input.authorRole === 'string' && input.authorRole.trim()
      ? input.authorRole.trim().slice(0, 60)
      : undefined;

  const pages = getPagesMap();
  const baseSlug = slugifyPageSlug(
    typeof input.slug === 'string' && input.slug.trim() ? input.slug : title
  );
  let slug = baseSlug;
  while (Object.hasOwn(pages, slug) || RESERVED_SLUGS.has(slug)) {
    const suffix = crypto.randomBytes(3).toString('hex');
    slug = `${baseSlug.slice(0, 72)}-${suffix}`;
  }

  const now = new Date().toISOString();
  const record: StoredPublishedPage = {
    slug,
    title,
    summary,
    authorName,
    ...(authorRole ? { authorRole } : {}),
    category: input.category,
    personality: input.personality,
    html: sanitizedHtml,
    sourceIds,
    likes: 0,
    remixes: 0,
    createdAt: now,
    updatedAt: now,
    likedBy: [],
  };

  pages[slug] = record;
  persistPageRecord(record);
  return { ok: true, page: toPublicPage(record) };
}

export function toggleLikePublishedPage(
  slug: string,
  actorId: string
): { slug: string; likes: number; liked: boolean } | null {
  const cleanSlug = typeof slug === 'string' ? slug.trim().toLowerCase() : '';
  const cleanActor = typeof actorId === 'string' ? actorId.trim().slice(0, 128) : '';
  if (!isValidSlugFormat(cleanSlug) || !cleanActor) return null;

  const pages = getPagesMap();
  const target = Object.hasOwn(pages, cleanSlug) ? pages[cleanSlug] : undefined;
  if (!target) return null;

  const idx = target.likedBy.indexOf(cleanActor);
  let liked: boolean;
  if (idx >= 0) {
    target.likedBy.splice(idx, 1);
    target.likes = Math.max(0, target.likes - 1);
    liked = false;
  } else {
    target.likedBy.push(cleanActor);
    if (target.likedBy.length > MAX_LIKED_BY) {
      target.likedBy = target.likedBy.slice(-MAX_LIKED_BY);
    }
    target.likes += 1;
    liked = true;
  }
  target.updatedAt = new Date().toISOString();
  persistPageRecord(target);
  return { slug: target.slug, likes: target.likes, liked };
}

export function incrementRemixPublishedPage(
  slug: string
): { slug: string; remixes: number } | null {
  const cleanSlug = typeof slug === 'string' ? slug.trim().toLowerCase() : '';
  if (!isValidSlugFormat(cleanSlug)) return null;

  const pages = getPagesMap();
  const target = Object.hasOwn(pages, cleanSlug) ? pages[cleanSlug] : undefined;
  if (!target) return null;

  target.remixes += 1;
  target.updatedAt = new Date().toISOString();
  persistPageRecord(target);
  return { slug: target.slug, remixes: target.remixes };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildRemixBadgeHtml(slug: string): string {
  const href = `/workspace?remix=${encodeURIComponent(slug)}`;
  return [
    `<a href="${href}" target="_top" rel="noopener noreferrer" aria-label="Tạo lại theo gu này trên F-FORUM" style="position:fixed;right:16px;bottom:16px;z-index:2147483647;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:9999px;background:rgba(15,23,42,0.9);color:#f8fafc;border:1px solid rgba(255,255,255,0.16);box-shadow:0 8px 24px rgba(2,6,23,0.28);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font:600 13px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-decoration:none;letter-spacing:-0.01em;transition:transform .16s ease,background .16s ease;">`,
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z"/></svg>`,
    `<span>Tạo lại theo gu này</span>`,
    `</a>`,
  ].join('');
}

export function renderPublicPageHtml(page: PublishedPageRecord): string {
  const safeTitle = escapeHtml(page.title);
  const safeDesc = escapeHtml(page.summary || `${page.title} — Tạo trên F-FORUM`);
  const pageUrl = `${SITE_ORIGIN}/p/${encodeURIComponent(page.slug)}`;

  const ogTags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${safeTitle}">`,
    `<meta property="og:description" content="${safeDesc}">`,
    `<meta property="og:image" content="${OG_IMAGE_URL}">`,
    `<meta property="og:url" content="${pageUrl}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${safeTitle}">`,
    `<meta name="twitter:description" content="${safeDesc}">`,
    `<meta name="twitter:image" content="${OG_IMAGE_URL}">`,
  ].join('\n');

  const badgeHtml = buildRemixBadgeHtml(page.slug);
  let doc = sanitizePublishedHtml(page.html);

  const hasHtmlTag = /<html\b/i.test(doc);
  if (!hasHtmlTag) {
    return [
      '<!doctype html>',
      '<html lang="vi">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      `<title>${safeTitle} — F-FORUM</title>`,
      `<meta name="description" content="${safeDesc}">`,
      ogTags,
      '</head>',
      '<body>',
      doc,
      badgeHtml,
      '</body>',
      '</html>',
    ].join('\n');
  }

  const headAdditions: string[] = [];
  if (!/<meta[^>]+charset=/i.test(doc)) {
    headAdditions.push('<meta charset="utf-8">');
  }
  if (!/<meta[^>]+name=["']viewport["']/i.test(doc)) {
    headAdditions.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  }
  if (!/<title\b/i.test(doc)) {
    headAdditions.push(`<title>${safeTitle} — F-FORUM</title>`);
  }
  if (!/<meta[^>]+name=["']description["']/i.test(doc)) {
    headAdditions.push(`<meta name="description" content="${safeDesc}">`);
  }
  headAdditions.push(ogTags);
  const headPayload = headAdditions.join('\n');

  if (/<head\b[^>]*>/i.test(doc)) {
    doc = doc.replace(/<head\b[^>]*>/i, (match) => `${match}\n${headPayload}`);
  } else {
    doc = doc.replace(/<html\b[^>]*>/i, (match) => `${match}\n<head>\n${headPayload}\n</head>`);
  }

  if (/<\/body>/i.test(doc)) {
    doc = doc.replace(/<\/body>/i, `${badgeHtml}\n</body>`);
  } else {
    doc = `${doc}\n${badgeHtml}`;
  }

  return doc;
}

export function renderNotFoundPageHtml(slug: string): string {
  const safeSlug = escapeHtml((slug || '').slice(0, 80));
  return [
    '<!doctype html>',
    '<html lang="vi">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>Không tìm thấy trang — F-FORUM</title>',
    '<style>',
    '*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fafc;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
    '.card{max-width:460px;width:100%;padding:32px;border-radius:16px;background:#ffffff;border:1px solid #e2e8f0;box-shadow:0 12px 32px rgba(15,23,42,0.06)}',
    '.code{font-size:12px;font-weight:700;letter-spacing:0.08em;color:#64748b;text-transform:uppercase}',
    'h1{margin:8px 0 12px;font-size:24px;line-height:1.25}p{margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569}',
    '.actions{display:flex;gap:12px;flex-wrap:wrap}',
    '.btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none}',
    '.primary{background:#0f172a;color:#ffffff}.ghost{background:#f1f5f9;color:#0f172a}',
    '</style>',
    '</head>',
    '<body>',
    '<main class="card">',
    '<div class="code">404 · F-FORUM</div>',
    '<h1>Không tìm thấy trang này</h1>',
    `<p>Đường dẫn <code>/p/${safeSlug}</code> chưa tồn tại hoặc đã bị gỡ khỏi hệ thống.</p>`,
    '<div class="actions">',
    '<a class="btn primary" href="/workspace" target="_top">Tạo trang mới</a>',
    '<a class="btn ghost" href="/" target="_top">Về trang chủ</a>',
    '</div>',
    '</main>',
    '</body>',
    '</html>',
  ].join('');
}
