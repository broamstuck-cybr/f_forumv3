import React, { useEffect, useState } from 'react';
import type { AppRoute, DimensionView, User } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { safeStorage } from '../../utils/storage';
import { NoticeStatusModal } from '../public/NoticeStatusModal';
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
      scrollToSection('top');
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

      <nav aria-label="Chỉ mục chương" className="lp-chapter-rail scene-ink">
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
      <LandingShowcase onNavigate={navigateTo} />
      <LandingManifesto onNavigate={navigateTo} />
      <LandingProjects onNavigate={navigateTo} />
      <LandingPricing onEnterApp={enterApp} />
      <LandingFAQ onEnterApp={enterApp} />
      <LandingFooter onNavigate={handleFooterNavigate} onOpenNotice={() => setNoticeOpen(true)} />

      <NoticeStatusModal open={noticeOpen} onClose={() => setNoticeOpen(false)} />
    </div>
  );
};

export default LandingPage;
