import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

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
    id: 'baidu/ernie-5.5-flash-preview:free',
    label: 'ERNIE 5.5 Flash (Miễn phí)',
    tier: 'free',
    inputPerMillionUsd: 0,
    outputPerMillionUsd: 0,
    provider: 'openrouter',
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    label: 'Nemotron 3.5 Lightning (Miễn phí)',
    tier: 'free',
    inputPerMillionUsd: 0,
    outputPerMillionUsd: 0,
    provider: 'openrouter',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    label: 'Nemotron 3 Ultra 550B (Miễn phí)',
    tier: 'free',
    inputPerMillionUsd: 0,
    outputPerMillionUsd: 0,
    provider: 'openrouter',
  },
  {
    id: 'google/gemma-4-31b-it:free',
    label: 'Gemma 4 31B (Miễn phí)',
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
  'google/gemma-4-31b-it:free',
  'baidu/ernie-5.5-flash-preview:free',
  'nvidia/nemotron-3.5-lightning:free',
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

const ADMIN_EXTRA_PRICING: ModelPricingEntry[] = [
  {
    id: 'anthropic/claude-sonnet-4',
    label: 'Claude Sonnet 4',
    tier: 'balanced',
    inputPerMillionUsd: 3.0,
    outputPerMillionUsd: 15.0,
    provider: 'openrouter',
  },
  {
    id: 'google/gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    tier: 'balanced',
    inputPerMillionUsd: 1.25,
    outputPerMillionUsd: 10.0,
    provider: 'openrouter',
  },
];

const ALL_PRICING_MAP = new Map<string, ModelPricingEntry>(
  [...OPENROUTER_MODELS, ...GEMINI_MODELS, ...ADMIN_EXTRA_PRICING].map((m) => [m.id, m])
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

  const hasMasterpieceTag = /\[mau goc:|\[masterpiece:|\bmotionsites\/[a-z0-9-]+\b/.test(clean);
  const explicitBuild =
    hasMasterpieceTag ||
    /\b(tao trang|tao web|tao website|dung trang|dung web|dung website|lam trang|lam web|lam website|thiet ke trang|thiet ke web|thiet ke website|thiet ke landing|thiet ke giao dien|xay dung trang|xay dung web|xay dung website|dung ho so|lam landing|tao landing|tao app|tao ung dung|dung ung dung|tao dashboard|ghep mau|lap ghep|build a|create a|make a|design a|scaffold|generate html|viet react tsx)\b/.test(
      clean
    );

  const explicitEdit =
    hasExistingFiles &&
    /\b(doi nen|nen sang|nen toi|them cau hoi|them muc|them form|dem nguoc|doi mau|mau cam|rut gon chu|sua tieu de|chinh sua|cap nhat|doi font|bo muc|xoa muc|them phan|sua nut|thay doi|sua loi|fix loi|fix error|runtime error|toi uu di dong|them hieu ung|lam gon)\b/.test(
      clean
    );

  if (explicitEdit && !explicitBuild) {
    return 'patch';
  }
  if (explicitBuild) {
    return 'assemble';
  }

  const questionLead =
    /^(f-?forum|web nay|trang nay|du an|github|repo|kho tai nguyen|kho mau|tai nguyen|admin|cach|lam sao|huong dan|giai thich|gioi thieu|tim|goi y|de xuat|liet ke|so sanh|hoi|cho hoi|co nhung|co gi|o dau|tai sao|vi sao|la gi|ban la ai|ban lam duoc gi|xin chao|hello|hi\b|chao\b|test\b)/.test(
      clean
    );

  const promptWithoutUrls = prompt.replace(/https?:\/\/\S+/gi, '');
  const hasQuestionMark =
    (clean.length < 360 && promptWithoutUrls.includes('?')) ||
    /\b(la gi|o dau|nhu the nao|ra sao|co bao nhieu|tim giup|goi y giup|huong dan giup|cau truc github|file nao|xu ly o dau|doi api key)\b/.test(
      clean.slice(0, 240)
    );

  if ((questionLead || hasQuestionMark) && !explicitEdit) {
    return 'assistant';
  }

  if (hasExistingFiles) {
    return 'patch';
  }

  return 'assemble';
}

export interface MotionRecipeEntry {
  id: string;
  title: string;
  file: string;
  category: string;
  useWhen: string;
  cost: 'light' | 'medium' | 'heavy';
  summary: string;
  code: string;
  lang: string;
}

export interface MotionSiteFullEntry {
  id: string;
  slug: string;
  title: string;
  category: string;
  promptText: string;
  css?: string;
  liveHtml?: string;
  code?: string;
  codeLang?: string;
  tags?: string[];
}

export interface VaultShardEntry {
  h?: string;
  c?: string;
  j?: string;
  cl?: string;
  p?: string;
  u?: string;
}

export type VaultModuleRole = 'hero' | 'cards' | 'widget' | 'micro';

export interface HydratedVaultBlueprint {
  id: string;
  title: string;
  library: VaultLiteItem['l'];
  category: string;
  role: VaultModuleRole;
  reason: string;
  html: string;
  css: string;
  js: string;
  promptSpec: string;
}

let cachedVaultItems: VaultLiteItem[] | null = null;
let cachedMotionRecipes: MotionRecipeEntry[] | null = null;
let cachedMotionSitesMap: Map<string, MotionSiteFullEntry> | null = null;
let cachedPinUiMap: Map<string, { tsx?: string; css?: string; prompt?: string }> | null = null;
const cachedShards = new Map<string, Record<string, VaultShardEntry>>();

function resolvePublicDataPath(relPath: string): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'public', 'data', relPath),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/data', relPath),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadVaultItems(): VaultLiteItem[] {
  if (cachedVaultItems) return cachedVaultItems;
  const filePath = resolvePublicDataPath('studio-vault.json');
  if (filePath) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { items?: VaultLiteItem[] };
      if (Array.isArray(parsed?.items)) {
        cachedVaultItems = parsed.items;
        return cachedVaultItems;
      }
    } catch {
      cachedVaultItems = [];
      return cachedVaultItems;
    }
  }
  cachedVaultItems = [];
  return cachedVaultItems;
}

export function loadMotionRecipes(): MotionRecipeEntry[] {
  if (cachedMotionRecipes) return cachedMotionRecipes;
  const filePath = resolvePublicDataPath('motion-recipes.json');
  if (filePath) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        recipes?: MotionRecipeEntry[];
        items?: MotionRecipeEntry[];
      };
      const list = Array.isArray(parsed?.recipes)
        ? parsed.recipes
        : Array.isArray(parsed?.items)
          ? parsed.items
          : [];
      cachedMotionRecipes = list;
      return cachedMotionRecipes;
    } catch {
      cachedMotionRecipes = [];
      return cachedMotionRecipes;
    }
  }
  cachedMotionRecipes = [];
  return cachedMotionRecipes;
}

function loadMotionSitesMap(): Map<string, MotionSiteFullEntry> {
  if (cachedMotionSitesMap) return cachedMotionSitesMap;
  const map = new Map<string, MotionSiteFullEntry>();
  const filePath = resolvePublicDataPath('motionsites-full.json');
  if (filePath) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        items?: Record<string, MotionSiteFullEntry> | MotionSiteFullEntry[];
      };
      const entries = Array.isArray(parsed?.items)
        ? parsed.items
        : parsed?.items && typeof parsed.items === 'object'
          ? Object.values(parsed.items)
          : [];
      for (const entry of entries) {
        if (!entry || typeof entry !== 'object') continue;
        if (entry.slug) map.set(entry.slug.toLowerCase(), entry);
        if (entry.id) map.set(entry.id.toLowerCase(), entry);
      }
    } catch {
      // Ignore malformed cache file
    }
  }
  cachedMotionSitesMap = map;
  return cachedMotionSitesMap;
}

function loadPinUiSourceMap(): Map<string, { tsx?: string; css?: string; prompt?: string }> {
  if (cachedPinUiMap) return cachedPinUiMap;
  const map = new Map<string, { tsx?: string; css?: string; prompt?: string }>();
  const filePath = resolvePublicDataPath('pinui-source.json');
  if (filePath) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        items?: Record<string, { tsx?: string; css?: string; prompt?: string }>;
      };
      if (parsed?.items && typeof parsed.items === 'object') {
        for (const [k, v] of Object.entries(parsed.items)) {
          map.set(k, v);
        }
      }
    } catch {
      // Ignore malformed cache file
    }
  }
  cachedPinUiMap = map;
  return cachedPinUiMap;
}

export function loadVaultShard(shardName: string): Record<string, VaultShardEntry> {
  if (!shardName || shardName === 'pinui') return {};
  const existing = cachedShards.get(shardName);
  if (existing) return existing;
  const safeName = shardName.replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safeName) return {};
  const filePath = resolvePublicDataPath(path.join('vault', `${safeName}.jgz`));
  if (!filePath) return {};
  try {
    const buf = fs.readFileSync(filePath);
    const jsonText =
      buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b
        ? zlib.gunzipSync(buf).toString('utf8')
        : buf.toString('utf8');
    const parsed = JSON.parse(jsonText) as Record<string, VaultShardEntry>;
    if (parsed && typeof parsed === 'object') {
      if (cachedShards.size > 140) {
        const firstKey = cachedShards.keys().next().value;
        if (firstKey) cachedShards.delete(firstKey);
      }
      cachedShards.set(shardName, parsed);
      return parsed;
    }
  } catch {
    return {};
  }
  return {};
}

const SEARCH_STOP = new Set([
  'cho', 'toi', 'minh', 'giup', 'tim', 'mau', 'cua', 'voi', 'mot', 'cac', 'nhung',
  'trang', 'web', 'website', 'dep', 'hay', 'nao', 'the', 'and', 'for', 'with', 'from', 'that',
  'goi', 'duoc', 'trong', 'kho', 'tai', 'nguyen', 'ghep', 'vao', 'thiet', 'lam',
  'xay', 'dung', 'gioi', 'thieu', 'phong', 'cach', 'giay', 'sang', 'gian', 'san',
  'pham', 'tham', 'quan', 'dien', 'mat', 'troi', 'nang', 'luong', 'theo', 'ngay',
  'tieng', 'viet', 'chuan', 'cong', 'nhat', 'trien', 'bo', 'loc', 'dat',
]);

const SHORT_TECH_WHITELIST = new Set([
  '3d', 'ai', 'ui', 'ux', 'qr', 'js', 'css', 'svg', 'api', 'cli', 'kpi', 'faq',
]);

const VI_EN_BRIDGES: Array<[RegExp, string[]]> = [
  [/kinh\s*long|glass|trong\s*suot|liquid/, ['glass', 'glassmorphism', 'blur', 'liquid', 'card']],
  [/\b3d\b|khong\s*gian|webgl|robot|robotics/, ['threeui', '3d', 'tilt', 'parallax', 'carousel']],
  [/lich\s*trinh|calendar|timeline|\bmoc\b|su\s*kien|\bclb\b/, ['calendar', 'timeline', 'schedule', 'event']],
  [/\b(bang\s*gia|pricing|goi\s*cuoc|bao\s*gia|thanh\s*toan)\b/, ['pricing', 'tier', 'toggle', 'calculator']],
  [/\b(dang\s*nhap|dang\s*ky|auth|login|otp|mat\s*khau)\b/, ['login', 'auth', 'form', 'input']],
  [/\b(lien\s*he|dat\s*ve|dat\s*lich|tu\s*van|form|bieu\s*mau)\b/, ['form', 'rsvp', 'booking', 'contact', 'card']],
  [/\b(nut|button|cta|tuong\s*tac)\b/, ['button', 'hover', 'magnetic', 'toggle']],
  [/\b(am\s*nhac|nhac|audio|music|player)\b/, ['audio', 'player', 'music', 'waveform']],
  [/\b(thoi\s*tiet|weather|dashboard|bieu\s*do|kpi|so\s*lieu|tinh\s*toan|dien\s*mat\s*troi|nang\s*luong|solar|kwh|ap\s*mai)\b/, ['dashboard', 'chart', 'kpi', 'slider', 'gauge', 'stats', 'solar', 'grid', 'calculator']],
  [/\b(bento|grid|the)\b/, ['card', 'bento', 'grid', 'flip']],
  [/\b(nav|menu|header|footer|hero)\b/, ['hero', 'navbar', 'menu', 'header']],
  [/\b(gom|trien\s*lam|thu\s*cong|nghe\s*thuat|bo\s*suu\s*tap|lookbook|thoi\s*trang|nhiep\s*anh|photo|bao\s*tang)\b/, ['gallery', 'filter', 'editorial', 'minimal', 'card', 'showcase', 'carousel', 'tab', 'tilt']],
  [/\b(bo\s*loc|loc|tim\s*kiem|tab|chuyen)\b/, ['filter', 'tab', 'tabs', 'search', 'modal', 'drawer']],
  [/\b(kien\s*truc|noi\s*that|studio)\b/, ['minimal', 'editorial', 'grid', 'drawer', 'gallery']],
  [/\b(ai|code|lap\s*trinh|terminal|saas|ung\s*dung)\b/, ['terminal', 'code', 'bento', 'card', 'toggle']],
  [/\b(hoc|on\s*tap|trac\s*nghiem|the\s*lat|quiz)\b/, ['quiz', 'flashcard', 'flip', 'reader', 'timeline']],
];

function escapeRegex(raw: string): string {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchWordToken(haystack: string, term: string): boolean {
  if (!term) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegex(term)}(?:$|[^a-z0-9])`, 'i').test(haystack);
}

function expandQueryTerms(query: string): string[] {
  const folded = foldVi(query);
  const tokens = folded
    .replace(/[^a-z0-9-]+/g, ' ')
    .split(/\s+/)
    .filter((t) => !SEARCH_STOP.has(t) && (SHORT_TECH_WHITELIST.has(t) || t.length >= 4));
  const expanded = new Set(tokens);
  for (const [rx, words] of VI_EN_BRIDGES) {
    if (rx.test(folded)) {
      words.forEach((w) => expanded.add(w));
    }
  }
  return Array.from(expanded);
}

function isUnrelatedUtilityItem(haystack: string, promptFolded: string): boolean {
  const wantsAuth = /\b(dang\s*nhap|login|auth|otp|password|mat\s*khau|signup)\b/.test(promptFolded);
  if (!wantsAuth && /\b(login|oauth|otp|password|signup|sign-in|2fa)\b/i.test(haystack)) {
    return true;
  }
  const wantsDevUtility = /\b(contrast|wcag|delete|trash|404)\b/.test(promptFolded);
  if (!wantsDevUtility && /\b(contrast\s+checker|hold\s+to\s+delete|404\s+page)\b/i.test(haystack)) {
    return true;
  }
  if (/\b(mega\s*menu|navbar|navigation\s*menus|site\s*header|sticky\s*header|site\s*footer|responsive\s*header)\b/i.test(haystack)) {
    return true;
  }
  return false;
}

function createSeededRng(seedInput: number): () => number {
  let s = (Math.abs(Math.floor(seedInput)) || 1337) % 2147483647;
  if (s <= 0) s = 1337;
  return () => {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickWeightedCandidate<C extends { score: number }>(
  candidates: C[],
  rng: () => number
): C | null {
  if (candidates.length === 0) return null;
  const weights = candidates.map((c) => Math.pow(Math.max(0.5, c.score + 0.5), 1.8));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) return candidates[0];
  let r = rng() * totalWeight;
  for (let i = 0; i < candidates.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export function detectMasterpieceAnchor(prompt: string): MotionSiteFullEntry | null {
  const map = loadMotionSitesMap();
  if (map.size === 0) return null;
  const tagMatch = prompt.match(/\[(?:M[aẫ]u\s*g[oố]c|Masterpiece)[^\]]*motionsites\/([a-z0-9-]+)\]/i);
  if (tagMatch?.[1]) {
    const found = map.get(tagMatch[1].toLowerCase()) || map.get(`ms-${tagMatch[1].toLowerCase()}`);
    if (found) return found;
  }
  const slugRefMatch = prompt.match(/\bmotionsites\/([a-z0-9-]+)\b/i);
  if (slugRefMatch?.[1]) {
    const found = map.get(slugRefMatch[1].toLowerCase());
    if (found) return found;
  }
  const foldedPrompt = foldVi(prompt);
  for (const entry of map.values()) {
    if (!entry.title || entry.title.length < 5) continue;
    const titleFold = foldVi(entry.title);
    if (titleFold.length >= 6 && foldedPrompt.includes(titleFold)) {
      return entry;
    }
  }
  return null;
}

function classifyVaultRole(item: VaultLiteItem): VaultModuleRole {
  const hay = `${item.t} ${item.c} ${(item.tg || []).join(' ')}`.toLowerCase();
  if (item.l === 'motionsites' || item.l === 'threeui' || /\b(hero|landing|3d|webgl|aurora|shader|globe|banner)\b/.test(hay)) {
    return 'hero';
  }
  if (/\b(pricing|calculator|slider|tab|tabs|filter|calendar|timeline|quiz|form|input|toggle|accordion|dropdown|search|carousel|widget|dashboard|chart|gauge)\b/.test(hay)) {
    return 'widget';
  }
  if (item.l === 'lucianlabs' || /\b(button|badge|pill|tooltip|loader|progress|copy|magnetic|ripple|chip)\b/.test(hay)) {
    return 'micro';
  }
  return 'cards';
}

function stripDemoThemeToggle(html: string): string {
  return html
    .replace(/<button\b[^>]*class=["'][^"']*ux-theme-btn[^"']*["'][^>]*>[\s\S]*?<\/button>/gi, '')
    .trim();
}

function extractBodyInner(rawHtml: string): string {
  const noExt = rawHtml
    .replace(/<script\b[^>]*\bsrc=[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');
  const bodyMatch = noExt.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1] : noExt;
  return stripDemoThemeToggle(
    inner
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .trim()
  );
}

function extractInlineStyleText(rawHtml: string): string {
  const out: string[] = [];
  rawHtml.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css: string) => {
    if (css.trim()) out.push(css.trim());
    return '';
  });
  return out.join('\n');
}

function extractInlineScriptText(rawHtml: string): string {
  const out: string[] = [];
  rawHtml.replace(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, (_, js: string) => {
    if (js.trim()) out.push(js.trim());
    return '';
  });
  return out.join('\n');
}

export function hydrateVaultItemSource(item: VaultLiteItem): {
  html: string;
  css: string;
  js: string;
  promptSpec: string;
} | null {
  if (item.l === 'pinui') {
    const pinMap = loadPinUiSourceMap();
    const bare = item.i.replace(/^(component|blocx|registry)\//, '');
    const entry = pinMap.get(item.i) || pinMap.get(bare);
    if (!entry) return null;
    return {
      html: '',
      css: (entry.css || '').trim(),
      js: (entry.tsx || '').trim(),
      promptSpec: (entry.prompt || '').trim(),
    };
  }
  if (item.l === 'motionsites') {
    const msMap = loadMotionSitesMap();
    const slug = item.i.replace(/^ms-/, '').toLowerCase();
    const msEntry = msMap.get(slug) || msMap.get(item.i.toLowerCase());
    if (msEntry) {
      return {
        html: (msEntry.liveHtml || '').trim(),
        css: (msEntry.css || '').trim(),
        js: (msEntry.code || '').trim(),
        promptSpec: (msEntry.promptText || '').trim(),
      };
    }
  }
  const shard = loadVaultShard(item.s);
  const raw = shard?.[item.i];
  if (!raw) return null;
  const rawHtml = (raw.h || '').trim();
  const css = [extractInlineStyleText(rawHtml), (raw.c || '').trim()].filter(Boolean).join('\n');
  const js = [extractInlineScriptText(rawHtml), (raw.j || '').trim()].filter(Boolean).join('\n');
  const html = extractBodyInner(rawHtml);
  return {
    html,
    css,
    js,
    promptSpec: (raw.p || '').trim(),
  };
}

export function selectVaultBlueprintsForBuild(
  prompt: string,
  options?: { seed?: number; excludeIds?: string[]; limit?: number }
): {
  totalScanned: number;
  anchor: MotionSiteFullEntry | null;
  blueprints: HydratedVaultBlueprint[];
} {
  const items = loadVaultItems();
  const anchor = detectMasterpieceAnchor(prompt);
  const limit = Math.max(3, Math.min(6, options?.limit ?? 5));
  const seed = options?.seed ?? (Date.now() ^ Math.floor(Math.random() * 1_000_000));
  const rng = createSeededRng(seed);
  const excludeSet = new Set(options?.excludeIds || []);
  const terms = expandQueryTerms(`${prompt} ${anchor?.category || ''} ${(anchor?.tags || []).join(' ')}`);

  const roleBuckets: Record<VaultModuleRole, Array<{ item: VaultLiteItem; score: number; reason: string }>> = {
    hero: [],
    cards: [],
    widget: [],
    micro: [],
  };

  const foldedPrompt = foldVi(prompt);

  for (const item of items) {
    if (excludeSet.has(item.i)) continue;
    const titleLow = item.t.toLowerCase();
    const catLow = `${item.g || ''} ${item.c || ''}`.toLowerCase();
    const tagsLow = Array.isArray(item.tg) ? item.tg.join(' ').toLowerCase() : '';
    const fullHay = `${titleLow} ${catLow} ${tagsLow}`;
    if (isUnrelatedUtilityItem(fullHay, foldedPrompt)) continue;
    let score = 0;
    let matchedTerm = '';
    for (const term of terms) {
      if (matchWordToken(titleLow, term)) {
        score += 4.5;
        matchedTerm = matchedTerm || term;
      } else if (matchWordToken(catLow, term)) {
        score += 2.8;
        matchedTerm = matchedTerm || term;
      } else if (matchWordToken(tagsLow, term)) {
        score += 2.2;
        matchedTerm = matchedTerm || term;
      }
    }
    if (item.l === 'codefronts' || item.l === 'lucianlabs') score += 0.6;
    if (score <= 0.6) continue;
    const role = classifyVaultRole(item);
    roleBuckets[role].push({
      item,
      score,
      reason: matchedTerm ? `Khớp "${matchedTerm}" · ${item.c || item.l}` : `${item.c || item.l}`,
    });
  }

  // Ensure every bucket has fallback candidates across the 5,909 Vault if query terms are sparse
  if (roleBuckets.cards.length < 8 || roleBuckets.widget.length < 8 || roleBuckets.micro.length < 8) {
    for (const item of items) {
      if (excludeSet.has(item.i)) continue;
      if (item.l !== 'codefronts' && item.l !== 'lucianlabs') continue;
      const fullHay = `${item.t} ${item.c || ''} ${(item.tg || []).join(' ')}`.toLowerCase();
      if (isUnrelatedUtilityItem(fullHay, foldedPrompt)) continue;
      const role = classifyVaultRole(item);
      if (roleBuckets[role].length < 24) {
        roleBuckets[role].push({ item, score: 1.0, reason: `${item.c || item.l}` });
      }
    }
  }

  const picked: HydratedVaultBlueprint[] = [];
  const usedIds = new Set<string>();
  const libCounts: Record<string, number> = {};
  const roleOrder: VaultModuleRole[] = ['widget', 'cards', 'micro', 'hero', 'cards', 'widget'];

  for (const role of roleOrder) {
    if (picked.length >= limit) break;
    const bucket = roleBuckets[role]
      .filter((c) => !usedIds.has(c.item.i))
      .sort((a, b) => b.score - a.score)
      .slice(0, 28);

    // Sample up to 6 attempts per role until we find one with real renderable HTML+CSS (or rich promptSpec for hero)
    const pool = [...bucket];
    for (let tries = 0; tries < 6 && pool.length > 0; tries += 1) {
      const choice = pickWeightedCandidate(pool, rng);
      if (!choice) break;
      const idx = pool.indexOf(choice);
      if (idx >= 0) pool.splice(idx, 1);

      const libCount = libCounts[choice.item.l] || 0;
      if (libCount >= 3 && pool.length > 2) continue;

      const hydrated = hydrateVaultItemSource(choice.item);
      if (!hydrated) continue;
      const hasRenderableHtml = hydrated.html.length >= 24 && hydrated.html.length <= 16_000 && hydrated.css.length >= 20;
      const isRichAnchor = role === 'hero' && (hydrated.promptSpec.length >= 120 || hydrated.css.length >= 60);
      if (!hasRenderableHtml && !isRichAnchor) continue;
      if (/https?:\/\/(?:cdn\.|unpkg\.com|threejs\.org)/i.test(hydrated.html)) continue;

      usedIds.add(choice.item.i);
      libCounts[choice.item.l] = libCount + 1;
      picked.push({
        id: choice.item.i,
        title: choice.item.t,
        library: choice.item.l,
        category: choice.item.c || choice.item.g || choice.item.l,
        role,
        reason: choice.reason,
        html: hydrated.html,
        css: hydrated.css,
        js: hydrated.js,
        promptSpec: hydrated.promptSpec,
      });
      break;
    }
  }

  return {
    totalScanned: items.length,
    anchor,
    blueprints: picked,
  };
}

export function selectMotionRecipesForPrompt(
  prompt: string,
  options?: { seed?: number; count?: number; excludeIds?: string[] }
): MotionRecipeEntry[] {
  const recipes = loadMotionRecipes();
  if (recipes.length === 0) return [];
  const count = Math.max(1, Math.min(2, options?.count ?? 2));
  const seed = options?.seed ?? (Date.now() ^ Math.floor(Math.random() * 1_000_000) ^ 0x9e3779b9);
  const rng = createSeededRng(seed);
  const excludeSet = new Set(options?.excludeIds || []);
  const terms = expandQueryTerms(prompt);
  const wantsVideo = /\b(video|mp4|phim|clip)\b/.test(foldVi(prompt));

  const scored: Array<{ item: MotionRecipeEntry; score: number }> = [];
  for (const recipe of recipes) {
    if (excludeSet.has(recipe.id)) continue;
    // Skip <video> templates unless the prompt explicitly asks for video footage
    if (!wantsVideo && /<video\b/i.test(recipe.code) && recipe.category.includes('Video')) {
      continue;
    }
    const hay = foldVi(`${recipe.title} ${recipe.category} ${recipe.useWhen} ${recipe.summary}`);
    let score = recipe.lang === 'css' || recipe.lang === 'js' ? 1.5 : 1.0;
    for (const term of terms) {
      if (hay.includes(term)) score += 2.2;
    }
    scored.push({ item: recipe, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const topPool = scored.slice(0, 12);
  const selected: MotionRecipeEntry[] = [];
  while (selected.length < count && topPool.length > 0) {
    const choice = pickWeightedCandidate(topPool, rng);
    if (!choice) break;
    selected.push(choice.item);
    const idx = topPool.indexOf(choice);
    if (idx >= 0) topPool.splice(idx, 1);
  }
  return selected;
}

export function searchVaultKnowledge(query: string, limit = 6): SuggestedVaultMatch[] {
  const items = loadVaultItems();
  if (items.length === 0) return [];
  const terms = expandQueryTerms(query);
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
