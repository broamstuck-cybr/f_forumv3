import React from 'react';

export interface StreetGraffitiMarkProps {
  className?: string;
}

export const StreetGraffitiMark: React.FC<StreetGraffitiMarkProps> = ({ className = '' }) => {
  return (
    <div aria-label="F-Forum signature" className={`foot__sig street-graffiti-mark ${className}`.trim()}>
      <span className="foot__sigText">F-Forum</span>
      <svg
        className="foot__sigFlourish"
        viewBox="0 0 1200 76"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <path
          className="foot__sigPath"
          d="M 10 50 C 310 68, 760 12, 1148 24 C 980 38, 690 54, 420 58 C 720 44, 980 34, 1126 44"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="foot__sigStar"
          d="M1164 10 L1168 20 L1178 24 L1168 28 L1164 38 L1160 28 L1150 24 L1160 20 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

export default StreetGraffitiMark;
