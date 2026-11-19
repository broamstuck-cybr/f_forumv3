import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { DimensionView, User } from '../../../types/index';
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
  onOpenAuth,
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

  const bgY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -36]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -64]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);

  return (
    <section
      id="top"
      ref={sectionRef}
      aria-label="Khởi đầu F-Forum"
      className="relative isolate flex w-full flex-col justify-center overflow-hidden px-4 pb-16 pt-28 sm:px-8 sm:pt-32 lg:min-h-[100svh] lg:pb-20"
    >
      <motion.div
        style={reduced ? undefined : { y: bgY }}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="ff-grid absolute inset-0 opacity-45" />
        <div
          className="ff-aurora"
          style={{
            width: '540px',
            height: '540px',
            top: '-14%',
            left: '-6%',
            background: 'radial-gradient(circle at 35% 35%, rgba(200,155,84,0.34), transparent 64%)',
          }}
        />
        <div
          className="ff-aurora"
          style={{
            width: '480px',
            height: '480px',
            bottom: '-8%',
            right: '-8%',
            background: 'radial-gradient(circle at 60% 60%, rgba(45,212,191,0.22), transparent 64%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-[var(--ff-bg)]" />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-[1380px]">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
          <motion.div
            style={reduced ? undefined : { y: copyY, opacity: copyOpacity }}
            className="flex flex-col items-start text-left lg:col-span-7"
          >
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface)] px-4 py-1.5 text-[11.5px] font-mono text-[var(--ff-amber-ink)]">
              <span>01</span>
              <span className="h-3 w-px bg-[var(--ff-border-strong)]" aria-hidden="true" />
              <span>Học thuật · Phản biện · Kiến tạo</span>
            </div>

            <h1
              className="mt-7 text-[2.5rem] leading-[1.06] tracking-tight sm:text-5xl lg:text-[4rem]"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--ff-text)' }}
            >
              <span className="block font-semibold">
                <span className="ornate-cap" style={{ color: 'var(--ff-amber-ink)' }}>
                  K
                </span>
                hai phóng tư duy,
              </span>
              <span
                className="mt-2 block font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--ff-text)' }}
              >
                kiểm chứng từng dòng mã.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-[var(--ff-text-soft)] sm:text-[17px]">
              F-Forum kết nối sinh viên, giảng viên và những người thiết kế web coi trọng phản biện:
              dựng giao diện trên Live View cô lập, đối chiếu Diff &amp; Check và tham chiếu kho mẫu
              PinUI, ThreeUI, MotionSites, LucianLabs cùng SOURCEOFKNOWLEDGFORAI.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onEnterApp}
                className="ff-btn ff-btn-primary px-7 py-3.5 text-[14.5px]"
              >
                Bắt đầu
              </button>

              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className="ff-btn ff-btn-ghost px-6 py-3.5 text-[14.5px]"
              >
                Khám phá
              </button>

              {!currentUser && (
                <>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="ff-btn ff-btn-ghost px-5 py-3 text-[13.5px]"
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="ff-btn ff-btn-ghost px-5 py-3 text-[13.5px]"
                  >
                    Đăng ký
                  </button>
                </>
              )}
            </div>

            <div className="mt-9 grid w-full max-w-xl grid-cols-3 gap-3 sm:gap-5 border-t border-[var(--ff-border)] pt-6">
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-[var(--ff-text-dim)] truncate">Thành phần thật</div>
                <div
                  className="mt-1 font-mono font-semibold text-[var(--ff-text)] whitespace-nowrap leading-none"
                  style={{ fontSize: 'clamp(1.05rem, 1.7vw, 1.55rem)' }}
                >
                  6.770
                </div>
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-[var(--ff-text-dim)] truncate">Kiểm định</div>
                <div
                  className="mt-1 font-mono font-semibold text-[var(--ff-amber-ink)] whitespace-nowrap leading-none"
                  style={{ fontSize: 'clamp(1.05rem, 1.7vw, 1.55rem)' }}
                >
                  Diff &amp; Check
                </div>
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-[var(--ff-text-dim)] truncate">Môi trường</div>
                <div
                  className="mt-1 font-mono font-semibold text-[var(--ff-cyan)] whitespace-nowrap leading-none"
                  style={{ fontSize: 'clamp(1.05rem, 1.7vw, 1.55rem)' }}
                >
                  Live View
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            style={reduced ? undefined : { y: phoneY }}
            className="flex w-full items-center justify-center lg:col-span-5"
          >
            <HardwareShowcase onNavigate={onNavigate} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
