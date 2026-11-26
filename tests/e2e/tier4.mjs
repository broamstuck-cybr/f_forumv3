import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  countBackdropFiltersInViewport,
  createSessionClient,
  DEFAULT_ADMIN_PASS,
  DEFAULT_ADMIN_USER,
  DEFAULT_POOL_KEY_1_MASK,
  DEFAULT_POOL_KEY_2_MASK,
  gotoRoute,
  inspectVisibleButtons,
  makeSyntheticPoolPair,
  makeSyntheticSecret,
  measureContrastForSelector,
  measureViewportOverflow,
  PROJECT_ROOT,
  registerUserInBrowser,
  reloadRoute,
  scanDistAssets,
  startIsolatedServer,
  startMockUpstream,
  STUDIO_SCRIPTS_DIR,
  waitForAppHydration,
  withPage,
} from './harness.mjs';

const execFileAsync = promisify(execFile);

export function getTier4Tests() {
  return [
    {
      id: 'T4-01',
      tier: 4,
      feature: 'F1+F2+F7+F9+F10',
      timeoutMs: 120000,
      title: 'Persona: Học sinh (Student) — Landing Card 08 -> Tra cứu -> Workspace Diff & Check -> HTML Export',
      async run(ctx) {
        await withPage(ctx.browser, { viewport: { width: 390, height: 844 } }, async (mobilePage, mTrackers) => {
          await gotoRoute(mobilePage, ctx.baseUrl, '/', 400);
          await mobilePage.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 20000 });
          const ov = await measureViewportOverflow(mobilePage);
          assert.equal(ov.overflowX, false, `Student 390px Landing overflow: ${JSON.stringify(ov)}`);
          assert.equal(mTrackers.pageErrors.length, 0);
        });

        await withPage(ctx.browser, { viewport: { width: 1440, height: 900 } }, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/', 600);
          await page.locator('#du-an').scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          const liveBtns = page.locator('#du-an').getByRole('button', { name: /^Live View$/i });
          assert.ok((await liveBtns.count()) >= 3, 'Expected Live View on Cards 07–09');
          await liveBtns.nth(1).click();
          await page.waitForURL(/\/workspace/, { timeout: 10000 });
          await waitForAppHydration(page, 25000);
          assert.ok(page.url().includes('/workspace'));

          await gotoRoute(page, ctx.baseUrl, '/community?mode=knowledge&q=hero', 700);
          const openWs = page.getByRole('button', { name: /Mở Workspace/i }).first();
          await openWs.waitFor({ state: 'visible', timeout: 8000 });
          await openWs.click();
          await page.waitForURL(/\/workspace/, { timeout: 10000 });
          await waitForAppHydration(page, 25000);
          await page.locator('.ws-thread, #noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 10000 });
          assert.ok(page.url().includes('/workspace'));

          const iframe = page.locator('iframe[sandbox]').first();
          await iframe.waitFor({ state: 'attached', timeout: 6000 });
          assert.equal(await iframe.getAttribute('sandbox'), 'allow-scripts');

          await page.getByRole('tab', { name: /Mã nguồn/i }).first().click();
          await page.waitForTimeout(200);
          const editor = page.locator('textarea.ws-source-editor').first();
          await editor.waitFor({ state: 'visible', timeout: 4000 });
          const curHtml = await editor.inputValue();
          await editor.fill(`${curHtml}\n<!-- student-edit -->`);

          await page.locator('.ws-live [role="tablist"]').getByRole('tab', { name: /Kiểm định/i }).first().click();
          await page.waitForTimeout(250);
          const runChecks = page.getByRole('button', { name: /Chạy kiểm định 6 lớp/i }).first();
          await runChecks.waitFor({ state: 'visible', timeout: 4000 });
          await runChecks.click();
          await page.waitForTimeout(250);
          const reviewText = await page.locator('[aria-label="Diff & Check"]').first().innerText();
          assert.ok(/HTML|JS|Responsive|A11y/i.test(reviewText), 'Expected 6-layer check results');

          const downloadTrigger = page.getByRole('button', { name: /^Tải xuống$/i }).first();
          await downloadTrigger.waitFor({ state: 'visible', timeout: 4000 });
          await downloadTrigger.click();
          const htmlBtn = page.getByRole('button', { name: /Xuất HTML/i }).first();
          await htmlBtn.waitFor({ state: 'visible', timeout: 4000 });
          const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
            htmlBtn.click(),
          ]);
          assert.ok(download, 'Student single-file HTML export did not trigger download');
          assert.equal(trackers.consoleErrors.length, 0);
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T4-02',
      tier: 4,
      feature: 'F1+F3+F5+F6+F10',
      timeoutMs: 75000,
      title: 'Persona: Giáo viên (Teacher) — Q&A critique, Author accept vs IDOR block, Phòng chat, Admin isolation',
      async run(ctx) {
        const studentClient = createSessionClient(ctx.baseUrl);
        await studentClient.registerAndLogin('t4student');

        await withPage(ctx.browser, {}, async (page, trackers) => {
          const teacher = await registerUserInBrowser(page, ctx.baseUrl, 't4teacher');
          assert.equal(teacher.user?.role, 'user');

          await gotoRoute(page, ctx.baseUrl, '/community?mode=feed', 600);
          const createBtn = page.getByRole('button', { name: /Viết bài/i }).first();
          await createBtn.click();
          await page.waitForTimeout(250);

          const postTitle = `Phản biện UI 2027 ${Date.now()}`;
          const composeDialog = page.locator('dialog[open], [role="dialog"]').last();
          await composeDialog.waitFor({ state: 'visible', timeout: 5000 });
          await composeDialog.locator('input').first().fill(postTitle);
          const textarea = composeDialog.locator('textarea').first();
          await textarea.waitFor({ state: 'visible', timeout: 4000 });
          await textarea.fill('Đề xuất cấu trúc editorial cho sinh viên.');
          await composeDialog.locator('button[type="submit"]').first().click();
          await page.waitForTimeout(500);

          const listRes = await studentClient.get(`/api/community/list?page=1&limit=20&q=${encodeURIComponent(postTitle)}`);
          const createdPost = listRes.json?.items?.find((i) => i.title === postTitle);
          assert.ok(createdPost, 'Teacher post not found in paginated community list');
          assert.equal('reports' in (listRes.json || {}), false);

          const ansRes = await studentClient.post('/api/community/answer', {
            postId: createdPost.id,
            content: 'Em đã áp dụng tỉ lệ 8px và contrast 4.5:1.',
          });
          assert.equal(ansRes.status, 200);
          const answerId = ansRes.json?.post?.answers?.[0]?.id;
          assert.ok(answerId, 'Expected student answerId');

          // Student cannot accept Teacher's post answer (403 IDOR block)
          const idorAccept = await studentClient.post('/api/community/accept', { postId: createdPost.id, answerId });
          assert.equal(idorAccept.status, 403);

          // Teacher (author) accepts Student's answer (200)
          const teacherAccept = await page.evaluate(
            async ({ postId, answerId: ansId }) => {
              const r = await fetch('/api/community/accept', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ postId, answerId: ansId }),
              });
              return { status: r.status, body: await r.json() };
            },
            { postId: createdPost.id, answerId }
          );
          assert.equal(teacherAccept.status, 200, `Teacher accept failed: ${JSON.stringify(teacherAccept)}`);
          assert.equal(teacherAccept.body?.post?.answers?.[0]?.isAccepted, true, 'Expected accepted answer persisted');

          // Teacher (non-admin) is blocked from /api/admin/state
          const admAttempt = await page.evaluate(async () => {
            const r = await fetch('/api/admin/state', { credentials: 'include' });
            return r.status;
          });
          assert.equal(admAttempt, 403);

          await gotoRoute(page, ctx.baseUrl, '/community?mode=chat', 400);
          const chatInput = page.locator('.chat-compose input[aria-label="Nội dung tin nhắn"], .chat-compose input[placeholder*="Nhắn tin" i]').first();
          await chatInput.waitFor({ state: 'visible', timeout: 5000 });
          const chatMsg = 'Thầy đã xem phần phản biện.';
          await chatInput.fill(chatMsg);
          await chatInput.press('Enter');
          await page.waitForTimeout(300);
          assert.ok((await page.locator('#noi-dung').innerText()).includes(chatMsg), 'Chat message did not render in Phòng chat');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T4-03',
      tier: 4,
      feature: 'F1+F2+F4+F5+F9+F10',
      timeoutMs: 90000,
      title: 'Persona: Vibe Coder — /home PromptComposer -> Workspace split/Ctrl+F/CRUD/390px -> Publish & ZIP',
      async run(ctx) {
        await withPage(ctx.browser, { viewport: { width: 1440, height: 900 } }, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/home', 500);
          const composer = page.locator('.pcmp__input').first();
          await composer.waitFor({ state: 'visible', timeout: 6000 });
          await composer.fill('Landing page editorial tối giản cho studio kiến trúc');
          await composer.press('Enter');
          await page.waitForTimeout(900);
          assert.ok(page.url().includes('/workspace'), `Expected PromptComposer to launch /workspace, got ${page.url()}`);

          const separator = page.getByRole('separator', { name: /Thay đổi kích thước chia màn hình|Kéo để thay đổi kích thước/i }).first();
          await separator.waitFor({ state: 'visible', timeout: 8000 });
          const box = await separator.boundingBox();
          assert.ok(box, 'Expected separator bounding box');
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 4 });
          await page.mouse.up();

          await page.getByRole('tab', { name: /Mã nguồn/i }).first().click();
          await page.waitForTimeout(200);
          const addFileBtn = page.getByRole('button', { name: /Tạo tệp|Thêm tệp/i }).first();
          await addFileBtn.waitFor({ state: 'visible', timeout: 4000 });
          await addFileBtn.click();
          const nameInput = page.locator('input[placeholder*="tên tệp"], input[aria-label*="tên tệp"]').first();
          await nameInput.waitFor({ state: 'visible', timeout: 4000 });
          await nameInput.fill('vibe-theme.css');
          await nameInput.press('Enter');
          await page.waitForTimeout(150);

          await page.keyboard.press('Control+f');
          const findInput = page.locator('input[aria-label*="Tìm"], input[placeholder*="Tìm trong mã"]').first();
          await findInput.waitFor({ state: 'visible', timeout: 4000 });
          await findInput.fill('body');
          await page.waitForTimeout(150);

          for (const vp of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
            await page.setViewportSize(vp);
            await page.waitForTimeout(150);
            const ov = await measureViewportOverflow(page);
            assert.equal(ov.overflowX, false, `Vibe Coder Workspace overflow at ${vp.width}px`);
          }

          const quotaNow = await page.evaluate(async () => {
            const r = await fetch('/api/ai/quota', { credentials: 'include' });
            return r.json();
          });
          assert.ok((quotaNow?.quota?.used || 0) >= 1, `Expected quota used >= 1 after PromptComposer generation, got ${JSON.stringify(quotaNow)}`);

          const downloadTrigger = page.getByRole('button', { name: /^Tải xuống$/i }).first();
          await downloadTrigger.waitFor({ state: 'visible', timeout: 4000 });
          await downloadTrigger.click();
          const zipBtn = page.getByRole('button', { name: /Export ZIP|Xuất ZIP|Tải gói ZIP/i }).first();
          await zipBtn.waitFor({ state: 'visible', timeout: 4000 });
          const [zipDownload] = await Promise.all([
            page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
            zipBtn.click(),
          ]);
          assert.ok(zipDownload, 'Vibe Coder ZIP export did not trigger download');

          const pubBtn = page.getByRole('button', { name: /Đăng.*Tri thức/i }).first();
          await pubBtn.waitFor({ state: 'visible', timeout: 4000 });
          await pubBtn.click();
          const publishDialog = page.locator('dialog[open], [role="dialog"]').last();
          await publishDialog.waitFor({ state: 'visible', timeout: 5000 });
          const titleInput = publishDialog.locator('input').first();
          await titleInput.waitFor({ state: 'visible', timeout: 4000 });
          const pubTitle = `Vibe Build ${Date.now()}`;
          await titleInput.fill(pubTitle);
          await publishDialog.locator('button[type="submit"]').first().click();
          await page.waitForTimeout(500);

          await gotoRoute(page, ctx.baseUrl, '/community?mode=feed', 600);
          assert.ok((await page.locator('.cm-main').innerText()).includes(pubTitle), 'Published Vibe build missing in Bảng tin');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T4-04',
      tier: 4,
      feature: 'F1+F2+F7+F8+F9',
      timeoutMs: 240000,
      title: 'Persona: Critical-Thinking Designer — Zero Inter, Contrast, Backdrop Cap, Reduced Motion & Honor Dossier',
      async run(ctx) {
        const viewports = [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }];
        await withPage(ctx.browser, { viewport: viewports[0], reducedMotion: true }, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/', 600);
          for (let i = 0; i < viewports.length; i += 1) {
            const vp = viewports[i];
            if (i > 0) {
              await page.setViewportSize(vp);
              await page.waitForTimeout(150);
            }
            const ov = await measureViewportOverflow(page);
            assert.equal(ov.overflowX, false, `Designer audit overflow on / at ${vp.width}px`);
            const bf = await countBackdropFiltersInViewport(page);
            assert.ok(bf <= 2, `Backdrop filter cap exceeded (${bf} > 2) on / at ${vp.width}px`);
          }
          const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
          assert.equal(/\bInter\b/i.test(font), false, `Forbidden Inter font detected: ${font}`);
          const btns = await inspectVisibleButtons(page);
          assert.equal(btns.filter((b) => b.words > 4 && b.chars > 32).length, 0, 'Verbose buttons found on /');

          const landingChecks = await page.evaluate(() => ({
            hasSim: Boolean(document.querySelector('iframe[src*="iphone18"], .lp-phone-frame')),
            macbooks: document.querySelectorAll('img[src*="desk-computer"], [data-testid="macbook-mockup"]').length,
            liveStages: document.querySelectorAll('#du-an .starter-live-stage, #du-an [data-starter-live]').length,
          }));
          assert.equal(landingChecks.hasSim, true, 'Expected iPhone 18 Pro simulator on /');
          assert.equal(landingChecks.macbooks, 0, 'Forbidden MacBook mockup found on /');
          assert.ok(landingChecks.liveStages >= 3, `Expected >= 3 Cards 07–09 live stages, got ${landingChecks.liveStages}`);

          await gotoRoute(page, ctx.baseUrl, '/settings', 400);
          const darkContrast = await measureContrastForSelector(page, 'body');
          assert.ok(darkContrast && darkContrast.ratio >= 4.5, `Dark contrast ${darkContrast?.ratio} < 4.5`);
          await page.getByRole('button', { name: /Chuyển sang chế độ (sáng|tối)/i }).first().click();
          await page.waitForTimeout(200);
          const lightContrast = await measureContrastForSelector(page, 'body');
          assert.ok(lightContrast && lightContrast.ratio >= 4.5, `Light contrast ${lightContrast?.ratio} < 4.5`);

          await page.setViewportSize(viewports[0]);
          await gotoRoute(page, ctx.baseUrl, '/honor', 400);
          await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 25000 });
          await page.locator('canvas, article, [data-exhibit-id], .thg-card').first().waitFor({ state: 'attached', timeout: 25000 });
          assert.equal(await page.locator('.thg-chip').count(), 0, 'Filter chips still present in /honor');
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
          for (let i = 0; i < viewports.length; i += 1) {
            const vp = viewports[i];
            if (i > 0) {
              await page.setViewportSize(vp);
              await page.waitForTimeout(150);
            }
            const honorOv = await measureViewportOverflow(page);
            assert.equal(honorOv.overflowX, false, `Honor dossier overflow at ${vp.width}px`);
          }
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T4-05',
      tier: 4,
      feature: 'F3+F4+F5+F6+F11',
      timeoutMs: 75000,
      title: 'Persona: Admin — RBAC gate, Masked 2-Key Pool, Live Test Token Persistence, Quotas & Changelog',
      async run(ctx) {
        let calls = 0;
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          calls += 1;
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({
            candidates: [{ content: { parts: [{ text: `Admin live test #${calls}` }] } }],
            usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 30, totalTokenCount: 50 },
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
          const client = createSessionClient(srv.url);
          const user = createSessionClient(srv.url);
          const reg = await user.registerAndLogin('t4member');
          const subjectId = reg.res.json?.quota?.subjectId;
          assert.ok(subjectId && subjectId.startsWith('user:'), `Expected user: subjectId, got ${subjectId}`);

          // Seed a pending community report for moderation
          const post = await user.post('/api/community/create', {
            channel: 'qa',
            title: `T4 Mod Post ${Date.now()}`,
            body: 'Moderation target',
          });
          assert.equal(post.status, 201);
          const rep = await user.post('/api/community/report', {
            targetId: post.json?.post?.id,
            reason: 'E2E admin moderation check',
          });
          assert.equal(rep.status, 201);
          const reportId = rep.json?.reportId ?? rep.json?.report?.id;
          assert.ok(reportId, 'Expected created reportId');

          // Admin creds MUST fail on public user login
          const rejected = await client.post('/api/auth/login', {
            identifier: DEFAULT_ADMIN_USER,
            password: DEFAULT_ADMIN_PASS,
          });
          assert.equal(rejected.status, 401);

          await withPage(ctx.browser, {}, async (page, trackers) => {
            await gotoRoute(page, srv.url, '/admin', 500);
            await page.getByLabel('Tài khoản Admin').fill(DEFAULT_ADMIN_USER);
            await page.getByLabel('Mật khẩu Admin').fill(DEFAULT_ADMIN_PASS);
            await page.locator('.adm-auth-card button[type="submit"]').first().click();
            await page.getByRole('heading', { name: /Bảng điều khiển quản trị/i }).first().waitFor({ state: 'visible', timeout: 15000 });
            await page.getByText(DEFAULT_POOL_KEY_1_MASK).first().waitFor({ state: 'visible', timeout: 15000 });

            const aqPrefix = ['AQ', '.Ab8'].join('');
            const dashText = await page.locator('#noi-dung').innerText();
            assert.ok(dashText.includes(DEFAULT_POOL_KEY_1_MASK) && dashText.includes(DEFAULT_POOL_KEY_2_MASK));
            assert.equal(dashText.includes(aqPrefix), false);

            const testBtn = page.getByRole('button', { name: /Kiểm tra Pool|Thử Pool|Chạy thử Key/i }).first();
            await Promise.all([
              page.waitForResponse((r) => r.url().includes('/api/admin/key-pool/test') && r.status() === 200),
              testBtn.click(),
            ]);

            const failoverRes = await page.evaluate(async () => {
              const r = await fetch('/api/admin/key-pool/test', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ mode: 'failover_sim' }),
              });
              return { status: r.status, body: await r.json() };
            });
            assert.equal(failoverRes.status, 200);
            assert.equal(failoverRes.body?.usedKeyMask, DEFAULT_POOL_KEY_2_MASK);

            await reloadRoute(page, 400);
            const afterReloadText = await page.locator('#noi-dung').innerText();
            assert.ok(afterReloadText.includes('100') || afterReloadText.includes('50'), 'Expected persisted token telemetry after reload');

            const adminApi = createSessionClient(srv.url);
            await adminApi.adminLogin();
            const quotaRes = await adminApi.post('/api/admin/quotas', { subjectId, customLimit: 3 });
            assert.equal(quotaRes.status, 200);
            const userQuota = await user.get('/api/ai/quota');
            assert.equal(userQuota.json?.quota?.dailyLimit, 3, `Expected user dailyLimit 3, got ${userQuota.text}`);

            const modRes = await adminApi.post('/api/admin/moderate', { reportId, status: 'dismissed' });
            assert.equal(modRes.status, 200);

            const chgRes = await adminApi.post('/api/admin/changelog', { version: '3.1.0', title: 'E2E Release', notes: 'Verified' });
            assert.ok([200, 201].includes(chgRes.status));
            assert.equal(trackers.pageErrors.length, 0);
          });
        } finally {
          await srv.close();
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T4-06',
      tier: 4,
      feature: 'F3+F4+F5+F6',
      timeoutMs: 90000,
      title: 'Persona: Security Auditor — Full F12 Network, Bundle Isolation, Anti-Spoof, IDOR & Secret Hygiene',
      async run(ctx) {
        const { mapFiles, indexJsFiles } = scanDistAssets();
        assert.equal(mapFiles.length, 0, 'Found .map sourcemaps in dist/');
        for (const f of indexJsFiles) {
          const code = fs.readFileSync(f, 'utf8');
          assert.equal(code.includes('/api/admin'), false, 'Admin route leaked in public main chunk');
        }

        const { stdout } = await execFileAsync('python3', [
          path.join(STUDIO_SCRIPTS_DIR, 'audit_secrets.py'),
          '--project',
          PROJECT_ROOT,
        ]);
        assert.ok(/PASS/i.test(stdout));

        const srv = await startIsolatedServer({ forceSpawn: true });
        try {
          const auditor = createSessionClient(srv.url);
          const health = await auditor.get('/api/health', { headers: { origin: 'https://evil.example' } });
          assert.equal(health.headers.get('x-powered-by'), null);
          assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
          assert.equal(health.headers.get('x-frame-options'), 'SAMEORIGIN');
          assert.ok(health.headers.get('referrer-policy'));
          assert.ok(health.headers.get('permissions-policy'));
          assert.notEqual(health.headers.get('access-control-allow-origin'), 'https://evil.example');
          const vercelRaw = fs.readFileSync(path.join(PROJECT_ROOT, 'vercel.json'), 'utf8');
          assert.ok(vercelRaw.includes('Content-Security-Policy'));
          if (process.env.E2E_BASE_URL) {
            assert.ok(health.headers.get('content-security-policy'));
          }

          // Anti-spoof guest header rotation
          let hit429 = false;
          for (let i = 1; i <= 17; i += 1) {
            const r = await auditor.post('/api/ai/chat', { projectId: 'sec', prompt: `P${i}` }, {
              omitCookies: true,
              headers: { 'x-ff-guest-id': `rot-${i}-${Date.now()}` },
            });
            if (r.status === 429) {
              hit429 = true;
              break;
            }
          }
          assert.equal(hit429, true, 'Guest header rotation bypassed quota');

          // IDOR checks on /api/community/accept & /api/community/dossier
          const owner = createSessionClient(srv.url);
          const intruder = createSessionClient(srv.url);
          const anon = createSessionClient(srv.url);
          await owner.registerAndLogin('t4sec_own');
          await intruder.registerAndLogin('t4sec_int');
          const qaPost = await owner.post('/api/community/create', { channel: 'qa', title: `Sec QA ${Date.now()}` });
          assert.equal(qaPost.status, 201);
          const ans = await intruder.post('/api/community/answer', { postId: qaPost.json?.post?.id, content: 'Intruder ans' });
          assert.equal(ans.status, 200);
          assert.equal((await anon.post('/api/community/accept', { postId: qaPost.json?.post?.id, answerId: ans.json?.post?.answers?.[0]?.id })).status, 401);
          assert.equal((await intruder.post('/api/community/accept', { postId: qaPost.json?.post?.id, answerId: ans.json?.post?.answers?.[0]?.id })).status, 403);

          const clubPost = await owner.post('/api/community/create', { channel: 'clubs', title: `Sec Club ${Date.now()}` });
          assert.equal(clubPost.status, 201);
          assert.equal((await anon.post('/api/community/dossier', { clubId: clubPost.json?.post?.id, dossier: { projectTitle: 'X' } })).status, 401);
          assert.equal((await intruder.post('/api/community/dossier', { clubId: clubPost.json?.post?.id, dossier: { projectTitle: 'X' } })).status, 403);

          // GET logout CSRF blocked
          const getLogout = await auditor.get('/api/auth/logout');
          assert.equal(getLogout.status, 405);

          // Community list allowlist
          const list = await auditor.get('/api/community/list?page=1&limit=10');
          assert.equal('reports' in (list.json || {}), false);

          // Error redaction check
          const fakeAq = makeSyntheticSecret('aq-ab8');
          const badUp = await startMockUpstream(async (_req, res) => {
            res.statusCode = 500;
            res.end(`Key err ?key=${fakeAq}`);
          });
          try {
            const ai = await auditor.post('/api/ai/chat', { projectId: 'sec2', prompt: 'Hello' }, {
              headers: { 'x-ff-byok-url': badUp.url, 'x-ff-byok-key': fakeAq, 'x-ff-byok-protocol': 'openai-compatible' },
            });
            assert.equal(ai.text.includes(fakeAq), false);
          } finally {
            await badUp.close();
          }

          // Browser F12 console security notice check
          await withPage(ctx.browser, {}, async (page, trackers) => {
            await gotoRoute(page, srv.url, '/', 500);
            const warnText = [...trackers.consoleWarnings, ...trackers.consoleLogs].join('\n');
            assert.ok(/bảo mật|cảnh báo|F-Forum/i.test(warnText), 'Missing console security notice on /');
            assert.equal(trackers.consoleErrors.length, 0);
          });
        } finally {
          await srv.close();
        }
      },
    },
  ];
}
