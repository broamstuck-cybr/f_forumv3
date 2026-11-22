import React, { useMemo, useState } from 'react';
import { RotateCw } from 'lucide-react';
import {
  MOTION_PATTERNS,
  buildMotionPatternDocument,
  getMotionPatternDoc,
  suggestPatternFor,
  type MotionPatternId,
} from './motionPatterns';
import './motion-lab.css';

export interface MotionLabProps {
  title: string;
  tags: string[];
  category: string;
  theme: 'dark' | 'light';
  reduced?: boolean;
  className?: string;
  onCopySnippet?: (kind: 'html' | 'css' | 'js', value: string) => void;
}

type LabTab = 'html' | 'css' | 'js';

/**
 * Phòng thử chuyển động: khung chạy thật + mã nguồn thật của cùng một mẫu.
 *
 * Mỗi mục catalog chọn sẵn pattern gần nhất theo nhãn của nó, nhưng người dùng
 * đổi được sang mẫu khác để so sánh — mọi mẫu đều chạy được ngay, không có
 * mục nào chỉ hiện mô tả.
 */
export const MotionLab: React.FC<MotionLabProps> = ({
  title,
  tags,
  category,
  theme,
  reduced = false,
  className = '',
}) => {
  const suggested = useMemo(() => suggestPatternFor(tags, category, title), [tags, category, title]);
  const [pattern, setPattern] = useState<MotionPatternId>(suggested);
  const [tab, setTab] = useState<LabTab>('html');
  const [nonce, setNonce] = useState(0);

  const meta = MOTION_PATTERNS.find((entry) => entry.id === pattern) ?? MOTION_PATTERNS[0];
  const srcDoc = useMemo(
    () => buildMotionPatternDocument(pattern, theme),
    [pattern, theme, nonce]
  );
  const code = useMemo(() => getMotionPatternDoc(pattern), [pattern]);

  return (
    <div className={`mlab ${className}`} data-theme={theme}>
      <div className="mlab-stage">
        <iframe
          key={`${pattern}-${theme}-${nonce}`}
          title={`${meta.label} — bản chạy trực tiếp`}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          className="mlab-frame"
          loading="lazy"
        />
        <div className="mlab-overlay">
          <span className="mlab-now">{meta.label}</span>
          <div className="mlab-tools">
            <button
              type="button"
              className="mlab-tool"
              aria-label="Chạy lại mẫu"
              title="Chạy lại mẫu"
              onClick={() => setNonce((n) => n + 1)}
            >
              <RotateCw size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="mlab-bar">
        <div className="mlab-chiprow" role="group" aria-label="Chọn mẫu chuyển động">
          {MOTION_PATTERNS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="mlab-chip"
              aria-pressed={pattern === entry.id}
              onClick={() => setPattern(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <p className="mlab-hint">
          {meta.hint} <span className="mlab-kb">{reduced ? 'Đã tôn trọng giảm chuyển động.' : meta.keyboard}</span>
        </p>
      </div>

      <div className="mlab-code">
        <div className="mlab-codebar" role="tablist" aria-label="Mã nguồn của mẫu đang chạy">
          {(['html', 'css', 'js'] as LabTab[]).map((entry) => (
            <button
              key={entry}
              type="button"
              role="tab"
              aria-selected={tab === entry}
              className="mlab-codetab"
              onClick={() => setTab(entry)}
            >
              {entry.toUpperCase()}
            </button>
          ))}
          <span className="mlab-codenote">chính là mã đang chạy trong khung</span>
        </div>
        <pre className="mlab-pre" tabIndex={0}>
          <code>{code[tab]}</code>
        </pre>
      </div>
    </div>
  );
};

export default MotionLab;
