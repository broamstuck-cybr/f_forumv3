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
        viewBox="0 0 420 68"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <path
          className="foot__sigPath"
          d="M18 46 C 95 62, 230 10, 388 22 C 340 34, 240 48, 178 52 C 238 42, 316 32, 372 44"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="foot__sigStar"
          d="M394 12 L397 20 L405 23 L397 26 L394 34 L391 26 L383 23 L391 20 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

export default StreetGraffitiMark;
