import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createSessionClient,
  DEFAULT_ADMIN_PASS,
  DEFAULT_ADMIN_USER,
  DEFAULT_POOL_KEY_1_MASK,
  DEFAULT_POOL_KEY_2_MASK,
  gotoRoute,
  inspectVisibleButtons,
  loginAdminInBrowser,
  makeSyntheticPoolPair,
  makeSyntheticSecret,
  measureViewportOverflow,
  registerUserInBrowser,
  reloadRoute,
  scanDistAssets,
  seedWorkspaceArtifact,
  startIsolatedServer,
  startMockUpstream,
  withPage,
} from './harness.mjs';

export function getTier2Tests() {
  return [
    // =========================================================================
    // F1 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F1-01',
      tier: 2,
      feature: 'F1',
      timeoutMs: 120000,
      title: 'Icon-only buttons without visible text never lack aria-label',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          for (const route of ['/', '/home', '/explore', '/workspace', '/community', '/settings']) {
            await gotoRoute(page, ctx.baseUrl, route, 350);
            await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 25000 });
            await page.locator('button:visible').first().waitFor({ state: 'visible', timeout: 20000 });
            const unlabeled = await page.evaluate(() => {
              const bad = [];
              for (const btn of document.querySelectorAll('button')) {
                const r = btn.getBoundingClientRect();
                const cs = getComputedStyle(btn);
                if (r.width <= 0 || r.height <= 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
                const text = (btn.innerText || '').trim();
                const aria = (btn.getAttribute('aria-label') || '').trim();
                const labelledBy = (btn.getAttribute('aria-labelledby') || '').trim();
                if (!text && !aria && !labelledBy) {
                  bad.push(btn.outerHTML.slice(0, 100));
                }
              }
              return bad;
            });
            assert.equal(unlabeled.length, 0, `Unlabeled icon-only buttons on ${route}: ${unlabeled.join(' | ')}`);
          }
        });
      },
    },
    {
      id: 'T2-F1-02',
      tier: 2,
      feature: 'F1',
      timeoutMs: 75000,
      title: 'Mobile bottom nav & header icon controls avoid clipping at 390px',
      async run(ctx) {
        await withPage(ctx.browser, { viewport: { width: 390, height: 844 } }, async (page) => {
          for (const route of ['/home', '/explore', '/community']) {
            await gotoRoute(page, ctx.baseUrl, route, 450);
            const overflow = await measureViewportOverflow(page);
            assert.equal(overflow.overflowX, false, `Horizontal overflow at 390px on ${route}`);
            const bnavHeights = await page.evaluate(() =>
              Array.from(document.querySelectorAll('.mobile-bnav button, .mobile-bnav a')).map((el) =>
                Math.round(el.getBoundingClientRect().height)
              )
            );
            assert.ok(bnavHeights.length > 0 && bnavHeights.every((h) => h >= 44), `Touch target < 44px on ${route}: ${bnavHeights}`);
          }
        });
      },
    },
    {
      id: 'T2-F1-03',
      tier: 2,
      feature: 'F1',
      title: 'Unknown notification kind renders safe default SVG without throwing',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/home', 450);
          await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('ff:push-notification', {
              detail: { id: 'e2e-unk', kind: 'unknown-type-2027', title: 'Fallback notice', body: 'Test' },
            }));
          });
          await page.waitForTimeout(200);
          await page.getByRole('button', { name: /Thông báo/i }).first().click();
          const dialog = page.locator('[role="dialog"]').last();
          await dialog.waitFor({ state: 'visible', timeout: 4000 });
          const text = await dialog.innerText();
          assert.ok(text.includes('Fallback notice'), 'Expected Fallback notice rendered in NotificationBell dialog');
          assert.ok((await dialog.locator('svg').count()) > 0, 'Expected fallback <svg> icon inside NotificationBell dialog');
          assert.equal(trackers.pageErrors.length, 0, `Page error on unknown notification kind: ${trackers.pageErrors.join('; ')}`);
        });
      },
    },
    {
      id: 'T2-F1-04',
      tier: 2,
      feature: 'F1',
      title: 'Custom SVGs use crisp vector viewBox with zero bitmap icon tiles',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/home', 450);
          const check = await page.evaluate(() => {
            const svgs = Array.from(document.querySelectorAll('header svg, nav svg')).map((s) => ({
              viewBox: s.getAttribute('viewBox') || '',
              w: Math.round(s.getBoundingClientRect().width),
            }));
            const rasterInBtns = document.querySelectorAll('header button img, nav button img').length;
            return { svgs, rasterInBtns };
          });
          assert.ok(check.svgs.length > 0, 'Expected SVG icons in header/nav');
          assert.equal(check.rasterInBtns, 0, 'Found raster <img> icon tiles inside header/nav buttons');
          for (const s of check.svgs) {
            assert.ok(s.viewBox.length > 0, 'SVG icon missing viewBox attribute');
          }
        });
      },
    },
    {
      id: 'T2-F1-05',
      tier: 2,
      feature: 'F1',
      timeoutMs: 90000,
      title: 'No UI action button exceeds terseness bounds in upgraded chrome',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          for (const route of ['/home', '/workspace', '/community', '/honor']) {
            await gotoRoute(page, ctx.baseUrl, route, 400);
            await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 25000 });
            await page.locator('button:visible').first().waitFor({ state: 'visible', timeout: 25000 });
            const buttons = await inspectVisibleButtons(page);
            const bloated = buttons.filter((b) => b.words > 4 && b.chars > 32);
            assert.equal(bloated.length, 0, `Verbose buttons on ${route}: ${JSON.stringify(bloated.map((x) => x.text))}`);
          }
        });
      },
    },

    // =========================================================================
    // F2 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F2-01',
      tier: 2,
      feature: 'F2',
      timeoutMs: 120000,
      title: 'prefers-reduced-motion disables continuous loops & collapses transition durations',
      async run(ctx) {
        await withPage(ctx.browser, { reducedMotion: true }, async (page, trackers) => {
          for (const route of ['/', '/home', '/explore', '/workspace']) {
            await gotoRoute(page, ctx.baseUrl, route, 450);
            const durations = await page.evaluate(() => {
              const cs = getComputedStyle(document.body);
              return { transitionDuration: cs.transitionDuration, animationDuration: cs.animationDuration };
            });
            const parseSec = (val) => {
              const first = String(val || '0s').split(',')[0].trim();
              const n = parseFloat(first);
              if (Number.isNaN(n)) return 999;
              return first.endsWith('ms') ? n / 1000 : n;
            };
            assert.ok(
              parseSec(durations.transitionDuration) <= 0.05,
              `Expected reduced transitionDuration <= 0.05s on ${route}, got ${durations.transitionDuration}`
            );
            assert.ok(
              parseSec(durations.animationDuration) <= 0.05,
              `Expected reduced animationDuration <= 0.05s on ${route}, got ${durations.animationDuration}`
            );
            if (route === '/') {
              const headingOpacity = await page.evaluate(() => {
                const h = document.querySelector('.lp-hm-headline, h1');
                return h ? Number(getComputedStyle(h).opacity) : 0;
              });
              assert.equal(headingOpacity, 1, 'Expected scroll-reveal text to stay readable (opacity 1) under reducedMotion');
            }
          }
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F2-02',
      tier: 2,
      feature: 'F2',
      timeoutMs: 240000,
      title: 'Zero horizontal overflow across all public routes at 390px, 768px, 1440px',
      async run(ctx) {
        const routes = ['/', '/home', '/explore', '/explore/experience', '/workspace', '/community', '/profile', '/settings', '/honor'];
        const viewports = [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }];
        await withPage(ctx.browser, { viewport: viewports[0] }, async (page) => {
          for (const route of routes) {
            await page.setViewportSize(viewports[0]);
            await gotoRoute(page, ctx.baseUrl, route, 300);
            try {
              await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 25000 });
            } catch (err) {
              throw new Error(`Route ${route} heading wait failed: ${err instanceof Error ? err.message : String(err)}`);
            }
            for (let i = 0; i < viewports.length; i += 1) {
              const vp = viewports[i];
              if (i > 0) {
                await page.setViewportSize(vp);
                await page.waitForTimeout(150);
              }
              const ov = await measureViewportOverflow(page);
              assert.equal(ov.overflowX, false, `Overflow at ${vp.width}px on ${route}: ${JSON.stringify(ov)}`);
            }
          }
        });
      },
    },
    {
      id: 'T2-F2-03',
      tier: 2,
      feature: 'F2',
      title: 'Rapid Dark/Light theme switch keeps DOM & localStorage synchronized across reload',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/home', 450);
          const toggle = page.getByRole('button', { name: /Chuyển sang chế độ (sáng|tối)/i }).first();
          for (let i = 0; i < 5; i += 1) {
            await toggle.click();
            await page.waitForTimeout(80);
          }
          const beforeReload = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
          await reloadRoute(page, 350);
          const afterReload = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
          assert.equal(afterReload, beforeReload, `Theme desync after reload: ${beforeReload} -> ${afterReload}`);
        });
      },
    },
    {
      id: 'T2-F2-04',
      tier: 2,
      feature: 'F2',
      title: 'Unknown route renders Skybridge404 with noindex and working recovery CTA',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/does-not-exist-2027', 500);
          const metaRobots = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => '');
          assert.ok(/noindex/i.test(metaRobots || ''), `Expected noindex meta tag on 404, got "${metaRobots}"`);
          const backBtn = page.getByRole('button', { name: /Trang chủ|Về trang|Quay lại/i }).first();
          await backBtn.waitFor({ state: 'visible', timeout: 5000 });
          await backBtn.click();
          await page.waitForTimeout(350);
          const pathNow = new URL(page.url()).pathname;
          assert.ok(pathNow === '/home' || pathNow === '/', `Expected recovery CTA to navigate home, got ${pathNow}`);
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F2-05',
      tier: 2,
      feature: 'F2',
      title: 'Ambient off & compact density settings apply cleanly without layout break',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/settings', 450);
          const ambientSwitch = page.getByRole('switch', { name: /Nền động mượt/i }).first();
          await ambientSwitch.waitFor({ state: 'visible', timeout: 5000 });
          await ambientSwitch.click();
          await page.waitForTimeout(200);
          const ambientAttr = await page.evaluate(() => document.documentElement.getAttribute('data-ambient'));
          assert.equal(ambientAttr, 'off', `Expected html[data-ambient="off"], got "${ambientAttr}"`);

          const compactBtn = page.getByRole('button', { name: /^Gọn$/i }).first();
          await compactBtn.waitFor({ state: 'visible', timeout: 5000 });
          await compactBtn.click();
          await page.waitForTimeout(200);
          const densityAttr = await page.evaluate(() => document.documentElement.getAttribute('data-density'));
          assert.equal(densityAttr, 'compact', `Expected html[data-density="compact"], got "${densityAttr}"`);

          await gotoRoute(page, ctx.baseUrl, '/home', 400);
          const ov = await measureViewportOverflow(page);
          assert.equal(ov.overflowX, false);
        });
      },
    },

    // =========================================================================
    // F3 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F3-01',
      tier: 2,
      feature: 'F3',
      title: 'Forged or tampered ff_session cookie is rejected cleanly',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        const adminRes = await client.get('/api/admin/state', {
          headers: { cookie: 'ff_session=tampered.payload.invalidsig' },
        });
        assert.ok([401, 403].includes(adminRes.status), `Expected 401/403 on forged cookie, got ${adminRes.status}`);
        const meRes = await client.get('/api/auth/me', {
          headers: { cookie: 'ff_session=tampered.payload.invalidsig' },
        });
        assert.equal(meRes.status, 200);
        assert.equal(meRes.json?.user, null, 'Forged cookie must not authenticate user');
      },
    },
    {
      id: 'T2-F3-02',
      tier: 2,
      feature: 'F3',
      title: 'Standard authenticated user gets 403 on all /api/admin/* endpoints',
      async run(ctx) {
        const user = createSessionClient(ctx.baseUrl);
        await user.registerAndLogin('f3rbac');
        const endpoints = [
          ['GET', '/api/admin/state'],
          ['POST', '/api/admin/key-pool/test', { mode: 'pool' }],
          ['POST', '/api/admin/quotas', { subjectId: 'x', reset: true }],
          ['POST', '/api/admin/gateway', { dailyUserLimit: 5 }],
          ['POST', '/api/admin/moderate', { reportId: 'r1', status: 'dismissed' }],
          ['POST', '/api/admin/toggle-role', { userId: 'u1' }],
          ['GET', '/api/admin/changelog'],
          ['POST', '/api/admin/changelog', { title: 'Test', notes: 'Test' }],
        ];
        for (const [method, endpoint, body] of endpoints) {
          const res = await user.request(method, endpoint, body ? { body } : {});
          assert.equal(res.status, 403, `Expected 403 for standard user on ${method} ${endpoint}, got ${res.status}`);
        }
      },
    },
    {
      id: 'T2-F3-03',
      tier: 2,
      feature: 'F3',
      title: 'LocalStorage tampering on client does not unlock Admin telemetry',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await page.goto(ctx.baseUrl, { waitUntil: 'domcontentloaded' });
          await page.evaluate(() => {
            localStorage.setItem('fforum_user', JSON.stringify({ id: 'fake', username: 'admin', role: 'admin' }));
          });
          await gotoRoute(page, ctx.baseUrl, '/admin', 400);
          await page.getByRole('heading', { name: /Cổng Quản trị/i }).first().waitFor({ state: 'visible', timeout: 20000 });
          const dashCount = await page.getByRole('heading', { name: /Bảng điều khiển quản trị/i }).count();
          assert.equal(dashCount, 0, 'Client localStorage tampering bypassed Admin Login Gate');
        });
      },
    },
    {
      id: 'T2-F3-04',
      tier: 2,
      feature: 'F3',
      title: 'XSS payload in community post title is escaped and never executes',
      async run(ctx) {
        const payload = '<img src=x onerror="window.__xssTriggered=1">';
        const client = createSessionClient(ctx.baseUrl);
        await client.registerAndLogin('f3xss');
        const post = await client.post('/api/community/create', {
          channel: 'qa',
          title: `XSS check ${payload}`,
          body: 'Safe body',
        });
        assert.equal(post.status, 201);
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/community?mode=feed', 700);
          const mainText = await page.locator('.cm-main').innerText();
          assert.ok(mainText.includes('XSS check <img'), 'Expected escaped XSS post title visible in Bảng tin');
          const xssVal = await page.evaluate(() => window.__xssTriggered);
          assert.equal(xssVal, undefined, 'XSS payload executed in browser');
        });
      },
    },
    {
      id: 'T2-F3-05',
      tier: 2,
      feature: 'F3',
      title: 'Static inspection of all dist/assets/*.js files shows zero secret patterns',
      async run() {
        const { jsAssets } = scanDistAssets();
        const aqPrefix = ['AQ', '.Ab8'].join('');
        const aiPrefix = ['AIza', 'Sy'].join('');
        for (const file of jsAssets) {
          const code = fs.readFileSync(file, 'utf8');
          assert.equal(code.includes(aqPrefix), false, `Found AQ key prefix in ${file}`);
          assert.equal(code.includes(aiPrefix), false, `Found AIza prefix in ${file}`);
          assert.equal(code.includes('ADMIN_BOOTSTRAP_PASSWORD'), false, `Found ADMIN_BOOTSTRAP_PASSWORD in ${file}`);
        }
      },
    },

    // =========================================================================
    // F4 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F4-01',
      tier: 2,
      feature: 'F4',
      title: 'Invalid mode in /api/admin/key-pool/test is handled safely without 500 or stack trace',
      async run() {
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Fallback pool probe OK' }] } }],
            usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 6, totalTokenCount: 10 },
          }));
        });
        const { key1, key2 } = makeSyntheticPoolPair();
        const srv = await startIsolatedServer({
          forceSpawn: true,
          env: {
            AI_PROTOCOL: 'gemini',
            AI_MODEL: 'gemini-3-flash-preview',
            AI_BASE_URL: mockUpstream.url,
            AI_API_KEY_1: key1,
            AI_API_KEY_2: key2,
          },
        });
        try {
          const admin = createSessionClient(srv.url);
          await admin.adminLogin();
          const res = await admin.post('/api/admin/key-pool/test', { mode: 'invalid_mode_xyz' });
          assert.notEqual(res.status, 500, `Unexpected 500 on invalid pool test mode: ${res.text}`);
          assert.ok(
            res.status === 400 || (res.status === 200 && res.json?.mode === 'pool'),
            `Expected 400 or safe pool normalization (200 mode=pool), got ${res.status}: ${res.text}`
          );
          assert.equal(/stack|at\s+\w+\s*\(/i.test(res.text), false, 'Stack trace leaked in response');
          assert.equal(res.text.includes(key1) || res.text.includes(key2), false, 'Raw key leaked in response');
        } finally {
          await srv.close();
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T2-F4-02',
      tier: 2,
      feature: 'F4',
      title: 'Upstream 429 cooldown degrades gracefully to catalog fallback without leaking keys',
      async run() {
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          res.statusCode = 429;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: { message: 'RESOURCE_EXHAUSTED' } }));
        });
        const { key1, key2 } = makeSyntheticPoolPair();
        const srv = await startIsolatedServer({
          forceSpawn: true,
          env: {
            AI_PROTOCOL: 'gemini',
            AI_MODEL: 'gemini-3-flash-preview',
            AI_BASE_URL: mockUpstream.url,
            AI_API_KEY_1: key1,
            AI_API_KEY_2: key2,
          },
        });
        try {
          const client = createSessionClient(srv.url);
          const res = await client.post('/api/ai/chat', { projectId: 'f4-429', prompt: 'Landing hero' });
          assert.equal(res.status, 200);
          assert.equal(res.json?.fallback, true);
          assert.ok(mockUpstream.requests.length >= 2, `Expected both pool keys attempted before fallback, got ${mockUpstream.requests.length}`);
          assert.equal(res.text.includes(key1), false);
          assert.equal(res.text.includes(key2), false);
          assert.equal(/stack|at\s+\w+\s*\(/i.test(res.text), false);
        } finally {
          await srv.close();
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T2-F4-03',
      tier: 2,
      feature: 'F4',
      title: 'Shared parent-account quota exhaustion respects cap cleanly',
      async run() {
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Quota cap check OK' }] } }],
            usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 5, totalTokenCount: 10 },
          }));
        });
        const { key1, key2 } = makeSyntheticPoolPair();
        const srv = await startIsolatedServer({
          forceSpawn: true,
          env: {
            AI_ACCOUNT_DAILY_LIMIT: '1',
            AI_PROTOCOL: 'gemini',
            AI_MODEL: 'gemini-3-flash-preview',
            AI_BASE_URL: mockUpstream.url,
            AI_API_KEY_1: key1,
            AI_API_KEY_2: key2,
          },
        });
        try {
          const admin = createSessionClient(srv.url);
          await admin.adminLogin();
          const p1 = await admin.post('/api/admin/key-pool/test', { mode: 'pool' });
          assert.equal(p1.status, 200);
          const p2 = await admin.post('/api/admin/key-pool/test', { mode: 'pool' });
          assert.ok([200, 429, 502].includes(p2.status), `Unexpected status on exhausted shared cap: ${p2.status}`);
          const state = await admin.get('/api/admin/state');
          const sq = state.json?.state?.keyPool?.sharedAccountQuota;
          assert.ok(sq, 'Expected sharedAccountQuota in admin state');
          assert.equal(sq.dailyLimit, 1, `Expected AI_ACCOUNT_DAILY_LIMIT=1, got ${sq.dailyLimit}`);
          assert.ok(sq.dailyUsed >= 1, `Expected dailyUsed >= 1 after pool calls, got ${sq.dailyUsed}`);
          assert.equal(sq.remaining, 0, `Expected remaining clamped at 0 when dailyUsed >= dailyLimit, got ${sq.remaining}`);
          assert.equal(state.text.includes(key1) || state.text.includes(key2), false, 'Raw pool key leaked');
        } finally {
          await srv.close();
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T2-F4-04',
      tier: 2,
      feature: 'F4',
      title: 'Malformed upstream non-JSON HTML response triggers safe fallback',
      async run(ctx) {
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          res.statusCode = 200;
          res.setHeader('content-type', 'text/html');
          res.end('<html><body>502 Bad Gateway HTML garbage</body></html>');
        });
        try {
          const client = createSessionClient(ctx.baseUrl);
          const res = await client.post('/api/ai/chat', { projectId: 'f4-badjson', prompt: 'Navbar UI' }, {
            headers: {
              'x-ff-byok-url': mockUpstream.url,
              'x-ff-byok-key': makeSyntheticSecret('sk'),
              'x-ff-byok-protocol': 'openai-compatible',
            },
          });
          assert.equal(res.status, 200, `Expected safe fallback 200, got ${res.status}`);
          assert.equal(res.json?.fallback, true);
        } finally {
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T2-F4-05',
      tier: 2,
      feature: 'F4',
      title: 'Empty prompt returns 400 and oversized systemPrompt is safely handled',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        const empty = await client.post('/api/ai/chat', { projectId: 'p1', prompt: '   ' });
        assert.equal(empty.status, 400);
        const big = await client.post('/api/ai/chat', {
          projectId: 'p1',
          prompt: 'Minimal button',
          systemPrompt: 'A'.repeat(5000),
        });
        assert.equal(big.status, 200);
      },
    },

    // =========================================================================
    // F5 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F5-01',
      tier: 2,
      feature: 'F5',
      title: 'Admin credentials rejected on standard /api/auth/login with generic 401',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        const res = await client.post('/api/auth/login', {
          identifier: DEFAULT_ADMIN_USER,
          password: DEFAULT_ADMIN_PASS,
        });
        assert.equal(res.status, 401, `Admin credentials must be rejected on /api/auth/login, got ${res.status}`);
        assert.equal(/admin/i.test(res.text), false, 'Error response must not leak that account is an admin');
      },
    },
    {
      id: 'T2-F5-02',
      tier: 2,
      feature: 'F5',
      title: 'x-ff-guest-id header rotation cannot bypass server IP/cookie quota',
      async run() {
        const srv = await startIsolatedServer({ forceSpawn: true });
        try {
          const client = createSessionClient(srv.url);
          let hit429 = false;
          for (let i = 1; i <= 17; i += 1) {
            const res = await client.post('/api/ai/chat', { projectId: 'spoof', prompt: `Turn ${i}` }, {
              omitCookies: true,
              headers: { 'x-ff-guest-id': `spoofed-guest-${i}-${Date.now()}` },
            });
            if (res.status === 429) {
              hit429 = true;
              break;
            }
          }
          assert.equal(hit429, true, 'Rotating x-ff-guest-id bypassed 15-turn / daily IP quota');
        } finally {
          await srv.close();
        }
      },
    },
    {
      id: 'T2-F5-03',
      tier: 2,
      feature: 'F5',
      title: 'Disabling guestSandboxEnabled blocks anonymous /api/ai/chat with 403',
      async run() {
        const srv = await startIsolatedServer({ forceSpawn: true });
        try {
          const admin = createSessionClient(srv.url);
          const guest = createSessionClient(srv.url);
          const user = createSessionClient(srv.url);
          await admin.adminLogin();
          await user.registerAndLogin('f5sandbox');
          const gw = await admin.post('/api/admin/gateway', { guestSandboxEnabled: false });
          assert.equal(gw.status, 200);
          const gRes = await guest.post('/api/ai/chat', { projectId: 'g', prompt: 'Hello' });
          assert.equal(gRes.status, 403, `Expected 403 for guest when sandbox disabled, got ${gRes.status}`);
          const uRes = await user.post('/api/ai/chat', { projectId: 'u', prompt: 'Hello' });
          assert.equal(uRes.status, 200, `Authenticated user blocked unexpectedly: ${uRes.status}`);
        } finally {
          await srv.close();
        }
      },
    },
    {
      id: 'T2-F5-04',
      tier: 2,
      feature: 'F5',
      title: 'Repeated failed /api/auth/admin-login triggers 429 & securityEvents log',
      async run() {
        const srv = await startIsolatedServer({ forceSpawn: true });
        try {
          const admin = createSessionClient(srv.url);
          assert.equal((await admin.adminLogin()).status, 200);
          const attacker = createSessionClient(srv.url);
          let got429 = false;
          for (let i = 0; i < 15; i += 1) {
            const res = await attacker.post('/api/auth/admin-login', { username: 'admin', password: `wrong-${i}` });
            if (res.status === 429) {
              got429 = true;
              break;
            }
          }
          assert.equal(got429, true, 'Expected 429 rate-limit on brute-force admin-login');

          const stateRes = await admin.get('/api/admin/state');
          assert.equal(stateRes.status, 200);
          const secEvents = stateRes.json?.state?.securityEvents || [];
          assert.ok(
            secEvents.some((ev) => /auth_failed|auth_locked|rate_limited/i.test(String(ev.type || ''))),
            `Expected auth_failed/auth_locked/rate_limited in securityEvents, got ${JSON.stringify(secEvents.slice(0, 5))}`
          );
          assert.equal(JSON.stringify(secEvents).includes('wrong-'), false, 'Failed password leaked in securityEvents');
        } finally {
          await srv.close();
        }
      },
    },
    {
      id: 'T2-F5-05',
      tier: 2,
      feature: 'F5',
      title: 'Malformed /api/admin/quotas inputs return 400 validation error',
      async run(ctx) {
        const admin = createSessionClient(ctx.baseUrl);
        await admin.adminLogin();
        const bad1 = await admin.post('/api/admin/quotas', { subjectId: '', customLimit: -5 });
        assert.equal(bad1.status, 400, `Expected 400 for empty subjectId, got ${bad1.status}`);
        const bad2 = await admin.post('/api/admin/quotas', { subjectId: 'x'.repeat(200), customLimit: 5 });
        assert.equal(bad2.status, 400, `Expected 400 for oversized subjectId, got ${bad2.status}`);
        const badReset = await admin.post('/api/admin/reset-quota', { subjectId: '' });
        assert.equal(badReset.status, 400, `Expected 400 for empty reset-quota subjectId, got ${badReset.status}`);
      },
    },

    // =========================================================================
    // F6 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F6-01',
      tier: 2,
      feature: 'F6',
      title: 'IDOR prevention on POST /api/community/accept (401 anon, 403 non-author)',
      async run(ctx) {
        const author = createSessionClient(ctx.baseUrl);
        const other = createSessionClient(ctx.baseUrl);
        const anon = createSessionClient(ctx.baseUrl);
        await author.registerAndLogin('f6a');
        await other.registerAndLogin('f6b');
        const created = await author.post('/api/community/create', { channel: 'qa', title: `IDOR Q ${Date.now()}` });
        assert.equal(created.status, 201);
        const postId = created.json?.post?.id;
        const ans = await other.post('/api/community/answer', { postId, content: 'Answer from B' });
        assert.equal(ans.status, 200);
        const answerId = ans.json?.post?.answers?.[0]?.id;
        const anonRes = await anon.post('/api/community/accept', { postId, answerId });
        assert.equal(anonRes.status, 401, `Expected 401 for anon accept, got ${anonRes.status}`);
        const otherRes = await other.post('/api/community/accept', { postId, answerId });
        assert.equal(otherRes.status, 403, `Expected 403 for non-author accept, got ${otherRes.status}`);
      },
    },
    {
      id: 'T2-F6-02',
      tier: 2,
      feature: 'F6',
      title: 'IDOR prevention on POST /api/community/dossier (401 anon, 403 non-owner)',
      async run(ctx) {
        const owner = createSessionClient(ctx.baseUrl);
        const anon = createSessionClient(ctx.baseUrl);
        const nonOwner = createSessionClient(ctx.baseUrl);
        await owner.registerAndLogin('f6owner');
        await nonOwner.registerAndLogin('f6non');
        const created = await owner.post('/api/community/create', {
          channel: 'clubs',
          title: `Club IDOR Test ${Date.now()}`,
          body: 'Initial club post for dossier IDOR test',
        });
        assert.equal(created.status, 201, `Club create failed: ${created.text}`);
        const clubId = created.json?.post?.id;
        assert.ok(clubId, 'Expected created clubId');
        const anonRes = await anon.post('/api/community/dossier', {
          clubId,
          dossier: { projectTitle: 'Hijack', handoverNotes: 'X', nextMilestones: [] },
        });
        assert.equal(anonRes.status, 401, `Expected 401 for anon dossier update, got ${anonRes.status}`);
        const userRes = await nonOwner.post('/api/community/dossier', {
          clubId,
          dossier: { projectTitle: 'Hijack', handoverNotes: 'X', nextMilestones: [] },
        });
        assert.equal(userRes.status, 403, `Expected 403 for non-owner dossier update, got ${userRes.status}`);
      },
    },
    {
      id: 'T2-F6-03',
      tier: 2,
      feature: 'F6',
      title: 'Pagination bounds on GET /api/community/list clamp limit & handle out-of-range page',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        const huge = await client.get('/api/community/list?page=0&limit=9999');
        assert.equal(huge.status, 200);
        assert.ok(huge.json.limit <= 100 && huge.json.limit >= 1, `Limit not clamped: ${huge.json.limit}`);
        assert.ok(huge.json.page >= 1, `Page not clamped >= 1: ${huge.json.page}`);
        const oob = await client.get('/api/community/list?page=99999&limit=20');
        assert.equal(oob.status, 200);
        assert.deepEqual(oob.json.items, []);
        assert.equal(oob.json.hasMore, false);
      },
    },
    {
      id: 'T2-F6-04',
      tier: 2,
      feature: 'F6',
      title: 'GET /api/auth/logout rejected with 405 Method Not Allowed',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        await client.registerAndLogin('f6csrf');
        const getLogout = await client.get('/api/auth/logout');
        assert.equal(getLogout.status, 405, `Expected 405 on GET /api/auth/logout, got ${getLogout.status}`);
        const me = await client.get('/api/auth/me');
        assert.ok(me.json?.user, 'Session was unexpectedly cleared by GET logout');
      },
    },
    {
      id: 'T2-F6-05',
      tier: 2,
      feature: 'F6',
      title: 'Community burst scraping / write requests trigger sliding-window 429',
      async run() {
        const srv = await startIsolatedServer({ forceSpawn: true });
        try {
          const client = createSessionClient(srv.url);
          let got429 = false;
          for (let i = 0; i < 45; i += 1) {
            const res = await client.post('/api/community/create', {
              channel: 'qa',
              title: `Burst ${i}`,
            });
            if (res.status === 429) {
              got429 = true;
              break;
            }
          }
          assert.equal(got429, true, 'Expected 429 sliding-window rate limit on community write burst');
          const admin = createSessionClient(srv.url);
          await admin.adminLogin();
          const state = await admin.get('/api/admin/state');
          const secEvents = state.json?.state?.securityEvents || [];
          assert.ok(
            secEvents.some((ev) => /rate_limited/i.test(String(ev.type || ''))),
            'Expected rate_limited securityEvent recorded after community write burst'
          );
        } finally {
          await srv.close();
        }
      },
    },

    // =========================================================================
    // F7 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F7-01',
      tier: 2,
      feature: 'F7',
      title: 'Media onError fallback handles broken poster URLs gracefully on Landing',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await page.route('**/assets/motion-posters/**', (route) => route.abort());
          await gotoRoute(page, ctx.baseUrl, '/', 600);
          await page.locator('#du-an').scrollIntoViewIfNeeded();
          await page.waitForTimeout(400);
          const mediaCheck = await page.evaluate(() => {
            const sec = document.querySelector('#du-an');
            if (!sec) return { found: false };
            const imgs = Array.from(sec.querySelectorAll('img'));
            const stages = sec.querySelectorAll('.starter-live-stage, [data-starter-live], .lp-plate-fallback').length;
            const brokenStandalone = imgs.filter((img) => {
              const r = img.getBoundingClientRect();
              const cs = getComputedStyle(img);
              if (r.width <= 0 || r.height <= 0 || cs.display === 'none' || cs.visibility === 'hidden') return false;
              const hasFallback = Boolean(img.closest('.lp-proj-media')?.querySelector('.starter-live-stage, [data-starter-live], .lp-plate-fallback'));
              return (!img.complete || img.naturalWidth === 0) && !hasFallback;
            });
            return { found: true, stages, brokenStandaloneCount: brokenStandalone.length };
          });
          assert.equal(mediaCheck.found, true, 'Missing #du-an section');
          assert.equal(
            mediaCheck.brokenStandaloneCount,
            0,
            `Found ${mediaCheck.brokenStandaloneCount} visible broken <img> elements without fallback`
          );
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F7-02',
      tier: 2,
      feature: 'F7',
      title: '390px mobile reflow on LandingProjects & iPhone simulator without distortion',
      async run(ctx) {
        await withPage(ctx.browser, { viewport: { width: 390, height: 844 } }, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/', 600);
          const ov = await measureViewportOverflow(page);
          assert.equal(ov.overflowX, false, `Mobile Landing overflow: ${JSON.stringify(ov)}`);
          const simCheck = await page.evaluate(() => {
            const sim = document.querySelector('iframe[src*="iphone18"], .lp-phone-frame');
            const macbooks = document.querySelectorAll('img[src*="desk-computer"], [data-testid="macbook-mockup"]').length;
            const r = sim ? sim.getBoundingClientRect() : null;
            return {
              found: Boolean(sim),
              ok: Boolean(r && r.width > 100 && r.right <= window.innerWidth + 2),
              right: r ? r.right : 0,
              iw: window.innerWidth,
              macbooks,
            };
          });
          assert.equal(simCheck.found, true, 'Expected phone simulator frame on /');
          assert.equal(simCheck.macbooks, 0, 'Forbidden MacBook/computer mockup still present on /');
          assert.equal(simCheck.ok, true, `Phone simulator clipped at 390px: ${JSON.stringify(simCheck)}`);
        });
      },
    },
    {
      id: 'T2-F7-03',
      tier: 2,
      feature: 'F7',
      timeoutMs: 75000,
      title: 'Phone simulator F-Forum app icon opens & closes inside frame cleanly',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/', 800);
          const frameEl = page.locator('iframe[src*="iphone18"]').first();
          await frameEl.waitFor({ state: 'visible', timeout: 15000 });
          await frameEl.scrollIntoViewIfNeeded();
          const frame = page.frameLocator('iframe[src*="iphone18"]').first();
          const lockScreen = frame.locator('.z-30').first();
          await lockScreen.waitFor({ state: 'visible', timeout: 15000 });
          const box = await lockScreen.boundingBox();
          assert.ok(box && box.height > 100, 'Expected visible iPhone lock screen bounding box');
          const cx = box.x + box.width / 2;
          const startY = box.y + box.height * 0.85;
          const endY = Math.max(box.y + 12, box.y + box.height * 0.15);
          await page.mouse.move(cx, startY);
          await page.mouse.down();
          await page.mouse.move(cx, startY - 12, { steps: 2 });
          await page.mouse.move(cx, endY, { steps: 3 });
          await page.mouse.up();
          await lockScreen.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(400);
          const fforumIcon = frame.locator('button, [role="button"]').filter({ hasText: /F-Forum/i }).first();
          await fforumIcon.waitFor({ state: 'visible', timeout: 15000 });
          await fforumIcon.click({ timeout: 10000 });
          const inAppNav = frame.locator('nav[aria-label="F-Forum"]').first();
          await inAppNav.waitFor({ state: 'visible', timeout: 6000 });
          const navBtns = inAppNav.locator('button');
          assert.ok((await navBtns.count()) >= 2, 'Expected F-Forum internal navigation tabs inside simulator');
          await navBtns.nth(1).click();
          await page.waitForTimeout(250);
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F7-04',
      tier: 2,
      feature: 'F7',
      title: 'PinUI Chat Widget empty submit guard on Landing does not navigate or throw',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/', 600);
          const composerBox = page.locator('.lp-desk-box').first();
          await composerBox.scrollIntoViewIfNeeded();
          const input = composerBox.locator('.pcmp__input').first();
          const sendBtn = composerBox.locator('button.pcmp__send[aria-label="Gửi"]').first();
          await input.waitFor({ state: 'visible', timeout: 6000 });
          await sendBtn.waitFor({ state: 'visible', timeout: 6000 });
          assert.equal(await sendBtn.isDisabled(), true, 'Expected PromptComposer send button disabled when input is empty');
          await input.focus();
          await input.press('Enter');
          await page.waitForTimeout(250);
          assert.equal(new URL(page.url()).pathname, '/', 'Empty landing chat submit navigated unexpectedly');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F7-05',
      tier: 2,
      feature: 'F7',
      title: 'Cards 07–09 remain interactive under prefers-reduced-motion: reduce',
      async run(ctx) {
        await withPage(ctx.browser, { reducedMotion: true }, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/', 600);
          await page.locator('#du-an').scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          const stages = page.locator('#du-an .starter-live-stage, #du-an [data-starter-live]');
          const count = await stages.count();
          assert.ok(count >= 3, `Expected 3 starter live stages under reduced motion, got ${count}`);
          const firstStage = stages.first();
          const stageBtn = firstStage.locator('button').first();
          await stageBtn.waitFor({ state: 'visible', timeout: 5000 });
          const beforeText = await firstStage.innerText();
          await stageBtn.click();
          await page.waitForTimeout(200);
          const afterText = await firstStage.innerText();
          assert.notEqual(afterText, beforeText, 'Card interactive control did not respond under reducedMotion');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },

    // =========================================================================
    // F8 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F8-01',
      tier: 2,
      feature: 'F8',
      title: 'Empty search state on /honor displays actionable Vietnamese Empty copy',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/honor', 500);
          await page.getByRole('button', { name: /Danh sách/i }).first().click();
          await page.waitForTimeout(200);
          const searchBtn = page.getByRole('button', { name: /Tìm kiếm/i }).first();
          await searchBtn.waitFor({ state: 'visible', timeout: 15000 });
          await searchBtn.click();
          const searchBox = page.getByRole('searchbox').first();
          await searchBox.waitFor({ state: 'visible', timeout: 4000 });
          await searchBox.fill('zzzz-khong-ton-tai-999');
          await page.waitForTimeout(250);
          const text = await page.locator('#noi-dung').innerText();
          assert.ok(/Không tìm thấy|Không có|Đặt lại|Xóa/i.test(text), 'Expected actionable Empty state on /honor search');
          await searchBox.fill('');
          await page.waitForTimeout(200);
          const restoredText = await page.locator('#noi-dung').innerText();
          assert.equal(/Không có hồ sơ phù hợp/i.test(restoredText), false, 'Clearing search did not restore /honor exhibits');
        });
      },
    },
    {
      id: 'T2-F8-02',
      tier: 2,
      feature: 'F8',
      title: 'Loading state skeleton renders cleanly on /honor',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await page.goto(`${ctx.baseUrl}/honor`, { waitUntil: 'domcontentloaded', timeout: 35000 });
          try {
            await page.waitForFunction(
              () =>
                Boolean(
                  document.querySelector(
                    '[aria-busy="true"], .skeleton, [data-loading="true"], .thg-loading'
                  )
                ),
              null,
              { polling: 'raf', timeout: 15000 }
            );
          } catch (err) {
            assert.fail(
              `Expected layout-matched loading skeleton/indicator on /honor mount (${err instanceof Error ? err.message : String(err)})`
            );
          }
          const exhibitLocator = page.locator('canvas, article, [data-exhibit-id], .thg-card');
          await exhibitLocator.first().waitFor({ state: 'attached', timeout: 25000 });
          const populated = await exhibitLocator.count();
          assert.ok(populated > 0, 'Expected /honor to settle into Populated state after loading');
          assert.equal(trackers.pageErrors.length, 0);
          assert.equal(trackers.consoleErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F8-03',
      tier: 2,
      feature: 'F8',
      title: 'WebGL unavailable fallback degrades gracefully to List view on /honor',
      async run(ctx) {
        await withPage(ctx.browser, { blockWebGL: true }, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/honor', 600);
          const fallbackBtn = page.getByRole('button', { name: /Danh sách|Thử lại/i }).first();
          await fallbackBtn.waitFor({ state: 'visible', timeout: 15000 });
          await fallbackBtn.click();
          await page.waitForTimeout(300);
          const cards = await page.locator('article, [data-exhibit-id], .thg-card').count();
          assert.ok(cards > 0, 'Expected developer exhibit cards rendered in List fallback when WebGL is unavailable');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F8-04',
      tier: 2,
      feature: 'F8',
      title: 'Dossier sheet reflows cleanly at 390px mobile without overflow',
      async run(ctx) {
        await withPage(ctx.browser, { viewport: { width: 390, height: 844 } }, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/honor', 500);
          const listBtn = page.getByRole('button', { name: /Danh sách/i }).first();
          await listBtn.waitFor({ state: 'visible', timeout: 15000 });
          await listBtn.click();
          await page.waitForTimeout(250);
          const card = page
            .locator('article button[data-card-trigger], .thg-card button[data-card-trigger]')
            .or(page.getByRole('button', { name: /^Mở hồ sơ$/i }))
            .first();
          await card.waitFor({ state: 'visible', timeout: 5000 });
          await card.click();
          const dialog = page.locator('#honor-sheet, [role="dialog"]').first();
          await dialog.waitFor({ state: 'visible', timeout: 5000 });
          const ov = await measureViewportOverflow(page);
          assert.equal(ov.overflowX, false, `Honor dossier overflow at 390px: ${JSON.stringify(ov)}`);
        });
      },
    },
    {
      id: 'T2-F8-05',
      tier: 2,
      feature: 'F8',
      title: 'Invalid exhibit deep-link ?exhibit=invalid-id-999 does not crash /honor',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/honor?exhibit=invalid-id-999', 600);
          const galleryCount = await page.locator('canvas, article, [data-exhibit-id], .thg-card').count();
          assert.ok(galleryCount > 0, 'Expected /honor gallery to fall back cleanly on invalid exhibit ID');
          assert.equal(trackers.pageErrors.length, 0);
          assert.equal(trackers.consoleErrors.length, 0);
        });
      },
    },

    // =========================================================================
    // F9 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F9-01',
      tier: 2,
      feature: 'F9',
      title: 'Creating new empty Workspace session shows actionable Welcome/Empty guidance',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/workspace', 500);
          await page.getByRole('button', { name: /Phiên mới/i }).first().click();
          await page.waitForTimeout(300);
          const welcome = page.locator('.ws-welcome, .ws-welcome-card').first();
          await welcome.waitFor({ state: 'visible', timeout: 5000 });
          const starterCards = await page.locator('.ws-welcome-card').count();
          assert.ok(starterCards >= 2, `Expected starter prompt cards in empty Workspace welcome state, got ${starterCards}`);
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F9-02',
      tier: 2,
      feature: 'F9',
      title: 'Streaming AI generation mounts loading indicator cleanly without page errors',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await page.route('**/api/ai/chat', async (route) => {
            await new Promise((r) => setTimeout(r, 550));
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                message: 'Đã tạo bản dựng mẫu.',
                files: [
                  { path: 'index.html', content: '<!doctype html><html><body><h1>E2E Stream</h1></body></html>', summary: 'HTML' },
                  { path: 'styles.css', content: 'body { margin: 0; }', summary: 'CSS' },
                  { path: 'app.js', content: 'console.info("stream");', summary: 'JS' },
                ],
                checksHint: ['HTML'],
                fallback: false,
                modelUsed: 'gemini-3-flash-preview',
                protocolUsed: 'gemini',
                quota: { used: 1, limit: 15, remaining: 14, dailyUsed: 1, dailyLimit: 20, ipUsed: 1, ipLimit: 30, resetAt: new Date(Date.now() + 86400000).toISOString(), role: 'guest', sandboxEnabled: true, unlimited: false, exhausted: false },
              }),
            });
          });
          await gotoRoute(page, ctx.baseUrl, '/workspace', 500);
          const promptInput = page.locator('.ws-dock .pcmp__input, .pcmp__input').first();
          await promptInput.waitFor({ state: 'visible', timeout: 6000 });
          await promptInput.fill('Tạo card đơn giản');
          await promptInput.press('Enter');
          const streamCard = page.locator('.ws-stream-card, [role="status"]').filter({ hasText: /Đang|tuyến|sinh|kiểm/i }).first();
          await streamCard.waitFor({ state: 'visible', timeout: 3000 });
          await page.locator('iframe[sandbox]').first().waitFor({ state: 'attached', timeout: 8000 });
          const wsText = await page.locator('.ws').innerText();
          assert.ok(wsText.includes('Đã tạo bản dựng mẫu.'), 'Expected AI reply message rendered after streaming completed');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F9-03',
      tier: 2,
      feature: 'F9',
      title: '429 Quota Exhausted on /api/ai/chat renders actionable Error message & recovery',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await page.route('**/api/ai/chat', (route) =>
            route.fulfill({
              status: 429,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Đã hết lượt miễn phí trong ngày.' }),
            })
          );
          await gotoRoute(page, ctx.baseUrl, '/workspace', 500);
          const promptInput = page.locator('.ws-dock .pcmp__input, .pcmp__input').first();
          await promptInput.waitFor({ state: 'visible', timeout: 6000 });
          await promptInput.fill('Test 429 error state');
          await promptInput.press('Enter');
          await page.waitForTimeout(450);
          const bodyText = await page.locator('body').innerText();
          assert.ok(/hết lượt|429|BYOK|lỗi/i.test(bodyText), 'Expected visible error/recovery message on 429');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F9-04',
      tier: 2,
      feature: 'F9',
      title: 'Workspace secret scanner & malformed file path traversal validation',
      async run(ctx) {
        const fakeSk = makeSyntheticSecret('sk');
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await seedWorkspaceArtifact(page, ctx.baseUrl);
          await page.getByRole('tab', { name: /Mã nguồn/i }).first().click();
          await page.waitForTimeout(250);
          const addFileBtn = page.getByRole('button', { name: /Tạo tệp|Thêm tệp/i }).first();
          await addFileBtn.waitFor({ state: 'visible', timeout: 5000 });
          await addFileBtn.click();
          const nameInput = page.locator('input[placeholder*="tên tệp"], input[aria-label*="tên tệp"]').first();
          await nameInput.waitFor({ state: 'visible', timeout: 4000 });
          await nameInput.fill('../evil.js');
          await nameInput.press('Enter');
          await page.waitForTimeout(200);
          const sourceText = await page.locator('.ws-source').first().innerText();
          assert.equal(sourceText.includes('../evil.js'), false, 'Path traversal filename ../evil.js was accepted into virtual tree');

          await page.getByRole('button', { name: /app\.js/i }).first().click();
          const editor = page.locator('textarea.ws-source-editor').first();
          await editor.waitFor({ state: 'visible', timeout: 4000 });
          await editor.fill(`const k = "${fakeSk}";`);
          const downloadTrigger = page.getByRole('button', { name: /^Tải xuống$/i }).first();
          await downloadTrigger.waitFor({ state: 'visible', timeout: 4000 });
          await downloadTrigger.click();
          const zipBtn = page.getByRole('button', { name: /Export ZIP|Xuất ZIP|Tải gói ZIP/i }).first();
          await zipBtn.waitFor({ state: 'visible', timeout: 4000 });
          const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
            zipBtn.click(),
          ]);
          assert.ok(download, 'Expected ZIP export to run secret scanner and download');
          const bodyText = await page.locator('body').innerText();
          assert.ok(/ẩn|nhạy cảm|REDACTED|cảnh báo/i.test(bodyText), 'Expected secret scanner warning/redaction toast on export');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F9-05',
      tier: 2,
      feature: 'F9',
      title: 'Ctrl+F unmatched query shows 0 results & 390px mobile Workspace switches cleanly',
      async run(ctx) {
        await withPage(ctx.browser, { viewport: { width: 1440, height: 900 } }, async (page) => {
          await seedWorkspaceArtifact(page, ctx.baseUrl);
          await page.getByRole('tab', { name: /Mã nguồn/i }).first().click();
          await page.waitForTimeout(250);
          await page.keyboard.press('Control+f');
          const findInput = page.locator('input[aria-label*="Tìm"], input[placeholder*="Tìm trong mã"]').first();
          await findInput.waitFor({ state: 'visible', timeout: 4000 });
          await findInput.fill('nonexistent_xyz_2027');
          await page.waitForTimeout(150);
          const sourceText = await page.locator('.ws-source').first().innerText();
          assert.ok(/0\s*\/\s*0|0 kết quả/i.test(sourceText), `Expected 0/0 match counter for unmatched Ctrl+F query, got: ${sourceText.slice(0, 150)}`);

          await page.setViewportSize({ width: 390, height: 844 });
          await page.waitForTimeout(250);
          const ov = await measureViewportOverflow(page);
          assert.equal(ov.overflowX, false, `Workspace 390px overflow: ${JSON.stringify(ov)}`);
          const switchBar = page.locator('[aria-label="Chuyển vùng làm việc"]').first();
          await switchBar.waitFor({ state: 'visible', timeout: 5000 });
          await switchBar.getByRole('button', { name: /Mã nguồn/i }).first().click();
          await page.waitForTimeout(200);
          await switchBar.getByRole('button', { name: /Live View/i }).first().click();
          await page.waitForTimeout(200);
          const ov2 = await measureViewportOverflow(page);
          assert.equal(ov2.overflowX, false);
        });
      },
    },

    // =========================================================================
    // F10 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F10-01',
      tier: 2,
      feature: 'F10',
      title: 'Empty search state in Tra cứu & Bảng tin shows Reset CTA',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/community?mode=knowledge&q=zzzz-no-match-2027', 700);
          const kText = await page.locator('#noi-dung').innerText();
          assert.ok(/Không có|Không tìm thấy|Xóa bộ lọc|Đặt lại/i.test(kText), 'Missing Empty state in Tra cứu');
          const resetBtn = page.getByRole('button', { name: /Xóa bộ lọc|Đặt lại/i }).first();
          await resetBtn.waitFor({ state: 'visible', timeout: 4000 });
          await resetBtn.click();
          await page.waitForTimeout(300);

          await gotoRoute(page, ctx.baseUrl, '/community?mode=feed', 600);
          const feedSearch = page.locator('input[type="search"], input[placeholder*="Tìm"]').first();
          await feedSearch.waitFor({ state: 'visible', timeout: 5000 });
          await feedSearch.fill('zzzz-no-match-2027');
          await page.waitForTimeout(300);
          const fText = await page.locator('.cm-main').innerText();
          assert.ok(/Không có|Không tìm thấy|Bảng tin trống|Xóa bộ lọc|Đặt lại/i.test(fText), 'Missing Empty state in Bảng tin');
        });
      },
    },
    {
      id: 'T2-F10-02',
      tier: 2,
      feature: 'F10',
      title: 'Loading skeleton state renders while /api/community/list is delayed',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await page.route('**/api/community/list**', async (route) => {
            await new Promise((r) => setTimeout(r, 700));
            await route.continue();
          });
          await gotoRoute(page, ctx.baseUrl, '/community?mode=feed', 150);
          const busy = await page.locator('[aria-busy="true"], .skeleton, [data-loading="true"]').count();
          assert.ok(busy > 0, 'Expected Loading skeleton on delayed /api/community/list');
        });
      },
    },
    {
      id: 'T2-F10-03',
      tier: 2,
      feature: 'F10',
      title: 'Error state & working Retry button on failed /api/community/list',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          let failOnce = true;
          await page.route('**/api/community/list**', async (route) => {
            if (failOnce) {
              failOnce = false;
              await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Down' }) });
              return;
            }
            await route.continue();
          });
          await gotoRoute(page, ctx.baseUrl, '/community?mode=feed', 500);
          const retryBtn = page.getByRole('button', { name: /Thử lại/i }).first();
          await retryBtn.waitFor({ state: 'visible', timeout: 5000 });
          await retryBtn.click();
          await page.waitForTimeout(500);
          assert.equal(await page.locator('[role="alert"]').filter({ hasText: /Thử lại/i }).count(), 0);
        });
      },
    },
    {
      id: 'T2-F10-04',
      tier: 2,
      feature: 'F10',
      title: 'Invalid URL query params (?mode=bad&q=<xss>) fall back safely and escape XSS',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/community?mode=unknown&q=%3Cscript%3Ewindow.__xss=1%3C/script%3E', 600);
          assert.equal(await page.evaluate(() => window.__xss), undefined);
          const selectedTab = await page.locator('[role="tab"][aria-selected="true"]').first().innerText();
          assert.ok(/Tra cứu|Bảng tin/i.test(selectedTab), `Expected valid fallback tab selected, got "${selectedTab}"`);
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T2-F10-05',
      tier: 2,
      feature: 'F10',
      timeoutMs: 90000,
      title: '390px mobile Tra cứu two-pane reflow across all 3 Tri thức tabs',
      async run(ctx) {
        await withPage(ctx.browser, { viewport: { width: 390, height: 844 } }, async (page) => {
          for (const mode of ['knowledge', 'feed', 'chat']) {
            await gotoRoute(page, ctx.baseUrl, `/community?mode=${mode}`, 500);
            const ov = await measureViewportOverflow(page);
            assert.equal(ov.overflowX, false, `Tri thức overflow at 390px for mode=${mode}`);
          }
          await gotoRoute(page, ctx.baseUrl, '/community?mode=feed', 500);
          const client = createSessionClient(ctx.baseUrl);
          let hasMore = Boolean((await client.get('/api/community/list?page=1&limit=20')).json?.hasMore);
          const loadMore = page.getByRole('button', { name: /Xem thêm/i }).first();
          let guard = 0;
          while (hasMore && guard < 5) {
            guard += 1;
            await loadMore.waitFor({ state: 'visible', timeout: 4000 });
            const [resp] = await Promise.all([
              page.waitForResponse((r) => r.url().includes('/api/community/list')),
              loadMore.click(),
            ]);
            const json = await resp.json().catch(() => null);
            hasMore = Boolean(json?.hasMore);
            await page.waitForTimeout(200);
          }
          assert.ok((await loadMore.count()) === 0 || (await loadMore.isDisabled()), 'Xem thêm did not hide/disable at hasMore: false');
        });
      },
    },

    // =========================================================================
    // F11 — Boundary & Edge Cases
    // =========================================================================
    {
      id: 'T2-F11-01',
      tier: 2,
      feature: 'F11',
      title: 'Empty state on /admin log filter shows clear-filter action',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await loginAdminInBrowser(page, ctx.baseUrl);
          await gotoRoute(page, ctx.baseUrl, '/admin', 600);
          await page.getByRole('tab', { name: /Bảo mật/i }).first().click();
          await page.waitForTimeout(300);
          const searchInput = page.locator('input[type="search"], input[placeholder*="Tìm"]').first();
          await searchInput.waitFor({ state: 'visible', timeout: 5000 });
          await searchInput.fill('zzzz-no-log-match-2027');
          await page.waitForTimeout(250);
          const txt = await page.locator('#noi-dung').innerText();
          assert.ok(/Không có|Trống|Xóa/i.test(txt), 'Expected Empty state when admin logs filter matches nothing');
          const clearBtn = page.getByRole('button', { name: /Xóa bộ lọc|Đặt lại/i }).first();
          await clearBtn.waitFor({ state: 'visible', timeout: 4000 });
          await clearBtn.click();
          await page.waitForTimeout(200);
          assert.equal(await searchInput.inputValue(), '', 'Clear-filter CTA did not reset log search input');
        });
      },
    },
    {
      id: 'T2-F11-02',
      tier: 2,
      feature: 'F11',
      title: 'Loading state on delayed GET /api/admin/state',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await loginAdminInBrowser(page, ctx.baseUrl);

          let routeHitCount = 0;
          let routeHitSettled = false;
          let routeHitTimer = null;
          let resolveRouteHit = () => {};
          let rejectRouteHit = () => {};
          const routeHitPromise = new Promise((resolve, reject) => {
            resolveRouteHit = () => {
              if (routeHitSettled) return;
              routeHitSettled = true;
              if (routeHitTimer) {
                clearTimeout(routeHitTimer);
                routeHitTimer = null;
              }
              resolve();
            };
            rejectRouteHit = (err) => {
              if (routeHitSettled) return;
              routeHitSettled = true;
              if (routeHitTimer) {
                clearTimeout(routeHitTimer);
                routeHitTimer = null;
              }
              reject(err);
            };
            routeHitTimer = setTimeout(() => {
              rejectRouteHit(new Error('Timed out waiting for GET /api/admin/state request'));
            }, 15000);
          });

          let gateReleased = false;
          let releaseGate = () => {};
          let fallbackTimer = null;
          const gatePromise = new Promise((resolve) => {
            releaseGate = () => {
              if (gateReleased) return;
              gateReleased = true;
              if (fallbackTimer) {
                clearTimeout(fallbackTimer);
                fallbackTimer = null;
              }
              resolve();
            };
          });
          fallbackTimer = setTimeout(releaseGate, 25000);

          const onPageClose = () => {
            releaseGate();
            resolveRouteHit();
          };
          page.once('close', onPageClose);

          const stateRouteHandler = async (route) => {
            routeHitCount += 1;
            resolveRouteHit();
            if (!gateReleased) {
              await gatePromise;
            }
            try {
              await route.continue();
            } catch {
              // Page/context closed before route.continue() completed
            }
          };

          await page.route('**/api/admin/state', stateRouteHandler);
          try {
            await gotoRoute(page, ctx.baseUrl, '/admin', 0);

            const loadingLocator = page.locator(
              '[aria-busy="true"], .skeleton, [data-loading="true"], .adm-skeleton-card, .adm-skel'
            );
            await Promise.all([
              routeHitPromise,
              loadingLocator.first().waitFor({ state: 'visible', timeout: 15000 }),
            ]);

            assert.ok(routeHitCount >= 1, 'Expected GET /api/admin/state to be intercepted');
            const loadingCount = await loadingLocator.count();
            assert.ok(loadingCount > 0, 'Expected loading indicator on delayed /api/admin/state');

            releaseGate();

            await page
              .locator('section[aria-label="Tổng quan chỉ số hệ thống"] .adm-kpi-val')
              .first()
              .waitFor({ state: 'visible', timeout: 10000 });
            await page.waitForFunction(
              () => document.querySelectorAll('.adm-skeleton-card, .adm-skel').length === 0,
              null,
              { timeout: 10000 }
            );
            assert.equal(
              await page.locator('.adm-skeleton-card, .adm-skel').count(),
              0,
              'Expected skeleton loading state to clear after /api/admin/state resolved'
            );
            const adminText = await page.locator('#noi-dung').innerText();
            assert.ok(
              adminText.includes(DEFAULT_POOL_KEY_1_MASK),
              `Expected full admin telemetry (${DEFAULT_POOL_KEY_1_MASK}) after /api/admin/state resolved`
            );
          } finally {
            page.off('close', onPageClose);
            releaseGate();
            resolveRouteHit();
            await page.unroute('**/api/admin/state', stateRouteHandler).catch(() => {});
          }
        });
      },
    },
    {
      id: 'T2-F11-03',
      tier: 2,
      feature: 'F11',
      title: 'Error state & working Retry when GET /api/admin/state returns 500',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await loginAdminInBrowser(page, ctx.baseUrl);
          let failOnce = true;
          await page.route('**/api/admin/state', async (route) => {
            if (failOnce) {
              failOnce = false;
              await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server err' }) });
              return;
            }
            await route.continue();
          });
          await gotoRoute(page, ctx.baseUrl, '/admin', 500);
          const retry = page.getByRole('button', { name: /Thử lại|Làm mới/i }).first();
          await retry.waitFor({ state: 'visible', timeout: 5000 });
          await retry.click();
          await page.waitForTimeout(500);
          await page.getByRole('heading', { name: /Bảng điều khiển quản trị/i }).first().waitFor({ state: 'visible', timeout: 5000 });
        });
      },
    },
    {
      id: 'T2-F11-04',
      tier: 2,
      feature: 'F11',
      title: 'Invalid admin login credentials show inline 401 error without leaking hints',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/admin', 500);
          await page.getByLabel('Tài khoản Admin').fill('wrong-admin');
          await page.getByLabel('Mật khẩu Admin').fill('wrong-password');
          await page.locator('.adm-auth-card button[type="submit"]').first().click();
          await page.waitForTimeout(400);
          const alertText = await page.locator('[role="alert"], .admin-error').first().innerText();
          assert.ok(alertText.length > 0, 'Expected inline error on wrong admin login');
          assert.equal(/e2e-admin-password/i.test(alertText), false);
        });
      },
    },
    {
      id: 'T2-F11-05',
      tier: 2,
      feature: 'F11',
      timeoutMs: 90000,
      title: '390px & 768px Admin Dashboard reflows cleanly without horizontal overflow',
      async run(ctx) {
        for (const vp of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
          await withPage(ctx.browser, { viewport: vp }, async (page) => {
            await loginAdminInBrowser(page, ctx.baseUrl);
            await gotoRoute(page, ctx.baseUrl, '/admin', 500);
            await page.getByRole('heading', { name: /Bảng điều khiển quản trị/i }).first().waitFor({ state: 'visible', timeout: 20000 });
            const ov = await measureViewportOverflow(page);
            assert.equal(ov.overflowX, false, `Admin overflow at ${vp.width}px: ${JSON.stringify(ov)}`);
          });
        }
      },
    },
  ];
}
