import type {
  AdminChangelogEntry,
  AdminGatewayOverride,
  AdminState,
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
  ModerationReportStatus,
  QuotaState,
  User,
  WorkspaceProject,
} from '../types/index';

const GUEST_ID_STORAGE_KEY = 'fforum_v3_guest_sid';

export function getOrCreateClientGuestId(): string {
  if (typeof window === 'undefined') return 'server-guest-sid';
  try {
    const existing = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const generated = `guest-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    window.localStorage.setItem(GUEST_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return 'ephemeral-guest-sid';
  }
}

function buildApiHeaders(
  extraHeaders?: Record<string, string>,
  byok?: BYOKConfig
): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-ff-guest-id': getOrCreateClientGuestId(),
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

async function requestJson<T>(
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

  fetchQuota(): Promise<{ user: User | null; quota: QuotaState }> {
    return requestJson('/api/ai/quota', { method: 'GET' });
  },

  sendAiChat(payload: AIChatRequest, byok?: BYOKConfig): Promise<AIChatResponse> {
    return requestJson<AIChatResponse>(
      '/api/ai/chat',
      {
        method: 'POST',
        body: JSON.stringify(payload),
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

  fetchCurrentUser(): Promise<{ user: User | null; quota: QuotaState }> {
    return requestJson('/api/auth/me', { method: 'GET' });
  },

  registerUser(input: {
    username: string;
    email: string;
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

  loginAdmin(input: {
    username: string;
    password: string;
  }): Promise<{ user: User; quota: QuotaState }> {
    return requestJson('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  logoutUser(): Promise<{ ok: boolean; user: null; quota: QuotaState }> {
    return requestJson('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  fetchCommunityState(): Promise<{
    channels: CommunityChannelsData;
    posts: CommunityPost[];
    reports: ModerationReport[];
  }> {
    return requestJson('/api/community/list', { method: 'GET' });
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
  }): Promise<{
    post: CommunityPost;
    channels: CommunityChannelsData;
    posts: CommunityPost[];
    reports: ModerationReport[];
  }> {
    return requestJson('/api/community/create', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  upvoteCommunityPost(postId: string): Promise<{
    post: CommunityPost;
    channels: CommunityChannelsData;
    posts: CommunityPost[];
  }> {
    return requestJson('/api/community/upvote', {
      method: 'POST',
      body: JSON.stringify({ postId }),
    });
  },

  addCommunityAnswer(
    postId: string,
    content: string
  ): Promise<{
    post: CommunityPost;
    channels: CommunityChannelsData;
    posts: CommunityPost[];
  }> {
    return requestJson('/api/community/answer', {
      method: 'POST',
      body: JSON.stringify({ postId, content }),
    });
  },

  acceptCommunityAnswer(
    postId: string,
    answerId: string
  ): Promise<{
    post: CommunityPost;
    channels: CommunityChannelsData;
    posts: CommunityPost[];
  }> {
    return requestJson('/api/community/accept', {
      method: 'POST',
      body: JSON.stringify({ postId, answerId }),
    });
  },

  forkCommunityItem(postId: string): Promise<{
    post: CommunityPost;
    channels: CommunityChannelsData;
    posts: CommunityPost[];
  }> {
    return requestJson('/api/community/fork', {
      method: 'POST',
      body: JSON.stringify({ postId }),
    });
  },

  updateClubDossier(
    clubId: string,
    dossier: ClubHandoverDossier
  ): Promise<{
    post: CommunityPost;
    channels: CommunityChannelsData;
    posts: CommunityPost[];
  }> {
    return requestJson('/api/community/dossier', {
      method: 'POST',
      body: JSON.stringify({ clubId, dossier }),
    });
  },

  submitModerationReport(
    targetId: string,
    reason: string
  ): Promise<{
    report: ModerationReport;
    channels: CommunityChannelsData;
    posts: CommunityPost[];
    reports: ModerationReport[];
  }> {
    return requestJson('/api/community/report', {
      method: 'POST',
      body: JSON.stringify({ targetId, reason }),
    });
  },

  fetchAdminState(): Promise<{ state: AdminState }> {
    return requestJson('/api/admin/state', { method: 'GET' });
  },

  updateAdminGateway(
    input: Partial<AdminGatewayOverride>
  ): Promise<{ gateway: AdminGatewayOverride; state: AdminState }> {
    return requestJson('/api/admin/gateway', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  resetAdminQuota(subjectId: string): Promise<{ state: AdminState }> {
    return requestJson('/api/admin/reset-quota', {
      method: 'POST',
      body: JSON.stringify({ subjectId }),
    });
  },

  toggleAdminUserRole(userId: string): Promise<{ state: AdminState }> {
    return requestJson('/api/admin/toggle-role', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  moderateAdminReport(
    reportId: string,
    status: ModerationReportStatus
  ): Promise<{ state: AdminState }> {
    return requestJson('/api/admin/moderate', {
      method: 'POST',
      body: JSON.stringify({ reportId, status }),
    });
  },

  publishAdminChangelog(input: {
    version: string;
    title: string;
    notes: string;
  }): Promise<{ entry: AdminChangelogEntry; state: AdminState }> {
    return requestJson('/api/admin/changelog', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  fetchPublicChangelog(): Promise<{ changelog: AdminChangelogEntry[] }> {
    return requestJson('/api/admin/changelog', { method: 'GET' });
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
};
