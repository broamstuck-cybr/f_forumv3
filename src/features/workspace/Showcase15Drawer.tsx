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
  { id: 'all', label: 'Tất cả (15)' },
  { id: 'presentation', label: 'Thuyết trình & Học tập' },
  { id: 'event', label: 'CLB & Sự kiện' },
  { id: 'portfolio', label: 'Hồ sơ cá nhân' },
  { id: 'business', label: 'Kinh doanh & Sản phẩm' },
  { id: 'tech', label: 'Công nghệ & 3D' },
];

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
        className="ws-drawer lg-glass lg-glass--matte"
        role="dialog"
        aria-modal="true"
        aria-label="15 sản phẩm mẫu Agent Mode"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ws-drawer__head">
          <div>
            <h2>15 mẫu Agent Mode</h2>
            <p>Chọn bất kỳ sản phẩm nào để xem nhật ký AI tạo trang và chỉnh tiếp ngay bằng Chat.</p>
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
          {items.map((prod, idx) => {
            const isActive = activeId === prod.id;
            const isFeatured = idx === 0 && items.length >= 3;
            return (
              <button
                key={prod.id}
                type="button"
                className={`ws-showcaseCard lg-glass lg-glass--matte${isActive ? ' is-active' : ''}${isFeatured ? ' ws-showcaseCard--featured' : ''}`}
                onPointerMove={handleLiquidPointerMove}
                onPointerLeave={handleLiquidPointerLeave}
                onClick={() => {
                  onSelect(prod);
                  onClose();
                }}
              >
                <div className="ws-showcaseCard__top">
                  <span className="ws-showcaseCard__cat">{prod.categoryLabel}</span>
                  <span className="ws-showcaseCard__sig">{prod.motionSignature}</span>
                </div>
                <h3>{prod.title}</h3>
                <p>{prod.subtitle}</p>
                <div className="ws-showcaseCard__foot">
                  <span>{prod.authorLabel}</span>
                  <span>{prod.sourceRefs.length} mẫu kho</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
};
