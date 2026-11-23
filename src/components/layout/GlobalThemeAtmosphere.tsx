import React, { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useAppStore } from '../../store/appStore';
import {
  createThemeSwitch,
  type ThemeName,
  type ThemeSwitchEngine,
} from '../pinui/original/theme-switch/theme-switch-engine';
import '../pinui/original/theme-switch/theme-switch.css';

export const PINUI_THEME_EVENT = 'ff:pinui-theme-toggle';

export function triggerPinuiThemeToggle(sourceEl?: HTMLElement | null): void {
  if (typeof window === 'undefined') return;
  const rect = sourceEl?.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent(PINUI_THEME_EVENT, {
      detail: rect
        ? {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          }
        : null,
    })
  );
}

type OriginPoint = { x: number; y: number };

const PINUI_DRAWER_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const PINUI_FLOOD_MS = 800;

export const GlobalThemeAtmosphere: React.FC = () => {
  const { theme, setTheme, reducedMotion } = useAppStore();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const fxRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ThemeSwitchEngine | null>(null);

  const themeRef = useRef<ThemeName>(theme);
  const setThemeRef = useRef(setTheme);
  const reducedRef = useRef(reducedMotion);
  const pointRef = useRef<OriginPoint>({ x: 0, y: 0 });
  const pendingTargetRef = useRef<ThemeName | null>(null);
  const transitionStartedRef = useRef(false);

  useEffect(() => {
    themeRef.current = theme;
    setThemeRef.current = setTheme;
    reducedRef.current = reducedMotion;
    if (rootRef.current) {
      rootRef.current.dataset.theme = theme;
    }
  }, [theme, setTheme, reducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    const button = buttonRef.current;
    const fx = fxRef.current;
    if (!root || !button || !fx) return undefined;

    root.dataset.theme = themeRef.current;

    const engine = createThemeSwitch({
      root,
      button,
      fx,
      effect: () => 'droplet',
      sound: () => !reducedRef.current,
      onCommit: (next) => {
        pendingTargetRef.current = null;
        if (themeRef.current !== next) {
          setThemeRef.current(next);
        }
      },
    });
    engineRef.current = engine;

    const observer = new MutationObserver((mutations) => {
      if (transitionStartedRef.current) return;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLElement && node.classList.contains('pts__flood')) {
            const next = pendingTargetRef.current;
            if (!next || themeRef.current === next) return;
            transitionStartedRef.current = true;
            const docWithVt = document as Document & {
              startViewTransition?: (cb: () => void) => { ready: Promise<void> };
            };
            const { x, y } = pointRef.current;
            if (!reducedRef.current && typeof docWithVt.startViewTransition === 'function') {
              const R = Math.ceil(
                Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
              );
              const vt = docWithVt.startViewTransition(() => {
                flushSync(() => {
                  setThemeRef.current(next);
                });
              });
              vt.ready
                .then(() => {
                  document.documentElement.animate(
                    {
                      clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`],
                    },
                    {
                      duration: PINUI_FLOOD_MS,
                      easing: PINUI_DRAWER_EASE,
                      pseudoElement: '::view-transition-new(root)',
                    }
                  );
                })
                .catch(() => {
                  if (themeRef.current !== next) setThemeRef.current(next);
                });
            } else {
              setThemeRef.current(next);
            }
          }
        }
      }
    });
    observer.observe(root, { childList: true });

    const onTrigger = (event: Event) => {
      if (engine.busy()) return;
      const custom = event as CustomEvent<OriginPoint | null>;
      const vw = window.innerWidth || 1280;
      const vh = window.innerHeight || 720;
      const pt = custom.detail
        ? {
            x: Math.max(24, Math.min(vw - 24, custom.detail.x)),
            y: Math.max(20, Math.min(vh - 20, custom.detail.y)),
          }
        : { x: Math.max(48, vw - 76), y: 28 };

      pointRef.current = pt;
      button.style.left = `${pt.x - 27}px`;
      button.style.top = `${pt.y - 27}px`;

      const next: ThemeName = themeRef.current === 'dark' ? 'light' : 'dark';
      pendingTargetRef.current = next;
      transitionStartedRef.current = false;

      if (reducedRef.current) {
        pendingTargetRef.current = null;
        setThemeRef.current(next);
        return;
      }

      engine.prepare();
      engine.toggle();
    };

    window.addEventListener(PINUI_THEME_EVENT, onTrigger);
    return () => {
      window.removeEventListener(PINUI_THEME_EVENT, onTrigger);
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <div ref={rootRef} className="pts pts--global" data-theme={theme} aria-hidden="true">
      <button
        ref={buttonRef}
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="pts__global-proxy"
      />
      <div ref={fxRef} className="pts__fx" aria-hidden="true" />
    </div>
  );
};

export default GlobalThemeAtmosphere;
