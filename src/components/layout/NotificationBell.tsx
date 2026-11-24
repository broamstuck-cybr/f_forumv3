import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Compass, MessageSquare, Sparkles, X } from 'lucide-react';
import type { AppRoute } from '../../types/index';
import './notification-bell.css';

export interface NotificationEntry {
  id: string;
  title: string;
  body: string;
  time: string;
  route: AppRoute;
  kind: 'system' | 'community' | 'vault';
  read: boolean;
}

const STORAGE_KEY = 'fforum_v3_notifications_v2';
const UNREAD_KEY = 'fforum_v3_unread_notifications';

const DEFAULT_NOTIFICATIONS: NotificationEntry[] = [
  {
    id: 'notif-vault-sync',
    title: 'Kho tài nguyên đã đồng bộ 8.322 mẫu',
    body: 'MotionSites.ai, PinUI, ThreeUI, CodeFronts, LucianLabs và GetLayers đã sẵn sàng chạy thử.',
    time: 'Vừa xong',
    route: 'explore',
    kind: 'vault',
    read: false,
  },
  {
    id: 'notif-community-live',
    title: 'Bảng tin & Phòng chat đã nâng cấp',
    body: 'Hiệu ứng bong bóng tin nhắn mới, chia sẻ đoạn mã và phản hồi thời gian thực.',
    time: '12 phút trước',
    route: 'community',
    kind: 'community',
    read: false,
  },
  {
    id: 'notif-workspace-clean',
    title: 'Workspace tự mở Xem trực tiếp khi có mã',
    body: 'Khung trò chuyện gọn gàng hơn khi bắt đầu phiên mới và tự chia đôi khi AI dựng giao diện.',
    time: '1 giờ trước',
    route: 'workspace',
    kind: 'system',
    read: true,
  },
];

function loadNotifications(): NotificationEntry[] {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATIONS;
    const parsed = JSON.parse(raw) as NotificationEntry[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_NOTIFICATIONS;
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export interface NotificationBellProps {
  onNavigate?: (route: AppRoute) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationEntry[]>(loadNotifications);
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((item) => !item.read).length;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.localStorage.setItem(UNREAD_KEY, String(unreadCount));
      window.dispatchEvent(new CustomEvent('ff:community-unread', { detail: unreadCount }));
    } catch {
      // Ignore storage quota errors
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
        kind: detail.kind || 'system',
        read: false,
      };
      setItems((prev) => [entry, ...prev.slice(0, 14)]);
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

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const openItem = (entry: NotificationEntry) => {
    setItems((prev) => prev.map((item) => (item.id === entry.id ? { ...item, read: true } : item)));
    setOpen(false);
    onNavigate?.(entry.route);
  };

  const renderIcon = (kind: NotificationEntry['kind']) => {
    if (kind === 'community') return <MessageSquare size={15} aria-hidden="true" />;
    if (kind === 'vault') return <Compass size={15} aria-hidden="true" />;
    return <Sparkles size={15} aria-hidden="true" />;
  };

  return (
    <div className="cf-bell" ref={rootRef}>
      <button
        type="button"
        className="icon-btn cf-bell__btn"
        data-unread={unreadCount > 0 ? 'true' : 'false'}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : 'Thông báo'}
        title="Thông báo"
      >
        <Bell size={18} strokeWidth={1.9} className="cf-bell__icon" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="cf-bell__badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="cf-bell__panel" role="dialog" aria-label="Hộp thư thông báo">
          <div className="cf-bell__head">
            <div className="cf-bell__headTitle">
              <strong>Thông báo</strong>
              {unreadCount > 0 && <span className="cf-bell__pill">{unreadCount} mới</span>}
            </div>
            <div className="cf-bell__headActions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="cf-bell__action"
                  onClick={markAllRead}
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck size={14} aria-hidden="true" />
                  <span>Đã đọc hết</span>
                </button>
              )}
              <button
                type="button"
                className="cf-bell__close"
                onClick={() => setOpen(false)}
                aria-label="Đóng thông báo"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          <ul className="cf-bell__list">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="cf-bell__item"
                  data-read={item.read ? 'true' : 'false'}
                  onClick={() => openItem(item)}
                >
                  <span className="cf-bell__itemIcon">{renderIcon(item.kind)}</span>
                  <span className="cf-bell__itemCopy">
                    <span className="cf-bell__itemTitle">{item.title}</span>
                    <span className="cf-bell__itemBody">{item.body}</span>
                    <span className="cf-bell__itemTime">{item.time}</span>
                  </span>
                  {!item.read && <span className="cf-bell__dot" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
