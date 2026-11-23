import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bell, Compass, Home, Menu, Plus, User as UserIcon, X } from 'lucide-react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { KineticLogo } from '../brand/KineticLogo';
import { BackToTopButton } from '../landing/BackToTopButton';
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
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 2;
    try {
      const raw = window.localStorage.getItem('fforum_v3_unread_notifications');
      const parsed = raw !== null ? Number(raw) : 2;
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2;
    } catch {
      return 2;
    }
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onUnread = (event: Event) => {
      const count = Number((event as CustomEvent<number>).detail);
      if (Number.isFinite(count) && count >= 0) {
        setUnreadCount(count);
      }
    };
    window.addEventListener('ff:community-unread', onUnread);
    return () => window.removeEventListener('ff:community-unread', onUnread);
  }, []);

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
  const displayName = currentUser
    ? currentUser.name === 'System Administrator'
      ? 'Quản trị viên'
      : currentUser.name
    : 'Khách';
  const avatarText = currentUser ? userInitials(displayName) : 'K';
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
    <>
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
            data-theme-state={theme}
            onClick={(event) => triggerPinuiThemeToggle(event.currentTarget)}
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
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

          <div className="relative nav__account" ref={menuRef}>
            <button
              type="button"
              className="nav__avatarBtn"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-label={currentUser ? `Tài khoản ${displayName}` : 'Tài khoản khách'}
              title={displayName}
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
                      <p className="nav__menuName">{displayName}</p>
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
                    <p className="nav__menuName">{displayName}</p>
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
                    className="icon-btn nav__themeBtn"
                    data-theme-state={theme}
                    onClick={(event) => triggerPinuiThemeToggle(event.currentTarget)}
                    aria-label={themeToggleLabel}
                    title={themeToggleLabel}
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

    <nav className="mobile-bnav" aria-label="Điều hướng nhanh di động">
      <button
        type="button"
        className="mobile-bnav__btn"
        aria-current={currentRoute === 'home' ? 'page' : undefined}
        onClick={() => go('home')}
      >
        <Home size={18} strokeWidth={1.85} aria-hidden="true" />
        <span>Trang chủ</span>
      </button>

      <button
        type="button"
        className="mobile-bnav__btn"
        aria-current={currentRoute === 'explore' || currentRoute === 'experience' ? 'page' : undefined}
        onClick={() => go('explore')}
      >
        <Compass size={18} strokeWidth={1.85} aria-hidden="true" />
        <span>Khám phá</span>
      </button>

      <button
        type="button"
        className="mobile-bnav__btn mobile-bnav__btn--compose"
        aria-label="Đăng bài mới"
        onClick={() => {
          try {
            window.sessionStorage.setItem('ff_community_action', 'compose');
          } catch {
            void 0;
          }
          if (currentRoute === 'community') {
            window.dispatchEvent(new CustomEvent('ff:community-action', { detail: 'compose' }));
          } else {
            go('community');
          }
        }}
      >
        <span className="mobile-bnav__compose-badge" aria-hidden="true">
          <Plus size={18} strokeWidth={2.2} />
        </span>
        <span>Đăng bài</span>
      </button>

      <button
        type="button"
        className="mobile-bnav__btn"
        aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : 'Thông báo'}
        aria-current={currentRoute === 'community' ? 'page' : undefined}
        onClick={() => {
          try {
            window.sessionStorage.setItem('ff_community_action', 'notifications');
          } catch {
            void 0;
          }
          if (currentRoute === 'community') {
            window.dispatchEvent(new CustomEvent('ff:community-action', { detail: 'notifications' }));
          } else {
            go('community');
          }
        }}
      >
        <span className="mobile-bnav__icon-wrap" aria-hidden="true">
          <Bell size={18} strokeWidth={1.85} />
          {unreadCount > 0 && <span className="mobile-bnav__dot" />}
        </span>
        <span>Thông báo</span>
      </button>

      <button
        type="button"
        className="mobile-bnav__btn"
        aria-current={currentRoute === 'profile' ? 'page' : undefined}
        onClick={() => {
          clearViewingProfileUser();
          go('profile');
        }}
      >
        <UserIcon size={18} strokeWidth={1.85} aria-hidden="true" />
        <span>Hồ sơ</span>
      </button>
    </nav>
    <BackToTopButton offsetForMobileNav />
    </>
  );
};

export default AppNavbar;
