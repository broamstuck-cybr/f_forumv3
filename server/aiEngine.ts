import dns from 'node:dns/promises';
import fs from 'node:fs';
import type { IncomingHttpHeaders } from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AIChatRequest,
  AIProtocol,
  AttachedContextItem,
  FilePatchOp,
  PublicAiRuntimeInfo,
  SuggestedVaultItem,
  WorkspaceAssemblyPlan,
} from '../src/types/index';
import { getInternalGatewayOverride } from './adminStore.js';
import {
  classifyWorkspaceIntent,
  estimateTokensCostUsd,
  FFORUM_COMPACT_KNOWLEDGE,
  GEMINI_MODELS,
  OPENROUTER_FREE_FALLBACK_CHAIN,
  OPENROUTER_MODELS,
  OPENROUTER_PAID_BUILD_CHAIN,
  OPENROUTER_PAID_CHAT_CHAIN,
  searchVaultKnowledge,
  type WorkspaceIntent,
} from './fforumKnowledge.js';
import {
  beginFailoverSim,
  checkSharedPoolQuota,
  endFailoverSim,
  getKeyPoolSnapshot,
  hasConfiguredPoolKeys,
  isFailoverHttpStatus,
  maskApiKey,
  recordPoolAttempt,
  recordPoolFailure,
  recordPoolSuccess,
  sanitizeErrorText,
  selectPoolCandidates,
  type AdminKeyPoolSnapshot,
  type FailoverSimHandle,
  type PoolCandidate,
  type TokenCounter,
} from './keyPool.js';
import { ensureLocalEnvLoaded } from './quotaStore.js';

export { sanitizeErrorText };

ensureLocalEnvLoaded();

export interface AIGenerationOutput {
  message: string;
  mode?: 'assistant' | 'assemble' | 'patch' | 'files';
  files: Array<{
    path: string;
    content: string;
    summary: string;
  }>;
  assemblyPlan?: WorkspaceAssemblyPlan;
  patches?: FilePatchOp[];
  suggestedResources?: SuggestedVaultItem[];
  checksHint: string[];
  fallback: boolean;
  upstreamError?: string;
  modelUsed: string;
  protocolUsed: AIProtocol;
  tokens?: TokenCounter;
  estimatedCostUsd?: number;
  usedKeyMask?: string;
}

export interface AIStreamHooks {
  onStage?: (payload: {
    stage: 'routing' | 'generating' | 'checking';
    model: string;
    protocol: AIProtocol;
    detail?: string;
  }) => void;
  onDelta?: (chunk: string) => void;
  signal?: AbortSignal;
}

interface EffectiveAIConfig {
  protocol: AIProtocol;
  baseUrl: string;
  model: string;
  chatModel?: string;
  buildModel?: string;
  maxOutputTokens?: number;
  apiKey: string;
  systemPromptSuffix: string;
  usingByok: boolean;
  usingAdminKey: boolean;
  isOpenRouter: boolean;
}

function normalizeProtocol(val: string | undefined): AIProtocol {
  if (val === 'anthropic' || val === 'gemini') return val;
  return 'openai-compatible';
}

const SERVER_GEMINI_MODEL_ALLOWLIST = new Set([
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
]);

const SERVER_OPENROUTER_MODEL_ALLOWLIST = new Set(OPENROUTER_MODELS.map((m) => m.id));

let openrouterCreditShortageUntil = 0;

export function resetOpenRouterTierCache(): void {
  openrouterCreditShortageUntil = 0;
}

export function getPublicAiRuntimeInfo(): PublicAiRuntimeInfo {
  ensureLocalEnvLoaded();
  const adminOverride = getInternalGatewayOverride();
  const protocol = adminOverride.enabled
    ? adminOverride.protocol
    : normalizeProtocol(process.env.AI_PROTOCOL);
  const baseUrl = (adminOverride.enabled ? adminOverride.baseUrl : process.env.AI_BASE_URL || '').toLowerCase();
  const isOpenRouter = baseUrl.includes('openrouter.ai') || adminOverride.activeProfile === 'openrouter';
  const activeProfile = isOpenRouter
    ? 'openrouter'
    : protocol === 'gemini' || baseUrl.includes('googleapis.com')
      ? 'gemini'
      : 'custom';
  const defaultModel = adminOverride.enabled
    ? adminOverride.model
    : (process.env.AI_MODEL || (isOpenRouter ? 'openrouter/auto-smart' : 'gemini-3-flash-preview')).trim();

  const models = isOpenRouter ? OPENROUTER_MODELS : GEMINI_MODELS;
  const availableModels = models.map((m) => ({
    id: m.id,
    label: m.label,
    tier: m.tier,
  }));

  if (defaultModel && !availableModels.some((m) => m.id === defaultModel)) {
    availableModels.unshift({
      id: defaultModel,
      label: defaultModel,
      tier: 'balanced',
    });
  }

  return {
    activeProfile,
    protocol,
    defaultModel,
    availableModels,
  };
}

export function resolveAIConfig(
  headers: IncomingHttpHeaders,
  requestedModel?: string
): EffectiveAIConfig {
  ensureLocalEnvLoaded();
  const adminOverride = getInternalGatewayOverride();

  let protocol: AIProtocol = normalizeProtocol(process.env.AI_PROTOCOL);
  let baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').trim();
  let model = (process.env.AI_MODEL || 'studio-smart-route').trim();
  let chatModel: string | undefined;
  let buildModel: string | undefined;
  let maxOutputTokens: number | undefined;
  let apiKey = (process.env.AI_API_KEY || '').trim();
  let systemPromptSuffix = '';
  let usingByok = false;
  let usingAdminKey = false;

  if (adminOverride.enabled) {
    protocol = adminOverride.protocol;
    baseUrl = adminOverride.baseUrl || baseUrl;
    model = adminOverride.model || model;
    chatModel = adminOverride.chatModel;
    buildModel = adminOverride.buildModel;
    maxOutputTokens = adminOverride.maxOutputTokens;
    if (adminOverride.apiKey) {
      apiKey = adminOverride.apiKey;
      usingAdminKey = true;
    }
    systemPromptSuffix = adminOverride.systemPromptSuffix || '';
  }

  const isOpenRouterUrl = baseUrl.toLowerCase().includes('openrouter.ai');
  const cleanRequested = (requestedModel || '').trim();
  if (cleanRequested && cleanRequested !== 'auto') {
    if (!adminOverride.enabled) {
      model = cleanRequested;
    } else if (protocol === 'gemini' && SERVER_GEMINI_MODEL_ALLOWLIST.has(cleanRequested)) {
      model = cleanRequested;
    } else if (isOpenRouterUrl && SERVER_OPENROUTER_MODEL_ALLOWLIST.has(cleanRequested)) {
      model = cleanRequested;
    }
  }

  const byokKey = typeof headers['x-ff-byok-key'] === 'string' ? headers['x-ff-byok-key'].trim() : '';
  const byokUrl = typeof headers['x-ff-byok-url'] === 'string' ? headers['x-ff-byok-url'].trim() : '';
  const byokModel = typeof headers['x-ff-byok-model'] === 'string' ? headers['x-ff-byok-model'].trim() : '';
  const byokProto = typeof headers['x-ff-byok-protocol'] === 'string' ? headers['x-ff-byok-protocol'].trim() : '';

  if (byokKey) {
    apiKey = byokKey;
    usingByok = true;
    usingAdminKey = false;
    if (byokUrl) baseUrl = byokUrl;
    if (byokProto) protocol = normalizeProtocol(byokProto);
    if (cleanRequested && cleanRequested !== 'auto') {
      model = cleanRequested;
    } else if (byokModel) {
      model = byokModel;
    }
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  return {
    protocol,
    baseUrl: cleanBaseUrl,
    model,
    chatModel,
    buildModel,
    maxOutputTokens,
    apiKey,
    systemPromptSuffix,
    usingByok,
    usingAdminKey,
    isOpenRouter: cleanBaseUrl.toLowerCase().includes('openrouter.ai'),
  };
}

function resolveModelCandidates(config: EffectiveAIConfig, intent: WorkspaceIntent): string[] {
  if (!config.isOpenRouter) {
    return [config.model];
  }

  const isAuto =
    config.model === 'openrouter/auto-smart' ||
    config.model === 'auto' ||
    config.model === 'studio-smart-route';
  const freeTierActive = openrouterCreditShortageUntil > Date.now();
  const seen = new Set<string>();
  const ordered: string[] = [];
  const pushUnique = (m?: string) => {
    const clean = (m || '').trim();
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    ordered.push(clean);
  };

  if (isAuto) {
    if (!freeTierActive) {
      if (intent === 'assistant') {
        pushUnique(config.chatModel || 'google/gemini-2.5-flash-lite');
        OPENROUTER_PAID_CHAT_CHAIN.forEach(pushUnique);
      } else {
        pushUnique(config.buildModel || 'deepseek/deepseek-v3.2');
        OPENROUTER_PAID_BUILD_CHAIN.forEach(pushUnique);
      }
    } else {
      OPENROUTER_FREE_FALLBACK_CHAIN.forEach(pushUnique);
    }
  } else {
    if (!freeTierActive || config.model.endsWith(':free') || config.model === 'openrouter/free') {
      pushUnique(config.model);
    }
    OPENROUTER_FREE_FALLBACK_CHAIN.forEach(pushUnique);
  }

  return ordered.length > 0 ? ordered : ['openrouter/free'];
}

function resolveModeMaxTokens(config: EffectiveAIConfig, intent: WorkspaceIntent, useAssemblyPlan: boolean): number {
  const adminCap = config.maxOutputTokens;
  let target: number;
  if (intent === 'assistant') {
    target = 1100;
  } else if (useAssemblyPlan) {
    target = 2500;
  } else if (intent === 'patch') {
    target = 2600;
  } else {
    target = config.isOpenRouter ? 3600 : 8192;
  }
  return adminCap ? Math.min(adminCap, target) : target;
}

function buildModeSystemInstruction(
  intent: WorkspaceIntent,
  useAssemblyPlan: boolean,
  suffix: string,
  sessionInstructions = ''
): string {
  let base: string;

  if (intent === 'assistant') {
    base = [
      'You are the official F-Forum v3 AI Assistant inside Workspace.',
      FFORUM_COMPACT_KNOWLEDGE,
      'Respond ONLY with a compact valid JSON object:',
      '{"mode":"assistant","message":"Câu trả lời tiếng Việt ngắn gọn, rõ ràng, thực tế (dùng gạch đầu dòng nếu cần)","suggestedResources":[{"id":"...","title":"...","library":"...","reason":"..."}],"files":[],"checksHint":["F-Forum assistant reply"]}',
      'RULES:',
      '1. Answer directly about F-Forum v3 web features, routes, Admin Panel, 5,909 free Vault resources, 58 motion recipes, or GitHub repo broamstuck-cybr/f_forumv3.',
      '2. When the user asks to find components/templates/effects, pick the most relevant entries from MATCHED VAULT CANDIDATES and return them in suggestedResources so the user can click to stitch them directly.',
      '3. NEVER generate HTML/CSS/JS files in assistant mode (keep "files":[]). Keep replies crisp, accurate, zero hype, zero emojis.',
    ].join('\n');
  } else if (useAssemblyPlan) {
    base = [
      'You are the F-Forum v3 Token-Efficient Vault Assembly Architect.',
      FFORUM_COMPACT_KNOWLEDGE,
      'The client ALREADY fetched real interactive HTML/CSS/JS modules from the F-Forum 5,909-item Vault (listed in VAULT SLOTS). Your job is NOT to rewrite huge boilerplate HTML/CSS from scratch — instead return a compact JSON Assembly Plan so the deterministic Stitcher embeds those real Vault modules directly with your tailored Vietnamese content and theme.',
      'Respond ONLY with a valid JSON object matching this schema:',
      '{"mode":"assemble","message":"Tóm tắt ngắn tiếng Việt những mẫu kho đã lắp ghép","assemblyPlan":{"siteTitle":"...","eyebrow":"...","heroTitle":"...","heroSubtitle":"...","primaryCta":"...","secondaryCta":"...","themeMode":"dark","accentKey":"emerald|amber|cyan|violet|rose","vaultSectionTitle":"...","vaultSectionLead":"...","selectedSlotIds":["slot-1","slot-2"],"slotNotes":{"slot-1":"Vai trò của mẫu này trong trang"},"stats":[{"value":"...","label":"..."}],"cards":[{"tag":"...","title":"...","description":"..."}],"timeline":[{"time":"...","title":"...","detail":"..."}],"flashcards":[{"tag":"...","front":"...","back":"..."}],"quiz":[{"question":"...","options":["...","...","..."],"correctIndex":0,"explanation":"..."}],"registerHeading":"...","registerLead":"...","registerCta":"...","footerNote":"...","customCss":"/* tùy chọn tối đa 20 dòng CSS tinh chỉnh */"},"files":[],"checksHint":["Vault modules stitched"]}',
      'RULES:',
      '1. Always tailor 100% of titles, stats, cards, timeline, quiz, and CTAs to the EXACT subject in USER PROMPT using natural Vietnamese diacritics.',
      '2. Always select 1-3 slot IDs from VAULT SLOTS in selectedSlotIds so real Vault components are stitched live into the page.',
      '3. Be concise to save tokens: 3-4 stats, 3 cards, 3 timeline steps, 2-3 flashcards, 2 quiz questions max. Never use emojis, placeholder filler text, or marketing hype.',
    ].join('\n');
  } else if (intent === 'patch') {
    base = [
      'You are the F-Forum v3 Incremental Patch & Web Builder.',
      FFORUM_COMPACT_KNOWLEDGE,
      'Respond ONLY with a valid JSON object using EITHER compact find/replace patches (preferred to save tokens!) OR only the changed files:',
      'Option A (smallest token cost): {"mode":"patch","message":"Tóm tắt ngắn tiếng Việt","patches":[{"path":"src/styles.css","find":"exact snippet","replace":"new snippet"}],"files":[],"checksHint":["Patched cleanly"]}',
      'Option B (when rewriting a section/file): {"mode":"files","message":"Tóm tắt ngắn tiếng Việt","files":[{"path":"index.html","content":"...","summary":"..."}],"checksHint":["Updated changed files only"]}',
      'RULES:',
      '1. ONLY touch files needed for the user edit — NEVER regenerate untouched files.',
      '2. Inside JSON "content" or "replace", use standard single-escaped JSON newlines, NEVER double-escaped literal "\\n".',
      '3. Keep crisp Vietnamese diacritics, accessible contrast >= 4.5:1, responsive layout, zero emojis, zero filler text.',
    ].join('\n');
  } else {
    base = [
      'You are the F-FORUM v3 Vault-Grounded Web Assembly Engine.',
      FFORUM_COMPACT_KNOWLEDGE,
      'Respond ONLY with a valid JSON object matching this exact schema:',
      '{"message":"Concise Vietnamese technical summary of assembled sections","files":[{"path":"index.html","content":"...","summary":"..."},{"path":"src/styles.css","content":"...","summary":"..."},{"path":"src/app.js","content":"...","summary":"..."}],"checksHint":["Viewport meta verified","Accessible contrast and responsive layout"]}',
      'CRITICAL ASSEMBLY & QUALITY RULES:',
      '1. VAULT-FIRST COMPOSITION: When ATTACHED VAULT BLUEPRINTS are provided, actively reuse their layout patterns, CSS craft tokens, and motion recipes into ONE cohesive webpage tailored to the USER PROMPT.',
      '2. STRICT USER INTENT: Build for the exact subject, title, audience, and theme requested in USER PROMPT.',
      '3. REAL MULTI-LINE CODE (ZERO DOUBLE-ESCAPING): Use standard JSON newlines; NEVER double-escape into literal "\\n".',
      '4. COMPLETE STYLING & INTERACTIVITY: Produce complete src/styles.css (contrast >= 4.5:1, responsive @media <= 768px) and working JS or React TSX (imports only from "react" and relative files).',
      '5. Zero emojis, zero placeholder filler text, crisp Vietnamese diacritics, #anchor internal links.',
    ].join('\n');
  }

  const session = intent === 'assistant' ? '' : sessionInstructions.trim().slice(0, 900);
  return [base, suffix, session ? `SESSION INSTRUCTIONS (do not override JSON schema):\n${session}` : '']
    .filter(Boolean)
    .join('\n');
}

function clampTemperature(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0.2;
  return Math.min(1.2, Math.max(0, value));
}

function buildModeUserPrompt(
  req: AIChatRequest,
  intent: WorkspaceIntent,
  useAssemblyPlan: boolean
): { userContent: string; matchedSuggestions: SuggestedVaultItem[] } {
  const matchedSuggestions =
    intent === 'assistant' ? searchVaultKnowledge(req.prompt, 6) : [];

  if (intent === 'assistant') {
    const candidateLines = matchedSuggestions
      .map((s) => `- [${s.library}] ${s.title} (id: ${s.id}) — ${s.reason}`)
      .join('\n');
    const recentHistory = (req.history || [])
      .slice(-4)
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content.slice(0, 280)}`)
      .join('\n');
    const userContent = [
      recentHistory ? `RECENT CHAT:\n${recentHistory}` : '',
      `USER QUESTION:\n${req.prompt}`,
      candidateLines ? `MATCHED VAULT CANDIDATES:\n${candidateLines}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    return { userContent, matchedSuggestions };
  }

  if (useAssemblyPlan) {
    const slotLines = (req.vaultSlots || [])
      .slice(0, 4)
      .map((s) => `- ${s.slotId}: [${s.library}] ${s.title} (id: ${s.id}) — ${s.summary.slice(0, 220)}`)
      .join('\n');
    const userContent = [
      `USER PROMPT:\n${req.prompt}`,
      slotLines ? `VAULT SLOTS READY FOR STITCHING:\n${slotLines}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    return { userContent, matchedSuggestions };
  }

  const attachedLimit = intent === 'patch' ? 2 : 3;
  const attachedCharCap = intent === 'patch' ? 800 : 1800;
  const fileLimit = intent === 'patch' ? 3 : 4;
  const fileCharCap = intent === 'patch' ? 2600 : 3000;

  const attachedSummary = (req.attachedItems || [])
    .slice(0, attachedLimit)
    .map((item: AttachedContextItem) => `- [${item.kind}] ${item.title}:\n${String(item.summary || '').slice(0, attachedCharCap)}`)
    .join('\n\n');
  const existingFiles = (req.files || [])
    .filter((f) => f.path !== 'metadata.json' && f.path !== 'README.md')
    .slice(0, fileLimit)
    .map((f) => `FILE: ${f.path}\n${f.content.slice(0, fileCharCap)}`)
    .join('\n\n');

  const userContent = [
    `USER PROMPT:\n${req.prompt}`,
    attachedSummary ? `ATTACHED VAULT BLUEPRINTS:\n${attachedSummary}` : '',
    existingFiles ? `CURRENT WORKSPACE FILES:\n${existingFiles}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return { userContent, matchedSuggestions };
}

interface CatalogSampleEntry {
  id: string;
  title: string;
  sourceLibrary?: string;
  tags?: string[];
  previewHtml?: string;
  previewCss?: string;
}

let cachedCatalogSamples: CatalogSampleEntry[] | null = null;

function getCatalogSamples(): CatalogSampleEntry[] {
  if (cachedCatalogSamples) return cachedCatalogSamples;
  const candidates = [
    path.resolve(process.cwd(), 'src/data/sourceCatalog.json'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/sourceCatalog.json'),
  ];
  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
      if (Array.isArray(raw)) {
        cachedCatalogSamples = raw.filter(
          (item): item is CatalogSampleEntry =>
            Boolean(item) &&
            typeof item === 'object' &&
            typeof (item as CatalogSampleEntry).title === 'string' &&
            typeof (item as CatalogSampleEntry).previewHtml === 'string' &&
            (item as CatalogSampleEntry).previewHtml!.trim().length > 0
        );
        return cachedCatalogSamples;
      }
    } catch {
      continue;
    }
  }
  cachedCatalogSamples = [];
  return cachedCatalogSamples;
}

const FALLBACK_STOP_WORDS = new Set([
  'tạo', 'tao', 'làm', 'lam', 'viết', 'viet', 'thiết', 'thiet', 'kế', 'ke',
  'giao', 'diện', 'dien', 'trang', 'mẫu', 'mau', 'web', 'app', 'cho', 'với',
  'voi', 'một', 'mot', 'của', 'cua', 'và', 'va', 'the', 'for', 'with', 'and',
  'build', 'create', 'make', 'design', 'component', 'css', 'html', 'prompt',
  'turn', 'test', 'hello', 'xin', 'chào', 'chao', 'mode', 'refine', 'audit',
]);

function normalizeTokens(text: string): string[] {
  return text
    .replace(/^\[Mode:\s*[^\]]+\]\s*/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\u1e00-\u1eff-]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !FALLBACK_STOP_WORDS.has(token));
}

function findStrongCatalogMatch(prompt: string): CatalogSampleEntry | null {
  const cleanPrompt = prompt.replace(/^\[Mode:\s*[^\]]+\]\s*/i, '').trim().toLowerCase();
  if (cleanPrompt.length < 4) return null;

  const promptTokens = normalizeTokens(cleanPrompt);
  if (promptTokens.length === 0) return null;

  const samples = getCatalogSamples();
  let bestEntry: CatalogSampleEntry | null = null;
  let bestScore = 0;

  for (const entry of samples) {
    const titleLower = entry.title.toLowerCase();
    const idLower = entry.id.toLowerCase();
    const tagList = (entry.tags || []).map((t) => t.toLowerCase());

    if (titleLower.length >= 6 && cleanPrompt.includes(titleLower)) {
      return entry;
    }

    const entryTokenSet = new Set([
      ...normalizeTokens(titleLower),
      ...normalizeTokens(idLower.replace(/\//g, ' ')),
      ...tagList.flatMap((t) => normalizeTokens(t.replace(/-/g, ' '))),
    ]);

    let hits = 0;
    let score = 0;
    for (const token of promptTokens) {
      if (entryTokenSet.has(token)) {
        hits += 1;
        score += titleLower.includes(token) ? 3 : 2;
      }
    }

    if (hits >= 2 && score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestScore >= 4 ? bestEntry : null;
}

function buildFilesFromCatalogSample(entry: CatalogSampleEntry): AIGenerationOutput['files'] {
  const rawHtml = (entry.previewHtml || '').trim();
  const scriptBlocks: string[] = [];
  const htmlWithoutScripts = rawHtml
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_, code: string) => {
      const cleaned = code.trim();
      if (cleaned) scriptBlocks.push(cleaned);
      return '';
    })
    .trim();

  const cssContent = (entry.previewCss || '').trim();
  const jsContent = scriptBlocks.join('\n\n');
  const safeTitle = entry.title.replace(/[<>"]/g, '').trim() || 'Mẫu giao diện F-Forum';

  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
${htmlWithoutScripts}
${jsContent ? '  <script src="app.js"></script>\n' : ''}</body>
</html>`;

  const files: AIGenerationOutput['files'] = [
    {
      path: 'index.html',
      content: fullHtml,
      summary: `HTML từ mẫu "${entry.title}"`,
    },
    {
      path: 'styles.css',
      content: cssContent,
      summary: `CSS từ mẫu "${entry.title}"`,
    },
  ];

  if (jsContent) {
    files.push({
      path: 'app.js',
      content: jsContent,
      summary: `Script tương tác từ mẫu "${entry.title}"`,
    });
  }

  return files;
}

function buildFallbackResponse(
  req: AIChatRequest,
  config: EffectiveAIConfig,
  upstreamError: string,
  tokens?: TokenCounter
): AIGenerationOutput {
  const matched = findStrongCatalogMatch(req.prompt || '');
  if (matched) {
    return {
      message: `Chưa kết nối khóa AI (${upstreamError}). Đã nạp mẫu thật khớp từ khóa: "${matched.title}" (${matched.sourceLibrary || 'Vault'}). Mở Cài đặt -> Khóa riêng (BYOK) để nhập API key thật (OpenAI / Gemini / OpenRouter / DeepSeek) hoặc mở Kho 5.909 mẫu để duyệt thêm.`,
      files: buildFilesFromCatalogSample(matched),
      checksHint: [],
      fallback: true,
      upstreamError,
      modelUsed: config.model,
      protocolUsed: config.protocol,
      tokens,
    };
  }

  const keyMissing = !config.apiKey && !hasConfiguredPoolKeys();
  const message = keyMissing
    ? 'Chưa kết nối khóa AI. Mở Cài đặt -> Khóa riêng (BYOK) để nhập API key thật (OpenAI / Gemini / OpenRouter / DeepSeek) giúp trợ lý sinh mã theo yêu cầu, hoặc bấm mở Kho 5.909 mẫu để nạp giao diện thật.'
    : `Kết nối AI tạm gián đoạn (${upstreamError}). Kiểm tra lại khóa tại Cài đặt -> Khóa riêng (BYOK) (OpenAI / Gemini / OpenRouter / DeepSeek) hoặc bấm mở Kho 5.909 mẫu để nạp mẫu thật.`;

  return {
    message,
    files: [],
    checksHint: [],
    fallback: true,
    upstreamError,
    modelUsed: config.model,
    protocolUsed: config.protocol,
    tokens,
  };
}

interface StreamParseResult {
  text: string;
  tokens: TokenCounter;
  actualModel?: string;
}

function emptyTokenCounter(): TokenCounter {
  return { prompt: 0, completion: 0, total: 0 };
}

function finalizeTokens(tokens: TokenCounter): TokenCounter {
  const prompt = Math.max(0, tokens.prompt);
  const completion = Math.max(0, tokens.completion);
  const total = Math.max(tokens.total, prompt + completion);
  return { prompt, completion, total };
}

function mergeGeminiUsage(
  target: TokenCounter,
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  }
): void {
  if (!usage) return;
  const prompt = typeof usage.promptTokenCount === 'number' ? usage.promptTokenCount : 0;
  const candidates = typeof usage.candidatesTokenCount === 'number' ? usage.candidatesTokenCount : 0;
  const thoughts = typeof usage.thoughtsTokenCount === 'number' ? usage.thoughtsTokenCount : 0;
  const rawTotal = typeof usage.totalTokenCount === 'number' ? usage.totalTokenCount : 0;
  const completion =
    candidates + thoughts > 0 ? candidates + thoughts : Math.max(0, rawTotal - prompt);
  if (prompt > target.prompt) target.prompt = prompt;
  if (completion > target.completion) target.completion = completion;
  if (rawTotal > target.total) target.total = rawTotal;
}

async function consumeResponseLines(
  resp: Response,
  onLine: (line: string) => void
): Promise<string> {
  if (!resp.body) {
    const raw = await resp.text();
    for (const line of raw.split(/\r?\n/)) {
      onLine(line);
    }
    return raw;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let raw = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunkText = decoder.decode(value, { stream: true });
    raw += chunkText;
    buffer += chunkText;
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex >= 0) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
      buffer = buffer.slice(newlineIndex + 1);
      onLine(line);
      newlineIndex = buffer.indexOf('\n');
    }
  }

  const trailing = decoder.decode();
  if (trailing) {
    raw += trailing;
    buffer += trailing;
  }
  if (buffer) {
    onLine(buffer.replace(/\r$/, ''));
  }

  return raw;
}

async function readOpenAICompatibleStream(
  resp: Response,
  onDelta?: (chunk: string) => void
): Promise<StreamParseResult> {
  let assembled = '';
  let sawSseData = false;
  let actualModel: string | undefined;
  const tokens = emptyTokenCounter();

  const raw = await consumeResponseLines(resp, (line) => {
    const clean = line.trim();
    if (!clean.startsWith('data:')) return;
    sawSseData = true;
    const payload = clean.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    try {
      const chunk = JSON.parse(payload) as {
        model?: string;
        choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };
      if (typeof chunk.model === 'string' && chunk.model.trim()) {
        actualModel = chunk.model.trim();
      }
      if (chunk.usage) {
        tokens.prompt = Math.max(tokens.prompt, chunk.usage.prompt_tokens || 0);
        tokens.completion = Math.max(tokens.completion, chunk.usage.completion_tokens || 0);
        tokens.total = Math.max(tokens.total, chunk.usage.total_tokens || 0);
      }
      const delta = chunk.choices?.[0]?.delta?.content ?? chunk.choices?.[0]?.message?.content ?? '';
      if (delta) {
        assembled += delta;
        onDelta?.(delta);
      }
    } catch {
      return;
    }
  });

  if (sawSseData) return { text: assembled, tokens: finalizeTokens(tokens), actualModel };

  const trimmed = raw.trim();
  if (!trimmed) return { text: '', tokens: finalizeTokens(tokens), actualModel };
  const data = JSON.parse(trimmed) as {
    model?: string;
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  if (typeof data.model === 'string' && data.model.trim()) {
    actualModel = data.model.trim();
  }
  if (data.usage) {
    tokens.prompt = Math.max(tokens.prompt, data.usage.prompt_tokens || 0);
    tokens.completion = Math.max(tokens.completion, data.usage.completion_tokens || 0);
    tokens.total = Math.max(tokens.total, data.usage.total_tokens || 0);
  }
  const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
  if (text) onDelta?.(text);
  return { text, tokens: finalizeTokens(tokens), actualModel };
}

async function readAnthropicStream(
  resp: Response,
  onDelta?: (chunk: string) => void
): Promise<StreamParseResult> {
  let assembled = '';
  let sawSseData = false;
  const tokens = emptyTokenCounter();

  const raw = await consumeResponseLines(resp, (line) => {
    const clean = line.trim();
    if (!clean.startsWith('data:')) return;
    sawSseData = true;
    const payload = clean.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    try {
      const event = JSON.parse(payload) as {
        type?: string;
        delta?: { type?: string; text?: string };
        message?: { usage?: { input_tokens?: number; output_tokens?: number } };
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      if (event.type === 'message_start' && event.message?.usage) {
        tokens.prompt = Math.max(tokens.prompt, event.message.usage.input_tokens || 0);
      }
      if (event.type === 'message_delta' && event.usage) {
        tokens.completion = Math.max(tokens.completion, event.usage.output_tokens || 0);
      }
      if (event.type === 'content_block_delta' && event.delta?.text) {
        assembled += event.delta.text;
        onDelta?.(event.delta.text);
      }
    } catch {
      return;
    }
  });

  if (sawSseData) return { text: assembled, tokens: finalizeTokens(tokens) };

  const trimmed = raw.trim();
  if (!trimmed) return { text: '', tokens: finalizeTokens(tokens) };
  const data = JSON.parse(trimmed) as {
    content?: Array<{ text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  if (data.usage) {
    tokens.prompt = Math.max(tokens.prompt, data.usage.input_tokens || 0);
    tokens.completion = Math.max(tokens.completion, data.usage.output_tokens || 0);
  }
  const text = data.content?.[0]?.text || '';
  if (text) onDelta?.(text);
  return { text, tokens: finalizeTokens(tokens) };
}

async function readGeminiStream(
  resp: Response,
  onDelta?: (chunk: string) => void
): Promise<StreamParseResult> {
  let assembled = '';
  let sawSseData = false;
  const tokens = emptyTokenCounter();

  const raw = await consumeResponseLines(resp, (line) => {
    const clean = line.trim();
    if (!clean.startsWith('data:')) return;
    sawSseData = true;
    const payload = clean.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    try {
      const chunk = JSON.parse(payload) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          thoughtsTokenCount?: number;
          totalTokenCount?: number;
        };
      };
      mergeGeminiUsage(tokens, chunk.usageMetadata);
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      // WHY: Skip Gemini thinking parts so internal reasoning never corrupts JSON code output.
      const text = parts
        .filter((p) => !p.thought)
        .map((p) => p.text || '')
        .join('');
      if (text) {
        assembled += text;
        onDelta?.(text);
      }
    } catch {
      return;
    }
  });

  if (sawSseData) return { text: assembled, tokens: finalizeTokens(tokens) };

  const trimmed = raw.trim();
  if (!trimmed) return { text: '', tokens: finalizeTokens(tokens) };
  const data = JSON.parse(trimmed) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      thoughtsTokenCount?: number;
      totalTokenCount?: number;
    };
  };
  mergeGeminiUsage(tokens, data.usageMetadata);
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((p) => !p.thought)
    .map((p) => p.text || '')
    .join('');
  if (text) onDelta?.(text);
  return { text, tokens: finalizeTokens(tokens) };
}

function unescapeDoubleEncodedCode(raw: string): string {
  const realNewlines = (raw.match(/\n/g) || []).length;
  const literalNewlines = (raw.match(/\\n/g) || []).length;
  // WHY: Gemini JSON mode occasionally double-escapes line breaks ("\\n") inside file content strings, collapsing HTML/CSS onto line 1.
  if (literalNewlines >= 3 && (realNewlines <= 2 || literalNewlines > realNewlines * 4)) {
    let fixed = raw
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ');
    if (/\\["']/.test(fixed) && (fixed.includes('\\"') && !fixed.includes('class="'))) {
      fixed = fixed.replace(/\\"/g, '"');
    }
    return fixed;
  }
  return raw;
}

function parseStructuredLLMResponse(
  rawText: string,
  config: EffectiveAIConfig,
  tokens?: TokenCounter,
  usedKeyMask?: string,
  options?: {
    intent?: WorkspaceIntent;
    actualModel?: string;
    fallbackSuggestions?: SuggestedVaultItem[];
  }
): AIGenerationOutput | null {
  const modelUsed = options?.actualModel || config.model;
  const estimatedCostUsd = estimateTokensCostUsd(modelUsed, tokens);
  const unfenced = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  const jsonStart = unfenced.indexOf('{');
  const jsonEnd = unfenced.lastIndexOf('}');

  if (jsonStart < 0 || jsonEnd <= jsonStart) {
    // WHY: In assistant Q&A mode, if a lightweight model replies directly in plain Vietnamese text, accept it cleanly instead of triggering fallback.
    if (options?.intent === 'assistant' && unfenced.length >= 6) {
      return {
        message: unfenced.slice(0, 3200),
        mode: 'assistant',
        files: [],
        suggestedResources: options.fallbackSuggestions?.slice(0, 4),
        checksHint: ['F-Forum assistant reply'],
        fallback: false,
        modelUsed,
        protocolUsed: config.protocol,
        tokens,
        estimatedCostUsd,
        usedKeyMask,
      };
    }
    return null;
  }

  try {
    const parsed = JSON.parse(unfenced.slice(jsonStart, jsonEnd + 1)) as {
      mode?: string;
      message?: string;
      files?: Array<{ path?: string; content?: string; summary?: string }>;
      assemblyPlan?: WorkspaceAssemblyPlan;
      patches?: Array<{ path?: string; find?: string; replace?: string }>;
      suggestedResources?: Array<{ id?: string; title?: string; library?: string; category?: string; reason?: string }>;
      checksHint?: string[];
    };
    if (!parsed || typeof parsed !== 'object') return null;

    const validFiles = Array.isArray(parsed.files)
      ? parsed.files
          .filter((f) => typeof f.path === 'string' && typeof f.content === 'string')
          .map((f) => ({
            path: String(f.path).trim().replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/^\/+/, ''),
            content: unescapeDoubleEncodedCode(String(f.content)),
            summary: String(f.summary || 'Updated file'),
          }))
          .filter((f) => Boolean(f.path) && !f.path.includes('..'))
      : [];

    const validPatches: FilePatchOp[] = Array.isArray(parsed.patches)
      ? parsed.patches
          .filter(
            (p) =>
              typeof p.path === 'string' &&
              typeof p.find === 'string' &&
              p.find.length > 0 &&
              typeof p.replace === 'string'
          )
          .map((p) => ({
            path: String(p.path).trim().replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/^\/+/, ''),
            find: unescapeDoubleEncodedCode(String(p.find)),
            replace: unescapeDoubleEncodedCode(String(p.replace)),
          }))
          .filter((p) => Boolean(p.path) && !p.path.includes('..'))
      : [];

    const validSuggestions: SuggestedVaultItem[] = Array.isArray(parsed.suggestedResources)
      ? parsed.suggestedResources
          .filter((s) => typeof s.id === 'string' && typeof s.title === 'string')
          .slice(0, 6)
          .map((s) => ({
            id: String(s.id).trim(),
            title: String(s.title).trim(),
            library: String(s.library || 'codefronts').trim(),
            category: s.category ? String(s.category).trim() : undefined,
            reason: s.reason ? String(s.reason).trim() : undefined,
          }))
      : [];

    if (
      parsed.assemblyPlan &&
      typeof parsed.assemblyPlan === 'object' &&
      !Array.isArray(parsed.assemblyPlan)
    ) {
      return {
        message: String(parsed.message || 'Đã lắp ghép trang web từ kho tài nguyên F-Forum.'),
        mode: 'assemble',
        files: validFiles,
        assemblyPlan: parsed.assemblyPlan,
        checksHint: Array.isArray(parsed.checksHint)
          ? parsed.checksHint.map(String)
          : ['Vault assembly plan verified'],
        fallback: false,
        modelUsed,
        protocolUsed: config.protocol,
        tokens,
        estimatedCostUsd,
        usedKeyMask,
      };
    }

    if (validPatches.length > 0) {
      return {
        message: String(parsed.message || 'Đã cập nhật đúng phần cần chỉnh sửa.'),
        mode: 'patch',
        files: validFiles,
        patches: validPatches,
        checksHint: Array.isArray(parsed.checksHint)
          ? parsed.checksHint.map(String)
          : ['Incremental patch applied'],
        fallback: false,
        modelUsed,
        protocolUsed: config.protocol,
        tokens,
        estimatedCostUsd,
        usedKeyMask,
      };
    }

    if (validFiles.length > 0) {
      return {
        message: String(parsed.message || 'Đã cập nhật mã nguồn Workspace.'),
        mode: 'files',
        files: validFiles,
        checksHint: Array.isArray(parsed.checksHint)
          ? parsed.checksHint.map(String)
          : ['Verified workspace files'],
        fallback: false,
        modelUsed,
        protocolUsed: config.protocol,
        tokens,
        estimatedCostUsd,
        usedKeyMask,
      };
    }

    if ((parsed.mode === 'assistant' || options?.intent === 'assistant') && typeof parsed.message === 'string' && parsed.message.trim()) {
      return {
        message: parsed.message.trim(),
        mode: 'assistant',
        files: [],
        suggestedResources:
          validSuggestions.length > 0
            ? validSuggestions
            : options?.fallbackSuggestions?.slice(0, 4),
        checksHint: Array.isArray(parsed.checksHint)
          ? parsed.checksHint.map(String)
          : ['F-Forum assistant reply'],
        fallback: false,
        modelUsed,
        protocolUsed: config.protocol,
        tokens,
        estimatedCostUsd,
        usedKeyMask,
      };
    }

    return null;
  } catch {
    if (options?.intent === 'assistant' && unfenced.length >= 6) {
      return {
        message: unfenced.slice(0, 3200),
        mode: 'assistant',
        files: [],
        suggestedResources: options.fallbackSuggestions?.slice(0, 4),
        checksHint: ['F-Forum assistant reply'],
        fallback: false,
        modelUsed,
        protocolUsed: config.protocol,
        tokens,
        estimatedCostUsd,
        usedKeyMask,
      };
    }
    return null;
  }
}

function isAllowLocalTestUpstream(): boolean {
  if (process.env.FF_ALLOW_LOCAL_BYOK === '1') return true;
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return !isProd;
}

function parseIpv4Parts(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums: number[] = [];
  for (const part of parts) {
    if (!/^(?:0|[1-9]\d{0,2})$/.test(part)) return null;
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    nums.push(n);
  }
  return nums;
}

function parseIpv6Hextets(ip: string): number[] | null {
  const doubleColonParts = ip.split('::');
  if (doubleColonParts.length > 2) return null;

  const parseSide = (side: string): number[] | null => {
    if (!side) return [];
    const tokens = side.split(':');
    const groups: number[] = [];
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token.includes('.')) {
        if (i !== tokens.length - 1 || !net.isIPv4(token)) return null;
        const octets = parseIpv4Parts(token);
        if (!octets) return null;
        groups.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
      } else {
        if (!/^[0-9a-f]{1,4}$/i.test(token)) return null;
        groups.push(Number.parseInt(token, 16));
      }
    }
    return groups;
  };

  if (doubleColonParts.length === 1) {
    const groups = parseSide(doubleColonParts[0]);
    return groups && groups.length === 8 ? groups : null;
  }

  const left = parseSide(doubleColonParts[0]);
  const right = parseSide(doubleColonParts[1]);
  if (!left || !right) return null;
  const missing = 8 - (left.length + right.length);
  if (missing < 1) return null;
  return [...left, ...new Array<number>(missing).fill(0), ...right];
}

function isBlockedIpAddress(rawIp: string, allowLoopback127001: boolean): boolean {
  const ip = rawIp.trim().toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  if (!ip) return true;

  if (net.isIPv4(ip)) {
    if (allowLoopback127001 && ip === '127.0.0.1') return false;
    const octets = parseIpv4Parts(ip);
    if (!octets) return true;
    const [a, b] = octets;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19 || b === 51)) return true;
    if (a >= 224) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const hextets = parseIpv6Hextets(ip);
    if (!hextets) return true;
    const [h0, h1, h2, h3, h4, h5, h6, h7] = hextets;
    // ::/96 (unspecified ::, loopback ::1, deprecated IPv4-compatible ::7f00:1 / ::a.b.c.d)
    if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0) {
      return true;
    }
    // ::ffff:0:0/96 (IPv4-mapped IPv6)
    if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0xffff) {
      const v4 = `${(h6 >> 8) & 0xff}.${h6 & 0xff}.${(h7 >> 8) & 0xff}.${h7 & 0xff}`;
      return isBlockedIpAddress(v4, false);
    }
    // 64:ff9b::/96 (NAT64 well-known) and 64:ff9b:1::/48 (NAT64 local-use)
    if (h0 === 0x0064 && h1 === 0xff9b && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0) {
      return true;
    }
    if (h0 === 0x0064 && h1 === 0xff9b && h2 === 0x0001) {
      return true;
    }
    // fe80::/10 link-local, fc00::/7 unique local, ff00::/8 multicast
    if ((h0 & 0xffc0) === 0xfe80) return true;
    if ((h0 & 0xfe00) === 0xfc00) return true;
    if ((h0 & 0xff00) === 0xff00) return true;
    return false;
  }

  return true;
}

export function validateUpstreamBaseUrl(
  rawUrl: string,
  options?: { allowLocalTest?: boolean; requireHttpsInProd?: boolean }
): { ok: true; url: string; hostname: string } | { ok: false; error: string } {
  const clean = (rawUrl || '').trim();
  if (!clean || clean.length > 512) {
    return { ok: false, error: 'URL máy chủ AI không hợp lệ.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    return { ok: false, error: 'URL máy chủ AI không đúng định dạng.' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: 'URL máy chủ AI không được chứa thông tin đăng nhập.' };
  }

  const allowLocalTest = options?.allowLocalTest ?? isAllowLocalTestUpstream();
  const requireHttps =
    options?.requireHttpsInProd !== false && !allowLocalTest;

  if (requireHttps) {
    if (parsed.protocol !== 'https:') {
      return { ok: false, error: 'Môi trường production chỉ cho phép URL HTTPS.' };
    }
  } else if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: 'Giao thức URL máy chủ AI không hợp lệ.' };
  }

  const rawHostname = parsed.hostname.toLowerCase();
  const hostname = rawHostname.replace(/^\[|\]$/g, '').split('%')[0].replace(/\.+$/, '');
  if (!hostname) {
    return { ok: false, error: 'Thiếu hostname trong URL máy chủ AI.' };
  }

  if (
    hostname === 'metadata' ||
    hostname === 'metadata.google.internal' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    return { ok: false, error: 'Hostname nội bộ không được phép.' };
  }

  if (hostname === 'localhost') {
    if (!allowLocalTest) {
      return { ok: false, error: 'Hostname localhost bị chặn.' };
    }
    return { ok: true, url: clean.replace(/\/+$/, ''), hostname };
  }

  if (/^(?:\d+|0x[0-9a-f]+|0[0-7]+)$/i.test(hostname)) {
    return { ok: false, error: 'Định dạng địa chỉ IP số nguyên bị chặn.' };
  }

  if (net.isIP(hostname) !== 0) {
    if (isBlockedIpAddress(hostname, allowLocalTest)) {
      return { ok: false, error: 'Địa chỉ IP nội bộ hoặc dải riêng tư bị chặn.' };
    }
    return { ok: true, url: clean.replace(/\/+$/, ''), hostname };
  }

  // Reject non-standard dotted IPv4 notations like octal/hex octets (e.g. 0177.0.0.1)
  if (/^(?:0x[0-9a-f]+|0[0-7]+|\d+)(?:\.(?:0x[0-9a-f]+|0[0-7]+|\d+)){1,3}$/i.test(hostname)) {
    return { ok: false, error: 'Định dạng địa chỉ IP bị chặn.' };
  }

  if (!hostname.includes('.')) {
    return { ok: false, error: 'Hostname nội bộ không hợp lệ.' };
  }

  return { ok: true, url: clean.replace(/\/+$/, ''), hostname };
}

async function verifyUpstreamHostDns(hostname: string, allowLocalTest: boolean): Promise<boolean> {
  const normalizedHost = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .split('%')[0]
    .replace(/\.+$/, '');
  if (!normalizedHost) {
    return false;
  }
  if (net.isIP(normalizedHost) !== 0) {
    return !isBlockedIpAddress(normalizedHost, allowLocalTest);
  }
  if (allowLocalTest && normalizedHost === 'localhost') {
    return true;
  }
  try {
    const records = await dns.lookup(normalizedHost, { all: true, verbatim: true });
    if (!records || records.length === 0) return false;
    return records.every((rec) => !isBlockedIpAddress(rec.address, false));
  } catch {
    return false;
  }
}

function isLoopbackUrl(url: string): boolean {
  return /^https?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i.test(url.trim());
}

function formatUpstreamErrBody(raw: string): string {
  const stripped = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitizeErrorText(stripped).slice(0, 160);
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    if (init.signal?.aborted) throw err;
    return await fetch(url, init);
  }
}

async function callUpstreamOnce(params: {
  config: EffectiveAIConfig;
  apiKey: string;
  systemInstruction: string;
  userContent: string;
  temperature: number;
  streamUpstream: boolean;
  signal: AbortSignal;
  maxOutputTokens?: number;
  onDelta?: (chunk: string) => void;
}): Promise<{ ok: true; result: StreamParseResult } | { ok: false; status: number; error: string }> {
  const { config, apiKey, systemInstruction, userContent, temperature, streamUpstream, signal } = params;

  if (config.protocol === 'anthropic') {
    const url = config.baseUrl.endsWith('/messages')
      ? config.baseUrl
      : `${config.baseUrl}/v1/messages`;
    const resp = await fetchWithRetry(url, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: params.maxOutputTokens || 4096,
        temperature,
        stream: streamUpstream,
        system: systemInstruction,
        messages: [{ role: 'user', content: userContent }],
      }),
      signal,
    });
    if (resp.status >= 300 && resp.status < 400) {
      return { ok: false, status: resp.status, error: 'Upstream redirect blocked' };
    }
    if (!resp.ok) {
      const errBody = await resp.text();
      return { ok: false, status: resp.status, error: `Anthropic HTTP ${resp.status}: ${formatUpstreamErrBody(errBody)}` };
    }
    return { ok: true, result: await readAnthropicStream(resp, params.onDelta) };
  }

  if (config.protocol === 'gemini') {
    const method = streamUpstream ? 'streamGenerateContent?alt=sse' : 'generateContent';
    const url = `${config.baseUrl}/models/${encodeURIComponent(config.model)}:${method}`;
    const generationConfig: Record<string, unknown> = {
      temperature,
      maxOutputTokens: params.maxOutputTokens || 12288,
    };
    const modelLower = config.model.toLowerCase();
    if (modelLower.startsWith('gemini-3')) {
      generationConfig.thinkingConfig = { thinkingLevel: 'minimal' };
    } else if (modelLower.startsWith('gemini-2.5')) {
      generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }
    if (!streamUpstream) {
      generationConfig.responseMimeType = 'application/json';
    }
    const resp = await fetchWithRetry(url, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig,
      }),
      signal,
    });
    if (resp.status >= 300 && resp.status < 400) {
      return { ok: false, status: resp.status, error: 'Upstream redirect blocked' };
    }
    if (!resp.ok) {
      const errBody = await resp.text();
      return { ok: false, status: resp.status, error: `Gemini HTTP ${resp.status}: ${formatUpstreamErrBody(errBody)}` };
    }
    return { ok: true, result: await readGeminiStream(resp, params.onDelta) };
  }

  const url = config.baseUrl.endsWith('/chat/completions')
    ? config.baseUrl
    : `${config.baseUrl}/chat/completions`;
  const openAiHeaders: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey}`,
  };
  if (config.isOpenRouter) {
    openAiHeaders['HTTP-Referer'] = 'https://fforum3.vercel.app';
    openAiHeaders['X-Title'] = 'F-Forum v3';
  }
  const openAiPayload: Record<string, unknown> = {
    model: config.model,
    // WHY: Keep stream: true for OpenAI-compatible SSE endpoints expected by core tests
    stream: true,
    max_tokens: params.maxOutputTokens || 3200,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userContent },
    ],
    temperature,
  };
  if (config.isOpenRouter) {
    openAiPayload.stream_options = { include_usage: true };
    openAiPayload.reasoning = { effort: 'low' };
  }
  const resp = await fetchWithRetry(url, {
    method: 'POST',
    redirect: 'manual',
    headers: openAiHeaders,
    body: JSON.stringify(openAiPayload),
    signal,
  });
  if (resp.status >= 300 && resp.status < 400) {
    return { ok: false, status: resp.status, error: 'Upstream redirect blocked' };
  }
  if (!resp.ok) {
    const errBody = await resp.text();
    return {
      ok: false,
      status: resp.status,
      error: `OpenAI-Compatible HTTP ${resp.status}: ${formatUpstreamErrBody(errBody)}`,
    };
  }
  return { ok: true, result: await readOpenAICompatibleStream(resp, params.onDelta) };
}

export async function runAIGenerationStream(
  req: AIChatRequest,
  headers: IncomingHttpHeaders,
  hooks?: AIStreamHooks
): Promise<AIGenerationOutput> {
  const config = resolveAIConfig(headers, req.model);
  const hasExistingFiles = Array.isArray(req.files)
    && req.files.some((f) => f.path !== 'metadata.json' && f.path !== 'README.md');
  const intent = classifyWorkspaceIntent(req.prompt || '', hasExistingFiles, req.intent || req.agentMode);
  const useAssemblyPlan =
    intent === 'assemble' &&
    Array.isArray(req.vaultSlots) &&
    req.vaultSlots.length > 0 &&
    !/\b(react|tsx|jsx)\b/i.test(req.prompt || '');
  const modelCandidates = resolveModelCandidates(config, intent);
  const maxOutputTokens = resolveModeMaxTokens(config, intent, useAssemblyPlan);

  const runningOnCloud = Boolean(process.env.VERCEL);
  const unreachableLoopback = runningOnCloud && isLoopbackUrl(config.baseUrl);
  const allowLocalTest = isAllowLocalTestUpstream();
  const urlCheck = validateUpstreamBaseUrl(config.baseUrl, { allowLocalTest });
  const dnsSafe = urlCheck.ok ? await verifyUpstreamHostDns(urlCheck.hostname, allowLocalTest) : false;
  const blockedUpstream = unreachableLoopback || !urlCheck.ok || !dnsSafe;
  const useDirectKey = config.usingByok || config.usingAdminKey;
  const poolQuota = useDirectKey ? { allowed: true as const } : checkSharedPoolQuota();
  const candidates: PoolCandidate[] = useDirectKey
    ? config.apiKey
      ? [{ id: config.usingByok ? 'byok' : 'admin', mask: config.usingByok ? 'BYOK' : maskApiKey(config.apiKey), rawKey: config.apiKey }]
      : []
    : poolQuota.allowed
      ? selectPoolCandidates()
      : [];
  const canCallUpstream = candidates.length > 0 && !blockedUpstream && poolQuota.allowed;

  hooks?.onStage?.({
    stage: 'routing',
    model: modelCandidates[0] || config.model,
    protocol: config.protocol,
    detail: canCallUpstream ? `${config.protocol}:${modelCandidates[0] || config.model}` : 'unconfigured-fallback',
  });

  if (!canCallUpstream) {
    hooks?.onStage?.({
      stage: 'generating',
      model: config.model,
      protocol: config.protocol,
      detail: 'BYOK / Vault fallback',
    });
    const reason = !urlCheck.ok
      ? urlCheck.error
      : !dnsSafe
        ? 'Hostname máy chủ AI phân giải về dải địa chỉ nội bộ bị chặn'
        : unreachableLoopback
          ? 'AI_BASE_URL trên Vercel đang trỏ localhost/127.0.0.1; hãy đặt API công khai (OpenRouter/Gemini/OpenAI) hoặc bật Khóa riêng (BYOK) trong Cài đặt'
          : !useDirectKey && !poolQuota.allowed
            ? 'Đã đạt giới hạn quota tài khoản dùng chung (AI_ACCOUNT_DAILY_LIMIT / RPM)'
            : 'Chưa cấu hình AI_API_KEY trên máy chủ hoặc khóa BYOK';
    const fallbackOut = buildFallbackResponse(req, config, reason);
    hooks?.onDelta?.(fallbackOut.message);
    hooks?.onStage?.({
      stage: 'checking',
      model: config.model,
      protocol: config.protocol,
    });
    return fallbackOut;
  }

  const systemInstruction = buildModeSystemInstruction(
    intent,
    useAssemblyPlan,
    config.systemPromptSuffix,
    req.systemPrompt
  );
  const temperature = clampTemperature(req.temperature);
  const { userContent, matchedSuggestions } = buildModeUserPrompt(req, intent, useAssemblyPlan);
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (hooks?.signal) {
    if (hooks.signal.aborted) {
      controller.abort();
    } else {
      hooks.signal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }
  const timeout = setTimeout(() => controller.abort(), 45000);
  const streamUpstream = Boolean(hooks?.onDelta);

  try {
    hooks?.onStage?.({
      stage: 'generating',
      model: modelCandidates[0] || config.model,
      protocol: config.protocol,
    });

    let lastError = 'Upstream request failed';
    let parsedResult: StreamParseResult | null = null;
    let structuredOut: AIGenerationOutput | null = null;
    let usedCandidate: PoolCandidate | null = null;
    let usedModelId = modelCandidates[0] || config.model;

    outer: for (let i = 0; i < candidates.length; i += 1) {
      if (controller.signal.aborted) {
        lastError = 'Client disconnected or request aborted';
        break;
      }
      const candidate = candidates[i];
      if (!useDirectKey) {
        const capCheck = checkSharedPoolQuota();
        if (!capCheck.allowed) {
          lastError = 'Đã đạt giới hạn quota tài khoản dùng chung (AI_ACCOUNT_DAILY_LIMIT / RPM)';
          break;
        }
        recordPoolAttempt(candidate.id);
      }

      for (let mIdx = 0; mIdx < modelCandidates.length; mIdx += 1) {
        if (controller.signal.aborted) {
          lastError = 'Client disconnected or request aborted';
          break outer;
        }
        const activeModelId = modelCandidates[mIdx];
        const isFreeModel = activeModelId.endsWith(':free') || activeModelId === 'openrouter/free';
        if (config.isOpenRouter && !isFreeModel && openrouterCreditShortageUntil > Date.now()) {
          continue;
        }

        const attemptConfig: EffectiveAIConfig = { ...config, model: activeModelId };
        try {
          const attempt = await callUpstreamOnce({
            config: attemptConfig,
            apiKey: candidate.rawKey,
            systemInstruction,
            userContent,
            temperature,
            streamUpstream,
            signal: controller.signal,
            maxOutputTokens,
            onDelta: hooks?.onDelta,
          });

          if (attempt.ok && attempt.result.text.trim()) {
            const resolvedModel = attempt.result.actualModel || activeModelId;
            const parsedCandidate = parseStructuredLLMResponse(
              attempt.result.text,
              { ...config, model: resolvedModel },
              attempt.result.tokens,
              useDirectKey ? undefined : candidate.mask,
              {
                intent,
                actualModel: resolvedModel,
                fallbackSuggestions: matchedSuggestions,
              }
            );
            if (parsedCandidate) {
              parsedResult = attempt.result;
              structuredOut = parsedCandidate;
              usedCandidate = candidate;
              usedModelId = resolvedModel;
              if (!useDirectKey) {
                recordPoolSuccess(candidate.id, attempt.result.tokens);
              }
              break outer;
            }
            parsedResult = attempt.result;
            usedCandidate = candidate;
            usedModelId = resolvedModel;
            lastError = 'Upstream response was not in expected multi-file JSON schema';
            if (config.isOpenRouter && mIdx < modelCandidates.length - 1) {
              continue;
            }
            break outer;
          }

          if (attempt.ok) {
            lastError = `Empty response from ${activeModelId}`;
            if (mIdx < modelCandidates.length - 1) continue;
            break;
          }

          lastError = sanitizeErrorText(attempt.error);
          if (config.isOpenRouter && attempt.status === 402) {
            // WHY: Account currently has $0 paid credits on OpenRouter -> cache free-tier window and seamlessly retry free models.
            openrouterCreditShortageUntil = Date.now() + 5 * 60_000;
            if (mIdx < modelCandidates.length - 1) continue;
          }
          if (
            config.isOpenRouter &&
            (attempt.status === 429 || attempt.status === 404 || attempt.status >= 500) &&
            mIdx < modelCandidates.length - 1
          ) {
            continue;
          }
          if (!useDirectKey) {
            recordPoolFailure(candidate.id, attempt.status, lastError);
            if (isFailoverHttpStatus(attempt.status) && i < candidates.length - 1) {
              break;
            }
          }
          break outer;
        } catch (err) {
          const msg = err instanceof Error ? sanitizeErrorText(err.message) : 'Upstream network error';
          lastError = msg;
          if (config.isOpenRouter && !controller.signal.aborted && mIdx < modelCandidates.length - 1) {
            continue;
          }
          if (!useDirectKey) {
            recordPoolFailure(candidate.id, 'network', msg);
            if (!controller.signal.aborted && i < candidates.length - 1) {
              break;
            }
          }
          break outer;
        }
      }
    }

    if (!parsedResult || !usedCandidate) {
      return buildFallbackResponse(req, config, lastError);
    }

    hooks?.onStage?.({
      stage: 'checking',
      model: usedModelId,
      protocol: config.protocol,
    });

    if (!structuredOut) {
      return buildFallbackResponse(
        req,
        { ...config, model: usedModelId },
        lastError || 'Upstream response was not in expected multi-file JSON schema',
        parsedResult.tokens
      );
    }
    return structuredOut;
  } catch (err) {
    const msg = err instanceof Error ? sanitizeErrorText(err.message) : 'Upstream request failed';
    return buildFallbackResponse(req, config, msg);
  } finally {
    clearTimeout(timeout);
    hooks?.signal?.removeEventListener('abort', onExternalAbort);
  }
}

export async function runAIGeneration(
  req: AIChatRequest,
  headers: IncomingHttpHeaders
): Promise<AIGenerationOutput> {
  return runAIGenerationStream(req, headers);
}

export interface LivePoolProbeResult {
  ok: boolean;
  statusCode?: number;
  mode: 'pool' | 'key1' | 'key2' | 'failover_sim' | 'gateway';
  keyId: string;
  keyMask: string;
  mask: string | null;
  attemptedKeys: string[];
  usedKeyMask: string | null;
  model: string;
  protocol: AIProtocol;
  failoverTriggered: boolean;
  latencyMs: number;
  replyPreview: string;
  preview: string;
  tokens: TokenCounter;
  error?: string;
  simulatedPoolSnapshot?: AdminKeyPoolSnapshot;
}

export async function runLiveKeyPoolProbe(input: {
  mode?: 'pool' | 'key1' | 'key2' | 'failover_sim' | 'gateway';
  prompt?: string;
}): Promise<LivePoolProbeResult> {
  const mode = input.mode || 'pool';
  const config = resolveAIConfig({});
  const startedAt = Date.now();
  const attemptedKeys: string[] = [];

  if (mode === 'gateway') {
    resetOpenRouterTierCache();
    const directCandidates: PoolCandidate[] = config.apiKey
      ? [{ id: 'gateway', mask: maskApiKey(config.apiKey), rawKey: config.apiKey }]
      : selectPoolCandidates();
    if (directCandidates.length === 0) {
      return {
        ok: false,
        statusCode: 502,
        mode,
        keyId: '',
        keyMask: '',
        mask: null,
        attemptedKeys,
        usedKeyMask: null,
        model: config.model,
        protocol: config.protocol,
        failoverTriggered: false,
        latencyMs: Date.now() - startedAt,
        replyPreview: '',
        preview: '',
        tokens: emptyTokenCounter(),
        error: 'Chưa cấu hình API key cho Gateway đang chọn.',
      };
    }

    const activeCand = directCandidates[0];
    attemptedKeys.push(activeCand.mask);
    const probeModels = resolveModelCandidates(config, 'assistant');
    const probePrompt = (input.prompt || 'Reply with valid JSON: {"status":"ok","service":"f-forum-gateway"}').trim().slice(0, 400);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let lastError = 'Gateway probe failed';
    let hitFreeFallback = false;

    try {
      for (let mIdx = 0; mIdx < probeModels.length; mIdx += 1) {
        const modelId = probeModels[mIdx];
        const isFreeModel = modelId.endsWith(':free') || modelId === 'openrouter/free';
        if (config.isOpenRouter && !isFreeModel && openrouterCreditShortageUntil > Date.now()) {
          continue;
        }
        const attempt = await callUpstreamOnce({
          config: { ...config, model: modelId },
          apiKey: activeCand.rawKey,
          systemInstruction: 'Reply concisely in valid JSON.',
          userContent: probePrompt,
          temperature: 0,
          streamUpstream: false,
          signal: controller.signal,
          maxOutputTokens: 160,
        });
        if (attempt.ok && attempt.result.text.trim()) {
          const usedModel = attempt.result.actualModel || modelId;
          const noteSuffix = hitFreeFallback ? ' (Tài khoản đang ở gói miễn phí, tự dùng model :free)' : '';
          const replyPreview = sanitizeErrorText(`${attempt.result.text.trim()}${noteSuffix}`);
          return {
            ok: true,
            statusCode: 200,
            mode,
            keyId: activeCand.id,
            keyMask: activeCand.mask,
            mask: activeCand.mask,
            attemptedKeys,
            usedKeyMask: activeCand.mask,
            model: usedModel,
            protocol: config.protocol,
            failoverTriggered: hitFreeFallback,
            latencyMs: Date.now() - startedAt,
            replyPreview,
            preview: replyPreview,
            tokens: attempt.result.tokens,
          };
        }
        if (!attempt.ok) {
          lastError = sanitizeErrorText(attempt.error);
          if (config.isOpenRouter && attempt.status === 402) {
            openrouterCreditShortageUntil = Date.now() + 5 * 60_000;
            hitFreeFallback = true;
            continue;
          }
          if (config.isOpenRouter && (attempt.status === 429 || attempt.status === 404 || attempt.status >= 500)) {
            hitFreeFallback = true;
            continue;
          }
          break;
        }
      }
      return {
        ok: false,
        statusCode: 502,
        mode,
        keyId: activeCand.id,
        keyMask: activeCand.mask,
        mask: activeCand.mask,
        attemptedKeys,
        usedKeyMask: null,
        model: config.model,
        protocol: config.protocol,
        failoverTriggered: hitFreeFallback,
        latencyMs: Date.now() - startedAt,
        replyPreview: '',
        preview: '',
        tokens: emptyTokenCounter(),
        error: lastError,
      };
    } catch (err) {
      return {
        ok: false,
        statusCode: 502,
        mode,
        keyId: activeCand.id,
        keyMask: activeCand.mask,
        mask: activeCand.mask,
        attemptedKeys,
        usedKeyMask: null,
        model: config.model,
        protocol: config.protocol,
        failoverTriggered: hitFreeFallback,
        latencyMs: Date.now() - startedAt,
        replyPreview: '',
        preview: '',
        tokens: emptyTokenCounter(),
        error: err instanceof Error ? sanitizeErrorText(err.message) : 'Gateway network failure',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  const initialQuota = checkSharedPoolQuota();
  if (!initialQuota.allowed) {
    return {
      ok: false,
      statusCode: 429,
      mode,
      keyId: '',
      keyMask: '',
      mask: null,
      attemptedKeys,
      usedKeyMask: null,
      model: config.model,
      protocol: config.protocol,
      failoverTriggered: false,
      latencyMs: Date.now() - startedAt,
      replyPreview: '',
      preview: '',
      tokens: emptyTokenCounter(),
      error:
        initialQuota.reason === 'rpm_limit'
          ? 'Đã đạt giới hạn tốc độ RPM tài khoản pool dùng chung.'
          : 'Đã đạt giới hạn lượt gọi hàng ngày (AI_ACCOUNT_DAILY_LIMIT) tài khoản pool dùng chung.',
    };
  }

  let failoverSimHandle: FailoverSimHandle | null = null;
  if (mode === 'failover_sim') {
    const sim = beginFailoverSim('key-1');
    if (sim) {
      attemptedKeys.push(sim.candidate.mask);
      failoverSimHandle = sim.handle;
    }
  }

  const preferredId = mode === 'key1' ? 'key-1' : mode === 'key2' ? 'key-2' : undefined;
  const candidates = selectPoolCandidates(preferredId);
  if (candidates.length === 0) {
    const simulatedPoolSnapshot = failoverSimHandle
      ? getKeyPoolSnapshot(config.model, config.protocol)
      : undefined;
    if (failoverSimHandle) {
      endFailoverSim(failoverSimHandle);
    }
    return {
      ok: false,
      statusCode: 502,
      mode,
      keyId: '',
      keyMask: '',
      mask: null,
      attemptedKeys,
      usedKeyMask: null,
      model: config.model,
      protocol: config.protocol,
      failoverTriggered: mode === 'failover_sim' || attemptedKeys.length > 1,
      latencyMs: Date.now() - startedAt,
      replyPreview: '',
      preview: '',
      tokens: emptyTokenCounter(),
      error: hasConfiguredPoolKeys()
        ? 'Tất cả key trong pool đang trong thời gian cooldown.'
        : 'No API keys configured in server key pool.',
      simulatedPoolSnapshot,
    };
  }

  const probePrompt = (input.prompt || 'Reply with valid JSON: {"status":"ok","service":"f-forum-pool"}').trim().slice(0, 500);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let lastError = 'Pool probe failed';
  let lastStatusCode = 502;

  try {
    for (let i = 0; i < candidates.length; i += 1) {
      const capCheck = checkSharedPoolQuota();
      if (!capCheck.allowed) {
        lastError =
          capCheck.reason === 'rpm_limit'
            ? 'Đã đạt giới hạn tốc độ RPM tài khoản pool dùng chung.'
            : 'Đã đạt giới hạn lượt gọi hàng ngày (AI_ACCOUNT_DAILY_LIMIT) tài khoản pool dùng chung.';
        lastStatusCode = 429;
        break;
      }
      const candidate = candidates[i];
      if (!attemptedKeys.includes(candidate.mask)) {
        attemptedKeys.push(candidate.mask);
      }
      recordPoolAttempt(candidate.id);
      try {
        const attempt = await callUpstreamOnce({
          config,
          apiKey: candidate.rawKey,
          systemInstruction: 'Respond concisely in valid JSON or plain text.',
          userContent: probePrompt,
          temperature: 0,
          streamUpstream: false,
          signal: controller.signal,
          maxOutputTokens: 256,
        });
        if (attempt.ok) {
          recordPoolSuccess(candidate.id, attempt.result.tokens);
          const replyPreview = sanitizeErrorText(attempt.result.text.trim());
          const simulatedPoolSnapshot = failoverSimHandle
            ? getKeyPoolSnapshot(config.model, config.protocol)
            : undefined;
          return {
            ok: true,
            statusCode: 200,
            mode,
            keyId: candidate.id,
            keyMask: candidate.mask,
            mask: candidate.mask,
            attemptedKeys,
            usedKeyMask: candidate.mask,
            model: config.model,
            protocol: config.protocol,
            failoverTriggered: mode === 'failover_sim' || attemptedKeys.length > 1,
            latencyMs: Date.now() - startedAt,
            replyPreview,
            preview: replyPreview,
            tokens: attempt.result.tokens,
            simulatedPoolSnapshot,
          };
        }
        lastError = sanitizeErrorText(attempt.error);
        recordPoolFailure(candidate.id, attempt.status, lastError);
        if (isFailoverHttpStatus(attempt.status) && i < candidates.length - 1) {
          continue;
        }
        break;
      } catch (err) {
        lastError = err instanceof Error ? sanitizeErrorText(err.message) : 'Network failure';
        recordPoolFailure(candidate.id, 'network', lastError);
        if (i < candidates.length - 1) continue;
        break;
      }
    }

    const simulatedPoolSnapshot = failoverSimHandle
      ? getKeyPoolSnapshot(config.model, config.protocol)
      : undefined;
    return {
      ok: false,
      statusCode: lastStatusCode,
      mode,
      keyId: '',
      keyMask: '',
      mask: null,
      attemptedKeys,
      usedKeyMask: null,
      model: config.model,
      protocol: config.protocol,
      failoverTriggered: mode === 'failover_sim' || attemptedKeys.length > 1,
      latencyMs: Date.now() - startedAt,
      replyPreview: '',
      preview: '',
      tokens: emptyTokenCounter(),
      error: lastError,
      simulatedPoolSnapshot,
    };
  } finally {
    clearTimeout(timeout);
    if (failoverSimHandle) {
      endFailoverSim(failoverSimHandle);
    }
  }
}
