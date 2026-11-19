import React from 'react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';

interface Skybridge404Props {
  onNavigate?: (route: AppRoute) => void;
}

const SKYBRIDGE_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260801_001207_ec20d138-aa45-4b2b-ab8c-bdc71607f240.mp4';

export const Skybridge404: React.FC<Skybridge404Props> = ({ onNavigate }) => {
  const { navigate, reducedMotion } = useAppStore();
  const go = onNavigate || navigate;

  return (
    <main
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-5 py-16"
      style={{
        backgroundColor: '#06080d',
        color: '#f1efe9',
      }}
    >
      {!reducedMotion ? (
        <video
          src={SKYBRIDGE_VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-100"
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 24%, rgba(245, 158, 11, 0.14), transparent 55%), linear-gradient(180deg, #06080d 0%, #0d121c 100%)',
          }}
        />
      )}

      <div
        aria-label="F-FORUM"
        className="absolute top-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 sm:top-16"
      >
        <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
          <path d="M5 6H27V11.5H11V14.5H23V19.5H11V27H5V6Z" fill="#f1efe9" />
          <path d="M21 21H27V27H21V21Z" fill="var(--accent-primary)" />
        </svg>
        <span className="font-mono text-sm font-semibold tracking-[0.14em] text-[#f1efe9]">
          F-FORUM
        </span>
      </div>

      <section className="relative z-10 flex w-full max-w-[483px] flex-col items-center gap-7 text-center sm:gap-10">
        <h1
          className="select-none font-mono font-semibold"
          style={{
            fontSize: 'clamp(136px, 42vw, 260px)',
            lineHeight: 1.04,
            letterSpacing: '-0.08em',
            paddingBottom: '0.06em',
            backgroundImage:
              'linear-gradient(247deg, rgb(255, 255, 255) 4%, rgba(255, 255, 255, 0.42) 94%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          404
        </h1>

        <div className="h-px w-full max-w-[425px] bg-white/90" aria-hidden="true" />

        <p
          className="max-w-[460px] font-mono font-semibold text-white"
          style={{
            fontSize: 'clamp(17px, 3.8vw, 23px)',
            lineHeight: 1.25,
            letterSpacing: '-0.04em',
          }}
        >
          Đường dẫn này không tồn tại, nhưng hành trình xây dựng vẫn tiếp tục. Quay lại điểm khởi đầu.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go('home')}
            className="inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#06080d',
              transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 180ms ease',
            }}
          >
            <span>Trang chủ</span>
          </button>

          <button
            type="button"
            onClick={() => go('workspace')}
            className="inline-flex h-11 items-center rounded-full border px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: 'rgba(12, 16, 24, 0.72)',
              borderColor: 'rgba(255, 255, 255, 0.26)',
              color: '#f1efe9',
              backdropFilter: 'blur(10px)',
              transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 180ms ease',
            }}
          >
            <span>Workspace</span>
          </button>
        </div>
      </section>
    </main>
  );
};
