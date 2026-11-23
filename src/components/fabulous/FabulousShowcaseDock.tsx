import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Layers, Play, Search, Sparkles, Video, X } from 'lucide-react';
import fabulousManifest from '../../data/fabulousManifest.json';
import { useAppStore } from '../../store/appStore';
import { triggerPinuiThemeToggle } from '../layout/GlobalThemeAtmosphere';
import {
  BalanceCard,
  CopyPastePad,
  LampSwitch,
  LiquidVoice,
  PinHeartButton,
  ReaderCard,
  ThemeSwitch,
} from '../pinui';

export interface FabulousManifestItem {
  id: string;
  title: string;
  library: string;
  category: string;
  img: string;
  vid: string;
  hasLive: boolean;
}

type BucketKey = 'ui50' | 'threeui50' | 'glacier50' | 'motion50';
type CodeFrontsPreset = 'visionos-glass' | 'specular-emerald' | 'tilt-3d' | 'kinetic-ink';
type PinUiWidgetKey = 'theme' | 'lamp' | 'heart' | 'copypad' | 'reader' | 'voice' | 'balance';

const BUCKETS: Array<{ key: BucketKey; label: string; count: number }> = [
  { key: 'ui50', label: 'PinUI & CodeFronts', count: fabulousManifest.ui50.length },
  { key: 'threeui50', label: 'ThreeUI 3D', count: fabulousManifest.threeui50.length },
  { key: 'glacier50', label: 'Glacier Shader', count: fabulousManifest.glacier50.length },
  { key: 'motion50', label: 'Motion AI', count: fabulousManifest.motion50.length },
];

const CODEFRONTS_PRESETS: Array<{ id: CodeFrontsPreset; label: string }> = [
  { id: 'visionos-glass', label: 'VisionOS Glass' },
  { id: 'specular-emerald', label: 'Specular Emerald' },
  { id: 'tilt-3d', label: '3D Tilt Cards' },
  { id: 'kinetic-ink', label: 'Kinetic Ink' },
];

const PINUI_WIDGETS: Array<{ id: PinUiWidgetKey; label: string }> = [
  { id: 'theme', label: 'ThemeSwitch' },
  { id: 'lamp', label: 'LampSwitch' },
  { id: 'heart', label: 'PinHeart' },
  { id: 'copypad', label: 'CopyPastePad' },
  { id: 'reader', label: 'ReaderCard' },
  { id: 'voice', label: 'LiquidVoice' },
  { id: 'balance', label: 'BalanceCard' },
];

export const FABULOUS_TOTAL_COUNT =
  fabulousManifest.ui50.length +
  fabulousManifest.threeui50.length +
  fabulousManifest.glacier50.length +
  fabulousManifest.motion50.length;

const AssetCard: React.FC<{
  item: FabulousManifestItem;
  bucket: BucketKey;
  isAtmosphere: boolean;
  reduced: boolean;
  onSetAtmosphere: (item: FabulousManifestItem) => void;
  onTrial: (item: FabulousManifestItem) => void;
}> = ({ item, bucket, isAtmosphere, reduced, onSetAtmosphere, onTrial }) => {
  const [hovered, setHovered] = useState(false);
  const canSetAtmosphere = bucket === 'threeui50' || bucket === 'glacier50';
  const showVideo = !reduced && hovered && Boolean(item.vid);

  return (
    <article
      className="fab-asset-card"
      data-active={isAtmosphere}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className="fab-asset-media">
        {showVideo ? (
          <video
            src={item.vid}
            poster={item.img || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            className="fab-asset-video"
          />
        ) : item.img ? (
          <img src={item.img} alt={item.title} loading="lazy" className="fab-asset-img" />
        ) : (
          <div className="fab-asset-fallback" aria-hidden="true">
            {item.vid ? <Video size={18} /> : <Sparkles size={18} />}
            <span>{item.library}</span>
          </div>
        )}
        <span className="fab-asset-badge">{item.library}</span>
        {item.vid && (
          <span className="fab-asset-vid-tag" aria-hidden="true">
            <Play size={10} />
          </span>
        )}
      </div>

      <div className="fab-asset-body">
        <p className="fab-asset-title" title={item.title}>
          {item.title}
        </p>
        <p className="fab-asset-cat">{item.category}</p>
        <div className="fab-asset-actions">
          {canSetAtmosphere && (
            <button
              type="button"
              className="fab-asset-btn"
              data-active={isAtmosphere}
              onClick={() => onSetAtmosphere(item)}
            >
              {isAtmosphere ? 'Đang phủ nền' : 'Phủ nền 3D'}
            </button>
          )}
          <button
            type="button"
            className="fab-asset-btn fab-asset-btn--primary"
            onClick={() => onTrial(item)}
          >
            Dùng thử
          </button>
        </div>
      </div>
    </article>
  );
};

export const FabulousShowcaseDock: React.FC = () => {
  const { settings, theme, openExperience, addToast } = useAppStore();
  const isFabulous = settings.uiMode === 'fabulous';
  const reduced = Boolean(useReducedMotion()) || Boolean(settings.reducedMotion);

  const [open, setOpen] = useState(false);
  const [bucket, setBucket] = useState<BucketKey>('ui50');
  const [query, setQuery] = useState('');
  const [preset, setPreset] = useState<CodeFrontsPreset>('visionos-glass');
  const [activeWidget, setActiveWidget] = useState<PinUiWidgetKey>('theme');
  const [likedDemo, setLikedDemo] = useState(true);
  const [activeAtmosphere, setActiveAtmosphere] = useState<FabulousManifestItem | null>(null);

  useEffect(() => {
    if (!isFabulous) {
      delete document.documentElement.dataset.fabulousPreset;
      return;
    }
    document.documentElement.dataset.fabulousPreset = preset;
    return () => {
      delete document.documentElement.dataset.fabulousPreset;
    };
  }, [isFabulous, preset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const items = useMemo<FabulousManifestItem[]>(() => {
    const list = fabulousManifest[bucket] as FabulousManifestItem[];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.library.toLowerCase().includes(q)
    );
  }, [bucket, query]);

  if (!isFabulous) return null;

  const handleSetAtmosphere = (item: FabulousManifestItem) => {
    if (activeAtmosphere?.id === item.id) {
      setActiveAtmosphere(null);
      return;
    }
    setActiveAtmosphere(item);
    addToast({ type: 'success', title: `Đã bật lớp nền 3D: ${item.title}` });
  };

  const handleToggleQuickAtmosphere = () => {
    if (activeAtmosphere) {
      setActiveAtmosphere(null);
      return;
    }
    const defaultShader =
      (fabulousManifest.glacier50[0] as FabulousManifestItem | undefined) ??
      (fabulousManifest.threeui50[0] as FabulousManifestItem | undefined);
    if (defaultShader) {
      setActiveAtmosphere(defaultShader);
      addToast({ type: 'success', title: `Đã bật lớp nền 3D: ${defaultShader.title}` });
    }
  };

  const handleTrial = (item: FabulousManifestItem) => {
    setOpen(false);
    openExperience(item.id);
  };

  return (
    <>
      {activeAtmosphere && (
        <div className="fab-atmosphere-layer" aria-hidden="true">
          {!reduced && activeAtmosphere.vid ? (
            <video
              key={activeAtmosphere.id}
              src={activeAtmosphere.vid}
              poster={activeAtmosphere.img || undefined}
              autoPlay
              muted
              loop
              playsInline
              className="fab-atmosphere-media"
            />
          ) : activeAtmosphere.img ? (
            <img
              src={activeAtmosphere.img}
              alt=""
              className="fab-atmosphere-media"
            />
          ) : null}
          <div className="fab-atmosphere-veil" />
        </div>
      )}

      <div className="fab-studio-anchor" data-open={open}>
        <div className="fab-studio-pill-row">
          <button
            type="button"
            className="fab-studio-pill"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label="Mở kho 200 tài nguyên Fabulous Studio"
          >
            <span className="fab-studio-dot" aria-hidden="true" />
            <Sparkles size={14} aria-hidden="true" />
            <span>Fabulous · {FABULOUS_TOTAL_COUNT}</span>
          </button>

          <button
            type="button"
            className="fab-studio-pill fab-studio-pill--shader"
            aria-pressed={Boolean(activeAtmosphere)}
            onClick={handleToggleQuickAtmosphere}
            aria-label={activeAtmosphere ? `Tắt nền ${activeAtmosphere.title}` : 'Bật lớp nền 3D / Glacier'}
          >
            <Layers size={13} aria-hidden="true" />
            <span>{activeAtmosphere ? activeAtmosphere.title : 'Nền 3D / Glacier'}</span>
            {activeAtmosphere && <X size={13} aria-hidden="true" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.section
              className="fab-studio-drawer"
              role="dialog"
              aria-label="Fabulous Studio 200-Asset Live Switcher"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <header className="fab-drawer-head">
                <div>
                  <h2 className="fab-drawer-title">
                    Fabulous Studio · {FABULOUS_TOTAL_COUNT} tài nguyên thực
                  </h2>
                  <p className="fab-drawer-sub">
                    {fabulousManifest.pinuiCount} PinUI · {fabulousManifest.codefrontsUiCount} CodeFronts ·{' '}
                    {fabulousManifest.threeuiCount} ThreeUI · {fabulousManifest.glacierCount} Glacier ·{' '}
                    {fabulousManifest.motionCount} Motion AI
                  </p>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng Fabulous Studio"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="fab-drawer-controls">
                <div className="fab-drawer-tabs" role="tablist" aria-label="Nhóm tài nguyên Fabulous">
                  {BUCKETS.map((b) => (
                    <button
                      key={b.key}
                      type="button"
                      role="tab"
                      aria-selected={bucket === b.key}
                      className="fab-drawer-tab"
                      onClick={() => setBucket(b.key)}
                    >
                      <span>{b.label}</span>
                      <span className="fab-drawer-count">{b.count}</span>
                    </button>
                  ))}
                </div>

                <label className="fab-drawer-search">
                  <Search size={14} aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Lọc theo tên, thư viện, danh mục..."
                    aria-label="Tìm trong 200 tài nguyên Fabulous"
                  />
                </label>
              </div>

              <div className="fab-interactive-deck">
                <div className="fab-preset-bar">
                  <span className="t-label">CodeFronts CSS:</span>
                  {CODEFRONTS_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="fab-preset-chip"
                      aria-pressed={preset === p.id}
                      onClick={() => setPreset(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {bucket === 'ui50' && (
                  <>
                    <div className="fab-widget-bar">
                      <span className="t-label">PinUI Live:</span>
                      {PINUI_WIDGETS.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          className="fab-preset-chip"
                          aria-pressed={activeWidget === w.id}
                          onClick={() => setActiveWidget(w.id)}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>

                    <div className="fab-widget-stage">
                      {activeWidget === 'theme' && (
                        <ThemeSwitch
                          theme={theme}
                          onThemeChange={() => triggerPinuiThemeToggle()}
                        />
                      )}
                      {activeWidget === 'lamp' && (
                        <LampSwitch
                          on={theme === 'light'}
                          onToggle={() => triggerPinuiThemeToggle()}
                          onLabel="Giấy sáng"
                          offLabel="Mực tối"
                        />
                      )}
                      {activeWidget === 'heart' && (
                        <PinHeartButton
                          liked={likedDemo}
                          count={likedDemo ? 200 : 199}
                          onToggle={() => setLikedDemo((v) => !v)}
                          ariaLabel="Thả tim PinUI"
                        />
                      )}
                      {activeWidget === 'copypad' && (
                        <CopyPastePad theme={theme} />
                      )}
                      {activeWidget === 'reader' && (
                        <ReaderCard
                          title="Fabulous Design System"
                          subtitle="PinUI + CodeFronts"
                          excerptLines={[
                            'Bo góc đồng tâm, kính mờ VisionOS và tương phản >= 4.5:1.',
                          ]}
                          paragraphs={[
                            'Chế độ Fabulous kết hợp 41 thành phần tương tác PinUI, 9 công thức CSS CodeFronts, 50 mô hình ThreeUI, 50 cảnh Glacier 3D và 50 chuyển động Motion AI.',
                          ]}
                          theme={theme}
                        />
                      )}
                      {activeWidget === 'voice' && (
                        <LiquidVoice
                          theme={theme}
                          onSend={(ms) =>
                            addToast({
                              type: 'info',
                              title: `Đã thu âm mẫu ${(ms / 1000).toFixed(1)}s`,
                            })
                          }
                        />
                      )}
                      {activeWidget === 'balance' && (
                        <BalanceCard balance={200} presets={[10, 50, 100, 200]} />
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="fab-asset-grid">
                {items.map((item) => (
                  <AssetCard
                    key={`${bucket}-${item.id}`}
                    item={item}
                    bucket={bucket}
                    isAtmosphere={activeAtmosphere?.id === item.id}
                    reduced={reduced}
                    onSetAtmosphere={handleSetAtmosphere}
                    onTrial={handleTrial}
                  />
                ))}
                {items.length === 0 && (
                  <p className="fab-drawer-empty">Không tìm thấy tài nguyên phù hợp với “{query}”.</p>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default FabulousShowcaseDock;
