#!/usr/bin/env node
/**
 * Collect ONLY genuinely FREE / PUBLIC ThreeUI scene previews with real playable
 * motion videos (excluding all ThreeUI Pro / access:"pro" / "pro"-tagged items).
 *
 * Usage: node scripts/sync-threeui-previews.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT =
  process.env.SOURCE_ARCHIVE_DIR ||
  path.resolve(ROOT, '../../source/ui-ux/sourceofknowledgforai');
const BASE = 'https://threeui.com';
const HEADERS = { 'user-agent': 'F-Forum preview indexer (+https://fforum3.vercel.app)' };

async function getText(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function readAssetMap(js, kind) {
  const ext = kind === 'preview' ? '(?:webm|mp4)' : 'jpg';
  const re = new RegExp(
    `"(\\/${kind === 'preview' ? 'previews' : 'thumbnails'}\\/[^"]+\\.${ext})":"(https:\\/\\/[^"]+)"`,
    'g'
  );
  const map = new Map();
  for (const match of js.matchAll(re)) map.set(match[1], match[2]);
  return map;
}

function extractBalancedObject(str, startIdx) {
  let depth = 0;
  let inStr = null;
  let escaped = false;
  const limit = Math.min(str.length, startIdx + 25000);
  for (let i = startIdx; i < limit; i += 1) {
    const ch = str[i];
    if (inStr) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return str.slice(startIdx, i + 1);
    }
  }
  return str.slice(startIdx, Math.min(str.length, startIdx + 3000));
}

function parseTagMap(js) {
  const pos = js.indexOf('"working-volumes":[');
  if (pos < 0) return {};
  const start = js.lastIndexOf('{', pos);
  const end = js.indexOf('};', pos) + 1;
  if (start < 0 || end <= start) return {};
  try {
    return Function(`return (${js.slice(start, end)})`)();
  } catch {
    return {};
  }
}

const html = await getText(`${BASE}/3d-assets/working-volumes`);
const bundlePath = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
if (!bundlePath) throw new Error('ThreeUI app bundle not found');
const js = await getText(`${BASE}${bundlePath}`);
const previews = readAssetMap(js, 'preview');
const thumbs = readAssetMap(js, 'thumb');
const tagMap = parseTagMap(js);

const records = new Map();
const idRe = /\{id:"([^"]+)"/g;
let m;
while ((m = idRe.exec(js))) {
  const id = m[1];
  const chunk = extractBalancedObject(js, m.index);
  if (!chunk.includes('preview:') && !chunk.includes('thumbnail:') && !chunk.includes('category:')) {
    continue;
  }
  const isProSelf =
    chunk.includes('access:"pro"') ||
    (Array.isArray(tagMap[id]) && tagMap[id].includes('pro'));
  const variantOf = chunk.match(/variantOf:"([^"]+)"/)?.[1] || null;
  const previewPath = chunk.match(/preview:"([^"]+)"/)?.[1] || '';
  const thumbPath = chunk.match(/thumbnail:"([^"]+)"/)?.[1] || '';
  const prev = records.get(id);
  records.set(id, {
    id,
    isProSelf: Boolean(prev?.isProSelf) || isProSelf,
    variantOf: prev?.variantOf || variantOf,
    previewPath: prev?.previewPath || previewPath,
    thumbPath: prev?.thumbPath || thumbPath,
  });
}

function isProRecord(id, seen = new Set()) {
  if (seen.has(id)) return false;
  seen.add(id);
  const rec = records.get(id);
  if (!rec) return true;
  if (rec.isProSelf) return true;
  if (rec.variantOf && isProRecord(rec.variantOf, seen)) return true;
  return false;
}

const manifestPath = path.join(SOURCE_ROOT, 'sources/threeui/manifest.json');
const manifestItems = JSON.parse(await readFile(manifestPath, 'utf8'));

const items = {};
let skippedPro = 0;
let skippedNoVideo = 0;

for (const item of manifestItems) {
  const parts = item.id.split('-');
  let matchedId = null;
  for (let cut = 0; cut < parts.length; cut += 1) {
    const candidate = parts.slice(cut).join('-');
    if (records.has(candidate)) {
      matchedId = candidate;
      break;
    }
  }
  if (!matchedId || isProRecord(matchedId)) {
    skippedPro += 1;
    continue;
  }
  const rec = records.get(matchedId);
  const videoUrl = rec.previewPath ? previews.get(rec.previewPath) || '' : '';
  const thumbUrl = rec.thumbPath ? thumbs.get(rec.thumbPath) || '' : '';
  if (!videoUrl) {
    skippedNoVideo += 1;
    continue;
  }
  items[item.id] = {
    v: videoUrl,
    ...(thumbUrl ? { t: thumbUrl } : {}),
  };
}

const out = {
  generatedAt: new Date().toISOString(),
  source: 'threeui-public-free',
  freeOnly: true,
  totalManifest: manifestItems.length,
  skippedPro,
  skippedNoVideo,
  count: Object.keys(items).length,
  items,
};

await writeFile(
  path.join(ROOT, 'public/data/threeui-previews.json'),
  `${JSON.stringify(out, null, 2)}\n`,
  'utf8'
);

console.log(
  JSON.stringify({
    freeOnly: true,
    manifestTotal: manifestItems.length,
    keptFreePlayable: out.count,
    skippedPro,
    skippedNoVideo,
  })
);
