import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { AppRoute, DimensionView, User } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { safeStorage } from '../../utils/storage';
import { BackToTop } from './LandingPrimitives';
import { LandingNav } from './LandingNav';
import { LANDING_CHAPTERS } from './landingContent';
import { scrollToSection, useActiveChapter, useLenisSmoothScroll } from './useLandingMotion';
import { LandingHero } from './sections/LandingHero';
import { LandingShowcase } from './sections/LandingShowcase';
import { LandingManifesto } from './sections/LandingManifesto';
import { LandingProjects } from './sections/LandingProjects';
import { LandingPricing } from './sections/LandingPricing';
import { LandingFAQ } from './sections/LandingFAQ';
import { LandingFooter } from './sections/LandingFooter';

export interface LandingPageProps {
  currentUser?: User | null;
  onOpenAuth?: () => void;
  onOpenLogin?: () => void;
  onEnterApp?: () => void;
  onNavigate?: (view: DimensionView) => void;
}

const CHAPTER_IDS = LANDING_CHAPTERS.map((c) => c.id);

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser: propUser,
  onOpenAuth,
  onOpenLogin,
  onEnterApp,
  onNavigate,
}) => {
  const store = useAppStore();
  const [noticeOpen, setNoticeOpen] = useState(false);

  const currentUser = propUser !== undefined ? propUser : store.currentUser;
  const enterApp = onEnterApp ?? (() => store.navigate('home'));
  const openAuth = onOpenAuth ?? (() => store.setAuthModalOpen(true));
  const openLogin = onOpenLogin ?? (() => store.setAuthModalOpen(true));
  const navigateTo = onNavigate ?? ((view: DimensionView) => store.navigate(view));

  const activeChapterId = useActiveChapter(CHAPTER_IDS);

  useLenisSmoothScroll(true);

  useEffect(() => {
    safeStorage.setItem('fforum_landing_seen', 'true');
  }, []);

  const handleFooterNavigate = (route: AppRoute) => {
    if (route === 'landing') {
      scrollToSection('top');
      return;
    }
    store.navigate(route);
  };

  return (
    <div className="ff-landing select-text">
      <a href="#ff-main" className="ff-skip-link">
        Chuyển đến nội dung chính
      </a>

      <LandingNav
        currentUser={currentUser}
        onOpenLogin={openLogin}
        onOpenRegister={openAuth}
        onEnterApp={enterApp}
      />

      <nav aria-label="Chỉ mục chương" className="ff-chapter-rail">
        {LANDING_CHAPTERS.map((chapter) => {
          const active = activeChapterId === chapter.id;
          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => scrollToSection(chapter.id)}
              aria-label={chapter.label}
              title={chapter.label}
              data-active={active}
              className="ff-chapter-dot"
            >
              {chapter.code}
            </button>
          );
        })}
      </nav>

      <main id="ff-main" tabIndex={-1} className="relative z-10 w-full outline-none">
        <LandingHero
          currentUser={currentUser}
          onOpenAuth={openAuth}
          onOpenLogin={openLogin}
          onEnterApp={enterApp}
          onNavigate={navigateTo}
        />
        <LandingShowcase onNavigate={navigateTo} />
        <LandingManifesto onNavigate={navigateTo} />
        <LandingProjects onNavigate={navigateTo} />
        <LandingPricing onEnterApp={enterApp} />
        <LandingFAQ onEnterApp={enterApp} />
      </main>

      <LandingFooter onNavigate={handleFooterNavigate} onOpenNotice={() => setNoticeOpen(true)} />
      <BackToTop />

      {noticeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Thông tin bản quyền và kiểm định"
          className="fixed inset-0 z-[90] grid place-items-center bg-black/70 px-4 backdrop-blur-sm"
        >
          <div className="ff-glass w-full max-w-lg rounded-[28px] p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--ff-border)] pb-3">
              <div
                className="text-lg font-semibold text-[var(--ff-text)]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Bản quyền &amp; Minh bạch
              </div>
              <button
                type="button"
                onClick={() => setNoticeOpen(false)}
                aria-label="Đóng"
                title="Đóng"
                className="grid h-8 w-8 place-items-center rounded-full border border-[var(--ff-border)] bg-transparent text-[var(--ff-text-soft)] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="m-0 text-[13.5px] leading-relaxed text-[var(--ff-text-soft)]">
              F-Forum tôn trọng đầy đủ nguồn gốc học liệu từ PinUI, ThreeUI, MotionSites, LucianLabs,
              CodeFronts và SOURCEOFKNOWLEDGFORAI. Mọi mã nguồn chạy trong Live View đều đi qua sandbox cô lập và Diff &amp; Check.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setNoticeOpen(false)}
                className="ff-btn ff-btn-primary px-5 py-2 text-[13px]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
