import type React from 'react';

// WHY: Updates --lg-x/--lg-y CSS custom properties directly on the hovered glass card with zero React re-renders.
export function handleLiquidPointerMove(event: React.PointerEvent<HTMLElement>): void {
  if (event.pointerType === 'touch') return;
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const x = Math.round(event.clientX - rect.left);
  const y = Math.round(event.clientY - rect.top);
  el.style.setProperty('--lg-x', `${x}px`);
  el.style.setProperty('--lg-y', `${y}px`);
  if (el.dataset.lgHover !== 'true') {
    el.dataset.lgHover = 'true';
  }
}

export function handleLiquidPointerLeave(event: React.PointerEvent<HTMLElement>): void {
  const el = event.currentTarget;
  if (el.dataset.lgHover) {
    delete el.dataset.lgHover;
  }
}
