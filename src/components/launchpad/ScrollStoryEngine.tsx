import React, { useEffect, useState } from 'react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import type { HomeMotionShowcaseItem } from '../../data/homeMotionShowcases';
import { MotionMarqueeGrid } from './MotionMarqueeGrid';
import { GlacierBookShelf } from './GlacierBookShelf';
import '../../styles/story.css';

export interface ScrollStoryEngineProps {
  onNavigate: (route: AppRoute) => void;
  onLaunchPrompt: (prompt: string) => Promise<void> | void;
  onOpenShowcase?: (item: HomeMotionShowcaseItem) => void;
  onOpenLeaderboard?: () => void;
}

export const ScrollStoryEngine: React.FC<ScrollStoryEngineProps> = ({
  onNavigate,
  onLaunchPrompt,
  onOpenShowcase,
  onOpenLeaderboard,
}) => {
  const { reducedMotion } = useAppStore();
  const [osReduced, setOsReduced] = useState(false);

  void onOpenShowcase;
  void onOpenLeaderboard;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setOsReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const reduced = reducedMotion || osReduced;

  return (
    <div className="stry">
      <MotionMarqueeGrid onLaunchPrompt={onLaunchPrompt} reduced={reduced} />
      <GlacierBookShelf
        onNavigate={onNavigate}
        onLaunchPrompt={(prompt) => {
          void onLaunchPrompt(prompt);
        }}
      />
    </div>
  );
};

export default ScrollStoryEngine;
