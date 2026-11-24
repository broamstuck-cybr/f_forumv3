import React, { useState } from 'react';
import { Layers, RotateCw } from 'lucide-react';

interface BackgroundLabProps {
  title: string;
  videoSrc: string;
  poster?: string;
}

export const BackgroundLab: React.FC<BackgroundLabProps> = ({
  title,
  videoSrc,
  poster,
}) => {
  const [blur, setBlur] = useState(0);
  const [overlay, setOverlay] = useState(42);
  const [align, setAlign] = useState<'left' | 'center'>('left');

  const reset = () => {
    setBlur(0);
    setOverlay(42);
    setAlign('left');
  };

  return (
    <div className="ex-bg-lab" data-align={align}>
      <video
        className="ex-bg-lab-video"
        src={videoSrc}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        style={{ filter: `blur(${blur}px) saturate(1.05)` }}
        aria-label={`Nền động ${title}`}
      />
      <div
        className="ex-bg-lab-scrim"
        style={{ background: `rgba(5, 8, 10, ${overlay / 100})` }}
        aria-hidden="true"
      />
      <div className="ex-bg-lab-content">
        <span className="ex-bg-lab-kicker">
          <Layers size={13} aria-hidden="true" />
          GetLayers · nền động
        </span>
        <h2>{title}</h2>
        <p>
          Đây là trang mẫu chạy trên chính video nền. Kéo độ mờ và độ phủ để kiểm
          tra tương phản chữ trước khi dùng.
        </p>
      </div>

      <div className="ex-bg-lab-controls" aria-label="Điều khiển nền mẫu">
        <label>
          <span>Độ mờ nền</span>
          <input
            type="range"
            min={0}
            max={16}
            step={1}
            value={blur}
            onChange={(event) => setBlur(Number(event.target.value))}
          />
          <output>{blur}px</output>
        </label>
        <label>
          <span>Độ phủ tối</span>
          <input
            type="range"
            min={10}
            max={78}
            step={1}
            value={overlay}
            onChange={(event) => setOverlay(Number(event.target.value))}
          />
          <output>{overlay}%</output>
        </label>
        <div className="ex-bg-lab-seg" role="group" aria-label="Căn nội dung">
          <button
            type="button"
            aria-pressed={align === 'left'}
            onClick={() => setAlign('left')}
          >
            Trái
          </button>
          <button
            type="button"
            aria-pressed={align === 'center'}
            onClick={() => setAlign('center')}
          >
            Giữa
          </button>
        </div>
        <button
          type="button"
          className="ex-bg-lab-reset"
          onClick={reset}
          aria-label="Đặt lại nền mẫu"
          title="Đặt lại"
        >
          <RotateCw size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default BackgroundLab;
