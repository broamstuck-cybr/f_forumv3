import type {
  AdminChangelogEntry,
  AIChatRequest,
  AIChatResponse,
  AIStreamCallbacks,
  AIStreamDeltaEvent,
  AIStreamStageEvent,
  BYOKConfig,
  ClubHandoverDossier,
  CommunityChannel,
  CommunityChannelsData,
  CommunityPost,
  ModerationReport,
  PublicAiRuntimeInfo,
  QuotaState,
  User,
  WorkspaceProject,
} from '../types/index';
import type {
  BehaviorItemScore,
  BehaviorSignalType,
  BrandPersonality,
  PublishedPageCategory,
  PublishedPageRecord,
} from '../types/workspaceV4';

function buildApiHeaders(
  extraHeaders?: Record<string, string>,
  byok?: BYOKConfig
): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(extraHeaders || {}),
  };

  if (byok && byok.enabled && byok.apiKey.trim()) {
    headers['x-ff-byok-key'] = byok.apiKey.trim();
    if (byok.baseUrl.trim()) headers['x-ff-byok-url'] = byok.baseUrl.trim();
    if (byok.model.trim()) headers['x-ff-byok-model'] = byok.model.trim();
    headers['x-ff-byok-protocol'] = byok.protocol;
  }

  return headers;
}

async function createHttpError(response: Response): Promise<Error & { status?: number; payload?: unknown }> {
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const errMsg = typeof data.error === 'string' ? data.error : `HTTP ${response.status}`;
  const err = new Error(errMsg) as Error & { status?: number; payload?: unknown };
  err.status = response.status;
  err.payload = data;
  return err;
}

export async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  byok?: BYOKConfig
): Promise<T> {
  const headers = buildApiHeaders((options.headers as Record<string, string>) || undefined, byok);

  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw await createHttpError(response);
  }
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return data as T;
}

function parseSseFrame(rawFrame: string): { event: string; data: string } | null {
  const lines = rawFrame.split('\n');
  let event = 'message';
  const dataLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      event = line.slice(6).trim() || 'message';
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}

export interface SiteMetrics {
  visitors: number;
  activeSeconds: number;
  lastUpdatedAt: string;
}

export interface SiteVisitMetrics extends SiteMetrics {
  counted: boolean;
}

export interface SiteHeartbeatMetrics extends SiteMetrics {
  ok: boolean;
  addedSeconds: number;
}

export function fetchSiteMetrics(): Promise<SiteMetrics> {
  return requestJson<SiteMetrics>('/api/metrics', { method: 'GET' });
}

export function recordSiteVisit(visitorId: string): Promise<SiteVisitMetrics> {
  return requestJson<SiteVisitMetrics>('/api/metrics/visit', {
    method: 'POST',
    body: JSON.stringify({ visitorId }),
  });
}

export function sendSiteHeartbeat(
  sessionId: string,
  deltaSeconds: number
): Promise<SiteHeartbeatMetrics> {
  return requestJson<SiteHeartbeatMetrics>('/api/metrics/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ sessionId, deltaSeconds }),
  });
}

export interface CommunityListQuery {
  page?: number;
  limit?: number;
  channel?: CommunityChannel;
  q?: string;
}

export interface CommunityStateResponse {
  items: CommunityPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  activeDossier: ClubHandoverDossier | null;
  channelCounts?: Record<'all' | CommunityChannel, number>;
  channels: CommunityChannelsData;
  posts: CommunityPost[];
  reports: ModerationReport[];
}

export interface CommunityMutationResponse {
  post: CommunityPost;
  channels?: CommunityChannelsData;
  posts?: CommunityPost[];
  reports?: ModerationReport[];
}

export function groupCommunityPostsToChannels(posts: CommunityPost[]): CommunityChannelsData {
  const channels: CommunityChannelsData = { qa: [], showcase: [], drops: [], clubs: [] };
  for (const post of posts) {
    if (!post || typeof post !== 'object' || post.hidden) continue;
    const ch: CommunityChannel =
      post.channel === 'showcase' || post.channel === 'drops' || post.channel === 'clubs'
        ? post.channel
        : 'qa';
    channels[ch].push(post);
  }
  return channels;
}

export function normalizeCommunityChannels(
  raw:
    | {
        channels?: Partial<CommunityChannelsData>;
        items?: CommunityPost[];
        posts?: CommunityPost[];
      }
    | null
    | undefined,
  fallback?: CommunityChannelsData
): CommunityChannelsData {
  const base: CommunityChannelsData = {
    qa: Array.isArray(fallback?.qa) ? fallback.qa : [],
    showcase: Array.isArray(fallback?.showcase) ? fallback.showcase : [],
    drops: Array.isArray(fallback?.drops) ? fallback.drops : [],
    clubs: Array.isArray(fallback?.clubs) ? fallback.clubs : [],
  };
  if (!raw || typeof raw !== 'object') return base;
  if (raw.channels && typeof raw.channels === 'object') {
    return {
      qa: Array.isArray(raw.channels.qa) ? raw.channels.qa : base.qa,
      showcase: Array.isArray(raw.channels.showcase) ? raw.channels.showcase : base.showcase,
      drops: Array.isArray(raw.channels.drops) ? raw.channels.drops : base.drops,
      clubs: Array.isArray(raw.channels.clubs) ? raw.channels.clubs : base.clubs,
    };
  }
  if (Array.isArray(raw.items)) {
    return groupCommunityPostsToChannels(raw.items);
  }
  if (Array.isArray(raw.posts)) {
    return groupCommunityPostsToChannels(raw.posts);
  }
  return base;
}

export const apiClient = {
  fetchHealth(): Promise<{
    status: string;
    service: string;
    version: string;
    timestamp: string;
    persistence?: 'supabase' | 'local-json';
  }> {
    return requestJson('/api/health', { method: 'GET' });
  },

  fetchQuota(): Promise<{ user: User | null; quota: QuotaState; aiRuntime?: PublicAiRuntimeInfo }> {
    return requestJson('/api/ai/quota', { method: 'GET' });
  },

  sendAiChat(
    payload: AIChatRequest,
    byok?: BYOKConfig,
    options?: { signal?: AbortSignal }
  ): Promise<AIChatResponse> {
    return requestJson<AIChatResponse>(
      '/api/ai/chat',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: options?.signal,
      },
      byok
    );
  },

  async streamAiChat(
    payload: AIChatRequest,
    byok?: BYOKConfig,
    callbacks?: AIStreamCallbacks
  ): Promise<AIChatResponse> {
    const headers = buildApiHeaders({ accept: 'text/event-stream' }, byok);
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ ...payload, stream: true }),
      signal: callbacks?.signal,
    });

    if (!response.ok) {
      const err = await createHttpError(response);
      callbacks?.onError?.({ message: err.message, status: err.status });
      throw err;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream') || !response.body) {
      const jsonResult = (await response.json()) as AIChatResponse;
      callbacks?.onResult?.(jsonResult);
      return jsonResult;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalResult: AIChatResponse | null = null;
    let streamError: string | null = null;

    const handleFrame = (rawFrame: string) => {
      const frame = parseSseFrame(rawFrame);
      if (!frame) return;
      try {
        const parsed = JSON.parse(frame.data) as Record<string, unknown>;
        if (frame.event === 'stage') {
          callbacks?.onStage?.(parsed as unknown as AIStreamStageEvent);
        } else if (frame.event === 'delta') {
          callbacks?.onDelta?.(parsed as unknown as AIStreamDeltaEvent);
        } else if (frame.event === 'result') {
          finalResult = parsed as unknown as AIChatResponse;
          callbacks?.onResult?.(finalResult);
        } else if (frame.event === 'error') {
          const msg = typeof parsed.message === 'string' ? parsed.message : 'AI stream failed';
          streamError = msg;
          callbacks?.onError?.({ message: msg });
        }
      } catch {
        return;
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const rawFrame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        handleFrame(rawFrame);
        boundary = buffer.indexOf('\n\n');
      }
    }

    const trailing = decoder.decode();
    if (trailing) {
      buffer += trailing.replace(/\r\n/g, '\n');
    }
    if (buffer.trim()) {
      handleFrame(buffer);
    }

    if (streamError && !finalResult) {
      throw new Error(streamError);
    }
    if (!finalResult) {
      throw new Error('AI stream ended without a result payload');
    }
    return finalResult;
  },

  fetchCurrentUser(): Promise<{ user: User | null; quota: QuotaState; aiRuntime?: PublicAiRuntimeInfo }> {
    return requestJson('/api/auth/me', { method: 'GET' });
  },

  registerUser(input: {
    username: string;
    email?: string;
    password: string;
    name?: string;
  }): Promise<{ user: User; quota: QuotaState }> {
    return requestJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  loginUser(input: {
    identifier: string;
    password: string;
  }): Promise<{ user: User; quota: QuotaState }> {
    return requestJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getGoogleAuthConfig(): Promise<{ enabled: boolean; clientId: string }> {
    return requestJson('/api/auth/google-config', { method: 'GET' });
  },

  loginWithGoogle(credential: string): Promise<{ user: User; quota: QuotaState }> {
    return requestJson('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  logoutUser(): Promise<{ ok: boolean; user: null; quota: QuotaState }> {
    return requestJson('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async fetchCommunityState(params?: CommunityListQuery): Promise<CommunityStateResponse> {
    const qs = new URLSearchParams();
    qs.set('page', String(params?.page ?? 1));
    qs.set('limit', String(params?.limit ?? 50));
    if (params?.channel) qs.set('channel', params.channel);
    if (params?.q && params.q.trim()) qs.set('q', params.q.trim());
    const raw = await requestJson<Partial<CommunityStateResponse>>(
      `/api/community/list?${qs.toString()}`,
      { method: 'GET' }
    );
    const channels = normalizeCommunityChannels(raw);
    const items = Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.posts)
        ? raw.posts
        : [...channels.qa, ...channels.showcase, ...channels.drops, ...channels.clubs];
    const rawCounts = raw?.channelCounts as Record<string, unknown> | undefined;
    let channelCounts: CommunityStateResponse['channelCounts'];
    if (
      rawCounts &&
      typeof rawCounts === 'object' &&
      !Array.isArray(rawCounts) &&
      (Object.getPrototypeOf(rawCounts) === Object.prototype ||
        Object.getPrototypeOf(rawCounts) === null)
    ) {
      const keys = ['all', 'qa', 'showcase', 'drops', 'clubs'] as const;
      const isFiniteCount = (v: unknown): v is number =>
        typeof v === 'number' && Number.isFinite(v) && v >= 0;
      const hasValidShape =
        keys.every((k) => rawCounts[k] === undefined || isFiniteCount(rawCounts[k])) &&
        keys.some((k) => isFiniteCount(rawCounts[k]));
      if (hasValidShape) {
        const qa = isFiniteCount(rawCounts.qa) ? rawCounts.qa : 0;
        const showcase = isFiniteCount(rawCounts.showcase) ? rawCounts.showcase : 0;
        const drops = isFiniteCount(rawCounts.drops) ? rawCounts.drops : 0;
        const clubs = isFiniteCount(rawCounts.clubs) ? rawCounts.clubs : 0;
        const all = isFiniteCount(rawCounts.all)
          ? rawCounts.all
          : qa + showcase + drops + clubs;
        channelCounts = { all, qa, showcase, drops, clubs };
      }
    }
    return {
      items,
      total: typeof raw?.total === 'number' ? raw.total : items.length,
      page: typeof raw?.page === 'number' ? raw.page : params?.page ?? 1,
      limit: typeof raw?.limit === 'number' ? raw.limit : params?.limit ?? 50,
      hasMore: Boolean(raw?.hasMore),
      activeDossier: raw?.activeDossier ?? null,
      ...(channelCounts ? { channelCounts } : {}),
      channels,
      posts: items,
      reports: Array.isArray(raw?.reports) ? raw.reports : [],
    };
  },

  createCommunityPost(input: {
    channel: CommunityChannel;
    title: string;
    body?: string;
    category?: string;
    tags?: string[];
    demoSnippet?: { html: string; css: string; js?: string };
    payload?: string;
    fileType?: string;
    activeDossier?: ClubHandoverDossier;
  }): Promise<CommunityMutationResponse> {
    return requestJson('/api/community/create', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  upvoteCommunityPost(postId: string): Promise<CommunityMutationResponse> {
    return requestJson('/api/community/upvote', {
      method: 'POST',
      body: JSON.stringify({ postId }),
    });
  },

  addCommunityAnswer(
    postId: string,
    content: string
  ): Promise<CommunityMutationResponse> {
    return requestJson('/api/community/answer', {
      method: 'POST',
      body: JSON.stringify({ postId, content }),
    });
  },

  acceptCommunityAnswer(
    postId: string,
    answerId: string
  ): Promise<CommunityMutationResponse> {
    return requestJson('/api/community/accept', {
      method: 'POST',
      body: JSON.stringify({ postId, answerId }),
    });
  },

  forkCommunityItem(postId: string): Promise<CommunityMutationResponse> {
    return requestJson('/api/community/fork', {
      method: 'POST',
      body: JSON.stringify({ postId }),
    });
  },

  updateClubDossier(
    clubId: string,
    dossier: ClubHandoverDossier
  ): Promise<CommunityMutationResponse> {
    return requestJson('/api/community/dossier', {
      method: 'POST',
      body: JSON.stringify({ clubId, dossier }),
    });
  },

  submitModerationReport(
    targetId: string,
    reason: string
  ): Promise<{
    ok?: boolean;
    reportId?: string;
    report?: ModerationReport;
    channels?: CommunityChannelsData;
    posts?: CommunityPost[];
    reports?: ModerationReport[];
  }> {
    return requestJson('/api/community/report', {
      method: 'POST',
      body: JSON.stringify({ targetId, reason }),
    });
  },

  fetchPublicChangelog(): Promise<{ changelog: AdminChangelogEntry[] }> {
    return requestJson('/api/changelog', { method: 'GET' });
  },

  fetchUserProjects(): Promise<{ authenticated: boolean; projects: WorkspaceProject[] }> {
    return requestJson('/api/projects/list', { method: 'GET' });
  },

  syncUserProject(project: WorkspaceProject): Promise<{ ok: boolean; project: WorkspaceProject }> {
    return requestJson('/api/projects/sync', {
      method: 'POST',
      body: JSON.stringify({ project }),
    });
  },

  deleteUserProject(projectId: string): Promise<{ ok: boolean }> {
    return requestJson('/api/projects/delete', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  },

  listPublishedPages(): Promise<{ pages: PublishedPageRecord[] }> {
    return requestJson('/api/pages', { method: 'GET' });
  },

  publishPage(input: {
    title: string;
    summary: string;
    category: PublishedPageCategory;
    personality: BrandPersonality;
    html?: string;
    liveUrl?: string;
    sourceIds: string[];
    authorName?: string;
    authorRole?: string;
    slug?: string;
  }): Promise<{ page: PublishedPageRecord; url: string }> {
    return requestJson('/api/pages', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getPublishedPage(slug: string): Promise<{ page: PublishedPageRecord }> {
    return requestJson(`/api/pages/${encodeURIComponent(slug)}`, { method: 'GET' });
  },

  viewPublishedPage(slug: string): Promise<{ slug: string; views: number }> {
    return requestJson(`/api/pages/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  likePublishedPage(slug: string): Promise<{ slug: string; likes: number; liked: boolean }> {
    return requestJson(`/api/pages/${encodeURIComponent(slug)}/like`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  remixPublishedPage(slug: string): Promise<{ slug: string; remixes: number }> {
    return requestJson(`/api/pages/${encodeURIComponent(slug)}/remix`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  recordBehaviorSignal(input: {
    itemId: string;
    library?: string;
    signal: BehaviorSignalType;
    profileTag?: string;
  }): Promise<{ ok: boolean; score: number }> {
    return requestJson('/api/signals', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getBehaviorScores(): Promise<{ scores: Record<string, BehaviorItemScore> }> {
    return requestJson('/api/signals/scores', { method: 'GET' });
  },

  submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackResponse> {
    return requestJson('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  fetchAdminFeedback(): Promise<AdminFeedbackListResponse> {
    return requestJson('/api/admin/feedback', { method: 'GET' });
  },

  updateAdminFeedbackStatus(
    id: string,
    status: FeedbackStatus
  ): Promise<AdminFeedbackStatusResponse> {
    return requestJson(`/api/admin/feedback/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },
};

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

export interface SubmitFeedbackInput {
  category: FeedbackCategory;
  rating: number;
  message: string;
  senderName?: string;
  senderEmail?: string;
  pageUrl?: string;
}

export interface SubmitFeedbackResponse {
  ok: boolean;
  feedback: FeedbackRecord;
  emailStatus: FeedbackEmailStatus;
}

export interface AdminFeedbackListResponse {
  items: FeedbackRecord[];
  unreadCount: number;
}

export interface AdminFeedbackStatusResponse {
  ok: boolean;
  feedback: FeedbackRecord;
  unreadCount: number;
}
