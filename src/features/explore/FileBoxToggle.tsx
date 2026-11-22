import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface FileBoxToggleProps {
  open: boolean;
  theme: 'dark' | 'light';
  count: number;
  onToggle: (next: boolean) => void;
  className?: string;
}

/**
 * Nút "Hộp File 3D" đặt ngay dưới dòng gợi ý tìm kiếm.
 *
 * Hộp là một khối isometric vẽ bằng SVG thuần: ba mặt sáng tối theo một nguồn
 * sáng duy nhất, nắp mở theo đúng trạng thái của tủ hồ sơ bên dưới. Khi tủ
 * đóng, nắp khép; khi mở, nắp bật lên và các "thẻ hồ sơ" nhô ra khỏi miệng hộp.
 * Toàn bộ chuyển động là CSS transform nên không có canvas riêng phải dọn.
 */
export const FileBoxToggle: React.FC<FileBoxToggleProps> = ({ open, theme, count, onToggle, className = '' }) => {
  const reduced = Boolean(useReducedMotion());
  const [hovered, setHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const node = buttonRef.current;
    if (!node || reduced) return undefined;
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      node.style.setProperty('--bx-tilt-x', `${(-y * 8).toFixed(2)}deg`);
      node.style.setProperty('--bx-tilt-y', `${(x * 10).toFixed(2)}deg`);
    };
    const reset = () => {
      node.style.setProperty('--bx-tilt-x', '0deg');
      node.style.setProperty('--bx-tilt-y', '0deg');
    };
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', reset);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', reset);
    };
  }, [reduced]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`filebox-toggle ${className}`}
      data-theme={theme}
      data-open={open ? 'true' : 'false'}
      data-hover={hovered ? 'true' : 'false'}
      aria-expanded={open}
      aria-controls="cabinet-veil"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={() => onToggle(!open)}
    >
      <span className="filebox-toggle-scene" aria-hidden="true">
        <span className="filebox-toggle-shadow" />
        <span className="filebox-toggle-box">
          <span className="filebox-toggle-lid" />
          <span className="filebox-toggle-front" />
          <span className="filebox-toggle-side" />
          <span className="filebox-toggle-cards">
            <i /><i /><i />
          </span>
        </span>
      </span>
      <span className="filebox-toggle-copy">
        <span className="filebox-toggle-label">Hộp File 3D</span>
        <span className="filebox-toggle-note">
          {open ? 'Bấm để đóng tủ hồ sơ' : `${count} tài nguyên đang nằm trong tủ`}
        </span>
      </span>
      <motion.span
        className="filebox-toggle-arrow"
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: reduced ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </motion.span>
    </button>
  );
};

export default FileBoxToggle;
