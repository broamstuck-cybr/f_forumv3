import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: 'div' | 'section' | 'li' | 'span' | 'article' | 'figure' | 'header';
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className,
  style,
  as = 'div',
}) => {
  const reduced = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;
  if (reduced) {
    const Plain = as as 'div';
    return (
      <Plain className={className} style={style}>
        {children}
      </Plain>
    );
  }
  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </Tag>
  );
};
