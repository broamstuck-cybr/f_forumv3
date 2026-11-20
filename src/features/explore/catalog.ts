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
  'motionsites',
  'lucianlabs',
  'codefronts',
];

export const LIBRARY_LABEL: Record<SourceLibraryName, string> = {
  pinui: 'PinUI',
  threeui: 'ThreeUI',
  motionsites: 'MotionSites',
  lucianlabs: 'LucianLabs',
  codefronts: 'CodeFronts',
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
  { id: 'Skills, Rules & Prompts', label: 'Skills' },
  { id: 'AI Agents & CLI', label: 'Agents' },
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

export function templateContext(item: SourceCatalogItem): AttachedContextItem {
  return {
    id: item.id,
    kind: 'template',
    title: item.title,
    sourceLibrary: item.sourceLibrary,
    summary: item.description,
    payload: item.promptSpec || `${item.archivePath}\nRuntime: ${item.runtime}\nStyle: ${item.style}`,
    tags: item.tags,
  };
}

export function resourceContext(item: ResourceItem): AttachedContextItem {
  return {
    id: item.id,
    kind: 'resource',
    title: item.title,
    summary: item.description,
    payload: item.snippet || `${item.title} (${item.officialUrl})`,
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
    summary: repo.description,
    payload: `GitHub Repository: ${repo.fullName}\nURL: ${repo.htmlUrl}\nStars: ${repo.stars} | Forks: ${repo.forks} | License: ${repo.license}\nSummary: ${repo.description}`,
    tags: ['platform:GitHub', `tech:${repo.language || 'OpenSource'}`, ...repo.topics.slice(0, 4)],
  };
}

export function studioRepoContext(repo: BroamstuckRepoShowcase): AttachedContextItem {
  return {
    id: repo.id,
    kind: 'resource',
    title: repo.fullName,
    summary: repo.summaryVi,
    payload: `GitHub Repository: ${repo.fullName}\nURL: ${repo.htmlUrl}\nLanguage: ${repo.language} | License: ${repo.license}\nKey paths: ${repo.keyPaths.join(', ')}\nSummary: ${repo.summaryVi}`,
    tags: ['platform:GitHub', `tech:${repo.language}`],
  };
}

export function shortTitle(item: SourceCatalogItem): string {
  return item.title.replace(/\s+Three\.js Component/, '');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
