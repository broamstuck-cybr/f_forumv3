import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { DimensionView, User } from '../../../types/index';
import { Mark } from '../../../ui/Mark';
import { HardwareShowcase } from '../../HardwareShowcase';
import { usePrefersReducedMotion } from '../useLandingMotion';

interface LandingHeroProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenLogin: () => void;
  onEnterApp: () => void;
  onNavigate: (view: DimensionView) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  currentUser,
  onOpenLogin,
  onEnterApp,
  onNavigate,
}) => {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const copyY = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -48]);

  return (
    <section id="top" ref={sectionRef} aria-label="Khởi đầu F-Forum" className="lp-hero scene-ink">
      <div className="wrap-wide">
        <div className="lp-hero-grid">
          <motion.div style={reduced ? undefined : { y: copyY }} className="lp-hero-copy">
            <p className="lp-kicker t-label">
              <span>F-Forum</span>
              <span>học thuật, phản biện, kiến tạo web</span>
            </p>

            <h1 className="lp-hero-title">
              <span className="t-script lp-cap">K</span>hai phóng tư duy,{' '}
              <Mark kind="underline" active>
                kiểm chứng
              </Mark>{' '}
              từng dòng mã.
            </h1>

            <p className="lp-hero-lead">
              F-Forum là không gian kiến tạo Web/UI cho học sinh, giảng viên và người thiết kế web phản biện: dựng bằng
              AI, chạy thật trong Live View cô lập và chấm từng dòng bằng Diff &amp; Check.
            </p>

            <div className="lp-actions">
              <button type="button" className="btn btn-red btn-lg" onClick={onEnterApp}>
                Bắt đầu
              </button>
              <button type="button" className="btn btn-line btn-lg" onClick={() => onNavigate('explore')}>
                Khám phá
              </button>
              {!currentUser && (
                <button type="button" className="btn btn-ghost btn-lg" onClick={onOpenLogin}>
                  Đăng nhập
                </button>
              )}
            </div>

            <dl className="lp-colophon">
              <div>
                <dt className="t-label">kho tham chiếu</dt>
                <dd>6.770 mẫu</dd>
              </div>
              <div>
                <dt className="t-label">kiểm định</dt>
                <dd className="lp-colophon-accent">6 phép kiểm</dd>
              </div>
              <div>
                <dt className="t-label">truy cập mở</dt>
                <dd>0₫</dd>
              </div>
            </dl>
          </motion.div>

          <motion.div style={reduced ? undefined : { y: phoneY }} className="lp-hero-phone">
            <HardwareShowcase onNavigate={onNavigate} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
