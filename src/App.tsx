import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { LayoutGroup, MotionConfig } from 'motion/react';
import { AppProvider, useAppStore } from './store/appStore';
import { AppNavbar } from './components/layout/AppNavbar';
import { AppFooter } from './components/layout/AppFooter';
import { AmbientVideoBackdrop } from './components/layout/AmbientVideoBackdrop';
import { GlobalRouteLoader } from './components/layout/GlobalRouteLoader';
import { GlobalThemeAtmosphere } from './components/layout/GlobalThemeAtmosphere';
import { AuthModal } from './components/public/AuthModal';
import { NoticeStatusModal } from './components/public/NoticeStatusModal';
import { ToastStack } from './components/public/ToastStack';
import './components/layout/app-shell.css';

const LandingPage = lazy(() =>
  import('./components/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const HomeView = lazy(() =>
  import('./features/launchpad/HomeView').then((m) => ({ default: m.HomeView }))
);
const ExploreView = lazy(() =>
  import('./features/explore/ExploreView').then((m) => ({ default: m.ExploreView }))
);
const ExperienceView = lazy(() =>
  import('./features/explore/ExperienceView').then((m) => ({ default: m.ExperienceView }))
);
const WorkspaceView = lazy(() =>
  import('./features/workspace/WorkspaceView').then((m) => ({ default: m.WorkspaceView }))
);
const CommunityView = lazy(() =>
  import('./features/community/CommunityView').then((m) => ({ default: m.CommunityView }))
);
const ProfileView = lazy(() =>
  import('./features/profile/ProfileView').then((m) => ({ default: m.ProfileView }))
);
const SettingsView = lazy(() =>
  import('./features/settings/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const AdminView = lazy(() =>
  import('./features/admin/AdminView').then((m) => ({ default: m.AdminView }))
);
const Skybridge404 = lazy(() =>
  import('./components/public/Skybridge404').then((m) => ({ default: m.Skybridge404 }))
);

const ROUTE_META: Record<
  string,
  { title: string; description: string; path: string; noindex?: boolean }
> = {
  landing: {
    title: 'F-Forum — Kho thiết kế, mã nguồn mở và không gian dựng Web/UI',
    description:
      'F-Forum là bàn soi giao diện và không gian dựng thử web chạy trực tiếp trên trình duyệt: xem thật, sửa thật, mang về dùng.',
    path: '/',
  },
  home: {
    title: 'Trang chủ — F-Forum',
    description: 'Khởi tạo đặc tả giao diện, khám phá mẫu chuyển động và kệ sách tài nguyên kỹ thuật.',
    path: '/home',
  },
  explore: {
    title: 'Bàn soi Khám phá — F-Forum',
    description: 'Soi 196 mẫu tương tác, không gian 3D, hiệu ứng, chuyển động, bố cục cùng 32 công cụ AI và 122 kho GitHub.',
    path: '/explore',
  },
  experience: {
    title: 'Trải nghiệm thành phần — F-Forum',
    description: 'Trải nghiệm trực tiếp thành phần giao diện, chỉnh thông số mã nguồn và lưu bookmark.',
    path: '/explore/experience',
  },
  workspace: {
    title: 'Workspace — F-Forum',
    description: 'Nơi bạn mô tả điều muốn dựng, xem kết quả ngay bên cạnh và mang bản chạy được về máy.',
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
    noindex: true,
  },
  'not-found': {
    title: 'Không tìm thấy trang — F-Forum',
    description: 'Đường dẫn không tồn tại trên F-Forum.',
    path: '/404',
    noindex: true,
  },
};

const SITE_ORIGIN = 'https://fforum3.vercel.app';
const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

function setMetaContent(selector: string, value: string): void {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
}

const ROUTE_LOAD_LABELS: Record<string, string> = {
  landing: 'Đang mở trang giới thiệu...',
  home: 'Đang mở Trang chủ...',
  explore: 'Đang mở Bàn soi Khám phá...',
  experience: 'Đang nạp Trải nghiệm mẫu...',
  workspace: 'Đang mở Workspace...',
  community: 'Đang mở Tri thức cộng đồng...',
  profile: 'Đang mở Hồ sơ thành viên...',
  settings: 'Đang mở Cài đặt hệ thống...',
  admin: 'Đang mở Bảng điều khiển...',
};

const AppShell: React.FC = () => {
  const { currentRoute, navigate, currentUser, authModalOpen, setAuthModalOpen, reducedMotion } = useAppStore();
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const meta = ROUTE_META[currentRoute] ?? ROUTE_META.landing;
    const fullUrl = `${SITE_ORIGIN}${meta.path}`;
    document.title = meta.title;
    setMetaContent('meta[name="description"]', meta.description);
    setMetaContent('meta[name="robots"]', meta.noindex ? 'noindex, nofollow' : INDEX_ROBOTS);
    setMetaContent('meta[property="og:title"]', meta.title);
    setMetaContent('meta[property="og:description"]', meta.description);
    setMetaContent('meta[property="og:url"]', fullUrl);
    setMetaContent('meta[name="twitter:title"]', meta.title);
    setMetaContent('meta[name="twitter:description"]', meta.description);
    const canonEl = document.querySelector('link[rel="canonical"]');
    if (currentRoute === 'not-found') {
      canonEl?.remove();
    } else if (canonEl) {
      canonEl.setAttribute('href', fullUrl);
    } else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', fullUrl);
      document.head.appendChild(link);
    }
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    mainRef.current?.focus({ preventScroll: true });
    setRouteTransitioning(true);
    const timer = window.setTimeout(() => setRouteTransitioning(false), reducedMotion ? 120 : 340);
    return () => window.clearTimeout(timer);
  }, [currentRoute, reducedMotion]);

  const showNavbar = currentRoute !== 'landing' && currentRoute !== 'not-found' && currentRoute !== 'workspace';
  const showFooter =
    currentRoute === 'home' ||
    currentRoute === 'explore' ||
    currentRoute === 'experience' ||
    currentRoute === 'community' ||
    currentRoute === 'profile' ||
    currentRoute === 'settings';

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      <LayoutGroup>
        <div className="shell">
          <AmbientVideoBackdrop />
          <GlobalThemeAtmosphere />
          <GlobalRouteLoader
            visible={routeTransitioning}
            label={ROUTE_LOAD_LABELS[currentRoute] || 'Đang nạp trang...'}
          />
          <a className="skip-link" href="#noi-dung">
            Tới nội dung
          </a>
          {showNavbar && <AppNavbar onOpenNotice={() => setNoticeModalOpen(true)} />}

          <main id="noi-dung" ref={mainRef} tabIndex={-1} className="shell__main">
            <Suspense
              fallback={
                <GlobalRouteLoader
                  visible
                  label={ROUTE_LOAD_LABELS[currentRoute] || 'Đang nạp trang...'}
                />
              }
            >
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
              {currentRoute === 'experience' && <ExperienceView />}
              {currentRoute === 'workspace' && <WorkspaceView />}
              {currentRoute === 'community' && <CommunityView />}
              {currentRoute === 'profile' && <ProfileView />}
              {currentRoute === 'settings' && <SettingsView />}
              {currentRoute === 'admin' && <AdminView />}
              {currentRoute === 'not-found' && <Skybridge404 onNavigate={navigate} />}
            </Suspense>
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
