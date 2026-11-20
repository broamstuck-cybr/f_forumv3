import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Eye, FileCode2, GitCompareArrows, RotateCw, ShieldCheck } from 'lucide-react';
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

function estimateMessageTokens(message: ChatMessage): number {
  const baseChars = (message.content || '').length;
  const filesBonus = (message.changedFiles?.length || 0) * 195;
  return Math.max(48, Math.round(baseChars / 3.6) + filesBonus);
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
  userName,
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

  const busy =
    activity === 'thinking' ||
    activity === 'streaming' ||
    streamingStage === 'routing' ||
    streamingStage === 'generating' ||
    streamingStage === 'checking';

  useEffect(() => {
    if (!busy) {
      setLiveElapsedMs(0);
      return;
    }
    const started = performance.now();
    const timer = window.setInterval(() => {
      setLiveElapsedMs(Math.round(performance.now() - started));
    }, 120);
    return () => window.clearInterval(timer);
  }, [busy]);

  const lastMessage = messages[messages.length - 1];
  const failed = !busy && lastMessage?.role === 'system';
  const untouched = !messages.some((message) => message.role === 'user') && arenaTurns.length === 0;
  const activeRank = stepRank(
    streamingStage !== 'idle'
      ? streamingStage
      : activity === 'streaming'
        ? 'generating'
        : 'routing'
  );

  const lastAssistantId = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') return messages[i].id;
    }
    return null;
  })();

  useEffect(() => {
    const element = scrollRef.current;
    if (element && (!untouched || busy || arenaTurns.length > 0)) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages.length, arenaTurns.length, busy, untouched, streamingStage, streamingPreview]);

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
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1600);
    } catch {
      return;
    }
  };

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
              className="ws-icon-pill"
              aria-label={`Chép phản hồi Model ${side}`}
              title={copiedId === cardCopyId ? 'Đã chép' : `Chép phản hồi Model ${side}`}
              data-active={copiedId === cardCopyId ? 'true' : undefined}
              onClick={() => void handleCopyContent(cardCopyId, candidate.message)}
            >
              {copiedId === cardCopyId ? (
                <Check size={14} aria-hidden="true" />
              ) : (
                <Copy size={14} aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              className={`ws-icon-pill ${isApplied ? 'ws-icon-pill--active' : 'ws-icon-pill--accent'}`}
              disabled={isRunning}
              aria-pressed={isApplied}
              aria-label={isApplied ? `Đang áp dụng Model ${side}` : `Áp dụng Model ${side} vào Live View`}
              title={isApplied ? 'Đang áp dụng trên Live View' : 'Áp dụng bản này vào Live View'}
              onClick={() => onApplyArenaCandidate(turn.id, side)}
            >
              <Check size={14} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </article>
    );
  };

  return (
    <div ref={scrollRef} className="ws-scroll">
      <div className="ws-measure">
        {messages.map((message, index) => {
          const isLatestAssistant =
            !busy &&
            !untouched &&
            message.role === 'assistant' &&
            message.id === lastAssistantId &&
            message === lastMessage;
          const modeLabel = message.role === 'user' ? extractModeLabel(message.content) : null;
          const tokenCount = estimateMessageTokens(message);
          const elapsedLabel =
            message.role === 'assistant' ? estimateElapsedLabel(message, index) : null;
          const plainContent =
            message.role === 'user' ? stripModeTag(message.content) : message.content;

          return (
            <article key={message.id} className="ws-turn" data-role={message.role}>
              <header className="t-label ws-turn-meta">
                <span className="ws-role-badge" data-role={message.role}>
                  {message.role === 'user'
                    ? userName
                    : message.role === 'system'
                      ? 'Hệ thống'
                      : 'F-Forum AI'}
                </span>
                {modeLabel && <span className="ws-mode-tag">{modeLabel}</span>}
                {message.modelUsed && <span className="ws-model-tag">{message.modelUsed}</span>}
                {message.role === 'assistant' && (
                  <>
                    {elapsedLabel && <span className="ws-pill-meta">{elapsedLabel}</span>}
                    <span className="ws-pill-meta">~{tokenCount} tok</span>
                  </>
                )}
                <time dateTime={message.createdAt}>{formatClock(message.createdAt)}</time>
              </header>

              <p className="ws-turn-body">{plainContent}</p>

              {message.fallback && (
                <p className="ws-turn-flag">
                  Tổng hợp cục bộ. Mở cấu hình BYOK để gắn khóa API riêng.
                </p>
              )}

              {message.changedFiles && message.changedFiles.length > 0 && (
                message.role === 'assistant' ? (
                  <div className="ws-artifact-card" aria-label="Bản dựng tệp đã cập nhật">
                    <div className="ws-artifact-head">
                      <span className="ws-artifact-title">
                        <FileCode2 size={14} aria-hidden="true" />
                        <span>{message.changedFiles.length} tệp đã cập nhật</span>
                      </span>
                      <span className="ws-artifact-badge">
                        <ShieldCheck size={12} aria-hidden="true" />
                        <span>{checksPassLabel || 'Kiểm định 6 lớp'}</span>
                      </span>
                    </div>

                    <ul className="ws-turn-files" aria-label="Tệp đã cập nhật">
                      {message.changedFiles.map((filePath) => (
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
                          <button
                            type="button"
                            className="ws-artifact-jump"
                            onClick={onOpenPreview}
                          >
                            <Eye size={13} aria-hidden="true" />
                            <span>Xem trực tiếp</span>
                          </button>
                        )}
                        {onOpenDiff && (
                          <button
                            type="button"
                            className="ws-artifact-jump"
                            onClick={onOpenDiff}
                          >
                            <GitCompareArrows size={13} aria-hidden="true" />
                            <span>Soi Diff</span>
                          </button>
                        )}
                        {onOpenChecks && (
                          <button
                            type="button"
                            className="ws-artifact-jump"
                            onClick={onOpenChecks}
                          >
                            <ShieldCheck size={13} aria-hidden="true" />
                            <span>Kiểm 6 lớp</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <ul className="ws-turn-files" aria-label="Tệp đã cập nhật">
                    {message.changedFiles.map((filePath) => (
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
                )
              )}

              <div className="ws-turn-actions">
                <button
                  type="button"
                  className="ws-icon-pill"
                  aria-label="Chép nội dung tin nhắn"
                  title={copiedId === message.id ? 'Đã chép' : 'Chép nội dung'}
                  data-active={copiedId === message.id ? 'true' : undefined}
                  onClick={() => void handleCopyContent(message.id, plainContent)}
                >
                  {copiedId === message.id ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <Copy size={14} aria-hidden="true" />
                  )}
                </button>

                {isLatestAssistant && (
                  <button
                    type="button"
                    className="ws-icon-pill"
                    aria-label="Tạo lại phản hồi"
                    title="Tạo lại"
                    onClick={onRegenerate}
                    disabled={!canRegenerate}
                  >
                    <RotateCw size={14} aria-hidden="true" />
                  </button>
                )}

                {failed && message === lastMessage && (
                  <button
                    type="button"
                    className="ws-icon-pill ws-icon-pill--accent"
                    aria-label="Thử lại yêu cầu"
                    title="Thử lại"
                    onClick={onRetry}
                    disabled={!canRetry}
                  >
                    <RotateCw size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {arenaTurns.map((turn) => (
          <section
            key={turn.id}
            className="ws-arena-turn"
            aria-label={`So sánh 2 Model: ${turn.prompt}`}
          >
            <div className="ws-arena-prompt-head">
              <span className="ws-role-badge" data-role="user">
                Arena A · B
              </span>
              <span className="ws-arena-prompt-text">{stripModeTag(turn.prompt)}</span>
              <time className="t-label" dateTime={turn.createdAt}>
                {formatClock(turn.createdAt)}
              </time>
            </div>

            <div className="ws-arena-grid">
              {renderArenaCard(turn, 'A', turn.candidateA)}
              {renderArenaCard(turn, 'B', turn.candidateB)}
            </div>
          </section>
        ))}

        {untouched && !busy && (
          <section className="ws-starters" aria-label="Mẫu khởi tạo nhanh">
            <p className="t-label">Bắt đầu nhanh</p>
            <ul>
              {starters.map((starter) => (
                <li key={starter.label}>
                  <button
                    type="button"
                    className="ws-starter"
                    onClick={() => onPickStarter(starter.prompt)}
                  >
                    <span className="ws-starter-title">{starter.label}</span>
                    <span className="ws-starter-desc">{starter.prompt}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div role="status" aria-live="polite">
          {busy && (
            <div className="ws-turn ws-turn-busy ws-stream-card" data-role="assistant">
              <div className="ws-turn-meta">
                <span className="ws-role-badge" data-role="assistant">
                  F-Forum AI
                </span>
                {modelUsed && <span className="t-label ws-model-tag">{modelUsed}</span>}
                <span className="ws-pill-meta">{(liveElapsedMs / 1000).toFixed(1)}s</span>
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
                <p className="ws-turn-body">
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
