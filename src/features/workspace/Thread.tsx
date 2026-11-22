import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  FileCode2,
  GitCompareArrows,
  RotateCw,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import type { AIActivityState, AIStreamingStage, ChatMessage } from '../../types/index';
import { formatClock } from './time';

export interface StarterPrompt {
  label: string;
  prompt: string;
}

export interface ArenaCandidateResult {
  modelId: string;
  modelLabel: string;
  protocolUsed?: string;
  status: 'running' | 'done';
  message: string;
  files: Array<{ path: string; content: string; summary?: string }>;
  elapsedMs: number;
  tokenEstimate: number;
  fallback?: boolean;
}

export interface ArenaComparisonTurn {
  id: string;
  userMessageId?: string;
  prompt: string;
  createdAt: string;
  candidateA: ArenaCandidateResult;
  candidateB: ArenaCandidateResult;
  appliedSide: 'A' | 'B';
}

interface ThreadProps {
  messages: ChatMessage[];
  arenaTurns: ArenaComparisonTurn[];
  onApplyArenaCandidate: (turnId: string, side: 'A' | 'B', openFilePath?: string) => void;
  activity: AIActivityState;
  streamingStage: AIStreamingStage;
  streamingPreview: string;
  modelUsed: string | null;
  userName: string;
  starters: StarterPrompt[];
  onPickStarter: (prompt: string) => void;
  onOpenFile: (path: string) => void;
  onOpenPreview?: () => void;
  onOpenDiff?: () => void;
  onOpenChecks?: () => void;
  checksPassLabel?: string;
  onRetry: () => void;
  onRegenerate: () => void;
  canRetry: boolean;
  canRegenerate: boolean;
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

function estimateElapsedLabel(message: ChatMessage, index: number): string {
  const filesCount = message.changedFiles?.length || 1;
  const tenths = 6 + ((index * 3 + filesCount * 2) % 9);
  return `${(tenths / 10).toFixed(1)}s`;
}

export const Thread: React.FC<ThreadProps> = ({
  messages,
  arenaTurns,
  onApplyArenaCandidate,
  activity,
  streamingStage,
  streamingPreview,
  modelUsed,
  starters,
  onPickStarter,
  onOpenFile,
  onOpenPreview,
  onOpenDiff,
  onOpenChecks,
  checksPassLabel,
  onRetry,
  onRegenerate,
  canRetry,
  canRegenerate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLPreElement>(null);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const busy = activity === 'thinking' || activity === 'streaming';
  const failed = activity === 'error';
  const untouched = messages.every((message) => message.role !== 'user') && arenaTurns.length === 0;

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length, arenaTurns.length, activity, streamingPreview]);

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

  const renderArenaCard = (
    turn: ArenaComparisonTurn,
    side: 'A' | 'B',
    candidate: ArenaCandidateResult
  ) => {
    const isApplied = turn.appliedSide === side;
    const isRunning = candidate.status === 'running';
    const cardCopyId = `${turn.id}-${side}`;
    const previewFile =
      candidate.files.find((f) => f.path === 'styles.css') ||
      candidate.files.find((f) => f.path === 'index.html') ||
      candidate.files[0];
    const snippet = previewFile
      ? previewFile.content.split(/\r?\n/).slice(0, 7).join('\n')
      : '';

    return (
      <article
        key={cardCopyId}
        className="ws-arena-card"
        data-side={side}
        data-applied={isApplied ? 'true' : undefined}
      >
        <header className="ws-arena-card-head">
          <div className="ws-arena-card-title">
            <span className="ws-arena-badge">{side}</span>
            <strong className="ws-arena-model">{candidate.modelLabel}</strong>
          </div>
          <div className="ws-arena-metrics">
            <span className="ws-pill-meta">
              {isRunning ? 'Đang chạy...' : `${(candidate.elapsedMs / 1000).toFixed(2)}s`}
            </span>
            {!isRunning && (
              <span className="ws-pill-meta">~{candidate.tokenEstimate} tok</span>
            )}
          </div>
        </header>

        <p className="ws-arena-body">{candidate.message}</p>

        {candidate.files.length > 0 && (
          <ul className="ws-turn-files" aria-label={`Tệp từ Model ${side}`}>
            {candidate.files.map((file) => (
              <li key={file.path}>
                <button
                  type="button"
                  className="ws-file-pill"
                  onClick={() => onApplyArenaCandidate(turn.id, side, file.path)}
                >
                  {file.path}
                </button>
              </li>
            ))}
          </ul>
        )}

        {snippet && (
          <pre className="ws-arena-snippet">
            <code>{snippet}</code>
          </pre>
        )}

        <footer className="ws-arena-card-foot">
          <span className="ws-arena-active-tag">
            {isApplied ? 'Đang hiển thị' : 'Phương án chờ'}
          </span>
          <div className="ws-arena-card-actions">
            <button
              type="button"
              className="ws-icon-pill ws-icon-pill--sm"
              aria-label={`Chép phản hồi Model ${side}`}
              title={copiedId === cardCopyId ? 'Đã chép' : `Chép phản hồi Model ${side}`}
              data-active={copiedId === cardCopyId ? 'true' : undefined}
              onClick={() => void handleCopyContent(cardCopyId, candidate.message)}
            >
              {copiedId === cardCopyId ? (
                <Check size={13} aria-hidden="true" />
              ) : (
                <Copy size={13} aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              className={`ws-icon-pill ws-icon-pill--sm ${isApplied ? 'ws-icon-pill--active' : 'ws-icon-pill--accent'}`}
              disabled={isRunning}
              aria-pressed={isApplied}
              aria-label={isApplied ? `Đang áp dụng Model ${side}` : `Áp dụng Model ${side} vào Live View`}
              title={isApplied ? 'Đang áp dụng trên Live View' : 'Áp dụng bản này vào Live View'}
              onClick={() => onApplyArenaCandidate(turn.id, side)}
            >
              <Check size={13} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </article>
    );
  };

  return (
    <div ref={scrollRef} className="ws-scroll">
      <div className="ws-measure ws-arena-stream">
        {untouched && !busy && (
          <section className="ws-arena-empty" aria-label="Khởi tạo phiên so sánh">
            <h2 className="ws-arena-empty-title">
              Từ ý tưởng <em>đến bản dựng.</em>
            </h2>
            <p className="ws-arena-empty-sub">
              Mô tả giao diện hoặc chọn một mẫu khởi đầu bên dưới để tạo mã nguồn & kiểm định ngay.
            </p>
            <ul className="ws-arena-suggest-list">
              {starters.map((starter) => (
                <li key={starter.label}>
                  <button
                    type="button"
                    className="ws-arena-suggest-row"
                    onClick={() => onPickStarter(starter.prompt)}
                  >
                    <FileCode2 size={15} aria-hidden="true" />
                    <span className="ws-arena-suggest-label">{starter.label}</span>
                    <span className="ws-arena-suggest-preview">{starter.prompt}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {messages.map((message, index) => {
          if (message.role === 'system' && untouched) {
            return null;
          }

          const isUser = message.role === 'user';
          const isLatestAssistant =
            !busy &&
            !untouched &&
            message.role === 'assistant' &&
            message.id === lastAssistantId &&
            message === lastMessage;
          const elapsedLabel =
            message.role === 'assistant' ? estimateElapsedLabel(message, index) : null;
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
                      Ran commands {message.changedFiles!.length} · {checksPassLabel || '6/6 đạt'}
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
                              <span>Preview</span>
                            </button>
                          )}
                          {onOpenDiff && (
                            <button type="button" className="ws-artifact-jump" onClick={onOpenDiff}>
                              <GitCompareArrows size={12} aria-hidden="true" />
                              <span>Diff</span>
                            </button>
                          )}
                          {onOpenChecks && (
                            <button type="button" className="ws-artifact-jump" onClick={onOpenChecks}>
                              <ShieldCheck size={12} aria-hidden="true" />
                              <span>Checks</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="ws-arena-assistant-prose">{plainContent}</div>

              {message.fallback && (
                <p className="ws-turn-flag">
                  Tổng hợp cục bộ. Mở cấu hình BYOK để gắn khóa API riêng.
                </p>
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
                  {elapsedLabel ? `${elapsedLabel} | ` : ''}
                  {formatClock(message.createdAt)}
                </span>
              </footer>
            </article>
          );
        })}

        {arenaTurns.map((turn) => (
          <section
            key={turn.id}
            className="ws-arena-turn"
            aria-label={`So sánh 2 Model: ${turn.prompt}`}
          >
            <div className="ws-arena-user-row">
              <div className="ws-arena-user-bubble">{stripModeTag(turn.prompt)}</div>
            </div>

            <div className="ws-arena-grid">
              {renderArenaCard(turn, 'A', turn.candidateA)}
              {renderArenaCard(turn, 'B', turn.candidateB)}
            </div>
          </section>
        ))}

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
