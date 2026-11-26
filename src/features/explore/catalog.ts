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
import { VAULT_CACHE_VERSION, type VaultLibraryKey } from './vaultLoader';

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

const RE_RELATIVE_FONT_FACE = /@font-face\s*\{[^}]*src\s*:\s*url\(\s*['"]?(?!https?:|data:)[^)]+\)[^}]*\}/gi;
const RE_WORDMARK_PATH = /<path\b[^>]*\bd\s*=\s*["'][^"']*WORDMARK[^"']*["'][^>]*\/?>/gi;

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
    .replace(RE_RELATIVE_FONT_FACE, '')
    .replace(RE_WORDMARK_PATH, '')
    .replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<script[^>]+src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '')
    .replace(/PinUI|ThreeUI|MotionSites|LucianLabs|CodeFronts/gi, 'F-Forum')
    .replace(RE_INTER_TIGHT, 'Be Vietnam Pro')
    .replace(RE_INTER_FONT, "font-family:'Be Vietnam Pro'")
    .trim();
}

interface HtmlAttr {
  name: string;
  value: string;
  hasValue: boolean;
}

interface HtmlToken {
  kind: 'doctype' | 'comment' | 'start' | 'end';
  tagName: string;
  start: number;
  end: number;
  selfClosing: boolean;
  attrs: HtmlAttr[];
}

const RAW_OR_RCDATA_HTML_TAGS = new Set([
  'script',
  'style',
  'title',
  'textarea',
  'xmp',
  'noembed',
  'noframes',
  'noscript',
  'iframe',
  'plaintext',
]);

function tokenizeHtml(doc: string): HtmlToken[] {
  const tokens: HtmlToken[] = [];
  const len = doc.length;
  let i = 0;

  while (i < len) {
    const lt = doc.indexOf('<', i);
    if (lt === -1) break;

    if (doc.startsWith('<!--', lt)) {
      let end = len;
      if (doc.startsWith('<!-->', lt)) {
        end = lt + 5;
      } else if (doc.startsWith('<!--->', lt)) {
        end = lt + 6;
      } else {
        const closeIdx = doc.indexOf('-->', lt + 4);
        const bangIdx = doc.indexOf('--!>', lt + 4);
        const closeEnd = closeIdx === -1 ? len : closeIdx + 3;
        const bangEnd = bangIdx === -1 ? len : bangIdx + 4;
        end = Math.min(closeEnd, bangEnd);
      }
      tokens.push({
        kind: 'comment',
        tagName: '',
        start: lt,
        end,
        selfClosing: false,
        attrs: [],
      });
      i = end;
      continue;
    }

    if (doc[lt + 1] === '!' || doc[lt + 1] === '?') {
      const gt = doc.indexOf('>', lt + 2);
      const end = gt === -1 ? len : gt + 1;
      if (/^<!doctype(?:\s|>)/i.test(doc.slice(lt, Math.min(len, lt + 12)))) {
        tokens.push({
          kind: 'doctype',
          tagName: 'doctype',
          start: lt,
          end,
          selfClosing: false,
          attrs: [],
        });
      }
      i = end;
      continue;
    }

    const isEnd = doc[lt + 1] === '/';
    let p = lt + (isEnd ? 2 : 1);
    if (p >= len || !/[a-zA-Z]/.test(doc[p])) {
      i = lt + 1;
      continue;
    }

    const nameStart = p;
    while (p < len && /[a-zA-Z0-9:-]/.test(doc[p])) p += 1;
    if (p < len && !/[\s/>]/.test(doc[p])) {
      i = lt + 1;
      continue;
    }
    const tagName = doc.slice(nameStart, p).toLowerCase();

    const attrs: HtmlAttr[] = [];
    let selfClosing = false;
    let closed = false;

    while (p < len) {
      while (p < len && /\s/.test(doc[p])) p += 1;
      if (p >= len) break;
      const ch = doc[p];
      if (ch === '>') {
        p += 1;
        closed = true;
        break;
      }
      if (ch === '/') {
        if (doc[p + 1] === '>') {
          selfClosing = true;
          p += 2;
          closed = true;
          break;
        }
        p += 1;
        continue;
      }
      const attrNameStart = p;
      while (p < len && !/[\s=/>]/.test(doc[p])) p += 1;
      const attrName = doc.slice(attrNameStart, p).toLowerCase();
      if (!attrName) {
        p += 1;
        continue;
      }
      while (p < len && /\s/.test(doc[p])) p += 1;
      let attrValue = '';
      let hasValue = false;
      if (p < len && doc[p] === '=') {
        hasValue = true;
        p += 1;
        while (p < len && /\s/.test(doc[p])) p += 1;
        if (p < len && (doc[p] === '"' || doc[p] === "'")) {
          const quote = doc[p];
          p += 1;
          const valStart = p;
          while (p < len && doc[p] !== quote) p += 1;
          attrValue = doc.slice(valStart, p);
          if (p < len && doc[p] === quote) p += 1;
        } else {
          const valStart = p;
          while (p < len && !/[\s>]/.test(doc[p])) p += 1;
          attrValue = doc.slice(valStart, p);
        }
      }
      attrs.push({ name: attrName, value: attrValue, hasValue });
    }

    if (!closed) {
      break;
    }

    tokens.push({
      kind: isEnd ? 'end' : 'start',
      tagName,
      start: lt,
      end: p,
      selfClosing: !isEnd && selfClosing,
      attrs,
    });
    i = p;

    if (!isEnd && RAW_OR_RCDATA_HTML_TAGS.has(tagName)) {
      if (tagName === 'plaintext') {
        i = len;
        continue;
      }
      const closeRe = new RegExp(`<\\/${tagName}(?=[\\s/>]|$)`, 'gi');
      closeRe.lastIndex = i;
      const closeMatch = closeRe.exec(doc);
      if (!closeMatch) {
        i = len;
      } else {
        let cp = closeMatch.index + closeMatch[0].length;
        while (cp < len && doc[cp] !== '>') cp += 1;
        const closeEnd = cp < len ? cp + 1 : len;
        tokens.push({
          kind: 'end',
          tagName,
          start: closeMatch.index,
          end: closeEnd,
          selfClosing: false,
          attrs: [],
        });
        i = closeEnd;
      }
    }
  }

  return tokens;
}

function getTokenAttr(token: HtmlToken, name: string): string | undefined {
  for (let idx = token.attrs.length - 1; idx >= 0; idx -= 1) {
    if (token.attrs[idx].name === name) return token.attrs[idx].value;
  }
  return undefined;
}

function stripHtmlTokens(
  doc: string,
  shouldStripStart: (token: HtmlToken) => boolean
): string {
  const tokens = tokenizeHtml(doc);
  const ranges: Array<[number, number]> = [];
  for (let idx = 0; idx < tokens.length; idx += 1) {
    const token = tokens[idx];
    if (token.kind !== 'start' || !shouldStripStart(token)) continue;
    let end = token.end;
    if (RAW_OR_RCDATA_HTML_TAGS.has(token.tagName)) {
      const next = tokens[idx + 1];
      if (next && next.kind === 'end' && next.tagName === token.tagName) {
        end = next.end;
        idx += 1;
      }
    }
    ranges.push([token.start, end]);
  }
  if (ranges.length === 0) return doc;
  let out = '';
  let cursor = 0;
  for (const [start, end] of ranges) {
    out += doc.slice(cursor, start);
    cursor = end;
  }
  out += doc.slice(cursor);
  return out;
}

function serializeStartTag(tagName: string, attrs: HtmlAttr[], selfClosing: boolean): string {
  const attrStr = attrs
    .map((a) =>
      a.hasValue ? `${a.name}="${a.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"` : a.name
    )
    .join(' ');
  const suffix = selfClosing ? ' />' : '>';
  return attrStr ? `<${tagName} ${attrStr}${suffix}` : `<${tagName}${suffix}`;
}

function sanitizeFullDocFonts(html: string): string {
  const reInterFamily = new RegExp("['\"]Inte" + "r(?:\\s+Tight)?['\"]", 'gi');
  const reGoogleInter = new RegExp(
    'https://fonts\\.googleapis\\.com/css2\\?[^"\']*family=Inte' + 'r[^"\']*',
    'gi'
  );
  const withoutExternalResources = stripHtmlTokens(
    html
      .replace(RE_RELATIVE_FONT_FACE, '')
      .replace(RE_WORDMARK_PATH, ''),
    (token) => {
      if (token.tagName === 'script') {
        const src = getTokenAttr(token, 'src');
        return Boolean(src && src.trim());
      }
      if (token.tagName === 'link') {
        const href = getTokenAttr(token, 'href');
        return Boolean(href && !/^(?:https?:|data:)/i.test(href.trim()));
      }
      return false;
    }
  );
  return withoutExternalResources
    .replace(reInterFamily, "'Be Vietnam Pro'")
    .replace(reGoogleInter, (url) =>
      url.replace(new RegExp('Inte' + 'r(?:%20|\\+)?(?:Tight)?(?::[^&]+)?&?', 'gi'), '')
    );
}

const SANDBOX_CSP =
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\' https:; script-src \'unsafe-inline\'; img-src data: https: blob:; media-src data: https: blob:; font-src data: https:; connect-src \'none\';" />';

const STRIPPED_META_HTTP_EQUIV = new Set([
  'content-security-policy',
  'refresh',
  'set-cookie',
  'location',
]);

function decodeMetaAttrValue(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => {
      const cp = Number.parseInt(hex, 16);
      return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
    })
    .replace(/&#([0-9]+);?/g, (_, dec: string) => {
      const cp = Number.parseInt(dec, 10);
      return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
    });
}

function isDisallowedMetaToken(token: HtmlToken): boolean {
  if (token.tagName !== 'meta') return false;
  return token.attrs.some(
    (attr) =>
      attr.name === 'http-equiv' &&
      STRIPPED_META_HTTP_EQUIV.has(decodeMetaAttrValue(attr.value).trim().toLowerCase())
  );
}

function findHtmlTagToken(
  doc: string,
  tagName: string,
  kind: HtmlToken['kind'] = 'start',
  pickLast = false
): HtmlToken | null {
  const tokens = tokenizeHtml(doc);
  let chosen: HtmlToken | null = null;
  for (const token of tokens) {
    if (token.kind === kind && token.tagName === tagName) {
      chosen = token;
      if (!pickLast) return chosen;
    }
  }
  return chosen;
}

function insertAfterHtmlTag(doc: string, tagName: string, addition: string): string | null {
  const token = findHtmlTagToken(doc, tagName, 'start', false);
  if (!token) return null;
  return `${doc.slice(0, token.end)}${addition}${doc.slice(token.end)}`;
}

function insertBeforeHtmlTag(
  doc: string,
  tagName: string,
  addition: string,
  kind: HtmlToken['kind'] = 'end',
  pickLast = false
): string | null {
  const token = findHtmlTagToken(doc, tagName, kind, pickLast);
  if (!token) return null;
  return `${doc.slice(0, token.start)}${addition}${doc.slice(token.start)}`;
}

export function compileSpecimenSrcDoc(
  rawHtml: string | undefined,
  rawCss: string | undefined,
  theme: PreviewTheme,
  rawJs?: string
): string {
  const source = (rawHtml ?? '').trim();
  const isFullDocument = /^\s*(?:<!doctype\s+html|<html(?:\s|>))/i.test(source);
  const safeInlineJs = (rawJs ?? '').trim().replace(/<\/script/gi, '<\\/script');

  if (isFullDocument) {
    let doc = sanitizeFullDocFonts(source);
    doc = stripHtmlTokens(doc, isDisallowedMetaToken);
    const htmlTokenForTheme = findHtmlTagToken(doc, 'html', 'start', false);
    if (htmlTokenForTheme) {
      const hasThemeAttr = htmlTokenForTheme.attrs.some((a) => a.name === 'data-theme');
      const nextAttrs = hasThemeAttr
        ? htmlTokenForTheme.attrs.map((a) =>
            a.name === 'data-theme' ? { name: 'data-theme', value: theme, hasValue: true } : a
          )
        : [{ name: 'data-theme', value: theme, hasValue: true }, ...htmlTokenForTheme.attrs];
      doc = `${doc.slice(0, htmlTokenForTheme.start)}${serializeStartTag('html', nextAttrs, htmlTokenForTheme.selfClosing)}${doc.slice(htmlTokenForTheme.end)}`;
    }
    const tokens = tokenizeHtml(doc);
    let earlyIdx = Number.POSITIVE_INFINITY;
    let headToken: HtmlToken | null = null;
    let htmlToken: HtmlToken | null = null;
    let doctypeToken: HtmlToken | null = null;
    for (const token of tokens) {
      if (token.kind === 'doctype' && !doctypeToken) {
        doctypeToken = token;
      } else if (token.kind === 'start') {
        if (token.tagName === 'head' && !headToken) headToken = token;
        if (token.tagName === 'html' && !htmlToken) htmlToken = token;
        if (token.tagName !== 'html' && token.tagName !== 'head') {
          earlyIdx = Math.min(earlyIdx, token.start);
        }
      }
    }

    if (headToken && headToken.start < earlyIdx) {
      doc = `${doc.slice(0, headToken.end)}${SANDBOX_CSP}${doc.slice(headToken.end)}`;
    } else if (htmlToken && htmlToken.start < earlyIdx) {
      doc = `${doc.slice(0, htmlToken.end)}<head>${SANDBOX_CSP}</head>${doc.slice(htmlToken.end)}`;
    } else if (doctypeToken && doctypeToken.start < earlyIdx) {
      doc = `${doc.slice(0, doctypeToken.end)}<head>${SANDBOX_CSP}</head>${doc.slice(doctypeToken.end)}`;
    } else {
      doc = `<head>${SANDBOX_CSP}</head>${doc}`;
    }
    if (!/(?:html|body)[^{]*\{[^}]*(?:min-height|height)\s*:\s*100/i.test(doc)) {
      const fillStyle = '<style data-sandbox-fill="true">html{height:100%}html,body{min-height:100%;margin:0}</style>';
      doc =
        insertAfterHtmlTag(doc, 'head', fillStyle) ||
        `${fillStyle}${doc}`;
    }
    const extraCss = (rawCss ?? '')
      .replace(RE_RELATIVE_FONT_FACE, '')
      .replace(/<\/style/gi, '<\\/style')
      .trim();
    if (extraCss) {
      const styleTag = `<style data-stage-override="true">${extraCss}</style>`;
      doc =
        insertBeforeHtmlTag(doc, 'head', styleTag, 'end', false) ||
        insertAfterHtmlTag(doc, 'head', styleTag) ||
        insertBeforeHtmlTag(doc, 'body', styleTag, 'end', true) ||
        `${doc}${styleTag}`;
    }
    if (safeInlineJs) {
      const scriptTag = `<script>${safeInlineJs}</script>`;
      doc =
        insertBeforeHtmlTag(doc, 'body', scriptTag, 'end', true) ||
        `${doc}${scriptTag}`;
    }
    return doc;
  }

  const cleanHtml = stripHtmlTokens(sanitizeSnippetCode(rawHtml), isDisallowedMetaToken);
  const cleanCss = sanitizeSnippetCode(rawCss).replace(/<\/style/gi, '<\\/style');
  const hasFullViewportWrapper = /min-height:\s*100(?:vh|svh|dvh|%)/i.test(cleanCss);
  const fallbackBg = theme === 'dark' ? '#121110' : '#f4f0e6';
  const fallbackFg = theme === 'dark' ? '#efe9dd' : '#17150f';
  const bodyPadding = hasFullViewportWrapper ? '0' : '24px';
  const baseCss = `html{height:100%;min-height:100%}html,body{margin:0;min-height:100%;box-sizing:border-box}body{min-height:100%;display:grid;place-items:center;padding:${bodyPadding};background:${fallbackBg};color:${fallbackFg};font-family:'Be Vietnam Pro',system-ui,-apple-system,sans-serif}`;
  const syncThemeScript = `<script>(function(){var t="${theme}";var c=document.body.children;for(var i=0;i<c.length;i++){if(c[i].tagName!=="SCRIPT")c[i].setAttribute("data-theme",t);}var s=document.currentScript;if(s&&s.parentNode)s.parentNode.removeChild(s);})();</script>`;
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
    pinuiSourcePromise = fetch(`/data/pinui-source.json?v=${VAULT_CACHE_VERSION}`)
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
    motionsitesPromise = fetch(`/data/motionsites-full.json?v=${VAULT_CACHE_VERSION}`)
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
