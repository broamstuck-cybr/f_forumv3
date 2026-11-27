import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/appStore';
import {
  apiClient,
  type FeedbackCategory,
  type FeedbackRecord,
} from '../../services/apiClient';
import {
  IconAlertCircle,
  IconCheckCircle2,
  IconLoader2,
  IconSend,
  IconX,
} from '../../ui/icons';
import './feedback-modal.css';

export interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const FEEDBACK_CATEGORIES: Array<{ id: FeedbackCategory; label: string }> = [
  { id: 'feature', label: 'Góp ý tính năng' },
  { id: 'bug', label: 'Báo lỗi' },
  { id: 'ui', label: 'Giao diện' },
  { id: 'other', label: 'Khác' },
];

const RATING_LABELS: Record<number, string> = {
  1: '1/5 — Cần sửa sớm',
  2: '2/5 — Chưa ổn lắm',
  3: '3/5 — Tạm ổn',
  4: '4/5 — Khá tốt',
  5: '5/5 — Rất hài lòng',
};

const MAX_MESSAGE_LEN = 2000;

const StarIcon: React.FC<{ filled: boolean; size?: number }> = ({ filled, size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onClose }) => {
  const { currentUser, addToast } = useAppStore();
  const titleId = useId();
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [pageUrl, setPageUrl] = useState<string>('/');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<FeedbackRecord | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    if (typeof window !== 'undefined') {
      const currentPath = `${window.location.pathname}${window.location.search}` || '/';
      setPageUrl(currentPath);
    }
    if (currentUser) {
      setSenderName((prev) => (prev.trim() ? prev : currentUser.name || currentUser.username || ''));
      setSenderEmail((prev) => (prev.trim() ? prev : currentUser.email || ''));
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    const focusTimer = window.setTimeout(() => {
      if (!submittedRecord) {
        messageInputRef.current?.focus({ preventScroll: true });
      }
    }, 60);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, currentUser, onClose, submittedRecord]);

  const handleReset = () => {
    setSubmittedRecord(null);
    setError(null);
    setMessage('');
    setRating(5);
    setCategory('feature');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 3) {
      setError('Hãy viết ít nhất 3 ký tự để đội ngũ hiểu rõ góp ý của bạn.');
      messageInputRef.current?.focus();
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await apiClient.submitFeedback({
        category,
        rating,
        message: trimmedMessage,
        senderName: senderName.trim() || undefined,
        senderEmail: senderEmail.trim() || undefined,
        pageUrl,
      });
      setSubmittedRecord(res.feedback);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ff:feedback-submitted', { detail: res.feedback })
        );
      }
      addToast({
        type: 'success',
        title: 'Đã gửi góp ý',
        message: 'Cảm ơn bạn đã chia sẻ với đội ngũ F-Forum.',
      });
    } catch (err) {
      const errMsg =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Không gửi được góp ý lúc này. Bạn thử lại nhé.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  const activeStars = hoverRating || rating;
  const activeCategoryLabel =
    FEEDBACK_CATEGORIES.find((c) => c.id === (submittedRecord?.category ?? category))?.label ??
    'Khác';

  return createPortal(
    <div
      className="fb-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div className="fb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fb-header">
          <div className="fb-title-group">
            <h2 id={titleId} className="fb-title">
              Gửi góp ý cho F-Forum
            </h2>
            <p className="fb-subtitle">
              Báo lỗi, đề xuất tính năng hoặc chia sẻ điều bạn muốn cải thiện.
            </p>
          </div>
          <button
            type="button"
            className="fb-close-btn"
            onClick={onClose}
            aria-label="Đóng"
            title="Đóng"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="fb-body">
          {submittedRecord ? (
            <div className="fb-success" role="status" aria-live="polite">
              <div className="fb-success-badge" aria-hidden="true">
                <IconCheckCircle2 size={28} />
              </div>
              <h3 className="fb-success-title">Cảm ơn bạn đã góp ý</h3>
              <p className="fb-success-copy">
                Phản hồi đã được lưu vào hộp thư quản trị của F-Forum
                {submittedRecord.emailStatus === 'sent'
                  ? ' và chuyển tiếp tới email đội ngũ.'
                  : '.'}
              </p>
              <div className="fb-success-meta">
                <span>Danh mục: {activeCategoryLabel}</span>
                <span>Đánh giá: {submittedRecord.rating}/5 sao</span>
                <span>Mã: {submittedRecord.id}</span>
              </div>
              <div className="fb-success-actions">
                <button type="button" className="fb-btn" onClick={handleReset}>
                  Gửi thêm
                </button>
                <button type="button" className="fb-btn fb-btn--primary" onClick={onClose}>
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="fb-section" style={{ gap: 16 }}>
              <div className="fb-section">
                <span className="fb-label">Chủ đề góp ý</span>
                <div className="fb-category-grid" role="group" aria-label="Chọn chủ đề góp ý">
                  {FEEDBACK_CATEGORIES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="fb-cat-btn"
                      aria-pressed={category === item.id}
                      onClick={() => setCategory(item.id)}
                    >
                      <span className="fb-cat-dot" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="fb-section">
                <span className="fb-label">Mức độ hài lòng</span>
                <div className="fb-rating-bar">
                  <div
                    className="fb-stars"
                    role="radiogroup"
                    aria-label="Đánh giá từ 1 đến 5 sao"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={rating === star}
                        aria-label={`${star} sao`}
                        title={`${star} sao`}
                        className={`fb-star-btn ${star <= activeStars ? 'is-active' : ''}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => setRating(star)}
                      >
                        <StarIcon filled={star <= activeStars} />
                      </button>
                    ))}
                  </div>
                  <span className="fb-rating-caption">{RATING_LABELS[activeStars]}</span>
                </div>
              </div>

              <div className="fb-section">
                <div className="fb-label-row">
                  <label htmlFor="ff-fb-message" className="fb-label">
                    Nội dung góp ý
                  </label>
                  <span
                    className={`fb-counter ${message.length > MAX_MESSAGE_LEN - 120 ? 'is-warn' : ''}`}
                  >
                    {message.length} / {MAX_MESSAGE_LEN}
                  </span>
                </div>
                <textarea
                  ref={messageInputRef}
                  id="ff-fb-message"
                  className="fb-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LEN))}
                  maxLength={MAX_MESSAGE_LEN}
                  required
                  placeholder="Bạn gặp lỗi ở đâu, hay muốn F-Forum thêm tính năng gì?"
                />
              </div>

              <div className="fb-two-col">
                <div className="fb-section">
                  <label htmlFor="ff-fb-name" className="fb-label">
                    Tên của bạn (tùy chọn)
                  </label>
                  <input
                    id="ff-fb-name"
                    type="text"
                    className="fb-input"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value.slice(0, 100))}
                    placeholder="Ví dụ: Minh Khôi"
                    autoComplete="name"
                  />
                </div>

                <div className="fb-section">
                  <label htmlFor="ff-fb-email" className="fb-label">
                    Email nhận phản hồi (tùy chọn)
                  </label>
                  <input
                    id="ff-fb-email"
                    type="email"
                    className="fb-input"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value.slice(0, 160))}
                    placeholder="ban@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && (
                <div className="fb-alert" role="alert">
                  <IconAlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="fb-footer">
                <span className="fb-route-pill">
                  <span>Trang:</span>
                  <code className="fb-route-code">{pageUrl}</code>
                </span>

                <div className="fb-actions">
                  <button type="button" className="fb-btn" onClick={onClose} disabled={submitting}>
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="fb-btn fb-btn--primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <IconLoader2 size={16} className="fb-spin" />
                        <span>Đang gửi</span>
                      </>
                    ) : (
                      <>
                        <IconSend size={15} />
                        <span>Gửi góp ý</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FeedbackModal;
