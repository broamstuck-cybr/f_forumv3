import { useReducedMotion } from 'motion/react';
import { useAppStore } from '../../store/appStore';

export function useCalm(): boolean {
  const prefersReduced = useReducedMotion();
  const { reducedMotion } = useAppStore();
  return Boolean(prefersReduced) || reducedMotion;
}
