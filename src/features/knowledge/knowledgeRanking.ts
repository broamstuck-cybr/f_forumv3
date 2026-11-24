import type { VaultIndexItem, VaultLibraryKey } from '../explore/vaultLoader';

export interface KnowledgeScore {
  item: VaultIndexItem;
  score: number;
  relevance: number;
  reasons: string[];
}

export interface KnowledgeRankOptions {
  source?: VaultLibraryKey | 'all';
  runnableOnly?: boolean;
  limit?: number;
}

export interface KnowledgeRankResult {
  results: KnowledgeScore[];
  total: number;
}

const SOURCE_WEIGHT: Record<VaultLibraryKey, number> = {
  codefronts: 5,
  lucianlabs: 5,
  pinui: 4,
  threeui: 3,
  motionsites: 2,
  glacier: 2,
};

const RUNNABLE_SOURCES = new Set<VaultLibraryKey>(['codefronts', 'lucianlabs', 'pinui']);

export function isRunnableKnowledge(item: VaultIndexItem): boolean {
  return item.d === 1 && RUNNABLE_SOURCES.has(item.l);
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();
}

function tokenScore(haystack: string, tokens: string[], weight: number): number {
  if (!tokens.length) return 0;
  const words = haystack.split(/[^a-z0-9+#.]+/).filter(Boolean);
  let total = 0;
  for (const token of tokens) {
    if (words.includes(token)) total += weight;
    else if (haystack.includes(token)) total += weight * 0.55;
  }
  return total;
}

/**
 * Deterministic retrieval score: title first, then controlled vocabulary,
 * demo availability and source reliability. No engagement metrics are used,
 * so a newly indexed record is not buried by older community posts.
 */
export function rankKnowledge(
  items: VaultIndexItem[],
  query: string,
  options: KnowledgeRankOptions = {}
): KnowledgeRankResult {
  const source = options.source ?? 'all';
  const runnableOnly = options.runnableOnly ?? false;
  const limit = options.limit ?? 48;
  const normalizedQuery = normalize(query);
  const phrase = normalizedQuery.replace(/\s+/g, ' ');
  const tokens = [...new Set(phrase.split(/\s+/).filter((token) => token.length > 1))];

  const scored: KnowledgeScore[] = [];

  for (const item of items) {
    if (source !== 'all' && item.l !== source) continue;
    if (runnableOnly && !isRunnableKnowledge(item)) continue;

    const title = normalize(item.t);
    const category = normalize(item.c);
    const group = normalize(item.g);
    const tags = item.tg.map(normalize);
    const tagsText = tags.join(' ');
    const sourceWeight = SOURCE_WEIGHT[item.l] ?? 1;
    const reasons: string[] = [];
    let score = 0;

    if (!phrase) {
      score = sourceWeight * 2 + (item.d === 1 ? 5 : 0) + Math.min(tags.length, 3) * 0.4;
      if (item.d === 1) reasons.push('Có bản chạy');
      reasons.push('Nguồn đã kiểm định');
    } else {
      if (title === phrase) {
        score += 24;
        reasons.push('Khớp chính xác tiêu đề');
      } else if (title.startsWith(phrase)) {
        score += 16;
        reasons.push('Tiêu đề bắt đầu bằng từ khóa');
      } else if (title.includes(phrase)) {
        score += 10;
        reasons.push('Tiêu đề chứa cụm từ khóa');
      }

      const titleTokens = tokenScore(title, tokens, 3.2);
      const tagTokens = tokenScore(tagsText, tokens, 2.1);
      const categoryTokens = tokenScore(category, tokens, 1.8);
      const groupTokens = tokenScore(group, tokens, 0.9);
      score += titleTokens + tagTokens + categoryTokens + groupTokens;

      if (titleTokens > 0) reasons.push('Khớp tiêu đề');
      if (tagTokens > 0) reasons.push('Khớp thẻ');
      if (categoryTokens > 0) reasons.push('Đúng danh mục');

      if (score <= 0) continue;
      if (item.d === 1) {
        score += 4;
        reasons.push('Có bản chạy');
      }
      score += sourceWeight * 0.5;
    }

    scored.push({
      item,
      score,
      relevance: 0,
      reasons: [...new Set(reasons)].slice(0, 3),
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.item.t.length !== b.item.t.length) return a.item.t.length - b.item.t.length;
    return a.item.t.localeCompare(b.item.t, 'vi');
  });

  const top = scored[0]?.score || 1;
  for (const entry of scored) {
    entry.relevance = Math.max(1, Math.round((entry.score / top) * 100));
  }

  return { results: scored.slice(0, limit), total: scored.length };
}
