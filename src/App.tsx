import React, { useState } from 'react';
import { LayoutGroup, MotionConfig } from 'motion/react';
import { AppProvider, useAppStore } from './store/appStore';
import { AppNavbar } from './components/layout/AppNavbar';
import { LandingPage } from './components/landing/LandingPage';
import { SynaisFooter } from './components/pinui';
import { AuthModal } from './components/public/AuthModal';
import { NoticeStatusModal } from './components/public/NoticeStatusModal';
import { Skybridge404 } from './components/public/Skybridge404';
import { ToastStack } from './components/public/ToastStack';
import { AdminView } from './features/admin/AdminView';
import { CommunityView } from './features/community/CommunityView';
import { ExploreView } from './features/explore/ExploreView';
import { HomeView } from './features/launchpad/HomeView';
import { ProfileView } from './features/profile/ProfileView';
import { SettingsView } from './features/settings/SettingsView';
import { WorkspaceView } from './features/workspace/WorkspaceView';

const AppShell: React.FC = () => {
  const {
    currentRoute,
    navigate,
    currentUser,
    authModalOpen,
    setAuthModalOpen,
    reducedMotion,
  } = useAppStore();

  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  const showNavbar = currentRoute !== 'landing' && currentRoute !== 'not-found';
  const showFooter =
    currentRoute === 'explore' ||
    currentRoute === 'community' ||
    currentRoute === 'profile' ||
    currentRoute === 'settings';

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      <LayoutGroup>
        <div
          style={{
            background: 'var(--bg-canvas)',
            color: 'var(--ink-primary)',
          }}
          className="min-h-screen w-full flex flex-col overflow-x-clip"
        >
          {showNavbar && <AppNavbar onOpenNotice={() => setNoticeModalOpen(true)} />}

          <div className="flex-1 min-w-0 flex flex-col">
            {currentRoute === 'landing' && (
              <LandingPage
                currentUser={currentUser}
                onOpenAuth={() => setAuthModalOpen(true)}
                onOpenLogin={() => setAuthModalOpen(true)}
                onEnterApp={() => navigate('home')}
                onNavigate={(view) => navigate(view)}
              />
            )}

            {currentRoute === 'home' && (
              <HomeView onOpenNotice={() => setNoticeModalOpen(true)} />
            )}

            {currentRoute === 'explore' && <ExploreView />}
            {currentRoute === 'workspace' && <WorkspaceView />}
            {currentRoute === 'community' && <CommunityView />}
            {currentRoute === 'profile' && <ProfileView />}
            {currentRoute === 'settings' && <SettingsView />}
            {currentRoute === 'admin' && <AdminView />}
            {currentRoute === 'not-found' && <Skybridge404 onNavigate={navigate} />}
          </div>

          {showFooter && (
            <SynaisFooter
              onNavigate={navigate}
              onOpenNotice={() => setNoticeModalOpen(true)}
            />
          )}

          <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />

          <NoticeStatusModal
            open={noticeModalOpen}
            onClose={() => setNoticeModalOpen(false)}
          />

          <ToastStack />
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
};

export default App;
