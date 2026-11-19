import React, { useEffect } from 'react';
import type { DimensionView, User } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { safeStorage } from '../../utils/storage';
import { BackToTop } from './LandingPrimitives';
import { LandingNav } from './LandingNav';
import { LandingHero } from './sections/LandingHero';
import { LandingShowcase } from './sections/LandingShowcase';
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

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser: propUser,
  onOpenAuth,
  onOpenLogin,
  onEnterApp,
  onNavigate,
}) => {
  const store = useAppStore();
  const currentUser = propUser !== undefined ? propUser : store.currentUser;
  const enterApp = onEnterApp ?? (() => store.navigate('home'));
  const openAuth = onOpenAuth ?? (() => store.setAuthModalOpen(true));
  const openLogin = onOpenLogin ?? (() => store.setAuthModalOpen(true));
  const navigateTo = onNavigate ?? ((view: DimensionView) => store.navigate(view));

  useEffect(() => {
    safeStorage.setItem('fforum_landing_seen', 'true');
  }, []);

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

      <main id="ff-main" tabIndex={-1} className="relative z-10 w-full outline-none">
        <LandingHero
          currentUser={currentUser}
          onOpenAuth={openAuth}
          onOpenLogin={openLogin}
          onEnterApp={enterApp}
          onNavigate={navigateTo}
        />
        <LandingShowcase onNavigate={navigateTo} />
        <LandingPricing onEnterApp={enterApp} />
        <LandingFAQ onEnterApp={enterApp} />
      </main>

      <LandingFooter currentUser={currentUser} onEnterApp={enterApp} onOpenAuth={openAuth} />
      <BackToTop />
    </div>
  );
};

export default LandingPage;
