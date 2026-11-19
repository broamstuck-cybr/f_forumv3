import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { AppRoute } from '../../types/index';
import { KineticLogo } from '../brand/KineticLogo';
import './synais-footer.css';

export interface SynaisFooterProps {
  onNavigate: (route: AppRoute) => void;
  onOpenNotice: () => void;
  onOpenCommandPalette?: () => void;
  onSubscribe?: (email: string) => Promise<void> | void;
}

const WORDMARK = 'F-FORUM';

export const SynaisFooter: React.FC<SynaisFooterProps> = ({
  onNavigate,
  onOpenNotice,
}) => {
  const reduced = Boolean(useReducedMotion());

  const columns: Array<{ title: string; links: Array<{ label: string; action: () => void }> }> = [
    {
      title: 'Không gian',
      links: [
        { label: 'Giới thiệu', action: () => onNavigate('landing') },
        { label: 'Trang chủ', action: () => onNavigate('home') },
        { label: 'Khám phá', action: () => onNavigate('explore') },
        { label: 'Workspace', action: () => onNavigate('workspace') },
      ],
    },
    {
      title: 'Tri thức',
      links: [
        { label: 'Hỏi đáp', action: () => onNavigate('community') },
        { label: 'Trưng bày', action: () => onNavigate('community') },
        { label: 'Hội nhóm', action: () => onNavigate('community') },
      ],
    },
    {
      title: 'Hệ thống',
      links: [
        { label: 'Hồ sơ', action: () => onNavigate('profile') },
        { label: 'Cài đặt', action: () => onNavigate('settings') },
        { label: 'Nhật ký', action: onOpenNotice },
      ],
    },
    {
      title: 'Minh bạch',
      links: [
        { label: 'Chính sách', action: onOpenNotice },
        { label: 'Bản quyền', action: onOpenNotice },
        { label: 'Diff & Check', action: () => onNavigate('workspace') },
      ],
    },
  ];

  return (
    <footer className="sy-footer pt-14" aria-label="Chân trang F-Forum">
      <div className="ff-container">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] pb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="inline-flex items-center bg-transparent border-0 p-0 cursor-pointer"
                aria-label="F-Forum"
                title="F-Forum"
              >
                <KineticLogo size={30} showWordmark={false} />
              </button>
              <span
                className="font-semibold tracking-tight whitespace-nowrap select-none"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--ink-primary)',
                  fontSize: '19px',
                }}
              >
                F-FORUM
              </span>
            </div>
            <p className="max-w-sm text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              Không gian kiến tạo giao diện tĩnh tại, nơi mỗi dòng mã đi qua Live View cô lập và Diff &amp; Check minh bạch.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onOpenNotice}
                className="inline-flex items-center rounded-full border px-4 py-2 text-[12px] font-medium cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--ink-secondary)',
                }}
              >
                Bản quyền
              </button>
              <button
                type="button"
                onClick={() => onNavigate('workspace')}
                className="inline-flex items-center rounded-full border px-4 py-2 text-[12px] font-medium cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--border-accent)',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent-primary)',
                }}
              >
                Live View
              </button>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-4" aria-label="Liên kết chân trang">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-[12.5px] font-semibold mb-3.5" style={{ color: 'var(--ink-primary)' }}>
                  {col.title}
                </h3>
                <ul className="m-0 p-0 list-none space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={link.action}
                        className="bg-transparent border-0 p-0 text-left text-[13px] cursor-pointer transition-colors"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t py-5 text-[12px]"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-muted)' }}
        >
          <p className="m-0">F-Forum · Kiến trúc Giao diện &amp; Tư duy Phản biện</p>
          <p className="m-0">Đối chiếu từng dòng trước khi xuất bản.</p>
        </div>
      </div>

      <p className="sy-wordmark" aria-hidden="true">
        {Array.from(WORDMARK).map((ch, idx) => (
          <motion.span
            key={`${ch}-${idx}`}
            initial={reduced ? false : { y: '35%', opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {ch}
          </motion.span>
        ))}
      </p>
    </footer>
  );
};

export default SynaisFooter;
