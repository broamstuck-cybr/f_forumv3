import express, { type Request, type Response } from 'express';
import cors from 'cors';
import type {
  AIChatRequest,
  ClubHandoverDossier,
  CommunityAuthor,
  CommunityChannel,
  ModerationReportStatus,
  WorkspaceProject,
} from '../src/types/index';
import {
  adminAddChangelog,
  adminModerateReport,
  adminResetQuota,
  adminToggleUserRole,
  appendAuditLog,
  getAdminStateSnapshot,
  getPublicChangelog,
  recordAiTelemetry,
  updateGatewayOverride,
} from './adminStore.js';
import { runAIGeneration, runAIGenerationStream } from './aiEngine.js';
import {
  clearAuthCookies,
  getAuthenticatedUser,
  getGoogleClientId,
  loginAdminUser,
  loginOrRegisterGoogleUser,
  loginStandardUser,
  registerStandardUser,
  resolveGuestSessionId,
  setAuthCookies,
  verifyGoogleIdToken,
} from './authEngine.js';
import {
  acceptCommunityAnswer,
  addCommunityAnswer,
  createCommunityPost,
  forkCommunityItem,
  getCommunityState,
  submitModerationReport,
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
import { consumeQuotaTurn, getQuotaState } from './quotaStore.js';

ensureLocalEnvLoaded();

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

export function handleHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    service: 'f-forum-v3-api',
    version: '3.0.0',
    persistence: isSupabaseEnabled() ? 'supabase' : 'local-json',
    timestamp: new Date().toISOString(),
  });
}

export function handleMetricsAction(
  req: Request,
  res: Response,
  explicitAction?: string
): void {
  const action = (explicitAction || req.params.action || '').toLowerCase();

  if (!action && req.method === 'GET') {
    res.status(200).json(getSiteMetrics());
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;

  if (action === 'visit') {
    const visitorId = typeof body.visitorId === 'string' ? body.visitorId.trim() : '';
    if (!visitorId) {
      res.status(400).json({ error: 'Thiếu visitorId.' });
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
  const quota = getQuotaState(user, guestId);
  res.status(200).json({
    user,
    quota,
  });
}

export async function handleAiChat(req: Request, res: Response): Promise<void> {
  await ensureHydrated();
  const user = getAuthenticatedUser(req);
  const guestId = resolveGuestSessionId(req, res);
  const body = (req.body || {}) as Partial<AIChatRequest>;
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

  if (!prompt) {
    res.status(400).json({
      error: 'Prompt không được để trống.',
    });
    return;
  }

  const turnResult = consumeQuotaTurn(user, guestId);
  if (!turnResult.allowed) {
    recordAiTelemetry('quota_blocked');
    await flushSupabaseWrites();
    res.status(429).json({
      error:
        'Đã đạt giới hạn 15 lượt sử dụng AI cho phiên tiêu chuẩn. Vui lòng đăng nhập tài khoản Admin để sử dụng không giới hạn.',
      quota: turnResult.quota,
    });
    return;
  }

  const chatReq: AIChatRequest = {
    projectId: typeof body.projectId === 'string' ? body.projectId : 'default-project',
    prompt,
    model: typeof body.model === 'string' ? body.model.trim() : undefined,
    agentMode: typeof body.agentMode === 'string' ? body.agentMode.trim() : undefined,
    stream: body.stream === true,
    systemPrompt: typeof body.systemPrompt === 'string' ? body.systemPrompt.slice(0, 2000) : undefined,
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
    await flushSupabaseWrites();

    res.status(200).json({
      ...generated,
      quota: turnResult.quota,
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
  res.on('close', () => {
    if (!res.writableFinished) {
      clientDisconnected = true;
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
    });
    recordAiTelemetry(generated.fallback ? 'fallback' : 'success');
    await flushSupabaseWrites();

    writeSse('result', {
      ...generated,
      quota: turnResult.quota,
    });
    writeSse('done', { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI stream failed';
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

  if (action === 'me') {
    const user = getAuthenticatedUser(req);
    const quota = getQuotaState(user, guestId);
    res.status(200).json({ user, quota });
    return;
  }

  if (action === 'google-config') {
    const clientId = getGoogleClientId();
    res.status(200).json({ enabled: Boolean(clientId), clientId });
    return;
  }

  if (action === 'logout') {
    clearAuthCookies(res);
    const quota = getQuotaState(null, guestId);
    res.status(200).json({ ok: true, user: null, quota });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;

  if (action === 'register') {
    const result = registerStandardUser({
      username: String(body.username || ''),
      email: String(body.email || ''),
      password: String(body.password || ''),
      name: typeof body.name === 'string' ? body.name : undefined,
    });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    setAuthCookies(res, result.user);
    appendAuditLog(result.user.username, 'USER_REGISTER', result.user.id, 'Dang ky tai khoan moi');
    await flushSupabaseWrites();
    const quota = getQuotaState(result.user, guestId);
    res.status(201).json({ user: result.user, quota });
    return;
  }

  if (action === 'login') {
    const identifier = String(body.identifier || body.username || body.email || '').trim();
    const password = String(body.password || '');
    const adminAttempt = loginAdminUser({ username: identifier, password });
    if (adminAttempt.ok) {
      setAuthCookies(res, adminAttempt.user);
      appendAuditLog(adminAttempt.user.username, 'ADMIN_LOGIN', adminAttempt.user.id, 'Dang nhap Admin');
      await flushSupabaseWrites();
      const quota = getQuotaState(adminAttempt.user, guestId);
      res.status(200).json({ user: adminAttempt.user, quota });
      return;
    }

    const stdAttempt = loginStandardUser({ identifier, password });
    if (!stdAttempt.ok) {
      res.status(401).json({ error: stdAttempt.error });
      return;
    }
    setAuthCookies(res, stdAttempt.user);
    appendAuditLog(stdAttempt.user.username, 'USER_LOGIN', stdAttempt.user.id, 'Dang nhap thanh cong');
    await flushSupabaseWrites();
    const quota = getQuotaState(stdAttempt.user, guestId);
    res.status(200).json({ user: stdAttempt.user, quota });
    return;
  }

  if (action === 'google') {
    const credential = String(body.credential || '');
    const verified = await verifyGoogleIdToken(credential);
    if (!verified.ok) {
      res.status(401).json({ error: verified.error });
      return;
    }
    const authRes = loginOrRegisterGoogleUser(verified);
    setAuthCookies(res, authRes.user);
    appendAuditLog(
      authRes.user.username,
      authRes.isNew ? 'GOOGLE_REGISTER' : 'GOOGLE_LOGIN',
      authRes.user.id,
      `Dang nhap Google da xac minh (${verified.email})`
    );
    await flushSupabaseWrites();
    const quota = getQuotaState(authRes.user, guestId);
    res.status(200).json({ user: authRes.user, quota });
    return;
  }

  if (action === 'admin-login' || action === 'admin') {
    const username = String(body.username || body.identifier || '').trim();
    const password = String(body.password || '');
    const result = loginAdminUser({ username, password });
    if (!result.ok) {
      res.status(401).json({ error: result.error });
      return;
    }
    setAuthCookies(res, result.user);
    appendAuditLog(result.user.username, 'ADMIN_LOGIN', result.user.id, 'Dang nhap Admin Console');
    await flushSupabaseWrites();
    const quota = getQuotaState(result.user, guestId);
    res.status(200).json({ user: result.user, quota });
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

  if (action === 'changelog' && req.method === 'GET') {
    res.status(200).json({ changelog: getPublicChangelog() });
    return;
  }

  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    res.status(403).json({
      error: 'Truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền truy cập Admin Console.',
    });
    return;
  }

  if (action === 'state' || (req.method === 'GET' && !action)) {
    res.status(200).json({ state: getAdminStateSnapshot() });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;

  if (action === 'gateway') {
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
        systemPromptSuffix:
          typeof body.systemPromptSuffix === 'string' ? body.systemPromptSuffix : undefined,
        standardTurnLimit:
          typeof body.standardTurnLimit === 'number' ? body.standardTurnLimit : undefined,
        guestSandboxEnabled:
          typeof body.guestSandboxEnabled === 'boolean' ? body.guestSandboxEnabled : undefined,
      },
      user.username
    );
    await flushSupabaseWrites();
    res.status(200).json({ gateway, state: getAdminStateSnapshot() });
    return;
  }

  if (action === 'reset-quota') {
    const subjectId = String(body.subjectId || '').trim();
    if (!subjectId) {
      res.status(400).json({ error: 'Thieu subjectId.' });
      return;
    }
    adminResetQuota(subjectId, user.username);
    await flushSupabaseWrites();
    res.status(200).json({ state: getAdminStateSnapshot() });
    return;
  }

  if (action === 'toggle-role') {
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

  if (action === 'moderate') {
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

  if (action === 'changelog') {
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

  res.status(404).json({ error: `Unknown admin action: ${action}` });
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

  if (req.method === 'GET' || action === 'list' || action === 'state' || action === 'posts') {
    if (req.method === 'GET') {
      res.status(200).json(getCommunityState(false));
      return;
    }
  }

  const body = (req.body || {}) as Record<string, unknown>;

  if (action === 'create' || (action === 'posts' && req.method === 'POST')) {
    const title = String(body.title || '').trim();
    if (!title) {
      res.status(400).json({ error: 'Tiêu đề bài viết không được để trống.' });
      return;
    }
    const channelRaw = String(body.channel || 'qa') as CommunityChannel;
    const post = createCommunityPost({
      channel: channelRaw,
      title,
      body: typeof body.body === 'string' ? body.body : typeof body.description === 'string' ? body.description : '',
      category: typeof body.category === 'string' ? body.category : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
      author: actorAuthor,
      demoSnippet: body.demoSnippet as { html: string; css: string; js?: string } | undefined,
      payload: typeof body.payload === 'string' ? body.payload : undefined,
      fileType: typeof body.fileType === 'string' ? body.fileType : undefined,
      activeDossier: body.activeDossier as ClubHandoverDossier | undefined,
    });
    await flushSupabaseWrites();
    res.status(201).json({ post, ...getCommunityState(false) });
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
    res.status(200).json({ post, ...getCommunityState(false) });
    return;
  }

  if (action === 'answer') {
    const postId = String(body.postId || '').trim();
    const content = String(body.content || '').trim();
    if (!postId || !content) {
      res.status(400).json({ error: 'Thieu noi dung cau tra loi.' });
      return;
    }
    const post = addCommunityAnswer(postId, { content, author: actorAuthor });
    if (!post) {
      res.status(404).json({ error: 'Khong tim thay cau hoi.' });
      return;
    }
    await flushSupabaseWrites();
    res.status(200).json({ post, ...getCommunityState(false) });
    return;
  }

  if (action === 'accept') {
    const postId = String(body.postId || '').trim();
    const answerId = String(body.answerId || '').trim();
    const post = acceptCommunityAnswer(postId, answerId);
    if (!post) {
      res.status(404).json({ error: 'Khong tim thay cau hoi hoac cau tra loi.' });
      return;
    }
    await flushSupabaseWrites();
    res.status(200).json({ post, ...getCommunityState(false) });
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
    res.status(200).json({ post, ...getCommunityState(false) });
    return;
  }

  if (action === 'dossier') {
    const clubId = String(body.clubId || body.postId || '').trim();
    const rawDossier = (body.dossier || body.activeDossier || {}) as Partial<ClubHandoverDossier>;
    if (!clubId || !rawDossier.projectTitle) {
      res.status(400).json({ error: 'Thieu thong tin Club Handover Dossier.' });
      return;
    }
    const post = updateClubDossier(clubId, {
      projectTitle: String(rawDossier.projectTitle),
      handoverNotes: String(rawDossier.handoverNotes || ''),
      nextMilestones: Array.isArray(rawDossier.nextMilestones)
        ? rawDossier.nextMilestones.map(String)
        : [],
      architectureSummary:
        typeof rawDossier.architectureSummary === 'string'
          ? rawDossier.architectureSummary
          : undefined,
      ownerHandle: actorAuthor.handle,
    });
    if (!post) {
      res.status(404).json({ error: 'Khong tim thay Club.' });
      return;
    }
    await flushSupabaseWrites();
    res.status(200).json({ post, ...getCommunityState(false) });
    return;
  }

  if (action === 'report') {
    const targetId = String(body.targetId || body.postId || '').trim();
    const reason = String(body.reason || '').trim();
    if (!targetId || !reason) {
      res.status(400).json({ error: 'Vui lòng nhập lý do báo cáo.' });
      return;
    }
    const report = submitModerationReport({
      targetId,
      reason,
      reporterId: actorAuthor.id,
      reporterName: actorAuthor.name,
    });
    await flushSupabaseWrites();
    res.status(201).json({ report, ...getCommunityState(false) });
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
    const rawProject = (
      body.project && typeof body.project === 'object' ? body.project : body
    ) as Partial<WorkspaceProject>;
    const project = await syncUserProject(user.id, rawProject);
    if (!project) {
      res.status(400).json({ error: 'Dữ liệu dự án không hợp lệ.' });
      return;
    }
    res.status(200).json({ ok: true, project });
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

app.get('/api/health', handleHealth);
app.get('/api/metrics', (req, res) => {
  handleMetricsAction(req, res);
});
app.all('/api/metrics/:action', (req, res) => {
  handleMetricsAction(req, res);
});
app.get('/api/ai/quota', (req, res) => {
  void handleAiQuota(req, res);
});
app.post('/api/ai/chat', (req, res) => {
  void handleAiChat(req, res);
});
app.all('/api/auth/:action', (req, res) => {
  void handleAuthAction(req, res);
});
app.all('/api/admin/:action', (req, res) => {
  void handleAdminAction(req, res);
});
app.all('/api/community/:action', (req, res) => {
  void handleCommunityAction(req, res);
});
app.get('/api/community', (req, res) => {
  void handleCommunityAction(req, res, 'list');
});
app.all('/api/projects/:action', (req, res) => {
  void handleProjectsAction(req, res);
});
app.get('/api/projects', (req, res) => {
  void handleProjectsAction(req, res, 'list');
});
