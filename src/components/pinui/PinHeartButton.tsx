import React, { useEffect, useRef, useState } from 'react';
import './pin-heart.css';

export interface PinHeartButtonProps {
  liked: boolean;
  count?: number;
  onToggle: () => void;
  ariaLabel?: string;
  compact?: boolean;
  className?: string;
}

export const PinHeartButton: React.FC<PinHeartButtonProps> = ({
  liked,
  count,
  onToggle,
  ariaLabel,
  compact = false,
  className = '',
}) => {
  const [burst, setBurst] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!liked) {
      setBurst(false);
      window.requestAnimationFrame(() => setBurst(true));
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setBurst(false), 450);
    }
    onToggle();
  };

  return (
    <button
      type="button"
      className={`pheart${compact ? ' pheart--compact' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={liked}
      aria-label={ariaLabel || (liked ? 'Bỏ yêu thích' : 'Yêu thích')}
      data-burst={burst ? 'true' : undefined}
      onClick={handleClick}
    >
      <span className="pheart__icoWrap" aria-hidden="true">
        <svg
          className="pheart__svg"
          viewBox="0 0 24 24"
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20.5s-7.4-4.5-7.4-9.6A4.4 4.4 0 0 1 12 8.2a4.4 4.4 0 0 1 7.4 2.7c0 5.1-7.4 9.6-7.4 9.6z" />
        </svg>
        <span className="pheart__sparks">
          <span className="pheart__spark" />
          <span className="pheart__spark" />
          <span className="pheart__spark" />
          <span className="pheart__spark" />
          <span className="pheart__spark" />
          <span className="pheart__spark" />
          <span className="pheart__spark" />
          <span className="pheart__spark" />
        </span>
      </span>
      {typeof count === 'number' && <span>{count}</span>}
    </button>
  );
};

export default PinHeartButton;
