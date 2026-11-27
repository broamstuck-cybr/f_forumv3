import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import cors from 'cors';
import type {
  AIChatRequest,
  ClubHandoverDossier,
  CommunityAuthor,
  CommunityChannel,
  ModerationReportStatus,
  WorkspaceProject,
} from '../src/types/index';
import type {
  BrandPersonality,
  PublishedPageCategory,
} from '../src/types/workspaceV4';
import {
  getBehaviorScores,
  isValidBehaviorSignal,
  recordBehaviorSignal,
} from './behaviorStore.js';
import {
  getPublishedPageBySlug,
  incrementRemixPublishedPage,
  listPublishedPages,
  publishUserPage,
  renderNotFoundPageHtml,
  renderPublicPageHtml,
  toggleLikePublishedPage,
} from './publishedPagesStore.js';
import {
  adminAddChangelog,
  adminModerateReport,
  adminResetQuota,
  adminToggleUserRole,
  adminUpdateQuotaControl,
  appendAuditLog,
  getAdminStateSnapshot,
  getPublicChangelog,
  getSecurityEvents,
  recordAiTelemetry,
  recordSecurityEvent,
  updateGatewayOverride,
} from './adminStore.js';
import {
  runAIGeneration,
  runAIGenerationStream,
  runLiveKeyPoolProbe,
  sanitizeErrorText,
  validateUpstreamBaseUrl,
} from './aiEngine.js';
import {
  checkLoginLockout,
  clearAuthCookies,
  clearLoginFailures,
  getAuthenticatedUser,
  getClientIpHash,
  getGoogleClientId,
  loginAdminUser,
  loginOrRegisterGoogleUser,
  loginStandardUser,
  recordLoginFailure,
  registerStandardUser,
  resolveGuestSessionId,
  resolveTrustProxy,
  revokeSessionFromRequest,
  setAuthCookies,
  toSafeClientUser,
  verifyGoogleIdToken,
} from './authEngine.js';
import {
  acceptCommunityAnswer,
  addCommunityAnswer,
  createCommunityPost,
  findCommunityPostById,
  forkCommunityItem,
  listCommunityPosts,
  submitModerationReport,
  toPublicCommunityPost,
  updateClubDossier,
  upvoteCommunityPost,
} from './communityStore.js';
import {
  ensureHydrated,
  ensureLocalEnvLoaded,
  flushSupabaseWrites,
  isSupabaseEnabled,
} from './persistence.js';
import {
  getSiteMetrics,
  recordSiteHeartbeat,
  recordSiteVisit,
} from './metricsStore.js';
import { deleteUserProject, listUserProjects, syncUserProject } from './projectStore.js';
import {
  consumeQuotaTurn,
  getQuotaState,
  isReservedPrototypeKey,
  recordQuotaTokens,
} from './quotaStore.js';
import { checkSlidingWindowLimit } from './rateLimiter.js';

ensureLocalEnvLoaded();

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', resolveTrustProxy());

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>([
    'https://fforum3.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:8787',
    'http://127.0.0.1:8787',
  ]);
  const extra = (process.env.CORS_ALLOWED_ORIGINS || '').trim();
  if (extra) {
    for (const part of extra.split(',')) {
      const clean = part.trim().replace(/\/+$/, '');
      if (clean) origins.add(clean);
    }
  }
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    const cleanHost = (host || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    if (cleanHost) origins.add(`https://${cleanHost}`);
  }
  return origins;
}

const DEFAULT_CONNECT_SRC = [
  "'self'",
  'https://accounts.google.com',
  'https://oauth2.googleapis.com',
  'https://d8j0ntlcm91z4.cloudfront.net',
];

function getDefaultCspDirectives(): string {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const connectSrc = isProd
    ? DEFAULT_CONNECT_SRC.join(' ')
    : `${DEFAULT_CONNECT_SRC.join(' ')} ws://localhost:* ws://127.0.0.1:*`;
  return `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com/gsi/client blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src ${connectSrc}; frame-src 'self' blob: data: https://accounts.google.com; worker-src 'self' blob:`;
}

const SIMULATOR_CSP_DIRECTIVES =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https://api.open-meteo.com https://nominatim.openstreetmap.org https://api.mymemory.translated.net; frame-src 'self' blob: data: https://www.openstreetmap.org https://en.m.wikipedia.org https://www.bing.com https://open-meteo.com https://www.apple.com https://www.macrumors.com https://www.theverge.com https://github.com; worker-src 'self' blob:";

// WHY: CSP sandbox without allow-same-origin isolates user-published /p/:slug pages from main-origin localStorage/API while enabling standalone inline HTML/CSS/JS.
const PUBLISHED_PAGE_CSP_DIRECTIVES =
  "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-top-navigation-by-user-activation; default-src 'self' https: data: blob:; base-uri 'none'; object-src 'none'; frame-ancestors 'self'; script-src 'unsafe-inline' 'unsafe-eval' https: blob:; style-src 'unsafe-inline' https: data:; font-src data: https:; img-src data: blob: https:; media-src data: blob: https:; connect-src 'none'; form-action 'none'";

const CRAFT_SYSTEM_GUIDANCE = [
  'Quy tắc thiết kế F-FORUM (Anti-Slop & MotionSites):',
  '- Tiếng Việt tự nhiên đủ dấu, không văn mẫu sáo rỗng, không chữ giả Latinh, không emoji làm icon UI.',
  '- Dùng SVG mảnh, 1 màu chủ đạo + tương phản >= 4.5:1, tránh gradient tím-xanh đại trà.',
  '- Nhịp lưới 8px, bo góc đồng tâm, responsive mượt trên 390px / 768px / 1440px.',
  '- Chuyển động tinh tế (reveal, hover spring, tiến độ mượt) và luôn tôn trọng prefers-reduced-motion.',
  '- Nút hành động ngắn gọn (<= 3 từ), mã tự chạy sạch không lỗi console.',
].join('\n');

app.use((req, res, next) => {
  const isSimulatorPath = /^\/iphone18-simulator\.html$/i.test(req.path);
  const isPublishedPagePath = req.path.startsWith('/p/');
  res.setHeader(
    'Content-Security-Policy',
    isPublishedPagePath
      ? PUBLISHED_PAGE_CSP_DIRECTIVES
      : isSimulatorPath
        ? SIMULATOR_CSP_DIRECTIVES
        : getDefaultCspDirectives()
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.trim().replace(/\/+$/, '');
      if (buildAllowedOrigins().has(normalized)) {
        callback(null, true);
        return;
      }
      const logBlockedOrigin = () => {
        recordSecurityEvent({
          type: 'cors_blocked',
          status: 403,
          route: '/api',
          ipHash: 'cors-origin',
          detail: `Blocked cross-origin request from ${normalized}`,
        });
        callback(null, false);
      };
      if (isSupabaseEnabled()) {
        void ensureHydrated()
          .catch(() => undefined)
          .finally(logBlockedOrigin);
        return;
      }
      logBlockedOrigin();
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-FF-Guest-Id',
      'X-FF-BYOK-Key',
      'X-FF-BYOK-Url',
      'X-FF-BYOK-Model',
      'X-FF-BYOK-Protocol',
    ],
  })
);
app.use(express.json({ limit: '2mb' }));

function enforceRateLimit(
  req: Request,
  res: Response,
  bucketKey: string,
  limit: number,
  windowMs: number,
  actor?: string
): boolean {
  const result = checkSlidingWindowLimit(bucketKey, limit, windowMs);
  if (result.allowed) return true;
  res.setHeader('Retry-After', String(result.retryAfterSec));
  recordSecurityEvent({
    type: 'rate_limited',
    status: 429,
    route: req.path || '/api',
    ipHash: getClientIpHash(req),
    actor,
    detail: `Rate limit exceeded (${limit}/${Math.round(windowMs / 1000)}s)`,
  });
  res.status(429).json({
    error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    retryAfterSec: result.retryAfterSec,
  });
  return false;
}

function maskEmail(email: string): string {
  const clean = email.trim();
  const at = clean.indexOf('@');
  if (at <= 1) return '***';
  return `${clean[0]}***${clean.slice(at)}`;
}

export function handleHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    service: 'f-forum-v3-api',
    version: '3.0.0',
    persistence: isSupabaseEnabled() ? 'supabase' : 'local-json',
    timestamp: new Date().toISOString(),
  });
}

export async function handlePublicChangelog(_req: Request, res: Response): Promise<void> {
  await ensureHydrated();
  const changelog = getPublicChangelog().map((entry) => ({
    id: entry.id,
    version: entry.version,
    title: entry.title,
    notes: entry.notes,
    publishedAt: entry.publishedAt,
    author: 'F-FORUM Team',
  }));
  res.status(200).json({ changelog });
}

export async function handleMetricsAction(
  req: Request,
  res: Response,
  explicitAction?: string
): Promise<void> {
  await ensureHydrated();
  const action = (explicitAction || req.params.action || '').toLowerCase();
  const ipHash = getClientIpHash(req);

  if (!action && req.method === 'GET') {
    if (!enforceRateLimit(req, res, `metrics:get:${ipHash}`, 120, 60_000)) return;
    res.status(200).json(getSiteMetrics());
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!enforceRateLimit(req, res, `metrics:post:${ipHash}`, 30, 60_000)) return;

  const body = (req.body || {}) as Record<string, unknown>;

  if (action === 'visit') {
    const visitorId = typeof body.visitorId === 'string' ? body.visitorId.trim() : '';
    if (!visitorId || visitorId.length > 128) {
      res.status(400).json({ error: 'visitorId không hợp lệ.' });
      return;
    }
    const result = recordSiteVisit(visitorId);
    res.status(200).json({ ...result.metrics, counted: result.counted });
    return;
  }

  if (action === 'heartbeat') {
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    const deltaSeconds = typeof body.deltaSeconds === 'number' ? body.deltaSeconds : Number.NaN;
    const result = recordSiteHeartbeat(sessionId, deltaSeconds);
    if (!result.ok) {
      const status = result.error === 'rate_limited' ? 429 : 400;
      const error =
        result.error === 'invalid_session'
          ? 'Thiếu sessionId.'
          : result.error === 'rate_limited'
            ? 'Tần suất heartbeat vượt quá thời gian hoạt động thực tế.'
            : 'deltaSeconds phải nằm trong khoảng 1..60 giây.';
      res.status(status).json({ error, ...result.metrics });
      return;
    }
    res.status(200).json({
      ok: true,
      addedSeconds: result.addedSeconds,
      ...result.metrics,
    });
    return;
  }

  res.status(404).json({ error: `Unknown metrics action: ${action}` });
}

export async function handleAiQuota(req: Request, res: Response): Promise<void> {
  await ensureHydrated();
  const user = getAuthenticatedUser(req);
  const guestId = resolveGuestSessionId(req, res);
  const ipHash = getClientIpHash(req);
  const quota = getQuotaState(user, guestId, ipHash);
  res.status(200).json({
    user: user ? toSafeClientUser(user) : null,
    quota,
  });
}

export async function handleAiChat(req: Request, res: Response): Promise<void> {
  await ensureHydrated();
  const user = getAuthenticatedUser(req);
  const guestId = resolveGuestSessionId(req, res);
  const ipHash = getClientIpHash(req);
  const subjectKey = user ? user.id : guestId;

  if (!enforceRateLimit(req, res, `ai:chat:${ipHash}:${subjectKey}`, 45, 60_000, user?.username)) {
    return;
  }

  const body = (req.body || {}) as Partial<AIChatRequest>;
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

  if (!prompt || prompt.length > 16_000) {
    res.status(400).json({
      error: !prompt
        ? 'Prompt không được để trống.'
        : 'Prompt vượt quá giới hạn 16.000 ký tự.',
    });
    return;
  }

  if (body.files !== undefined) {
    if (!Array.isArray(body.files) || body.files.length > 50) {
      res.status(400).json({ error: 'Danh sách files không hợp lệ hoặc vượt quá 50 tệp.' });
      return;
    }
    for (const f of body.files) {
      if (
        !f ||
        typeof f !== 'object' ||
        Array.isArray(f) ||
        typeof (f as { path?: unknown }).path !== 'string' ||
        !(f as { path: string }).path.trim() ||
        (f as { path: string }).path.length > 260 ||
        typeof (f as { content?: unknown }).content !== 'string' ||
        (f as { content: string }).content.length > 200_000
      ) {
        res.status(400).json({ error: 'Phần tử trong files phải có path và content dạng chuỗi hợp lệ.' });
        return;
      }
    }
  }

  if (body.attachedItems !== undefined) {
    if (!Array.isArray(body.attachedItems) || body.attachedItems.length > 30) {
      res.status(400).json({ error: 'Danh sách attachedItems không hợp lệ.' });
      return;
    }
    for (const item of body.attachedItems) {
      if (
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item) ||
        typeof (item as { title?: unknown }).title !== 'string' ||
        typeof (item as { kind?: unknown }).kind !== 'string'
      ) {
        res.status(400).json({ error: 'Phần tử trong attachedItems không đúng định dạng.' });
        return;
      }
    }
  }

  if (body.history !== undefined) {
    if (!Array.isArray(body.history) || body.history.length > 40) {
      res.status(400).json({ error: 'Lịch sử hội thoại (history) không hợp lệ.' });
      return;
    }
    for (const h of body.history) {
      if (
        !h ||
        typeof h !== 'object' ||
        Array.isArray(h) ||
        typeof (h as { content?: unknown }).content !== 'string' ||
        !['user', 'assistant', 'system'].includes(String((h as { role?: unknown }).role || ''))
      ) {
        res.status(400).json({ error: 'Phần tử trong history không đúng định dạng.' });
        return;
      }
    }
  }

  const rawByokKey = typeof req.headers['x-ff-byok-key'] === 'string' ? req.headers['x-ff-byok-key'].trim() : '';
  const rawByokUrl = typeof req.headers['x-ff-byok-url'] === 'string' ? req.headers['x-ff-byok-url'].trim() : '';
  if (rawByokKey && rawByokUrl) {
    const byokCheck = validateUpstreamBaseUrl(rawByokUrl);
    if (!byokCheck.ok) {
      recordSecurityEvent({
        type: 'invalid_input',
        status: 400,
        route: '/api/ai/chat',
        ipHash,
        actor: user?.username,
        detail: `Blocked unsafe x-ff-byok-url: ${byokCheck.error}`,
      });
      await flushSupabaseWrites();
      res.status(400).json({ error: byokCheck.error });
      return;
    }
  }

  const turnResult = consumeQuotaTurn(user, guestId, ipHash);
  if (!turnResult.allowed) {
    recordAiTelemetry('quota_blocked');
    const status =
      turnResult.reason === 'blocked' || turnResult.reason === 'sandbox_disabled' ? 403 : 429;
    recordSecurityEvent({
      type: 'quota_blocked',
      status,
      route: '/api/ai/chat',
      ipHash,
      actor: user?.username,
      detail: `AI request blocked (${turnResult.reason || 'limit'})`,
    });
    await flushSupabaseWrites();
    const errorMsg =
      turnResult.reason === 'blocked'
        ? 'Phiên hoặc địa chỉ IP của bạn đang bị tạm khóa sử dụng AI.'
        : turnResult.reason === 'sandbox_disabled'
          ? 'Chế độ AI Sandbox cho khách đang tạm đóng. Vui lòng đăng nhập để tiếp tục.'
          : turnResult.reason === 'ip_limit'
            ? 'Địa chỉ IP đã đạt giới hạn lượt sử dụng AI trong ngày.'
            : 'Đã đạt giới hạn lượt sử dụng AI trong ngày cho phiên tiêu chuẩn.';
    res.status(status).json({
      error: errorMsg,
      quota: turnResult.quota,
    });
    return;
  }

  const clientSystemPrompt =
    typeof body.systemPrompt === 'string' ? body.systemPrompt.trim().slice(0, 1350) : '';
  const enrichedSystemPrompt = clientSystemPrompt
    ? `${clientSystemPrompt}\n\n${CRAFT_SYSTEM_GUIDANCE}`
    : CRAFT_SYSTEM_GUIDANCE;

  const chatReq: AIChatRequest = {
    projectId: typeof body.projectId === 'string' ? body.projectId : 'default-project',
    prompt,
    model: typeof body.model === 'string' ? body.model.trim() : undefined,
    agentMode: typeof body.agentMode === 'string' ? body.agentMode.trim() : undefined,
    stream: body.stream === true,
    systemPrompt: enrichedSystemPrompt.slice(0, 2000),
    temperature: typeof body.temperature === 'number' ? body.temperature : undefined,
    files: Array.isArray(body.files) ? body.files : [],
    attachedItems: Array.isArray(body.attachedItems) ? body.attachedItems : [],
    history: Array.isArray(body.history) ? body.history : [],
  };

  const acceptHeader = typeof req.headers.accept === 'string' ? req.headers.accept : '';
  const wantsStream = body.stream === true || acceptHeader.includes('text/event-stream');

  if (!wantsStream) {
    const generated = await runAIGeneration(chatReq, req.headers);
    recordAiTelemetry(generated.fallback ? 'fallback' : 'success');
    recordQuotaTokens(turnResult.quota.subjectId, ipHash, generated.tokens);
    await flushSupabaseWrites();

    const { usedKeyMask: _mask, ...publicGenerated } = generated;
    if (publicGenerated.upstreamError) {
      publicGenerated.upstreamError = sanitizeErrorText(publicGenerated.upstreamError);
    }

    res.status(200).json({
      ...publicGenerated,
      quota: getQuotaState(user, guestId, ipHash),
    });
    return;
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let clientDisconnected = false;
  const sseAbortController = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) {
      clientDisconnected = true;
      sseAbortController.abort();
    }
  });

  const writeSse = (event: string, data: unknown) => {
    if (clientDisconnected || res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const generated = await runAIGenerationStream(chatReq, req.headers, {
      onStage: (stageInfo) => writeSse('stage', stageInfo),
      onDelta: (chunk) => writeSse('delta', { text: chunk }),
      signal: sseAbortController.signal,
    });
    recordAiTelemetry(generated.fallback ? 'fallback' : 'success');
    recordQuotaTokens(turnResult.quota.subjectId, ipHash, generated.tokens);
    await flushSupabaseWrites();

    const { usedKeyMask: _mask, ...publicGenerated } = generated;
    if (publicGenerated.upstreamError) {
      publicGenerated.upstreamError = sanitizeErrorText(publicGenerated.upstreamError);
    }

    writeSse('result', {
      ...publicGenerated,
      quota: getQuotaState(user, guestId, ipHash),
    });
    writeSse('done', { ok: true });
  } catch (err) {
    const message = err instanceof Error ? sanitizeErrorText(err.message) : 'AI stream failed';
    writeSse('error', { message });
    writeSse('done', { ok: false });
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
}

export async function handleAuthAction(
  req: Request,
  res: Response,
  explicitAction?: string
): Promise<void> {
  await ensureHydrated();
  const action = (explicitAction || req.params.action || '').toLowerCase();
  const guestId = resolveGuestSessionId(req, res);
  const ipHash = getClientIpHash(req);

  if (action === 'me') {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    if (!enforceRateLimit(req, res, `auth:me:${ipHash}`, 120, 60_000)) return;
    const user = getAuthenticatedUser(req);
    const quota = getQuotaState(user, guestId, ipHash);
    res.status(200).json({ user: user ? toSafeClientUser(user) : null, quota });
    return;
  }

  if (action === 'google-config') {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    if (!enforceRateLimit(req, res, `auth:gcfg:${ipHash}`, 120, 60_000)) return;
    const clientId = getGoogleClientId();
    res.status(200).json({ enabled: Boolean(clientId), clientId });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (action === 'logout') {
    revokeSessionFromRequest(req);
    clearAuthCookies(res, req);
    await flushSupabaseWrites();
    const quota = getQuotaState(null, guestId, ipHash);
    res.status(200).json({ ok: true, user: null, quota });
    return;
  }

  const rateLimitCap = action === 'register' ? 20 : 15;
  if (!enforceRateLimit(req, res, `auth:${action}:${ipHash}`, rateLimitCap, 15 * 60_000)) {
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;

  if (action === 'register') {
    const result = registerStandardUser({
      username: String(body.username || ''),
      email: typeof body.email === 'string' ? body.email : undefined,
      password: String(body.password || ''),
      name: typeof body.name === 'string' ? body.name : undefined,
    });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    setAuthCookies(res, result.user, req);
    appendAuditLog(result.user.username, 'USER_REGISTER', result.user.id, 'Dang ky tai khoan moi');
    await flushSupabaseWrites();
    const quota = getQuotaState(result.user, guestId, ipHash);
    res.status(201).json({ user: toSafeClientUser(result.user), quota });
    return;
  }

  if (action === 'login') {
    const identifier = String(body.identifier || body.username || body.email || '').trim();
    const password = String(body.password || '');
    const lock = checkLoginLockout('user', ipHash, identifier);
    if (lock.locked) {
      res.setHeader('Retry-After', String(lock.retryAfterSec));
      recordSecurityEvent({
        type: 'auth_locked',
        status: 429,
        route: '/api/auth/login',
        ipHash,
        actor: identifier,
        detail: 'Standard login locked after repeated failures',
      });
      await flushSupabaseWrites();
      res.status(429).json({
        error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.',
        retryAfterSec: lock.retryAfterSec,
      });
      return;
    }

    const stdAttempt = loginStandardUser({ identifier, password });
    if (!stdAttempt.ok) {
      recordLoginFailure('user', ipHash, identifier);
      recordSecurityEvent({
        type: 'auth_failed',
        status: 401,
        route: '/api/auth/login',
        ipHash,
        actor: identifier,
        detail: 'Invalid standard login credentials',
      });
      await flushSupabaseWrites();
      res.status(401).json({ error: stdAttempt.error });
      return;
    }

    clearLoginFailures('user', ipHash, identifier);
    setAuthCookies(res, stdAttempt.user, req);
    appendAuditLog(stdAttempt.user.username, 'USER_LOGIN', stdAttempt.user.id, 'Dang nhap thanh cong');
    await flushSupabaseWrites();
    const quota = getQuotaState(stdAttempt.user, guestId, ipHash);
    res.status(200).json({ user: toSafeClientUser(stdAttempt.user), quota });
    return;
  }

  if (action === 'google') {
    const credential = String(body.credential || '');
    const verified = await verifyGoogleIdToken(credential);
    if (!verified.ok) {
      recordSecurityEvent({
        type: 'auth_failed',
        status: 401,
        route: '/api/auth/google',
        ipHash,
        detail: verified.error,
      });
      await flushSupabaseWrites();
      res.status(401).json({ error: verified.error });
      return;
    }
    const authRes = loginOrRegisterGoogleUser(verified);
    if (!authRes.ok) {
      recordSecurityEvent({
        type: 'auth_failed',
        status: 401,
        route: '/api/auth/google',
        ipHash,
        detail: 'Admin account rejected on public Google login',
      });
      await flushSupabaseWrites();
      res.status(401).json({ error: authRes.error });
      return;
    }
    setAuthCookies(res, authRes.user, req);
    appendAuditLog(
      authRes.user.username,
      authRes.isNew ? 'GOOGLE_REGISTER' : 'GOOGLE_LOGIN',
      authRes.user.id,
      `Dang nhap Google da xac minh (${maskEmail(verified.email)})`
    );
    await flushSupabaseWrites();
    const quota = getQuotaState(authRes.user, guestId, ipHash);
    res.status(200).json({ user: toSafeClientUser(authRes.user), quota });
    return;
  }

  if (action === 'admin-login' || action === 'admin') {
    const username = String(body.username || body.identifier || '').trim();
    const password = String(body.password || '');
    const lock = checkLoginLockout('admin', ipHash, username);
    if (lock.locked) {
      res.setHeader('Retry-After', String(lock.retryAfterSec));
      recordSecurityEvent({
        type: 'auth_locked',
        status: 429,
        route: `/api/auth/${action}`,
        ipHash,
        actor: username,
        detail: 'Admin login locked after repeated failures',
      });
      await flushSupabaseWrites();
      res.status(429).json({
        error: 'Cổng quản trị tạm khóa do đăng nhập sai nhiều lần.',
        retryAfterSec: lock.retryAfterSec,
      });
      return;
    }

    const result = loginAdminUser({ username, password });
    if (!result.ok) {
      recordLoginFailure('admin', ipHash, username);
      recordSecurityEvent({
        type: 'auth_failed',
        status: 401,
        route: `/api/auth/${action}`,
        ipHash,
        actor: username,
        detail: 'Invalid admin login attempt',
      });
      await flushSupabaseWrites();
      res.status(401).json({ error: result.error });
      return;
    }
    clearLoginFailures('admin', ipHash, username);
    setAuthCookies(res, result.user, req);
    appendAuditLog(result.user.username, 'ADMIN_LOGIN', result.user.id, 'Dang nhap Admin Console');
    await flushSupabaseWrites();
    const quota = getQuotaState(result.user, guestId, ipHash);
    res.status(200).json({ user: toSafeClientUser(result.user), quota });
    return;
  }

  res.status(404).json({ error: `Unknown auth action: ${action}` });
}

export async function handleAdminAction(
  req: Request,
  res: Response,
  explicitAction?: string
): Promise<void> {
  await ensureHydrated();
  const action = (explicitAction || req.params.action || '').toLowerCase();
  const subPath = req.path.replace(/^\/api\/admin\/?/i, '').toLowerCase();
  const resolvedAction = explicitAction ? explicitAction.toLowerCase() : subPath || action;
  const ipHash = getClientIpHash(req);
  const user = getAuthenticatedUser(req);

  if (!user) {
    recordSecurityEvent({
      type: 'unauthorized_admin',
      status: 401,
      route: req.path || '/api/admin',
      ipHash,
      detail: 'Unauthenticated request to Admin API',
    });
    await flushSupabaseWrites();
    res.status(401).json({
      error: 'Yêu cầu xác thực quản trị viên.',
    });
    return;
  }

  if (user.role !== 'admin') {
    recordSecurityEvent({
      type: 'forbidden_admin',
      status: 403,
      route: req.path || '/api/admin',
      ipHash,
      actor: user.username,
      detail: 'Non-admin user attempted to access Admin API',
    });
    await flushSupabaseWrites();
    res.status(403).json({
      error: 'Truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền truy cập Admin Console.',
    });
    return;
  }

  if (resolvedAction === 'changelog' && req.method === 'GET') {
    res.status(200).json({ changelog: getPublicChangelog() });
    return;
  }

  if (resolvedAction === 'security-events' && req.method === 'GET') {
    const rawLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
    const limit = Number.isFinite(rawLimit) ? rawLimit : 50;
    res.status(200).json({ events: getSecurityEvents(limit) });
    return;
  }

  if ((resolvedAction === 'state' || !resolvedAction) && req.method === 'GET') {
    res.status(200).json({ state: getAdminStateSnapshot() });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;

  if (resolvedAction === 'gateway') {
    if (typeof body.baseUrl === 'string' && body.baseUrl.trim()) {
      const gwUrlCheck = validateUpstreamBaseUrl(body.baseUrl);
      if (!gwUrlCheck.ok) {
        res.status(400).json({ error: gwUrlCheck.error });
        return;
      }
    }
    const gateway = updateGatewayOverride(
      {
        enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
        protocol:
          body.protocol === 'openai-compatible' ||
          body.protocol === 'anthropic' ||
          body.protocol === 'gemini'
            ? body.protocol
            : undefined,
        baseUrl: typeof body.baseUrl === 'string' ? body.baseUrl : undefined,
        model: typeof body.model === 'string' ? body.model : undefined,
        apiKey: typeof body.apiKey === 'string' ? body.apiKey : undefined,
        clearApiKey: body.clearApiKey === true,
        systemPromptSuffix:
          typeof body.systemPromptSuffix === 'string' ? body.systemPromptSuffix : undefined,
        standardTurnLimit:
          typeof body.standardTurnLimit === 'number' ? body.standardTurnLimit : undefined,
        dailyUserLimit:
          typeof body.dailyUserLimit === 'number' ? body.dailyUserLimit : undefined,
        dailyIpLimit:
          typeof body.dailyIpLimit === 'number' ? body.dailyIpLimit : undefined,
        guestSandboxEnabled:
          typeof body.guestSandboxEnabled === 'boolean' ? body.guestSandboxEnabled : undefined,
      },
      user.username
    );
    await flushSupabaseWrites();
    res.status(200).json({ gateway, state: getAdminStateSnapshot() });
    return;
  }

  if (resolvedAction === 'quotas') {
    const subjectId = String(body.subjectId || '').trim();
    if (!subjectId || subjectId.length > 128 || isReservedPrototypeKey(subjectId)) {
      res.status(400).json({ error: 'Thiếu hoặc sai định dạng subjectId.' });
      return;
    }
    const kind =
      body.kind === undefined
        ? undefined
        : body.kind === 'user' || body.kind === 'ip' || body.kind === 'guest'
          ? body.kind
          : null;
    if (kind === null) {
      res.status(400).json({ error: 'Loại subjectId (kind) không hợp lệ.' });
      return;
    }
    const actionType =
      body.action === undefined
        ? undefined
        : body.action === 'set-limit' ||
            body.action === 'block' ||
            body.action === 'unblock' ||
            body.action === 'reset'
          ? body.action
          : null;
    if (actionType === null) {
      res.status(400).json({ error: 'Hành động quản trị quota không hợp lệ.' });
      return;
    }
    const rawLimit =
      body.customLimit !== undefined
        ? body.customLimit
        : body.dailyLimit !== undefined
          ? body.dailyLimit
          : body.limit;
    let customLimit: number | null | undefined;
    if (rawLimit === undefined) {
      customLimit = undefined;
    } else if (rawLimit === null) {
      customLimit = null;
    } else if (
      typeof rawLimit !== 'number' ||
      !Number.isFinite(rawLimit) ||
      rawLimit < 1 ||
      rawLimit > 5000
    ) {
      res.status(400).json({ error: 'Giới hạn lượt mỗi ngày phải từ 1 đến 5000.' });
      return;
    } else {
      customLimit = Math.round(rawLimit);
    }
    const blocked =
      typeof body.blocked === 'boolean'
        ? body.blocked
        : actionType === 'block'
          ? true
          : actionType === 'unblock'
            ? false
            : undefined;
    const reset = body.reset === true || actionType === 'reset';
    adminUpdateQuotaControl({ subjectId, kind, customLimit, blocked, reset }, user.username);
    await flushSupabaseWrites();
    res.status(200).json({ state: getAdminStateSnapshot() });
    return;
  }

  if (resolvedAction === 'key-pool/test') {
    const rawMode =
      body.mode === undefined ? 'pool' : typeof body.mode === 'string' ? body.mode.trim() : '';
    if (
      rawMode !== 'pool' &&
      rawMode !== 'key1' &&
      rawMode !== 'key2' &&
      rawMode !== 'failover_sim'
    ) {
      res.status(400).json({ error: 'Chế độ kiểm tra key pool không hợp lệ.' });
      return;
    }
    const mode = rawMode;
    const prompt = typeof body.prompt === 'string' ? body.prompt : undefined;
    const probe = await runLiveKeyPoolProbe({ mode, prompt });
    const { simulatedPoolSnapshot, ...publicProbe } = probe;
    appendAuditLog(
      user.username,
      'KEY_POOL_TEST',
      mode,
      `Probe=${mode} ok=${probe.ok} key=${probe.usedKeyMask || 'none'} tokens=${probe.tokens.total}`
    );
    await flushSupabaseWrites();
    const stateSnapshot = getAdminStateSnapshot();
    if (simulatedPoolSnapshot) {
      stateSnapshot.keyPool = simulatedPoolSnapshot;
    }
    const httpStatus = probe.statusCode === 429 ? 429 : probe.ok ? 200 : 502;
    res.status(httpStatus).json({
      ...publicProbe,
      state: stateSnapshot,
    });
    return;
  }

  if (resolvedAction === 'reset-quota') {
    const subjectId = String(body.subjectId || '').trim();
    if (!subjectId || isReservedPrototypeKey(subjectId)) {
      res.status(400).json({ error: 'Thieu subjectId.' });
      return;
    }
    adminResetQuota(subjectId, user.username);
    await flushSupabaseWrites();
    res.status(200).json({ state: getAdminStateSnapshot() });
    return;
  }

  if (resolvedAction === 'toggle-role') {
    const userId = String(body.userId || '').trim();
    if (!userId) {
      res.status(400).json({ error: 'Thieu userId.' });
      return;
    }
    adminToggleUserRole(userId, user.username);
    await flushSupabaseWrites();
    res.status(200).json({ state: getAdminStateSnapshot() });
    return;
  }

  if (resolvedAction === 'moderate') {
    const reportId = String(body.reportId || '').trim();
    const statusRaw = String(body.status || '').trim() as ModerationReportStatus;
    if (!reportId || !['approved', 'hidden', 'dismissed', 'pending'].includes(statusRaw)) {
      res.status(400).json({ error: 'Tham so kiem duyet khong hop le.' });
      return;
    }
    adminModerateReport(reportId, statusRaw, user.username);
    await flushSupabaseWrites();
    res.status(200).json({ state: getAdminStateSnapshot() });
    return;
  }

  if (resolvedAction === 'changelog') {
    const version = String(body.version || '').trim();
    const title = String(body.title || '').trim();
    const notes = String(body.notes || '').trim();
    if (!title || !notes) {
      res.status(400).json({ error: 'Vui long nhap day du tieu de va noi dung changelog.' });
      return;
    }
    const entry = adminAddChangelog({ version, title, notes }, user.username);
    await flushSupabaseWrites();
    res.status(201).json({ entry, state: getAdminStateSnapshot() });
    return;
  }

  res.status(404).json({ error: `Unknown admin action: ${resolvedAction}` });
}

function sanitizeClubDossier(
  raw: unknown,
  ownerHandle: string
): { ok: true; value: ClubHandoverDossier } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Định dạng Club Handover Dossier không hợp lệ.' };
  }
  const obj = raw as Record<string, unknown>;
  const projectTitle = typeof obj.projectTitle === 'string' ? obj.projectTitle.trim() : '';
  if (!projectTitle || projectTitle.length > 180) {
    return { ok: false, error: 'Thiếu hoặc sai tiêu đề Club Handover Dossier.' };
  }
  const handoverNotes =
    typeof obj.handoverNotes === 'string' ? obj.handoverNotes.slice(0, 4000) : '';
  const nextMilestones = Array.isArray(obj.nextMilestones)
    ? obj.nextMilestones
        .map((m) => String(m).trim().slice(0, 200))
        .filter(Boolean)
        .slice(0, 20)
    : [];
  const architectureSummary =
    typeof obj.architectureSummary === 'string'
      ? obj.architectureSummary.slice(0, 4000)
      : undefined;
  return {
    ok: true,
    value: {
      projectTitle,
      handoverNotes,
      nextMilestones,
      architectureSummary,
      ownerHandle,
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function handleCommunityAction(
  req: Request,
  res: Response,
  explicitAction?: string
): Promise<void> {
  await ensureHydrated();
  const action = (explicitAction || req.params.action || 'list').toLowerCase();
  const user = getAuthenticatedUser(req);
  const guestId = resolveGuestSessionId(req, res);
  const ipHash = getClientIpHash(req);

  const actorAuthor: CommunityAuthor = user
    ? {
        id: user.id,
        name: user.name,
        handle: user.username,
        role: user.role === 'admin' ? 'Quản trị viên' : 'Thành viên',
      }
    : {
        id: `guest-${guestId.slice(0, 8)}`,
        name: 'Guest Developer',
        handle: `guest_${guestId.slice(0, 6)}`,
        role: 'Khách',
      };

  if (req.method === 'GET' && (action === 'list' || action === 'state' || action === 'posts')) {
    if (!enforceRateLimit(req, res, `community:get:${ipHash}`, 60, 60_000)) return;
    const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : 1;
    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20;
    const listing = listCommunityPosts({
      channel,
      q,
      page: Number.isFinite(pageRaw) ? pageRaw : 1,
      limit: Number.isFinite(limitRaw) ? limitRaw : 20,
      viewerActorId: actorAuthor.id,
    });
    res.status(200).json(listing);
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (
    !enforceRateLimit(
      req,
      res,
      `community:post:${ipHash}:${actorAuthor.id}`,
      25,
      60_000,
      user?.username
    )
  ) {
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;

  if (action === 'create' || action === 'posts') {
    const title = String(body.title || '').trim();
    const rawBody =
      typeof body.body === 'string'
        ? body.body
        : typeof body.description === 'string'
          ? body.description
          : '';
    if (!title || title.length > 180) {
      res.status(400).json({ error: 'Tiêu đề bài viết phải từ 1 đến 180 ký tự.' });
      return;
    }
    if (rawBody.length > 8000) {
      res.status(400).json({ error: 'Nội dung bài viết vượt quá giới hạn 8.000 ký tự.' });
      return;
    }
    const category = typeof body.category === 'string' ? body.category.trim() : undefined;
    if (category && category.length > 60) {
      res.status(400).json({ error: 'Danh mục vượt quá 60 ký tự.' });
      return;
    }
    const tags = Array.isArray(body.tags)
      ? body.tags
          .map((t) => String(t).trim())
          .filter(Boolean)
          .slice(0, 10)
          .map((t) => t.slice(0, 32))
      : undefined;
    const payload = typeof body.payload === 'string' ? body.payload : undefined;
    if (payload && payload.length > 24000) {
      res.status(400).json({ error: 'Payload vượt quá giới hạn 24.000 ký tự.' });
      return;
    }
    const fileType = typeof body.fileType === 'string' ? body.fileType.trim().slice(0, 24) : undefined;
    const rawSnippet = body.demoSnippet as { html?: unknown; css?: unknown; js?: unknown } | undefined;
    const demoSnippet =
      rawSnippet && typeof rawSnippet === 'object'
        ? {
            html: String(rawSnippet.html || '').slice(0, 24000),
            css: String(rawSnippet.css || '').slice(0, 24000),
            js: typeof rawSnippet.js === 'string' ? rawSnippet.js.slice(0, 24000) : undefined,
          }
        : undefined;

    const channelRaw = String(body.channel || 'qa') as CommunityChannel;
    let sanitizedDossier: ClubHandoverDossier | undefined;
    if (channelRaw === 'clubs' && body.activeDossier !== undefined) {
      const dossierRes = sanitizeClubDossier(body.activeDossier, actorAuthor.handle);
      if (!dossierRes.ok) {
        res.status(400).json({ error: dossierRes.error });
        return;
      }
      sanitizedDossier = dossierRes.value;
    }

    const post = createCommunityPost({
      channel: channelRaw,
      title,
      body: rawBody,
      category,
      tags,
      author: actorAuthor,
      demoSnippet,
      payload,
      fileType,
      activeDossier: sanitizedDossier,
    });
    await flushSupabaseWrites();
    res.status(201).json({ post: toPublicCommunityPost(post, actorAuthor.id, { fullDetail: true }) });
    return;
  }

  if (action === 'upvote') {
    const postId = String(body.postId || '').trim();
    const post = upvoteCommunityPost(postId, actorAuthor.id);
    if (!post) {
      res.status(404).json({ error: 'Khong tim thay bai viet.' });
      return;
    }
    await flushSupabaseWrites();
    res.status(200).json({ post: toPublicCommunityPost(post, actorAuthor.id, { fullDetail: true }) });
    return;
  }

  if (action === 'answer') {
    const postId = String(body.postId || '').trim();
    const content = String(body.content || '').trim();
    if (!postId || !content || content.length > 4000) {
      res.status(400).json({ error: 'Nội dung câu trả lời phải từ 1 đến 4.000 ký tự.' });
      return;
    }
    const post = addCommunityAnswer(postId, { content, author: actorAuthor });
    if (!post) {
      res.status(404).json({ error: 'Khong tim thay cau hoi.' });
      return;
    }
    await flushSupabaseWrites();
    res.status(200).json({ post: toPublicCommunityPost(post, actorAuthor.id, { fullDetail: true }) });
    return;
  }

  if (action === 'accept') {
    if (!user) {
      recordSecurityEvent({
        type: 'idor_denied',
        status: 401,
        route: '/api/community/accept',
        ipHash,
        detail: 'Unauthenticated attempt to accept community answer',
      });
      await flushSupabaseWrites();
      res.status(401).json({ error: 'Yêu cầu đăng nhập để chọn lời giải chuẩn.' });
      return;
    }
    const postId = String(body.postId || '').trim();
    const answerId = String(body.answerId || '').trim();
    const target = findCommunityPostById(postId);
    if (!target) {
      res.status(404).json({ error: 'Khong tim thay cau hoi.' });
      return;
    }
    if (target.author.id !== user.id && user.role !== 'admin') {
      recordSecurityEvent({
        type: 'idor_denied',
        status: 403,
        route: '/api/community/accept',
        ipHash,
        actor: user.username,
        detail: `Non-author attempted accept on ${postId}`,
      });
      await flushSupabaseWrites();
      res.status(403).json({
        error: 'Chỉ tác giả câu hỏi hoặc Quản trị viên mới có quyền chấp nhận lời giải.',
      });
      return;
    }
    const post = acceptCommunityAnswer(postId, answerId);
    if (!post) {
      res.status(404).json({ error: 'Khong tim thay cau hoi hoac cau tra loi.' });
      return;
    }
    await flushSupabaseWrites();
    res.status(200).json({ post: toPublicCommunityPost(post, actorAuthor.id, { fullDetail: true }) });
    return;
  }

  if (action === 'fork') {
    const postId = String(body.postId || '').trim();
    const post = forkCommunityItem(postId);
    if (!post) {
      res.status(404).json({ error: 'Khong tim thay tai nguyen de fork.' });
      return;
    }
    await flushSupabaseWrites();
    res.status(200).json({ post: toPublicCommunityPost(post, actorAuthor.id, { fullDetail: true }) });
    return;
  }

  if (action === 'dossier') {
    if (!user) {
      recordSecurityEvent({
        type: 'idor_denied',
        status: 401,
        route: '/api/community/dossier',
        ipHash,
        detail: 'Unauthenticated attempt to update Club Handover Dossier',
      });
      await flushSupabaseWrites();
      res.status(401).json({ error: 'Yêu cầu đăng nhập để cập nhật Club Handover Dossier.' });
      return;
    }
    const clubId = String(body.clubId || body.postId || '').trim();
    if (!clubId) {
      res.status(400).json({ error: 'Thiếu hoặc sai tiêu đề Club Handover Dossier.' });
      return;
    }
    const rawDossierInput = body.dossier !== undefined ? body.dossier : body.activeDossier;
    const dossierRes = sanitizeClubDossier(rawDossierInput, actorAuthor.handle);
    if (!dossierRes.ok) {
      res.status(400).json({ error: dossierRes.error });
      return;
    }
    const target = findCommunityPostById(clubId);
    if (!target || target.channel !== 'clubs') {
      res.status(404).json({ error: 'Khong tim thay Club.' });
      return;
    }
    const isOwner = user.role === 'admin' || target.author.id === user.id;
    if (!isOwner) {
      recordSecurityEvent({
        type: 'idor_denied',
        status: 403,
        route: '/api/community/dossier',
        ipHash,
        actor: user.username,
        detail: `Unauthorized dossier update on club ${clubId}`,
      });
      await flushSupabaseWrites();
      res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa Club Handover Dossier này.' });
      return;
    }
    const post = updateClubDossier(clubId, dossierRes.value);
    if (!post) {
      res.status(404).json({ error: 'Khong tim thay Club.' });
      return;
    }
    await flushSupabaseWrites();
    res.status(200).json({ post: toPublicCommunityPost(post, actorAuthor.id, { fullDetail: true }) });
    return;
  }

  if (action === 'report') {
    const targetId = String(body.targetId || body.postId || '').trim();
    const reason = String(body.reason || '').trim();
    if (!targetId || reason.length < 3 || reason.length > 500) {
      res.status(400).json({ error: 'Lý do báo cáo phải từ 3 đến 500 ký tự.' });
      return;
    }
    const target = findCommunityPostById(targetId);
    if (!target) {
      res.status(404).json({ error: 'Không tìm thấy nội dung cần báo cáo.' });
      return;
    }
    const report = submitModerationReport({
      targetId,
      reason,
      reporterId: actorAuthor.id,
      reporterName: actorAuthor.name,
    });
    await flushSupabaseWrites();
    res.status(201).json({ ok: true, reportId: report.id });
    return;
  }

  res.status(404).json({ error: `Unknown community action: ${action}` });
}

export async function handleProjectsAction(
  req: Request,
  res: Response,
  explicitAction?: string
): Promise<void> {
  await ensureHydrated();
  const action = (explicitAction || req.params.action || 'list').toLowerCase();
  const user = getAuthenticatedUser(req);

  if (action === 'list') {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    if (!user) {
      res.status(200).json({ authenticated: false, projects: [] });
      return;
    }
    const projects = await listUserProjects(user.id);
    res.status(200).json({ authenticated: true, projects });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!user) {
    res.status(401).json({ error: 'Yêu cầu đăng nhập để đồng bộ dự án.' });
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;

  if (action === 'sync') {
    if (
      body.project !== undefined &&
      (!body.project || typeof body.project !== 'object' || Array.isArray(body.project))
    ) {
      res.status(400).json({ error: 'Dữ liệu dự án không hợp lệ.' });
      return;
    }
    const rawProject = (
      body.project && typeof body.project === 'object' ? body.project : body
    ) as Partial<WorkspaceProject>;
    const syncResult = await syncUserProject(user.id, rawProject);
    if (!syncResult.ok) {
      if (syncResult.reason === 'forbidden') {
        recordSecurityEvent({
          type: 'idor_denied',
          status: 403,
          route: '/api/projects/sync',
          ipHash: getClientIpHash(req),
          actor: user.username,
          detail: `Cross-user project sync denied for id=${String(rawProject.id || '').slice(0, 64)}`,
        });
        await flushSupabaseWrites();
        res.status(403).json({ error: 'Bạn không có quyền ghi đè dự án của người dùng khác.' });
        return;
      }
      if (syncResult.reason === 'persistence_error') {
        res.status(502).json({ error: 'Không thể lưu dự án lên máy chủ.' });
        return;
      }
      res.status(400).json({ error: 'Dữ liệu dự án không hợp lệ.' });
      return;
    }
    res.status(200).json({ ok: true, project: syncResult.project });
    return;
  }

  if (action === 'delete') {
    const projectId = String(body.projectId || body.id || '').trim();
    if (!projectId) {
      res.status(400).json({ error: 'Thiếu projectId.' });
      return;
    }
    await deleteUserProject(user.id, projectId);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(404).json({ error: `Unknown projects action: ${action}` });
}

export async function handleListPublishedPages(req: Request, res: Response): Promise<void> {
  const ipHash = getClientIpHash(req);
  if (!enforceRateLimit(req, res, `pages:get:${ipHash}`, 120, 60_000)) return;
  await ensureHydrated();
  res.status(200).json({ pages: listPublishedPages() });
}

export async function handlePublishPage(req: Request, res: Response): Promise<void> {
  await ensureHydrated();
  const user = getAuthenticatedUser(req);
  const guestId = resolveGuestSessionId(req, res);
  const ipHash = getClientIpHash(req);
  const actorId = user ? user.id : `guest:${guestId}`;

  if (!enforceRateLimit(req, res, `pages:publish:${ipHash}:${actorId}`, 15, 60_000, user?.username)) {
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;
  const authorName =
    typeof body.authorName === 'string' && body.authorName.trim()
      ? body.authorName.trim()
      : user
        ? user.name || user.username
        : 'Thành viên F-FORUM';
  const authorRole =
    typeof body.authorRole === 'string' && body.authorRole.trim()
      ? body.authorRole.trim()
      : user
        ? user.role === 'admin'
          ? 'Quản trị viên'
          : 'Thành viên'
        : 'Khách';

  const result = publishUserPage({
    title: typeof body.title === 'string' ? body.title : '',
    summary: typeof body.summary === 'string' ? body.summary : '',
    category: body.category as PublishedPageCategory,
    personality: body.personality as BrandPersonality,
    html: typeof body.html === 'string' ? body.html : '',
    sourceIds: Array.isArray(body.sourceIds) ? (body.sourceIds as string[]) : [],
    authorName,
    authorRole,
    slug: typeof body.slug === 'string' ? body.slug : undefined,
  });

  if (!result.ok) {
    res.status(result.status || 400).json({ error: result.error });
    return;
  }

  await flushSupabaseWrites();
  res.status(201).json({
    page: result.page,
    url: `/p/${result.page.slug}`,
  });
}

export async function handleGetPublishedPage(req: Request, res: Response): Promise<void> {
  const ipHash = getClientIpHash(req);
  if (!enforceRateLimit(req, res, `pages:get:${ipHash}`, 120, 60_000)) return;
  await ensureHydrated();
  const slug = typeof req.params.slug === 'string' ? req.params.slug : '';
  const page = getPublishedPageBySlug(slug);
  if (!page) {
    res.status(404).json({ error: 'Không tìm thấy trang đã xuất bản.' });
    return;
  }
  res.status(200).json({ page });
}

export async function handleLikePublishedPage(req: Request, res: Response): Promise<void> {
  await ensureHydrated();
  const user = getAuthenticatedUser(req);
  const guestId = resolveGuestSessionId(req, res);
  const ipHash = getClientIpHash(req);
  const actorId = user ? user.id : `guest:${guestId}`;

  if (!enforceRateLimit(req, res, `pages:like:${ipHash}:${actorId}`, 40, 60_000, user?.username)) {
    return;
  }

  const slug = typeof req.params.slug === 'string' ? req.params.slug : '';
  const result = toggleLikePublishedPage(slug, actorId);
  if (!result) {
    res.status(404).json({ error: 'Không tìm thấy trang đã xuất bản.' });
    return;
  }
  await flushSupabaseWrites();
  res.status(200).json(result);
}

export async function handleRemixPublishedPage(req: Request, res: Response): Promise<void> {
  await ensureHydrated();
  const user = getAuthenticatedUser(req);
  const guestId = resolveGuestSessionId(req, res);
  const ipHash = getClientIpHash(req);
  const actorId = user ? user.id : `guest:${guestId}`;

  if (!enforceRateLimit(req, res, `pages:remix:${ipHash}:${actorId}`, 30, 60_000, user?.username)) {
    return;
  }

  const slug = typeof req.params.slug === 'string' ? req.params.slug : '';
  const result = incrementRemixPublishedPage(slug);
  if (!result) {
    res.status(404).json({ error: 'Không tìm thấy trang đã xuất bản.' });
    return;
  }
  await flushSupabaseWrites();
  res.status(200).json(result);
}

export async function handlePublicPublishedPage(req: Request, res: Response): Promise<void> {
  const ipHash = getClientIpHash(req);
  if (!enforceRateLimit(req, res, `public-page:get:${ipHash}`, 120, 60_000)) return;
  await ensureHydrated();

  const slug = typeof req.params.slug === 'string' ? req.params.slug : '';
  const page = getPublishedPageBySlug(slug);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', PUBLISHED_PAGE_CSP_DIRECTIVES);
  if (!page) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(404).send(renderNotFoundPageHtml(slug));
    return;
  }
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.status(200).send(renderPublicPageHtml(page));
}

export async function handleRecordBehaviorSignal(req: Request, res: Response): Promise<void> {
  await ensureHydrated();
  const user = getAuthenticatedUser(req);
  const guestId = resolveGuestSessionId(req, res);
  const ipHash = getClientIpHash(req);
  const actorId = user ? user.id : `guest:${guestId}`;

  if (!enforceRateLimit(req, res, `signals:post:${ipHash}:${actorId}`, 60, 60_000, user?.username)) {
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;
  if (!isValidBehaviorSignal(body.signal)) {
    res.status(400).json({ error: 'Loại tín hiệu hành vi không hợp lệ.' });
    return;
  }

  const result = recordBehaviorSignal(
    {
      itemId: typeof body.itemId === 'string' ? body.itemId : '',
      library: typeof body.library === 'string' ? body.library : undefined,
      signal: body.signal,
      profileTag: typeof body.profileTag === 'string' ? body.profileTag : undefined,
    },
    actorId
  );

  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  await flushSupabaseWrites();
  res.status(200).json({ ok: true, score: result.score });
}

export async function handleGetBehaviorScores(req: Request, res: Response): Promise<void> {
  const ipHash = getClientIpHash(req);
  if (!enforceRateLimit(req, res, `signals:get:${ipHash}`, 120, 60_000)) return;
  await ensureHydrated();
  res.status(200).json({ scores: getBehaviorScores() });
}

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

function asyncRoute(handler: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    try {
      Promise.resolve(handler(req, res, next)).catch(next);
    } catch (err) {
      next(err);
    }
  };
}

app.get('/api/health', handleHealth);
app.get('/api/changelog', asyncRoute((req, res) => handlePublicChangelog(req, res)));
app.get('/api/metrics', asyncRoute((req, res) => handleMetricsAction(req, res)));
app.all('/api/metrics/:action', asyncRoute((req, res) => handleMetricsAction(req, res)));
app.get('/api/ai/quota', asyncRoute((req, res) => handleAiQuota(req, res)));
app.post('/api/ai/chat', asyncRoute((req, res) => handleAiChat(req, res)));
app.all('/api/auth/:action', asyncRoute((req, res) => handleAuthAction(req, res)));
app.all('/api/admin', asyncRoute((req, res) => handleAdminAction(req, res, 'state')));
app.all('/api/admin/*', asyncRoute((req, res) => handleAdminAction(req, res)));
app.all('/api/community/:action', asyncRoute((req, res) => handleCommunityAction(req, res)));
app.get('/api/community', asyncRoute((req, res) => handleCommunityAction(req, res, 'list')));
app.all('/api/projects/:action', asyncRoute((req, res) => handleProjectsAction(req, res)));
app.get('/api/projects', asyncRoute((req, res) => handleProjectsAction(req, res, 'list')));
app.get('/api/pages', asyncRoute((req, res) => handleListPublishedPages(req, res)));
app.post('/api/pages', asyncRoute((req, res) => handlePublishPage(req, res)));
app.get('/api/pages/:slug', asyncRoute((req, res) => handleGetPublishedPage(req, res)));
app.post('/api/pages/:slug/like', asyncRoute((req, res) => handleLikePublishedPage(req, res)));
app.post('/api/pages/:slug/remix', asyncRoute((req, res) => handleRemixPublishedPage(req, res)));
app.post('/api/signals', asyncRoute((req, res) => handleRecordBehaviorSignal(req, res)));
app.get('/api/signals/scores', asyncRoute((req, res) => handleGetBehaviorScores(req, res)));
app.get('/p/:slug', asyncRoute((req, res) => handlePublicPublishedPage(req, res)));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const errObj = (err && typeof err === 'object' ? err : {}) as {
    status?: unknown;
    statusCode?: unknown;
    type?: unknown;
    body?: unknown;
  };
  const statusCode =
    typeof errObj.status === 'number'
      ? errObj.status
      : typeof errObj.statusCode === 'number'
        ? errObj.statusCode
        : 500;

  if (
    err instanceof SyntaxError &&
    (statusCode === 400 || errObj.type === 'entity.parse.failed' || 'body' in errObj)
  ) {
    res.status(400).json({ error: 'Invalid JSON request body.' });
    return;
  }
  if (errObj.type === 'entity.too.large' || statusCode === 413) {
    res.status(413).json({ error: 'Request payload too large.' });
    return;
  }
  if (err instanceof URIError || statusCode === 400) {
    res.status(400).json({ error: 'Malformed request URL or parameter.' });
    return;
  }
  if (statusCode >= 400 && statusCode < 500) {
    res.status(statusCode).json({ error: 'Invalid request.' });
    return;
  }

  const rawMsg = err instanceof Error ? err.message : String(err || 'Unknown server error');
  console.error('[API ERROR]', sanitizeErrorText(rawMsg));
  res.status(500).json({ error: 'Internal server error' });
});
