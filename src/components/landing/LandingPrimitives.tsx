import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useInView, usePrefersReducedMotion, useScrollProgress } from './useLandingMotion';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: number;
  variant?: 'up' | 'left' | 'right' | 'scale';
  as?: 'div' | 'section' | 'li' | 'article' | 'span' | 'header' | 'footer';
  threshold?: number;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  y = 8,
  scale,
  variant = 'up',
  as,
  threshold = 0.01,
}) => {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold });
  const Tag = (as ?? 'div') as React.ElementType;

  const style = useMemo(
    () =>
      ({
        '--ff-reveal-delay': `${Math.min(delay, 60)}ms`,
        '--ff-reveal-y': `${Math.min(y, 10)}px`,
        ...(scale !== undefined ? { '--ff-reveal-scale': `${scale}` } : {}),
      }) as React.CSSProperties,
    [delay, y, scale]
  );

  const variantClass =
    variant === 'left'
      ? 'ff-reveal-left'
      : variant === 'right'
        ? 'ff-reveal-right'
        : variant === 'scale'
          ? 'ff-reveal-scale'
          : '';

  return (
    <Tag
      ref={ref}
      className={`ff-reveal ${variantClass} ${inView ? 'is-visible' : ''} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
};

export const SectionHeading: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'center' | 'left';
  className?: string;
}> = ({ eyebrow, title, description, align = 'center', className = '' }) => (
  <div
    className={`${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl text-left'} ${className}`}
  >
    <Reveal y={14}>
      <span className="ff-eyebrow inline-flex items-center gap-2">
        <span className="h-[1px] w-6 bg-current opacity-60" aria-hidden="true" />
        {eyebrow}
      </span>
    </Reveal>
    <Reveal y={20} delay={70}>
      <h2 className="ff-display ff-balance mt-4 text-3xl sm:text-4xl md:text-[2.65rem] text-[var(--ff-text)]">
        {title}
      </h2>
    </Reveal>
    {description && (
      <Reveal y={18} delay={130}>
        <p className="mt-5 text-base leading-relaxed text-[var(--ff-text-soft)] sm:text-lg">{description}</p>
      </Reveal>
    )}
  </div>
);

export const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'li';
}> = ({ children, className = '', as = 'div' }) => {
  const Tag = as as React.ElementType;
  const handleMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--ff-mx', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--ff-my', `${event.clientY - rect.top}px`);
  }, []);

  return (
    <Tag onMouseMove={handleMove} className={`ff-card ff-glass ff-spotlight ${className}`}>
      {children}
    </Tag>
  );
};

export const MagneticButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'lg';
  href?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit';
}> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  href,
  ariaLabel,
  type = 'button',
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const handleMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const node = ref.current;
      if (!node || reduced || !window.matchMedia('(hover: hover)').matches) return;
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
      node.style.transform = `translate3d(${x * 8}px, ${y * 6 - 2}px, 0) scale(1.02)`;
    },
    [reduced]
  );

  const handleLeave = useCallback(() => {
    const node = ref.current;
    if (node) node.style.transform = '';
  }, []);

  const classes = `group ff-btn ${variant === 'primary' ? 'ff-btn-primary' : 'ff-btn-ghost'} ${
    size === 'lg' ? 'px-7 py-3.5 text-[15px]' : 'px-5 py-2.5 text-sm'
  } ${className}`;

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        aria-label={ariaLabel}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={classes}
    >
      {children}
    </button>
  );
};

export const AuroraBackdrop: React.FC<{
  className?: string;
  variant?: 'amber' | 'cool' | 'mixed';
}> = ({ className = '', variant = 'mixed' }) => {
  const amber = 'radial-gradient(circle at 30% 30%, rgba(245,158,11,0.45), transparent 62%)';
  const verdigris = 'radial-gradient(circle at 60% 60%, rgba(45,212,191,0.34), transparent 62%)';

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {(variant === 'amber' || variant === 'mixed') && (
        <div
          className="ff-aurora ff-aurora-anim"
          style={{ width: '580px', height: '580px', top: '-18%', left: '-8%', background: amber }}
        />
      )}
      {(variant === 'cool' || variant === 'mixed') && (
        <div
          className="ff-aurora ff-aurora-anim-slow"
          style={{ width: '520px', height: '520px', top: '12%', right: '-10%', background: verdigris }}
        />
      )}
    </div>
  );
};

export const BackToTop: React.FC = () => {
  const progress = useScrollProgress();
  const visible = progress > 0.12;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Quay lại đầu trang"
      className={`ff-btn ff-btn-ghost fixed bottom-6 right-5 z-40 h-11 w-11 !p-0 sm:bottom-8 sm:right-8 ${
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{ transitionProperty: 'opacity, transform, border-color' }}
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </button>
  );
};

export const ScrambleText: React.FC<{
  text: string;
  className?: string;
  delay?: number;
}> = ({ text, className = '', delay = 0 }) => {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.3 });
  const reduced = usePrefersReducedMotion();
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (!inView || reduced) {
      const id = requestAnimationFrame(() => setDisplayText(text));
      return () => cancelAnimationFrame(id);
    }
    const el = ref.current;
    const glyphs = 'ABCDEFGHJKLNOPQRSTUVWXYZ0123456789';
    let frame = 0;
    const startTime = performance.now() + delay;
    const duration = 900;

    const tick = (now: number) => {
      if (now < startTime) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, (now - startTime) / duration);
      const lockedLength = Math.floor(progress * text.length);

      const result = text
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';
          if (i < lockedLength) return text[i];
          return glyphs[Math.floor(Math.random() * glyphs.length)];
        })
        .join('');

      if (el) el.textContent = result;

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplayText(text);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, text, delay, reduced, ref]);

  return (
    <span ref={ref} className={className}>
      {displayText}
    </span>
  );
};
