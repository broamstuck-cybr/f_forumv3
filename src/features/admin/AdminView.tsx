import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { AdminState, AIProtocol, ModerationReportStatus } from '../../types/index';
import { apiClient } from '../../services/apiClient';
import { useAppStore } from '../../store/appStore';
import { Chips, LampSwitch, LiquidTabs, SearchCard, SelectionList, SlingSlider } from '../../components/pinui';
import './admin.css';

type AdminTab = 'analytics' | 'users' | 'system' | 'logs';
type BarMode = 'accounts' | 'daily';
type DonutMode = 'roles' | 'gateway';
type UserFilter = 'all' | 'admin' | 'user' | 'guest' | 'low';
type LogFilter = 'all' | 'ADMIN' | 'GATEWAY' | 'MODERATE' | 'QUOTA';

interface BarDatum {
  id: string;
  label: string;
  shortLabel: string;
  value: number;
  limit: number | null;
  unlimited: boolean;
  meta: string;
}

interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  detail: string;
}

const PROTOCOL_ITEMS = [
  { id: 'openai-compatible', label: 'OpenAI Compatible', swatch: 'var(--red)' },
  { id: 'anthropic', label: 'Anthropic Messages', swatch: 'var(--amber)' },
  { id: 'gemini', label: 'Google Gemini', swatch: 'var(--harbour)' },
];

const MODEL_PRESETS = [
  { id: 'studio-smart-route', label: 'Studio Smart Route (Tự động)', swatch: 'var(--green)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', swatch: 'var(--harbour)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', swatch: 'var(--amber)' },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', swatch: 'var(--red)' },
  { id: 'gpt-4o', label: 'GPT-4o', swatch: 'var(--fg)' },
];

const USER_FILTER_ITEMS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'admin', label: 'Admin' },
  { id: 'user', label: 'Thành viên' },
  { id: 'guest', label: 'Khách' },
  { id: 'low', label: 'Sắp hết lượt' },
];

const LOG_FILTER_ITEMS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'ADMIN', label: 'Quản trị' },
  { id: 'GATEWAY', label: 'Gateway' },
  { id: 'MODERATE', label: 'Kiểm duyệt' },
  { id: 'QUOTA', label: 'Hạn mức' },
];

function formatShortDay(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

function formatDateTime(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}

export const AdminView: React.FC = () => {
  const { currentUser, loginAdmin, logout, navigate, addToast, projects, theme } = useAppStore();
  const isAdmin = currentUser?.role === 'admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [adminState, setAdminState] = useState<AdminState | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  const [barMode, setBarMode] = useState<BarMode>('accounts');
  const [hoveredBarId, setHoveredBarId] = useState<string | null>(null);
  const [donutMode, setDonutMode] = useState<DonutMode>('roles');
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<LogFilter>('all');

  const [gwEnabled, setGwEnabled] = useState(false);
  const [gwProtocol, setGwProtocol] = useState<AIProtocol>('openai-compatible');
  const [gwBaseUrl, setGwBaseUrl] = useState('');
  const [gwModel, setGwModel] = useState('studio-smart-route');
  const [gwApiKey, setGwApiKey] = useState('');
  const [showGwApiKey, setShowGwApiKey] = useState(false);
  const [gwTurnLimit, setGwTurnLimit] = useState(15);
  const [gwGuestSandbox, setGwGuestSandbox] = useState(true);
  const [gwSaving, setGwSaving] = useState(false);

  const [clVersion, setClVersion] = useState('3.0.1');
  const [clTitle, setClTitle] = useState('');
  const [clNotes, setClNotes] = useState('');
  const [clSaving, setClSaving] = useState(false);

  const syncGatewayForm = useCallback((state: AdminState) => {
    setGwEnabled(state.gateway.enabled);
    setGwProtocol(state.gateway.protocol);
    setGwBaseUrl(state.gateway.baseUrl);
    setGwModel(state.gateway.model);
    setGwTurnLimit(state.gateway.standardTurnLimit ?? 15);
    setGwGuestSandbox(state.gateway.guestSandboxEnabled ?? true);
    setGwApiKey('');
  }, []);

  const loadAdminState = useCallback(async () => {
    setLoadingState(true);
    try {
      const res = await apiClient.fetchAdminState();
      setAdminState(res.state);
      syncGatewayForm(res.state);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Không thể tải dữ liệu Admin',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoadingState(false);
    }
  }, [syncGatewayForm, addToast]);

  useEffect(() => {
    if (isAdmin) {
      void loadAdminState();
    }
  }, [isAdmin, loadAdminState]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await loginAdmin(username, password);
      setPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Xác thực Admin thất bại.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setGwSaving(true);
    try {
      const res = await apiClient.updateAdminGateway({
        enabled: gwEnabled,
        protocol: gwProtocol,
        baseUrl: gwBaseUrl,
        model: gwModel,
        apiKey: gwApiKey.trim() || undefined,
        standardTurnLimit: gwTurnLimit,
        guestSandboxEnabled: gwGuestSandbox,
      });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      addToast({
        type: 'success',
        title: 'Đã lưu cấu hình hệ thống & Gateway',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Lỗi cập nhật Gateway',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setGwSaving(false);
    }
  };

  const handleToggleMaintenance = async (maintenanceOn: boolean) => {
    const nextSandbox = !maintenanceOn;
    setGwGuestSandbox(nextSandbox);
    try {
      const res = await apiClient.updateAdminGateway({
        guestSandboxEnabled: nextSandbox,
      });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      addToast({
        type: maintenanceOn ? 'warning' : 'success',
        title: maintenanceOn ? 'Đã bật chế độ Chỉ đọc cho Khách' : 'Đã mở lại Guest Sandbox',
      });
    } catch (err) {
      setGwGuestSandbox(!nextSandbox);
      addToast({
        type: 'error',
        title: 'Không thể đổi chế độ Sandbox',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleModerate = async (reportId: string, status: ModerationReportStatus) => {
    try {
      const res = await apiClient.moderateAdminReport(reportId, status);
      setAdminState(res.state);
      addToast({
        type: 'success',
        title: `Đã chuyển báo cáo sang ${status}`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Kiểm duyệt thất bại',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleResetQuota = async (subjectId: string) => {
    try {
      const res = await apiClient.resetAdminQuota(subjectId);
      setAdminState(res.state);
      addToast({
        type: 'success',
        title: `Đã đặt lại hạn mức cho ${subjectId}`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Đặt lại hạn mức thất bại',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleToggleRole = async (subjectId: string) => {
    const cleanUserId = subjectId.replace(/^(user|admin):/, '');
    try {
      const res = await apiClient.toggleAdminUserRole(cleanUserId);
      setAdminState(res.state);
      addToast({
        type: 'success',
        title: 'Đã cập nhật vai trò & quyền Unlimited AI',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Không thể thay đổi vai trò',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handlePublishChangelog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clTitle.trim() || !clNotes.trim()) return;
    setClSaving(true);
    try {
      const res = await apiClient.publishAdminChangelog({
        version: clVersion,
        title: clTitle,
        notes: clNotes,
      });
      setAdminState(res.state);
      setClTitle('');
      setClNotes('');
      addToast({
        type: 'success',
        title: `Đã xuất bản phiên bản ${res.entry.version}`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Xuất bản thất bại',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setClSaving(false);
    }
  };

  const totalUsedAcrossSubjects = useMemo(
    () => (adminState?.usersAndQuotas || []).reduce((acc, rec) => acc + rec.used, 0),
    [adminState?.usersAndQuotas]
  );

  const totalProjectFiles = useMemo(
    () => projects.reduce((acc, proj) => acc + proj.files.length, 0),
    [projects]
  );

  const accountBarData = useMemo<BarDatum[]>(() => {
    const records = [...(adminState?.usersAndQuotas || [])]
      .sort((a, b) => b.used - a.used || a.username.localeCompare(b.username))
      .slice(0, 7);

    return records.map((rec) => ({
      id: rec.subjectId,
      label: rec.username,
      shortLabel: rec.username.length > 10 ? `${rec.username.slice(0, 9)}..` : rec.username,
      value: rec.used,
      limit: rec.limit,
      unlimited: rec.unlimited,
      meta: rec.unlimited
        ? `${rec.used} lượt (Không giới hạn)`
        : `${rec.used}/${rec.limit ?? 15} lượt (${rec.subjectType === 'guest' ? 'Khách' : 'Thành viên'})`,
    }));
  }, [adminState?.usersAndQuotas]);

  const dailyBarData = useMemo<BarDatum[]>(() => {
    const dayMap = new Map<string, number>();
    const today = new Date();
    const orderedKeys: string[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const d = new Date(today.getTime() - offset * 86400000);
      const key = d.toISOString().slice(0, 10);
      orderedKeys.push(key);
      dayMap.set(key, 0);
    }

    for (const rec of adminState?.usersAndQuotas || []) {
      const key = rec.updatedAt.slice(0, 10);
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) || 0) + rec.used);
      }
    }

    for (const log of adminState?.auditLogs || []) {
      const key = log.timestamp.slice(0, 10);
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) || 0) + 1);
      }
    }

    return orderedKeys.map((key) => {
      const count = dayMap.get(key) || 0;
      return {
        id: key,
        label: `Ngày ${formatShortDay(key)}`,
        shortLabel: formatShortDay(key),
        value: count,
        limit: null,
        unlimited: true,
        meta: `${count} lượt hoạt động & yêu cầu ghi nhận`,
      };
    });
  }, [adminState?.usersAndQuotas, adminState?.auditLogs]);

  const activeBarData = barMode === 'accounts' ? accountBarData : dailyBarData;
  const maxBarValue = useMemo(
    () => Math.max(1, ...activeBarData.map((d) => d.value)),
    [activeBarData]
  );

  const activeBarItem = useMemo(
    () => activeBarData.find((d) => d.id === hoveredBarId) ?? activeBarData[0] ?? null,
    [activeBarData, hoveredBarId]
  );

  const roleDonutSlices = useMemo<DonutSlice[]>(() => {
    const list = adminState?.usersAndQuotas || [];
    const adminCount = list.filter((r) => r.role === 'admin' || r.unlimited).length;
    const activeUsers = list.filter((r) => r.subjectType === 'user' && !r.unlimited && r.used > 0).length;
    const idleUsers = list.filter((r) => r.subjectType === 'user' && !r.unlimited && r.used === 0).length;
    const guests = list.filter((r) => r.subjectType === 'guest').length;

    return [
      {
        id: 'admin',
        label: 'Admin (Không giới hạn)',
        value: adminCount,
        color: 'var(--green)',
        detail: 'Bỏ qua giới hạn lượt AI',
      },
      {
        id: 'user-active',
        label: 'Thành viên đang dùng',
        value: activeUsers,
        color: 'var(--red)',
        detail: 'Đã phát sinh lượt gọi AI',
      },
      {
        id: 'user-idle',
        label: 'Thành viên chờ',
        value: idleUsers,
        color: 'var(--amber)',
        detail: 'Chưa tiêu thụ hạn mức',
      },
      {
        id: 'guest',
        label: 'Phiên Khách Sandbox',
        value: guests,
        color: 'var(--harbour)',
        detail: 'Theo dõi theo guest ID',
      },
    ];
  }, [adminState?.usersAndQuotas]);

  const gatewayDonutSlices = useMemo<DonutSlice[]>(() => {
    const tel = adminState?.telemetry;
    return [
      {
        id: 'ok',
        label: 'Thành công',
        value: tel?.successfulAiRequests ?? 0,
        color: 'var(--green)',
        detail: 'Phản hồi trực tiếp từ mô hình',
      },
      {
        id: 'fallback',
        label: 'Fallback cục bộ',
        value: tel?.fallbackAiRequests ?? 0,
        color: 'var(--amber)',
        detail: 'Chuyển dự phòng khi mất upstream',
      },
      {
        id: 'blocked',
        label: 'Chặn hạn mức',
        value: tel?.quotaBlockedRequests ?? 0,
        color: 'var(--red)',
        detail: 'Vượt ngưỡng lượt cho phép',
      },
    ];
  }, [adminState?.telemetry]);

  const activeDonutSlices = donutMode === 'roles' ? roleDonutSlices : gatewayDonutSlices;
  const donutTotal = useMemo(
    () => activeDonutSlices.reduce((sum, s) => sum + s.value, 0),
    [activeDonutSlices]
  );

  const donutGeometry = useMemo(() => {
    const radius = 74;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;
    return activeDonutSlices.map((slice) => {
      const ratio = donutTotal > 0 ? slice.value / donutTotal : 0;
      const arcLength = ratio * circumference;
      const offset = -cumulative;
      cumulative += arcLength;
      return {
        ...slice,
        radius,
        circumference,
        arcLength,
        offset,
        pct: donutTotal > 0 ? Math.round(ratio * 100) : 0,
      };
    });
  }, [activeDonutSlices, donutTotal]);

  const inspectedSlice = useMemo(
    () => donutGeometry.find((s) => s.id === hoveredSliceId) ?? null,
    [donutGeometry, hoveredSliceId]
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return (adminState?.usersAndQuotas || []).filter((rec) => {
      if (userFilter === 'admin' && rec.role !== 'admin') return false;
      if (userFilter === 'user' && (rec.subjectType !== 'user' || rec.role === 'admin')) return false;
      if (userFilter === 'guest' && rec.subjectType !== 'guest') return false;
      if (userFilter === 'low') {
        if (rec.unlimited) return false;
        const limit = rec.limit ?? 15;
        if (rec.used < Math.max(1, limit - 3)) return false;
      }
      if (!q) return true;
      return (
        rec.username.toLowerCase().includes(q) ||
        rec.subjectId.toLowerCase().includes(q) ||
        (rec.email || '').toLowerCase().includes(q) ||
        rec.role.toLowerCase().includes(q)
      );
    });
  }, [adminState?.usersAndQuotas, userSearch, userFilter]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return (adminState?.auditLogs || []).filter((entry) => {
      if (logFilter !== 'all') {
        if (logFilter === 'QUOTA' && !entry.action.includes('QUOTA') && !entry.action.includes('RESET')) {
          return false;
        }
        if (logFilter === 'ADMIN' && !entry.action.includes('ADMIN') && !entry.action.includes('ROLE') && !entry.action.includes('CHANGELOG')) {
          return false;
        }
        if (logFilter === 'GATEWAY' && !entry.action.includes('GATEWAY')) return false;
        if (logFilter === 'MODERATE' && !entry.action.includes('MODERATE')) return false;
      }
      if (!q) return true;
      return (
        entry.action.toLowerCase().includes(q) ||
        entry.actor.toLowerCase().includes(q) ||
        entry.target.toLowerCase().includes(q) ||
        entry.detail.toLowerCase().includes(q)
      );
    });
  }, [adminState?.auditLogs, logSearch, logFilter]);

  const adminTabs = useMemo(
    () => [
      { id: 'analytics', label: 'Thống kê' },
      { id: 'users', label: 'Người dùng', count: adminState?.usersAndQuotas.length ?? 0 },
      { id: 'system', label: 'Cài đặt hệ thống' },
      { id: 'logs', label: 'Nhật ký', count: adminState?.auditLogs.length ?? 0 },
    ],
    [adminState?.usersAndQuotas.length, adminState?.auditLogs.length]
  );

  if (!isAdmin) {
    return (
      <div className="adm-auth-shell">
        <section aria-label="Cổng đăng nhập quản trị" className="adm-auth-card">
          <div>
            <p className="t-label">quản trị hệ thống</p>
            <h1 className="t-title" style={{ fontSize: 'var(--text-2xl)', marginTop: 4 }}>
              Cổng Quản trị
            </h1>
            <p className="adm-card-sub" style={{ marginTop: 6 }}>
              Xác thực bằng tài khoản Admin cấu hình qua biến môi trường máy chủ.
            </p>
          </div>

          <form onSubmit={(e) => void handleAdminSignIn(e)} className="adm-field-stack">
            <label className="adm-field-group">
              <span className="adm-field-label">Tài khoản Admin</span>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tài khoản quản trị"
                className="field"
              />
            </label>

            <label className="adm-field-group">
              <span className="adm-field-label">Mật khẩu Admin</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu quản trị"
                className="field"
              />
            </label>

            {authError && (
              <p
                role="alert"
                style={{
                  background: 'var(--red-soft)',
                  borderColor: 'var(--red)',
                  color: 'var(--fg)',
                }}
                className="rounded-xl border px-3 py-2 text-xs"
              >
                {authError}
              </p>
            )}

            <button type="submit" disabled={authLoading} className="btn btn-red w-full">
              {authLoading ? 'Đang xác thực' : 'Đăng nhập quản trị'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('home')}
            className="btn btn-ghost btn-sm self-center"
          >
            Về trang chủ
          </button>
        </section>
      </div>
    );
  }

  const maintenanceReadOnly = !gwGuestSandbox;

  return (
    <div className="adm">
      <div className="adm-wrap">
        <section aria-label="Thanh trạng thái quản trị" className="adm-banner">
          <div className="adm-banner-top">
            <div>
              <div className="adm-banner-meta">
                <span className="tag tag-green">Không giới hạn lượt AI</span>
                <span className="t-label">Điều hành: {currentUser.username}</span>
                {maintenanceReadOnly && <span className="tag tag-red">Khách chỉ đọc</span>}
              </div>
              <h1 className="adm-banner-title">Bảng điều khiển quản trị</h1>
            </div>

            <div className="adm-banner-actions">
              <button type="button" onClick={() => navigate('workspace')} className="btn btn-red btn-sm">
                Workspace
              </button>
              <button
                type="button"
                onClick={() => void loadAdminState()}
                disabled={loadingState}
                className="btn btn-line btn-sm"
              >
                {loadingState ? 'Đang tải' : 'Làm mới'}
              </button>
              <button type="button" onClick={() => void logout()} className="btn btn-ghost btn-sm">
                Đăng xuất
              </button>
            </div>
          </div>
        </section>

        <section aria-label="Tổng quan chỉ số hệ thống" className="adm-kpis">
          <article className="adm-kpi">
            <span className="adm-kpi-label">Tổng tài khoản</span>
            <strong className="adm-kpi-val">
              {adminState ? adminState.telemetry.registeredUsersCount : '—'}
            </strong>
            <span className="adm-kpi-meta">
              {adminState
                ? `${adminState.telemetry.activeSessionsCount} phiên hạn mức đang theo dõi`
                : 'Đang đồng bộ danh bạ'}
            </span>
          </article>

          <article className="adm-kpi">
            <span className="adm-kpi-label">Lượt AI đã dùng</span>
            <strong className="adm-kpi-val" data-tone="red">
              {adminState ? Math.max(adminState.telemetry.totalAiRequests, totalUsedAcrossSubjects) : '—'}
            </strong>
            <span className="adm-kpi-meta">
              {adminState
                ? `Thành công ${adminState.telemetry.successfulAiRequests} · Fallback ${adminState.telemetry.fallbackAiRequests} · Chặn ${adminState.telemetry.quotaBlockedRequests}`
                : 'Đang đọc telemetry'}
            </span>
          </article>

          <article className="adm-kpi">
            <span className="adm-kpi-label">Dự án đang lưu</span>
            <strong className="adm-kpi-val">{projects.length}</strong>
            <span className="adm-kpi-meta">
              {totalProjectFiles} tệp mã nguồn · {adminState?.telemetry.communityPostsCount ?? 0} bài viết cộng đồng
            </span>
          </article>

          <article className="adm-kpi">
            <span className="adm-kpi-label">Trạng thái Gateway</span>
            <strong className="adm-kpi-val" data-tone={adminState?.gateway.enabled ? 'jade' : undefined}>
              {adminState?.gateway.enabled ? 'Runtime Bật' : 'Mặc định'}
            </strong>
            <span className="adm-kpi-meta">
              {adminState
                ? `${adminState.gateway.model} · Uptime ${adminState.telemetry.uptimeSeconds}s`
                : 'Đang kiểm tra kết nối'}
            </span>
          </article>
        </section>

        <div className="adm-tabs-row">
          <LiquidTabs
            tabs={adminTabs}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as AdminTab)}
            ariaLabel="Khu vực quản trị"
          />
          {adminState && adminState.telemetry.pendingModerationCount > 0 && (
            <span className="tag tag-red">
              {adminState.telemetry.pendingModerationCount} báo cáo chờ duyệt
            </span>
          )}
        </div>

        {activeTab === 'analytics' && (
          <div className="adm-grid-2">
            <section aria-label="Biểu đồ phân bổ lượt dùng AI" className="adm-card">
              <div className="adm-card-head">
                <div>
                  <h2 className="adm-card-title">Phân bổ lượt dùng AI</h2>
                  <p className="adm-card-sub">
                    Số liệu thực từ bảng hạn mức tài khoản và hoạt động hệ thống.
                  </p>
                </div>
                <div className="adm-seg" role="group" aria-label="Chế độ biểu đồ cột">
                  <button
                    type="button"
                    className="adm-seg-btn"
                    aria-pressed={barMode === 'accounts'}
                    onClick={() => {
                      setBarMode('accounts');
                      setHoveredBarId(null);
                    }}
                  >
                    Theo tài khoản
                  </button>
                  <button
                    type="button"
                    className="adm-seg-btn"
                    aria-pressed={barMode === 'daily'}
                    onClick={() => {
                      setBarMode('daily');
                      setHoveredBarId(null);
                    }}
                  >
                    Theo ngày
                  </button>
                </div>
              </div>

              <div className="adm-chart-box">
                <svg
                  viewBox="0 0 560 230"
                  className="adm-chart-svg"
                  role="img"
                  aria-label="Biểu đồ cột phân bổ lượt dùng AI"
                >
                  <title>Phân bổ lượt dùng AI</title>
                  <desc>Biểu đồ cột hiển thị số lượt AI theo tài khoản hoặc theo ngày gần nhất.</desc>
                  {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                    const y = 186 - tick * 150;
                    const tickVal = Math.round(maxBarValue * tick);
                    return (
                      <g key={tick}>
                        <line
                          x1={42}
                          y1={y}
                          x2={544}
                          y2={y}
                          stroke="var(--line)"
                          strokeDasharray={tick === 0 ? undefined : '4 4'}
                        />
                        <text
                          x={34}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="10"
                          fontFamily="var(--font-mono)"
                          fill="var(--fg-faint)"
                        >
                          {tickVal}
                        </text>
                      </g>
                    );
                  })}

                  {activeBarData.map((bar, idx) => {
                    const count = Math.max(1, activeBarData.length);
                    const chartWidth = 492;
                    const slotW = chartWidth / count;
                    const barW = Math.min(44, Math.max(20, slotW * 0.56));
                    const x = 48 + idx * slotW + (slotW - barW) / 2;
                    const rawH = (bar.value / maxBarValue) * 150;
                    const h = bar.value > 0 ? Math.max(8, rawH) : 3;
                    const y = 186 - h;
                    const isFocused = activeBarItem?.id === bar.id;
                    const fillColor = bar.value === 0
                      ? 'var(--line-strong)'
                      : bar.unlimited
                        ? 'var(--green)'
                        : 'var(--red)';

                    return (
                      <g key={bar.id}>
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={h}
                          rx={6}
                          fill={fillColor}
                          opacity={hoveredBarId && !isFocused ? 0.45 : 1}
                          tabIndex={0}
                          role="button"
                          aria-label={`${bar.label}: ${bar.meta}`}
                          className="adm-bar-rect"
                          onMouseEnter={() => setHoveredBarId(bar.id)}
                          onMouseLeave={() => setHoveredBarId(null)}
                          onFocus={() => setHoveredBarId(bar.id)}
                          onBlur={() => setHoveredBarId(null)}
                        />
                        <text
                          x={x + barW / 2}
                          y={y - 6}
                          textAnchor="middle"
                          fontSize="10"
                          fontFamily="var(--font-mono)"
                          fill="var(--fg-muted)"
                        >
                          {bar.value}
                        </text>
                        <text
                          x={x + barW / 2}
                          y={206}
                          textAnchor="middle"
                          fontSize="10.5"
                          fontFamily="var(--font-mono)"
                          fill={isFocused ? 'var(--fg)' : 'var(--fg-faint)'}
                        >
                          {bar.shortLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="adm-tooltip" aria-live="polite">
                  {activeBarItem ? (
                    <>
                      <strong>{activeBarItem.label}</strong>
                      <span className="t-label">{activeBarItem.meta}</span>
                    </>
                  ) : (
                    <span className="t-label">Chưa có dữ liệu phiên AI.</span>
                  )}
                </div>
              </div>
            </section>

            <section aria-label="Biểu đồ tỷ trọng hạn mức và vai trò" className="adm-card">
              <div className="adm-card-head">
                <div>
                  <h2 className="adm-card-title">Tỷ trọng Hạn mức & Vai trò</h2>
                  <p className="adm-card-sub">
                    Di chuột hoặc chọn từng nhóm để soi chi tiết tỷ lệ.
                  </p>
                </div>
                <div className="adm-seg" role="group" aria-label="Chế độ biểu đồ tròn">
                  <button
                    type="button"
                    className="adm-seg-btn"
                    aria-pressed={donutMode === 'roles'}
                    onClick={() => {
                      setDonutMode('roles');
                      setHoveredSliceId(null);
                    }}
                  >
                    Vai trò
                  </button>
                  <button
                    type="button"
                    className="adm-seg-btn"
                    aria-pressed={donutMode === 'gateway'}
                    onClick={() => {
                      setDonutMode('gateway');
                      setHoveredSliceId(null);
                    }}
                  >
                    Gateway
                  </button>
                </div>
              </div>

              <div className="adm-donut-layout">
                <div className="adm-donut-wrap">
                  <svg
                    viewBox="0 0 200 200"
                    className="adm-chart-svg"
                    role="img"
                    aria-label="Biểu đồ tròn phân bổ vai trò và hạn mức"
                  >
                    <title>Tỷ trọng Hạn mức và Vai trò</title>
                    <desc>Biểu đồ vòng tròn thể hiện tỷ lệ tài khoản hoặc trạng thái yêu cầu Gateway.</desc>
                    <circle
                      cx={100}
                      cy={100}
                      r={74}
                      fill="none"
                      stroke="var(--bg-sunken)"
                      strokeWidth={22}
                    />
                    <g transform="rotate(-90 100 100)">
                      {donutGeometry.map((slice) => {
                        if (slice.value <= 0) return null;
                        const active = hoveredSliceId === slice.id;
                        return (
                          <circle
                            key={slice.id}
                            cx={100}
                            cy={100}
                            r={slice.radius}
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={active ? 26 : 22}
                            strokeDasharray={`${slice.arcLength} ${slice.circumference}`}
                            strokeDashoffset={slice.offset}
                            opacity={hoveredSliceId && !active ? 0.35 : 1}
                            tabIndex={0}
                            role="button"
                            aria-label={`${slice.label}: ${slice.value} (${slice.pct}%)`}
                            style={{ cursor: 'pointer', transition: 'stroke-width 180ms ease, opacity 180ms ease' }}
                            onMouseEnter={() => setHoveredSliceId(slice.id)}
                            onMouseLeave={() => setHoveredSliceId(null)}
                            onFocus={() => setHoveredSliceId(slice.id)}
                            onBlur={() => setHoveredSliceId(null)}
                          />
                        );
                      })}
                    </g>
                  </svg>

                  <div className="adm-donut-center">
                    <span className="adm-donut-num">
                      {inspectedSlice ? `${inspectedSlice.pct}%` : donutTotal}
                    </span>
                    <span className="adm-donut-lbl">
                      {inspectedSlice
                        ? `${inspectedSlice.label} (${inspectedSlice.value})`
                        : donutMode === 'roles'
                          ? 'Tổng đối tượng'
                          : 'Tổng lượt AI'}
                    </span>
                  </div>
                </div>

                <ul className="adm-legend">
                  {donutGeometry.map((slice) => {
                    const active = hoveredSliceId === slice.id;
                    return (
                      <li key={slice.id}>
                        <button
                          type="button"
                          className="adm-legend-btn"
                          data-active={active}
                          onMouseEnter={() => setHoveredSliceId(slice.id)}
                          onMouseLeave={() => setHoveredSliceId(null)}
                          onFocus={() => setHoveredSliceId(slice.id)}
                          onBlur={() => setHoveredSliceId(null)}
                        >
                          <span className="adm-legend-left">
                            <span className="adm-swatch" style={{ background: slice.color }} aria-hidden="true" />
                            <span className="adm-legend-name">{slice.label}</span>
                          </span>
                          <span className="adm-legend-val">
                            {slice.value} ({slice.pct}%)
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            <section aria-label="Hàng đợi kiểm duyệt nhanh" className="adm-card">
              <div className="adm-card-head">
                <div>
                  <h2 className="adm-card-title">Hàng đợi kiểm duyệt</h2>
                  <p className="adm-card-sub">
                    {adminState?.moderationQueue.length || 0} báo cáo từ cộng đồng cần xử lý.
                  </p>
                </div>
              </div>

              {(adminState?.moderationQueue || []).length === 0 ? (
                <p className="t-label">Không có báo cáo nào trong hàng đợi.</p>
              ) : (
                <div className="adm-mod-list">
                  {(adminState?.moderationQueue || []).map((rep) => (
                    <article key={rep.id} className="adm-mod-item">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="text-xs block truncate">{rep.targetTitle}</strong>
                          <span className="t-label">
                            Kênh: {rep.targetChannel} · Báo cáo bởi {rep.reporterName}
                          </span>
                        </div>
                        <span
                          className={`tag ${
                            rep.status === 'approved'
                              ? 'tag-green'
                              : rep.status === 'hidden'
                                ? 'tag-red'
                                : ''
                          }`}
                        >
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                        {rep.reason}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => void handleModerate(rep.id, 'approved')}
                          className="btn btn-line btn-sm"
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleModerate(rep.id, 'hidden')}
                          className="btn btn-red btn-sm"
                        >
                          Ẩn bài
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleModerate(rep.id, 'dismissed')}
                          className="btn btn-ghost btn-sm"
                        >
                          Bỏ qua
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section aria-label="Phiên bản hệ thống đã phát hành" className="adm-card">
              <div className="adm-card-head">
                <div>
                  <h2 className="adm-card-title">Lịch sử phát hành</h2>
                  <p className="adm-card-sub">Các bản cập nhật đang hiển thị công khai.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  onClick={() => setActiveTab('system')}
                >
                  Đăng bản mới
                </button>
              </div>
              <div className="adm-cl-list">
                {(adminState?.changelog || []).slice(0, 4).map((cl) => (
                  <article key={cl.id} className="adm-cl-item">
                    <div className="flex items-center justify-between gap-2">
                      <span className="tag tag-green">v{cl.version}</span>
                      <span className="t-label">{formatDateTime(cl.publishedAt)}</span>
                    </div>
                    <strong className="text-xs">{cl.title}</strong>
                    <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                      {cl.notes}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'users' && (
          <section aria-label="Danh bạ người dùng và hạn mức" className="adm-card">
            <div className="adm-card-head">
              <div>
                <h2 className="adm-card-title">Danh bạ tài khoản & Hạn mức AI</h2>
                <p className="adm-card-sub">
                  Tìm kiếm tức thì, đặt lại lượt hoặc cấp quyền Unlimited Bypass cho thành viên.
                </p>
              </div>
              <span className="t-label">{filteredUsers.length} đối tượng</span>
            </div>

            <div className="adm-filter-bar">
              <SearchCard
                value={userSearch}
                onChange={setUserSearch}
                placeholder="Lọc theo tên tài khoản, email, subjectId..."
                compact
              />
              <Chips
                items={USER_FILTER_ITEMS}
                selectedIds={[userFilter]}
                multi={false}
                theme={theme}
                onToggle={(id) => setUserFilter(id as UserFilter)}
              />
            </div>

            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Tài khoản</th>
                    <th>Vai trò</th>
                    <th>Hạn mức AI</th>
                    <th>Cập nhật</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="t-label">
                        Không có tài khoản nào khớp bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((rec) => {
                      const limit = rec.limit ?? (adminState?.gateway.standardTurnLimit || 15);
                      const ratio = rec.unlimited ? 100 : Math.min(100, Math.round((rec.used / limit) * 100));
                      const canToggleRole =
                        rec.subjectType !== 'guest' && rec.subjectId !== 'admin:sys-admin-root';

                      return (
                        <tr key={rec.subjectId}>
                          <td>
                            <div className="font-semibold">{rec.username}</div>
                            <div className="t-label">{rec.email || rec.subjectId}</div>
                          </td>
                          <td>
                            <span className={`tag ${rec.role === 'admin' ? 'tag-green' : ''}`}>
                              {rec.role === 'admin'
                                ? 'Admin · Unlimited'
                                : rec.subjectType === 'guest'
                                  ? 'Khách'
                                  : 'Thành viên'}
                            </span>
                          </td>
                          <td>
                            <div className="adm-quota-meter">
                              <span className="font-mono">
                                {rec.unlimited ? `${rec.used} / Không giới hạn` : `${rec.used} / ${limit}`}
                              </span>
                              <div className="adm-quota-bar" aria-hidden="true">
                                <div
                                  className="adm-quota-fill"
                                  data-unlimited={rec.unlimited ? 'true' : undefined}
                                  style={{ width: `${ratio}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="t-label">{formatDateTime(rec.updatedAt)}</td>
                          <td>
                            <div className="adm-row-actions">
                              <button
                                type="button"
                                onClick={() => void handleResetQuota(rec.subjectId)}
                                className="btn btn-line btn-sm"
                              >
                                Đặt lại lượt
                              </button>
                              {canToggleRole && (
                                <button
                                  type="button"
                                  onClick={() => void handleToggleRole(rec.subjectId)}
                                  className={rec.role === 'admin' ? 'btn btn-ghost btn-sm' : 'btn btn-red btn-sm'}
                                >
                                  {rec.role === 'admin' ? 'Gỡ Unlimited' : 'Cấp Unlimited'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'system' && (
          <div className="adm-sys-grid">
            <section aria-label="Cấu hình AI Gateway và hạn mức mặc định" className="adm-card">
              <div className="adm-card-head">
                <div>
                  <h2 className="adm-card-title">Cài đặt hệ thống & AI Gateway</h2>
                  <p className="adm-card-sub">
                    Lưu trực tiếp qua cấu hình quản trị runtime trên máy chủ.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gwEnabled}
                    onChange={(e) => setGwEnabled(e.target.checked)}
                  />
                  Bật ghi đè Gateway
                </label>
              </div>

              <form onSubmit={(e) => void handleSaveGateway(e)} className="adm-field-stack">
                <div className="adm-slider-fit">
                  <SlingSlider
                    key={`adm-turn-${adminState?.gateway.updatedAt ?? 'init'}`}
                    min={1}
                    max={100}
                    step={1}
                    defaultValue={gwTurnLimit}
                    label="Hạn mức lượt mặc định (Khách & Thành viên)"
                    unit=" lượt"
                    theme={theme}
                    onChange={(val) => setGwTurnLimit(val)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="adm-field-group">
                    <span className="adm-field-label">Giao thức AI mặc định</span>
                    <SelectionList
                      items={PROTOCOL_ITEMS}
                      selectedId={gwProtocol}
                      onSelect={(id) => setGwProtocol(id as AIProtocol)}
                      ariaLabel="Chọn giao thức AI Gateway"
                    />
                  </div>

                  <div className="adm-field-group">
                    <span className="adm-field-label">Mô hình AI mặc định</span>
                    <SelectionList
                      items={MODEL_PRESETS}
                      selectedId={
                        MODEL_PRESETS.some((m) => m.id === gwModel) ? gwModel : 'studio-smart-route'
                      }
                      onSelect={(id) => setGwModel(id)}
                      ariaLabel="Chọn mô hình AI mặc định"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="adm-field-group">
                    <span className="adm-field-label">Tên mô hình tùy chỉnh</span>
                    <input
                      type="text"
                      value={gwModel}
                      onChange={(e) => setGwModel(e.target.value)}
                      placeholder="studio-smart-route"
                      className="field font-mono"
                    />
                  </label>

                  <label className="adm-field-group">
                    <span className="adm-field-label">Upstream Base URL</span>
                    <input
                      type="url"
                      value={gwBaseUrl}
                      onChange={(e) => setGwBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="field font-mono"
                    />
                  </label>
                </div>

                <div className="adm-field-group">
                  <span className="adm-field-label">Khóa API hệ thống (để trống để giữ khóa hiện tại)</span>
                  <div className="adm-secret-row">
                    <input
                      type={showGwApiKey ? 'text' : 'password'}
                      value={gwApiKey}
                      onChange={(e) => setGwApiKey(e.target.value)}
                      placeholder={
                        adminState?.gateway.hasCustomApiKey
                          ? 'Đã lưu khóa tùy chỉnh trên máy chủ'
                          : 'Dùng biến môi trường mặc định'
                      }
                      className="field font-mono"
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={showGwApiKey ? 'Ẩn khóa API' : 'Hiện khóa API'}
                      title={showGwApiKey ? 'Ẩn khóa API' : 'Hiện khóa API'}
                      aria-pressed={showGwApiKey}
                      onClick={() => setShowGwApiKey((v) => !v)}
                    >
                      {showGwApiKey ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                  <span className="adm-field-hint">
                    Lần cập nhật cuối: {adminState ? formatDateTime(adminState.gateway.updatedAt) : '—'}
                  </span>
                  <button type="submit" disabled={gwSaving} className="btn btn-red">
                    {gwSaving ? 'Đang lưu cấu hình' : 'Lưu cấu hình hệ thống'}
                  </button>
                </div>
              </form>
            </section>

            <div className="adm-field-stack">
              <section aria-label="Công tắc bảo trì chỉ đọc" className="adm-card">
                <div>
                  <h2 className="adm-card-title">Bảo trì & Chế độ chỉ đọc</h2>
                  <p className="adm-card-sub">
                    Khi bật Chỉ đọc, Guest Sandbox tạm dừng gọi AI để bảo vệ hạn mức máy chủ.
                  </p>
                </div>

                <div className="adm-lamp">
                  <LampSwitch
                    on={maintenanceReadOnly}
                    onToggle={(next) => void handleToggleMaintenance(next)}
                    onLabel="Chỉ đọc"
                    offLabel="Mở Guest"
                  />
                </div>
              </section>

              <section aria-label="Xuất bản nhật ký thay đổi" className="adm-card">
                <div>
                  <h2 className="adm-card-title">Xuất bản Changelog</h2>
                  <p className="adm-card-sub">Thông báo cập nhật mới lên hệ thống công khai.</p>
                </div>

                <form onSubmit={(e) => void handlePublishChangelog(e)} className="adm-field-stack">
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                    <input
                      type="text"
                      value={clVersion}
                      onChange={(e) => setClVersion(e.target.value)}
                      placeholder="3.0.1"
                      aria-label="Phiên bản"
                      className="field font-mono"
                    />
                    <input
                      type="text"
                      value={clTitle}
                      onChange={(e) => setClTitle(e.target.value)}
                      placeholder="Tiêu đề bản cập nhật"
                      aria-label="Tiêu đề bản cập nhật"
                      className="field"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={clNotes}
                    onChange={(e) => setClNotes(e.target.value)}
                    placeholder="Mô tả thay đổi kỹ thuật đã kiểm định..."
                    aria-label="Nội dung thay đổi"
                    className="field"
                  />
                  <button type="submit" disabled={clSaving} className="btn btn-red btn-sm self-end">
                    {clSaving ? 'Đang xuất bản' : 'Xuất bản phiên bản'}
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <section aria-label="Nhật ký kiểm toán hệ thống" className="adm-card">
            <div className="adm-card-head">
              <div>
                <h2 className="adm-card-title">Nhật ký hệ thống (Audit Log)</h2>
                <p className="adm-card-sub">
                  Hiển thị {filteredLogs.length} sự kiện thực được ghi nhận trên máy chủ.
                </p>
              </div>
            </div>

            <div className="adm-filter-bar">
              <SearchCard
                value={logSearch}
                onChange={setLogSearch}
                placeholder="Tìm theo hành động, người thực hiện, chi tiết..."
                compact
              />
              <Chips
                items={LOG_FILTER_ITEMS}
                selectedIds={[logFilter]}
                multi={false}
                theme={theme}
                onToggle={(id) => setLogFilter(id as LogFilter)}
              />
            </div>

            <div role="log" aria-label="Danh sách nhật ký quản trị" className="adm-log-list">
              {filteredLogs.length === 0 ? (
                <span className="t-label">Không có dòng nhật ký nào khớp từ khóa.</span>
              ) : (
                filteredLogs.map((entry) => (
                  <div key={entry.id} className="adm-log-row">
                    <time className="t-label">{formatDateTime(entry.timestamp)}</time>
                    <div className="min-w-0">
                      <span style={{ color: 'var(--green)' }} className="font-semibold">
                        {entry.action}
                      </span>{' '}
                      <span style={{ color: 'var(--fg-muted)' }}>({entry.actor})</span>
                      <div style={{ color: 'var(--fg)' }} className="break-words mt-0.5">
                        {entry.detail}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminView;
