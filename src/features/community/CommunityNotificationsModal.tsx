import React from 'react';
import {
  IconArrowBigUp,
  IconBarChart3,
  IconCheck,
  IconMessageSquare,
  IconX,
} from '../../ui/icons';
import { Modal } from '../workspace/Modal';

export type CommunityNotificationGroup = 'replies' | 'votes' | 'community';

export interface CommunityNotificationItem {
  id: string;
  group: CommunityNotificationGroup;
  postId: string;
  title: string;
  detail: string;
  timeLabel: string;
  read: boolean;
}

const GROUP_LABELS: Record<CommunityNotificationGroup, string> = {
  replies: 'Phản hồi & Thảo luận',
  votes: 'Tán thành & Lưu bài',
  community: 'Thăm dò & Cộng đồng',
};

export interface CommunityNotificationsModalProps {
  open: boolean;
  notifications: CommunityNotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onSelectNotification: (item: CommunityNotificationItem) => void;
}

export const CommunityNotificationsModal: React.FC<CommunityNotificationsModalProps> = ({
  open,
  notifications,
  onClose,
  onMarkAllRead,
  onSelectNotification,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const groups: CommunityNotificationGroup[] = ['replies', 'votes', 'community'];

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Thông báo cộng đồng"
      className="cm-dialog"
    >
      <div className="cm-dialog-body">
        <div className="cm-dialog-head">
          <div className="cm-notif-head-title">
            <h2 className="cm-dialog-title">Thông báo</h2>
            {unreadCount > 0 && <span className="cm-notif-badge">{unreadCount} mới</span>}
          </div>
          <div className="cm-notif-head-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="cm-clear-btn"
                onClick={onMarkAllRead}
              >
                <IconCheck size={13} aria-hidden="true" />
                <span>Đọc hết</span>
              </button>
            )}
            <button
              type="button"
              className="cm-icon-btn"
              aria-label="Đóng thông báo"
              title="Đóng"
              onClick={onClose}
            >
              <IconX size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="cm-notif-empty">
            <p className="cm-post-body">Chưa có thông báo mới trong cộng đồng.</p>
          </div>
        ) : (
          <div className="cm-notif-groups">
            {groups.map((groupKey) => {
              const list = notifications.filter((n) => n.group === groupKey);
              if (list.length === 0) return null;
              return (
                <section key={groupKey} className="cm-notif-group" aria-label={GROUP_LABELS[groupKey]}>
                  <header className="cm-notif-group-head">
                    <span className="t-label">{GROUP_LABELS[groupKey]}</span>
                    <span className="cm-count">{list.length}</span>
                  </header>
                  <ul className="cm-notif-list">
                    {list.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="cm-notif-row"
                          data-card-trigger
                          data-unread={!item.read ? 'true' : undefined}
                          onClick={() => onSelectNotification(item)}
                        >
                          <span className="cm-notif-icon" aria-hidden="true">
                            {item.group === 'replies' ? (
                              <IconMessageSquare size={15} />
                            ) : item.group === 'votes' ? (
                              <IconArrowBigUp size={16} />
                            ) : (
                              <IconBarChart3 size={15} />
                            )}
                          </span>
                          <span className="cm-notif-copy">
                            <span className="cm-notif-title">{item.title}</span>
                            <span className="cm-notif-detail">{item.detail}</span>
                          </span>
                          <span className="cm-notif-meta">
                            <span className="t-label">{item.timeLabel}</span>
                            {!item.read && <span className="cm-notif-dot" aria-label="Chưa đọc" />}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CommunityNotificationsModal;
