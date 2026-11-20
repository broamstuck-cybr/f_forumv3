import React, { useEffect, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { AIProtocol, ProjectSetupTarget } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  Chips,
  DynamicDropZone,
  LampSwitch,
  SelectionList,
  SlingSlider,
  ThemeSwitch,
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

type SectionId = 'appearance' | 'motion' | 'ai' | 'export' | 'data';

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'appearance', label: 'Giao diện' },
  { id: 'motion', label: 'Chuyển động & Cỡ chữ' },
  { id: 'ai', label: 'Kết nối AI & BYOK' },
  { id: 'export', label: 'Xuất mã' },
  { id: 'data', label: 'Sao lưu & Dữ liệu' },
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

const DENSITY_CHIPS = [
  { id: 'roomy', label: 'Rộng rãi' },
  { id: 'compact', label: 'Gọn' },
];

const BYOK_MODE_CHIPS = [
  { id: 'shared', label: 'Kết nối chung' },
  { id: 'byok', label: 'Khóa riêng (BYOK)' },
];

const EXPORT_TARGET_CHIPS = [
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'cursor', label: 'Cursor' },
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
    setTheme,
    themeEffect,
    setThemeEffect,
    reducedMotion,
    setReducedMotion,
    savedItemIds,
    projects,
    addToast,
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<SectionId>('appearance');
  const [uiScale, setUiScale] = useState<number>(() => readInitialScale());
  const [scaleKey, setScaleKey] = useState(0);
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
  const quotaLimit = quota.limit;
  const quotaText = quota.unlimited
    ? 'Không giới hạn'
    : quotaLimit === null
      ? `Đã dùng ${quota.used}`
      : `Còn ${quota.remaining ?? Math.max(0, quotaLimit - quota.used)}/${quotaLimit}`;

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
      message: 'Tệp không bao gồm khóa API cá nhân.',
    });
  };

  const handleCopyJson = async () => {
    const json = JSON.stringify(buildBackup(settings, projects, savedItemIds), null, 2);
    try {
      await navigator.clipboard.writeText(json);
      addToast({
        type: 'success',
        title: 'Đã sao chép JSON vào clipboard',
        message: `${projects.length} dự án và ${savedItemIds.length} mục đã lưu.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Trình duyệt chặn ghi clipboard',
        message: 'Hãy dùng nút Tải bản sao lưu để lưu tệp JSON.',
      });
    }
  };

  const handleFilesDropped = (files: DroppedFilePayload[]) => {
    const first = files[0];
    if (!first) return;
    const parsed = parseBackup(first.content);
    if (!parsed) {
      setImportError('Tệp vừa nạp không đúng định dạng sao lưu F-Forum v3.');
      return;
    }
    setImportError('');
    setPendingBackup(parsed);
  };

  const handleConfirmImport = () => {
    if (!pendingBackup) return;
    if (!applyBackup(pendingBackup)) {
      setPendingBackup(null);
      setImportError('Không thể ghi dữ liệu sao lưu vào trình duyệt.');
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
      title: 'Đã đặt lại toàn bộ dữ liệu cục bộ',
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
          <span className="t-label">cấu hình trình duyệt</span>
          <h1 className="t-title">Cài đặt hệ thống cá nhân</h1>
          <p className="st-lead">
            Điều chỉnh chủ đề, chuyển động, tỷ lệ chữ, khóa AI riêng và sao lưu dữ liệu cục bộ.
          </p>
        </header>

        <div className="st-layout">
          <aside className="st-rail" aria-label="Mục lục cài đặt">
            <nav className="st-nav" aria-label="Chuyển nhanh nhóm cài đặt">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className="st-nav-btn"
                  aria-current={activeSection === sec.id ? 'true' : undefined}
                  onClick={() => jumpToSection(sec.id)}
                >
                  {sec.label}
                </button>
              ))}
            </nav>

            <div className="st-summary" aria-label="Tóm tắt cấu hình">
              <span className="t-label">trạng thái hiện tại</span>
              <div className="st-summary-row">
                <span>Chủ đề</span>
                <strong className="st-mono">{theme === 'dark' ? 'Mực (Tối)' : 'Giấy (Sáng)'}</strong>
              </div>
              <div className="st-summary-row">
                <span>Chuyển động</span>
                <strong className="st-mono">{reducedMotion ? 'Tiết kiệm' : 'Đầy đủ'}</strong>
              </div>
              <div className="st-summary-row">
                <span>Cỡ chữ UI</span>
                <strong className="st-mono">{uiScale}%</strong>
              </div>
              <div className="st-summary-row">
                <span>Hạn mức AI</span>
                <strong className="st-mono">{quotaText}</strong>
              </div>
              <div className="st-summary-row">
                <span>Dự án cục bộ</span>
                <strong className="st-mono">{projects.length}</strong>
              </div>
            </div>
          </aside>

          <div className="st-content">
            <section id="st-appearance" className="st-card" aria-labelledby={idFor('appearance')}>
              <div className="st-card-head">
                <div>
                  <h2 className="st-card-title" id={idFor('appearance')}>
                    Giao diện & Hiệu ứng nền
                  </h2>
                  <p className="st-card-sub">
                    Chuyển giữa chế độ Mực tối và Giấy sáng kèm hiệu ứng chuyển cảnh tương tác.
                  </p>
                </div>
                <span className="tag">{theme === 'dark' ? 'Mực tối' : 'Giấy sáng'}</span>
              </div>

              <ThemeSwitch
                theme={theme}
                onThemeChange={(next) => setTheme(next)}
                effect={themeEffect}
                onEffectChange={(effect) => setThemeEffect(effect)}
              />
            </section>

            <section id="st-motion" className="st-card" aria-labelledby={idFor('motion')}>
              <div className="st-card-head">
                <div>
                  <h2 className="st-card-title" id={idFor('motion')}>
                    Chuyển động & Độ thoải mái thị giác
                  </h2>
                  <p className="st-card-sub">
                    Đồng bộ trực tiếp với toàn bộ hoạt ảnh và tỷ lệ kích thước chữ của ứng dụng.
                  </p>
                </div>
              </div>

              <div className="st-grid-2">
                <div className="st-block">
                  <span className="st-label">Tiết kiệm chuyển động</span>
                  <p className="st-hint">
                    Kéo dây hoặc bấm công tắc để bật chế độ giảm hiệu ứng chuyển cảnh.
                  </p>
                  <div className="st-lamp">
                    <LampSwitch
                      on={reducedMotion}
                      onToggle={(next) => setReducedMotion(next)}
                      onLabel="Tiết kiệm"
                      offLabel="Đầy đủ"
                    />
                  </div>
                </div>

                <div className="st-block">
                  <span className="st-label">Tỷ lệ giao diện & Cỡ chữ</span>
                  <p className="st-hint">
                    Kéo thanh trượt để phóng to hoặc thu gọn chữ và khoảng cách hiển thị thực tế.
                  </p>
                  <div className="st-slider">
                    <SlingSlider
                      key={`st-scale-${scaleKey}`}
                      min={90}
                      max={115}
                      step={5}
                      defaultValue={uiScale}
                      label="Tỷ lệ hiển thị"
                      unit="%"
                      theme={theme}
                      onChange={(val) => setUiScale(val)}
                    />
                  </div>
                  <div className="st-scale-bar">
                    <span className="t-label">Mặc định chuẩn: 100%</span>
                    {uiScale !== 100 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setUiScale(100);
                          setScaleKey((k) => k + 1);
                        }}
                      >
                        Đặt về 100%
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="st-row">
                <div className="st-block">
                  <span className="st-label">Mật độ không gian</span>
                  <p className="st-hint">Thu gọn lề và khoảng cách hàng trong bảng điều khiển.</p>
                </div>
                <Chips
                  items={DENSITY_CHIPS}
                  selectedIds={[settings.compactDensity ? 'compact' : 'roomy']}
                  multi={false}
                  theme={theme}
                  onToggle={(id) => updateSettings({ compactDensity: id === 'compact' })}
                />
              </div>
            </section>

            <section id="st-ai" className="st-card" aria-labelledby={idFor('ai')}>
              <div className="st-card-head">
                <div>
                  <h2 className="st-card-title" id={idFor('ai')}>
                    Kết nối AI & Khóa riêng (BYOK)
                  </h2>
                  <p className="st-card-sub">
                    Dùng kết nối mặc định của hệ thống hoặc tự gắn API Key từ nhà cung cấp của bạn.
                  </p>
                </div>
                <span className={`tag ${!quota.unlimited && quota.exhausted ? 'tag-red' : 'tag-green'}`}>
                  {quotaText}
                </span>
              </div>

              <div className="st-row" style={{ borderTop: 0, paddingTop: 0 }}>
                <div className="st-block">
                  <span className="st-label">Nguồn kết nối AI</span>
                  <p className="st-hint">Chuyển sang Khóa riêng khi muốn chạy trực tiếp qua endpoint cá nhân.</p>
                </div>
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
                  <span className="st-label">Giao thức AI Gateway</span>
                  <SelectionList
                    items={PROTOCOL_LIST}
                    selectedId={byok.protocol}
                    onSelect={(id) => updateByok({ protocol: id as AIProtocol })}
                    ariaLabel="Chọn giao thức AI"
                  />
                </div>

                <div className="st-block">
                  <span className="st-label">Mô hình ưu tiên</span>
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
                    <span className="st-label">Địa chỉ API (Base URL)</span>
                    <input
                      id={idFor('url')}
                      type="url"
                      className="field st-mono"
                      value={byok.baseUrl}
                      spellCheck={false}
                      onChange={(e) => updateByok({ baseUrl: e.target.value })}
                    />
                  </label>

                  <div className="st-block md:col-span-2">
                    <label className="st-label" htmlFor={idFor('key')}>
                      Khóa API cá nhân
                    </label>
                    <p className="st-hint">
                      Chỉ lưu trong trình duyệt này, gửi kèm header khi gọi AI và không xuất vào tệp sao lưu.
                    </p>
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
                      <p className="st-note">Chưa nhập khóa API, yêu cầu sẽ dùng kết nối chung nếu còn lượt.</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section id="st-export" className="st-card" aria-labelledby={idFor('export')}>
              <div className="st-card-head">
                <div>
                  <h2 className="st-card-title" id={idFor('export')}>
                    Cấu hình xuất mã Workspace
                  </h2>
                  <p className="st-card-sub">
                    Chọn bộ quy tắc và hướng dẫn khởi tạo đính kèm mặc định khi tải gói ZIP.
                  </p>
                </div>
              </div>

              <div className="st-row" style={{ borderTop: 0, paddingTop: 0 }}>
                <div className="st-block">
                  <span className="st-label">Bộ thiết lập mục tiêu</span>
                  <p className="st-hint">Tạo sẵn tệp cấu hình tương thích cho trình soạn thảo bạn dùng.</p>
                </div>
                <Chips
                  items={EXPORT_TARGET_CHIPS}
                  selectedIds={[settings.defaultExportTarget]}
                  multi={false}
                  theme={theme}
                  onToggle={(id) => updateSettings({ defaultExportTarget: id as ProjectSetupTarget })}
                />
              </div>
            </section>

            <section id="st-data" className="st-card" aria-labelledby={idFor('data')}>
              <div className="st-card-head">
                <div>
                  <h2 className="st-card-title" id={idFor('data')}>
                    Sao lưu, Khôi phục & Đặt lại
                  </h2>
                  <p className="st-card-sub">
                    Xuất toàn bộ dự án, mục đã lưu và thiết lập giao diện thành JSON an toàn.
                  </p>
                </div>
              </div>

              <div className="st-row" style={{ borderTop: 0, paddingTop: 0 }}>
                <div className="st-block">
                  <span className="st-label">Xuất bản sao lưu JSON</span>
                  <p className="st-hint">Bao gồm {projects.length} dự án và {savedItemIds.length} mục đã lưu.</p>
                </div>
                <div className="st-export-actions">
                  <button type="button" className="btn btn-solid btn-sm" onClick={handleExportDownload}>
                    Tải bản sao lưu
                  </button>
                  <button type="button" className="btn btn-line btn-sm" onClick={() => void handleCopyJson()}>
                    Chép JSON
                  </button>
                </div>
              </div>

              <div className="st-block">
                <span className="st-label">Khôi phục từ tệp JSON</span>
                <p className="st-hint">Kéo thả tệp sao lưu .json vào vùng bên dưới hoặc bấm Nạp tệp.</p>
                <DynamicDropZone
                  label="Thả tệp sao lưu F-Forum (.json)"
                  onFilesAdded={handleFilesDropped}
                />
                {importError && (
                  <p className="st-error" role="alert">
                    {importError}
                  </p>
                )}
              </div>

              <div className="st-row">
                <div className="st-block">
                  <span className="st-label">Xóa dữ liệu cục bộ</span>
                  <p className="st-hint">Xóa toàn bộ dự án, mục đã lưu và cài đặt khỏi trình duyệt này.</p>
                </div>
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
      </div>

      <Modal
        open={pendingBackup !== null}
        onClose={() => setPendingBackup(null)}
        label="Xác nhận khôi phục dữ liệu"
        className="st-dialog"
      >
        <div className="st-dialog-body">
          <h2>Khôi phục từ bản sao lưu?</h2>
          <p>
            <strong className="st-mono">{pendingBackup?.projects.length}</strong> dự án và{' '}
            <strong className="st-mono">{pendingBackup?.savedItemIds.length}</strong> mục đã lưu sẽ thay thế dữ liệu hiện tại. Trang sẽ nạp lại ngay sau khi xác nhận.
          </p>
          <div className="st-dialog-actions">
            <button type="button" className="btn btn-line btn-sm" onClick={() => setPendingBackup(null)}>
              Hủy
            </button>
            <button type="button" className="btn btn-solid btn-sm" onClick={handleConfirmImport}>
              Xác nhận khôi phục
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
            Mọi dự án, mục đã lưu và tùy chỉnh trong trình duyệt này sẽ bị xóa vĩnh viễn. Bạn nên tải bản sao lưu trước khi tiếp tục.
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
