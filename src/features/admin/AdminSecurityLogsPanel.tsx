import React, { useMemo, useState } from 'react';
import type { AdminAuditLogEntry } from '../../types/index';
import { Chips, SearchCard } from '../../components/pinui';
import {
  IconAlertTriangle,
  IconRefreshCw,
  IconShieldAlert,
  IconTerminal,
} from '../../ui/icons';
import type { AdminSecurityEventView } from './adminTypes';
import { formatAdminDateTime } from './adminTypes';

type SecurityStreamMode = 'security' | 'audit';
type SecurityStatusFilter = 'all' | '401' | '403' | '429' | 'idor_cors';
type AuditLogFilter = 'all' | 'ADMIN' | 'GATEWAY' | 'MODERATE' | 'QUOTA' | 'KEY_POOL';

interface AdminSecurityLogsPanelProps {
  securityEvents: AdminSecurityEventView[];
  auditLogs: AdminAuditLogEntry[];
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
  refreshingEvents: boolean;
  onRefreshEvents: () => void;
  onRetryLoad: () => void;
}

const SECURITY_FILTER_ITEMS = [
  { id: 'all', label: 'Tất cả' },
  { id: '401', label: '401' },
  { id: '403', label: '403' },
  { id: '429', label: '429' },
  { id: 'idor_cors', label: 'IDOR / CORS' },
];

const AUDIT_FILTER_ITEMS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'ADMIN', label: 'Quản trị' },
  { id: 'GATEWAY', label: 'Gateway' },
  { id: 'MODERATE', label: 'Kiểm duyệt' },
  { id: 'QUOTA', label: 'Hạn mức' },
  { id: 'KEY_POOL', label: 'Key Pool' },
];

export const AdminSecurityLogsPanel: React.FC<AdminSecurityLogsPanelProps> = ({
  securityEvents,
  auditLogs,
  theme,
  loading,
  error,
  refreshingEvents,
  onRefreshEvents,
  onRetryLoad,
}) => {
  const [streamMode, setStreamMode] = useState<SecurityStreamMode>('security');
  const [secFilter, setSecFilter] = useState<SecurityStatusFilter>('all');
  const [secSearch, setSecSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState<AuditLogFilter>('all');
  const [auditSearch, setAuditSearch] = useState('');

  const filteredSecurity = useMemo(() => {
    const q = secSearch.trim().toLowerCase();
    return securityEvents.filter((ev) => {
      if (secFilter === '401' && ev.status !== 401 && ev.type !== 'auth_failed' && ev.type !== 'unauthorized_admin') {
        return false;
      }
      if (secFilter === '403' && ev.status !== 403 && ev.type !== 'forbidden_admin') {
        return false;
      }
      if (secFilter === '429' && ev.status !== 429 && ev.type !== 'rate_limited' && ev.type !== 'auth_locked') {
        return false;
      }
      if (secFilter === 'idor_cors' && ev.type !== 'idor_denied' && ev.type !== 'cors_blocked') {
        return false;
      }
      if (!q) return true;
      return (
        ev.type.toLowerCase().includes(q) ||
        ev.route.toLowerCase().includes(q) ||
        (ev.actor || '').toLowerCase().includes(q) ||
        ev.ipHash.toLowerCase().includes(q) ||
        ev.detail.toLowerCase().includes(q) ||
        String(ev.status).includes(q)
      );
    });
  }, [securityEvents, secFilter, secSearch]);

  const filteredAudit = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter((entry) => {
      if (auditFilter !== 'all') {
        if (auditFilter === 'QUOTA' && !entry.action.includes('QUOTA') && !entry.action.includes('RESET')) {
          return false;
        }
        if (
          auditFilter === 'ADMIN' &&
          !entry.action.includes('ADMIN') &&
          !entry.action.includes('ROLE') &&
          !entry.action.includes('CHANGELOG')
        ) {
          return false;
        }
        if (auditFilter === 'GATEWAY' && !entry.action.includes('GATEWAY')) return false;
        if (auditFilter === 'MODERATE' && !entry.action.includes('MODERATE')) return false;
        if (auditFilter === 'KEY_POOL' && !entry.action.includes('KEY_POOL')) return false;
      }
      if (!q) return true;
      return (
        entry.action.toLowerCase().includes(q) ||
        entry.actor.toLowerCase().includes(q) ||
        entry.target.toLowerCase().includes(q) ||
        entry.detail.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditFilter, auditSearch]);

  if (loading && securityEvents.length === 0 && auditLogs.length === 0) {
    return (
      <section aria-label="Đang tải nhật ký bảo mật" className="adm-card adm-skeleton-card">
        <div className="adm-card-head">
          <div className="adm-skel-stack">
            <span className="adm-skel adm-skel--title" />
            <span className="adm-skel adm-skel--sub" />
          </div>
          <span className="adm-skel adm-skel--pill" />
        </div>
        <div className="adm-skel adm-skel--box" />
        <span className="adm-card-sub">Đang đồng bộ sự kiện bảo mật và nhật ký kiểm toán...</span>
      </section>
    );
  }

  if (error && securityEvents.length === 0 && auditLogs.length === 0) {
    return (
      <section aria-label="Lỗi tải nhật ký" role="alert" className="adm-card adm-error-card">
        <div className="adm-card-head">
          <div className="adm-inline-icon">
            <IconAlertTriangle size={18} aria-hidden="true" />
            <div>
              <h2 className="adm-card-title">Không thể tải nhật ký bảo mật</h2>
              <p className="adm-card-sub">{error}</p>
            </div>
          </div>
          <button type="button" onClick={onRetryLoad} className="btn btn-line btn-sm">
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Nhật ký bảo mật và kiểm toán" className="adm-card">
      <div className="adm-card-head">
        <div className="adm-inline-icon">
          <span className="adm-icon-badge" aria-hidden="true">
            {streamMode === 'security' ? <IconShieldAlert size={18} /> : <IconTerminal size={18} />}
          </span>
          <div>
            <h2 className="adm-card-title">
              {streamMode === 'security' ? 'Sự kiện Bảo mật & Chống thu thập' : 'Nhật ký Quản trị'}
            </h2>
            <p className="adm-card-sub">
              {streamMode === 'security'
                ? `${filteredSecurity.length} sự kiện 401/403/429/CORS/IDOR trên máy chủ`
                : `${filteredAudit.length} thao tác quản trị được ghi nhận`}
            </p>
          </div>
        </div>

        <div className="adm-banner-actions">
          <div className="adm-seg" role="group" aria-label="Chuyển loại nhật ký">
            <button
              type="button"
              className="adm-seg-btn"
              aria-pressed={streamMode === 'security'}
              onClick={() => setStreamMode('security')}
            >
              Bảo mật ({securityEvents.length})
            </button>
            <button
              type="button"
              className="adm-seg-btn"
              aria-pressed={streamMode === 'audit'}
              onClick={() => setStreamMode('audit')}
            >
              Kiểm toán ({auditLogs.length})
            </button>
          </div>

          <button
            type="button"
            className="icon-btn"
            aria-label="Làm mới nhật ký"
            title="Làm mới"
            disabled={refreshingEvents || loading}
            onClick={streamMode === 'audit' ? onRetryLoad : onRefreshEvents}
          >
            <IconRefreshCw size={18} />
          </button>
        </div>
      </div>

      {streamMode === 'security' ? (
        <>
          <div className="adm-filter-bar">
            <SearchCard
              value={secSearch}
              onChange={setSecSearch}
              placeholder="Tìm mã lỗi, route, ipHash, chi tiết..."
              compact
            />
            <Chips
              items={SECURITY_FILTER_ITEMS}
              selectedIds={[secFilter]}
              multi={false}
              theme={theme}
              onToggle={(id) => setSecFilter(id as SecurityStatusFilter)}
            />
          </div>

          <div className="adm-stream-frame">
            <div className="adm-stream-bar">
              <span className="font-mono">security-events.log</span>
              <span className="t-label">Hiển thị {filteredSecurity.length} dòng</span>
            </div>

            {filteredSecurity.length === 0 ? (
              <div className="adm-empty-box adm-empty-box--inset">
                <p className="adm-card-title">Chưa có sự kiện bảo mật khớp bộ lọc</p>
                <p className="adm-card-sub">
                  {securityEvents.length === 0
                    ? 'Hệ thống chưa ghi nhận cảnh báo 401, 403, 429, CORS hoặc IDOR nào.'
                    : 'Xóa bộ lọc hiện tại hoặc làm mới luồng sự kiện.'}
                </p>
                <div className="adm-banner-actions">
                  {(secSearch || secFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSecSearch('');
                        setSecFilter('all');
                      }}
                      className="btn btn-line btn-sm"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                  <button type="button" onClick={onRefreshEvents} className="btn btn-ghost btn-sm">
                    Tải lại
                  </button>
                </div>
              </div>
            ) : (
              <div role="log" aria-label="Luồng sự kiện bảo mật" className="adm-stream-list">
                {filteredSecurity.map((ev) => {
                  const severity =
                    ev.status === 429
                      ? 'warn'
                      : ev.status >= 400
                        ? 'danger'
                        : 'ok';
                  return (
                    <div key={ev.id} className="adm-sec-row">
                      <time className="t-label adm-sec-time">{formatAdminDateTime(ev.timestamp)}</time>
                      <span className="adm-sec-status" data-severity={severity}>
                        {ev.status}
                      </span>
                      <span className="adm-sec-type font-mono">{ev.type}</span>
                      <div className="adm-sec-body">
                        <div className="adm-sec-route font-mono">
                          <span>{ev.route}</span>
                          {ev.actor && <span className="t-label">· {ev.actor}</span>}
                          <span className="t-label">· ip:{ev.ipHash}</span>
                        </div>
                        <div className="adm-sec-detail">{ev.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="adm-filter-bar">
            <SearchCard
              value={auditSearch}
              onChange={setAuditSearch}
              placeholder="Tìm hành động, người thực hiện, đối tượng..."
              compact
            />
            <Chips
              items={AUDIT_FILTER_ITEMS}
              selectedIds={[auditFilter]}
              multi={false}
              theme={theme}
              onToggle={(id) => setAuditFilter(id as AuditLogFilter)}
            />
          </div>

          <div role="log" aria-label="Danh sách nhật ký quản trị" className="adm-log-list">
            {filteredAudit.length === 0 ? (
              <div className="adm-empty-box adm-empty-box--inset">
                <p className="adm-card-title">Không có dòng nhật ký phù hợp</p>
                <p className="adm-card-sub">Thay đổi từ khóa hoặc đặt lại bộ lọc.</p>
                {(auditSearch || auditFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuditSearch('');
                      setAuditFilter('all');
                    }}
                    className="btn btn-line btn-sm"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              filteredAudit.map((entry) => (
                <div key={entry.id} className="adm-log-row">
                  <time className="t-label">{formatAdminDateTime(entry.timestamp)}</time>
                  <div className="min-w-0">
                    <span className="adm-log-action">{entry.action}</span>{' '}
                    <span className="adm-log-actor">({entry.actor})</span>
                    <div className="adm-log-detail">{entry.detail}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default AdminSecurityLogsPanel;
