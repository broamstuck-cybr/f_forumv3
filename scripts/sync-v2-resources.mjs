import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOT =
  process.env.SOURCE_ARCHIVE_DIR ||
  path.resolve(PROJECT_ROOT, '../SOURCEOFKNOWLEDGFORAI');
const VAULT_DIR = path.join(PROJECT_ROOT, 'public/data/vault');
const VAULT_INDEX = path.join(PROJECT_ROOT, 'public/data/studio-vault.json');
const MOTION_FULL = path.join(PROJECT_ROOT, 'public/data/motionsites-full.json');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data));
const writeShard = (name, payload) => {
  fs.writeFileSync(path.join(VAULT_DIR, `${name}.jgz`), zlib.gzipSync(JSON.stringify(payload), { level: 9 }));
};
const stripFrontmatter = (text) => text.replace(/^---[\s\S]*?---\s*/, '').trim();
const frontmatter = (text) => {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const out = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*"?([^"\n]*)"?$/);
    if (kv) out[kv[1]] = kv[2];
  }
  return out;
};
const isVideo = (url) => /\.(?:mp4|webm|mov|m4v)(?:\?|$)/i.test(url || '');
const isHls = (url) => /\.m3u8(?:\?|$)/i.test(url || '');
const unique = (items) => Array.from(new Set(items.filter(Boolean)));

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

const vault = readJson(VAULT_INDEX);
const items = Array.isArray(vault.items) ? vault.items : [];
const existing = new Set(items.map((item) => `${item.l}:${item.i}`));
let added = 0;

// ---------------------------------------------------------------------------
// MotionSites: 505 new catalog rows, with trailer/image separated by video_kind.
// ---------------------------------------------------------------------------
const motionIndex = readJson(path.join(SOURCE_ROOT, 'sources/motionsites/index.json'));
const motionFull = readJson(MOTION_FULL);
const promptById = new Map();
for (const file of walk(path.join(SOURCE_ROOT, 'sources/motionsites/prompts'), '.md')) {
  const raw = fs.readFileSync(file, 'utf8');
  const id = frontmatter(raw).id;
  if (id) promptById.set(id, stripFrontmatter(raw));
}

const newMotion = motionIndex.filter((entry) => !existing.has(`motionsites:${entry.id}`));
const motionShardSize = 80;
newMotion.forEach((entry, index) => {
  const shard = `ms-${5 + Math.floor(index / motionShardSize)}`;
  const video = entry.video_kind === 'video' && isVideo(entry.video_preview_url) ? entry.video_preview_url : '';
  const image =
    entry.image_preview_url ||
    (entry.video_kind === 'image' ? entry.video_preview_url : '') ||
    (isVideo(entry.video_preview_url) ? '' : entry.video_preview_url) ||
    '';
  const prompt = promptById.get(entry.id) || '';
  const payload = {
    h: '',
    c: '',
    j: '',
    p: prompt || `${entry.title}\n${entry.category}\n${entry.official_url}`,
    ...(image ? { img: image } : {}),
    ...(video ? { vid: video } : {}),
    ...(entry.official_url ? { u: entry.official_url } : {}),
  };
  const shardPayload = globalThis[`__ms_${shard}`] || {};
  shardPayload[entry.id] = payload;
  globalThis[`__ms_${shard}`] = shardPayload;

  if (!motionFull.items[entry.id]) {
    motionFull.items[entry.id] = {
      id: `ms-${entry.id}`,
      slug: entry.id,
      title: entry.title,
      category: entry.category,
      promptText: prompt,
      previewVideo: video || undefined,
      previewImage: image || undefined,
      liveUrl: entry.official_url,
      tags: unique([entry.type, ...(Array.isArray(entry.types) ? entry.types : [])]).slice(0, 6),
    };
  } else {
    const current = motionFull.items[entry.id];
    if (video) current.previewVideo = video;
    if (image) current.previewImage = image;
    if (prompt) current.promptText = prompt;
  }

  items.push({
    i: entry.id,
    t: entry.title,
    l: 'motionsites',
    g: 'Chuyển động',
    c: entry.category || 'Section',
    tg: unique([entry.type, ...(Array.isArray(entry.types) ? entry.types : []), entry.category]).slice(0, 4),
    s: shard,
    d: prompt || video || image ? 1 : 0,
  });
  added += 1;
});
for (const key of Object.keys(globalThis).filter((key) => key.startsWith('__ms_'))) {
  writeShard(key.slice(5), globalThis[key]);
}
newMotion.forEach((entry) => {
  const current = motionFull.items[entry.id];
  if (!current) return;
  if (entry.video_kind !== 'video') current.previewVideo = current.previewVideo && isVideo(current.previewVideo) ? current.previewVideo : undefined;
  if (!current.previewImage && entry.image_preview_url) current.previewImage = entry.image_preview_url;
});
motionFull.total = Object.keys(motionFull.items).length;
writeJson(MOTION_FULL, motionFull);

// ---------------------------------------------------------------------------
// LucianLabs: 80 new elements (401-480) with prompt + runnable demo.
// ---------------------------------------------------------------------------
const lucianManifest = readJson(path.join(SOURCE_ROOT, 'sources/lucianlabs/manifest.json'));
const newLucian = lucianManifest.filter((entry) => !existing.has(`lucianlabs:${entry.id}`));
const lucianBuckets = new Map();
newLucian.forEach((entry, index) => {
  const shard = `ll-${8 + Math.floor(index / 50)}`;
  const promptFile = path.join(SOURCE_ROOT, entry.prompt_path || '');
  const demoFile = path.join(SOURCE_ROOT, entry.demo_path || '');
  const prompt = fs.existsSync(promptFile) ? stripFrontmatter(fs.readFileSync(promptFile, 'utf8')) : '';
  const demo = fs.existsSync(demoFile) ? fs.readFileSync(demoFile, 'utf8') : '';
  if (!lucianBuckets.has(shard)) lucianBuckets.set(shard, {});
  lucianBuckets.get(shard)[entry.id] = {
    h: demo,
    c: '',
    j: '',
    p: prompt || entry.summary || entry.title,
    ...(entry.url ? { u: entry.url } : {}),
  };
  items.push({
    i: entry.id,
    t: entry.title,
    l: 'lucianlabs',
    g: 'Hiệu ứng',
    c: entry.category || 'UI Element',
    tg: unique([entry.collection, ...(entry.tags || [])]).slice(0, 4),
    s: shard,
    d: demo ? 1 : 0,
  });
  added += 1;
});
for (const [shard, payload] of lucianBuckets) writeShard(shard, payload);

// ---------------------------------------------------------------------------
// GetLayers: 74 new layers, media + description, no gated prompt.
// ---------------------------------------------------------------------------
const getlayersIndex = readJson(path.join(SOURCE_ROOT, 'sources/getlayers/index.json'));
const newGetlayers = getlayersIndex.filter((entry) => !existing.has(`glacier:${entry.id}`));
const glPayload = {};
for (const entry of newGetlayers) {
  glPayload[entry.id] = {
    h: '',
    c: '',
    j: '',
    p: entry.description || `${entry.title}\n${entry.category}\n${entry.page_url}`,
    ...(entry.image_url ? { img: entry.image_url } : {}),
    ...(isVideo(entry.video_url) ? { vid: entry.video_url } : {}),
    ...(entry.page_url ? { u: entry.page_url } : {}),
  };
  items.push({
    i: entry.id,
    t: entry.title,
    l: 'glacier',
    g: 'Nền & Lớp',
    c: entry.category || 'Layer',
    tg: unique([...(entry.tags || []), ...(entry.stack || []), entry.category]).slice(0, 4),
    s: 'gl-3',
    d: 1,
  });
  added += 1;
}
if (Object.keys(glPayload).length) writeShard('gl-3', glPayload);

vault.items = items;
vault.total = items.length;
writeJson(VAULT_INDEX, vault);

console.log(
  JSON.stringify(
    {
      added,
      total: items.length,
      motionsites: newMotion.length,
      lucianlabs: newLucian.length,
      getlayers: newGetlayers.length,
    },
    null,
    2
  )
);
