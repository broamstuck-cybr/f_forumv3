import React, { useEffect, useRef, useState } from 'react';
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCompass,
  IconCopy,
  IconEye,
  IconGitCompareArrows,
  IconKeyRound,
  IconLayoutDashboard,
  IconLayoutTemplate,
  IconRotateCw,
  IconScanSearch,
  IconShieldCheck,
  IconTerminal,
  IconToggleRight,
  IconUpload,
  type IconComponent,
} from '../../ui/icons';
import type { AIActivityState, AIStreamingStage, ChatMessage } from '../../types/index';
import { formatClock } from './time';

interface ThreadProps {
  messages: ChatMessage[];
  activity: AIActivityState;
  streamingStage: AIStreamingStage;
  streamingPreview: string;
  modelUsed: string | null;
  userName: string;
  onOpenByok?: () => void;
  onOpenExplore?: () => void;
  onOpenUpload?: () => void;
  onOpenFile: (path: string) => void;
  onOpenPreview?: () => void;
  onOpenDiff?: () => void;
  onOpenChecks?: () => void;
  checksPassLabel?: string;
  onRetry: () => void;
  onRegenerate: () => void;
  canRetry: boolean;
  canRegenerate: boolean;
  starters?: Array<{ label: string; note: string; prompt: string }>;
  onUseStarter?: (prompt: string) => void;
  welcome?: boolean;
}

const STARTER_ICONS: IconComponent[] = [
  IconLayoutTemplate,
  IconLayoutDashboard,
  IconToggleRight,
  IconScanSearch,
];

function trackSpotlight(event: React.PointerEvent<HTMLElement>) {
  const node = event.currentTarget;
  const rect = node.getBoundingClientRect();
  node.style.setProperty('--ws-mx', `${event.clientX - rect.left}px`);
  node.style.setProperty('--ws-my', `${event.clientY - rect.top}px`);
}

const MODE_TAG = /^\[Mode:\s*([A-Za-z]+)\]\s*/i;

const MODE_LABELS: Record<string, string> = {
  build: 'Build',
  refine: 'Refine',
  audit: 'Audit',
};

const STREAM_STEPS: Array<{ id: 'routing' | 'generating' | 'checking'; label: string }> = [
  { id: 'routing', label: 'Định tuyến' },
  { id: 'generating', label: 'Sinh mã' },
  { id: 'checking', label: 'Kiểm định' },
];

export function stripModeTag(content: string): string {
  return content.replace(MODE_TAG, '');
}

export function extractModeLabel(content: string): string | null {
  const match = MODE_TAG.exec(content);
  if (!match) return null;
  const key = match[1].toLowerCase();
  return MODE_LABELS[key] || match[1];
}

function stepRank(stage: AIStreamingStage): number {
  if (stage === 'routing') return 0;
  if (stage === 'generating') return 1;
  if (stage === 'checking') return 2;
  if (stage === 'done') return 3;
  return -1;
}

const StreamingElapsedTimer: React.FC = React.memo(() => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <span className="ws-stream-elapsed">{elapsedSeconds}s</span>;
});

StreamingElapsedTimer.displayName = 'StreamingElapsedTimer';

export const Thread: React.FC<ThreadProps> = ({
  messages,
  activity,
  streamingStage,
  streamingPreview,
  modelUsed,
  onOpenByok,
  onOpenExplore,
  onOpenUpload,
  onOpenFile,
  onOpenPreview,
  onOpenDiff,
  onOpenChecks,
  checksPassLabel,
  onRetry,
  onRegenerate,
  canRetry,
  canRegenerate,
  starters = [],
  onUseStarter,
  welcome = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLPreElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const busy = activity === 'thinking' || activity === 'streaming';
  const failed = activity === 'error';
  const untouched = messages.every((message) => message.role !== 'user');

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length, activity, streamingPreview]);

  useEffect(() => {
    const pre = previewRef.current;
    if (pre) {
      pre.scrollTop = pre.scrollHeight;
    }
  }, [streamingPreview]);

  const handleCopyContent = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    } catch {
      return;
    }
  };

  const toggleToolGroup = (id: string) => {
    setExpandedTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const lastMessage = messages[messages.length - 1];
  const lastAssistantId = [...messages].reverse().find((message) => message.role === 'assistant')?.id;
  const activeRank = stepRank(streamingStage);

  return (
    <div ref={scrollRef} className="ws-scroll">
      <div className="ws-measure ws-arena-stream">
        {untouched && !busy && (
          <section
            className="ws-welcome"
            aria-label="Bắt đầu dựng cùng AI"
            data-variant={welcome ? 'canvas' : 'panel'}
          >
            <header className="ws-welcome-head">
              <h2 className="ws-welcome-title">
                Dựng giao diện thật, <em>từ một câu mô tả.</em>
              </h2>
              <p className="ws-welcome-sub">
                Khung Live View và Mã nguồn tự động mở khi có tệp HTML, CSS hoặc JS được tạo ra hoặc nạp từ Kho mẫu.
              </p>
            </header>

            {starters.length > 0 && onUseStarter && (
              <ul className="ws-welcome-cards" aria-label="Gợi ý bắt đầu">
                {starters.map((starter, index) => {
                  const Icon = STARTER_ICONS[index % STARTER_ICONS.length];
                  return (
                    <li key={starter.label} className="ws-welcome-cell">
                      <article className="ws-welcome-card" onPointerMove={trackSpotlight}>
                        <span className="ws-welcome-card-icon" aria-hidden="true">
                          <Icon size={18} />
                        </span>
                        <span className="ws-welcome-card-body">
                          <span className="ws-welcome-card-label">{starter.label}</span>
                          <span className="ws-welcome-card-note">{starter.note}</span>
                        </span>
                        <p className="ws-welcome-card-prompt">{starter.prompt}</p>
                        <div className="ws-welcome-card-foot">
                          <button
                            type="button"
                            className="ws-welcome-card-trigger"
                            data-card-trigger
                            aria-label={`Dùng mẫu ${starter.label}`}
                            onClick={() => onUseStarter(starter.prompt)}
                          >
                            Dùng mẫu
                          </button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}

            {(onOpenExplore || onOpenUpload) && (
              <div className="ws-welcome-actions" role="group" aria-label="Nguồn bắt đầu khác">
                {onOpenExplore && (
                  <button type="button" className="ws-welcome-action" onClick={onOpenExplore}>
                    <IconCompass size={15} />
                    <span>Kho mẫu</span>
                  </button>
                )}
                {onOpenUpload && (
                  <button type="button" className="ws-welcome-action" onClick={onOpenUpload}>
                    <IconUpload size={15} />
                    <span>Nạp tệp</span>
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {messages.map((message) => {
          if (untouched && (message.role === 'system' || message.id === 'msg-welcome')) {
            return null;
          }

          const isUser = message.role === 'user';
          const isLatestAssistant =
            !busy &&
            !untouched &&
            message.role === 'assistant' &&
            message.id === lastAssistantId &&
            message === lastMessage;
          const plainContent = isUser ? stripModeTag(message.content) : message.content;
          const hasChangedFiles = Boolean(message.changedFiles && message.changedFiles.length > 0);
          const isToolExpanded = Boolean(expandedTools[message.id]);

          if (isUser) {
            return (
              <div key={message.id} className="ws-arena-user-row">
                <div className="ws-arena-user-bubble">{plainContent}</div>
              </div>
            );
          }

          return (
            <article key={message.id} className="ws-arena-assistant-turn" data-role={message.role}>
              {hasChangedFiles && (
                <div className="ws-arena-tool-block">
                  <button
                    type="button"
                    className="ws-arena-tool-toggle"
                    aria-expanded={isToolExpanded}
                    onClick={() => toggleToolGroup(message.id)}
                  >
                    {isToolExpanded ? (
                      <IconChevronDown size={13} />
                    ) : (
                      <IconChevronRight size={13} />
                    )}
                    <IconTerminal size={13} />
                    <span>
                      Đã cập nhật {message.changedFiles!.length} tệp{checksPassLabel ? ` · ${checksPassLabel}` : ''}
                    </span>
                  </button>

                  {isToolExpanded && (
                    <div className="ws-arena-tool-body">
                      <ul className="ws-turn-files" aria-label="Tệp đã cập nhật">
                        {message.changedFiles!.map((filePath) => (
                          <li key={filePath}>
                            <button
                              type="button"
                              className="ws-file-pill"
                              onClick={() => onOpenFile(filePath)}
                            >
                              {filePath}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {(onOpenPreview || onOpenDiff || onOpenChecks) && (
                        <div className="ws-artifact-jumps" role="group" aria-label="Mở nhanh bản dựng">
                          {onOpenPreview && (
                            <button type="button" className="ws-artifact-jump" onClick={onOpenPreview}>
                              <IconEye size={12} />
                              <span>Live View</span>
                            </button>
                          )}
                          {onOpenDiff && (
                            <button type="button" className="ws-artifact-jump" onClick={onOpenDiff}>
                              <IconGitCompareArrows size={12} />
                              <span>Đối chiếu</span>
                            </button>
                          )}
                          {onOpenChecks && (
                            <button type="button" className="ws-artifact-jump" onClick={onOpenChecks}>
                              <IconShieldCheck size={12} />
                              <span>Kiểm định</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="ws-arena-assistant-prose">{plainContent}</div>

              {message.fallback && (onOpenByok || onOpenExplore) && (
                <div className="ws-turn-actions">
                  {onOpenByok && (
                    <button
                      type="button"
                      className="ws-arena-quick-pill ws-arena-quick-pill--sm"
                      onClick={onOpenByok}
                    >
                      <IconKeyRound size={12} />
                      <span>Khóa BYOK</span>
                    </button>
                  )}
                  {onOpenExplore && (
                    <button
                      type="button"
                      className="ws-arena-quick-pill ws-arena-quick-pill--sm"
                      onClick={onOpenExplore}
                    >
                      <IconCompass size={12} />
                      <span>Kho mẫu</span>
                    </button>
                  )}
                </div>
              )}

              <footer className="ws-arena-turn-foot">
                <div className="ws-arena-foot-left">
                  <button
                    type="button"
                    className="ws-arena-ghost-icon"
                    aria-label="Chép nội dung"
                    title={copiedId === message.id ? 'Đã chép' : 'Sao chép'}
                    onClick={() => void handleCopyContent(message.id, plainContent)}
                  >
                    {copiedId === message.id ? (
                      <IconCheck size={13} />
                    ) : (
                      <IconCopy size={13} />
                    )}
                  </button>

                  {isLatestAssistant && (
                    <button
                      type="button"
                      className="ws-arena-ghost-icon"
                      aria-label="Tạo lại phản hồi"
                      title="Tạo lại"
                      onClick={onRegenerate}
                      disabled={!canRegenerate}
                    >
                      <IconRotateCw size={13} />
                    </button>
                  )}

                  {failed && message === lastMessage && (
                    <button
                      type="button"
                      className="ws-arena-ghost-icon"
                      aria-label="Thử lại"
                      title="Thử lại"
                      onClick={onRetry}
                      disabled={!canRetry}
                    >
                      <IconRotateCw size={13} />
                    </button>
                  )}
                </div>

                <span className="ws-arena-foot-meta">
                  {message.modelUsed ? `${message.modelUsed} · ` : ''}
                  {formatClock(message.createdAt)}
                </span>
              </footer>
            </article>
          );
        })}

        <div role="status" aria-live="polite">
          {busy && (
            <div className="ws-arena-assistant-turn ws-stream-card">
              <div className="ws-arena-tool-toggle">
                <IconTerminal size={13} />
                <span>
                  Đang chạy {modelUsed ? `(${modelUsed})` : ''} · <StreamingElapsedTimer />
                </span>
                <ol className="ws-stage-steps" aria-label="Tiến trình sinh mã">
                  {STREAM_STEPS.map((step, idx) => {
                    const state =
                      idx < activeRank ? 'done' : idx === activeRank ? 'active' : 'pending';
                    return (
                      <li key={step.id} className="ws-stage-step" data-state={state}>
                        {step.label}
                      </li>
                    );
                  })}
                </ol>
              </div>
              {streamingPreview ? (
                <pre ref={previewRef} className="ws-stream-preview">
                  <code>{streamingPreview}</code>
                  <span className="ws-caret" aria-hidden="true" />
                </pre>
              ) : (
                <p className="ws-arena-assistant-prose">
                  {streamingStage === 'checking'
                    ? 'Đang chạy kiểm định 6 lớp...'
                    : streamingStage === 'generating'
                      ? 'Đang sinh mã HTML, CSS, JS...'
                      : 'Đang định tuyến Model và ngữ cảnh...'}
                  <span className="ws-caret" aria-hidden="true" />
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
