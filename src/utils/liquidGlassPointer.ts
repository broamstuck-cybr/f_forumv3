import type React from 'react';

const GLASS_SELECTOR = [
  '.lg-glass',
  '.lg-chrome',
  '.st-panel',
  '.st-card',
  '.pf-item-card',
  '.pf-stats',
  '.lp-plate-card',
  '.lp-hm-beat',
  '.lp-proj-card',
  '.lp-starter-sv',
  '.lp-starter-cn',
  '.ex-plate-frame',
  '.ex-bench-dossier',
  '.hm-blueprint',
  '.onb__pill',
  '.adm-auth-card',
  '.adm-banner',
].join(',');

function applyPointerLight(el: HTMLElement, clientX: number, clientY: number): void {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const x = Math.round(clientX - rect.left);
  const y = Math.round(clientY - rect.top);
  // Dynamic specular rim angle (112deg..158deg) adapted from rdev/liquid-glass-react without React re-renders.
  const normX = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - 0.5) * 2));
  const angle = Math.round(135 + normX * 22);
  el.style.setProperty('--lg-x', `${x}px`);
  el.style.setProperty('--lg-y', `${y}px`);
  el.style.setProperty('--lg-angle', `${angle}deg`);
  if (el.dataset.lgHover !== 'true') {
    el.dataset.lgHover = 'true';
  }
}

export function handleLiquidPointerMove(event: React.PointerEvent<HTMLElement>): void {
  if (event.pointerType === 'touch') return;
  applyPointerLight(event.currentTarget, event.clientX, event.clientY);
}

export function handleLiquidPointerLeave(event: React.PointerEvent<HTMLElement>): void {
  const el = event.currentTarget;
  if (el.dataset.lgHover) {
    delete el.dataset.lgHover;
  }
  el.style.removeProperty('--lg-angle');
}

let globalPointerBound = false;

// WHY: Delegated passive rAF-throttled listener drives specular angle and catchlight on every glass surface with zero React re-renders.
export function initGlobalLiquidGlassPointer(): void {
  if (globalPointerBound || typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  globalPointerBound = true;
  let activeEl: HTMLElement | null = null;
  let rafId = 0;
  let pendingX = 0;
  let pendingY = 0;
  let pendingTarget: HTMLElement | null = null;

  const flush = () => {
    rafId = 0;
    if (activeEl && activeEl !== pendingTarget) {
      delete activeEl.dataset.lgHover;
      activeEl.style.removeProperty('--lg-angle');
    }
    activeEl = pendingTarget;
    if (activeEl && activeEl.isConnected) {
      applyPointerLight(activeEl, pendingX, pendingY);
    }
  };

  document.addEventListener(
    'pointermove',
    (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(GLASS_SELECTOR) : null;
      pendingTarget = target;
      pendingX = event.clientX;
      pendingY = event.clientY;
      if (!rafId) {
        rafId = window.requestAnimationFrame(flush);
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerleave',
    () => {
      if (activeEl) {
        delete activeEl.dataset.lgHover;
        activeEl.style.removeProperty('--lg-angle');
        activeEl = null;
      }
    },
    { passive: true }
  );
}
