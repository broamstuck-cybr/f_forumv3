import React, { useState } from 'react';
import { FAQ_ITEMS } from '../landingContent';

interface LandingFAQProps {
  onEnterApp: () => void;
}

export const LandingFAQ: React.FC<LandingFAQProps> = ({ onEnterApp }) => {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));

  return (
    <>
      <section id="faq" aria-label="Hỏi đáp thường gặp" className="lp-section scene-paper">
        <div className="wrap">
          <div className="lp-head">
            <div className="lp-head-copy">
              <p className="t-label">hỏi đáp minh bạch</p>
              <h2 className="t-title">Những câu hỏi cốt lõi trước khi bắt đầu</h2>
            </div>
          </div>

          <div className="lp-faq-grid">
            <div className="lp-faq-list">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div key={item.id} className="lp-faq-item">
                    <h3>
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${item.id}`}
                        id={`faq-trigger-${item.id}`}
                        className="lp-faq-trigger"
                      >
                        <span>{item.question}</span>
                        <span className="lp-faq-sign" aria-hidden="true">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                    </h3>

                    <div
                      id={`faq-panel-${item.id}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${item.id}`}
                      className="lp-faq-panel"
                      data-open={isOpen}
                    >
                      <div>
                        <p className="lp-faq-answer">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="lp-faq-aside">
              <p className="t-label">source of knowledge</p>
              <h3 className="t-title" style={{ fontSize: 'var(--text-2xl)' }}>
                Đặt câu hỏi đúng và đối chiếu từng dòng
              </h3>
              <p className="t-lead" style={{ fontSize: 'var(--text-sm)' }}>
                Mọi thảo luận trong Source of Knowledge đều gắn với bối cảnh thật, mã nguồn kiểm định và ghi nhận nguồn
                gốc rõ ràng.
              </p>
              <div>
                <button type="button" className="btn btn-red" onClick={onEnterApp}>
                  Mở F-Forum
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section aria-label="Bắt đầu dựng ngay" className="lp-closing scene-red">
        <div className="wrap lp-closing-row">
          <h2 className="lp-closing-title">
            Đặt câu hỏi đúng. Kiểm chứng <span className="t-italic">từng dòng.</span>
          </h2>
          <button type="button" className="btn btn-solid btn-lg" onClick={onEnterApp}>
            Mở Workspace
          </button>
        </div>
      </section>
    </>
  );
};

export default LandingFAQ;
