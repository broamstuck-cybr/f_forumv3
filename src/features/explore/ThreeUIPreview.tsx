import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Pause, Play, RotateCcw } from 'lucide-react';
import './threeui-preview.css';

type ThreeUIPreviewEntry = {
  v?: string;
  t?: string;
  r?: boolean;
};

type ThreeUIPreviewIndex = {
  count: number;
  items: Record<string, ThreeUIPreviewEntry>;
};

let previewIndex: ThreeUIPreviewIndex | null = null;
let previewRequest: Promise<ThreeUIPreviewIndex> | null = null;

function loadThreeUIPreviews(): Promise<ThreeUIPreviewIndex> {
  if (previewIndex) return Promise.resolve(previewIndex);
  if (!previewRequest) {
    previewRequest = fetch('/data/threeui-previews.json?v=2026-11-24-free')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ThreeUIPreviewIndex>;
      })
      .then((data) => {
        previewIndex = {
          count: Number(data?.count) || 0,
          items: data?.items && typeof data.items === 'object' ? data.items : {},
        };
        return previewIndex;
      })
      .catch((err) => {
        previewRequest = null;
        throw err;
      });
  }
  return previewRequest;
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const total = Math.floor(value);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export const ThreeUIPreview: React.FC<{
  itemId: string;
  title: string;
  image?: string;
  sourceUrl?: string;
}> = ({ itemId, title, image }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [entry, setEntry] = useState<ThreeUIPreviewEntry | null>(null);
  const [playing, setPlaying] = useState(true);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setEntry(null);
    setFailed(false);
    loadThreeUIPreviews()
      .then((data) => {
        if (!cancelled) setEntry(data.items[itemId] ?? null);
      })
      .catch(() => {
        if (!cancelled) setEntry(null);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const videoSrc = entry?.v || '';
  const poster = entry?.t || image || '';
  const hasVideo = Boolean(videoSrc) && !failed;

  useEffect(() => {
    setProgress(0);
    setDuration(0);
    setPlaying(true);
    setFailed(false);
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    video.load();
    video.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    );
  }, [videoSrc]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      );
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    );
  };

  const seek = (value: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = (value / 1000) * video.duration;
    setProgress(value);
  };

  const openFullscreen = () => {
    const node = stageRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void node.requestFullscreen?.().catch(() => undefined);
  };

  const timeLabel = useMemo(
    () => `${formatTime((progress / 1000) * duration)} / ${formatTime(duration)}`,
    [duration, progress]
  );

  return (
    <div className="ex-3ui" ref={stageRef} data-ready={hasVideo ? 'true' : 'false'}>
      <div className="ex-3ui-stage">
        {hasVideo ? (
          <video
            ref={videoRef}
            className="ex-3ui-media"
            src={videoSrc}
            poster={poster || undefined}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`Xem trước chuyển động 3D: ${title}`}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (!Number.isFinite(video.duration) || video.duration <= 0) return;
              setDuration(video.duration);
              setProgress((video.currentTime / video.duration) * 1000);
            }}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setFailed(true)}
          />
        ) : poster ? (
          <img className="ex-3ui-media ex-3ui-media--still" src={poster} alt={title} />
        ) : (
          <div className="ex-3ui-empty">
            <span className="t-label">Không gian 3D</span>
            <strong>{title}</strong>
          </div>
        )}

        <div className="ex-3ui-scrim" aria-hidden="true" />
        <div className="ex-3ui-head">
          <span className="ex-3ui-kicker">
            <span className="ex-3ui-dot" aria-hidden="true" />
            {hasVideo ? 'Cảnh 3D công khai · chuyển động' : 'Cảnh 3D · xem trước'}
          </span>
          <h2>{title}</h2>
        </div>
        <div className="ex-3ui-hint">
          {hasVideo
            ? 'Tua thanh thời gian hoặc mở toàn màn hình để xem trực tiếp từng góc chuyển động ngay tại đây.'
            : 'Xem trực tiếp bố cục 3D và nạp thẳng vào Workspace để tinh chỉnh.'}
        </div>
      </div>

      <div className="ex-3ui-bar">
        {hasVideo ? (
          <>
            <button
              type="button"
              className="ex-3ui-icon"
              onClick={togglePlay}
              aria-label={playing ? 'Tạm dừng cảnh 3D' : 'Phát cảnh 3D'}
              title={playing ? 'Tạm dừng' : 'Phát'}
            >
              {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="ex-3ui-icon"
              onClick={restart}
              aria-label="Phát lại cảnh 3D từ đầu"
              title="Phát lại từ đầu"
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>
            <input
              className="ex-3ui-range"
              type="range"
              min={0}
              max={1000}
              step={1}
              value={progress}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="Tua cảnh 3D"
            />
            <span className="ex-3ui-time">{timeLabel}</span>
          </>
        ) : (
          <span className="ex-3ui-time">Xem trước trực tiếp trên F-Forum</span>
        )}

        <div className="ex-3ui-actions">
          <button
            type="button"
            className="ex-3ui-icon"
            onClick={openFullscreen}
            aria-label="Xem cảnh 3D toàn màn hình"
            title="Toàn màn hình"
          >
            <Maximize2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreeUIPreview;
