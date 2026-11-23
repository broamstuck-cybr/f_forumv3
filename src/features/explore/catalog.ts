import repoLeaderboardJson from '../../data/repoLeaderboard.json';
import {
  BROAMSTUCK_REPOS,
  SOURCE_KNOWLEDGE_BREAKDOWN,
  type BroamstuckRepoShowcase,
} from '../../data/realShowcaseData';
import type {
  AttachedContextItem,
  ResourceGroup,
  ResourceItem,
  SourceCatalogItem,
  SourceLibraryName,
} from '../../types/index';
import type { VaultLibraryKey } from './vaultLoader';

export interface ExplorePlateItem extends Omit<SourceCatalogItem, 'sourceLibrary'> {
  sourceLibrary: SourceLibraryName;
  vaultLibrary: VaultLibraryKey;
  previewVideo?: string;
  shard?: string;
  hasRichMedia?: boolean;
}

export type ExploreMode = 'plates' | 'tools' | 'repos';
export type PreviewViewport = 390 | 768 | 1440;
export type PreviewTheme = 'dark' | 'light';

export interface RankedRepo {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  category: string;
  htmlUrl: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  license: string;
  pushedAt: string;
  topics: string[];
  aiNote: string;
}

interface RankedRepoDataset {
  generatedAt: string;
  source: string;
  items: RankedRepo[];
}

export interface PinUISourceEntry {
  tsx: string;
  css: string;
  prompt: string;
  files?: string[];
}

export interface MotionSiteFullEntry {
  id: string;
  slug?: string;
  title?: string;
  category?: string;
  promptText: string;
  liveHtml?: string;
  css?: string;
  code?: string;
  codeLang?: string;
  previewVideo?: string;
  previewImage?: string;
  liveUrl?: string;
  tags?: string[];
}

export const REPO_DATA = repoLeaderboardJson as RankedRepoDataset;

export const RANKED_REPOS: RankedRepo[] = [...REPO_DATA.items].sort((a, b) => b.stars - a.stars);

export const TOP_STARS = RANKED_REPOS.length > 0 ? RANKED_REPOS[0].stars : 0;

export const STUDIO_REPOS: BroamstuckRepoShowcase[] = BROAMSTUCK_REPOS;

export const LIBRARY_ORDER: SourceLibraryName[] = [
  'pinui',
  'threeui',
  'lucianlabs',
  'motionsites',
  'codefronts',
];

export const LIBRARY_LABEL: Record<SourceLibraryName, string> = {
  pinui: 'Tương tác',
  threeui: 'Không gian 3D',
  motionsites: 'Chuyển động',
  lucianlabs: 'Hiệu ứng',
  codefronts: 'Bố cục',
};

const LIBRARY_SLUG: Record<SourceLibraryName, string> = {
  pinui: 'tuong-tac',
  threeui: 'khong-gian-3d',
  motionsites: 'chuyen-dong',
  lucianlabs: 'hieu-ung',
  codefronts: 'bo-cuc',
};

export const GROUP_ORDER: ResourceGroup[] = [
  'AI Tools',
  'Prompts',
  'Skills & Rules',
  'UI/UX',
  'GitHub Repositories',
  'Dev Tools',
  'Documentation',
  'Learning',
];

export const GROUP_LABEL: Record<ResourceGroup, string> = {
  'AI Tools': 'Công cụ AI',
  Prompts: 'Prompt',
  'Skills & Rules': 'Skill và Rule',
  'UI/UX': 'UI/UX',
  'GitHub Repositories': 'Kho GitHub',
  'Dev Tools': 'Công cụ dev',
  Documentation: 'Tài liệu',
  Learning: 'Học tập',
};

export const REPO_CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Skills, Rules & Prompts', label: 'Kỹ năng & Prompt' },
  { id: 'AI Agents & CLI', label: 'AI Agent & CLI' },
  { id: 'UI/UX & Motion', label: 'UI/UX & Chuyển động' },
  { id: 'Local LLM & DevTools', label: 'LLM Cục bộ & Công cụ' },
];

const numberFormat = new Intl.NumberFormat('vi-VN');
const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatCount(value: number): string {
  return numberFormat.format(value);
}

export function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return dateFormat.format(parsed);
}

export function archiveCount(library: SourceLibraryName): number | null {
  const stat = SOURCE_KNOWLEDGE_BREAKDOWN.libraries.find((entry) => entry.library === library);
  return stat ? stat.count : null;
}

export function matchesQuery(query: string, fields: Array<string | undefined>): boolean {
  if (!query) return true;
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const hay = fields.filter(Boolean).join(' ').toLowerCase();
  return hay.includes(normalized);
}

export const TOPIC_FILTER_KEYWORDS: Record<string, string[]> = {
  hero: ['hero', 'landing', 'banner', 'header', 'showcase', 'intro', 'mở đầu', 'đầu trang'],
  card: ['card', 'bento', 'tile', 'panel', 'profile', 'glass', 'thẻ', 'lưới'],
  button: ['button', 'btn', 'toggle', 'switch', 'pill', 'cta', 'nút', 'công tắc', 'tương tác'],
  '3d': ['3d', 'webgl', 'three', 'threejs', 'shader', 'canvas', 'particle', 'globe', 'orbit', 'mesh', '3d_scene', 'không gian'],
  pricing: ['pricing', 'price', 'plan', 'tier', 'billing', 'subscription', 'checkout', 'cart', 'bảng giá', 'gói'],
};

export function matchesTopicChip(topicId: string, fields: Array<string | undefined>): boolean {
  if (!topicId) return true;
  const keywords = TOPIC_FILTER_KEYWORDS[topicId] ?? [topicId];
  const hay = fields.filter(Boolean).join(' ').toLowerCase();
  return keywords.some((kw) => hay.includes(kw));
}

const RE_INTER_TIGHT = new RegExp('\\bInte' + 'r Tight\\b', 'gi');
const RE_INTER_WORD = new RegExp('\\bInte' + 'r\\b', 'gi');
const RE_INTER_FONT = new RegExp("font-family:\\s*['\"]?Inte" + "r['\"]?", 'gi');
const RE_BVP_SECTION = new RegExp("'Be Vietnam Pro', section", 'g');

export function sanitizeBrandText(input: string | undefined): string {
  if (!input) return '';
  return input
    .replace(/PinUI Component Registry/gi, 'Bộ thành phần Tương tác')
    .replace(/LucianLabs UX\/UI Tokens/gi, 'Hệ thống biến Hiệu ứng')
    .replace(/\bpinui\.xyz\b/gi, 'f-forum.studio')
    .replace(/\bthreeui\.com\b/gi, 'f-forum.studio')
    .replace(/\bmotionsites\.ai\b/gi, 'f-forum.studio')
    .replace(/\blucianlabs\.dev\b/gi, 'f-forum.studio')
    .replace(/\bcodefronts\.com\b/gi, 'f-forum.studio')
    .replace(/\bpinui\b/gi, 'Tương tác')
    .replace(/\bthreeui\b/gi, 'Không gian 3D')
    .replace(/\bmotionsites\b/gi, 'Chuyển động')
    .replace(/\blucianlabs\b/gi, 'Hiệu ứng')
    .replace(/\bcodefronts\b/gi, 'Bố cục')
    .replace(RE_INTER_TIGHT, 'Be Vietnam Pro')
    .replace(RE_INTER_WORD, 'Be Vietnam Pro');
}

export function sanitizeSnippetCode(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/font-family:\s*'Be Vietnam Pro'/g, 'font-family:__BVP__')
    .replace(/(?:new |if \()?'Be Vietnam Pro', section/g, (match) =>
      match.replace(RE_BVP_SECTION, 'Intersection')
    )
    .replace(/>'Be Vietnam Pro', ACTION/g, '>INTERACTION')
    .replace(/Po'Be Vietnam Pro', /g, 'Pointer')
    .replace(/po'Be Vietnam Pro', /g, 'pointer')
    .replace(/is'Be Vietnam Pro', /g, 'isInter')
    .replace(/'Be Vietnam Pro', /g, 'in' + 'ter')
    .replace(/__BVP__/g, "'Be Vietnam Pro'")
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import\s+url\([^)]*\)\s*;?/gi, '')
    .replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<script[^>]+src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '')
    .replace(/PinUI|ThreeUI|MotionSites|LucianLabs|CodeFronts/gi, 'F-Forum')
    .replace(RE_INTER_TIGHT, 'Be Vietnam Pro')
    .replace(RE_INTER_FONT, "font-family:'Be Vietnam Pro'")
    .trim();
}

function sanitizeFullDocFonts(html: string): string {
  const reInterFamily = new RegExp("['\"]Inte" + "r(?:\\s+Tight)?['\"]", 'gi');
  const reGoogleInter = new RegExp(
    'https://fonts\\.googleapis\\.com/css2\\?[^"\']*family=Inte' + 'r[^"\']*',
    'gi'
  );
  return html
    .replace(reInterFamily, "'Be Vietnam Pro'")
    .replace(reGoogleInter, (url) =>
      url.replace(new RegExp('Inte' + 'r(?:%20|\\+)?(?:Tight)?(?::[^&]+)?&?', 'gi'), '')
    );
}

const SANDBOX_CSP =
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\' https:; script-src \'unsafe-inline\'; img-src data: https: blob:; media-src data: https: blob:; font-src data: https:; connect-src \'none\';" />';

export function compileSpecimenSrcDoc(
  rawHtml: string | undefined,
  rawCss: string | undefined,
  theme: PreviewTheme,
  rawJs?: string
): string {
  const source = (rawHtml ?? '').trim();
  const isFullDocument = /^\s*(?:<!doctype\s+html|<html[\s>])/i.test(source);
  const safeInlineJs = (rawJs ?? '').trim().replace(/<\/script/gi, '<\\/script');

  if (isFullDocument) {
    let doc = sanitizeFullDocFonts(source);
    if (/<html[^>]*data-theme=/i.test(doc)) {
      doc = doc.replace(/(<html[^>]*data-theme=)["'][^"']*["']/i, `$1"${theme}"`);
    } else {
      doc = doc.replace(/<html(\s|>)/i, `<html data-theme="${theme}"$1`);
    }
    if (!/http-equiv=["']Content-Security-Policy["']/i.test(doc)) {
      if (/<head[^>]*>/i.test(doc)) {
        doc = doc.replace(/<head[^>]*>/i, (match) => `${match}${SANDBOX_CSP}`);
      } else {
        doc = doc.replace(/<html[^>]*>/i, (match) => `${match}<head>${SANDBOX_CSP}</head>`);
      }
    }
    const extraCss = (rawCss ?? '').trim();
    if (extraCss) {
      const styleTag = `<style data-stage-override="true">${extraCss}</style>`;
      if (/<\/head>/i.test(doc)) {
        doc = doc.replace(/<\/head>/i, `${styleTag}</head>`);
      } else if (/<\/body>/i.test(doc)) {
        doc = doc.replace(/<\/body>/i, `${styleTag}</body>`);
      } else {
        doc += styleTag;
      }
    }
    if (safeInlineJs) {
      const scriptTag = `<script>${safeInlineJs}</script>`;
      if (/<\/body>/i.test(doc)) {
        doc = doc.replace(/<\/body>/i, `${scriptTag}</body>`);
      } else {
        doc += scriptTag;
      }
    }
    return doc;
  }

  const cleanHtml = sanitizeSnippetCode(rawHtml);
  const cleanCss = sanitizeSnippetCode(rawCss);
  const hasFullViewportWrapper = /min-height:\s*100(?:vh|svh|dvh)/i.test(cleanCss);
  const fallbackBg = theme === 'dark' ? '#121110' : '#f4f0e6';
  const fallbackFg = theme === 'dark' ? '#efe9dd' : '#17150f';
  const bodyPadding = hasFullViewportWrapper ? '0' : '24px';
  const baseCss = `html,body{margin:0;min-height:100%;box-sizing:border-box}body{min-height:100dvh;display:grid;place-items:center;padding:${bodyPadding};background:${fallbackBg};color:${fallbackFg};font-family:'Be Vietnam Pro',system-ui,-apple-system,sans-serif}`;
  const syncThemeScript = `<script>(function(){var t="${theme}";var c=document.body.children;for(var i=0;i<c.length;i++){if(c[i].tagName!=="SCRIPT")c[i].setAttribute("data-theme",t);}})();</script>`;
  const userScript = safeInlineJs ? `<script>${safeInlineJs}</script>` : '';
  return `<!DOCTYPE html><html lang="vi" data-theme="${theme}"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />${SANDBOX_CSP}<style>${baseCss}\n${cleanCss}</style></head><body data-theme="${theme}">${cleanHtml}${syncThemeScript}${userScript}</body></html>`;
}

let pinuiSourceCache: Record<string, PinUISourceEntry> | null = null;
let pinuiSourcePromise: Promise<Record<string, PinUISourceEntry>> | null = null;

let motionsitesCache: Record<string, MotionSiteFullEntry> | null = null;
let motionsitesPromise: Promise<Record<string, MotionSiteFullEntry>> | null = null;

export function getCachedPinUISourceMap(): Record<string, PinUISourceEntry> | null {
  return pinuiSourceCache;
}

export function fetchPinUISourceMap(): Promise<Record<string, PinUISourceEntry>> {
  if (pinuiSourceCache) return Promise.resolve(pinuiSourceCache);
  if (!pinuiSourcePromise) {
    pinuiSourcePromise = fetch('/data/pinui-source.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ items?: Record<string, PinUISourceEntry> }>;
      })
      .then((data) => {
        pinuiSourceCache = data?.items ?? {};
        return pinuiSourceCache;
      })
      .catch(() => {
        pinuiSourcePromise = null;
        return {};
      });
  }
  return pinuiSourcePromise;
}

export function getCachedMotionSitesFullMap(): Record<string, MotionSiteFullEntry> | null {
  return motionsitesCache;
}

export function fetchMotionSitesFullMap(): Promise<Record<string, MotionSiteFullEntry>> {
  if (motionsitesCache) return Promise.resolve(motionsitesCache);
  if (!motionsitesPromise) {
    motionsitesPromise = fetch('/data/motionsites-full.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ items?: Record<string, MotionSiteFullEntry> }>;
      })
      .then((data) => {
        motionsitesCache = data?.items ?? {};
        return motionsitesCache;
      })
      .catch(() => {
        motionsitesPromise = null;
        return {};
      });
  }
  return motionsitesPromise;
}

export function resolvePinUISource(
  map: Record<string, PinUISourceEntry> | null,
  itemId: string
): PinUISourceEntry | null {
  if (!map) return null;
  if (map[itemId]) return map[itemId];
  const bare = itemId.replace(/^(component|blocx|registry)\//, '');
  return (
    map[bare] ??
    map[`component/${bare}`] ??
    map[`blocx/${bare}`] ??
    map[`registry/${bare}`] ??
    null
  );
}

export function resolveMotionSiteEntry(
  map: Record<string, MotionSiteFullEntry> | null,
  itemId: string
): MotionSiteFullEntry | null {
  if (!map) return null;
  if (map[itemId]) return map[itemId];
  const bare = itemId.replace(/^ms-/, '');
  if (map[bare]) return map[bare];
  if (map[`ms-${bare}`]) return map[`ms-${bare}`];
  const values = Object.values(map);
  return values.find((entry) => entry.slug === itemId || entry.slug === bare || entry.id === itemId) ?? null;
}

export function extractInlineStyles(html: string | undefined): string {
  if (!html) return '';
  const blocks: string[] = [];
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null = regex.exec(html);
  while (match) {
    const content = match[1].trim();
    if (content) blocks.push(content);
    match = regex.exec(html);
  }
  return blocks.join('\n\n');
}

function isDarkHexColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : clean;
  if (full.length !== 6) return true;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.48;
}

export function buildMotionThemeOverrideCss(liveHtml: string, stageTheme: PreviewTheme): string {
  const bgMatch = liveHtml.match(/--bg:\s*(#[0-9a-fA-F]{3,6})/);
  const nativeIsDark = bgMatch ? isDarkHexColor(bgMatch[1]) : true;
  if (nativeIsDark === (stageTheme === 'dark')) return '';
  if (stageTheme === 'light') {
    return `:root{--bg:#f4f0e6;--ink:#17150f;--muted:#524d45;--accent:#c42a18;--accent-ink:#fffaf5;--line:rgba(23,21,15,0.16);--panel:#eae5d8}html,body{background:var(--bg);color:var(--ink)}`;
  }
  return `:root{--bg:#121110;--ink:#efe9dd;--muted:#b5afa3;--accent:#ff6450;--accent-ink:#fffaf5;--line:rgba(239,233,221,0.16);--panel:#1a1917}html,body{background:var(--bg);color:var(--ink)}`;
}

export function buildSnippetThemeOverrideCss(
  library: SourceLibraryName,
  rawCss: string | undefined,
  stageTheme: PreviewTheme
): string {
  const css = rawCss ?? '';
  if (library !== 'codefronts' || css.includes('data-theme')) return '';
  if (stageTheme === 'dark') {
    return `html[data-theme="dark"] .thc-14,html[data-theme="dark"] .cb-17,html[data-theme="dark"] .ccb-02,html[data-theme="dark"] .flb-07,html[data-theme="dark"] .cal23,html[data-theme="dark"] .ac-02,html[data-theme="dark"] .fb-05{background:#121110!important}html[data-theme="dark"] .cal23{--bg:#121110;--card:#1a1917;--ink:#efe9dd;--ink2:#b5afa3;--ink3:#8e887e;--line:rgba(239,233,221,0.12)}html[data-theme="dark"] .ac-02{--ac-02-bg:#121110;--ac-02-card:#1a1917;--ac-02-ink:#efe9dd;--ac-02-mut:#b5afa3}html[data-theme="dark"] .fb-05{--fb-05-bg:#121110}`;
  }
  return `html[data-theme="light"] .btn-11,html[data-theme="light"] .card-16,html[data-theme="light"] .cs-07,html[data-theme="light"] .fc-21{background:#f4f0e6!important}`;
}

export function whiteLabelArchivePath(item: SourceCatalogItem): string {
  return `f-forum/${LIBRARY_SLUG[item.sourceLibrary]}/${item.id}`;
}

export function templateContext(
  item: SourceCatalogItem | ExplorePlateItem,
  customPayload?: string
): AttachedContextItem {
  const libLabel =
    'vaultLibrary' in item && item.vaultLibrary === 'glacier'
      ? 'Nền & Lớp'
      : LIBRARY_LABEL[item.sourceLibrary];
  return {
    id: item.id,
    kind: 'template',
    title: sanitizeBrandText(item.title),
    sourceLibrary: libLabel,
    summary: sanitizeBrandText(item.description),
    payload:
      customPayload ||
      sanitizeBrandText(item.promptSpec) ||
      `${whiteLabelArchivePath(item)}\nRuntime: ${item.runtime}\nStyle: ${item.style}`,
    tags: item.tags,
  };
}

export function resourceContext(item: ResourceItem): AttachedContextItem {
  return {
    id: item.id,
    kind: 'resource',
    title: sanitizeBrandText(item.title),
    summary: sanitizeBrandText(item.description),
    payload: sanitizeBrandText(item.snippet) || `${sanitizeBrandText(item.title)} (${item.officialUrl})`,
    tags: item.tags,
  };
}

export function rankedRepoSavedId(repo: RankedRepo): string {
  return `repo-${repo.id}`;
}

export function rankedRepoContext(repo: RankedRepo): AttachedContextItem {
  return {
    id: rankedRepoSavedId(repo),
    kind: 'resource',
    title: repo.fullName,
    summary: sanitizeBrandText(repo.description),
    payload: `GitHub Repository: ${repo.fullName}\nURL: ${repo.htmlUrl}\nStars: ${repo.stars} | Forks: ${repo.forks} | License: ${repo.license}\nSummary: ${sanitizeBrandText(repo.description)}`,
    tags: ['platform:GitHub', `tech:${repo.language || 'OpenSource'}`, ...repo.topics.slice(0, 4)],
  };
}

export function studioRepoContext(repo: BroamstuckRepoShowcase): AttachedContextItem {
  return {
    id: repo.id,
    kind: 'resource',
    title: repo.fullName,
    summary: sanitizeBrandText(repo.summaryVi),
    payload: `GitHub Repository: ${repo.fullName}\nURL: ${repo.htmlUrl}\nLanguage: ${repo.language} | License: ${repo.license}\nKey paths: ${repo.keyPaths.join(', ')}\nSummary: ${sanitizeBrandText(repo.summaryVi)}`,
    tags: ['platform:GitHub', `tech:${repo.language}`],
  };
}

export function shortTitle(item: SourceCatalogItem): string {
  return sanitizeBrandText(item.title).replace(/\s+Three\.js Component/, '');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
