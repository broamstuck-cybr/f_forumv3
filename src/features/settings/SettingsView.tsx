import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  Cpu,
  Database,
  Eye,
  EyeOff,
  LayoutTemplate,
  Moon,
  Palette,
  Search,
  Sun,
} from 'lucide-react';
import OriginalThemeSwitch from '../../components/pinui/original/theme-switch/ThemeSwitch';
import OriginalFileBox from '../../components/pinui/original/file-box/FileBox';
import type {
  AIProtocol,
  ProjectSetupTarget,
  ThemeEffect,
  ThemePreference,
  WallpaperPreset,
} from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  Chips,
  DynamicDropZone,
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
type PresetFilter = 'all' | 'dark' | 'light';

interface PresetDefinition {
  id: WallpaperPreset;
  name: string;
  desc: string;
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
    id: 'video',
    name: 'Gradient Video (Mặc định)',
    desc: 'Video Gradient Lab lặp mượt Crossfade (Light 001 / Dark 002) với lớp phủ trong trẻo giảm 10% độ tối.',
    tone: 'auto',
    targetTheme: 'system',
    swatches: ['#141312', '#d63a27', '#f5f1e8'],
    previewBg: 'radial-gradient(circle at 24% 22%, rgba(214,58,39,0.58), transparent 56%), radial-gradient(circle at 78% 76%, rgba(125,163,187,0.52), #121110 78%)',
    previewCard: 'rgba(26, 24, 22, 0.82)',
    previewAccent: '#e04430',
    ambient: true,
  },
  {
    id: 'godray-amber',
    name: 'Godray Hoàng Kim',
    desc: 'Luồng sáng Godray hổ phách rọi từ đỉnh màn hình, ấm áp và giàu chiều sâu studio.',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#16120e', '#f97316', '#fbbf24'],
    previewBg: 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(249,115,22,0.52), transparent 70%), conic-gradient(from 220deg at 50% 0%, #14110f 0deg, rgba(251,191,36,0.34) 40deg, #12100f 90deg)',
    previewCard: 'rgba(30, 22, 16, 0.86)',
    previewAccent: '#f97316',
    ambient: true,
  },
  {
    id: 'godray-prism',
    name: 'Godray Lăng Kính',
    desc: 'Dải quang phổ tán sắc cyan, magenta và chàm dịu mắt theo cảm hứng lăng kính quang học.',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#0c1018', '#06b6d4', '#ec4899'],
    previewBg: 'conic-gradient(from 180deg at 22% 0%, rgba(6,182,212,0.5) 0deg, rgba(236,72,153,0.44) 55deg, #0c1018 125deg)',
    previewCard: 'rgba(18, 22, 34, 0.86)',
    previewAccent: '#06b6d4',
    ambient: true,
  },
  {
    id: 'mesh-aurora',
    name: 'Mesh Cực Quang',
    desc: 'Lưới cực quang ngọc lục bảo, lam và tím trầm chuyển động mượt theo con trỏ chuột.',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#0b1312', '#10b981', '#3b82f6'],
    previewBg: 'radial-gradient(circle at 20% 22%, rgba(16,185,129,0.55), transparent 55%), radial-gradient(circle at 82% 72%, rgba(59,130,246,0.52), #0b1312 78%)',
    previewCard: 'rgba(16, 28, 26, 0.84)',
    previewAccent: '#10b981',
    ambient: true,
  },
  {
    id: 'silk-twilight',
    name: 'Lụa Hoàng Hôn',
    desc: 'Chuyển sắc lụa hoàng hôn mịn không gãy tầng giữa sắc chàm sâu và hồng lựu.',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#15132b', '#e11d48', '#4f46e5'],
    previewBg: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%), radial-gradient(circle at 42% 40%, rgba(225,29,72,0.45), transparent 62%)',
    previewCard: 'rgba(24, 22, 46, 0.86)',
    previewAccent: '#e11d48',
    ambient: true,
  },
  {
    id: 'constellation',
    name: 'Tinh Vân Thiên Hà',
    desc: 'Chòm sao hạt tương tác theo vị trí trỏ chuột trên nền tinh vân đêm sâu.',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#0f1218', '#f2c05e', '#38bdf8'],
    previewBg: 'radial-gradient(circle at 50% 100%, rgba(88,28,135,0.55), transparent 65%), radial-gradient(circle at 20% 20%, rgba(30,58,138,0.55), #0c1018 75%)',
    previewCard: 'rgba(18, 22, 34, 0.84)',
    previewAccent: '#f2c05e',
    ambient: true,
  },
  {
    id: 'obsidian-glass',
    name: 'Kính Obsidian Tối Giản',
    desc: 'Nền đen carbon nguyên chất với ánh phản chiếu mép gương bạc tối đa độ tập trung.',
    tone: 'dark',
    targetTheme: 'dark',
    swatches: ['#111010', '#2b2928', '#f8f4ec'],
    previewBg: 'radial-gradient(circle at 50% -15%, rgba(255,255,255,0.2), transparent 65%), #111010',
    previewCard: 'rgba(28, 26, 25, 0.92)',
    previewAccent: '#f8f4ec',
    ambient: true,
  },
  {
    id: 'paper-warm',
    name: 'Giấy Ấm Editorial',
    desc: 'Nền giấy thủ công sắc kem cát điểm ánh hổ phách nhẹ, đọc tài liệu và code lâu không mỏi mắt.',
    tone: 'light',
    targetTheme: 'light',
    swatches: ['#f5f1e8', '#c42a18', '#14120e'],
    previewBg: 'radial-gradient(circle at 14% 14%, rgba(245,158,11,0.28), transparent 58%), radial-gradient(circle at 86% 86%, rgba(180,83,9,0.2), #f5f1e8 76%)',
    previewCard: 'rgba(255, 253, 248, 0.94)',
    previewAccent: '#c42a18',
    ambient: true,
  },
];

const SECTIONS: Array<{ id: SectionId; label: string; icon: React.ReactNode; keywords: string }> = [
  {
    id: 'appearance',
    label: 'Giao diện & Nền',
    icon: <Palette size={15} aria-hidden="true" />,
    keywords: 'giao diện theme sáng tối hình nền preset aurora ember cỡ chữ hiệu ứng giọt nước mưa',
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: <LayoutTemplate size={15} aria-hidden="true" />,
    keywords: 'workspace khung nhìn kiểm định 6 lớp xuất mã phím tắt',
  },
  {
    id: 'ai',
    label: 'AI & BYOK',
    icon: <Cpu size={15} aria-hidden="true" />,
    keywords: 'ai model gateway byok api key hạn mức',
  },
  {
    id: 'data',
    label: 'Dữ liệu & Sao lưu',
    icon: <Database size={15} aria-hidden="true" />,
    keywords: 'dữ liệu sao lưu json khôi phục đặt lại',
  },
];

const EFFECT_CHIPS = [
  { id: 'droplet', label: 'Giọt nước (Droplet)' },
  { id: 'rain', label: 'Mưa rơi (Rain)' },
  { id: 'diwali', label: 'Ánh sáng (Diwali)' },
  { id: 'none', label: 'Tắt hiệu ứng' },
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
  { id: 'byok', label: 'Khóa cá nhân (BYOK)' },
];

const PROTOCOL_LIST = [
  { id: 'openai-compatible', label: 'OpenAI Compatible', swatch: 'var(--red)' },
  { id: 'anthropic', label: 'Anthropic Messages', swatch: 'var(--amber)' },
  { id: 'gemini', label: 'Google Gemini', swatch: 'var(--harbour)' },
];

const MODEL_LIST = [
  { id: 'studio-smart-route', label: 'Studio Smart Route (Khuyên dùng)', swatch: 'var(--green)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', swatch: 'var(--harbour)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', swatch: 'var(--amber)' },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', swatch: 'var(--red)' },
  { id: 'gpt-4o', label: 'GPT-4o', swatch: 'var(--fg)' },
];

const SHORTCUTS = [
  { keys: 'Ctrl+E', desc: 'Mở bảng điều khiển nhanh' },
  { keys: 'Esc', desc: 'Đóng hộp thoại hoặc menu' },
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
    quota,
    settings,
    updateSettings,
    updateByok,
    theme,
    setTheme,
    reducedMotion,
    setReducedMotion,
    savedItemIds,
    projects,
    navigate,
    addToast,
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<SectionId>('appearance');
  const [searchQuery, setSearchQuery] = useState('');
  const [presetFilter, setPresetFilter] = useState<PresetFilter>('all');
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
  const currentWallpaper: WallpaperPreset = settings.wallpaperPreset || 'video';
  const currentEffect: ThemeEffect = settings.themeEffect || 'droplet';
  const ambientEnabled = settings.ambientVideo !== false;
  const autoRunChecks = settings.autoRunChecks !== false;
  const defaultViewport = String(settings.defaultViewport ?? 1440);
  const quotaLimit = quota.limit;
  const quotaText = quota.unlimited
    ? 'Không giới hạn'
    : quotaLimit === null
      ? `Đã dùng ${quota.used}`
      : `Còn ${quota.remaining ?? Math.max(0, quotaLimit - quota.used)}/${quotaLimit}`;

  const activePreset = useMemo(
    () => PRESETS.find((p) => p.id === currentWallpaper) || PRESETS[0],
    [currentWallpaper]
  );

  const visiblePresets = useMemo(() => {
    if (presetFilter === 'all') return PRESETS;
    return PRESETS.filter((p) => p.tone === presetFilter || p.tone === 'auto');
  }, [presetFilter]);

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SECTIONS;
    const matches = SECTIONS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.keywords.includes(q)
    );
    return matches.length > 0 ? matches : SECTIONS;
  }, [searchQuery]);

  const applyPreset = (preset: PresetDefinition) => {
    const nextPref = preset.targetTheme || 'system';
    updateSettings({
      wallpaperPreset: preset.id,
      themePreference: nextPref,
      ambientVideo: preset.ambient,
    });
    addToast({
      type: 'info',
      title: `Đã đổi hình nền: ${preset.name}`,
      message: preset.desc,
    });
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
        label: 'Ngăn 1 · Dự án Workspace',
        summary: `${projects.length} dự án đang lưu cục bộ trên trình duyệt.`,
        actionLabel: 'Mở Workspace',
        run: () => navigate('workspace'),
      },
      {
        pos: 2,
        label: 'Ngăn 2 · Mục đã lưu',
        summary: `${savedItemIds.length} thành phần & mẫu được đánh dấu bookmark.`,
        actionLabel: 'Xem trong Hồ sơ',
        run: () => navigate('profile'),
      },
      {
        pos: 3,
        label: 'Ngăn 3 · Xuất tệp sao lưu JSON',
        summary: 'Đóng gói dự án, thiết lập giao diện và bookmark (không chứa API key).',
        actionLabel: 'Tải JSON',
        run: handleExportDownload,
      },
      {
        pos: 4,
        label: 'Ngăn 4 · Sao chép JSON nhanh',
        summary: 'Chép toàn bộ bản sao lưu cấu hình vào clipboard chỉ với một lần bấm.',
        actionLabel: 'Chép JSON',
        run: () => void handleCopyJson(),
      },
      {
        pos: 5,
        label: 'Ngăn 5 · Khôi phục / Đặt lại mặc định',
        summary: 'Xóa dữ liệu cục bộ để đưa Workspace và Cài đặt về trạng thái sạch.',
        actionLabel: 'Đặt lại dữ liệu',
        danger: true,
        run: () => setConfirmReset(true),
      },
    ],
    [projects.length, savedItemIds.length, navigate, handleExportDownload, handleCopyJson]
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
            <div className="st-search-box">
              <Search size={14} aria-hidden="true" />
              <input
                type="search"
                className="st-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm cài đặt..."
                aria-label="Tìm cài đặt"
              />
            </div>
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
                <div>
                  <h2 className="st-section-title">Giao diện & Hình nền</h2>
                  <p className="st-hint">Chọn sắc độ, kích thước hiển thị và hiệu ứng chuyển Sáng / Tối toàn trang.</p>
                </div>
              </header>

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

              <section className="st-panel st-active-preset" aria-label="Hình nền đang sử dụng">
                <div
                  className="st-preset-thumb st-preset-thumb--hero"
                  style={{ background: activePreset.previewBg }}
                  aria-hidden="true"
                >
                  <div className="st-mini-ui">
                    <div className="st-mini-rail">
                      <span style={{ background: activePreset.previewAccent }} />
                      <span />
                      <span />
                    </div>
                    <div className="st-mini-canvas" style={{ background: activePreset.previewCard }}>
                      <div className="st-mini-line st-mini-line--lg" />
                      <div className="st-mini-line st-mini-line--sm" />
                      <div className="st-mini-cta" style={{ background: activePreset.previewAccent }} />
                    </div>
                  </div>
                </div>

                <div className="st-active-info">
                  <div className="st-active-title-row">
                    <h3>{activePreset.name}</h3>
                    <span className="tag">{theme === 'dark' ? 'Nền tối' : 'Nền sáng'}</span>
                  </div>
                  <p className="st-hint">{activePreset.desc}</p>
                  <div className="st-swatches" aria-label="Bảng màu preset">
                    {activePreset.swatches.map((hex) => (
                      <span
                        key={hex}
                        className="st-swatch"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>
              </section>

              <section className="st-presets-block" aria-label="Thư viện hình nền">
                <div className="st-presets-bar">
                  <span className="st-panel-label">
                    <Palette size={15} aria-hidden="true" />
                    <span>Chọn mẫu hình nền (Preset)</span>
                  </span>
                  <div className="st-filter-pills" role="group" aria-label="Lọc theo sắc độ">
                    {(
                      [
                        { id: 'all', label: 'Tất cả' },
                        { id: 'dark', label: 'Tối' },
                        { id: 'light', label: 'Sáng' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className="st-filter-btn"
                        aria-pressed={presetFilter === f.id}
                        onClick={() => setPresetFilter(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="st-presets-grid">
                  {visiblePresets.map((preset) => {
                    const selected = preset.id === currentWallpaper;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className="st-preset-item"
                        aria-pressed={selected}
                        onClick={() => applyPreset(preset)}
                      >
                        <div
                          className="st-preset-thumb"
                          style={{ background: preset.previewBg }}
                          aria-hidden="true"
                        >
                          {preset.id === 'video' ? (
                            <div className="st-mini-auto">
                              <Sun size={16} className="st-mini-auto-sun" />
                              <Moon size={16} className="st-mini-auto-moon" />
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
              </section>

              <section className="st-card" aria-label="Hiệu ứng chuyển đổi và chuyển động">
                <div className="st-row st-row--first">
                  <div>
                    <span className="st-label">Hiệu ứng chuyển Sáng / Tối toàn trang</span>
                    <p className="st-hint">Chế độ chọn bên dưới đồng bộ trực tiếp với nút Đêm / Ngày trên thanh điều hướng.</p>
                  </div>
                  <Chips
                    items={EFFECT_CHIPS}
                    selectedIds={[currentEffect]}
                    multi={false}
                    theme={theme}
                    onToggle={(id) => updateSettings({ themeEffect: id as ThemeEffect })}
                  />
                </div>

                <div className="st-pinui-theme-stage" aria-label="Thử trực tiếp hiệu ứng chuyển Sáng Tối">
                  <OriginalThemeSwitch
                    key={currentEffect}
                    theme={theme}
                    defaultEffect={currentEffect === 'none' ? 'droplet' : currentEffect}
                    sound={!reducedMotion}
                    onEffectChange={(nextEffect) => updateSettings({ themeEffect: nextEffect })}
                    onThemeChange={(nextTheme) => setTheme(nextTheme)}
                  />
                </div>

                <div className="st-grid-2">
                  <div className="st-toggleCard">
                    <span className="st-label">Nền động mượt (Crossfade Loop)</span>
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
                  Workspace & Vibe Coder
                </h2>
                <span className="tag st-mono">{defaultViewport}px</span>
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
                      <span>{item.desc}</span>
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
                  AI Gateway & BYOK
                </h2>
                <span className={`tag ${!quota.unlimited && quota.exhausted ? 'tag-red' : 'tag-green'}`}>
                  {quotaText}
                </span>
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
                    <span className="st-label">Tên mô hình tùy chỉnh</span>
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
                      Khóa API cá nhân
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
                        title={showApiKey ? 'Ẩn khóa API' : 'Hiện khóa API'}
                        aria-pressed={showApiKey}
                        onClick={() => setShowApiKey((v) => !v)}
                      >
                        {showApiKey ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                      </button>
                    </div>
                    {!byok.apiKey.trim() && (
                      <p className="st-note">Chưa có khóa API, hệ thống dùng Gateway mặc định nếu còn lượt.</p>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === 'data' && (
            <section id="st-data" className="st-card" aria-labelledby={idFor('data')}>
              <div className="st-cardHead">
                <h2 className="st-cardTitle" id={idFor('data')}>
                  Kho lưu trữ &amp; Sao lưu cục bộ
                </h2>
                <span className="tag st-mono">
                  {projects.length} dự án · {savedItemIds.length} mục
                </span>
              </div>

              <div className="st-archive-split">
                <div className="st-archive-box">
                  <OriginalFileBox
                    theme={theme}
                    onPull={({ position }) => setDataFolderPos(position)}
                  />
                  <span className="st-archive-cap">Kéo từng ngăn màu để mở nhanh dữ liệu lưu trữ</span>
                </div>

                <div className="st-archive-detail">
                  <div className="st-archive-pills" role="tablist" aria-label="5 ngăn lưu trữ cục bộ">
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
                    <p className="st-hint">{activeArchiveFolder.summary}</p>
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
                    <span className="st-label">Khôi phục từ tệp JSON</span>
                    <DynamicDropZone
                      label="Kéo thả tệp JSON sao lưu vào đây"
                      hintText="Định dạng .json · Chỉ khôi phục cấu hình & dự án cục bộ"
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
          <p>Toàn bộ dự án, mục đã lưu và thiết lập cục bộ sẽ bị xóa.</p>
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
