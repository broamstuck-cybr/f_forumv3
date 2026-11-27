import React from 'react';
import { useAppStore } from '../../store/appStore';
import type { WallpaperPreset } from '../../types/index';
import './ambient-video.css';

const LIGHT_PRESETS = new Set<WallpaperPreset>(['light', 'sage', 'harbour', 'lilac']);
const DARK_PRESETS = new Set<WallpaperPreset>(['dark', 'aurora', 'ember', 'lagoon']);

export const AmbientVideoBackdrop: React.FC = () => {
  const { theme, settings } = useAppStore();
  const isEco = settings.uiMode === 'eco';
  const ambientEnabled = !isEco && settings.ambientVideo !== false;

  if (isEco) return null;

  const rawPreset = settings.wallpaperPreset;
  let preset: WallpaperPreset = theme === 'light' ? 'light' : 'dark';
  if (theme === 'light' && rawPreset && LIGHT_PRESETS.has(rawPreset)) {
    preset = rawPreset;
  } else if (theme === 'dark' && rawPreset && DARK_PRESETS.has(rawPreset)) {
    preset = rawPreset;
  }

  return (
    <div
      className="ambient-backdrop"
      aria-hidden="true"
      data-mode={theme}
      data-preset={preset}
      data-ambient={ambientEnabled ? 'on' : 'off'}
    >
      <div className="ambient-mesh-layer" />
      {ambientEnabled ? (
        <>
          <div className="ambient-godray-layer" />
          <div className="ambient-horizon-layer" />
        </>
      ) : null}
      <div className="ambient-scrim" />
    </div>
  );
};

export default AmbientVideoBackdrop;
