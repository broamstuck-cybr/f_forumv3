import React, { useEffect } from 'react';
import type { DimensionView } from '../types/index';

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
      className={`relative mx-auto flex w-full max-w-[440px] flex-col items-center justify-center ${className}`}
      style={{ height: 'clamp(590px, 78vh, 790px)' }}
    >
      <iframe
        src="/iphone18-simulator.html?embed=phone"
        title="iPhone 18 Pro — iOS 26 Simulator"
        className="block h-full w-full border-0 bg-transparent"
        style={{ colorScheme: 'normal' }}
        loading="eager"
      />
    </div>
  );
};

export default HardwareShowcase;
