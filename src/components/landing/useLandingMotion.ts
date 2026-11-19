import { useEffect, useRef, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () =>
      setReduced(mq.matches || document.documentElement.classList.contains('reduce-motion'));
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return reduced;
}

type VisibilityHandler = (isIntersecting: boolean) => void;

const visibilityHandlers = new WeakMap<Element, VisibilityHandler>();
const sharedObservers = new Map<string, IntersectionObserver>();

function observeVisibility(
  element: Element,
  handler: VisibilityHandler,
  threshold: number,
  rootMargin: string
): () => void {
  const key = `${threshold}|${rootMargin}`;
  let observer = sharedObservers.get(key);

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityHandlers.get(entry.target)?.(entry.isIntersecting);
        });
      },
      { threshold, rootMargin }
    );
    sharedObservers.set(key, observer);
  }

  visibilityHandlers.set(element, handler);
  observer.observe(element);

  return () => {
    observer?.unobserve(element);
    visibilityHandlers.delete(element);
  };
}

export function useInView<T extends HTMLElement>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {}
) {
  const { threshold = 0.01, rootMargin = '400px 0px 200px 0px', once = true } = options;
  const effectiveThreshold = Math.min(threshold, 0.02);
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    if (typeof window !== 'undefined' && typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      if (rect.top <= vh + 400 && rect.bottom >= -200) {
        setInView(true);
        if (once) return;
      }
    }

    let seen = false;
    return observeVisibility(
      node,
      (isIntersecting) => {
        if (isIntersecting) {
          if (once && seen) return;
          seen = true;
          setInView(true);
          if (once && ref.current) visibilityHandlers.delete(ref.current);
        } else if (!once) {
          seen = false;
          setInView(false);
        }
      },
      effectiveThreshold,
      rootMargin
    );
  }, [effectiveThreshold, rootMargin, once]);

  return { ref, inView };
}

export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return progress;
}

export function useScrollY(): number {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrollY(window.scrollY);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return scrollY;
}

export function scrollToSection(sectionId: string, offset = 88): void {
  const target = document.getElementById(sectionId);
  if (!target) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: target.getBoundingClientRect().top + window.scrollY - offset,
    behavior: reduced ? 'auto' : 'smooth',
  });
}
