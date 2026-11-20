import React, { useEffect, useRef, useState } from 'react';
import previewMapJson from '../data/previewMap.json';

export interface PreviewEntry {
  kind: 'video' | 'image';
  src: string;
  poster?: string;
  credit: string;
}

const previewMap = previewMapJson as Record<string, PreviewEntry>;

export function previewFor(itemId: string): PreviewEntry | null {
  return previewMap[itemId] ?? null;
}

export const PREVIEW_COUNT = Object.keys(previewMap).length;

interface MediaProps {
  preview: PreviewEntry;
  title: string;
  className?: string;
  style?: React.CSSProperties;
  fit?: 'cover' | 'contain';
  onFail?: () => void;
}

export const Media: React.FC<MediaProps> = ({ preview, title, className, style, fit = 'cover', onFail }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || preview.kind !== 'video') return;
    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('reduce-motion');
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
  }, [preview]);

  const fail = () => {
    setFailed(true);
    if (onFail) onFail();
  };

  const mediaStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: fit, ...style };

  if (failed) {
    return (
      <div
        className={className}
        style={{ ...mediaStyle, display: 'grid', placeItems: 'center', background: 'var(--bg-sunken)' }}
        role="img"
        aria-label={title}
      >
        <span className="t-label">{preview.credit}</span>
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
        preload="none"
        aria-label={title}
        onError={fail}
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
      onError={fail}
    />
  );
};
