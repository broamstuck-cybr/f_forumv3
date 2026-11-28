import React, { useEffect, useRef, useState } from 'react';
import {
  loadShowcaseFullPrompt,
  pickRandomChatShowcase,
  type ChatLandingShowcaseItem,
} from '../../data/chatLandingShowcase';
import { BRAND_PALETTES } from '../../engine/motionCraftPack';
import type { ComposeStreamProgress } from '../../engine/repoWebComposer';
import { handleLiquidPointerLeave, handleLiquidPointerMove } from '../../utils/liquidGlassPointer';
import type { AIProtocol, BYOKConfig, PublicAiRuntimeInfo, SuggestedVaultItem } from '../../types/index';
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

const DEFAULT_SERVER_MODELS: Array<{ id: string; label: string }> = [
  { id: 'openrouter/auto-smart', label: 'Tự động tiết kiệm' },
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2' },
  { id: 'qwen/qwen3-coder-next', label: 'Qwen3 Coder Next' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron 3 Ultra (Free)' },
  { id: 'openrouter/free', label: 'OpenRouter Free' },
];

function detectPresetId(byok?: BYOKConfig): string {
  if (!byok || (!byok.enabled && !byok.apiKey.trim())) return 'openrouter';
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
  streamProgress?: ComposeStreamProgress | null;
  errorMessage: string | null;
  canUndo: boolean;
  hasGeneratedHtml: boolean;
  canUseAi: boolean;
  selectedModel: string;
  aiRuntime?: PublicAiRuntimeInfo | null;
  byok?: BYOKConfig;
  onChangeModel: (model: string) => void;
  onSaveByok: (next: BYOKConfig) => void;
  onRequireAuth: () => void;
  onSendPrompt: (text: string) => void;
  onStopGeneration?: () => void;
  onUseSuggestedResource?: (item: SuggestedVaultItem) => void;
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

const VAULT_LIBRARY_LABELS: Record<string, string> = {
  pinui: 'Pin UI',
  threeui: 'ThreeUI 3D',
  lucianlabs: 'lucianLabs',
  motionsites: 'MotionSites',
  codefronts: 'CodeFronts',
};

const QUICK_EDIT_CHIPS = [
  'Đổi nền sáng/tối',
  'Tối ưu di động',
  'Thêm hiệu ứng',
  'Làm gọn bố cục',
  'Thêm tương tác',
];

const QUICK_ASK_PROMPT =
  'F-Forum có những mẫu kính lỏng hoặc 3D nào đẹp để tham khảo? Giải thích nhanh cấu trúc dự án f_forumv3';

export const AgentChatPane: React.FC<AgentChatPaneProps> = ({
  profile,
  messages,
  busy,
  streamProgress = null,
  errorMessage,
  canUndo,
  hasGeneratedHtml,
  canUseAi,
  selectedModel,
  aiRuntime,
  byok,
  onChangeModel,
  onSaveByok,
  onRequireAuth,
  onSendPrompt,
  onStopGeneration,
  onUseSuggestedResource,
  onRetryLast,
  onUndo,
  onFeedback,
  onEditOnboarding,
  onInspectFile,
}) => {
  const [draft, setDraft] = useState('');
  const [prefilledFlash, setPrefilledFlash] = useState(false);
  const [openTraceIds, setOpenTraceIds] = useState<Record<string, boolean>>({});
  const [visualStarters, setVisualStarters] = useState<ChatLandingShowcaseItem[]>(() =>
    pickRandomChatShowcase(4)
  );
  const [shuffleSpin, setShuffleSpin] = useState(0);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [byokOpen, setByokOpen] = useState(false);
  const [presetId, setPresetId] = useState<string>(() => detectPresetId(byok));
  const [keyInput, setKeyInput] = useState<string>(() => byok?.apiKey || '');
  const [urlInput, setUrlInput] = useState<string>(
    () => byok?.baseUrl || PROVIDER_PRESETS[1].baseUrl
  );
  const [customModelInput, setCustomModelInput] = useState<string>(
    () => byok?.model || PROVIDER_PRESETS[1].defaultModel
  );
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const pickRequestRef = useRef(0);

  const hasActiveByok = Boolean(byok?.enabled && byok.apiKey.trim());
  const activePreset =
    PROVIDER_PRESETS.find((p) => p.id === (hasActiveByok ? detectPresetId(byok) : presetId)) ||
    PROVIDER_PRESETS[1];

  const serverModels =
    aiRuntime && aiRuntime.availableModels.length > 0
      ? aiRuntime.availableModels.map((m) => ({ id: m.id, label: m.label }))
      : DEFAULT_SERVER_MODELS;

  const availableModels = (() => {
    const base = hasActiveByok ? [...activePreset.models] : [...serverModels];
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
    const defaultSrv = aiRuntime?.defaultModel || 'openrouter/auto-smart';
    onSaveByok({
      enabled: false,
      protocol: byok?.protocol || 'openai-compatible',
      baseUrl: byok?.baseUrl || PROVIDER_PRESETS[1].baseUrl,
      model: byok?.model || defaultSrv,
      apiKey: '',
    });
    setKeyInput('');
    onChangeModel(defaultSrv);
    setByokOpen(false);
  };

  useEffect(() => {
    if (messages.length === 0 && !busy) return;
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy, streamProgress?.activeFiles.length]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(160, Math.max(40, el.scrollHeight))}px`;
  }, [draft]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const fillComposer = (text: string) => {
    setDraft(text);
    setPrefilledFlash(true);
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => {
      setPrefilledFlash(false);
      flashTimerRef.current = null;
    }, 950);
    window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const len = text.length;
      el.setSelectionRange(len, len);
      el.scrollTop = 0;
    });
  };

  const handlePickShowcaseCard = async (item: ChatLandingShowcaseItem) => {
    const reqId = ++pickRequestRef.current;
    setLoadingCardId(item.id);
    try {
      const promptText = await loadShowcaseFullPrompt(item);
      if (pickRequestRef.current !== reqId) return;
      fillComposer(promptText);
    } catch {
      if (pickRequestRef.current !== reqId) return;
      fillComposer(item.prompt);
    } finally {
      if (pickRequestRef.current === reqId) {
        setLoadingCardId(null);
      }
    }
  };

  const submit = () => {
    const clean = draft.trim();
    if (!clean || busy) return;
    setDraft('');
    onSendPrompt(clean);
  };

  const toggleTrace = (id: string) => {
    setOpenTraceIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShuffleVisuals = () => {
    setVisualStarters((prev) =>
      pickRandomChatShowcase(
        4,
        prev.map((item) => item.id)
      )
    );
    setShuffleSpin((n) => n + 1);
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  const contextSummary = profile?.siteName
    ? `${ROLE_LABELS[profile.role]} · ${profile.siteName} · ${BRAND_PALETTES[profile.personality].label}`
    : 'Workspace AI · Tự thiết kế & lập trình đa tệp';

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
            <div className="ws-chat__emptyIntro">
              <h2>Bắt đầu dựng trang</h2>
              <p>Chọn mẫu gợi ý để điền prompt chi tiết hoặc tự mô tả ý tưởng.</p>
            </div>

            <div className="ws-visualBlock">
              <div className="ws-visualHead">
                <span className="ws-visualHead__label">Ý tưởng tham khảo</span>
                <button
                  type="button"
                  className="ws-iconBtn ws-iconBtn--sm ws-visualShuffle lg-pill"
                  onClick={handleShuffleVisuals}
                  aria-label="Đổi ý tưởng ngẫu nhiên"
                  title="Đổi gợi ý"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m18 14 4 4-4 4" />
                    <path d="m18 2 4 4-4 4" />
                    <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
                    <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
                    <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
                  </svg>
                </button>
              </div>

              <div className="ws-visualGrid" key={shuffleSpin}>
                {visualStarters.map((item) => {
                  const isCardLoading = loadingCardId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`ws-visualCard${isCardLoading ? ' is-loading' : ''}`}
                      data-card-trigger="true"
                      aria-busy={isCardLoading}
                      onClick={() => void handlePickShowcaseCard(item)}
                      aria-label={`Điền prompt mẫu ${item.title}`}
                    >
                      <img
                        src={item.image}
                        alt={`Ý tưởng giao diện ${item.title}`}
                        loading="eager"
                        decoding="async"
                      />
                      <span className="ws-visualCard__tag">{item.category}</span>
                      <div className="ws-visualCard__scrim">
                        <span className="ws-visualCard__title">{item.title}</span>
                        <span className="ws-visualCard__cta" aria-hidden="true">
                          {isCardLoading ? 'Đang nạp...' : 'Điền prompt'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ws-quickAskRow">
              <button
                type="button"
                className="ws-quickAskBtn lg-pill"
                onClick={() => onSendPrompt(QUICK_ASK_PROMPT)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                <span>Hỏi kho mẫu</span>
              </button>
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
          const matchedList = msg.matchedResources ?? [];
          const rawRecipe = msg.motionSignature?.trim() || '';
          const recipeLabel =
            rawRecipe && !rawRecipe.startsWith('AI ·')
              ? rawRecipe.replace(/^Motion Craft:\s*/i, '').trim()
              : '';
          const hasTraceBlock = Boolean(
            vaultStep || matchedList.length > 0 || recipeLabel || checkStep
          );
          const hasTraceDetail = Boolean(
            matchedList.length > 0 || checkStep || vaultStep?.detail
          );
          const isOpen = Boolean(openTraceIds[msg.id]);

          return (
            <article key={msg.id} className="ws-msg ws-msg--ai">
              <p className="ws-aiText">{msg.text}</p>

              {hasTraceBlock && (
                <div className="ws-traceBlock">
                  {hasTraceDetail ? (
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
                      <span>
                        {vaultStep?.label ||
                          (matchedList.length > 0
                            ? `Đã ghép ${matchedList.length} mô-đun Vault`
                            : 'Nguồn lắp ghép đã dùng')}
                      </span>
                    </button>
                  ) : (
                    <div className="ws-traceHeadLabel">
                      {vaultStep?.label || 'Nguồn lắp ghép đã dùng'}
                    </div>
                  )}

                  {(matchedList.length > 0 || recipeLabel) && (
                    <div className="ws-tracePills" aria-label="Mô-đun Vault và công thức đã ghép">
                      {matchedList.map((res) => (
                        <span
                          key={`${msg.id}-pill-${res.id}`}
                          className="ws-tracePill"
                          title={res.reason ? `${res.title}: ${res.reason}` : res.title}
                        >
                          <span className="ws-libTag">
                            {VAULT_LIBRARY_LABELS[res.library] || res.library}
                          </span>
                          <span className="ws-tracePill__title">{res.title}</span>
                        </span>
                      ))}
                      {recipeLabel && (
                        <span
                          className="ws-tracePill ws-tracePill--recipe"
                          title="Công thức chuyển động từ Source of Knowledge"
                        >
                          <span className="ws-libTag ws-libTag--recipe">Knowledge</span>
                          <span className="ws-tracePill__title">{recipeLabel}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {isOpen && hasTraceDetail && (
                    <div className="ws-traceDetail">
                      {matchedList.length > 0 && (
                        <ul className="ws-matchedList">
                          {matchedList.map((res) => (
                            <li key={`${msg.id}-${res.id}`}>
                              <span className="ws-libTag">
                                {VAULT_LIBRARY_LABELS[res.library] || res.library}
                              </span>
                              <span className="ws-resTitle">{res.title}</span>
                              {res.reason && <span className="ws-resReason">{res.reason}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                      {vaultStep?.detail && matchedList.length === 0 && (
                        <div className="ws-resReason">{vaultStep.detail}</div>
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

              {msg.mode === 'assistant' && msg.suggestedResources && msg.suggestedResources.length > 0 && (
                <div className="ws-suggestGrid" aria-label="Mẫu kho F-Forum gợi ý">
                  {msg.suggestedResources.map((item) => (
                    <div key={`${msg.id}-sug-${item.id}`} className="ws-suggestCard">
                      <div className="ws-suggestCard__meta">
                        <span className="ws-libTag">{VAULT_LIBRARY_LABELS[item.library] || item.library}</span>
                        <strong className="ws-suggestCard__title">{item.title}</strong>
                        {item.reason && <span className="ws-suggestCard__reason">{item.reason}</span>}
                      </div>
                      {onUseSuggestedResource && (
                        <button
                          type="button"
                          className="ws-miniBtn ws-miniBtn--primary"
                          disabled={busy}
                          onClick={() => onUseSuggestedResource(item)}
                        >
                          Ghép mẫu
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="ws-aiFoot">
                {msg.modelUsed && <span>{msg.modelUsed.replace(/^.*\//, '')}</span>}
                {typeof msg.tokensTotal === 'number' && msg.tokensTotal > 0 && (
                  <span>{msg.tokensTotal.toLocaleString('vi-VN')} token</span>
                )}
                {typeof msg.durationMs === 'number' && (
                  <span>{(msg.durationMs / 1000).toFixed(1)}s</span>
                )}
              </div>
            </article>
          );
        })}

        {busy && (
          <div className="ws-streamCard" role="status" aria-live="polite">
            <div className="ws-streamCard__head">
              <span className="ws-thinking__dot" aria-hidden="true" />
              <span className="ws-streamCard__stage">
                {streamProgress?.stage === 'checking'
                  ? 'Đang kiểm tra và biên dịch bản xem trước...'
                  : streamProgress?.stage === 'generating'
                    ? 'AI đang tự thiết kế và viết mã...'
                    : 'Đang kết nối tới model AI...'}
              </span>
              {streamProgress?.model && streamProgress.model !== 'auto' && (
                <span className="ws-streamCard__model">
                  {streamProgress.model.replace(/^.*\//, '')}
                </span>
              )}
            </div>

            {streamProgress?.summaryPreview && (
              <p className="ws-streamCard__summary">{streamProgress.summaryPreview}</p>
            )}

            {streamProgress && streamProgress.activeFiles.length > 0 && (
              <div className="ws-streamFiles">
                {streamProgress.activeFiles.map((sf) => (
                  <div
                    key={sf.path}
                    className={`ws-streamFileRow${sf.done ? ' is-done' : ' is-writing'}`}
                  >
                    <span className="ws-streamFileRow__left">
                      {sf.done ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="ws-streamFileRow__pulse" aria-hidden="true" />
                      )}
                      <span>
                        {sf.action === 'patch' ? 'Patching' : sf.done ? 'Wrote' : 'Writing'} {sf.path}
                      </span>
                    </span>
                    <span className="ws-streamFileRow__lines">{sf.lines} dòng</span>
                  </div>
                ))}
              </div>
            )}
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
              Đăng nhập hoặc gắn API Key riêng để AI trực tiếp thiết kế và lập trình theo yêu cầu.
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
          className={`ws-composer lg-glass lg-glass--matte${prefilledFlash ? ' is-prefilled' : ''}`}
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
                ? 'Nhắn yêu cầu chỉnh sửa hoặc hỏi Trợ lý...'
                : 'Mô tả trang web hoặc ứng dụng bạn muốn AI lập trình...'
            }
            aria-label="Nhập yêu cầu cho AI"
          />

          {busy && onStopGeneration ? (
            <button
              type="button"
              className="ws-stopBtn"
              onClick={onStopGeneration}
              aria-label="Dừng AI đang tạo"
              title="Dừng"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="5" y="5" width="14" height="14" rx="2.5" />
              </svg>
            </button>
          ) : (
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
          )}
        </div>
      </div>
    </section>
  );
};
