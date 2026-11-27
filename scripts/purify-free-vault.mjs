import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_REPO = process.env.SOURCE_ARCHIVE_DIR || path.resolve(PROJECT_ROOT, '../SOURCEOFKNOWLEDGFORAI');
const PUBLIC_DATA = path.join(PROJECT_ROOT, 'public', 'data');
const VAULT_DIR = path.join(PUBLIC_DATA, 'vault');
const STUDIO_VAULT_PATH = path.join(PUBLIC_DATA, 'studio-vault.json');

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

function buildFreeThreeUiEntries(oldThreeUiPayloads, oldVaultItems) {
  const manifestPath = path.join(SOURCE_REPO, 'sources', 'threeui', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const oldIndexById = new Map();
  for (const it of oldVaultItems) {
    if (it.l === 'threeui') {
      oldIndexById.set(it.i, it);
      oldIndexById.set(it.i.replace(/^threeui\//, ''), it);
    }
  }

  let previewsMap = {};
  const previewsPath = path.join(PUBLIC_DATA, 'threeui-previews.json');
  if (fs.existsSync(previewsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(previewsPath, 'utf8'));
      previewsMap = parsed.items || parsed || {};
    } catch {
      previewsMap = {};
    }
  }

  const indexItems = [];
  const shardEntries = [];
  const keptPreviews = {};

  for (const entry of manifest) {
    const id = entry.id;
    const files = Array.isArray(entry.files) ? entry.files : [];
    let html = '';
    let css = '';
    let js = '';
    const fileSummaries = [];

    for (const f of files) {
      const abs = path.join(SOURCE_REPO, f.path);
      if (!fs.existsSync(abs)) continue;
      if (f.role === 'three-runtime' || f.path.endsWith('three.min.js')) {
        fileSummaries.push(`${path.basename(f.path)} (Three.js runtime)`);
        continue;
      }
      const content = fs.readFileSync(abs, 'utf8');
      fileSummaries.push(`${path.basename(f.path)} (${f.lines || 0} dòng)`);
      if (f.language === 'html' && !html) {
        html = content.slice(0, 28000);
      } else if (f.language === 'css') {
        css += `\n/* ${path.basename(f.path)} */\n${content.slice(0, 12000)}`;
      } else if (
        f.language === 'tsx' ||
        f.language === 'ts' ||
        f.language === 'jsx' ||
        f.language === 'javascript'
      ) {
        if (js.length < 24000) {
          js += `\n// ${path.basename(f.path)}\n${content.slice(0, 14000)}`;
        }
      }
    }

    const oldMeta = oldIndexById.get(id) || oldIndexById.get(`threeui/${id}`);
    const oldPayload = oldThreeUiPayloads.get(id) || oldThreeUiPayloads.get(`threeui/${id}`) || {};
    const prev = previewsMap[id] || previewsMap[`threeui/${id}`];
    if (prev) keptPreviews[id] = prev;

    const cleanTitle =
      oldMeta?.t ||
      entry.export_name?.replace(/([a-z])([A-Z])/g, '$1 $2') ||
      id.replace(/-/g, ' ');

    const promptText = [
      `Thành phần ThreeUI Community (miễn phí, có mã nguồn thật): ${cleanTitle}`,
      `Môi trường chạy: ${entry.runtime || 'React + Three.js'}`,
      `Tệp nguồn: ${fileSummaries.join(', ')}`,
      entry.url ? `Nguồn tham khảo: ${entry.url}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    shardEntries.push([
      id,
      {
        h: html.trim(),
        c: css.trim(),
        j: js.trim(),
        p: promptText,
        img: oldPayload.img || prev?.poster || prev?.img || '',
        vid: oldPayload.vid || prev?.video || prev?.vid || '',
        u: entry.url || `https://threeui.com/browse/${id}`,
        m: {
          runtime: entry.runtime || 'React / Three.js',
          category: oldMeta?.c || '3D & Tương tác',
          tone: 'dark',
          stack: ['Three.js', 'WebGL', 'React'],
        },
      },
    ]);

    indexItems.push({
      i: id,
      t: cleanTitle,
      l: 'threeui',
      g: 'threeui-community',
      c: oldMeta?.c || '3D & Tương tác',
      tg: Array.from(new Set([...(oldMeta?.tg || []), '3d', 'webgl', 'free', 'community'])).slice(0, 6),
      s: 'tu-0',
      d: html ? 1 : 0,
    });
  }

  return { indexItems, shardEntries, keptPreviews };
}

function main() {
  const studioVault = JSON.parse(fs.readFileSync(STUDIO_VAULT_PATH, 'utf8'));
  const oldItems = Array.isArray(studioVault.items) ? studioVault.items : [];

  const oldMsPayloads = loadAllShardsByPrefix('ms');
  const oldThreeUiPayloads = loadAllShardsByPrefix('tu');

  // 1. Delete ALL GetLayers paid/gated shards (gl-*.jgz)
  const removedGlShards = deleteShardsByPrefix('gl');

  // 2. Keep ONLY FREE & USABLE MotionSites items (real prompt or real HTML/CSS)
  const msKeptIndex = [];
  const msKeptEntries = [];
  const msKeptIds = new Set();

  for (const item of oldItems) {
    if (item.l !== 'motionsites') continue;
    const payload = oldMsPayloads.get(item.i) || oldMsPayloads.get(item.i.replace(/^ms-/, ''));
    if (!payload) continue;
    const hasRealPrompt = typeof payload.p === 'string' && payload.p.trim().length >= 80;
    const hasRealHtml = typeof payload.h === 'string' && payload.h.trim().length >= 40;
    if (!hasRealPrompt && !hasRealHtml) continue;
    msKeptIds.add(item.i);
    msKeptIds.add(item.i.replace(/^ms-/, ''));
    msKeptEntries.push([item.i, payload]);
    msKeptIndex.push({ ...item });
  }

  deleteShardsByPrefix('ms');
  const msShardMap = writeShardedRecords('ms', msKeptEntries, 30);
  for (const item of msKeptIndex) {
    item.s = msShardMap.get(item.i) || 'ms-0';
  }

  // Filter public/data/motionsites-full.json to ONLY kept free usable items
  const msFullPath = path.join(PUBLIC_DATA, 'motionsites-full.json');
  if (fs.existsSync(msFullPath)) {
    const msFull = JSON.parse(fs.readFileSync(msFullPath, 'utf8'));
    if (Array.isArray(msFull.items)) {
      const filteredFull = msFull.items.filter((x) => {
        const key = String(x.id || x.slug || '');
        const hasPrompt = typeof x.prompt === 'string' && x.prompt.trim().length >= 80;
        return hasPrompt || msKeptIds.has(key) || msKeptIds.has(`ms-${key}`);
      });
      fs.writeFileSync(
        msFullPath,
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          total: filteredFull.length,
          items: filteredFull,
        })
      );
    }
  }

  // 3. Rebuild ThreeUI with ONLY the 43 FREE Community items with REAL source code
  const { indexItems: tuKeptIndex, shardEntries: tuKeptEntries, keptPreviews } =
    buildFreeThreeUiEntries(oldThreeUiPayloads, oldItems);
  deleteShardsByPrefix('tu');
  const tuShardMap = writeShardedRecords('tu', tuKeptEntries, 22);
  for (const item of tuKeptIndex) {
    item.s = tuShardMap.get(item.i) || 'tu-0';
  }
  const tuFreeIds = new Set(tuKeptIndex.map((x) => x.i));

  const previewsPath = path.join(PUBLIC_DATA, 'threeui-previews.json');
  fs.writeFileSync(
    previewsPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), total: Object.keys(keptPreviews).length, items: keptPreviews })
  );

  // 4. Keep 100% of Pin UI (42), lucianLabs (480), CodeFronts (5,047)
  const keptCore = oldItems.filter(
    (item) => item.l === 'pinui' || item.l === 'lucianlabs' || item.l === 'codefronts'
  );

  const finalItems = [...keptCore.filter((i) => i.l === 'pinui'), ...tuKeptIndex, ...keptCore.filter((i) => i.l === 'lucianlabs'), ...msKeptIndex, ...keptCore.filter((i) => i.l === 'codefronts')];

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

  // 5. Generate motion-recipes.json (58 tested techniques from MotionSites skill)
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

  // 6. Clean src/data/sourceCatalog.json so zero GetLayers / paid ThreeUI / empty MotionSites leak,
  // and ensure real FREE ThreeUI Community entries are present.
  const srcCatalogPath = path.join(PROJECT_ROOT, 'src', 'data', 'sourceCatalog.json');
  if (fs.existsSync(srcCatalogPath)) {
    const rawCat = JSON.parse(fs.readFileSync(srcCatalogPath, 'utf8'));
    if (Array.isArray(rawCat)) {
      const cleanCat = rawCat.filter((item) => {
        const id = String(item.id || '');
        if (id.startsWith('glacier/')) return false;
        if (item.sourceLibrary === 'threeui') {
          return tuFreeIds.has(id) || tuFreeIds.has(id.replace(/^threeui\//, ''));
        }
        if (item.sourceLibrary === 'motionsites') {
          return (
            msKeptIds.has(id) ||
            msKeptIds.has(id.replace(/^ms-/, '')) ||
            (typeof item.promptSpec === 'string' && item.promptSpec.trim().length >= 80)
          );
        }
        return true;
      });

      const existingIds = new Set(cleanCat.map((item) => String(item.id || '')));
      const tuPayloadMap = new Map(tuKeptEntries);
      for (const tuItem of tuKeptIndex.slice(0, 30)) {
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
          promptSpec: payload?.p || `Thành phần ThreeUI Community: ${tuItem.t}`,
        });
      }

      fs.writeFileSync(srcCatalogPath, JSON.stringify(cleanCat, null, 2));
      console.log(`sourceCatalog.json cleaned: ${rawCat.length} -> ${cleanCat.length}`);
    }
  }

  // Summary
  const counts = {};
  for (const it of finalItems) counts[it.l] = (counts[it.l] || 0) + 1;
  console.log('Removed GetLayers shards:', removedGlShards);
  console.log('Final purified FREE usable vault counts:', counts, 'TOTAL:', finalItems.length);
  console.log('Generated motion-recipes.json:', recipes.length, 'techniques');
}

main();
