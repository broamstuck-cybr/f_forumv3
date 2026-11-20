import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';

interface ScrollFillTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

const Word: React.FC<{ word: string; range: [number, number]; progress: MotionValue<number> }> = ({
  word,
  range,
  progress,
}) => {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <motion.span style={{ opacity, display: 'inline-block', whiteSpace: 'pre' }}>{word} </motion.span>
  );
};

export const ScrollFillText: React.FC<ScrollFillTextProps> = ({ text, className, style }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.2'] });
  const words = text.split(' ');
  if (reduced) {
    return (
      <p ref={ref} className={className} style={style}>
        {text}
      </p>
    );
  }
  return (
    <p ref={ref} className={className} style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => {
          const start = index / words.length;
          const end = Math.min(1, start + 1.6 / words.length);
          return <Word key={`${word}-${index}`} word={word} range={[start, end]} progress={scrollYProgress} />;
        })}
      </span>
    </p>
  );
};
