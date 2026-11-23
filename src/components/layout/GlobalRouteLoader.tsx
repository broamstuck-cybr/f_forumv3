import React from 'react';
import './global-loader.css';

export interface GlobalRouteLoaderProps {
  visible: boolean;
  label?: string;
}

export const GlobalRouteLoader: React.FC<GlobalRouteLoaderProps> = ({
  visible,
  label = 'Đang chuyển không gian...',
}) => {
  if (!visible) return null;

  return (
    <div className="ff-loader-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="ff-loader-card">
        <div className="ff-loader-sys" aria-hidden="true">
          <div
            className="ff-loader-orbit"
            style={{ '--d': '124px', '--tilt': '-18deg' } as React.CSSProperties}
          >
            <div className="ff-loader-spin" style={{ '--dur': '1.6s' } as React.CSSProperties}>
              <span className="ff-loader-planet" style={{ '--dot': '#38c99a' } as React.CSSProperties} />
            </div>
          </div>
          <div
            className="ff-loader-orbit"
            style={{ '--d': '92px', '--tilt': '24deg' } as React.CSSProperties}
          >
            <div className="ff-loader-spin" style={{ '--dur': '2.1s' } as React.CSSProperties}>
              <span className="ff-loader-planet" style={{ '--dot': '#8cbcc8' } as React.CSSProperties} />
            </div>
          </div>
          <div
            className="ff-loader-orbit"
            style={{ '--d': '66px', '--tilt': '-56deg' } as React.CSSProperties}
          >
            <div className="ff-loader-spin" style={{ '--dur': '1.35s' } as React.CSSProperties}>
              <span className="ff-loader-planet" style={{ '--dot': '#e6b385' } as React.CSSProperties} />
            </div>
          </div>
          <span className="ff-loader-core" />
        </div>
        <p className="ff-loader-title">F-Forum</p>
        <p className="ff-loader-sub">{label}</p>
      </div>
    </div>
  );
};

export default GlobalRouteLoader;
