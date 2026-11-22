import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'motion/react';
import { X } from 'lucide-react';
import { glassSheet } from './reader-card-glass';
import './reader-card.css';

export interface ReaderCardProps {
  title?: string;
  subtitle?: string;
  excerptLines?: string[];
  paragraphs?: string[];
  openLabel?: string;
  theme?: 'light' | 'dark';
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const SIZES = [16, 17.5, 19, 21, 23];

function splitOrnateParagraph(text: string): { prefix: string; cap: string; rest: string } | null {
  const trimmedStart = text.trimStart();
  if (!trimmedStart) return null;
  const leadMatch = trimmedStart.match(/^([\p{P}\p{S}\s]+)/u);
  const prefix = leadMatch ? leadMatch[1] : '';
  const body = trimmedStart.slice(prefix.length);
  if (!body) return null;
  let firstGrapheme = '';
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('vi', { granularity: 'grapheme' });
    const first = seg.segment(body)[Symbol.iterator]().next().value;
    firstGrapheme = first ? first.segment : '';
  } else {
    const match = body.match(/^[\p{L}\p{N}]\p{M}*/u);
    firstGrapheme = match ? match[0] : body.slice(0, 1);
  }
  if (!firstGrapheme || !/\p{L}/u.test(firstGrapheme)) return null;
  const rest = body.slice(firstGrapheme.length);
  if (!rest) return null;
  return { prefix, cap: firstGrapheme, rest };
}

const DEFAULT_PARAGRAPHS = [
  'Một bảng dữ liệu 5 cột hiển thị ổn trên máy tính, nhưng trên điện thoại sẽ đẩy cả trang tràn ngang nếu thiếu min-width: 0 trên track lưới. Tách cấu trúc thành thẻ dọc hoặc bảng cuộn cô lập giúp giữ đúng biên đọc mà không cắt chữ.',
  'Thay vì đặt ba lớp backdrop-filter lên 500 phần tử cuộn liên tục, chỉ giữ kính mờ ở thanh điều hướng và hộp thoại nổi. Tốc độ khung hình tăng từ 35 lên 60 FPS trên laptop tầm trung, đồng thời tránh vệt đen ở góc bo tròn.',
  'Bộ biến CSS dùng chung cho hai nền tối và sáng phải khóa độ tương phản chữ thường từ 4.5:1 trở lên ngay tại :root. Khi tách riêng màu bề mặt và viền, thành phần con đổi giao diện theo theme mà không cần ghi đè từng lớp.',
  'Mỗi mẫu giao diện trong F-Forum đều đi kèm hộp cát chạy thử cô lập bằng thuộc tính sandbox="allow-scripts" và bộ kiểm tra tĩnh trước khi xuất bản. Bạn có thể đọc mã nguồn, đối chiếu diff từng dòng rồi nạp thẳng sang Workspace để chỉnh sửa.',
];

const morphOpen: Transition = { type: 'spring', visualDuration: 0.46, bounce: 0.14 };
const morphClose: Transition = { type: 'spring', visualDuration: 0.34, bounce: 0 };

export const ReaderCard: React.FC<ReaderCardProps> = ({
  title = 'Kỷ luật của Khoảng trống',
  subtitle = 'Tiểu luận Thiết kế · 2027',
  excerptLines,
  paragraphs = DEFAULT_PARAGRAPHS,
  openLabel = 'Đọc sâu',
  theme,
  onOpenChange,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const [open, setOpen] = useState(false);
  const [sizeIdx, setSizeIdx] = useState(1);
  const [progress, setProgress] = useState(0);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const excerptRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const safeParagraphs = paragraphs.length > 0 ? paragraphs : DEFAULT_PARAGRAPHS;
  const previewText = (excerptLines?.join(' ') || safeParagraphs[0] || '').trim();
  const secondaryExcerpt = !excerptLines && safeParagraphs[1] ? safeParagraphs[1].trim() : '';

  const toggleOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open || !sheetRef.current) return;
    const handle = glassSheet(sheetRef.current, { blur: 20, saturate: 1.5 });
    return () => handle.destroy();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        toggleOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    const ratio = excerptRef.current
      ? Math.min(safeParagraphs.length - 1, Math.floor((excerptRef.current.scrollTop / 180) * safeParagraphs.length))
      : 0;
    setFlashIdx(ratio);
    const timer = window.setTimeout(() => setFlashIdx(null), 1100);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [open, safeParagraphs.length]);

  const handleScrollBody = () => {
    const el = bodyRef.current;
    if (!el) return;
    const max = Math.max(1, el.scrollHeight - el.clientHeight);
    setProgress(Math.min(1, Math.max(0, el.scrollTop / max)));
  };

  return (
    <div className={`prc ${className}`} data-open={open ? 'true' : undefined} data-theme={theme}>
      <article className="prc__card">
        <div className="prc__pblur prc__pblur--top" aria-hidden="true" />
        <div className="prc__pblur prc__pblur--bottom" aria-hidden="true" />

        <div className="prc__header">
          <div className="prc__kicker">{subtitle}</div>
          <h3 className="prc__title">{title}</h3>
        </div>

        <div ref={excerptRef} className="prc__excerpt">
          <p className="prc__para">{previewText}</p>
          {secondaryExcerpt && <p className="prc__para prc__para--sub">{secondaryExcerpt}</p>}
        </div>

        <div className="prc__footer">
          <span className="prc__metaCount">{safeParagraphs.length} đoạn</span>
          <button
            type="button"
            className="prc__openPill"
            onClick={() => toggleOpen(true)}
          >
            {openLabel}
          </button>
        </div>
      </article>

      <AnimatePresence>
        {open && (
          <motion.div
            className="prc__scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0.01 } : { duration: 0.2 }}
            onClick={() => toggleOpen(false)}
          >
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="prc__sheet"
              initial={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, clipPath: 'inset(10% 14% 10% 14% round 28px)' }
              }
              animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 18px)' }}
              exit={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, clipPath: 'inset(12% 16% 12% 16% round 28px)' }
              }
              transition={reduced ? { duration: 0.01 } : open ? morphOpen : morphClose}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="prc__progress">
                <div
                  className="prc__progressFill"
                  style={{ transform: `scaleX(${Math.max(0.08, progress)})` }}
                />
              </div>

              <div className="prc__toolbar">
                <div className="prc__toolbarMeta">
                  <div className="prc__kicker">{subtitle}</div>
                  <h3 className="prc__sheetTitle">{title}</h3>
                </div>

                <div className="prc__toolbarControls">
                  <div className="prc__sizes" role="group" aria-label="Cỡ chữ">
                    {SIZES.map((sz, idx) => (
                      <button
                        key={sz}
                        type="button"
                        className="prc__sizeBtn"
                        data-active={sizeIdx === idx}
                        aria-label={`Cỡ chữ ${sz}`}
                        title={`Cỡ chữ ${sz}px`}
                        onClick={() => setSizeIdx(idx)}
                      >
                        {Math.round(sz)}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="prc__close"
                    aria-label="Đóng trình đọc"
                    title="Đóng"
                    onClick={() => toggleOpen(false)}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div ref={bodyRef} className="prc__body" onScroll={handleScrollBody}>
                <div className="prc__bodyInner" style={{ fontSize: `${SIZES[sizeIdx]}px` }}>
                  {safeParagraphs.map((p, idx) => {
                    const ornate = idx === 0 ? splitOrnateParagraph(p) : null;
                    return (
                      <p
                        key={idx}
                        className={`prc__resume ${flashIdx === idx ? 'is-flash' : ''}`}
                      >
                        {ornate ? (
                          <>
                            {ornate.prefix}
                            <span className="ornate-cap">{ornate.cap}</span>
                            {ornate.rest}
                          </>
                        ) : (
                          p
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReaderCard;
