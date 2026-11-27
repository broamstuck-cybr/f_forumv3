import React, { useState } from 'react';
import type { AppRoute } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { StreetGraffitiMark } from '../brand/StreetGraffitiMark';
import { PinHeartButton } from '../pinui';
import './app-shell.css';

interface AppFooterProps {
  onNavigate: (route: AppRoute) => void;
  onOpenNotice: () => void;
}

const PRODUCT: Array<{ id: AppRoute; label: string; labelEn: string }> = [
  { id: 'home', label: 'Trang chủ', labelEn: 'Home' },
  { id: 'explore', label: 'Khám phá', labelEn: 'Explore' },
  { id: 'workspace', label: 'Workspace', labelEn: 'Workspace' },
  { id: 'community', label: 'Cộng đồng', labelEn: 'Community' },
];

const ACCOUNT: Array<{ id: AppRoute; label: string; labelEn: string }> = [
  { id: 'profile', label: 'Hồ sơ', labelEn: 'Profile' },
  { id: 'settings', label: 'Cài đặt', labelEn: 'Settings' },
  { id: 'landing', label: 'Giới thiệu', labelEn: 'Overview' },
];

export const AppFooter: React.FC<AppFooterProps> = ({ onNavigate, onOpenNotice }) => {
  const { settings, language } = useAppStore();
  const isEn = language === 'en';
  const isFabulous = settings.uiMode === 'fabulous';
  const [footLiked, setFootLiked] = useState(false);

  return (
    <footer className="foot">
      <div className="wrap-wide">
        <div className="foot__grid">
          <p className="t-title" style={{ maxWidth: '16ch' }}>
            {isEn ? (
              <>
                From sketch <span className="t-note">to live site.</span>
              </>
            ) : (
              <>
                Từ phác thảo <span className="t-note">đến sản phẩm.</span>
              </>
            )}
          </p>
          <div className="foot__cols">
            <div className="foot__col" role="region" aria-labelledby="foot-col-product">
              <h3 id="foot-col-product">{isEn ? 'product' : 'sản phẩm'}</h3>
              <ul>
                {PRODUCT.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="foot__link" onClick={() => onNavigate(item.id)}>
                      {isEn ? item.labelEn : item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="foot__col" role="region" aria-labelledby="foot-col-account">
              <h3 id="foot-col-account">{isEn ? 'account' : 'tài khoản'}</h3>
              <ul>
                {ACCOUNT.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="foot__link" onClick={() => onNavigate(item.id)}>
                      {isEn ? item.labelEn : item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="foot__col" role="region" aria-labelledby="foot-col-info">
              <h3 id="foot-col-info">{isEn ? 'info' : 'thông tin'}</h3>
              <ul>
                <li>
                  <button type="button" className="foot__link" onClick={onOpenNotice}>
                    {isEn ? 'Credits' : 'Ghi công'}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="foot__graffiti">
          <StreetGraffitiMark />
        </div>
        <div className="foot__base">
          <p className="t-label">F-Forum</p>
          {isFabulous && (
            <PinHeartButton
              liked={footLiked}
              count={footLiked ? 201 : 200}
              onToggle={() => setFootLiked((v) => !v)}
              compact
              ariaLabel="Thích F-Forum Fabulous"
            />
          )}
          <p className="t-label">2026</p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
