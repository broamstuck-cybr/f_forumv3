import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface SplitDividerProps {
  ratio: number;
  minRatio?: number;
  maxRatio?: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onChangeRatio: (nextRatio: number) => void;
  onResetRatio?: () => void;
  onDraggingChange?: (dragging: boolean) => void;
}

export const SplitDivider: React.FC<SplitDividerProps> = ({
  ratio,
  minRatio = 0.24,
  maxRatio = 0.66,
  containerRef,
  onChangeRatio,
  onResetRatio,
  onDraggingChange,
}) => {
  const [dragging, setDragging] = useState(false);
  const pointerIdRef = useRef<number | null>(null);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const raw = (clientX - rect.left) / rect.width;
      const clamped = Math.min(maxRatio, Math.max(minRatio, raw));
      onChangeRatio(Math.round(clamped * 1000) / 1000);
    },
    [containerRef, maxRatio, minRatio, onChangeRatio]
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      setDragging(false);
      pointerIdRef.current = null;
      onDraggingChange?.(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, onDraggingChange, updateFromClientX]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    pointerIdRef.current = e.pointerId;
    setDragging(true);
    onDraggingChange?.(true);
    updateFromClientX(e.clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onChangeRatio(Math.max(minRatio, Math.round((ratio - 0.03) * 1000) / 1000));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onChangeRatio(Math.min(maxRatio, Math.round((ratio + 0.03) * 1000) / 1000));
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Kéo để chỉnh tỷ lệ khung Chat và khung Xem trang"
      aria-valuemin={Math.round(minRatio * 100)}
      aria-valuemax={Math.round(maxRatio * 100)}
      aria-valuenow={Math.round(ratio * 100)}
      tabIndex={0}
      className={`ws-divider${dragging ? ' is-dragging' : ''}`}
      title="Kéo để chỉnh độ rộng · Nháy đúp để đặt lại"
      onPointerDown={handlePointerDown}
      onDoubleClick={onResetRatio}
      onKeyDown={handleKeyDown}
    />
  );
};
