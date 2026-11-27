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

type ThemeToggleDetail = {
  x?: number;
  y?: number;
  targetTheme?: ThemeName;
  preference?: 'light' | 'dark' | 'system';
};

export function triggerPinuiThemeToggle(
  sourceEl?: HTMLElement | null,
  targetTheme?: ThemeName,
  preference?: 'light' | 'dark' | 'system'
): void {
  if (typeof window === 'undefined') return;
  const rect = sourceEl?.getBoundingClientRect();
  const detail: ThemeToggleDetail = {
    ...(rect
      ? {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }
      : {}),
    ...(targetTheme ? { targetTheme } : {}),
    ...(preference ? { preference } : {}),
  };
  window.dispatchEvent(new CustomEvent<ThemeToggleDetail>(PINUI_THEME_EVENT, { detail }));
}

type OriginPoint = { x: number; y: number };

const PINUI_DRAWER_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const PINUI_FLOOD_MS = 380;

export const GlobalThemeAtmosphere: React.FC = () => {
  const { theme, setTheme, updateSettings, reducedMotion, themeEffect } = useAppStore();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const fxRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ThemeSwitchEngine | null>(null);

  const themeRef = useRef<ThemeName>(theme);
  const setThemeRef = useRef(setTheme);
  const updateSettingsRef = useRef(updateSettings);
  const reducedRef = useRef(reducedMotion);
  const effectRef = useRef(themeEffect);
  const pointRef = useRef<OriginPoint>({ x: 0, y: 0 });
  const pendingTargetRef = useRef<ThemeName | null>(null);
  const transitionStartedRef = useRef(false);

  useEffect(() => {
    themeRef.current = theme;
    setThemeRef.current = setTheme;
    updateSettingsRef.current = updateSettings;
    reducedRef.current = reducedMotion;
    effectRef.current = themeEffect;
    if (rootRef.current?.dataset) {
      rootRef.current.dataset.theme = theme;
    }
  }, [theme, setTheme, updateSettings, reducedMotion, themeEffect]);

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
      effect: () => {
        const current = effectRef.current;
        return current === 'none' ? 'droplet' : current;
      },
      sound: () => !reducedRef.current,
      onCommit: () => {
        pendingTargetRef.current = null;
      },
    });
    engineRef.current = engine;

    const onTrigger = (event: Event) => {
      const custom = event as CustomEvent<ThemeToggleDetail | null>;
      const vw = window.innerWidth || 1280;
      const vh = window.innerHeight || 720;
      const detail = custom.detail;
      const rawPt =
        detail && typeof detail.x === 'number' && typeof detail.y === 'number'
          ? {
              x: Math.max(24, Math.min(vw - 24, detail.x)),
              y: Math.max(20, Math.min(vh - 20, detail.y)),
            }
          : { x: Math.max(48, vw - 76), y: 28 };
      const pt = {
        x: rawPt.x,
        y: rawPt.y < 120 ? Math.min(vh - 24, 140) : rawPt.y,
      };

      pointRef.current = pt;

      const next: ThemeName =
        detail?.targetTheme ?? (themeRef.current === 'dark' ? 'light' : 'dark');
      const changed = next !== themeRef.current;
      themeRef.current = next;
      pendingTargetRef.current = next;
      transitionStartedRef.current = false;

      const applyThemeDomSync = (mode: ThemeName) => {
        const docEl = document.documentElement;
        docEl.setAttribute('data-theme', mode);
        docEl.classList.toggle('dark', mode === 'dark');
        docEl.classList.toggle('light', mode === 'light');
        docEl.style.colorScheme = mode;
      };

      const commitStoreTheme = (mode: ThemeName) => {
        if (detail?.preference) {
          updateSettingsRef.current({ themePreference: detail.preference, theme: mode });
        } else {
          setThemeRef.current(mode);
        }
      };

      if (!changed || reducedRef.current || effectRef.current === 'none') {
        pendingTargetRef.current = null;
        applyThemeDomSync(next);
        commitStoreTheme(next);
        return;
      }

      const docWithVt = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> };
      };
      if (typeof docWithVt.startViewTransition === 'function') {
        const R = Math.ceil(
          Math.hypot(Math.max(pt.x, vw - pt.x), Math.max(pt.y, vh - pt.y))
        );
        const vt = docWithVt.startViewTransition(() => {
          applyThemeDomSync(next);
          flushSync(() => {
            commitStoreTheme(next);
          });
        });
        vt.ready
          .then(() => {
            document.documentElement.animate(
              {
                clipPath: [`circle(0px at ${pt.x}px ${pt.y}px)`, `circle(${R}px at ${pt.x}px ${pt.y}px)`],
              },
              {
                duration: PINUI_FLOOD_MS,
                easing: PINUI_DRAWER_EASE,
                pseudoElement: '::view-transition-new(root)',
              }
            );
          })
          .catch(() => undefined);
      } else {
        applyThemeDomSync(next);
        commitStoreTheme(next);
      }

      if (!engine.busy()) {
        button.style.left = `${pt.x - 27}px`;
        button.style.top = `${pt.y - 27}px`;
        engine.prepare();
        engine.toggle();
      }
    };

    window.addEventListener(PINUI_THEME_EVENT, onTrigger);
    return () => {
      window.removeEventListener(PINUI_THEME_EVENT, onTrigger);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <div ref={rootRef} className="pts pts--global" data-theme={theme} aria-hidden="true" inert>
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
