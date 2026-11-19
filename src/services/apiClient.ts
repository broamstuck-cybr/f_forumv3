import type {
  AdminChangelogEntry,
  AdminGatewayOverride,
  AdminState,
  AIChatRequest,
  AIChatResponse,
  BYOKConfig,
  ClubHandoverDossier,
  CommunityChannel,
  CommunityChannelsData,
  CommunityPost,
  ModerationReport,
  ModerationReportStatus,
  QuotaState,
  User,
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

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  byok?: BYOKConfig
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-ff-guest-id': getOrCreateClientGuestId(),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (byok && byok.enabled && byok.apiKey.trim()) {
    headers['x-ff-byok-key'] = byok.apiKey.trim();
    if (byok.baseUrl.trim()) headers['x-ff-byok-url'] = byok.baseUrl.trim();
    if (byok.model.trim()) headers['x-ff-byok-model'] = byok.model.trim();
    headers['x-ff-byok-protocol'] = byok.protocol;
  }

  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const errMsg = typeof data.error === 'string' ? data.error : `HTTP ${response.status}`;
    const err = new Error(errMsg) as Error & { status?: number; payload?: unknown };
    err.status = response.status;
    err.payload = data;
    throw err;
  }
  return data as T;
}

export const apiClient = {
  fetchHealth(): Promise<{ status: string; service: string; version: string; timestamp: string }> {
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
};
