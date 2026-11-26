import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  IconCpu,
  IconDatabase,
  IconEye,
  IconEyeOff,
  IconLayoutTemplate,
  IconMoon,
  IconPalette,
  IconSun,
} from '../../ui/icons';
import { triggerPinuiThemeToggle } from '../../components/layout/GlobalThemeAtmosphere';
import OriginalFileBox from '../../components/pinui/original/file-box/FileBox';
import type {
  AIProtocol,
  ProjectSetupTarget,
  ThemeEffect,
  ThemePreference,
  UiMode,
  WallpaperPreset,
} from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  Chips,
  DynamicDropZone,
  SearchCard,
  SelectionList,
  type DroppedFilePayload,
} from '../../components/pinui';
import { Modal } from '../workspace/Modal';
import {
  applyBackup,
  buildBackup,
  clearLocalData,
  downloadBackup,
  parseBackup,
  type BackupPayload,
} from './backup';
import './settings.css';

type SectionId = 'appearance' | 'workspace' | 'ai' | 'data';

interface PresetDefinition {
  id: WallpaperPreset;
  name: string;
  tone: 'dark' | 'light' | 'auto';
  targetTheme?: ThemePreference;
  swatches: [string, string, string];
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  ambient: boolean;
}

const PRESETS: PresetDefinition[] = [
  {
    id: 'auto',
    name: 'Tự động',
    tone: 'auto',
    targetTheme: 'system',
    swatches: ['#121110', '#e07a5f', '#f5f1e8'],
    previewBg: 'radial-gradient(circle at 24% 22%, rgba(224,122,95,0.45), transparent 56%), radial-gradient(circle at 78% 76%, rgba(125,163,187,0.52), #121110 78%)',
    previewCard: 'rgba(26, 24, 22, 0.82)',
    previewAccent: '#e07a5f',
    ambient: true,
  },
  {
    id: 'dark',
    name: 'Obsidian Godray',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#111010', '#d14b34', '#7da3bb'],
    previewBg: 'radial-gradient(circle at 20% 10%, rgba(209,75,52,0.44), transparent 58%), radial-gradient(circle at 80% 80%, rgba(125,163,187,0.34), #111010 78%)',
    previewCard: 'rgba(28, 25, 22, 0.9)',
    previewAccent: '#d14b34',
    ambient: true,
  },
  {
    id: 'light',
    name: 'Paper Sunburst',
    tone: 'light',
    targetTheme: 'light',
    swatches: ['#f5f1e8', '#ffffff', '#c85a3a'],
    previewBg: 'radial-gradient(circle at 18% 12%, rgba(235,176,120,0.52), transparent 58%), radial-gradient(circle at 84% 78%, rgba(186,217,230,0.48), #f5f1e8 78%)',
    previewCard: 'rgba(255, 252, 246, 0.94)',
    previewAccent: '#c85a3a',
    ambient: true,
  },
  {
    id: 'ember',
    name: 'Ember Godray',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#18100d', '#f16e3b', '#ffb266'],
    previewBg: 'conic-gradient(from 200deg at 20% 15%, rgba(241,110,59,0.72), rgba(255,178,102,0.55) 75deg, rgba(24,16,13,0.95) 210deg)',
    previewCard: 'rgba(34, 20, 15, 0.86)',
    previewAccent: '#ff8a54',
    ambient: true,
  },
  {
    id: 'harbour',
    name: 'Frost Prism',
    tone: 'light',
    targetTheme: 'light',
    swatches: ['#eef6f9', '#d8eaf3', '#2c769e'],
    previewBg: 'radial-gradient(circle at 22% 16%, rgba(154,214,242,0.75), transparent 56%), radial-gradient(circle at 82% 84%, rgba(186,232,216,0.68), #eef6f9 78%)',
    previewCard: 'rgba(255, 255, 255, 0.88)',
    previewAccent: '#2c769e',
    ambient: true,
  },
  {
    id: 'aurora',
    name: 'Aurora Mesh',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#091318', '#34d399', '#38bdf8'],
    previewBg: 'radial-gradient(circle at 20% 22%, rgba(52,211,153,0.55), transparent 55%), radial-gradient(circle at 82% 72%, rgba(56,189,248,0.52), #091318 78%)',
    previewCard: 'rgba(13, 27, 34, 0.84)',
    previewAccent: '#34d399',
    ambient: true,
  },
  {
    id: 'constellation',
    name: 'Golden Nebula',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#0f1218', '#f2c05e', '#7da3bb'],
    previewBg: 'conic-gradient(from 195deg at 22% 8%, rgba(242,192,94,0.48), rgba(125,163,187,0.34) 110deg, #0f1218 240deg)',
    previewCard: 'rgba(18, 22, 34, 0.84)',
    previewAccent: '#f2c05e',
    ambient: true,
  },
  {
    id: 'indigo',
    name: 'Midnight Sapphire',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#0b1024', '#6366f1', '#38bdf8'],
    previewBg: 'radial-gradient(circle at 22% 18%, rgba(99,102,241,0.58), transparent 56%), radial-gradient(circle at 84% 82%, rgba(56,189,248,0.44), #0b1024 78%)',
    previewCard: 'rgba(16, 22, 48, 0.86)',
    previewAccent: '#818cf8',
    ambient: true,
  },
  {
    id: 'lilac',
    name: 'Lavender Frost',
    tone: 'light',
    targetTheme: 'light',
    swatches: ['#fbf7ff', '#c4b5fd', '#5b3fd6'],
    previewBg: 'radial-gradient(at 18% 18%, #fbcfe8 0px, transparent 52%), radial-gradient(at 82% 8%, #fde68a 0px, transparent 48%), radial-gradient(at 12% 86%, #c4b5fd 0px, transparent 52%), #fbf7ff',
    previewCard: 'rgba(255, 252, 250, 0.9)',
    previewAccent: '#5b3fd6',
    ambient: true,
  },
  {
    id: 'lagoon',
    name: 'Abyssal Teal',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#061a1c', '#22d3ee', '#5eead4'],
    previewBg: 'radial-gradient(at 16% 14%, rgba(34,211,238,0.42) 0px, transparent 52%), radial-gradient(at 84% 18%, rgba(13,148,136,0.5) 0px, transparent 54%), radial-gradient(at 50% 92%, rgba(94,234,212,0.26) 0px, transparent 58%), #061a1c',
    previewCard: 'rgba(8, 34, 36, 0.88)',
    previewAccent: '#5eead4',
    ambient: true,
  },
  {
    id: 'sunset',
    name: 'Sunset Current',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#180d14', '#fb7185', '#f4d169'],
    previewBg: 'conic-gradient(from 205deg at 18% 12%, rgba(251,113,133,0.56), rgba(244,209,105,0.34) 82deg, rgba(24,13,20,0.92) 220deg), radial-gradient(54% 46% at 86% 88%, rgba(154,42,88,0.5), transparent 68%)',
    previewCard: 'rgba(38, 18, 27, 0.9)',
    previewAccent: '#ffb07a',
    ambient: true,
  },
  {
    id: 'sage',
    name: 'Verdant Glass',
    tone: 'light',
    targetTheme: 'light',
    swatches: ['#f2f5ec', '#b7c9a8', '#335941'],
    previewBg: 'radial-gradient(at 18% 20%, rgba(183,201,168,0.7) 0px, transparent 54%), radial-gradient(at 82% 12%, rgba(240,226,192,0.72) 0px, transparent 52%), radial-gradient(at 48% 90%, rgba(207,232,216,0.78) 0px, transparent 58%), #f2f5ec',
    previewCard: 'rgba(255, 255, 252, 0.9)',
    previewAccent: '#335941',
    ambient: true,
  },
];

const SECTIONS: Array<{ id: SectionId; label: string; icon: React.ReactNode; keywords: string }> = [
  {
    id: 'appearance',
    label: 'Giao diện & Nền',
    icon: <IconPalette size={15} aria-hidden="true" />,
    keywords: 'giao diện theme sáng tối hình nền preset aurora ember godray nebula sapphire cỡ chữ',
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: <IconLayoutTemplate size={15} aria-hidden="true" />,
    keywords: 'workspace khung nhìn kiểm định 6 lớp xuất mã phím tắt',
  },
  {
    id: 'ai',
    label: 'AI & BYOK',
    icon: <IconCpu size={15} aria-hidden="true" />,
    keywords: 'ai model gateway byok api key hạn mức',
  },
  {
    id: 'data',
    label: 'Dữ liệu & Sao lưu',
    icon: <IconDatabase size={15} aria-hidden="true" />,
    keywords: 'dữ liệu sao lưu json khôi phục đặt lại',
  },
];

const DENSITY_CHIPS = [
  { id: 'roomy', label: 'Rộng rãi' },
  { id: 'compact', label: 'Gọn' },
];

const VIEWPORT_CHIPS = [
  { id: '1440', label: '1440px' },
  { id: '768', label: '768px' },
  { id: '390', label: '390px' },
];

const EXPORT_TARGET_CHIPS = [
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'cursor', label: 'Cursor' },
];

const BYOK_MODE_CHIPS = [
  { id: 'shared', label: 'Gateway mặc định' },
  { id: 'byok', label: 'Khóa cá nhân' },
];

const PROTOCOL_LIST = [
  { id: 'openai-compatible', label: 'OpenAI Compatible', swatch: 'var(--accent, #2fb59a)' },
  { id: 'anthropic', label: 'Anthropic Messages', swatch: 'var(--fg-muted, #8a9a96)' },
  { id: 'gemini', label: 'Google Gemini', swatch: 'var(--harbour)' },
];

const MODEL_LIST = [
  { id: 'studio-smart-route', label: 'Studio Smart Route', swatch: 'var(--accent-deep, #1f8f7a)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', swatch: 'var(--harbour)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', swatch: 'var(--fg-muted, #8a9a96)' },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', swatch: 'var(--accent, #2fb59a)' },
  { id: 'gpt-4o', label: 'GPT-4o', swatch: 'var(--fg)' },
];

const SHORTCUTS = [
  { keys: 'Ctrl+E' },
  { keys: 'Esc' },
];

const UI_MODE_OPTIONS: Array<{
  id: UiMode;
  title: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'fabulous',
    title: 'Fabulous',
    icon: (
      <svg className="st-uimode-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M16 3L25.5 11.5L16 28.5L6.5 11.5L16 3Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 11.5H25.5M16 3L11.5 11.5L16 28.5L20.5 11.5L16 3Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="25.5" cy="5.5" r="1.4" fill="currentColor" />
        <path d="M5 5.5H8M6.5 4V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'balanced',
    title: 'Balanced',
    icon: (
      <svg className="st-uimode-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="12.5" cy="16" r="7.5" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="19.5" cy="16" r="7.5" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'eco',
    title: 'Eco',
    icon: (
      <svg className="st-uimode-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M25.5 6.5C15.5 6.5 8 11.8 8 20.5C8 22.8 8.8 24.7 10.1 26C11.5 26 13.6 25.3 15.6 23.6C21.5 18.6 24.9 13.4 25.5 6.5Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M7 26.5C11.2 22.2 15.8 17.5 21.5 12"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M11 16H14.2L15.6 13.5L17.4 18.2L18.9 16H21.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const THEME_PREF_CHIPS = [
  { id: 'system', label: 'Hệ thống' },
  { id: 'dark', label: 'Tối' },
  { id: 'light', label: 'Sáng' },
];

const THEME_EFFECT_OPTIONS = [
  { id: 'droplet', label: 'Giọt nước' },
  { id: 'rain', label: 'Mưa' },
  { id: 'diwali', label: 'Pháo hoa' },
  { id: 'none', label: 'Tắt' },
];

const UI_SCALE_KEY = 'fforum_v3_ui_scale';
const SCALE_OPTIONS = [90, 95, 100, 105, 110, 115];

function readInitialScale(): number {
  if (typeof window === 'undefined') return 100;
  try {
    const raw = Number(window.localStorage.getItem(UI_SCALE_KEY));
    if (Number.isFinite(raw) && raw >= 90 && raw <= 115) return raw;
  } catch {
    return 100;
  }
  return 100;
}

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    updateByok,
    theme,
    themeEffect,
    setThemeEffect,
    reducedMotion,
    setReducedMotion,
    savedItemIds,
    projects,
    navigate,
    addToast,
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<SectionId>('appearance');
  const [searchQuery, setSearchQuery] = useState('');
  const [dataFolderPos, setDataFolderPos] = useState<number>(1);
  const [uiScale, setUiScale] = useState<number>(() => readInitialScale());
  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupPayload | null>(null);
  const [importError, setImportError] = useState('');
  const baseId = useId();
  const idFor = (name: string) => `${baseId}-${name}`;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${uiScale}%`;
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(UI_SCALE_KEY, String(uiScale));
      } catch {
        return;
      }
    }
  }, [uiScale]);

  const byok = settings.byok;
  const currentUiMode: UiMode = settings.uiMode || 'balanced';
  const currentThemePref: ThemePreference = settings.themePreference || (theme === 'dark' ? 'dark' : 'light');
  const currentWallpaper: WallpaperPreset = PRESETS.some((p) => p.id === settings.wallpaperPreset)
    ? (settings.wallpaperPreset as WallpaperPreset)
    : 'dark';
  const ambientEnabled = settings.ambientVideo !== false;
  const autoRunChecks = settings.autoRunChecks !== false;
  const defaultViewport = String(settings.defaultViewport ?? 1440);

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SECTIONS;
    const matches = SECTIONS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.keywords.includes(q)
    );
    return matches.length > 0 ? matches : SECTIONS;
  }, [searchQuery]);

  const applyThemePref = (pref: ThemePreference) => {
    const nextTheme =
      pref === 'system'
        ? typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : pref;
    if (nextTheme !== theme) {
      const originEl =
        typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      updateSettings({ themePreference: pref });
      triggerPinuiThemeToggle(originEl);
      return;
    }
    updateSettings({
      themePreference: pref,
      theme: nextTheme,
    });
  };

  const applyPreset = (preset: PresetDefinition, sourceEl?: HTMLElement | null) => {
    const nextPref = preset.targetTheme || 'system';
    const nextTheme =
      nextPref === 'system'
        ? typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : nextPref;
    updateSettings({
      wallpaperPreset: preset.id,
      themePreference: nextPref,
      ambientVideo: preset.ambient,
      ...(nextTheme === theme ? { theme: nextTheme } : {}),
    });
    if (nextTheme !== theme) {
      triggerPinuiThemeToggle(sourceEl);
    }
  };

  const handleExportDownload = useCallback(() => {
    downloadBackup(buildBackup(settings, projects, savedItemIds));
    addToast({
      type: 'success',
      title: 'Đã tải bản sao lưu JSON',
      message: 'Tệp không chứa khóa API cá nhân.',
    });
  }, [settings, projects, savedItemIds, addToast]);

  const handleCopyJson = useCallback(async () => {
    const json = JSON.stringify(buildBackup(settings, projects, savedItemIds), null, 2);
    try {
      await navigator.clipboard.writeText(json);
      addToast({
        type: 'success',
        title: 'Đã sao chép JSON',
        message: `${projects.length} dự án · ${savedItemIds.length} mục đã lưu.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Không thể ghi clipboard',
        message: 'Hãy dùng nút Tải JSON.',
      });
    }
  }, [settings, projects, savedItemIds, addToast]);

  const archiveFolders = useMemo(
    () => [
      {
        pos: 1,
        label: 'Dự án Workspace',
        actionLabel: 'Mở Workspace',
        run: () => navigate('workspace'),
      },
      {
        pos: 2,
        label: 'Mục đã lưu',
        actionLabel: 'Xem trong Hồ sơ',
        run: () => navigate('profile'),
      },
      {
        pos: 3,
        label: 'Tải sao lưu JSON',
        actionLabel: 'Tải JSON',
        run: handleExportDownload,
      },
      {
        pos: 4,
        label: 'Sao chép JSON',
        actionLabel: 'Chép JSON',
        run: () => void handleCopyJson(),
      },
      {
        pos: 5,
        label: 'Đặt lại dữ liệu',
        actionLabel: 'Đặt lại dữ liệu',
        danger: true,
        run: () => setConfirmReset(true),
      },
    ],
    [navigate, handleExportDownload, handleCopyJson]
  );

  const activeArchiveFolder = archiveFolders[Math.max(0, Math.min(4, dataFolderPos - 1))];

  const handleFilesDropped = (files: DroppedFilePayload[]) => {
    const first = files[0];
    if (!first) return;
    const parsed = parseBackup(first.content);
    if (!parsed) {
      setImportError('Tệp JSON không hợp lệ.');
      return;
    }
    setImportError('');
    setPendingBackup(parsed);
  };

  const handleConfirmImport = () => {
    if (!pendingBackup) return;
    if (!applyBackup(pendingBackup)) {
      setPendingBackup(null);
      setImportError('Không thể khôi phục dữ liệu.');
      return;
    }
    window.location.reload();
  };

  const handleResetLocalData = () => {
    clearLocalData();
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = '100%';
    }
    setConfirmReset(false);
    addToast({
      type: 'warning',
      title: 'Đã đặt lại dữ liệu cục bộ',
      message: 'Trang sẽ tự nạp lại.',
    });
    window.setTimeout(() => {
      window.location.reload();
    }, 450);
  };

  return (
    <div className="st" data-density={settings.compactDensity ? 'compact' : 'roomy'}>
      <div className="st-shell">
        <aside className="st-sidebar" aria-label="Danh mục cài đặt">
          <div className="st-sidebar-head">
            <h1 className="st-sidebar-title">Cài đặt</h1>
            <SearchCard
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm cài đặt..."
              compact
              className="st-pinui-search"
            />
          </div>

          <nav className="st-nav" aria-label="Nhóm cài đặt">
            {filteredSections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className="st-nav-item"
                aria-current={activeSection === sec.id ? 'page' : undefined}
                onClick={() => setActiveSection(sec.id)}
              >
                {sec.icon}
                <span>{sec.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="st-main">
          {activeSection === 'appearance' && (
            <div className="st-stack">
              <header className="st-section-head">
                <h2 className="st-section-title">Giao diện &amp; Hình nền</h2>
              </header>

              <section className="st-panel" aria-label="Chế độ giao diện">
                <div className="st-panel-label">
                  <span>Chế độ giao diện</span>
                </div>
                <div className="st-uimode-grid" role="radiogroup" aria-label="Chọn chế độ giao diện">
                  {UI_MODE_OPTIONS.map((opt) => {
                    const selected = currentUiMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className="st-uimode-card"
                        data-mode={opt.id}
                        onClick={() => {
                          updateSettings({ uiMode: opt.id });
                          addToast({
                            type: 'info',
                            title: opt.title,
                          });
                        }}
                      >
                        <span className="st-uimode-icon">{opt.icon}</span>
                        <strong className="st-uimode-title">{opt.title}</strong>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="st-panel" aria-label="Kích thước giao diện">
                <div className="st-panel-label">
                  <span>Kích thước giao diện</span>
                  {uiScale !== 100 && (
                    <button
                      type="button"
                      className="st-link-reset"
                      onClick={() => setUiScale(100)}
                    >
                      Đặt lại 100%
                    </button>
                  )}
                </div>
                <div className="st-size-seg" role="radiogroup" aria-label="Chọn tỷ lệ cỡ chữ">
                  {SCALE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      role="radio"
                      aria-checked={uiScale === size}
                      className="st-size-btn"
                      onClick={() => setUiScale(size)}
                    >
                      {size}%
                    </button>
                  ))}
                </div>
              </section>

              <section className="st-card" aria-label="Chủ đề Sáng Tối và hình nền">
                <div className="st-row st-row--first">
                  <span className="st-label">Chế độ Sáng / Tối</span>
                  <Chips
                    items={THEME_PREF_CHIPS}
                    selectedIds={[currentThemePref]}
                    multi={false}
                    theme={theme}
                    onToggle={(id) => applyThemePref(id as ThemePreference)}
                  />
                </div>

                <div className="st-row">
                  <div className="st-effect-copy">
                    <span className="st-label">Hiệu ứng chuyển</span>
                    <p className="st-effect-hint">
                      Hiệu ứng PinUI áp dụng cho toàn trang khi đổi sáng / tối.
                    </p>
                  </div>
                  <Chips
                    items={THEME_EFFECT_OPTIONS}
                    selectedIds={[themeEffect]}
                    multi={false}
                    theme={theme}
                    onToggle={(id) => setThemeEffect(id as ThemeEffect)}
                  />
                </div>

                <div className="st-presets-block" aria-label="Mẫu hình nền">
                  <span className="st-label">Mẫu hình nền</span>
                  <div className="st-presets-grid">
                    {PRESETS.map((preset) => {
                      const selected = preset.id === currentWallpaper;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          className="st-preset-item"
                          aria-pressed={selected}
                          onClick={(e) => applyPreset(preset, e.currentTarget)}
                        >
                          <div
                            className="st-preset-thumb"
                            style={{ background: preset.previewBg }}
                            aria-hidden="true"
                          >
                            {preset.id === 'auto' ? (
                              <div className="st-mini-auto">
                                <IconSun size={16} className="st-mini-auto-sun" />
                                <IconMoon size={16} className="st-mini-auto-moon" />
                              </div>
                            ) : (
                              <div className="st-mini-ui">
                                <div className="st-mini-rail">
                                  <span style={{ background: preset.previewAccent }} />
                                  <span />
                                  <span />
                                </div>
                                <div className="st-mini-canvas" style={{ background: preset.previewCard }}>
                                  <div className="st-mini-line st-mini-line--lg" />
                                  <div className="st-mini-line st-mini-line--sm" />
                                  <div className="st-mini-cta" style={{ background: preset.previewAccent }} />
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="st-preset-name">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="st-grid-2">
                  <div className="st-toggleCard">
                    <span className="st-label">Nền động mượt</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={ambientEnabled}
                      aria-label="Nền động mượt"
                      className="st-switch"
                      onClick={() => updateSettings({ ambientVideo: !ambientEnabled })}
                    >
                      <span className="st-switchThumb" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="st-toggleCard">
                    <span className="st-label">Tiết kiệm chuyển động</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={reducedMotion}
                      aria-label="Tiết kiệm chuyển động"
                      className="st-switch"
                      onClick={() => setReducedMotion(!reducedMotion)}
                    >
                      <span className="st-switchThumb" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="st-row">
                  <span className="st-label">Mật độ bố cục</span>
                  <Chips
                    items={DENSITY_CHIPS}
                    selectedIds={[settings.compactDensity ? 'compact' : 'roomy']}
                    multi={false}
                    itemRole="button"
                    theme={theme}
                    onToggle={(id) => updateSettings({ compactDensity: id === 'compact' })}
                  />
                </div>
              </section>
            </div>
          )}

          {activeSection === 'workspace' && (
            <section id="st-workspace" className="st-card" aria-labelledby={idFor('workspace')}>
              <div className="st-cardHead">
                <h2 className="st-cardTitle" id={idFor('workspace')}>
                  Workspace
                </h2>
              </div>

              <div className="st-row st-row--first">
                <span className="st-label">Khung nhìn mặc định</span>
                <Chips
                  items={VIEWPORT_CHIPS}
                  selectedIds={[defaultViewport]}
                  multi={false}
                  theme={theme}
                  onToggle={(id) =>
                    updateSettings({ defaultViewport: Number(id) as 1440 | 768 | 390 })
                  }
                />
              </div>

              <div className="st-row">
                <span className="st-label">Tự chạy kiểm định 6 lớp</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoRunChecks}
                  aria-label="Tự chạy kiểm định 6 lớp"
                  className="st-switch"
                  onClick={() => updateSettings({ autoRunChecks: !autoRunChecks })}
                >
                  <span className="st-switchThumb" aria-hidden="true" />
                </button>
              </div>

              <div className="st-row">
                <span className="st-label">Mục tiêu xuất mã</span>
                <Chips
                  items={EXPORT_TARGET_CHIPS}
                  selectedIds={[settings.defaultExportTarget]}
                  multi={false}
                  theme={theme}
                  onToggle={(id) => updateSettings({ defaultExportTarget: id as ProjectSetupTarget })}
                />
              </div>

              <div className="st-row">
                <span className="st-label">Phím tắt</span>
                <ul className="st-shortcuts">
                  {SHORTCUTS.map((item) => (
                    <li key={item.keys} className="st-shortcutItem">
                      <kbd className="st-kbd">{item.keys}</kbd>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {activeSection === 'ai' && (
            <section id="st-ai" className="st-card" aria-labelledby={idFor('ai')}>
              <div className="st-cardHead">
                <h2 className="st-cardTitle" id={idFor('ai')}>
                  AI &amp; BYOK
                </h2>
              </div>

              <div className="st-row st-row--first">
                <span className="st-label">Nguồn kết nối</span>
                <Chips
                  items={BYOK_MODE_CHIPS}
                  selectedIds={[byok.enabled ? 'byok' : 'shared']}
                  multi={false}
                  theme={theme}
                  onToggle={(id) => updateByok({ enabled: id === 'byok' })}
                />
              </div>

              <div className="st-grid-2">
                <div className="st-block">
                  <span className="st-label">Giao thức</span>
                  <SelectionList
                    items={PROTOCOL_LIST}
                    selectedId={byok.protocol}
                    onSelect={(id) => updateByok({ protocol: id as AIProtocol })}
                    ariaLabel="Chọn giao thức AI"
                  />
                </div>

                <div className="st-block">
                  <span className="st-label">Mô hình</span>
                  <SelectionList
                    items={MODEL_LIST}
                    selectedId={
                      MODEL_LIST.some((m) => m.id === byok.model) ? byok.model : 'studio-smart-route'
                    }
                    onSelect={(id) => updateByok({ model: id })}
                    ariaLabel="Chọn mô hình ưu tiên"
                  />
                </div>
              </div>

              {byok.enabled && (
                <div className="st-grid-2">
                  <label className="st-block" htmlFor={idFor('model')}>
                    <span className="st-label">Tên mô hình</span>
                    <input
                      id={idFor('model')}
                      type="text"
                      className="field st-mono"
                      value={byok.model}
                      spellCheck={false}
                      onChange={(e) => updateByok({ model: e.target.value })}
                    />
                  </label>

                  <label className="st-block" htmlFor={idFor('url')}>
                    <span className="st-label">Base URL</span>
                    <input
                      id={idFor('url')}
                      type="url"
                      className="field st-mono"
                      value={byok.baseUrl}
                      spellCheck={false}
                      onChange={(e) => updateByok({ baseUrl: e.target.value })}
                    />
                  </label>

                  <div className="st-block st-span2">
                    <label className="st-label" htmlFor={idFor('key')}>
                      Khóa API
                    </label>
                    <div className="st-secret">
                      <input
                        id={idFor('key')}
                        type={showApiKey ? 'text' : 'password'}
                        className="field st-mono"
                        value={byok.apiKey}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="sk-..."
                        onChange={(e) => updateByok({ apiKey: e.target.value })}
                      />
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={showApiKey ? 'Ẩn khóa API' : 'Hiện khóa API'}
                        aria-pressed={showApiKey}
                        onClick={() => setShowApiKey((v) => !v)}
                      >
                        {showApiKey ? <IconEyeOff size={18} aria-hidden="true" /> : <IconEye size={18} aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === 'data' && (
            <section id="st-data" className="st-card" aria-labelledby={idFor('data')}>
              <div className="st-cardHead">
                <h2 className="st-cardTitle" id={idFor('data')}>
                  Dữ liệu &amp; Sao lưu
                </h2>
              </div>

              <div className="st-archive-split">
                <div className="st-archive-box">
                  <OriginalFileBox
                    theme={theme}
                    onPull={({ position }) => setDataFolderPos(position)}
                  />
                </div>

                <div className="st-archive-detail">
                  <div className="st-archive-pills" role="tablist" aria-label="Ngăn lưu trữ">
                    {archiveFolders.map((item) => (
                      <button
                        key={item.pos}
                        type="button"
                        role="tab"
                        aria-selected={dataFolderPos === item.pos}
                        className="st-filter-btn"
                        onClick={() => setDataFolderPos(item.pos)}
                      >
                        Ngăn {item.pos}
                      </button>
                    ))}
                  </div>

                  <div className="st-archive-panel">
                    <h3>{activeArchiveFolder.label}</h3>
                    <div className="st-exportActions">
                      <button
                        type="button"
                        className={`btn btn-sm ${activeArchiveFolder.danger ? 'btn-red' : 'btn-solid'}`}
                        onClick={activeArchiveFolder.run}
                      >
                        {activeArchiveFolder.actionLabel}
                      </button>
                      <button type="button" className="btn btn-line btn-sm" onClick={handleExportDownload}>
                        Tải JSON
                      </button>
                      <button type="button" className="btn btn-line btn-sm" onClick={() => void handleCopyJson()}>
                        Chép JSON
                      </button>
                    </div>
                  </div>

                  <div className="st-block">
                    <span className="st-label">Khôi phục JSON</span>
                    <DynamicDropZone
                      label="Chọn hoặc thả tệp JSON"
                      hintText=""
                      accept=".json,application/json"
                      multiple={false}
                      onFilesAdded={handleFilesDropped}
                    />
                    {importError && (
                      <p className="st-error" role="alert">
                        {importError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      <Modal
        open={pendingBackup !== null}
        onClose={() => setPendingBackup(null)}
        label="Xác nhận khôi phục dữ liệu"
        className="st-dialog"
      >
        <div className="st-dialog-body">
          <h2>Khôi phục bản sao lưu?</h2>
          <p>
            <strong className="st-mono">{pendingBackup?.projects.length}</strong> dự án và{' '}
            <strong className="st-mono">{pendingBackup?.savedItemIds.length}</strong> mục đã lưu sẽ thay thế dữ liệu hiện tại.
          </p>
          <div className="st-dialog-actions">
            <button type="button" className="btn btn-line btn-sm" onClick={() => setPendingBackup(null)}>
              Hủy
            </button>
            <button type="button" className="btn btn-solid btn-sm" onClick={handleConfirmImport}>
              Xác nhận
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        label="Xác nhận đặt lại dữ liệu"
        className="st-dialog"
      >
        <div className="st-dialog-body">
          <h2>Đặt lại toàn bộ dữ liệu?</h2>
          <div className="st-dialog-actions">
            <button type="button" className="btn btn-line btn-sm" onClick={() => setConfirmReset(false)}>
              Hủy
            </button>
            <button type="button" className="btn btn-red btn-sm" onClick={handleResetLocalData}>
              Xác nhận đặt lại
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsView;
