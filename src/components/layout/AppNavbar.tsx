import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Bookmark,
  ChevronDown,
  Command,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { KineticLogo } from '../brand/KineticLogo';
import { ThemeSwitch } from '../pinui';

export interface AppNavbarProps {
  onOpenCommandPalette?: () => void;
  onOpenNotice?: () => void;
}

const PRIMARY_TABS: Array<{ id: AppRoute; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'explore', label: 'Explore' },
  { id: 'workspace', label: 'Work space' },
  { id: 'community', label: 'Source of Knowledge' },
];

function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'K';
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ onOpenCommandPalette }) => {
  const {
    currentRoute,
    navigate,
    aiActivity,
    currentUser,
    quota,
    theme,
    toggleTheme,
    setAuthModalOpen,
    logout,
    savedItemIds,
  } = useAppStore();

  const reduced = Boolean(useReducedMotion());
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [profileOpen]);

  const handleOpenCommand = () => {
    if (onOpenCommandPalette) {
      onOpenCommandPalette();
      return;
    }
    window.dispatchEvent(new CustomEvent('fforum:open-command-palette'));
  };

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try {
      window.localStorage.setItem('fforum_theme', next);
    } catch {
      return toggleTheme();
    }
    toggleTheme();
  };

  const displayName = currentUser ? currentUser.name : 'Khách';
  const isAdmin = currentUser?.role === 'admin';
  const quotaLabel = quota.unlimited || isAdmin ? '∞ Admin' : `${quota.used}/${quota.limit ?? 15}`;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-xl"
      style={{
        height: 'var(--navbar-h)',
        background: 'var(--bg-glass-strong)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2 md:gap-3">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              navigate('landing');
            }}
            aria-label="Quay về Landing Page"
            title="Quay về Landing Page"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-105"
          >
            <KineticLogo size={28} activity={aiActivity} showWordmark={false} />
          </button>

          <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-0.5 lg:gap-1 min-w-0">
            {PRIMARY_TABS.map((tab) => {
              const active = currentRoute === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigate(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className="relative shrink-0 whitespace-nowrap rounded-lg px-2.5 lg:px-3.5 py-2 text-[13px] font-medium bg-transparent border-0 cursor-pointer transition-colors"
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

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenCommand}
            aria-label="Mở bảng lệnh nhanh Ctrl+E"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full border text-[12px] font-mono whitespace-nowrap cursor-pointer transition-colors"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--ink-secondary)',
            }}
          >
            <Command className="h-3.5 w-3.5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
            <span>Ctrl+E</span>
          </button>

          <ThemeSwitch theme={theme} onToggle={toggleTheme} compact />

          <button
            type="button"
            onClick={() => navigate(isAdmin ? 'admin' : 'settings')}
            title="Hạn mức lượt AI"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-[12px] font-mono font-semibold whitespace-nowrap cursor-pointer transition-colors"
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
            <span>{quotaLabel}</span>
          </button>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              className="inline-flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-full border bg-transparent cursor-pointer whitespace-nowrap transition-colors"
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
              <span className="hidden lg:inline max-w-[96px] truncate text-[12.5px] font-medium">
                {displayName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70 shrink-0" aria-hidden="true" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  role="menu"
                  aria-label="Menu tài khoản"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl border p-2 overflow-hidden z-50"
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
                    <div className="text-[11.5px] font-mono truncate mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                      {currentUser ? `@${currentUser.username} · ${quotaLabel}` : `Chế độ Khách · ${quotaLabel}`}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('settings');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] bg-transparent border-0 cursor-pointer transition-colors"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    <UserIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                    <span>Maker Profile</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('settings');
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] bg-transparent border-0 cursor-pointer transition-colors"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Bookmark className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-verdigris)' }} aria-hidden="true" />
                      <span>Tài nguyên đã lưu</span>
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                      {savedItemIds.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('settings');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] bg-transparent border-0 cursor-pointer transition-colors"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    <Settings className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-secondary)' }} aria-hidden="true" />
                    <span>Cài đặt &amp; Quyền riêng tư</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleThemeToggle();
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] bg-transparent border-0 cursor-pointer transition-colors"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    <span className="inline-flex items-center gap-2.5">
                      {theme === 'dark' ? (
                        <Sun className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                      ) : (
                        <Moon className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-copper)' }} aria-hidden="true" />
                      )}
                      <span>Chuyển Sáng/Tối</span>
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                      {theme === 'dark' ? 'Tối' : 'Sáng'}
                    </span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('admin');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] bg-transparent border-0 cursor-pointer transition-colors"
                      style={{ color: 'var(--accent-jade)' }}
                    >
                      <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Admin Console</span>
                    </button>
                  )}

                  <div className="my-1.5 border-t" style={{ borderColor: 'var(--border-subtle)' }} />

                  {currentUser ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        void logout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] bg-transparent border-0 cursor-pointer transition-colors"
                      style={{ color: 'var(--accent-danger)' }}
                    >
                      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Đăng xuất</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold bg-transparent border-0 cursor-pointer transition-colors"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Đăng nhập / Đăng ký</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Đóng menu di động' : 'Mở menu di động'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-grid place-items-center h-9 w-9 rounded-full border cursor-pointer"
            style={{
              background: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--ink-primary)',
            }}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium border cursor-pointer"
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
                Hạn mức: {quotaLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleOpenCommand();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-mono cursor-pointer"
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-primary)',
                }}
              >
                <Command className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Ctrl+E</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AppNavbar;
