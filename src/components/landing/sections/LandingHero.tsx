import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronDown,
  Layers,
  LogIn,
  MousePointerClick,
  Play,
  Sparkles,
} from 'lucide-react';
import type { DimensionView, User } from '../../../types/index';
import { AuroraBackdrop, MagneticButton, Reveal } from '../LandingPrimitives';
import { HardwareShowcase } from '../../HardwareShowcase';
import { scrollToSection, usePrefersReducedMotion } from '../useLandingMotion';
import { HERO_TRUST } from '../landingContent';

interface LandingHeroProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenLogin: () => void;
  onEnterApp: () => void;
  onNavigate: (view: DimensionView) => void;
}

const ScrollToExplore: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div
    aria-hidden={!visible}
    className={`fixed bottom-6 left-1/2 z-30 -translate-x-1/2 transition-opacity duration-500 sm:bottom-8 ${
      visible ? 'opacity-100' : 'pointer-events-none opacity-0'
    }`}
  >
    <button
      type="button"
      tabIndex={visible ? 0 : -1}
      onClick={() => scrollToSection('kham-pha')}
      className="ff-chip group flex flex-col items-center gap-1.5 !rounded-full px-4 py-2.5 text-[11px] font-medium text-[var(--ff-text-soft)] transition-colors hover:text-[var(--ff-text)] cursor-pointer"
      aria-label="Cuộn để khám phá F-Forum"
    >
      <span className="flex items-center gap-2">
        <MousePointerClick className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
        Cuộn để khám phá
      </span>
      <span className="relative flex h-6 w-4 items-start justify-center rounded-full border border-[var(--ff-border-strong)] pt-1">
        <span className="ff-scroll-dot h-1.5 w-1 rounded-full bg-amber-400" />
      </span>
    </button>
  </div>
);

export const LandingHero: React.FC<LandingHeroProps> = ({
  currentUser,
  onOpenAuth,
  onOpenLogin,
  onEnterApp,
  onNavigate,
}) => {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [showScrollCue, setShowScrollCue] = useState(true);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setShowScrollCue(window.scrollY < window.innerHeight * 0.55);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const handlePointer = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const node = sectionRef.current;
      if (!node || reduced) return;
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--hero-x', `${event.clientX - rect.left}px`);
      node.style.setProperty('--hero-y', `${event.clientY - rect.top}px`);
    },
    [reduced]
  );

  return (
    <section
      id="top"
      ref={sectionRef}
      onMouseMove={handlePointer}
      className="relative isolate flex w-full flex-col justify-center overflow-hidden px-4 pb-16 pt-28 sm:px-8 sm:pt-32 lg:min-h-[calc(100svh-1rem)] lg:pb-20 lg:pt-32"
      aria-label="Giới thiệu F-Forum"
    >
      <AuroraBackdrop variant="amber" />
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="ff-grid absolute inset-0 opacity-40" />
        <div className="ff-landing-hero-light absolute inset-0" />
        <div
          className="absolute inset-0 opacity-70 transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(640px circle at var(--hero-x, 50%) var(--hero-y, 30%), rgba(245,158,11,0.14), transparent 75%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-[var(--ff-bg)]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-col items-center">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="flex flex-col items-start text-left lg:col-span-7">
            <Reveal y={14}>
              <div
                className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[12px] font-medium text-amber-300 backdrop-blur-md"
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span>Cộng đồng học thuật &amp; kiến tạo Web/UI bằng AI</span>
              </div>
            </Reveal>

            <Reveal y={24} delay={70}>
              <h1 className="ff-display mt-7 text-[2.45rem] leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.85rem] text-[var(--ff-text)]">
                <span className="block font-serif italic text-[var(--ff-amber-ink)] font-normal">
                  Khai phóng tư duy,
                </span>
                <span className="mt-2 block font-sans font-extrabold text-[var(--ff-text)]">
                  chạm sâu bản chất tri thức.
                </span>
              </h1>
            </Reveal>

            <Reveal y={22} delay={140}>
              <p
                className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-[var(--ff-text-soft)] sm:text-[16.5px] p-5 rounded-2xl backdrop-blur-lg"
                style={{
                  background: 'var(--ff-surface)',
                  border: '1px solid var(--ff-border)',
                }}
              >
                F-Forum v3 kết hợp Home Launchpad, Work space 3 cột có Live Sandbox Preview, kho 121 template UI/UX
                tuyển chọn và cộng đồng Source of Knowledge minh bạch.
              </p>
            </Reveal>

            <Reveal y={20} delay={210} className="w-full">
              <div className="mt-8 flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center flex-wrap">
                <MagneticButton size="lg" variant="primary" onClick={onEnterApp} className="w-full sm:w-auto">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  <span>Bắt đầu</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </MagneticButton>

                <MagneticButton
                  size="lg"
                  variant="ghost"
                  onClick={() => onNavigate('explore')}
                  className="w-full sm:w-auto backdrop-blur-md"
                >
                  <Layers className="h-4 w-4 text-teal-400" aria-hidden="true" />
                  <span>Kho Explore</span>
                </MagneticButton>

                {!currentUser && (
                  <div className="flex items-center gap-2">
                    <MagneticButton
                      size="md"
                      variant="ghost"
                      className="backdrop-blur-md"
                      onClick={onOpenAuth}
                    >
                      <BookOpenCheck className="h-4 w-4 text-amber-300" aria-hidden="true" />
                      <span>Đăng ký</span>
                    </MagneticButton>

                    <MagneticButton
                      size="md"
                      variant="ghost"
                      className="backdrop-blur-md"
                      onClick={onOpenLogin}
                    >
                      <LogIn className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                      <span>Đăng nhập</span>
                    </MagneticButton>
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal y={16} delay={270}>
              <div
                className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5 p-4 rounded-xl backdrop-blur-sm"
                style={{
                  background: 'var(--ff-surface)',
                  border: '1px solid var(--ff-border)',
                }}
              >
                {HERO_TRUST.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[12.5px] text-[var(--ff-text-soft)]">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="flex w-full items-center justify-center lg:col-span-5">
            <Reveal variant="scale" y={20} delay={120} className="w-full flex justify-center">
              <div className="relative group w-full flex justify-center">
                <HardwareShowcase onNavigate={onNavigate} />
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-12 hidden items-center gap-2 text-[12px] text-[var(--ff-text-dim)] lg:flex">
        <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[var(--ff-border-strong)]" />
        <ChevronDown className="ff-chevron-1 h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
        Cuộn để trải nghiệm toàn cảnh
        <ChevronDown className="ff-chevron-2 h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
        <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[var(--ff-border-strong)]" />
      </div>

      <ScrollToExplore visible={showScrollCue} />
    </section>
  );
};

export default LandingHero;
