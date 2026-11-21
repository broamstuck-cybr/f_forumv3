import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { Menu, X } from 'lucide-react';
import type { User } from '../../types/index';
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

function userInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U'
  );
}

export const LandingNav: React.FC<LandingNavProps> = ({
  currentUser,
  onOpenLogin,
  onEnterApp,
}) => {
  const reduced = usePrefersReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeSection = useActiveChapter(CHAPTER_IDS);
  const closeRef = useRef<HTMLButtonElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

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

  const handleBrandClick = useCallback(() => {
    setMenuOpen(false);
    scrollToSection('top', 0);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const burger = burgerRef.current;
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      burger?.focus();
    };
  }, [menuOpen]);

  return (
    <header className="lp-nav" data-scrolled={scrolled}>
      <div className="lp-progress" aria-hidden="true">
        <motion.div
          className="lp-progress-bar"
          style={{ scaleX: reduced ? scrollYProgress : smoothProgress }}
        />
      </div>

      <div className="wrap-wide lp-nav-row">
        <div className="nav__brand">
          <button
            type="button"
            className="lp-brand-mark-btn"
            onClick={handleBrandClick}
            aria-label="F-Forum, về đầu trang"
            title="Về đầu trang"
          >
            <KineticLogo size={26} />
          </button>
          <button
            type="button"
            className="lp-brand-text-btn"
            onClick={handleBrandClick}
          >
            F-Forum
          </button>
        </div>

        <nav aria-label="Điều hướng chương" className="lp-nav-tabs">
          {LANDING_CHAPTERS.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              className="lp-nav-tab"
              aria-current={activeSection === chapter.id ? 'true' : undefined}
              onClick={() => goToSection(chapter.id)}
            >
              {chapter.label}
            </button>
          ))}
        </nav>

        <div className="lp-nav-actions">
          {currentUser ? (
            <button
              type="button"
              className="lp-nav-userBtn"
              onClick={onEnterApp}
              title={`Đang đăng nhập: ${currentUser.name} · Mở Workspace`}
            >
              <span className="lp-nav-avatar" aria-hidden="true">
                {userInitials(currentUser.name)}
              </span>
              <span className="lp-nav-userName">{currentUser.name}</span>
            </button>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenLogin}>
              Đăng nhập
            </button>
          )}
          <button type="button" className="btn btn-red btn-sm" onClick={onEnterApp}>
            Bắt đầu
          </button>
        </div>

        <button
          ref={burgerRef}
          type="button"
          className="icon-btn lp-burger"
          onClick={() => setMenuOpen(true)}
          aria-label="Mở menu"
          title="Mở menu"
          aria-expanded={menuOpen}
        >
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="navsheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="navsheet__top">
              <KineticLogo size={26} showWordmark />
              <button
                ref={closeRef}
                type="button"
                className="icon-btn"
                onClick={() => setMenuOpen(false)}
                aria-label="Đóng menu"
                title="Đóng menu"
              >
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <ul className="navsheet__list">
              {LANDING_CHAPTERS.map((chapter) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    className="navsheet__link"
                    aria-current={activeSection === chapter.id ? 'page' : undefined}
                    onClick={() => goToSection(chapter.id)}
                  >
                    {chapter.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="navsheet__foot">
              <button
                type="button"
                className="btn btn-red"
                onClick={() => {
                  setMenuOpen(false);
                  onEnterApp();
                }}
              >
                Bắt đầu
              </button>
              {!currentUser && (
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenLogin();
                  }}
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingNav;
