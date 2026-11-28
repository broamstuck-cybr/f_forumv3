import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AGENT_SHOWCASE_15 } from '../../data/agentShowcase15';
import { handleLiquidPointerLeave, handleLiquidPointerMove } from '../../utils/liquidGlassPointer';
import type { AgentShowcaseProduct, PublishedPageCategory } from '../../types/workspaceV4';

export interface Showcase15DrawerProps {
  open: boolean;
  activeId?: string | null;
  onClose: () => void;
  onSelect: (product: AgentShowcaseProduct) => void;
}

const CATEGORY_TABS: Array<{ id: 'all' | PublishedPageCategory; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'presentation', label: 'Học tập' },
  { id: 'event', label: 'Sự kiện' },
  { id: 'portfolio', label: 'Hồ sơ' },
  { id: 'business', label: 'Kinh doanh' },
  { id: 'tech', label: '3D & Tech' },
];

const SHORT_CATEGORY_LABEL: Record<PublishedPageCategory, string> = {
  presentation: 'Học tập',
  event: 'Sự kiện',
  portfolio: 'Hồ sơ',
  business: 'Kinh doanh',
  tech: '3D & Tech',
};

export const Showcase15Drawer: React.FC<Showcase15DrawerProps> = ({
  open,
  activeId,
  onClose,
  onSelect,
}) => {
  const [category, setCategory] = useState<'all' | PublishedPageCategory>('all');
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const items = useMemo(
    () =>
      category === 'all'
        ? AGENT_SHOWCASE_15
        : AGENT_SHOWCASE_15.filter((item) => item.category === category),
    [category]
  );

  if (!open) return null;

  return (
    <div className="ws-drawerOverlay" onClick={onClose}>
      <aside
        className="ws-drawer lg-chrome"
        role="dialog"
        aria-modal="true"
        aria-label="15 mẫu demo"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ws-drawer__head">
          <div>
            <h2>15 mẫu demo</h2>
            <p>Chọn mẫu để mở chạy thử ngay.</p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="ws-iconBtn"
            onClick={onClose}
            aria-label="Đóng bảng mẫu"
            title="Đóng"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <div className="ws-drawer__tabs" role="tablist" aria-label="Lọc theo chủ đề">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={category === tab.id}
              className={`ws-drawerTab${category === tab.id ? ' is-active' : ''}`}
              onClick={() => setCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ws-drawer__list">
          {items.map((prod) => {
            const isActive = activeId === prod.id;
            const shortCat = SHORT_CATEGORY_LABEL[prod.category] || prod.categoryLabel;
            return (
              <button
                key={prod.id}
                type="button"
                className={`ws-showcaseCard lg-glass lg-glass--matte${isActive ? ' is-active' : ''}`}
                onPointerMove={handleLiquidPointerMove}
                onPointerLeave={handleLiquidPointerLeave}
                onClick={() => {
                  onSelect(prod);
                  onClose();
                }}
              >
                <div className="ws-showcaseCard__media">
                  <img
                    src={`/assets/showcase-15/${prod.slug}.webp`}
                    alt={`Xem trước ${prod.title}`}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="ws-showcaseCard__badge">{shortCat}</span>
                  <span className="ws-showcaseCard__cta" aria-hidden="true">
                    {isActive ? 'Đang mở' : 'Mở demo'}
                  </span>
                </div>
                <div className="ws-showcaseCard__body">
                  <h3>{prod.title}</h3>
                  <p>{prod.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
};
