import React, { useEffect, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { AIProtocol, ProjectSetupTarget, ThemePreference } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  Chips,
  DynamicDropZone,
  FileBox,
  SelectionList,
  type DroppedFilePayload,
  type FileBoxTab,
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

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'appearance', label: 'Giao diện' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'ai', label: 'AI & BYOK' },
  { id: 'data', label: 'Dữ liệu' },
];

const THEME_CHIPS = [
  { id: 'system', label: 'Theo hệ thống' },
  { id: 'light', label: 'Sáng (Ban ngày)' },
  { id: 'dark', label: 'Tối (Ban đêm)' },
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
    reducedMotion,
    setReducedMotion,
    savedItemIds,
    projects,
    navigate,
    addToast,
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<SectionId>('appearance');
  const [selectedDataCard, setSelectedDataCard] = useState<string>('projects');
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
  const themePreference: ThemePreference = settings.themePreference ?? 'system';
  const ambientEnabled = settings.ambientVideo !== false;
  const autoRunChecks = settings.autoRunChecks !== false;
  const defaultViewport = String(settings.defaultViewport ?? 1440);
  const quotaLimit = quota.limit;
  const quotaText = quota.unlimited
    ? 'Không giới hạn'
    : quotaLimit === null
      ? `Đã dùng ${quota.used}`
      : `Còn ${quota.remaining ?? Math.max(0, quotaLimit - quota.used)}/${quotaLimit}`;

  const dataTabs: FileBoxTab[] = [
    {
      id: 'projects',
      label: 'Dự án Workspace',
      meta: `${projects.length} dự án cục bộ`,
      onOpen: () => navigate('workspace'),
    },
    {
      id: 'saved',
      label: 'Mục đã lưu',
      meta: `${savedItemIds.length} mục đánh dấu`,
      onOpen: () => navigate('profile'),
    },
  ];

  const jumpToSection = (id: SectionId) => {
    setActiveSection(id);
    const el = document.getElementById(`st-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const handleExportDownload = () => {
    downloadBackup(buildBackup(settings, projects, savedItemIds));
    addToast({
      type: 'success',
      title: 'Đã tải bản sao lưu JSON',
      message: 'Tệp không chứa khóa API cá nhân.',
    });
  };

  const handleCopyJson = async () => {
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
  };

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
      <div className="st-wrap">
        <header className="st-head">
          <div className="st-headMain">
            <span className="t-label">cấu hình hệ thống</span>
            <h1 className="t-title">Cài đặt</h1>
          </div>
          <nav className="st-pills" aria-label="Nhóm cài đặt">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className="st-pill"
                aria-current={activeSection === sec.id ? 'true' : undefined}
                onClick={() => jumpToSection(sec.id)}
              >
                {sec.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="st-stack">
          <section id="st-appearance" className="st-card" aria-labelledby={idFor('appearance')}>
            <div className="st-cardHead">
              <h2 className="st-cardTitle" id={idFor('appearance')}>
                Giao diện & Hiển thị
              </h2>
              <span className="tag">{theme === 'dark' ? 'Tối' : 'Sáng'}</span>
            </div>

            <div className="st-row st-row--first">
              <span className="st-label">Chủ đề</span>
              <Chips
                items={THEME_CHIPS}
                selectedIds={[themePreference]}
                multi={false}
                theme={theme}
                onToggle={(id) => updateSettings({ themePreference: id as ThemePreference })}
              />
            </div>

            <div className="st-grid-2">
              <div className="st-toggleCard">
                <span className="st-label">Nền video động (Gradient Lab)</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ambientEnabled}
                  aria-label="Nền video động (Gradient Lab)"
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
              <span className="st-label">Mật độ</span>
              <Chips
                items={DENSITY_CHIPS}
                selectedIds={[settings.compactDensity ? 'compact' : 'roomy']}
                multi={false}
                theme={theme}
                onToggle={(id) => updateSettings({ compactDensity: id === 'compact' })}
              />
            </div>

            <div className="st-row st-row--scale">
              <div>
                <span className="st-label">Cỡ chữ UI</span>
                <p className="st-hint">Tỷ lệ chữ ({uiScale}%)</p>
              </div>
              <div className="st-scaleControls">
                <Chips
                  items={[
                    { id: '90', label: '90%' },
                    { id: '95', label: '95%' },
                    { id: '100', label: '100%' },
                    { id: '105', label: '105%' },
                    { id: '110', label: '110%' },
                    { id: '115', label: '115%' },
                  ]}
                  selectedIds={[String(uiScale)]}
                  multi={false}
                  theme={theme}
                  onToggle={(id) => setUiScale(Number(id))}
                />
                {uiScale !== 100 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setUiScale(100)}
                    title="Đặt lại cỡ chữ chuẩn 100%"
                  >
                    Đặt lại
                  </button>
                )}
              </div>
            </div>
          </section>

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

          <section id="st-data" className="st-card" aria-labelledby={idFor('data')}>
            <div className="st-cardHead">
              <h2 className="st-cardTitle" id={idFor('data')}>
                Sao lưu & Dữ liệu
              </h2>
              <span className="tag st-mono">
                {projects.length} dự án · {savedItemIds.length} mục
              </span>
            </div>

            <div className="st-grid-2">
              <div className="st-block">
                <FileBox
                  title="Kho dữ liệu cục bộ"
                  tabs={dataTabs}
                  activeId={selectedDataCard}
                  onSelect={(id) => setSelectedDataCard(id)}
                />
                <div className="st-exportActions">
                  <button type="button" className="btn btn-solid btn-sm" onClick={handleExportDownload}>
                    Tải JSON
                  </button>
                  <button type="button" className="btn btn-line btn-sm" onClick={() => void handleCopyJson()}>
                    Chép JSON
                  </button>
                </div>
              </div>

              <div className="st-block">
                <span className="st-label">Khôi phục từ JSON</span>
                <DynamicDropZone
                  label="Thả tệp JSON sao lưu"
                  onFilesAdded={handleFilesDropped}
                />
                {importError && (
                  <p className="st-error" role="alert">
                    {importError}
                  </p>
                )}
              </div>
            </div>

            <div className="st-row">
              <span className="st-label">Đặt lại dữ liệu trình duyệt</span>
              <button
                type="button"
                className="btn btn-line btn-sm st-danger"
                onClick={() => setConfirmReset(true)}
              >
                Đặt lại dữ liệu
              </button>
            </div>
          </section>
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
          <p>
            Toàn bộ dự án, mục đã lưu và thiết lập cục bộ sẽ bị xóa.
          </p>
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
