import React, { Suspense, lazy, useState, type ComponentType, type MouseEvent, type ReactNode } from 'react';
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

const PresenceCards = lazy(() => import('./original/presence-cards/PresenceCards'));
const ReaderCard = lazy(() => import('./original/reader-card/ReaderCard'));
const Magnify = lazy(() => import('./original/magnify/Magnify'));
const ChatRoom = lazy(() => import('./original/chat-room/ChatRoom'));
const LampSwitch = lazy(() => import('./original/lamp-switch/LampSwitch'));
const ThemeSwitch = lazy(() => import('./original/theme-switch/ThemeSwitch'));
const SearchCard = lazy(() => import('./original/search-card/SearchCard'));
const SelectionList = lazy(() => import('./original/selection-list/SelectionList'));
const FileBox = lazy(() => import('./original/file-box/FileBox'));
const TaskCard = lazy(() => import('./original/task-card/TaskCard'));
const DynamicDropZone = lazy(() => import('./original/dynamic-drop-zone/DynamicDropZone'));
const PromptComposer = lazy(() => import('./original/prompt-composer/PromptComposer'));
const LiquidTabs = lazy(() => import('./original/liquid-tabs/LiquidTabs'));
const Chips = lazy(() => import('./original/chips/Chips'));
const Weather = lazy(() => import('./original/weather/Weather'));

const SynaisFooter = lazy(() => import('./SynaisFooter').then((m) => ({ default: m.SynaisFooter })));
const SlingSlider = lazy(() => import('./SlingSlider').then((m) => ({ default: m.SlingSlider })));
const HaloSignIn = lazy(() => import('./HaloSignIn').then((m) => ({ default: m.HaloSignIn })));
const CopyPastePad = lazy(() => import('./CopyPastePad'));
const ThermalDial = lazy(() => import('./ThermalDial'));
const Joystick = lazy(() => import('./Joystick'));
const SwapCard = lazy(() => import('./SwapCard'));
const CartCard = lazy(() => import('./CartCard'));
const BalanceCard = lazy(() => import('./BalanceCard'));
const CalendarCard = lazy(() => import('./CalendarCard'));
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
const noopAsync = async () => undefined;

const HaloSignInLive: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  return <HaloSignIn mode={mode} onModeChange={setMode} onSubmit={noopAsync} />;
};

const REGISTRY: Record<string, DemoEntry> = {
  'presence-cards': {
    kind: 'component',
    render: ({ theme }) => <PresenceCards theme={theme} fill />,
  },
  'theme-switch': {
    kind: 'component',
    render: ({ theme, setTheme }) => (
      <ThemeSwitch fill theme={theme} sound onThemeChange={setTheme} />
    ),
  },
  'reader-card': {
    kind: 'component',
    render: ({ theme }) => <ReaderCard theme={theme} fill />,
  },
  'search-card': {
    kind: 'component',
    render: ({ theme }) => <SearchCard theme={theme} />,
  },
  'selection-list': {
    kind: 'component',
    render: ({ theme }) => <SelectionList theme={theme} />,
  },
  'desk-computer': {
    kind: 'component',
    render: ({ theme }) => <DeskComputer theme={theme} sound fill />,
  },
  'liquid-voice': {
    kind: 'component',
    render: ({ theme }) => <LiquidVoice theme={theme} fill />,
  },
  'file-box': {
    kind: 'component',
    render: ({ theme }) => <FileBox theme={theme} fill />,
  },
  'copy-paste-pad': {
    kind: 'component',
    render: ({ theme, setTheme }) => (
      <CopyPastePad fill theme={theme} sound onThemeChange={setTheme} />
    ),
  },
  'task-card': {
    kind: 'component',
    render: ({ theme }) => <TaskCard theme={theme} />,
  },
  magnify: {
    kind: 'component',
    render: ({ theme }) => <Magnify theme={theme} />,
  },
  'progress-image': {
    kind: 'component',
    render: ({ theme }) => <ProgressImage theme={theme} />,
  },
  'prompt-composer': {
    kind: 'component',
    render: ({ theme }) => <PromptComposer theme={theme} />,
  },
  'calendar-card': {
    kind: 'component',
    render: ({ theme }) => <CalendarCard theme={theme} />,
  },
  'chat-room': {
    kind: 'component',
    render: ({ theme }) => <ChatRoom theme={theme} sound />,
  },
  'dynamic-drop-zone': {
    kind: 'component',
    render: ({ theme }) => <DynamicDropZone theme={theme} />,
  },
  'swap-card': {
    kind: 'component',
    render: ({ theme }) => <SwapCard theme={theme} />,
  },
  'liquid-tabs': {
    kind: 'component',
    render: ({ theme }) => <LiquidTabs theme={theme} />,
  },
  'thermal-dial': {
    kind: 'component',
    render: ({ theme }) => <ThermalDial theme={theme} />,
  },
  'lamp-switch': {
    kind: 'component',
    render: ({ theme }) => <LampSwitch theme={theme} />,
  },
  joystick: {
    kind: 'component',
    render: ({ theme }) => <Joystick theme={theme} sound />,
  },
  weather: {
    kind: 'component',
    render: ({ theme }) => <Weather theme={theme} />,
  },
  recorder: {
    kind: 'component',
    render: ({ theme }) => <Recorder theme={theme} sound />,
  },
  taxi: {
    kind: 'component',
    render: ({ theme }) => <Taxi theme={theme} sound />,
  },
  chips: {
    kind: 'component',
    render: ({ theme }) => <Chips theme={theme} sound corner={20} shadow={50} rows={2} />,
  },
  'otp-input': {
    kind: 'component',
    render: ({ theme }) => <OtpInput theme={theme} />,
  },
  'add-member': {
    kind: 'component',
    render: ({ theme }) => <AddMember theme={theme} open />,
  },
  'session-list': {
    kind: 'component',
    render: () => <SessionList corner={32} />,
  },
  'balance-card': {
    kind: 'component',
    render: () => <BalanceCard sound credit={false} />,
  },
  'cart-card': {
    kind: 'component',
    render: () => <CartCard sound />,
  },
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
  'halo-sign-in': {
    kind: 'block',
    render: () => <HaloSignInLive />,
  },
  'pixelkit-sign-in': { kind: 'block', render: () => <PixelkitSignIn onSubmit={noop} onProvider={noop} /> },
  'sling-slider': {
    kind: 'component',
    render: ({ theme }) => <SlingSlider theme={theme} defaultValue={62} />,
  },
  'weather-card': {
    kind: 'component',
    render: ({ theme }) => <Weather theme={theme} />,
  },
  'taxi-card': {
    kind: 'component',
    render: ({ theme }) => <Taxi theme={theme} sound />,
  },
};

export const PINUI_PLAYGROUND_IDS: readonly string[] = Object.keys(REGISTRY);

const normalizeId = (itemId: string) => itemId.trim().replace(new RegExp('^(component|blocx|registry)/'), '');

const Loading = () => (
  <p className="pinui-stage__status" role="status">
    Loading original PinUI component...
  </p>
);

const Missing = ({ itemId }: { itemId: string }) => (
  <p className="pinui-stage__status" role="status">
    No live component mapped for {itemId}
  </p>
);

const stopNavigation = (event: MouseEvent<HTMLElement>) => {
  const anchor = (event.target as HTMLElement).closest('a');
  const href = anchor?.getAttribute('href') ?? '';
  if (anchor && /^(#|\/)/.test(href)) event.preventDefault();
};

export const PinUIPlayground: React.FC<PinUIPlaygroundProps> = ({ itemId, theme, compact = false }) => {
  const [localTheme, setLocalTheme] = useState<Theme>('light');
  const controlled = theme !== undefined;
  const activeTheme: Theme = controlled ? theme : localTheme;
  const entry = REGISTRY[normalizeId(itemId)];
  const Body = entry?.render;
  const ctx: DemoContext = { theme: activeTheme, setTheme: setLocalTheme, compact };

  return (
    <div
      className="pinui-stage"
      data-theme={activeTheme}
      data-kind={entry?.kind ?? 'component'}
      data-compact={compact || undefined}
      onClickCapture={stopNavigation}
    >
      {!controlled && (
        <div className="pinui-stage__toggle" role="group" aria-label="Theme">
          <button type="button" aria-pressed={activeTheme === 'light'} onClick={() => setLocalTheme('light')}>
            Light
          </button>
          <button type="button" aria-pressed={activeTheme === 'dark'} onClick={() => setLocalTheme('dark')}>
            Dark
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
