#!/usr/bin/env node
/**
 * Collect the public ThreeUI scene previews used by the experience stage.
 *
 * ThreeUI ships an app bundle whose item records point at WebM previews on its
 * public media bucket. The item ids in studio-vault use a category prefix, so
 * this script matches the longest suffix that exists in the app data.
 *
 * Usage: node scripts/sync-threeui-previews.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://threeui.com';
const HEADERS = { 'user-agent': 'F-Forum preview indexer (+https://fforum3.vercel.app)' };

async function getText(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function readAssetMap(js, kind) {
  const ext = kind === 'preview' ? '(?:webm|mp4)' : 'jpg';
  const re = new RegExp(`"(\\/${kind === 'preview' ? 'previews' : 'thumbnails'}\\/[^"]+\\.${ext})":"(https:\\/\\/[^"]+)"`, 'g');
  const map = new Map();
  for (const match of js.matchAll(re)) map.set(match[1], match[2]);
  return map;
}

function itemChunk(js, id) {
  const at = js.indexOf(`id:"${id}"`);
  if (at < 0) return '';
  const next = js.indexOf('},{id:"', at + 6);
  return js.slice(at, next > 0 ? next : at + 4000);
}

const html = await getText(`${BASE}/3d-assets/amber-house-study`);
const bundlePath = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
if (!bundlePath) throw new Error('ThreeUI app bundle not found');
const js = await getText(`${BASE}${bundlePath}`);
const previews = readAssetMap(js, 'preview');
const thumbs = readAssetMap(js, 'thumb');

/* The generic "Sections" entries are category indexes, not single scenes.
   Their ThreeUI page has no preview of its own, so use the first published
   section in that category and mark it as representative in the UI. */
const sectionsHtml = await getText(`${BASE}/sections`);
const sectionRepresentatives = new Map();
for (const match of sectionsHtml.matchAll(/href="\/sections\/([^\/"]+)\/([^"#?]+)"/g)) {
  const [, category, sectionId] = match;
  if (!sectionRepresentatives.has(category)) sectionRepresentatives.set(category, sectionId);
}

const vault = JSON.parse(await readFile(path.join(ROOT, 'public/data/studio-vault.json'), 'utf8'));
const threeui = vault.items.filter((item) => item.l === 'threeui');

const CATEGORY_PREFIXES = [
  '3d-assets-',
  'backgrounds-',
  'buttons-',
  'css-',
  'hero-',
  'landing-pages-',
  'motion-design-',
  'sections-',
  'text-animation-',
  'three-js-',
  'ui-elements-',
];

/* Catalog ids describe a section of the archive; these map to the public
   preview asset that the ThreeUI app actually publishes. */
const PREVIEW_ALIASES = {
  'portal-field-bell-field': 'bell-field',
  'portal-field-cloud-field': 'cloud-field',
  'portal-field-flow-field': 'flow-field',
  'portal-field-stream-convergence': 'stream-convergence',
  'spark-badge-browser': 'spark-browser',
  'spark-badge-iphone': 'spark-iphone',
  'spark-badge-studio-display': 'spark-studio-display',
  'energy-orb-tangled-constellations': 'tangled-constellations',
  'apple-devices-studio-display': 'apple-devices-studio-display',
  'rectangle-buttons-dot-border-button': 'dot-border-button',
  'rectangle-buttons-floating-dots-cta': 'floating-dots-cta',
  'rectangle-buttons-generate-button': 'generate-button',
  'rectangle-buttons-glassmorphism-cta': 'glassmorphism-cta',
  'rectangle-buttons-gradient-beam-cta': 'gradient-beam-cta',
  'rectangle-buttons-gradient-cta': 'gradient-cta',
  'rectangle-buttons-gradient-pill-button': 'gradient-pill-button',
  'rectangle-buttons-launch-button': 'launch-button',
  'rectangle-buttons-sliding-text-cta': 'sliding-text-cta',
  'rectangle-buttons-spinning-border-button': 'spinning-border-button',
  'article-headings-audio-wordmark': 'audio-wordmark',
  'article-headings-threeui-intro': 'threeui-intro',
  'article-headings-particle-wordmark': 'particle-wordmark',
  kibori: 'kibori-landing-page',
};

function stripCategory(id) {
  for (const prefix of CATEGORY_PREFIXES) {
    if (id.startsWith(prefix)) return id.slice(prefix.length);
  }
  return id;
}

function previewFromPath(path) {
  return path ? previews.get(path) || '' : '';
}

function thumbnailFromPath(path) {
  return path ? thumbs.get(path) || '' : '';
}

function previewCandidates(id) {
  const base = stripCategory(id);
  const alias = PREVIEW_ALIASES[base] || PREVIEW_ALIASES[id];
  const candidates = [
    alias,
    base,
    `${base}-hero`,
    `${base}-page`,
    base.replace(/-page$/, '-hero'),
    base.replace(/-landing-page$/, '-hero'),
  ].filter(Boolean);
  return [...new Set(candidates)];
}

function previewForCandidate(candidate) {
  for (const ext of ['webm', 'mp4']) {
    const url = previews.get(`/previews/${candidate}.${ext}`);
    if (url) return { url, path: `/previews/${candidate}.${ext}` };
  }
  return null;
}

const items = {};
for (const item of threeui) {
  const parts = item.i.split('-');
  let resolved = null;

  /* First pass: the item record already carries a preview path. */
  for (let cut = 0; cut < parts.length; cut += 1) {
    const candidate = parts.slice(cut).join('-');
    const chunk = itemChunk(js, candidate);
    if (!chunk) continue;
    const preview = previewFromPath(chunk.match(/preview:"([^"]+)"/)?.[1]);
    if (!preview) continue;
    const thumb = thumbnailFromPath(chunk.match(/thumbnail:"([^"]+)"/)?.[1]);
    resolved = { v: preview, t: thumb };
    break;
  }

  /* Second pass: the archive id differs from the published asset id. */
  if (!resolved) {
    for (const candidate of previewCandidates(item.i)) {
      const asset = previewForCandidate(candidate);
      if (!asset) continue;
      const thumb = thumbs.get(`/thumbnails/${candidate}.jpg`) || '';
      resolved = thumb ? { v: asset.url, t: thumb } : { v: asset.url };
      break;
    }
  }

  /* Third pass: category indexes link to a real section of that type. */
  if (!resolved && item.i.startsWith('sections-')) {
    const sectionId = sectionRepresentatives.get(item.i.slice('sections-'.length));
    const asset = sectionId ? previewForCandidate(sectionId) : null;
    if (asset) {
      const thumb = thumbs.get(`/thumbnails/${sectionId}.jpg`) || '';
      resolved = thumb ? { v: asset.url, t: thumb, r: true } : { v: asset.url, r: true };
    }
  }

  if (resolved) items[item.i] = resolved;
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: `${BASE}${bundlePath}`,
  total: threeui.length,
  count: Object.keys(items).length,
  items,
};
await writeFile(
  path.join(ROOT, 'public/data/threeui-previews.json'),
  `${JSON.stringify(payload)}\n`,
  'utf8'
);
console.log(`ThreeUI previews: ${payload.count}/${payload.total} -> public/data/threeui-previews.json`);
