import React, { useEffect, useRef, useState } from 'react';
import { BRAND_PALETTES } from '../../engine/motionCraftPack';
import { handleLiquidPointerLeave, handleLiquidPointerMove } from '../../utils/liquidGlassPointer';
import type { AIProtocol, BYOKConfig } from '../../types/index';
import type {
  AgentChatMessage,
  OnboardingProfile,
  OnboardingRole,
} from '../../types/workspaceV4';

interface ProviderPreset {
  id: string;
  label: string;
  protocol: AIProtocol;
  baseUrl: string;
  defaultModel: string;
  models: Array<{ id: string; label: string }>;
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'gemini',
    label: 'Gemini',
    protocol: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-3-flash-preview',
    models: [
      { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    protocol: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.5-flash',
    models: [
      { id: 'google/gemini-2.5-flash', label: 'OR · Gemini 2.5 Flash' },
      { id: 'anthropic/claude-3.7-sonnet', label: 'OR · Claude 3.7 Sonnet' },
      { id: 'openai/gpt-4o-mini', label: 'OR · GPT-4o Mini' },
      { id: 'deepseek/deepseek-chat-v3-0324', label: 'OR · DeepSeek V3' },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    protocol: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    ],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    protocol: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek V3' },
      { id: 'deepseek-reasoner', label: 'DeepSeek R1' },
    ],
  },
  {
    id: 'anthropic',
    label: 'Claude',
    protocol: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3-7-sonnet-latest',
    models: [
      { id: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet' },
      { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
    ],
  },
];

const SERVER_POOL_MODELS: Array<{ id: string; label: string }> = [
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
];

function detectPresetId(byok?: BYOKConfig): string {
  if (!byok || (!byok.enabled && !byok.apiKey.trim())) return 'gemini';
  if (byok.protocol === 'gemini' || byok.baseUrl.includes('googleapis.com')) return 'gemini';
  if (byok.protocol === 'anthropic' || byok.baseUrl.includes('anthropic.com')) return 'anthropic';
  if (byok.baseUrl.includes('openrouter.ai')) return 'openrouter';
  if (byok.baseUrl.includes('deepseek.com')) return 'deepseek';
  return 'openai';
}

export interface AgentChatPaneProps {
  profile: OnboardingProfile | null;
  messages: AgentChatMessage[];
  busy: boolean;
  errorMessage: string | null;
  canUndo: boolean;
  hasGeneratedHtml: boolean;
  canUseAi: boolean;
  selectedModel: string;
  byok?: BYOKConfig;
  onChangeModel: (model: string) => void;
  onSaveByok: (next: BYOKConfig) => void;
  onRequireAuth: () => void;
  onSendPrompt: (text: string) => void;
  onRetryLast: () => void;
  onUndo: () => void;
  onFeedback: (messageId: string, value: 'yes' | 'no' | 'keep_working') => void;
  onEditOnboarding: () => void;
  onInspectFile: (filePath?: string) => void;
}

const ROLE_LABELS: Record<OnboardingRole, string> = {
  student: 'Học sinh / SV',
  beginner: 'Người mới',
  business: 'Kinh doanh',
  tech: 'Công nghệ',
};

const QUICK_EDIT_CHIPS = [
  'Nền sáng',
  'Thêm câu hỏi',
  'Đếm ngược',
  'Màu cam đào',
  'Rút gọn chữ',
];

const EMPTY_STARTERS: Array<{ tag: string; prompt: string }> = [
  {
    tag: 'Thuyết trình',
    prompt: 'Làm trang thuyết trình Dự án Năng lượng Xanh có số liệu và 2 câu trắc nghiệm',
  },
  {
    tag: 'React TSX',
    prompt: 'Tạo ứng dụng dashboard React TSX cho CLB Robotics có lọc dự án trực tiếp và form đăng ký',
  },
  {
    tag: 'Hồ sơ IT',
    prompt: 'Dựng hồ sơ sinh viên Công nghệ Thông tin nền tối gọn sạch',
  },
];

export const AgentChatPane: React.FC<AgentChatPaneProps> = ({
  profile,
  messages,
  busy,
  errorMessage,
  canUndo,
  hasGeneratedHtml,
  canUseAi,
  selectedModel,
  byok,
  onChangeModel,
  onSaveByok,
  onRequireAuth,
  onSendPrompt,
  onRetryLast,
  onUndo,
  onFeedback,
  onEditOnboarding,
  onInspectFile,
}) => {
  const [draft, setDraft] = useState('');
  const [openTraceIds, setOpenTraceIds] = useState<Record<string, boolean>>({});
  const [byokOpen, setByokOpen] = useState(false);
  const [presetId, setPresetId] = useState<string>(() => detectPresetId(byok));
  const [keyInput, setKeyInput] = useState<string>(() => byok?.apiKey || '');
  const [urlInput, setUrlInput] = useState<string>(
    () => byok?.baseUrl || PROVIDER_PRESETS[0].baseUrl
  );
  const [customModelInput, setCustomModelInput] = useState<string>(
    () => byok?.model || PROVIDER_PRESETS[0].defaultModel
  );
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const hasActiveByok = Boolean(byok?.enabled && byok.apiKey.trim());
  const activePreset =
    PROVIDER_PRESETS.find((p) => p.id === (hasActiveByok ? detectPresetId(byok) : presetId)) ||
    PROVIDER_PRESETS[0];

  const availableModels = (() => {
    const base = hasActiveByok ? [...activePreset.models] : [...SERVER_POOL_MODELS];
    if (selectedModel && !base.some((m) => m.id === selectedModel)) {
      base.unshift({ id: selectedModel, label: selectedModel });
    }
    return base;
  })();

  const handleOpenByok = () => {
    const nextPreset = detectPresetId(byok);
    const matchedPreset = PROVIDER_PRESETS.find((p) => p.id === nextPreset) || PROVIDER_PRESETS[0];
    const hasSaved = Boolean(byok?.enabled || byok?.apiKey.trim());
    setPresetId(nextPreset);
    setKeyInput(byok?.apiKey || '');
    setUrlInput(hasSaved && byok?.baseUrl ? byok.baseUrl : matchedPreset.baseUrl);
    setCustomModelInput(
      hasSaved && byok?.model && byok.model !== 'studio-smart-route'
        ? byok.model
        : matchedPreset.defaultModel
    );
    setByokOpen((prev) => !prev);
  };

  const handlePickPreset = (nextPresetId: string) => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === nextPresetId);
    if (!preset) return;
    setPresetId(preset.id);
    setUrlInput(preset.baseUrl);
    setCustomModelInput(preset.defaultModel);
  };

  const handleApplyByok = () => {
    const trimmedKey = keyInput.trim();
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId) || PROVIDER_PRESETS[0];
    const nextModel = customModelInput.trim() || preset.defaultModel;
    const nextUrl = urlInput.trim() || preset.baseUrl;
    onSaveByok({
      enabled: Boolean(trimmedKey),
      protocol: preset.protocol,
      baseUrl: nextUrl,
      model: nextModel,
      apiKey: trimmedKey,
    });
    if (trimmedKey) {
      onChangeModel(nextModel);
    }
    setByokOpen(false);
  };

  const handleDisableByok = () => {
    onSaveByok({
      enabled: false,
      protocol: byok?.protocol || 'gemini',
      baseUrl: byok?.baseUrl || PROVIDER_PRESETS[0].baseUrl,
      model: byok?.model || 'gemini-3-flash-preview',
      apiKey: '',
    });
    setKeyInput('');
    onChangeModel('gemini-3-flash-preview');
    setByokOpen(false);
  };

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy]);

  const submit = () => {
    const clean = draft.trim();
    if (!clean || busy) return;
    setDraft('');
    onSendPrompt(clean);
  };

  const toggleTrace = (id: string) => {
    setOpenTraceIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  const contextSummary = profile
    ? `${ROLE_LABELS[profile.role]} · ${profile.siteName || 'Trang mới'} · ${BRAND_PALETTES[profile.personality].label}`
    : 'Chế độ Chat nhanh · Chưa đặt hồ sơ 5 bước';

  return (
    <section className="ws-chat lg-glass lg-glass--matte" aria-label="Hội thoại với AI dựng trang">
      <div className="ws-chat__ctx">
        <span className="ws-chat__ctxText" title={contextSummary}>
          {contextSummary}
        </span>
        <button
          type="button"
          className="ws-iconBtn ws-iconBtn--sm lg-pill"
          onClick={onEditOnboarding}
          aria-label="Sửa thiết lập 5 bước"
          title="Sửa 5 bước"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      </div>

      <div className="ws-chat__feed">
        {messages.length === 0 && !busy && (
          <div className="ws-chat__empty">
            <h2>Mô tả trang web bạn muốn dựng</h2>
            <p>
              AI tra kho mẫu giao diện miễn phí, tổ chức thành dự án nhiều tệp (HTML, CSS, JS hoặc React TSX) và chạy trực tiếp ở khung bên phải.
            </p>
            <div className="ws-chat__starters">
              {EMPTY_STARTERS.map((starter, idx) => (
                <button
                  key={starter.prompt}
                  type="button"
                  className={`ws-starterBtn lg-glass lg-glass--matte${idx === 0 ? ' ws-starterBtn--featured' : ''}`}
                  onPointerMove={handleLiquidPointerMove}
                  onPointerLeave={handleLiquidPointerLeave}
                  onClick={() => onSendPrompt(starter.prompt)}
                >
                  <span className="ws-starterTag">{starter.tag}</span>
                  <span className="ws-starterCopy">{starter.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="ws-msg ws-msg--user">
                <div className="ws-userBubble">{msg.text}</div>
              </div>
            );
          }

          const vaultStep = msg.trace?.find((s) => s.kind === 'vault_search');
          const fileSteps = msg.trace?.filter((s) => s.kind === 'file_create' || s.kind === 'file_edit') ?? [];
          const checkStep = msg.trace?.find((s) => s.kind === 'check');
          const isOpen = Boolean(openTraceIds[msg.id]);

          return (
            <article key={msg.id} className="ws-msg ws-msg--ai">
              <p className="ws-aiText">{msg.text}</p>

              {vaultStep && (
                <div className="ws-traceBlock">
                  <button
                    type="button"
                    className="ws-traceToggle"
                    aria-expanded={isOpen}
                    onClick={() => toggleTrace(msg.id)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isOpen ? 'is-rotated' : undefined}
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                    <span>{vaultStep.label}</span>
                  </button>

                  {isOpen && (
                    <div className="ws-traceDetail">
                      {msg.matchedResources && msg.matchedResources.length > 0 && (
                        <ul className="ws-matchedList">
                          {msg.matchedResources.map((res) => (
                            <li key={`${msg.id}-${res.id}`}>
                              <span className="ws-libTag">{res.library}</span>
                              <span className="ws-resTitle">{res.title}</span>
                              <span className="ws-resReason">{res.reason}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {checkStep && (
                        <div className="ws-checkNote">
                          <strong>{checkStep.label}</strong>
                          {checkStep.detail ? <span> — {checkStep.detail}</span> : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {fileSteps.length > 0 && (
                <div className="ws-fileRows">
                  {fileSteps.map((fs) => {
                    const targetFile =
                      fs.detail || fs.label.replace(/^(?:Created|Edited)\s+/i, '').trim() || undefined;
                    return (
                      <button
                        key={fs.id}
                        type="button"
                        className="ws-fileRow"
                        onClick={() => onInspectFile(targetFile)}
                        title={targetFile ? `Mở ${targetFile} trong Code` : 'Mở mã nguồn'}
                      >
                        <span className="ws-fileRow__left">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{fs.label}</span>
                        </span>
                        <span className="ws-fileRow__diff">
                          {typeof fs.added === 'number' && fs.added > 0 && (
                            <span className="ws-diffAdd">+{fs.added}</span>
                          )}
                          {typeof fs.removed === 'number' && fs.removed > 0 && (
                            <span className="ws-diffDel">-{fs.removed}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="ws-aiFoot">
                {msg.motionSignature && <span>{msg.motionSignature}</span>}
                {typeof msg.durationMs === 'number' && (
                  <span>{(msg.durationMs / 1000).toFixed(1)}s</span>
                )}
              </div>
            </article>
          );
        })}

        {busy && (
          <div className="ws-thinking" role="status" aria-live="polite">
            <span className="ws-thinking__dot" aria-hidden="true" />
            <span>Đang tra kho tài nguyên và dựng dự án đa tệp...</span>
          </div>
        )}

        {errorMessage && !busy && (
          <div className="ws-errorBox" role="alert">
            <span>{errorMessage}</span>
            <button type="button" className="ws-miniBtn" onClick={onRetryLast}>
              Thử lại
            </button>
          </div>
        )}

        <div ref={feedEndRef} />
      </div>

      {hasGeneratedHtml && lastAssistant && !busy && (
        <div className="ws-satisfy">
          <span className="ws-satisfy__q">Bạn thấy bản này ổn chưa?</span>
          <div className="ws-satisfy__btns">
            <button
              type="button"
              className={`ws-satBtn${lastAssistant.feedback === 'yes' ? ' is-picked' : ''}`}
              onClick={() => onFeedback(lastAssistant.id, 'yes')}
            >
              Có
            </button>
            <button
              type="button"
              className={`ws-satBtn${lastAssistant.feedback === 'no' ? ' is-picked' : ''}`}
              onClick={() => onFeedback(lastAssistant.id, 'no')}
            >
              Chưa
            </button>
            <button
              type="button"
              className={`ws-satBtn${lastAssistant.feedback === 'keep_working' ? ' is-picked' : ''}`}
              onClick={() => {
                onFeedback(lastAssistant.id, 'keep_working');
                inputRef.current?.focus();
              }}
            >
              Làm tiếp
            </button>
          </div>
        </div>
      )}

      <div className="ws-composerWrap">
        {!canUseAi && (
          <div className="ws-authGate" role="status">
            <span className="ws-authGate__text">
              Đăng nhập hoặc gắn API Key riêng để dùng AI. Khách vẫn xem được 15 mẫu có sẵn.
            </span>
            <div className="ws-authGate__actions">
              <button type="button" className="ws-miniBtn ws-miniBtn--primary" onClick={onRequireAuth}>
                Đăng nhập
              </button>
            </div>
          </div>
        )}

        {byokOpen && (
          <div className="ws-byokPopover lg-glass lg-glass--matte" role="dialog" aria-label="Cấu hình API Key riêng">
            <div className="ws-byokPopover__head">
              <strong>API Key riêng (BYOK)</strong>
              <button
                type="button"
                className="ws-iconBtn ws-iconBtn--sm"
                onClick={() => setByokOpen(false)}
                aria-label="Đóng"
                title="Đóng"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="ws-byokPresets" role="group" aria-label="Chọn nhà cung cấp AI">
              {PROVIDER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`ws-chip${presetId === preset.id ? ' is-active' : ''}`}
                  onClick={() => handlePickPreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="ws-byokFields">
              <label className="ws-byokField">
                <span>API Key</span>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Dán API Key (AIza..., sk-..., or-...)"
                  autoComplete="off"
                />
              </label>
              <div className="ws-byokRow">
                <label className="ws-byokField">
                  <span>Model</span>
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    placeholder="gemini-3-flash-preview"
                  />
                </label>
                <label className="ws-byokField">
                  <span>Base URL</span>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://..."
                  />
                </label>
              </div>
            </div>

            <div className="ws-byokActions">
              {hasActiveByok && (
                <button type="button" className="ws-miniBtn" onClick={handleDisableByok}>
                  Dùng khóa mặc định
                </button>
              )}
              <button
                type="button"
                className="ws-miniBtn ws-miniBtn--primary"
                disabled={!keyInput.trim()}
                onClick={handleApplyByok}
              >
                Lưu khóa
              </button>
            </div>
          </div>
        )}

        <div className="ws-aiBar">
          <label className="ws-modelSelectWrap">
            <span className="sr-only">Chọn model AI</span>
            <select
              className="ws-modelSelect"
              aria-label="Chọn model AI"
              value={selectedModel}
              disabled={busy}
              onChange={(e) => onChangeModel(e.target.value)}
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={`ws-keyBtn${hasActiveByok ? ' is-active' : ''}`}
            onClick={handleOpenByok}
            aria-expanded={byokOpen}
            aria-label={hasActiveByok ? 'Đang dùng API Key riêng' : 'Gắn API Key riêng'}
            title={hasActiveByok ? 'API Key riêng đang bật' : 'API Key riêng'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="7.5" cy="15.5" r="4.5" />
              <path d="m21 2-9.6 9.6" />
              <path d="m15.5 7.5 3 3L22 7l-3-3" />
            </svg>
            <span>{hasActiveByok ? 'BYOK' : 'API Key'}</span>
          </button>
        </div>

        {hasGeneratedHtml && canUseAi && (
          <div className="ws-quickChips" aria-label="Gợi ý chỉnh nhanh">
            {QUICK_EDIT_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="ws-chip"
                disabled={busy}
                onClick={() => onSendPrompt(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <div
          className="ws-composer lg-glass lg-glass--matte"
          onPointerMove={handleLiquidPointerMove}
          onPointerLeave={handleLiquidPointerLeave}
        >
          <button
            type="button"
            className="ws-iconBtn ws-iconBtn--sm"
            disabled={!canUndo || busy}
            onClick={onUndo}
            aria-label="Quay lại bản trước"
            title="Hoàn tác"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>

          <textarea
            ref={inputRef}
            className="ws-input"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              hasGeneratedHtml
                ? 'Nhắn yêu cầu chỉnh sửa...'
                : 'Mô tả trang web bạn muốn tạo...'
            }
            aria-label="Nhập yêu cầu cho AI"
          />

          <button
            type="button"
            className="ws-sendBtn"
            disabled={!draft.trim() || busy}
            onClick={submit}
            aria-label="Gửi yêu cầu"
            title="Gửi"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};
