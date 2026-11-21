import React, { useEffect, useRef } from 'react';
import {
  createThemeSwitch,
  type EffectName,
  type ThemeName,
  type ThemeSwitchEngine,
} from '../pinui/original/theme-switch/theme-switch-engine';
import '../pinui/original/theme-switch/theme-switch.css';
import { useAppStore } from '../../store/appStore';

export const PINUI_THEME_EVENT = 'ff:pinui-theme-toggle';

export function triggerPinuiThemeToggle(sourceEl?: HTMLElement | null): void {
  if (typeof window === 'undefined') return;
  const rect = sourceEl?.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent(PINUI_THEME_EVENT, {
      detail: rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, w: rect.width, h: rect.height }
        : null,
    })
  );
}

export const GlobalThemeAtmosphere: React.FC = () => {
  const { theme, setTheme, themeEffect, reducedMotion } = useAppStore();
  const hostRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const proxyBtnRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<ThemeSwitchEngine | null>(null);
  const effectRef = useRef<EffectName>(themeEffect === 'none' ? 'droplet' : themeEffect);
  const themeRef = useRef<ThemeName>(theme);
  const reducedRef = useRef<boolean>(reducedMotion);

  useEffect(() => {
    themeRef.current = theme;
    reducedRef.current = reducedMotion;
    if (themeEffect !== 'none') {
      effectRef.current = themeEffect;
    }
    if (hostRef.current && !engineRef.current?.busy()) {
      hostRef.current.dataset.theme = theme;
    }
  }, [theme, themeEffect, reducedMotion]);

  useEffect(() => {
    const host = hostRef.current;
    const fx = fxRef.current;
    const btn = proxyBtnRef.current;
    if (!host || !fx || !btn) return;

    host.dataset.theme = themeRef.current;
    const engine = createThemeSwitch({
      root: host,
      button: btn,
      fx,
      effect: () => effectRef.current,
      sound: () => !reducedRef.current,
      onCommit: (next) => {
        setTheme(next);
      },
    });
    engineRef.current = engine;

    const onTrigger = (event: Event) => {
      const custom = event as CustomEvent<{ x?: number; y?: number; w?: number; h?: number } | null>;
      const detail = custom.detail;
      if (reducedRef.current || themeEffect === 'none') {
        setTheme(themeRef.current === 'dark' ? 'light' : 'dark');
        return;
      }
      if (engine.busy()) return;
      const cx = detail?.x ?? window.innerWidth - 96;
      const cy = detail?.y ?? 28;
      btn.style.left = `${Math.round(cx - 22)}px`;
      btn.style.top = `${Math.round(cy - 22)}px`;
      host.dataset.theme = themeRef.current;
      engine.prepare();
      engine.toggle();
    };

    window.addEventListener(PINUI_THEME_EVENT, onTrigger);
    return () => {
      window.removeEventListener(PINUI_THEME_EVENT, onTrigger);
      engine.destroy();
      engineRef.current = null;
    };
  }, [setTheme, themeEffect]);

  return (
    <div
      ref={hostRef}
      className="ff-pinui-theme-host"
      data-theme={theme}
      aria-hidden="true"
    >
      <button
        ref={proxyBtnRef}
        type="button"
        tabIndex={-1}
        className="ff-pinui-proxy-btn"
        aria-hidden="true"
      />
      <div ref={fxRef} className="pts__fx" aria-hidden="true" />
    </div>
  );
};

export default GlobalThemeAtmosphere;
