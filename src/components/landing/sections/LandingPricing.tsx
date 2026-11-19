import React from 'react';
import { ArrowRight, BookOpenCheck, Check } from 'lucide-react';
import { Reveal, SectionHeading } from '../LandingPrimitives';
import { PRICING_PLANS } from '../landingContent';

interface LandingPricingProps {
  onEnterApp: () => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onEnterApp }) => {
  return (
    <section
      id="bang-gia"
      aria-label="Chi phí và tiếp cận F-Forum"
      className="relative w-full border-y border-[var(--ff-border)] bg-[var(--ff-bg-soft)] py-20 sm:py-28"
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Chi phí & tiếp cận"
          title="Mở cửa tự do cho việc học và kiến tạo giao diện."
          description="Các tính năng cốt lõi hiện mở miễn phí cho người học và nhà phát triển. Hỗ trợ 15 lượt AI tiêu chuẩn và cấu hình BYOK linh hoạt."
        />

        <Reveal y={18} delay={120}>
          <p className="ff-chip mx-auto mt-8 flex w-fit max-w-full items-center gap-2 px-4 py-2.5 text-center text-[12px] sm:text-[13px]">
            <Check className="ff-ink--green h-4 w-4 shrink-0" aria-hidden="true" />
            Không cần thẻ thanh toán
          </p>
        </Reveal>

        <div className="mx-auto mt-10 max-w-3xl">
          {PRICING_PLANS.map((plan) => (
            <Reveal key={plan.id} y={24}>
              <article className="ff-glass ff-card ff-plan-card ff-plan-card--featured relative rounded-2xl p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/12 ring-1 ring-amber-400/25">
                      <BookOpenCheck className="h-5 w-5 text-amber-300" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-[18px] font-bold tracking-tight text-[var(--ff-text)]">{plan.name}</h3>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ff-text-soft)]">{plan.tagline}</p>
                    </div>
                  </div>
                  <span className="ff-plan-card__badge rounded-full px-2.5 py-1 font-mono text-[10.5px] font-bold">
                    {plan.badge}
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--ff-border)] pb-5">
                  <span className="text-4xl font-black font-mono text-[var(--ff-amber-ink)] sm:text-5xl">0₫</span>
                  <span className="text-sm text-[var(--ff-text-dim)]">miễn phí cốt lõi · 15 lượt AI + BYOK</span>
                </div>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2 m-0 p-0 list-none">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13px] text-[var(--ff-text-soft)]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-col gap-3 border-t border-[var(--ff-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-lg text-[12px] leading-relaxed text-[var(--ff-text-dim)]">{plan.footnote}</p>
                  <button
                    type="button"
                    onClick={onEnterApp}
                    className="ff-btn ff-btn-primary ff-plan-card__action group shrink-0 px-5 py-3 text-sm"
                  >
                    Vào ứng dụng
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal y={18} delay={120}>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 m-0 p-0 list-none">
            {['Tính năng cốt lõi miễn phí', 'Không quảng cáo xen kẽ', 'Minh bạch bản quyền MIT'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[12.5px] font-medium text-[var(--ff-text-dim)]">
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
};

export default LandingPricing;
