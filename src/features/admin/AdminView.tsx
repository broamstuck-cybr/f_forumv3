import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  EyeOff,
  FilePlus2,
  KeyRound,
  RefreshCw,
  RotateCcw,
  Server,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import type { AdminState, AIProtocol, ModerationReportStatus } from '../../types/index';
import { apiClient } from '../../services/apiClient';
import { useAppStore } from '../../store/appStore';

export const AdminView: React.FC = () => {
  const { currentUser, loginAdmin, logout, navigate, addToast } = useAppStore();
  const isAdmin = currentUser?.role === 'admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [adminState, setAdminState] = useState<AdminState | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [onlyCriticalLogs, setOnlyCriticalLogs] = useState(false);

  const [gwEnabled, setGwEnabled] = useState(false);
  const [gwProtocol, setGwProtocol] = useState<AIProtocol>('openai-compatible');
  const [gwBaseUrl, setGwBaseUrl] = useState('');
  const [gwModel, setGwModel] = useState('');
  const [gwApiKey, setGwApiKey] = useState('');
  const [gwTurnLimit, setGwTurnLimit] = useState(15);
  const [gwGuestSandbox, setGwGuestSandbox] = useState(true);
  const [gwSaving, setGwSaving] = useState(false);

  const [clVersion, setClVersion] = useState('3.0.1');
  const [clTitle, setClTitle] = useState('');
  const [clNotes, setClNotes] = useState('');

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
        title: 'Đã cập nhật cấu hình AI Gateway & Quota',
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

  const handleModerate = async (reportId: string, status: ModerationReportStatus) => {
    try {
      const res = await apiClient.moderateAdminReport(reportId, status);
      setAdminState(res.state);
      addToast({
        type: 'success',
        title: `Đã cập nhật báo cáo sang ${status}`,
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
        title: 'Đã cập nhật vai trò người dùng',
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
        title: `Đã đăng phiên bản ${res.entry.version}`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Đăng nhật ký thay đổi thất bại',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const filteredLogs = useMemo(() => {
    const list = adminState?.auditLogs || [];
    if (!onlyCriticalLogs) return list;
    return list.filter(
      (l) =>
        l.action.includes('ADMIN') ||
        l.action.includes('GATEWAY') ||
        l.action.includes('MODERATE') ||
        l.action.includes('RESET') ||
        l.action.includes('ROLE')
    );
  }, [adminState?.auditLogs, onlyCriticalLogs]);

  if (!isAdmin) {
    return (
      <main
        style={{
          background: 'var(--bg-canvas)',
          color: 'var(--ink-primary)',
        }}
        className="min-h-[calc(100vh-64px)] px-4 py-16 flex items-center justify-center"
      >
        <section
          aria-label="Dedicated Admin Sign-In"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-strong)',
          }}
          className="w-full max-w-md rounded-2xl border p-6 sm:p-8 flex flex-col gap-5 overflow-hidden"
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                background: 'var(--bg-panel)',
                borderColor: 'var(--border-subtle)',
              }}
              className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
            >
              <Shield className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Cổng Quản trị Hệ thống</h1>
              <p style={{ color: 'var(--ink-secondary)' }} className="text-xs">
                Xác thực bằng tài khoản Admin được cấu hình qua biến môi trường máy chủ.
              </p>
            </div>
          </div>

          <form onSubmit={(e) => void handleAdminSignIn(e)} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium">
              <span>Tài khoản Admin</span>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tài khoản quản trị"
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--ink-primary)',
                }}
                className="px-3.5 py-2.5 rounded-xl border text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium">
              <span>Mật khẩu Admin</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu quản trị"
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--ink-primary)',
                }}
                className="px-3.5 py-2.5 rounded-xl border text-sm"
              />
            </label>

            {authError && (
              <p
                role="alert"
                style={{
                  background: 'rgba(224, 122, 56, 0.14)',
                  borderColor: 'var(--accent-copper)',
                  color: 'var(--ink-primary)',
                }}
                className="rounded-xl border px-3 py-2 text-xs"
              >
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                background: 'var(--accent-primary)',
                color: '#0b0d12',
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <KeyRound className="w-4 h-4" />
              {authLoading ? 'Đang xác thực...' : 'Đăng nhập Admin Console'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('home')}
            style={{ color: 'var(--ink-secondary)' }}
            className="text-xs text-center hover:underline"
          >
            Quay lại trang Home
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        background: 'var(--bg-canvas)',
        color: 'var(--ink-primary)',
      }}
      className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto flex flex-col gap-6"
    >
      <section
        aria-label="Admin Unlimited Status Banner"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--accent-jade)',
        }}
        className="rounded-2xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                background: 'rgba(52, 211, 153, 0.16)',
                color: 'var(--accent-jade)',
              }}
              className="text-xs font-semibold px-3 py-1 rounded-full font-mono"
            >
              ∞ Không giới hạn lượt AI (Admin Unlimited)
            </span>
            <span style={{ color: 'var(--ink-secondary)' }} className="text-xs font-mono">
              Điều hành: {currentUser.username}
            </span>
          </div>
          <h1 className="text-xl font-semibold mt-1">F-FORUM v3 Admin Control Plane</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('workspace')}
            style={{
              background: 'var(--accent-primary)',
              color: '#0b0d12',
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
          >
            Mở Work space (Unlimited)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void loadAdminState()}
            disabled={loadingState}
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-strong)',
              color: 'var(--ink-primary)',
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            style={{
              background: 'transparent',
              borderColor: 'var(--border-subtle)',
              color: 'var(--ink-secondary)',
            }}
            className="px-3 py-2 rounded-xl border text-xs font-medium"
          >
            Đăng xuất
          </button>
        </div>
      </section>

      {adminState && (
        <section
          aria-label="Real Runtime Telemetry"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {[
            {
              label: 'Tổng yêu cầu AI thực',
              value: String(adminState.telemetry.totalAiRequests),
              meta: `Thành công: ${adminState.telemetry.successfulAiRequests} | Fallback: ${adminState.telemetry.fallbackAiRequests}`,
            },
            {
              label: 'Phiên & Tài khoản',
              value: `${adminState.telemetry.registeredUsersCount} tài khoản`,
              meta: `Nhóm quota đang theo dõi: ${adminState.telemetry.activeSessionsCount}`,
            },
            {
              label: 'Source of Knowledge',
              value: `${adminState.telemetry.communityPostsCount} bài viết`,
              meta: `Chờ kiểm duyệt: ${adminState.telemetry.pendingModerationCount}`,
            },
            {
              label: 'Thời gian hoạt động',
              value: `${adminState.telemetry.uptimeSeconds}s`,
              meta: `Bị chặn hạn mức: ${adminState.telemetry.quotaBlockedRequests}`,
            },
          ].map((stat) => (
            <article
              key={stat.label}
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
              className="rounded-2xl border p-4 flex flex-col gap-1 overflow-hidden"
            >
              <span style={{ color: 'var(--ink-secondary)' }} className="text-xs">
                {stat.label}
              </span>
              <strong
                style={{ color: 'var(--ink-primary)' }}
                className="text-xl font-semibold font-mono"
              >
                {stat.value}
              </strong>
              <span style={{ color: 'var(--ink-muted)' }} className="text-[11px]">
                {stat.meta}
              </span>
            </article>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <section
            aria-label="AI Gateway and Quota Control"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-2xl border p-5 flex flex-col gap-4 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <h2 className="text-sm font-semibold">AI Gateway & Quota Control</h2>
              </div>
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={gwEnabled}
                  onChange={(e) => setGwEnabled(e.target.checked)}
                />
                Bật ghi đè runtime
              </label>
            </div>

            <form onSubmit={(e) => void handleSaveGateway(e)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs">
                <span style={{ color: 'var(--ink-secondary)' }}>Protocol</span>
                <select
                  value={gwProtocol}
                  onChange={(e) => setGwProtocol(e.target.value as AIProtocol)}
                  style={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }}
                  className="px-3 py-2 rounded-xl border text-xs"
                >
                  <option value="openai-compatible">openai-compatible</option>
                  <option value="anthropic">anthropic</option>
                  <option value="gemini">gemini</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs">
                <span style={{ color: 'var(--ink-secondary)' }}>Default Model</span>
                <input
                  type="text"
                  value={gwModel}
                  onChange={(e) => setGwModel(e.target.value)}
                  style={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-mono"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs sm:col-span-2">
                <span style={{ color: 'var(--ink-secondary)' }}>Upstream Base URL</span>
                <input
                  type="url"
                  value={gwBaseUrl}
                  onChange={(e) => setGwBaseUrl(e.target.value)}
                  style={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-mono"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs">
                <span style={{ color: 'var(--ink-secondary)' }}>Standard Turn Limit</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={gwTurnLimit}
                  onChange={(e) => setGwTurnLimit(Number(e.target.value) || 15)}
                  style={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-mono"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs">
                <span style={{ color: 'var(--ink-secondary)' }}>
                  Custom API Key (để trống để giữ khóa cũ)
                </span>
                <input
                  type="password"
                  value={gwApiKey}
                  onChange={(e) => setGwApiKey(e.target.value)}
                  placeholder={adminState?.gateway.hasCustomApiKey ? 'Đã lưu khóa tùy chỉnh' : 'Mặc định từ .env'}
                  style={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-mono"
                />
              </label>

              <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-1 flex-wrap">
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={gwGuestSandbox}
                    onChange={(e) => setGwGuestSandbox(e.target.checked)}
                  />
                  Cho phép Guest Sandbox (15 lượt)
                </label>

                <button
                  type="submit"
                  disabled={gwSaving}
                  style={{
                    background: 'var(--accent-primary)',
                    color: '#0b0d12',
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                >
                  {gwSaving ? 'Đang lưu...' : 'Lưu cấu hình Gateway'}
                </button>
              </div>
            </form>
          </section>

          <section
            aria-label="User and Quota Registry"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: 'var(--accent-verdigris)' }} />
              <h2 className="text-sm font-semibold">User & Quota Registry</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-secondary)',
                    }}
                    className="border-b"
                  >
                    <th className="py-2 pr-3 font-medium">Đối tượng</th>
                    <th className="py-2 pr-3 font-medium">Vai trò</th>
                    <th className="py-2 pr-3 font-medium">Hạn mức</th>
                    <th className="py-2 text-right font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {(adminState?.usersAndQuotas || []).map((rec) => (
                    <tr
                      key={rec.subjectId}
                      style={{ borderColor: 'var(--border-subtle)' }}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold">{rec.username}</div>
                        <div style={{ color: 'var(--ink-muted)' }} className="font-mono text-[11px]">
                          {rec.subjectId}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 font-mono">{rec.role}</td>
                      <td className="py-2.5 pr-3 font-mono">
                        {rec.unlimited ? `${rec.used} / ∞` : `${rec.used} / ${rec.limit ?? 15}`}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleResetQuota(rec.subjectId)}
                            style={{
                              background: 'var(--bg-panel)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--ink-primary)',
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px]"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                          </button>
                          {rec.subjectType !== 'guest' && rec.subjectId !== 'admin:sys-admin-root' && (
                            <button
                              type="button"
                              onClick={() => void handleToggleRole(rec.subjectId)}
                              style={{
                                background: 'var(--bg-panel)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--accent-primary)',
                              }}
                              className="px-2 py-1 rounded-lg border text-[11px]"
                            >
                              Đổi vai trò
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6 min-w-0">
          <section
            aria-label="Moderation Queue"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden"
          >
            <h2 className="text-sm font-semibold">
              Hàng đợi kiểm duyệt ({adminState?.moderationQueue.length || 0})
            </h2>

            {(adminState?.moderationQueue || []).length === 0 ? (
              <p style={{ color: 'var(--ink-muted)' }} className="text-xs">
                Không có báo cáo nào trong hàng đợi.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {(adminState?.moderationQueue || []).map((rep) => (
                  <article
                    key={rep.id}
                    style={{
                      background: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                    }}
                    className="rounded-xl border p-3 flex flex-col gap-2 overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block truncate">
                          {rep.targetTitle}
                        </span>
                        <span style={{ color: 'var(--ink-muted)' }} className="text-[11px]">
                          Kênh: {rep.targetChannel} | Báo cáo bởi {rep.reporterName}
                        </span>
                      </div>
                      <span
                        style={{
                          background: 'var(--bg-surface)',
                          color:
                            rep.status === 'pending'
                              ? 'var(--accent-primary)'
                              : rep.status === 'hidden'
                                ? 'var(--accent-copper)'
                                : 'var(--accent-jade)',
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0"
                      >
                        {rep.status}
                      </span>
                    </div>
                    <p style={{ color: 'var(--ink-secondary)' }} className="text-xs">
                      {rep.reason}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => void handleModerate(rep.id, 'approved')}
                        style={{
                          background: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--accent-jade)',
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px]"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleModerate(rep.id, 'hidden')}
                        style={{
                          background: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--accent-copper)',
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px]"
                      >
                        <EyeOff className="w-3 h-3" />
                        Hide Post
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleModerate(rep.id, 'dismissed')}
                        style={{
                          background: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-secondary)',
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px]"
                      >
                        <XCircle className="w-3 h-3" />
                        Dismiss
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section
            aria-label="Streaming Audit Log Filter"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <h2 className="text-sm font-semibold">Audit Log</h2>
              </div>
              <button
                type="button"
                aria-pressed={onlyCriticalLogs}
                onClick={() => setOnlyCriticalLogs((v) => !v)}
                style={{
                  background: onlyCriticalLogs ? 'var(--bg-panel)' : 'transparent',
                  borderColor: onlyCriticalLogs ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: onlyCriticalLogs ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                }}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-medium"
              >
                {onlyCriticalLogs ? 'Đang lọc tác vụ quản trị' : 'Lọc tác vụ quản trị'}
              </button>
            </div>

            <div
              role="log"
              aria-label="Admin audit entries"
              style={{
                background: 'var(--bg-canvas)',
                borderColor: 'var(--border-subtle)',
              }}
              className="rounded-xl border p-3 max-h-56 overflow-y-auto font-mono text-[11px] flex flex-col gap-2"
            >
              {filteredLogs.map((entry) => (
                <div
                  key={entry.id}
                  style={{ borderColor: 'var(--border-subtle)' }}
                  className="grid grid-cols-[64px_minmax(0,1fr)] gap-2 pb-1.5 border-b last:border-b-0"
                >
                  <time style={{ color: 'var(--ink-muted)' }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                  <div className="min-w-0">
                    <span style={{ color: 'var(--accent-verdigris)' }} className="font-semibold">
                      {entry.action}
                    </span>{' '}
                    <span style={{ color: 'var(--ink-secondary)' }}>({entry.actor})</span>
                    <div style={{ color: 'var(--ink-primary)' }} className="break-words">
                      {entry.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ color: 'var(--ink-muted)' }} className="text-[11px]" aria-live="polite">
              Hiển thị {filteredLogs.length} dòng nhật ký thực.
            </div>
          </section>

          <section
            aria-label="Public Changelog Publisher"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <FilePlus2 className="w-4 h-4" style={{ color: 'var(--accent-jade)' }} />
              <h2 className="text-sm font-semibold">Xuất bản Changelog công khai</h2>
            </div>

            <form onSubmit={(e) => void handlePublishChangelog(e)} className="flex flex-col gap-2.5">
              <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                <input
                  type="text"
                  value={clVersion}
                  onChange={(e) => setClVersion(e.target.value)}
                  placeholder="3.0.1"
                  style={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-mono"
                />
                <input
                  type="text"
                  value={clTitle}
                  onChange={(e) => setClTitle(e.target.value)}
                  placeholder="Tiêu đề bản cập nhật"
                  style={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }}
                  className="px-3 py-2 rounded-xl border text-xs"
                />
              </div>
              <textarea
                rows={3}
                value={clNotes}
                onChange={(e) => setClNotes(e.target.value)}
                placeholder="Mô tả các thay đổi kỹ thuật đã kiểm định..."
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--ink-primary)',
                }}
                className="px-3 py-2 rounded-xl border text-xs resize-y"
              />
              <button
                type="submit"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#0b0d12',
                }}
                className="self-end px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Đăng Changelog công khai
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
};
