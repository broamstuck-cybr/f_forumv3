import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { User } from '../../types/index';
import { IconMenu, IconX } from '../../ui/icons';
import { KineticLogo } from '../brand/KineticLogo';
import { NotificationBell } from '../layout/NotificationBell';
import { triggerPinuiThemeToggle } from '../layout/GlobalThemeAtmosphere';
import { useAppStore } from '../../store/appStore';
import { LANDING_CHAPTERS, LANDING_CHAPTERS_EN } from './landingContent';
import { scrollToSection, useActiveChapter, usePrefersReducedMotion } from './useLandingMotion';

export interface LandingNavProps {
  currentUser: User | null;
  activeChapterId?: string;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onEnterApp: () => void;
}

const CHAPTER_IDS = LANDING_CHAPTERS.map((c) => c.id);
const EMPTY_CHAPTER_IDS: string[] = [];

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
  activeChapterId,
  onOpenLogin,
  onEnterApp,
}) => {
  const { theme, language } = useAppStore();
  const isEn = language === 'en';
  const chapters = isEn ? LANDING_CHAPTERS_EN : LANDING_CHAPTERS;
  const reduced = usePrefersReducedMotion();
  const themeToggleLabel = isEn
    ? theme === 'dark'
      ? 'Switch to light mode'
      : 'Switch to dark mode'
    : theme === 'dark'
      ? 'Chuyển sang giao diện sáng'
      : 'Chuyển sang giao diện tối';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fallbackSection = useActiveChapter(activeChapterId === undefined ? CHAPTER_IDS : EMPTY_CHAPTER_IDS);
  const activeSection = activeChapterId ?? fallbackSection;
  const closeRef = useRef<HTMLButtonElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

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

        <nav aria-label={isEn ? 'Section navigation' : 'Điều hướng chương'} className="lp-nav-tabs">
          {chapters.map((chapter) => (
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
          <NotificationBell onNavigate={() => onEnterApp()} />
          <button
            type="button"
            className="icon-btn nav__themeBtn"
            data-theme-state={theme}
            onClick={(event) => triggerPinuiThemeToggle(event.currentTarget)}
            aria-label={themeToggleLabel}
            title={isEn ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : (theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối')}
          >
            <svg className="nav__ptsIcon nav__ptsIcon--moon" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20.985 12.486C20.8913 14.2221 20.2967 15.894 19.2731 17.2994C18.2495 18.7048 16.8407 19.7837 15.217 20.4055C13.5934 21.0274 11.8243 21.1656 10.1238 20.8035C8.42322 20.4414 6.86395 19.5945 5.63446 18.3652C4.40497 17.1358 3.55789 15.5766 3.19562 13.8761C2.83334 12.1756 2.97139 10.4065 3.59308 8.78282C4.21476 7.15909 5.29346 5.75019 6.69877 4.72644C8.10409 3.70268 9.77586 3.1079 11.512 3.014C11.917 2.992 12.129 3.474 11.914 3.817C11.1949 4.96755 10.887 6.32787 11.0405 7.67595C11.194 9.02403 11.7999 10.2803 12.7593 11.2397C13.7187 12.1991 14.975 12.805 16.323 12.9585C17.6711 13.112 19.0314 12.8041 20.182 12.085C20.526 11.87 21.007 12.081 20.985 12.486Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg className="nav__ptsIcon nav__ptsIcon--sun" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34" />
              </g>
            </svg>
          </button>
          {currentUser ? (
            <button
              type="button"
              className="lp-nav-userBtn"
              onClick={onEnterApp}
              title={isEn ? `Signed in: ${currentUser.name} · Open Workspace` : `Đang đăng nhập: ${currentUser.name} · Mở Workspace`}
            >
              <span className="lp-nav-avatar" aria-hidden="true">
                {userInitials(currentUser.name)}
              </span>
              <span className="lp-nav-userName">
                {currentUser.name === 'System Administrator' ? (isEn ? 'Admin' : 'Quản trị viên') : currentUser.name}
              </span>
            </button>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenLogin}>
              {isEn ? 'Sign in' : 'Đăng nhập'}
            </button>
          )}
          <button type="button" className="btn btn-red btn-sm" onClick={onEnterApp}>
            {isEn ? 'Start' : 'Bắt đầu'}
          </button>
        </div>

        <div className="lp-mobile-actions">
          <button
            type="button"
            className="icon-btn nav__themeBtn"
            data-theme-state={theme}
            onClick={(event) => triggerPinuiThemeToggle(event.currentTarget)}
            aria-label={themeToggleLabel}
            title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
          >
            <svg className="nav__ptsIcon nav__ptsIcon--moon" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20.985 12.486C20.8913 14.2221 20.2967 15.894 19.2731 17.2994C18.2495 18.7048 16.8407 19.7837 15.217 20.4055C13.5934 21.0274 11.8243 21.1656 10.1238 20.8035C8.42322 20.4414 6.86395 19.5945 5.63446 18.3652C4.40497 17.1358 3.55789 15.5766 3.19562 13.8761C2.83334 12.1756 2.97139 10.4065 3.59308 8.78282C4.21476 7.15909 5.29346 5.75019 6.69877 4.72644C8.10409 3.70268 9.77586 3.1079 11.512 3.014C11.917 2.992 12.129 3.474 11.914 3.817C11.1949 4.96755 10.887 6.32787 11.0405 7.67595C11.194 9.02403 11.7999 10.2803 12.7593 11.2397C13.7187 12.1991 14.975 12.805 16.323 12.9585C17.6711 13.112 19.0314 12.8041 20.182 12.085C20.526 11.87 21.007 12.081 20.985 12.486Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg className="nav__ptsIcon nav__ptsIcon--sun" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34" />
              </g>
            </svg>
          </button>
          <button
            ref={burgerRef}
            type="button"
            className="icon-btn lp-burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu"
            title="Mở menu"
            aria-expanded={menuOpen}
          >
            <IconMenu size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
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
                <IconX size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <ul className="navsheet__list">
              {chapters.map((chapter) => (
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
                {isEn ? 'Start' : 'Bắt đầu'}
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
                  {isEn ? 'Sign in' : 'Đăng nhập'}
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
