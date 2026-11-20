import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import './ambient-video.css';

const LIGHT_VIDEO = '/assets/videos/Gradient_Lab_001.mp4';
const DARK_VIDEO = '/assets/videos/Gradient_Lab_002.mp4';
const LIGHT_POSTER = '/assets/videos/Gradient_Lab_001_poster.jpg';
const DARK_POSTER = '/assets/videos/Gradient_Lab_002_poster.jpg';
const CROSSFADE_MS = 720;

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

function shouldUseStaticPoster(ambientEnabled: boolean, reducedMotion: boolean): boolean {
  if (!ambientEnabled || reducedMotion) return true;
  if (typeof window === 'undefined') return true;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
    return true;
  }
  const nav = navigator as Navigator & { connection?: NetworkInformationLike };
  if (nav.connection?.saveData) {
    return true;
  }
  if (nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g') {
    return true;
  }
  return false;
}

export const AmbientVideoBackdrop: React.FC = () => {
  const { theme, settings, reducedMotion } = useAppStore();
  const ambientEnabled = settings.ambientVideo !== false;
  const lightVideoRef = useRef<HTMLVideoElement | null>(null);
  const darkVideoRef = useRef<HTMLVideoElement | null>(null);
  const [posterOnly, setPosterOnly] = useState<boolean>(() =>
    shouldUseStaticPoster(ambientEnabled, reducedMotion)
  );
  const [lightError, setLightError] = useState(false);
  const [darkError, setDarkError] = useState(false);

  useEffect(() => {
    const syncStaticMode = () => {
      setPosterOnly(shouldUseStaticPoster(ambientEnabled, reducedMotion));
    };
    syncStaticMode();
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqWidth = window.matchMedia('(max-width: 768px)');
    mqMotion.addEventListener('change', syncStaticMode);
    mqWidth.addEventListener('change', syncStaticMode);
    return () => {
      mqMotion.removeEventListener('change', syncStaticMode);
      mqWidth.removeEventListener('change', syncStaticMode);
    };
  }, [ambientEnabled, reducedMotion]);

  useEffect(() => {
    if (!ambientEnabled || posterOnly) {
      lightVideoRef.current?.pause();
      darkVideoRef.current?.pause();
      return undefined;
    }

    const activeVideo = theme === 'light' ? lightVideoRef.current : darkVideoRef.current;
    const inactiveVideo = theme === 'light' ? darkVideoRef.current : lightVideoRef.current;

    if (activeVideo) {
      const playPromise = activeVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => undefined);
      }
    }

    const timer = window.setTimeout(() => {
      inactiveVideo?.pause();
    }, CROSSFADE_MS);

    return () => window.clearTimeout(timer);
  }, [theme, ambientEnabled, posterOnly]);

  if (!ambientEnabled) {
    return null;
  }

  const showLightPoster = posterOnly || lightError;
  const showDarkPoster = posterOnly || darkError;

  return (
    <div className="ambient-backdrop" aria-hidden="true" data-mode={theme}>
      {!showLightPoster ? (
        <video
          ref={lightVideoRef}
          className="ambient-layer ambient-layer--light"
          data-active={theme === 'light' ? 'true' : 'false'}
          src={LIGHT_VIDEO}
          poster={LIGHT_POSTER}
          autoPlay={theme === 'light'}
          muted
          loop
          playsInline
          preload={theme === 'light' ? 'auto' : 'metadata'}
          onError={() => setLightError(true)}
        />
      ) : (
        <img
          className="ambient-layer ambient-layer--poster"
          data-active={theme === 'light' ? 'true' : 'false'}
          src={LIGHT_POSTER}
          alt=""
        />
      )}

      {!showDarkPoster ? (
        <video
          ref={darkVideoRef}
          className="ambient-layer ambient-layer--dark"
          data-active={theme === 'dark' ? 'true' : 'false'}
          src={DARK_VIDEO}
          poster={DARK_POSTER}
          autoPlay={theme === 'dark'}
          muted
          loop
          playsInline
          preload={theme === 'dark' ? 'auto' : 'metadata'}
          onError={() => setDarkError(true)}
        />
      ) : (
        <img
          className="ambient-layer ambient-layer--poster"
          data-active={theme === 'dark' ? 'true' : 'false'}
          src={DARK_POSTER}
          alt=""
        />
      )}

      <div className="ambient-scrim" />
    </div>
  );
};

export default AmbientVideoBackdrop;
