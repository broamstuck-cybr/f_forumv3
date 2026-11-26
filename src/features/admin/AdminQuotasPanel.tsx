import React, { useMemo, useState } from 'react';
import { Chips, SearchCard } from '../../components/pinui';
import {
  IconAlertTriangle,
  IconChevronDown,
  IconRotateCcw,
} from '../../ui/icons';
import type { AdminQuotaSubjectKind, AdminUserQuotaView } from './adminTypes';
import { classifyQuotaSubject, formatAdminDateTime } from './adminTypes';

export type QuotaFilter = 'all' | 'admin' | 'user' | 'ip' | 'guest' | 'low' | 'blocked';
type SortField = 'subject' | 'usage' | 'tokens';

interface AdminQuotasPanelProps {
  records: AdminUserQuotaView[];
  defaultUserLimit: number;
  defaultIpLimit: number;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
  busySubjectId: string | null;
  onRetryLoad: () => void;
  onSetCustomLimit: (
    rec: AdminUserQuotaView,
    kind: AdminQuotaSubjectKind,
    customLimit: number | null
  ) => Promise<boolean> | boolean | void;
  onResetQuota: (rec: AdminUserQuotaView, kind: AdminQuotaSubjectKind) => void;
  onToggleBlock: (rec: AdminUserQuotaView, kind: AdminQuotaSubjectKind, blocked: boolean) => void;
  onToggleRole: (subjectId: string) => void;
}

const QUOTA_FILTER_ITEMS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'admin', label: 'Admin' },
  { id: 'user', label: 'Thành viên' },
  { id: 'ip', label: 'IP' },
  { id: 'guest', label: 'Khách' },
  { id: 'low', label: 'Sắp hết' },
  { id: 'blocked', label: 'Đang chặn' },
];

const KIND_LABEL: Record<AdminQuotaSubjectKind, string> = {
  admin: 'Quản trị',
  user: 'Thành viên',
  ip: 'Địa chỉ IP',
  guest: 'Khách',
};

function toApiKind(kind: AdminQuotaSubjectKind): 'user' | 'ip' | 'guest' {
  if (kind === 'ip') return 'ip';
  if (kind === 'guest') return 'guest';
  return 'user';
}

export const AdminQuotasPanel: React.FC<AdminQuotasPanelProps> = ({
  records,
  defaultUserLimit,
  defaultIpLimit,
  theme,
  loading,
  error,
  busySubjectId,
  onRetryLoad,
  onSetCustomLimit,
  onResetQuota,
  onToggleBlock,
  onToggleRole,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<QuotaFilter>('all');
  const [sortField, setSortField] = useState<SortField>('usage');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({});

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = records.filter((rec) => {
      const subjectKind = classifyQuotaSubject(rec);
      const used = rec.dailyUsed ?? rec.used;
      const fallbackLim = subjectKind === 'ip' ? defaultIpLimit : defaultUserLimit;
      const limit = rec.dailyLimit ?? rec.limit ?? fallbackLim;

      if (filter === 'admin' && subjectKind !== 'admin') return false;
      if (filter === 'user' && subjectKind !== 'user') return false;
      if (filter === 'ip' && subjectKind !== 'ip') return false;
      if (filter === 'guest' && subjectKind !== 'guest') return false;
      if (filter === 'blocked' && !rec.blocked) return false;
      if (filter === 'low') {
        if (rec.unlimited) return false;
        if (used < Math.max(1, limit - 3)) return false;
      }

      if (!q) return true;
      return (
        rec.username.toLowerCase().includes(q) ||
        rec.subjectId.toLowerCase().includes(q) ||
        (rec.email || '').toLowerCase().includes(q) ||
        subjectKind.includes(q) ||
        KIND_LABEL[subjectKind].toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'subject') {
        cmp = a.username.localeCompare(b.username, 'vi');
      } else if (sortField === 'tokens') {
        cmp = (a.tokensTotal ?? 0) - (b.tokensTotal ?? 0);
      } else {
        cmp = (a.dailyUsed ?? a.used) - (b.dailyUsed ?? b.used);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [records, search, filter, sortField, sortDir, defaultUserLimit, defaultIpLimit]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'subject' ? 'asc' : 'desc');
    }
  };

  const handleCommitLimit = async (
    rec: AdminUserQuotaView,
    subjectKind: AdminQuotaSubjectKind,
    customLimit: number | null
  ) => {
    const ok = await onSetCustomLimit(rec, subjectKind, customLimit);
    if (ok !== false) {
      setLimitDrafts((prev) => {
        if (!(rec.subjectId in prev)) return prev;
        const next = { ...prev };
        delete next[rec.subjectId];
        return next;
      });
    }
  };

  if (loading && records.length === 0) {
    return (
      <section aria-label="Đang tải danh bạ hạn mức" className="adm-card adm-skeleton-card">
        <div className="adm-card-head">
          <div className="adm-skel-stack">
            <span className="adm-skel adm-skel--title" />
            <span className="adm-skel adm-skel--sub" />
          </div>
          <span className="adm-skel adm-skel--pill" />
        </div>
        <div className="adm-skel adm-skel--bar" />
        <div className="adm-skel adm-skel--box" />
        <span className="adm-card-sub">Đang đồng bộ danh bạ tài khoản, IP và hạn mức ngày...</span>
      </section>
    );
  }

  if (error && records.length === 0) {
    return (
      <section aria-label="Lỗi tải hạn mức" role="alert" className="adm-card adm-error-card">
        <div className="adm-card-head">
          <div className="adm-inline-icon">
            <IconAlertTriangle size={18} aria-hidden="true" />
            <div>
              <h2 className="adm-card-title">Không thể tải bảng hạn mức</h2>
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

  const clearFilters = () => {
    setSearch('');
    setFilter('all');
  };

  return (
    <section aria-label="Danh bạ người dùng, IP và hạn mức ngày" className="adm-card">
      <div className="adm-card-head">
        <div>
          <h2 className="adm-card-title">Hạn mức Tài khoản &amp; Địa chỉ IP</h2>
          <p className="adm-card-sub">
            Điều chỉnh giới hạn ngày (1–5000), đặt lại lượt, chặn truy cập hoặc phân quyền Admin.
          </p>
        </div>
        <span className="tag font-mono">{filteredAndSorted.length} đối tượng</span>
      </div>

      <div className="adm-filter-bar">
        <SearchCard
          value={search}
          onChange={setSearch}
          placeholder="Tìm tên, mã định danh, ip:..."
          compact
        />
        <Chips
          items={QUOTA_FILTER_ITEMS}
          selectedIds={[filter]}
          multi={false}
          theme={theme}
          onToggle={(id) => setFilter(id as QuotaFilter)}
        />
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="adm-empty-box">
          <p className="adm-card-title">Không tìm thấy đối tượng phù hợp</p>
          <p className="adm-card-sub">
            {records.length === 0
              ? 'Chưa có phiên người dùng, khách hoặc địa chỉ IP nào phát sinh hạn mức.'
              : 'Thử xóa từ khóa tìm kiếm hoặc chuyển bộ lọc về Tất cả.'}
          </p>
          {(search || filter !== 'all') && (
            <button type="button" onClick={clearFilters} className="btn btn-line btn-sm">
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table */}
          <div className="adm-table-wrap adm-desktop-table">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      className="adm-th-sort"
                      aria-sort={
                        sortField === 'subject'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      onClick={() => toggleSort('subject')}
                    >
                      <span>Đối tượng</span>
                      <IconChevronDown size={13} className="adm-sort-chevron" />
                    </button>
                  </th>
                  <th>Phân loại</th>
                  <th>
                    <button
                      type="button"
                      className="adm-th-sort"
                      aria-sort={
                        sortField === 'usage'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      onClick={() => toggleSort('usage')}
                    >
                      <span>Hạn mức ngày</span>
                      <IconChevronDown size={13} className="adm-sort-chevron" />
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="adm-th-sort"
                      aria-sort={
                        sortField === 'tokens'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      onClick={() => toggleSort('tokens')}
                    >
                      <span>Token</span>
                      <IconChevronDown size={13} className="adm-sort-chevron" />
                    </button>
                  </th>
                  <th>Giới hạn riêng</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((rec) => {
                  const subjectKind = classifyQuotaSubject(rec);
                  const apiKind = toApiKind(subjectKind);
                  const used = rec.dailyUsed ?? rec.used;
                  const fallbackLim = subjectKind === 'ip' ? defaultIpLimit : defaultUserLimit;
                  const limit = rec.dailyLimit ?? rec.limit ?? fallbackLim;
                  const ratio = rec.unlimited
                    ? 100
                    : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
                  const canToggleRole =
                    (subjectKind === 'user' || subjectKind === 'admin') &&
                    rec.subjectId !== 'admin:sys-admin-root';
                  const isBusy = busySubjectId === rec.subjectId;
                  const draftVal =
                    limitDrafts[rec.subjectId] ??
                    (rec.customLimit !== undefined && rec.customLimit !== null
                      ? String(rec.customLimit)
                      : String(limit));
                  const parsedDraft = Number(draftVal);
                  const draftValid =
                    Number.isFinite(parsedDraft) && parsedDraft >= 1 && parsedDraft <= 5000;

                  return (
                    <tr key={rec.subjectId} data-blocked={rec.blocked ? 'true' : undefined}>
                      <td>
                        <div className="adm-subj-name">{rec.username}</div>
                        <div className="t-label adm-subj-id">{rec.subjectId}</div>
                        <div className="adm-field-hint">
                          Cập nhật: {formatAdminDateTime(rec.updatedAt)}
                        </div>
                      </td>
                      <td>
                        <div className="adm-badge-stack">
                          <span
                            className={`tag ${
                              subjectKind === 'admin'
                                ? 'tag-green'
                                : subjectKind === 'ip'
                                  ? 'adm-tag-harbour'
                                  : ''
                            }`}
                          >
                            {KIND_LABEL[subjectKind]}
                          </span>
                          {rec.blocked && <span className="tag adm-tag-danger">Đang chặn</span>}
                        </div>
                      </td>
                      <td>
                        <div className="adm-quota-meter">
                          <span className="font-mono">
                            {rec.unlimited
                              ? `${used.toLocaleString('vi-VN')} / Không giới hạn`
                              : `${used.toLocaleString('vi-VN')} / ${limit.toLocaleString('vi-VN')}`}
                          </span>
                          <div className="adm-quota-bar" aria-hidden="true">
                            <div
                              className="adm-quota-fill"
                              data-unlimited={rec.unlimited ? 'true' : undefined}
                              data-warn={!rec.unlimited && ratio >= 85 ? 'true' : undefined}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          {rec.customLimit !== undefined && rec.customLimit !== null && (
                            <span className="adm-field-hint font-mono">
                              Tùy chỉnh: {rec.customLimit.toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="font-mono">
                        {(rec.tokensTotal ?? 0).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        {rec.unlimited ? (
                          <span className="t-label">Không giới hạn</span>
                        ) : (
                          <div className="adm-limit-inline">
                            <input
                              type="number"
                              min={1}
                              max={5000}
                              value={draftVal}
                              aria-label={`Giới hạn ngày cho ${rec.username}`}
                              onChange={(e) =>
                                setLimitDrafts((prev) => ({
                                  ...prev,
                                  [rec.subjectId]: e.target.value,
                                }))
                              }
                              className="field adm-limit-input font-mono"
                            />
                            <button
                              type="button"
                              disabled={isBusy || !draftValid}
                              onClick={() =>
                                void handleCommitLimit(rec, subjectKind, Math.round(parsedDraft))
                              }
                              className="btn btn-line btn-sm"
                            >
                              Lưu
                            </button>
                            {rec.customLimit !== undefined && rec.customLimit !== null && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleCommitLimit(rec, subjectKind, null)}
                                className="btn btn-ghost btn-sm"
                              >
                                Mặc định
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="adm-row-actions">
                          <button
                            type="button"
                            disabled={isBusy}
                            aria-label={`Đặt lại lượt cho ${rec.username}`}
                            title="Đặt lại"
                            onClick={() => onResetQuota(rec, subjectKind)}
                            className="icon-btn"
                          >
                            <IconRotateCcw size={16} />
                          </button>

                          {rec.subjectId !== 'admin:sys-admin-root' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onToggleBlock(rec, subjectKind, !rec.blocked)}
                              className={
                                rec.blocked ? 'btn btn-line btn-sm' : 'btn adm-btn-danger btn-sm'
                              }
                            >
                              {rec.blocked ? 'Mở chặn' : 'Chặn'}
                            </button>
                          )}

                          {canToggleRole && (
                            <button
                              type="button"
                              disabled={isBusy || apiKind !== 'user'}
                              onClick={() => onToggleRole(rec.subjectId)}
                              className={
                                rec.role === 'admin' ? 'btn btn-ghost btn-sm' : 'btn btn-accent btn-sm'
                              }
                            >
                              {rec.role === 'admin' ? 'Gỡ Admin' : 'Cấp Admin'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile 390px Card Reflow */}
          <div className="adm-mobile-quota-list">
            {filteredAndSorted.map((rec) => {
              const subjectKind = classifyQuotaSubject(rec);
              const used = rec.dailyUsed ?? rec.used;
              const fallbackLim = subjectKind === 'ip' ? defaultIpLimit : defaultUserLimit;
              const limit = rec.dailyLimit ?? rec.limit ?? fallbackLim;
              const ratio = rec.unlimited
                ? 100
                : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
              const canToggleRole =
                (subjectKind === 'user' || subjectKind === 'admin') &&
                rec.subjectId !== 'admin:sys-admin-root';
              const isBusy = busySubjectId === rec.subjectId;
              const draftVal =
                limitDrafts[rec.subjectId] ??
                (rec.customLimit !== undefined && rec.customLimit !== null
                  ? String(rec.customLimit)
                  : String(limit));
              const parsedDraft = Number(draftVal);
              const draftValid =
                Number.isFinite(parsedDraft) && parsedDraft >= 1 && parsedDraft <= 5000;

              return (
                <article key={`m-${rec.subjectId}`} className="adm-quota-card">
                  <div className="adm-quota-card-top">
                    <div className="min-w-0">
                      <strong className="adm-subj-name">{rec.username}</strong>
                      <span className="t-label adm-subj-id">{rec.subjectId}</span>
                    </div>
                    <div className="adm-badge-stack">
                      <span
                        className={`tag ${
                          subjectKind === 'admin'
                            ? 'tag-green'
                            : subjectKind === 'ip'
                              ? 'adm-tag-harbour'
                              : ''
                        }`}
                      >
                        {KIND_LABEL[subjectKind]}
                      </span>
                      {rec.blocked && <span className="tag adm-tag-danger">Đang chặn</span>}
                    </div>
                  </div>

                  <div className="adm-quota-card-metrics">
                    <div>
                      <span className="t-label">Hạn mức ngày</span>
                      <div className="font-mono">
                        {rec.unlimited
                          ? `${used.toLocaleString('vi-VN')} / Không giới hạn`
                          : `${used.toLocaleString('vi-VN')} / ${limit.toLocaleString('vi-VN')}`}
                      </div>
                      {rec.customLimit !== undefined && rec.customLimit !== null && (
                        <div className="adm-field-hint font-mono">
                          Tùy chỉnh: {rec.customLimit.toLocaleString('vi-VN')}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="t-label">Token</span>
                      <div className="font-mono">
                        {(rec.tokensTotal ?? 0).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div className="adm-quota-bar" aria-hidden="true">
                    <div
                      className="adm-quota-fill"
                      data-unlimited={rec.unlimited ? 'true' : undefined}
                      data-warn={!rec.unlimited && ratio >= 85 ? 'true' : undefined}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>

                  {!rec.unlimited && (
                    <div className="adm-limit-inline">
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        value={draftVal}
                        aria-label={`Giới hạn ngày cho ${rec.username}`}
                        onChange={(e) =>
                          setLimitDrafts((prev) => ({
                            ...prev,
                            [rec.subjectId]: e.target.value,
                          }))
                        }
                        className="field adm-limit-input font-mono"
                      />
                      <button
                        type="button"
                        disabled={isBusy || !draftValid}
                        onClick={() =>
                          void handleCommitLimit(rec, subjectKind, Math.round(parsedDraft))
                        }
                        className="btn btn-line btn-sm"
                      >
                        Lưu
                      </button>
                      {rec.customLimit !== undefined && rec.customLimit !== null && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleCommitLimit(rec, subjectKind, null)}
                          className="btn btn-ghost btn-sm"
                        >
                          Mặc định
                        </button>
                      )}
                    </div>
                  )}

                  <div className="adm-row-actions">
                    <button
                      type="button"
                      disabled={isBusy}
                      aria-label={`Đặt lại lượt cho ${rec.username}`}
                      title="Đặt lại"
                      onClick={() => onResetQuota(rec, subjectKind)}
                      className="icon-btn"
                    >
                      <IconRotateCcw size={16} />
                    </button>

                    {rec.subjectId !== 'admin:sys-admin-root' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onToggleBlock(rec, subjectKind, !rec.blocked)}
                        className={rec.blocked ? 'btn btn-line btn-sm' : 'btn adm-btn-danger btn-sm'}
                      >
                        {rec.blocked ? 'Mở chặn' : 'Chặn'}
                      </button>
                    )}

                    {canToggleRole && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onToggleRole(rec.subjectId)}
                        className={
                          rec.role === 'admin' ? 'btn btn-ghost btn-sm' : 'btn btn-accent btn-sm'
                        }
                      >
                        {rec.role === 'admin' ? 'Gỡ Admin' : 'Cấp Admin'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

export default AdminQuotasPanel;
