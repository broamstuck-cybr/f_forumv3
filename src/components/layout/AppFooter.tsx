import React from 'react';
import type { AppRoute } from '../../types/index';
import { StreetGraffitiMark } from '../brand/StreetGraffitiMark';
import './app-shell.css';

interface AppFooterProps {
  onNavigate: (route: AppRoute) => void;
  onOpenNotice: () => void;
}

const PRODUCT: Array<{ id: AppRoute; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'explore', label: 'Khám phá' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'community', label: 'Tri thức' },
];

const ACCOUNT: Array<{ id: AppRoute; label: string }> = [
  { id: 'profile', label: 'Hồ sơ' },
  { id: 'settings', label: 'Cài đặt' },
  { id: 'landing', label: 'Giới thiệu' },
];

export const AppFooter: React.FC<AppFooterProps> = ({ onNavigate, onOpenNotice }) => {
  return (
    <footer className="foot">
      <div className="wrap-wide">
        <div className="foot__grid">
          <p className="t-title" style={{ maxWidth: '16ch' }}>
            Viết bằng AI. Chấm bằng <span className="t-note">bút đỏ.</span>
          </p>
          <div className="foot__cols">
            <nav className="foot__col" aria-label="Sản phẩm">
              <h3>sản phẩm</h3>
              <ul>
                {PRODUCT.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="foot__link" onClick={() => onNavigate(item.id)}>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <nav className="foot__col" aria-label="Tài khoản">
              <h3>tài khoản</h3>
              <ul>
                {ACCOUNT.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="foot__link" onClick={() => onNavigate(item.id)}>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <nav className="foot__col" aria-label="Thông tin">
              <h3>thông tin</h3>
              <ul>
                <li>
                  <button type="button" className="foot__link" onClick={onOpenNotice}>
                    Ghi công
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="foot__graffiti">
          <StreetGraffitiMark />
        </div>
        <div className="foot__base">
          <p className="t-label">F-Forum v3, giấy phép MIT</p>
          <p className="t-label">F-Forum, 2026</p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
