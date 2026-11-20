import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { ThemeSwitch } from '../pinui/ThemeSwitch';
import { KineticLogo } from '../brand/KineticLogo';

export interface AppNavbarProps {
  onOpenNotice?: () => void;
}

const PRIMARY_TABS: Array<{ id: AppRoute; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'explore', label: 'Khám phá' },
  { id: 'workspace', label: 'Work' },
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
    theme,
    setTheme,
    setAuthModalOpen,
    logout,
  } = useAppStore();

  const reduced = Boolean(useReducedMotion());
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const profileTrigger = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setProfileOpen(false); profileTrigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); mobileTrigger.current?.focus(); }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [mobileOpen]);

  const displayName = currentUser ? currentUser.name : 'Khách';
  const isAdmin = currentUser?.role === 'admin';
  const quotaLabel = quota.unlimited || isAdmin ? 'Vô hạn' : `${Math.max(0, (quota.limit ?? 15) - quota.used)}/${quota.limit ?? 15}`;

  return (
    <header
      className="press-app-nav sticky top-0 z-50 w-full border-b"
      style={{
        height: 'var(--navbar-h)',
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2 md:gap-3">
        <div className="flex items-center gap-3 md:gap-5 min-w-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              navigate('home');
            }}
            aria-label="F-Forum: Bàn làm việc"
            title="F-Forum"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-105"
          >
            <KineticLogo size={28} activity={aiActivity} showWordmark={false} />
          </button>

          <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-1 min-w-0">
            {PRIMARY_TABS.map((tab) => {
              const active = currentRoute === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigate(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className="relative shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-medium bg-transparent border-0 cursor-pointer transition-colors"
                  style={{
                    color: active ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="ff-nav-active-pill"
                      className="absolute inset-0 rounded-lg border"
                      style={{
                        background: 'var(--bg-panel)',
                        borderColor: 'var(--border-strong)',
                      }}
                      transition={
                        reduced
                          ? { duration: 0.01 }
                          : { type: 'spring', visualDuration: 0.34, bounce: 0.14 }
                      }
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(isAdmin ? 'admin' : 'settings')}
            aria-label={`Lượt AI còn lại: ${quotaLabel}`}
            title="Hạn mức"
            className="hidden sm:inline-flex items-center justify-center h-9 px-3.5 rounded-full border text-[12px] font-mono font-semibold whitespace-nowrap cursor-pointer transition-colors"
            style={{
              background: isAdmin
                ? 'var(--accent-jade-soft)'
                : quota.exhausted
                  ? 'var(--accent-danger-soft)'
                  : 'var(--accent-soft)',
              borderColor: isAdmin
                ? 'var(--accent-jade)'
                : quota.exhausted
                  ? 'var(--accent-danger)'
                  : 'var(--border-accent)',
              color: isAdmin
                ? 'var(--accent-jade)'
                : quota.exhausted
                  ? 'var(--accent-danger)'
                  : 'var(--accent-primary)',
            }}
          >
            {quotaLabel}
          </button>

          <ThemeSwitch compact sound={false} theme={theme} onThemeChange={setTheme} />
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              ref={profileTrigger}
              aria-controls={profileOpen ? 'ff-account' : undefined}
              aria-expanded={profileOpen}
              aria-label={`Tài khoản: ${displayName}`}
              title={displayName}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full border p-0 cursor-pointer transition-colors"
              style={{
                background: 'var(--bg-panel)',
                borderColor: profileOpen ? 'var(--border-accent)' : 'var(--border-subtle)',
                color: 'var(--ink-primary)',
              }}
            >
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-mono font-bold"
                style={{
                  background: 'var(--accent-gradient)',
                  color: 'var(--ink-inverse)',
                }}
              >
                {userInitials(displayName)}
              </span>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  id="ff-account"
                  role="group"
                  aria-label="Tài khoản"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl border p-2 overflow-hidden z-50"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-strong)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <div
                    className="px-3 py-2.5 mb-1.5 rounded-xl border"
                    style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
                      {displayName}
                    </div>
                    <div className="text-[11px] font-mono truncate mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                      {currentUser ? `@${currentUser.username} · ${quotaLabel}` : `Khách · ${quotaLabel}`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('profile');
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] bg-transparent border-0 cursor-pointer transition-colors"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    <span>Hồ sơ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('settings');
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] bg-transparent border-0 cursor-pointer transition-colors"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    <span>Cài đặt</span>
                  </button>

                  <button type="button" onClick={() => { setProfileOpen(false); navigate('landing'); }}
                    className="flex w-full items-center rounded-xl px-3 text-left text-[13px] cursor-pointer">
                    Giới thiệu
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                        onClick={() => {
                        setProfileOpen(false);
                        navigate('admin');
                      }}
                      className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] bg-transparent border-0 cursor-pointer transition-colors"
                      style={{ color: 'var(--accent-jade)' }}
                    >
                      <span>Quản trị</span>
                    </button>
                  )}

                  <div className="my-1.5 border-t" style={{ borderColor: 'var(--border-subtle)' }} />

                  {currentUser ? (
                    <button
                      type="button"
                        onClick={() => {
                        setProfileOpen(false);
                        void logout();
                      }}
                      className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] bg-transparent border-0 cursor-pointer transition-colors"
                      style={{ color: 'var(--accent-danger)' }}
                    >
                      <span>Đăng xuất</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                        onClick={() => {
                        setProfileOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] font-semibold bg-transparent border-0 cursor-pointer transition-colors"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <span>Đăng nhập</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Đóng điều hướng' : 'Mở điều hướng'}
            title={mobileOpen ? 'Đóng' : 'Mở'}
            ref={mobileTrigger}
            aria-expanded={mobileOpen}
            aria-controls={mobileOpen ? 'ff-mobile-menu' : undefined}
            className="md:hidden inline-grid place-items-center h-9 w-9 rounded-full border cursor-pointer"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--ink-primary)',
            }}
          >
            {mobileOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            id="ff-mobile-menu"
            className="md:hidden border-b px-4 py-3 space-y-2"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <nav aria-label="Điều hướng di động" className="grid gap-1">
              {PRIMARY_TABS.map((tab) => {
                const active = currentRoute === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      navigate(tab.id);
                    }}
                    aria-current={active ? 'page' : undefined}
                    className="flex min-h-11 items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium border cursor-pointer"
                    style={{
                      background: active ? 'var(--accent-soft)' : 'transparent',
                      borderColor: active ? 'var(--border-accent)' : 'transparent',
                      color: active ? 'var(--accent-primary)' : 'var(--ink-primary)',
                    }}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[12px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                {quotaLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  navigate('settings');
                }}
                className="rounded-full border px-3.5 py-1.5 text-[12px] font-medium cursor-pointer"
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-primary)',
                }}
              >
                Cài đặt
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AppNavbar;
