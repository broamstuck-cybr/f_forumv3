import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { LiquidTabs } from '../../components/pinui/LiquidTabs';
import { generateProjectSetupBundle } from '../../services/projectSetupGenerator';
import { useAppStore } from '../../store/appStore';
import type { AIProtocol, ProjectSetupTarget, WorkspaceProject } from '../../types/index';
import { Modal } from './Modal';

export interface AiProjectSetupDrawerProps {
  open: boolean;
  onClose: () => void;
  project: WorkspaceProject;
  defaultTarget: ProjectSetupTarget;
  onInjectFiles: (files: Array<{ path: string; content: string; summary?: string }>) => void;
}

const TARGETS: Array<{ id: ProjectSetupTarget; label: string }> = [
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'cursor', label: 'Cursor' },
];

const PROTOCOLS: Array<{ id: AIProtocol; label: string }> = [
  { id: 'openai-compatible', label: 'OpenAI / OpenRouter' },
  { id: 'anthropic', label: 'Anthropic Claude' },
  { id: 'gemini', label: 'Google Gemini' },
];

const PRESET_MODELS = [
  'studio-smart-route',
  'studio-heavy-route',
  'ag/gemini-3.8-flash-low',
  'ag/gemini-4-argon-high',
  'ag/claude-sonnet-5-5-medium',
];

export const AiProjectSetupDrawer: React.FC<AiProjectSetupDrawerProps> = ({
  open,
  onClose,
  project,
  defaultTarget,
  onInjectFiles,
}) => {
  const { settings, updateByok, addToast } = useAppStore();
  const [drawerTab, setDrawerTab] = useState<'byok' | 'bundle'>('byok');
  const [target, setTarget] = useState<ProjectSetupTarget>(defaultTarget);
  const [selectedDocPath, setSelectedDocPath] = useState('README.md');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [injected, setInjected] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const bundle = useMemo(() => generateProjectSetupBundle(project, target), [project, target]);

  const currentDoc = useMemo(
    () => bundle.files.find((file) => file.path === selectedDocPath) || bundle.files[0],
    [bundle, selectedDocPath]
  );

  const handleCopy = async () => {
    if (!currentDoc) return;
    try {
      await navigator.clipboard.writeText(currentDoc.content);
      setCopiedPath(currentDoc.path);
      window.setTimeout(() => setCopiedPath(null), 1600);
    } catch {
      return;
    }
  };

  const handleAddAllToWorkspace = () => {
    onInjectFiles(
      bundle.files.map((file) => ({
        path: file.path,
        content: file.content,
        summary: `Hồ sơ thiết lập ${target}`,
      }))
    );
    setInjected(true);
    window.setTimeout(() => setInjected(false), 2000);
  };

  const handleSaveByok = (event: React.FormEvent) => {
    event.preventDefault();
    addToast({
      type: 'success',
      title: 'Đã lưu cấu hình Model & BYOK',
      message: settings.byok.enabled
        ? `Đang dùng ${settings.byok.protocol} (${settings.byok.model || 'mặc định'})`
        : 'Đang dùng cổng định tuyến mặc định của hệ thống.',
    });
  };

  return (
    <Modal open={open} onClose={onClose} label="Cấu hình Model, BYOK & Thiết lập dự án" className="ws-modal ws-modal-right">
      <div className="ws-setup">
        <header className="ws-head">
          <h2 className="ws-head-title">Model, BYOK &amp; Hồ sơ IDE</h2>
          <button type="button" className="icon-btn" aria-label="Đóng" title="Đóng" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="ws-setup-tabs">
          <LiquidTabs
            tabs={[
              { id: 'byok', label: 'Model & Khóa BYOK' },
              { id: 'bundle', label: 'Hồ sơ Thiết lập IDE', count: bundle.files.length },
            ]}
            activeId={drawerTab}
            onChange={(id) => setDrawerTab(id as 'byok' | 'bundle')}
            ariaLabel="Chế độ thiết lập"
          />
        </div>

        {drawerTab === 'byok' ? (
          <form className="ws-byok-form" onSubmit={handleSaveByok}>
            <div className="ws-byok-card">
              <div className="ws-byok-row">
                <div>
                  <h3 className="ws-byok-title">Chế độ Khóa API riêng (BYOK)</h3>
                  <p className="ws-setup-hint">
                    Kết nối trực tiếp tới cổng OpenAI, OpenRouter, Anthropic hoặc Gemini của bạn khi chạy Workspace.
                  </p>
                </div>
                <div className="ws-seg" role="group" aria-label="Trạng thái BYOK">
                  <button
                    type="button"
                    className="ws-seg-item"
                    aria-pressed={!settings.byok.enabled}
                    onClick={() => updateByok({ enabled: false })}
                  >
                    Cổng mặc định
                  </button>
                  <button
                    type="button"
                    className="ws-seg-item"
                    aria-pressed={settings.byok.enabled}
                    onClick={() => updateByok({ enabled: true })}
                  >
                    Bật BYOK
                  </button>
                </div>
              </div>

              <div className="ws-byok-field">
                <span className="t-label">Giao thức kết nối</span>
                <div className="ws-seg" role="group" aria-label="Giao thức AI">
                  {PROTOCOLS.map((proto) => (
                    <button
                      key={proto.id}
                      type="button"
                      className="ws-seg-item"
                      aria-pressed={settings.byok.protocol === proto.id}
                      onClick={() => updateByok({ protocol: proto.id })}
                    >
                      {proto.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ws-byok-field">
                <label className="t-label" htmlFor="ws-byok-url">
                  Địa chỉ Endpoint (Base URL)
                </label>
                <input
                  id="ws-byok-url"
                  type="url"
                  className="field"
                  value={settings.byok.baseUrl}
                  placeholder="https://api.openai.com/v1"
                  onChange={(event) => updateByok({ baseUrl: event.target.value })}
                />
              </div>

              <div className="ws-byok-field">
                <label className="t-label" htmlFor="ws-byok-model">
                  Mã Model ưu tiên
                </label>
                <input
                  id="ws-byok-model"
                  type="text"
                  className="field"
                  value={settings.byok.model}
                  placeholder="studio-smart-route"
                  onChange={(event) => updateByok({ model: event.target.value })}
                />
                <div className="ws-byok-presets" aria-label="Model gợi ý">
                  {PRESET_MODELS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="ws-preset-chip"
                      aria-pressed={settings.byok.model === preset}
                      onClick={() => updateByok({ model: preset })}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ws-byok-field">
                <label className="t-label" htmlFor="ws-byok-key">
                  Khóa API (chỉ lưu cục bộ trên trình duyệt)
                </label>
                <div className="ws-byok-key-row">
                  <input
                    id="ws-byok-key"
                    type={showKey ? 'text' : 'password'}
                    className="field"
                    value={settings.byok.apiKey}
                    placeholder="sk-... hoặc AIza..."
                    autoComplete="off"
                    onChange={(event) => updateByok({ apiKey: event.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => setShowKey((val) => !val)}
                  >
                    {showKey ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              <div className="ws-byok-actions">
                <button type="submit" className="btn btn-solid btn-sm">
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            <div className="ws-setup-bar">
              <p className="ws-setup-hint">
                Bộ 5 tệp hướng dẫn ngữ cảnh chuẩn cho trình soạn thảo, tự động đính kèm khi xuất gói ZIP.
              </p>
              <div className="ws-seg" role="group" aria-label="Trình soạn thảo">
                {TARGETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="ws-seg-item"
                    aria-pressed={target === item.id}
                    onClick={() => setTarget(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-line btn-sm" onClick={handleAddAllToWorkspace}>
                {injected ? 'Đã nạp vào phiên' : 'Nạp 5 tệp vào phiên'}
              </button>
            </div>

            <nav className="ws-setup-docs" aria-label="Tệp thiết lập">
              {bundle.files.map((doc) => (
                <button
                  key={doc.path}
                  type="button"
                  className="ws-setup-doc"
                  aria-current={currentDoc?.path === doc.path ? 'true' : undefined}
                  onClick={() => setSelectedDocPath(doc.path)}
                >
                  {doc.path}
                </button>
              ))}
            </nav>

            <div className="ws-setup-view">
              <div className="ws-setup-viewbar">
                <span className="ws-row-path">{currentDoc?.path}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleCopy()}>
                  {copiedPath === currentDoc?.path ? 'Đã chép' : 'Chép mã'}
                </button>
              </div>
              <pre className="ws-setup-code">{currentDoc?.content}</pre>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
