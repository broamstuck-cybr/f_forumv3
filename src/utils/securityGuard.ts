const DEVTOOLS_NOTICE_KEY = 'fforum_v3_devtools_notice_dismissed';
let consoleWarningLogged = false;

export function initConsoleSecurityWarning(): void {
  if (consoleWarningLogged || typeof window === 'undefined') return;
  consoleWarningLogged = true;

  console.warn(
    '%cDỪNG LẠI! Cảnh báo bảo mật F-Forum',
    'color:#d97706;font-size:20px;font-weight:700;letter-spacing:-0.01em;'
  );
  console.warn(
    '%cĐây là khu vực dành cho lập trình viên. Không dán mã lạ hoặc chia sẻ token/phiên đăng nhập vào Console để tránh rủi ro Self-XSS và truy cập trái phép. Dữ liệu công khai được giới hạn theo chính sách bảo mật F-Forum.',
    'color:inherit;font-size:13px;line-height:1.5;'
  );
}

export function isDevToolsProbablyOpen(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.outerWidth === 0 || window.outerHeight === 0) return false;
  if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) {
    return false;
  }

  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  if (widthDiff <= 200 && heightDiff <= 180) return false;

  // WHY: Exclude proportional browser zoom (e.g. 125%-150%) where fixed browser chrome (~96px) offsets innerHeight/outerHeight ratio.
  if (widthDiff > 160 && heightDiff >= 100) {
    const wRatio = window.innerWidth / window.outerWidth;
    const hChromeRatio = window.innerHeight / Math.max(1, window.outerHeight - 96);
    const hRawRatio = window.innerHeight / window.outerHeight;
    if (Math.abs(wRatio - hChromeRatio) < 0.08 || Math.abs(wRatio - hRawRatio) < 0.12) {
      return false;
    }
  }

  return true;
}

export function isDevToolsNoticeDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(DEVTOOLS_NOTICE_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissDevToolsNotice(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(DEVTOOLS_NOTICE_KEY, '1');
  } catch {
    void 0;
  }
}

export function subscribeDevToolsState(onChange: (open: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  let timerId = 0;
  let rafId = 0;
  let lastState = isDevToolsProbablyOpen();
  onChange(lastState);

  const scheduleCheck = () => {
    window.clearTimeout(timerId);
    window.cancelAnimationFrame(rafId);
    timerId = window.setTimeout(() => {
      rafId = window.requestAnimationFrame(() => {
        const next = isDevToolsProbablyOpen();
        if (next !== lastState) {
          lastState = next;
          onChange(next);
        }
      });
    }, 180);
  };

  window.addEventListener('resize', scheduleCheck, { passive: true });
  return () => {
    window.clearTimeout(timerId);
    window.cancelAnimationFrame(rafId);
    window.removeEventListener('resize', scheduleCheck);
  };
}
