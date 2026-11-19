import React, { useCallback, useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { Menu, X } from 'lucide-react';
import type { User } from '../../types/index';
import { DEFAULT_AVATAR, handleImageError } from '../../utils/mediaFallback';
import { KineticLogo } from '../brand/KineticLogo';
import { LANDING_CHAPTERS } from './landingContent';
import { scrollToSection, useActiveChapter, usePrefersReducedMotion } from './useLandingMotion';

export interface LandingNavProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onEnterApp: () => void;
}

const CHAPTER_IDS = LANDING_CHAPTERS.map((c) => c.id);

export const LandingNav: React.FC<LandingNavProps> = ({
  currentUser,
  onOpenLogin,
  onOpenRegister,
  onEnterApp,
}) => {
  const reduced = usePrefersReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeSection = useActiveChapter(CHAPTER_IDS);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 34,
    restDelta: 0.001,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId = 0;
    const sync = () => {
      rafId = 0;
      const y = window.scrollY || 0;
      setScrolled((prev) => (prev ? y > 16 : y > 32));
    };
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const goToSection = useCallback((id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 transform-gpu">
      <div className="h-[2px] w-full bg-transparent overflow-hidden" aria-hidden="true">
        <motion.div
          className="h-full w-full origin-left"
          style={{
            scaleX: reduced ? scrollYProgress : smoothProgress,
            background: 'linear-gradient(90deg, #e5c384 0%, #c89b54 60%, #2dd4bf 100%)',
          }}
        />
      </div>

      <div className="relative mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
        <div
          className={`pointer-events-none absolute inset-0 -z-10 backdrop-blur-xl transition-colors duration-300 ${
            scrolled
              ? 'bg-[var(--ff-bg)]/88 border-b border-[var(--ff-border)]'
              : 'bg-transparent border-b border-transparent'
          }`}
          aria-hidden="true"
        />

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onEnterApp();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent border-0 p-0 cursor-pointer"
            aria-label="F-Forum"
            title="F-Forum"
          >
            <KineticLogo size={30} showWordmark={false} />
          </button>
          <span
            className="text-[19px] font-semibold tracking-tight whitespace-nowrap select-none"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--ff-amber-ink)' }}
          >
            F-Forum
          </span>
        </div>

        <nav aria-label="Điều hướng chương" className="hidden items-center gap-1 lg:flex">
          {LANDING_CHAPTERS.map((chapter) => {
            const active = activeSection === chapter.id;
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => goToSection(chapter.id)}
                aria-current={active ? 'true' : undefined}
                className={`relative whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium bg-transparent border-0 cursor-pointer transition-colors duration-200 ${
                  active ? 'text-[var(--ff-text)]' : 'text-[var(--ff-text-soft)] hover:text-[var(--ff-text)]'
                }`}
              >
                {chapter.label}
                <span
                  className={`absolute inset-x-4 bottom-1 h-[1.5px] origin-left rounded-full transition-transform duration-300 ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                  style={{ background: 'var(--ff-amber)' }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          {currentUser ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface)] px-3 py-1.5 text-[12.5px]">
                <img
                  src={currentUser.avatar || DEFAULT_AVATAR}
                  alt={currentUser.name || 'Hồ sơ'}
                  onError={(e) => handleImageError(e, DEFAULT_AVATAR)}
                  loading="lazy"
                  decoding="async"
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full object-cover"
                />
                <span className="max-w-[110px] truncate font-medium text-[var(--ff-text)]">
                  {currentUser.name}
                </span>
              </span>
              <button type="button" onClick={onEnterApp} className="ff-btn ff-btn-primary px-5 py-2.5 text-[13px]">
                Bắt đầu
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onOpenLogin} className="ff-btn ff-btn-ghost px-4 py-2.5 text-[13px]">
                Đăng nhập
              </button>
              <button type="button" onClick={onEnterApp} className="ff-btn ff-btn-primary px-5 py-2.5 text-[13px]">
                Bắt đầu
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="ff-mobile-menu"
          aria-label={menuOpen ? 'Đóng' : 'Mở rộng'}
          title={menuOpen ? 'Đóng' : 'Mở rộng'}
          className="ff-btn ff-btn-ghost h-10 w-10 !p-0 lg:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <div
        id="ff-mobile-menu"
        hidden={!menuOpen}
        className={`lg:hidden ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Đóng"
          title="Đóng"
          className="fixed inset-0 -z-10 bg-black/60 backdrop-blur-sm border-0 outline-none cursor-default"
          onClick={() => setMenuOpen(false)}
        />
        <div className="mx-4 mt-2 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-bg-soft)] p-5 shadow-2xl">
          <nav aria-label="Điều hướng di động" className="grid gap-1">
            {LANDING_CHAPTERS.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => goToSection(chapter.id)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-[var(--ff-text-soft)] bg-transparent border-0 cursor-pointer hover:bg-[var(--ff-surface)] hover:text-[var(--ff-text)]"
              >
                {chapter.label}
              </button>
            ))}
          </nav>

          <div className="mt-4 grid gap-2 border-t border-[var(--ff-border)] pt-4">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEnterApp();
              }}
              className="ff-btn ff-btn-primary w-full px-5 py-3 text-sm"
            >
              Bắt đầu
            </button>
            {!currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="ff-btn ff-btn-ghost w-full px-5 py-3 text-sm"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenRegister();
                  }}
                  className="ff-btn ff-btn-ghost w-full px-5 py-3 text-sm"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingNav;
