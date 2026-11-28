import dns from 'node:dns/promises';
import type { IncomingHttpHeaders } from 'node:http';
import net from 'node:net';
import type {
  AIChatRequest,
  AIProtocol,
  AttachedContextItem,
  FilePatchOp,
  PublicAiRuntimeInfo,
  SuggestedVaultItem,
  WorkspaceAssemblyPlan,
} from '../src/types/index';
import {
  getInternalAdminDedicatedGateway,
  getInternalGatewayOverride,
} from './adminStore.js';
import {
  classifyWorkspaceIntent,
  detectMasterpieceAnchor,
  estimateTokensCostUsd,
  FFORUM_COMPACT_KNOWLEDGE,
  GEMINI_MODELS,
  OPENROUTER_FREE_FALLBACK_CHAIN,
  OPENROUTER_MODELS,
  OPENROUTER_PAID_BUILD_CHAIN,
  OPENROUTER_PAID_CHAT_CHAIN,
  searchVaultKnowledge,
  selectMotionRecipesForPrompt,
  selectVaultBlueprintsForBuild,
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
  isAdmin?: boolean;
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
  isAdminDedicated?: boolean;
  allowCustomModels?: boolean;
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

const ADMIN_OPENROUTER_MODELS = [
  { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2 (Admin)', tier: 'balanced' as const },
  { id: 'qwen/qwen3-coder-next', label: 'Qwen3 Coder Next (Admin)', tier: 'balanced' as const },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (Admin)', tier: 'balanced' as const },
  { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (Admin)', tier: 'balanced' as const },
  { id: 'openrouter/auto-smart', label: 'Tự động thông minh', tier: 'auto' as const },
  { id: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B (Miễn phí)', tier: 'free' as const },
];

let openrouterCreditShortageUntil = 0;

export function resetOpenRouterTierCache(): void {
  openrouterCreditShortageUntil = 0;
}

export function getPublicAiRuntimeInfo(options?: { isAdmin?: boolean }): PublicAiRuntimeInfo {
  ensureLocalEnvLoaded();
  if (options?.isAdmin === true) {
    const adminGw = getInternalAdminDedicatedGateway();
    if (adminGw.enabled) {
      const baseUrlLower = (adminGw.baseUrl || '').toLowerCase();
      const isOr = adminGw.preset === 'openrouter' || baseUrlLower.includes('openrouter.ai');
      const availableModels = isOr
        ? ADMIN_OPENROUTER_MODELS.map((m) => ({ ...m }))
        : [{ id: adminGw.model, label: adminGw.model, tier: 'balanced' as const }];
      for (const extra of [adminGw.model, adminGw.buildModel, adminGw.chatModel]) {
        const clean = (extra || '').trim();
        if (clean && !availableModels.some((m) => m.id === clean)) {
          availableModels.unshift({ id: clean, label: clean, tier: 'balanced' });
        }
      }
      return {
        activeProfile: isOr ? 'openrouter' : 'custom',
        protocol: adminGw.protocol,
        defaultModel: adminGw.model || availableModels[0]?.id || 'deepseek/deepseek-v3.2',
        availableModels,
        isAdminDedicated: true,
      };
    }
  }

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
  requestedModel?: string,
  options?: { isAdmin?: boolean; forceAdminGateway?: boolean }
): EffectiveAIConfig {
  ensureLocalEnvLoaded();
  const adminOverride = getInternalGatewayOverride();
  const adminDedicated = getInternalAdminDedicatedGateway();
  const useAdminDedicated = Boolean(
    options?.forceAdminGateway || (options?.isAdmin && adminDedicated.enabled)
  );

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
  let allowCustomModels = false;

  if (useAdminDedicated) {
    protocol = adminDedicated.protocol;
    baseUrl = adminDedicated.baseUrl || baseUrl;
    model = adminDedicated.model || model;
    chatModel = adminDedicated.chatModel;
    buildModel = adminDedicated.buildModel;
    maxOutputTokens = adminDedicated.maxOutputTokens ?? adminOverride.maxOutputTokens;
    if (adminDedicated.apiKey) {
      apiKey = adminDedicated.apiKey;
      usingAdminKey = true;
    }
    systemPromptSuffix = adminOverride.systemPromptSuffix || '';
    allowCustomModels = true;
  } else if (adminOverride.enabled) {
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
    if (allowCustomModels || !adminOverride.enabled) {
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
    allowCustomModels = true;
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
    isAdminDedicated: useAdminDedicated && !usingByok,
    allowCustomModels,
  };
}

function resolveModelCandidates(config: EffectiveAIConfig, intent: WorkspaceIntent): string[] {
  if (!config.isOpenRouter) {
    if (
      config.protocol === 'gemini' &&
      config.baseUrl.toLowerCase().includes('googleapis.com') &&
      intent === 'assemble'
    ) {
      return Array.from(new Set([config.model, 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].filter(Boolean)));
    }
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

function resolveModeMaxTokens(config: EffectiveAIConfig, intent: WorkspaceIntent): number {
  const adminCap = config.maxOutputTokens;
  if (intent === 'assistant') {
    return adminCap ? Math.min(adminCap, 1400) : 1400;
  }
  if (intent === 'patch') {
    return adminCap ? Math.min(Math.max(adminCap, 4096), 6144) : 5200;
  }
  // WHY: Bespoke multi-file CSS+HTML+JS builds need 12288-16384 tokens so all XML <file> blocks finish without mid-file truncation.
  return adminCap ? Math.min(Math.max(adminCap, 8192), 16384) : 16384;
}

function buildModeSystemInstruction(
  intent: WorkspaceIntent,
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
      '2. When the user asks to find components/templates/effects, pick the most relevant entries from MATCHED VAULT CANDIDATES and return them in suggestedResources so the user can click to build with them.',
      '3. NEVER generate HTML/CSS/JS files in assistant mode (keep "files":[]). Keep replies crisp, accurate, zero hype, zero emojis.',
    ].join('\n');
  } else if (intent === 'patch') {
    base = [
      'You are an elite Frontend Engineer inside F-Forum Studio performing targeted edits or runtime bug fixes on an existing web project.',
      'OUTPUT FORMAT (STRICT — DO NOT wrap XML tags inside markdown ``` code fences!):',
      '<summary>1-2 câu tiếng Việt mô tả chính xác phần vừa chỉnh sửa hoặc lỗi vừa khắc phục.</summary>',
      'For surgical edits, emit one or more <patch> blocks:',
      '<patch path="src/styles.css">',
      '<find>exact existing lines copied verbatim from CURRENT WORKSPACE FILES</find>',
      '<replace>updated replacement lines</replace>',
      '</patch>',
      'OR for broader rewrites of a specific file, emit ONLY the changed <file path="...">...</file> blocks.',
      'RULES:',
      '1. ONLY touch files needed for the user edit or error fix — preserve existing brand identity, layout, and working code in untouched files.',
      '2. Inside <find>, match the EXACT text from CURRENT WORKSPACE FILES. If unsure of exact whitespace, output the complete updated <file path="...">...</file> instead.',
      '3. Maintain contrast >= 4.5:1, responsive 390px / 768px / 1440px, full Vietnamese diacritics, zero emojis, zero console errors, zero dead href="#" links.',
    ].join('\n');
  } else {
    base = [
      'You are an elite Frontend Architect and Creative Technologist inside F-Forum Studio.',
      'Your mission: design and assemble a COMPLETE, COHESIVE, PRODUCTION-QUALITY multi-file website tailored 100% to the USER PROMPT by genuinely adapting and harmonizing the provided F-Forum Vault modules and Source of Knowledge motion recipes.',
      'OUTPUT FORMAT (STRICT — DO NOT wrap XML tags inside markdown ``` code fences! Always emit ALL 3 files: index.html, src/styles.css, and src/app.js):',
      '<summary>1-2 câu tiếng Việt súc tích mô tả phong cách thiết kế, bảng màu, bố cục, mẫu Vault và công thức chuyển động vừa lắp ghép.</summary>',
      '<file path="index.html">',
      'Complete, concise standalone HTML5 document (~110-200 lines) linking src/styles.css and src/app.js (plus Google Fonts fitting the brand with full Vietnamese diacritics, e.g. Be Vietnam Pro + Fraunces, Manrope + Newsreader, or Plus Jakarta Sans + IBM Plex Mono). Build 4-6 real sections (Header/Nav, Bespoke Hero with compact SVG/Canvas visual, Interactive Cards/Bento, Interactive Domain Widget/Calculator/Filter/Tabs, Showcase/Timeline, Contact/Quote/Booking Form, Footer). Tag adapted Vault sections with data-vault-id="<id>" and the applied Knowledge motion recipe with data-knowledge-recipe="<recipe-id>". Keep inline SVGs crisp & compact (<= 14 geometric primitives with explicit width/height/viewBox — NEVER dump multi-kilobyte SVG path walls).',
      '</file>',
      '<file path="src/styles.css">',
      'Complete unified CSS (~110-220 lines): ALWAYS include *, *::before, *::after { box-sizing: border-box; } and a { color: inherit; text-decoration: none; }, :root tokens, expressive typography scale, contrast >= 4.5:1, harmonized styles adapted from the provided Vault modules and Knowledge motion recipe, explicit SVG sizing limits, responsive @media for 390px / 768px / 1440px, focus-visible outlines, and @media (prefers-reduced-motion: reduce). NEVER wrap CSS in <style> tags.',
      '</file>',
      '<file path="src/app.js">',
      'REQUIRED working interactive JavaScript (~50-130 lines) implementing genuine product logic (tabs, filters, sliders, calculators, day/night toggles, interactive Canvas/SVG updates, drawers, validated forms, and fail-safe motion recipe behavior) with ZERO runtime errors. Output pure JS ONLY — NEVER include <script> or </script> tags inside src/app.js.',
      '</file>',
      'If the USER PROMPT explicitly asks for React / TSX / JSX, instead output <file path="src/App.tsx"> (importing only from "react") and <file path="src/styles.css">.',
      'CRAFT & ANTI-SLOP MANDATES:',
      '1. GENUINE VAULT + KNOWLEDGE INTEGRATION: Study ATTACHED VAULT BLUEPRINTS and KNOWLEDGE MOTION RECIPES. Adapt at least 2-3 Vault modules (CSS structure + interactive HTML/JS behavior, marked with data-vault-id="...") and 1-2 Knowledge motion recipes (marked with data-knowledge-recipe="...") directly into the page, translating 100% of labels and data into natural Vietnamese matching the prompt.',
      '2. FORBIDDEN AI SLOP DEFAULTS: NEVER use #0a0a0f + #00d4aa + Inter generic dark boilerplate, NEVER output a 1-section stub, NEVER omit src/app.js, and NEVER emit generic quiz/clay-vase sections unless requested.',
      '3. THEME INTENT RESPECT: If the prompt asks for light/minimal/paper/ceramic/lookbook/clean, build a refined warm-ivory/porcelain Light Mode (#f6f3ec-#faf9f6). If dark/solar/space/3D/runtime, build a deep mineral obsidian/basalt Dark Mode with intentional domain accent.',
      '4. ZERO BROKEN EXTERNAL IMAGES OR EMPTY BOXES: Never invent fake external image URLs (unsplash, picsum). Craft crisp inline SVGs, CSS architectural compositions, or interactive UI widgets that render visibly in HTML/CSS immediately (never leave an empty white box waiting on JS).',
      '5. IMMEDIATE FIRST-PAINT VISIBILITY: Never hide body, hero, or primary sections at opacity: 0 behind preloaders or JS-gated scroll reveals — above-the-fold UI must be immediately visible on load.',
      '6. CLEAN POLISH: Full Vietnamese diacritics, zero emojis in UI, zero dummy filler, zero literal "\\n" escapes, zero dead href="#" links.',
    ].join('\n');
  }

  const session = intent === 'assistant' ? '' : sessionInstructions.trim().slice(0, 900);
  return [base, suffix, session ? `SESSION INSTRUCTIONS (do not override output format):\n${session}` : '']
    .filter(Boolean)
    .join('\n');
}

function clampTemperature(value: number | undefined, intent: WorkspaceIntent = 'assemble'): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(1.2, Math.max(0, value));
  }
  if (intent === 'assemble') return 0.55;
  if (intent === 'patch') return 0.25;
  return 0.2;
}

function buildModeUserPrompt(
  req: AIChatRequest,
  intent: WorkspaceIntent
): { userContent: string; matchedSuggestions: SuggestedVaultItem[] } {
  const serverVaultHits =
    intent === 'assistant' ? searchVaultKnowledge(req.prompt, 6) : [];
  const matchedSuggestions: SuggestedVaultItem[] =
    serverVaultHits.length > 0
      ? serverVaultHits
      : intent === 'assistant' && Array.isArray(req.attachedItems)
        ? req.attachedItems.slice(0, 5).map((item) => ({
            id: item.id,
            title: item.title,
            library: 'vault',
            reason: String(item.summary || '').slice(0, 120),
          }))
        : [];

  const recentHistory = (req.history || [])
    .slice(-4)
    .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content.slice(0, 320)}`)
    .join('\n');

  if (intent === 'assistant') {
    const candidateLines = matchedSuggestions
      .map((s) => `- [${s.library}] ${s.title} (id: ${s.id}) — ${s.reason}`)
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

  const attachedLimit = intent === 'patch' ? 1 : 9;
  const attachedCharCap = intent === 'patch' ? 1000 : 2400;
  const fileLimit = intent === 'patch' ? 5 : 3;
  const fileCharCap = intent === 'patch' ? 7500 : 4000;

  let effectiveAttached: AttachedContextItem[] = Array.isArray(req.attachedItems)
    ? req.attachedItems.slice(0, attachedLimit)
    : [];

  // WHY: If a direct API caller omits attached Vault blueprints during assemble, hydrate real Vault + Knowledge blueprints on the server.
  if (intent === 'assemble' && effectiveAttached.length === 0) {
    const serverBuild = selectVaultBlueprintsForBuild(req.prompt, { limit: 4 });
    const serverRecipes = selectMotionRecipesForPrompt(req.prompt, { count: 2 });
    const generatedAttached: AttachedContextItem[] = [];
    if (serverBuild.anchor) {
      generatedAttached.push({
        id: serverBuild.anchor.id,
        kind: 'blueprint',
        title: `MASTERPIECE ANCHOR: ${serverBuild.anchor.title} (${serverBuild.anchor.slug})`,
        sourceLibrary: 'motionsites',
        summary: serverBuild.anchor.promptText.slice(0, 1400),
        payload: serverBuild.anchor.css ? serverBuild.anchor.css.slice(0, 700) : undefined,
      });
    } else {
      const anchorHint = detectMasterpieceAnchor(req.prompt);
      if (anchorHint) {
        generatedAttached.push({
          id: anchorHint.id,
          kind: 'blueprint',
          title: `MASTERPIECE ANCHOR: ${anchorHint.title} (${anchorHint.slug})`,
          sourceLibrary: 'motionsites',
          summary: anchorHint.promptText.slice(0, 1400),
          payload: anchorHint.css ? anchorHint.css.slice(0, 700) : undefined,
        });
      }
    }
    for (const bp of serverBuild.blueprints) {
      const codeParts = [
        `Library: ${bp.library} · Role: ${bp.role} · Reason: ${bp.reason}`,
        bp.html ? `HTML:\n${bp.html.slice(0, 700)}` : '',
        bp.css ? `CSS:\n${bp.css.slice(0, 800)}` : '',
        bp.js ? `JS:\n${bp.js.slice(0, 500)}` : '',
      ].filter(Boolean);
      generatedAttached.push({
        id: bp.id,
        kind: 'resource',
        title: `${bp.title} [${bp.library}] (data-vault-id="${bp.id}")`,
        sourceLibrary: bp.library,
        summary: codeParts.join('\n'),
      });
    }
    for (const rec of serverRecipes) {
      generatedAttached.push({
        id: rec.id,
        kind: 'template',
        title: `KNOWLEDGE MOTION RECIPE: ${rec.title} (data-knowledge-recipe="${rec.id}")`,
        summary: `Category: ${rec.category} · Use when: ${rec.useWhen}\nCode (${rec.lang}):\n${rec.code.slice(0, 800)}`,
      });
    }
    effectiveAttached = generatedAttached.slice(0, attachedLimit);
  }

  const attachedSummary = effectiveAttached
    .map((item: AttachedContextItem) => {
      const baseText = String(item.summary || '').slice(0, attachedCharCap);
      const extraPayload = item.payload ? `\nCSS/Spec:\n${String(item.payload).slice(0, 700)}` : '';
      return `- [${item.kind}] ${item.title} (id: ${item.id}):\n${baseText}${extraPayload}`;
    })
    .join('\n\n');
  const existingFiles = (req.files || [])
    .filter((f) => f.path !== 'metadata.json' && f.path !== 'README.md')
    .slice(0, fileLimit)
    .map((f) => `FILE: ${f.path}\n${f.content.slice(0, fileCharCap)}`)
    .join('\n\n');

  const userContent = [
    recentHistory ? `RECENT CHAT:\n${recentHistory}` : '',
    `USER PROMPT:\n${req.prompt}`,
    attachedSummary
      ? `ATTACHED VAULT BLUEPRINTS & KNOWLEDGE MOTION RECIPES (MUST adapt into data-vault-id / data-knowledge-recipe sections & src/styles.css + src/app.js):\n${attachedSummary}`
      : '',
    existingFiles ? `CURRENT WORKSPACE FILES:\n${existingFiles}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return { userContent, matchedSuggestions };
}

function buildFallbackResponse(
  _req: AIChatRequest,
  config: EffectiveAIConfig,
  upstreamError: string,
  tokens?: TokenCounter
): AIGenerationOutput {
  const keyMissing = !config.apiKey && !hasConfiguredPoolKeys();
  const message = keyMissing
    ? 'Chưa kết nối khóa AI. Mở mục API Key ngay trong khung Chat để nhập khóa riêng (OpenRouter / Gemini / OpenAI / DeepSeek) hoặc liên hệ quản trị viên.'
    : `Kết nối AI tạm gián đoạn (${upstreamError}). Vui lòng bấm Thử lại hoặc đổi sang model khác trong danh sách.`;

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

function normalizeArtifactPath(rawPath: string): string {
  return String(rawPath || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/^\/+/, '');
}

function stripOuterCodeFences(rawContent: string): string {
  let clean = rawContent.replace(/^\r?\n/, '').replace(/\r?\n$/, '');
  const fencedMatch = clean.match(/^```[a-z0-9_-]*\r?\n([\s\S]*?)\r?\n```$/i);
  if (fencedMatch) {
    clean = fencedMatch[1];
  }
  return unescapeDoubleEncodedCode(clean);
}

function sanitizeExtractedFileContent(filePath: string, rawContent: string): string {
  const lower = filePath.toLowerCase();
  let clean = stripOuterCodeFences(rawContent);
  if (/\.(js|mjs|ts|tsx|jsx)$/i.test(lower)) {
    clean = clean
      .replace(/^\s*<script\b[^>]*>\s*/i, '')
      .replace(/\s*<\/script>\s*$/i, '')
      .replace(/^\s*<\/?script\b[^>]*>\s*$/gim, '');
  } else if (/\.css$/i.test(lower)) {
    clean = clean
      .replace(/^\s*<style\b[^>]*>\s*/i, '')
      .replace(/\s*<\/style>\s*$/i, '')
      .replace(/^\s*<\/?style\b[^>]*>\s*$/gim, '');
  }
  return clean;
}

export interface ParsedXmlArtifact {
  summary: string;
  files: Array<{ path: string; content: string; summary: string }>;
  patches: FilePatchOp[];
}

export function parseXmlArtifactBlocks(rawText: string): ParsedXmlArtifact | null {
  if (!rawText || (!rawText.includes('<file') && !rawText.includes('<patch'))) {
    return null;
  }

  const summaryMatch = rawText.match(/<summary>([\s\S]*?)<\/summary>/i);
  const summary = summaryMatch
    ? summaryMatch[1].replace(/\s+/g, ' ').trim().slice(0, 1200)
    : '';

  const files: Array<{ path: string; content: string; summary: string }> = [];
  const fileMap = new Map<string, number>();
  const fileRegex = /<file\s+[^>]*path=["']([^"']+)["'][^>]*>([\s\S]*?)<\/file>/gi;
  let lastClosedEnd = 0;
  let match: RegExpExecArray | null;

  while ((match = fileRegex.exec(rawText)) !== null) {
    lastClosedEnd = match.index + match[0].length;
    const safePath = normalizeArtifactPath(match[1]);
    if (!safePath || safePath.includes('..')) continue;
    const content = sanitizeExtractedFileContent(safePath, match[2]);
    if (!content.trim()) continue;
    const entry = {
      path: safePath,
      content,
      summary: `AI tự viết ${safePath}`,
    };
    const existingIdx = fileMap.get(safePath);
    if (existingIdx !== undefined) {
      files[existingIdx] = entry;
    } else {
      fileMap.set(safePath, files.length);
      files.push(entry);
    }
  }

  // WHY: Recover a trailing unclosed <file> if an upstream model hit output token ceiling right before </file>.
  const trailingTail = rawText.slice(lastClosedEnd);
  const unclosedMatch = trailingTail.match(/<file\s+[^>]*path=["']([^"']+)["'][^>]*>([\s\S]+)$/i);
  if (unclosedMatch) {
    const safePath = normalizeArtifactPath(unclosedMatch[1]);
    const content = sanitizeExtractedFileContent(safePath, unclosedMatch[2]);
    if (safePath && !safePath.includes('..') && content.trim().length >= 80 && !fileMap.has(safePath)) {
      files.push({
        path: safePath,
        content,
        summary: `AI tự viết ${safePath}`,
      });
    }
  }

  const patches: FilePatchOp[] = [];
  const patchRegex =
    /<patch\s+[^>]*path=["']([^"']+)["'][^>]*>[\s\S]*?<find>([\s\S]*?)<\/find>[\s\S]*?<replace>([\s\S]*?)<\/replace>[\s\S]*?<\/patch>/gi;
  while ((match = patchRegex.exec(rawText)) !== null) {
    const safePath = normalizeArtifactPath(match[1]);
    if (!safePath || safePath.includes('..')) continue;
    const findText = stripOuterCodeFences(match[2]);
    const replaceText = stripOuterCodeFences(match[3]);
    if (!findText) continue;
    patches.push({
      path: safePath,
      find: findText,
      replace: replaceText,
    });
  }

  if (files.length === 0 && patches.length === 0) {
    return null;
  }

  return { summary, files, patches };
}

function hasValidAssembleEntry(files: Array<{ path: string; content: string }>): boolean {
  return files.some((f) => {
    const p = f.path.toLowerCase();
    const c = f.content.trim();
    if (p === 'index.html' || p === 'index.htm') {
      return c.length >= 30 && /<[a-z]/i.test(c);
    }
    if (/(?:^|\/)app\.(tsx|jsx)$/i.test(p)) {
      return c.length >= 40;
    }
    return false;
  });
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

  if (options?.intent !== 'assistant') {
    const xmlParsed = parseXmlArtifactBlocks(rawText);
    if (xmlParsed) {
      if (xmlParsed.patches.length > 0) {
        return {
          message: xmlParsed.summary || 'Đã cập nhật chính xác phần mã nguồn theo yêu cầu.',
          mode: 'patch',
          files: xmlParsed.files,
          patches: xmlParsed.patches,
          checksHint: ['XML incremental patch verified'],
          fallback: false,
          modelUsed,
          protocolUsed: config.protocol,
          tokens,
          estimatedCostUsd,
          usedKeyMask,
        };
      }
      if (
        xmlParsed.files.length > 0 &&
        (options?.intent !== 'assemble' || hasValidAssembleEntry(xmlParsed.files))
      ) {
        return {
          message: xmlParsed.summary || `Đã tự thiết kế và lập trình ${xmlParsed.files.length} tệp nguồn mới.`,
          mode: 'files',
          files: xmlParsed.files,
          checksHint: ['Bespoke multi-file XML artifact verified'],
          fallback: false,
          modelUsed,
          protocolUsed: config.protocol,
          tokens,
          estimatedCostUsd,
          usedKeyMask,
        };
      }
    }
  }

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

    // WHY: Rescue complete standalone HTML documents when a model responds with raw HTML instead of XML <file> tags.
    const rawHtmlMatch = rawText.match(/<!DOCTYPE\s+html[\s\S]*?<\/html>/i);
    if (options?.intent !== 'assistant' && rawHtmlMatch && rawHtmlMatch[0].length >= 250) {
      return {
        message: 'Đã tự thiết kế và lập trình giao diện theo yêu cầu.',
        mode: 'files',
        files: [
          {
            path: 'index.html',
            content: unescapeDoubleEncodedCode(rawHtmlMatch[0]),
            summary: 'AI tự viết index.html',
          },
        ],
        checksHint: ['Standalone HTML artifact verified'],
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

    if (
      validFiles.length > 0 &&
      (options?.intent !== 'assemble' || hasValidAssembleEntry(validFiles))
    ) {
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

function shouldDisableOpenRouterReasoning(modelId: string): boolean {
  const m = (modelId || '').toLowerCase();
  if (!m) return false;
  if (/deepseek-v3\.2|deepseek-r1|gemini-2\.5-pro|claude-|\/o1\b|\/o3\b|\/o4\b|reasoner|thinking/.test(m)) {
    return false;
  }
  return /nemotron|ernie|gemma-4|qwen3-coder|flash-lite|openrouter\/free/.test(m);
}

async function callUpstreamOnce(params: {
  config: EffectiveAIConfig;
  apiKey: string;
  systemInstruction: string;
  userContent: string;
  temperature: number;
  streamUpstream: boolean;
  expectJson?: boolean;
  disableReasoning?: boolean;
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
    if (!streamUpstream && params.expectJson) {
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
    max_tokens: params.maxOutputTokens || 8192,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userContent },
    ],
    temperature,
  };
  if (config.isOpenRouter) {
    openAiPayload.stream_options = { include_usage: true };
    if (params.disableReasoning !== false && shouldDisableOpenRouterReasoning(config.model)) {
      // WHY: Disabling optional thinking tokens on fast models cuts TTFT without breaking mandatory-reasoning endpoints.
      openAiPayload.reasoning = { enabled: false };
    }
  }
  let resp = await fetchWithRetry(url, {
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
    if (
      config.isOpenRouter &&
      resp.status === 400 &&
      openAiPayload.reasoning &&
      /reasoning|cannot be disabled/i.test(errBody)
    ) {
      delete openAiPayload.reasoning;
      resp = await fetchWithRetry(url, {
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
        const retryErrBody = await resp.text();
        return {
          ok: false,
          status: resp.status,
          error: `OpenAI-Compatible HTTP ${resp.status}: ${formatUpstreamErrBody(retryErrBody)}`,
        };
      }
      return { ok: true, result: await readOpenAICompatibleStream(resp, params.onDelta) };
    }
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
  const config = resolveAIConfig(headers, req.model, { isAdmin: hooks?.isAdmin });
  const hasExistingFiles = Array.isArray(req.files)
    && req.files.some((f) => f.path !== 'metadata.json' && f.path !== 'README.md');
  const intent = classifyWorkspaceIntent(req.prompt || '', hasExistingFiles, req.intent || req.agentMode);
  const modelCandidates = resolveModelCandidates(config, intent);
  const maxOutputTokens = resolveModeMaxTokens(config, intent);

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
    config.systemPromptSuffix,
    req.systemPrompt
  );
  const temperature = clampTemperature(req.temperature, intent);
  const { userContent, matchedSuggestions } = buildModeUserPrompt(req, intent);
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (hooks?.signal) {
    if (hooks.signal.aborted) {
      controller.abort();
    } else {
      hooks.signal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }
  const hardTimeoutMs = intent === 'assistant' ? 45_000 : runningOnCloud ? 115_000 : 150_000;
  const idleTimeoutMs = intent === 'assistant' ? 28_000 : 38_000;
  let timedOutReason = '';
  const timeout = setTimeout(() => {
    timedOutReason = `Quá thời gian chờ phản hồi AI (${Math.round(hardTimeoutMs / 1000)}s)`;
    controller.abort();
  }, hardTimeoutMs);
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      timedOutReason = 'Luồng AI ngừng truyền dữ liệu giữa chừng';
      controller.abort();
    }, idleTimeoutMs);
  };
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
        lastError = timedOutReason || 'Client disconnected or request aborted';
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
          lastError = timedOutReason || 'Client disconnected or request aborted';
          break outer;
        }
        const activeModelId = modelCandidates[mIdx];
        const isFreeModel = activeModelId.endsWith(':free') || activeModelId === 'openrouter/free';
        if (config.isOpenRouter && !isFreeModel && openrouterCreditShortageUntil > Date.now()) {
          continue;
        }

        if (mIdx > 0) {
          hooks?.onStage?.({
            stage: 'generating',
            model: activeModelId,
            protocol: config.protocol,
            detail: 'retry-reset',
          });
        }

        const attemptConfig: EffectiveAIConfig = { ...config, model: activeModelId };
        const attemptController = new AbortController();
        const forwardAbort = () => attemptController.abort();
        controller.signal.addEventListener('abort', forwardAbort, { once: true });
        let receivedFirstToken = false;
        let firstTokenStalled = false;
        const canFailoverModel = config.isOpenRouter && mIdx < modelCandidates.length - 1;
        const stallTimer = canFailoverModel
          ? setTimeout(() => {
              if (!receivedFirstToken) {
                firstTokenStalled = true;
                attemptController.abort();
              }
            }, 18_000)
          : null;
        try {
          resetIdleTimer();
          const attempt = await callUpstreamOnce({
            config: attemptConfig,
            apiKey: candidate.rawKey,
            systemInstruction,
            userContent,
            temperature,
            streamUpstream,
            expectJson: intent === 'assistant',
            signal: attemptController.signal,
            maxOutputTokens,
            onDelta: (chunk) => {
              if (chunk) resetIdleTimer();
              if (!receivedFirstToken && chunk.trim()) {
                receivedFirstToken = true;
                if (stallTimer) clearTimeout(stallTimer);
              }
              hooks?.onDelta?.(chunk);
            },
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
            lastError = 'Phản hồi từ model AI chưa có tệp khởi chạy hợp lệ (index.html / src/App.tsx)';
            if (mIdx < modelCandidates.length - 1) {
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
            (attempt.status === 400 || attempt.status === 429 || attempt.status === 404 || attempt.status >= 500) &&
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
          const msg = firstTokenStalled
            ? `Model ${activeModelId} phản hồi chậm quá 18s`
            : timedOutReason
              ? timedOutReason
              : err instanceof Error
                ? sanitizeErrorText(err.message)
                : 'Upstream network error';
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
        } finally {
          if (stallTimer) clearTimeout(stallTimer);
          controller.signal.removeEventListener('abort', forwardAbort);
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
    const msg = timedOutReason || (err instanceof Error ? sanitizeErrorText(err.message) : 'Upstream request failed');
    return buildFallbackResponse(req, config, msg);
  } finally {
    clearTimeout(timeout);
    if (idleTimer) clearTimeout(idleTimer);
    hooks?.signal?.removeEventListener('abort', onExternalAbort);
  }
}

export async function runAIGeneration(
  req: AIChatRequest,
  headers: IncomingHttpHeaders,
  options?: { isAdmin?: boolean }
): Promise<AIGenerationOutput> {
  return runAIGenerationStream(req, headers, { isAdmin: options?.isAdmin });
}

export interface LivePoolProbeResult {
  ok: boolean;
  statusCode?: number;
  mode: 'pool' | 'key1' | 'key2' | 'failover_sim' | 'gateway';
  target?: 'public' | 'admin';
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
  target?: 'public' | 'admin';
  prompt?: string;
}): Promise<LivePoolProbeResult> {
  const mode = input.mode || 'pool';
  const target = input.target === 'admin' ? 'admin' : 'public';
  const config = resolveAIConfig(
    {},
    undefined,
    mode === 'gateway' && target === 'admin' ? { forceAdminGateway: true } : undefined
  );
  const startedAt = Date.now();
  const attemptedKeys: string[] = [];

  if (mode === 'gateway') {
    resetOpenRouterTierCache();
    const allowLocalTest = isAllowLocalTestUpstream();
    const urlCheck = validateUpstreamBaseUrl(config.baseUrl, { allowLocalTest });
    const dnsSafe = urlCheck.ok ? await verifyUpstreamHostDns(urlCheck.hostname, allowLocalTest) : false;
    if (!urlCheck.ok || !dnsSafe) {
      return {
        ok: false,
        statusCode: 400,
        mode,
        target,
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
        error: !urlCheck.ok ? urlCheck.error : 'Hostname máy chủ AI phân giải về dải địa chỉ nội bộ bị chặn.',
      };
    }

    const directCandidates: PoolCandidate[] = config.apiKey
      ? [{ id: target === 'admin' ? 'admin-gateway' : 'gateway', mask: maskApiKey(config.apiKey), rawKey: config.apiKey }]
      : target === 'admin'
        ? []
        : selectPoolCandidates();
    if (directCandidates.length === 0) {
      return {
        ok: false,
        statusCode: 502,
        mode,
        target,
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
          target === 'admin'
            ? 'Chưa cấu hình API key cho Cổng AI riêng của Admin.'
            : 'Chưa cấu hình API key cho Gateway đang chọn.',
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
            target,
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
          if (
            config.isOpenRouter &&
            (attempt.status === 400 || attempt.status === 429 || attempt.status === 404 || attempt.status >= 500)
          ) {
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
        target,
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
        target,
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
