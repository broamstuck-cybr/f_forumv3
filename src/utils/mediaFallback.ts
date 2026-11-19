import React from 'react';

export const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" fill="#0c1018" stroke="#f59e0b" stroke-width="2.5"/>
      <circle cx="50" cy="38" r="17" fill="#2dd4bf"/>
      <path d="M22 84 C22 66 34 58 50 58 C66 58 78 66 78 84 Z" fill="#2dd4bf"/>
    </svg>`
  );

export const DEFAULT_CLUB_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" fill="none">
      <defs>
        <linearGradient id="coverBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#06080d"/>
          <stop offset="50%" stop-color="#121722"/>
          <stop offset="100%" stop-color="#0c1018"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#coverBg)"/>
      <circle cx="400" cy="225" r="88" fill="#121722" stroke="#f59e0b" stroke-width="3"/>
      <text x="400" y="235" font-family="'Be Vietnam Pro', 'Manrope', sans-serif" font-size="30" font-weight="bold" fill="#c89b54" text-anchor="middle">F-FORUM</text>
    </svg>`
  );

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement>,
  fallbackSrc: string = DEFAULT_AVATAR
) {
  const target = e.currentTarget;
  if (target.src !== fallbackSrc) {
    target.onerror = null;
    target.src = fallbackSrc;
  }
}

export function isTerminalVideoError(video: HTMLVideoElement, origin: EventTarget | null): boolean {
  if (origin === video || !origin) return true;
  const sources = video.querySelectorAll('source');
  return sources.length === 0 || origin === sources[sources.length - 1];
}

export function handleVideoError(
  e: React.SyntheticEvent<HTMLVideoElement>,
  fallbackSrc?: string
) {
  const target = e.currentTarget;
  if (fallbackSrc && target.src !== fallbackSrc && !target.currentSrc.endsWith('.mp4')) {
    target.src = fallbackSrc;
    target.load();
    target.play().catch(() => {});
    return;
  }
  if (!isTerminalVideoError(target, e.target)) return;
  target.onerror = null;
  target.style.display = 'none';
}
