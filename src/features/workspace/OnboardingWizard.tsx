import React, { useState } from 'react';
import { KineticLogo } from '../../components/brand/KineticLogo';
import { triggerPinuiThemeToggle } from '../../components/layout/GlobalThemeAtmosphere';
import { BRAND_PALETTES } from '../../engine/motionCraftPack';
import type {
  BrandPersonality,
  OnboardingDomain,
  OnboardingGoal,
  OnboardingProfile,
  OnboardingRole,
  PageSectionKey,
} from '../../types/workspaceV4';
import './onboarding.css';

export interface OnboardingWizardProps {
  initialProfile?: OnboardingProfile | null;
  theme: 'dark' | 'light';
  onComplete: (profile: OnboardingProfile) => void;
  onSkip: () => void;
  onNavigateHome: () => void;
  onOpenShowcase: () => void;
}

const ROLE_OPTIONS: Array<{ id: OnboardingRole; label: string }> = [
  { id: 'student', label: 'Học sinh / Sinh viên' },
  { id: 'beginner', label: 'Người mới (cần thật nhanh)' },
  { id: 'business', label: 'Chủ shop / Kinh doanh' },
  { id: 'tech', label: 'Dân công nghệ (cần mã sạch)' },
];

const DOMAIN_OPTIONS: Array<{ id: OnboardingDomain; label: string }> = [
  { id: 'education', label: 'Học tập & Thuyết trình' },
  { id: 'event', label: 'CLB & Sự kiện' },
  { id: 'portfolio', label: 'Hồ sơ cá nhân' },
  { id: 'business', label: 'Kinh doanh & Bán hàng' },
  { id: 'tech', label: 'Công nghệ & 3D' },
];

const GOAL_OPTIONS: Array<{ id: OnboardingGoal; label: string }> = [
  { id: 'present', label: 'Xem bài thuyết trình' },
  { id: 'register', label: 'Đăng ký tham gia' },
  { id: 'sell', label: 'Nhắn mua / Tư vấn' },
  { id: 'portfolio', label: 'Xem hồ sơ & Liên hệ' },
];

const PERSONALITY_OPTIONS: Array<{
  id: BrandPersonality;
  label: string;
  dot: string;
}> = [
  { id: 'professional', label: 'Chuyên nghiệp', dot: BRAND_PALETTES.professional.dotColor },
  { id: 'friendly', label: 'Thân thiện', dot: BRAND_PALETTES.friendly.dotColor },
  { id: 'minimal', label: 'Tinh tế, tối giản', dot: BRAND_PALETTES.minimal.dotColor },
  { id: 'playful', label: 'Năng động, trẻ trung', dot: BRAND_PALETTES.playful.dotColor },
  { id: 'bold', label: 'Mạnh mẽ, cá tính', dot: BRAND_PALETTES.bold.dotColor },
  { id: 'modern', label: 'Hiện đại, công nghệ', dot: BRAND_PALETTES.modern.dotColor },
];

const SECTION_OPTIONS: Array<{ id: PageSectionKey; label: string }> = [
  { id: 'hero', label: 'Mở đầu ấn tượng' },
  { id: 'stats', label: 'Bảng số liệu' },
  { id: 'timeline', label: 'Lịch trình' },
  { id: 'pricing', label: 'Bảng giá' },
  { id: 'register', label: 'Form đăng ký' },
  { id: 'quiz', label: 'Đố vui / Thẻ lật' },
  { id: 'team', label: 'Đội ngũ' },
];

const STEP_COPY: Array<{ title: string; sub: string }> = [
  {
    title: 'Bạn là ai & mức độ quen làm web?',
    sub: 'Chọn một nhóm gần nhất để AI điều chỉnh cách gợi ý và cấu trúc trang.',
  },
  {
    title: 'Tên trang & Lĩnh vực của bạn?',
    sub: 'Nhập tên dự án hoặc CLB, rồi chọn lĩnh vực chính để kho mẫu khớp đúng chủ đề.',
  },
  {
    title: 'Khách vào trang sẽ làm gì chính?',
    sub: 'Một hành động rõ ràng giúp nút bấm và bố cục tập trung ngay từ màn đầu.',
  },
  {
    title: 'Cá tính thương hiệu của bạn?',
    sub: 'Mỗi lựa chọn đi kèm hệ chữ, bảng màu tương phản chuẩn và nhịp chuyển động riêng.',
  },
  {
    title: 'Chọn các mục muốn có sẵn trên trang',
    sub: 'Bạn có thể thêm hoặc bỏ bất kỳ phần nào sau khi vào khung Chat.',
  },
];

const CheckIcon: React.FC = () => (
  <span className="onb__check" aria-hidden="true">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
);

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialProfile,
  theme,
  onComplete,
  onSkip,
  onNavigateHome,
  onOpenShowcase,
}) => {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<OnboardingRole>(initialProfile?.role ?? 'student');
  const [siteName, setSiteName] = useState<string>(initialProfile?.siteName ?? '');
  const [domain, setDomain] = useState<OnboardingDomain>(initialProfile?.domain ?? 'education');
  const [goal, setGoal] = useState<OnboardingGoal>(initialProfile?.goal ?? 'present');
  const [personality, setPersonality] = useState<BrandPersonality>(
    initialProfile?.personality ?? 'modern'
  );
  const [sections, setSections] = useState<PageSectionKey[]>(
    initialProfile?.sections && initialProfile.sections.length > 0
      ? initialProfile.sections
      : ['hero', 'stats', 'timeline', 'register']
  );

  const toggleSection = (key: PageSectionKey) => {
    setSections((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  };

  const finish = () => {
    const cleanName = siteName.trim() || defaultNameForDomain(domain);
    const finalSections: PageSectionKey[] = sections.includes('showcase')
      ? sections
      : [...sections, 'showcase'];
    onComplete({
      role,
      siteName: cleanName,
      domain,
      goal,
      personality,
      sections: finalSections,
      completedAt: new Date().toISOString(),
    });
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const currentMeta = STEP_COPY[step];

  return (
    <section className="onb" aria-label="Thiết lập nhanh 5 bước">
      <div className="onb__ambient" aria-hidden="true" />
      <div className="onb__stars" aria-hidden="true" />

      <header className="onb__top">
        <button
          type="button"
          className="onb__brand"
          onClick={onNavigateHome}
          aria-label="F-Forum, về trang chủ"
          title="Trang chủ"
        >
          <KineticLogo size={24} showWordmark />
        </button>

        <div className="onb__topActions">
          <button
            type="button"
            className="onb__ghostBtn"
            onClick={onOpenShowcase}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>15 mẫu Agent</span>
          </button>

          <button
            type="button"
            className="onb__iconBtn"
            onClick={(e) => triggerPinuiThemeToggle(e.currentTarget)}
            aria-label={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
            title={theme === 'dark' ? 'Nền sáng' : 'Nền tối'}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="onb__stage">
        <div className="onb__col">
          <div className="onb__progress">
            <div className="onb__progressMeta">
              <span>Bước {step + 1} / 5</span>
              <span>Thiết lập Workspace</span>
            </div>
            <div className="onb__bars" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={5}>
              {[0, 1, 2, 3, 4].map((idx) => (
                <span
                  key={idx}
                  className={`onb__bar${idx < step ? ' is-done' : ''}${idx === step ? ' is-active' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="onb__head">
            <h1 className="onb__title">{currentMeta.title}</h1>
            <p className="onb__sub">{currentMeta.sub}</p>
          </div>

          {step === 0 && (
            <div className="onb__pills" role="radiogroup" aria-label="Vai trò người dùng">
              {ROLE_OPTIONS.map((opt) => {
                const selected = role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`onb__pill${selected ? ' is-selected' : ''}`}
                    onClick={() => setRole(opt.id)}
                  >
                    <span className="onb__pillLeft">{opt.label}</span>
                    {selected && <CheckIcon />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="onb__inputWrap">
              <input
                type="text"
                className="onb__input"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNext();
                }}
                placeholder="Ví dụ: CLB Robotics THPT 2026, Xưởng Gốm Mộc..."
                aria-label="Tên trang web của bạn"
                maxLength={70}
                autoFocus
              />
              <p className="onb__sectionLabel">Chọn lĩnh vực gần nhất:</p>
              <div className="onb__pills--wrap" role="radiogroup" aria-label="Lĩnh vực">
                {DOMAIN_OPTIONS.map((opt) => {
                  const selected = domain === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`onb__pill onb__pill--chip${selected ? ' is-selected' : ''}`}
                      onClick={() => setDomain(opt.id)}
                    >
                      <span>{opt.label}</span>
                      {selected && <CheckIcon />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onb__pills" role="radiogroup" aria-label="Mục tiêu chính">
              {GOAL_OPTIONS.map((opt) => {
                const selected = goal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`onb__pill${selected ? ' is-selected' : ''}`}
                    onClick={() => setGoal(opt.id)}
                  >
                    <span className="onb__pillLeft">{opt.label}</span>
                    {selected && <CheckIcon />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="onb__pills--grid" role="radiogroup" aria-label="Cá tính thương hiệu">
              {PERSONALITY_OPTIONS.map((opt) => {
                const selected = personality === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`onb__pill${selected ? ' is-selected' : ''}`}
                    onClick={() => setPersonality(opt.id)}
                  >
                    <span className="onb__pillLeft">
                      <span
                        className="onb__dot"
                        style={{ backgroundColor: opt.dot }}
                        aria-hidden="true"
                      />
                      <span>{opt.label}</span>
                    </span>
                    {selected && <CheckIcon />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="onb__pills--wrap" role="group" aria-label="Các mục trên trang">
              {SECTION_OPTIONS.map((opt) => {
                const selected = sections.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    className={`onb__pill onb__pill--chip${selected ? ' is-selected' : ''}`}
                    onClick={() => toggleSection(opt.id)}
                  >
                    <span>{opt.label}</span>
                    {selected && <CheckIcon />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="onb__actions">
            <div className="onb__footLeft">
              {step > 0 && (
                <button
                  type="button"
                  className="onb__textBtn"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  <span>Quay lại</span>
                </button>
              )}
              <button
                type="button"
                className="onb__textBtn"
                onClick={onSkip}
              >
                Bỏ qua, vào Chat luôn
              </button>
            </div>

            <button
              type="button"
              className="onb__primaryBtn"
              onClick={handleNext}
            >
              <span>{step === 4 ? 'Vào khung Chat' : 'Tiếp tục'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

function defaultNameForDomain(domain: OnboardingDomain): string {
  switch (domain) {
    case 'education':
      return 'Chuyên đề Học tập 2026';
    case 'event':
      return 'CLB & Sự kiện 2026';
    case 'portfolio':
      return 'Hồ sơ Cá nhân';
    case 'business':
      return 'Sản phẩm & Dịch vụ';
    case 'tech':
      return 'Dự án Công nghệ 3D';
  }
}
