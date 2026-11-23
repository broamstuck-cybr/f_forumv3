/* Adapted from CodeFronts Scroll-to-Top Floating Button with SVG Progress Ring · MIT License */
import React, { useEffect, useRef, useState } from 'react';
import './back-to-top.css';

export interface BackToTopButtonProps {
  offsetForMobileNav?: boolean;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  offsetForMobileNav = false,
}) => {
  const ringRef = useRef<SVGCircleElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const doc = document.documentElement;
      const max = Math.max(0, doc.scrollHeight - window.innerHeight);
      const y = window.scrollY || doc.scrollTop || 0;
      const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

      if (ringRef.current) {
        ringRef.current.style.setProperty('--btt-p', p.toFixed(4));
      }
      const nextShown = max > 120 && (p > 0.06 || y > 220);
      setShown((prev) => (prev === nextShown ? prev : nextShown));
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('reduce-motion');
    window.scrollTo({
      top: 0,
      behavior: reduced ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
      data-shown={shown ? 'true' : 'false'}
      data-mobile-offset={offsetForMobileNav ? 'true' : 'false'}
      className="ff-btt"
    >
      <svg className="ff-btt__ringSvg" viewBox="0 0 52 52" aria-hidden="true" focusable="false">
        <circle className="ff-btt__track" cx="26" cy="26" r="22" fill="none" strokeWidth="3.2" />
        <circle
          ref={ringRef}
          className="ff-btt__ring"
          cx="26"
          cy="26"
          r="22"
          fill="none"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
      <svg className="ff-btt__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 19V6M6 12l6-6 6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default BackToTopButton;
