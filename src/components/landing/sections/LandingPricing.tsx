import React from 'react';
import { OPEN_ACCESS_FEATURES } from '../landingContent';
import { Mark } from '../../../ui/Mark';
import { Reveal } from '../../../ui/Reveal';

interface LandingPricingProps {
  onEnterApp: () => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onEnterApp }) => {
  return (
    <section id="bang-gia" aria-label="Truy cập Mở" className="lp-section sheet scene-paper">
      <div className="wrap">
        <div className="lp-head">
          <div className="lp-head-copy">
            <p className="t-label">truy cập mở cho học tập và phản biện</p>
            <h2 className="t-title">
              Mở miễn phí, <Mark kind="box">minh bạch</Mark> giấy phép
            </h2>
          </div>
        </div>

        <Reveal className="lp-open-sheet">
          <div className="lp-price-col">
            <div>
              <p className="t-label">phiên bản học thuật</p>
              <p className="lp-price-num">0đ</p>
              <p className="t-label" style={{ marginTop: 'var(--space-2)' }}>
                15 lượt AI tiêu chuẩn + BYOK
              </p>
            </div>
            <div>
              <button type="button" className="btn btn-solid btn-lg" onClick={onEnterApp}>
                Bắt đầu
              </button>
            </div>
          </div>

          <ul className="lp-feature-list">
            {OPEN_ACCESS_FEATURES.map((feature, index) => (
              <li key={feature}>
                <span className="lp-feature-mark" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
};

export default LandingPricing;
