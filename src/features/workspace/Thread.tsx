import React, { useEffect, useRef } from 'react';
import type { AIActivityState, AIStreamingStage, ChatMessage } from '../../types/index';
import { formatClock } from './time';

export interface StarterPrompt {
  label: string;
  prompt: string;
}

interface ThreadProps {
  messages: ChatMessage[];
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

const MODE_TAG = /^\[Mode: [A-Za-z]+\]\s*/;

const STREAM_STEPS: Array<{ id: 'routing' | 'generating' | 'checking'; label: string }> = [
  { id: 'routing', label: 'Định tuyến' },
  { id: 'generating', label: 'Sinh mã' },
  { id: 'checking', label: 'Kiểm định' },
];

export function stripModeTag(content: string): string {
  return content.replace(MODE_TAG, '');
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

  const busy =
    activity === 'thinking' ||
    activity === 'streaming' ||
    streamingStage === 'routing' ||
    streamingStage === 'generating' ||
    streamingStage === 'checking';

  const lastMessage = messages[messages.length - 1];
  const failed = !busy && lastMessage?.role === 'system';
  const untouched = !messages.some((message) => message.role === 'user');
  const activeRank = stepRank(streamingStage !== 'idle' ? streamingStage : activity === 'streaming' ? 'generating' : 'routing');

  const lastAssistantId = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') return messages[i].id;
    }
    return null;
  })();

  useEffect(() => {
    const element = scrollRef.current;
    if (element && (!untouched || busy)) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages.length, busy, untouched, streamingStage, streamingPreview]);

  useEffect(() => {
    const pre = previewRef.current;
    if (pre) {
      pre.scrollTop = pre.scrollHeight;
    }
  }, [streamingPreview]);

  return (
    <div ref={scrollRef} className="ws-scroll">
      <div className="ws-measure">
        {messages.map((message) => {
          const isLatestAssistant =
            !busy &&
            !untouched &&
            message.role === 'assistant' &&
            message.id === lastAssistantId &&
            message === lastMessage;

          return (
            <article key={message.id} className="ws-turn" data-role={message.role}>
              <p className="t-label ws-turn-meta">
                <span className="ws-turn-who">
                  {message.role === 'user' ? userName : message.role === 'system' ? 'Lỗi' : 'F-Forum'}
                </span>
                {message.modelUsed && <span className="ws-model-tag">{message.modelUsed}</span>}
                {message.protocolUsed && <span className="ws-proto-tag">{message.protocolUsed}</span>}
                <time dateTime={message.createdAt}>{formatClock(message.createdAt)}</time>
              </p>
              <p className="ws-turn-body">
                {message.role === 'user' ? stripModeTag(message.content) : message.content}
              </p>
              {message.fallback && (
                <p className="ws-turn-flag">
                  Bản dự phòng, máy chủ AI không trả lời.
                  {message.upstreamError ? ` ${message.upstreamError}` : ''}
                </p>
              )}
              {message.changedFiles && message.changedFiles.length > 0 && (
                <ul className="ws-turn-files" aria-label="Tệp đã đổi">
                  {message.changedFiles.map((filePath) => (
                    <li key={filePath}>
                      <button type="button" className="ws-filelink" onClick={() => onOpenFile(filePath)}>
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

        {untouched && !busy && (
          <section className="ws-starters" aria-label="Gợi ý mở đầu">
            <p className="t-label">Thử bắt đầu bằng</p>
            <ul>
              {starters.map((starter) => (
                <li key={starter.label}>
                  <button type="button" className="ws-starter" onClick={() => onPickStarter(starter.prompt)}>
                    {starter.label}
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
                <span className="t-label ws-turn-who">F-Forum</span>
                {modelUsed && <span className="t-label ws-model-tag">{modelUsed}</span>}
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
                    ? 'Đang chạy kiểm định 6 lớp'
                    : streamingStage === 'generating'
                      ? 'Đang tổng hợp mã nguồn'
                      : 'Đang định tuyến mô hình'}
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
