import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bookmark,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FolderCode,
  GitBranch,
  KeyRound,
  LogIn,
  LogOut,
  RotateCcw,
  Shield,
  Sliders,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import type { AIProtocol } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { LiquidTabs, ThemeSwitch } from '../../components/pinui';

type SettingsSectionId = 'account' | 'ai' | 'workspace' | 'connectors' | 'privacy';

interface LocalStudioPrefs {
  displayName: string;
  handle: string;
  clubAffiliation: string;
  githubUrl: string;
  bio: string;
  defaultModel: string;
  globalSystemRules: string;
  diffMode: 'unified' | 'split';
  codeFontSize: 13 | 14 | 15;
  autoRefreshPreview: boolean;
  checks: {
    html_structure: boolean;
    js_syntax: boolean;
    responsive_layout: boolean;
    internal_links: boolean;
    secret_scan: boolean;
    accessibility: boolean;
  };
  githubConnected: boolean;
  githubScope: 'read-only' | 'pr-push';
  githubRepo: string;
  defaultProjectPrivacy: 'private' | 'public';
}

const PREFS_STORAGE_KEY = 'fforum_v3_extended_prefs';

const DEFAULT_PREFS: LocalStudioPrefs = {
  displayName: 'Maker Guest',
  handle: 'maker_studio',
  clubAffiliation: 'Frontend Performance & UI Systems',
  githubUrl: 'https://github.com',
  bio: 'Xây dựng giao diện Spatial Web và hệ thống thiết kế theo chuẩn Design Tokens.',
  defaultModel: 'auto',
  globalSystemRules:
    'Ưu tiên HTML ngữ nghĩa, CSS custom properties rõ ràng cho Dark/Light mode, không dùng inline comment và đảm bảo responsive 390/768/1440px.',
  diffMode: 'split',
  codeFontSize: 14,
  autoRefreshPreview: true,
  checks: {
    html_structure: true,
    js_syntax: true,
    responsive_layout: true,
    internal_links: true,
    secret_scan: true,
    accessibility: true,
  },
  githubConnected: false,
  githubScope: 'read-only',
  githubRepo: '',
  defaultProjectPrivacy: 'private',
};

function loadPrefs(): LocalStudioPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<LocalStudioPrefs>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      checks: {
        ...DEFAULT_PREFS.checks,
        ...(parsed.checks || {}),
      },
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    setAuthModalOpen,
    logout,
    quota,
    settings,
    updateSettings,
    updateByok,
    theme,
    toggleTheme,
    reducedMotion,
    setReducedMotion,
    savedItemIds,
    toggleSavedItem,
    resourceLibrary,
    sourceCatalog,
    projects,
    selectProject,
    navigate,
    addToast,
  } = useAppStore();

  const [section, setSection] = useState<SettingsSectionId>('account');
  const [prefs, setPrefs] = useState<LocalStudioPrefs>(() => loadPrefs());
  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      return;
    }
  }, [prefs]);

  const savedEntries = useMemo(() => {
    const entries: Array<{ id: string; title: string; subtitle: string; kind: 'resource' | 'template' }> = [];
    for (const id of savedItemIds) {
      const res = resourceLibrary.find((r) => r.id === id);
      if (res) {
        entries.push({ id: res.id, title: res.title, subtitle: res.group, kind: 'resource' });
        continue;
      }
      const tpl = sourceCatalog.find((t) => t.id === id);
      if (tpl) {
        entries.push({ id: tpl.id, title: tpl.title, subtitle: tpl.sourceLibrary, kind: 'template' });
      }
    }
    return entries;
  }, [savedItemIds, resourceLibrary, sourceCatalog]);

  const quotaRatio = quota.unlimited
    ? 1
    : Math.min(1, Math.max(0, quota.used / Math.max(1, quota.limit || 15)));

  const handleExportWorkspaceJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: '3.0.0',
      profile: {
        user: currentUser
          ? { username: currentUser.username, name: currentUser.name, role: currentUser.role }
          : null,
        handle: prefs.handle,
        clubAffiliation: prefs.clubAffiliation,
      },
      savedItemIds,
      settings: {
        theme: settings.theme,
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
      title: 'Đã xuất bản sao lưu JSON',
      message: 'API Key BYOK đã được tự động loại bỏ khỏi tệp xuất.',
    });
  };

  const handleResetLocalData = () => {
    if (typeof window === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('fforum_v3_')) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
    setConfirmReset(false);
    addToast({
      type: 'warning',
      title: 'Đã đặt lại dữ liệu cục bộ',
      message: 'Đang tải lại trạng thái khởi tạo sạch...',
    });
    window.setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const sections: Array<{ id: SettingsSectionId; label: string; icon: React.ReactNode }> = [
    { id: 'account', label: 'Account & Profile', icon: <UserIcon className="h-4 w-4" aria-hidden="true" /> },
    { id: 'ai', label: 'AI & Model Preferences', icon: <Cpu className="h-4 w-4" aria-hidden="true" /> },
    { id: 'workspace', label: 'Workspace Defaults', icon: <Sliders className="h-4 w-4" aria-hidden="true" /> },
    { id: 'connectors', label: 'Connectors & Integrations', icon: <GitBranch className="h-4 w-4" aria-hidden="true" /> },
    { id: 'privacy', label: 'Privacy, Data & Usage', icon: <Shield className="h-4 w-4" aria-hidden="true" /> },
  ];

  const checkEntries: Array<{ key: keyof LocalStudioPrefs['checks']; label: string }> = [
    { key: 'html_structure', label: 'HTML Structure & Landmarks' },
    { key: 'js_syntax', label: 'JavaScript Syntax Parse' },
    { key: 'responsive_layout', label: 'Responsive Viewport & Overflow' },
    { key: 'internal_links', label: 'Internal Link Integrity' },
    { key: 'secret_scan', label: 'Secret Leak Scan trước khi Export' },
    { key: 'accessibility', label: 'Accessibility Basics (alt, aria, focus)' },
  ];

  const activeDisplayName = currentUser?.name || prefs.displayName;
  const activeHandle = currentUser?.username || prefs.handle;

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pt-6 pb-20 sm:px-6 lg:px-10">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: 'var(--ink-primary)' }}>
            Settings & Maker Profile
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Quản lý hồ sơ Maker, cấu hình AI BYOK, mặc định Work space, kết nối GitHub và giới hạn lượt sử dụng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeSwitch theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-24">
          <section
            aria-label="Maker Profile Overview"
            className="overflow-hidden rounded-[22px] border p-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] font-mono text-base font-bold"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-primary) 18%, transparent)',
                  color: 'var(--accent-primary)',
                }}
              >
                {activeDisplayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {activeDisplayName}
                </h2>
                <p className="truncate font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                  @{activeHandle}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs" style={{ color: 'var(--ink-secondary)' }}>
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: 'var(--ink-muted)' }}>Vai trò</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--accent-verdigris)' }}>
                  {currentUser?.role === 'admin' ? 'System Admin' : currentUser ? 'Maker' : 'Guest Session'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: 'var(--ink-muted)' }}>CLB</span>
                <span className="truncate text-right font-medium" style={{ color: 'var(--ink-primary)' }}>
                  {prefs.clubAffiliation}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: 'var(--ink-muted)' }}>Đã lưu / Dự án</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {savedItemIds.length} mục / {projects.length} dự án
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-primary)',
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Đăng xuất</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#06080d',
                  }}
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Đăng nhập</span>
                </button>
              )}

              {prefs.githubUrl ? (
                <a
                  href={prefs.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Mở trang GitHub cá nhân"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </section>

          <nav
            aria-label="Danh mục cài đặt"
            className="flex gap-1.5 overflow-x-auto rounded-[20px] border p-2 lg:flex-col"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {sections.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[14px] px-3.5 py-2.5 text-left text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: active
                      ? 'color-mix(in srgb, var(--accent-primary) 16%, transparent)'
                      : 'transparent',
                    color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-6">
          {section === 'account' ? (
            <>
              <section
                className="overflow-hidden rounded-[22px] border p-6"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <h2 className="text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  1. Account & Profile
                </h2>
                <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                  Thông tin hiển thị trên Maker Profile, bài viết Source of Knowledge và liên kết CLB.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      value={prefs.displayName}
                      onChange={(e) => setPrefs((p) => ({ ...p, displayName: e.target.value }))}
                      className="h-10 w-full rounded-[12px] border px-3 text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-primary)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                      Maker Handle
                    </label>
                    <input
                      type="text"
                      value={prefs.handle}
                      onChange={(e) => setPrefs((p) => ({ ...p, handle: e.target.value }))}
                      className="h-10 w-full rounded-[12px] border px-3 font-mono text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-primary)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                      Câu lạc bộ / Nhóm nghiên cứu
                    </label>
                    <input
                      type="text"
                      value={prefs.clubAffiliation}
                      onChange={(e) => setPrefs((p) => ({ ...p, clubAffiliation: e.target.value }))}
                      className="h-10 w-full rounded-[12px] border px-3 text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-primary)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                      Liên kết GitHub
                    </label>
                    <input
                      type="url"
                      value={prefs.githubUrl}
                      onChange={(e) => setPrefs((p) => ({ ...p, githubUrl: e.target.value }))}
                      className="h-10 w-full rounded-[12px] border px-3 font-mono text-xs outline-none"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-primary)',
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Giới thiệu ngắn
                  </label>
                  <textarea
                    rows={2}
                    value={prefs.bio}
                    onChange={(e) => setPrefs((p) => ({ ...p, bio: e.target.value }))}
                    className="w-full rounded-[12px] border p-3 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>
              </section>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <section
                  className="overflow-hidden rounded-[22px] border p-5"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4" style={{ color: 'var(--accent-jade)' }} aria-hidden="true" />
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                        Tài nguyên & Mẫu đã lưu ({savedEntries.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('explore')}
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--accent-verdigris)' }}
                    >
                      Mở Explore
                    </button>
                  </div>

                  {savedEntries.length === 0 ? (
                    <p className="mt-4 text-xs" style={{ color: 'var(--ink-muted)' }}>
                      Chưa có mục nào được lưu. Nhấn Save ở Explore hoặc Community Drops để ghim tại đây.
                    </p>
                  ) : (
                    <div className="mt-3 divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      {savedEntries.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 py-2.5 text-xs"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold" style={{ color: 'var(--ink-primary)' }}>
                              {item.title}
                            </p>
                            <p className="font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                              {item.subtitle}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSavedItem(item.id)}
                            className="shrink-0 rounded-full border px-2.5 py-1 text-[11px]"
                            style={{
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--ink-secondary)',
                            }}
                          >
                            Bỏ lưu
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section
                  className="overflow-hidden rounded-[22px] border p-5"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FolderCode className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                        Dự án Work space ({projects.length})
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {projects.slice(0, 6).map((proj) => (
                      <div
                        key={proj.id}
                        className="flex items-center justify-between gap-3 py-2.5 text-xs"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold" style={{ color: 'var(--ink-primary)' }}>
                            {proj.name}
                          </p>
                          <p className="font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                            {proj.files.length} tệp / {new Date(proj.updatedAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            selectProject(proj.id);
                            navigate('workspace');
                          }}
                          className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          Mở
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {section === 'ai' ? (
            <section
              className="overflow-hidden rounded-[22px] border p-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    2. AI & Model Preferences (BYOK)
                  </h2>
                  <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                    Chọn model mặc định hoặc kích hoạt Bring Your Own Key. Khóa API chỉ lưu trong trình duyệt cục bộ và gửi qua header HTTPS khi gọi AI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateByok({ enabled: !settings.byok.enabled })}
                  className="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-xs font-semibold"
                  style={{
                    backgroundColor: settings.byok.enabled
                      ? 'color-mix(in srgb, var(--accent-jade) 16%, transparent)'
                      : 'var(--bg-panel)',
                    borderColor: settings.byok.enabled ? 'var(--accent-jade)' : 'var(--border-subtle)',
                    color: settings.byok.enabled ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                  }}
                >
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{settings.byok.enabled ? 'BYOK: Đang bật' : 'BYOK: Đang tắt'}</span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Default Model Mode
                  </label>
                  <select
                    value={prefs.defaultModel}
                    onChange={(e) => setPrefs((p) => ({ ...p, defaultModel: e.target.value }))}
                    className="h-10 w-full rounded-[12px] border px-3 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  >
                    <option value="auto">Auto (9Router Gateway)</option>
                    <option value="studio-smart-route">Studio Smart Route</option>
                    <option value="studio-heavy-route">Studio Heavy Route</option>
                    <option value="ag/gemini-3.8-flash-low">Gemini 3.8 Flash (Fast)</option>
                    <option value="ag/gemini-4-argon-high">Gemini 4 Argon</option>
                    <option value="ag/claude-sonnet-5-5-medium">Claude Sonnet 5.5</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    BYOK Protocol
                  </label>
                  <select
                    value={settings.byok.protocol}
                    onChange={(e) => updateByok({ protocol: e.target.value as AIProtocol })}
                    className="h-10 w-full rounded-[12px] border px-3 font-mono text-xs outline-none"
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
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    BYOK Base URL
                  </label>
                  <input
                    type="url"
                    value={settings.byok.baseUrl}
                    onChange={(e) => updateByok({ baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="h-10 w-full rounded-[12px] border px-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    BYOK Model ID
                  </label>
                  <input
                    type="text"
                    value={settings.byok.model}
                    onChange={(e) => updateByok({ model: e.target.value })}
                    placeholder="studio-smart-route"
                    className="h-10 w-full rounded-[12px] border px-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  BYOK API Key (chỉ lưu cục bộ trong localStorage)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.byok.apiKey}
                    onChange={(e) => updateByok({ apiKey: e.target.value })}
                    placeholder="sk-..."
                    autoComplete="off"
                    className="h-10 flex-1 rounded-[12px] border px-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    aria-label={showApiKey ? 'Ẩn API key' : 'Hiện API key'}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border"
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

              <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--border-subtle)' }}>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  Global System Rules
                </label>
                <textarea
                  rows={4}
                  value={prefs.globalSystemRules}
                  onChange={(e) => setPrefs((p) => ({ ...p, globalSystemRules: e.target.value }))}
                  className="w-full rounded-[14px] border p-3 font-mono text-xs leading-relaxed outline-none"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>
            </section>
          ) : null}

          {section === 'workspace' ? (
            <section
              className="overflow-hidden rounded-[22px] border p-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <h2 className="text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                3. Workspace Defaults
              </h2>
              <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                Tùy chỉnh chế độ xem Diff, cỡ chữ trình biên tập, tự động tải lại Live Preview và các lớp kiểm định tự động.
              </p>

              <div className="mt-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                      Chế độ hiển thị Diff mặc định
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                      So sánh thay đổi theo từng dòng Unified hoặc 2 cột Split.
                    </p>
                  </div>
                  <LiquidTabs
                    tabs={[
                      { id: 'unified', label: 'Unified' },
                      { id: 'split', label: 'Split' },
                    ]}
                    activeId={prefs.diffMode}
                    onChange={(id) => setPrefs((p) => ({ ...p, diffMode: id as 'unified' | 'split' }))}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                      Cỡ chữ mã nguồn (Code Font Size)
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                      Áp dụng cho trình xem Code & Diff trong Work space.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {([13, 14, 15] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setPrefs((p) => ({ ...p, codeFontSize: sz }))}
                        className="h-9 rounded-full border px-3.5 font-mono text-xs font-semibold"
                        style={{
                          backgroundColor: prefs.codeFontSize === sz ? 'var(--accent-primary)' : 'var(--bg-panel)',
                          borderColor: prefs.codeFontSize === sz ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          color: prefs.codeFontSize === sz ? '#06080d' : 'var(--ink-secondary)',
                        }}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                      Target gói AI Project Setup mặc định
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                      Sinh bộ RULES.md, SKILLS.md, TASKS.md khi xuất ZIP.
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

                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                      Auto-refresh Live Preview & Reduced Motion
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                      Tự động biên dịch lại iframe sandbox ngay khi tệp thay đổi.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPrefs((p) => ({ ...p, autoRefreshPreview: !p.autoRefreshPreview }))
                      }
                      className="h-9 rounded-full border px-4 text-xs font-semibold"
                      style={{
                        backgroundColor: prefs.autoRefreshPreview
                          ? 'color-mix(in srgb, var(--accent-jade) 16%, transparent)'
                          : 'var(--bg-panel)',
                        borderColor: prefs.autoRefreshPreview
                          ? 'var(--accent-jade)'
                          : 'var(--border-subtle)',
                        color: prefs.autoRefreshPreview ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                      }}
                    >
                      Auto-refresh: {prefs.autoRefreshPreview ? 'Bật' : 'Tắt'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReducedMotion(!reducedMotion)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold"
                      style={{
                        backgroundColor: reducedMotion
                          ? 'color-mix(in srgb, var(--accent-verdigris) 16%, transparent)'
                          : 'var(--bg-panel)',
                        borderColor: reducedMotion ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                        color: reducedMotion ? 'var(--accent-verdigris)' : 'var(--ink-secondary)',
                      }}
                    >
                      <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Reduced Motion: {reducedMotion ? 'Bật' : 'Tắt'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    Automated Checks trong Work space
                  </p>
                  <div className="mt-3 divide-y rounded-[16px] border" style={{ borderColor: 'var(--border-subtle)' }}>
                    {checkEntries.map((chk) => {
                      const enabled = prefs.checks[chk.key];
                      return (
                        <label
                          key={chk.key}
                          className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-xs"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          <span className="font-medium" style={{ color: 'var(--ink-primary)' }}>
                            {chk.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() =>
                              setPrefs((p) => ({
                                ...p,
                                checks: { ...p.checks, [chk.key]: !p.checks[chk.key] },
                              }))
                            }
                            className="h-4 w-4 accent-amber-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {section === 'connectors' ? (
            <section
              className="overflow-hidden rounded-[22px] border p-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    4. Connectors & Integrations
                  </h2>
                  <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                    Kết nối GitHub repository để đối chiếu nhanh và chọn phạm vi quyền hạn an toàn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !prefs.githubConnected;
                    setPrefs((p) => ({ ...p, githubConnected: next }));
                    addToast({
                      type: next ? 'success' : 'info',
                      title: next ? 'Đã bật kết nối GitHub Connector' : 'Đã ngắt kết nối GitHub',
                    });
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold"
                  style={{
                    backgroundColor: prefs.githubConnected ? 'var(--accent-jade)' : 'var(--accent-primary)',
                    color: '#06080d',
                  }}
                >
                  <GitBranch className="h-4 w-4" aria-hidden="true" />
                  <span>{prefs.githubConnected ? 'GitHub: Đã kết nối' : 'Kết nối GitHub'}</span>
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div
                  className="flex flex-col gap-3 rounded-[16px] border p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                      Phạm vi quyền (Permission Scope)
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                      Mặc định chỉ đọc (Read-only) để tránh thao tác ghi ngoài ý muốn.
                    </p>
                  </div>
                  <LiquidTabs
                    tabs={[
                      { id: 'read-only', label: 'Read-only' },
                      { id: 'pr-push', label: 'PR & Push' },
                    ]}
                    activeId={prefs.githubScope}
                    onChange={(id) =>
                      setPrefs((p) => ({ ...p, githubScope: id as 'read-only' | 'pr-push' }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Repository đích (owner/repo)
                  </label>
                  <input
                    type="text"
                    value={prefs.githubRepo}
                    onChange={(e) => setPrefs((p) => ({ ...p, githubRepo: e.target.value }))}
                    placeholder="your-org/f-forum-project"
                    className="h-10 w-full rounded-[12px] border px-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {section === 'privacy' ? (
            <section
              className="overflow-hidden rounded-[22px] border p-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <h2 className="text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                5. Privacy, Data & Usage
              </h2>
              <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                Theo dõi hạn mức lượt AI thực tế, quyền riêng tư mặc định và sao lưu toàn bộ dữ liệu Work space.
              </p>

              <div
                className="mt-5 rounded-[18px] border p-5"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border-strong)',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--ink-secondary)' }}>
                    Live AI Turn Quota
                  </span>
                  <span
                    className="font-mono text-sm font-bold"
                    style={{
                      color: quota.unlimited
                        ? 'var(--accent-jade)'
                        : quota.exhausted
                          ? 'var(--accent-copper)'
                          : 'var(--accent-primary)',
                    }}
                  >
                    {quota.unlimited ? '∞ Admin Unlimited' : `${quota.used}/${quota.limit ?? 15} lượt`}
                  </span>
                </div>

                <div
                  className="mt-3 h-2.5 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <div
                    className="h-full w-full rounded-full"
                    style={{
                      backgroundColor: quota.unlimited
                        ? 'var(--accent-jade)'
                        : quota.exhausted
                          ? 'var(--accent-copper)'
                          : 'var(--accent-primary)',
                      transform: `scaleX(${quotaRatio})`,
                      transformOrigin: 'left center',
                      transition: 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                    }}
                  />
                </div>

                <p className="mt-2.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {quota.unlimited
                    ? 'Tài khoản System Admin được cấp quyền không giới hạn lượt AI.'
                    : `Còn lại ${quota.remaining ?? 0} lượt AI trong phiên tiêu chuẩn. Khi đạt 15/15 lượt, bạn có thể dùng BYOK hoặc đăng nhập tài khoản Admin.`}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b pb-5" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                    Quyền riêng tư mặc định cho dự án mới
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Dự án Private chỉ lưu cục bộ cho đến khi bạn chủ động chia sẻ lên Showcase.
                  </p>
                </div>
                <LiquidTabs
                  tabs={[
                    { id: 'private', label: 'Private' },
                    { id: 'public', label: 'Public' },
                  ]}
                  activeId={prefs.defaultProjectPrivacy}
                  onChange={(id) =>
                    setPrefs((p) => ({ ...p, defaultProjectPrivacy: id as 'private' | 'public' }))
                  }
                />
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleExportWorkspaceJson}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border px-5 text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>Export Workspace JSON</span>
                </button>

                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border px-5 text-xs font-semibold"
                    style={{
                      borderColor: 'var(--accent-copper)',
                      color: 'var(--accent-copper)',
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Reset Local Data</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-medium"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-secondary)',
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Hủy</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetLocalData}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--accent-copper)',
                        color: '#ffffff',
                      }}
                    >
                      <span>Xác nhận xóa sạch dữ liệu cục bộ</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
};
