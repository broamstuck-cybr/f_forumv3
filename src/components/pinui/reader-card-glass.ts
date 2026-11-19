export interface LiquidGlassOptions {
  ior?: number;
  thickness?: number;
  dispersion?: number;
  blur?: number;
  saturate?: number;
}

export interface LiquidGlassCleanup {
  destroy: () => void;
}

function edgeFactor(depth: number, thickness: number, ior: number): number {
  const ratio = Math.max(0, Math.min(1, 1 - depth / Math.max(1, thickness)));
  return Math.pow(ratio, 2.2) * (ior - 1) * 28;
}

export function supportsSvgBackdrop(): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined') return false;
  const ua = navigator as Navigator & { userAgentData?: { brands?: Array<{ brand: string }> } };
  const isChromium = Boolean(
    ua.userAgentData?.brands?.some((b) => /chrom|edge|opera/i.test(b.brand)) ||
      /Chrome|Edg\//.test(navigator.userAgent)
  );
  if (!isChromium) return false;
  return CSS.supports('backdrop-filter', 'url(#x)');
}

function ensureSheenOverlay(el: HTMLElement): HTMLSpanElement {
  let sheen = el.querySelector<HTMLSpanElement>(':scope > .prc-lg__sheen');
  if (!sheen) {
    sheen = document.createElement('span');
    sheen.className = 'prc-lg__sheen';
    sheen.setAttribute('aria-hidden', 'true');
    el.appendChild(sheen);
  }
  return sheen;
}

export function liquidGlass(el: HTMLElement, opts: LiquidGlassOptions = {}): LiquidGlassCleanup {
  const ior = opts.ior ?? 1.42;
  const thickness = opts.thickness ?? 18;
  const blur = opts.blur ?? 14;
  const saturate = opts.saturate ?? 1.45;
  const dispersion = opts.dispersion ?? 0.14;

  el.classList.add('prc-lg');
  const sheen = ensureSheenOverlay(el);

  if (!supportsSvgBackdrop()) {
    el.style.backdropFilter = `blur(${blur}px) saturate(${saturate})`;
    (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
      `blur(${blur}px) saturate(${saturate})`;
    return {
      destroy: () => {
        sheen.remove();
        el.style.backdropFilter = '';
      },
    };
  }

  const uid = `prc-lg-${Math.random().toString(36).slice(2, 9)}`;
  const rect = el.getBoundingClientRect();
  const w = Math.max(64, Math.round(rect.width || 220));
  const h = Math.max(40, Math.round(rect.height || 56));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    el.style.backdropFilter = `blur(${blur}px) saturate(${saturate})`;
    return { destroy: () => sheen.remove() };
  }

  const img = ctx.createImageData(w, h);
  const rCorner = Math.min(w, h) * 0.45;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dx = Math.max(0, Math.abs(x - w / 2) - (w / 2 - rCorner));
      const dy = Math.max(0, Math.abs(y - h / 2) - (h / 2 - rCorner));
      const dist = Math.max(0, rCorner - Math.hypot(dx, dy));
      const mag = edgeFactor(dist, thickness, ior);
      const nx = (x - w / 2) / Math.max(1, w / 2);
      const ny = (y - h / 2) / Math.max(1, h / 2);
      const idx = (y * w + x) * 4;
      img.data[idx] = Math.max(0, Math.min(255, Math.round(128 + nx * mag)));
      img.data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + ny * mag)));
      img.data[idx + 2] = 128;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const dataUrl = canvas.toDataURL();

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';

  const defs = document.createElementNS(svgNS, 'defs');
  const filter = document.createElementNS(svgNS, 'filter');
  filter.setAttribute('id', uid);
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  const feImg = document.createElementNS(svgNS, 'feImage');
  feImg.setAttribute('href', dataUrl);
  feImg.setAttribute('result', 'dispMap');

  const baseScale = 12;
  const feDisp = document.createElementNS(svgNS, 'feDisplacementMap');
  feDisp.setAttribute('in', 'SourceGraphic');
  feDisp.setAttribute('in2', 'dispMap');
  feDisp.setAttribute('scale', String(baseScale * (1 + dispersion)));
  feDisp.setAttribute('xChannelSelector', 'R');
  feDisp.setAttribute('yChannelSelector', 'G');
  feDisp.setAttribute('result', 'refracted');

  const feSat = document.createElementNS(svgNS, 'feColorMatrix');
  feSat.setAttribute('in', 'refracted');
  feSat.setAttribute('type', 'saturate');
  feSat.setAttribute('values', String(saturate));

  filter.appendChild(feImg);
  filter.appendChild(feDisp);
  filter.appendChild(feSat);
  defs.appendChild(filter);
  svg.appendChild(defs);
  document.body.appendChild(svg);

  el.style.backdropFilter = `url(#${uid}) blur(${Math.max(2, blur * 0.45)}px)`;

  return {
    destroy: () => {
      el.style.backdropFilter = '';
      svg.remove();
      sheen.remove();
    },
  };
}

export function glassSheet(el: HTMLElement, opts: LiquidGlassOptions = {}): LiquidGlassCleanup {
  const blur = opts.blur ?? 22;
  const saturate = opts.saturate ?? 1.6;
  el.classList.add('prc-lg');
  const sheen = ensureSheenOverlay(el);
  el.style.backdropFilter = `blur(${blur}px) saturate(${saturate})`;
  (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
    `blur(${blur}px) saturate(${saturate})`;
  return {
    destroy: () => {
      sheen.remove();
      el.style.backdropFilter = '';
    },
  };
}
