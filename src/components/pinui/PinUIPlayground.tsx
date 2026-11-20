import React, { Suspense, lazy, useState, type ComponentType, type MouseEvent, type ReactNode } from 'react';
import {
  ChipsDemo,
  DropZoneDemo,
  FileBoxDemo,
  HaloSignInDemo,
  LiquidTabsDemo,
  PromptComposerDemo,
  SearchCardDemo,
  SelectionListDemo,
  TaskCardDemo,
  ThemeSwitchDemo,
} from './PinUIDemos';
import './pinui-stage.css';

export interface PinUIPlaygroundProps {
  itemId: string;
  theme?: 'dark' | 'light';
  compact?: boolean;
}

type Theme = 'dark' | 'light';

interface DemoContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  compact: boolean;
}

interface DemoEntry {
  kind: 'component' | 'block';
  render: (ctx: DemoContext) => ReactNode;
}

const PresenceCards = lazy(() => import('./PresenceCards').then((m) => ({ default: m.PresenceCards })));
const ReaderCard = lazy(() => import('./ReaderCard').then((m) => ({ default: m.ReaderCard })));
const Magnify = lazy(() => import('./Magnify').then((m) => ({ default: m.Magnify })));
const ChatRoom = lazy(() => import('./ChatRoom').then((m) => ({ default: m.ChatRoom })));
const LampSwitch = lazy(() => import('./LampSwitch').then((m) => ({ default: m.LampSwitch })));
const SynaisFooter = lazy(() => import('./SynaisFooter').then((m) => ({ default: m.SynaisFooter })));
const SlingSlider = lazy(() => import('./SlingSlider').then((m) => ({ default: m.SlingSlider })));
const CopyPastePad = lazy(() => import('./CopyPastePad'));
const ThermalDial = lazy(() => import('./ThermalDial'));
const Joystick = lazy(() => import('./Joystick'));
const SwapCard = lazy(() => import('./SwapCard'));
const CartCard = lazy(() => import('./CartCard'));
const BalanceCard = lazy(() => import('./BalanceCard'));
const CalendarCard = lazy(() => import('./CalendarCard'));
const Weather = lazy(() => import('./Weather'));
const Taxi = lazy(() => import('./Taxi'));
const Recorder = lazy(() => import('./Recorder'));
const LiquidVoice = lazy(() => import('./LiquidVoice'));
const AddMember = lazy(() => import('./AddMember'));
const OtpInput = lazy(() => import('./OtpInput'));
const SessionList = lazy(() => import('./SessionList'));
const ProgressImage = lazy(() => import('./ProgressImage'));
const DeskComputer = lazy(() => import('./DeskComputer'));
const OdometerPricing = lazy(() => import('./OdometerPricing'));
const SmartPricing = lazy(() => import('./SmartPricing'));
const ContactForm = lazy(() => import('./ContactForm'));
const OrbitHero = lazy(() => import('./OrbitHero'));
const LunaHero = lazy(() => import('./LunaHero'));
const StorybookHero = lazy(() => import('./StorybookHero'));
const PartylabsHero = lazy(() => import('./PartylabsHero'));
const PixelkitSignIn = lazy(() => import('./PixelkitSignIn'));
const CaremetricFooter = lazy(() => import('./CaremetricFooter'));

const noop = () => undefined;

const PRESENCE_MEMBERS = [
  { name: 'Minh Khoa', role: 'Thiết kế', status: 'Đang chỉnh sửa' },
  { name: 'Gia Hân', role: 'Phản biện', status: 'Đang xem' },
  { name: 'Đức Anh', role: 'Kiến trúc', status: 'Đang bình luận' },
  { name: 'Thu Trang', role: 'Nội dung', status: 'Vừa vào' },
];

const READER_LINES = [
  'Mỗi câu lạc bộ là một câu chuyện nhỏ về những người cùng muốn làm điều gì đó đến nơi đến chốn.',
  'Chúng tôi ghi lại từng buổi họp, từng bản nháp và từng lần sửa để người đến sau không phải bắt đầu lại.',
  'Khi tài liệu sống cùng cộng đồng, việc học trở thành thói quen chứ không còn là một kỳ thi.',
];

const REGISTRY: Record<string, DemoEntry> = {
  'presence-cards': {
    kind: 'component',
    render: () => (
      <div style={{ width: 'min(100%, 560px)' }}>
        <PresenceCards
          title="Bảng thiết kế chung"
          subtitle="Bốn người đang cùng làm việc"
          members={PRESENCE_MEMBERS}
          actionLabel="Mời thêm người"
          onAction={noop}
        />
      </div>
    ),
  },
  'theme-switch': {
    kind: 'component',
    render: ({ theme, setTheme }) => <ThemeSwitchDemo theme={theme} onThemeChange={setTheme} />,
  },
  'reader-card': {
    kind: 'component',
    render: ({ theme }) => (
      <ReaderCard
        title="Nhật ký câu lạc bộ"
        subtitle="Trang đọc mở rộng"
        excerptLines={READER_LINES}
        paragraphs={READER_LINES}
        openLabel="Đọc tiếp"
        theme={theme}
      />
    ),
  },
  'search-card': { kind: 'component', render: () => <SearchCardDemo /> },
  'selection-list': { kind: 'component', render: () => <SelectionListDemo /> },
  'desk-computer': {
    kind: 'component',
    render: ({ theme }) => (
      <div style={{ width: 'min(100%, 760px)' }}>
        <DeskComputer theme={theme} sound={false} />
      </div>
    ),
  },
  'liquid-voice': {
    kind: 'component',
    render: ({ theme }) => (
      <div style={{ width: 'min(100%, 720px)' }}>
        <LiquidVoice theme={theme} />
      </div>
    ),
  },
  'file-box': { kind: 'component', render: () => <FileBoxDemo /> },
  'copy-paste-pad': {
    kind: 'component',
    render: ({ theme, setTheme }) => (
      <div style={{ width: 'min(100%, 760px)' }}>
        <CopyPastePad theme={theme} onThemeChange={setTheme} />
      </div>
    ),
  },
  'task-card': { kind: 'component', render: () => <TaskCardDemo /> },
  magnify: {
    kind: 'component',
    render: ({ theme, compact }) => (
      <Magnify
        theme={theme}
        glyph="F"
        microText="diễn đàn sinh viên"
        hintText="Rê chuột để phóng to"
        size={compact ? 240 : 320}
      />
    ),
  },
  'progress-image': {
    kind: 'component',
    render: ({ theme }) => (
      <div style={{ width: 'min(100%, 640px)' }}>
        <ProgressImage theme={theme} />
      </div>
    ),
  },
  'prompt-composer': { kind: 'component', render: ({ theme }) => <PromptComposerDemo theme={theme} /> },
  'calendar-card': { kind: 'component', render: ({ theme }) => <CalendarCard theme={theme} /> },
  'chat-room': {
    kind: 'component',
    render: () => (
      <div style={{ width: 'min(100%, 420px)' }}>
        <ChatRoom title="Phòng học nhóm tối nay" />
      </div>
    ),
  },
  'dynamic-drop-zone': { kind: 'component', render: () => <DropZoneDemo /> },
  'swap-card': { kind: 'component', render: ({ theme }) => <SwapCard theme={theme} /> },
  'liquid-tabs': { kind: 'component', render: () => <LiquidTabsDemo /> },
  'thermal-dial': {
    kind: 'component',
    render: ({ theme, compact }) => <ThermalDial theme={theme} size={compact ? 260 : 340} />,
  },
  'lamp-switch': {
    kind: 'component',
    render: () => <LampSwitch onLabel="Đèn bàn đang sáng" offLabel="Đèn bàn đã tắt" />,
  },
  joystick: {
    kind: 'component',
    render: ({ theme, compact }) => <Joystick theme={theme} pixel={compact ? 6 : 8} sound={false} />,
  },
  weather: {
    kind: 'component',
    render: ({ theme }) => <Weather theme={theme} city="Hà Nội" forecastCity="Đà Nẵng" />,
  },
  recorder: {
    kind: 'component',
    render: ({ theme, compact }) => <Recorder theme={theme} size={compact ? 280 : 360} sound={false} />,
  },
  taxi: {
    kind: 'component',
    render: ({ theme }) => <Taxi theme={theme} sound={false} />,
  },
  chips: { kind: 'component', render: ({ theme }) => <ChipsDemo theme={theme} /> },
  'otp-input': {
    kind: 'component',
    render: ({ theme }) => <OtpInput theme={theme} code="123456" hint="Mã thử nghiệm: 123456" />,
  },
  'add-member': {
    kind: 'component',
    render: ({ theme }) => <AddMember theme={theme} open />,
  },
  'session-list': { kind: 'component', render: () => <SessionList /> },
  'balance-card': { kind: 'component', render: () => <BalanceCard sound={false} /> },
  'cart-card': { kind: 'component', render: () => <CartCard title="Giày chạy bộ Aero" brand="Studio" price={59} sound={false} /> },
  'storybook-hero': { kind: 'block', render: () => <StorybookHero /> },
  'partylabs-hero': { kind: 'block', render: () => <PartylabsHero /> },
  'luna-hero': { kind: 'block', render: ({ theme }) => <LunaHero theme={theme} /> },
  'orbit-hero': { kind: 'block', render: () => <OrbitHero /> },
  'odometer-pricing': { kind: 'block', render: () => <OdometerPricing /> },
  'caremetric-footer': { kind: 'block', render: () => <CaremetricFooter /> },
  'smart-pricing': { kind: 'block', render: () => <SmartPricing /> },
  'contact-form': { kind: 'block', render: () => <ContactForm onSubmit={noop} /> },
  'synais-footer': {
    kind: 'block',
    render: () => <SynaisFooter onNavigate={noop} onOpenNotice={noop} onSubscribe={noop} />,
  },
  'halo-sign-in': { kind: 'component', render: () => <HaloSignInDemo /> },
  'pixelkit-sign-in': { kind: 'block', render: () => <PixelkitSignIn onSubmit={noop} onProvider={noop} /> },
  'sling-slider': {
    kind: 'component',
    render: ({ theme }) => <SlingSlider theme={theme} label="Độ sáng màn hình" defaultValue={62} />,
  },
  'weather-card': {
    kind: 'component',
    render: ({ theme }) => <Weather theme={theme} city="Hà Nội" forecastCity="Đà Nẵng" />,
  },
  'taxi-card': {
    kind: 'component',
    render: ({ theme }) => <Taxi theme={theme} sound={false} />,
  },
};

export const PINUI_PLAYGROUND_IDS: readonly string[] = Object.keys(REGISTRY);

const normalizeId = (itemId: string) => itemId.trim().replace(new RegExp('^(component|blocx|registry)/'), '');

const Loading = () => (
  <p className="pinui-stage__status" role="status">
    Đang tải thành phần
  </p>
);

const Missing = ({ itemId }: { itemId: string }) => (
  <p className="pinui-stage__status" role="status">
    Chưa có bản xem trực tiếp cho {itemId}
  </p>
);

const stopNavigation = (event: MouseEvent<HTMLElement>) => {
  const anchor = (event.target as HTMLElement).closest('a');
  const href = anchor?.getAttribute('href') ?? '';
  if (anchor && /^(#|\/)/.test(href)) event.preventDefault();
};

export const PinUIPlayground: React.FC<PinUIPlaygroundProps> = ({ itemId, theme, compact = false }) => {
  const [localTheme, setLocalTheme] = useState<Theme>('dark');
  const controlled = theme !== undefined;
  const activeTheme: Theme = controlled ? theme : localTheme;
  const entry = REGISTRY[normalizeId(itemId)];
  const Body = entry?.render;
  const ctx: DemoContext = { theme: activeTheme, setTheme: setLocalTheme, compact };

  return (
    <div
      className={`pinui-stage ${activeTheme === 'dark' ? 'scene-ink' : 'scene-paper'}`}
      data-theme={activeTheme}
      data-kind={entry?.kind ?? 'component'}
      data-compact={compact || undefined}
      onClickCapture={stopNavigation}
    >
      {!controlled && (
        <div className="pinui-stage__toggle" role="group" aria-label="Chế độ nền">
          <button type="button" aria-pressed={activeTheme === 'light'} onClick={() => setLocalTheme('light')}>
            Sáng
          </button>
          <button type="button" aria-pressed={activeTheme === 'dark'} onClick={() => setLocalTheme('dark')}>
            Tối
          </button>
        </div>
      )}
      <div className="pinui-stage__body">
        {Body ? (
          <Suspense fallback={<Loading />}>
            <Body {...ctx} />
          </Suspense>
        ) : (
          <Missing itemId={itemId} />
        )}
      </div>
    </div>
  );
};

