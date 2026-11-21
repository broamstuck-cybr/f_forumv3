import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { KineticLogo } from '../brand/KineticLogo';
import { triggerPinuiThemeToggle } from './GlobalThemeAtmosphere';
import './app-shell.css';

export interface AppNavbarProps {
  onOpenNotice?: () => void;
}

const PRIMARY_TABS: Array<{ id: AppRoute; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'explore', label: 'Khám phá' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'community', label: 'Tri thức' },
];

function userInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'K'
  );
}

export const AppNavbar: React.FC<AppNavbarProps> = () => {
  const {
    currentRoute,
    navigate,
    aiActivity,
    currentUser,
    quota,
    setAuthModalOpen,
    logout,
    theme,
    clearViewingProfileUser,
  } = useAppStore();
  const reduced = Boolean(useReducedMotion());
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const burger = burgerRef.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      burger?.focus();
    };
  }, [sheetOpen]);

  const isAdmin = currentUser?.role === 'admin';
  const unlimited = quota.unlimited || isAdmin;
  const limit = quota.limit;
  const remaining = limit === null ? null : Math.max(0, quota.remaining ?? limit - quota.used);
  const lowQuota = !unlimited && remaining !== null && remaining <= 3;
  const quotaLabel = unlimited
    ? 'Không giới hạn'
    : limit === null
      ? `Đã dùng ${quota.used} lượt`
      : `${remaining}/${limit} lượt`;
  const avatarText = currentUser ? userInitials(currentUser.name) : 'K';
  const themeToggleLabel = theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối';

  const go = (route: AppRoute) => {
    setMenuOpen(false);
    setSheetOpen(false);
    navigate(route);
  };

  const openAuth = () => {
    setMenuOpen(false);
    setSheetOpen(false);
    setAuthModalOpen(true);
  };

  const signOut = () => {
    setMenuOpen(false);
    setSheetOpen(false);
    void logout();
  };

  const spring = reduced ? { duration: 0.01 } : { type: 'spring' as const, stiffness: 300, damping: 30 };

  return (
    <header className="nav">
      <div className="wrap-wide nav__row">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            className="nav__brand"
            onClick={() => go('landing')}
            aria-label="F-Forum, về trang giới thiệu"
            title="F-Forum"
          >
            <KineticLogo size={26} activity={aiActivity} showWordmark />
          </button>

          <nav aria-label="Điều hướng chính" className="nav__tabs">
            {PRIMARY_TABS.map((tab) => {
              const active =
                currentRoute === tab.id || (tab.id === 'explore' && currentRoute === 'experience');
              return (
                <button
                  key={tab.id}
                  type="button"
                  className="nav__tab"
                  onClick={() => go(tab.id)}
                  aria-current={active ? 'page' : undefined}
                >
                  {tab.label}
                  {active && (
                    <motion.span layoutId="nav-ink" className="nav__ink" transition={spring} aria-hidden="true">
                      <svg viewBox="0 0 100 6" preserveAspectRatio="none" fill="none">
                        <path
                          d="M1 3.4 C 18 0.8, 34 5.2, 52 2.8 S 84 1.4, 99 3.2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </motion.span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="nav__side">
          <button
            type="button"
            className="icon-btn nav__themeBtn"
            onClick={(event) => triggerPinuiThemeToggle(event.currentTarget)}
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
          >
            {theme === 'dark' ? (
              <Sun size={18} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Moon size={18} strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>

          <div className="relative nav__account" ref={menuRef}>
            <button
              type="button"
              className="nav__avatarBtn"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-label={currentUser ? `Tài khoản ${currentUser.name}` : 'Tài khoản khách'}
              title={currentUser ? currentUser.name : 'Khách'}
            >
              <span className="nav__avatar" data-guest={!currentUser} aria-hidden="true">
                {avatarText}
              </span>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="nav__menu"
                  role="dialog"
                  aria-label="Tài khoản và cài đặt nhanh"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <div className="nav__menuHead">
                    <div className="nav__menuIdentity">
                      <p className="nav__menuName">{currentUser ? currentUser.name : 'Khách'}</p>
                      <p className="t-label">
                        {currentUser ? (isAdmin ? 'quản trị' : 'thành viên') : 'phiên khách'}
                      </p>
                    </div>
                    <span className="nav__menuQuota" data-low={lowQuota}>
                      {quotaLabel}
                    </span>
                  </div>

                  <div className="nav__menuNav">
                    <button
                      type="button"
                      className="nav__menuItem"
                      onClick={() => {
                        clearViewingProfileUser();
                        go('profile');
                      }}
                    >
                      Hồ sơ
                    </button>
                    <button type="button" className="nav__menuItem" onClick={() => go('settings')}>
                      Cài đặt
                    </button>
                    {isAdmin && (
                      <button type="button" className="nav__menuItem" onClick={() => go('admin')}>
                        Quản trị
                      </button>
                    )}
                    {currentUser ? (
                      <button type="button" className="nav__menuItem" data-tone="red" onClick={signOut}>
                        Đăng xuất
                      </button>
                    ) : (
                      <button type="button" className="nav__menuItem" data-tone="red" onClick={openAuth}>
                        Đăng nhập
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            ref={burgerRef}
            type="button"
            className="icon-btn nav__burger"
            onClick={() => setSheetOpen(true)}
            aria-label="Mở menu"
            title="Mở menu"
            aria-expanded={sheetOpen}
          >
            <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            className="navsheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="navsheet__top">
              <button
                type="button"
                className="nav__brand"
                onClick={() => go('landing')}
                aria-label="F-Forum, về trang giới thiệu"
                title="F-Forum"
              >
                <KineticLogo size={26} activity={aiActivity} showWordmark />
              </button>
              <button
                ref={closeRef}
                type="button"
                className="icon-btn"
                onClick={() => setSheetOpen(false)}
                aria-label="Đóng menu"
                title="Đóng menu"
              >
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <ul className="navsheet__list">
              {PRIMARY_TABS.map((tab, index) => (
                <motion.li
                  key={tab.id}
                  initial={reduced ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.04 + index * 0.045, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <button
                    type="button"
                    className="navsheet__link"
                    onClick={() => go(tab.id)}
                    aria-current={currentRoute === tab.id ? 'page' : undefined}
                  >
                    {tab.label}
                  </button>
                </motion.li>
              ))}
            </ul>
            <div className="navsheet__account">
              <div className="navsheet__identityRow">
                <div className="navsheet__identity">
                  <span className="nav__avatar" data-guest={!currentUser} aria-hidden="true">
                    {avatarText}
                  </span>
                  <div className="min-w-0">
                    <p className="nav__menuName">{currentUser ? currentUser.name : 'Khách'}</p>
                    <p className="t-label">
                      {currentUser ? (isAdmin ? 'quản trị' : 'thành viên') : 'phiên khách'}
                    </p>
                  </div>
                </div>
                <div className="navsheet__tools">
                  <span className="nav__menuQuota" data-low={lowQuota}>
                    {quotaLabel}
                  </span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={(event) => triggerPinuiThemeToggle(event.currentTarget)}
                    aria-label={themeToggleLabel}
                    title={themeToggleLabel}
                  >
                    {theme === 'dark' ? (
                      <Sun size={18} strokeWidth={1.75} aria-hidden="true" />
                    ) : (
                      <Moon size={18} strokeWidth={1.75} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <div className="navsheet__foot">
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() => {
                    clearViewingProfileUser();
                    go('profile');
                  }}
                >
                  Hồ sơ
                </button>
                <button type="button" className="btn btn-line" onClick={() => go('settings')}>
                  Cài đặt
                </button>
                {isAdmin && (
                  <button type="button" className="btn btn-line" onClick={() => go('admin')}>
                    Quản trị
                  </button>
                )}
                {currentUser ? (
                  <button type="button" className="btn btn-ghost" onClick={signOut}>
                    Đăng xuất
                  </button>
                ) : (
                  <button type="button" className="btn btn-solid" onClick={openAuth}>
                    Đăng nhập
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AppNavbar;
