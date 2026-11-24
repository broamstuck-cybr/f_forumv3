import React from 'react';
import { Activity, Clock, ShieldCheck, Users } from 'lucide-react';
import type { AdminState } from '../../types/index';
import { formatActiveDurationVi, useLiveMetrics } from '../../components/landing/useLiveMetrics';
import './admin-codefronts.css';

interface AdminCodeFrontsStatsProps {
  adminState: AdminState | null;
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

  const quotas = adminState?.usersAndQuotas ?? [];
  const adminCount = quotas.filter((q) => q.role === 'admin').length;
  const memberCount = quotas.filter((q) => q.role !== 'admin' && q.subjectType !== 'guest').length;
  const guestCount = quotas.filter((q) => q.subjectType === 'guest').length;
  const totalRoles = Math.max(1, adminCount + memberCount + guestCount);

  const adminPct = Math.round((adminCount / totalRoles) * 100);
  const memberPct = Math.round((memberCount / totalRoles) * 100);
  const guestPct = Math.max(0, 100 - adminPct - memberPct);

  const avgMinutesPerVisitor = visitors > 0 ? Math.round(activeSeconds / 60 / visitors) : 0;
  const totalAi = adminState
    ? Math.max(adminState.telemetry.totalAiRequests, totalUsedAcrossSubjects)
    : totalUsedAcrossSubjects;
  const successRate =
    adminState && adminState.telemetry.totalAiRequests > 0
      ? Math.round((adminState.telemetry.successfulAiRequests / adminState.telemetry.totalAiRequests) * 100)
      : 100;

  const manageableAccounts = quotas.filter(
    (rec) => rec.subjectType !== 'guest' && rec.subjectId !== 'admin:sys-admin-root'
  );

  return (
    <div className="cf-adm-grid">
      {/* CodeFronts Widget 1: Analytics Dashboard Stat Card + Usage Hours Panel */}
      <section className="cf-adm-card" aria-label="Thống kê truy cập và số giờ sử dụng">
        <header className="cf-adm-head">
          <div>
            <span className="cf-adm-kicker">THỐNG KÊ THỜI GIAN THỰC</span>
            <h2 className="cf-adm-title">Lưu lượng &amp; Số giờ sử dụng</h2>
          </div>
          <span className="cf-adm-pill" data-live={synced ? 'true' : 'false'}>
            {synced ? 'Đã đồng bộ' : 'Đang đo'}
          </span>
        </header>

        <div className="cf-adm-heroStat">
          <div className="cf-adm-heroIcon" aria-hidden="true">
            <Clock size={20} />
          </div>
          <div className="cf-adm-heroBody">
            <span className="cf-adm-heroLabel">Tổng thời gian hoạt động thực</span>
            <strong className="cf-adm-heroVal">{formatActiveDurationVi(activeSeconds)}</strong>
          </div>
        </div>

        <div className="cf-adm-subgrid">
          <article className="cf-adm-tile">
            <span className="cf-adm-tileHead">
              <Users size={14} aria-hidden="true" />
              <span>Người truy cập</span>
            </span>
            <strong className="cf-adm-tileVal">{visitors.toLocaleString('vi-VN')}</strong>
            <span className="cf-adm-tileMeta">~{avgMinutesPerVisitor} phút / người</span>
          </article>

          <article className="cf-adm-tile">
            <span className="cf-adm-tileHead">
              <Activity size={14} aria-hidden="true" />
              <span>Tỷ lệ phản hồi AI</span>
            </span>
            <strong className="cf-adm-tileVal">{successRate}%</strong>
            <span className="cf-adm-tileMeta">{totalAi} lượt · {projectsCount} dự án</span>
          </article>
        </div>
      </section>

      {/* CodeFronts Widget 2: Stacked Category Progress + Give Role Matrix */}
      <section className="cf-adm-card" aria-label="Phân bổ vai trò và cấp quyền nhanh">
        <header className="cf-adm-head">
          <div>
            <span className="cf-adm-kicker">PHÂN QUYỀN &amp; TÀI KHOẢN</span>
            <h2 className="cf-adm-title">Cơ cấu vai trò &amp; Give Role</h2>
          </div>
          <span className="cf-adm-pill">
            <ShieldCheck size={13} aria-hidden="true" />
            <span>{adminCount} quản trị</span>
          </span>
        </header>

        <div className="cf-adm-stacked" role="img" aria-label={`Quản trị ${adminPct}%, Thành viên ${memberPct}%, Khách ${guestPct}%`}>
          <span className="cf-adm-seg cf-adm-seg--admin" style={{ width: `${Math.max(adminPct, 4)}%` }} />
          <span className="cf-adm-seg cf-adm-seg--member" style={{ width: `${Math.max(memberPct, 4)}%` }} />
          <span className="cf-adm-seg cf-adm-seg--guest" style={{ width: `${Math.max(guestPct, 4)}%` }} />
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
            Khách: <strong>{guestCount}</strong> ({guestPct}%)
          </span>
        </div>

        <div className="cf-adm-roleList">
          {manageableAccounts.length === 0 ? (
            <p className="cf-adm-empty">Chưa có tài khoản thành viên nào để cấp hoặc gỡ quyền.</p>
          ) : (
            manageableAccounts.slice(0, 4).map((acc) => (
              <div key={acc.subjectId} className="cf-adm-roleRow">
                <div className="cf-adm-roleInfo">
                  <strong>{acc.username}</strong>
                  <span>{acc.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</span>
                </div>
                {onQuickToggleRole && (
                  <button
                    type="button"
                    className={acc.role === 'admin' ? 'btn btn-line btn-sm' : 'btn btn-accent btn-sm'}
                    onClick={() => onQuickToggleRole(acc.subjectId)}
                  >
                    {acc.role === 'admin' ? 'Hạ về Thành viên' : 'Give Role: Admin'}
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
