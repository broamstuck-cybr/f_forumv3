import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { AIProtocol } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { LampSwitch, LiquidTabs, ThemeSwitch } from '../../components/pinui';

type SettingsSectionId = 'appearance' | 'motion' | 'ai' | 'export' | 'system';

interface LocalConnectorPrefs {
  githubConnected: boolean;
  githubScope: 'read-only' | 'pr-push';
  githubRepo: string;
  defaultProjectPrivacy: 'private' | 'public';
}

const PREFS_STORAGE_KEY = 'fforum_v3_extended_prefs';

const DEFAULT_PREFS: LocalConnectorPrefs = {
  githubConnected: false,
  githubScope: 'read-only',
  githubRepo: '',
  defaultProjectPrivacy: 'private',
};

function loadConnectorPrefs(): LocalConnectorPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<LocalConnectorPrefs>;
    return {
      githubConnected: Boolean(parsed.githubConnected),
      githubScope: parsed.githubScope === 'pr-push' ? 'pr-push' : 'read-only',
      githubRepo: typeof parsed.githubRepo === 'string' ? parsed.githubRepo : '',
      defaultProjectPrivacy: parsed.defaultProjectPrivacy === 'public' ? 'public' : 'private',
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export const SettingsView: React.FC = () => {
  const {
    quota,
    settings,
    updateSettings,
    updateByok,
    theme,
    setTheme,
    themeEffect,
    setThemeEffect,
    reducedMotion,
    setReducedMotion,
    savedItemIds,
    projects,
    navigate,
    addToast,
  } = useAppStore();

  const [section, setSection] = useState<SettingsSectionId>('appearance');
  const [prefs, setPrefs] = useState<LocalConnectorPrefs>(() => loadConnectorPrefs());
  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const existingRaw = window.localStorage.getItem(PREFS_STORAGE_KEY);
      const existing = existingRaw ? (JSON.parse(existingRaw) as Record<string, unknown>) : {};
      window.localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({
          ...existing,
          ...prefs,
        })
      );
    } catch {
      return;
    }
  }, [prefs]);

  const handleExportWorkspaceJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: '3.0.0',
      savedItemIds,
      settings: {
        theme: settings.theme,
        themeEffect,
        reducedMotion: settings.reducedMotion,
        compactDensity: settings.compactDensity,
        defaultExportTarget: settings.defaultExportTarget,
      },
      projects,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `f-forum-v3-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Đã xuất bản sao lưu',
      message: 'Khóa API cá nhân đã được loại bỏ khỏi tệp xuất.',
    });
  };

  const handleResetLocalData = () => {
    if (typeof window === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith('fforum_v3_') || key === 'fforum_theme')) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
    window.localStorage.removeItem('fforum_theme');
    setConfirmReset(false);
    addToast({
      type: 'warning',
      title: 'Đã đặt lại dữ liệu cục bộ',
      message: 'Đang khôi phục trạng thái mặc định...',
    });
    window.setTimeout(() => {
      window.location.reload();
    }, 450);
  };

  const sections: Array<{ id: SettingsSectionId; label: string }> = [
    { id: 'appearance', label: 'Giao diện' },
    { id: 'motion', label: 'Chuyển động' },
    { id: 'ai', label: 'Kết nối AI' },
    { id: 'export', label: 'Xuất mã' },
    { id: 'system', label: 'Hệ thống' },
  ];

  const quotaRatio = quota.unlimited
    ? 1
    : Math.min(1, Math.max(0, quota.used / Math.max(1, quota.limit || 15)));

  return (
    <div className="ff-container py-10 sm:py-14 pb-24 flex-1">
      <header
        className="pb-8 mb-8 border-b flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="space-y-2 max-w-2xl">
          <h1
            className="m-0 text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
          >
            Cài đặt
          </h1>
          <p className="m-0 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Ánh sáng, chuyển động, khóa kết nối AI, định dạng xuất mã và trạng thái cục bộ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('profile')}
          className="self-start sm:self-auto rounded-full border px-4 py-2 text-xs font-medium cursor-pointer"
          style={{
            borderColor: 'var(--border-strong)',
            color: 'var(--ink-primary)',
            background: 'transparent',
          }}
        >
          Hồ sơ
        </button>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Danh mục cài đặt"
          className="flex gap-1.5 overflow-x-auto pb-2 lg:pb-0 lg:flex-col lg:sticky lg:top-24"
        >
          {sections.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                aria-current={active ? 'page' : undefined}
                className="shrink-0 rounded-xl px-4 py-2.5 text-left text-xs font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                  borderColor: active ? 'var(--border-strong)' : 'transparent',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <main className="min-w-0">
          {section === 'appearance' && (
            <section
              aria-label="Giao diện"
              className="rounded-[24px] border p-6 sm:p-8 space-y-8"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="space-y-1.5">
                <h2
                  className="m-0 text-2xl font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                >
                  Giao diện
                </h2>
                <p className="m-0 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                  Chuyển đổi sắc độ sáng tối và hiệu ứng lan tỏa bề mặt trên toàn hệ thống.
                </p>
              </div>

              <div
                className="flex flex-col gap-4 border-t pt-6"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                    Hiệu ứng chuyển sắc
                  </div>
                  <p className="m-0 text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Chọn Giọt nước, Mưa rơi hoặc Ánh sáng khi chuyển đổi nền.
                  </p>
                </div>

                <div className="w-full max-w-[560px]">
                  <ThemeSwitch
                    theme={theme}
                    onThemeChange={(next) => setTheme(next)}
                    effect={themeEffect}
                    onEffectChange={(eff) => setThemeEffect(eff)}
                  />
                </div>
              </div>

              <div
                className="flex flex-col gap-4 border-t pt-6"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                    Đèn kéo dây
                  </div>
                  <p className="m-0 text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Kéo chao đèn hoặc gạt công tắc để bật tắt ánh sáng giao diện.
                  </p>
                </div>

                <div className="w-full max-w-[560px] min-h-[260px]">
                  <LampSwitch
                    on={theme === 'light'}
                    onToggle={(isLight) => setTheme(isLight ? 'light' : 'dark')}
                    onLabel="Sáng"
                    offLabel="Tối"
                    className="min-h-[260px]"
                  />
                </div>
              </div>
            </section>
          )}

          {section === 'motion' && (
            <section
              aria-label="Chuyển động"
              className="rounded-[24px] border p-6 sm:p-8 space-y-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="space-y-1.5">
                <h2
                  className="m-0 text-2xl font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                >
                  Chuyển động
                </h2>
                <p className="m-0 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                  Điều chỉnh nhịp chuyển động vật lý và mật độ khoảng trống hiển thị.
                </p>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-4 border-t pt-6"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                    Giảm chuyển động
                  </div>
                  <p className="m-0 text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Ưu tiên chuyển cảnh tức thì và tắt hiệu ứng lò xo phức tạp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReducedMotion(!reducedMotion)}
                  aria-pressed={reducedMotion}
                  className="rounded-full border px-4 py-2 text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: reducedMotion ? 'var(--accent-verdigris-soft)' : 'var(--bg-panel)',
                    borderColor: reducedMotion ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                    color: reducedMotion ? 'var(--accent-verdigris)' : 'var(--ink-secondary)',
                  }}
                >
                  {reducedMotion ? 'Đang bật' : 'Đang tắt'}
                </button>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-4 border-t pt-6"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                    Mật độ hiển thị
                  </div>
                  <p className="m-0 text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Chuyển giữa khoảng thở rộng rãi mặc định và bố cục thu gọn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({ compactDensity: !settings.compactDensity })}
                  aria-pressed={settings.compactDensity}
                  className="rounded-full border px-4 py-2 text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: settings.compactDensity ? 'var(--accent-soft)' : 'var(--bg-panel)',
                    borderColor: settings.compactDensity ? 'var(--border-accent)' : 'var(--border-subtle)',
                    color: settings.compactDensity ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                  }}
                >
                  {settings.compactDensity ? 'Thu gọn' : 'Tiêu chuẩn'}
                </button>
              </div>
            </section>
          )}

          {section === 'ai' && (
            <section
              aria-label="Kết nối AI"
              className="rounded-[24px] border p-6 sm:p-8 space-y-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h2
                    className="m-0 text-2xl font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                  >
                    Kết nối AI
                  </h2>
                  <p className="m-0 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                    Khóa API riêng chỉ lưu cục bộ trên trình duyệt và truyền qua kết nối bảo mật khi gọi mô hình.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => updateByok({ enabled: !settings.byok.enabled })}
                  aria-pressed={settings.byok.enabled}
                  className="rounded-full border px-4 py-2 text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: settings.byok.enabled ? 'var(--accent-jade-soft)' : 'var(--bg-panel)',
                    borderColor: settings.byok.enabled ? 'var(--accent-jade)' : 'var(--border-subtle)',
                    color: settings.byok.enabled ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                  }}
                >
                  {settings.byok.enabled ? 'Đang bật' : 'Đang tắt'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 border-t pt-6" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Giao thức
                  </label>
                  <select
                    value={settings.byok.protocol}
                    onChange={(e) => updateByok({ protocol: e.target.value as AIProtocol })}
                    className="h-10 w-full rounded-xl border px-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  >
                    <option value="openai-compatible">openai-compatible</option>
                    <option value="anthropic">anthropic</option>
                    <option value="gemini">gemini</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Tên mô hình
                  </label>
                  <input
                    type="text"
                    value={settings.byok.model}
                    onChange={(e) => updateByok({ model: e.target.value })}
                    placeholder="studio-smart-route"
                    className="h-10 w-full rounded-xl border px-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Đường dẫn API
                  </label>
                  <input
                    type="url"
                    value={settings.byok.baseUrl}
                    onChange={(e) => updateByok({ baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="h-10 w-full rounded-xl border px-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Khóa API
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.byok.apiKey}
                      onChange={(e) => updateByok({ apiKey: e.target.value })}
                      placeholder="sk-..."
                      autoComplete="off"
                      className="h-10 flex-1 rounded-xl border px-3 font-mono text-xs outline-none"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((prev) => !prev)}
                      aria-label={showApiKey ? 'Ẩn khóa API' : 'Hiện khóa API'}
                      title={showApiKey ? 'Ẩn' : 'Hiện'}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-secondary)',
                      }}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {section === 'export' && (
            <section
              aria-label="Xuất mã"
              className="rounded-[24px] border p-6 sm:p-8 space-y-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="space-y-1.5">
                <h2
                  className="m-0 text-2xl font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                >
                  Xuất mã
                </h2>
                <p className="m-0 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                  Cấu hình bộ tệp khởi tạo tự động sinh kèm khi xuất gói ZIP từ Workspace.
                </p>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-4 border-t pt-6"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                    Môi trường đích
                  </div>
                  <p className="m-0 text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Sinh bộ RULES.md, SKILLS.md và PROJECT_CONTEXT phù hợp trình soạn thảo.
                  </p>
                </div>
                <LiquidTabs
                  tabs={[
                    { id: 'antigravity', label: 'Antigravity' },
                    { id: 'cursor', label: 'Cursor' },
                  ]}
                  activeId={settings.defaultExportTarget}
                  onChange={(id) =>
                    updateSettings({ defaultExportTarget: id as 'antigravity' | 'cursor' })
                  }
                />
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-4 border-t pt-6"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                    Quyền riêng tư mặc định
                  </div>
                  <p className="m-0 text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Dự án mới lưu cục bộ cho đến khi bạn chủ động chia sẻ.
                  </p>
                </div>
                <LiquidTabs
                  tabs={[
                    { id: 'private', label: 'Riêng tư' },
                    { id: 'public', label: 'Công khai' },
                  ]}
                  activeId={prefs.defaultProjectPrivacy}
                  onChange={(id) =>
                    setPrefs((p) => ({ ...p, defaultProjectPrivacy: id as 'private' | 'public' }))
                  }
                />
              </div>
            </section>
          )}

          {section === 'system' && (
            <section
              aria-label="Hệ thống"
              className="rounded-[24px] border p-6 sm:p-8 space-y-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="space-y-1.5">
                <h2
                  className="m-0 text-2xl font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                >
                  Hệ thống
                </h2>
                <p className="m-0 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                  Hạn mức sử dụng thực tế, kết nối GitHub, sao lưu dữ liệu và đặt lại trình duyệt.
                </p>
              </div>

              <div
                className="rounded-2xl border p-5 space-y-3"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Hạn mức AI phiên hiện tại
                  </span>
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{
                      color: quota.unlimited
                        ? 'var(--accent-jade)'
                        : quota.exhausted
                          ? 'var(--accent-danger)'
                          : 'var(--accent-primary)',
                    }}
                  >
                    {quota.unlimited ? 'Không giới hạn' : `${quota.used}/${quota.limit ?? 15} lượt`}
                  </span>
                </div>

                <div
                  className="h-1.5 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <div
                    className="h-full w-full rounded-full"
                    style={{
                      backgroundColor: quota.unlimited
                        ? 'var(--accent-jade)'
                        : quota.exhausted
                          ? 'var(--accent-danger)'
                          : 'var(--accent-primary)',
                      transform: `scaleX(${quotaRatio})`,
                      transformOrigin: 'left center',
                    }}
                  />
                </div>
              </div>

              <div
                className="border-t pt-6 space-y-4"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                      GitHub
                    </div>
                    <p className="m-0 text-xs" style={{ color: 'var(--ink-muted)' }}>
                      Giới hạn quyền đọc hoặc cho phép đẩy nhánh đối chiếu từ Workspace.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !prefs.githubConnected;
                      setPrefs((p) => ({ ...p, githubConnected: next }));
                      addToast({
                        type: next ? 'success' : 'info',
                        title: next ? 'Đã kết nối GitHub' : 'Đã ngắt kết nối GitHub',
                      });
                    }}
                    className="rounded-full px-4 py-2 text-xs font-semibold cursor-pointer"
                    style={{
                      backgroundColor: prefs.githubConnected ? 'var(--accent-jade)' : 'var(--accent-primary)',
                      color: 'var(--ink-inverse)',
                    }}
                  >
                    {prefs.githubConnected ? 'Ngắt' : 'Kết nối'}
                  </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <input
                    type="text"
                    value={prefs.githubRepo}
                    onChange={(e) => setPrefs((p) => ({ ...p, githubRepo: e.target.value }))}
                    placeholder="owner/repository"
                    aria-label="Kho GitHub"
                    className="h-10 flex-1 rounded-xl border px-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                  <LiquidTabs
                    tabs={[
                      { id: 'read-only', label: 'Chỉ đọc' },
                      { id: 'pr-push', label: 'PR & Push' },
                    ]}
                    activeId={prefs.githubScope}
                    onChange={(id) =>
                      setPrefs((p) => ({ ...p, githubScope: id as 'read-only' | 'pr-push' }))
                    }
                  />
                </div>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-3 border-t pt-6"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={handleExportWorkspaceJson}
                  className="rounded-full border px-5 py-2 text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }}
                >
                  Sao lưu
                </button>

                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="rounded-full border px-5 py-2 text-xs font-semibold cursor-pointer"
                    style={{
                      borderColor: 'var(--accent-copper)',
                      color: 'var(--accent-copper)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Đặt lại
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="rounded-full border px-4 py-2 text-xs font-medium cursor-pointer"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-secondary)',
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleResetLocalData}
                      className="rounded-full px-4 py-2 text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent-danger)',
                        color: 'var(--ink-inverse)',
                      }}
                    >
                      Xác nhận
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
