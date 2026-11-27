import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function parseCookieHeader(res) {
  const setCookies = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean);
  return setCookies.map((c) => c.split(';')[0].trim()).join('; ');
}

async function bootTestServer(extraEnv = {}) {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fforum-t5-'));

  const proc = spawn('npx', ['tsx', 'server/index.ts'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      FF_DISABLE_DOTENV: '1',
      FF_DATA_DIR: dataDir,
      SESSION_SECRET: 'tier5-adversarial-session-secret-32-chars',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD_HASH: '',
      ADMIN_BOOTSTRAP_PASSWORD: 'Tier5AdminPassword!2027',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      ...extraEnv,
    },
    stdio: 'pipe',
  });

  let stderrBuf = '';
  proc.stdout.on('data', () => {});
  proc.stderr.on('data', (chunk) => {
    stderrBuf += String(chunk);
  });

  const start = Date.now();
  let ready = false;
  while (Date.now() - start < 12000) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  if (!ready) {
    proc.kill('SIGKILL');
    fs.rmSync(dataDir, { recursive: true, force: true });
    throw new Error(`Server failed to start on ${baseUrl}${stderrBuf ? `\n${stderrBuf}` : ''}`);
  }

  return {
    baseUrl,
    dataDir,
    async close() {
      if (!proc.killed) {
        proc.kill('SIGTERM');
        await new Promise((r) => setTimeout(r, 350));
        if (!proc.killed) proc.kill('SIGKILL');
      }
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

describe('F-FORUM v3 Tier 5 Adversarial Hardening Suite', () => {
  const mockKey1 = ['AQ', '.Tier5MockKeyOne111111111111111_alpha'].join('');
  const mockKey2 = ['AQ', '.Tier5MockKeyTwo222222222222222_bravo'].join('');

  test('T5-A1: SSRF blocked in NODE_ENV=production (VERCEL unset and VERCEL=1) with 0 trap hits and manual redirects', async () => {
    let trapHits = 0;
    const trapServer = http.createServer((_req, res) => {
      trapHits += 1;
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end('INTERNAL_SECRET_AWS_ROLE=admin-prod-token');
    });
    await new Promise((resolve) => trapServer.listen(0, '127.0.0.1', resolve));
    const trapPort = trapServer.address().port;

    let srv;
    try {
      srv = await bootTestServer({
        NODE_ENV: 'production',
        VERCEL: '',
        AI_API_KEY_1: mockKey1,
        AI_API_KEY_2: mockKey2,
      });

      const ssrfUrls = [
        'http://169.254.169.254/latest/meta-data',
        `http://127.0.0.1:${trapPort}/secret`,
        `http://127.0.0.2:${trapPort}/secret`,
        `http://[::ffff:127.0.0.1]:${trapPort}/secret`,
        `http://[::7f00:1]:${trapPort}/secret`,
        `http://[64:ff9b::127.0.0.1]:${trapPort}/secret`,
        'https://[::7f00:1]/v1',
        'https://[64:ff9b::127.0.0.1]/v1',
        'http://10.0.0.5:8080/internal',
        'http://metadata.google.internal/computeMetadata/v1/',
        'http://api.external.example/v1',
      ];

      for (const badUrl of ssrfUrls) {
        const res = await fetch(`${srv.baseUrl}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-ff-byok-key': ['sk', 'test', 'byok', '123456'].join('-'),
            'x-ff-byok-url': badUrl,
            'x-ff-byok-protocol': 'openai-compatible',
          },
          body: JSON.stringify({ projectId: 'ssrf-p1', prompt: 'Hello' }),
        });
        assert.equal(res.status, 400, `Expected 400 for SSRF URL ${badUrl}, got ${res.status}`);
        const text = await res.text();
        assert.equal(text.includes('INTERNAL_SECRET_AWS_ROLE'), false);
      }
      assert.equal(trapHits, 0, 'SSRF trap server must never be reached');

      // Also verify quota was not burned by blocked SSRF requests
      const qRes = await fetch(`${srv.baseUrl}/api/ai/quota`);
      const qJson = await qRes.json();
      assert.equal(qJson.quota.used, 0);
    } finally {
      if (srv) await srv.close();
      trapServer.close();
    }
  });

  test('T5-A1b: upstream 302 redirect is blocked via redirect: manual', async () => {
    let internalHits = 0;
    const internalSrv = http.createServer((_req, res) => {
      internalHits += 1;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ secret: 'SHOULD_NOT_BE_REACHED' }));
    });
    const redirectSrv = http.createServer((_req, res) => {
      res.writeHead(302, { location: `http://127.0.0.1:${internalSrv.address().port}/steal` });
      res.end();
    });
    await new Promise((resolve) => internalSrv.listen(0, '127.0.0.1', resolve));
    await new Promise((resolve) => redirectSrv.listen(0, '127.0.0.1', resolve));
    const redirectPort = redirectSrv.address().port;

    let srv;
    try {
      srv = await bootTestServer({
        NODE_ENV: 'test',
        AI_API_KEY_1: mockKey1,
        AI_API_KEY_2: mockKey2,
      });
      const res = await fetch(`${srv.baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ff-byok-key': ['sk', 'test', 'byok', '123456'].join('-'),
          'x-ff-byok-url': `http://127.0.0.1:${redirectPort}`,
          'x-ff-byok-protocol': 'openai-compatible',
        },
        body: JSON.stringify({ projectId: 'redir-p1', prompt: 'Hello' }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.fallback, true);
      assert.ok(String(data.upstreamError || '').includes('redirect blocked'));
      assert.equal(internalHits, 0, 'Redirect target must never be contacted');
    } finally {
      if (srv) await srv.close();
      redirectSrv.close();
      internalSrv.close();
    }
  });

  test('T5-A2: AI_ACCOUNT_DAILY_LIMIT & AI_ACCOUNT_RPM_LIMIT enforced across key-pool/test and /api/ai/chat', async () => {
    let upstreamHits = 0;
    const mockGemini = http.createServer((_req, res) => {
      upstreamHits += 1;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
        })
      );
    });
    await new Promise((resolve) => mockGemini.listen(0, '127.0.0.1', resolve));
    const mockPort = mockGemini.address().port;

    let srv;
    try {
      srv = await bootTestServer({
        AI_PROTOCOL: 'gemini',
        AI_MODEL: 'gemini-3-flash-preview',
        AI_BASE_URL: `http://127.0.0.1:${mockPort}/v1beta`,
        AI_API_KEY_1: mockKey1,
        AI_API_KEY_2: mockKey2,
        AI_ACCOUNT_DAILY_LIMIT: '1',
        AI_ACCOUNT_RPM_LIMIT: '1',
      });

      const login = await fetch(`${srv.baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Tier5AdminPassword!2027' }),
      });
      assert.equal(login.status, 200);
      const adminCookie = parseCookieHeader(login);

      const p1 = await fetch(`${srv.baseUrl}/api/admin/key-pool/test`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({ mode: 'pool' }),
      });
      assert.equal(p1.status, 200);
      assert.equal(upstreamHits, 1);

      const p2 = await fetch(`${srv.baseUrl}/api/admin/key-pool/test`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({ mode: 'pool' }),
      });
      assert.equal(p2.status, 429, 'Second probe past daily/RPM limit must return 429');
      assert.equal(upstreamHits, 1, 'Exhausted cap must not contact upstream');

      const chat = await fetch(`${srv.baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({ projectId: 'cap-test', prompt: 'Build button' }),
      });
      assert.equal(chat.status, 200);
      const chatData = await chat.json();
      assert.equal(chatData.fallback, true);
      assert.equal(upstreamHits, 1, 'Pool-exhausted /api/ai/chat must fall back without upstream call');

      const stateRes = await fetch(`${srv.baseUrl}/api/admin/state`, {
        headers: { cookie: adminCookie },
      });
      const stateJson = await stateRes.json();
      assert.equal(stateJson.state.keyPool.sharedAccountQuota.dailyUsed, 1);
      assert.equal(stateJson.state.keyPool.sharedAccountQuota.remaining, 0);
    } finally {
      if (srv) await srv.close();
      mockGemini.close();
    }
  });

  test('T5-A3: Prototype-key corruption blocked across metricsStore, projectStore, and quotaStore', async () => {
    const srv = await bootTestServer();
    try {
      const hb = await fetch(`${srv.baseUrl}/api/metrics/heartbeat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'toString', deltaSeconds: 50 }),
      });
      assert.equal(hb.status, 400, 'Reserved sessionId "toString" must be rejected with 400');

      const regA = await fetch(`${srv.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.1' },
        body: JSON.stringify({
          username: 'proto_user_a',
          email: 'proto_a@example.com',
          password: 'UserPass123!',
        }),
      });
      assert.equal(regA.status, 201);
      const cookieA = parseCookieHeader(regA);
      await fetch(`${srv.baseUrl}/api/projects/sync`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieA },
        body: JSON.stringify({ project: { id: 'proj-legit-a', name: 'A', files: [] } }),
      });

      const regB = await fetch(`${srv.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.2' },
        body: JSON.stringify({
          username: 'proto_user_b',
          email: 'proto_b@example.com',
          password: 'UserPass123!',
        }),
      });
      assert.equal(regB.status, 201);
      const cookieB = parseCookieHeader(regB);
      const syncProto = await fetch(`${srv.baseUrl}/api/projects/sync`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieB },
        body: JSON.stringify({ project: { id: 'toString', name: 'B', files: [] } }),
      });
      assert.equal(syncProto.status, 400, 'Reserved project.id "toString" must return 400, never 403');

      const adminLogin = await fetch(`${srv.baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Tier5AdminPassword!2027' }),
      });
      const adminCookie = parseCookieHeader(adminLogin);
      for (const badId of ['__proto__', 'constructor', 'prototype', 'user:__proto__']) {
        const qMut = await fetch(`${srv.baseUrl}/api/admin/quotas`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: adminCookie },
          body: JSON.stringify({ subjectId: badId, blocked: true }),
        });
        assert.equal(qMut.status, 400, `Expected 400 for reserved subjectId ${badId}`);
      }
      assert.equal(({}).blocked, undefined, 'Object.prototype must never be polluted');
    } finally {
      await srv.close();
    }
  });

  test('T5-A4: Cooldown/error slots excluded from normal routing and failover_sim is non-destructive', async () => {
    let upstreamHits = 0;
    let return401 = true;
    const mockGemini = http.createServer((_req, res) => {
      upstreamHits += 1;
      if (return401) {
        res.writeHead(401, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Invalid key' } }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
          usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 5, totalTokenCount: 10 },
        })
      );
    });
    await new Promise((resolve) => mockGemini.listen(0, '127.0.0.1', resolve));
    const mockPort = mockGemini.address().port;

    let srv;
    try {
      srv = await bootTestServer({
        AI_PROTOCOL: 'gemini',
        AI_MODEL: 'gemini-3-flash-preview',
        AI_BASE_URL: `http://127.0.0.1:${mockPort}/v1beta`,
        AI_API_KEY_1: mockKey1,
        AI_API_KEY_2: mockKey2,
      });

      const chat1 = await fetch(`${srv.baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.10' },
        body: JSON.stringify({ projectId: 'cd-1', prompt: 'Hello' }),
      });
      assert.equal(chat1.status, 200);
      assert.equal(upstreamHits, 2, 'First request tries both keys and puts both in 300s error cooldown');

      const chat2 = await fetch(`${srv.baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.11' },
        body: JSON.stringify({ projectId: 'cd-2', prompt: 'Hello again' }),
      });
      assert.equal(chat2.status, 200);
      const chat2Data = await chat2.json();
      assert.equal(chat2Data.fallback, true);
      assert.equal(upstreamHits, 2, 'Second request within cooldown window must fire 0 upstream calls');
    } finally {
      if (srv) await srv.close();
    }

    // Separate server to test non-destructive failover_sim on healthy keys
    return401 = false;
    let srv2;
    try {
      srv2 = await bootTestServer({
        AI_PROTOCOL: 'gemini',
        AI_MODEL: 'gemini-3-flash-preview',
        AI_BASE_URL: `http://127.0.0.1:${mockPort}/v1beta`,
        AI_API_KEY_1: mockKey1,
        AI_API_KEY_2: mockKey2,
      });
      const login = await fetch(`${srv2.baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Tier5AdminPassword!2027' }),
      });
      const adminCookie = parseCookieHeader(login);

      const simRes = await fetch(`${srv2.baseUrl}/api/admin/key-pool/test`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({ mode: 'failover_sim' }),
      });
      assert.equal(simRes.status, 200);
      const simJson = await simRes.json();
      assert.equal(simJson.state.keyPool.keys[0].status, 'cooldown');

      const liveStateRes = await fetch(`${srv2.baseUrl}/api/admin/state`, {
        headers: { cookie: adminCookie },
      });
      const liveState = await liveStateRes.json();
      assert.equal(
        liveState.state.keyPool.keys[0].status,
        'active',
        'failover_sim must NOT leave live key-1 in destructive cooldown'
      );
    } finally {
      if (srv2) await srv2.close();
      mockGemini.close();
    }
  });

  test('T5-A5: Malformed /api/ai/chat files and attachedItems return 400 without burning quota', async () => {
    const srv = await bootTestServer();
    try {
      const reg = await fetch(`${srv.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.20' },
        body: JSON.stringify({
          username: 'val_user_t5',
          email: 'val_t5@example.com',
          password: 'UserPass123!',
        }),
      });
      const cookie = parseCookieHeader(reg);

      const badPayloads = [
        { projectId: 'p1', prompt: 'hello', files: [null] },
        { projectId: 'p1', prompt: 'hello', files: [{ path: 'a.js', content: 123 }] },
        { projectId: 'p1', prompt: 'hello', attachedItems: [null] },
        { projectId: 'p1', prompt: 'hello', history: [{ role: 'admin', content: 123 }] },
      ];

      for (const payload of badPayloads) {
        const res = await fetch(`${srv.baseUrl}/api/ai/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie },
          body: JSON.stringify(payload),
        });
        assert.equal(res.status, 400, `Expected 400 for malformed payload ${JSON.stringify(payload)}`);
      }

      const quotaRes = await fetch(`${srv.baseUrl}/api/ai/quota`, { headers: { cookie } });
      const quotaData = await quotaRes.json();
      assert.equal(quotaData.quota.used, 0, 'Malformed payloads must burn 0 quota turns');
    } finally {
      await srv.close();
    }
  });

  test('T5-A6: Community empty-seed GET does not rewrite disk & dossier IDOR rejects guest handle collision', async () => {
    const srv = await bootTestServer();
    try {
      const guestCreate = await fetch(`${srv.baseUrl}/api/community/create`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.30' },
        body: JSON.stringify({
          channel: 'clubs',
          title: 'Guest Club Security',
          body: 'Initial club',
        }),
      });
      assert.equal(guestCreate.status, 201);
      const guestClub = (await guestCreate.json()).post;
      const guestHandle = guestClub.author.handle;

      const hijackerReg = await fetch(`${srv.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.31' },
        body: JSON.stringify({
          username: guestHandle,
          email: 'hijacker@example.com',
          password: 'UserPass123!',
        }),
      });
      assert.equal(hijackerReg.status, 201);
      const hijackerCookie = parseCookieHeader(hijackerReg);

      const hijackDossier = await fetch(`${srv.baseUrl}/api/community/dossier`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: hijackerCookie },
        body: JSON.stringify({
          clubId: guestClub.id,
          dossier: { projectTitle: 'Hijacked Club' },
        }),
      });
      assert.equal(hijackDossier.status, 403, 'Handle-matching user must NOT hijack guest club dossier');

      // Also verify consecutive GET /api/community/list with 0 posts does not rewrite runtime-state.json
      const emptySrv = await bootTestServer();
      try {
        const list1 = await fetch(`${emptySrv.baseUrl}/api/community/list`);
        assert.equal(list1.status, 200);
        const runtimeFile = path.join(emptySrv.dataDir, 'runtime-state.json');
        const mtime1 = fs.statSync(runtimeFile).mtimeMs;
        await new Promise((r) => setTimeout(r, 30));
        const list2 = await fetch(`${emptySrv.baseUrl}/api/community/list`);
        assert.equal(list2.status, 200);
        const mtime2 = fs.statSync(runtimeFile).mtimeMs;
        assert.equal(mtime2, mtime1, 'GET /api/community/list must not rewrite disk when initialized with 0 posts');
      } finally {
        await emptySrv.close();
      }
    } finally {
      await srv.close();
    }
  });

  test('T5-A7: Preview sandbox CSP bypass, </style> breakout, and published page sanitizer fixes', () => {
    const script = [
      "import { compileSpecimenSrcDoc } from './src/features/explore/catalog.ts';",
      "import { renderPublicPageHtml } from './server/publishedPagesStore.ts';",
      "const bypassDoc = '<!DOCTYPE html><html><head><!-- http-equiv=\"Content-Security-Policy\" --><meta http-equiv=\"Content-Security-Policy\" content=\"connect-src *\"></head><body>Hi</body></html>';",
      "const compiledSpecimen = compileSpecimenSrcDoc(bypassDoc, '</style><script>alert(1)</script>', 'dark');",
      "const hasSandboxCsp = compiledSpecimen.includes(\"connect-src 'none'\");",
      "const hasPermissiveCsp = compiledSpecimen.includes('connect-src *');",
      "const hasRawCloseStyle = compiledSpecimen.includes('</style><script>');",
      "const snippetDoc = compileSpecimenSrcDoc('<div>hi</div>', '</style><img src=x>', 'light');",
      "const snippetRawCloseStyle = snippetDoc.includes('</style><img');",
      "const earlyHeadHtml = '<!DOCTYPE html><html><head><script>fetch(\"https://evil.com/early\")</script></head><body>Hi</body></html>';",
      "const earlySpecHead = compileSpecimenSrcDoc(earlyHeadHtml, '', 'dark');",
      "const specCspBeforeEarlyHeadScript = earlySpecHead.indexOf('Content-Security-Policy') !== -1 && earlySpecHead.indexOf('Content-Security-Policy') < earlySpecHead.indexOf('<script>fetch');",
      "const earlyBetweenHtml = '<!DOCTYPE html><html><script>fetch(\"https://evil.com/early\")</script><head></head><body>Hi</body></html>';",
      "const earlySpecBetween = compileSpecimenSrcDoc(earlyBetweenHtml, '', 'dark');",
      "const specCspBeforeBetweenScript = earlySpecBetween.indexOf('Content-Security-Policy') !== -1 && earlySpecBetween.indexOf('Content-Security-Policy') < earlySpecBetween.indexOf('<script>fetch');",
      "const pubHtml = renderPublicPageHtml({ slug: 'test-og', title: 'Test OG', summary: 'Summary', authorName: 'A', category: 'tech', personality: 'modern', html: '<!DOCTYPE html><html><head></head><body><a href=\"javascript:alert(1)\">x</a></body></html>', sourceIds: [], likes: 0, remixes: 0, createdAt: '', updatedAt: '' });",
      "const pubHasOg = pubHtml.includes('og:title') && pubHtml.includes('Tạo lại theo gu này');",
      "console.log(JSON.stringify({ hasSandboxCsp, hasPermissiveCsp, hasRawCloseStyle, snippetRawCloseStyle, specCspBeforeEarlyHeadScript, specCspBeforeBetweenScript, pubHasOg }));",
    ].join('\n');

    const out = execFileSync('npx', ['tsx', '-e', script], {
      cwd: projectRoot,
      encoding: 'utf8',
    }).trim();
    const res = JSON.parse(out);
    assert.equal(res.hasSandboxCsp, true);
    assert.equal(res.hasPermissiveCsp, false);
    assert.equal(res.hasRawCloseStyle, false);
    assert.equal(res.snippetRawCloseStyle, false);
    assert.equal(res.specCspBeforeEarlyHeadScript, true);
    assert.equal(res.specCspBeforeBetweenScript, true);
    assert.equal(res.pubHasOg, true);
  });

  test('T5-A10: HTML tokenizer blocks CSP neutralization via attributes, RCDATA/RAWTEXT, HTML5 comments, early elements, and <meta name="a>b">', () => {
    const script = [
      "import { compileSpecimenSrcDoc } from './src/features/explore/catalog.ts';",
      "const attrDoc = '<!DOCTYPE html><html><body data-x=\"<head>\"><script>fetch(\"https://evil.example\")</script></body></html>';",
      "const headAttrDoc = '<!DOCTYPE html><html><head data-x=\">\"><script>fetch(\"https://evil.example\")</script></head><body>Hi</body></html>';",
      "const titleDoc = '<!DOCTYPE html><html><title><head></title><body><script>fetch(\"https://evil.example\")</script></body></html>';",
      "const textareaDoc = '<!DOCTYPE html><html><textarea><head></textarea><body><script>fetch(\"https://evil.example\")</script></body></html>';",
      "const noscriptDoc = '<!DOCTYPE html><html><noscript><head></noscript><body><script>fetch(\"https://evil.example\")</script></body></html>';",
      "const templateDoc = '<!DOCTYPE html><html><template><head></template><body><script>fetch(\"https://evil.example\")</script></body></html>';",
      "const svgDoc = '<!DOCTYPE html><html><svg><head></svg><body><script>fetch(\"https://evil.example\")</script></body></html>';",
      "const metaAttrGtDoc = '<!DOCTYPE html><html><head><meta name=\"a>b\" http-equiv=\"Content-Security-Policy\" content=\"connect-src *\"></head><body>Hi</body></html>';",
      "const abruptCommentDoc = '<!DOCTYPE html><html><!--><script>fetch(\"https://example.com\")</script><!-- --><head></head><body>Hi</body></html>';",
      "const abruptDashCommentDoc = '<!DOCTYPE html><html><!---><script>fetch(\"https://example.com\")</script><!-- --><head></head><body>Hi</body></html>';",
      "const bangCommentDoc = '<!DOCTYPE html><html><!-- --!><script>fetch(\"https://example.com\")</script><!-- --><head></head><body>Hi</body></html>';",
      "const earlyStyleDoc = '<!DOCTYPE html><html><style>@import url(\"https://example.com/leak.css\");</style><head></head><body>Hi</body></html>';",
      "const earlyVideoDoc = '<!DOCTYPE html><html><video poster=\"https://example.com/poster.png\"></video><head></head><body>Hi</body></html>';",
      "const metaRefreshDoc = '<!DOCTYPE html><html><meta http-equiv=\"refresh\" content=\"0;url=https://example.com/refresh\"><meta HTTP-EQUIV=\" Refresh \" content=\"0;url=https://example.com/refresh2\"><meta http-equiv=\"&#114;efresh\" content=\"0;url=https://example.com/refresh3\"><meta http-equiv=\"set-cookie\" content=\"a=b\"><meta http-equiv=\"location\" content=\"https://example.com/loc\"><head></head><body>Hi</body></html>';",
      "const metaRefreshSnippet = '<div>hi</div><meta http-equiv=\"refresh\" content=\"0;url=https://example.com/refresh\">';",
      "function checkCsp(doc, expectedDirective) {",
      "  const cspIdx = doc.indexOf('Content-Security-Policy');",
      "  const scriptIdx = doc.indexOf('<script>fetch');",
      "  const styleLeakIdx = doc.indexOf('<style>@import');",
      "  const videoIdx = doc.indexOf('<video');",
      "  return {",
      "    hasCsp: cspIdx !== -1 && doc.includes(expectedDirective),",
      "    beforeBody: doc.indexOf('<body') === -1 || cspIdx < doc.indexOf('<body'),",
      "    beforeTitle: doc.indexOf('<title') === -1 || cspIdx < doc.indexOf('<title'),",
      "    beforeScript: scriptIdx === -1 || cspIdx < scriptIdx,",
      "    beforeStyle: styleLeakIdx === -1 || cspIdx < styleLeakIdx,",
      "    beforeVideo: videoIdx === -1 || cspIdx < videoIdx,",
      "    beforeTextarea: doc.indexOf('<textarea') === -1 || cspIdx < doc.indexOf('<textarea'),",
      "    beforeNoscript: doc.indexOf('<noscript') === -1 || cspIdx < doc.indexOf('<noscript'),",
      "    beforeTemplate: doc.indexOf('<template') === -1 || cspIdx < doc.indexOf('<template'),",
      "    beforeSvg: doc.indexOf('<svg') === -1 || cspIdx < doc.indexOf('<svg'),",
      "  };",
      "}",
      "const specAttr = compileSpecimenSrcDoc(attrDoc, '', 'dark');",
      "const specHeadAttr = compileSpecimenSrcDoc(headAttrDoc, '', 'dark');",
      "const specTitle = compileSpecimenSrcDoc(titleDoc, '', 'dark');",
      "const specTextarea = compileSpecimenSrcDoc(textareaDoc, '', 'dark');",
      "const specNoscript = compileSpecimenSrcDoc(noscriptDoc, '', 'dark');",
      "const specTemplate = compileSpecimenSrcDoc(templateDoc, '', 'dark');",
      "const specSvg = compileSpecimenSrcDoc(svgDoc, '', 'dark');",
      "const specMetaGt = compileSpecimenSrcDoc(metaAttrGtDoc, '', 'dark');",
      "const specAbrupt = compileSpecimenSrcDoc(abruptCommentDoc, '', 'dark');",
      "const specAbruptDash = compileSpecimenSrcDoc(abruptDashCommentDoc, '', 'dark');",
      "const specBang = compileSpecimenSrcDoc(bangCommentDoc, '', 'dark');",
      "const specEarlyStyle = compileSpecimenSrcDoc(earlyStyleDoc, '', 'dark');",
      "const specEarlyVideo = compileSpecimenSrcDoc(earlyVideoDoc, '', 'dark');",
      "const specMetaRefresh = compileSpecimenSrcDoc(metaRefreshDoc, '', 'dark');",
      "const specMetaRefreshSnippet = compileSpecimenSrcDoc(metaRefreshSnippet, '', 'dark');",
      "console.log(JSON.stringify({",
      "  specAttr: { ...checkCsp(specAttr, \"connect-src 'none'\"), intactDataX: specAttr.includes('data-x=\"<head>\"') },",
      "  specHeadAttr: { ...checkCsp(specHeadAttr, \"connect-src 'none'\"), intactHeadDataX: specHeadAttr.includes('data-x=\">\"'), cspAfterDataX: specHeadAttr.indexOf('data-x=\">\"') < specHeadAttr.indexOf('Content-Security-Policy') },",
      "  specTitle: { ...checkCsp(specTitle, \"connect-src 'none'\"), intactTitle: specTitle.includes('<title><head></title>') },",
      "  specTextarea: { ...checkCsp(specTextarea, \"connect-src 'none'\"), intactTextarea: specTextarea.includes('<textarea><head></textarea>') },",
      "  specNoscript: { ...checkCsp(specNoscript, \"connect-src 'none'\"), intactNoscript: specNoscript.includes('<noscript><head></noscript>') },",
      "  specTemplate: { ...checkCsp(specTemplate, \"connect-src 'none'\"), intactTemplate: specTemplate.includes('<template><head></template>') },",
      "  specSvg: { ...checkCsp(specSvg, \"connect-src 'none'\"), intactSvg: specSvg.includes('<svg><head></svg>') },",
      "  specMetaGt: { ...checkCsp(specMetaGt, \"connect-src 'none'\"), strippedPermissive: !specMetaGt.includes('connect-src *'), strippedAttrGt: !specMetaGt.includes('name=\"a>b\"') },",
      "  specAbrupt: checkCsp(specAbrupt, \"connect-src 'none'\"),",
      "  specAbruptDash: checkCsp(specAbruptDash, \"connect-src 'none'\"),",
      "  specBang: checkCsp(specBang, \"connect-src 'none'\"),",
      "  specEarlyStyle: checkCsp(specEarlyStyle, \"connect-src 'none'\"),",
      "  specEarlyVideo: checkCsp(specEarlyVideo, \"connect-src 'none'\"),",
      "  specMetaRefresh: { ...checkCsp(specMetaRefresh, \"connect-src 'none'\"), noRefresh: !/http-equiv\\s*=\\s*[\"']?[^\"'>]*(?:refresh|&#114;efresh|set-cookie|location)/i.test(specMetaRefresh) && !specMetaRefresh.includes('https://example.com/refresh') },",
      "  specMetaRefreshSnippet: { ...checkCsp(specMetaRefreshSnippet, \"connect-src 'none'\"), noRefresh: !/http-equiv\\s*=\\s*[\"']?refresh/i.test(specMetaRefreshSnippet) && !specMetaRefreshSnippet.includes('https://example.com/refresh'), hasDivHi: specMetaRefreshSnippet.includes('<div>hi</div>') },",
      "}));",
    ].join('\n');

    const out = execFileSync('npx', ['tsx', '-e', script], {
      cwd: projectRoot,
      encoding: 'utf8',
    }).trim();
    const res = JSON.parse(out);
    for (const [label, check] of Object.entries(res)) {
      assert.equal(check.hasCsp, true, `${label}: expected valid CSP`);
      assert.equal(check.beforeBody, true, `${label}: CSP must precede <body>`);
      assert.equal(check.beforeTitle, true, `${label}: CSP must precede <title>`);
      assert.equal(check.beforeScript, true, `${label}: CSP must precede <script>`);
      assert.equal(check.beforeStyle, true, `${label}: CSP must precede <style>`);
      assert.equal(check.beforeVideo, true, `${label}: CSP must precede <video>`);
      assert.equal(check.beforeTextarea, true, `${label}: CSP must precede <textarea>`);
      assert.equal(check.beforeNoscript, true, `${label}: CSP must precede <noscript>`);
      assert.equal(check.beforeTemplate, true, `${label}: CSP must precede <template>`);
      assert.equal(check.beforeSvg, true, `${label}: CSP must precede <svg>`);
    }
    assert.equal(res.specAttr.intactDataX, true);
    assert.equal(res.specHeadAttr.intactHeadDataX, true);
    assert.equal(res.specHeadAttr.cspAfterDataX, true);
    assert.equal(res.specTitle.intactTitle, true);
    assert.equal(res.specTextarea.intactTextarea, true);
    assert.equal(res.specNoscript.intactNoscript, true);
    assert.equal(res.specTemplate.intactTemplate, true);
    assert.equal(res.specSvg.intactSvg, true);
    assert.equal(res.specMetaGt.strippedPermissive, true);
    assert.equal(res.specMetaGt.strippedAttrGt, true);
    assert.equal(res.specMetaRefresh.noRefresh, true);
    assert.equal(res.specMetaRefreshSnippet.noRefresh, true);
    assert.equal(res.specMetaRefreshSnippet.hasDivHi, true);
  });

  test('T5-A11: Trailing-dot hostnames (localhost., metadata.google.internal., foo.local.) return 400 in production with 0 quota burned', async () => {
    const srv = await bootTestServer({
      NODE_ENV: 'production',
      VERCEL: '',
      AI_API_KEY_1: mockKey1,
      AI_API_KEY_2: mockKey2,
    });
    try {
      for (const badUrl of [
        'https://localhost./v1',
        'https://metadata.google.internal./computeMetadata/v1/',
        'https://foo.local./v1',
      ]) {
        const res = await fetch(`${srv.baseUrl}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-ff-byok-key': ['sk', 'test', 'byok', '123456'].join('-'),
            'x-ff-byok-url': badUrl,
            'x-ff-byok-protocol': 'openai-compatible',
          },
          body: JSON.stringify({ projectId: 'fqdn-dot-p1', prompt: 'Hello' }),
        });
        assert.equal(res.status, 400, `Expected 400 for trailing-dot SSRF URL ${badUrl}, got ${res.status}`);
      }
      const qRes = await fetch(`${srv.baseUrl}/api/ai/quota`);
      const qJson = await qRes.json();
      assert.equal(qJson.quota.used, 0, 'Trailing-dot blocked URLs must burn 0 quota');
    } finally {
      await srv.close();
    }
  });

  test('T5-A5b: Authenticated POST /api/projects/sync rejects malformed files/previousFiles/snapshots with 400 (never 500)', async () => {
    const srv = await bootTestServer();
    try {
      const reg = await fetch(`${srv.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.55' },
        body: JSON.stringify({
          username: 'sync_val_user',
          email: 'sync_val@example.com',
          password: 'UserPass123!',
        }),
      });
      assert.equal(reg.status, 201);
      const cookie = parseCookieHeader(reg);

      const badSyncPayloads = [
        { project: { id: 'p-bad-1', name: 'Bad 1', files: [null] } },
        { project: { id: 'p-bad-2', name: 'Bad 2', files: [{ path: 'a.js', content: 123 }] } },
        { project: { id: 'p-bad-3', name: 'Bad 3', files: 'not-an-array' } },
        { project: { id: 'p-bad-4', name: 'Bad 4', files: [], previousFiles: [null] } },
        {
          project: {
            id: 'p-bad-5',
            name: 'Bad 5',
            files: [],
            snapshots: [{ id: 's1', label: 'Snap', files: [{ path: 'a.js', content: 99 }] }],
          },
        },
      ];

      for (const payload of badSyncPayloads) {
        const res = await fetch(`${srv.baseUrl}/api/projects/sync`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie },
          body: JSON.stringify(payload),
        });
        assert.equal(
          res.status,
          400,
          `Expected 400 for malformed sync payload ${JSON.stringify(payload)}, got ${res.status}`
        );
      }
    } finally {
      await srv.close();
    }
  });

  test('T5-A8: Gateway apiKey clear, auth input bounds before scryptSync, token revocation on logout & acceptedAnswer sanitization', async () => {
    const srv = await bootTestServer();
    try {
      const adminLogin = await fetch(`${srv.baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Tier5AdminPassword!2027' }),
      });
      const adminCookie = parseCookieHeader(adminLogin);

      const setKey = await fetch(`${srv.baseUrl}/api/admin/gateway`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({ apiKey: 'sk-custom-gw-key-123456' }),
      });
      assert.equal((await setKey.json()).gateway.hasCustomApiKey, true);

      const clearKey = await fetch(`${srv.baseUrl}/api/admin/gateway`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({ apiKey: '' }),
      });
      assert.equal((await clearKey.json()).gateway.hasCustomApiKey, false);

      const longNameReg = await fetch(`${srv.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.40' },
        body: JSON.stringify({
          username: 'bound_u1',
          email: 'bound_u1@example.com',
          password: 'ValidPass123!',
          name: 'A'.repeat(200),
        }),
      });
      assert.equal(longNameReg.status, 400);

      const longPassReg = await fetch(`${srv.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.40' },
        body: JSON.stringify({
          username: 'bound_u2',
          email: 'bound_u2@example.com',
          password: 'P'.repeat(200),
        }),
      });
      assert.equal(longPassReg.status, 400);

      // Token revocation on logout
      const regOk = await fetch(`${srv.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.30.0.41' },
        body: JSON.stringify({
          username: 'revoke_user',
          email: 'revoke@example.com',
          password: 'UserPass123!',
        }),
      });
      assert.equal(regOk.status, 201);
      const userCookie = parseCookieHeader(regOk);

      const meBefore = await fetch(`${srv.baseUrl}/api/auth/me`, {
        headers: { cookie: userCookie },
      });
      assert.equal((await meBefore.json()).user?.username, 'revoke_user');

      const logout = await fetch(`${srv.baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { cookie: userCookie },
      });
      assert.equal(logout.status, 200);

      const meAfter = await fetch(`${srv.baseUrl}/api/auth/me`, {
        headers: { cookie: userCookie },
      });
      assert.equal((await meAfter.json()).user, null, 'Revoked session cookie must be rejected after logout');
    } finally {
      await srv.close();
    }
  });

  test('T5-B2 & T5-B7: secretScanner detects/redacts AQ.* tokens and securityGuard avoids 125% zoom false positives', async () => {
    const { scanFilesForSecrets, sanitizeFilesForZipExport } = await import(
      '../src/services/secretScanner.ts'
    );
    const fakeAqToken = ['AQ', '.SynthTestToken_1234567890XYZ'].join('');
    const files = [{ path: 'app.js', content: `const k = "${fakeAqToken}";` }];
    const scan = scanFilesForSecrets(files);
    assert.equal(scan.clean, false);
    assert.ok(scan.findings.some((f) => f.ruleId === 'SEC_AQ_TOKEN'));

    const exported = sanitizeFilesForZipExport(files);
    assert.equal(exported.sanitizedFiles[0].content.includes(fakeAqToken), false);
    assert.ok(exported.sanitizedFiles[0].content.includes('[REDACTED_SECRET]'));

    // Test isDevToolsProbablyOpen under simulated 125% zoom vs docked DevTools
    const guardScript = [
      "import { isDevToolsProbablyOpen } from './src/utils/securityGuard.ts';",
      "globalThis.window = { outerWidth: 1440, innerWidth: 1152, outerHeight: 900, innerHeight: 640 };",
      "const zoom125 = isDevToolsProbablyOpen();",
      "globalThis.window = { outerWidth: 1920, innerWidth: 1440, outerHeight: 960, innerHeight: 900 };",
      "const realDock = isDevToolsProbablyOpen();",
      "console.log(JSON.stringify({ zoom125, realDock }));",
    ].join('\n');
    const guardOut = execFileSync('npx', ['tsx', '-e', guardScript], {
      cwd: projectRoot,
      encoding: 'utf8',
    }).trim();
    const guardRes = JSON.parse(guardOut);
    assert.equal(guardRes.zoom125, false, '125% zoom must not trigger false-positive DevTools notice');
    assert.equal(guardRes.realDock, true, 'Docked DevTools must still trigger DevTools notice');
  });
});
