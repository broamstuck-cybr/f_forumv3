import fs from 'node:fs';
import type { IncomingHttpHeaders } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AIChatRequest, AIProtocol, AttachedContextItem } from '../src/types/index';
import { getInternalGatewayOverride } from './adminStore.js';
import { ensureLocalEnvLoaded } from './quotaStore.js';

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
}

export interface AIStreamHooks {
  onStage?: (payload: {
    stage: 'routing' | 'generating' | 'checking';
    model: string;
    protocol: AIProtocol;
    detail?: string;
  }) => void;
  onDelta?: (chunk: string) => void;
}

interface EffectiveAIConfig {
  protocol: AIProtocol;
  baseUrl: string;
  model: string;
  apiKey: string;
  systemPromptSuffix: string;
}

function sanitizeErrorText(raw: string): string {
  return raw
    .replace(/sk-[a-zA-Z0-9_-]{8,}/g, 'sk-[REDACTED]')
    .replace(/AIza[a-zA-Z0-9_-]{10,}/g, 'AIza[REDACTED]')
    .slice(0, 280);
}

function normalizeProtocol(val: string | undefined): AIProtocol {
  if (val === 'anthropic' || val === 'gemini') return val;
  return 'openai-compatible';
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
  let apiKey = (process.env.AI_API_KEY || '').trim();
  let systemPromptSuffix = '';

  if (adminOverride.enabled) {
    protocol = adminOverride.protocol;
    baseUrl = adminOverride.baseUrl || baseUrl;
    model = adminOverride.model || model;
    if (adminOverride.apiKey) {
      apiKey = adminOverride.apiKey;
    }
    systemPromptSuffix = adminOverride.systemPromptSuffix || '';
  }

  const cleanRequested = (requestedModel || '').trim();
  if (cleanRequested && cleanRequested !== 'auto' && !adminOverride.enabled) {
    model = cleanRequested;
  }

  const byokKey = typeof headers['x-ff-byok-key'] === 'string' ? headers['x-ff-byok-key'].trim() : '';
  const byokUrl = typeof headers['x-ff-byok-url'] === 'string' ? headers['x-ff-byok-url'].trim() : '';
  const byokModel = typeof headers['x-ff-byok-model'] === 'string' ? headers['x-ff-byok-model'].trim() : '';
  const byokProto = typeof headers['x-ff-byok-protocol'] === 'string' ? headers['x-ff-byok-protocol'].trim() : '';

  if (byokKey) {
    apiKey = byokKey;
    if (byokUrl) baseUrl = byokUrl;
    if (byokModel) model = byokModel;
    if (byokProto) protocol = normalizeProtocol(byokProto);
  }

  return {
    protocol,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    model,
    apiKey,
    systemPromptSuffix,
  };
}

function buildSystemInstruction(suffix: string): string {
  const base = [
    'You are the F-FORUM v3 Workspace Code Synthesis Engine.',
    'Respond ONLY with a valid JSON object matching this exact schema:',
    '{"message":"Concise technical summary of changes","files":[{"path":"index.html","content":"...","summary":"..."},{"path":"styles.css","content":"...","summary":"..."},{"path":"app.js","content":"...","summary":"..."}],"checksHint":["Viewport meta verified","Accessible contrast and semantic tags"]}',
    'Rules:',
    '1. Always return full runnable contents for index.html, styles.css, and app.js.',
    '2. Never include emojis or marketing hype.',
    '3. Ensure index.html includes <meta name="viewport" content="width=device-width, initial-scale=1.0">, links styles.css, and loads app.js.',
    '4. Use semantic HTML5, accessible aria attributes, and clean 8px spatial rhythm.',
    '5. Keep code concise, modular, and free of comments so the JSON response completes quickly.',
  ].join('\n');
  return suffix ? `${base}\n${suffix}` : base;
}

function buildUserContextPrompt(req: AIChatRequest): string {
  const attachedSummary = (req.attachedItems || [])
    .map((item: AttachedContextItem) => `- [${item.kind}] ${item.title}: ${item.summary}`)
    .join('\n');
  const existingFiles = (req.files || [])
    .map((f) => `FILE: ${f.path}\n${f.content.slice(0, 3000)}`)
    .join('\n\n');

  return [
    `USER PROMPT:\n${req.prompt}`,
    attachedSummary ? `ATTACHED EXPLORE CONTEXT:\n${attachedSummary}` : '',
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
  upstreamError: string
): AIGenerationOutput {
  const matched = findStrongCatalogMatch(req.prompt || '');
  if (matched) {
    return {
      message: `Chưa kết nối khóa AI (${upstreamError}). Đã nạp mẫu thật khớp từ khóa: "${matched.title}" (${matched.sourceLibrary || 'Vault'}). Mở Cài đặt -> Khóa riêng (BYOK) để nhập API key thật (OpenAI / Gemini / OpenRouter / DeepSeek) hoặc mở Kho 7.662 mẫu để duyệt thêm.`,
      files: buildFilesFromCatalogSample(matched),
      checksHint: [],
      fallback: true,
      upstreamError,
      modelUsed: config.model,
      protocolUsed: config.protocol,
    };
  }

  const keyMissing = !config.apiKey;
  const message = keyMissing
    ? 'Chưa kết nối khóa AI. Mở Cài đặt -> Khóa riêng (BYOK) để nhập API key thật (OpenAI / Gemini / OpenRouter / DeepSeek) giúp trợ lý sinh mã theo yêu cầu, hoặc bấm mở Kho 7.662 mẫu để nạp giao diện thật.'
    : `Kết nối AI tạm gián đoạn (${upstreamError}). Kiểm tra lại khóa tại Cài đặt -> Khóa riêng (BYOK) (OpenAI / Gemini / OpenRouter / DeepSeek) hoặc bấm mở Kho 7.662 mẫu để nạp mẫu thật.`;

  return {
    message,
    files: [],
    checksHint: [],
    fallback: true,
    upstreamError,
    modelUsed: config.model,
    protocolUsed: config.protocol,
  };
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
): Promise<string> {
  let assembled = '';
  let sawSseData = false;

  const raw = await consumeResponseLines(resp, (line) => {
    const clean = line.trim();
    if (!clean.startsWith('data:')) return;
    sawSseData = true;
    const payload = clean.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    try {
      const chunk = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
      };
      const delta = chunk.choices?.[0]?.delta?.content ?? chunk.choices?.[0]?.message?.content ?? '';
      if (delta) {
        assembled += delta;
        onDelta?.(delta);
      }
    } catch {
      return;
    }
  });

  if (sawSseData) return assembled;

  const trimmed = raw.trim();
  if (!trimmed) return '';
  const data = JSON.parse(trimmed) as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
  };
  const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
  if (text) onDelta?.(text);
  return text;
}

async function readAnthropicStream(
  resp: Response,
  onDelta?: (chunk: string) => void
): Promise<string> {
  let assembled = '';
  let sawSseData = false;

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
      };
      if (event.type === 'content_block_delta' && event.delta?.text) {
        assembled += event.delta.text;
        onDelta?.(event.delta.text);
      }
    } catch {
      return;
    }
  });

  if (sawSseData) return assembled;

  const trimmed = raw.trim();
  if (!trimmed) return '';
  const data = JSON.parse(trimmed) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text || '';
  if (text) onDelta?.(text);
  return text;
}

async function readGeminiStream(
  resp: Response,
  onDelta?: (chunk: string) => void
): Promise<string> {
  let assembled = '';
  let sawSseData = false;

  const raw = await consumeResponseLines(resp, (line) => {
    const clean = line.trim();
    if (!clean.startsWith('data:')) return;
    sawSseData = true;
    const payload = clean.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    try {
      const chunk = JSON.parse(payload) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      const text = parts.map((p) => p.text || '').join('');
      if (text) {
        assembled += text;
        onDelta?.(text);
      }
    } catch {
      return;
    }
  });

  if (sawSseData) return assembled;

  const trimmed = raw.trim();
  if (!trimmed) return '';
  const data = JSON.parse(trimmed) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text || '').join('');
  if (text) onDelta?.(text);
  return text;
}

function parseStructuredLLMResponse(
  rawText: string,
  config: EffectiveAIConfig
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
        path: String(f.path).trim(),
        content: String(f.content),
        summary: String(f.summary || 'Updated file'),
      }));
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
    };
  } catch {
    return null;
  }
}

function isLoopbackUrl(url: string): boolean {
  return /^https?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i.test(url.trim());
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    if (init.signal?.aborted) throw err;
    return await fetch(url, init);
  }
}

export async function runAIGenerationStream(
  req: AIChatRequest,
  headers: IncomingHttpHeaders,
  hooks?: AIStreamHooks
): Promise<AIGenerationOutput> {
  const config = resolveAIConfig(headers, req.model);
  const runningOnCloud = Boolean(process.env.VERCEL);
  const unreachableLoopback = runningOnCloud && isLoopbackUrl(config.baseUrl);
  const canCallUpstream = Boolean(config.apiKey) && !unreachableLoopback;

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
    const reason = unreachableLoopback
      ? 'AI_BASE_URL trên Vercel đang trỏ localhost/127.0.0.1; hãy đặt API công khai (OpenRouter/Gemini/OpenAI) hoặc bật Khóa riêng (BYOK) trong Cài đặt'
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

  const systemInstruction = buildSystemInstruction(config.systemPromptSuffix);
  const userContent = buildUserContextPrompt(req);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const streamUpstream = Boolean(hooks?.onDelta);

  try {
    hooks?.onStage?.({
      stage: 'generating',
      model: config.model,
      protocol: config.protocol,
    });

    let responseText = '';

    if (config.protocol === 'anthropic') {
      const url = config.baseUrl.endsWith('/messages')
        ? config.baseUrl
        : `${config.baseUrl}/v1/messages`;
      const resp = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 4096,
          stream: streamUpstream,
          system: systemInstruction,
          messages: [{ role: 'user', content: userContent }],
        }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`Anthropic HTTP ${resp.status}: ${sanitizeErrorText(errBody)}`);
      }
      responseText = await readAnthropicStream(resp, hooks?.onDelta);
    } else if (config.protocol === 'gemini') {
      const method = streamUpstream ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
      const url = `${config.baseUrl}/models/${encodeURIComponent(config.model)}:${method}key=${encodeURIComponent(config.apiKey)}`;
      const resp = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userContent }] }],
        }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`Gemini HTTP ${resp.status}: ${sanitizeErrorText(errBody)}`);
      }
      responseText = await readGeminiStream(resp, hooks?.onDelta);
    } else {
      const url = config.baseUrl.endsWith('/chat/completions')
        ? config.baseUrl
        : `${config.baseUrl}/chat/completions`;
      const openAiHeaders: Record<string, string> = {
        'content-type': 'application/json',
        authorization: `Bearer ${config.apiKey}`,
      };
      if (config.baseUrl.includes('openrouter.ai')) {
        openAiHeaders['HTTP-Referer'] = 'https://fforum3.vercel.app';
        openAiHeaders['X-Title'] = 'F-Forum v3';
      }
      const resp = await fetchWithRetry(url, {
        method: 'POST',
        headers: openAiHeaders,
        body: JSON.stringify({
          model: config.model,
          stream: true,
          max_tokens: 4096,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userContent },
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`OpenAI-Compatible HTTP ${resp.status}: ${sanitizeErrorText(errBody)}`);
      }
      responseText = await readOpenAICompatibleStream(resp, hooks?.onDelta);
    }

    hooks?.onStage?.({
      stage: 'checking',
      model: config.model,
      protocol: config.protocol,
    });

    const structured = parseStructuredLLMResponse(responseText, config);
    if (!structured) {
      return buildFallbackResponse(
        req,
        config,
        'Upstream response was not in expected multi-file JSON schema'
      );
    }
    return structured;
  } catch (err) {
    const msg = err instanceof Error ? sanitizeErrorText(err.message) : 'Upstream request failed';
    return buildFallbackResponse(req, config, msg);
  } finally {
    clearTimeout(timeout);
  }
}

export async function runAIGeneration(
  req: AIChatRequest,
  headers: IncomingHttpHeaders
): Promise<AIGenerationOutput> {
  return runAIGenerationStream(req, headers);
}
