import React from 'react';
import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import type { User } from '../../../types/index';
import { KineticLogo } from '../../brand/KineticLogo';
import { scrollToSection } from '../useLandingMotion';

const CONTACT_EMAIL = 'contact@f-forum.dev';
const CURRENT_YEAR = new Date().getFullYear();

interface LandingFooterProps {
  currentUser: User | null;
  onEnterApp: () => void;
  onOpenAuth: () => void;
}

const LINK_GROUPS: { title: string; links: { label: string; section?: string; href?: string }[] }[] = [
  {
    title: 'F-Forum v3',
    links: [
      { label: 'Giới thiệu', section: 'top' },
      { label: 'Khám phá', section: 'kham-pha' },
      { label: 'Chi phí', section: 'bang-gia' },
      { label: 'Hỏi đáp', section: 'faq' },
    ],
  },
  {
    title: 'Không gian',
    links: [
      { label: 'Home Launchpad', section: 'kham-pha' },
      { label: 'Explore UI/UX', section: 'kham-pha' },
      { label: 'Work space Arena', section: 'kham-pha' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Câu hỏi thường gặp', section: 'faq' },
      { label: 'Kiểm duyệt nội dung', section: 'faq' },
      { label: 'Liên hệ kỹ thuật', href: `mailto:${CONTACT_EMAIL}` },
    ],
  },
];

export const LandingFooter: React.FC<LandingFooterProps> = ({
  currentUser,
  onEnterApp,
  onOpenAuth,
}) => {
  return (
    <footer className="relative z-10 w-full border-t border-[var(--ff-border)] bg-[var(--ff-bg-soft)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,2fr)]">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <KineticLogo size={32} />
              <span className="ff-brand-serif bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-xl text-transparent">
                F-Forum
              </span>
            </div>
            <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-[var(--ff-text-soft)]">
              Không gian học thuật và kiến tạo Web/UI bằng AI — nơi câu hỏi, mã nguồn có kiểm định và bộ sưu tập thiết kế
              hội tụ trên cùng một nền tảng.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button type="button" onClick={onEnterApp} className="ff-btn ff-btn-primary group px-5 py-2.5 text-[13px]">
                Vào ứng dụng
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
              {!currentUser && (
                <button type="button" onClick={onOpenAuth} className="ff-btn ff-btn-ghost px-5 py-2.5 text-[13px]">
                  Tạo tài khoản
                </button>
              )}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label="Gửi email hỗ trợ"
                className="ff-btn ff-btn-ghost h-9 w-9 !p-0"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {LINK_GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h3 className="font-mono text-[11px] font-semibold text-[var(--ff-text-dim)]">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-2.5 m-0 p-0 list-none">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.href ? (
                        <a
                          href={link.href}
                          className="group inline-flex items-center gap-1 text-[13px] text-[var(--ff-text-soft)] transition-colors hover:text-[var(--ff-text)]"
                        >
                          {link.label}
                          <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => link.section && scrollToSection(link.section)}
                          className="text-[13px] text-[var(--ff-text-soft)] bg-transparent border-0 p-0 cursor-pointer transition-colors hover:text-[var(--ff-text)]"
                        >
                          {link.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--ff-border)] pt-6 sm:flex-row">
          <p className="text-center text-[12px] text-[var(--ff-text-dim)] sm:text-left m-0">
            © {CURRENT_YEAR} F-Forum v3 · Open Web &amp; Knowledge Workbench · {CONTACT_EMAIL}
          </p>
          <p className="flex items-center gap-1.5 text-[12px] text-[var(--ff-text-dim)] m-0">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            Học thuật · Kiến tạo · Minh bạch
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
