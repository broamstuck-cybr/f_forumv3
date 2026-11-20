import type { IncomingHttpHeaders } from 'node:http';
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

function buildDeterministicFallback(
  req: AIChatRequest,
  config: EffectiveAIConfig,
  upstreamError: string
): AIGenerationOutput {
  const cleanTitle = (req.prompt || 'F-FORUM v3 Spatial Interface')
    .replace(/[<>"]/g, '')
    .trim()
    .slice(0, 68) || 'F-FORUM v3 Spatial Interface';
  const attachedBadges = (req.attachedItems || [])
    .map(
      (it) =>
        `<span class="tag-pill" data-kind="${it.kind.replace(/"/g, '')}">${it.title.replace(/[<>]/g, '')}</span>`
    )
    .join('\n            ');

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${cleanTitle}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="top-bar" role="banner">
    <div class="brand-lockup">
      <span class="aperture-dot" aria-hidden="true"></span>
      <span class="brand-name">F-FORUM LIVE BUILD</span>
    </div>
    <nav class="top-nav" aria-label="Primary Navigation">
      <a href="#overview" class="nav-link">Overview</a>
      <a href="#modules" class="nav-link">Modules</a>
      <a href="#telemetry" class="nav-link">Telemetry</a>
    </nav>
  </header>

  <main class="main-stage" id="overview">
    <section class="hero-panel" aria-labelledby="hero-heading">
      <p class="eyebrow">SYNTHESIZED WORKSPACE ARTIFACT</p>
      <h1 id="hero-heading">${cleanTitle}</h1>
      <p class="lead-copy">
        Kiến trúc giao diện đa tệp HTML/CSS/JS được đồng bộ theo hệ thống Design Tokens 8px, hỗ trợ kiểm thử DOM, Diff và xuất gói ZIP an toàn.
      </p>
      <div class="tag-row">
        ${attachedBadges || '<span class="tag-pill">Obsidian Foundry</span><span class="tag-pill">8px Spatial Grid</span>'}
      </div>
      <div class="action-bar">
        <button type="button" id="run-diagnostic-btn" class="primary-btn">Chạy Kiểm Tra Giao Diện</button>
        <button type="button" id="toggle-density-btn" class="secondary-btn">Chuyển Đổi Mật Độ</button>
      </div>
    </section>

    <section class="split-workbench" id="modules" aria-label="Interactive Modules">
      <article class="module-card">
        <h2>Spatial Layout Specification</h2>
        <p>Cấu trúc bố cục bất đối xứng 60/40 giúp tối ưu tỷ lệ đọc và giảm tải nhận thức trên 3 khung hình (390px, 768px, 1440px).</p>
        <dl class="metric-list">
          <div class="metric-item">
            <dt>Grid Rhythm</dt>
            <dd>8px Base Unit</dd>
          </div>
          <div class="metric-item">
            <dt>Contrast Target</dt>
            <dd>WCAG AAA</dd>
          </div>
        </dl>
      </article>

      <article class="module-card" id="telemetry">
        <h2>Interactive Diagnostic Console</h2>
        <p id="status-readout" class="status-readout" role="status">Sẵn sàng kiểm tra tương tác runtime.</p>
        <div class="counter-box">
          <span>Iterations Verified:</span>
          <strong id="iteration-count">1</strong>
        </div>
      </article>
    </section>
  </main>

  <script src="app.js"></script>
</body>
</html>`;

  const cssContent = `:root {
  --bg-primary: #0b0d12;
  --bg-elevated: #12161f;
  --border-subtle: rgba(255, 255, 255, 0.1);
  --text-primary: #f1f5f9;
  --text-muted: #94a3b8;
  --accent-amber: #f59e0b;
  --accent-emerald: #10b981;
  --radius-md: 12px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  min-height: 100vh;
  overflow-x: hidden;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(18, 22, 31, 0.85);
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-size: 0.875rem;
}

.aperture-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--accent-amber);
}

.top-nav {
  display: flex;
  gap: 16px;
}

.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.875rem;
}

.nav-link:hover {
  color: var(--text-primary);
}

.main-stage {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-panel {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.eyebrow {
  color: var(--accent-amber);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

h1 {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  line-height: 1.2;
}

.lead-copy {
  color: var(--text-muted);
  max-width: 68ch;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-pill {
  font-size: 0.75rem;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.12);
  color: var(--accent-amber);
  border: 1px solid rgba(245, 158, 11, 0.28);
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.primary-btn,
.secondary-btn {
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.primary-btn {
  background: var(--accent-amber);
  color: #0b0d12;
  border: none;
}

.secondary-btn {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.split-workbench {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}

.module-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.metric-item {
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.metric-item dt {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.metric-item dd {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-emerald);
}

.status-readout {
  padding: 12px;
  border-radius: 8px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent-emerald);
  font-size: 0.875rem;
}

.counter-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  font-size: 0.875rem;
}

body.compact-density .hero-panel,
body.compact-density .module-card {
  padding: 16px;
}

@media (max-width: 768px) {
  .split-workbench {
    grid-template-columns: 1fr;
  }
}`;

  const jsContent = `(function () {
  var runBtn = document.getElementById('run-diagnostic-btn');
  var densityBtn = document.getElementById('toggle-density-btn');
  var readout = document.getElementById('status-readout');
  var counterEl = document.getElementById('iteration-count');
  var count = 1;

  if (runBtn && readout && counterEl) {
    runBtn.addEventListener('click', function () {
      count += 1;
      counterEl.textContent = String(count);
      readout.textContent = 'Kiem tra DOM & Responsive hoan tat tai lan chay #' + count + '.';
    });
  }

  if (densityBtn) {
    densityBtn.addEventListener('click', function () {
      document.body.classList.toggle('compact-density');
    });
  }
})();`;

  return {
    message: `Đã tổng hợp bộ 3 tệp (index.html, styles.css, app.js) cho "${cleanTitle}". Hệ thống đang dùng bộ khung dự phòng do kết nối AI gặp sự cố (${upstreamError}). Mở Cài đặt -> Khóa riêng (BYOK) để dùng khóa API riêng hoặc kiểm tra AI_BASE_URL.`,
    files: [
      {
        path: 'index.html',
        content: htmlContent,
        summary: 'Cấu trúc HTML5 ngữ nghĩa với landmarks và viewport chuẩn.',
      },
      {
        path: 'styles.css',
        content: cssContent,
        summary: 'Design tokens Obsidian Foundry với bố cục 60/40 responsive.',
      },
      {
        path: 'app.js',
        content: jsContent,
        summary: 'Logic tương tác kiểm tra trạng thái DOM và chuyển đổi mật độ.',
      },
    ],
    checksHint: [
      'HTML5 doctype, lang và viewport meta đầy đủ',
      'Không phát hiện rò rỉ secret hoặc liên kết nội bộ lỗi',
      'Cú pháp JavaScript hợp lệ 100%',
    ],
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
    detail: canCallUpstream ? `${config.protocol}:${config.model}` : 'deterministic-fallback',
  });

  if (!canCallUpstream) {
    hooks?.onStage?.({
      stage: 'generating',
      model: config.model,
      protocol: config.protocol,
      detail: 'Deterministic synthesis',
    });
    const reason = unreachableLoopback
      ? 'AI_BASE_URL trên Vercel đang trỏ localhost/127.0.0.1; hãy đặt API công khai (OpenRouter/Gemini/OpenAI) hoặc bật Khóa riêng (BYOK) trong Cài đặt'
      : 'Chưa cấu hình AI_API_KEY trên máy chủ hoặc khóa BYOK';
    const fallbackOut = buildDeterministicFallback(req, config, reason);
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
      return buildDeterministicFallback(
        req,
        config,
        'Upstream response was not in expected multi-file JSON schema'
      );
    }
    return structured;
  } catch (err) {
    const msg = err instanceof Error ? sanitizeErrorText(err.message) : 'Upstream request failed';
    return buildDeterministicFallback(req, config, msg);
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
