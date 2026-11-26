import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconCompass,
  IconHome,
  IconLayers,
  IconMessageSquare,
  IconMoon,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconSun,
  IconUser,
  IconX,
} from '../../ui/icons';
import { useAppStore } from '../../store/appStore';
import { triggerPinuiThemeToggle } from './GlobalThemeAtmosphere';

interface PaletteAction {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  icon: React.ReactNode;
  run: () => void;
}

export const CommandPalette: React.FC = () => {
  const { navigate, openExperience, theme, sourceCatalog } = useAppStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const closeWithRestore = () => {
    setOpen(false);
    const target = previousFocusRef.current;
    previousFocusRef.current = null;
    if (target && target.isConnected) {
      window.requestAnimationFrame(() => target.focus());
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            previousFocusRef.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
            return true;
          }
          const target = previousFocusRef.current;
          previousFocusRef.current = null;
          if (target && target.isConnected) {
            window.requestAnimationFrame(() => target.focus());
          }
          return false;
        });
      } else if (event.key === 'Escape') {
        setOpen((prev) => {
          if (!prev) return false;
          const target = previousFocusRef.current;
          previousFocusRef.current = null;
          if (target && target.isConnected) {
            window.requestAnimationFrame(() => target.focus());
          }
          return false;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const actions = useMemo<PaletteAction[]>(() => {
    const closeAnd = (fn: () => void) => {
      setOpen(false);
      fn();
    };
    const list: PaletteAction[] = [
      {
        id: 'go-home',
        label: 'Trang chủ',
        hint: '/home',
        keywords: 'home trang chu khoi tao',
        icon: <IconHome size={15} aria-hidden="true" />,
        run: () => closeAnd(() => navigate('home')),
      },
      {
        id: 'go-explore',
        label: 'Bàn soi Khám phá',
        hint: '/explore',
        keywords: 'explore kham pha mau thanh phan repo',
        icon: <IconCompass size={15} aria-hidden="true" />,
        run: () => closeAnd(() => navigate('explore')),
      },
      {
        id: 'go-experience',
        label: 'Không gian trải nghiệm (Kho tổng hợp)',
        hint: '/explore/experience',
        keywords: 'experience trai nghiem kho tong hop vault 7662',
        icon: <IconSparkles size={15} aria-hidden="true" />,
        run: () => closeAnd(() => openExperience(sourceCatalog[0]?.id ?? 'vault')),
      },
      {
        id: 'go-workspace',
        label: 'Workspace dựng giao diện',
        hint: '/workspace',
        keywords: 'workspace agent code du an live preview',
        icon: <IconLayers size={15} aria-hidden="true" />,
        run: () => closeAnd(() => navigate('workspace')),
      },
      {
        id: 'go-community',
        label: 'Tra cứu tri thức',
        hint: '/community',
        keywords: 'community tri thuc tra cuu tim mau hoi dap trung bay',
        icon: <IconMessageSquare size={15} aria-hidden="true" />,
        run: () => closeAnd(() => navigate('community')),
      },
      {
        id: 'go-profile',
        label: 'Hồ sơ cá nhân',
        hint: '/profile',
        keywords: 'profile ho so da luu',
        icon: <IconUser size={15} aria-hidden="true" />,
        run: () => closeAnd(() => navigate('profile')),
      },
      {
        id: 'go-settings',
        label: 'Cài đặt giao diện & BYOK',
        hint: '/settings',
        keywords: 'settings cai dat theme gradient byok',
        icon: <IconSettings size={15} aria-hidden="true" />,
        run: () => closeAnd(() => navigate('settings')),
      },
      {
        id: 'toggle-theme',
        label: theme === 'dark' ? 'Chuyển sang giao diện Sáng (Giấy)' : 'Chuyển sang giao diện Tối (Mực)',
        hint: 'Mực / Giấy',
        keywords: 'theme dark light sang toi muc giay',
        icon: theme === 'dark' ? <IconSun size={15} aria-hidden="true" /> : <IconMoon size={15} aria-hidden="true" />,
        run: () => closeAnd(() => triggerPinuiThemeToggle(null)),
      },
    ];

    return list;
  }, [navigate, openExperience, sourceCatalog, theme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.keywords.includes(q) ||
        a.hint.toLowerCase().includes(q)
    );
  }, [actions, query]);

  if (!open) return null;

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = filtered[activeIndex] ?? filtered[0];
      target?.run();
    }
  };

  return (
    <div
      className="cmdp-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeWithRestore();
      }}
    >
      <div className="cmdp-dialog" role="dialog" aria-modal="true" aria-label="Bảng điều khiển nhanh">
        <div className="cmdp-input-row">
          <IconSearch size={16} className="cmdp-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className="cmdp-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Đi tới trang, mở kho trải nghiệm, đổi giao diện..."
            aria-label="Tìm lệnh điều khiển nhanh"
          />
          <kbd className="cmdp-kbd">Esc</kbd>
          <button
            type="button"
            className="cmdp-close"
            aria-label="Đóng bảng điều khiển"
            onClick={closeWithRestore}
          >
            <IconX size={15} aria-hidden="true" />
          </button>
        </div>

        <ul className="cmdp-list" role="listbox" aria-label="Danh sách lệnh">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => (
              <li key={item.id} role="option" aria-selected={idx === activeIndex}>
                <button
                  type="button"
                  className="cmdp-item"
                  data-active={idx === activeIndex ? 'true' : undefined}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={item.run}
                >
                  <span className="cmdp-item-lead">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  <span className="cmdp-item-hint">{item.hint}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="cmdp-empty">Không tìm thấy lệnh phù hợp.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;
