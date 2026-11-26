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

describe('F-FORUM v3 Security, RBAC & 2-Key Pool Suite (F4–F6)', () => {
  let serverProcess;
  let mockGeminiServer;
  let baseUrl;
  let mockGeminiPort;
  let testPort;
  let failKey1With429 = false;
  const mockSeenKeys = [];
  const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fforum-sec-test-'));

  const mockKey1 = ['AQ', '.MockTestKeyOne1111111111111111_alpha'].join('');
  const mockKey2 = ['AQ', '.MockTestKeyTwo2222222222222222_bravo'].join('');
  let adminHash = '';

  before(async () => {
    const hashScript = [
      "import { hashPassword } from './server/authEngine.ts';",
      "console.log(hashPassword('AdminStrongPass!2026'));",
    ].join('\n');
    adminHash = execFileSync('npx', ['tsx', '-e', hashScript], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { ...process.env, FF_DISABLE_DOTENV: '1', FF_DATA_DIR: testDataDir },
    }).trim();

    mockGeminiServer = http.createServer((req, res) => {
      const usedKey = String(req.headers['x-goog-api-key'] || '');
      mockSeenKeys.push(usedKey);

      if (failKey1With429 && usedKey === mockKey1) {
        res.writeHead(429, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            error: {
              code: 429,
              message: `Quota exceeded for key ${mockKey1} Bearer secretToken12345 ?key=${mockKey1}`,
            },
          })
        );
        return;
      }

      const payloadJson = JSON.stringify({
        message: 'Synthesized by mock Gemini pool',
        files: [
          { path: 'index.html', content: '<!doctype html><html><body>Pool</body></html>', summary: 'html' },
          { path: 'styles.css', content: 'body{margin:0}', summary: 'css' },
          { path: 'app.js', content: 'console.log("ok")', summary: 'js' },
        ],
        checksHint: ['Pool verified'],
      });

      if (req.url?.includes('streamGenerateContent')) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        const mid = Math.floor(payloadJson.length / 2);
        res.write(
          `data: ${JSON.stringify({
            candidates: [{ content: { parts: [{ text: payloadJson.slice(0, mid) }] } }],
            usageMetadata: { promptTokenCount: 25, candidatesTokenCount: 10, totalTokenCount: 35 },
          })}\n\n`
        );
        res.write(
          `data: ${JSON.stringify({
            candidates: [{ content: { parts: [{ text: payloadJson.slice(mid) }] } }],
            usageMetadata: {
              promptTokenCount: 25,
              candidatesTokenCount: 40,
              thoughtsTokenCount: 15,
              totalTokenCount: 80,
            },
          })}\n\n`
        );
        res.end();
        return;
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ ok: true }) }] } }],
          usageMetadata: {
            promptTokenCount: 12,
            candidatesTokenCount: 8,
            thoughtsTokenCount: 20,
            totalTokenCount: 40,
          },
        })
      );
    });

    await new Promise((resolve) => mockGeminiServer.listen(0, '127.0.0.1', resolve));
    mockGeminiPort = mockGeminiServer.address().port;

    testPort = await getFreePort();
    baseUrl = `http://127.0.0.1:${testPort}`;

    serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PORT: String(testPort),
        NODE_ENV: 'test',
        FF_DISABLE_DOTENV: '1',
        FF_DATA_DIR: testDataDir,
        SESSION_SECRET: 'test-session-secret-32-chars-minimum-len',
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD_HASH: adminHash,
        ADMIN_BOOTSTRAP_PASSWORD: '',
        AI_PROTOCOL: 'gemini',
        AI_BASE_URL: `http://127.0.0.1:${mockGeminiPort}/v1beta`,
        AI_MODEL: 'gemini-3-flash-preview',
        AI_API_KEY: '',
        AI_API_KEY_1: mockKey1,
        AI_API_KEY_2: mockKey2,
        AI_ACCOUNT_DAILY_LIMIT: '100',
        AI_ACCOUNT_RPM_LIMIT: '60',
        SUPABASE_URL: '',
        SUPABASE_SERVICE_ROLE_KEY: '',
      },
      stdio: 'pipe',
    });

    let stderrBuf = '';
    serverProcess.stdout.on('data', () => {});
    serverProcess.stderr.on('data', (chunk) => {
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
        await new Promise((r) => setTimeout(r, 150));
      }
    }
    if (!ready) throw new Error(`Server failed to boot at ${baseUrl}${stderrBuf ? `\n${stderrBuf}` : ''}`);
  });

  after(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 400));
      if (!serverProcess.killed) serverProcess.kill('SIGKILL');
    }
    if (mockGeminiServer) mockGeminiServer.close();
    try {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    } catch {
      void 0;
    }
  });

  test('F4: sanitizeErrorText redacts AQ.*, sk-*, AIza*, Bearer, and ?key= patterns', async () => {
    const script = [
      "import { sanitizeErrorText } from './server/keyPool.ts';",
      `const k1 = ${JSON.stringify(mockKey1)};`,
      `const k2 = ${JSON.stringify(mockKey2)};`,
      'const sample = [',
      '  `aq=${k1}`,',
      "  'sk=sk-proj99887766554433',",
      "  'gcp=AIzaSyD1234567890abcdef',",
      "  'auth=Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig',",
      '  `url=https://generativelanguage.googleapis.com/v1beta?key=${k2}&alt=sse`,',
      "].join(' ');",
      'console.log(sanitizeErrorText(sample));',
    ].join('\n');
    const clean = execFileSync('npx', ['tsx', '-e', script], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { ...process.env, FF_DISABLE_DOTENV: '1', FF_DATA_DIR: testDataDir },
    }).trim();
    assert.equal(clean.includes(mockKey1), false);
    assert.equal(clean.includes(mockKey2), false);
    assert.equal(clean.includes('sk-proj'), false);
    assert.equal(clean.includes('AIzaSyD'), false);
    assert.equal(clean.includes('eyJhbGci'), false);
    assert.ok(clean.includes('AQ.[REDACTED]'));
    assert.ok(clean.includes('Bearer [REDACTED]'));
    assert.ok(clean.includes('?key=[REDACTED]'));
  });

  test('F4: 2-key pool round-robin, 429 failover cooldown, Gemini token tracking & masked admin telemetry', async () => {
    const adminLogin = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.1' },
      body: JSON.stringify({ username: 'admin', password: 'AdminStrongPass!2026' }),
    });
    assert.equal(adminLogin.status, 200);
    const adminCookie = parseCookieHeader(adminLogin);

    const probe1 = await fetch(`${baseUrl}/api/admin/key-pool/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ mode: 'key1' }),
    });
    assert.equal(probe1.status, 200);
    const p1 = await probe1.json();
    assert.equal(p1.ok, true);
    assert.equal(p1.usedKeyMask, 'AQ.***alpha');
    assert.deepEqual(p1.tokens, { prompt: 12, completion: 28, total: 40 });

    const probe2 = await fetch(`${baseUrl}/api/admin/key-pool/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ mode: 'key2' }),
    });
    assert.equal(probe2.status, 200);
    const p2 = await probe2.json();
    assert.equal(p2.ok, true);
    assert.equal(p2.usedKeyMask, 'AQ.***bravo');
    assert.deepEqual(p2.tokens, { prompt: 12, completion: 28, total: 40 });

    failKey1With429 = true;
    const chatRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        cookie: adminCookie,
      },
      body: JSON.stringify({ projectId: 'pool-sse', prompt: 'Build card', stream: true }),
    });
    assert.equal(chatRes.status, 200);
    const sseText = await chatRes.text();
    assert.ok(sseText.includes('Synthesized by mock Gemini pool'));
    assert.equal(sseText.includes(mockKey1), false);
    assert.equal(sseText.includes(mockKey2), false);
    assert.equal(sseText.includes('usedKeyMask'), false);
    failKey1With429 = false;

    const stateRes = await fetch(`${baseUrl}/api/admin/state`, {
      headers: { cookie: adminCookie },
    });
    assert.equal(stateRes.status, 200);
    const stateText = await stateRes.text();
    assert.equal(stateText.includes(mockKey1), false, 'Raw key 1 must never appear in /api/admin/state');
    assert.equal(stateText.includes(mockKey2), false, 'Raw key 2 must never appear in /api/admin/state');

    const { state } = JSON.parse(stateText);
    assert.equal(state.keyPool.keys.length, 2);
    assert.equal(state.keyPool.keys[0].mask, 'AQ.***alpha');
    assert.equal(state.keyPool.keys[1].mask, 'AQ.***bravo');
    assert.ok(state.keyPool.keys[0].failovers >= 1);
    assert.equal(state.keyPool.keys[0].status, 'cooldown');
    assert.ok(state.keyPool.keys[0].lastError.includes('AQ.[REDACTED]'));
    assert.ok(state.keyPool.sharedAccountQuota.dailyUsed >= 3);
    assert.ok(state.totalTokens.total >= 160);
    assert.ok(state.totalTokens.prompt >= 49);
    assert.ok(state.totalTokens.completion >= 111);
  });

  test('F5: strict RBAC separation, POST-only logout, email stripped, public changelog, and brute-force lockout', async () => {
    const publicLoginAdmin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.2' },
      body: JSON.stringify({ identifier: 'admin', password: 'AdminStrongPass!2026' }),
    });
    assert.equal(publicLoginAdmin.status, 401, 'Public /api/auth/login must reject admin credentials');

    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.2' },
      body: JSON.stringify({
        username: 'rbac_std_user',
        email: 'rbac_std@example.com',
        password: 'UserPass123!',
      }),
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    assert.equal('email' in regData.user, false, 'Register response must strip email');
    const userCookie = parseCookieHeader(regRes);

    const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: userCookie } });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal('email' in meData.user, false, '/api/auth/me must strip email');

    const quotaRes = await fetch(`${baseUrl}/api/ai/quota`, { headers: { cookie: userCookie } });
    const quotaData = await quotaRes.json();
    assert.equal('email' in quotaData.user, false, '/api/ai/quota must strip email');
    assert.ok('dailyUsed' in quotaData.quota);
    assert.ok('dailyLimit' in quotaData.quota);
    assert.ok('ipUsed' in quotaData.quota);
    assert.ok('ipLimit' in quotaData.quota);
    assert.ok('resetAt' in quotaData.quota);
    assert.equal(quotaData.quota.role, 'user');
    assert.equal(quotaData.quota.sandboxEnabled, true);

    const anonChangelog = await fetch(`${baseUrl}/api/admin/changelog`);
    assert.equal(anonChangelog.status, 401);
    const stdChangelog = await fetch(`${baseUrl}/api/admin/changelog`, {
      headers: { cookie: userCookie },
    });
    assert.equal(stdChangelog.status, 403);
    const pubChangelog = await fetch(`${baseUrl}/api/changelog`);
    assert.equal(pubChangelog.status, 200);
    const pubClData = await pubChangelog.json();
    assert.ok(Array.isArray(pubClData.changelog) && pubClData.changelog.length >= 1);

    const getLogout = await fetch(`${baseUrl}/api/auth/logout`);
    assert.equal(getLogout.status, 405, 'GET /api/auth/logout must be rejected with 405');
    const postLogout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
    assert.equal(postLogout.status, 200);
    assert.ok((postLogout.headers.get('set-cookie') || '').includes('Max-Age=0'));

    const adminLogin = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.1' },
      body: JSON.stringify({ username: 'admin', password: 'AdminStrongPass!2026' }),
    });
    const adminCookie = parseCookieHeader(adminLogin);
    await fetch(`${baseUrl}/api/admin/toggle-role`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ userId: meData.user.id }),
    });
    const promotedPublicLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.2' },
      body: JSON.stringify({ identifier: 'rbac_std_user', password: 'UserPass123!' }),
    });
    assert.equal(promotedPublicLogin.status, 401, 'Promoted admin must be rejected by /api/auth/login');

    for (let i = 0; i < 5; i += 1) {
      const failRes = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.99' },
        body: JSON.stringify({ username: 'admin', password: `wrong-pass-${i}` }),
      });
      assert.equal(failRes.status, 401);
    }
    const lockedRes = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.99' },
      body: JSON.stringify({ username: 'admin', password: 'AdminStrongPass!2026' }),
    });
    assert.equal(lockedRes.status, 429, '6th admin login attempt must trigger 429 brute-force lockout');
  });

  test('F5: blocks x-ff-guest-id spoofing and enforces daily user/IP quotas + POST /api/admin/quotas', async () => {
    const spoofIp = '10.20.0.50';
    for (let turn = 1; turn <= 15; turn += 1) {
      const r = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': spoofIp,
          'x-ff-guest-id': `spoofed-guest-id-${turn}-${Math.random()}`,
        },
        body: JSON.stringify({ projectId: 'spoof-test', prompt: `Turn ${turn}` }),
      });
      assert.equal(r.status, 200);
    }
    const turn16 = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': spoofIp,
        'x-ff-guest-id': 'brand-new-spoofed-id-16',
      },
      body: JSON.stringify({ projectId: 'spoof-test', prompt: 'Turn 16' }),
    });
    assert.equal(turn16.status, 429, 'Rotating x-ff-guest-id must NOT bypass 15-turn guest quota');

    const adminLogin = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.1' },
      body: JSON.stringify({ username: 'admin', password: 'AdminStrongPass!2026' }),
    });
    const adminCookie = parseCookieHeader(adminLogin);

    const quotaRes = await fetch(`${baseUrl}/api/ai/quota`, {
      headers: { 'x-forwarded-for': spoofIp },
    });
    const qInfo = await quotaRes.json();
    const guestSubjectId = qInfo.quota.subjectId;

    const editQuota = await fetch(`${baseUrl}/api/admin/quotas`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ subjectId: guestSubjectId, customLimit: 17, blocked: false }),
    });
    assert.equal(editQuota.status, 200);

    const turn16AfterBoost = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': spoofIp },
      body: JSON.stringify({ projectId: 'spoof-test', prompt: 'Turn 16 after admin boost' }),
    });
    assert.equal(turn16AfterBoost.status, 200);

    const blockQuota = await fetch(`${baseUrl}/api/admin/quotas`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ subjectId: guestSubjectId, blocked: true }),
    });
    assert.equal(blockQuota.status, 200);

    const blockedTurn = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': spoofIp },
      body: JSON.stringify({ projectId: 'spoof-test', prompt: 'Blocked turn' }),
    });
    assert.equal(blockedTurn.status, 403);
  });

  test('F6: security headers, strict CORS allowlist, community field allowlist & pagination, IDOR fixes, rate limit & Vercel config', async () => {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.headers.get('x-powered-by'), null);
    assert.equal(healthRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(healthRes.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.ok(healthRes.headers.get('referrer-policy'));
    assert.ok(healthRes.headers.get('permissions-policy'));
    const defaultCsp = healthRes.headers.get('content-security-policy') || '';
    assert.ok(defaultCsp.includes("object-src 'none'"));
    assert.ok(defaultCsp.includes('https://d8j0ntlcm91z4.cloudfront.net'));

    const meNoStore = await fetch(`${baseUrl}/api/auth/me`);
    assert.ok((meNoStore.headers.get('cache-control') || '').includes('no-store'));

    const evilCors = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'https://evil.example' },
    });
    assert.equal(evilCors.headers.get('access-control-allow-origin'), null);

    const allowedCors = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'https://fforum3.vercel.app' },
    });
    assert.equal(allowedCors.headers.get('access-control-allow-origin'), 'https://fforum3.vercel.app');
    assert.equal(allowedCors.headers.get('access-control-allow-credentials'), 'true');

    const listRes = await fetch(`${baseUrl}/api/community/list?page=1&limit=3`);
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.page, 1);
    assert.equal(listData.limit, 3);
    assert.equal('reports' in listData, false);
    assert.equal('channels' in listData, false);
    assert.equal('posts' in listData, false);
    assert.ok(Array.isArray(listData.items) && listData.items.length <= 3);
    for (const item of listData.items) {
      assert.equal('upvotedBy' in item, false, 'upvotedBy array must be stripped');
      assert.equal(typeof item.viewerUpvoted, 'boolean');
    }

    const authorReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.60' },
      body: JSON.stringify({
        username: 'qa_author',
        email: 'qa_author@example.com',
        password: 'AuthorPass123!',
      }),
    });
    const authorCookie = parseCookieHeader(authorReg);

    const otherReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.61' },
      body: JSON.stringify({
        username: 'qa_other',
        email: 'qa_other@example.com',
        password: 'OtherPass123!',
      }),
    });
    const otherCookie = parseCookieHeader(otherReg);

    const createQa = await fetch(`${baseUrl}/api/community/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authorCookie },
      body: JSON.stringify({ channel: 'qa', title: 'IDOR test question', body: 'Need help' }),
    });
    assert.equal(createQa.status, 201);
    const createdQa = await createQa.json();
    assert.equal('reports' in createdQa, false);
    assert.equal('channels' in createdQa, false);
    const qaId = createdQa.post.id;

    const answerRes = await fetch(`${baseUrl}/api/community/answer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: otherCookie },
      body: JSON.stringify({ postId: qaId, content: 'Try this solution' }),
    });
    assert.equal(answerRes.status, 200);
    const answered = await answerRes.json();
    const answerId = answered.post.answers[0].id;

    const anonAccept = await fetch(`${baseUrl}/api/community/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ postId: qaId, answerId }),
    });
    assert.equal(anonAccept.status, 401);

    const otherAccept = await fetch(`${baseUrl}/api/community/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: otherCookie },
      body: JSON.stringify({ postId: qaId, answerId }),
    });
    assert.equal(otherAccept.status, 403);

    const authorAccept = await fetch(`${baseUrl}/api/community/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authorCookie },
      body: JSON.stringify({ postId: qaId, answerId }),
    });
    assert.equal(authorAccept.status, 200);
    const acceptedData = await authorAccept.json();
    assert.equal(acceptedData.post.isAccepted, true);

    const createClub = await fetch(`${baseUrl}/api/community/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authorCookie },
      body: JSON.stringify({ channel: 'clubs', title: 'Security Club', body: 'Club body' }),
    });
    const clubId = (await createClub.json()).post.id;

    const anonDossier = await fetch(`${baseUrl}/api/community/dossier`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clubId, dossier: { projectTitle: 'Hack' } }),
    });
    assert.equal(anonDossier.status, 401);

    const otherDossier = await fetch(`${baseUrl}/api/community/dossier`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: otherCookie },
      body: JSON.stringify({ clubId, dossier: { projectTitle: 'Hijack' } }),
    });
    assert.equal(otherDossier.status, 403);

    const authorDossier = await fetch(`${baseUrl}/api/community/dossier`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authorCookie },
      body: JSON.stringify({
        clubId,
        dossier: { projectTitle: 'Club Handover v1', handoverNotes: 'All clear' },
      }),
    });
    assert.equal(authorDossier.status, 200);

    const reportRes = await fetch(`${baseUrl}/api/community/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: otherCookie },
      body: JSON.stringify({ targetId: qaId, reason: 'Test moderation report' }),
    });
    assert.equal(reportRes.status, 201);
    const reportJson = await reportRes.json();
    assert.equal(reportJson.ok, true);
    assert.equal('reports' in reportJson, false);

    const burstIp = '10.20.0.88';
    let got429 = false;
    for (let i = 0; i < 32; i += 1) {
      const r = await fetch(`${baseUrl}/api/metrics/visit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': burstIp },
        body: JSON.stringify({ visitorId: `burst-${i}` }),
      });
      if (r.status === 429) {
        got429 = true;
        assert.ok(r.headers.get('retry-after'));
        break;
      }
    }
    assert.equal(got429, true, 'Burst /api/metrics/visit must trigger 429 sliding-window limit');

    assert.ok(fs.existsSync(path.join(projectRoot, 'api/index.ts')), 'Missing consolidated api/index.ts');
    const apiFiles = fs.readdirSync(path.join(projectRoot, 'api'), { recursive: true })
      .filter((f) => String(f).endsWith('.ts'));
    assert.ok(apiFiles.length <= 12, `Vercel Hobby plan allows <= 12 serverless functions, found ${apiFiles.length}`);

    const vercel = JSON.parse(fs.readFileSync(path.join(projectRoot, 'vercel.json'), 'utf8'));
    assert.ok(
      Array.isArray(vercel.rewrites) &&
        vercel.rewrites.some((r) => r.source === '/api/(.*)' && r.destination === '/api/index'),
      'vercel.json must rewrite /api/(.*) to consolidated /api/index'
    );
    const allHeaders = vercel.headers.flatMap((h) => h.headers.map((x) => `${h.source}:${x.key}:${x.value}`));
    assert.ok(allHeaders.some((s) => s.includes('Content-Security-Policy')));
    assert.ok(allHeaders.some((s) => s.includes('Strict-Transport-Security')));
    assert.ok(allHeaders.some((s) => s.startsWith('/api/(.*):Cache-Control:no-store')));
    const idxAll = vercel.headers.findIndex((h) => h.source === '/(.*)');
    const idxSim = vercel.headers.findIndex((h) => h.source.includes('iphone18-simulator'));
    assert.ok(idxSim > idxAll && idxAll >= 0, 'Simulator CSP rule must follow /(.*)');
    const simCsp = vercel.headers[idxSim].headers.find((h) => h.key === 'Content-Security-Policy')?.value || '';
    assert.ok(simCsp.includes('https://api.open-meteo.com'));
    assert.ok(simCsp.includes('https://nominatim.openstreetmap.org'));
    assert.ok(simCsp.includes('https://api.mymemory.translated.net'));
    assert.ok(simCsp.includes('https://www.openstreetmap.org'));
  });

  test('R2: malformed cookie, malformed URL param, malformed JSON body, and JSON 404 fallback', async () => {
    const userReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.71' },
      body: JSON.stringify({
        username: 'malformed_cookie_user',
        email: 'malformed_cookie@example.com',
        password: 'CookieUserPass123!',
      }),
    });
    assert.equal(userReg.status, 201);
    const validCookie = parseCookieHeader(userReg);

    const badCookieAnon = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie: 'bad=%ZZ' },
    });
    assert.equal(badCookieAnon.status, 200);
    assert.ok((badCookieAnon.headers.get('content-type') || '').includes('application/json'));
    const badAnonData = await badCookieAnon.json();
    assert.equal(badAnonData.user, null);

    const badCookieWithSession = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie: `bad=%ZZ; ${validCookie}` },
    });
    assert.equal(badCookieWithSession.status, 200);
    const sessionData = await badCookieWithSession.json();
    assert.equal(sessionData.user?.username, 'malformed_cookie_user');

    const badParam = await fetch(`${baseUrl}/api/auth/%ZZ`);
    assert.equal(badParam.status, 400);
    assert.ok((badParam.headers.get('content-type') || '').includes('application/json'));
    const badParamText = await badParam.text();
    assert.equal(badParamText.includes('<!DOCTYPE'), false);
    assert.ok(JSON.parse(badParamText).error);

    const badJson = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.72' },
      body: '{bad',
    });
    assert.equal(badJson.status, 400);
    assert.ok((badJson.headers.get('content-type') || '').includes('application/json'));
    const badJsonText = await badJson.text();
    assert.equal(badJsonText.includes('<!DOCTYPE'), false);
    assert.ok(JSON.parse(badJsonText).error);

    const missingRoute = await fetch(`${baseUrl}/api/nonexistent-endpoint-r2`);
    assert.equal(missingRoute.status, 404);
    assert.ok((missingRoute.headers.get('content-type') || '').includes('application/json'));
    assert.ok((await missingRoute.json()).error);
  });

  test('R2: admin contract alignment (/api/admin, /api/admin/security-events, /api/admin/quotas, key-pool aliases)', async () => {
    const anonRoot = await fetch(`${baseUrl}/api/admin`);
    assert.equal(anonRoot.status, 401);
    const anonEvents = await fetch(`${baseUrl}/api/admin/security-events?limit=5`);
    assert.equal(anonEvents.status, 401);

    const stdReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.73' },
      body: JSON.stringify({
        username: 'r2_contract_user',
        email: 'r2_contract@example.com',
        password: 'ContractUser123!',
      }),
    });
    assert.equal(stdReg.status, 201);
    const stdData = await stdReg.json();
    const stdCookie = parseCookieHeader(stdReg);
    const stdUserId = stdData.user.id;

    const stdRoot = await fetch(`${baseUrl}/api/admin`, { headers: { cookie: stdCookie } });
    assert.equal(stdRoot.status, 403);
    const stdEvents = await fetch(`${baseUrl}/api/admin/security-events?limit=5`, {
      headers: { cookie: stdCookie },
    });
    assert.equal(stdEvents.status, 403);

    const adminLogin = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.74' },
      body: JSON.stringify({ username: 'admin', password: 'AdminStrongPass!2026' }),
    });
    assert.equal(adminLogin.status, 200);
    const adminCookie = parseCookieHeader(adminLogin);

    const adminRoot = await fetch(`${baseUrl}/api/admin`, { headers: { cookie: adminCookie } });
    assert.equal(adminRoot.status, 200);
    assert.ok((await adminRoot.json()).state);

    const adminEventsRes = await fetch(`${baseUrl}/api/admin/security-events?limit=5`, {
      headers: { cookie: adminCookie },
    });
    assert.equal(adminEventsRes.status, 200);
    const adminEventsData = await adminEventsRes.json();
    assert.ok(Array.isArray(adminEventsData.events));
    assert.ok(adminEventsData.events.length >= 1 && adminEventsData.events.length <= 5);

    const badNegQuota = await fetch(`${baseUrl}/api/admin/quotas`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ subjectId: stdUserId, dailyLimit: -5 }),
    });
    assert.equal(badNegQuota.status, 400);

    const dailyLimitRes = await fetch(`${baseUrl}/api/admin/quotas`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ subjectId: stdUserId, dailyLimit: 24 }),
    });
    assert.equal(dailyLimitRes.status, 200);
    const dailyLimitState = (await dailyLimitRes.json()).state;
    const matchedUserRecord = dailyLimitState.usersAndQuotas.find(
      (r) => r.subjectId === `user:${stdUserId}`
    );
    assert.equal(matchedUserRecord?.dailyLimit, 24);

    const limitAliasRes = await fetch(`${baseUrl}/api/admin/quotas`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ subjectId: stdUserId, limit: 29, reset: true }),
    });
    assert.equal(limitAliasRes.status, 200);
    const quotaAfterStd = await fetch(`${baseUrl}/api/ai/quota`, {
      headers: { cookie: stdCookie },
    });
    const qStd = await quotaAfterStd.json();
    assert.equal(qStd.quota.limit, 29);
    assert.equal(qStd.quota.used, 0);

    const invalidModeRes = await fetch(`${baseUrl}/api/admin/key-pool/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ mode: 'invalid_mode_xyz' }),
    });
    assert.equal(invalidModeRes.status, 400);

    const probeAliasRes = await fetch(`${baseUrl}/api/admin/key-pool/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ mode: 'failover_sim' }),
    });
    assert.equal(probeAliasRes.status, 200);
    const probeAlias = await probeAliasRes.json();
    assert.equal(probeAlias.ok, true);
    assert.ok(typeof probeAlias.keyId === 'string' && probeAlias.keyId.length > 0);
    assert.ok(typeof probeAlias.keyMask === 'string' && probeAlias.keyMask.startsWith('AQ.***'));
    assert.equal(probeAlias.mask, probeAlias.keyMask);
    assert.equal(probeAlias.preview, probeAlias.replyPreview);
    assert.equal(probeAlias.failoverTriggered, true);
  });

  test('R2: standalone NODE_ENV=production + TRUST_PROXY=0 ignores spoofed X-Forwarded-For', async () => {
    const prodPort = await getFreePort();
    const prodBase = `http://127.0.0.1:${prodPort}`;
    const prodDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fforum-sec-prod-'));
    const prodProc = spawn('npx', ['tsx', 'server/index.ts'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PORT: String(prodPort),
        NODE_ENV: 'production',
        TRUST_PROXY: '0',
        VERCEL: '',
        FF_DISABLE_DOTENV: '1',
        FF_DATA_DIR: prodDataDir,
        SESSION_SECRET: 'prod-trust-proxy-test-secret-32-chars',
        SUPABASE_URL: '',
        SUPABASE_SERVICE_ROLE_KEY: '',
      },
      stdio: 'pipe',
    });
    prodProc.stdout.on('data', () => {});
    prodProc.stderr.on('data', () => {});

    try {
      let ready = false;
      const start = Date.now();
      while (Date.now() - start < 12000) {
        try {
          const r = await fetch(`${prodBase}/api/health`);
          if (r.ok) {
            ready = true;
            break;
          }
        } catch {
          await new Promise((r) => setTimeout(r, 150));
        }
      }
      assert.equal(ready, true, 'Standalone production server must boot');

      const q1 = await fetch(`${prodBase}/api/ai/quota`, {
        headers: { 'x-forwarded-for': '1.1.1.1' },
      });
      const q2 = await fetch(`${prodBase}/api/ai/quota`, {
        headers: { 'x-forwarded-for': '2.2.2.2', 'x-real-ip': '3.3.3.3' },
      });
      assert.equal(q1.status, 200);
      assert.equal(q2.status, 200);
      const d1 = await q1.json();
      const d2 = await q2.json();
      assert.equal(d1.quota.subjectId, d2.quota.subjectId, 'Spoofed XFF must resolve to same IP subject');
    } finally {
      if (!prodProc.killed) {
        prodProc.kill('SIGTERM');
        await new Promise((r) => setTimeout(r, 300));
        if (!prodProc.killed) prodProc.kill('SIGKILL');
      }
      try {
        fs.rmSync(prodDataDir, { recursive: true, force: true });
      } catch {
        void 0;
      }
    }
  });

  test('R2: activeDossier bounds, hidden posts blocked on public mutations & unhideable by admin, project IDOR & bounded loginFailures', async () => {
    const authorReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.75' },
      body: JSON.stringify({
        username: 'r2_club_owner',
        email: 'r2_club_owner@example.com',
        password: 'OwnerPass123!',
      }),
    });
    const authorCookie = parseCookieHeader(authorReg);

    const otherReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.76' },
      body: JSON.stringify({
        username: 'r2_other_member',
        email: 'r2_other_member@example.com',
        password: 'OtherPass123!',
      }),
    });
    const otherCookie = parseCookieHeader(otherReg);

    const adminLogin = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.20.0.77' },
      body: JSON.stringify({ username: 'admin', password: 'AdminStrongPass!2026' }),
    });
    const adminCookie = parseCookieHeader(adminLogin);

    const oversizedDossierRes = await fetch(`${baseUrl}/api/community/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authorCookie },
      body: JSON.stringify({
        channel: 'clubs',
        title: 'Club Bounds Check',
        body: 'Body',
        activeDossier: { projectTitle: 'x'.repeat(200) },
      }),
    });
    assert.equal(oversizedDossierRes.status, 400);

    const validClubRes = await fetch(`${baseUrl}/api/community/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authorCookie },
      body: JSON.stringify({
        channel: 'clubs',
        title: 'Sanitized Dossier Club',
        body: 'Body',
        activeDossier: {
          projectTitle: 'Sanitized Title',
          handoverNotes: 'n'.repeat(4500),
          nextMilestones: Array.from({ length: 25 }, (_, i) => `M${i}-${'z'.repeat(250)}`),
          ownerHandle: 'spoofed_handle',
        },
      }),
    });
    assert.equal(validClubRes.status, 201);
    const validClub = await validClubRes.json();
    assert.equal(validClub.post.activeDossier.ownerHandle, 'r2_club_owner');
    assert.equal(validClub.post.activeDossier.handoverNotes.length, 4000);
    assert.equal(validClub.post.activeDossier.nextMilestones.length, 20);
    assert.equal(validClub.post.activeDossier.nextMilestones[0].length, 200);

    const qaCreate = await fetch(`${baseUrl}/api/community/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authorCookie },
      body: JSON.stringify({ channel: 'qa', title: 'Moderation Hide Test', body: 'Test body' }),
    });
    const qaPostId = (await qaCreate.json()).post.id;

    const preHideAnswer = await fetch(`${baseUrl}/api/community/answer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: otherCookie },
      body: JSON.stringify({ postId: qaPostId, content: 'Pre-hide answer' }),
    });
    const answerId = (await preHideAnswer.json()).post.answers[0].id;

    const reportRes = await fetch(`${baseUrl}/api/community/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: otherCookie },
      body: JSON.stringify({ targetId: qaPostId, reason: 'Hide test report' }),
    });
    const reportId = (await reportRes.json()).reportId;

    const hideRes = await fetch(`${baseUrl}/api/admin/moderate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ reportId, status: 'hidden' }),
    });
    assert.equal(hideRes.status, 200);

    for (const [act, payload] of [
      ['upvote', { postId: qaPostId }],
      ['answer', { postId: qaPostId, content: 'Should fail' }],
      ['accept', { postId: qaPostId, answerId }],
      ['fork', { postId: qaPostId }],
      ['dossier', { clubId: qaPostId, dossier: { projectTitle: 'Nope' } }],
    ]) {
      const mutRes = await fetch(`${baseUrl}/api/community/${act}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: authorCookie },
        body: JSON.stringify(payload),
      });
      assert.equal(mutRes.status, 404, `Hidden post must return 404 on ${act}`);
    }

    const unhideRes = await fetch(`${baseUrl}/api/admin/moderate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ reportId, status: 'approved' }),
    });
    assert.equal(unhideRes.status, 200);

    const upvoteAfterUnhide = await fetch(`${baseUrl}/api/community/upvote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: otherCookie },
      body: JSON.stringify({ postId: qaPostId }),
    });
    assert.equal(upvoteAfterUnhide.status, 200);

    const sharedProjId = `proj-owner-${Date.now()}`;
    const ownerSync = await fetch(`${baseUrl}/api/projects/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: authorCookie },
      body: JSON.stringify({ project: { id: sharedProjId, name: 'Owner Project', files: [] } }),
    });
    assert.equal(ownerSync.status, 200);

    const hijackSync = await fetch(`${baseUrl}/api/projects/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: otherCookie },
      body: JSON.stringify({ project: { id: sharedProjId, name: 'Hijacked Project', files: [] } }),
    });
    assert.equal(hijackSync.status, 403);

    const lockoutScript = [
      "import { recordLoginFailure, getLoginFailuresSizeForTest } from './server/authEngine.ts';",
      'for (let i = 0; i < 6000; i += 1) {',
      "  recordLoginFailure('user', `ip_${i}`, `user_${i}_${'a'.repeat(150)}`);",
      '}',
      'console.log(getLoginFailuresSizeForTest());',
    ].join('\n');
    const mapSizeStr = execFileSync('npx', ['tsx', '-e', lockoutScript], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { ...process.env, FF_DISABLE_DOTENV: '1', FF_DATA_DIR: testDataDir },
    }).trim();
    const mapSize = Number(mapSizeStr);
    assert.ok(mapSize > 0 && mapSize <= 5000, `Expected loginFailures size <= 5000, got ${mapSize}`);
  });
});
