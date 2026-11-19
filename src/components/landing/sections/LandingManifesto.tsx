import React, { useState } from 'react';
import type { DimensionView } from '../../../types/index';
import { useAppStore } from '../../../store/appStore';
import { PromptComposer, type PromptComposerAction } from '../../pinui';
import { MANIFESTO_PILLARS, MANIFESTO_TEXT } from '../landingContent';
import { ScrollTextScrub } from '../LandingPrimitives';

interface LandingManifestoProps {
  onNavigate: (view: DimensionView) => void;
}

const LANDING_COMPOSER_ACTIONS: PromptComposerAction[] = [
  {
    id: 'landing',
    label: 'Trang đích',
    placeholder: 'Mô tả mạch kể chuyện và nhịp cuộn hai chiều cho trang giới thiệu...',
    accent: 'var(--accent-primary)',
    kind: 'image',
  },
  {
    id: 'dashboard',
    label: 'Dữ liệu',
    placeholder: 'Thiết kế không gian phân tích số liệu rõ ràng và tương thích 390px...',
    accent: 'var(--accent-verdigris)',
    kind: 'note',
  },
  {
    id: 'club-hub',
    label: 'Hội nhóm',
    placeholder: 'Xây dựng hồ sơ chuyển giao dự án học thuật cho câu lạc bộ...',
    accent: 'var(--accent-jade)',
    kind: 'event',
  },
  {
    id: 'quiz-tools',
    label: 'Phản biện',
    placeholder: 'Tạo công cụ đối chiếu giả định và bằng chứng theo phương pháp Socratic...',
    accent: 'var(--accent-copper)',
    kind: 'voice',
  },
  {
    id: 'design-code',
    label: 'Mã nguồn',
    placeholder: 'Chuyển đặc tả giao diện thành HTML/CSS/JS sạch đi qua Diff & Check...',
    accent: 'var(--accent-primary)',
    kind: 'docs',
  },
];

export const LandingManifesto: React.FC<LandingManifestoProps> = ({ onNavigate }) => {
  const { launchPromptToWorkspace } = useAppStore();
  const [promptText, setPromptText] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('Định tuyến');

  const handleSend = (prompt: string) => {
    void launchPromptToWorkspace(prompt);
  };

  return (
    <section
      id="tuyen-ngon"
      aria-label="Tuyên ngôn Tư duy Phản biện"
      className="relative w-full bg-[#090a0d] text-[#f4f1ea]"
    >
      <div className="mx-auto max-w-[1160px] px-4 py-28 sm:px-8 sm:py-36">
        <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[11.5px] text-[#adb3bf]">
          <span>03 · Tuyên ngôn Tư duy Phản biện</span>
          <span>Cuộn để soi sáng từng chữ</span>
        </div>

        <ScrollTextScrub
          text={MANIFESTO_TEXT}
          className="m-0 text-[1.65rem] leading-[1.34] tracking-tight sm:text-[2.35rem] md:text-[2.85rem]"
        />

        <div className="mt-16 grid gap-6 border-t border-white/10 pt-10 md:grid-cols-3">
          {MANIFESTO_PILLARS.map((pillar) => (
            <div key={pillar.title} className="space-y-2">
              <h3
                className="m-0 text-[17px] font-semibold text-[#e5c384]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {pillar.title}
              </h3>
              <p className="m-0 text-[13.5px] leading-relaxed text-[#adb3bf]">
                {pillar.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-t-[40px] md:rounded-t-[60px] bg-[#f7f5f0] text-[#141413] px-4 pt-20 pb-28 sm:px-8 sm:pt-28 sm:pb-36"
        style={
          {
            '--ink-primary': '#141413',
            '--ink-secondary': '#46433c',
            '--ink-muted': '#66645e',
            '--ink-inverse': '#fbfbfa',
            '--bg-surface': '#ffffff',
            '--bg-panel': '#efece4',
            '--bg-elevated': '#e5e0d4',
            '--border-subtle': 'rgba(20, 20, 19, 0.1)',
            '--border-strong': 'rgba(20, 20, 19, 0.18)',
            '--border-accent': 'rgba(130, 91, 29, 0.38)',
            '--accent-primary': '#825b1d',
            '--accent-soft': 'rgba(130, 91, 29, 0.12)',
          } as React.CSSProperties
        }
      >
        <div className="mx-auto max-w-[960px] text-center">
          <div className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-[#825b1d]">
            PinUI · Khởi tạo trực tiếp
          </div>
          <h2
            className="mt-4 text-[2rem] leading-[1.12] tracking-tight sm:text-[3rem]"
            style={{ fontFamily: 'var(--font-serif)', color: '#141413' }}
          >
            <span
              className="ornate-cap"
              style={{ color: '#825b1d', display: 'inline', paddingRight: '0.03em' }}
            >
              Đ
            </span>
            ưa câu hỏi của bạn vào xưởng thực nghiệm ngay tại đây.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed" style={{ color: '#46433c' }}>
            Chọn một thẻ tác vụ hoặc gõ ý tưởng bên dưới để mở thẳng Workspace với Live View và Diff &amp; Check.
          </p>

          <div className="mt-10 text-left">
            <PromptComposer
              layoutId="landing-pinui-composer"
              theme="light"
              value={promptText}
              onChange={setPromptText}
              selectedAction={selectedAction}
              onSelectAction={setSelectedAction}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              actions={LANDING_COMPOSER_ACTIONS}
              onSend={handleSend}
              onAttachClick={() => onNavigate('explore')}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="rounded-full border border-[#141413]/20 bg-white px-6 py-2.5 text-[13px] font-medium text-[#141413] cursor-pointer hover:border-[#825b1d]"
            >
              Trang chủ
            </button>
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="rounded-full border-0 px-6 py-2.5 text-[13px] font-semibold text-[#fbfbfa] cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #8f6420 0%, #5c3d10 100%)' }}
            >
              Workspace
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingManifesto;
