import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type WorkspaceIntent = 'assistant' | 'assemble' | 'patch';

export interface VaultLiteItem {
  i: string;
  t: string;
  l: 'pinui' | 'threeui' | 'lucianlabs' | 'motionsites' | 'codefronts';
  g: string;
  c: string;
  tg: string[];
  s: string;
}

export interface SuggestedVaultMatch {
  id: string;
  title: string;
  library: string;
  category: string;
  reason: string;
}

export interface ModelPricingEntry {
  id: string;
  label: string;
  tier: 'auto' | 'free' | 'budget' | 'balanced';
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
  provider: 'openrouter' | 'gemini';
}

export const OPENROUTER_MODELS: ModelPricingEntry[] = [
  {
    id: 'openrouter/auto-smart',
    label: 'Tự động tiết kiệm (Khuyên dùng)',
    tier: 'auto',
    inputPerMillionUsd: 0.18,
    outputPerMillionUsd: 0.39,
    provider: 'openrouter',
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite ($0.10/$0.40)',
    tier: 'budget',
    inputPerMillionUsd: 0.1,
    outputPerMillionUsd: 0.4,
    provider: 'openrouter',
  },
  {
    id: 'deepseek/deepseek-v3.2',
    label: 'DeepSeek V3.2 ($0.26/$0.38)',
    tier: 'budget',
    inputPerMillionUsd: 0.26,
    outputPerMillionUsd: 0.38,
    provider: 'openrouter',
  },
  {
    id: 'qwen/qwen3-coder-next',
    label: 'Qwen3 Coder Next ($0.12/$0.80)',
    tier: 'budget',
    inputPerMillionUsd: 0.12,
    outputPerMillionUsd: 0.8,
    provider: 'openrouter',
  },
  {
    id: 'google/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash ($0.30/$2.50)',
    tier: 'balanced',
    inputPerMillionUsd: 0.3,
    outputPerMillionUsd: 2.5,
    provider: 'openrouter',
  },
  {
    id: 'openai/gpt-4.1-mini',
    label: 'GPT-4.1 Mini ($0.40/$1.60)',
    tier: 'balanced',
    inputPerMillionUsd: 0.4,
    outputPerMillionUsd: 1.6,
    provider: 'openrouter',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    label: 'Nemotron 3 Ultra (Miễn phí)',
    tier: 'free',
    inputPerMillionUsd: 0,
    outputPerMillionUsd: 0,
    provider: 'openrouter',
  },
  {
    id: 'openrouter/free',
    label: 'OpenRouter Free (Miễn phí)',
    tier: 'free',
    inputPerMillionUsd: 0,
    outputPerMillionUsd: 0,
    provider: 'openrouter',
  },
];

export const GEMINI_MODELS: ModelPricingEntry[] = [
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    tier: 'balanced',
    inputPerMillionUsd: 0.5,
    outputPerMillionUsd: 3.0,
    provider: 'gemini',
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    tier: 'balanced',
    inputPerMillionUsd: 0.3,
    outputPerMillionUsd: 2.5,
    provider: 'gemini',
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    tier: 'budget',
    inputPerMillionUsd: 0.1,
    outputPerMillionUsd: 0.4,
    provider: 'gemini',
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    tier: 'balanced',
    inputPerMillionUsd: 1.25,
    outputPerMillionUsd: 10.0,
    provider: 'gemini',
  },
];

export const OPENROUTER_FREE_FALLBACK_CHAIN = [
  'baidu/ernie-5.5-flash-preview:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'openrouter/free',
] as const;

export const OPENROUTER_PAID_CHAT_CHAIN = [
  'google/gemini-2.5-flash-lite',
  'deepseek/deepseek-v3.2',
  ...OPENROUTER_FREE_FALLBACK_CHAIN,
] as const;

export const OPENROUTER_PAID_BUILD_CHAIN = [
  'deepseek/deepseek-v3.2',
  'qwen/qwen3-coder-next',
  'google/gemini-2.5-flash-lite',
  ...OPENROUTER_FREE_FALLBACK_CHAIN,
] as const;

const ALL_PRICING_MAP = new Map<string, ModelPricingEntry>(
  [...OPENROUTER_MODELS, ...GEMINI_MODELS].map((m) => [m.id, m])
);

export function estimateTokensCostUsd(
  modelId: string,
  tokens?: { prompt?: number; completion?: number; total?: number }
): number {
  if (!tokens) return 0;
  const cleanId = (modelId || '').trim().toLowerCase();
  if (!cleanId || cleanId.endsWith(':free') || cleanId === 'openrouter/free') return 0;
  const entry = ALL_PRICING_MAP.get(cleanId);
  const inPrice = entry ? entry.inputPerMillionUsd : 0.25;
  const outPrice = entry ? entry.outputPerMillionUsd : 0.6;
  const promptTok = Math.max(0, tokens.prompt || 0);
  const completionTok = Math.max(0, tokens.completion || 0);
  const usd = (promptTok * inPrice + completionTok * outPrice) / 1_000_000;
  return Math.round(usd * 1_000_000) / 1_000_000;
}

export const FFORUM_COMPACT_KNOWLEDGE = [
  'F-FORUM v3 PLATFORM & GITHUB KNOWLEDGE (https://fforum3.vercel.app | GitHub: broamstuck-cybr/f_forumv3):',
  '- Stack: React 19 + TypeScript + Vite + Express/Vercel Serverless (/api/*) + Supabase PostgreSQL (RLS-protected ff_admin_config, ff_feedback, ff_users, ff_projects, ff_published_pages).',
  '- Routes: / (Landing + live PinUI/ThreeUI carousel + bilingual iPhone 18 simulator), /home (Launchpad + 3D Iris robot with 10 expressions/actions + QR + "Gặp đội ngũ :3" + Feedback modal), /explore (5 free UI libraries + 60 tools + 122 repos), /explore/experience (40/60 split sticky live preview + Prompt/Copy/Use/Code), /explore/recipes (58 motion techniques), /workspace (AI Studio multi-file builder + 2-in-1 F-Forum Assistant + Preview/Code/Console/ZIP/Publish /p/:slug), /community (F-Forum community & published pages), /settings (Light/Dark + 8 curated CSS wallpapers + VI/EN language + BYOK), /admin (Analytics, User/IP quotas, 1-click OpenRouter/Gemini Gateway switch, API key manager, live connection probe, Feedback inbox).',
  '- Free Vault (5,909 verified free items, 254 .jgz shards): Pin UI (42 React interactive blocks), ThreeUI 3D (21 live WebGL demos), lucianLabs (480 UI prompts & layouts), MotionSites Free (320 free motion sections), CodeFronts (5,046 HTML/CSS/JS components) + 58 Motion Craft recipes.',
  '- Key Repo Files: src/features/workspace/{WorkspaceView,AgentChatPane,CodeEditorPane,FileExplorerTree,ConsoleDrawer}.tsx, src/engine/{repoWebComposer,vaultStitcher,mitRecommender,workspaceBundler,motionCraftPack,aestheticGuard}.ts, src/features/explore/{ExperienceView,SandboxPreview,ThreeUIPreview,vaultLoader}.tsx, src/features/admin/{AdminView,OpsPortal}.tsx, server/{app,aiEngine,fforumKnowledge,adminStore,keyPool,quotaStore,authEngine,feedbackStore,persistence}.ts.',
].join('\n');

function foldVi(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function classifyWorkspaceIntent(
  prompt: string,
  hasExistingFiles: boolean,
  requestedIntent?: string
): WorkspaceIntent {
  if (requestedIntent === 'assistant' || requestedIntent === 'assemble' || requestedIntent === 'patch') {
    return requestedIntent;
  }
  const clean = foldVi(prompt).trim();
  if (!clean) return 'assistant';

  const explicitBuild =
    /\b(tao trang|dung trang|dung web|lam trang|lam web|thiet ke trang|xay dung trang|tao website|dung ho so|lam landing|tao app|tao dashboard|ghep mau|lap ghep|build a|create a|make a|design a|scaffold|generate html|viet react tsx)\b/.test(
      clean
    );

  const explicitEdit =
    hasExistingFiles &&
    /\b(doi nen|nen sang|nen toi|them cau hoi|them muc|them form|dem nguoc|doi mau|mau cam|rut gon chu|sua tieu de|chinh sua|cap nhat|doi font|bo muc|xoa muc|them phan|sua nut|thay doi)\b/.test(
      clean
    );

  if (explicitEdit && !explicitBuild) {
    return 'patch';
  }

  const questionLead =
    /^(f-?forum|web nay|trang nay|du an|github|repo|kho tai nguyen|kho mau|tai nguyen|admin|cach|lam sao|huong dan|giai thich|gioi thieu|tim|goi y|de xuat|liet ke|so sanh|hoi|cho hoi|co nhung|co gi|o dau|tai sao|vi sao|la gi|ban la ai|ban lam duoc gi|xin chao|hello|hi\b|chao\b|test\b)/.test(
      clean
    );

  const hasQuestionMark = prompt.includes('?') || /\b(la gi|o dau|nhu the nao|ra sao|co bao nhieu|tim giup|goi y giup|huong dan giup|cau truc github|file nao|xu ly o dau|doi api key)\b/.test(clean);

  if ((questionLead || hasQuestionMark) && !explicitBuild && !explicitEdit) {
    return 'assistant';
  }

  if (hasExistingFiles && !explicitBuild) {
    return 'patch';
  }

  return 'assemble';
}

let cachedVaultItems: VaultLiteItem[] | null = null;

function loadVaultItems(): VaultLiteItem[] {
  if (cachedVaultItems) return cachedVaultItems;
  const candidates = [
    path.resolve(process.cwd(), 'public/data/studio-vault.json'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/data/studio-vault.json'),
  ];
  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { items?: VaultLiteItem[] };
      if (Array.isArray(parsed?.items)) {
        cachedVaultItems = parsed.items;
        return cachedVaultItems;
      }
    } catch {
      continue;
    }
  }
  cachedVaultItems = [];
  return cachedVaultItems;
}

const SEARCH_STOP = new Set([
  'cho', 'toi', 'minh', 'giup', 'tim', 'mau', 'cua', 'voi', 'mot', 'cac', 'nhung',
  'trang', 'web', 'dep', 'hay', 'nao', 'the', 'and', 'for', 'with', 'from', 'that',
  'goi', 'duoc', 'trong', 'kho', 'tai', 'nguyen', 'ghep', 'vao',
]);

export function searchVaultKnowledge(query: string, limit = 6): SuggestedVaultMatch[] {
  const items = loadVaultItems();
  if (items.length === 0) return [];
  const folded = foldVi(query);
  const tokens = folded
    .replace(/[^a-z0-9-]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !SEARCH_STOP.has(t));

  // Vietnamese -> English UI keyword bridges for instant zero-token Vault matching
  const expanded = new Set(tokens);
  const bridges: Array<[RegExp, string[]]> = [
    [/kinh|glass|trong suot/, ['glass', 'glassmorphism', 'blur', 'card']],
    [/3d|khong gian|webgl|robot/, ['threeui', '3d', 'tilt', 'parallax']],
    [/lich|calendar|timeline|moc/, ['calendar', 'timeline', 'schedule']],
    [/gia|pricing|goi/, ['pricing', 'tier', 'card']],
    [/dang nhap|auth|form|dang ky/, ['login', 'auth', 'form', 'input']],
    [/nut|button|cta/, ['button', 'hover', 'magnetic']],
    [/nhac|audio|music|player/, ['audio', 'player', 'music']],
    [/thoi tiet|weather|dashboard|bieu do|kpi/, ['weather', 'dashboard', 'chart', 'kpi']],
    [/the|card|bento|grid/, ['card', 'bento', 'grid']],
    [/nav|menu|header|footer|hero/, ['hero', 'navbar', 'menu', 'header']],
  ];
  for (const [rx, words] of bridges) {
    if (rx.test(folded)) {
      words.forEach((w) => expanded.add(w));
    }
  }

  const terms = Array.from(expanded);
  if (terms.length === 0) {
    return items.slice(0, limit).map((it) => ({
      id: it.i,
      title: it.t,
      library: it.l,
      category: it.c || it.g,
      reason: `Mẫu nổi bật trong ${it.l}`,
    }));
  }

  const scored: Array<{ score: number; item: VaultLiteItem; matchedTerm: string }> = [];
  for (const item of items) {
    const titleLow = item.t.toLowerCase();
    const catLow = `${item.g || ''} ${item.c || ''}`.toLowerCase();
    const tagsLow = Array.isArray(item.tg) ? item.tg.join(' ').toLowerCase() : '';
    let score = 0;
    let bestTerm = '';
    for (const term of terms) {
      if (item.l === term) {
        score += 5;
        bestTerm = term;
      } else if (titleLow.includes(term)) {
        score += 4;
        bestTerm = bestTerm || term;
      } else if (catLow.includes(term)) {
        score += 2.5;
        bestTerm = bestTerm || term;
      } else if (tagsLow.includes(term)) {
        score += 2;
        bestTerm = bestTerm || term;
      }
    }
    if (score > 0) {
      if (item.l === 'pinui' || item.l === 'threeui') score += 0.6;
      scored.push({ score, item, matchedTerm: bestTerm });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const picked: SuggestedVaultMatch[] = [];
  const seenLibCount: Record<string, number> = {};
  for (const entry of scored) {
    const libCount = seenLibCount[entry.item.l] || 0;
    if (libCount >= 3 && scored.length > limit * 2) continue;
    seenLibCount[entry.item.l] = libCount + 1;
    picked.push({
      id: entry.item.i,
      title: entry.item.t,
      library: entry.item.l,
      category: entry.item.c || entry.item.g || entry.item.l,
      reason: `Khớp "${entry.matchedTerm}" · ${entry.item.c || entry.item.g}`,
    });
    if (picked.length >= limit) break;
  }
  return picked;
}
