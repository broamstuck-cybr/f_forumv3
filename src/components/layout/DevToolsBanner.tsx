import React, { useEffect, useState } from 'react';
import { IconShieldAlert, IconX } from '../../ui/icons';
import {
  dismissDevToolsNotice,
  isDevToolsNoticeDismissed,
  subscribeDevToolsState,
} from '../../utils/securityGuard';
import './devtools-banner.css';

export const DevToolsBanner: React.FC = () => {
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => isDevToolsNoticeDismissed());

  useEffect(() => {
    return subscribeDevToolsState(setDevToolsOpen);
  }, []);

  if (!devToolsOpen || dismissed) return null;

  const handleDismiss = () => {
    dismissDevToolsNotice();
    setDismissed(true);
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Thông báo bảo mật trình duyệt"
      className="ff-devtools-banner"
    >
      <span className="ff-devtools-banner__icon" aria-hidden="true">
        <IconShieldAlert size={18} />
      </span>
      <div className="ff-devtools-banner__copy">
        <strong className="ff-devtools-banner__title">Bảo vệ phiên F-Forum</strong>
        <p className="ff-devtools-banner__body">
          Không dán mã từ nguồn không tin cậy vào Console. Các điểm cuối công khai đều áp dụng giới hạn dữ liệu và tốc độ truy cập.
        </p>
      </div>
      <button
        type="button"
        className="icon-btn ff-devtools-banner__close"
        aria-label="Đóng cảnh báo bảo mật"
        title="Đóng"
        onClick={handleDismiss}
      >
        <IconX size={16} aria-hidden="true" />
      </button>
    </aside>
  );
};

export default DevToolsBanner;
