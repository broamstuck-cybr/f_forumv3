import React from 'react';
import { IconActivity, IconClock, IconShieldCheck, IconUsers } from '../../ui/icons';
import { formatActiveDurationVi, useLiveMetrics } from '../../components/landing/useLiveMetrics';
import type { AdminStateView } from './adminTypes';
import { classifyQuotaSubject } from './adminTypes';
import './admin-codefronts.css';

interface AdminCodeFrontsStatsProps {
  adminState: AdminStateView | null;
  totalUsedAcrossSubjects: number;
  projectsCount: number;
  onQuickToggleRole?: (subjectId: string) => void;
}

export const AdminCodeFrontsStats: React.FC<AdminCodeFrontsStatsProps> = ({
  adminState,
  totalUsedAcrossSubjects,
  projectsCount,
  onQuickToggleRole,
}) => {
  const { visitors, activeSeconds, synced } = useLiveMetrics();

  if (!adminState) return null;

  const quotas = adminState.usersAndQuotas ?? [];
  const adminCount = quotas.filter((q) => classifyQuotaSubject(q) === 'admin').length;
  const memberCount = quotas.filter((q) => classifyQuotaSubject(q) === 'user').length;
  const ipCount = quotas.filter((q) => classifyQuotaSubject(q) === 'ip').length;
  const guestCount = quotas.filter((q) => classifyQuotaSubject(q) === 'guest').length;
  const anonTotal = ipCount + guestCount;
  const totalSubjects = Math.max(1, adminCount + memberCount + anonTotal);

  const adminPct = Math.round((adminCount / totalSubjects) * 100);
  const memberPct = Math.round((memberCount / totalSubjects) * 100);
  const anonPct = Math.max(0, 100 - adminPct - memberPct);

  const avgMinutesPerVisitor = visitors > 0 ? Math.round(activeSeconds / 60 / visitors) : 0;
  const totalAi = adminState
    ? Math.max(adminState.telemetry.totalAiRequests, totalUsedAcrossSubjects)
    : totalUsedAcrossSubjects;
  const successRate =
    adminState && adminState.telemetry.totalAiRequests > 0
      ? Math.round(
          (adminState.telemetry.successfulAiRequests / adminState.telemetry.totalAiRequests) * 100
        )
      : 100;

  const manageableAccounts = quotas.filter((rec) => {
    const kind = classifyQuotaSubject(rec);
    return (kind === 'user' || kind === 'admin') && rec.subjectId !== 'admin:sys-admin-root';
  });

  return (
    <div className="cf-adm-grid">
      <section className="cf-adm-card" aria-label="Thống kê truy cập và số giờ sử dụng">
        <header className="cf-adm-head">
          <div>
            <span className="cf-adm-kicker">THỐNG KÊ THỜI GIAN THỰC</span>
            <h2 className="cf-adm-title">Lưu lượng &amp; Thời gian hoạt động</h2>
          </div>
          <span className="cf-adm-pill" data-live={synced ? 'true' : 'false'}>
            {synced ? 'Đã đồng bộ' : 'Đang đo'}
          </span>
        </header>

        <div className="cf-adm-heroStat">
          <div className="cf-adm-heroIcon" aria-hidden="true">
            <IconClock size={20} />
          </div>
          <div className="cf-adm-heroBody">
            <span className="cf-adm-heroLabel">Tổng thời gian hoạt động thực</span>
            <strong className="cf-adm-heroVal">{formatActiveDurationVi(activeSeconds)}</strong>
          </div>
        </div>

        <div className="cf-adm-subgrid">
          <article className="cf-adm-tile">
            <span className="cf-adm-tileHead">
              <IconUsers size={15} aria-hidden="true" />
              <span>Người truy cập</span>
            </span>
            <strong className="cf-adm-tileVal">{visitors.toLocaleString('vi-VN')}</strong>
            <span className="cf-adm-tileMeta">~{avgMinutesPerVisitor} phút / người</span>
          </article>

          <article className="cf-adm-tile">
            <span className="cf-adm-tileHead">
              <IconActivity size={15} aria-hidden="true" />
              <span>Tỷ lệ phản hồi AI</span>
            </span>
            <strong className="cf-adm-tileVal">{successRate}%</strong>
            <span className="cf-adm-tileMeta">
              {totalAi.toLocaleString('vi-VN')} lượt · {projectsCount} dự án
            </span>
          </article>
        </div>
      </section>

      <section className="cf-adm-card" aria-label="Phân bổ vai trò và cấp quyền nhanh">
        <header className="cf-adm-head">
          <div>
            <span className="cf-adm-kicker">PHÂN QUYỀN &amp; ĐỐI TƯỢNG</span>
            <h2 className="cf-adm-title">Cơ cấu vai trò</h2>
          </div>
          <span className="cf-adm-pill">
            <IconShieldCheck size={14} aria-hidden="true" />
            <span>{adminCount} quản trị</span>
          </span>
        </header>

        <div
          className="cf-adm-stacked"
          role="img"
          aria-label={`Quản trị ${adminPct}%, Thành viên ${memberPct}%, Khách và IP ${anonPct}%`}
        >
          <span
            className="cf-adm-seg cf-adm-seg--admin"
            style={{ width: `${Math.max(adminPct, adminCount > 0 ? 6 : 2)}%` }}
          />
          <span
            className="cf-adm-seg cf-adm-seg--member"
            style={{ width: `${Math.max(memberPct, memberCount > 0 ? 6 : 2)}%` }}
          />
          <span
            className="cf-adm-seg cf-adm-seg--guest"
            style={{ width: `${Math.max(anonPct, anonTotal > 0 ? 6 : 2)}%` }}
          />
        </div>

        <div className="cf-adm-legend">
          <span>
            <i className="cf-adm-dot cf-adm-dot--admin" />
            Quản trị: <strong>{adminCount}</strong> ({adminPct}%)
          </span>
          <span>
            <i className="cf-adm-dot cf-adm-dot--member" />
            Thành viên: <strong>{memberCount}</strong> ({memberPct}%)
          </span>
          <span>
            <i className="cf-adm-dot cf-adm-dot--guest" />
            IP &amp; Khách: <strong>{anonTotal}</strong> ({anonPct}%)
          </span>
        </div>

        <div className="cf-adm-roleList">
          {manageableAccounts.length === 0 ? (
            <p className="cf-adm-empty">
              Chưa có tài khoản thành viên nào để cấp hoặc gỡ quyền quản trị.
            </p>
          ) : (
            manageableAccounts.slice(0, 4).map((acc) => (
              <div key={acc.subjectId} className="cf-adm-roleRow">
                <div className="cf-adm-roleInfo">
                  <strong>{acc.username}</strong>
                  <span>
                    {acc.role === 'admin' ? 'Quản trị viên' : 'Thành viên'} ·{' '}
                    {(acc.tokensTotal ?? 0).toLocaleString('vi-VN')} token
                  </span>
                </div>
                {onQuickToggleRole && (
                  <button
                    type="button"
                    className={acc.role === 'admin' ? 'btn btn-line btn-sm' : 'btn btn-accent btn-sm'}
                    onClick={() => onQuickToggleRole(acc.subjectId)}
                  >
                    {acc.role === 'admin' ? 'Gỡ Admin' : 'Cấp Admin'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminCodeFrontsStats;
