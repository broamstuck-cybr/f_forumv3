import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IconMaximize2, IconPause, IconPlay, IconRotateCcw } from '../../ui/icons';
import { SandboxPreview } from './SandboxPreview';
import {
  VAULT_CACHE_VERSION,
  fetchVaultIndex,
  fetchVaultShard,
  getCachedVaultIndex,
  getCachedVaultShard,
} from './vaultLoader';
import './threeui-preview.css';

type ThreeUIPreviewEntry = {
  v?: string;
  t?: string;
  r?: boolean;
  s?: string;
};

type ThreeUIPreviewIndex = {
  count: number;
  items: Record<string, ThreeUIPreviewEntry>;
};

const PLAYBACK_RATES = [0.5, 1, 1.5] as const;

let previewIndex: ThreeUIPreviewIndex | null = null;
let previewRequest: Promise<ThreeUIPreviewIndex> | null = null;

function loadThreeUIPreviews(): Promise<ThreeUIPreviewIndex> {
  if (previewIndex) return Promise.resolve(previewIndex);
  if (!previewRequest) {
    previewRequest = fetch(`/data/threeui-previews.json?v=${VAULT_CACHE_VERSION}`)
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
  videoUrl?: string;
  sourceUrl?: string;
  html?: string;
  css?: string;
}> = ({ itemId, title, image, videoUrl, html, css }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startTime: number;
    wasPlaying: boolean;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startTime: 0,
    wasPlaying: false,
  });

  const cleanId = useMemo(() => itemId.replace(/^threeui\//, ''), [itemId]);

  const [liveScene, setLiveScene] = useState<{ html: string; css: string } | null>(() =>
    html?.trim() ? { html, css: css ?? '' } : null
  );
  const [loadingLive, setLoadingLive] = useState(() => !html?.trim());
  const [reloadNonce, setReloadNonce] = useState(0);

  const [entry, setEntry] = useState<ThreeUIPreviewEntry | null>(null);
  const [playing, setPlaying] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [rateIndex, setRateIndex] = useState(1);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setEntry(null);
    setFailed(false);

    if (html?.trim()) {
      setLiveScene({ html, css: css ?? '' });
      setLoadingLive(false);
      return () => {
        cancelled = true;
      };
    }

    const resolveLiveScene = async () => {
      try {
        const cachedIndex = getCachedVaultIndex();
        const indexData = cachedIndex ?? (await fetchVaultIndex());
        const vaultItem = indexData.items.find(
          (it) => it.l === 'threeui' && (it.i === cleanId || it.i === itemId)
        );
        if (vaultItem?.s) {
          const cachedShard = getCachedVaultShard(vaultItem.s);
          const shard = cachedShard ?? (await fetchVaultShard(vaultItem.s));
          const payload = shard[vaultItem.i] ?? shard[cleanId] ?? shard[itemId];
          if (!cancelled && payload?.h?.trim()) {
            setLiveScene({ html: payload.h, css: payload.c ?? '' });
            setLoadingLive(false);
            return;
          }
        }
      } catch {
        // Fallback to preview index below
      }

      try {
        const data = await loadThreeUIPreviews();
        if (!cancelled) {
          const matched = data.items[cleanId] ?? data.items[itemId] ?? null;
          setEntry(matched);
          if (matched?.s) {
            const shard = await fetchVaultShard(matched.s);
            const payload = shard[cleanId] ?? shard[itemId];
            if (!cancelled && payload?.h?.trim()) {
              setLiveScene({ html: payload.h, css: payload.c ?? '' });
              setLoadingLive(false);
              return;
            }
          }
          setLiveScene(null);
          setLoadingLive(false);
        }
      } catch {
        if (!cancelled) {
          setEntry(null);
          setLiveScene(null);
          setLoadingLive(false);
        }
      }
    };

    setLiveScene(null);
    setLoadingLive(true);
    void resolveLiveScene();

    return () => {
      cancelled = true;
    };
  }, [cleanId, itemId, html, css]);

  const hasLiveHtml = Boolean(liveScene?.html);
  const videoSrc = !hasLiveHtml ? videoUrl || entry?.v || '' : '';
  const poster = !hasLiveHtml ? entry?.t || image || '' : '';
  const hasVideo = Boolean(videoSrc) && !failed;
  const playbackRate = PLAYBACK_RATES[rateIndex];

  useEffect(() => {
    setProgress(0);
    setDuration(0);
    setPlaying(true);
    setFailed(false);
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    video.load();
    video.playbackRate = playbackRate;
    video.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    );
  }, [videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = playbackRate;
  }, [playbackRate]);

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
    if (hasLiveHtml) {
      setReloadNonce((n) => n + 1);
      return;
    }
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
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = (value / 1000) * video.duration;
    setProgress(value);
  };

  const cycleRate = () => {
    setRateIndex((idx) => (idx + 1) % PLAYBACK_RATES.length);
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

  const onStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (hasLiveHtml || !hasVideo || e.button !== 0) return;
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startTime: video.currentTime,
      wasPlaying: !video.paused,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const dx = e.clientX - dragRef.current.startX;
    if (!dragRef.current.moved && Math.abs(dx) < 4) return;
    if (!dragRef.current.moved) {
      dragRef.current.moved = true;
      setScrubbing(true);
      if (!video.paused) video.pause();
    }
    const width = Math.max(e.currentTarget.clientWidth, 240);
    const deltaSeconds = (dx / width) * video.duration;
    const wrapped =
      (((dragRef.current.startTime + deltaSeconds) % video.duration) + video.duration) %
      video.duration;
    video.currentTime = wrapped;
    setProgress((wrapped / video.duration) * 1000);
  };

  const endStageDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const { moved, wasPlaying } = dragRef.current;
    dragRef.current.active = false;
    setScrubbing(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!moved) {
      togglePlay();
      return;
    }
    if (wasPlaying) {
      const video = videoRef.current;
      video?.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      );
    }
  };

  const timeLabel = useMemo(
    () => `${formatTime((progress / 1000) * duration)} / ${formatTime(duration)}`,
    [duration, progress]
  );

  return (
    <div className="ex-3ui" ref={stageRef} data-ready={hasLiveHtml || hasVideo ? 'true' : 'false'}>
      <div
        className="ex-3ui-stage"
        data-scrubbable={!hasLiveHtml && hasVideo ? 'true' : 'false'}
        data-scrubbing={scrubbing ? 'true' : 'false'}
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={endStageDrag}
        onPointerCancel={endStageDrag}
      >
        {hasLiveHtml && liveScene ? (
          <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <SandboxPreview
              title={title}
              html={liveScene.html}
              css={liveScene.css}
              theme="dark"
              viewport={1440}
              nonce={reloadNonce}
            />
          </div>
        ) : loadingLive ? (
          <div className="ex-3ui-empty" role="status">
            <span className="t-label">Đang tải cảnh 3D trực tiếp...</span>
            <strong>{title}</strong>
          </div>
        ) : hasVideo ? (
          <video
            ref={videoRef}
            className="ex-3ui-media"
            src={videoSrc}
            poster={poster || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label={`Bản xem trước 3D gốc: ${title}. Kéo ngang để xoay khung hình.`}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (!Number.isFinite(video.duration) || video.duration <= 0) return;
              setDuration(video.duration);
              setProgress((video.currentTime / video.duration) * 1000);
            }}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              video.playbackRate = playbackRate;
              setDuration(video.duration || 0);
            }}
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

        {!hasLiveHtml ? (
          <>
            <div className="ex-3ui-scrim" aria-hidden="true" />
            <div className="ex-3ui-head">
              <span className="ex-3ui-kicker">
                <span className="ex-3ui-dot" aria-hidden="true" />
                {hasVideo ? 'Cảnh 3D gốc · Kéo ngang để xoay góc nhìn' : 'Cảnh 3D gốc · Ảnh xem trước'}
              </span>
              <h2>{title}</h2>
            </div>
          </>
        ) : null}
      </div>

      <div className="ex-3ui-bar">
        {hasLiveHtml ? (
          <>
            <button
              type="button"
              className="ex-3ui-icon"
              onClick={restart}
              aria-label="Chạy lại cảnh 3D"
              title="Chạy lại"
            >
              <IconRotateCcw size={15} aria-hidden="true" />
            </button>
            <span className="ex-3ui-time">3D trực tiếp · Tương tác bằng chuột</span>
          </>
        ) : hasVideo ? (
          <>
            <button
              type="button"
              className="ex-3ui-icon"
              onClick={togglePlay}
              aria-label={playing ? 'Tạm dừng cảnh 3D' : 'Phát cảnh 3D'}
              title={playing ? 'Tạm dừng' : 'Phát'}
            >
              {playing ? <IconPause size={16} aria-hidden="true" /> : <IconPlay size={16} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="ex-3ui-icon"
              onClick={restart}
              aria-label="Phát lại cảnh 3D từ đầu"
              title="Phát lại"
            >
              <IconRotateCcw size={15} aria-hidden="true" />
            </button>
            <input
              className="ex-3ui-range"
              type="range"
              min={0}
              max={1000}
              step={1}
              value={progress}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="Tua khung hình cảnh 3D"
            />
            <span className="ex-3ui-time">{timeLabel}</span>
          </>
        ) : (
          <span className="ex-3ui-time">Ảnh xem trước gốc</span>
        )}

        <div className="ex-3ui-actions">
          {!hasLiveHtml && hasVideo ? (
            <button
              type="button"
              className="ex-3ui-speed"
              onClick={cycleRate}
              aria-label={`Tốc độ phát ${playbackRate}x — Bấm để đổi`}
              title="Tốc độ phát"
            >
              {playbackRate}×
            </button>
          ) : null}
          <button
            type="button"
            className="ex-3ui-icon"
            onClick={openFullscreen}
            aria-label="Mở toàn màn hình"
            title="Toàn màn hình"
          >
            <IconMaximize2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreeUIPreview;
