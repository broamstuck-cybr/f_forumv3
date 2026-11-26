import React, { useEffect, useState } from 'react';
import { IconLayers, IconRotateCw } from '../../ui/icons';

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
  const [overlay, setOverlay] = useState(0);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [align, setAlign] = useState<'left' | 'center'>('left');
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setVideoFailed(false);
  }, [videoSrc]);

  const reset = () => {
    setBlur(0);
    setOverlay(0);
    setShowTextPreview(false);
    setAlign('left');
  };

  return (
    <div className="ex-bg-lab" data-align={align}>
      {!videoFailed ? (
        <video
          className="ex-bg-lab-video"
          src={videoSrc}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          style={{ filter: blur > 0 ? `blur(${blur}px)` : undefined }}
          aria-label={`Nền động ${title}`}
          onError={() => setVideoFailed(true)}
        />
      ) : poster ? (
        <img
          className="ex-bg-lab-video"
          src={poster}
          alt={title}
          referrerPolicy="no-referrer"
          style={{ filter: blur > 0 ? `blur(${blur}px)` : undefined }}
        />
      ) : null}

      {overlay > 0 && (
        <div
          className="ex-bg-lab-scrim"
          style={{ background: `rgba(5, 8, 10, ${overlay / 100})` }}
          aria-hidden="true"
        />
      )}

      {showTextPreview && (
        <div className="ex-bg-lab-content">
          <span className="ex-bg-lab-kicker">
            <IconLayers size={13} aria-hidden="true" />
            GetLayers · {title}
          </span>
          <h2>{title}</h2>
        </div>
      )}

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
            min={0}
            max={78}
            step={1}
            value={overlay}
            onChange={(event) => setOverlay(Number(event.target.value))}
          />
          <output>{overlay}%</output>
        </label>
        <div className="ex-bg-lab-seg" role="group" aria-label="Kiểm tra chữ trên nền">
          <button
            type="button"
            aria-pressed={showTextPreview}
            onClick={() => {
              setShowTextPreview((prev) => {
                const next = !prev;
                if (next && overlay === 0) setOverlay(36);
                return next;
              });
            }}
          >
            Thử chữ
          </button>
          {showTextPreview && (
            <>
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
            </>
          )}
        </div>
        <button
          type="button"
          className="ex-bg-lab-reset"
          onClick={reset}
          aria-label="Đặt lại nền mẫu"
          title="Đặt lại"
        >
          <IconRotateCw size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default BackgroundLab;
