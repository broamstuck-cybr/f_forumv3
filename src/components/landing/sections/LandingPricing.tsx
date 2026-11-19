import React from 'react';
import { Check } from 'lucide-react';
import { OPEN_ACCESS_FEATURES } from '../landingContent';
import { Reveal, SectionHeading } from '../LandingPrimitives';

interface LandingPricingProps {
  onEnterApp: () => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onEnterApp }) => {
  return (
    <section
      id="bang-gia"
      aria-label="Truy cập Mở"
      className="relative w-full border-y border-[var(--ff-border)] bg-[var(--ff-bg-soft)] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1100px] px-4 sm:px-8">
        <SectionHeading
          title={
            <>
              <span className="ff-serif-editorial">Truy cập Mở</span>
              <span className="block mt-1">cho học tập và phản biện</span>
            </>
          }
          description="Các công cụ cốt lõi đều mở miễn phí, không quảng cáo xen kẽ và ghi nhận đầy đủ bản quyền mã nguồn mở."
        />

        <Reveal y={16} delay={40}>
          <div className="ff-glass mt-12 rounded-[32px] p-7 sm:p-10">
            <div className="flex flex-col gap-6 border-b border-[var(--ff-border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ff-amber-ink)]">
                  F-Forum · Phiên bản Học thuật
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span
                    className="text-4xl sm:text-5xl font-semibold text-[var(--ff-text)]"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    0₫
                  </span>
                  <span className="font-mono text-[12.5px] text-[var(--ff-text-dim)]">
                    15 lượt AI tiêu chuẩn + BYOK
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onEnterApp}
                className="ff-btn ff-btn-primary px-7 py-3.5 text-[14px]"
              >
                Bắt đầu
              </button>
            </div>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 m-0 p-0 list-none">
              {OPEN_ACCESS_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-[14px] leading-relaxed text-[var(--ff-text-soft)]"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ff-emerald)]" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default LandingPricing;
