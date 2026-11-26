import type {
  AdminChangelogEntry,
  AdminGatewayOverride,
  AdminKeyPoolTestResult,
  AdminSecurityEvent,
  ModerationReportStatus,
  QuotaState,
  User,
} from '../../types/index';
import { requestJson } from '../../services/apiClient';
import type {
  AdminApiError,
  AdminKeyPoolMode,
  AdminPoolProbeOutcome,
  AdminSecurityEventView,
  AdminStateView,
} from './adminTypes';
import { normalizeSecurityEvent } from './adminTypes';

export function extractAdminError(err: unknown): AdminApiError {
  const errObj = (err && typeof err === 'object' ? err : {}) as {
    status?: unknown;
    message?: unknown;
    retryAfterSec?: unknown;
    payload?: unknown;
  };

  const payload =
    errObj.payload && typeof errObj.payload === 'object'
      ? (errObj.payload as Record<string, unknown>)
      : undefined;

  const status = typeof errObj.status === 'number' && Number.isFinite(errObj.status) ? errObj.status : 0;

  const rawRetry = payload?.retryAfterSec ?? errObj.retryAfterSec;
  const retryAfterSec =
    typeof rawRetry === 'number' && Number.isFinite(rawRetry) && rawRetry > 0
      ? Math.ceil(rawRetry)
      : undefined;

  const message =
    err instanceof Error && err.message.trim()
      ? err.message
      : typeof payload?.error === 'string' && payload.error.trim()
        ? payload.error
        : typeof errObj.message === 'string' && errObj.message.trim()
          ? errObj.message
          : 'Yêu cầu quản trị không thành công.';

  return {
    status,
    message,
    ...(retryAfterSec !== undefined ? { retryAfterSec } : {}),
    ...(errObj.payload !== undefined ? { payload: errObj.payload } : {}),
  };
}

export const adminApi = {
  loginAdmin(input: {
    username: string;
    password: string;
  }): Promise<{ user: User; quota: QuotaState }> {
    return requestJson('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  fetchAdminState(): Promise<{ state: AdminStateView }> {
    return requestJson('/api/admin/state', { method: 'GET' });
  },

  updateAdminGateway(
    input: Partial<AdminGatewayOverride> & { clearApiKey?: boolean }
  ): Promise<{ gateway: AdminGatewayOverride; state: AdminStateView }> {
    return requestJson('/api/admin/gateway', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  resetAdminQuota(subjectId: string): Promise<{ state: AdminStateView }> {
    return requestJson('/api/admin/reset-quota', {
      method: 'POST',
      body: JSON.stringify({ subjectId }),
    });
  },

  updateAdminQuotas(input: {
    subjectId: string;
    kind?: 'user' | 'ip' | 'guest';
    action?: 'set-limit' | 'block' | 'unblock' | 'reset';
    customLimit?: number | null;
    dailyLimit?: number | null;
    limit?: number | null;
    blocked?: boolean;
    reset?: boolean;
  }): Promise<{ state: AdminStateView }> {
    const resolvedCustomLimit =
      input.customLimit !== undefined
        ? input.customLimit
        : input.dailyLimit !== undefined
          ? input.dailyLimit
          : input.limit;
    return requestJson('/api/admin/quotas', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        ...(resolvedCustomLimit !== undefined ? { customLimit: resolvedCustomLimit } : {}),
      }),
    });
  },

  toggleAdminUserRole(userId: string): Promise<{ state: AdminStateView }> {
    return requestJson('/api/admin/toggle-role', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  moderateAdminReport(
    reportId: string,
    status: ModerationReportStatus
  ): Promise<{ state: AdminStateView }> {
    return requestJson('/api/admin/moderate', {
      method: 'POST',
      body: JSON.stringify({ reportId, status }),
    });
  },

  publishAdminChangelog(input: {
    version: string;
    title: string;
    notes: string;
  }): Promise<{ entry: AdminChangelogEntry; state: AdminStateView }> {
    return requestJson('/api/admin/changelog', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async testAdminKeyPool(input?: {
    mode?: AdminKeyPoolMode;
    prompt?: string;
  }): Promise<AdminPoolProbeOutcome> {
    try {
      return await requestJson<AdminPoolProbeOutcome>('/api/admin/key-pool/test', {
        method: 'POST',
        body: JSON.stringify(input ?? { mode: 'pool' }),
      });
    } catch (err) {
      const parsed = extractAdminError(err);
      if (
        parsed.status === 502 &&
        parsed.payload &&
        typeof parsed.payload === 'object'
      ) {
        const probePayload = parsed.payload as Partial<AdminKeyPoolTestResult> & {
          state?: AdminStateView;
        };
        if (typeof probePayload.ok === 'boolean' || probePayload.state) {
          return {
            ok: Boolean(probePayload.ok),
            mode: probePayload.mode ?? input?.mode ?? 'pool',
            keyId: probePayload.keyId ?? 'none',
            keyMask: probePayload.keyMask ?? '—',
            mask: probePayload.mask ?? null,
            attemptedKeys: probePayload.attemptedKeys ?? [],
            usedKeyMask: probePayload.usedKeyMask ?? null,
            model: probePayload.model ?? '—',
            protocol: probePayload.protocol,
            failoverTriggered: probePayload.failoverTriggered ?? false,
            latencyMs: probePayload.latencyMs ?? 0,
            tokens: probePayload.tokens ?? { prompt: 0, completion: 0, total: 0 },
            replyPreview: probePayload.replyPreview,
            preview: probePayload.preview,
            error: probePayload.error ?? parsed.message,
            state: probePayload.state,
          };
        }
      }
      throw err;
    }
  },

  async fetchAdminSecurityEvents(
    limit = 100
  ): Promise<{ events: AdminSecurityEventView[] }> {
    const res = await requestJson<{ events: AdminSecurityEvent[] }>(
      `/api/admin/security-events?limit=${encodeURIComponent(String(limit))}`,
      { method: 'GET' }
    );
    return {
      events: (res.events || []).map(normalizeSecurityEvent),
    };
  },
};
