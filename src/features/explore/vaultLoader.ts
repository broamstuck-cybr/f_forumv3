import type { PreviewTheme } from './catalog';

export type VaultLibraryKey =
  | 'pinui'
  | 'codefronts'
  | 'lucianlabs'
  | 'motionsites'
  | 'threeui'
  | 'glacier';

export interface VaultIndexItem {
  i: string;
  t: string;
  l: VaultLibraryKey;
  g: string;
  c: string;
  tg: string[];
  s: string;
  d: number;
}

export interface VaultIndexData {
  total: number;
  sharded?: boolean;
  shardExt?: string;
  items: VaultIndexItem[];
}

export interface VaultShardPayload {
  h: string;
  c: string;
  j: string;
  cl?: string;
  p: string;
  m?: {
    tone?: string;
    stack?: string[];
    mood?: string[];
    layout?: string;
    runtime?: string;
    category?: string;
  };
}

export const VAULT_LIBRARY_LABELS: Record<VaultLibraryKey, string> = {
  pinui: 'Tương tác',
  lucianlabs: 'Hiệu ứng',
  threeui: 'Không gian 3D',
  motionsites: 'Chuyển động',
  codefronts: 'Bố cục',
  glacier: 'Nền & Lớp',
};

let vaultIndexCache: VaultIndexData | null = null;
let vaultIndexPromise: Promise<VaultIndexData> | null = null;

const shardCache = new Map<string, Record<string, VaultShardPayload>>();
const shardInflight = new Map<string, Promise<Record<string, VaultShardPayload>>>();

export function getCachedVaultIndex(): VaultIndexData | null {
  return vaultIndexCache;
}

export function fetchVaultIndex(): Promise<VaultIndexData> {
  if (vaultIndexCache) return Promise.resolve(vaultIndexCache);
  if (!vaultIndexPromise) {
    vaultIndexPromise = fetch('/data/studio-vault.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<VaultIndexData>;
      })
      .then((data) => {
        const normalized: VaultIndexData = {
          total: typeof data?.total === 'number' ? data.total : (data?.items?.length ?? 0),
          sharded: Boolean(data?.sharded),
          shardExt: typeof data?.shardExt === 'string' ? data.shardExt : 'jgz',
          items: Array.isArray(data?.items) ? data.items : [],
        };
        vaultIndexCache = normalized;
        return normalized;
      })
      .catch((err) => {
        vaultIndexPromise = null;
        throw err;
      });
  }
  return vaultIndexPromise;
}

export function getCachedVaultShard(
  shardName: string
): Record<string, VaultShardPayload> | null {
  return shardCache.get(shardName) ?? null;
}

// WHY: Inspect gzip magic bytes (0x1f 0x8b) so shards decode identically whether a proxy auto-decompresses or sends raw bytes.
async function decodeShardBuffer(buf: ArrayBuffer): Promise<Record<string, VaultShardPayload>> {
  const bytes = new Uint8Array(buf);
  let text: string;
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Trình duyệt không hỗ trợ giải nén shard gzip.');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    text = await new Response(stream).text();
  } else {
    text = new TextDecoder('utf-8').decode(bytes);
  }
  const parsed = JSON.parse(text) as Record<string, VaultShardPayload>;
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export function fetchVaultShard(
  shardName: string
): Promise<Record<string, VaultShardPayload>> {
  if (!shardName || shardName === 'pinui') return Promise.resolve({});
  const cached = shardCache.get(shardName);
  if (cached) return Promise.resolve(cached);

  const pending = shardInflight.get(shardName);
  if (pending) return pending;

  const ext = vaultIndexCache?.shardExt || 'jgz';
  const req = fetch(`/data/vault/${encodeURIComponent(shardName)}.${ext}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((buf) => decodeShardBuffer(buf))
    .then((safe) => {
      shardCache.set(shardName, safe);
      shardInflight.delete(shardName);
      return safe;
    })
    .catch((err) => {
      shardInflight.delete(shardName);
      throw err;
    });

  shardInflight.set(shardName, req);
  return req;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let idx = 0; idx < input.length; idx += 1) {
    h ^= input.charCodeAt(idx);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function buildMetadataStagePreview(
  item: VaultIndexItem,
  payload: VaultShardPayload | null,
  theme: PreviewTheme
): { html: string; css: string; js: string } {
  const seed = hashSeed(item.i);
  const hueA = (seed % 34) + (item.l === 'threeui' ? 196 : item.l === 'glacier' ? 16 : 6);
  const hueB = (hueA + 42) % 360;
  const isDark = theme === 'dark' || payload?.m?.tone === 'dark';
  const bg = isDark ? '#121110' : '#f4f0e6';
  const card = isDark ? '#1a1917' : '#ebe6da';
  const fg = isDark ? '#f2ede3' : '#17150f';
  const muted = isDark ? '#b5afa3' : '#575249';
  const line = isDark ? 'rgba(242,237,227,0.14)' : 'rgba(23,21,15,0.14)';
  const safeTitle = escapeHtml(item.t);
  const safeGroup = escapeHtml(VAULT_LIBRARY_LABELS[item.l] || item.g);
  const safeCat = escapeHtml(item.c);
  const stack = (payload?.m?.stack ?? []).slice(0, 4);
  const chips = (stack.length > 0 ? stack : item.tg).slice(0, 4);
  const chipMarkup = chips
    .map((tag) => `<span class="sp-chip">${escapeHtml(tag)}</span>`)
    .join('');

  const html = `<main class="sp-stage" data-mode="${item.l}">
  <canvas id="sp-canvas" class="sp-canvas" aria-hidden="true"></canvas>
  <section class="sp-card">
    <div class="sp-head">
      <span class="sp-kicker">${safeGroup} · ${safeCat}</span>
      <span class="sp-readout" id="sp-readout">Góc nhìn 24°</span>
    </div>
    <h1 class="sp-title">${safeTitle}</h1>
    <div class="sp-chips">${chipMarkup}</div>
    <div class="sp-controls">
      <label class="sp-slider">
        <span>Cường độ chuyển động</span>
        <input id="sp-speed" type="range" min="15" max="180" value="75" />
      </label>
      <label class="sp-slider">
        <span>Độ sâu trường sáng</span>
        <input id="sp-depth" type="range" min="20" max="100" value="64" />
      </label>
      <button type="button" id="sp-pulse" class="sp-btn">Đổi pha ánh sáng</button>
    </div>
  </section>
</main>`;

  const css = `*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:${bg};color:${fg};font-family:'Be Vietnam Pro',system-ui,sans-serif;overflow:hidden}
.sp-stage{position:relative;min-height:100dvh;display:grid;place-items:center;padding:24px;isolation:isolate}
.sp-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0}
.sp-card{position:relative;z-index:1;width:min(540px,100%);padding:26px;border-radius:18px;background:color-mix(in srgb,${card} 86%,transparent);backdrop-filter:blur(16px);border:1px solid ${line};display:grid;gap:14px}
.sp-head{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${muted}}
.sp-title{margin:0;font-size:clamp(22px,3.2vw,30px);line-height:1.18;font-weight:600;letter-spacing:-.02em}
.sp-chips{display:flex;flex-wrap:wrap;gap:6px}
.sp-chip{padding:4px 10px;border-radius:999px;border:1px solid ${line};font-size:11px;color:${muted}}
.sp-controls{display:grid;gap:10px;padding-top:10px;border-top:1px solid ${line}}
.sp-slider{display:grid;gap:4px;font-size:12px;color:${muted}}
.sp-slider input{accent-color:hsl(${hueA} 76% 56%);width:100%}
.sp-btn{justify-self:start;min-height:38px;padding:0 16px;border-radius:999px;border:1px solid ${line};background:${fg};color:${bg};font-weight:600;font-size:12.5px;cursor:pointer}`;

  const js = `(function(){
  var canvas = document.getElementById('sp-canvas');
  var speedEl = document.getElementById('sp-speed');
  var depthEl = document.getElementById('sp-depth');
  var pulseBtn = document.getElementById('sp-pulse');
  var readout = document.getElementById('sp-readout');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var phase = 0;
  var paletteShift = 0;
  var pointerX = 0.5;
  var pointerY = 0.5;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', function(e){
    pointerX = e.clientX / Math.max(1, window.innerWidth);
    pointerY = e.clientY / Math.max(1, window.innerHeight);
    if (readout) readout.textContent = 'Góc nhìn ' + Math.round((pointerX - 0.5) * 60) + '°';
  });
  if (pulseBtn) {
    pulseBtn.addEventListener('click', function(){
      paletteShift = (paletteShift + 38) % 360;
    });
  }
  function draw(){
    var w = window.innerWidth;
    var h = window.innerHeight;
    var spd = speedEl ? Number(speedEl.value) / 100 : 0.75;
    var dep = depthEl ? Number(depthEl.value) / 100 : 0.64;
    ctx.clearRect(0, 0, w, h);
    var h1 = (${hueA} + paletteShift) % 360;
    var h2 = (${hueB} + paletteShift) % 360;
    for (var i = 0; i < 3; i++) {
      var ang = phase * (0.6 + i * 0.25) + i * 2.1;
      var cx = w * (0.28 + i * 0.22) + Math.cos(ang) * 70 * dep + (pointerX - 0.5) * 48;
      var cy = h * (0.34 + (i % 2) * 0.3) + Math.sin(ang * 1.1) * 52 * dep + (pointerY - 0.5) * 36;
      var rad = Math.max(w, h) * (0.24 + dep * 0.14);
      var grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, rad);
      grad.addColorStop(0, 'hsla(' + (i % 2 === 0 ? h1 : h2) + ', 78%, 56%, ' + (0.28 * dep) + ')');
      grad.addColorStop(1, 'hsla(' + h2 + ', 70%, 40%, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'hsla(' + h1 + ', 60%, 62%, 0.16)';
    ctx.lineWidth = 1;
    var rings = 7;
    for (var r = 1; r <= rings; r++) {
      var rx = (w * 0.08) * r * (0.7 + dep * 0.45);
      var ry = rx * (0.48 + Math.sin(phase + r * 0.4) * 0.08);
      ctx.beginPath();
      ctx.ellipse(w * 0.5 + (pointerX - 0.5) * 28, h * 0.5 + (pointerY - 0.5) * 20, rx, Math.abs(ry), Math.sin(phase * 0.3) * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (!reduced) {
      phase += 0.014 * spd;
      requestAnimationFrame(draw);
    }
  }
  draw();
})();`;

  return { html, css, js };
}
