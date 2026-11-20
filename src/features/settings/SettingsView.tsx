import React, { useId, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { AIProtocol, ProjectSetupTarget } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { ThemeSwitch } from '../../components/pinui';
import { Modal } from '../workspace/Modal';
import { applyBackup, buildBackup, clearLocalData, downloadBackup, parseBackup, type BackupPayload } from './backup';
import './settings.css';

interface RowProps {
  label: string;
  hint: string;
  htmlFor?: string;
  labelId?: string;
  wide?: boolean;
  children: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ label, hint, htmlFor, labelId, wide, children }) => (
  <div className="st-row" data-wide={wide ? 'true' : undefined}>
    <div className="st-text">
      {htmlFor ? (
        <label className="st-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <p className="st-label" id={labelId}>
          {label}
        </p>
      )}
      <p className="st-hint">{hint}</p>
    </div>
    <div className="st-control">{children}</div>
  </div>
);

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelId: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, labelId }) => (
  <div className="st-switch-wrap">
    <span className="t-label" aria-hidden="true">
      {checked ? 'bật' : 'tắt'}
    </span>
    <button
      type="button"
      role="switch"
      className="st-switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={() => onChange(!checked)}
    />
  </div>
);

interface SegmentProps<Value extends string> {
  value: Value;
  options: Array<{ id: Value; label: string }>;
  onChange: (next: Value) => void;
  labelId: string;
}

function Segment<Value extends string>({ value, options, onChange, labelId }: SegmentProps<Value>) {
  return (
    <div className="st-seg" role="group" aria-labelledby={labelId}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="st-seg-item"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const DENSITY_OPTIONS: Array<{ id: 'roomy' | 'compact'; label: string }> = [
  { id: 'roomy', label: 'Rộng' },
  { id: 'compact', label: 'Gọn' },
];

const TARGET_OPTIONS: Array<{ id: ProjectSetupTarget; label: string }> = [
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'cursor', label: 'Cursor' },
];

const PROTOCOLS: AIProtocol[] = ['openai-compatible', 'anthropic', 'gemini'];

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

  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupPayload | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const idFor = (name: string) => `${baseId}-${name}`;

  const byok = settings.byok;
  const quotaLimit = quota.limit;
  const quotaText = quota.unlimited
    ? 'không giới hạn'
    : quotaLimit === null
      ? `đã dùng ${quota.used}`
      : `còn ${quota.remaining ?? Math.max(0, quotaLimit - quota.used)}/${quotaLimit}`;

  const handleExport = () => {
    downloadBackup(buildBackup(settings, projects, savedItemIds));
    addToast({
      type: 'success',
      title: 'Đã tải bản sao lưu',
      message: 'Tệp không chứa khóa API.',
    });
  };

  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const parsed = parseBackup(await file.text().catch(() => ''));
    if (!parsed) {
      setImportError('Tệp này không phải bản sao lưu F-Forum hợp lệ.');
      return;
    }
    setImportError('');
    setPendingBackup(parsed);
  };

  const handleConfirmImport = () => {
    if (!pendingBackup) return;
    if (!applyBackup(pendingBackup)) {
      setPendingBackup(null);
      setImportError('Trình duyệt không lưu được dữ liệu từ tệp này.');
      return;
    }
    window.location.reload();
  };

  const handleResetLocalData = () => {
    clearLocalData();
    setConfirmReset(false);
    addToast({
      type: 'warning',
      title: 'Đã đặt lại dữ liệu',
      message: 'Đang nạp lại trang.',
    });
    window.setTimeout(() => {
      window.location.reload();
    }, 450);
  };

  return (
    <div className="st" data-density={settings.compactDensity ? 'compact' : 'roomy'}>
      <div className="st-wrap">
        <header className="st-head">
          <h1 className="t-title">Cài đặt</h1>
          <p className="st-lead">Mọi tùy chỉnh nằm trên một tờ, lưu ngay trong trình duyệt này.</p>
        </header>

        <div className="st-sheet">
          <section className="st-group" aria-labelledby={idFor('look')}>
            <h2 className="st-group-name" id={idFor('look')}>
              Giao diện
            </h2>
            <div className="st-rows">
              <Row label="Sáng tối" hint="Mực cho nền tối, Giấy cho nền sáng." labelId={idFor('theme')} wide>
                <ThemeSwitch
                  theme={theme}
                  onThemeChange={(next) => setTheme(next)}
                  effect={themeEffect}
                  onEffectChange={(effect) => setThemeEffect(effect)}
                />
              </Row>
            </div>
          </section>

          <section className="st-group" aria-labelledby={idFor('motion')}>
            <h2 className="st-group-name" id={idFor('motion')}>
              Chuyển động
            </h2>
            <div className="st-rows">
              <Row label="Giảm chuyển động" hint="Bỏ hiệu ứng, đổi cảnh tức thì." labelId={idFor('reduce')}>
                <Switch checked={reducedMotion} onChange={setReducedMotion} labelId={idFor('reduce')} />
              </Row>
              <Row label="Mật độ" hint="Gọn thu hẹp hàng và lề trong Workspace." labelId={idFor('density')}>
                <Segment
                  value={settings.compactDensity ? 'compact' : 'roomy'}
                  options={DENSITY_OPTIONS}
                  onChange={(next) => updateSettings({ compactDensity: next === 'compact' })}
                  labelId={idFor('density')}
                />
              </Row>
            </div>
          </section>

          <section className="st-group" aria-labelledby={idFor('ai')}>
            <h2 className="st-group-name" id={idFor('ai')}>
              Kết nối AI
            </h2>
            <div className="st-rows">
              <Row label="Lượt AI" hint="Hạn mức của phiên đang dùng." labelId={idFor('quota')}>
                <p className="st-value" data-low={!quota.unlimited && quota.exhausted}>
                  {quotaText}
                </p>
              </Row>
              <Row label="Khóa riêng" hint="Gọi mô hình bằng khóa API của bạn." labelId={idFor('byok')}>
                <Switch
                  checked={byok.enabled}
                  onChange={(next) => updateByok({ enabled: next })}
                  labelId={idFor('byok')}
                />
              </Row>
              {byok.enabled && (
                <>
                  <Row label="Giao thức" hint="Chuẩn API của nhà cung cấp." htmlFor={idFor('protocol')} wide>
                    <select
                      id={idFor('protocol')}
                      className="field st-mono"
                      value={byok.protocol}
                      onChange={(event) => updateByok({ protocol: event.target.value as AIProtocol })}
                    >
                      {PROTOCOLS.map((protocol) => (
                        <option key={protocol} value={protocol}>
                          {protocol}
                        </option>
                      ))}
                    </select>
                  </Row>
                  <Row label="Mô hình" hint="Tên mô hình gửi tới nhà cung cấp." htmlFor={idFor('model')} wide>
                    <input
                      id={idFor('model')}
                      type="text"
                      className="field st-mono"
                      value={byok.model}
                      spellCheck={false}
                      onChange={(event) => updateByok({ model: event.target.value })}
                    />
                  </Row>
                  <Row label="Địa chỉ API" hint="Đường dẫn gốc của dịch vụ." htmlFor={idFor('url')} wide>
                    <input
                      id={idFor('url')}
                      type="url"
                      className="field st-mono"
                      value={byok.baseUrl}
                      spellCheck={false}
                      onChange={(event) => updateByok({ baseUrl: event.target.value })}
                    />
                  </Row>
                  <Row
                    label="Khóa API"
                    hint="Chỉ lưu trong trình duyệt này, gửi kèm khi gọi AI, không vào bản sao lưu."
                    htmlFor={idFor('key')}
                    wide
                  >
                    <div className="st-secret">
                      <input
                        id={idFor('key')}
                        type={showApiKey ? 'text' : 'password'}
                        className="field st-mono"
                        value={byok.apiKey}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(event) => updateByok({ apiKey: event.target.value })}
                      />
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={showApiKey ? 'Ẩn khóa' : 'Hiện khóa'}
                        title={showApiKey ? 'Ẩn khóa' : 'Hiện khóa'}
                        aria-pressed={showApiKey}
                        onClick={() => setShowApiKey((value) => !value)}
                      >
                        {showApiKey ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                      </button>
                    </div>
                    {!byok.apiKey.trim() && <p className="st-note">Chưa có khóa, F-Forum vẫn dùng kết nối chung.</p>}
                  </Row>
                </>
              )}
            </div>
          </section>

          <section className="st-group" aria-labelledby={idFor('export')}>
            <h2 className="st-group-name" id={idFor('export')}>
              Xuất mã
            </h2>
            <div className="st-rows">
              <Row label="Bộ thiết lập" hint="Tệp hướng dẫn kèm theo ZIP dành cho trình soạn thảo này." labelId={idFor('target')}>
                <Segment
                  value={settings.defaultExportTarget}
                  options={TARGET_OPTIONS}
                  onChange={(next) => updateSettings({ defaultExportTarget: next })}
                  labelId={idFor('target')}
                />
              </Row>
            </div>
          </section>

          <section className="st-group" aria-labelledby={idFor('data')}>
            <h2 className="st-group-name" id={idFor('data')}>
              Dữ liệu
            </h2>
            <div className="st-rows">
              <Row label="Sao lưu" hint="Tải dự án và mục đã lưu thành một tệp, không kèm khóa API." labelId={idFor('backup')}>
                <button type="button" className="btn btn-line" onClick={handleExport}>
                  Tải về
                </button>
              </Row>
              <Row label="Khôi phục" hint="Nạp tệp sao lưu để thay dữ liệu hiện tại." labelId={idFor('restore')}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(event) => void handleFileChosen(event)}
                />
                <button type="button" className="btn btn-line" onClick={() => fileInputRef.current?.click()}>
                  Chọn tệp
                </button>
                {importError && (
                  <p className="st-note st-error" role="alert">
                    {importError}
                  </p>
                )}
              </Row>
              <Row label="Đặt lại" hint="Xóa dự án, mục đã lưu và cài đặt khỏi trình duyệt này." labelId={idFor('reset')}>
                <button type="button" className="btn btn-line st-danger" onClick={() => setConfirmReset(true)}>
                  Đặt lại
                </button>
              </Row>
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={pendingBackup !== null}
        onClose={() => setPendingBackup(null)}
        label="Khôi phục dữ liệu"
        className="st-dialog"
      >
        <div className="st-dialog-body">
          <h2>Khôi phục từ tệp?</h2>
          <p>
            <span className="st-value">{pendingBackup?.projects.length}</span> dự án trong tệp sẽ thay toàn bộ dự
            án hiện tại. Trang sẽ nạp lại.
          </p>
          <div className="st-dialog-actions">
            <button type="button" className="btn btn-line" onClick={() => setPendingBackup(null)}>
              Hủy
            </button>
            <button type="button" className="btn btn-solid" onClick={handleConfirmImport}>
              Khôi phục
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        label="Đặt lại dữ liệu"
        className="st-dialog"
      >
        <div className="st-dialog-body">
          <h2>Đặt lại dữ liệu?</h2>
          <p>Dự án, mục đã lưu và cài đặt trong trình duyệt này sẽ mất hẳn. Hãy sao lưu trước nếu cần.</p>
          <div className="st-dialog-actions">
            <button type="button" className="btn btn-line" onClick={() => setConfirmReset(false)}>
              Hủy
            </button>
            <button type="button" className="btn btn-red" onClick={handleResetLocalData}>
              Đặt lại
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
