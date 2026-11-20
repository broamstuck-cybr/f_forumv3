import React, { useEffect, useRef, useState } from 'react';
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
  onRetry: () => void;
  onRegenerate: () => void;
  canRetry: boolean;
  canRegenerate: boolean;
}

const MODE_TAG = /^\[Mode:\s*([A-Za-z]+)\]\s*/i;

const MODE_LABELS: Record<string, string> = {
  build: 'Dựng mới',
  refine: 'Tinh chỉnh',
  audit: 'Kiểm định',
};

const STREAM_STEPS: Array<{ id: 'routing' | 'generating' | 'checking'; label: string }> = [
  { id: 'routing', label: '1. Định tuyến' },
  { id: 'generating', label: '2. Sinh mã' },
  { id: 'checking', label: '3. Kiểm định 6 lớp' },
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
  onRetry,
  onRegenerate,
  canRetry,
  canRegenerate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLPreElement>(null);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);

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

  const renderArenaCard = (
    turn: ArenaComparisonTurn,
    side: 'A' | 'B',
    candidate: ArenaCandidateResult
  ) => {
    const isApplied = turn.appliedSide === side;
    const isRunning = candidate.status === 'running';
    const previewFile =
      candidate.files.find((f) => f.path === 'styles.css') ||
      candidate.files.find((f) => f.path === 'index.html') ||
      candidate.files[0];
    const snippet = previewFile
      ? previewFile.content.split(/\r?\n/).slice(0, 7).join('\n')
      : '';

    return (
      <article
        key={`${turn.id}-${side}`}
        className="ws-arena-card"
        data-side={side}
        data-applied={isApplied ? 'true' : undefined}
      >
        <header className="ws-arena-card-head">
          <div className="ws-arena-card-title">
            <span className="ws-arena-badge">Model {side}</span>
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
          {isApplied && (
            <span className="ws-arena-active-tag">Đang hiển thị trên Live View</span>
          )}
          <button
            type="button"
            className={isApplied ? 'btn btn-solid btn-sm' : 'btn btn-red btn-sm'}
            disabled={isRunning}
            onClick={() => onApplyArenaCandidate(turn.id, side)}
          >
            Áp dụng bản này
          </button>
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

          return (
            <article key={message.id} className="ws-turn" data-role={message.role}>
              <header className="t-label ws-turn-meta">
                <span className="ws-role-badge" data-role={message.role}>
                  {message.role === 'user'
                    ? userName
                    : message.role === 'system'
                      ? 'Hệ thống'
                      : 'Arena AI'}
                </span>
                {modeLabel && <span className="ws-mode-tag">{modeLabel}</span>}
                {message.modelUsed && <span className="ws-model-tag">{message.modelUsed}</span>}
                {message.protocolUsed && (
                  <span className="ws-proto-tag">{message.protocolUsed}</span>
                )}
                {message.role === 'assistant' && (
                  <>
                    {elapsedLabel && <span className="ws-pill-meta">{elapsedLabel}</span>}
                    <span className="ws-pill-meta">3/3 bước</span>
                    <span className="ws-pill-meta">~{tokenCount} tok</span>
                  </>
                )}
                <time dateTime={message.createdAt}>{formatClock(message.createdAt)}</time>
              </header>

              <p className="ws-turn-body">
                {message.role === 'user' ? stripModeTag(message.content) : message.content}
              </p>

              {message.fallback && (
                <p className="ws-turn-flag">
                  Đã tổng hợp qua bộ khung dự phòng cục bộ. Mở Model &amp; BYOK để gắn khóa API riêng.
                </p>
              )}

              {message.changedFiles && message.changedFiles.length > 0 && (
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
              )}

              {isLatestAssistant && (
                <div className="ws-turn-actions">
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={onRegenerate}
                    disabled={!canRegenerate}
                  >
                    Tạo lại
                  </button>
                </div>
              )}

              {failed && message === lastMessage && (
                <div className="ws-turn-actions">
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={onRetry}
                    disabled={!canRetry}
                  >
                    Thử lại
                  </button>
                </div>
              )}
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
                So sánh 2 Model (Arena)
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
            <p className="t-label">Gợi ý bắt đầu phiên Arena</p>
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
                  Arena AI
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
                    ? 'Đang chạy kiểm định tự động 6 lớp...'
                    : streamingStage === 'generating'
                      ? 'Đang tổng hợp mã nguồn HTML, CSS, JS...'
                      : 'Đang định tuyến Model & ngữ cảnh...'}
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
