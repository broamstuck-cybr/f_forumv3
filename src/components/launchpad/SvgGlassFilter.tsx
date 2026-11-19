import React from 'react';

export const SvgGlassFilter: React.FC = () => (
  <svg
    aria-hidden="true"
    className="pointer-events-none fixed h-0 w-0 opacity-0"
    focusable="false"
  >
    <defs>
      <filter id="ff-liquid-glass-refract" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.018"
          numOctaves="2"
          seed="7"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="3.5"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
);

export default SvgGlassFilter;
