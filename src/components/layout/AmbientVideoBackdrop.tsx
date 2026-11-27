import React from 'react';
import { useAppStore } from '../../store/appStore';
import type { WallpaperPreset } from '../../types/index';
import './ambient-video.css';

const DARK_POSTER = '/assets/videos/Gradient_Lab_002_poster.jpg';

export const AmbientVideoBackdrop: React.FC = () => {
  const { theme, settings } = useAppStore();
  const isEco = settings.uiMode === 'eco';
  const ambientEnabled = !isEco && settings.ambientVideo !== false;
  const preset: WallpaperPreset = settings.wallpaperPreset || (theme === 'light' ? 'light' : 'dark');

  if (isEco) return null;

  const isPosterPreset = preset === 'auto' || preset === 'dark' || preset === 'light';
  // WHY: Light mode uses crisp pure-CSS light gradients instead of the dark-teal poster so light theme stays genuinely bright and lag-free.
  const showDarkPoster = theme === 'dark' && isPosterPreset && ambientEnabled;

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

      {showDarkPoster && (
        <img
          className="ambient-layer ambient-layer--poster"
          data-active="true"
          src={DARK_POSTER}
          alt=""
          decoding="async"
        />
      )}

      <div className="ambient-scrim" data-video={showDarkPoster ? 'true' : 'false'} />
    </div>
  );
};

export default AmbientVideoBackdrop;
