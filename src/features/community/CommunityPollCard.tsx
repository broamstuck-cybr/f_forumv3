import React from 'react';
import { IconBarChart3, IconCheck } from '../../ui/icons';
import type { CommunityPoll } from '../../types/index';

export interface CommunityPollCardProps {
  postId: string;
  poll: CommunityPoll;
  selectedOptionId: string | null;
  onVote: (postId: string, optionId: string) => void;
}

export const CommunityPollCard: React.FC<CommunityPollCardProps> = ({
  postId,
  poll,
  selectedOptionId,
  onVote,
}) => {
  const computedOptions = poll.options.map((opt) => ({
    ...opt,
    votes: opt.votes + (selectedOptionId === opt.id ? 1 : 0),
  }));
  const totalVotes = computedOptions.reduce((sum, opt) => sum + opt.votes, 0);
  const hasVoted = selectedOptionId !== null;

  return (
    <section className="cm-poll" aria-label={`Thăm dò ý kiến: ${poll.question}`}>
      <header className="cm-poll-head">
        <span className="cm-poll-kicker">
          <IconBarChart3 size={14} aria-hidden="true" />
          <span>Thăm dò ý kiến</span>
        </span>
        <span className="cm-count">
          {totalVotes.toLocaleString('vi-VN')} phiếu
          {poll.closesLabel ? ` · ${poll.closesLabel}` : ''}
        </span>
      </header>

      <p className="cm-poll-question">{poll.question}</p>

      <div className="cm-poll-options" role="group" aria-label="Lựa chọn thăm dò">
        {computedOptions.map((opt) => {
          const selected = selectedOptionId === opt.id;
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={opt.id}
              type="button"
              className="cm-poll-opt"
              data-card-trigger
              aria-pressed={selected}
              data-voted={hasVoted ? 'true' : undefined}
              onClick={() => onVote(postId, opt.id)}
            >
              <span
                className="cm-poll-fill"
                style={{ '--poll-scale': hasVoted ? String(pct / 100) : '0' } as React.CSSProperties}
                aria-hidden="true"
              />
              <span className="cm-poll-opt-label">
                {selected && <IconCheck size={14} aria-hidden="true" />}
                <span>{opt.label}</span>
              </span>
              {hasVoted && (
                <span className="cm-poll-opt-pct">
                  {pct}% ({opt.votes})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CommunityPollCard;
