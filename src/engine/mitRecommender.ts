import {
  fetchVaultIndex,
  getCachedVaultIndex,
  type VaultIndexItem,
  type VaultLibraryKey,
} from '../features/explore/vaultLoader';
import type {
  BehaviorItemScore,
  MatchedVaultResource,
  OnboardingProfile,
} from '../types/workspaceV4';

type SupportedLibrary = MatchedVaultResource['library'];

const SUPPORTED_LIBS: ReadonlySet<string> = new Set([
  'pinui',
  'threeui',
  'lucianlabs',
  'motionsites',
  'codefronts',
]);

const LIBRARY_DISPLAY: Record<SupportedLibrary, string> = {
  pinui: 'Pin UI',
  threeui: 'ThreeUI',
  lucianlabs: 'LucianLabs',
  motionsites: 'MotionSites',
  codefronts: 'CodeFronts',
};

const LIBRARY_PRIOR: Record<SupportedLibrary, number> = {
  pinui: 1.15,
  motionsites: 1.12,
  lucianlabs: 1.1,
  threeui: 1.08,
  codefronts: 1.0,
};

const FALLBACK_CANDIDATES: VaultIndexItem[] = [
  {
    i: 'blocx/storybook-hero',
    t: 'Storybook Hero',
    l: 'pinui',
    g: 'Tương tác',
    c: 'Blocx',
    tg: ['hero', 'education', 'story'],
    s: 'pinui',
    d: 1,
  },
  {
    i: 'blocx/odometer-pricing',
    t: 'Odometer Pricing',
    l: 'pinui',
    g: 'Tương tác',
    c: 'Blocx',
    tg: ['pricing', 'business', 'toggle'],
    s: 'pinui',
    d: 1,
  },
  {
    i: '370',
    t: 'Timeline that lights up',
    l: 'lucianlabs',
    g: 'Hiệu ứng',
    c: 'Scroll Motion',
    tg: ['timeline', 'scroll', 'history'],
    s: 'll-0',
    d: 1,
  },
  {
    i: '059',
    t: 'Event RSVP card',
    l: 'lucianlabs',
    g: 'Hiệu ứng',
    c: 'Cards & Content',
    tg: ['event', 'register', 'rsvp'],
    s: 'll-0',
    d: 1,
  },
  {
    i: 'kage-landing-page',
    t: 'Kage Landing Page',
    l: 'threeui',
    g: 'threeui-community',
    c: '3D & Tương tác',
    tg: ['3d', 'webgl', 'tech', 'hero'],
    s: 'tu-0',
    d: 1,
  },
  {
    i: 'portfolio-about',
    t: 'Portfolio About',
    l: 'motionsites',
    g: 'Chuyển động',
    c: 'Portfolio',
    tg: ['portfolio', 'minimal', 'editorial'],
    s: 'ms-0',
    d: 1,
  },
  {
    i: 'components/css-flip-cards/trivia-quiz-q-a-card',
    t: 'Trivia Quiz Q&A Card',
    l: 'codefronts',
    g: 'Bố cục',
    c: 'CSS Flip Cards',
    tg: ['quiz', 'flashcard', 'education'],
    s: 'cf-0',
    d: 1,
  },
  {
    i: 'layouts/css-timelines/tour-stub-timeline',
    t: 'Concert Tour Timeline',
    l: 'codefronts',
    g: 'Bố cục',
    c: 'CSS Timelines',
    tg: ['timeline', 'concert', 'event', 'music'],
    s: 'cf-0',
    d: 1,
  },
];

function foldVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export interface ParsedIntent {
  keywords: string[];
  preferredLibraries: SupportedLibrary[];
  requestedSections: string[];
}

const KEYWORD_SYNONYMS: Array<[RegExp, string[]]> = [
  [/thuyet trinh|hoc tap|bai giang|sinh hoc|lich su|hoc bong|stem/, ['education', 'student', 'timeline', 'story', 'card', 'quiz']],
  [/trac nghiem|the lat|flashcard|on tap|cau hoi|quiz/, ['quiz', 'flashcard', 'flip', 'card']],
  [/lich trinh|moc thoi gian|timeline|su kien|clb|workshop|dem nhac/, ['timeline', 'event', 'rsvp', 'schedule', 'countdown', 'concert']],
  [/ban hang|san pham|gom|cua hang|shop|bang gia|dat lich/, ['shop', 'product', 'pricing', 'cart', 'commerce', 'booking']],
  [/ho so|portfolio|cv|ca nhan|thiet ke|nhiep anh/, ['portfolio', 'minimal', 'gallery', 'photo', 'editorial']],
  [/3d|khong gian|webgl|shader|robotics|cong nghe|lap trinh|code|app/, ['3d', 'webgl', 'developer', 'code', 'tech', 'interactive']],
  [/dem nguoc|countdown|hen gio/, ['countdown', 'timer', 'event']],
  [/dang ky|form|lien he|tu van/, ['form', 'register', 'rsvp', 'input', 'contact']],
  [/cuon|motion|chuyen dong|scroll/, ['scroll', 'motion', 'sticky', 'reveal']],
];

export function extractIntent(profile: OnboardingProfile, prompt: string): ParsedIntent {
  const folded = foldVietnamese(`${profile.siteName} ${prompt}`);
  const tokens = new Set<string>();

  for (const part of folded.split(/[^a-z0-9]+/)) {
    if (part.length >= 2) tokens.add(part);
  }

  const domainMap: Record<OnboardingProfile['domain'], string[]> = {
    education: ['education', 'student', 'quiz', 'flashcard', 'timeline', 'story', 'reader'],
    business: ['pricing', 'product', 'shop', 'commerce', 'card', 'stats'],
    event: ['event', 'rsvp', 'timeline', 'countdown', 'concert', 'team'],
    portfolio: ['portfolio', 'gallery', 'minimal', 'photo', 'editorial'],
    tech: ['3d', 'webgl', 'developer', 'code', 'interactive', 'workspace'],
  };
  domainMap[profile.domain].forEach((k) => tokens.add(k));

  const goalMap: Record<OnboardingProfile['goal'], string[]> = {
    present: ['hero', 'story', 'timeline', 'scroll'],
    register: ['rsvp', 'form', 'event', 'countdown'],
    sell: ['pricing', 'product', 'shop', 'cta'],
    portfolio: ['portfolio', 'gallery', 'about'],
  };
  goalMap[profile.goal].forEach((k) => tokens.add(k));

  profile.sections.forEach((sec) => tokens.add(sec));

  for (const [re, extra] of KEYWORD_SYNONYMS) {
    if (re.test(folded)) extra.forEach((k) => tokens.add(k));
  }

  const preferredLibraries: SupportedLibrary[] = [];
  if (profile.domain === 'tech' || /3d|webgl|khong gian|shader/.test(folded)) {
    preferredLibraries.push('threeui', 'motionsites', 'pinui');
  } else if (profile.personality === 'minimal' || profile.domain === 'portfolio') {
    preferredLibraries.push('motionsites', 'lucianlabs', 'pinui');
  } else if (profile.domain === 'event') {
    preferredLibraries.push('lucianlabs', 'codefronts', 'motionsites');
  } else {
    preferredLibraries.push('pinui', 'lucianlabs', 'motionsites', 'codefronts');
  }

  return {
    keywords: Array.from(tokens),
    preferredLibraries,
    requestedSections: [...profile.sections],
  };
}

function buildVietnameseReason(item: VaultIndexItem, intent: ParsedIntent): string {
  const libName = LIBRARY_DISPLAY[item.l as SupportedLibrary] || item.l;
  const hay = foldVietnamese(`${item.t} ${item.c} ${(item.tg || []).join(' ')}`);

  if (/quiz|flashcard|flip/.test(hay)) {
    return `Cơ chế thẻ lật ôn tập từ ${libName}`;
  }
  if (/timeline|schedule|tour/.test(hay)) {
    return `Nhịp lịch trình theo mốc từ ${libName}`;
  }
  if (/pricing|cart|product|shop|commerce/.test(hay)) {
    return `Khối gói dịch vụ & sản phẩm từ ${libName}`;
  }
  if (/countdown|timer|rsvp|event/.test(hay)) {
    return `Khối đăng ký & đếm ngược sự kiện từ ${libName}`;
  }
  if (/3d|webgl|shader|planet|space/.test(hay)) {
    return `Chiều sâu thị giác 3D từ ${libName}`;
  }
  if (/portfolio|gallery|photo/.test(hay)) {
    return `Bố cục trưng bày tác phẩm từ ${libName}`;
  }
  if (/scroll|sticky|parallax|reveal/.test(hay)) {
    return `Hiệu ứng mở lớp theo cuộn trang từ ${libName}`;
  }
  if (/hero|landing/.test(hay)) {
    return `Khối mở đầu có chiều sâu từ ${libName}`;
  }
  if (intent.preferredLibraries.includes(item.l as SupportedLibrary)) {
    return `Thành phần tương tác đồng tông từ ${libName}`;
  }
  return `Cấu trúc bố cục sạch từ ${libName}`;
}

export interface RecommendOptions {
  profile: OnboardingProfile;
  prompt: string;
  behaviorScores?: Record<string, BehaviorItemScore>;
  excludeIds?: string[];
  limit?: number;
  seedItemId?: string;
}

export async function recommendVaultResources(
  options: RecommendOptions
): Promise<{
  totalScanned: number;
  matched: MatchedVaultResource[];
  itemsById: Map<string, VaultIndexItem>;
}> {
  const {
    profile,
    prompt,
    behaviorScores = {},
    excludeIds = [],
    limit = 5,
    seedItemId,
  } = options;

  let vaultItems: VaultIndexItem[] = getCachedVaultIndex()?.items ?? [];
  if (vaultItems.length === 0) {
    try {
      const idx = await fetchVaultIndex();
      vaultItems = idx.items;
    } catch {
      vaultItems = FALLBACK_CANDIDATES;
    }
  }

  const eligible = vaultItems.filter((it) => SUPPORTED_LIBS.has(it.l));
  const pool = eligible.length > 0 ? eligible : FALLBACK_CANDIDATES;
  const intent = extractIntent(profile, prompt);
  const excludeSet = new Set(excludeIds);

  // Step 2: Candidate sourcing (50% profile-matched + 50% top-engaged/diverse)
  const scoredAll: Array<{
    item: VaultIndexItem;
    affinity: number;
    engagement: number;
    total: number;
  }> = [];

  for (const item of pool) {
    if (excludeSet.has(item.i) && item.i !== seedItemId) continue;

    const text = foldVietnamese(`${item.t} ${item.c} ${(item.tg || []).join(' ')}`);
    let overlap = 0;
    for (const kw of intent.keywords) {
      if (text.includes(kw)) overlap += kw.length > 4 ? 1.4 : 1;
    }
    const profileMatch = Math.min(1, overlap / 4.2);
    const libBoost = intent.preferredLibraries.includes(item.l as SupportedLibrary) ? 0.35 : 0.1;
    const affinity = Math.min(1, profileMatch * 0.78 + libBoost);

    const sig = behaviorScores[item.i];
    const rawSignal = sig
      ? sig.likes * 1.6 + sig.uses * 2.4 + sig.publishes * 3.5 + (sig.score || 0) * 0.5
      : 0;
    const engagement = rawSignal > 0 ? Math.min(1, Math.log1p(rawSignal) / 4.5) : 0.12;

    const prior = LIBRARY_PRIOR[item.l as SupportedLibrary] ?? 1;
    const seedBonus = item.i === seedItemId ? 5 : 0;

    // Step 3: Weighted SAR hybrid score
    const total = seedBonus + (affinity * 0.62 + engagement * 0.24 + (prior - 0.9) * 0.55);
    scoredAll.push({ item, affinity, engagement, total });
  }

  const byAffinity = [...scoredAll].sort((a, b) => b.total - a.total).slice(0, 36);
  const byEngagement = [...scoredAll]
    .sort((a, b) => b.engagement - a.engagement || b.total - a.total)
    .slice(0, 36);

  const mergedMap = new Map<string, (typeof scoredAll)[number]>();
  for (const entry of [...byAffinity, ...byEngagement]) {
    const existing = mergedMap.get(entry.item.i);
    if (!existing || entry.total > existing.total) {
      mergedMap.set(entry.item.i, entry);
    }
  }

  const ranked = Array.from(mergedMap.values()).sort((a, b) => b.total - a.total);

  // Step 4: Controlled diversity (max 2 per library) & Top 4-6 selection
  const selected: MatchedVaultResource[] = [];
  const itemsById = new Map<string, VaultIndexItem>();
  const libCounts: Partial<Record<VaultLibraryKey, number>> = {};

  for (const entry of ranked) {
    if (selected.length >= limit) break;
    const lib = entry.item.l as SupportedLibrary;
    const count = libCounts[lib] ?? 0;
    if (count >= 2 && entry.item.i !== seedItemId) continue;

    libCounts[lib] = count + 1;
    itemsById.set(entry.item.i, entry.item);
    selected.push({
      id: entry.item.i,
      title: entry.item.t,
      library: lib,
      reason: buildVietnameseReason(entry.item, intent),
      score: Math.round(Math.min(0.99, Math.max(0.55, entry.total)) * 100) / 100,
    });
  }

  return {
    totalScanned: pool.length,
    matched: selected,
    itemsById,
  };
}
