import React, { useState } from 'react';
import { FAQ_ITEMS } from '../landingContent';
import { Reveal, SectionHeading } from '../LandingPrimitives';

interface LandingFAQProps {
  onEnterApp: () => void;
}

export const LandingFAQ: React.FC<LandingFAQProps> = ({ onEnterApp }) => {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));

  return (
    <section id="faq" aria-label="Hỏi đáp thường gặp" className="relative w-full py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
        <SectionHeading
          title={
            <>
              <span className="ff-serif-editorial">Hỏi đáp</span>
              <span className="block mt-1">Minh bạch trước khi bắt đầu</span>
            </>
          }
          description="Những câu hỏi cốt lõi về quyền riêng tư, sandbox thực thi, bản quyền mẫu và quy trình phản biện."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.65fr)]">
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openId === item.id;
              return (
                <Reveal key={item.id} y={14} delay={idx * 35}>
                  <div className="ff-glass rounded-2xl">
                    <h3 className="m-0">
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${item.id}`}
                        id={`faq-trigger-${item.id}`}
                        className="ff-faq-trigger"
                      >
                        <span className="text-[15px] font-semibold tracking-tight">
                          {item.question}
                        </span>
                      </button>
                    </h3>

                    <div
                      id={`faq-panel-${item.id}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${item.id}`}
                      className="ff-accordion-panel"
                      data-open={isOpen}
                    >
                      <div>
                        <p className="m-0 px-6 pb-6 text-[14px] leading-relaxed text-[var(--ff-text-soft)]">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal y={14} delay={80}>
            <div className="ff-glass sticky top-28 flex flex-col justify-between gap-6 rounded-[28px] p-7">
              <div className="space-y-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ff-amber-ink)]">
                  Kiểm chứng cộng đồng
                </div>
                <h3
                  className="m-0 text-xl font-semibold text-[var(--ff-text)]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Đặt câu hỏi đúng và đối chiếu từng dòng
                </h3>
                <p className="m-0 text-[13.5px] leading-relaxed text-[var(--ff-text-soft)]">
                  Mọi thảo luận trong Source of Knowledge đều gắn với bối cảnh thật, mã nguồn kiểm định và ghi nhận nguồn gốc rõ ràng.
                </p>
              </div>

              <button
                type="button"
                onClick={onEnterApp}
                className="ff-btn ff-btn-primary w-full px-6 py-3.5 text-[13.5px]"
              >
                Bắt đầu
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;
