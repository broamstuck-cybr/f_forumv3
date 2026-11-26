import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  GridHelper,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TorusKnotGeometry,
  WebGLRenderer,
} from '../honor/threeSubset';
import {
  IconFilm,
  IconLayers,
  IconMaximize2,
  IconPause,
  IconPlay,
  IconRotateCcw,
} from '../../ui/icons';
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

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const total = Math.floor(value);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function buildInteractiveSculpture(
  itemId: string,
  title: string,
  wireframe: boolean
): { group: Group; materials: MeshStandardMaterial[] } {
  const key = `${itemId} ${title}`.toLowerCase();
  const seed = hashSeed(key);
  const palettes = [
    [0x38c99a, 0xe6b385, 0x8cbcc8],
    [0xd4a373, 0x6fd4aa, 0x9eb3b0],
    [0x7aa8b8, 0x38c99a, 0xf2e8cf],
    [0xc89b54, 0x56cfe1, 0xe9c46a],
  ];
  const [c1, c2, c3] = palettes[seed % palettes.length];
  const group = new Group();
  const materials: MeshStandardMaterial[] = [];

  const makeMat = (color: number, roughness: number, metalness: number, flatShading = false) => {
    const mat = new MeshStandardMaterial({
      color,
      roughness,
      metalness,
      wireframe,
      flatShading,
    });
    materials.push(mat);
    return mat;
  };

  if (/book|shelf|page|library|read/.test(key)) {
    const heights = [0.26, 0.22, 0.28, 0.2];
    const colors = [c1, c2, c3, 0x263238];
    let y = -0.45;
    heights.forEach((h, idx) => {
      const mesh = new Mesh(
        new BoxGeometry(1.75 - idx * 0.14, h, 1.25 - idx * 0.08),
        makeMat(colors[idx % colors.length], 0.42, 0.18)
      );
      mesh.position.set((idx % 2 === 0 ? -1 : 1) * 0.08, y + h / 2, (idx - 1.5) * 0.06);
      mesh.rotation.y = (idx - 1.5) * 0.14;
      group.add(mesh);
      y += h + 0.03;
    });
  } else if (/kibori|wood|panel|asanoha|kanna|tool|bench|chair|table/.test(key)) {
    const frame = new Mesh(new BoxGeometry(2.2, 1.55, 0.14), makeMat(c2, 0.52, 0.12));
    group.add(frame);
    for (let i = -4; i <= 4; i++) {
      const slat = new Mesh(new BoxGeometry(0.11, 1.32, 0.22), makeMat(i % 2 === 0 ? c1 : c3, 0.36, 0.28));
      slat.position.set(i * 0.22, 0, 0.06);
      group.add(slat);
    }
    const base = new Mesh(new CylinderGeometry(0.95, 1.12, 0.16, 32), makeMat(0x1f292e, 0.45, 0.4));
    base.position.y = -1.02;
    group.add(base);
  } else if (/particle|galaxy|star|field|cloud|snow|rain|dust/.test(key)) {
    const count = 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 0.45 + ((i * 7919 + seed) % 1000) / 1000 * 1.9;
      const theta = (i * 2.39996 + seed) % (Math.PI * 2);
      const phi = Math.acos(1 - (2 * ((i + 0.5) / count)));
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.65;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const pts = new Points(geo, new PointsMaterial({ color: c1, size: 0.045, transparent: true, opacity: 0.9 }));
    group.add(pts);
    const core = new Mesh(new IcosahedronGeometry(0.42, 1), makeMat(c2, 0.25, 0.65, true));
    group.add(core);
  } else if (/sphere|orb|planet|globe|earth|moon|sun|ball/.test(key)) {
    const core = new Mesh(new SphereGeometry(0.92, 32, 24), makeMat(c1, 0.28, 0.55));
    group.add(core);
    const ring1 = new Mesh(new TorusGeometry(1.38, 0.035, 16, 72), makeMat(c2, 0.25, 0.78));
    ring1.rotation.x = Math.PI * 0.38;
    group.add(ring1);
    const ring2 = new Mesh(new TorusGeometry(1.62, 0.02, 12, 72), makeMat(c3, 0.3, 0.7));
    ring2.rotation.set(Math.PI * 0.62, 0.5, 0);
    group.add(ring2);
  } else if (/crystal|gem|diamond|glass|prism|shard/.test(key)) {
    const main = new Mesh(new OctahedronGeometry(0.96, 0), makeMat(c1, 0.16, 0.72, true));
    main.scale.set(0.85, 1.35, 0.85);
    group.add(main);
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const shard = new Mesh(new OctahedronGeometry(0.36, 0), makeMat(i % 2 === 0 ? c2 : c3, 0.2, 0.65, true));
      shard.position.set(Math.cos(ang) * 1.15, (i % 2 === 0 ? 1 : -1) * 0.28, Math.sin(ang) * 1.15);
      shard.scale.set(0.7, 1.4, 0.7);
      group.add(shard);
    }
  } else {
    const knot = new Mesh(
      new TorusKnotGeometry(0.78, 0.24, 120, 20, 2 + (seed % 2), 3),
      makeMat(c1, 0.24, 0.72)
    );
    group.add(knot);
    const halo = new Mesh(new TorusGeometry(1.42, 0.025, 12, 64), makeMat(c2, 0.32, 0.65));
    halo.rotation.x = Math.PI * 0.45;
    group.add(halo);
  }

  return { group, materials };
}

export const ThreeUIPreview: React.FC<{
  itemId: string;
  title: string;
  image?: string;
  videoUrl?: string;
  sourceUrl?: string;
}> = ({ itemId, title, image, videoUrl }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [viewMode, setViewMode] = useState<'3d' | 'video'>('3d');
  const [webglReady, setWebglReady] = useState(true);
  const [autoSpin, setAutoSpin] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [resetTick, setResetTick] = useState(0);

  const [entry, setEntry] = useState<ThreeUIPreviewEntry | null>(null);
  const [playing, setPlaying] = useState(true);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const autoSpinRef = useRef(autoSpin);
  autoSpinRef.current = autoSpin;
  const wireframeRef = useRef(wireframe);
  wireframeRef.current = wireframe;

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

  const videoSrc = videoUrl || entry?.v || '';
  const poster = entry?.t || image || '';
  const hasVideo = Boolean(videoSrc) && !failed;

  useEffect(() => {
    if (viewMode !== '3d') return undefined;
    const host = canvasHostRef.current;
    if (!host) return undefined;

    let renderer: WebGLRenderer | null = null;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setWebglReady(false);
      setViewMode('video');
      return undefined;
    }

    setWebglReady(true);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.domElement.className = 'ex-3ui-canvas';
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.background = new Color(0x0b0e10);

    const width = Math.max(host.clientWidth, 320);
    const height = Math.max(host.clientHeight, 320);
    const camera = new PerspectiveCamera(42, width / height, 0.1, 60);
    renderer.setSize(width, height, false);

    const hemi = new HemisphereLight(0xeef6f4, 0x162024, 1.15);
    scene.add(hemi);
    const keyLight = new DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);
    const rimLight = new PointLight(0x38c99a, 4.5, 16);
    rimLight.position.set(-3.5, 2.2, -3);
    scene.add(rimLight);
    const warmLight = new PointLight(0xe6b385, 3.2, 14);
    warmLight.position.set(3.2, -1.8, 2.5);
    scene.add(warmLight);
    scene.add(new AmbientLight(0xffffff, 0.35));

    const grid = new GridHelper(10, 20, 0x38c99a, 0x1e282d);
    grid.position.y = -1.45;
    scene.add(grid);

    const { group, materials } = buildInteractiveSculpture(itemId, title, wireframeRef.current);
    scene.add(group);

    let yaw = 0.55;
    let pitch = 0.24;
    let targetYaw = yaw;
    let targetPitch = pitch;
    let radius = 4.4;
    let targetRadius = radius;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const canvas = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetYaw -= dx * 0.0085;
      targetPitch = Math.max(-1.15, Math.min(1.15, targetPitch + dy * 0.0065));
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetRadius = Math.max(2.4, Math.min(9.2, targetRadius + e.deltaY * 0.003));
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      if (!renderer) return;
      const w = Math.max(host.clientWidth, 240);
      const h = Math.max(host.clientHeight, 240);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    ro.observe(host);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;
    let t = 0;
    const tick = () => {
      rafId = window.requestAnimationFrame(tick);
      t += 0.012;
      if (!dragging && autoSpinRef.current && !reducedMotion) {
        targetYaw += 0.0055;
      }
      yaw += (targetYaw - yaw) * 0.1;
      pitch += (targetPitch - pitch) * 0.1;
      radius += (targetRadius - radius) * 0.12;

      camera.position.set(
        Math.sin(yaw) * Math.cos(pitch) * radius,
        Math.sin(pitch) * radius + 0.15,
        Math.cos(yaw) * Math.cos(pitch) * radius
      );
      camera.lookAt(0, 0, 0);

      if (!reducedMotion) {
        group.position.y = Math.sin(t) * 0.08;
      }
      for (const m of materials) {
        if (m.wireframe !== wireframeRef.current) {
          m.wireframe = wireframeRef.current;
        }
      }
      renderer?.render(scene, camera);
    };
    tick();

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      scene.traverse((obj) => {
        if (obj instanceof Mesh || obj instanceof Points) {
          obj.geometry?.dispose?.();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material?.dispose?.();
          }
        }
      });
      renderer?.dispose();
      host.innerHTML = '';
    };
  }, [itemId, title, viewMode, resetTick]);

  useEffect(() => {
    if (viewMode !== 'video') return;
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
  }, [videoSrc, viewMode]);

  const togglePlay = () => {
    if (viewMode === '3d') {
      setAutoSpin((v) => !v);
      return;
    }
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
    if (viewMode === '3d') {
      setResetTick((n) => n + 1);
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
    <div className="ex-3ui" ref={stageRef} data-ready={viewMode === '3d' || hasVideo ? 'true' : 'false'}>
      <div className="ex-3ui-stage">
        {viewMode === '3d' && webglReady ? (
          <div
            ref={canvasHostRef}
            className="ex-3ui-canvas-host"
            role="application"
            aria-label={`Không gian 3D tương tác: ${title}. Kéo để xoay, cuộn để thu phóng.`}
          />
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
            aria-label={`Video tham chiếu 3D: ${title}`}
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
            {viewMode === '3d' ? 'WebGL 3D · Kéo xoay & Cuộn thu phóng' : 'Video tham chiếu gốc'}
          </span>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="ex-3ui-bar">
        <button
          type="button"
          className="ex-3ui-icon"
          onClick={togglePlay}
          aria-label={
            viewMode === '3d'
              ? autoSpin
                ? 'Tạm dừng xoay 3D'
                : 'Bật xoay tự động'
              : playing
                ? 'Tạm dừng video'
                : 'Phát video'
          }
          title={viewMode === '3d' ? (autoSpin ? 'Dừng xoay' : 'Xoay tự động') : playing ? 'Tạm dừng' : 'Phát'}
        >
          {(viewMode === '3d' ? autoSpin : playing) ? (
            <IconPause size={16} aria-hidden="true" />
          ) : (
            <IconPlay size={16} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          className="ex-3ui-icon"
          onClick={restart}
          aria-label={viewMode === '3d' ? 'Đặt lại góc nhìn 3D' : 'Phát lại từ đầu'}
          title={viewMode === '3d' ? 'Đặt lại góc' : 'Phát lại'}
        >
          <IconRotateCcw size={15} aria-hidden="true" />
        </button>

        {viewMode === '3d' ? (
          <button
            type="button"
            className="ex-3ui-icon"
            aria-pressed={wireframe}
            onClick={() => setWireframe((v) => !v)}
            aria-label={wireframe ? 'Tắt chế độ khung lưới Wireframe' : 'Bật chế độ khung lưới Wireframe'}
            title="Wireframe"
          >
            <IconLayers size={15} aria-hidden="true" />
          </button>
        ) : hasVideo ? (
          <>
            <input
              className="ex-3ui-range"
              type="range"
              min={0}
              max={1000}
              step={1}
              value={progress}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="Tua video 3D"
            />
            <span className="ex-3ui-time">{timeLabel}</span>
          </>
        ) : (
          <span className="ex-3ui-time">Không có video tham chiếu</span>
        )}

        <div className="ex-3ui-actions">
          {hasVideo && webglReady && (
            <button
              type="button"
              className="ex-3ui-mode-btn"
              onClick={() => setViewMode((m) => (m === '3d' ? 'video' : '3d'))}
              aria-label={viewMode === '3d' ? 'Xem video tham chiếu gốc' : 'Quay lại sân khấu 3D tương tác'}
            >
              {viewMode === '3d' ? (
                <>
                  <IconFilm size={13} aria-hidden="true" />
                  <span>Video gốc</span>
                </>
              ) : (
                <>
                  <IconLayers size={13} aria-hidden="true" />
                  <span>3D Tương tác</span>
                </>
              )}
            </button>
          )}
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
