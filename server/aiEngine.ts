import dns from 'node:dns/promises';
import fs from 'node:fs';
import type { IncomingHttpHeaders } from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AIChatRequest, AIProtocol, AttachedContextItem } from '../src/types/index';
import { getInternalGatewayOverride } from './adminStore.js';
import {
  beginFailoverSim,
  checkSharedPoolQuota,
  endFailoverSim,
  getKeyPoolSnapshot,
  hasConfiguredPoolKeys,
  isFailoverHttpStatus,
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
  files: Array<{
    path: string;
    content: string;
    summary: string;
  }>;
  checksHint: string[];
  fallback: boolean;
  upstreamError?: string;
  modelUsed: string;
  protocolUsed: AIProtocol;
  tokens?: TokenCounter;
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
  apiKey: string;
  systemPromptSuffix: string;
  usingByok: boolean;
  usingAdminKey: boolean;
}

function normalizeProtocol(val: string | undefined): AIProtocol {
  if (val === 'anthropic' || val === 'gemini') return val;
  return 'openai-compatible';
}

const SERVER_GEMINI_MODEL_ALLOWLIST = new Set([
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
]);

export function resolveAIConfig(
  headers: IncomingHttpHeaders,
  requestedModel?: string
): EffectiveAIConfig {
  ensureLocalEnvLoaded();
  const adminOverride = getInternalGatewayOverride();

  let protocol: AIProtocol = normalizeProtocol(process.env.AI_PROTOCOL);
  let baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').trim();
  let model = (process.env.AI_MODEL || 'studio-smart-route').trim();
  let apiKey = (process.env.AI_API_KEY || '').trim();
  let systemPromptSuffix = '';
  let usingByok = false;
  let usingAdminKey = false;

  if (adminOverride.enabled) {
    protocol = adminOverride.protocol;
    baseUrl = adminOverride.baseUrl || baseUrl;
    model = adminOverride.model || model;
    if (adminOverride.apiKey) {
      apiKey = adminOverride.apiKey;
      usingAdminKey = true;
    }
    systemPromptSuffix = adminOverride.systemPromptSuffix || '';
  }

  const cleanRequested = (requestedModel || '').trim();
  if (cleanRequested && cleanRequested !== 'auto') {
    if (!adminOverride.enabled) {
      model = cleanRequested;
    } else if (protocol === 'gemini' && SERVER_GEMINI_MODEL_ALLOWLIST.has(cleanRequested)) {
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

  return {
    protocol,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    model,
    apiKey,
    systemPromptSuffix,
    usingByok,
    usingAdminKey,
  };
}

function buildSystemInstruction(suffix: string, sessionInstructions = ''): string {
  const base = [
    'You are the F-FORUM v3 Vault-Grounded Web Assembly Engine.',
    'Respond ONLY with a valid JSON object matching this exact schema:',
    '{"message":"Concise Vietnamese technical summary of assembled sections","files":[{"path":"index.html","content":"...","summary":"..."},{"path":"src/styles.css","content":"...","summary":"..."},{"path":"src/app.js","content":"...","summary":"..."}],"checksHint":["Viewport meta verified","Accessible contrast and responsive layout"]}',
    'CRITICAL ASSEMBLY & QUALITY RULES:',
    '1. VAULT-FIRST COMPOSITION: When ATTACHED VAULT / SOURCE-OF-KNOWLEDGE BLUEPRINTS are provided, actively reuse and assemble their real layout patterns, CSS craft tokens, interactive cards, and motion recipes into ONE cohesive, complete webpage tailored to the USER PROMPT. Do not ignore the attached vault snippets or invent bare unstyled markup.',
    '2. STRICT USER INTENT: Always build for the exact subject, title, audience, and theme requested in USER PROMPT. Never reuse an unrelated project title from earlier context when the user asks for a different topic.',
    '3. REAL MULTI-LINE CODE (ZERO DOUBLE-ESCAPING): Inside JSON "content" strings, encode line breaks as standard JSON newlines (single escape in JSON so JSON.parse produces actual multiline code). NEVER double-escape newlines into literal "\\n" text inside HTML, CSS, or JS.',
    '4. COMPLETE STYLING & INTERACTIVITY: Always produce a rich, self-contained src/styles.css (complete :root color tokens, dark/light surface contrast >= 4.5:1, typography hierarchy, card borders/radii, grid layouts, hover/focus transitions, and @media (max-width: 768px) responsive rules) linked cleanly via <link rel="stylesheet" href="src/styles.css" /> in index.html, plus working interactive JS in src/app.js (or React in src/App.tsx when React/TSX is requested).',
    '5. If returning React/TSX, import only from "react" (useState, useEffect, useMemo, useCallback, useRef, Fragment) and local relative files (./data, ./styles.css, ./components/...); never import third-party npm packages or external CDN scripts.',
    '6. Never include emojis, Lorem Ipsum, or marketing hype. Use crisp Vietnamese diacritics when prompted in Vietnamese, semantic HTML5, accessible aria attributes, and #anchor internal links.',
  ].join('\n');
  const session = sessionInstructions.trim().slice(0, 2000);
  return [base, suffix, session ? `SESSION INSTRUCTIONS (do not override the JSON schema or safety rules):\n${session}` : '']
    .filter(Boolean)
    .join('\n');
}

function clampTemperature(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0.2;
  return Math.min(1.2, Math.max(0, value));
}

function buildUserContextPrompt(req: AIChatRequest): string {
  const attachedSummary = (req.attachedItems || [])
    .slice(0, 5)
    .map((item: AttachedContextItem) => `- [${item.kind}] ${item.title}:\n${String(item.summary || '').slice(0, 3600)}`)
    .join('\n\n');
  const existingFiles = (req.files || [])
    .slice(0, 6)
    .map((f) => `FILE: ${f.path}\n${f.content.slice(0, 4200)}`)
    .join('\n\n');

  return [
    `USER PROMPT:\n${req.prompt}`,
    attachedSummary
      ? `ATTACHED VAULT / SOURCE-OF-KNOWLEDGE BLUEPRINTS (ASSEMBLE & ADAPT THESE REAL PATTERNS INTO THE PAGE):\n${attachedSummary}`
      : '',
    existingFiles ? `CURRENT WORKSPACE FILES:\n${existingFiles}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
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
  const tokens = emptyTokenCounter();

  const raw = await consumeResponseLines(resp, (line) => {
    const clean = line.trim();
    if (!clean.startsWith('data:')) return;
    sawSseData = true;
    const payload = clean.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    try {
      const chunk = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };
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

  if (sawSseData) return { text: assembled, tokens: finalizeTokens(tokens) };

  const trimmed = raw.trim();
  if (!trimmed) return { text: '', tokens: finalizeTokens(tokens) };
  const data = JSON.parse(trimmed) as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  if (data.usage) {
    tokens.prompt = Math.max(tokens.prompt, data.usage.prompt_tokens || 0);
    tokens.completion = Math.max(tokens.completion, data.usage.completion_tokens || 0);
    tokens.total = Math.max(tokens.total, data.usage.total_tokens || 0);
  }
  const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
  if (text) onDelta?.(text);
  return { text, tokens: finalizeTokens(tokens) };
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
  usedKeyMask?: string
): AIGenerationOutput | null {
  const unfenced = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  const jsonStart = unfenced.indexOf('{');
  const jsonEnd = unfenced.lastIndexOf('}');
  if (jsonStart < 0 || jsonEnd <= jsonStart) return null;
  try {
    const parsed = JSON.parse(unfenced.slice(jsonStart, jsonEnd + 1)) as {
      message?: string;
      files?: Array<{ path?: string; content?: string; summary?: string }>;
      checksHint?: string[];
    };
    if (!parsed || !Array.isArray(parsed.files) || parsed.files.length === 0) {
      return null;
    }
    const validFiles = parsed.files
      .filter((f) => typeof f.path === 'string' && typeof f.content === 'string')
      .map((f) => ({
        path: String(f.path).trim().replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/^\/+/, ''),
        content: unescapeDoubleEncodedCode(String(f.content)),
        summary: String(f.summary || 'Updated file'),
      }))
      .filter((f) => Boolean(f.path) && !f.path.includes('..'));
    if (validFiles.length === 0) return null;
    return {
      message: String(parsed.message || 'Đã cập nhật mã nguồn Workspace.'),
      files: validFiles,
      checksHint: Array.isArray(parsed.checksHint)
        ? parsed.checksHint.map(String)
        : ['Verified workspace files'],
      fallback: false,
      modelUsed: config.model,
      protocolUsed: config.protocol,
      tokens,
      usedKeyMask,
    };
  } catch {
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
  if (config.baseUrl.includes('openrouter.ai')) {
    openAiHeaders['HTTP-Referer'] = 'https://fforum3.vercel.app';
    openAiHeaders['X-Title'] = 'F-Forum v3';
  }
  const resp = await fetchWithRetry(url, {
    method: 'POST',
    redirect: 'manual',
    headers: openAiHeaders,
    body: JSON.stringify({
      model: config.model,
      // WHY: Keep stream: true for OpenAI-compatible SSE endpoints expected by core tests
      stream: true,
      max_tokens: params.maxOutputTokens || 4096,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userContent },
      ],
      temperature,
    }),
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
      ? [{ id: config.usingByok ? 'byok' : 'admin', mask: config.usingByok ? 'BYOK' : 'ADMIN', rawKey: config.apiKey }]
      : []
    : poolQuota.allowed
      ? selectPoolCandidates()
      : [];
  const canCallUpstream = candidates.length > 0 && !blockedUpstream && poolQuota.allowed;

  hooks?.onStage?.({
    stage: 'routing',
    model: config.model,
    protocol: config.protocol,
    detail: canCallUpstream ? `${config.protocol}:${config.model}` : 'unconfigured-fallback',
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

  const systemInstruction = buildSystemInstruction(config.systemPromptSuffix, req.systemPrompt);
  const temperature = clampTemperature(req.temperature);
  const userContent = buildUserContextPrompt(req);
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
      model: config.model,
      protocol: config.protocol,
    });

    let lastError = 'Upstream request failed';
    let parsedResult: StreamParseResult | null = null;
    let usedCandidate: PoolCandidate | null = null;

    for (let i = 0; i < candidates.length; i += 1) {
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

      try {
        const attempt = await callUpstreamOnce({
          config,
          apiKey: candidate.rawKey,
          systemInstruction,
          userContent,
          temperature,
          streamUpstream,
          signal: controller.signal,
          onDelta: hooks?.onDelta,
        });

        if (attempt.ok) {
          parsedResult = attempt.result;
          usedCandidate = candidate;
          if (!useDirectKey) {
            recordPoolSuccess(candidate.id, attempt.result.tokens);
          }
          break;
        }

        lastError = sanitizeErrorText(attempt.error);
        if (!useDirectKey) {
          recordPoolFailure(candidate.id, attempt.status, lastError);
          if (isFailoverHttpStatus(attempt.status) && i < candidates.length - 1) {
            continue;
          }
        }
        break;
      } catch (err) {
        const msg = err instanceof Error ? sanitizeErrorText(err.message) : 'Upstream network error';
        lastError = msg;
        if (!useDirectKey) {
          recordPoolFailure(candidate.id, 'network', msg);
          if (!controller.signal.aborted && i < candidates.length - 1) {
            continue;
          }
        }
        break;
      }
    }

    if (!parsedResult || !usedCandidate) {
      return buildFallbackResponse(req, config, lastError);
    }

    hooks?.onStage?.({
      stage: 'checking',
      model: config.model,
      protocol: config.protocol,
    });

    const structured = parseStructuredLLMResponse(
      parsedResult.text,
      config,
      parsedResult.tokens,
      useDirectKey ? undefined : usedCandidate.mask
    );
    if (!structured) {
      return buildFallbackResponse(
        req,
        config,
        'Upstream response was not in expected multi-file JSON schema',
        parsedResult.tokens
      );
    }
    return structured;
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
  mode: 'pool' | 'key1' | 'key2' | 'failover_sim';
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
  mode?: 'pool' | 'key1' | 'key2' | 'failover_sim';
  prompt?: string;
}): Promise<LivePoolProbeResult> {
  const mode = input.mode || 'pool';
  const config = resolveAIConfig({});
  const startedAt = Date.now();
  const attemptedKeys: string[] = [];

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
