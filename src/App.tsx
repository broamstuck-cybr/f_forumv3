import React, { useEffect, useRef, useState } from 'react';
import { LayoutGroup, MotionConfig } from 'motion/react';
import { AppProvider, useAppStore } from './store/appStore';
import { AppNavbar } from './components/layout/AppNavbar';
import { AppFooter } from './components/layout/AppFooter';
import { LandingPage } from './components/landing/LandingPage';
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
import './components/layout/app-shell.css';

const ROUTE_META: Record<string, { title: string; description: string; path: string }> = {
  landing: {
    title: 'F-Forum — Viết bằng AI, chấm bằng bút đỏ',
    description:
      'F-Forum là không gian kiến tạo Web/UI với Live View cô lập, Diff & Check 6 lớp và kho 6.770 mẫu mã nguồn mở.',
    path: '/',
  },
  home: {
    title: 'Trang chủ — F-Forum',
    description: 'Khởi tạo nhanh đặc tả giao diện với PinUI Prompt Composer và kho mẫu chuyển động thực tế.',
    path: '/home',
  },
  explore: {
    title: 'Bàn soi Khám phá — F-Forum',
    description: 'Soi 6.770 mẫu từ PinUI, ThreeUI, MotionSites, LucianLabs, CodeFronts và bảng xếp hạng kho GitHub.',
    path: '/explore',
  },
  workspace: {
    title: 'Workspace — F-Forum',
    description: 'Bàn làm việc 3 vùng với Live View cô lập 390/768/1440px, Diff & Check 6 lớp và xuất ZIP quét bí mật.',
    path: '/workspace',
  },
  community: {
    title: 'Tòa soạn Source of Knowledge — F-Forum',
    description: 'Phản biện kỹ thuật, trình diễn hộp cát, học liệu chuẩn hóa và hồ sơ chuyển giao câu lạc bộ.',
    path: '/community',
  },
  profile: {
    title: 'Hồ sơ — F-Forum',
    description: 'Trang bìa hồ sơ thành viên, số liệu thực của phiên và tập bản in đã lưu.',
    path: '/profile',
  },
  settings: {
    title: 'Cài đặt — F-Forum',
    description: 'Chuyển đổi Mực và Giấy, giảm chuyển động, cấu hình khóa API riêng BYOK và sao lưu dữ liệu cục bộ.',
    path: '/settings',
  },
  admin: {
    title: 'Quản trị — F-Forum',
    description: 'Bảng điều khiển quản trị hệ thống F-Forum v3.',
    path: '/admin',
  },
  'not-found': {
    title: 'Không tìm thấy trang — F-Forum',
    description: 'Đường dẫn không tồn tại trên F-Forum.',
    path: '/404',
  },
};

const SITE_ORIGIN = 'https://fforum3.vercel.app';

const AppShell: React.FC = () => {
  const { currentRoute, navigate, currentUser, authModalOpen, setAuthModalOpen, reducedMotion } = useAppStore();
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const meta = ROUTE_META[currentRoute] ?? ROUTE_META.landing;
    document.title = meta.title;
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.setAttribute('content', meta.description);
    const canonEl = document.querySelector('link[rel="canonical"]');
    if (canonEl) canonEl.setAttribute('href', `${SITE_ORIGIN}${meta.path}`);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [currentRoute]);

  const showNavbar = currentRoute !== 'landing' && currentRoute !== 'not-found';
  const showFooter =
    currentRoute === 'home' ||
    currentRoute === 'explore' ||
    currentRoute === 'community' ||
    currentRoute === 'profile' ||
    currentRoute === 'settings';

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      <LayoutGroup>
        <div className="shell">
          <a className="skip-link" href="#noi-dung">
            Tới nội dung
          </a>
          {showNavbar && <AppNavbar onOpenNotice={() => setNoticeModalOpen(true)} />}

          <main id="noi-dung" ref={mainRef} tabIndex={-1} className="shell__main">
            {currentRoute === 'landing' && (
              <LandingPage
                currentUser={currentUser}
                onOpenAuth={() => setAuthModalOpen(true)}
                onEnterApp={() => navigate('home')}
                onNavigate={(view) => navigate(view)}
              />
            )}
            {currentRoute === 'home' && <HomeView />}
            {currentRoute === 'explore' && <ExploreView />}
            {currentRoute === 'workspace' && <WorkspaceView />}
            {currentRoute === 'community' && <CommunityView />}
            {currentRoute === 'profile' && <ProfileView />}
            {currentRoute === 'settings' && <SettingsView />}
            {currentRoute === 'admin' && <AdminView />}
            {currentRoute === 'not-found' && <Skybridge404 onNavigate={navigate} />}
          </main>

          {showFooter && <AppFooter onNavigate={navigate} onOpenNotice={() => setNoticeModalOpen(true)} />}

          <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
          <NoticeStatusModal open={noticeModalOpen} onClose={() => setNoticeModalOpen(false)} />
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
