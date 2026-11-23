import React, { useCallback, useEffect, useRef } from 'react';
import type { DimensionView } from '../types/index';
import { useAppStore } from '../store/appStore';

interface HardwareShowcaseProps {
  onNavigate?: (view: DimensionView) => void;
  className?: string;
}

const VALID_ROUTES = new Set<DimensionView>([
  'home',
  'explore',
  'experience',
  'workspace',
]);

export const HardwareShowcase: React.FC<HardwareShowcaseProps> = ({
  onNavigate,
  className = '',
}) => {
  const { theme } = useAppStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialThemeRef = useRef<'dark' | 'light'>(theme);

  const syncIframeTheme = useCallback((nextTheme: 'dark' | 'light') => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    // WHY: Chromium paints an opaque white iframe canvas if parent and iframe color-scheme diverge.
    try {
      const doc = iframe.contentDocument;
      if (doc?.documentElement) {
        doc.documentElement.classList.add('ff-embed-phone');
        doc.documentElement.style.colorScheme = nextTheme;
        doc.documentElement.style.background = 'transparent';
        doc.documentElement.style.backgroundColor = 'transparent';
        if (doc.body) {
          doc.body.style.background = 'transparent';
          doc.body.style.backgroundColor = 'transparent';
        }
      }
    } catch {
      return;
    }
    try {
      iframe.contentWindow?.postMessage(
        { type: 'fforum:theme', theme: nextTheme },
        window.location.origin
      );
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    syncIframeTheme(theme);
  }, [theme, syncIframeTheme]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as { type?: string; route?: DimensionView } | null;
      if (
        payload?.type === 'fforum:navigate' &&
        payload.route &&
        VALID_ROUTES.has(payload.route)
      ) {
        onNavigate?.(payload.route);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onNavigate]);

  return (
    <div
      className={`relative mx-auto flex w-full max-w-[440px] flex-col items-center justify-center bg-transparent ${className}`}
      style={{ height: 'clamp(590px, 78vh, 790px)', background: 'transparent' }}
    >
      <iframe
        ref={iframeRef}
        src={`/iphone18-simulator.html?embed=phone&theme=${initialThemeRef.current}`}
        title="iPhone 18 Pro — iOS 26 Simulator"
        className="block h-full w-full border-0 bg-transparent"
        style={{
          colorScheme: theme,
          background: 'transparent',
          backgroundColor: 'transparent',
        }}
        onLoad={() => syncIframeTheme(theme)}
        loading="eager"
      />
    </div>
  );
};

export default HardwareShowcase;
