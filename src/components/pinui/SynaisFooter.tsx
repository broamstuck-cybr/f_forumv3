import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Command, FileCheck2, ShieldCheck } from 'lucide-react';
import type { AppRoute } from '../../types/index';
import { KineticLogo } from '../brand/KineticLogo';

export interface SynaisFooterProps {
  onNavigate: (route: AppRoute) => void;
  onOpenNotice: () => void;
  onOpenCommandPalette: () => void;
}

const WORDMARK = 'F-FORUM';

export const SynaisFooter: React.FC<SynaisFooterProps> = ({
  onNavigate,
  onOpenNotice,
  onOpenCommandPalette,
}) => {
  const reduced = Boolean(useReducedMotion());

  const columns: Array<{ title: string; links: Array<{ label: string; action: () => void }> }> = [
    {
      title: 'Không gian chính',
      links: [
        { label: 'Landing Page', action: () => onNavigate('landing') },
        { label: 'Home Launchpad', action: () => onNavigate('home') },
        { label: 'Thư viện Explore', action: () => onNavigate('explore') },
        { label: 'Work space Arena', action: () => onNavigate('workspace') },
      ],
    },
    {
      title: 'Cộng đồng & Tri thức',
      links: [
        { label: 'Source of Knowledge', action: () => onNavigate('community') },
        { label: 'Dev Q&A', action: () => onNavigate('community') },
        { label: 'Project Showcase', action: () => onNavigate('community') },
        { label: 'Club Hub Handover', action: () => onNavigate('community') },
      ],
    },
    {
      title: 'Hệ thống & Cấu hình',
      links: [
        { label: 'Maker Profile & Cài đặt', action: () => onNavigate('settings') },
        { label: 'Phím tắt Ctrl+E', action: onOpenCommandPalette },
        { label: 'Giấy phép & Changelog', action: onOpenNotice },
      ],
    },
    {
      title: 'Minh bạch & An toàn',
      links: [
        { label: 'Chính sách kiểm chứng AI', action: onOpenNotice },
        { label: 'Ghi nhận nguồn MIT', action: onOpenNotice },
        { label: 'Quét lộ lọt bí mật ZIP', action: () => onNavigate('workspace') },
      ],
    },
  ];

  return (
    <footer className="sy-footer pt-14" aria-label="Chân trang F-FORUM v3">
      <div className="ff-container">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] pb-12">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-2.5 bg-transparent border-0 p-0 cursor-pointer"
            >
              <KineticLogo size={30} showWordmark />
            </button>
            <p className="max-w-sm text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              Môi trường kiến tạo Web, UI/UX và chia sẻ tri thức học thuật với Live Preview sandbox, Diff trực quan và kiểm định tự động.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-medium cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--border-strong)',
                  background: 'var(--bg-panel)',
                  color: 'var(--ink-primary)',
                }}
              >
                <Command className="h-3.5 w-3.5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                <span>Mở nhanh Ctrl+E</span>
              </button>
              <button
                type="button"
                onClick={onOpenNotice}
                className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-medium cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--ink-secondary)',
                }}
              >
                <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Notice &amp; MIT</span>
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
          <p className="m-0">F-FORUM v3 · Obsidian Foundry &amp; Editorial Stone Design System</p>
          <p className="m-0 inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--accent-jade)' }} aria-hidden="true" />
            <span>AI có thể sai sót — luôn kiểm chứng lại mã nguồn và học liệu.</span>
          </p>
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
