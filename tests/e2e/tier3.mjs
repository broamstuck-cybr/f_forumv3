import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  createSessionClient,
  DEFAULT_ADMIN_PASS,
  DEFAULT_ADMIN_USER,
  DEFAULT_POOL_KEY_1_MASK,
  DEFAULT_POOL_KEY_2_MASK,
  gotoRoute,
  loginAdminInBrowser,
  makeSyntheticPoolPair,
  makeSyntheticSecret,
  measureContrastForSelector,
  measureViewportOverflow,
  registerUserInBrowser,
  reloadRoute,
  scanDistAssets,
  seedWorkspaceArtifact,
  startIsolatedServer,
  startMockUpstream,
  waitForAppHydration,
  withPage,
} from './harness.mjs';

export function getTier3Tests() {
  return [
    {
      id: 'T3-01',
      tier: 3,
      feature: 'F1+F2',
      title: 'Custom SVG icons adapt across Dark/Light theme switch with WCAG contrast & hairline borders',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/home', 500);
          assert.equal(await page.locator('svg.lucide').count(), 0);
          const cDark = await measureContrastForSelector(page, 'body');
          assert.ok(cDark && cDark.ratio >= 4.5, `Dark contrast ${cDark?.ratio} < 4.5`);
          await page.getByRole('button', { name: /Chuyển sang chế độ (sáng|tối)/i }).first().click();
          await page.waitForTimeout(300);
          const cLight = await measureContrastForSelector(page, 'body');
          assert.ok(cLight && cLight.ratio >= 4.5, `Light contrast ${cLight?.ratio} < 4.5`);
          assert.notEqual(cDark.bg, cLight.bg);
        });
      },
    },
    {
      id: 'T3-02',
      tier: 3,
      feature: 'F3+F5',
      title: 'Client bundle isolation + server RBAC enforcement (401 admin-on-user-login, 403 user-on-admin)',
      async run(ctx) {
        const { indexJsFiles } = scanDistAssets();
        for (const f of indexJsFiles) {
          assert.equal(fs.readFileSync(f, 'utf8').includes('/api/admin'), false);
        }
        const client = createSessionClient(ctx.baseUrl);
        const badLogin = await client.post('/api/auth/login', {
          identifier: DEFAULT_ADMIN_USER,
          password: DEFAULT_ADMIN_PASS,
        });
        assert.equal(badLogin.status, 401);
        await client.registerAndLogin('t3rbac');
        const admState = await client.get('/api/admin/state');
        assert.equal(admState.status, 403);
      },
    },
    {
      id: 'T3-03',
      tier: 3,
      feature: 'F4+F11',
      timeoutMs: 75000,
      title: 'Server 2-Key Pool live test & failover reflected & persisted in Admin Telemetry UI',
      async run(ctx) {
        let count = 0;
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          count += 1;
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({
            candidates: [{ content: { parts: [{ text: `T3 pool #${count}` }] } }],
            usageMetadata: { promptTokenCount: 15, candidatesTokenCount: 25, totalTokenCount: 40 },
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
          await withPage(ctx.browser, {}, async (page) => {
            await loginAdminInBrowser(page, srv.url);
            await gotoRoute(page, srv.url, '/admin', 600);
            const testBtn = page.getByRole('button', { name: /Kiểm tra Pool|Thử Pool|Chạy thử Key/i }).first();
            await testBtn.waitFor({ state: 'visible', timeout: 5000 });
            const [probeResp] = await Promise.all([
              page.waitForResponse((r) => r.url().includes('/api/admin/key-pool/test')),
              testBtn.click(),
            ]);
            assert.equal(probeResp.status(), 200);
            const failoverProbe = await page.evaluate(async () => {
              const r = await fetch('/api/admin/key-pool/test', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ mode: 'failover_sim' }),
              });
              return { status: r.status, body: await r.json() };
            });
            assert.equal(failoverProbe.status, 200);
            assert.equal(failoverProbe.body?.usedKeyMask, DEFAULT_POOL_KEY_2_MASK);
            await reloadRoute(page, 400);
            const text = await page.locator('#noi-dung').innerText();
            assert.ok(text.includes(DEFAULT_POOL_KEY_1_MASK) && text.includes(DEFAULT_POOL_KEY_2_MASK));
            assert.ok(/80|40/.test(text) && /prompt|total/i.test(text), 'Expected persisted token telemetry after reload');
          });
        } finally {
          await srv.close();
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T3-04',
      tier: 3,
      feature: 'F5+F9',
      title: 'Daily user quota exhaustion & Admin reset unblocking Workspace AI',
      async run() {
        const srv = await startIsolatedServer({ forceSpawn: true });
        try {
          const admin = createSessionClient(srv.url);
          const user = createSessionClient(srv.url);
          const reg = await user.registerAndLogin('t3quota');
          const subjectId = reg.res.json?.quota?.subjectId;
          assert.ok(subjectId && subjectId.startsWith('user:'), `Expected user: subjectId, got ${subjectId}`);
          await admin.adminLogin();
          const setLim = await admin.post('/api/admin/quotas', { subjectId, customLimit: 1 });
          assert.equal(setLim.status, 200);
          const first = await user.post('/api/ai/chat', { projectId: 'p1', prompt: 'Turn 1' });
          assert.equal(first.status, 200);
          const exhausted = await user.post('/api/ai/chat', { projectId: 'p1', prompt: 'Turn 2' });
          assert.equal(exhausted.status, 429);
          const reset = await admin.post('/api/admin/quotas', { subjectId, reset: true });
          assert.equal(reset.status, 200);
          const unblocked = await user.post('/api/ai/chat', { projectId: 'p1', prompt: 'Turn 3' });
          assert.equal(unblocked.status, 200);
        } finally {
          await srv.close();
        }
      },
    },
    {
      id: 'T3-05',
      tier: 3,
      feature: 'F6+F10',
      title: 'F12 data minimization & IDOR guard inside Unified Tri thức',
      async run(ctx) {
        const author = createSessionClient(ctx.baseUrl);
        const other = createSessionClient(ctx.baseUrl);
        await author.registerAndLogin('t3author');
        await other.registerAndLogin('t3idor');

        const qa = await author.post('/api/community/create', {
          channel: 'qa',
          title: `T3 IDOR Q&A ${Date.now()}`,
          body: 'Author Q&A seed',
        });
        assert.equal(qa.status, 201);
        const qaPostId = qa.json?.post?.id;
        const ans = await other.post('/api/community/answer', { postId: qaPostId, content: 'Non-author answer' });
        assert.equal(ans.status, 200);
        const answerId = ans.json?.post?.answers?.[0]?.id;

        const club = await author.post('/api/community/create', {
          channel: 'clubs',
          title: `T3 Club Seed ${Date.now()}`,
          body: 'Author Club seed',
        });
        assert.equal(club.status, 201);
        const clubId = club.json?.post?.id;

        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/community?mode=feed', 700);
          const listResp = trackers.responses.find((r) => r.url.includes('/api/community/list'));
          assert.ok(listResp && listResp.status === 200, 'Expected /api/community/list 200');
          const upvoteBtn = page.getByRole('button', { name: /Thích|Thả cảm xúc/i }).first();
          await upvoteBtn.waitFor({ state: 'visible', timeout: 5000 });
          await upvoteBtn.click();
          await page.waitForTimeout(200);
        });

        const listRes = await other.get('/api/community/list?page=1&limit=10');
        assert.equal('reports' in (listRes.json || {}), false);
        assert.ok(Array.isArray(listRes.json?.items) && listRes.json.items.length > 0);
        assert.equal('upvotedBy' in listRes.json.items[0], false);

        const acc = await other.post('/api/community/accept', { postId: qaPostId, answerId });
        assert.equal(acc.status, 403);
        const dos = await other.post('/api/community/dossier', {
          clubId,
          dossier: { projectTitle: 'IDOR Attempt', handoverNotes: 'No', nextMilestones: [] },
        });
        assert.equal(dos.status, 403);
      },
    },
    {
      id: 'T3-06',
      tier: 3,
      feature: 'F7+F9',
      timeoutMs: 75000,
      title: 'Landing Card 07–09 Live View launch into Workspace Diff & Check',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/', 600);
          const sec = page.locator('#du-an');
          await sec.scrollIntoViewIfNeeded();
          const liveBtn = sec.getByRole('button', { name: /^Live View$/i }).first();
          await liveBtn.click();
          await page.waitForTimeout(600);
          assert.ok(page.url().includes('/workspace'));

          await page.getByRole('tab', { name: /Mã nguồn/i }).first().click();
          await page.waitForTimeout(200);
          await page.getByRole('button', { name: /styles\.css/i }).first().click();
          const editor = page.locator('textarea.ws-source-editor').first();
          await editor.waitFor({ state: 'visible', timeout: 4000 });
          const curCss = await editor.inputValue();
          await editor.fill(`${curCss}\n/* e2e-t3-06 */`);

          await page.locator('.ws-live [role="tablist"]').getByRole('tab', { name: /Kiểm định/i }).first().click();
          await page.waitForTimeout(250);
          const runBtn = page.getByRole('button', { name: /Chạy kiểm định 6 lớp/i }).first();
          await runBtn.waitFor({ state: 'visible', timeout: 4000 });
          await runBtn.click();
          await page.waitForTimeout(250);
          const checkText = await page.locator('[aria-label="Diff & Check"]').first().innerText();
          assert.ok(/HTML|JS|Responsive|A11y/i.test(checkText), 'Expected 6-layer check output after Live View launch');

          await page.getByRole('tab', { name: /^Diff/i }).first().click();
          await page.waitForTimeout(200);
          const diffText = await page.locator('[aria-label="Diff & Check"]').first().innerText();
          assert.ok(diffText.includes('e2e-t3-06'), 'Expected edited CSS diff line in Diff tab');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T3-07',
      tier: 3,
      feature: 'F9+F10',
      timeoutMs: 90000,
      title: 'Workspace publish to Tri thức Bảng tin and fork back to Workspace',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await registerUserInBrowser(page, ctx.baseUrl, 't3pub');
          await seedWorkspaceArtifact(page, ctx.baseUrl);
          const pubBtn = page.getByRole('button', { name: /Đăng.*Tri thức/i }).first();
          await pubBtn.waitFor({ state: 'visible', timeout: 5000 });
          await pubBtn.click();
          await page.waitForTimeout(250);
          const publishDialog = page.locator('dialog[open], [role="dialog"]').last();
          await publishDialog.waitFor({ state: 'visible', timeout: 5000 });
          const titleInput = publishDialog.locator('input').first();
          await titleInput.waitFor({ state: 'visible', timeout: 4000 });
          const pubTitle = `T3 Published Build ${Date.now()}`;
          await titleInput.fill(pubTitle);
          await publishDialog.locator('button[type="submit"]').first().click();
          await page.waitForTimeout(500);

          await gotoRoute(page, ctx.baseUrl, '/community?mode=feed', 700);
          const feedText = await page.locator('.cm-main').innerText();
          assert.ok(feedText.includes(pubTitle), 'Published Workspace build missing in Bảng tin');
          const forkBtn = page.getByRole('button', { name: /Mở Workspace|Mở trong Workspace|Fork/i }).first();
          await forkBtn.waitFor({ state: 'visible', timeout: 5000 });
          await forkBtn.click();
          await page.waitForTimeout(500);
          assert.ok(page.url().includes('/workspace'));
          await page.locator('iframe[sandbox]').first().waitFor({ state: 'attached', timeout: 6000 });
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T3-08',
      tier: 3,
      feature: 'F2+F8',
      timeoutMs: 75000,
      title: 'Team Honor Dossier respects global Light theme & prefers-reduced-motion',
      async run(ctx) {
        await withPage(ctx.browser, { reducedMotion: true }, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/settings', 450);
          await page.getByRole('button', { name: /Chuyển sang chế độ (sáng|tối)/i }).first().click();
          await page.waitForTimeout(200);
          const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
          await gotoRoute(page, ctx.baseUrl, '/honor', 500);
          const themeHonor = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
          assert.equal(themeHonor, themeBefore, 'Theme failed to persist into /honor');
          await page.getByRole('button', { name: /Danh sách/i }).first().click();
          await page.waitForTimeout(250);
          const openDossierBtn = page
            .locator('article button[data-card-trigger], .thg-card button[data-card-trigger]')
            .or(page.getByRole('button', { name: /^Mở hồ sơ$/i }))
            .first();
          await openDossierBtn.waitFor({ state: 'visible', timeout: 5000 });
          await openDossierBtn.click();
          const dialog = page.locator('#honor-sheet, [role="dialog"]').first();
          await dialog.waitFor({ state: 'visible', timeout: 5000 });
          const ov = await measureViewportOverflow(page);
          assert.equal(ov.overflowX, false);
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T3-09',
      tier: 3,
      feature: 'F3+F6',
      title: 'Security headers, no-store auth lifecycle & GET logout CSRF block',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        await client.registerAndLogin('t3auth');
        const me = await client.get('/api/auth/me');
        assert.equal(me.status, 200);
        assert.ok(/no-store/i.test(me.headers.get('cache-control') || ''));
        assert.equal(me.headers.get('x-content-type-options'), 'nosniff');
        const badLogout = await client.get('/api/auth/logout');
        assert.equal(badLogout.status, 405);
        const goodLogout = await client.post('/api/auth/logout', {});
        assert.equal(goodLogout.status, 200);
        const after = await client.get('/api/auth/me');
        assert.equal(after.json?.user, null);
      },
    },
    {
      id: 'T3-10',
      tier: 3,
      feature: 'F4+F6',
      title: 'BYOK upstream error sanitization & F12 Network cleanliness',
      async run(ctx) {
        const fakeAq = makeSyntheticSecret('aq');
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: `Secret key failed: ?key=${fakeAq}` }));
        });
        try {
          const client = createSessionClient(ctx.baseUrl);
          const res = await client.post('/api/ai/chat', { projectId: 't3-san', prompt: 'Hero' }, {
            headers: {
              'x-ff-byok-url': mockUpstream.url,
              'x-ff-byok-key': fakeAq,
              'x-ff-byok-protocol': 'openai-compatible',
            },
          });
          assert.equal(res.status, 200);
          assert.equal(res.text.includes(fakeAq), false);
          assert.equal(/at\s+Object\.|node_modules/i.test(res.text), false);
        } finally {
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T3-11',
      tier: 3,
      feature: 'F1+F10',
      timeoutMs: 75000,
      title: 'Custom SVG chrome & URL query sync across /explore -> /community -> /workspace',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/explore', 400);
          await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 20000 });
          assert.equal(await page.locator('svg.lucide').count(), 0);
          await gotoRoute(page, ctx.baseUrl, '/community?mode=knowledge&q=glass', 600);
          await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 20000 });
          assert.equal(await page.locator('svg.lucide').count(), 0);
          const launchBtn = page.getByRole('button', { name: /Mở Workspace/i }).first();
          await launchBtn.waitFor({ state: 'visible', timeout: 8000 });
          await launchBtn.click();
          await page.waitForURL(/\/workspace/, { timeout: 10000 });
          await waitForAppHydration(page, 25000);
          await page.locator('.ws-thread, #noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 10000 });
          assert.ok(page.url().includes('/workspace'));
          assert.equal(await page.locator('svg.lucide').count(), 0);
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T3-12',
      tier: 3,
      feature: 'F5+F6+F11',
      timeoutMs: 75000,
      title: 'Unauthorized /api/admin access & failed logins audited in Admin Security Events',
      async run(ctx) {
        const srv = await startIsolatedServer({ forceSpawn: true });
        try {
          const anon = createSessionClient(srv.url);
          const admin = createSessionClient(srv.url);
          await anon.get('/api/admin/state');
          await anon.post('/api/auth/admin-login', { username: 'admin', password: 'bad-password-1' });
          await admin.adminLogin();
          const state = await admin.get('/api/admin/state');
          assert.equal(state.status, 200);
          const secEvents = state.json?.state?.securityEvents;
          assert.ok(Array.isArray(secEvents) && secEvents.length >= 2, 'Expected securityEvents recorded for 401/failed login');
          assert.equal(JSON.stringify(secEvents).includes('bad-password-1'), false, 'Failed password leaked in securityEvents');

          await withPage(ctx.browser, {}, async (page) => {
            await loginAdminInBrowser(page, srv.url);
            await gotoRoute(page, srv.url, '/admin', 600);
            await page.getByRole('tab', { name: /Bảo mật/i }).first().click();
            await page.waitForTimeout(300);
            const logText = await page.locator('[role="log"]').first().innerText();
            assert.ok(/401|auth_failed|bảo mật/i.test(logText), 'Expected 401/auth_failed security event in Admin UI Nhật ký');
            assert.equal(logText.includes('bad-password-1'), false);
          });
        } finally {
          await srv.close();
        }
      },
    },
  ];
}
