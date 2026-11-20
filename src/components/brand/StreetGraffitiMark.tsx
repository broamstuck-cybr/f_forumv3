import React from 'react';

export interface StreetGraffitiMarkProps {
  className?: string;
}

export const StreetGraffitiMark: React.FC<StreetGraffitiMarkProps> = ({ className = '' }) => {
  return (
    <div aria-label="F-FORUM" className={`foot__sig street-graffiti-mark ${className}`.trim()}>
      <span className="foot__sigText">F-FORUM</span>
    </div>
  );
};

export default StreetGraffitiMark;
