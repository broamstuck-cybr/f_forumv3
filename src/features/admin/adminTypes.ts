import type {
  AdminKeyPoolKeyStatus,
  AdminKeyPoolTestResult,
  AdminSecurityEvent,
  AdminState,
  AdminUserQuotaRecord,
} from '../../types/index';

export type AdminQuotaSubjectKind = 'admin' | 'user' | 'ip' | 'guest';

export type AdminKeyPoolMode = 'pool' | 'key1' | 'key2' | 'failover_sim' | 'gateway';

export type AdminKeyStatus = AdminKeyPoolKeyStatus['status'];

export type AdminSecurityEventType =
  | 'auth_failed'
  | 'auth_locked'
  | 'unauthorized_admin'
  | 'forbidden_admin'
  | 'rate_limited'
  | 'quota_blocked'
  | 'cors_blocked'
  | 'idor_denied'
  | 'invalid_input';

export interface AdminUserQuotaView extends AdminUserQuotaRecord {
  ipUsed?: number;
  ipLimit?: number | null;
  customLimit?: number | null;
}

export interface AdminSecurityEventView extends AdminSecurityEvent {
  type: AdminSecurityEventType | string;
  route: string;
  ipHash: string;
}

export interface AdminStateView extends Omit<AdminState, 'usersAndQuotas' | 'securityEvents'> {
  usersAndQuotas: AdminUserQuotaView[];
  securityEvents?: AdminSecurityEventView[];
}

export interface AdminApiError {
  status: number;
  message: string;
  retryAfterSec?: number;
  payload?: unknown;
}

export type AdminPoolProbeOutcome = AdminKeyPoolTestResult & {
  state?: AdminStateView;
};

export function classifyQuotaSubject(
  rec: Pick<AdminUserQuotaRecord, 'subjectId' | 'subjectType' | 'kind' | 'role'>
): AdminQuotaSubjectKind {
  if (rec.kind === 'ip' || rec.subjectId.startsWith('ip:')) {
    return 'ip';
  }
  if (rec.role === 'admin' || rec.subjectType === 'admin' || rec.subjectId.startsWith('admin:')) {
    return 'admin';
  }
  if (rec.subjectType === 'guest' || rec.kind === 'guest' || rec.subjectId.startsWith('guest:')) {
    return 'guest';
  }
  return 'user';
}

export function normalizeSecurityEvent(ev: AdminSecurityEvent): AdminSecurityEventView {
  return {
    ...ev,
    type: ev.type || ev.event || 'security_event',
    route: ev.route || ev.path || '/api',
    ipHash: ev.ipHash || '—',
  };
}

export function formatAdminDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}

export function formatAdminTimeOnly(iso?: string | null): string {
  if (!iso) return '—';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));
}
