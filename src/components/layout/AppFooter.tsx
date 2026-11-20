import React from 'react';
import type { AppRoute } from '../../types/index';
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
  { id: 'landing', label: 'Câu chuyện' },
];

const SOURCES: Array<{ href: string; label: string }> = [
  { href: 'https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI', label: 'Kho tri thức' },
  { href: 'https://www.pinui.xyz/', label: 'Pin UI' },
  { href: 'https://github.com/broamstuck-cybr/f_forumv3', label: 'Mã nguồn' },
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
            <nav className="foot__col" aria-label="Nguồn">
              <h3>nguồn</h3>
              <ul>
                {SOURCES.map((item) => (
                  <li key={item.href}>
                    <a className="foot__link" href={item.href} target="_blank" rel="noreferrer">
                      {item.label}
                    </a>
                  </li>
                ))}
                <li>
                  <button type="button" className="foot__link" onClick={onOpenNotice}>
                    Ghi công
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <p className="foot__mark" aria-hidden="true">
          F<i>-</i>Forum
        </p>
        <div className="foot__base">
          <p className="t-label">F-Forum v3, giấy phép MIT</p>
          <p className="t-label">F-Forum, 2026</p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
