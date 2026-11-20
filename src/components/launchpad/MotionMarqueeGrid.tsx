import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MOTION_MARQUEE_CATEGORIES,
  MOTION_MARQUEE_ITEMS,
  type MotionMarqueeItem,
  type MotionMarqueeRow,
} from '../../data/motionShowcaseCatalog';
import { useAppStore } from '../../store/appStore';
import { Mark } from '../../ui/Mark';

export interface MotionMarqueeGridProps {
  onLaunchPrompt: (prompt: string) => Promise<void> | void;
  reduced?: boolean;
}

const ROWS: readonly MotionMarqueeRow[] = [0, 1, 2, 3];

const MarqueeThumb: React.FC<{
  item: MotionMarqueeItem;
  className?: string;
  eager?: boolean;
}> = ({ item, className = '' }) => {
  const [useFallback, setUseFallback] = useState(false);
  const [plateOnly, setPlateOnly] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const src = useFallback ? item.fallbackUrl : item.imageUrl;

  if (plateOnly) {
    return (
      <div className={`mmq-thumb-plate ${className}`.trim()} role="img" aria-label={item.title}>
        <span className="t-label">{item.category}</span>
        <strong className="mmq-thumb-plate-title">{item.title}</strong>
        <span className="t-label">{item.specs.layout}</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className={`mmq-thumb-plate ${className}`.trim()} aria-hidden="true">
          <span className="t-label">{item.category}</span>
          <strong className="mmq-thumb-plate-title">{item.title}</strong>
          <span className="t-label">{item.specs.layout}</span>
        </div>
      )}
      <img
        className={`mmq-thumb-img ${className}`.trim()}
        src={src}
        alt={`${item.title} · ${item.category}`}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        style={loaded ? undefined : { opacity: 0, position: 'absolute', inset: 0 }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!useFallback && item.fallbackUrl && item.fallbackUrl !== item.imageUrl) {
            setUseFallback(true);
          } else {
            setPlateOnly(true);
          }
        }}
      />
    </>
  );
};

export const MotionMarqueeGrid: React.FC<MotionMarqueeGridProps> = ({
  onLaunchPrompt,
  reduced = false,
}) => {
  const {
    savedItemIds,
    toggleSavedItem,
    toggleLikedItem,
    isItemLiked,
    getHeartCount,
  } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [paused, setPaused] = useState(false);
  const [activeItem, setActiveItem] = useState<MotionMarqueeItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveItem(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeItem]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Tất cả') return MOTION_MARQUEE_ITEMS;
    return MOTION_MARQUEE_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const rowsData = useMemo(() => {
    return ROWS.map((rowIdx) => {
      const exactRow = filteredItems.filter((item) => item.row === rowIdx);
      if (exactRow.length > 0) return exactRow;
      return filteredItems.filter((_, idx) => idx % 4 === rowIdx);
    });
  }, [filteredItems]);

  const handleCopyPrompt = async (item: MotionMarqueeItem) => {
    try {
      await navigator.clipboard.writeText(item.promptText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = item.promptText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(item.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev));
    }, 2000);
  };

  const renderCard = (item: MotionMarqueeItem, isClone: boolean) => {
    const liked = isItemLiked(item.id);
    const hearts = getHeartCount(item.id);

    return (
      <article
        key={isClone ? `${item.id}-clone` : item.id}
        className="mmq-card"
        aria-hidden={isClone ? 'true' : undefined}
        onClick={() => setActiveItem(item)}
      >
        <div className="mmq-card-media">
          <MarqueeThumb item={item} />
          <div className="mmq-card-veil" aria-hidden="true">
            <span className="mmq-card-inspect">Cài đặt &amp; Prompt</span>
          </div>
          <span className="mmq-card-badge">{item.category}</span>
        </div>

        <div className="mmq-card-bar">
          <button
            type="button"
            className="mmq-card-title-btn"
            tabIndex={isClone ? -1 : 0}
            onClick={(e) => {
              e.stopPropagation();
              setActiveItem(item);
            }}
          >
            <span className="mmq-card-title">{item.title}</span>
            <span className="mmq-card-sub">{item.specs.layout}</span>
          </button>

          <button
            type="button"
            className="mmq-heart-btn"
            tabIndex={isClone ? -1 : 0}
            aria-pressed={liked}
            aria-label={`${liked ? 'Bỏ thả tim' : 'Thả tim'} ${item.title} (${hearts})`}
            onClick={(e) => {
              e.stopPropagation();
              toggleLikedItem(item.id);
            }}
          >
            <span className="mmq-heart-icon" aria-hidden="true" />
            <span className="mmq-heart-count">{hearts}</span>
          </button>
        </div>
      </article>
    );
  };

  const modalLiked = activeItem ? isItemLiked(activeItem.id) : false;
  const modalHearts = activeItem ? getHeartCount(activeItem.id) : 0;
  const modalSaved = activeItem ? savedItemIds.includes(activeItem.id) : false;
  const isCopied = activeItem ? copiedId === activeItem.id : false;

  return (
    <section aria-label="Sân khấu 48 mẫu chuyển động đối hướng" className="stry-band mmq-band">
      <div className="wrap-wide">
        <div className="mmq-head">
          <div className="mmq-head-copy">
            <p className="t-label">48 mẫu giao diện chuyển động · 4 dải chạy chéo đối hướng</p>
            <h2 className="t-title">
              Khung trưng bày <Mark kind="underline">chuyển động</Mark> trực tiếp
            </h2>
            <p className="t-lead">
              Bốn dải thẻ nghiêng nhẹ trôi ngược chiều nhau theo thời gian thực. Chạm vào bất kỳ mẫu nào để mở hộp
              thông số kỹ thuật, sao chép đặc tả Prompt hoặc khởi chạy ngay trong Workspace.
            </p>
          </div>

          <div className="mmq-controls">
            <div className="mmq-cats" role="tablist" aria-label="Lọc danh mục mẫu chuyển động">
              {(['Tất cả', ...MOTION_MARQUEE_CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  className="mmq-cat-chip"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {!reduced && (
              <button
                type="button"
                className="btn btn-line btn-sm mmq-pause-btn"
                aria-pressed={paused}
                onClick={() => setPaused((prev) => !prev)}
              >
                {paused ? 'Tiếp tục trôi' : 'Tạm dừng dải'}
              </button>
            )}
          </div>
        </div>
      </div>

      {reduced ? (
        <div className="wrap-wide">
          <div className="mmq-static-grid" role="list">
            {filteredItems.map((item) => (
              <div key={item.id} role="listitem">
                {renderCard(item, false)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mmq-stage-viewport">
          <div className="mmq-stage" data-paused={paused ? 'true' : undefined}>
            {rowsData.map((rowItems, idx) => {
              const dir = idx % 2 === 0 ? 'right' : 'left';
              return (
                <div
                  key={`mmq-row-${idx}`}
                  className={`mmq-row mmq-row--${dir}`}
                  data-row={idx}
                >
                  <div className="mmq-track">
                    <div className="mmq-group">
                      {rowItems.map((item) => renderCard(item, false))}
                    </div>
                    <div className="mmq-group" aria-hidden="true">
                      {rowItems.map((item) => renderCard(item, true))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="mmq-modal-backdrop"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveItem(null);
            }}
          >
            <div
              className="mmq-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Cài đặt và Prompt ${activeItem.title}`}
            >
              <header className="mmq-modal-head">
                <div className="mmq-modal-title-wrap">
                  <div className="mmq-modal-kicker">
                    <span className="tag tag-red">{activeItem.category}</span>
                    <span className="t-label">Hàng 0{activeItem.row + 1} · {activeItem.specs.responsive}</span>
                  </div>
                  <h3 className="mmq-modal-title">{activeItem.title}</h3>
                </div>

                <div className="mmq-modal-head-actions">
                  <button
                    type="button"
                    className="mmq-heart-btn mmq-heart-btn--modal"
                    aria-pressed={modalLiked}
                    onClick={() => toggleLikedItem(activeItem.id)}
                  >
                    <span className="mmq-heart-icon" aria-hidden="true" />
                    <span className="mmq-heart-count">{modalHearts}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    aria-pressed={modalSaved}
                    onClick={() => toggleSavedItem(activeItem.id)}
                  >
                    {modalSaved ? 'Đã lưu' : 'Lưu mẫu'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => setActiveItem(null)}
                  >
                    Đóng
                  </button>
                </div>
              </header>

              <div className="mmq-modal-body ff-scrollbar">
                <div className="mmq-modal-visual-col">
                  <div className="mmq-modal-preview">
                    <MarqueeThumb item={activeItem} eager />
                  </div>

                  <p className="mmq-modal-summary">{activeItem.summaryVi}</p>

                  <dl className="mmq-specs-grid">
                    <div>
                      <dt className="t-label">Bố cục</dt>
                      <dd>{activeItem.specs.layout}</dd>
                    </div>
                    <div>
                      <dt className="t-label">Chuyển động</dt>
                      <dd>{activeItem.specs.motion}</dd>
                    </div>
                    <div>
                      <dt className="t-label">Responsive</dt>
                      <dd>{activeItem.specs.responsive}</dd>
                    </div>
                    <div>
                      <dt className="t-label">Thời lượng</dt>
                      <dd>{activeItem.specs.durationMs} ms</dd>
                    </div>
                    <div>
                      <dt className="t-label">Easing</dt>
                      <dd className="mmq-mono">{activeItem.specs.easing}</dd>
                    </div>
                    <div>
                      <dt className="t-label">Tags</dt>
                      <dd>{activeItem.tags.join(' · ')}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mmq-modal-prompt-col">
                  <div className="mmq-prompt-bar">
                    <div>
                      <span className="t-label">Đặc tả hệ thống &amp; Prompt gốc</span>
                      <p className="mmq-prompt-note">{activeItem.starterPrompt}</p>
                    </div>
                    <div className="mmq-prompt-actions">
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => void handleCopyPrompt(activeItem)}
                      >
                        {isCopied ? 'Đã chép' : 'Chép Prompt'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-red btn-sm"
                        onClick={() => {
                          const prompt = activeItem.promptText;
                          setActiveItem(null);
                          void onLaunchPrompt(prompt);
                        }}
                      >
                        Mở trong Workspace
                      </button>
                    </div>
                  </div>

                  <pre className="mmq-prompt-pre ff-scrollbar">
                    <code>{activeItem.promptText}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};

export default MotionMarqueeGrid;
