import React, { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useInView, usePrefersReducedMotion } from './useLandingMotion';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: 'div' | 'section' | 'li' | 'article' | 'span' | 'header' | 'footer';
  threshold?: number;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  y = 10,
  as,
  threshold = 0.01,
}) => {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold });
  const Tag = (as ?? 'div') as React.ElementType;

  const style = useMemo(
    () =>
      ({
        '--ff-reveal-delay': `${Math.min(delay, 90)}ms`,
        '--ff-reveal-y': `${Math.min(y, 14)}px`,
      }) as React.CSSProperties,
    [delay, y]
  );

  return (
    <Tag
      ref={ref}
      className={`ff-reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
};

export const SectionHeading: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'center' | 'left';
  className?: string;
}> = ({ title, description, align = 'center', className = '' }) => (
  <div
    className={`${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl text-left'} ${className}`}
  >
    <Reveal y={14}>
      <h2 className="ff-display text-3xl sm:text-4xl md:text-[2.85rem] text-[var(--ff-text)]">
        {title}
      </h2>
    </Reveal>
    {description && (
      <Reveal y={14} delay={60}>
        <p className="mt-4 text-base leading-relaxed text-[var(--ff-text-soft)] sm:text-lg">
          {description}
        </p>
      </Reveal>
    )}
  </div>
);

interface ScrubCharProps {
  char: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}

const ScrubChar: React.FC<ScrubCharProps> = ({ char, progress, start, end }) => {
  const opacity = useTransform(progress, [start, end], [0.2, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {char}
    </motion.span>
  );
};

function segmentGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (item) => item.segment);
  }
  return Array.from(text);
}

export const ScrollTextScrub: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className = '' }) => {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const reduced = usePrefersReducedMotion();
  const graphemes = useMemo(() => segmentGraphemes(text), [text]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  if (reduced) {
    return (
      <p ref={containerRef} className={className}>
        {text}
      </p>
    );
  }

  const total = Math.max(1, graphemes.length);

  return (
    <p ref={containerRef} className={className}>
      {graphemes.map((char, idx) => {
        const start = (idx / total) * 0.86;
        const end = Math.min(1, start + 0.14);
        return (
          <ScrubChar
            key={`${idx}-${char}`}
            char={char}
            progress={scrollYProgress}
            start={start}
            end={end}
          />
        );
      })}
    </p>
  );
};
