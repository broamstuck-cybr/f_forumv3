import React from 'react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { KineticLogo } from '../brand/KineticLogo';

interface Skybridge404Props {
  onNavigate?: (route: AppRoute) => void;
}

const SKYBRIDGE_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260801_001207_ec20d138-aa45-4b2b-ab8c-bdc71607f240.mp4';

export const Skybridge404: React.FC<Skybridge404Props> = ({ onNavigate }) => {
  const { navigate, reducedMotion } = useAppStore();
  const go = onNavigate || navigate;

  return (
    <div
      className="scene-ink relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-5 py-16"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--fg)',
      }}
    >
      {!reducedMotion && (
        <video
          src={SKYBRIDGE_VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
        />
      )}

      <div aria-label="F-Forum" className="absolute top-8 left-1/2 z-10 -translate-x-1/2 sm:top-14">
        <KineticLogo size={28} showWordmark />
      </div>

      <section className="relative z-10 flex w-full max-w-[483px] flex-col items-center gap-7 text-center sm:gap-10">
        <h1 className="t-mega select-none" style={{ color: 'var(--fg)' }}>
          404
        </h1>

        <hr className="rule rule-strong" style={{ maxWidth: '420px' }} />

        <p className="t-lead" style={{ maxWidth: '42ch', color: 'var(--fg)' }}>
          Đường dẫn này không tồn tại, nhưng hành trình xây dựng vẫn tiếp tục. Quay lại điểm khởi đầu.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => go('home')} className="btn btn-red">
            Trang chủ
          </button>

          <button type="button" onClick={() => go('workspace')} className="btn btn-line">
            Workspace
          </button>
        </div>
      </section>
    </div>
  );
};
