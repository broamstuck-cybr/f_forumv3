import React from 'react';
import { ArrowUpRight, BookOpenCheck, Code2, HelpCircle, Layers } from 'lucide-react';
import type { DimensionView } from '../../../types/index';
import { Reveal } from '../LandingPrimitives';
import { QUESTION_GUIDE } from '../landingContent';

interface LandingShowcaseProps {
  onNavigate: (view: DimensionView) => void;
}

const DESTINATIONS: {
  id: DimensionView;
  title: string;
  label: string;
  icon: typeof HelpCircle;
  accent: string;
}[] = [
  {
    id: 'home',
    title: 'Home Launchpad',
    label: 'Khởi tạo ý tưởng với Prompt Blueprint 0-token và 5 thẻ tác vụ nhanh',
    icon: BookOpenCheck,
    accent: 'amber',
  },
  {
    id: 'explore',
    title: 'Explore UI/UX & Tài nguyên',
    label: 'Duyệt 121 template từ 5 thư viện nguồn mở và 8 nhóm tài nguyên đã kiểm chứng',
    icon: Layers,
    accent: 'sage',
  },
  {
    id: 'workspace',
    title: 'Work space Arena 3 cột',
    label: 'Chỉnh sửa HTML/CSS/JS với Live Preview sandbox, Diff trực quan và Checks tự động',
    icon: Code2,
    accent: 'terracotta',
  },
  {
    id: 'community',
    title: 'Source of Knowledge',
    label: 'Dev Q&A, Project Showcase, Community Drops và Hồ sơ chuyển giao Club Hub',
    icon: HelpCircle,
    accent: 'sage',
  },
];

export const LandingShowcase: React.FC<LandingShowcaseProps> = ({ onNavigate }) => (
  <section id="kham-pha" aria-label="Không gian học tập F-Forum" className="relative w-full px-4 py-14 sm:px-6 sm:py-20">
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="ff-showcase-light absolute inset-0" />
    </div>

    <div className="relative mx-auto max-w-6xl">
      <Reveal y={16}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="ff-eyebrow">Học hỏi · Kiến tạo</span>
            <h2 className="ff-display ff-balance mt-3 text-2xl text-[var(--ff-text)] sm:text-3xl">
              Bốn không gian gắn kết trên cùng một hệ thống.
            </h2>
          </div>
          <p className="max-w-md text-[13.5px] leading-relaxed text-[var(--ff-text-dim)]">
            Từ lúc lên ý tưởng, tham chiếu template chuẩn cho đến khi kiểm định mã nguồn và chia sẻ với cộng đồng.
          </p>
        </div>
      </Reveal>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DESTINATIONS.map(({ id, title, label, icon: Icon, accent }, index) => (
          <Reveal key={id} y={18} delay={index * 55}>
            <button
              type="button"
              onClick={() => onNavigate(id)}
              className={`ff-demo-route ff-demo-route--${accent} group flex min-h-[112px] w-full items-center gap-3.5 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-4 text-left cursor-pointer transition-colors duration-300 hover:border-[var(--ff-border-strong)] hover:bg-[var(--ff-surface-2)]`}
            >
              <span className="ff-demo-route__icon inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-[var(--ff-text)]">{title}</span>
                <span className="mt-1 block text-[11.5px] leading-snug text-[var(--ff-text-dim)]">{label}</span>
              </span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-[var(--ff-text-dim)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--ff-text)]"
                aria-hidden="true"
              />
            </button>
          </Reveal>
        ))}
      </div>

      <Reveal y={20} delay={140}>
        <div className="mt-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-5 sm:p-6 overflow-hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--ff-border)] pb-4">
            <h3 className="text-base sm:text-lg font-bold text-[var(--ff-text)]">
              Đặt câu hỏi và prompt sao cho mạch lạc ngay từ đầu
            </h3>
            <span className="font-mono text-[11.5px] text-[var(--ff-text-dim)]">
              Rõ mục tiêu · Rõ điểm mắc · Có đối chiếu
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {QUESTION_GUIDE.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold ff-ink--amber">
                      0{idx + 1} · {step.tag}
                    </span>
                    <StepIcon className="h-4 w-4 text-[var(--ff-text-dim)]" aria-hidden="true" />
                  </div>
                  <h4 className="text-[13.5px] font-semibold text-[var(--ff-text)]">{step.title}</h4>
                  <p className="text-[12.5px] leading-relaxed text-[var(--ff-text-soft)]">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

export default LandingShowcase;
