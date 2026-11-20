import React, { lazy, Suspense, useEffect, useState } from 'react';
import { LayoutGroup, MotionConfig } from 'motion/react';
import { AppProvider, useAppStore } from './store/appStore';
import { AppNavbar } from './components/layout/AppNavbar';
import { LandingPage } from './components/landing/LandingPage';
import { SynaisFooter } from './components/pinui';
import { AuthModal } from './components/public/AuthModal';
import { NoticeStatusModal } from './components/public/NoticeStatusModal';
import { Skybridge404 } from './components/public/Skybridge404';
import { ToastStack } from './components/public/ToastStack';
const AdminView = lazy(() => import('./features/admin/AdminView').then((module) => ({ default: module.AdminView })));
const CommunityView = lazy(() => import('./features/community/CommunityView').then((module) => ({ default: module.CommunityView })));
const ExploreView = lazy(() => import('./features/explore/ExploreView').then((module) => ({ default: module.ExploreView })));
const HomeView = lazy(() => import('./features/launchpad/HomeView').then((module) => ({ default: module.HomeView })));
const ProfileView = lazy(() => import('./features/profile/ProfileView').then((module) => ({ default: module.ProfileView })));
const SettingsView = lazy(() => import('./features/settings/SettingsView').then((module) => ({ default: module.SettingsView })));
const WorkspaceView = lazy(() => import('./features/workspace/WorkspaceView').then((module) => ({ default: module.WorkspaceView })));
const titles = {
  landing: 'Xưởng thực hành web', home: 'Bàn làm việc', explore: 'Khám phá', workspace: 'Work',
  community: 'Source of Knowledge', profile: 'Hồ sơ', settings: 'Cài đặt', admin: 'Quản trị',
  'not-found': 'Không tìm thấy trang',
};


const AppShell: React.FC = () => {
  const {
    currentRoute,
    navigate,
    authModalOpen,
    setAuthModalOpen,
    reducedMotion,
  } = useAppStore();

  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  useEffect(() => { document.title = `${titles[currentRoute]} · F-Forum`; }, [currentRoute]);

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
          data-route={currentRoute}
          className="min-h-screen w-full flex flex-col overflow-x-clip"
        >
          {showNavbar && <><a className="app-skip" href="#app-content">Đến nội dung</a><AppNavbar onOpenNotice={() => setNoticeModalOpen(true)} /></>}

          <div id="app-content" tabIndex={-1} className="flex-1 min-w-0 flex flex-col">
            <Suspense fallback={<p className="ff-container py-6" role="status">Đang tải…</p>}>
            {currentRoute === 'landing' && (
              <LandingPage onOpenNotice={() => setNoticeModalOpen(true)} />
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
            </Suspense>
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
