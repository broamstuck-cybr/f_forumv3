import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { LayoutGroup, MotionConfig } from 'motion/react';
import { AppProvider, useAppStore } from './store/appStore';
import { AppNavbar } from './components/layout/AppNavbar';
import { AppFooter } from './components/layout/AppFooter';
import { AmbientVideoBackdrop } from './components/layout/AmbientVideoBackdrop';
import { CommandPalette } from './components/layout/CommandPalette';
import { GlobalRouteLoader } from './components/layout/GlobalRouteLoader';
import { GlobalThemeAtmosphere } from './components/layout/GlobalThemeAtmosphere';
import { AuthModal } from './components/public/AuthModal';
import { DevToolsBanner } from './components/layout/DevToolsBanner';
import { NoticeStatusModal } from './components/public/NoticeStatusModal';
import { LandingPage } from './components/landing/LandingPage';
import { ToastStack } from './components/public/ToastStack';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './components/layout/app-shell.css';

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
const OpsPortal = lazy(() => import('./features/admin/OpsPortal'));
const TeamHonorGallery = lazy(() =>
  import('./features/honor/TeamHonorGallery').then((m) => ({ default: m.TeamHonorGallery }))
);
const Skybridge404 = lazy(() =>
  import('./components/public/Skybridge404').then((m) => ({ default: m.Skybridge404 }))
);

const ROUTE_META: Record<
  string,
  { title: string; description: string; path: string; noindex?: boolean }
> = {
  landing: {
    title: 'F-Forum — Làm web từ kho 5.909 mẫu mở',
    description:
      'Chọn mẫu giao diện miễn phí, chỉnh sửa bằng chat trong Workspace và xuất bản trang web chạy ngay trên trình duyệt.',
    path: '/',
  },
  home: {
    title: 'Trang chủ — F-Forum',
    description: 'Bắt đầu tạo trang mới theo mục tiêu của bạn hoặc mở ngay mẫu có sẵn.',
    path: '/home',
  },
  explore: {
    title: 'Khám phá 5.909 mẫu mở — F-Forum',
    description:
      'Duyệt 5.909 mẫu giao diện miễn phí từ Pin UI, ThreeUI 3D, lucianLabs, MotionSites Free và CodeFronts.',
    path: '/explore',
  },
  experience: {
    title: 'Trải nghiệm kho tài nguyên — F-Forum',
    description:
      'Xem trực tiếp 5.909 mẫu mở, 58 kỹ thuật chuyển động và 15 trang mẫu chạy thật, sao chép mã và đưa thẳng vào Workspace.',
    path: '/explore/experience',
  },
  workspace: {
    title: 'Workspace — F-Forum',
    description:
      'Tạo và sửa trang web qua khung chat, xem bản chạy trực tiếp theo từng kích thước màn hình và tải gói .zip.',
    path: '/workspace',
  },
  community: {
    title: 'Cộng đồng Remix & Sổ tay Tri thức — F-Forum',
    description:
      'Xem các trang web đã xuất bản, bấm Remix để sửa lại thành bản của bạn và tra cứu 58 kỹ thuật chuyển động.',
    path: '/community',
  },
  profile: {
    title: 'Hồ sơ — F-Forum',
    description: 'Xem danh sách dự án Workspace và các mẫu bạn đã lưu.',
    path: '/profile',
  },
  settings: {
    title: 'Cài đặt — F-Forum',
    description: 'Chỉnh giao diện sáng tối, giảm chuyển động, cấu hình API cá nhân và sao lưu dữ liệu.',
    path: '/settings',
  },
  honor: {
    title: 'Đội ngũ phát triển — F-Forum',
    description: 'Danh sách thành viên xây dựng dự án F-Forum.',
    path: '/honor',
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
  explore: 'Đang mở Khám phá...',
  experience: 'Đang mở kho trải nghiệm...',
  workspace: 'Đang mở Workspace...',
  community: 'Đang mở Cộng đồng Remix...',
  profile: 'Đang mở Hồ sơ...',
  settings: 'Đang mở Cài đặt...',
  honor: 'Đang mở trang Đội ngũ...',
};

const AppShell: React.FC = () => {
  const { currentRoute, navigate, currentUser, authModalOpen, setAuthModalOpen, reducedMotion } = useAppStore();
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const meta = ROUTE_META[currentRoute];
    if (!meta) {
      setMetaContent('meta[name="robots"]', 'noindex, nofollow');
    } else {
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

  const showNavbar =
    currentRoute !== 'landing' &&
    currentRoute !== 'honor' &&
    currentRoute !== 'not-found' &&
    currentRoute !== 'workspace';
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
            label={ROUTE_LOAD_LABELS[currentRoute] || 'Đang tải trang...'}
          />
          <a className="skip-link" href="#noi-dung">
            Tới nội dung
          </a>
          {showNavbar && <AppNavbar onOpenNotice={() => setNoticeModalOpen(true)} />}

          <main id="noi-dung" ref={mainRef} tabIndex={-1} className="shell__main">
            <ErrorBoundary key={currentRoute}>
              <Suspense
                fallback={
                  <GlobalRouteLoader
                    visible
                    label={ROUTE_LOAD_LABELS[currentRoute] || 'Đang tải trang...'}
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
                {currentRoute === 'admin' && <OpsPortal />}
                {currentRoute === 'honor' && (
                  <TeamHonorGallery
                    onBack={() => navigate('home')}
                    onNavigate={navigate}
                  />
                )}
                {currentRoute === 'not-found' && <Skybridge404 onNavigate={navigate} />}
              </Suspense>
            </ErrorBoundary>
          </main>

          {showFooter && <AppFooter onNavigate={navigate} onOpenNotice={() => setNoticeModalOpen(true)} />}

          <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
          <NoticeStatusModal open={noticeModalOpen} onClose={() => setNoticeModalOpen(false)} />
          <CommandPalette />
          <DevToolsBanner />
          <ToastStack />
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
};

export const App: React.FC = () => {
  // WHY: Prevent recursive self-embedding when a sandboxed preview iframe ever resolves to the app origin.
  const isSelfEmbedded =
    typeof window !== 'undefined' &&
    window.self !== window.top &&
    window.location.pathname.startsWith('/workspace');

  if (isSelfEmbedded) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: '#0b110f',
          color: '#edf4f0',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <div>
          <p style={{ margin: '0 0 12px', fontSize: 15 }}>
            Trang này không hỗ trợ hiển thị lồng trong khung xem trước.
          </p>
          <a
            href={typeof window !== 'undefined' ? window.location.href : '/workspace'}
            target="_top"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: 999,
              background: '#0e7c5a',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Mở ở cửa sổ chính
          </a>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
