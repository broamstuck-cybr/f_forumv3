import React, { useEffect, useState } from 'react';
import type { AppRoute, DimensionView, User } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { safeStorage } from '../../utils/storage';
import { NoticeStatusModal } from '../public/NoticeStatusModal';
import { LandingNav } from './LandingNav';
import { LANDING_CHAPTERS } from './landingContent';
import { TidewellStage } from './TidewellStage';
import { scrollToSection, useActiveChapter, useLenisSmoothScroll } from './useLandingMotion';
import { LandingHero } from './sections/LandingHero';
import { LandingManifesto } from './sections/LandingManifesto';
import { LandingProjects } from './sections/LandingProjects';
import { LandingFAQ } from './sections/LandingFAQ';
import { LandingFooter } from './sections/LandingFooter';
import { BackToTopButton } from './BackToTopButton';
import { IrisQrCornerSection } from '../launchpad/IrisQrCornerSection';
import { SiteRail } from '../pinui';
import './landing.css';

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
      scrollToSection('top', 0);
      return;
    }
    store.navigate(route);
  };

  return (
    <div className="lp select-text">
      <LandingNav
        currentUser={currentUser}
        onOpenLogin={openLogin}
        onOpenRegister={openAuth}
        onEnterApp={enterApp}
      />

      <nav aria-label="Chỉ mục chương" className="lp-chapter-rail">
        {LANDING_CHAPTERS.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            onClick={() => scrollToSection(chapter.id)}
            aria-label={chapter.label}
            title={chapter.label}
            data-active={activeChapterId === chapter.id}
            className="lp-chapter-dot"
          >
            {chapter.code}
          </button>
        ))}
      </nav>

      <LandingHero
        currentUser={currentUser}
        onOpenAuth={openAuth}
        onOpenLogin={openLogin}
        onEnterApp={enterApp}
        onNavigate={navigateTo}
      />
      <TidewellStage onNavigate={navigateTo} />
      <LandingManifesto onNavigate={navigateTo} />
      <LandingProjects onNavigate={navigateTo} />
      <LandingFAQ onEnterApp={enterApp} />
      <IrisQrCornerSection onNavigate={navigateTo} contextLabel="landing" />
      {store.settings.uiMode === 'fabulous' && (
        <div className="lp-fab-rail">
          <SiteRail
            theme={store.theme}
            onBrandClick={() => scrollToSection('top', 0)}
            links={LANDING_CHAPTERS.map((chapter) => ({
              id: chapter.id,
              label: chapter.label,
              active: activeChapterId === chapter.id,
              onClick: () => scrollToSection(chapter.id),
            }))}
          />
        </div>
      )}
      <LandingFooter onNavigate={handleFooterNavigate} onOpenNotice={() => setNoticeOpen(true)} />
      <BackToTopButton />

      <NoticeStatusModal open={noticeOpen} onClose={() => setNoticeOpen(false)} />
    </div>
  );
};

export default LandingPage;
