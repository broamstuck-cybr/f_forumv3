import React, { useEffect, useRef, useState } from 'react';
import type { PreviewEntry } from '../../ui/Media';

interface SpecimenMediaProps {
  preview: PreviewEntry;
  title: string;
  fallbackLabel: string;
  className?: string;
  style?: React.CSSProperties;
  fit?: 'cover' | 'contain';
  activePlay?: boolean;
}

export const SpecimenMedia: React.FC<SpecimenMediaProps> = ({
  preview,
  title,
  fallbackLabel,
  className,
  style,
  fit = 'cover',
  activePlay = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setPosterFailed(false);
  }, [preview.src, preview.poster]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || preview.kind !== 'video') return;
    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('reduce-motion');
    if (activePlay && !reduce) {
      video.play().catch(() => undefined);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !reduce) {
            video.play().catch(() => undefined);
          } else {
            video.pause();
          }
        });
      },
      { rootMargin: '120px' }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [preview, activePlay]);

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: fit,
    ...style,
  };

  if (failed) {
    if (preview.kind === 'video' && preview.poster && !posterFailed) {
      return (
        <img
          className={className}
          style={mediaStyle}
          src={preview.poster}
          alt={title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setPosterFailed(true)}
        />
      );
    }
    return (
      <div
        className={className}
        style={{
          ...mediaStyle,
          display: 'grid',
          placeItems: 'center',
          padding: '16px',
          textAlign: 'center',
          background: 'var(--bg-sunken)',
        }}
        role="img"
        aria-label={title}
      >
        <div className="ex-media-fallback">
          <span className="t-label">{fallbackLabel}</span>
          <span className="ex-media-fallback-title">{title}</span>
        </div>
      </div>
    );
  }

  if (preview.kind === 'video') {
    return (
      <video
        ref={videoRef}
        className={className}
        style={mediaStyle}
        src={preview.src}
        poster={preview.poster}
        muted
        loop
        playsInline
        preload={activePlay ? 'metadata' : 'none'}
        aria-label={title}
        onLoadedMetadata={(e) => {
          if (e.currentTarget.videoWidth === 0) setFailed(true);
        }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <img
      className={className}
      style={mediaStyle}
      src={preview.src}
      alt={title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
};
