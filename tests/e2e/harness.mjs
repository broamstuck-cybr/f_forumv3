import assert from 'node:assert/strict';
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_ROOT = path.resolve(__dirname, '../..');
export const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
export const STUDIO_SCRIPTS_DIR = process.env.STUDIO_SCRIPTS_DIR || path.resolve(PROJECT_ROOT, '../../scripts');

export const DEFAULT_ADMIN_USER = process.env.E2E_ADMIN_USERNAME || 'admin';
export const DEFAULT_ADMIN_PASS = process.env.E2E_ADMIN_PASSWORD || 'e2e-admin-password-2027';
export const DEFAULT_SESSION_SECRET = 'e2e-session-secret-2027-isolated-runtime';

const activeServers = new Set();
const activeMockUpstreams = new Set();
const activeContexts = new Set();

function isProcessGroupAlive(pid) {
  if (!pid || process.platform === 'win32') return false;
  try {
    process.kill(-pid, 0);
    return true;
  } catch {
    return false;
  }
}

function signalProcessGroup(child, signal) {
  if (process.platform !== 'win32' && child.pid) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // Process group may already be gone; fall through to direct child.kill
    }
  }
  try {
    child.kill(signal);
  } catch {
    // Already exited
  }
}

async function waitForProcessGroupExit(child, isExitedFn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const stillAlive = !isExitedFn() || isProcessGroupAlive(child.pid);
    if (!stillAlive) return true;
    const remaining = Math.max(10, Math.min(40, deadline - Date.now()));
    await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(t);
        child.off('exit', finish);
        resolve();
      };
      const t = setTimeout(finish, remaining);
      child.once('exit', finish);
    });
  }
  return isExitedFn() && !isProcessGroupAlive(child.pid);
}

async function terminateChildProcessGroup(child, isExitedFn) {
  if (!isExitedFn() || isProcessGroupAlive(child.pid)) {
    signalProcessGroup(child, 'SIGTERM');
    const exitedOnTerm = await waitForProcessGroupExit(child, isExitedFn, 1500);
    if (!exitedOnTerm) {
      signalProcessGroup(child, 'SIGKILL');
      await waitForProcessGroupExit(child, isExitedFn, 500);
    }
  }
  child.stdout?.destroy();
  child.stderr?.destroy();
}

export async function closeAllIsolatedServers(options = {}) {
  const exclude = new Set(options.exclude || []);
  const targets = Array.from(activeServers).filter((entry) => !exclude.has(entry));
  await Promise.allSettled(targets.map((entry) => entry.close()));
}

export async function closeAllMockUpstreams() {
  const targets = Array.from(activeMockUpstreams);
  await Promise.allSettled(targets.map((entry) => entry.close()));
}

export async function closeAllActiveContexts() {
  const targets = Array.from(activeContexts);
  await Promise.allSettled(
    targets.map(async (context) => {
      activeContexts.delete(context);
      await context.close().catch(() => {});
    })
  );
}

export function loadPlaywright() {
  try {
    return require('playwright-core');
  } catch {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(globalRoot, 'playwright-core'));
  }
}

export async function launchBrowser() {
  const { chromium } = loadPlaywright();
  return chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
}

export const DEFAULT_POOL_KEY_1_MASK = 'AQ.***m9mGw';
export const DEFAULT_POOL_KEY_2_MASK = 'AQ.***KECWw';

export function makeSyntheticSecret(kind, suffix = '') {
  if (kind === 'aq') return ['AQ', '.SynthTestToken_', suffix || '9876543210'].join('');
  if (kind === 'aq-ab8') return ['AQ', '.Ab8', 'SYNTHETIC_TEST_TOKEN_', suffix || '9876543210'].join('');
  if (kind === 'sk') return ['sk', `-e2esynthetic00112233445566778899${suffix}`].join('');
  if (kind === 'aiza') return ['AIza', `SyntheticE2EToken001122334455${suffix}`].join('');
  if (kind === 'ghp') return ['ghp', `_SyntheticE2EToken00112233445566${suffix}`].join('');
  return ['Bearer ', `synthetic-secret-token-998877${suffix}`].join('');
}

export function makeSyntheticPoolPair() {
  return {
    key1: makeSyntheticSecret('aq', 'm9mGw'),
    key2: makeSyntheticSecret('aq', 'KECWw'),
  };
}

export function assertDistExists() {
  const indexHtml = path.join(DIST_DIR, 'index.html');
  assert.ok(
    fs.existsSync(indexHtml),
    `Built dist/index.html missing at ${indexHtml}. Run "npm run build" before executing E2E suite.`
  );
}

export async function startIsolatedServer(options = {}) {
  const externalUrl = process.env.E2E_BASE_URL;
  if (externalUrl && !options.forceSpawn) {
    return {
      url: externalUrl.replace(/\/+$/, ''),
      port: Number(new URL(externalUrl).port || 80),
      tmpDir: null,
      external: true,
      close: async () => {},
    };
  }

  assertDistExists();

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fforum-e2e-'));
  let child;
  try {
    const dataDir = path.join(tmpDir, 'data');
    const metricsDir = path.join(tmpDir, '.data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.mkdirSync(metricsDir, { recursive: true });

    // Pre-seed isolated .data/metrics.json so server/metricsStore.ts never reads or mutates /tmp/fforum_metrics.json.
    fs.writeFileSync(
      path.join(metricsDir, 'metrics.json'),
      JSON.stringify({
        visitors: 195,
        activeSeconds: 327600,
        lastUpdatedAt: new Date().toISOString(),
        visitorIds: [],
        sessions: {},
      }),
      'utf8'
    );

    for (const name of ['src', 'node_modules', 'package.json']) {
      const target = path.join(PROJECT_ROOT, name);
      const linkPath = path.join(tmpDir, name);
      if (fs.existsSync(target) && !fs.existsSync(linkPath)) {
        fs.symlinkSync(target, linkPath);
      }
    }

    const tsxBin = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'tsx');
    const serverEntry = path.join(PROJECT_ROOT, 'tests', 'e2e', '_server.ts');
    const { key1: defaultPoolKey1, key2: defaultPoolKey2 } = makeSyntheticPoolPair();

    const env = {
      ...process.env,
      NODE_ENV: 'test',
      FF_DISABLE_DOTENV: '1',
      TRUST_PROXY: '',
      PORT: '',
      VERCEL: '',
      VERCEL_URL: '',
      VERCEL_BRANCH_URL: '',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      ADMIN_USERNAME: DEFAULT_ADMIN_USER,
      ADMIN_PASSWORD_HASH: '',
      ADMIN_BOOTSTRAP_PASSWORD: DEFAULT_ADMIN_PASS,
      SESSION_SECRET: DEFAULT_SESSION_SECRET,
      GOOGLE_CLIENT_ID: '',
      VITE_GOOGLE_CLIENT_ID: '',
      CORS_ALLOWED_ORIGINS: '',
      ALLOWED_ORIGINS: '',
      AI_API_KEY: '',
      AI_API_KEYS: '',
      GEMINI_API_KEYS: '',
      AI_API_KEY_1: defaultPoolKey1,
      AI_API_KEY_2: defaultPoolKey2,
      AI_PROTOCOL: 'gemini',
      AI_MODEL: 'gemini-3-flash-preview',
      AI_BASE_URL: 'http://127.0.0.1:9',
      AI_ACCOUNT_DAILY_LIMIT: '1500',
      AI_ACCOUNT_RPM_LIMIT: '30',
      AI_PARENT_ACCOUNT_LABEL: 'Google Cloud Gemini Account',
      ...(options.env || {}),
    };

    child = spawn(tsxBin, [serverEntry], {
      cwd: tmpDir,
      env,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw err;
  }

  let exited = false;
  let closed = false;
  let closePromise = null;
  let rejectReadyOnClose = null;

  child.once('exit', () => {
    exited = true;
  });

  const serverHandle = {
    url: '',
    port: 0,
    tmpDir,
    external: false,
    close,
  };
  activeServers.add(serverHandle);

  async function close() {
    if (closePromise) return closePromise;
    closePromise = (async () => {
      closed = true;
      if (rejectReadyOnClose) {
        rejectReadyOnClose(new Error('E2E server closed before becoming ready'));
      }
      try {
        await terminateChildProcessGroup(child, () => exited);
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } finally {
        activeServers.delete(serverHandle);
      }
    })();
    return closePromise;
  }

  let stderrBuf = '';
  let stdoutBuf = '';

  const ready = await new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;

    const cleanupListeners = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      child.off('exit', onPrematureExit);
      child.off('error', onSpawnError);
      child.stdout?.off('data', onStdout);
      child.stderr?.off('data', onStderr);
      rejectReadyOnClose = null;
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      reject(err);
    };

    rejectReadyOnClose = fail;

    timer = setTimeout(() => {
      fail(new Error(`E2E server timed out after 15s. stderr: ${stderrBuf}`));
    }, 15000);

    function onPrematureExit(code) {
      fail(new Error(`E2E server exited prematurely (${code}). stderr: ${stderrBuf}`));
    }

    function onSpawnError(err) {
      exited = true;
      fail(new Error(`E2E server spawn error: ${err instanceof Error ? err.message : String(err)}. stderr: ${stderrBuf}`));
    }

    function onStderr(chunk) {
      stderrBuf += chunk.toString();
    }

    function onStdout(chunk) {
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('{')) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && parsed.url) {
            if (settled) return;
            settled = true;
            cleanupListeners();
            resolve(parsed);
            return;
          }
        } catch {
          // Wait for complete JSON line
        }
      }
    }

    if (closed) {
      fail(new Error('E2E server closed before becoming ready'));
      return;
    }
    if (exited) {
      fail(new Error(`E2E server exited prematurely (early exit). stderr: ${stderrBuf}`));
      return;
    }

    child.once('exit', onPrematureExit);
    child.once('error', onSpawnError);
    child.stderr.on('data', onStderr);
    child.stdout.on('data', onStdout);
  }).catch(async (err) => {
    await close().catch(() => {});
    throw err;
  });

  serverHandle.url = ready.url;
  serverHandle.port = ready.port;

  // Verify /api/health responds cleanly
  try {
    const healthRes = await fetch(`${ready.url}/api/health`);
    assert.equal(healthRes.status, 200, `Expected /api/health 200 on ${ready.url}`);
  } catch (err) {
    await close().catch(() => {});
    throw err;
  }

  return serverHandle;
}

export async function startMockUpstream(handler) {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyText = Buffer.concat(chunks).toString('utf8');
    let bodyJson = null;
    try {
      bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = null;
    }
    const entry = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      bodyText,
      bodyJson,
    };
    requests.push(entry);
    try {
      await handler(entry, res);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;

  let closePromise = null;
  const handle = {
    url: `http://127.0.0.1:${port}`,
    port,
    requests,
    close: async () => {
      if (closePromise) return closePromise;
      closePromise = new Promise((resolve) => {
        activeMockUpstreams.delete(handle);
        if (typeof server.closeAllConnections === 'function') {
          server.closeAllConnections();
        }
        server.close(() => resolve());
      });
      return closePromise;
    },
  };
  activeMockUpstreams.add(handle);
  return handle;
}

export function createSessionClient(baseUrl) {
  const cookies = new Map();

  function absorbSetCookies(res) {
    const list = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie')].filter(Boolean);
    for (const raw of list) {
      const firstPart = raw.split(';')[0] || '';
      const eqIdx = firstPart.indexOf('=');
      if (eqIdx <= 0) continue;
      const name = firstPart.slice(0, eqIdx).trim();
      const val = firstPart.slice(eqIdx + 1).trim();
      if (!val || /max-age=0/i.test(raw)) {
        cookies.delete(name);
      } else {
        cookies.set(name, val);
      }
    }
  }

  function cookieHeader() {
    if (cookies.size === 0) return '';
    return Array.from(cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  async function request(method, pathname, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!options.omitCookies) {
      const ch = cookieHeader();
      if (ch && !headers.has('cookie')) headers.set('cookie', ch);
    }
    let body = options.body;
    if (body !== undefined && typeof body !== 'string' && !(body instanceof Buffer)) {
      if (!headers.has('content-type')) headers.set('content-type', 'application/json');
      body = JSON.stringify(body);
    }
    const res = await fetch(`${baseUrl}${pathname}`, {
      method,
      headers,
      body,
      redirect: options.redirect || 'manual',
    });
    absorbSetCookies(res);
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    const setCookies = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie')].filter(Boolean);
    return { status: res.status, headers: res.headers, setCookies, text, json, ok: res.ok };
  }

  return {
    cookies,
    get: (p, o) => request('GET', p, o),
    post: (p, b, o) => request('POST', p, { ...o, body: b }),
    request,
    async registerAndLogin(prefix = 'e2euser') {
      const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const username = `${prefix}_${suffix}`.slice(0, 24);
      const email = `${username}@example.test`;
      const password = `Pass!${suffix}2027`;
      const res = await request('POST', '/api/auth/register', {
        body: { username, email, password, name: `Test ${prefix}` },
      });
      return { username, email, password, res };
    },
    async adminLogin(username = DEFAULT_ADMIN_USER, password = DEFAULT_ADMIN_PASS) {
      return request('POST', '/api/auth/admin-login', {
        body: { username, password },
      });
    },
    clearCookies() {
      cookies.clear();
    },
  };
}

export function listDistFiles(subDir = '') {
  const dir = subDir ? path.join(DIST_DIR, subDir) : DIST_DIR;
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else results.push(full);
    }
  }
  return results;
}

export function scanDistAssets() {
  assertDistExists();
  const allFiles = listDistFiles();
  const mapFiles = allFiles.filter((f) => f.endsWith('.map'));
  const assetsDir = path.join(DIST_DIR, 'assets');
  const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
  const jsAssets = assetFiles.filter((f) => f.endsWith('.js')).map((f) => path.join(assetsDir, f));
  const cssAssets = assetFiles.filter((f) => f.endsWith('.css')).map((f) => path.join(assetsDir, f));
  const indexJsFiles = jsAssets.filter((f) => /^index-[^/]+\.js$/.test(path.basename(f)));
  const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  return { allFiles, mapFiles, jsAssets, cssAssets, indexJsFiles, indexHtml };
}

export async function withPage(browser, options, fn) {
  const viewport = options.viewport || { width: 1440, height: 900 };
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference',
  });
  activeContexts.add(context);

  try {
    const page = await context.newPage();

    if (options.blockWebGL) {
      await page.addInitScript(() => {
        const origGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function patchedGetContext(type, ...rest) {
          if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
            return null;
          }
          return origGetContext.call(this, type, ...rest);
        };
      });
    }

    const trackers = {
      consoleErrors: [],
      consoleWarnings: [],
      consoleLogs: [],
      pageErrors: [],
      server500s: [],
      responses: [],
    };

    page.on('console', (msg) => {
      const locUrl = (msg.location()?.url || '').toLowerCase();
      const txt = msg.text();
      if (txt.toLowerCase().includes('favicon') || locUrl.includes('favicon')) return;
      if (msg.type() === 'error') trackers.consoleErrors.push(txt);
      else if (msg.type() === 'warning') trackers.consoleWarnings.push(txt);
      else trackers.consoleLogs.push(txt);
    });
    page.on('pageerror', (err) => trackers.pageErrors.push(err.message));
    page.on('response', (resp) => {
      trackers.responses.push({ url: resp.url(), status: resp.status() });
      if (resp.status() >= 500) {
        trackers.server500s.push(`${resp.status()} ${resp.url()}`);
      }
    });

    return await fn(page, trackers, context);
  } finally {
    activeContexts.delete(context);
    await context.close().catch(() => {});
  }
}

export async function waitForAppHydration(page, timeout = 35000) {
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      const main = document.getElementById('noi-dung');
      if (!root || !main || document.querySelector('.ff-boot')) return false;
      const hasLoader = Boolean(document.querySelector('.ff-loader-overlay'));
      const hasRouteContent = Array.from(main.children).some(
        (el) => !el.classList.contains('ff-loader-overlay')
      );
      return !hasLoader && hasRouteContent;
    },
    null,
    { timeout }
  );
}

export async function gotoRoute(page, baseUrl, routePath, settleMs = 300, timeoutMs = 35000) {
  await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
  await waitForAppHydration(page, timeoutMs);
  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }
}

export async function reloadRoute(page, settleMs = 300, timeoutMs = 35000) {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: timeoutMs });
  await waitForAppHydration(page, timeoutMs);
  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }
}

export async function measureViewportOverflow(page) {
  return page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const innerWidth = window.innerWidth;
    return { scrollWidth, innerWidth, overflowX: scrollWidth > innerWidth + 1 };
  });
}

export async function measureContrastForSelector(page, selector) {
  return page.evaluate((sel) => {
    function parseRgb(str) {
      const m = str && str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
      if (!m) return null;
      return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
    }
    function relLum({ r, g, b }) {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    function effectiveBg(el) {
      let cur = el;
      while (cur) {
        const bg = parseRgb(getComputedStyle(cur).backgroundColor);
        if (bg && bg.a > 0.85) return bg;
        cur = cur.parentElement;
      }
      return parseRgb(getComputedStyle(document.body).backgroundColor) || { r: 15, g: 20, b: 20, a: 1 };
    }
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const fg = parseRgb(cs.color);
    const bg = effectiveBg(el);
    if (!fg || !bg) return null;
    const l1 = relLum(fg);
    const l2 = relLum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return { ratio: Number(ratio.toFixed(2)), fg: cs.color, bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})` };
  }, selector);
}

export async function countBackdropFiltersInViewport(page) {
  return page.evaluate(() => {
    let count = 0;
    const nodes = document.querySelectorAll('*');
    for (const el of nodes) {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
      const bf = cs.backdropFilter || cs.webkitBackdropFilter || 'none';
      if (bf && bf !== 'none') count += 1;
    }
    return count;
  });
}

export async function inspectVisibleButtons(page) {
  return page.evaluate(() => {
    const out = [];
    for (const btn of document.querySelectorAll('button, a[role="button"]')) {
      const r = btn.getBoundingClientRect();
      const cs = getComputedStyle(btn);
      if (r.width <= 0 || r.height <= 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
      const text = (btn.innerText || '').trim().replace(/\s+/g, ' ');
      const words = text ? text.split(' ').filter(Boolean).length : 0;
      const ariaLabel = (btn.getAttribute('aria-label') || '').trim();
      const title = (btn.getAttribute('title') || '').trim();
      const svg = btn.querySelector('svg');
      const svgRect = svg ? svg.getBoundingClientRect() : null;
      const svgClass = svg ? String(svg.getAttribute('class') || '') : '';
      out.push({
        text,
        words,
        chars: text.length,
        ariaLabel,
        title,
        width: Math.round(r.width),
        height: Math.round(r.height),
        hasSvg: Boolean(svg),
        svgWidth: svgRect ? Math.round(svgRect.width) : 0,
        svgHeight: svgRect ? Math.round(svgRect.height) : 0,
        svgClass,
      });
    }
    return out;
  });
}

export async function registerUserInBrowser(page, baseUrl, prefix = 'e2ebrowser') {
  const client = createSessionClient(baseUrl);
  const { username, email, password, res } = await client.registerAndLogin(prefix);
  assert.equal(res.status, 201, `User registration failed: ${res.status} ${res.text}`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  const loginRes = await page.evaluate(
    async ({ identifier, password: pw }) => {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password: pw }),
      });
      return { status: r.status, body: await r.json().catch(() => null) };
    },
    { identifier: username, password }
  );
  assert.equal(loginRes.status, 200, `Browser user login failed: ${JSON.stringify(loginRes)}`);
  return { username, email, password, user: loginRes.body?.user };
}

export async function loginAdminInBrowser(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  const loginRes = await page.evaluate(
    async ({ username, password }) => {
      const r = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      return { status: r.status, body: await r.json().catch(() => null) };
    },
    { username: DEFAULT_ADMIN_USER, password: DEFAULT_ADMIN_PASS }
  );
  assert.equal(loginRes.status, 200, `Browser admin login failed: ${JSON.stringify(loginRes)}`);
  return loginRes.body;
}

export async function seedWorkspaceArtifact(page, baseUrl, options = {}) {
  const htmlContent =
    options.html ||
    '<!doctype html><html><head><meta charset="utf-8"><title>E2E Artifact</title><link rel="stylesheet" href="styles.css"></head><body><main class="card"><h1>E2E Seeded Stage</h1><p>Verified artifact</p></main><script src="app.js"></script></body></html>';
  const cssContent =
    options.css ||
    'body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; }\n.card { border: 1px solid #ccc; padding: 16px; }';
  const jsContent = options.js || 'window.__e2eSeeded = true;\nconsole.info("e2e-seeded");';

  const routeHandler = async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Đã tạo bản dựng E2E mẫu.',
        files: [
          { path: 'index.html', content: htmlContent, summary: 'Trang HTML chính' },
          { path: 'styles.css', content: cssContent, summary: 'Bảng kiểu CSS' },
          { path: 'app.js', content: jsContent, summary: 'Script tương tác' },
        ],
        checksHint: ['HTML', 'CSS', 'JS'],
        fallback: false,
        modelUsed: 'gemini-3-flash-preview',
        protocolUsed: 'gemini',
        quota: {
          used: 1,
          limit: 15,
          remaining: 14,
          dailyUsed: 1,
          dailyLimit: 20,
          ipUsed: 1,
          ipLimit: 30,
          resetAt: new Date(Date.now() + 86400000).toISOString(),
          role: 'guest',
          sandboxEnabled: true,
          unlimited: false,
          exhausted: false,
        },
      }),
    });
  };

  await page.route('**/api/ai/chat', routeHandler);
  try {
    await gotoRoute(page, baseUrl, '/workspace', 500);
    const input = page.locator('.ws-dock .pcmp__input, .pcmp__input').first();
    await input.waitFor({ state: 'visible', timeout: 8000 });
    await input.fill(options.prompt || 'Tạo card E2E kiểm định');
    await input.press('Enter');
    await page.locator('iframe[sandbox]').first().waitFor({ state: 'attached', timeout: 10000 });
    await page.waitForTimeout(250);
  } finally {
    await page.unroute('**/api/ai/chat', routeHandler);
  }
}
