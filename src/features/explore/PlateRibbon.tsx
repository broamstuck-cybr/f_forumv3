import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { previewFor } from '../../ui/Media';
import { useAppStore } from '../../store/appStore';
import { PinUIPlayground } from '../../components/pinui';
import { shortTitle, type ExplorePlateItem } from './catalog';
import { VAULT_LIBRARY_LABELS } from './vaultLoader';
import { SandboxPreview } from './SandboxPreview';
import { SpecimenMedia } from './SpecimenMedia';
import { ReactionBar } from './SpecimenSheet';

interface PlateRibbonProps {
  label: string;
  items: ExplorePlateItem[];
  savedIds: string[];
  activeId: string | null;
  direction: 1 | -1;
  startAtEnd: boolean;
  drift: boolean;
  calm: boolean;
  onSelect: (item: ExplorePlateItem) => void;
  onExperience: (item: ExplorePlateItem) => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startLeft: number;
  moved: boolean;
}

const DRIFT_SPEED = 19.2;
const DRAG_THRESHOLD = 6;
const LIVE_CANVAS_WIDTH = 900;
const CALM_CSS = '*,*::before,*::after{animation:none!important;transition:none!important}';
const FILL_CSS = 'html{height:100%}html,body{min-height:100%;margin:0}';

function isUsableLiveHtml(html: string | undefined, hasFallbackMedia: boolean): boolean {
  if (!html) return false;
  const trimmed = html.trim();
  if (!trimmed) return false;
  if (!hasFallbackMedia) return true;
  if (
    /WORDMARK\s+PATH|\[FRONT\]/i.test(trimmed) ||
    /<[^>]+>\s*…\s*<\/[^>]+>/.test(trimmed) ||
    /(?:src|poster)\s*=\s*["']assets\/[^"']+["']/i.test(trimmed) ||
    /#(?:faceGl|track)\b/.test(trimmed)
  ) {
    return false;
  }
  if (trimmed.length < 700 && !/<(?:section|main|canvas|svg|button|form|article)\b/i.test(trimmed)) {
    return false;
  }
  return true;
}

interface LiveThumbProps {
  title: string;
  html: string;
  css: string;
  calm: boolean;
}

const LiveThumb: React.FC<LiveThumbProps> = ({ title, html, css, calm }) => {
  const { theme } = useAppStore();
  const hostRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [box, setBox] = useState({ scale: 0, height: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1].isIntersecting) setVisible(true);
      },
      { rootMargin: '400px' }
    );
    io.observe(host);
    const ro = new ResizeObserver((entries) => {
      const rect = entries[entries.length - 1].contentRect;
      if (rect.width === 0 || rect.height === 0) return;
      const scale = rect.width / LIVE_CANVAS_WIDTH;
      setBox({ scale, height: rect.height / scale });
    });
    ro.observe(host);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  const hasMinHeight = /(?:html|body)[^{]*\{[^}]*min-height\s*:\s*100/i.test(`${html}\n${css}`);
  const thumbCss = [hasMinHeight ? '' : FILL_CSS, css, calm ? CALM_CSS : ''].filter(Boolean).join('\n');

  return (
    <span ref={hostRef} className="ex-live-thumb" data-ready={visible && box.scale > 0 ? 'true' : 'false'}>
      {visible && box.scale > 0 ? (
        <span
          className="ex-live-canvas"
          inert
          style={{
            width: LIVE_CANVAS_WIDTH,
            height: box.height,
            transform: `scale(${box.scale})`,
          }}
        >
          <SandboxPreview
            title={title}
            html={html}
            css={thumbCss}
            theme={theme}
            viewport={1440}
            nonce={0}
            className="ex-sandbox-thumb"
          />
        </span>
      ) : null}
    </span>
  );
};

interface PinUIThumbProps {
  itemId: string;
  isBlocx: boolean;
}

const PinUIThumb: React.FC<PinUIThumbProps> = ({ itemId, isBlocx }) => {
  const { theme } = useAppStore();
  const hostRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const canvasWidth = isBlocx ? 960 : 620;
  const [box, setBox] = useState({ scale: 0, height: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1].isIntersecting) setVisible(true);
      },
      { rootMargin: '400px' }
    );
    io.observe(host);
    const ro = new ResizeObserver((entries) => {
      const rect = entries[entries.length - 1].contentRect;
      if (rect.width === 0 || rect.height === 0) return;
      const scale = rect.width / canvasWidth;
      setBox({ scale, height: rect.height / scale });
    });
    ro.observe(host);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, [canvasWidth]);

  return (
    <span ref={hostRef} className="ex-live-thumb" data-ready={visible && box.scale > 0 ? 'true' : 'false'}>
      {visible && box.scale > 0 ? (
        <span
          className="ex-live-canvas ex-pinui-thumb-canvas"
          inert
          style={{
            width: canvasWidth,
            minHeight: box.height,
            transform: `scale(${box.scale})`,
          }}
        >
          <PinUIPlayground itemId={itemId} theme={theme} compact />
        </span>
      ) : null}
    </span>
  );
};

export const PlateRibbon: React.FC<PlateRibbonProps> = ({
  label,
  items,
  savedIds,
  activeId,
  direction,
  startAtEnd,
  drift,
  calm,
  onSelect,
  onExperience,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const holdRef = useRef({ hover: false, focus: false, drag: false });
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [cursor, setCursor] = useState(0);
  const safeCursor = Math.min(cursor, Math.max(0, items.length - 1));

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = startAtEnd ? el.scrollWidth - el.clientWidth : 0;
  }, [items, startAtEnd]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !drift) return;
    let frame = 0;
    let last = 0;
    let heading: number = direction;
    let position = el.scrollLeft;
    let visible = false;
    const step = (now: number) => {
      const delta = last ? Math.min(64, now - last) : 16;
      last = now;
      const max = el.scrollWidth - el.clientWidth;
      const hold = holdRef.current;
      if (hold.hover || hold.focus || hold.drag || max <= 0) {
        position = el.scrollLeft;
      } else {
        if (Math.abs(el.scrollLeft - position) > 2) position = el.scrollLeft;
        position += (heading * DRIFT_SPEED * delta) / 1000;
        if (position >= max) {
          position = max;
          heading = -1;
        }
        if (position <= 0) {
          position = 0;
          heading = 1;
        }
        el.scrollLeft = position;
      }
      frame = requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver((entries) => {
      const next = entries[entries.length - 1].isIntersecting;
      if (next === visible) return;
      visible = next;
      cancelAnimationFrame(frame);
      if (visible) {
        last = 0;
        position = el.scrollLeft;
        frame = requestAnimationFrame(step);
      }
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [drift, direction, items]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('.ex-plate-foot')) return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startLeft: el.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollerRef.current;
    if (!drag || !el) return;
    const distance = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(distance) > DRAG_THRESHOLD) {
      drag.moved = true;
      holdRef.current.drag = true;
      el.setPointerCapture(drag.pointerId);
      el.dataset.dragging = 'true';
    }
    if (drag.moved) el.scrollLeft = drag.startLeft - distance;
  };

  const handlePointerEnd = () => {
    const drag = dragRef.current;
    const el = scrollerRef.current;
    dragRef.current = null;
    holdRef.current.drag = false;
    if (!drag || !el || !drag.moved) return;
    if (el.hasPointerCapture(drag.pointerId)) el.releasePointerCapture(drag.pointerId);
    delete el.dataset.dragging;
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      holdRef.current.focus = false;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    let next = -1;
    if (event.key === 'ArrowRight') next = Math.min(items.length - 1, safeCursor + 1);
    else if (event.key === 'ArrowLeft') next = Math.max(0, safeCursor - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const target = listRef.current?.querySelectorAll<HTMLButtonElement>('.ex-plate')[next];
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ inline: 'center', block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
  };

  return (
    <div
      ref={scrollerRef}
      className="ex-ribbon no-scrollbar"
      onPointerEnter={() => {
        holdRef.current.hover = true;
      }}
      onPointerLeave={() => {
        holdRef.current.hover = false;
      }}
      onFocus={() => {
        holdRef.current.focus = true;
      }}
      onBlur={handleBlur}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClickCapture={handleClickCapture}
    >
      <ul
        ref={listRef}
        className="ex-ribbon-track"
        aria-label={`${label}: ${items.length} mẫu, dùng phím mũi tên để duyệt`}
        onKeyDown={handleKeyDown}
      >
        {items.map((item, index) => {
          const preview = previewFor(item.id);
          const isPinUI = item.vaultLibrary === 'pinui';
          const isMotion = item.vaultLibrary === 'motionsites';
          const libLabel = VAULT_LIBRARY_LABELS[item.vaultLibrary];
          const videoSrc = item.previewVideo;
          const imgSrc =
            item.previewImage ||
            (preview?.kind === 'image' ? preview.src : undefined);
          const hasLive = isUsableLiveHtml(item.previewHtml, Boolean(imgSrc || videoSrc));
          const preferAnimatedImg =
            isMotion && Boolean(imgSrc && /\.(gif|webp)(\?|$)/i.test(imgSrc));
          const saved = savedIds.includes(item.id);
          const isActive = activeId === item.id;
          const title = shortTitle(item);
          const hasVisual = Boolean(isPinUI || videoSrc || hasLive || imgSrc || preview);
          return (
            <li key={item.id}>
              <button
                type="button"
                className="ex-plate"
                data-active={isActive ? 'true' : undefined}
                aria-pressed={isActive}
                tabIndex={index === safeCursor ? 0 : -1}
                aria-label={saved ? `${title}, đã lưu` : title}
                onFocus={() => setCursor(index)}
                onClick={() => onSelect(item)}
              >
                {isPinUI ? (
                  <span className="plate ex-plate-frame">
                    <span className="ex-plate-shot">
                      <PinUIThumb itemId={item.id} isBlocx={item.id.startsWith('blocx/')} />
                    </span>
                  </span>
                ) : videoSrc ? (
                  <span className="plate ex-plate-frame">
                    <span className="ex-plate-shot">
                      <SpecimenMedia
                        eager={index < 6}
                        preview={{
                          kind: 'video',
                          src: videoSrc,
                          poster: imgSrc,
                          credit: 'motionsites.ai',
                        }}
                        title={title}
                        fallbackLabel={libLabel}
                      />
                    </span>
                  </span>
                ) : hasLive ? (
                  <span className="plate ex-plate-frame">
                    <span className="ex-plate-shot">
                      <LiveThumb
                        title={title}
                        html={item.previewHtml ?? ''}
                        css={item.previewCss ?? ''}
                        calm={calm}
                      />
                    </span>
                  </span>
                ) : preferAnimatedImg && imgSrc ? (
                  <span className="plate ex-plate-frame">
                    <span className="ex-plate-shot">
                      <SpecimenMedia
                        eager={index < 6}
                        preview={{
                          kind: 'image',
                          src: imgSrc,
                          credit: 'motionsites.ai',
                        }}
                        title={title}
                        fallbackLabel={libLabel}
                      />
                    </span>
                  </span>
                ) : imgSrc ? (
                  <span className="plate ex-plate-frame">
                    <span className="ex-plate-shot">
                      <SpecimenMedia
                        eager={index < 6}
                        preview={{
                          kind: 'image',
                          src: imgSrc,
                          credit:
                            item.vaultLibrary === 'threeui'
                              ? '3D WebGL'
                              : 'motionsites.ai',
                        }}
                        title={title}
                        fallbackLabel={libLabel}
                      />
                    </span>
                  </span>
                ) : preview ? (
                  <span className="plate ex-plate-frame">
                    <span className="ex-plate-shot">
                      <SpecimenMedia
                        eager={index < 6}
                        preview={preview}
                        title={title}
                        fallbackLabel={libLabel}
                      />
                    </span>
                  </span>
                ) : (
                  <span className="plate ex-plate-frame ex-plate-type">
                    <span className="ex-plate-type-top">
                      <span className="t-label">{item.category}</span>
                    </span>
                    <span className="ex-plate-word">{title}</span>
                    <span className="t-label">{item.style}</span>
                  </span>
                )}
                <span className="ex-plate-cap" aria-hidden="true">
                  <span className="t-label">{String(index + 1).padStart(2, '0')}</span>
                  {hasVisual ? <span className="ex-plate-title">{title}</span> : null}
                  {saved ? <span className="t-note ex-plate-saved">đã lưu</span> : null}
                </span>
              </button>
              <div className="ex-plate-foot">
                <ReactionBar id={item.id} title={title} library={item.vaultLibrary} className="ex-plate-react" />
                <button
                  type="button"
                  className="ex-plate-xp"
                  onClick={() => onExperience(item)}
                >
                  Trải nghiệm
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
