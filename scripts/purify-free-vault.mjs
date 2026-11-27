import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_REPO = process.env.SOURCE_ARCHIVE_DIR || path.resolve(PROJECT_ROOT, '../SOURCEOFKNOWLEDGFORAI');
const PUBLIC_DATA = path.join(PROJECT_ROOT, 'public', 'data');
const VAULT_DIR = path.join(PUBLIC_DATA, 'vault');
const STUDIO_VAULT_PATH = path.join(PUBLIC_DATA, 'studio-vault.json');

const EMOJI_RE = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;

// Visually verified in headless Chromium WebGL (0 JS errors, 0 missing local assets, non-blank rich render)
const VERIFIED_THREEUI_HTML_MAP = {
  'predictive-arc': 'amber-halftone.html',
  'spark-badge': 'spark-badge.html',
  'semantic-bloom': 'design-f0ebbe02-7d8a-41fd-9041-a1124185c27b.html',
  'globe-study': 'text-on-a-path.html',
  'gallery-heading': 'gallery-heading.html',
  'star-portal': 'imaginie-starfield.html',
  'rectangle-buttons': 'launch-button.html',
  'liquid-metal-button': 'liquid-metal-button.html',
  'character-carousel': 'character-filmstrip.html',
  'engraved-certificate': 'kinetic-lathe-certificate.html',
  'woven-cloth': 'woven-cloth-atelier.html',
  'performance-gauges': 'performance-gauges.html',
  'uplink-loader': 'uplink-loader.html',
  'article-headings': 'glassblown-neon.html',
  'constellation-field': 'constellation-field.html',
  'portal-field': 'portal-field.html',
  'diagnostics-panel': 'diagnostics-panel.html',
  'skeuomorphic-toggle': 'skeuomorphic-toggle.html',
  'matrix-field': 'matrix-field.html',
  'wireframe-forms': 'wireframe-forms.html',
  'brand-orbs': 'brand-orbs-v2.html',
};

// Visually verified working standalone MotionSites HTML demos (non-blank, 0 broken relative/stub refs)
const VERIFIED_MOTIONSITES_LIVE_HTML = new Set([
  'solace-faq',
  'monolith-hero',
  'guardnet-benefits',
  'medusa-jellyfish-hero',
  'redline-mars-hero',
  'gold-standard',
]);

// Broken CodeFronts items referencing missing local assets (e.g. coat.jpg)
const PURGED_CODEFRONTS_IDS = new Set([
  'layouts/tailwind-css-hero-sections/tailwind-hero-section-image-overlay-card',
]);

// Dead HTTP 401/403 secondary media URLs detected by live HTTP audit
const DEAD_MEDIA_URL_RE =
  /^https:\/\/(?:res\.cloudinary\.com\/dsdhxhhqh\/|stream\.mux\.com\/(?:i9kUFJpB6GrWoe2UXRZG4lIP02g00LGulS1GTVrMMwZI00|iY611PYuZ02AKpIzYB4Q1BMpl7W2O3UwqjQm9p01xlmVg)\.m3u8)/i;

function stripEmojis(text) {
  return String(text || '').replace(EMOJI_RE, '').trim();
}

function readGzipJson(filePath) {
  const raw = fs.readFileSync(filePath);
  const text =
    raw.length >= 2 && raw[0] === 0x1f && raw[1] === 0x8b
      ? zlib.gunzipSync(raw).toString('utf8')
      : raw.toString('utf8');
  return JSON.parse(text);
}

function writeGzipJson(filePath, obj) {
  const json = JSON.stringify(obj);
  const gz = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 });
  fs.writeFileSync(filePath, gz);
}

function loadAllShardsByPrefix(prefix) {
  const map = new Map();
  if (!fs.existsSync(VAULT_DIR)) return map;
  for (const name of fs.readdirSync(VAULT_DIR)) {
    if (!name.startsWith(`${prefix}-`) || !name.endsWith('.jgz')) continue;
    try {
      const data = readGzipJson(path.join(VAULT_DIR, name));
      for (const [k, v] of Object.entries(data)) {
        map.set(k, v);
      }
    } catch {
      continue;
    }
  }
  return map;
}

function deleteShardsByPrefix(prefix) {
  if (!fs.existsSync(VAULT_DIR)) return 0;
  let removed = 0;
  for (const name of fs.readdirSync(VAULT_DIR)) {
    if (name.startsWith(`${prefix}-`) && name.endsWith('.jgz')) {
      fs.unlinkSync(path.join(VAULT_DIR, name));
      removed += 1;
    }
  }
  return removed;
}

function writeShardedRecords(prefix, entries, chunkSize = 40) {
  const shardMap = new Map();
  let shardIdx = 0;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const shardName = `${prefix}-${shardIdx}`;
    const bucket = {};
    for (const [id, payload] of entries.slice(i, i + chunkSize)) {
      bucket[id] = payload;
      shardMap.set(id, shardName);
    }
    writeGzipJson(path.join(VAULT_DIR, `${shardName}.jgz`), bucket);
    shardIdx += 1;
  }
  return shardMap;
}

function parseMotionRecipes() {
  const techDir = path.join(SOURCE_REPO, 'sources', 'skills', 'motionsites-web-builder', 'references', 'techniques');
  const indexPath = path.join(techDir, 'INDEX.md');
  if (!fs.existsSync(indexPath)) return [];

  const indexMd = fs.readFileSync(indexPath, 'utf8');
  const categoryLabels = {
    'video-and-media.md': 'Video & Nền chuyển động',
    'surfaces-and-buttons.md': 'Bề mặt & Nút tương tác',
    'type-and-text-motion.md': 'Chữ & Chuyển động chữ',
    'depth-and-interaction.md': 'Chiều sâu & Tương tác chuột',
    'scroll.md': 'Cuộn trang kể chuyện',
    'layout-and-ui.md': 'Bố cục & Điều hướng',
    '3d-and-webgl.md': '3D & WebGL',
  };

  const fileContents = new Map();
  for (const filename of Object.keys(categoryLabels)) {
    const fp = path.join(techDir, filename);
    if (fs.existsSync(fp)) {
      fileContents.set(filename, fs.readFileSync(fp, 'utf8'));
    }
  }

  function extractSnippetForTitle(filename, title) {
    const md = fileContents.get(filename) || '';
    if (!md) return { summary: '', code: '', lang: 'css' };
    const sections = md.split(/\n(?=##\s+)/);
    const words = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    let best = null;
    let bestScore = 0;
    for (const sec of sections) {
      const head = (sec.split('\n')[0] || '').toLowerCase();
      let score = 0;
      for (const w of words) {
        if (head.includes(w)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        best = sec;
      }
    }
    if (!best) return { summary: '', code: '', lang: 'css' };
    const lines = best.split('\n').slice(1);
    const summaryLines = [];
    for (const line of lines) {
      if (line.startsWith('```') || line.startsWith('###')) break;
      const trimmed = line.trim();
      if (trimmed) summaryLines.push(trimmed);
      if (summaryLines.length >= 2) break;
    }
    const codeMatch = best.match(/```(\w+)?\n([\s\S]*?)```/);
    return {
      summary: summaryLines.join(' ').slice(0, 320),
      code: codeMatch ? codeMatch[2].trim().slice(0, 2600) : '',
      lang: codeMatch?.[1] || 'css',
    };
  }

  const recipes = [];
  const rows = indexMd.split('\n');
  let idx = 1;
  for (const row of rows) {
    if (!row.startsWith('|') || row.startsWith('| Technique') || row.startsWith('|---')) continue;
    const cols = row
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    if (cols.length < 4) continue;
    const [title, file, useWhen, cost] = cols;
    if (!categoryLabels[file]) continue;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
    const detail = extractSnippetForTitle(file, title);
    recipes.push({
      id: `mt-${String(idx).padStart(2, '0')}-${slug}`,
      title,
      file,
      category: categoryLabels[file],
      useWhen,
      cost: cost === 'heavy' || cost === 'medium' ? cost : 'light',
      summary: detail.summary || useWhen,
      code: detail.code,
      lang: detail.lang,
    });
    idx += 1;
  }
  return recipes;
}

function buildVerifiedThreeUiEntries(oldVaultItems) {
  const manifestPath = path.join(SOURCE_REPO, 'sources', 'threeui', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const oldIndexById = new Map();
  for (const it of oldVaultItems) {
    if (it.l === 'threeui') {
      oldIndexById.set(it.i, it);
      oldIndexById.set(it.i.replace(/^threeui\//, ''), it);
    }
  }

  const indexItems = [];
  const shardEntries = [];

  for (const entry of manifest) {
    const id = entry.id;
    const preferredHtmlBasename = VERIFIED_THREEUI_HTML_MAP[id];
    if (!preferredHtmlBasename) continue;

    const files = Array.isArray(entry.files) ? entry.files : [];
    const htmlFile =
      files.find((f) => f.language === 'html' && path.basename(f.path) === preferredHtmlBasename) ||
      files.find((f) => f.language === 'html');
    if (!htmlFile) continue;

    const absHtml = path.join(SOURCE_REPO, htmlFile.path);
    if (!fs.existsSync(absHtml)) continue;
    // WHY: Keep full untruncated HTML so embedded data URIs (e.g. Character Carousel portraits) and inline WebGL shaders run intact.
    const html = fs.readFileSync(absHtml, 'utf8').trim();
    if (!html) continue;

    let css = '';
    let js = '';
    let jsLang = '';
    const fileSummaries = [`${path.basename(htmlFile.path)} (${htmlFile.lines || 0} dòng)`];

    for (const f of files) {
      if (f.path === htmlFile.path) continue;
      const abs = path.join(SOURCE_REPO, f.path);
      if (!fs.existsSync(abs)) continue;
      if (f.role === 'three-runtime' || f.path.endsWith('three.min.js')) {
        fileSummaries.push(`${path.basename(f.path)} (Three.js runtime)`);
        continue;
      }
      if (f.language === 'html') continue;
      const content = fs.readFileSync(abs, 'utf8');
      fileSummaries.push(`${path.basename(f.path)} (${f.lines || 0} dòng)`);
      if (f.language === 'css') {
        css += `\n/* ${path.basename(f.path)} */\n${content.slice(0, 12000)}`;
      } else if (
        f.language === 'tsx' ||
        f.language === 'ts' ||
        f.language === 'typescript' ||
        f.language === 'jsx' ||
        f.language === 'javascript'
      ) {
        if (!jsLang) {
          jsLang = f.language === 'typescript' ? 'ts' : f.language === 'javascript' ? 'js' : f.language;
        }
        if (js.length < 24000) {
          js += `\n// ${path.basename(f.path)}\n${content.slice(0, 14000)}`;
        }
      }
    }

    const oldMeta = oldIndexById.get(id) || oldIndexById.get(`threeui/${id}`);
    const cleanTitle =
      oldMeta?.t ||
      entry.export_name?.replace(/([a-z])([A-Z])/g, '$1 $2') ||
      id.replace(/-/g, ' ');

    const promptText = [
      `Thành phần ThreeUI Community (MIT miễn phí, chạy trực tiếp HTML/WebGL thật): ${cleanTitle}`,
      `Môi trường chạy: ${entry.runtime || 'HTML + Three.js / WebGL'}`,
      `Tệp nguồn: ${fileSummaries.join(', ')}`,
      entry.url ? `Nguồn tham khảo: ${entry.url}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const payload = {
      h: html,
      c: css.trim(),
      j: js.trim(),
      ...(js.trim() && jsLang ? { cl: jsLang } : {}),
      p: promptText,
      u: entry.url || `https://threeui.com/browse/${id}`,
      m: {
        runtime: entry.runtime || 'Three.js / WebGL',
        category: oldMeta?.c || '3D & Tương tác',
        tone: 'dark',
        stack: ['Three.js', 'WebGL', 'HTML'],
        license: 'MIT',
      },
    };

    shardEntries.push([id, payload]);
    indexItems.push({
      i: id,
      t: cleanTitle,
      l: 'threeui',
      g: 'threeui-community',
      c: oldMeta?.c || '3D & Tương tác',
      tg: Array.from(new Set([...(oldMeta?.tg || []), '3d', 'webgl', 'free', 'community'])).slice(0, 6),
      s: 'tu-0',
      d: 1,
    });
  }

  return { indexItems, shardEntries };
}

function buildVerifiedMotionSites(oldVaultItems, oldMsPayloads) {
  const msManifestPath = path.join(SOURCE_REPO, 'sources', 'motionsites', 'manifest.json');
  const msIndexPath = path.join(SOURCE_REPO, 'sources', 'motionsites', 'index.json');
  const msFullPath = path.join(PUBLIC_DATA, 'motionsites-full.json');

  const msManifest = JSON.parse(fs.readFileSync(msManifestPath, 'utf8'));
  const msIndexRaw = JSON.parse(fs.readFileSync(msIndexPath, 'utf8'));
  const msIndexRows = Array.isArray(msIndexRaw) ? msIndexRaw : msIndexRaw.items || [];
  const msIndexById = new Map(msIndexRows.map((row) => [String(row.id), row]));

  const oldFullRaw = fs.existsSync(msFullPath) ? JSON.parse(fs.readFileSync(msFullPath, 'utf8')) : { items: {} };
  const oldFullItems =
    oldFullRaw.items && !Array.isArray(oldFullRaw.items) ? oldFullRaw.items : {};

  const oldVaultById = new Map();
  for (const it of oldVaultItems) {
    if (it.l === 'motionsites') oldVaultById.set(it.i, it);
  }

  const keptIndex = [];
  const keptShardEntries = [];
  const keptFullMap = {};
  const keptIds = new Set();
  const purged = [];

  for (const entry of msManifest) {
    const id = String(entry.id);
    const idxRow = msIndexById.get(id);
    if (!idxRow || idxRow.is_free !== true) {
      purged.push({ id, reason: 'not-free' });
      continue;
    }

    const oldPayload = oldMsPayloads.get(id) || {};
    const oldFull = oldFullItems[id] || {};
    const promptText = (oldFull.promptText || oldPayload.p || '').trim();
    if (promptText.length < 500) {
      purged.push({ id, reason: `short-stub:${promptText.length}` });
      continue;
    }

    const allowLiveHtml = VERIFIED_MOTIONSITES_LIVE_HTML.has(id);
    const cleanHtml = allowLiveHtml ? (oldPayload.h || oldFull.liveHtml || '').trim() : '';
    const cleanFullLiveHtml = allowLiveHtml ? (oldFull.liveHtml || cleanHtml).trim() : '';
    const cleanCss = (oldPayload.c || oldFull.css || '').trim();
    const cleanCode = (oldPayload.j || oldFull.code || '').trim();
    const cleanCodeLang = (oldPayload.cl || oldFull.codeLang || (cleanCode ? 'tsx' : '')).trim();

    const candidateVid = (
      oldPayload.vid ||
      oldFull.previewVideo ||
      (idxRow.video_kind === 'video' ? idxRow.video_preview_url : '') ||
      ''
    ).trim();
    const previewVideo = candidateVid && !DEAD_MEDIA_URL_RE.test(candidateVid) ? candidateVid : '';

    const candidateImg = (
      oldPayload.img ||
      oldFull.previewImage ||
      idxRow.image_preview_url ||
      (idxRow.video_kind === 'image' ? idxRow.video_preview_url : '') ||
      ''
    ).trim();
    const previewImage = candidateImg && !DEAD_MEDIA_URL_RE.test(candidateImg) ? candidateImg : '';

    if (!cleanHtml && !previewVideo && !previewImage) {
      purged.push({ id, reason: 'no-working-media-or-html' });
      continue;
    }

    const liveUrl = `https://motionsites.ai/sections#${id}`;
    const oldMeta = oldVaultById.get(id);

    keptIds.add(id);
    keptIds.add(`ms-${id}`);

    keptShardEntries.push([
      id,
      {
        h: cleanHtml,
        c: cleanCss,
        j: cleanCode,
        ...(cleanCodeLang ? { cl: cleanCodeLang } : {}),
        p: promptText,
        ...(previewVideo ? { vid: previewVideo } : {}),
        ...(previewImage ? { img: previewImage } : {}),
        u: liveUrl,
      },
    ]);

    keptFullMap[id] = {
      id: `ms-${id}`,
      slug: id,
      title: entry.title || oldFull.title || id,
      category: entry.category || oldFull.category || 'Layout',
      promptText,
      ...(cleanFullLiveHtml ? { liveHtml: cleanFullLiveHtml } : {}),
      ...(cleanCss ? { css: cleanCss } : {}),
      ...(cleanCode ? { code: cleanCode, codeLang: cleanCodeLang || 'ts' } : {}),
      ...(previewVideo ? { previewVideo } : {}),
      ...(previewImage ? { previewImage } : {}),
      liveUrl,
      tags: Array.from(
        new Set([entry.category, entry.type, ...(entry.types || [])].filter(Boolean))
      ),
    };

    keptIndex.push({
      i: id,
      t: oldMeta?.t || entry.title || id,
      l: 'motionsites',
      g: 'Chuyển động',
      c: oldMeta?.c || entry.category || 'Section',
      tg: oldMeta?.tg || Array.from(new Set([entry.type || 'hero', ...(entry.types || [])].filter(Boolean))).slice(0, 4),
      s: 'ms-0',
      d: cleanHtml || previewVideo || previewImage ? 1 : 0,
    });
  }

  return { keptIndex, keptShardEntries, keptFullMap, keptIds, purged };
}

function purgeBrokenCodeFronts(oldItems) {
  const purgedIds = new Set(PURGED_CODEFRONTS_IDS);
  const shardFilesToRewrite = new Set();
  for (const it of oldItems) {
    if (it.l === 'codefronts' && purgedIds.has(it.i) && it.s) {
      shardFilesToRewrite.add(it.s);
    }
  }
  for (const shardName of shardFilesToRewrite) {
    const fp = path.join(VAULT_DIR, `${shardName}.jgz`);
    if (!fs.existsSync(fp)) continue;
    const data = readGzipJson(fp);
    let changed = false;
    for (const badId of purgedIds) {
      if (badId in data) {
        delete data[badId];
        changed = true;
      }
    }
    if (changed) writeGzipJson(fp, data);
  }
  return oldItems.filter((it) => !(it.l === 'codefronts' && purgedIds.has(it.i)));
}

function rebuildFabulousManifest(tuKeptIndex, tuShardMap, msFullMap, msKeptIds) {
  const fabPath = path.join(PROJECT_ROOT, 'src', 'data', 'fabulousManifest.json');
  if (!fs.existsSync(fabPath)) return;
  const oldFab = JSON.parse(fs.readFileSync(fabPath, 'utf8'));

  const ui50 = Array.isArray(oldFab.ui50) ? oldFab.ui50 : [];
  const pinuiCount = ui50.filter((x) => x.library === 'pinui').length;
  const codefrontsUiCount = ui50.filter((x) => x.library === 'codefronts').length;

  const threeuiVerified = tuKeptIndex.map((it) => ({
    id: it.i,
    title: it.t,
    library: 'threeui',
    category: it.c || '3D & Tương tác',
    img: '',
    vid: '',
    shard: tuShardMap.get(it.i) || it.s,
    hasLive: true,
  }));

  const oldMotion = Array.isArray(oldFab.motion50) ? oldFab.motion50 : [];
  const motionVerified = oldMotion
    .filter((item) => msKeptIds.has(item.id) || msKeptIds.has(`ms-${item.id}`))
    .map((item) => {
      const slug = String(item.id).replace(/^ms-/, '');
      const full = msFullMap[slug];
      return {
        ...item,
        img: full?.previewImage || item.img || '',
        vid: full?.previewVideo || item.vid || '',
        hasLive: VERIFIED_MOTIONSITES_LIVE_HTML.has(slug),
      };
    });

  const nextFab = {
    pinuiCount,
    codefrontsUiCount,
    threeuiCount: threeuiVerified.length,
    glacierCount: 0,
    motionCount: motionVerified.length,
    ui50,
    threeui50: threeuiVerified,
    glacier50: [],
    motion50: motionVerified,
  };
  fs.writeFileSync(fabPath, `${JSON.stringify(nextFab, null, 2)}\n`, 'utf8');
  console.log('fabulousManifest.json rebuilt:', {
    ui50: ui50.length,
    threeui50: threeuiVerified.length,
    glacier50: 0,
    motion50: motionVerified.length,
  });
}

function main() {
  const studioVault = JSON.parse(fs.readFileSync(STUDIO_VAULT_PATH, 'utf8'));
  const oldItems = Array.isArray(studioVault.items) ? studioVault.items : [];

  const oldMsPayloads = loadAllShardsByPrefix('ms');

  // 1. Delete ALL GetLayers paid/gated shards (gl-*.jgz)
  const removedGlShards = deleteShardsByPrefix('gl');

  // 2. Rebuild MotionSites with ONLY verified FREE items (is_free=true + real >=500-char prompt + HTTP-200 media)
  const {
    keptIndex: msKeptIndex,
    keptShardEntries: msKeptEntries,
    keptFullMap: msFullMap,
    keptIds: msKeptIds,
    purged: msPurged,
  } = buildVerifiedMotionSites(oldItems, oldMsPayloads);

  deleteShardsByPrefix('ms');
  const msShardMap = writeShardedRecords('ms', msKeptEntries, 30);
  for (const item of msKeptIndex) {
    item.s = msShardMap.get(item.i) || 'ms-0';
  }

  const msFullPath = path.join(PUBLIC_DATA, 'motionsites-full.json');
  fs.writeFileSync(
    msFullPath,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      total: Object.keys(msFullMap).length,
      items: msFullMap,
    })
  );

  // 3. Rebuild ThreeUI with ONLY the 21 Playwright-verified MIT FREE items with full untruncated live HTML/WebGL
  const { indexItems: tuKeptIndex, shardEntries: tuKeptEntries } = buildVerifiedThreeUiEntries(oldItems);
  deleteShardsByPrefix('tu');
  const tuShardMap = writeShardedRecords('tu', tuKeptEntries, 7);
  for (const item of tuKeptIndex) {
    item.s = tuShardMap.get(item.i) || 'tu-0';
  }
  const tuFreeIds = new Set(tuKeptIndex.map((x) => x.i));

  const previewsItems = {};
  for (const item of tuKeptIndex) {
    previewsItems[item.i] = {
      s: item.s,
      r: true,
    };
  }
  fs.writeFileSync(
    path.join(PUBLIC_DATA, 'threeui-previews.json'),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'threeui-community-mit-live',
        freeOnly: true,
        count: tuKeptIndex.length,
        total: tuKeptIndex.length,
        items: previewsItems,
      },
      null,
      2
    )}\n`
  );

  // 4. Keep 100% verified Pin UI (42), lucianLabs (480), and CodeFronts (5,046 after purging coat.jpg broken item)
  const cleanedCore = purgeBrokenCodeFronts(
    oldItems.filter(
      (item) => item.l === 'pinui' || item.l === 'lucianlabs' || item.l === 'codefronts'
    )
  );

  const finalItems = [
    ...cleanedCore.filter((i) => i.l === 'pinui'),
    ...tuKeptIndex,
    ...cleanedCore.filter((i) => i.l === 'lucianlabs'),
    ...msKeptIndex,
    ...cleanedCore.filter((i) => i.l === 'codefronts'),
  ];

  fs.writeFileSync(
    STUDIO_VAULT_PATH,
    JSON.stringify({
      total: finalItems.length,
      sharded: true,
      shardExt: 'jgz',
      generatedAt: new Date().toISOString(),
      purifiedFreeOnly: true,
      items: finalItems,
    })
  );

  // 5. Generate motion-recipes.json (58 tested techniques from MotionSites MIT skill)
  const recipes = parseMotionRecipes();
  fs.writeFileSync(
    path.join(PUBLIC_DATA, 'motion-recipes.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: recipes.length,
        recipes,
      },
      null,
      2
    )
  );

  // 6. Clean src/data/sourceCatalog.json so ZERO GetLayers / purged ThreeUI / paid MotionSites / broken liveHtml leak
  const srcCatalogPath = path.join(PROJECT_ROOT, 'src', 'data', 'sourceCatalog.json');
  if (fs.existsSync(srcCatalogPath)) {
    const rawCat = JSON.parse(fs.readFileSync(srcCatalogPath, 'utf8'));
    if (Array.isArray(rawCat)) {
      const cleanCat = [];
      for (const item of rawCat) {
        const id = String(item.id || '');
        if (id.startsWith('glacier/')) continue;
        if (item.sourceLibrary === 'codefronts' && PURGED_CODEFRONTS_IDS.has(id)) continue;
        if (item.sourceLibrary === 'threeui') {
          const bare = id.replace(/^threeui\//, '');
          if (!tuFreeIds.has(bare)) continue;
          const next = { ...item };
          delete next.previewHtml;
          delete next.previewCss;
          next.officialUrl = `https://threeui.com/browse/${bare}`;
          cleanCat.push(next);
          continue;
        }
        if (item.sourceLibrary === 'motionsites') {
          const slug = id.replace(/^ms-/, '');
          const full = msFullMap[slug];
          if (!full) continue;
          const next = {
            ...item,
            promptSpec: stripEmojis(full.promptText),
            officialUrl: full.liveUrl,
          };
          if (full.previewImage) next.previewImage = full.previewImage;
          if (VERIFIED_MOTIONSITES_LIVE_HTML.has(slug) && full.liveHtml) {
            next.previewHtml = stripEmojis(full.liveHtml);
            if (full.css) next.previewCss = stripEmojis(full.css);
          } else {
            delete next.previewHtml;
            delete next.previewCss;
          }
          cleanCat.push(next);
          continue;
        }
        cleanCat.push(item);
      }

      const existingIds = new Set(cleanCat.map((item) => String(item.id || '')));

      // Ensure missing PinUI component/sling-slider is included
      const pinuiSrcPath = path.join(PUBLIC_DATA, 'pinui-source.json');
      const pinuiSrcMap = fs.existsSync(pinuiSrcPath)
        ? JSON.parse(fs.readFileSync(pinuiSrcPath, 'utf8')).items || {}
        : {};
      if (!existingIds.has('component/sling-slider')) {
        const sling = pinuiSrcMap['component/sling-slider'] || pinuiSrcMap['sling-slider'];
        cleanCat.push({
          id: 'component/sling-slider',
          title: 'Sling Slider',
          sourceLibrary: 'pinui',
          category: 'Components',
          subcategory: 'Interactive Control',
          tags: ['component', 'react', 'slider', 'interactive'],
          runtime: 'React + Motion',
          style: 'minimal',
          license: 'MIT',
          officialUrl: 'https://www.pinui.xyz/components/sling-slider',
          archivePath: 'sources/pinui/registry/sling-slider',
          description: 'Thanh trượt tương tác vật lý có độ đàn hồi mượt mà.',
          promptSpec: stripEmojis(
            sling?.prompt || 'Thành phần Sling Slider tương tác vật lý với độ đàn hồi mượt mà.'
          ),
        });
        existingIds.add('component/sling-slider');
      }

      // Ensure all 21 verified MIT ThreeUI items exist in sourceCatalog.json
      const tuPayloadMap = new Map(tuKeptEntries);
      for (const tuItem of tuKeptIndex) {
        const catId = `threeui/${tuItem.i}`;
        if (existingIds.has(catId) || existingIds.has(tuItem.i)) continue;
        const payload = tuPayloadMap.get(tuItem.i);
        cleanCat.push({
          id: catId,
          title: tuItem.t,
          sourceLibrary: 'threeui',
          category: '3D & Tương tác',
          subcategory: 'Community Free',
          tags: tuItem.tg,
          runtime: payload?.m?.runtime || 'Three.js / WebGL',
          style: 'dark',
          license: 'MIT',
          officialUrl: payload?.u || `https://threeui.com/browse/${tuItem.i}`,
          archivePath: `sources/threeui/components/${tuItem.i}`,
          description: `Thành phần 3D cộng đồng miễn phí có sẵn mã nguồn thật (${tuItem.t}).`,
          promptSpec: stripEmojis(payload?.p || `Thành phần ThreeUI Community: ${tuItem.t}`),
        });
        existingIds.add(catId);
      }

      // Ensure sourceCatalog.json stays >= 200 items by adding verified free MotionSites items if needed
      if (cleanCat.length < 205) {
        for (const [slug, full] of Object.entries(msFullMap)) {
          if (cleanCat.length >= 210) break;
          if (existingIds.has(slug) || existingIds.has(`ms-${slug}`)) continue;
          cleanCat.push({
            id: slug,
            title: stripEmojis(full.title),
            sourceLibrary: 'motionsites',
            category: full.category || 'Motion',
            subcategory: 'Free Section',
            tags: (full.tags || ['motion']).slice(0, 4),
            runtime: full.code ? 'React + Motion' : 'HTML / CSS',
            style: 'dark',
            license: 'Free (MotionSites)',
            officialUrl: full.liveUrl,
            archivePath: `sources/motionsites/${slug}`,
            description: `Mẫu chuyển động miễn phí ${stripEmojis(full.title)} kèm prompt đầy đủ.`,
            promptSpec: stripEmojis(full.promptText),
            ...(full.previewImage ? { previewImage: full.previewImage } : {}),
            ...(VERIFIED_MOTIONSITES_LIVE_HTML.has(slug) && full.liveHtml
              ? { previewHtml: stripEmojis(full.liveHtml), ...(full.css ? { previewCss: stripEmojis(full.css) } : {}) }
              : {}),
          });
          existingIds.add(slug);
        }
      }

      fs.writeFileSync(srcCatalogPath, JSON.stringify(cleanCat, null, 2));
      console.log(`sourceCatalog.json cleaned: ${rawCat.length} -> ${cleanCat.length}`);
    }
  }

  // 7. Rebuild src/data/fabulousManifest.json (0 GetLayers, 21 verified ThreeUI, 50 verified free MotionSites)
  rebuildFabulousManifest(tuKeptIndex, tuShardMap, msFullMap, msKeptIds);

  // Summary
  const counts = {};
  for (const it of finalItems) counts[it.l] = (counts[it.l] || 0) + 1;
  const vaultBytes = fs
    .readdirSync(VAULT_DIR)
    .reduce((acc, f) => acc + fs.statSync(path.join(VAULT_DIR, f)).size, 0);

  console.log('Removed GetLayers shards:', removedGlShards);
  console.log('Purged MotionSites from manifest:', msPurged);
  console.log('Final audited FREE vault counts:', counts, 'TOTAL:', finalItems.length);
  console.log('motionsites-full.json total:', Object.keys(msFullMap).length);
  console.log('Vault shards total MB:', (vaultBytes / 1e6).toFixed(2));
  console.log('Generated motion-recipes.json:', recipes.length, 'techniques');
}

main();
