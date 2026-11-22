/**
 * Đồng bộ chuyển Sáng / Tối với hiệu ứng PinUI.
 *
 * Nguyên tắc: biến CSS của theme mới phải được ghi vào `documentElement`
 * NGAY TRONG lúc hiệu ứng đang chạy — không đợi hiệu ứng kết thúc rồi mới
 * đổi màu nền. Ở đây chúng ta:
 *
 *  1. Ghi theme đồng bộ (không chờ vòng render React) đúng nhịp flood của
 *     giọt nước / mưa, khi lớp flood đã phủ phần lớn khung hình.
 *  2. Bật `data-theme-blend` trong khoảng chuyển tiếp để các bề mặt tween
 *     màu 360ms thay vì nhảy khựng.
 *  3. Trả về đúng màu nền / màu phủ để engine PinUI dùng cho giọt, vũng
 *     nước và lớp flood, nhờ vậy hiệu ứng và theme là cùng một hệ màu.
 */

export type TransitionTheme = 'light' | 'dark';

interface ThemePaint {
  /** Màu nền gốc của theme — dùng cho lớp flood phủ toàn khung hình. */
  bg: string;
  /** Bề mặt nổi (thẻ, panel) — dùng cho thân giọt nước để có khối. */
  raised: string;
  /** Viền mảnh của theme — dùng cho vòng ripple. */
  line: string;
}

const PAINT: Record<TransitionTheme, ThemePaint> = {
  dark: { bg: '#11100f', raised: '#181716', line: 'rgba(243,238,227,0.18)' },
  light: { bg: '#f5f1e8', raised: '#fbf8f1', line: 'rgba(20,18,14,0.18)' },
};

export function themePaint(theme: TransitionTheme): ThemePaint {
  return PAINT[theme];
}

let blendTimer = 0;

/**
 * Bật chế độ tween màu trên toàn trang. Gọi ngay trước khi ghi theme mới;
 * `closeThemeBlend` gọi sau khi hiệu ứng kết thúc.
 */
export function openThemeBlend(durationMs = 620): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme-blend', 'open');
  if (blendTimer) window.clearTimeout(blendTimer);
  blendTimer = window.setTimeout(() => {
    root.removeAttribute('data-theme-blend');
    blendTimer = 0;
  }, durationMs);
}

export function closeThemeBlend(): void {
  if (typeof document === 'undefined') return;
  if (blendTimer) {
    window.clearTimeout(blendTimer);
    blendTimer = 0;
  }
  document.documentElement.removeAttribute('data-theme-blend');
}

/**
 * Ghi theme vào DOM ngay lập tức. Store sẽ ghi lại lần nữa trong effect —
 * cùng giá trị nên không tạo nhịp nháy nào.
 */
export function writeThemeToDom(theme: TransitionTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (root.getAttribute('data-theme') !== theme) {
    root.setAttribute('data-theme', theme);
  }
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#121110' : '#f4f0e6');
}

/**
 * Chuyển theme có pha trộn màu (dùng cho toggle tức thời, reduced-motion
 * hoặc khi hiệu ứng bị tắt): ghi DOM ngay + bật blend trong 360ms.
 */
export function commitThemeBlended(theme: TransitionTheme): void {
  openThemeBlend(420);
  writeThemeToDom(theme);
}
