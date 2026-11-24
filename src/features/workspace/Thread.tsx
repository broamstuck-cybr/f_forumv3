import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Copy,
  Eye,
  GitCompareArrows,
  KeyRound,
  RotateCw,
  ShieldCheck,
  Terminal,
  Upload,
} from 'lucide-react';
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
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLPreElement>(null);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);
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

  useEffect(() => {
    if (!busy) {
      setLiveElapsedMs(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setLiveElapsedMs(Date.now() - startedAt);
    }, 100);
    return () => window.clearInterval(timer);
  }, [busy]);

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
          <section className="ws-arena-empty" aria-label="Bắt đầu dựng cùng AI">
            <h2 className="ws-arena-empty-title">
              Bắt đầu dựng <em>cùng AI.</em>
            </h2>
            <p className="ws-arena-empty-sub">
              Mô tả giao diện hoặc thành phần bạn muốn xây dựng. Khung Xem trực tiếp và Mã nguồn sẽ tự mở ngay khi tệp web được tạo hoặc nạp từ Kho mẫu.
            </p>
            {starters.length > 0 && onUseStarter && (
              <div className="ws-arena-starters" aria-label="Gợi ý bắt đầu">
                <span className="ws-arena-starters-label">Bắt đầu nhanh</span>
                <div className="ws-arena-starters-grid">
                  {starters.map((starter) => (
                    <button
                      key={starter.label}
                      type="button"
                      className="ws-arena-starter"
                      onClick={() => onUseStarter(starter.prompt)}
                    >
                      <span className="ws-arena-starter-label">{starter.label}</span>
                      <span className="ws-arena-starter-note">{starter.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(onOpenByok || onOpenExplore || onOpenUpload) && (
              <div className="ws-arena-empty-pills">
                {onOpenByok && (
                  <button
                    type="button"
                    className="ws-arena-quick-pill ws-arena-quick-pill--accent"
                    onClick={onOpenByok}
                  >
                    <KeyRound size={14} aria-hidden="true" />
                    <span>Khóa riêng (BYOK)</span>
                  </button>
                )}
                {onOpenExplore && (
                  <button
                    type="button"
                    className="ws-arena-quick-pill"
                    onClick={onOpenExplore}
                  >
                    <Compass size={14} aria-hidden="true" />
                    <span>Kho 8.322 mẫu</span>
                  </button>
                )}
                {onOpenUpload && (
                  <button
                    type="button"
                    className="ws-arena-quick-pill"
                    onClick={onOpenUpload}
                  >
                    <Upload size={14} aria-hidden="true" />
                    <span>Nạp tệp HTML/CSS</span>
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
                      <ChevronDown size={13} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={13} aria-hidden="true" />
                    )}
                    <Terminal size={13} aria-hidden="true" />
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
                              <Eye size={12} aria-hidden="true" />
                              <span>Xem trực tiếp</span>
                            </button>
                          )}
                          {onOpenDiff && (
                            <button type="button" className="ws-artifact-jump" onClick={onOpenDiff}>
                              <GitCompareArrows size={12} aria-hidden="true" />
                              <span>Đối chiếu</span>
                            </button>
                          )}
                          {onOpenChecks && (
                            <button type="button" className="ws-artifact-jump" onClick={onOpenChecks}>
                              <ShieldCheck size={12} aria-hidden="true" />
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
                      <KeyRound size={12} aria-hidden="true" />
                      <span>Cài đặt → Khóa riêng (BYOK)</span>
                    </button>
                  )}
                  {onOpenExplore && (
                    <button
                      type="button"
                      className="ws-arena-quick-pill ws-arena-quick-pill--sm"
                      onClick={onOpenExplore}
                    >
                      <Compass size={12} aria-hidden="true" />
                      <span>Mở Kho 8.322 mẫu</span>
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
                    title={copiedId === message.id ? 'Đã chép' : 'Chép nội dung'}
                    onClick={() => void handleCopyContent(message.id, plainContent)}
                  >
                    {copiedId === message.id ? (
                      <Check size={13} aria-hidden="true" />
                    ) : (
                      <Copy size={13} aria-hidden="true" />
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
                      <RotateCw size={13} aria-hidden="true" />
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
                      <RotateCw size={13} aria-hidden="true" />
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
                <Terminal size={13} aria-hidden="true" />
                <span>
                  Đang chạy {modelUsed ? `(${modelUsed})` : ''} · {(liveElapsedMs / 1000).toFixed(1)}s
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
