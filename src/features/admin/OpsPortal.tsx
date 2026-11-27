import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminView from './AdminView';
import { useAppStore } from '../../store/appStore';
import {
  apiClient,
  type FeedbackCategory,
  type FeedbackRecord,
  type FeedbackStatus,
} from '../../services/apiClient';
import {
  IconAlertTriangle,
  IconCheck,
  IconMail,
  IconRefreshCw,
} from '../../ui/icons';
import '../../components/public/feedback-modal.css';

type OpsViewTab = 'dashboard' | 'feedback';
type StatusFilter = 'all' | FeedbackStatus;
type CategoryFilter = 'all' | FeedbackCategory;

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  feature: 'Góp ý tính năng',
  bug: 'Báo lỗi',
  ui: 'Giao diện',
  other: 'Khác',
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  unread: 'Chưa đọc',
  read: 'Đã đọc',
  resolved: 'Đã xử lý',
};

function formatDateTime(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  return new Date(ts).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatEmailBadge(item: FeedbackRecord): { label: string; tone: string } {
  if (item.emailStatus === 'sent') {
    return {
      label: `Email đã gửi (${item.emailProvider || 'mail'})`,
      tone: 'ops-fb-pill--email-sent',
    };
  }
  if (item.emailStatus === 'failed') {
    return {
      label: `Email lỗi (${item.emailProvider || 'mail'})`,
      tone: 'ops-fb-pill--email-failed',
    };
  }
  if (item.emailStatus === 'skipped') {
    return { label: 'Email bỏ qua', tone: '' };
  }
  return { label: 'Email đang chờ', tone: '' };
}

const StarStrip: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="ops-fb-stars" aria-label={`Đánh giá ${rating} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={star <= rating ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </span>
);

const OpsPortal: React.FC = () => {
  const { currentUser, addToast } = useAppStore();
  const isAdmin = currentUser?.role === 'admin';

  const [portalTab, setPortalTab] = useState<OpsViewTab>('dashboard');
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [busyFeedbackId, setBusyFeedbackId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const loadFeedbacks = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingFeedback(true);
    setFeedbackError(null);
    try {
      const res = await apiClient.fetchAdminFeedback();
      setFeedbacks(Array.isArray(res.items) ? res.items : []);
    } catch (err) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Không tải được danh sách góp ý.';
      setFeedbackError(msg);
    } finally {
      setLoadingFeedback(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setFeedbacks([]);
      setFeedbackError(null);
      return undefined;
    }

    try {
      const focusId = window.sessionStorage.getItem('ff_admin_focus_feedback');
      if (focusId) {
        window.sessionStorage.removeItem('ff_admin_focus_feedback');
        setPortalTab('feedback');
        setHighlightedId(focusId);
      }
    } catch {
      void 0;
    }

    void loadFeedbacks();

    const onRefresh = () => {
      void loadFeedbacks();
    };
    const onOpenFeedback = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      setPortalTab('feedback');
      if (detail?.id) setHighlightedId(detail.id);
      void loadFeedbacks();
    };

    window.addEventListener('ff:feedback-submitted', onRefresh);
    window.addEventListener('ff:feedback-updated', onRefresh);
    window.addEventListener('ff:open-admin-feedback', onOpenFeedback);

    return () => {
      window.removeEventListener('ff:feedback-submitted', onRefresh);
      window.removeEventListener('ff:feedback-updated', onRefresh);
      window.removeEventListener('ff:open-admin-feedback', onOpenFeedback);
    };
  }, [isAdmin, loadFeedbacks]);

  const handleUpdateStatus = async (id: string, nextStatus: FeedbackStatus) => {
    setBusyFeedbackId(id);
    try {
      const res = await apiClient.updateAdminFeedbackStatus(id, nextStatus);
      setFeedbacks((prev) => prev.map((item) => (item.id === id ? res.feedback : item)));
      window.dispatchEvent(new CustomEvent('ff:feedback-updated'));
      addToast({
        type: 'success',
        title: `Đã chuyển trạng thái: ${STATUS_LABELS[nextStatus]}`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
      });
    } finally {
      setBusyFeedbackId(null);
    }
  };

  const unreadCount = useMemo(
    () => feedbacks.filter((item) => item.status === 'unread').length,
    [feedbacks]
  );

  const resolvedCount = useMemo(
    () => feedbacks.filter((item) => item.status === 'resolved').length,
    [feedbacks]
  );

  const avgRating = useMemo(() => {
    if (feedbacks.length === 0) return '—';
    const sum = feedbacks.reduce((acc, item) => acc + item.rating, 0);
    return `${(sum / feedbacks.length).toFixed(1)}/5`;
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(
    () =>
      feedbacks.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
        return true;
      }),
    [feedbacks, statusFilter, categoryFilter]
  );

  if (!isAdmin) {
    return <AdminView />;
  }

  const feedbackInboxSection = (
    <div className="ops-fb-wrap">
      <section
        id="admin-feedback-inbox"
        aria-label="Hòm thư Feedback"
        className="ops-fb-shell"
      >
        <div className="ops-fb-head">
          <div>
            <h2 className="adm-card-title">Hòm thư Feedback</h2>
            <p className="adm-card-sub">
              Theo dõi góp ý người dùng, trạng thái gửi email và đánh dấu đã đọc hoặc đã xử lý.
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => void loadFeedbacks()}
            disabled={loadingFeedback}
            aria-label="Làm mới hòm thư Feedback"
            title="Làm mới"
          >
            <IconRefreshCw size={17} />
          </button>
        </div>

        <div className="ops-fb-stats">
          <div className="ops-fb-stat">
            <span className="ops-fb-stat-label">Tổng góp ý</span>
            <strong className="ops-fb-stat-val">{feedbacks.length}</strong>
          </div>
          <div className="ops-fb-stat">
            <span className="ops-fb-stat-label">Chưa đọc</span>
            <strong
              className="ops-fb-stat-val"
              data-tone={unreadCount > 0 ? 'accent' : undefined}
            >
              {unreadCount}
            </strong>
          </div>
          <div className="ops-fb-stat">
            <span className="ops-fb-stat-label">Đã xử lý</span>
            <strong className="ops-fb-stat-val">{resolvedCount}</strong>
          </div>
          <div className="ops-fb-stat">
            <span className="ops-fb-stat-label">Đánh giá trung bình</span>
            <strong className="ops-fb-stat-val">{avgRating}</strong>
          </div>
        </div>

        <div className="ops-fb-filters">
          <div className="adm-seg" role="group" aria-label="Lọc theo trạng thái">
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'unread', label: `Chưa đọc (${unreadCount})` },
                { id: 'read', label: 'Đã đọc' },
                { id: 'resolved', label: 'Đã xử lý' },
              ] as Array<{ id: StatusFilter; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="adm-seg-btn"
                aria-pressed={statusFilter === opt.id}
                onClick={() => setStatusFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="adm-seg" role="group" aria-label="Lọc theo danh mục">
            {(
              [
                { id: 'all', label: 'Mọi chủ đề' },
                { id: 'feature', label: 'Tính năng' },
                { id: 'bug', label: 'Báo lỗi' },
                { id: 'ui', label: 'Giao diện' },
                { id: 'other', label: 'Khác' },
              ] as Array<{ id: CategoryFilter; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="adm-seg-btn"
                aria-pressed={categoryFilter === opt.id}
                onClick={() => setCategoryFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {feedbackError && (
          <div className="adm-card adm-error-card" role="alert">
            <div className="adm-card-head">
              <div className="adm-inline-icon">
                <IconAlertTriangle size={18} />
                <div>
                  <h3 className="adm-card-title">Không tải được Hòm thư Feedback</h3>
                  <p className="adm-card-sub">{feedbackError}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-line btn-sm"
                onClick={() => void loadFeedbacks()}
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {loadingFeedback && feedbacks.length === 0 ? (
          <div className="ops-fb-list" aria-busy="true">
            {[0, 1].map((idx) => (
              <div key={idx} className="ops-fb-card">
                <span className="adm-skel adm-skel--title" />
                <span className="adm-skel adm-skel--sub" />
                <span className="adm-skel adm-skel--bar" />
              </div>
            ))}
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="adm-empty-box">
            <p className="adm-card-title">
              {feedbacks.length === 0 ? 'Chưa có góp ý nào' : 'Không có góp ý khớp bộ lọc'}
            </p>
            <p className="adm-card-sub">
              {feedbacks.length === 0
                ? 'Khi người dùng gửi góp ý từ nút Feedback, phản hồi sẽ xuất hiện ngay tại đây.'
                : 'Đặt lại bộ lọc để xem toàn bộ phản hồi đã nhận.'}
            </p>
            {(statusFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                type="button"
                className="btn btn-line btn-sm"
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
              >
                Hiện tất cả
              </button>
            )}
          </div>
        ) : (
          <div className="ops-fb-list">
            {filteredFeedbacks.map((item) => {
              const emailBadge = formatEmailBadge(item);
              const isBusy = busyFeedbackId === item.id;
              return (
                <article
                  key={item.id}
                  data-feedback-id={item.id}
                  data-status={item.status}
                  className={`ops-fb-card ${highlightedId === item.id ? 'is-highlighted' : ''}`}
                >
                  <div className="ops-fb-card-top">
                    <div className="ops-fb-badges">
                      <StarStrip rating={item.rating} />
                      <span className="ops-fb-pill">{CATEGORY_LABELS[item.category]}</span>
                      <span
                        className={`ops-fb-pill ${
                          item.status === 'unread'
                            ? 'ops-fb-pill--unread'
                            : item.status === 'resolved'
                              ? 'ops-fb-pill--resolved'
                              : ''
                        }`}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                      <span className={`ops-fb-pill ${emailBadge.tone}`}>
                        {emailBadge.label}
                      </span>
                    </div>
                    <span className="t-label">{formatDateTime(item.createdAt)}</span>
                  </div>

                  <p className="ops-fb-message">{item.message}</p>

                  <div className="ops-fb-meta">
                    <div className="ops-fb-meta-left">
                      <span>Người gửi: <strong>{item.senderName}</strong></span>
                      {item.senderEmail && <span>Email: {item.senderEmail}</span>}
                      <span>Trang: <code className="font-mono">{item.pageUrl}</code></span>
                      {item.resolvedBy && (
                        <span>
                          Xử lý bởi {item.resolvedBy}
                          {item.resolvedAt ? ` · ${formatDateTime(item.resolvedAt)}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="ops-fb-card-actions">
                      {item.status === 'unread' ? (
                        <button
                          type="button"
                          className="btn btn-line btn-sm"
                          disabled={isBusy}
                          onClick={() => void handleUpdateStatus(item.id, 'read')}
                        >
                          Đã đọc
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={isBusy}
                          onClick={() => void handleUpdateStatus(item.id, 'unread')}
                        >
                          Chưa đọc
                        </button>
                      )}

                      {item.status !== 'resolved' && (
                        <button
                          type="button"
                          className="btn btn-accent btn-sm"
                          disabled={isBusy}
                          onClick={() => void handleUpdateStatus(item.id, 'resolved')}
                        >
                          <IconCheck size={14} />
                          <span>Đã xử lý</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className="ops-portal-root">
      <div className="ops-portal-switcher">
        <div className="ops-portal-tabs" role="tablist" aria-label="Phân khu quản trị">
          <button
            type="button"
            role="tab"
            className="ops-portal-tab"
            aria-selected={portalTab === 'dashboard'}
            onClick={() => setPortalTab('dashboard')}
          >
            Bảng điều khiển
          </button>
          <button
            type="button"
            role="tab"
            className="ops-portal-tab"
            aria-selected={portalTab === 'feedback'}
            onClick={() => setPortalTab('feedback')}
          >
            <IconMail size={15} />
            <span>Hòm thư Feedback</span>
            {unreadCount > 0 && <span className="ops-portal-badge">{unreadCount}</span>}
          </button>
        </div>
      </div>

      {portalTab === 'dashboard' ? (
        <>
          <AdminView />
          {feedbackInboxSection}
        </>
      ) : (
        feedbackInboxSection
      )}
    </div>
  );
};

export default OpsPortal;
