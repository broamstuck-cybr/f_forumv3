import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AppRoute } from '../../types/index';
import './notification-bell.css';

export interface NotificationEntry {
  id: string;
  title: string;
  body: string;
  time: string;
  route: AppRoute;
  kind: 'community' | 'vault' | 'workspace';
  read: boolean;
}

const USER_STORAGE_KEY = 'fforum_v3_notifications_user_v3';
const UNREAD_KEY = 'fforum_v3_unread_notifications';

const DEFAULT_USER_NOTIFICATIONS: NotificationEntry[] = [
  {
    id: 'notif-user-vault',
    title: 'Kho mẫu công khai đã cập nhật',
    body: 'Chỉ giữ lại các tài nguyên miễn phí có thể chạy trực tiếp và trải nghiệm ngay trong F-Forum.',
    time: 'Vừa xong',
    route: 'explore',
    kind: 'vault',
    read: false,
  },
  {
    id: 'notif-user-chat',
    title: 'Phòng chat & Bảng tin đã mở rộng',
    body: 'Thảo luận trực tiếp, đính kèm đoạn mã và nhận phản hồi nhanh từ cộng đồng.',
    time: '15 phút trước',
    route: 'community',
    kind: 'community',
    read: false,
  },
  {
    id: 'notif-user-workspace',
    title: 'Workspace tập trung dựng giao diện',
    body: 'Khung Xem trực tiếp tự mở ngay khi dự án có mã nguồn hợp lệ.',
    time: '1 giờ trước',
    route: 'workspace',
    kind: 'workspace',
    read: true,
  },
];

function loadScopedNotifications(): NotificationEntry[] {
  if (typeof window === 'undefined') return DEFAULT_USER_NOTIFICATIONS;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_NOTIFICATIONS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_USER_NOTIFICATIONS;
    const filtered = parsed.filter(
      (item): item is NotificationEntry & { scope?: string } =>
        Boolean(item) &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        typeof (item as { id?: unknown }).id === 'string' &&
        typeof (item as { title?: unknown }).title === 'string' &&
        (item as { scope?: unknown }).scope !== 'admin'
    );
    return filtered.length > 0 ? filtered : DEFAULT_USER_NOTIFICATIONS;
  } catch {
    return DEFAULT_USER_NOTIFICATIONS;
  }
}

/* Authentic LucianLabs 074 refined bell icon & minimalist geometric category glyphs */
const BellGlyph: React.FC = () => (
  <svg className="u074-bell-svg" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path
      d="M5.5 14.8V9.8a5.5 5.5 0 0 1 11 0v5l1.6 1.6H3.9l1.6-1.6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 18.4a2.1 2.1 0 0 0 4 0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const CategoryGlyph: React.FC<{ kind: NotificationEntry['kind'] }> = ({ kind }) => {
  if (kind === 'community') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M4 5.5C4 4.4 4.9 3.5 6 3.5h8c1.1 0 2 .9 2 2v6.2c0 1.1-.9 2-2 2H9.2l-3.4 2.6c-.4.3-.9 0-.9-.5v-2.1H6c-1.1 0-2-.9-2-2V5.5Z"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
        <path d="M7.2 7.8h5.6M7.2 10.6h3.6" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'vault') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1.6" stroke="currentColor" strokeWidth="1.65" />
        <rect x="11" y="3.5" width="5.5" height="5.5" rx="1.6" stroke="currentColor" strokeWidth="1.65" />
        <rect x="3.5" y="11" width="5.5" height="5.5" rx="1.6" stroke="currentColor" strokeWidth="1.65" />
        <circle cx="13.75" cy="13.75" r="2.75" stroke="currentColor" strokeWidth="1.65" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="2.4" stroke="currentColor" strokeWidth="1.65" />
      <path d="M8.2 4v12M3 8.2h5.2" stroke="currentColor" strokeWidth="1.65" />
    </svg>
  );
};

export interface NotificationBellProps {
  onNavigate?: (route: AppRoute) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<NotificationEntry[]>(() => loadScopedNotifications());
  const rootRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(
    () => (tab === 'unread' ? items.filter((item) => !item.read) : items),
    [items, tab]
  );

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(items));
      window.localStorage.setItem(UNREAD_KEY, String(unreadCount));
      window.dispatchEvent(new CustomEvent('ff:community-unread', { detail: unreadCount }));
    } catch {
      void 0;
    }
  }, [items, unreadCount]);

  useEffect(() => {
    const onPush = (event: Event) => {
      const detail = (event as CustomEvent<Partial<NotificationEntry>>).detail;
      if (!detail || !detail.title) return;
      const entry: NotificationEntry = {
        id: detail.id || `notif-${Date.now()}`,
        title: detail.title,
        body: detail.body || '',
        time: detail.time || 'Vừa xong',
        route: detail.route || 'community',
        kind: detail.kind || 'community',
        read: false,
      };
      setItems((prev) => [entry, ...prev.slice(0, 14)]);
      setRinging(true);
      window.setTimeout(() => setRinging(false), 920);
    };
    window.addEventListener('ff:push-notification', onPush);
    return () => window.removeEventListener('ff:push-notification', onPush);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setRinging(true);
        window.setTimeout(() => setRinging(false), 900);
      }
      return next;
    });
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const openItem = (entry: NotificationEntry) => {
    setItems((prev) => prev.map((item) => (item.id === entry.id ? { ...item, read: true } : item)));
    setOpen(false);
    onNavigate?.(entry.route);
  };

  return (
    <div className={`u074-bell-root ${open ? 'is-open' : 'is-closed'}`} ref={rootRef}>
      <button
        type="button"
        className={`u074-bell-btn ${ringing ? 'is-ringing' : ''}`}
        onClick={handleToggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : 'Thông báo'}
        title="Thông báo"
      >
        <BellGlyph />
        <span className={`u074-bell-badge ${unreadCount === 0 ? 'is-zero' : ''}`} aria-hidden="true">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      </button>

      <div
        className="u074-bell-panel"
        role={open ? 'dialog' : undefined}
        aria-label="Hộp thư thông báo"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="u074-bell-head">
          <div className="u074-bell-tabs" role={open ? 'tablist' : undefined} aria-label="Bộ lọc thông báo">
            <button
              type="button"
              role={open ? 'tab' : undefined}
              className="u074-bell-tab"
              aria-selected={open ? tab === 'all' : undefined}
              onClick={() => setTab('all')}
            >
              Tất cả
            </button>
            <button
              type="button"
              role={open ? 'tab' : undefined}
              className="u074-bell-tab"
              aria-selected={open ? tab === 'unread' : undefined}
              onClick={() => setTab('unread')}
            >
              Chưa đọc{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          </div>

          {unreadCount > 0 && (
            <button type="button" className="u074-bell-markAll" onClick={markAllRead}>
              Đọc hết
            </button>
          )}
        </div>

        <ul className="u074-bell-list" aria-live="polite">
          {visibleItems.length === 0 ? (
            <li className="u074-bell-empty">
              <strong>Đã xem hết thông báo</strong>
              <span>Mọi cập nhật mới từ cộng đồng và kho mẫu sẽ xuất hiện ngay tại đây.</span>
            </li>
          ) : (
            visibleItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="u074-bell-item"
                  data-read={item.read ? 'true' : 'false'}
                  data-kind={item.kind}
                  onClick={() => openItem(item)}
                >
                  <span className="u074-bell-glyph" data-kind={item.kind}>
                    <CategoryGlyph kind={item.kind} />
                  </span>
                  <span className="u074-bell-copy">
                    <span className="u074-bell-title">{item.title}</span>
                    <span className="u074-bell-body">{item.body}</span>
                    <span className="u074-bell-time">{item.time}</span>
                  </span>
                  {!item.read && <span className="u074-bell-dot" aria-hidden="true" />}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default NotificationBell;
