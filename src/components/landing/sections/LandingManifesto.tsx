import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DimensionView } from '../../../types/index';
import { useAppStore } from '../../../store/appStore';
import { Mark } from '../../../ui/Mark';
import { PromptComposer, type PromptComposerAction } from '../../pinui/PromptComposer';
import { MANIFESTO_BEATS, type ManifestoBeat } from '../landingContent';
import { usePrefersReducedMotion } from '../useLandingMotion';

interface LandingManifestoProps {
  onNavigate: (view: DimensionView) => void;
}

const LANDING_COMPOSER_ACTIONS: PromptComposerAction[] = [
  {
    id: 'landing',
    label: 'Trang đích',
    placeholder: 'Mô tả bố cục và mục tiêu cho trang giới thiệu sản phẩm học tập...',
    kind: 'image',
  },
  {
    id: 'dashboard',
    label: 'Dữ liệu',
    placeholder: 'Thiết kế bảng điều khiển số liệu rõ ràng, tương thích màn hình 390px...',
    kind: 'note',
  },
  {
    id: 'club-hub',
    label: 'Hội nhóm',
    placeholder: 'Xây dựng trang giới thiệu dự án học thuật cho câu lạc bộ FPT...',
    kind: 'event',
  },
  {
    id: 'quiz-tools',
    label: 'Kiểm tra',
    placeholder: 'Tạo công cụ ôn tập hoặc so sánh hai phương án giao diện có bảng đối chiếu...',
    kind: 'voice',
  },
  {
    id: 'design-code',
    label: 'Mã nguồn',
    placeholder: 'Chuyển đặc tả giao diện thành HTML/CSS/JS sạch và kiểm tra trực tiếp...',
    kind: 'docs',
  },
];

function segmentWordsAndGraphemes(text: string): Array<{ word: string; chars: string[]; startIdx: number }> {
  const words = text.split(' ');
  const segmenter =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? new Intl.Segmenter('vi', { granularity: 'grapheme' })
      : null;

  let cursor = 0;
  return words.map((word) => {
    const chars = segmenter ? Array.from(segmenter.segment(word), (s) => s.segment) : Array.from(word);
    const startIdx = cursor;
    cursor += chars.length;
    return { word, chars, startIdx };
  });
}

const GeometricBadge: React.FC<{ kind: ManifestoBeat['badge']; active: boolean }> = ({ kind, active }) => {
  if (kind === 'prism') {
    return (
      <svg viewBox="0 0 88 88" className="lp-hm-badgeSvg" data-active={active} aria-hidden="true">
        <polygon points="44,8 78,28 44,48 10,28" fill="#B8E5D4" stroke="#0F1414" strokeWidth="2.5" />
        <polygon points="10,28 44,48 44,80 10,60" fill="#52B89A" stroke="#0F1414" strokeWidth="2.5" />
        <polygon points="78,28 44,48 44,80 78,60" fill="#E6B385" stroke="#0F1414" strokeWidth="2.5" />
      </svg>
    );
  }
  if (kind === 'viewport') {
    return (
      <svg viewBox="0 0 88 88" className="lp-hm-badgeSvg" data-active={active} aria-hidden="true">
        <rect x="8" y="14" width="72" height="58" rx="8" fill="#F3F6F4" stroke="#0F1414" strokeWidth="2.5" />
        <rect x="8" y="14" width="72" height="14" rx="6" fill="#C7E2D8" stroke="#0F1414" strokeWidth="2.5" />
        <rect x="18" y="36" width="24" height="26" rx="4" fill="#52B89A" stroke="#0F1414" strokeWidth="2" />
        <rect x="48" y="36" width="22" height="11" rx="3" fill="#B0C9C4" stroke="#0F1414" strokeWidth="2" />
        <rect x="48" y="51" width="22" height="11" rx="3" fill="#E6B385" stroke="#0F1414" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === 'code') {
    return (
      <svg viewBox="0 0 88 88" className="lp-hm-badgeSvg" data-active={active} aria-hidden="true">
        <rect x="8" y="14" width="72" height="60" rx="8" fill="#F3F6F4" stroke="#0F1414" strokeWidth="2.5" />
        <rect x="8" y="14" width="72" height="14" rx="6" fill="#B8D8D2" stroke="#0F1414" strokeWidth="2.5" />
        <path
          d="M30 44 L21 51 L30 58 M58 44 L67 51 L58 58 M46 40 L42 62"
          fill="none"
          stroke="#0F1414"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 88 88" className="lp-hm-badgeSvg" data-active={active} aria-hidden="true">
      <rect x="10" y="10" width="30" height="30" rx="6" fill="#B8E5D4" stroke="#0F1414" strokeWidth="2.5" />
      <rect x="48" y="10" width="30" height="30" rx="6" fill="#E6B385" stroke="#0F1414" strokeWidth="2.5" />
      <rect x="10" y="48" width="30" height="30" rx="6" fill="#A6CCC8" stroke="#0F1414" strokeWidth="2.5" />
      <rect x="48" y="48" width="30" height="30" rx="6" fill="#D5E4DE" stroke="#0F1414" strokeWidth="2.5" />
    </svg>
  );
};

const BeatBlock: React.FC<{
  beat: ManifestoBeat;
  index: number;
  active: boolean;
  reduced: boolean;
}> = ({ beat, index, active, reduced }) => {
  const tokens = useMemo(() => segmentWordsAndGraphemes(beat.headline), [beat.headline]);

  return (
    <article className="lp-hm-beat" data-active={active}>
      <div className="lp-hm-beatTop">
        <span className="lp-hm-index">
          {String(index + 1).padStart(2, '0')} / {String(MANIFESTO_BEATS.length).padStart(2, '0')}
        </span>
        <div className="lp-hm-badgeWrap">
          <GeometricBadge kind={beat.badge} active={active} />
        </div>
      </div>

      <h3 className="lp-hm-headline">
        {reduced ? (
          beat.headline
        ) : (
          <>
            <span className="sr-only">{beat.headline}</span>
            <span aria-hidden="true" className="lp-hm-words">
              {tokens.map((tok, wIdx) => (
                <span key={`${beat.id}-w-${wIdx}`} className="lp-hm-word">
                  {tok.chars.map((ch, cIdx) => {
                    const delayMs = Math.min((tok.startIdx + cIdx) * 35, 950);
                    return (
                      <span
                        key={`${beat.id}-c-${wIdx}-${cIdx}`}
                        className="lp-hm-char"
                        data-dropped={active}
                        style={{ transitionDelay: `${delayMs}ms` }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </span>
              ))}
            </span>
          </>
        )}
      </h3>

      <p className="lp-hm-body">{beat.body}</p>

      <div className="lp-hm-stickers">
        {beat.stickers.map((sticker, sIdx) => (
          <span
            key={sticker.label}
            className="lp-hm-sticker"
            data-popped={active}
            style={{
              backgroundColor: sticker.bg,
              transform: active
                ? `rotate(${sticker.tilt}deg) scale(1)`
                : `rotate(${sticker.tilt * 1.8}deg) scale(0.72)`,
              transitionDelay: `${180 + sIdx * 90}ms`,
            }}
          >
            {sticker.label}
          </span>
        ))}
      </div>
    </article>
  );
};

export const LandingManifesto: React.FC<LandingManifestoProps> = ({ onNavigate }) => {
  const { launchPromptToWorkspace, theme } = useAppStore();
  const reduced = usePrefersReducedMotion();
  const runwayRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [mp, setMp] = useState(0);
  const [isDesktopHorizontal, setIsDesktopHorizontal] = useState(true);
  const [promptText, setPromptText] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('Định tuyến');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const syncMode = () => setIsDesktopHorizontal(mq.matches && !reduced);
    syncMode();
    mq.addEventListener('change', syncMode);
    return () => mq.removeEventListener('change', syncMode);
  }, [reduced]);

  useEffect(() => {
    if (!isDesktopHorizontal || typeof window === 'undefined') {
      setMp(1);
      return;
    }

    let rafId = 0;
    let smoothMp = 0;

    const tick = () => {
      const runway = runwayRef.current;
      const track = trackRef.current;
      if (runway && track) {
        const rect = runway.getBoundingClientRect();
        const vh = window.innerHeight || 900;
        const vw = window.innerWidth || 1440;
        const scrollable = Math.max(1, rect.height - vh);
        const rawMp = Math.max(0, Math.min(1, -rect.top / scrollable));
        smoothMp += (rawMp - smoothMp) * 0.16;
        const val = Math.abs(rawMp - smoothMp) < 0.0008 ? rawMp : smoothMp;
        const maxShift = Math.max(0, track.scrollWidth - vw + 48);
        track.style.transform = `translate3d(${(-val * maxShift).toFixed(2)}px, 0, 0)`;
        setMp((prev) => (Math.abs(prev - val) > 0.015 ? val : prev));
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isDesktopHorizontal]);

  const handleSend = (prompt: string) => {
    void launchPromptToWorkspace(prompt);
  };

  return (
    <section id="tuyen-ngon" aria-label="Nghiên cứu và cơ sở khoa học FPT Forum" className="lp-hm-root">
      <div
        ref={runwayRef}
        className="lp-hm-runway"
        data-horizontal={isDesktopHorizontal ? 'true' : 'false'}
      >
        <div className="lp-hm-sticky">
          <div className="wrap-wide lp-hm-header">
            <div className="lp-hm-meter" aria-hidden="true">
              <span style={{ transform: `scaleX(${isDesktopHorizontal ? Math.max(0.08, mp) : 1})` }} />
            </div>
          </div>

          <div ref={trackRef} className="lp-hm-track">
            <div className="lp-hm-intro">
              <h2 className="lp-hm-title">
                Từ thực trạng PISA 2025
                <br />
                đến <span className="t-note">Xưởng lắp ráp mở.</span>
              </h2>
              <p className="lp-hm-lead">
                6 trụ cột nghiên cứu của FPT Forum: giải quyết 3 điểm nghẽn khi dùng AI (95,9% học sinh theo OECD PISA 2025), chống AI Slop, khảo sát 195 người dùng (91,2%) và kiến trúc JSON · Bộ lọc AI · WebSocket.
              </p>
            </div>

            {MANIFESTO_BEATS.map((beat, idx) => {
              const threshold = idx * (0.85 / Math.max(1, MANIFESTO_BEATS.length - 1));
              const active = !isDesktopHorizontal || mp >= threshold - 0.06;
              return (
                <BeatBlock
                  key={beat.id}
                  beat={beat}
                  index={idx}
                  active={active}
                  reduced={reduced}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="lp-section sheet">
        <div className="wrap lp-desk">
          <div className="lp-desk-head">
            <h2 className="t-title">
              Chọn bộ khung mẫu <Mark kind="underline">ngay tại đây</Mark>
            </h2>
            <p className="t-lead">
              Nhập bài toán học tập hoặc dự án phổ thông của bạn — F-Forum đối chiếu kho 7.662 mẫu giao diện, 60 công cụ và 122 repo để mở thẳng Workspace kèm xem trước trực tiếp.
            </p>
          </div>

          <div className="lp-desk-box">
            <PromptComposer
              layoutId="landing-pinui-composer"
              theme={theme}
              value={promptText}
              onChange={setPromptText}
              selectedAction={selectedAction}
              onSelectAction={setSelectedAction}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              actions={LANDING_COMPOSER_ACTIONS}
              onSend={handleSend}
              onAttachClick={() => onNavigate('explore')}
            />
          </div>

          <div className="lp-actions">
            <button type="button" className="btn btn-line" onClick={() => onNavigate('home')}>
              Trang chủ
            </button>
            <button type="button" className="btn btn-solid" onClick={() => onNavigate('workspace')}>
              Workspace
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingManifesto;
