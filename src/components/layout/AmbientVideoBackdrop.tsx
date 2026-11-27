import React from 'react';
import { useAppStore } from '../../store/appStore';
import type { WallpaperPreset } from '../../types/index';
import './ambient-video.css';

const LIGHT_POSTER = '/assets/videos/Gradient_Lab_001_poster.jpg';
const DARK_POSTER = '/assets/videos/Gradient_Lab_002_poster.jpg';

export const AmbientVideoBackdrop: React.FC = () => {
  const { theme, settings } = useAppStore();
  const isEco = settings.uiMode === 'eco';
  const ambientEnabled = !isEco && settings.ambientVideo !== false;
  const preset: WallpaperPreset = settings.wallpaperPreset || 'dark';

  if (isEco) return null;

  const isPosterPreset = preset === 'auto' || preset === 'dark' || preset === 'light';
  const useLightAsset = theme === 'light' || preset === 'light' || preset === 'harbour';
  const activePoster = useLightAsset ? LIGHT_POSTER : DARK_POSTER;

  return (
    <div
      className="ambient-backdrop"
      aria-hidden="true"
      data-mode={theme}
      data-preset={preset}
      data-animated="false"
    >
      <div className="ambient-mesh-layer" />
      <div className="ambient-godray-layer" />

      {isPosterPreset && ambientEnabled && (
        <img
          className="ambient-layer ambient-layer--poster"
          data-active="true"
          src={activePoster}
          alt=""
          decoding="async"
        />
      )}

      <div className="ambient-scrim" data-video={isPosterPreset && ambientEnabled ? 'true' : 'false'} />
    </div>
  );
};

export default AmbientVideoBackdrop;
