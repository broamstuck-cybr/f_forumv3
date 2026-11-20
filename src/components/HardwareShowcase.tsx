import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BellOff,
  BookOpen,
  Calendar,
  Camera,
  CloudSun,
  Compass,
  FileText,
  Layers,
  Lock,
  MessageSquare,
  Music2,
  Phone,
  Settings,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import type { DimensionView } from '../types/index';
import {
  DOCK_APP_IDS,
  SIM_APPS,
  TITANIUM_FINISHES,
  type DynamicIslandMode,
  type SimulatorAppId,
  type TitaniumFinishId,
} from './simulator/simulatorTypes';
import { FForumMobileApp } from './simulator/FForumMobileApp';
import { NativeAppView } from './simulator/NativeApps';
import './simulator/simulator.css';

interface HardwareShowcaseProps {
  onNavigate?: (view: DimensionView) => void;
  className?: string;
}

const CHASSIS_W = 430;
const CHASSIS_H = 902;

function formatTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatVietnameseDay(): { weekday: string; dayNum: string } {
  const now = new Date();
  const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return {
    weekday: weekdays[now.getDay()] ?? 'Thứ năm',
    dayNum: String(now.getDate()),
  };
}

function renderAppGlyph(appId: SimulatorAppId, fg: string) {
  switch (appId) {
    case 'fforum':
      return (
        <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
          <path d="M8 8.5L13.2 12.6V24.5L8 22V8.5Z" fill="#f4f1ea" />
          <path d="M8 8.5L24.5 6.8L22.2 12.2L13.2 12.6L8 8.5Z" fill="#e5c384" />
          <path d="M14.4 15.2L22.6 14.3L20.8 18.9L14.4 19.4V15.2Z" fill="#2dd4bf" />
        </svg>
      );
    case 'explore':
      return <Layers className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
    case 'workspace':
      return <Sparkles className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
    case 'community':
      return <BookOpen className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
    case 'notes':
      return <FileText className="h-6 w-6 mt-2" style={{ color: fg }} aria-hidden="true" />;
    case 'camera':
      return <Camera className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
    case 'settings':
      return <Settings className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
    case 'calendar':
      return <Calendar className="h-6 w-6 mt-2" style={{ color: fg }} aria-hidden="true" />;
    case 'weather':
      return <CloudSun className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
    case 'safari':
      return <Compass className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
    case 'messages':
      return <MessageSquare className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
    case 'music':
      return <Music2 className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
    case 'phone':
      return <Phone className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
    default:
      return <SlidersHorizontal className="h-7 w-7" style={{ color: fg }} aria-hidden="true" />;
  }
}

export const HardwareShowcase: React.FC<HardwareShowcaseProps> = ({
  onNavigate,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.82);
  const [finishId, setFinishId] = useState<TitaniumFinishId>('black');
  const [locked, setLocked] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(72);
  const [islandMode, setIslandMode] = useState<DynamicIslandMode>('idle');
  const [islandHint, setIslandHint] = useState('F-Forum');
  const [page, setPage] = useState<0 | 1>(0);
  const [openApp, setOpenApp] = useState<SimulatorAppId | null>(null);
  const [clock, setClock] = useState(formatTime);

  const finish = useMemo(
    () => TITANIUM_FINISHES.find((f) => f.id === finishId) ?? TITANIUM_FINISHES[0],
    [finishId]
  );

  const today = useMemo(() => formatVietnameseDay(), []);

  useEffect(() => {
    const id = window.setInterval(() => setClock(formatTime()), 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const computeScale = () => {
      const rect = el.getBoundingClientRect();
      const availW = Math.max(260, rect.width - 16);
      const maxH = typeof window !== 'undefined' ? Math.max(540, window.innerHeight * 0.78) : 760;
      const next = Math.min(availW / CHASSIS_W, maxH / CHASSIS_H, 0.88);
      setScale(Number(next.toFixed(3)));
    };

    computeScale();
    const ro = new ResizeObserver(computeScale);
    ro.observe(el);
    window.addEventListener('resize', computeScale, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', computeScale);
    };
  }, []);

  useEffect(() => {
    if (islandMode === 'idle') return;
    const timer = window.setTimeout(() => setIslandMode('idle'), 2400);
    return () => window.clearTimeout(timer);
  }, [islandMode]);

  const pulseIsland = (mode: DynamicIslandMode, hint: string) => {
    setIslandHint(hint);
    setIslandMode(mode);
  };

  const handlePowerPress = () => {
    if (locked) {
      setLocked(false);
      pulseIsland('faceid', 'Đã mở khóa');
    } else {
      setLocked(true);
      setOpenApp(null);
      pulseIsland('idle', 'Đã khóa');
    }
  };

  const handleActionPress = () => {
    setSilentMode((prev) => {
      const next = !prev;
      pulseIsland('silent', next ? 'Im lặng' : 'Chuông');
      return next;
    });
  };

  const handleVolume = (delta: number) => {
    setVolumeLevel((prev) => {
      const next = Math.max(0, Math.min(100, prev + delta));
      pulseIsland('music', `Âm lượng ${next}%`);
      return next;
    });
  };

  const launchApp = (appId: SimulatorAppId) => {
    setLocked(false);
    setOpenApp(appId);
    if (appId === 'fforum') {
      pulseIsland('fforum', 'F-Forum Live');
    }
  };

  const page0Apps = SIM_APPS.filter((a) => a.page === 0);
  const page1Apps = SIM_APPS.filter((a) => a.page === 1);

  const islandDimensions =
    islandMode === 'faceid'
      ? { width: 150, height: 36 }
      : islandMode === 'silent'
        ? { width: 180, height: 36 }
        : islandMode === 'timer' || islandMode === 'music' || islandMode === 'fforum'
          ? { width: 226, height: 36 }
          : { width: 88, height: 36 };

  return (
    <div ref={stageRef} className={`ios-sim-stage ${className}`}>
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="ff-ios-squircle" clipPathUnits="objectBoundingBox">
            <path d="M.5 0C.74 0 .86 0 .93.07 1 .14 1 .26 1 .5s0 .36-.07.43C.86 1 .74 1 .5 1S.14 1 .07.93C0 .86 0 .74 0 .5S0 .14.07.07C.14 0 .26 0 .5 0Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        className="ios-sim-scale-box"
        style={{
          width: `${Math.round(CHASSIS_W * scale)}px`,
          height: `${Math.round(CHASSIS_H * scale)}px`,
        }}
      >
        <div
          className="ios-chassis"
          style={{
            transform: `scale(${scale})`,
            background: `linear-gradient(135deg, ${finish.shellA} 0%, ${finish.shellB} 30%, ${finish.shellA} 50%, ${finish.shellB} 72%, ${finish.shellA} 100%)`,
          }}
        >
          <span
            className="ios-antenna"
            style={{ left: '110px', top: '0px', background: finish.antenna }}
            aria-hidden="true"
          />
          <span
            className="ios-antenna"
            style={{ left: '318px', top: '0px', background: finish.antenna }}
            aria-hidden="true"
          />
          <span
            className="ios-antenna"
            style={{ left: '110px', bottom: '0px', background: finish.antenna }}
            aria-hidden="true"
          />
          <span
            className="ios-antenna"
            style={{ left: '318px', bottom: '0px', background: finish.antenna }}
            aria-hidden="true"
          />

          <div
            className="absolute left-1/2 top-[3px] h-[3px] w-[60px] -translate-x-1/2 rounded-full bg-black/75"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={handleActionPress}
            aria-label="Nút Tác vụ"
            title="Nút Tác vụ"
            className="ios-side-btn ios-side-btn-left"
            style={{ top: '176px', height: '34px', background: finish.shellB }}
          />
          <button
            type="button"
            onClick={() => handleVolume(12)}
            aria-label="Tăng âm lượng"
            title="Tăng âm lượng"
            className="ios-side-btn ios-side-btn-left"
            style={{ top: '236px', height: '70px', background: finish.shellB }}
          />
          <button
            type="button"
            onClick={() => handleVolume(-12)}
            aria-label="Giảm âm lượng"
            title="Giảm âm lượng"
            className="ios-side-btn ios-side-btn-left"
            style={{ top: '320px', height: '70px', background: finish.shellB }}
          />
          <button
            type="button"
            onClick={handlePowerPress}
            aria-label="Nút Nguồn"
            title="Nút Nguồn"
            className="ios-side-btn ios-side-btn-right"
            style={{ top: '264px', height: '110px', background: finish.shellB }}
          />
          <button
            type="button"
            onClick={() => launchApp('camera')}
            aria-label="Điều khiển Camera"
            title="Điều khiển Camera"
            className="ios-side-btn ios-side-btn-camera"
            style={{ top: '560px', height: '46px', background: finish.shellB }}
          />

          <div className="ios-bezel">
            <div className="ios-screen">
              <div className="ios-glass-sheen" aria-hidden="true" />

              <div className="absolute inset-x-0 top-0 z-[60] flex h-[54px] items-start justify-between pointer-events-none">
                <span
                  className="absolute left-[38px] top-[17px] text-[17px] font-semibold leading-none text-white"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {clock}
                </span>

                <div className="absolute right-[26px] top-[18px] flex items-center gap-1.5 text-white">
                  <svg width="19" height="12" viewBox="0 0 19 12" fill="currentColor" aria-hidden="true">
                    <rect x="0" y="8" width="3" height="4" rx="1" />
                    <rect x="4.5" y="6" width="3" height="6" rx="1" />
                    <rect x="9" y="3.5" width="3" height="8.5" rx="1" />
                    <rect x="13.5" y="1" width="3" height="11" rx="1" />
                  </svg>
                  <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
                    <path d="M1.5 4.2C5.4 0.8 11.6 0.8 15.5 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M4.2 7.1C6.6 5 10.4 5 12.8 7.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="8.5" cy="10.2" r="1.3" fill="currentColor" />
                  </svg>
                  <div className="relative flex h-[13px] w-[26px] items-center rounded-[4.2px] border border-white/55 p-[1.5px]">
                    <div className="h-full w-[82%] rounded-[2px] bg-white" />
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 top-[11px] z-[70] flex justify-center pointer-events-none">
                <motion.div
                  role="button"
                  tabIndex={0}
                  onClick={() => pulseIsland('fforum', 'F-Forum Sandbox')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      pulseIsland('fforum', 'F-Forum Sandbox');
                    }
                  }}
                  aria-label="Dynamic Island"
                  title="Dynamic Island"
                  animate={islandDimensions}
                  transition={
                    reduced
                      ? { duration: 0.01 }
                      : { type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }
                  }
                  className="pointer-events-auto flex items-center justify-between rounded-full bg-black px-3 text-white border border-white/10 cursor-pointer overflow-hidden"
                >
                  {islandMode === 'idle' ? (
                    <div className="flex w-full items-center justify-end pr-[4px]">
                      <span className="h-[10px] w-[10px] rounded-full bg-[#131a26] ring-1 ring-white/15" />
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-between gap-2 text-[11px] font-medium">
                      <span className="flex items-center gap-1.5 text-[#e5c384]">
                        {islandMode === 'silent' ? (
                          <BellOff className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                        ) : islandMode === 'faceid' ? (
                          <Lock className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-[#e5c384]" aria-hidden="true" />
                        )}
                      </span>
                      <span className="truncate font-mono text-[10.5px] text-white/90">
                        {islandHint}
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>

              {locked ? (
                <div className="relative flex h-full w-full flex-col items-center justify-between pt-[92px] pb-8 px-6 text-center">
                  <div className="space-y-1">
                    <div className="text-[14px] font-medium text-white/75">
                      {today.weekday}, ngày {today.dayNum}
                    </div>
                    <div
                      className="text-[76px] font-bold leading-none tracking-tight text-white"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {clock}
                    </div>
                  </div>

                  <div className="w-full rounded-3xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#e5c384]">
                      <span>F-Forum</span>
                      <span>Sẵn sàng</span>
                    </div>
                    <div className="text-[13px] font-semibold text-white">
                      Chạm để mở khóa vào Live View
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePowerPress}
                    className="rounded-full border border-white/25 bg-white/15 px-6 py-2.5 text-[12px] font-medium text-white backdrop-blur-md cursor-pointer"
                  >
                    Mở khóa
                  </button>
                </div>
              ) : (
                <>
                  <motion.div
                    className="absolute inset-0 flex w-[804px]"
                    animate={{ x: page === 0 ? 0 : -402 }}
                    transition={
                      reduced
                        ? { duration: 0.01 }
                        : { type: 'spring', stiffness: 320, damping: 32 }
                    }
                  >
                    <div className="relative h-full w-[402px] shrink-0">
                      <div className="absolute left-[21px] top-[76px] flex w-[360px] gap-[44px]">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => launchApp('weather')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              launchApp('weather');
                            }
                          }}
                          aria-label="Mở Thời tiết"
                          title="Mở Thời tiết"
                          className="h-[158px] w-[158px] rounded-[28px] border border-white/15 bg-gradient-to-br from-[#173058] to-[#0b1830] p-4 text-left text-white cursor-pointer flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-white/80">Hà Nội</span>
                            <CloudSun className="h-5 w-5 text-amber-300" aria-hidden="true" />
                          </div>
                          <div className="text-[40px] font-light leading-none">24°</div>
                          <div className="text-[11px] text-white/75">Quang mây · 26° / 19°</div>
                        </div>

                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => launchApp('calendar')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              launchApp('calendar');
                            }
                          }}
                          aria-label="Mở Lịch học"
                          title="Mở Lịch học"
                          className="h-[158px] w-[158px] rounded-[28px] border border-white/15 bg-[#121622]/90 p-4 text-left text-white cursor-pointer flex flex-col justify-between"
                        >
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">
                            {today.weekday}
                          </div>
                          <div className="text-[44px] font-bold leading-none text-white">
                            {today.dayNum}
                          </div>
                          <div className="rounded-lg bg-[#c89b54]/15 px-2 py-1 text-[11px] text-[#e5c384] truncate">
                            Phiên kiểm định UI
                          </div>
                        </div>
                      </div>

                      <div className="absolute left-[21px] top-[256px] grid w-[360px] grid-cols-4 gap-x-[24px] gap-y-[18px]">
                        {page0Apps.map((app) => (
                          <div key={app.id} className="flex w-[72px] flex-col items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => launchApp(app.id)}
                              aria-label={app.label}
                              title={app.label}
                              className="ios-squircle-btn ios-icon-gloss"
                              style={{ background: app.bg }}
                            >
                              {renderAppGlyph(app.id, app.fg)}
                            </button>
                            <span className="text-[11.5px] font-medium leading-tight text-white/95 truncate max-w-full">
                              {app.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative h-full w-[402px] shrink-0">
                      <div className="absolute left-[21px] top-[82px] grid w-[360px] grid-cols-4 gap-x-[24px] gap-y-[18px]">
                        {page1Apps.map((app) => (
                          <div key={app.id} className="flex w-[72px] flex-col items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => launchApp(app.id)}
                              aria-label={app.label}
                              title={app.label}
                              className="ios-squircle-btn ios-icon-gloss"
                              style={{ background: app.bg }}
                            >
                              {renderAppGlyph(app.id, app.fg)}
                            </button>
                            <span className="text-[11.5px] font-medium leading-tight text-white/95 truncate max-w-full">
                              {app.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  <div className="absolute inset-x-0 bottom-[134px] z-20 flex justify-center">
                    <div className="ios-lg flex h-[30px] items-center gap-2 rounded-full px-3.5">
                      <button
                        type="button"
                        onClick={() => setPage(0)}
                        aria-label="Trang chính"
                        title="Trang chính"
                        className="h-2 w-2 rounded-full border-0 p-0 cursor-pointer"
                        style={{ background: page === 0 ? '#ffffff' : 'rgba(255,255,255,0.35)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setPage(1)}
                        aria-label="Trang phụ"
                        title="Trang phụ"
                        className="h-2 w-2 rounded-full border-0 p-0 cursor-pointer"
                        style={{ background: page === 1 ? '#ffffff' : 'rgba(255,255,255,0.35)' }}
                      />
                    </div>
                  </div>

                  <div className="ios-lg absolute inset-x-[12px] bottom-[18px] z-20 flex h-[94px] items-center justify-around rounded-[38px] px-3">
                    {DOCK_APP_IDS.map((id) => {
                      const def =
                        SIM_APPS.find((a) => a.id === id) ??
                        ({
                          id: 'phone',
                          label: 'Liên hệ',
                          bg: 'linear-gradient(145deg, #22c55e 0%, #15803d 100%)',
                          fg: '#ffffff',
                        } as const);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => launchApp(id)}
                          aria-label={def.label}
                          title={def.label}
                          className="ios-squircle-btn ios-icon-gloss"
                          style={{ background: def.bg }}
                        >
                          {renderAppGlyph(id, def.fg)}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <AnimatePresence>
                {openApp && !locked && (
                  <motion.div
                    key={openApp}
                    initial={
                      reduced
                        ? { opacity: 0 }
                        : { scale: 0.14, opacity: 0, y: 120, borderRadius: '60px' }
                    }
                    animate={{ scale: 1, opacity: 1, y: 0, borderRadius: '0px' }}
                    exit={
                      reduced
                        ? { opacity: 0 }
                        : { scale: 0.14, opacity: 0, y: 120, borderRadius: '60px' }
                    }
                    transition={
                      reduced
                        ? { duration: 0.01 }
                        : { type: 'spring', stiffness: 360, damping: 32 }
                    }
                    className="absolute inset-0 z-40 overflow-hidden bg-[#090a0d]"
                  >
                    {openApp === 'fforum' ? (
                      <FForumMobileApp
                        onNavigate={onNavigate}
                        onGoHome={() => setOpenApp(null)}
                        onActivityPulse={(label) => pulseIsland('fforum', label)}
                      />
                    ) : (
                      <NativeAppView
                        appId={openApp}
                        onGoHome={() => setOpenApp(null)}
                        onOpenFForum={() => launchApp('fforum')}
                        onNavigate={onNavigate}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => {
                  if (locked) {
                    handlePowerPress();
                  } else {
                    setOpenApp(null);
                  }
                }}
                aria-label="Màn hình chính"
                title="Màn hình chính"
                className="absolute bottom-[8px] left-1/2 z-[75] h-[5px] w-[139px] -translate-x-1/2 rounded-full border-0 bg-white/95 p-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        {TITANIUM_FINISHES.map((item) => {
          const active = item.id === finishId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFinishId(item.id)}
              aria-label={item.label}
              title={item.label}
              className="h-5 w-5 rounded-full border p-0 cursor-pointer transition-transform"
              style={{
                background: item.swatch,
                borderColor: active ? '#c89b54' : 'rgba(255,255,255,0.28)',
                transform: active ? 'scale(1.18)' : 'scale(1)',
                boxShadow: active ? '0 0 0 2px rgba(200,155,84,0.35)' : 'none',
              }}
            />
          );
        })}
        <span className="ml-1 text-[11px] font-mono text-[var(--fg-muted)]">
          {finish.label} · {volumeLevel}%
        </span>
      </div>
    </div>
  );
};

export default HardwareShowcase;
