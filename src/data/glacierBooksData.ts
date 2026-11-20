export type GlacierBookGroup = 'ui' | 'spatial' | 'motion' | 'glacier';

export type GlacierBookMotif =
  | 'grid'
  | 'orbit'
  | 'prism'
  | 'wave'
  | 'glass'
  | 'type'
  | 'layers'
  | 'rings'
  | 'shader'
  | 'frame'
  | 'matrix'
  | 'lens';

export interface GlacierBookSettings {
  blurPx: number;
  opacityPct: number;
  radiusPx: number;
  motionMs: number;
  grainPct: number;
}

export interface GlacierBookResource {
  title: string;
  tag: string;
  detail: string;
}

export interface GlacierBookSpec {
  id: string;
  code: string;
  title: string;
  subtitleEn: string;
  group: GlacierBookGroup;
  groupLabel: string;
  year: string;
  countLabel: string;
  accent: string;
  secondary: string;
  motif: GlacierBookMotif;
  editionTag: string;
  paperTone: string;
  synopsisVi: string;
  creditVi: string;
  settings: GlacierBookSettings;
  resources: GlacierBookResource[];
  cssSnippet: string;
  promptTemplate: string;
  liveDemoHtml: string;
}

export const GLACIER_BOOK_GROUPS: ReadonlyArray<{
  id: 'all' | GlacierBookGroup;
  label: string;
}> = [
  { id: 'all', label: 'Tất cả (12)' },
  { id: 'ui', label: 'Giao diện UI (4)' },
  { id: 'spatial', label: 'Không gian 3D (2)' },
  { id: 'motion', label: 'Chuyển động (2)' },
  { id: 'glacier', label: 'Hệ Glacier (4)' },
];

interface BookDemoSeed {
  id: string;
  code: string;
  title: string;
  subtitleEn: string;
  accent: string;
  secondary: string;
  paperTone: string;
  editionTag: string;
  settings: GlacierBookSettings;
  modeLabels: [string, string, string];
  unitLabels: [string, string, string];
}

function buildGlacierBookLiveHtml(seed: BookDemoSeed): string {
  const op = (seed.settings.opacityPct / 100).toFixed(2);
  const gr = (seed.settings.grainPct / 100).toFixed(2);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${seed.code} · ${seed.title}</title>
<style>
:root {
  --glacier-blur: ${seed.settings.blurPx}px;
  --glacier-opacity: ${op};
  --glacier-radius: ${seed.settings.radiusPx}px;
  --glacier-motion: ${seed.settings.motionMs}ms;
  --glacier-grain: ${gr};
  --glacier-live-blur: var(--glacier-blur);
  --glacier-live-opacity: var(--glacier-opacity);
  --glacier-live-radius: var(--glacier-radius);
  --glacier-live-motion: var(--glacier-motion);
  --glacier-live-grain: var(--glacier-grain);
  --book-accent: ${seed.accent};
  --book-secondary: ${seed.secondary};
  --book-paper: ${seed.paperTone};
  --book-ink: #141619;
  --book-muted: #58606E;
  --font-display: 'Fraunces', Georgia, serif;
  --font-sans: 'Be Vietnam Pro', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}
[data-surface="ink"] {
  --book-paper: #0F131A;
  --book-ink: #F1F4F9;
  --book-muted: #94A3B8;
}
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;
}
html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--book-paper);
  color: var(--book-ink);
  font-family: var(--font-sans);
  transition: background var(--glacier-motion) cubic-bezier(0.22, 1, 0.36, 1),
              color var(--glacier-motion) cubic-bezier(0.22, 1, 0.36, 1);
}
#bg-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 1;
}
#grain-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: var(--glacier-grain);
  mix-blend-mode: overlay;
  z-index: 2;
}
.workbench {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 14px;
  gap: 12px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.code-pill {
  background: var(--book-accent);
  color: #FFFFFF;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.edition-pill {
  border: 1px solid rgba(128, 128, 128, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  color: var(--book-muted);
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.t-btn {
  appearance: none;
  border: 1px solid rgba(128, 128, 128, 0.28);
  background: rgba(255, 255, 255, 0.16);
  color: var(--book-ink);
  font-family: var(--font-mono);
  font-size: 10.5px;
  padding: 5px 10px;
  border-radius: 8px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: transform var(--glacier-motion) cubic-bezier(0.22, 1, 0.36, 1),
              border-color 160ms ease,
              background 160ms ease;
}
.t-btn:hover {
  border-color: var(--book-accent);
  transform: translateY(-1px);
}
.t-btn[data-active="true"] {
  background: var(--book-accent);
  border-color: var(--book-accent);
  color: #FFFFFF;
}
.stage-center {
  display: grid;
  grid-template-columns: 1.25fr 0.95fr;
  gap: 12px;
  align-items: stretch;
  min-height: 0;
}
.glass-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--glacier-radius);
  background: color-mix(in srgb, var(--book-paper) calc(var(--glacier-opacity) * 100%), transparent);
  backdrop-filter: blur(var(--glacier-blur)) saturate(145%);
  -webkit-backdrop-filter: blur(var(--glacier-blur)) saturate(145%);
  border: 1px solid color-mix(in srgb, var(--book-accent) 34%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55),
              0 18px 38px -14px rgba(15, 23, 42, 0.22);
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: grab;
  transition: border-radius var(--glacier-motion) cubic-bezier(0.22, 1, 0.36, 1),
              backdrop-filter var(--glacier-motion) cubic-bezier(0.22, 1, 0.36, 1),
              transform var(--glacier-motion) cubic-bezier(0.22, 1, 0.36, 1);
}
.glass-card:active {
  cursor: grabbing;
}
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.card-title {
  font-family: var(--font-display);
  font-size: clamp(16px, 2.2vw, 22px);
  font-weight: 700;
  line-height: 1.18;
}
.card-sub {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--book-muted);
  letter-spacing: 0.05em;
  margin-top: 2px;
}
.interactive-widget {
  margin-block: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.unit-tile {
  border-radius: calc(var(--glacier-radius) * 0.65);
  border: 1px solid color-mix(in srgb, var(--book-accent) 28%, transparent);
  background: color-mix(in srgb, var(--book-secondary) 32%, transparent);
  padding: 9px;
  cursor: pointer;
  transition: transform var(--glacier-motion) cubic-bezier(0.22, 1, 0.36, 1),
              border-color 160ms ease,
              background 160ms ease;
}
.unit-tile:hover {
  transform: translateY(-3px) scale(1.02);
  border-color: var(--book-accent);
}
.unit-tile[data-selected="true"] {
  border-color: var(--book-accent);
  background: color-mix(in srgb, var(--book-accent) 18%, transparent);
}
.unit-idx {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--book-accent);
  margin-bottom: 3px;
}
.unit-name {
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.25;
}
.unit-val {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--book-muted);
  margin-top: 4px;
}
.inspector-card {
  border-radius: var(--glacier-radius);
  background: color-mix(in srgb, var(--book-paper) calc(var(--glacier-opacity) * 92%), transparent);
  backdrop-filter: blur(var(--glacier-blur));
  -webkit-backdrop-filter: blur(var(--glacier-blur));
  border: 1px solid color-mix(in srgb, var(--book-accent) 26%, transparent);
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  overflow: hidden;
}
.token-list {
  display: grid;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 10.5px;
}
.token-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 7px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.08);
}
.token-key {
  color: var(--book-muted);
}
.token-val {
  color: var(--book-accent);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--book-muted);
  border-top: 1px solid rgba(128, 128, 128, 0.2);
  padding-top: 8px;
}
@media (max-width: 580px) {
  .stage-center {
    grid-template-columns: 1fr;
  }
  .inspector-card {
    display: none;
  }
}
</style>
</head>
<body data-surface="paper">
<canvas id="bg-canvas"></canvas>
<canvas id="grain-canvas"></canvas>
<div class="workbench">
  <div class="topbar">
    <div class="badge-row">
      <span class="code-pill">${seed.code}</span>
      <span class="edition-pill">${seed.editionTag}</span>
    </div>
    <div class="toolbar" role="toolbar" aria-label="Điều khiển mẫu thử">
      <button type="button" class="t-btn" data-mode="0" data-active="true">${seed.modeLabels[0]}</button>
      <button type="button" class="t-btn" data-mode="1" data-active="false">${seed.modeLabels[1]}</button>
      <button type="button" class="t-btn" data-mode="2" data-active="false">${seed.modeLabels[2]}</button>
      <button type="button" class="t-btn" id="btn-surface">Nền: Giấy</button>
    </div>
  </div>

  <div class="stage-center">
    <div class="glass-card" id="main-card">
      <div class="card-head">
        <div>
          <div class="card-title">${seed.title}</div>
          <div class="card-sub">${seed.subtitleEn}</div>
        </div>
        <button type="button" class="t-btn" id="btn-impulse">Kích hoạt</button>
      </div>

      <div class="interactive-widget" id="unit-grid">
        <div class="unit-tile" data-unit="0" data-selected="true">
          <div class="unit-idx">01 · SPEC</div>
          <div class="unit-name">${seed.unitLabels[0]}</div>
          <div class="unit-val" id="u-val-0">Đang chạy</div>
        </div>
        <div class="unit-tile" data-unit="1" data-selected="false">
          <div class="unit-idx">02 · SPEC</div>
          <div class="unit-name">${seed.unitLabels[1]}</div>
          <div class="unit-val" id="u-val-1">Sẵn sàng</div>
        </div>
        <div class="unit-tile" data-unit="2" data-selected="false">
          <div class="unit-idx">03 · SPEC</div>
          <div class="unit-name">${seed.unitLabels[2]}</div>
          <div class="unit-val" id="u-val-2">Đồng bộ</div>
        </div>
      </div>

      <div class="badge-row" style="justify-content: space-between;">
        <span id="live-coord">Tọa độ: 0, 0</span>
        <span id="live-status">Trạng thái: Tương tác 60fps</span>
      </div>
    </div>

    <div class="inspector-card">
      <div class="badge-row" style="justify-content: space-between;">
        <span>THÔNG SỐ GLACIER</span>
        <span id="sync-indicator">TRỰC TIẾP</span>
      </div>
      <div class="token-list">
        <div class="token-row">
          <span class="token-key">--glacier-blur</span>
          <span class="token-val" id="t-blur">${seed.settings.blurPx}px</span>
        </div>
        <div class="token-row">
          <span class="token-key">--glacier-opacity</span>
          <span class="token-val" id="t-opacity">${seed.settings.opacityPct}%</span>
        </div>
        <div class="token-row">
          <span class="token-key">--glacier-radius</span>
          <span class="token-val" id="t-radius">${seed.settings.radiusPx}px</span>
        </div>
        <div class="token-row">
          <span class="token-key">--glacier-motion</span>
          <span class="token-val" id="t-motion">${seed.settings.motionMs}ms</span>
        </div>
        <div class="token-row">
          <span class="token-key">--glacier-grain</span>
          <span class="token-val" id="t-grain">${seed.settings.grainPct}%</span>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <span>Kéo thẻ kính để kiểm tra lực đàn hồi · Nhấp ô thành phần để đổi mẫu</span>
    <span id="clock-readout">${seed.settings.motionMs}ms · r${seed.settings.radiusPx}</span>
  </div>
</div>
<script>
(function() {
  const root = document.documentElement;
  const bgCanvas = document.getElementById('bg-canvas');
  const bgCtx = bgCanvas.getContext('2d');
  const grainCanvas = document.getElementById('grain-canvas');
  const grainCtx = grainCanvas.getContext('2d');
  const mainCard = document.getElementById('main-card');
  const liveCoord = document.getElementById('live-coord');
  const liveStatus = document.getElementById('live-status');
  const clockReadout = document.getElementById('clock-readout');

  const elBlur = document.getElementById('t-blur');
  const elOpacity = document.getElementById('t-opacity');
  const elRadius = document.getElementById('t-radius');
  const elMotion = document.getElementById('t-motion');
  const elGrain = document.getElementById('t-grain');

  const SETTINGS = {
    blurPx: ${seed.settings.blurPx},
    opacityPct: ${seed.settings.opacityPct},
    radiusPx: ${seed.settings.radiusPx},
    motionMs: ${seed.settings.motionMs},
    grainPct: ${seed.settings.grainPct}
  };

  const STATE = {
    mode: 0,
    unit: 0,
    surface: 'paper',
    cardX: 0,
    cardY: 0,
    velX: 0,
    velY: 0,
    dragging: false,
    startX: 0,
    startY: 0,
    pointerX: 0.5,
    pointerY: 0.5,
    pulse: 0,
    time: 0
  };

  function applySettings(next) {
    if (!next || typeof next !== 'object') return;
    if (typeof next.blurPx === 'number') SETTINGS.blurPx = next.blurPx;
    if (typeof next.opacityPct === 'number') SETTINGS.opacityPct = next.opacityPct;
    if (typeof next.radiusPx === 'number') SETTINGS.radiusPx = next.radiusPx;
    if (typeof next.motionMs === 'number') SETTINGS.motionMs = next.motionMs;
    if (typeof next.grainPct === 'number') SETTINGS.grainPct = next.grainPct;

    const op = (SETTINGS.opacityPct / 100).toFixed(2);
    const gr = (SETTINGS.grainPct / 100).toFixed(2);

    root.style.setProperty('--glacier-blur', SETTINGS.blurPx + 'px');
    root.style.setProperty('--glacier-opacity', op);
    root.style.setProperty('--glacier-radius', SETTINGS.radiusPx + 'px');
    root.style.setProperty('--glacier-motion', SETTINGS.motionMs + 'ms');
    root.style.setProperty('--glacier-grain', gr);

    elBlur.textContent = SETTINGS.blurPx + 'px';
    elOpacity.textContent = Math.round(SETTINGS.opacityPct) + '%';
    elRadius.textContent = SETTINGS.radiusPx + 'px';
    elMotion.textContent = SETTINGS.motionMs + 'ms';
    elGrain.textContent = Math.round(SETTINGS.grainPct) + '%';
    clockReadout.textContent = 'blur ' + SETTINGS.blurPx + 'px · ' + SETTINGS.motionMs + 'ms · r' + SETTINGS.radiusPx;
  }

  window.addEventListener('message', function(event) {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'glacier:settings' && data.settings) {
      applySettings(data.settings);
      STATE.pulse = 0.8;
    } else if (data.settings && typeof data.settings === 'object') {
      applySettings(data.settings);
      STATE.pulse = 0.8;
    } else if ('blurPx' in data || 'opacityPct' in data || 'radiusPx' in data) {
      applySettings(data);
      STATE.pulse = 0.8;
    }
  });

  function buildGrain() {
    const w = 120;
    const h = 120;
    grainCanvas.width = w;
    grainCanvas.height = h;
    const img = grainCtx.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 75;
    }
    grainCtx.putImageData(img, 0, 0);
  }
  buildGrain();

  function resize() {
    bgCanvas.width = window.innerWidth || 640;
    bgCanvas.height = window.innerHeight || 380;
  }
  window.addEventListener('resize', resize);
  resize();

  mainCard.addEventListener('pointerdown', function(e) {
    if (e.target && e.target.closest('button, .unit-tile')) return;
    STATE.dragging = true;
    STATE.startX = e.clientX - STATE.cardX;
    STATE.startY = e.clientY - STATE.cardY;
    if (mainCard.setPointerCapture) {
      try { mainCard.setPointerCapture(e.pointerId); } catch (_) {}
    }
  });

  window.addEventListener('pointermove', function(e) {
    const w = Math.max(1, bgCanvas.width);
    const h = Math.max(1, bgCanvas.height);
    STATE.pointerX = e.clientX / w;
    STATE.pointerY = e.clientY / h;
    liveCoord.textContent = 'Tọa độ: ' + Math.round(e.clientX) + ', ' + Math.round(e.clientY);
    if (!STATE.dragging) return;
    STATE.cardX = (e.clientX - STATE.startX) * 0.48;
    STATE.cardY = (e.clientY - STATE.startY) * 0.48;
  });

  window.addEventListener('pointerup', function() {
    STATE.dragging = false;
  });

  const modeBtns = document.querySelectorAll('[data-mode]');
  modeBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      STATE.mode = Number(btn.getAttribute('data-mode') || 0);
      modeBtns.forEach(function(b) {
        b.setAttribute('data-active', b === btn ? 'true' : 'false');
      });
      STATE.pulse = 1.0;
      liveStatus.textContent = 'Chế độ: ' + btn.textContent;
    });
  });

  const unitTiles = document.querySelectorAll('[data-unit]');
  unitTiles.forEach(function(tile) {
    tile.addEventListener('click', function() {
      STATE.unit = Number(tile.getAttribute('data-unit') || 0);
      unitTiles.forEach(function(t, idx) {
        const active = t === tile;
        t.setAttribute('data-selected', active ? 'true' : 'false');
        const valEl = document.getElementById('u-val-' + idx);
        if (valEl) valEl.textContent = active ? 'Đang kích hoạt' : 'Sẵn sàng';
      });
      STATE.pulse = 1.1;
    });
  });

  const btnSurface = document.getElementById('btn-surface');
  btnSurface.addEventListener('click', function() {
    STATE.surface = STATE.surface === 'paper' ? 'ink' : 'paper';
    document.body.setAttribute('data-surface', STATE.surface);
    btnSurface.textContent = STATE.surface === 'paper' ? 'Nền: Giấy' : 'Nền: Mực';
  });

  const btnImpulse = document.getElementById('btn-impulse');
  btnImpulse.addEventListener('click', function() {
    STATE.velY = -14;
    STATE.velX = (Math.random() - 0.5) * 16;
    STATE.pulse = 1.4;
    liveStatus.textContent = 'Đã phát xung kiểm thử (' + SETTINGS.motionMs + 'ms)';
  });

  function tick() {
    const w = bgCanvas.width;
    const h = bgCanvas.height;
    bgCtx.clearRect(0, 0, w, h);

    const speedFactor = Math.max(0.2, 480 / Math.max(120, SETTINGS.motionMs));
    STATE.time += 0.018 * speedFactor;
    STATE.pulse *= 0.92;

    if (!STATE.dragging) {
      const stiffness = 0.14;
      const damping = 0.78;
      STATE.velX = (STATE.velX - STATE.cardX * stiffness) * damping;
      STATE.velY = (STATE.velY - STATE.cardY * stiffness) * damping;
      STATE.cardX += STATE.velX;
      STATE.cardY += STATE.velY;
    }

    const tiltX = (STATE.pointerY - 0.5) * -8;
    const tiltY = (STATE.pointerX - 0.5) * 10;
    mainCard.style.transform =
      'translate3d(' + STATE.cardX.toFixed(1) + 'px,' + STATE.cardY.toFixed(1) + 'px,0) ' +
      'rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg)';

    for (let i = 0; i < 4; i++) {
      const ang = STATE.time * (0.6 + i * 0.2) + i * 1.7 + STATE.mode * 0.9;
      const cx = w * (0.25 + 0.5 * STATE.pointerX) + Math.cos(ang) * (90 + i * 35);
      const cy = h * (0.3 + 0.4 * STATE.pointerY) + Math.sin(ang * 1.2) * (65 + i * 24);
      const rad = 85 + i * 28 + STATE.pulse * 40;
      const g = bgCtx.createRadialGradient(cx, cy, 4, cx, cy, rad);
      g.addColorStop(0, i % 2 === 0 ? ${JSON.stringify(seed.accent)} : ${JSON.stringify(seed.secondary)});
      g.addColorStop(1, 'rgba(0,0,0,0)');
      bgCtx.save();
      bgCtx.globalAlpha = 0.42;
      bgCtx.fillStyle = g;
      bgCtx.beginPath();
      bgCtx.arc(cx, cy, rad, 0, Math.PI * 2);
      bgCtx.fill();
      bgCtx.restore();
    }

    bgCtx.strokeStyle = ${JSON.stringify(seed.accent)};
    bgCtx.globalAlpha = 0.22;
    bgCtx.lineWidth = 1.2;
    const rings = 3 + STATE.unit;
    for (let r = 1; r <= rings; r++) {
      bgCtx.beginPath();
      const rx = (60 + r * 38) * (1 + STATE.pulse * 0.15);
      const ry = (34 + r * 22) * (1 + STATE.pulse * 0.15);
      bgCtx.ellipse(w * 0.5, h * 0.52, rx, ry, STATE.time * 0.25 * (r % 2 === 0 ? 1 : -1), 0, Math.PI * 2);
      bgCtx.stroke();
    }
    bgCtx.globalAlpha = 1;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
</script>
</body>
</html>`;
}

export const GLACIER_BOOKS: GlacierBookSpec[] = [
  {
    id: 'ui-spring',
    code: 'VOL.01',
    title: 'Tương Tác Lò Xo',
    subtitleEn: 'SPRING PHYSICS SYSTEM',
    group: 'ui',
    groupLabel: 'LÒ XO UI',
    year: '2026',
    countLabel: '41 mẫu',
    accent: '#1F3FB0',
    secondary: '#DCE6FA',
    motif: 'rings',
    editionTag: 'ARCHIVAL EDITION · 01',
    paperTone: '#F4F6FB',
    synopsisVi:
      'Hồ sơ 41 thành phần giao diện vận hành theo hệ phương trình lò xo với hệ số đàn hồi, giảm chấn và vận tốc đầu được định chuẩn cho thao tác kéo thả, bật công tắc và khay điều hướng.',
    creditVi: 'Biên mục từ 41 mẫu thành phần tương tác chạy trực tiếp trong kho lưu trữ F-Forum.',
    settings: {
      blurPx: 14,
      opacityPct: 86,
      radiusPx: 18,
      motionMs: 420,
      grainPct: 8,
    },
    resources: [
      {
        title: 'Khung soạn lệnh (Prompt Composer)',
        tag: 'COMPONENT · TSX',
        detail: 'Khung nhập lệnh tự co giãn chiều cao với danh mục mô hình đóng mở theo quỹ đạo lò xo 420ms.',
      },
      {
        title: 'Thẻ hiện diện (Presence Cards)',
        tag: 'COMPONENT · TSX',
        detail: 'Cụm thẻ trạng thái thành viên xếp lớp có độ lệch trục Y 4px khi nhận con trỏ.',
      },
      {
        title: 'Công tắc giao diện (Theme Switch)',
        tag: 'COMPONENT · CSS',
        detail: 'Công tắc chuyển chế độ Sáng và Tối dùng đường cong cubic-bezier(0.22, 1, 0.36, 1) trong 380ms.',
      },
      {
        title: 'Vùng nhận tệp (Dynamic Drop Zone)',
        tag: 'COMPONENT · TSX',
        detail: 'Khung nhận tệp kéo thả phản hồi theo khoảng cách con trỏ và hiển thị tỷ lệ phần trăm nạp.',
      },
      {
        title: 'Thanh chọn thẻ (Liquid Tabs)',
        tag: 'COMPONENT · TSX',
        detail: 'Thanh điều hướng dịch chuyển lớp nền chỉ báo giữa các mục bằng phép nội suy vị trí.',
      },
    ],
    cssSnippet: `:root {
  --spring-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --spring-duration: 420ms;
  --spring-surface: rgba(31, 63, 176, 0.12);
  --spring-border: rgba(31, 63, 176, 0.32);
  --spring-radius: 18px;
}

.glacier-spring-card {
  border-radius: var(--spring-radius);
  background: var(--spring-surface);
  border: 1px solid var(--spring-border);
  backdrop-filter: blur(14px);
  transition: transform var(--spring-duration) var(--spring-ease),
              box-shadow var(--spring-duration) var(--spring-ease);
}

.glacier-spring-card:hover {
  transform: translateY(-4px) scale(1.015);
  box-shadow: 0 18px 38px -12px rgba(31, 63, 176, 0.28);
}`,
    promptTemplate:
      'Thiết kế cụm thành phần tương tác lò xo gồm thanh chọn thẻ, thẻ trạng thái xếp lớp và khung nhập lệnh (--spring-ease: cubic-bezier(0.22, 1, 0.36, 1), 420ms), tương thích khung nhìn 390px và 1440px.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'ui-spring',
      code: 'VOL.01',
      title: 'Tương Tác Lò Xo',
      subtitleEn: 'SPRING PHYSICS SYSTEM',
      accent: '#1F3FB0',
      secondary: '#DCE6FA',
      paperTone: '#F4F6FB',
      editionTag: 'ARCHIVAL EDITION · 01',
      settings: { blurPx: 14, opacityPct: 86, radiusPx: 18, motionMs: 420, grainPct: 8 },
      modeLabels: ['Đàn hồi: Chuẩn', 'Giảm chấn: Cao', 'Quán tính: Nhanh'],
      unitLabels: ['Khung soạn lệnh', 'Thẻ hiện diện', 'Thanh chọn thẻ'],
    }),
  },
  {
    id: 'spatial-webgl',
    code: 'VOL.02',
    title: 'Không Gian 3D WebGL',
    subtitleEn: 'SPATIAL WEBGL STAGES',
    group: 'spatial',
    groupLabel: 'KHÔNG GIAN 3D',
    year: '2026',
    countLabel: '55 cảnh',
    accent: '#2C5B78',
    secondary: '#D9ECF5',
    motif: 'orbit',
    editionTag: 'ARCHIVAL EDITION · 02',
    paperTone: '#F1F6F9',
    synopsisVi:
      'Tập hợp 55 cảnh dựng 3D WebGL, trường hạt quỹ đạo và lưới địa hình chiếu phối cảnh duy trì tốc độ 60 khung hình/giây trên trình duyệt.',
    creditVi: 'Hệ thống hóa từ 55 mẫu không gian 3D và trường cấu trúc WebGL trong danh mục ThreeUI.',
    settings: {
      blurPx: 18,
      opacityPct: 78,
      radiusPx: 20,
      motionMs: 640,
      grainPct: 12,
    },
    resources: [
      {
        title: 'Trường dòng cấu trúc (Structure Flow Field)',
        tag: 'WEBGL · SCENE',
        detail: 'Lưới hạt 3D di chuyển theo trường vector kết hợp suy giảm độ mờ theo chiều sâu Z.',
      },
      {
        title: 'Địa hình sương núi (Alpine Terrain Plume)',
        tag: 'WEBGL · MESH',
        detail: 'Lưới địa hình đa giác biến thiên cao độ theo hàm nhiễu Perlin hai chiều.',
      },
      {
        title: 'Huy hiệu bản đồ nhiệt (Heatmap Badge Canvas)',
        tag: 'CANVAS · 3D',
        detail: 'Thẻ 3D cập nhật phổ màu nhiệt theo góc nghiêng và vị trí con trỏ.',
      },
      {
        title: 'Cung điểm ảnh bán sắc (Predictive Arc Halftone)',
        tag: 'WEBGL · HALFTONE',
        detail: 'Vòm cầu điểm ảnh bán sắc quay quanh trục Y làm lớp nền cho khu vực tiêu đề.',
      },
    ],
    cssSnippet: `:root {
  --spatial-perspective: 1200px;
  --spatial-accent: #2C5B78;
  --spatial-glow: rgba(44, 91, 120, 0.26);
  --spatial-radius: 20px;
}

.spatial-stage-viewport {
  perspective: var(--spatial-perspective);
  transform-style: preserve-3d;
  border-radius: var(--spatial-radius);
  overflow: hidden;
  background: radial-gradient(circle at 50% 35%, var(--spatial-glow), transparent 72%);
}`,
    promptTemplate:
      'Dựng sân khấu 3D có chiều sâu phối cảnh (perspective: 1200px) với vòng quỹ đạo xoay quanh tâm, lớp thẻ thông số HUD neo bốn góc và nhánh xử lý prefers-reduced-motion.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'spatial-webgl',
      code: 'VOL.02',
      title: 'Không Gian 3D WebGL',
      subtitleEn: 'SPATIAL WEBGL STAGES',
      accent: '#2C5B78',
      secondary: '#D9ECF5',
      paperTone: '#F1F6F9',
      editionTag: 'ARCHIVAL EDITION · 02',
      settings: { blurPx: 18, opacityPct: 78, radiusPx: 20, motionMs: 640, grainPct: 12 },
      modeLabels: ['Trục: Quỹ đạo', 'Trục: Địa hình', 'Trục: Bán sắc'],
      unitLabels: ['Trường vector', 'Lưới cao độ', 'Huy hiệu nhiệt'],
    }),
  },
  {
    id: 'ui-microfx',
    code: 'VOL.03',
    title: 'Hiệu Ứng Vi Mô',
    subtitleEn: 'MICRO MOTION DETAILS',
    group: 'ui',
    groupLabel: 'HIỆU ỨNG',
    year: '2026',
    countLabel: '35 mẫu',
    accent: '#D63A27',
    secondary: '#F9E1DC',
    motif: 'prism',
    editionTag: 'ARCHIVAL EDITION · 03',
    paperTone: '#FAF4F2',
    synopsisVi:
      'Danh mục 35 mẫu phản hồi vi mô cho nút lệnh, đường viền chiếu sáng theo góc trỏ chuột, núm xoay chia vạch và chuyển tiếp trạng thái dưới 300ms.',
    creditVi: 'Tổng hợp từ 35 mẫu phản hồi vi mô và nút kính khúc xạ thuộc nhóm Hiệu ứng.',
    settings: {
      blurPx: 12,
      opacityPct: 90,
      radiusPx: 14,
      motionMs: 280,
      grainPct: 6,
    },
    resources: [
      {
        title: 'Nút kính viền sáng (Aster Glass Button)',
        tag: 'MICROFX · CSS',
        detail: 'Nút chữ nhật viền 1px cập nhật góc phản chiếu ánh sáng dọc theo chu vi khi di chuột.',
      },
      {
        title: 'Khung phóng đại tiêu điểm (Magnify Lens)',
        tag: 'MICROFX · TSX',
        detail: 'Vùng thấu kính phóng đại tỷ lệ 1.6x bám theo tọa độ trỏ chuột trên bề mặt thẻ.',
      },
      {
        title: 'Núm xoay nhiệt độ (Thermal Dial Control)',
        tag: 'MICROFX · SVG',
        detail: 'Vòng xoay chia vạch góc từ 0 đến 270 độ cập nhật giá trị số theo thao tác kéo.',
      },
      {
        title: 'Thanh công cụ thu phóng (Animated Top Dock)',
        tag: 'MICROFX · CSS',
        detail: 'Thanh neo biểu tượng biến thiên kích thước các mục lân cận theo hàm phân phối chuẩn Gauss.',
      },
    ],
    cssSnippet: `:root {
  --fx-accent: #D63A27;
  --fx-border: rgba(214, 58, 39, 0.35);
  --fx-fast: 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.microfx-pill {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--fx-border);
  transition: transform var(--fx-fast), border-color var(--fx-fast);
}

.microfx-pill:focus-visible {
  outline: 2px solid var(--fx-accent);
  outline-offset: 2px;
}`,
    promptTemplate:
      'Tạo bộ nút bấm và thẻ điều khiển có viền sáng phản hồi theo tọa độ chuột, thời lượng chuyển tiếp 280ms, kèm trạng thái focus-visible độ tương phản cao.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'ui-microfx',
      code: 'VOL.03',
      title: 'Hiệu Ứng Vi Mô',
      subtitleEn: 'MICRO MOTION DETAILS',
      accent: '#D63A27',
      secondary: '#F9E1DC',
      paperTone: '#FAF4F2',
      editionTag: 'ARCHIVAL EDITION · 03',
      settings: { blurPx: 12, opacityPct: 90, radiusPx: 14, motionMs: 280, grainPct: 6 },
      modeLabels: ['Viền: Quang học', 'Thấu kính: 1.6x', 'Núm xoay: Vạch'],
      unitLabels: ['Nút kính Aster', 'Khung phóng đại', 'Thanh neo Gauss'],
    }),
  },
  {
    id: 'motion-kinetic',
    code: 'VOL.04',
    title: 'Nhịp Chuyển Động',
    subtitleEn: 'KINETIC CHOREOGRAPHY',
    group: 'motion',
    groupLabel: 'CHUYỂN ĐỘNG',
    year: '2026',
    countLabel: '48 bản mẫu',
    accent: '#8E4A26',
    secondary: '#F5E7DD',
    motif: 'wave',
    editionTag: 'ARCHIVAL EDITION · 04',
    paperTone: '#F8F3EE',
    synopsisVi:
      '48 kịch bản điều phối chuyển động cho khung mở đầu, dải băng chuyền 4 tầng đảo chiều và nhịp xuất hiện dòng tiêu đề theo chu kỳ thời gian.',
    creditVi: 'Biên tập từ 48 mẫu trình diễn chuyển động đã xác thực mã nguồn trong kho F-Forum.',
    settings: {
      blurPx: 16,
      opacityPct: 84,
      radiusPx: 16,
      motionMs: 540,
      grainPct: 10,
    },
    resources: [
      {
        title: 'Băng chuyền 4 hàng đảo chiều (Quad Marquee Wall)',
        tag: 'MOTION · WALL',
        detail: '4 dải thẻ chuyển động ngược chiều nhau, giảm tốc về 0 khi con trỏ đi vào vùng đọc.',
      },
      {
        title: 'Khung tiêu đề chuyển pha (Morphing Headline)',
        tag: 'MOTION · TYPE',
        detail: 'Chuyển đổi giữa hai chuỗi tiêu đề bằng phép dịch trục Y kết hợp biến thiên độ mờ.',
      },
      {
        title: 'Sân khấu góc nghiêng (Cathode Session Angles)',
        tag: 'MOTION · STAGE',
        detail: 'Đổi góc nhìn phối cảnh 3D giữa các phân cảnh trưng bày theo mốc thời gian.',
      },
      {
        title: 'Tiêu đề nhịp tần số (Audio Wordmark)',
        tag: 'MOTION · SVG',
        detail: 'Cụm chữ tiêu đề biến thiên chiều cao nét theo mảng biên độ tần số âm thanh.',
      },
    ],
    cssSnippet: `:root {
  --kinetic-duration: 540ms;
  --kinetic-curve: cubic-bezier(0.16, 1, 0.3, 1);
  --marquee-speed: 38s;
}

.kinetic-track {
  display: flex;
  gap: 16px;
  width: max-content;
  will-change: transform;
  transition: animation-play-state var(--kinetic-duration) var(--kinetic-curve);
}`,
    promptTemplate:
      'Xây dựng sân khấu chuyển động gồm tiêu đề xuất hiện tuần tự theo từng dòng và băng chuyền thẻ trưng bày tạm dừng khi người dùng đưa chuột vào.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'motion-kinetic',
      code: 'VOL.04',
      title: 'Nhịp Chuyển Động',
      subtitleEn: 'KINETIC CHOREOGRAPHY',
      accent: '#8E4A26',
      secondary: '#F5E7DD',
      paperTone: '#F8F3EE',
      editionTag: 'ARCHIVAL EDITION · 04',
      settings: { blurPx: 16, opacityPct: 84, radiusPx: 16, motionMs: 540, grainPct: 10 },
      modeLabels: ['Nhịp: Tuần tự', 'Băng chuyền: 4x', 'Pha: Biến thiên'],
      unitLabels: ['Băng chuyền 4 tầng', 'Tiêu đề chuyển pha', 'Nhịp sóng âm'],
    }),
  },
  {
    id: 'ui-layouts',
    code: 'VOL.05',
    title: 'Bố Cục Biên Tập',
    subtitleEn: 'EDITORIAL GRID SYSTEMS',
    group: 'ui',
    groupLabel: 'BỐ CỤC',
    year: '2026',
    countLabel: '30 cấu trúc',
    accent: '#3F5E4D',
    secondary: '#E1ECE5',
    motif: 'grid',
    editionTag: 'ARCHIVAL EDITION · 05',
    paperTone: '#F2F6F3',
    synopsisVi:
      '30 cấu trúc lưới tạp chí 12 cột, bảng đối chiếu thông số, lưới Bento bất đối xứng và chân trang chỉ mục đa cột với đường kẻ phân vùng 1px.',
    creditVi: 'Tuyển chọn từ 30 mẫu bố cục trang đích, phân mục nội dung và chân trang trong kho lưu trữ.',
    settings: {
      blurPx: 10,
      opacityPct: 94,
      radiusPx: 12,
      motionMs: 360,
      grainPct: 7,
    },
    resources: [
      {
        title: 'Trang đích kiến trúc Aera (Aera 01 Landing)',
        tag: 'LAYOUT · PAGE',
        detail: 'Lưới 12 cột chia tỷ lệ 5:7 kết hợp đường kẻ phân mục ngang dọc dày 1px.',
      },
      {
        title: 'Khối giới thiệu biên tập (Editorial About Section)',
        tag: 'LAYOUT · SECTION',
        detail: 'Bố cục hai cột bất đối xứng đặt đoạn mở đầu cỡ chữ lớn bên cạnh bảng chỉ số.',
      },
      {
        title: 'Chân trang chỉ mục 5 cột (Aera 01 Footers)',
        tag: 'LAYOUT · FOOTER',
        detail: 'Chân trang 5 cột phân tách danh mục tài liệu, trạng thái dịch vụ và thông tin xuất bản.',
      },
      {
        title: 'Bảng ruy-băng phân loại (Plate Ribbon Table)',
        tag: 'LAYOUT · MATRIX',
        detail: '5 dải hàng ngang phân loại mẫu thiết kế đi kèm ngăn mở xem trực tiếp tại chỗ.',
      },
    ],
    cssSnippet: `:root {
  --grid-columns: 12;
  --grid-gap: 24px;
  --grid-max-width: 1360px;
  --grid-rule: 1px solid rgba(63, 94, 77, 0.22);
}

.editorial-grid-shell {
  max-width: var(--grid-max-width);
  margin-inline: auto;
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
  gap: var(--grid-gap);
  border-top: var(--grid-rule);
}`,
    promptTemplate:
      'Dựng bố cục trang theo lưới biên tập 12 cột với đường kẻ phân tách 1px, khoảng cách theo bội số 8px, cột mục lục cố định bên trái và vùng nội dung bên phải.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'ui-layouts',
      code: 'VOL.05',
      title: 'Bố Cục Biên Tập',
      subtitleEn: 'EDITORIAL GRID SYSTEMS',
      accent: '#3F5E4D',
      secondary: '#E1ECE5',
      paperTone: '#F2F6F3',
      editionTag: 'ARCHIVAL EDITION · 05',
      settings: { blurPx: 10, opacityPct: 94, radiusPx: 12, motionMs: 360, grainPct: 7 },
      modeLabels: ['Lưới: 12 cột', 'Tỷ lệ: 5 / 7', 'Bento: Đối chiếu'],
      unitLabels: ['Khung Aera 01', 'Khối biên tập', 'Bảng ruy-băng'],
    }),
  },
  {
    id: 'glacier-glass',
    code: 'VOL.06',
    title: 'Glacier Glass UI',
    subtitleEn: 'GLACIER REFRACTION TOKENS',
    group: 'glacier',
    groupLabel: 'KÍNH BĂNG HÀ',
    year: '2026',
    countLabel: '18 token',
    accent: '#2B6CB0',
    secondary: '#E2EFFA',
    motif: 'glass',
    editionTag: 'ARCHIVAL EDITION · 06',
    paperTone: '#F2F7FC',
    synopsisVi:
      'Đặc tả vật liệu kính băng hà (Glacier Glass) gồm độ mờ hậu cảnh phân lớp, viền sáng nội bộ 1px và quy tắc cắt góc bo khép kín.',
    creditVi: 'Tài liệu thông số vật liệu nền tảng của hệ thiết kế Glacier 2026 tại F-Forum.',
    settings: {
      blurPx: 24,
      opacityPct: 72,
      radiusPx: 22,
      motionMs: 460,
      grainPct: 9,
    },
    resources: [
      {
        title: 'Vật liệu kính đa lớp (Advanced Glass Material)',
        tag: 'GLACIER · SURFACE',
        detail: 'Kết hợp backdrop-filter 24px, viền sáng đỉnh inset 1px và khung viền bán trong suốt.',
      },
      {
        title: 'Khung bo góc khép kín (Clean Squircle Clip)',
        tag: 'GLACIER · RULE',
        detail: 'Đồng bộ overflow: hidden và border-radius nhằm loại bỏ hiện tượng lem bóng ở bốn góc.',
      },
      {
        title: 'Thẻ nổi hai lớp bóng (Dual-Elevation Card)',
        tag: 'GLACIER · CARD',
        detail: 'Tách riêng lớp bóng tán xạ môi trường bán kính rộng và lớp bóng tiếp xúc sát đáy thẻ.',
      },
      {
        title: 'Thanh điều hướng kính mờ (Frosted Top Bar)',
        tag: 'GLACIER · NAV',
        detail: 'Thanh điều hướng 1 dòng giữ tỷ lệ tương phản văn bản tối thiểu 4.5:1 trên nền động.',
      },
    ],
    cssSnippet: `:root {
  --glacier-blur: 24px;
  --glacier-bg: rgba(255, 255, 255, 0.72);
  --glacier-border: rgba(43, 108, 176, 0.24);
  --glacier-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.65);
  --glacier-radius: 22px;
}

.glacier-glass-panel {
  border-radius: var(--glacier-radius);
  overflow: hidden;
  background: var(--glacier-bg);
  backdrop-filter: blur(var(--glacier-blur)) saturate(140%);
  border: 1px solid var(--glacier-border);
  box-shadow: var(--glacier-highlight), 0 20px 44px -16px rgba(15, 23, 42, 0.16);
}`,
    promptTemplate:
      'Áp dụng vật liệu Glacier Glass cho bảng điều khiển với độ mờ 24px, viền sáng bên trong 1px, bo góc 22px khép kín và tỷ lệ tương phản chữ đạt chuẩn WCAG AA.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'glacier-glass',
      code: 'VOL.06',
      title: 'Glacier Glass UI',
      subtitleEn: 'GLACIER REFRACTION TOKENS',
      accent: '#2B6CB0',
      secondary: '#E2EFFA',
      paperTone: '#F2F7FC',
      editionTag: 'ARCHIVAL EDITION · 06',
      settings: { blurPx: 24, opacityPct: 72, radiusPx: 22, motionMs: 460, grainPct: 9 },
      modeLabels: ['Khúc xạ: Lớp 1', 'Khúc xạ: Lớp 2', 'Khúc xạ: Lớp 3'],
      unitLabels: ['Mặt kính 24px', 'Góc bo Squircle', 'Bóng kép 2 tầng'],
    }),
  },
  {
    id: 'glacier-type',
    code: 'VOL.07',
    title: 'Hệ Phông Biến Thể',
    subtitleEn: 'VARIABLE TYPOGRAPHY SCALE',
    group: 'glacier',
    groupLabel: 'PHÔNG CHỮ',
    year: '2026',
    countLabel: '12 hệ',
    accent: '#4C6165',
    secondary: '#E4ECEE',
    motif: 'type',
    editionTag: 'ARCHIVAL EDITION · 07',
    paperTone: '#F3F6F7',
    synopsisVi:
      '12 cấu hình kết hợp phông Serif tiêu đề, Sans-serif hỗ trợ đầy đủ dấu tiếng Việt và Monospace đẳng rộng cho bảng dữ liệu kỹ thuật.',
    creditVi: 'Định chuẩn thang chữ clamp() và khoảng cách dòng tiếng Việt cho toàn bộ giao diện F-Forum.',
    settings: {
      blurPx: 8,
      opacityPct: 96,
      radiusPx: 12,
      motionMs: 320,
      grainPct: 5,
    },
    resources: [
      {
        title: 'Thang tiêu đề bài viết (Article Headings Scale)',
        tag: 'TYPE · DISPLAY',
        detail: 'Hàm clamp(2.25rem, 4.5vw, 4.25rem) đi cùng line-height 1.12 bảo toàn dấu thanh tiếng Việt.',
      },
      {
        title: 'Cặp phông biên tập & kỹ thuật (Editorial + Mono Pairing)',
        tag: 'TYPE · PAIRING',
        detail: 'Phối hợp Fraunces cho tiêu đề, Be Vietnam Pro cho thân bài và JetBrains Mono cho mã lệnh.',
      },
      {
        title: 'Bảng số liệu đẳng rộng (Tabular Numeric Tokens)',
        tag: 'TYPE · NUMERIC',
        detail: 'Thiết lập font-variant-numeric: tabular-nums giữ các cột chữ số thẳng hàng dọc.',
      },
      {
        title: 'Độ rộng dòng đọc 65 ký tự (Measure 65ch)',
        tag: 'TYPE · READABILITY',
        detail: 'Giới hạn chiều ngang khối văn bản trong khoảng 58ch đến 68ch cho tài liệu dài.',
      },
    ],
    cssSnippet: `:root {
  --font-display: 'Fraunces', Georgia, serif;
  --font-sans: 'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --type-hero: clamp(2.25rem, 4.2vw, 4rem);
  --type-body: clamp(0.95rem, 1.05vw, 1.0625rem);
}

.glacier-heading {
  font-family: var(--font-display);
  font-size: var(--type-hero);
  line-height: 1.12;
  letter-spacing: -0.02em;
}`,
    promptTemplate:
      'Thiết lập hệ thống phông chữ gồm Fraunces cho tiêu đề lớn, Be Vietnam Pro cho văn bản tiếng Việt và JetBrains Mono (tabular-nums) cho các thẻ chỉ số kỹ thuật.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'glacier-type',
      code: 'VOL.07',
      title: 'Hệ Phông Biến Thể',
      subtitleEn: 'VARIABLE TYPOGRAPHY SCALE',
      accent: '#4C6165',
      secondary: '#E4ECEE',
      paperTone: '#F3F6F7',
      editionTag: 'ARCHIVAL EDITION · 07',
      settings: { blurPx: 8, opacityPct: 96, radiusPx: 12, motionMs: 320, grainPct: 5 },
      modeLabels: ['Cỡ: Display 48', 'Cỡ: Body 65ch', 'Cỡ: Mono Tabular'],
      unitLabels: ['Fraunces Serif', 'Be Vietnam Pro', 'JetBrains Mono'],
    }),
  },
  {
    id: 'motion-scroll',
    code: 'VOL.08',
    title: 'Động Lực Cuộn Trang',
    subtitleEn: 'SCROLL MOMENTUM STAGES',
    group: 'motion',
    groupLabel: 'NHỊP CUỘN',
    year: '2026',
    countLabel: '16 kịch bản',
    accent: '#2B5B6C',
    secondary: '#DCECF2',
    motif: 'layers',
    editionTag: 'ARCHIVAL EDITION · 08',
    paperTone: '#F1F6F8',
    synopsisVi:
      '16 kịch bản điều hướng theo tiến độ cuộn trang: ghim khung nhìn trung tâm, hội tụ thẻ vệ tinh về cửa sổ chính và chuyển chương tuần tự.',
    creditVi: 'Áp dụng trực tiếp trên phân cảnh cuộn Tidewell và danh mục trưng bày dự án của F-Forum.',
    settings: {
      blurPx: 16,
      opacityPct: 82,
      radiusPx: 20,
      motionMs: 600,
      grainPct: 10,
    },
    resources: [
      {
        title: 'Sân khấu ghim quỹ đạo (Pinned Orbit Stage)',
        tag: 'SCROLL · PINNED',
        detail: 'Cố định khung nhìn 100vh trong khi 12 thẻ xoay theo quỹ đạo elip rồi thu về khung trung tâm.',
      },
      {
        title: 'Chồng thẻ theo chỉ mục (Stacking Project Cards)',
        tag: 'SCROLL · STACK',
        detail: 'Các thẻ dự án xếp lớp tuần tự theo chỉ mục 01 đến 04 dựa trên tỷ lệ cuộn dọc.',
      },
      {
        title: 'Thước đo tiến độ chương (Chapter Progress Rail)',
        tag: 'SCROLL · RAIL',
        detail: 'Thanh chỉ báo bên lề hiển thị phần trăm cuộn và hỗ trợ nhảy trực tiếp tới từng chương.',
      },
      {
        title: 'Nhánh giảm chuyển động (Reduced Motion Fallback)',
        tag: 'SCROLL · A11Y',
        detail: 'Chuyển sang lưới tĩnh khi trình duyệt kích hoạt cờ prefers-reduced-motion: reduce.',
      },
    ],
    cssSnippet: `:root {
  --scroll-stage-height: 320vh;
  --scroll-window-radius: 20px;
  --scroll-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

.scroll-pinned-viewport {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  display: grid;
  place-items: center;
}`,
    promptTemplate:
      'Dựng phân cảnh cuộn trang có khung sticky 100vh, chuyển pha từ các thẻ vệ tinh hội tụ về cửa sổ sản phẩm trung tâm và tắt hoạt họa cuộn khi bật prefers-reduced-motion.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'motion-scroll',
      code: 'VOL.08',
      title: 'Động Lực Cuộn Trang',
      subtitleEn: 'SCROLL MOMENTUM STAGES',
      accent: '#2B5B6C',
      secondary: '#DCECF2',
      paperTone: '#F1F6F8',
      editionTag: 'ARCHIVAL EDITION · 08',
      settings: { blurPx: 16, opacityPct: 82, radiusPx: 20, motionMs: 600, grainPct: 10 },
      modeLabels: ['Pha 1: Phân tán', 'Pha 2: Quỹ đạo', 'Pha 3: Hội tụ'],
      unitLabels: ['Khung ghim 100vh', 'Chồng thẻ 01-04', 'Thước tiến độ'],
    }),
  },
  {
    id: 'spatial-shader',
    code: 'VOL.09',
    title: 'Shader & Ánh Sáng',
    subtitleEn: 'LIGHT & SHADER FIELDS',
    group: 'spatial',
    groupLabel: 'GLSL SHADER',
    year: '2026',
    countLabel: '24 shader',
    accent: '#1E4E68',
    secondary: '#D7E8F2',
    motif: 'shader',
    editionTag: 'ARCHIVAL EDITION · 09',
    paperTone: '#EFF5F9',
    synopsisVi:
      '24 mẫu shader chiếu sáng, tán xạ qua mép kính, lớp hạt bề mặt giấy in và vùng sáng hướng tâm bám theo tọa độ trỏ chuột.',
    creditVi: 'Tổng hợp từ bộ shader nền và hiệu ứng chiếu sáng bề mặt trong kho đồ họa F-Forum.',
    settings: {
      blurPx: 28,
      opacityPct: 68,
      radiusPx: 24,
      motionMs: 720,
      grainPct: 14,
    },
    resources: [
      {
        title: 'Khúc xạ mép kính (Specular Glass Shader)',
        tag: 'SHADER · GLSL',
        detail: 'Tính toán góc lệch ánh sáng qua bề mặt kính cong với chỉ số khúc xạ IOR 1.52.',
      },
      {
        title: 'Trường sáng hướng tâm (Radial Ambient Field)',
        tag: 'SHADER · LIGHT',
        detail: 'Nguồn sáng bán kính 640px di chuyển theo tọa độ chuột với bộ lọc giảm chấn bậc nhất.',
      },
      {
        title: 'Lớp hạt bề mặt giấy (Editorial Film Grain)',
        tag: 'SHADER · TEXTURE',
        detail: 'Lớp nhiễu hạt phân bố đều tạo kết cấu bề mặt giấy lưu trữ trên cả nền Sáng và Tối.',
      },
      {
        title: 'Bóng đổ môi trường 3 lớp (Multi-Layer Ambient Shadow)',
        tag: 'SHADER · SHADOW',
        detail: 'Phối hợp 3 lớp box-shadow theo cấp số nhân khoảng cách để phân tách độ cao Z.',
      },
    ],
    cssSnippet: `:root {
  --shader-spot-x: 50%;
  --shader-spot-y: 35%;
  --shader-tint: rgba(30, 78, 104, 0.22);
  --shader-radius: 24px;
}

.shader-lit-surface {
  border-radius: var(--shader-radius);
  background:
    radial-gradient(640px circle at var(--shader-spot-x) var(--shader-spot-y),
      var(--shader-tint), transparent 70%);
}`,
    promptTemplate:
      'Tạo bề mặt giao diện có nguồn sáng radial-gradient phản hồi theo biến CSS (--shader-spot-x, --shader-spot-y) kết hợp lớp hạt bề mặt và bóng đổ 3 tầng.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'spatial-shader',
      code: 'VOL.09',
      title: 'Shader & Ánh Sáng',
      subtitleEn: 'LIGHT & SHADER FIELDS',
      accent: '#1E4E68',
      secondary: '#D7E8F2',
      paperTone: '#EFF5F9',
      editionTag: 'ARCHIVAL EDITION · 09',
      settings: { blurPx: 28, opacityPct: 68, radiusPx: 24, motionMs: 720, grainPct: 14 },
      modeLabels: ['Nguồn sáng: Tâm', 'Khúc xạ: IOR 1.52', 'Hạt giấy: Film'],
      unitLabels: ['Khúc xạ mép kính', 'Trường sáng 640px', 'Bóng đổ 3 tầng'],
    }),
  },
  {
    id: 'glacier-tokens',
    code: 'VOL.10',
    title: 'Token Không Gian',
    subtitleEn: 'DESIGN TOKEN ARCHITECTURE',
    group: 'glacier',
    groupLabel: 'TOKEN HỆ THỐNG',
    year: '2026',
    countLabel: '20 bộ',
    accent: '#375A7F',
    secondary: '#DFECF7',
    motif: 'matrix',
    editionTag: 'ARCHIVAL EDITION · 10',
    paperTone: '#F6F3EC',
    synopsisVi:
      '20 bộ biến CSS (:root) quản lý bảng màu Giấy và Mực, thang khoảng cách bội số 8px, bán kính góc bo và thời lượng chuyển tiếp toàn cục.',
    creditVi: 'Kiến trúc token đơn nguồn (Single Source of Truth) vận hành toàn bộ giao diện F-Forum v3.',
    settings: {
      blurPx: 14,
      opacityPct: 88,
      radiusPx: 16,
      motionMs: 380,
      grainPct: 7,
    },
    resources: [
      {
        title: 'Bảng màu kép Giấy & Mực (Paper & Ink Dual Palette)',
        tag: 'TOKENS · COLOR',
        detail: 'Khai báo biến --bg, --surface, --ink, --muted, --accent đồng bộ cho hai chế độ Sáng và Tối.',
      },
      {
        title: 'Thang khoảng cách 8px (8pt Spatial Grid)',
        tag: 'TOKENS · SPACING',
        detail: 'Định nghĩa bước đệm chuẩn từ 4px, 8px, 16px, 24px, 32px, 48px đến 96px.',
      },
      {
        title: 'Phân cấp độ cao Z-Index (Elevation & Layer Scale)',
        tag: 'TOKENS · LAYER',
        detail: 'Phân lớp rõ nền trang (0), thẻ nổi (10), thanh điều hướng (40) và hộp thoại (80).',
      },
      {
        title: 'Tập biến đường cong chuyển động (Easing Token Set)',
        tag: 'TOKENS · MOTION',
        detail: 'Cung cấp --ease-out-expo, --ease-spring và --duration-fast/base/slow dùng chung.',
      },
    ],
    cssSnippet: `:root {
  --bg-paper: #F6F3EC;
  --ink-primary: #141413;
  --ink-muted: #5C5A54;
  --accent-glacier: #375A7F;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-6: 48px;
  --radius-md: 16px;
}`,
    promptTemplate:
      'Khởi tạo bộ biến CSS :root gồm bảng màu Sáng và Tối, thang khoảng cách bội số 8px, thang chữ clamp() và các biến đường cong chuyển động.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'glacier-tokens',
      code: 'VOL.10',
      title: 'Token Không Gian',
      subtitleEn: 'DESIGN TOKEN ARCHITECTURE',
      accent: '#375A7F',
      secondary: '#DFECF7',
      paperTone: '#F6F3EC',
      editionTag: 'ARCHIVAL EDITION · 10',
      settings: { blurPx: 14, opacityPct: 88, radiusPx: 16, motionMs: 380, grainPct: 7 },
      modeLabels: ['Bảng màu: Giấy/Mực', 'Thang: 8pt Grid', 'Lớp: Z-Elevation'],
      unitLabels: ['Token Màu sắc', 'Token Khoảng cách', 'Token Chuyển động'],
    }),
  },
  {
    id: 'ui-responsive',
    code: 'VOL.11',
    title: 'Khung Đáp Ứng',
    subtitleEn: 'ADAPTIVE VIEWPORT FRAMES',
    group: 'ui',
    groupLabel: '390–1440 PX',
    year: '2026',
    countLabel: '15 mẫu',
    accent: '#2E6B5E',
    secondary: '#DCF0EB',
    motif: 'frame',
    editionTag: 'ARCHIVAL EDITION · 11',
    paperTone: '#F1F7F5',
    synopsisVi:
      '15 mẫu khung đáp ứng đa kích thước đảm bảo 0px tràn ngang ở 390px, bố cục 2 cột ở 768px và lưới toàn cảnh ở 1440px.',
    creditVi: 'Được kiểm tra qua bộ đo tự động trên 3 khung nhìn 390px, 768px và 1440px.',
    settings: {
      blurPx: 12,
      opacityPct: 92,
      radiusPx: 16,
      motionMs: 340,
      grainPct: 6,
    },
    resources: [
      {
        title: 'Thanh điều hướng 1 dòng (Single-Line Navbar)',
        tag: 'VIEWPORT · NAV',
        detail: 'Giữ toàn bộ nút điều hướng nằm trên 1 dòng ngang, tự thu gọn nhãn phụ ở chiều rộng 390px.',
      },
      {
        title: 'Lưới tự co giãn (Auto-Fit Fluid Grid)',
        tag: 'VIEWPORT · GRID',
        detail: 'Dùng biểu thức repeat(auto-fit, minmax(min(100%, 280px), 1fr)) ngăn tràn ngang.',
      },
      {
        title: 'Khung chuyển đổi 390/768/1440 (Viewport Switcher Stage)',
        tag: 'VIEWPORT · STAGE',
        detail: 'Hỗ trợ đổi trực tiếp chiều rộng khung nhìn giữa 3 mốc chuẩn ngay trong màn hình xem thử.',
      },
      {
        title: 'Bốn trạng thái dữ liệu (4-State View Guard)',
        tag: 'VIEWPORT · STATE',
        detail: 'Định nghĩa đủ 4 trạng thái hiển thị gồm Trống, Đang tải, Lỗi và Có dữ liệu cho mọi khung.',
      },
    ],
    cssSnippet: `:root {
  --container-pad: clamp(16px, 4vw, 48px);
  --card-min: 280px;
}

.adaptive-fluid-grid {
  width: 100%;
  padding-inline: var(--container-pad);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--card-min)), 1fr));
  gap: clamp(16px, 2.5vw, 28px);
}`,
    promptTemplate:
      'Xây dựng giao diện đáp ứng trên 390px, 768px và 1440px với lưới fluid grid không tràn ngang, thanh điều hướng 1 dòng và đủ 4 trạng thái dữ liệu.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'ui-responsive',
      code: 'VOL.11',
      title: 'Khung Đáp Ứng',
      subtitleEn: 'ADAPTIVE VIEWPORT FRAMES',
      accent: '#2E6B5E',
      secondary: '#DCF0EB',
      paperTone: '#F1F7F5',
      editionTag: 'ARCHIVAL EDITION · 11',
      settings: { blurPx: 12, opacityPct: 92, radiusPx: 16, motionMs: 340, grainPct: 6 },
      modeLabels: ['Khung: 390px', 'Khung: 768px', 'Khung: 1440px'],
      unitLabels: ['Thanh đỉnh 1 dòng', 'Lưới Auto-Fit', '4 trạng thái'],
    }),
  },
  {
    id: 'glacier-sandbox',
    code: 'VOL.12',
    title: 'Hộp Cát Thực Thi',
    subtitleEn: 'ISOLATED SANDBOX RUNTIME',
    group: 'glacier',
    groupLabel: 'SANDBOX',
    year: '2026',
    countLabel: '12 chuẩn',
    accent: '#5B4B8A',
    secondary: '#EAE5F7',
    motif: 'lens',
    editionTag: 'ARCHIVAL EDITION · 12',
    paperTone: '#F5F3FA',
    synopsisVi:
      '12 quy chuẩn cô lập hộp cát chạy mã HTML, CSS và JS trực tiếp trên trình duyệt với thuộc tính sandbox="allow-scripts" và bộ đo 6 chỉ số.',
    creditVi: 'Áp dụng cho toàn bộ Sân khấu Tương tác, Live Stage trong Workspace và kệ sách Glacier.',
    settings: {
      blurPx: 20,
      opacityPct: 80,
      radiusPx: 18,
      motionMs: 400,
      grainPct: 8,
    },
    resources: [
      {
        title: 'Khung chạy thử cô lập (Isolated Iframe Stage)',
        tag: 'SANDBOX · SECURITY',
        detail: 'Thiết lập sandbox="allow-scripts" và referrerPolicy="no-referrer", không cấp quyền cùng nguồn.',
      },
      {
        title: 'Bộ lọc làm sạch mã nhúng (Snippet Sanitizer Gate)',
        tag: 'SANDBOX · FILTER',
        detail: 'Tự động lược bỏ chỉ thị @import ngoài và chuẩn hóa danh sách phông chữ cục bộ.',
      },
      {
        title: 'Cổng đo 6 chỉ số (6-Check Diff & Audit)',
        tag: 'SANDBOX · AUDIT',
        detail: 'Đánh giá cấu trúc thẻ ngữ nghĩa, tỷ lệ tương phản, khung đáp ứng, bảo mật và biến CSS.',
      },
      {
        title: 'Công tắc nền Mực / Giấy (Ink & Paper Stage Toggle)',
        tag: 'SANDBOX · THEME',
        detail: 'Chuyển đổi trực tiếp giữa nền Sáng và Tối bên trong hộp cát để đối chiếu độ tương phản.',
      },
    ],
    cssSnippet: `:root {
  --sandbox-radius: 18px;
  --sandbox-border: rgba(91, 75, 138, 0.28);
  --sandbox-surface: #121316;
}

.glacier-sandbox-frame {
  width: 100%;
  min-height: 420px;
  border-radius: var(--sandbox-radius);
  border: 1px solid var(--sandbox-border);
  background: var(--sandbox-surface);
  overflow: hidden;
}`,
    promptTemplate:
      'Tạo khung chạy thử mã HTML/CSS/JS có thanh công cụ chọn khung nhìn 390/768/1440px, nút chuyển nền Mực/Giấy, nút Chạy lại và bảng xem mã nguồn.',
    liveDemoHtml: buildGlacierBookLiveHtml({
      id: 'glacier-sandbox',
      code: 'VOL.12',
      title: 'Hộp Cát Thực Thi',
      subtitleEn: 'ISOLATED SANDBOX RUNTIME',
      accent: '#5B4B8A',
      secondary: '#EAE5F7',
      paperTone: '#F5F3FA',
      editionTag: 'ARCHIVAL EDITION · 12',
      settings: { blurPx: 20, opacityPct: 80, radiusPx: 18, motionMs: 400, grainPct: 8 },
      modeLabels: ['Cô lập: Strict', 'Kiểm định: 6 đo', 'Truyền tin: Live'],
      unitLabels: ['Iframe Sandbox', 'Bộ lọc mã nhúng', 'Cổng 6 phép đo'],
    }),
  },
];
