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
  { id: 'AI Agents & CLI', label: 'Agents' },
  { id: 'Skills, Rules & Prompts', label: 'Skills' },
  { id: 'UI/UX & Motion', label: 'UI/UX' },
  { id: 'Local LLM & DevTools', label: 'Local LLM' },
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
  return fields.some((field) => (field ? field.toLowerCase().includes(query) : false));
}

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
    .replace(/\bInter Tight\b/gi, 'Be Vietnam Pro')
    .replace(/\bInter\b/g, 'Be Vietnam Pro');
}

export function sanitizeSnippetCode(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/font-family:\s*'Be Vietnam Pro'/g, 'font-family:__BVP__')
    .replace(/(?:new |if \()?'Be Vietnam Pro', section/g, (match) =>
      match.replace("'Be Vietnam Pro', section", 'Intersection')
    )
    .replace(/>'Be Vietnam Pro', ACTION/g, '>INTERACTION')
    .replace(/Po'Be Vietnam Pro', /g, 'Pointer')
    .replace(/po'Be Vietnam Pro', /g, 'pointer')
    .replace(/is'Be Vietnam Pro', /g, 'isInter')
    .replace(/'Be Vietnam Pro', /g, 'inter')
    .replace(/__BVP__/g, "'Be Vietnam Pro'")
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import\s+url\([^)]*\)\s*;?/gi, '')
    .replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<script[^>]+src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '')
    .replace(/PinUI|ThreeUI|MotionSites|LucianLabs|CodeFronts/gi, 'F-Forum')
    .replace(/\bInter Tight\b/gi, 'Be Vietnam Pro')
    .replace(/font-family:\s*['"]?Inter['"]?/gi, "font-family:'Be Vietnam Pro'")
    .trim();
}

export function compileSpecimenSrcDoc(
  rawHtml: string | undefined,
  rawCss: string | undefined,
  theme: PreviewTheme
): string {
  const cleanHtml = sanitizeSnippetCode(rawHtml);
  const cleanCss = sanitizeSnippetCode(rawCss);
  const cspMeta =
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data: https:; font-src data: https:;" />';
  const fallbackBg = theme === 'dark' ? '#121110' : '#f4f0e6';
  const fallbackFg = theme === 'dark' ? '#efe9dd' : '#17150f';
  const baseCss = `html,body{margin:0;min-height:100%;box-sizing:border-box}body{min-height:100vh;display:grid;place-items:center;padding:24px;background:${fallbackBg};color:${fallbackFg};font-family:'Be Vietnam Pro',system-ui,-apple-system,sans-serif}`;
  return `<!DOCTYPE html><html lang="vi" data-theme="${theme}"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />${cspMeta}<style>${baseCss}\n${cleanCss}</style></head><body>${cleanHtml}</body></html>`;
}

export function whiteLabelArchivePath(item: SourceCatalogItem): string {
  return `f-forum/${LIBRARY_SLUG[item.sourceLibrary]}/${item.id}`;
}

export function templateContext(item: SourceCatalogItem): AttachedContextItem {
  return {
    id: item.id,
    kind: 'template',
    title: sanitizeBrandText(item.title),
    sourceLibrary: LIBRARY_LABEL[item.sourceLibrary],
    summary: sanitizeBrandText(item.description),
    payload:
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
