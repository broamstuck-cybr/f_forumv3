import React, { useEffect, useRef } from 'react';
import type { AIActivityState, ChatMessage } from '../../types/index';
import { formatClock } from './time';

export interface StarterPrompt {
  label: string;
  prompt: string;
}

interface ThreadProps {
  messages: ChatMessage[];
  activity: AIActivityState;
  userName: string;
  starters: StarterPrompt[];
  onPickStarter: (prompt: string) => void;
  onOpenFile: (path: string) => void;
  onRetry: () => void;
  canRetry: boolean;
}

const MODE_TAG = /^\[Mode: [A-Za-z]+\]\s*/;

export function stripModeTag(content: string): string {
  return content.replace(MODE_TAG, '');
}

export const Thread: React.FC<ThreadProps> = ({
  messages,
  activity,
  userName,
  starters,
  onPickStarter,
  onOpenFile,
  onRetry,
  canRetry,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = activity === 'thinking' || activity === 'streaming';
  const lastMessage = messages[messages.length - 1];
  const failed = !busy && lastMessage?.role === 'system';
  const untouched = !messages.some((message) => message.role === 'user');

  useEffect(() => {
    const element = scrollRef.current;
    if (element && !untouched) element.scrollTop = element.scrollHeight;
  }, [messages.length, busy, untouched]);

  return (
    <div ref={scrollRef} className="ws-scroll">
      <div className="ws-measure">
        {messages.map((message) => (
          <article key={message.id} className="ws-turn" data-role={message.role}>
            <p className="t-label ws-turn-meta">
              <span className="ws-turn-who">
                {message.role === 'user' ? userName : message.role === 'system' ? 'Lỗi' : 'F-Forum'}
              </span>
              {message.modelUsed && <span>{message.modelUsed}</span>}
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
            {failed && message === lastMessage && (
              <button
                type="button"
                className="btn btn-line btn-sm ws-turn-retry"
                onClick={onRetry}
                disabled={!canRetry}
              >
                Thử lại
              </button>
            )}
          </article>
        ))}

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
            <div className="ws-turn ws-turn-busy" data-role="assistant">
              <p className="t-label ws-turn-meta">
                <span className="ws-turn-who">F-Forum</span>
              </p>
              <p className="ws-turn-body">
                {activity === 'thinking' ? 'Đang nghĩ' : 'Đang viết mã'}
                <span className="ws-caret" aria-hidden="true" />
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
