import React, { useEffect, useRef, useState } from 'react';
import type { HomeMotionShowcaseItem } from '../../../data/homeMotionShowcases';
import { IconCheck } from '../../../ui/icons';
import { useInView, usePrefersReducedMotion } from '../useLandingMotion';

interface StarterLiveStageProps {
  item: HomeMotionShowcaseItem;
}

const CODENEST_TABS = {
  spec: {
    label: 'Đặc tả',
    lines: [
      'layout: split-pane',
      'breakpoints: 390 | 768 | 1440',
      'sandbox: allow-scripts',
    ],
  },
  tokens: {
    label: 'Token',
    lines: [
      '--ink-dark: #0f1414;',
      '--accent: #38c99a;',
      '--harbour: #8cbcc8;',
    ],
  },
} as const;

const STELLAR_STEPS = [
  '01 Ngữ cảnh',
  '02 So Diff',
  '03 Live View',
] as const;

const SpaceVoyageLive: React.FC<{ activeLoop: boolean }> = ({ activeLoop }) => {
  const [locked, setLocked] = useState(false);
  const orbRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const orb = orbRef.current;
    if (!orb || !activeLoop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width * 0.5) * 0.08;
    const dy = (e.clientY - rect.top - rect.height * 0.5) * 0.08;
    orb.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
  };

  const handlePointerLeave = () => {
    const orb = orbRef.current;
    if (orb) orb.style.transform = 'translate3d(0px, 0px, 0)';
  };

  return (
    <div
      className="lp-starter-sv"
      data-locked={locked ? 'true' : 'false'}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div ref={orbRef} className="lp-starter-sv-orb" aria-hidden="true" />
      <svg
        className="lp-starter-sv-ring"
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="46" stroke="rgba(200,155,84,0.28)" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="60" cy="60" r="32" stroke="rgba(56,201,154,0.34)" strokeWidth="1.25" />
        <circle cx="60" cy="14" r="3.5" fill="#c89b54" />
      </svg>

      <div className="lp-starter-sv-copy">
        <span className="lp-starter-kicker">QUỸ ĐẠO 01</span>
        <strong className="lp-starter-heading">Vượt ngưỡng thị sai</strong>
      </div>

      <button
        type="button"
        className="lp-starter-pill-btn"
        aria-pressed={locked}
        data-active={locked ? 'true' : 'false'}
        data-card-trigger
        onClick={() => setLocked((prev) => !prev)}
      >
        {locked ? 'Đang giữ' : 'Kích hoạt'}
      </button>
    </div>
  );
};

const CodeNestLive: React.FC<{ activeLoop: boolean }> = ({ activeLoop }) => {
  const [activeTab, setActiveTab] = useState<'spec' | 'tokens'>('spec');
  const [streamPaused, setStreamPaused] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    if (!activeLoop || userInteracted || streamPaused) return undefined;
    const timer = window.setInterval(() => {
      setActiveTab((prev) => (prev === 'spec' ? 'tokens' : 'spec'));
    }, 3200);
    return () => window.clearInterval(timer);
  }, [activeLoop, streamPaused, userInteracted]);

  const selectTab = (tab: 'spec' | 'tokens') => {
    setUserInteracted(true);
    setActiveTab(tab);
  };

  const handleToggleRun = () => {
    setUserInteracted(true);
    setStreamPaused((prev) => !prev);
    setActiveTab((prev) => (prev === 'spec' ? 'tokens' : 'spec'));
  };

  const tabData = CODENEST_TABS[activeTab];

  return (
    <div className="lp-starter-cn">
      <div className="lp-starter-cn-head">
        <div className="lp-starter-cn-brand">
          <span className="lp-starter-tag">WORKSPACE</span>
          <button
            type="button"
            className="lp-starter-run-btn"
            aria-pressed={streamPaused}
            data-active={streamPaused ? 'true' : 'false'}
            data-card-trigger
            onClick={handleToggleRun}
          >
            {streamPaused ? 'Đang giữ' : 'Chạy thử'}
          </button>
        </div>

        <div
          className="lp-starter-tabs"
          role="tablist"
          aria-label="Chuyển khối mã CodeNest"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault();
              selectTab(activeTab === 'spec' ? 'tokens' : 'spec');
            }
          }}
        >
          <button
            type="button"
            role="tab"
            className="lp-starter-tab"
            aria-selected={activeTab === 'spec'}
            data-active={activeTab === 'spec' ? 'true' : 'false'}
            data-card-trigger
            onClick={() => selectTab('spec')}
          >
            Đặc tả
          </button>
          <button
            type="button"
            role="tab"
            className="lp-starter-tab"
            aria-selected={activeTab === 'tokens'}
            data-active={activeTab === 'tokens' ? 'true' : 'false'}
            data-card-trigger
            onClick={() => selectTab('tokens')}
          >
            Token
          </button>
        </div>
      </div>

      <pre key={activeTab} className="lp-starter-code">
        {tabData.lines.map((line, idx) => (
          <span
            key={line}
            className="lp-starter-code-line"
            style={{ animationDelay: `${idx * 45}ms` }}
          >
            {line}
          </span>
        ))}
      </pre>
    </div>
  );
};

const StellarAiLive: React.FC<{ activeLoop: boolean }> = ({ activeLoop }) => {
  const [doneCount, setDoneCount] = useState<number>(() => (activeLoop ? 1 : 3));
  const [manualRun, setManualRun] = useState(false);

  useEffect(() => {
    if (!activeLoop) {
      setDoneCount(3);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setDoneCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 950);
    return () => window.clearInterval(timer);
  }, [activeLoop]);

  const handleRestart = () => {
    setManualRun((prev) => !prev);
    setDoneCount((prev) => (prev >= 3 ? 1 : prev + 1));
  };

  return (
    <div className="lp-starter-st">
      <div className="lp-starter-st-head">
        <span className="lp-starter-st-title">Kiểm định</span>
        <button
          type="button"
          className="lp-starter-run-btn"
          aria-pressed={manualRun}
          data-active={manualRun ? 'true' : 'false'}
          data-card-trigger
          onClick={handleRestart}
        >
          {manualRun ? 'Chạy lại' : 'Chạy thử'}
        </button>
      </div>

      <div className="lp-starter-steps">
        {STELLAR_STEPS.map((label, idx) => {
          const isDone = idx < doneCount;
          return (
            <button
              key={label}
              type="button"
              className="lp-starter-step"
              aria-pressed={isDone}
              data-done={isDone ? 'true' : 'false'}
              data-card-trigger
              onClick={() => setDoneCount(idx + 1)}
            >
              <span>{label}</span>
              <span className="lp-starter-step-dot" aria-hidden="true">
                {isDone ? <IconCheck size={12} strokeWidth={2.2} aria-hidden="true" /> : <span className="lp-starter-step-idle" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const StarterLiveStage: React.FC<StarterLiveStageProps> = ({ item }) => {
  const { ref, inView } = useInView<HTMLDivElement>({
    once: false,
    rootMargin: '140px 0px',
    threshold: 0.01,
  });
  const reduced = usePrefersReducedMotion();
  const activeLoop = inView && !reduced;

  return (
    <div
      ref={ref}
      className="lp-starter starter-live-stage"
      data-starter-live={item.id}
      data-id={item.id}
      data-active={activeLoop ? 'true' : 'false'}
    >
      {item.id === 'hms-space-voyage' ? (
        <SpaceVoyageLive activeLoop={activeLoop} />
      ) : item.id === 'hms-codenest' ? (
        <CodeNestLive activeLoop={activeLoop} />
      ) : (
        <StellarAiLive activeLoop={activeLoop} />
      )}
    </div>
  );
};

export default StarterLiveStage;
