import React, { useState } from 'react';
import type { DimensionView } from '../../../types/index';
import { useAppStore } from '../../../store/appStore';
import { Mark } from '../../../ui/Mark';
import { Reveal } from '../../../ui/Reveal';
import { ScrollFillText } from '../../../ui/ScrollFillText';
import { PromptComposer, type PromptComposerAction } from '../../pinui';
import { MANIFESTO_PILLARS, MANIFESTO_TEXT } from '../landingContent';

interface LandingManifestoProps {
  onNavigate: (view: DimensionView) => void;
}

const LANDING_COMPOSER_ACTIONS: PromptComposerAction[] = [
  {
    id: 'landing',
    label: 'Trang đích',
    placeholder: 'Mô tả mạch kể chuyện và nhịp cuộn hai chiều cho trang giới thiệu...',
    kind: 'image',
  },
  {
    id: 'dashboard',
    label: 'Dữ liệu',
    placeholder: 'Thiết kế không gian phân tích số liệu rõ ràng và tương thích 390px...',
    kind: 'note',
  },
  {
    id: 'club-hub',
    label: 'Hội nhóm',
    placeholder: 'Xây dựng hồ sơ chuyển giao dự án học thuật cho câu lạc bộ...',
    kind: 'event',
  },
  {
    id: 'quiz-tools',
    label: 'Phản biện',
    placeholder: 'Tạo công cụ đối chiếu giả định và bằng chứng theo phương pháp Socratic...',
    kind: 'voice',
  },
  {
    id: 'design-code',
    label: 'Mã nguồn',
    placeholder: 'Chuyển đặc tả giao diện thành HTML/CSS/JS sạch đi qua Diff & Check...',
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
    <section id="tuyen-ngon" aria-label="Tuyên ngôn Tư duy Phản biện" className="scene-ink">
      <div className="lp-section">
        <div className="wrap">
          <p className="t-label">tuyên ngôn kiểm chứng</p>

          <ScrollFillText text={MANIFESTO_TEXT} className="lp-manifesto-text" />

          <ul className="lp-pillars">
            {MANIFESTO_PILLARS.map((pillar, index) => (
              <Reveal key={pillar.title} as="li" delay={index * 0.08} className="lp-pillar">
                <h3>{pillar.title}</h3>
                <p>{pillar.detail}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>

      <div className="lp-section sheet scene-paper">
        <div className="wrap lp-desk">
          <div className="lp-desk-head">
            <p className="t-label">pin ui, khởi tạo trực tiếp</p>
            <h2 className="t-title">
              Đặt câu hỏi lên bàn <Mark kind="underline">ngay tại đây</Mark>
            </h2>
            <p className="t-lead">
              Chọn một thẻ tác vụ hoặc gõ ý tưởng của bạn để mở thẳng Workspace với Live View và Diff &amp; Check.
            </p>
          </div>

          <div className="lp-desk-box">
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

          <div className="lp-actions">
            <button type="button" className="btn btn-line" onClick={() => onNavigate('home')}>
              Trang chủ
            </button>
            <button type="button" className="btn btn-solid" onClick={() => onNavigate('workspace')}>
              Workspace
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingManifesto;
