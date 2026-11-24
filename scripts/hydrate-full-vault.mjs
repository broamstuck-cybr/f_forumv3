import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SOURCE_ROOT =
  process.env.SOURCE_ARCHIVE_DIR ||
  path.resolve(PROJECT_ROOT, '../../source/ui-ux/sourceofknowledgforai');
const SOURCES_DIR = path.join(SOURCE_ROOT, 'sources');
const VAULT_DIR = path.join(PROJECT_ROOT, 'public/data/vault');

const EMOJI_RE =
  /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;

const SYNTHETIC_STAGE_RE =
  /ms-stage|ff3d-stage|Đổi nhịp xoay|Khối 01|Chạy thử ngay trong khung xem/i;

const GUARDNET_BENEFITS_CSS = `@import url('https://db.onlinewebfonts.com/c/e55e9079ee863276569c8a68d776ef04?family=Futura+Md+BT+Medium');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  min-height: 100%;
  background-color: #000000;
  color: #ffffff;
  font-family: 'Futura Md BT Medium', 'Be Vietnam Pro', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.gn-page {
  width: 100%;
  min-height: 100vh;
  background-color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gn-benefits {
  position: relative;
  width: 100%;
  max-width: 1400px;
  background-color: #000000;
  padding: 48px 16px;
}

.gn-heading {
  color: #ffffff;
  font-size: 30px;
  font-weight: 300;
  text-align: center;
  letter-spacing: -0.04em;
  margin-bottom: 48px;
}

.gn-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.gn-card {
  position: relative;
  height: 380px;
  border-radius: 16px;
  background-color: #0a0a0a;
  overflow: hidden;
}

.gn-card--text {
  padding: 24px;
}

.gn-card--video {
  display: flex;
  flex-direction: column;
}

.gn-blob-left {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: -420px;
  height: 460px;
  width: 460px;
  border-radius: 9999px;
  background-color: #1e3a8a;
  filter: blur(64px);
  opacity: 0.4;
  pointer-events: none;
}

.gn-blob-right {
  position: absolute;
  top: -112px;
  right: -112px;
  height: 224px;
  width: 224px;
  border-radius: 9999px;
  background-color: #1e3a8a;
  filter: blur(64px);
  opacity: 0.4;
  pointer-events: none;
}

.gn-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gn-card-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 300;
  line-height: 1.25;
  text-align: left;
}

.gn-card-body {
  font-size: 13px;
  line-height: 1.625;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
}

.gn-card-body--mid {
  margin-top: 48px;
  max-width: 280px;
}

.gn-card-body--bottom {
  margin-top: auto;
  max-width: 320px;
}

.gn-video-wrap {
  position: relative;
  width: 100%;
  height: 75%;
  overflow: hidden;
  background: radial-gradient(circle at 50% 42%, rgba(30, 58, 138, 0.42), #0a0a0a 72%);
}

.gn-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gn-video-fade {
  pointer-events: none;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 128px;
  background: linear-gradient(to bottom, transparent, #0a0a0a);
}

.gn-video-foot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 24px;
}

@media (min-width: 640px) {
  .gn-benefits {
    padding: 80px 24px;
  }

  .gn-heading {
    font-size: 36px;
    margin-bottom: 96px;
  }

  .gn-grid {
    gap: 16px;
  }

  .gn-card {
    height: 460px;
  }

  .gn-card--text,
  .gn-video-foot {
    padding: 32px;
  }

  .gn-card-title {
    font-size: 24px;
  }

  .gn-card-body {
    font-size: 14px;
  }

  .gn-card-body--mid {
    margin-top: 80px;
  }
}

@media (min-width: 768px) {
  .gn-benefits {
    padding: 80px 40px;
  }

  .gn-heading {
    font-size: 48px;
  }

  .gn-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}`;

const GUARDNET_BENEFITS_HTML = `<div class="gn-page">
  <section class="gn-benefits" aria-labelledby="gn-benefits-heading">
    <h2 id="gn-benefits-heading" class="gn-heading">Key Benefits</h2>
    <div class="gn-grid">
      <article class="gn-card gn-card--text">
        <div class="gn-blob-left" aria-hidden="true"></div>
        <div class="gn-content">
          <h3 class="gn-card-title">
            Preemptive Risks<br />Scouting and Reactions
          </h3>
          <p class="gn-card-body gn-card-body--mid">
            Defense platforms constantly observe bandwidth streams, record files, and machine behaviors to uncover unusual patterns or outliers that could signal a defensive failure.
          </p>
        </div>
      </article>

      <article class="gn-card gn-card--video">
        <div class="gn-video-wrap">
          <video
            class="gn-video"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260421_072701_f6a01abb-eb30-4559-9d6e-774362defbc3.mp4"
            autoplay
            loop
            muted
            playsinline
          ></video>
          <div class="gn-video-fade" aria-hidden="true"></div>
        </div>
        <div class="gn-video-foot">
          <h3 class="gn-card-title">
            Know-how and Sectoral<br />Awareness
          </h3>
        </div>
      </article>

      <article class="gn-card gn-card--text">
        <div class="gn-blob-right" aria-hidden="true"></div>
        <div class="gn-content">
          <h3 class="gn-card-title">
            Preemptive Risks<br />Scouting and Reactions
          </h3>
          <p class="gn-card-body gn-card-body--bottom">
            Defense platforms constantly observe bandwidth streams, record files, and machine behaviors to uncover unusual patterns or outliers that could signal a defensive failure.
          </p>
        </div>
      </article>
    </div>
  </section>
</div>`;

const GUARDNET_BENEFITS_TSX = `export default function BenefitsSection() {
  return (
    <div className="w-full min-h-screen bg-black text-white flex items-center justify-center">
      <section className="relative w-full max-w-[1400px] bg-black px-4 sm:px-6 md:px-10 py-12 sm:py-20">
        <h2
          className="text-white text-3xl sm:text-4xl md:text-5xl font-light text-center mb-12 sm:mb-24"
          style={{ letterSpacing: '-0.04em' }}
        >
          Key Benefits
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <article className="relative h-[380px] sm:h-[460px] rounded-2xl bg-neutral-950 overflow-hidden p-6 sm:p-8">
            <div className="absolute top-1/2 -translate-y-1/2 -left-[420px] h-[460px] w-[460px] rounded-full bg-[#1e3a8a] blur-3xl opacity-40" />
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-white text-xl sm:text-2xl font-light leading-tight">
                Preemptive Risks
                <br />
                Scouting and Reactions
              </h3>
              <p className="mt-12 sm:mt-20 text-[13px] sm:text-[14px] leading-relaxed text-white/70 font-light max-w-[280px]">
                Defense platforms constantly observe bandwidth streams, record files, and machine behaviors to uncover unusual patterns or outliers that could signal a defensive failure.
              </p>
            </div>
          </article>

          <article className="relative h-[380px] sm:h-[460px] rounded-2xl bg-neutral-950 overflow-hidden flex flex-col">
            <div className="relative w-full overflow-hidden" style={{ height: '75%' }}>
              <video
                className="w-full h-full object-cover block"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260421_072701_f6a01abb-eb30-4559-9d6e-774362defbc3.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-neutral-950" />
            </div>
            <div className="flex-1 flex items-center justify-start p-6 sm:p-8">
              <h3 className="text-white text-xl sm:text-2xl font-light leading-tight text-left">
                Know-how and Sectoral
                <br />
                Awareness
              </h3>
            </div>
          </article>

          <article className="relative h-[380px] sm:h-[460px] rounded-2xl bg-neutral-950 overflow-hidden p-6 sm:p-8">
            <div className="absolute -top-28 -right-28 h-56 w-56 rounded-full bg-[#1e3a8a] blur-3xl opacity-40" />
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-white text-xl sm:text-2xl font-light leading-tight">
                Preemptive Risks
                <br />
                Scouting and Reactions
              </h3>
              <p className="mt-auto text-[13px] sm:text-[14px] leading-relaxed text-white/70 font-light max-w-[320px]">
                Defense platforms constantly observe bandwidth streams, record files, and machine behaviors to uncover unusual patterns or outliers that could signal a defensive failure.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}`;

function stripEmojis(text) {
  return String(text || '').replace(EMOJI_RE, '').trim();
}

function stripFrontmatter(md) {
  return String(md || '').replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '').trim();
}

function stripExternalSourceLines(text) {
  return String(text || '')
    .replace(/^\s*(?:-\s*)?(?:Source|Live page|Preview image|Source files|URL|url)\s*:\s*https?:\/\/[^\n]*$/gim, '')
    .replace(/^\s*-\s*Source files:.*$/gim, '')
    .replace(/https?:\/\/(?:www\.)?(?:codefronts\.com|motionsites\.ai|lucianlabs\.dev|threeui\.com|getlayers\.ai|pinui\.xyz)[^\s)"'`>]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractFence(md, langPattern) {
  const re = new RegExp('```(?:' + langPattern + ')\\s*\\n([\\s\\S]*?)```', 'i');
  const m = String(md || '').match(re);
  return m ? m[1].trim() : '';
}

function extractAllFences(md, langPattern) {
  const re = new RegExp('```(?:' + langPattern + ')\\s*\\n([\\s\\S]*?)```', 'gi');
  const parts = [];
  let m = re.exec(String(md || ''));
  while (m) {
    if (m[1] && m[1].trim()) parts.push(m[1].trim());
    m = re.exec(String(md || ''));
  }
  return parts.join('\n\n');
}

function extractScriptFences(md) {
  const re = /```(tsx|jsx|typescript|ts|javascript|js|glsl)\s*\n([\s\S]*?)```/gi;
  const parts = [];
  const langs = [];
  let m = re.exec(String(md || ''));
  while (m) {
    const rawLang = (m[1] || '').toLowerCase();
    const normLang =
      rawLang === 'typescript'
        ? 'ts'
        : rawLang === 'javascript'
          ? 'js'
          : rawLang;
    const body = (m[2] || '').trim();
    if (body) {
      parts.push(body);
      langs.push(normLang);
    }
    m = re.exec(String(md || ''));
  }
  const preferredLang =
    langs.includes('tsx')
      ? 'tsx'
      : langs.includes('jsx')
        ? 'jsx'
        : langs.includes('ts')
          ? 'ts'
          : langs.includes('js')
            ? 'js'
            : langs[0] || '';
  return {
    code: parts.join('\n\n'),
    lang: preferredLang,
  };
}

function isRenderableHtml(rawHtml) {
  const src = String(rawHtml || '').trim();
  if (!src) return false;
  if (SYNTHETIC_STAGE_RE.test(src)) return false;
  const withoutHeadOnly = src
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<\/?(?:html|head)[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  if (withoutHeadOnly.length < 60) return false;
  return /<(?:body|main|section|div|nav|header|footer|article|canvas|svg|button|form|video|h[1-6]|ul|ol|p|figure)\b/i.test(
    withoutHeadOnly
  );
}

function extractLucianParts(htmlDoc) {
  const src = String(htmlDoc || '');
  const styleMatches = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let sm = styleRe.exec(src);
  while (sm) {
    if (sm[1] && sm[1].trim()) styleMatches.push(sm[1].trim());
    sm = styleRe.exec(src);
  }
  const scriptMatches = [];
  const scriptRe = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let jsm = scriptRe.exec(src);
  while (jsm) {
    if (jsm[1] && jsm[1].trim()) scriptMatches.push(jsm[1].trim());
    jsm = scriptRe.exec(src);
  }
  const bodyMatch = src.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const rawBody = bodyMatch ? bodyMatch[1] : src;
  const cleanHtml = rawBody
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim();
  return {
    html: cleanHtml,
    css: styleMatches.join('\n\n'),
    js: scriptMatches.join('\n\n'),
  };
}

function slugifyShard(str) {
  return String(str || 'misc')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'misc';
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
}

function writeGzipJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(data), 'utf8'), { level: 9 });
  fs.writeFileSync(filePath, compressed);
}

function buildCodeFrontsPrompt(item, body) {
  const beforeCode = body.split(/##\s*HTML/i)[0] || '';
  const cleanedIntro = stripExternalSourceLines(beforeCode)
    .replace(/^Here's a working[^\n]*\n?/im, '')
    .replace(/^Demo:\s*[^\n]*\n?/im, '')
    .trim();
  const header = [
    `Thành phần: ${item.title}`,
    `Nhóm: ${item.category_name || item.category} (${item.section_name || item.section})`,
    item.has_js ? 'Runtime: HTML + CSS + JavaScript' : 'Runtime: HTML + CSS thuần',
  ].join('\n');
  const guide = cleanedIntro || item.description || '';
  return `${header}\n\n${guide}`.trim();
}

function main() {
  if (!fs.existsSync(SOURCES_DIR)) {
    throw new Error(`Missing source directory: ${SOURCES_DIR}`);
  }

  fs.rmSync(VAULT_DIR, { recursive: true, force: true });
  fs.mkdirSync(VAULT_DIR, { recursive: true });

  const pinuiSourcePath = path.join(PROJECT_ROOT, 'public/data/pinui-source.json');
  const pinuiSourceJson = fs.existsSync(pinuiSourcePath)
    ? JSON.parse(fs.readFileSync(pinuiSourcePath, 'utf8'))
    : { items: {} };
  const pinuiSourceMap = pinuiSourceJson.items || {};

  const existingMotionPath = path.join(PROJECT_ROOT, 'public/data/motionsites-full.json');
  const existingMotionJson = fs.existsSync(existingMotionPath)
    ? JSON.parse(fs.readFileSync(existingMotionPath, 'utf8'))
    : { items: {} };
  const existingMotionItems = existingMotionJson.items || {};

  const sourceCatalogPath = path.join(PROJECT_ROOT, 'src/data/sourceCatalog.json');
  const sourceCatalog = JSON.parse(fs.readFileSync(sourceCatalogPath, 'utf8'));

  const msPreviewsPath = path.join(PROJECT_ROOT, 'scripts/motionsites-previews.json');
  const msPreviewsJson = fs.existsSync(msPreviewsPath)
    ? JSON.parse(fs.readFileSync(msPreviewsPath, 'utf8'))
    : {};
  const msBySlug = msPreviewsJson.bySlug || {};
  const msBundlePreviews = msPreviewsJson.bundle || msPreviewsJson;

  const pinuiMf = JSON.parse(fs.readFileSync(path.join(SOURCES_DIR, 'pinui/manifest.json'), 'utf8'));
  const cfMf = JSON.parse(fs.readFileSync(path.join(SOURCES_DIR, 'codefronts/manifest.json'), 'utf8'));
  const glMf = JSON.parse(fs.readFileSync(path.join(SOURCES_DIR, 'getlayers/manifest.json'), 'utf8'));
  const llMf = JSON.parse(fs.readFileSync(path.join(SOURCES_DIR, 'lucianlabs/manifest.json'), 'utf8'));
  const msMf = JSON.parse(fs.readFileSync(path.join(SOURCES_DIR, 'motionsites/manifest.json'), 'utf8'));
  const tuMf = JSON.parse(fs.readFileSync(path.join(SOURCES_DIR, 'threeui/manifest.json'), 'utf8'));

  const vaultItems = [];
  const cfPromptByKey = new Map();
  const cfUrlByKey = new Map();
  const llPromptById = new Map();
  const llUrlById = new Map();
  const msRecordById = new Map();
  const tuPromptById = new Map();
  const tuMediaById = new Map();
  const glMediaById = new Map();
  const pinuiUrlById = new Map();

  for (const it of pinuiMf) {
    pinuiUrlById.set(it.id, it.url || '');
    vaultItems.push({
      i: it.id,
      t: it.title,
      l: 'pinui',
      g: 'Tương tác',
      c: it.category || 'Components',
      tg: Array.from(new Set([it.kind || 'component', 'react'])).slice(0, 4),
      s: 'pinui',
      d: 1,
    });
  }

  const cfShards = new Map();
  for (const it of cfMf) {
    const filePath = path.join(SOURCE_ROOT, it.path);
    const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    const body = stripFrontmatter(raw);
    const html = extractFence(body, 'html');
    const css = extractFence(body, 'css');
    const js = extractFence(body, 'js|javascript');
    const prompt = buildCodeFrontsPrompt(it, body);

    const shardName = `cf-${slugifyShard(it.section)}-${slugifyShard(it.category)}`;
    if (!cfShards.has(shardName)) cfShards.set(shardName, {});
    cfShards.get(shardName)[it.id] = {
      h: html,
      c: css,
      j: js,
      p: prompt,
      ...(it.url ? { u: it.url } : {}),
    };

    const shortKey = `cf/${it.category}/${path.basename(it.path, '.md')}`;
    cfPromptByKey.set(it.id, prompt);
    cfPromptByKey.set(shortKey, prompt);
    if (it.url) {
      cfUrlByKey.set(it.id, it.url);
      cfUrlByKey.set(shortKey, it.url);
    }

    const catTag = slugifyShard(it.category).replace(/^(?:css|tailwind-css|tailwind)-/, '');
    vaultItems.push({
      i: it.id,
      t: it.title,
      l: 'codefronts',
      g: 'Bố cục',
      c: it.category_name || it.category,
      tg: Array.from(
        new Set([
          it.section,
          catTag,
          it.has_js ? 'js' : 'css',
        ].filter(Boolean))
      ).slice(0, 4),
      s: shardName,
      d: html ? 1 : 0,
    });
  }
  for (const [shardName, payload] of cfShards.entries()) {
    writeGzipJson(path.join(VAULT_DIR, `${shardName}.jgz`), payload);
  }

  const llShards = new Map();
  llMf.forEach((it, idx) => {
    const promptFile = it.prompt_path ? path.join(SOURCE_ROOT, it.prompt_path) : '';
    const demoFile = it.demo_path ? path.join(SOURCE_ROOT, it.demo_path) : '';
    const rawPrompt = promptFile && fs.existsSync(promptFile) ? fs.readFileSync(promptFile, 'utf8') : '';
    const rawDemo = demoFile && fs.existsSync(demoFile) ? fs.readFileSync(demoFile, 'utf8') : '';

    const cleanPrompt = stripExternalSourceLines(stripFrontmatter(rawPrompt));
    const parts = extractLucianParts(rawDemo);

    const bucket = Math.floor(idx / 50);
    const shardName = `ll-${bucket}`;
    if (!llShards.has(shardName)) llShards.set(shardName, {});
    llShards.get(shardName)[it.id] = {
      h: parts.html,
      c: parts.css,
      j: parts.js,
      p: cleanPrompt,
      ...(it.url ? { u: it.url } : {}),
    };

    llPromptById.set(it.id, cleanPrompt);
    if (it.url) llUrlById.set(it.id, it.url);

    vaultItems.push({
      i: it.id,
      t: it.title,
      l: 'lucianlabs',
      g: 'Hiệu ứng',
      c: it.category || 'UI Element',
      tg: Array.from(
        new Set([it.collection || 'interface', ...(Array.isArray(it.tags) ? it.tags : [])])
      ).slice(0, 4),
      s: shardName,
      d: parts.html ? 1 : 0,
    });
  });
  for (const [shardName, payload] of llShards.entries()) {
    writeGzipJson(path.join(VAULT_DIR, `${shardName}.jgz`), payload);
  }

  const msShards = new Map();
  const nextMotionFull = {};
  let msWithExtractedCode = 0;
  let msWithRenderableHtml = 0;

  function findMotionBundlePreview(id) {
    const candidates = [
      id,
      `${id}-hero`,
      `${id}-landing`,
      id.replace(/-hero$/, ''),
      id.replace(/-control$/, '-hero'),
      id === 'vertex' ? 'vertex-ai-hero' : '',
      id === 'space-voyage' ? '20' : '',
    ].filter(Boolean);
    for (const key of candidates) {
      if (msBundlePreviews[key]) return msBundlePreviews[key];
    }
    const norm = id.toLowerCase().replace(/-(hero|landing|section)$/, '');
    for (const entry of Object.values(msBundlePreviews)) {
      const eId = String(entry.id || '').toLowerCase();
      if (eId === norm || eId === `${norm}-hero` || eId.startsWith(`${norm}-`)) {
        return entry;
      }
    }
    return null;
  }

  msMf.forEach((it, idx) => {
    const filePath = path.join(SOURCE_ROOT, it.path);
    const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    const mp4Match = raw.match(/https?:\/\/[^\s"'`)>]+\.(?:mp4|webm)/i);
    const imgMatch = raw.match(/https?:\/\/[^\s"'`)>]+\.(?:png|jpg|jpeg|webp|gif)/i);
    const official = msBySlug[it.id];
    const bundle = findMotionBundlePreview(it.id);
    const previewVideo =
      official?.video || (official ? '' : mp4Match ? mp4Match[0] : '');
    const previewImage =
      official?.image ||
      official?.poster ||
      bundle?.image ||
      (imgMatch ? imgMatch[0] : '') ||
      bundle?.poster ||
      '';
    const liveUrl = `https://motionsites.ai/sections#${it.id}`;

    const body = stripExternalSourceLines(stripFrontmatter(raw));

    const rawHtmlFence = extractAllFences(body, 'html');
    const realCss = extractAllFences(body, 'css');
    const scriptFences = extractScriptFences(body);

    const isGuardnet = it.id === 'guardnet-benefits';
    const existing = existingMotionItems[`ms-${it.id}`] || existingMotionItems[it.id];
    const existingLive =
      existing?.liveHtml && !SYNTHETIC_STAGE_RE.test(existing.liveHtml) && isRenderableHtml(existing.liveHtml)
        ? existing.liveHtml
        : '';

    let renderableHtml = '';
    let finalCss = realCss;
    let finalCode = scriptFences.code;
    let finalCodeLang = scriptFences.lang;

    if (isGuardnet) {
      renderableHtml = GUARDNET_BENEFITS_HTML;
      finalCss = GUARDNET_BENEFITS_CSS;
      finalCode = GUARDNET_BENEFITS_TSX;
      finalCodeLang = 'tsx';
    } else if (isRenderableHtml(rawHtmlFence)) {
      renderableHtml = rawHtmlFence;
    } else if (existingLive) {
      renderableHtml = existingLive;
    }

    let mergedLiveHtml = '';
    if (renderableHtml) {
      const isFullDoc = /^\s*(?:<!doctype\s+html|<html[\s>])/i.test(renderableHtml);
      if (isFullDoc) {
        mergedLiveHtml = renderableHtml;
      } else {
        const hasInlineStyle = /<style[\s>]/i.test(renderableHtml);
        mergedLiveHtml =
          finalCss && !hasInlineStyle
            ? `<style>${finalCss}</style>\n${renderableHtml}`
            : renderableHtml;
      }
      msWithRenderableHtml += 1;
    }

    if (finalCode || finalCss || renderableHtml) {
      msWithExtractedCode += 1;
    }

    const record = {
      id: `ms-${it.id}`,
      slug: it.id,
      title: it.title,
      category: it.category || 'Layout',
      promptText: body,
      ...(mergedLiveHtml ? { liveHtml: mergedLiveHtml } : {}),
      ...(finalCss ? { css: finalCss } : {}),
      ...(finalCode ? { code: finalCode, codeLang: finalCodeLang || 'ts' } : {}),
      ...(previewVideo ? { previewVideo } : {}),
      ...(previewImage ? { previewImage } : {}),
      liveUrl,
      tags: Array.from(new Set([it.category, it.type, ...(it.types || [])].filter(Boolean))),
    };

    nextMotionFull[it.id] = record;
    msRecordById.set(it.id, {
      prompt: body,
      html: renderableHtml,
      css: finalCss,
      code: finalCode,
      codeLang: finalCodeLang,
      previewVideo,
      previewImage,
      liveUrl,
    });

    const bucket = Math.floor(idx / 80);
    const shardName = `ms-${bucket}`;
    if (!msShards.has(shardName)) msShards.set(shardName, {});
    msShards.get(shardName)[it.id] = {
      h: renderableHtml,
      c: finalCss,
      j: finalCode,
      ...(finalCodeLang ? { cl: finalCodeLang } : {}),
      p: body,
      ...(previewVideo ? { vid: previewVideo } : {}),
      ...(previewImage ? { img: previewImage } : {}),
      u: liveUrl,
    };

    vaultItems.push({
      i: it.id,
      t: it.title,
      l: 'motionsites',
      g: 'Chuyển động',
      c: it.category || 'Section',
      tg: Array.from(
        new Set([it.type || 'hero', slugifyShard(it.category), ...(it.types || [])].filter(Boolean))
      ).slice(0, 4),
      s: shardName,
      d: renderableHtml || previewVideo || previewImage ? 1 : 0,
    });
  });
  for (const [shardName, payload] of msShards.entries()) {
    writeGzipJson(path.join(VAULT_DIR, `${shardName}.jgz`), payload);
  }
  writeJson(existingMotionPath, {
    generatedAt: new Date().toISOString(),
    total: msMf.length,
    items: nextMotionFull,
  });

  const glShards = new Map();
  glMf.forEach((it, idx) => {
    const itemFile = it.path ? path.join(SOURCE_ROOT, it.path) : '';
    const promptFile = it.prompt_path ? path.join(SOURCE_ROOT, it.prompt_path) : '';
    const rawItemMd = itemFile && fs.existsSync(itemFile) ? fs.readFileSync(itemFile, 'utf8') : '';
    const rawPrompt =
      promptFile && fs.existsSync(promptFile)
        ? fs.readFileSync(promptFile, 'utf8')
        : rawItemMd;
    const vidPreviewMatch = rawItemMd.match(/https:\/\/storage\.getlayers\.ai\/[^\s|)`]+-preview\.mp4/i);
    const vidMatch = vidPreviewMatch || rawItemMd.match(/https:\/\/storage\.getlayers\.ai\/[^\s|)`]+\.mp4/i);
    const webpMatch = rawItemMd.match(/https:\/\/storage\.getlayers\.ai\/[^\s|)`]+\.webp/i);
    const vidUrl = vidMatch ? vidMatch[0] : '';
    const imgUrl = webpMatch ? webpMatch[0] : '';
    const liveUrl = it.url || `https://www.getlayers.ai/layer/${it.id}`;
    glMediaById.set(it.id, { vid: vidUrl, img: imgUrl, u: liveUrl });

    const cleanPrompt = stripExternalSourceLines(stripFrontmatter(rawPrompt));
    const stackLine = Array.isArray(it.stack) && it.stack.length ? `Stack: ${it.stack.join(', ')}` : '';
    const moodLine = Array.isArray(it.mood) && it.mood.length ? `Mood: ${it.mood.join(', ')}` : '';
    const enrichedPrompt =
      cleanPrompt.length > 160
        ? cleanPrompt
        : [
            `# ${it.title}`,
            it.description || '',
            `Loại: ${it.kind || it.category} · Tông nền: ${it.tone || 'dark'} · Bố cục: ${it.layout || 'custom'}`,
            stackLine,
            moodLine,
            cleanPrompt,
          ]
            .filter(Boolean)
            .join('\n\n');

    const bucket = Math.floor(idx / 300);
    const shardName = `gl-${bucket}`;
    if (!glShards.has(shardName)) glShards.set(shardName, {});
    glShards.get(shardName)[it.id] = {
      h: '',
      c: '',
      j: '',
      p: enrichedPrompt,
      ...(vidUrl ? { vid: vidUrl } : {}),
      ...(imgUrl ? { img: imgUrl } : {}),
      u: liveUrl,
      m: {
        tone: it.tone || 'dark',
        stack: it.stack || [],
        mood: it.mood || [],
        layout: it.layout || '',
      },
    };

    vaultItems.push({
      i: it.id,
      t: it.title,
      l: 'glacier',
      g: 'Nền & Lớp',
      c: it.kind || it.category || 'layer',
      tg: Array.from(
        new Set([
          it.kind || 'layer',
          it.tone || 'dark',
          ...(Array.isArray(it.tags) ? it.tags : []),
          ...(Array.isArray(it.stack) ? it.stack : []),
        ].filter(Boolean))
      ).slice(0, 4),
      s: shardName,
      d: vidUrl || imgUrl ? 1 : 0,
    });
  });
  for (const [shardName, payload] of glShards.entries()) {
    writeGzipJson(path.join(VAULT_DIR, `${shardName}.jgz`), payload);
  }

  const tuShards = new Map();
  tuMf.forEach((it, idx) => {
    const itemFile = it.path ? path.join(SOURCE_ROOT, it.path) : '';
    const raw = itemFile && fs.existsSync(itemFile) ? fs.readFileSync(itemFile, 'utf8') : '';
    const cleanBrief = stripExternalSourceLines(stripFrontmatter(raw));
    const fullPrompt = [
      `# ${it.title}`,
      it.description || '',
      `Danh mục: ${it.category}${it.subcategory ? ` / ${it.subcategory}` : ''}`,
      `Runtime: ${it.runtime || 'Three.js, WebGL'}`,
      cleanBrief && !cleanBrief.includes(it.description || '___') ? cleanBrief : '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    tuPromptById.set(it.id, fullPrompt);
    tuMediaById.set(it.id, { img: it.preview || '', u: it.url || '' });

    const bucket = Math.floor(idx / 320);
    const shardName = `tu-${bucket}`;
    if (!tuShards.has(shardName)) tuShards.set(shardName, {});
    tuShards.get(shardName)[it.id] = {
      h: '',
      c: '',
      j: '',
      p: fullPrompt,
      ...(it.preview ? { img: it.preview } : {}),
      ...(it.url ? { u: it.url } : {}),
      m: {
        runtime: it.runtime || 'Three.js, WebGL',
        category: it.category || '3D',
      },
    };

    vaultItems.push({
      i: it.id,
      t: it.title.replace(/\s+Three\.js Component/i, ''),
      l: 'threeui',
      g: 'Không gian 3D',
      c: it.category || '3D',
      tg: Array.from(
        new Set(['3d', 'webgl', slugifyShard(it.category), slugifyShard(it.subcategory)].filter(Boolean))
      ).slice(0, 4),
      s: shardName,
      d: it.preview ? 1 : 0,
    });
  });
  for (const [shardName, payload] of tuShards.entries()) {
    writeGzipJson(path.join(VAULT_DIR, `${shardName}.jgz`), payload);
  }

  let hydratedCatalogCount = 0;
  let removedSyntheticCount = 0;

  const nextCatalog = sourceCatalog.map((item) => {
    let promptSpec = stripEmojis(item.promptSpec || '');
    const msKey = item.id.replace(/^ms-/, '');
    const msRec = item.sourceLibrary === 'motionsites' ? msRecordById.get(item.id) || msRecordById.get(msKey) : null;

    if (msRec?.prompt) {
      promptSpec = stripEmojis(msRec.prompt);
    } else if (!promptSpec || promptSpec.length < 40) {
      if (item.sourceLibrary === 'pinui') {
        const bare = item.id.replace(/^(component|blocx|registry)\//, '');
        const entry =
          pinuiSourceMap[item.id] ||
          pinuiSourceMap[bare] ||
          pinuiSourceMap[`component/${bare}`] ||
          pinuiSourceMap[`blocx/${bare}`];
        if (entry?.prompt) promptSpec = stripEmojis(stripExternalSourceLines(entry.prompt));
      } else if (item.sourceLibrary === 'codefronts') {
        const found = cfPromptByKey.get(item.id);
        if (found) promptSpec = stripEmojis(found);
      } else if (item.sourceLibrary === 'lucianlabs') {
        const found = llPromptById.get(item.id);
        if (found) promptSpec = stripEmojis(found);
      } else if (item.sourceLibrary === 'threeui') {
        const found = tuPromptById.get(item.id);
        if (found) promptSpec = stripEmojis(found);
      }
    }
    if (!promptSpec) {
      promptSpec = stripEmojis(
        `${item.title}\nDanh mục: ${item.category}\nRuntime: ${item.runtime}\nPhong cách: ${item.style}\n\n${item.description || ''}`
      );
    }
    if (promptSpec.length >= 40) hydratedCatalogCount += 1;

    let previewHtml = item.previewHtml;
    let previewCss = item.previewCss;
    let previewImage = item.previewImage || '';
    let officialUrl = item.officialUrl || '';

    if (previewHtml && SYNTHETIC_STAGE_RE.test(previewHtml)) {
      previewHtml = undefined;
      previewCss = undefined;
      removedSyntheticCount += 1;
    }

    if (item.sourceLibrary === 'motionsites') {
      if (msRec) {
        if (msRec.html) {
          previewHtml = stripEmojis(msRec.html);
        } else if (previewHtml && !isRenderableHtml(previewHtml)) {
          previewHtml = undefined;
        }
        if (msRec.css) {
          previewCss = stripEmojis(msRec.css);
        } else if (!previewHtml) {
          previewCss = undefined;
        }
        if (msRec.previewImage) previewImage = msRec.previewImage;
        if (msRec.liveUrl) officialUrl = msRec.liveUrl;
      }
    } else if (item.sourceLibrary === 'threeui') {
      if (item.id.startsWith('glacier/')) {
        const glKey = item.id.replace(/^glacier\//, '');
        const gl = glMediaById.get(glKey);
        if (gl) {
          previewImage = gl.img || previewImage;
          officialUrl = gl.u || officialUrl;
        }
      } else {
        const tu = tuMediaById.get(item.id);
        if (tu) {
          previewImage = tu.img || previewImage;
          officialUrl = tu.u || officialUrl;
        }
      }
    } else if (item.sourceLibrary === 'pinui') {
      officialUrl = pinuiUrlById.get(item.id) || officialUrl;
    } else if (item.sourceLibrary === 'codefronts') {
      officialUrl = cfUrlByKey.get(item.id) || officialUrl;
    } else if (item.sourceLibrary === 'lucianlabs') {
      officialUrl = llUrlById.get(item.id) || officialUrl;
    }

    const cleaned = {
      ...item,
      title: stripEmojis(item.title || ''),
      description: stripEmojis(item.description || ''),
      officialUrl,
      promptSpec,
    };
    if (previewImage) cleaned.previewImage = previewImage;
    delete cleaned.previewHtml;
    delete cleaned.previewCss;
    if (previewHtml) cleaned.previewHtml = stripEmojis(previewHtml);
    if (previewCss) cleaned.previewCss = stripEmojis(previewCss);
    return cleaned;
  });

  fs.writeFileSync(sourceCatalogPath, JSON.stringify(nextCatalog, null, 2), 'utf8');

  writeJson(path.join(PROJECT_ROOT, 'public/data/studio-vault.json'), {
    total: vaultItems.length,
    sharded: true,
    shardExt: 'jgz',
    items: vaultItems,
  });

  const shardFiles = fs.readdirSync(VAULT_DIR);
  let vaultBytes = 0;
  for (const f of shardFiles) {
    vaultBytes += fs.statSync(path.join(VAULT_DIR, f)).size;
  }
  const msFullBytes = fs.statSync(existingMotionPath).size;

  console.log(
    JSON.stringify(
      {
        vaultTotal: vaultItems.length,
        shardCount: shardFiles.length,
        vaultMB: +(vaultBytes / 1e6).toFixed(2),
        motionsitesFullMB: +(msFullBytes / 1e6).toFixed(2),
        motionsitesTotal: msMf.length,
        motionsitesWithExtractedCode: msWithExtractedCode,
        motionsitesWithRenderableHtml: msWithRenderableHtml,
        catalogTotal: nextCatalog.length,
        catalogHydratedPrompts: hydratedCatalogCount,
        removedSyntheticCount,
      },
      null,
      2
    )
  );
}

main();
