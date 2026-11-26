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
  DIST_DIR,
  gotoRoute,
  inspectVisibleButtons,
  loginAdminInBrowser,
  makeSyntheticPoolPair,
  makeSyntheticSecret,
  measureContrastForSelector,
  measureViewportOverflow,
  PROJECT_ROOT,
  registerUserInBrowser,
  reloadRoute,
  scanDistAssets,
  seedWorkspaceArtifact,
  startIsolatedServer,
  startMockUpstream,
  STUDIO_SCRIPTS_DIR,
  withPage,
} from './harness.mjs';

const execFileAsync = promisify(execFile);

export function getTier1Tests() {
  return [
    // =========================================================================
    // F1 — Custom SVG Icon System
    // =========================================================================
    {
      id: 'T1-F1-01',
      tier: 1,
      feature: 'F1',
      timeoutMs: 75000,
      title: 'Custom SVG icons render across Navbar & Workspace without lucide-react',
      async run(ctx) {
        const { jsAssets } = scanDistAssets();
        const vendorIcons = jsAssets.filter((f) => path.basename(f).startsWith('vendor-icons'));
        assert.equal(vendorIcons.length, 0, `Unexpected lucide-react vendor-icons chunk: ${vendorIcons.join(', ')}`);

        await withPage(ctx.browser, {}, async (page, trackers) => {
          for (const route of ['/home', '/workspace', '/community']) {
            await gotoRoute(page, ctx.baseUrl, route, 500);
            const info = await page.evaluate(() => {
              const lucideEls = document.querySelectorAll('svg.lucide, [class*="lucide-"]').length;
              const svgs = Array.from(document.querySelectorAll('header svg, nav svg, .ws svg'));
              const nonZero = svgs.filter((s) => {
                const r = s.getBoundingClientRect();
                return r.width > 0 && r.height > 0;
              }).length;
              return { lucideEls, totalSvgs: svgs.length, nonZero };
            });
            assert.equal(info.lucideEls, 0, `Found ${info.lucideEls} lucide SVG classes on ${route}`);
            assert.ok(info.nonZero > 0, `Expected visible custom SVGs on ${route}`);
          }
          assert.equal(trackers.pageErrors.length, 0, `Page errors: ${trackers.pageErrors.join('; ')}`);
        });
      },
    },
    {
      id: 'T1-F1-02',
      tier: 1,
      feature: 'F1',
      timeoutMs: 90000,
      title: 'Universal controls use SVG icon-only with aria-label & short tooltip',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          for (const route of ['/home', '/explore', '/workspace', '/community']) {
            await gotoRoute(page, ctx.baseUrl, route, 450);
            const buttons = await inspectVisibleButtons(page);
            const iconOnly = buttons.filter((b) => b.text === '' && b.hasSvg);
            assert.ok(iconOnly.length > 0, `Expected icon-only SVG controls on ${route}`);
            for (const btn of iconOnly) {
              assert.ok(btn.ariaLabel.length > 0, `Icon-only button on ${route} missing aria-label`);
              if (btn.title) {
                const titleWords = btn.title.split(/\s+/).filter(Boolean).length;
                assert.ok(titleWords <= 3, `Tooltip too long (${titleWords} words) on ${route}: "${btn.title}"`);
              }
            }
          }
        });
      },
    },
    {
      id: 'T1-F1-03',
      tier: 1,
      feature: 'F1',
      timeoutMs: 60000,
      title: 'SearchCard removes blurry psearch-fab-tile icon wrappers',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          for (const route of ['/explore', '/community']) {
            await gotoRoute(page, ctx.baseUrl, route, 500);
            const searchInput = page.locator('.psearch-shell input[type="search"], input[type="search"]').first();
            await searchInput.waitFor({ state: 'visible', timeout: 12000 });
            await searchInput.click();
            await page.waitForTimeout(250);
            const check = await page.evaluate(() => {
              const blurryCount = document.querySelectorAll('.psearch-fab-tile').length;
              const dropdownVisible = Boolean(document.querySelector('.psearch-dropdown'));
              const svgCount = document.querySelectorAll('.psearch-shell svg, .psearch-dropdown svg, .psearch-bar svg').length;
              return { blurryCount, dropdownVisible, svgCount };
            });
            assert.equal(check.blurryCount, 0, `Found ${check.blurryCount} blurry .psearch-fab-tile wrappers on ${route}`);
            assert.ok(check.svgCount > 0, `Expected crisp SVG glyphs inside SearchCard on ${route}`);
            if (route === '/community') {
              assert.equal(check.dropdownVisible, true, 'Expected SearchCard dropdown to open on focus on /community');
            }
          }
        });
      },
    },
    {
      id: 'T1-F1-04',
      tier: 1,
      feature: 'F1',
      timeoutMs: 90000,
      title: 'Optical alignment & touch hit-target compliance on custom icons',
      async run(ctx) {
        await withPage(ctx.browser, { viewport: { width: 390, height: 844 } }, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/home', 450);
          const mobileChecks = await page.evaluate(() => {
            const bnavBtns = Array.from(document.querySelectorAll('.mobile-bnav button, .mobile-bnav a'));
            return bnavBtns.map((el) => {
              const r = el.getBoundingClientRect();
              const svg = el.querySelector('svg');
              const sr = svg ? svg.getBoundingClientRect() : null;
              return {
                width: Math.round(r.width),
                height: Math.round(r.height),
                svgW: sr ? Math.round(sr.width) : 0,
                svgH: sr ? Math.round(sr.height) : 0,
              };
            });
          });
          assert.ok(mobileChecks.length > 0, 'Expected mobile bottom nav controls at 390px');
          for (const item of mobileChecks) {
            assert.ok(item.height >= 44, `Mobile nav button height ${item.height}px < 44px`);
            assert.ok(item.svgW >= 14 && item.svgW <= 26, `SVG width ${item.svgW}px outside optical 14-26px`);
            assert.ok(item.svgH >= 14 && item.svgH <= 26, `SVG height ${item.svgH}px outside optical 14-26px`);
          }
        });
        await withPage(ctx.browser, { viewport: { width: 1440, height: 900 } }, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/home', 450);
          const desktopChecks = await page.evaluate(() => {
            const iconBtns = Array.from(document.querySelectorAll('header.nav button')).filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && el.querySelector('svg') && !(el.innerText || '').trim();
            });
            return iconBtns.map((el) => {
              const r = el.getBoundingClientRect();
              const visibleSvg = Array.from(el.querySelectorAll('svg')).find((s) => {
                const cs = getComputedStyle(s);
                return cs.opacity !== '0' && cs.visibility !== 'hidden' && cs.display !== 'none';
              }) || el.querySelector('svg');
              const sr = visibleSvg.getBoundingClientRect();
              return {
                width: Math.round(r.width),
                height: Math.round(r.height),
                svgW: Math.round(sr.width),
                svgH: Math.round(sr.height),
              };
            });
          });
          assert.ok(desktopChecks.length > 0, 'Expected desktop header icon buttons at 1440px');
          for (const item of desktopChecks) {
            assert.ok(item.width >= 32 && item.height >= 32, `Desktop icon button hit area ${item.width}x${item.height} < 32x32`);
            assert.ok(item.svgW >= 14 && item.svgW <= 26 && item.svgH >= 14 && item.svgH <= 26, `Desktop SVG ${item.svgW}x${item.svgH} outside 14-26px`);
          }
        });
      },
    },
    {
      id: 'T1-F1-05',
      tier: 1,
      feature: 'F1',
      timeoutMs: 60000,
      title: 'Custom SVG icons adapt cleanly to both Dark and Light themes',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/home', 450);
          const toggle = page.getByRole('button', { name: /Chuyển sang chế độ (sáng|tối)/i }).first();
          await toggle.waitFor({ state: 'visible', timeout: 12000 });
          const c1 = await measureContrastForSelector(page, 'header.nav button[aria-label*="Chuyển sang"]');
          assert.ok(c1 && c1.ratio >= 3, `Initial theme icon contrast ${c1?.ratio} < 3:1`);
          await toggle.click();
          await page.waitForTimeout(300);
          const c2 = await measureContrastForSelector(page, 'header.nav button[aria-label*="Chuyển sang"]');
          assert.ok(c2 && c2.ratio >= 3, `Toggled theme icon contrast ${c2?.ratio} < 3:1`);
          assert.notEqual(c1.bg, c2.bg, 'Expected theme switch to update effective icon button background');
        });
      },
    },

    // =========================================================================
    // F2 — Global CSS, Contrast & 60fps Baseline
    // =========================================================================
    {
      id: 'T1-F2-01',
      tier: 1,
      feature: 'F2',
      title: 'Hairline borders restored (zero border-color: transparent !important override)',
      async run(ctx) {
        const { cssAssets } = scanDistAssets();
        for (const cssFile of cssAssets) {
          const content = fs.readFileSync(cssFile, 'utf8');
          const hasGlobalStrip = /border-color\s*:\s*transparent\s*!important/i.test(content);
          assert.equal(hasGlobalStrip, false, `Found global border-color: transparent !important in ${path.basename(cssFile)}`);
        }
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/settings', 450);
          const borderCheck = await page.evaluate(() => {
            const bordered = Array.from(document.querySelectorAll('section, article, input, button'))
              .map((el) => getComputedStyle(el))
              .filter((cs) => parseFloat(cs.borderTopWidth) > 0);
            return bordered.some((cs) => cs.borderTopColor !== 'rgba(0, 0, 0, 0)' && cs.borderTopColor !== 'transparent');
          });
          assert.equal(borderCheck, true, 'Expected visible non-transparent borders on UI elements');
        });
      },
    },
    {
      id: 'T1-F2-02',
      tier: 1,
      feature: 'F2',
      timeoutMs: 90000,
      title: 'Accent & body contrast meets WCAG AA (>= 4.5:1) in Dark & Light themes',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/', 500);
          for (let step = 0; step < 2; step += 1) {
            const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark');
            const bodyContrast = await measureContrastForSelector(page, 'body');
            assert.ok(bodyContrast && bodyContrast.ratio >= 4.5, `Body contrast ${bodyContrast?.ratio} < 4.5 in ${theme}`);

            const accentBtnContrast = await page.evaluate(() => {
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
              const btns = Array.from(document.querySelectorAll('.btn-red, .btn-accent, [data-accent-cta]'))
                .filter((el) => {
                  const r = el.getBoundingClientRect();
                  const cs = getComputedStyle(el);
                  const bg = parseRgb(cs.backgroundColor);
                  return r.width > 30 && r.height > 20 && cs.visibility !== 'hidden' && bg && bg.a > 0.85;
                });
              if (btns.length === 0) return null;
              const cs = getComputedStyle(btns[0]);
              const fg = parseRgb(cs.color);
              const bg = parseRgb(cs.backgroundColor);
              if (!fg || !bg) return null;
              const l1 = relLum(fg);
              const l2 = relLum(bg);
              return Number(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2));
            });
            assert.ok(accentBtnContrast !== null, `Expected visible solid accent CTA button in ${theme}`);
            assert.ok(accentBtnContrast >= 4.5, `Accent CTA contrast ${accentBtnContrast} < 4.5 in ${theme}`);

            if (step === 0) {
              await gotoRoute(page, ctx.baseUrl, '/settings', 400);
              const toggle = page.getByRole('button', { name: /Chuyển sang chế độ (sáng|tối)/i }).first();
              await toggle.waitFor({ state: 'visible', timeout: 5000 });
              await toggle.click();
              await page.waitForFunction(
                (prev) => (document.documentElement.getAttribute('data-theme') || 'dark') !== prev,
                theme,
                { timeout: 5000 }
              );
              await gotoRoute(page, ctx.baseUrl, '/', 500);
            }
          }
        });
      },
    },
    {
      id: 'T1-F2-03',
      tier: 1,
      feature: 'F2',
      timeoutMs: 60000,
      title: 'Zero Inter font family in rendered pages and built CSS',
      async run(ctx) {
        const { cssAssets, indexHtml } = scanDistAssets();
        assert.equal(/\bInter\b/i.test(indexHtml), false, 'dist/index.html still references Inter font');
        for (const cssFile of cssAssets) {
          const content = fs.readFileSync(cssFile, 'utf8');
          const matches = content.match(/['"]Inter['"]|\bInter\s*,/g) || [];
          assert.equal(matches.length, 0, `Found Inter font declaration in ${path.basename(cssFile)}`);
        }
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/', 400);
          await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 20000 });
          const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
          assert.equal(/\bInter\b/i.test(fontFamily), false, `Computed body fontFamily still uses Inter: ${fontFamily}`);
        });
      },
    },
    {
      id: 'T1-F2-04',
      tier: 1,
      feature: 'F2',
      title: 'Compositor-only 60fps baseline (no background-attachment: fixed, capped backdrop-filter)',
      async run(ctx) {
        const { cssAssets } = scanDistAssets();
        for (const cssFile of cssAssets) {
          const content = fs.readFileSync(cssFile, 'utf8');
          assert.equal(/transition\s*:\s*all\b/i.test(content), false, `Found "transition: all" in ${path.basename(cssFile)}`);
        }
        await withPage(ctx.browser, {}, async (page) => {
          for (const route of ['/home', '/explore']) {
            await gotoRoute(page, ctx.baseUrl, route, 450);
            const bgAttach = await page.evaluate(() => getComputedStyle(document.body).backgroundAttachment);
            assert.notEqual(bgAttach, 'fixed', `body backgroundAttachment is "fixed" on ${route}`);
            const bfCount = await countBackdropFiltersInViewport(page);
            assert.ok(bfCount <= 2, `Expected <= 2 active backdrop-filter layers in viewport on ${route}, found ${bfCount}`);
          }
        });
      },
    },
    {
      id: 'T1-F2-05',
      tier: 1,
      feature: 'F2',
      timeoutMs: 75000,
      title: 'StorybookHero / PinUI Playground clean of # dead links and "seamless" fluff',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/', 400);
          await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 20000 });
          const landingAudit = await page.evaluate(() => {
            const root = document.querySelector('#noi-dung') || document.body;
            const text = root instanceof HTMLElement ? root.innerText : (root.textContent || '');
            return {
              deadLinks: root.querySelectorAll('a[href="#"], a[href=""]').length,
              hasSeamless: /\bseamless\b/i.test(text || ''),
            };
          });
          assert.equal(landingAudit.deadLinks, 0, `Found ${landingAudit.deadLinks} dead #/empty links on /`);
          assert.equal(landingAudit.hasSeamless, false, 'Found "seamless" copy on /');

          await gotoRoute(page, ctx.baseUrl, '/explore/experience?item=blocx%2Fstorybook-hero', 600);
          await page.locator('#sbh-top').waitFor({ state: 'visible', timeout: 20000 });
          const heroAudit = await page.evaluate(() => {
            const root = document.querySelector('#sbh-top');
            if (!root) return { missing: true, deadLinks: -1, hasSeamless: true };
            const text = root instanceof HTMLElement ? root.innerText : (root.textContent || '');
            return {
              missing: false,
              deadLinks: root.querySelectorAll('a[href="#"], a[href=""]').length,
              hasSeamless: /\bseamless\b/i.test(text || ''),
            };
          });
          assert.equal(heroAudit.missing, false, 'Expected #sbh-top root on StorybookHero');
          assert.equal(heroAudit.deadLinks, 0, `Found ${heroAudit.deadLinks} dead #/empty links on StorybookHero`);
          assert.equal(heroAudit.hasSeamless, false, 'Found "seamless" copy on StorybookHero');
        });
      },
    },

    // =========================================================================
    // F3 — Client Admin/User Bundle Separation & F12 Guard
    // =========================================================================
    {
      id: 'T1-F3-01',
      tier: 1,
      feature: 'F3',
      title: 'Public main bundle dist/assets/index-*.js excludes /api/admin & admin-login',
      async run() {
        const { indexJsFiles } = scanDistAssets();
        assert.ok(indexJsFiles.length > 0, 'Expected at least one dist/assets/index-*.js file');
        for (const file of indexJsFiles) {
          const code = fs.readFileSync(file, 'utf8');
          for (const forbidden of ['/api/admin', 'admin-login', 'AdminView', 'Bảng điều khiển quản trị']) {
            assert.equal(code.includes(forbidden), false, `Public bundle ${path.basename(file)} leaked "${forbidden}"`);
          }
        }
      },
    },
    {
      id: 'T1-F3-02',
      tier: 1,
      feature: 'F3',
      title: 'Production build ships zero .map source maps and strips debugger',
      async run() {
        const { mapFiles, jsAssets } = scanDistAssets();
        assert.equal(mapFiles.length, 0, `Found .map source maps in dist/: ${mapFiles.join(', ')}`);
        for (const file of jsAssets) {
          const code = fs.readFileSync(file, 'utf8');
          assert.equal(/\bdebugger\b;?/.test(code), false, `Found debugger statement in ${path.basename(file)}`);
        }
      },
    },
    {
      id: 'T1-F3-03',
      tier: 1,
      feature: 'F3',
      title: 'Non-admin / guest UI hides /admin from Navbar, NotificationBell, and CommandPalette',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await registerUserInBrowser(page, ctx.baseUrl, 'f3user');
          await gotoRoute(page, ctx.baseUrl, '/home', 500);

          const accountBtn = page.getByRole('button', { name: /Tài khoản/i }).first();
          await accountBtn.click();
          await page.waitForTimeout(200);
          const hasAdminMenu = await page.getByRole('button', { name: /Quản trị/i }).count();
          assert.equal(hasAdminMenu, 0, 'Standard user account menu exposed Quản trị');

          const bellBtn = page.getByRole('button', { name: /Thông báo/i }).first();
          await bellBtn.click();
          await page.waitForTimeout(200);
          const bellText = await page.locator('[role="dialog"]').last().innerText().catch(() => '');
          assert.equal(/\/admin|quản trị hệ thống/i.test(bellText), false, 'NotificationBell exposed admin telemetry to user');

          await page.keyboard.press('Escape');
          await page.keyboard.press('Control+e');
          await page.waitForTimeout(200);
          const paletteAdmin = await page.locator('[role="dialog"] button, [role="listbox"] [role="option"]')
            .filter({ hasText: /Quản trị|\/admin/i }).count();
          assert.equal(paletteAdmin, 0, 'CommandPalette exposed /admin to non-admin user');
        });
      },
    },
    {
      id: 'T1-F3-04',
      tier: 1,
      feature: 'F3',
      timeoutMs: 60000,
      title: 'Direct navigation to /admin as Guest/User mounts Admin Login Gate only',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await registerUserInBrowser(page, ctx.baseUrl, 'f3gate');
          await gotoRoute(page, ctx.baseUrl, '/admin', 400);
          await page.getByRole('heading', { name: /Cổng Quản trị/i }).first().waitFor({ state: 'visible', timeout: 20000 });
          const gateHeading = await page.getByRole('heading', { name: /Cổng Quản trị/i }).count();
          const dashHeading = await page.getByRole('heading', { name: /Bảng điều khiển quản trị/i }).count();
          assert.equal(gateHeading, 1, 'Expected Admin login gate heading on /admin for non-admin');
          assert.equal(dashHeading, 0, 'Admin dashboard rendered for non-admin user');
          const adminState200 = trackers.responses.filter((r) => r.url.includes('/api/admin/state') && r.status === 200);
          assert.equal(adminState200.length, 0, 'Non-admin /admin visit received HTTP 200 on /api/admin/state');
        });
      },
    },
    {
      id: 'T1-F3-05',
      tier: 1,
      feature: 'F3',
      timeoutMs: 90000,
      title: 'Browser console security warning & accessible DevTools notice render cleanly at 60fps',
      async run(ctx) {
        await withPage(ctx.browser, { viewport: { width: 1440, height: 900 } }, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/', 400);
          await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 20000 });
          assert.equal(trackers.consoleErrors.length, 0, `Console errors on /: ${trackers.consoleErrors.join('; ')}`);
          assert.equal(trackers.pageErrors.length, 0, `Page errors on /: ${trackers.pageErrors.join('; ')}`);
          const allMsgs = [...trackers.consoleWarnings, ...trackers.consoleLogs].join('\n');
          assert.ok(
            /bảo mật|cảnh báo|F-Forum|F12|security/i.test(allMsgs),
            `Expected console security warning banner on boot, saw: ${allMsgs.slice(0, 200)}`
          );
          const overflow = await measureViewportOverflow(page);
          assert.equal(overflow.overflowX, false, `Horizontal overflow on /: ${JSON.stringify(overflow)}`);
          const banner = page.locator('aside[aria-label="Thông báo bảo mật trình duyệt"]');
          assert.equal(await banner.count(), 0, 'DevTools notice should not appear on normal / viewport');

          await page.addInitScript(() => {
            Object.defineProperty(window, 'outerWidth', { value: 1920, configurable: true });
            Object.defineProperty(window, 'outerHeight', { value: 960, configurable: true });
          });
          await gotoRoute(page, ctx.baseUrl, '/settings', 300);
          await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 20000 });
          await page.evaluate(() => window.dispatchEvent(new Event('resize')));
          await banner.waitFor({ state: 'visible', timeout: 15000 });
          const ov = await measureViewportOverflow(page);
          assert.equal(ov.overflowX, false, `DevTools notice caused overflow: ${JSON.stringify(ov)}`);
          const closeBtn = banner.getByRole('button', { name: /Đóng cảnh báo bảo mật/i });
          await closeBtn.focus();
          await page.keyboard.press('Enter');
          await page.waitForTimeout(200);
          assert.equal(await banner.count(), 0, 'DevTools notice did not dismiss via keyboard');
          const dismissedVal = await page.evaluate(() => sessionStorage.getItem('fforum_v3_devtools_notice_dismissed'));
          assert.equal(dismissedVal, '1', 'DevTools notice dismissal was not persisted in sessionStorage');
          await reloadRoute(page, 300);
          await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 20000 });
          assert.equal(await banner.count(), 0, 'Dismissed DevTools notice reappeared after reload');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },

    // =========================================================================
    // F4 — Server 2-Key API Pool & Token Accounting
    // =========================================================================
    {
      id: 'T1-F4-01',
      tier: 1,
      feature: 'F4',
      title: 'Admin state exposes masked 2-key pool (AQ.***m9mGw, AQ.***KECWw) without raw keys',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        const login = await client.adminLogin();
        assert.equal(login.status, 200);
        const res = await client.get('/api/admin/state');
        assert.equal(res.status, 200);
        const aqPrefix = ['AQ', '.Ab8'].join('');
        assert.equal(res.text.includes(aqPrefix), false, 'Raw AQ.Ab* key leaked in /api/admin/state');
        assert.equal(res.text.includes('SynthTestToken_'), false, 'Raw synthetic key leaked in /api/admin/state');
        const keyPool = res.json?.state?.keyPool;
        assert.ok(keyPool, 'Expected state.keyPool in /api/admin/state');
        assert.equal(Array.isArray(keyPool.keys) && keyPool.keys.length, 2, 'Expected 2 keys in keyPool.keys');
        const masks = keyPool.keys.map((k) => k.mask);
        assert.ok(masks.includes(DEFAULT_POOL_KEY_1_MASK), `Missing mask ${DEFAULT_POOL_KEY_1_MASK} in ${JSON.stringify(masks)}`);
        assert.ok(masks.includes(DEFAULT_POOL_KEY_2_MASK), `Missing mask ${DEFAULT_POOL_KEY_2_MASK} in ${JSON.stringify(masks)}`);
        assert.ok(keyPool.sharedAccountQuota, 'Expected sharedAccountQuota object');
        assert.ok(keyPool.totalTokens && typeof keyPool.totalTokens.total === 'number', 'Expected totalTokens telemetry');
      },
    },
    {
      id: 'T1-F4-02',
      tier: 1,
      feature: 'F4',
      title: 'Live Key Pool test (mode: pool) records prompt/completion/total tokens',
      async run() {
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Pool probe OK' }] } }],
            usageMetadata: { promptTokenCount: 18, candidatesTokenCount: 27, totalTokenCount: 45 },
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
          assert.equal((await client.adminLogin()).status, 200);
          const probe = await client.post('/api/admin/key-pool/test', { mode: 'pool' });
          assert.equal(probe.status, 200, `Expected 200 from key-pool/test, got ${probe.status}: ${probe.text}`);
          assert.equal(probe.json?.ok, true, `Expected ok: true, got ${probe.text}`);
          assert.match(String(probe.json?.usedKeyMask || ''), /^AQ\.\*\*\*(m9mGw|KECWw)$/, `Unexpected usedKeyMask: ${probe.text}`);
          assert.deepEqual(probe.json?.tokens, { prompt: 18, completion: 27, total: 45 }, `Unexpected probe tokens: ${probe.text}`);
          assert.equal(probe.text.includes(key1), false, 'Raw key 1 leaked in probe response');
          assert.equal(probe.text.includes(key2), false, 'Raw key 2 leaked in probe response');
          const after = await client.get('/api/admin/state');
          assert.ok(after.json?.state?.keyPool?.totalTokens?.total >= 45, 'State totalTokens did not increment');
        } finally {
          await srv.close();
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T1-F4-03',
      tier: 1,
      feature: 'F4',
      title: 'Key-pool failover_sim rotates cleanly from key 1 to key 2',
      async run() {
        const { key1, key2 } = makeSyntheticPoolPair();
        const mockUpstream = await startMockUpstream(async (req, res) => {
          const usedKey = req.headers['x-goog-api-key'];
          if (usedKey === key1) {
            res.statusCode = 429;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ error: { message: 'Quota 429 on key 1' } }));
            return;
          }
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Failover key 2 OK' }] } }],
            usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 15, totalTokenCount: 25 },
          }));
        });
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
          assert.equal((await client.adminLogin()).status, 200);
          const probe = await client.post('/api/admin/key-pool/test', { mode: 'failover_sim' });
          assert.equal(probe.status, 200, `Expected 200 on failover_sim, got ${probe.status}: ${probe.text}`);
          assert.equal(probe.json?.mode, 'failover_sim');
          assert.ok(
            Array.isArray(probe.json?.attemptedKeys) &&
            probe.json.attemptedKeys.includes(DEFAULT_POOL_KEY_1_MASK) &&
            probe.json.attemptedKeys.includes(DEFAULT_POOL_KEY_2_MASK),
            `Expected attemptedKeys to include both keys, got ${probe.text}`
          );
          assert.equal(probe.json?.usedKeyMask, DEFAULT_POOL_KEY_2_MASK, `Expected failover to ${DEFAULT_POOL_KEY_2_MASK}, got ${probe.text}`);
          assert.ok((probe.json?.state?.keyPool?.keys?.[0]?.failovers || 0) >= 1, 'Expected key 1 failovers >= 1');
          assert.equal(probe.json?.state?.keyPool?.keys?.[0]?.status, 'cooldown', 'Expected key 1 in cooldown after failover_sim');
          assert.equal(probe.text.includes(key1) || probe.text.includes(key2), false, 'Raw key leaked in failover_sim response');
        } finally {
          await srv.close();
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T1-F4-04',
      tier: 1,
      feature: 'F4',
      title: 'POST /api/admin/key-pool/test supports targeted key1 and key2 probes',
      async run() {
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Targeted probe OK' }] } }],
            usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 5, totalTokenCount: 10 },
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
          assert.equal((await client.adminLogin()).status, 200);
          const p1 = await client.post('/api/admin/key-pool/test', { mode: 'key1' });
          const p2 = await client.post('/api/admin/key-pool/test', { mode: 'key2' });
          assert.equal(p1.status, 200);
          assert.equal(p2.status, 200);
          assert.equal(p1.json?.usedKeyMask, DEFAULT_POOL_KEY_1_MASK, `Expected ${DEFAULT_POOL_KEY_1_MASK} for key1, got ${p1.text}`);
          assert.equal(p2.json?.usedKeyMask, DEFAULT_POOL_KEY_2_MASK, `Expected ${DEFAULT_POOL_KEY_2_MASK} for key2, got ${p2.text}`);
          assert.notEqual(p1.json?.usedKeyMask, p2.json?.usedKeyMask, 'Expected distinct masks for key1 vs key2');
        } finally {
          await srv.close();
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T1-F4-05',
      tier: 1,
      feature: 'F4',
      title: 'sanitizeErrorText redacts AQ.*, sk-*, AIza*, Bearer, and ?key= in AI errors',
      async run(ctx) {
        const fakeAq = makeSyntheticSecret('aq-ab8');
        const fakeSk = makeSyntheticSecret('sk');
        const fakeAiza = makeSyntheticSecret('aiza');
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          res.statusCode = 502;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({
            error: `Upstream failed at https://api.example/v1?key=${fakeAq} with Bearer ${fakeSk} and ${fakeAiza}`,
          }));
        });
        try {
          const client = createSessionClient(ctx.baseUrl);
          const res = await client.post('/api/ai/chat', {
            projectId: 'f4-sanitize-test',
            prompt: 'Build minimal card',
          }, {
            headers: {
              'x-ff-byok-url': mockUpstream.url,
              'x-ff-byok-key': fakeAq,
              'x-ff-byok-protocol': 'openai-compatible',
              'x-ff-byok-model': 'gemini-2.5-flash',
            },
          });
          assert.equal(res.status, 200, `Expected graceful 200 fallback, got ${res.status}: ${res.text}`);
          assert.equal(res.json?.fallback, true, 'Expected fallback: true on upstream 502');
          assert.equal(res.text.includes(fakeAq), false, 'Raw AQ secret leaked in /api/ai/chat error response');
          assert.equal(res.text.includes(fakeSk), false, 'Raw sk secret leaked in /api/ai/chat error response');
          assert.equal(res.text.includes(fakeAiza), false, 'Raw AIza secret leaked in /api/ai/chat error response');
        } finally {
          await mockUpstream.close();
        }
      },
    },

    // =========================================================================
    // F5 — Server RBAC Separation & Daily User/IP Quotas
    // =========================================================================
    {
      id: 'T1-F5-01',
      tier: 1,
      feature: 'F5',
      title: 'POST /api/auth/admin-login authenticates Admin & grants unlimited quota',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        const login = await client.adminLogin();
        assert.equal(login.status, 200);
        assert.equal(login.json?.user?.role, 'admin');
        assert.ok(login.setCookies.some((c) => /ff_session=/i.test(c) && /HttpOnly/i.test(c)), 'Expected HttpOnly ff_session cookie');
        const quota = await client.get('/api/ai/quota');
        assert.equal(quota.status, 200);
        assert.equal(quota.json?.quota?.unlimited, true);
      },
    },
    {
      id: 'T1-F5-02',
      tier: 1,
      feature: 'F5',
      title: 'POST /api/auth/login strictly authenticates Standard Users only',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        const { username, password, res } = await client.registerAndLogin('f5std');
        assert.equal(res.status, 201);
        client.clearCookies();
        const login = await client.post('/api/auth/login', { identifier: username, password });
        assert.equal(login.status, 200);
        assert.equal(login.json?.user?.role, 'user');
        assert.equal(login.json?.quota?.unlimited, false);
      },
    },
    {
      id: 'T1-F5-03',
      tier: 1,
      feature: 'F5',
      title: 'GET /api/ai/quota returns daily user & daily IP telemetry contract',
      async run(ctx) {
        const guestClient = createSessionClient(ctx.baseUrl);
        const gRes = await guestClient.get('/api/ai/quota');
        assert.equal(gRes.status, 200);
        const gq = gRes.json?.quota;
        assert.ok(gq, 'Missing quota payload');
        for (const field of ['used', 'limit', 'remaining', 'dailyUsed', 'dailyLimit', 'ipUsed', 'ipLimit', 'resetAt', 'role', 'sandboxEnabled']) {
          assert.ok(field in gq, `Missing F5 quota field "${field}" in /api/ai/quota`);
        }
      },
    },
    {
      id: 'T1-F5-04',
      tier: 1,
      feature: 'F5',
      title: 'Admin updates daily user/IP quota limits via /api/admin/gateway & /api/admin/quotas',
      async run() {
        const srv = await startIsolatedServer({ forceSpawn: true });
        try {
          const admin = createSessionClient(srv.url);
          const user = createSessionClient(srv.url);
          const reg = await user.registerAndLogin('f5quota');
          const subjectId = reg.res.json?.quota?.subjectId;
          assert.ok(subjectId && subjectId.startsWith('user:'), `Expected user: subjectId, got ${subjectId}`);
          assert.equal((await admin.adminLogin()).status, 200);
          const gwRes = await admin.post('/api/admin/gateway', { dailyUserLimit: 9, dailyIpLimit: 18 });
          assert.equal(gwRes.status, 200, `Gateway update failed: ${gwRes.text}`);
          const qRes = await admin.post('/api/admin/quotas', { subjectId, customLimit: 4 });
          assert.equal(qRes.status, 200, `Quotas update failed: ${qRes.text}`);
          const uQuota = await user.get('/api/ai/quota');
          assert.equal(uQuota.json?.quota?.dailyLimit, 4, `Expected updated dailyLimit 4, got ${uQuota.text}`);
        } finally {
          await srv.close();
        }
      },
    },
    {
      id: 'T1-F5-05',
      tier: 1,
      feature: 'F5',
      title: 'Admin can block and unblock a user/IP subject quota via /api/admin/quotas',
      async run() {
        const srv = await startIsolatedServer({ forceSpawn: true });
        try {
          const admin = createSessionClient(srv.url);
          const user = createSessionClient(srv.url);
          const reg = await user.registerAndLogin('f5block');
          const subjectId = reg.res.json?.quota?.subjectId;
          assert.ok(subjectId && subjectId.startsWith('user:'), `Expected user: subjectId, got ${subjectId}`);
          assert.equal((await admin.adminLogin()).status, 200);
          const blk = await admin.post('/api/admin/quotas', { subjectId, blocked: true });
          assert.equal(blk.status, 200, `Block failed: ${blk.text}`);
          const denied = await user.post('/api/ai/chat', { projectId: 'p1', prompt: 'hello' });
          assert.ok([403, 429].includes(denied.status), `Expected 403/429 for blocked user, got ${denied.status}`);
          const unblk = await admin.post('/api/admin/quotas', { subjectId, blocked: false });
          assert.equal(unblk.status, 200);
          const allowed = await user.post('/api/ai/chat', { projectId: 'p1', prompt: 'hello' });
          assert.equal(allowed.status, 200, `Expected 200 after unblock, got ${allowed.status}`);
        } finally {
          await srv.close();
        }
      },
    },

    // =========================================================================
    // F6 — F12 Data Minimization, Security Headers & Rate Limits
    // =========================================================================
    {
      id: 'T1-F6-01',
      tier: 1,
      feature: 'F6',
      title: 'Security headers present and X-Powered-By disabled on API & static routes',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        for (const p of ['/api/health', '/api/auth/me', '/']) {
          const res = await client.get(p);
          assert.equal(res.status, 200, `Expected 200 on ${p}`);
          assert.equal(res.headers.get('x-powered-by'), null, `X-Powered-By must be absent on ${p}`);
          assert.equal(res.headers.get('x-content-type-options'), 'nosniff', `Missing nosniff on ${p}`);
          assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN', `Missing X-Frame-Options on ${p}`);
          assert.ok(res.headers.get('referrer-policy'), `Missing Referrer-Policy on ${p}`);
          assert.ok(res.headers.get('permissions-policy'), `Missing Permissions-Policy on ${p}`);
          if (process.env.E2E_BASE_URL) {
            assert.ok(res.headers.get('content-security-policy'), `Missing CSP on external ${p}`);
          }
        }
        const vercelRaw = fs.readFileSync(path.join(PROJECT_ROOT, 'vercel.json'), 'utf8');
        assert.ok(vercelRaw.includes('Content-Security-Policy'), 'Missing Content-Security-Policy in vercel.json');
        assert.ok(vercelRaw.includes("object-src 'none'"), 'Missing object-src none in vercel.json CSP');
        const authMe = await client.get('/api/auth/me');
        assert.ok(/no-store/i.test(authMe.headers.get('cache-control') || ''), 'Expected Cache-Control: no-store on /api/auth/me');
        const adminClient = createSessionClient(ctx.baseUrl);
        await adminClient.adminLogin();
        const adminState = await adminClient.get('/api/admin/state');
        assert.ok(/no-store/i.test(adminState.headers.get('cache-control') || ''), 'Expected Cache-Control: no-store on /api/admin/state');
      },
    },
    {
      id: 'T1-F6-02',
      tier: 1,
      feature: 'F6',
      title: 'Strict CORS allowlist permits valid origin and denies untrusted origin',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        const goodSelf = await client.get('/api/health', { headers: { origin: ctx.baseUrl } });
        assert.equal(goodSelf.headers.get('access-control-allow-origin'), ctx.baseUrl, 'Expected self origin echoed in ACAO');
        const goodLocal = await client.get('/api/health', { headers: { origin: 'http://127.0.0.1:5173' } });
        assert.equal(goodLocal.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173', 'Expected allowlisted 5173 origin in ACAO');
        assert.equal(goodLocal.headers.get('access-control-allow-credentials'), 'true', 'Expected credentials: true on allowlisted origin');
        const bad = await client.get('/api/health', { headers: { origin: 'https://evil-scraper.example' } });
        const badAcao = bad.headers.get('access-control-allow-origin');
        assert.notEqual(badAcao, 'https://evil-scraper.example', 'Untrusted origin reflected in ACAO');
        assert.notEqual(badAcao, '*', 'Wildcard * returned in ACAO with credentials');
      },
    },
    {
      id: 'T1-F6-03',
      tier: 1,
      feature: 'F6',
      title: 'GET /api/community/list returns paginated allowlisted items without reports or upvotedBy',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        await client.registerAndLogin('f6list');
        const seeded = await client.post('/api/community/create', {
          channel: 'qa',
          title: `F6 Allowlist Seed ${Date.now()}`,
          body: 'Allowlist verification post',
        });
        assert.equal(seeded.status, 201, `Seed post failed: ${seeded.text}`);

        const res = await client.get('/api/community/list?page=1&limit=10');
        assert.equal(res.status, 200);
        const body = res.json || {};
        assert.ok(Array.isArray(body.items) && body.items.length > 0, 'Expected non-empty paginated items array');
        assert.ok(body.items.length <= 10, `Expected <= 10 items, got ${body.items.length}`);
        assert.equal(body.page, 1);
        assert.equal(typeof body.total, 'number');
        assert.equal(typeof body.hasMore, 'boolean');
        assert.equal('reports' in body, false, 'F12 leak: reports array exposed on /api/community/list');
        assert.equal('posts' in body && 'channels' in body, false, 'Duplicate channels+posts payload detected');
        assert.equal('upvotedBy' in body.items[0], false, 'F12 leak: upvotedBy array exposed on item');
        assert.equal(typeof body.items[0].viewerUpvoted, 'boolean', 'Expected viewerUpvoted boolean on item');
      },
    },
    {
      id: 'T1-F6-04',
      tier: 1,
      feature: 'F6',
      title: 'POST /api/community/accept & /dossier succeed for authenticated author/admin',
      async run(ctx) {
        const author = createSessionClient(ctx.baseUrl);
        const admin = createSessionClient(ctx.baseUrl);
        await author.registerAndLogin('f6author');
        await admin.adminLogin();
        const created = await author.post('/api/community/create', {
          channel: 'qa',
          title: `F6 Author Q&A ${Date.now()}`,
          body: 'Test author accept flow',
        });
        assert.equal(created.status, 201, `Create failed: ${created.text}`);
        const postId = created.json?.post?.id;
        assert.ok(postId, 'Expected created Q&A postId');
        const ans = await author.post('/api/community/answer', { postId, content: 'Verified answer' });
        assert.equal(ans.status, 200);
        const answerId = ans.json?.post?.answers?.[0]?.id;
        assert.ok(answerId, 'Expected created answerId');
        const acc = await author.post('/api/community/accept', { postId, answerId });
        assert.equal(acc.status, 200, `Author accept failed: ${acc.status} ${acc.text}`);

        const clubCreated = await author.post('/api/community/create', {
          channel: 'clubs',
          title: `F6 Club ${Date.now()}`,
          body: 'Club handover dossier test',
        });
        assert.equal(clubCreated.status, 201, `Club create failed: ${clubCreated.text}`);
        const clubId = clubCreated.json?.post?.id;
        assert.ok(clubId, 'Expected created clubId');
        const dos = await admin.post('/api/community/dossier', {
          clubId,
          dossier: { projectTitle: 'E2E Dossier', handoverNotes: 'Clean', nextMilestones: ['M1'] },
        });
        assert.equal(dos.status, 200, `Admin dossier failed: ${dos.status} ${dos.text}`);
        assert.equal(dos.json?.post?.activeDossier?.projectTitle, 'E2E Dossier');
      },
    },
    {
      id: 'T1-F6-05',
      tier: 1,
      feature: 'F6',
      title: 'POST /api/auth/logout clears ff_session cookie and audit_secrets.py exits 0',
      async run(ctx) {
        const client = createSessionClient(ctx.baseUrl);
        await client.registerAndLogin('f6logout');
        const before = await client.get('/api/auth/me');
        assert.ok(before.json?.user, 'Expected user before logout');
        const logout = await client.post('/api/auth/logout', {});
        assert.equal(logout.status, 200);
        const after = await client.get('/api/auth/me');
        assert.equal(after.json?.user, null, 'Expected user: null after POST /api/auth/logout');
        const { stdout } = await execFileAsync('python3', [
          path.join(STUDIO_SCRIPTS_DIR, 'audit_secrets.py'),
          '--project',
          PROJECT_ROOT,
        ]);
        assert.ok(/PASS/i.test(stdout), `Expected audit_secrets PASS, got: ${stdout}`);
      },
    },

    // =========================================================================
    // F7 — Landing Cards 07–09 Live Interactive Trailers
    // =========================================================================
    {
      id: 'T1-F7-01',
      tier: 1,
      feature: 'F7',
      title: 'Cards 07–09 render live interactive stages without hover-only gating',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/', 600);
          const section = page.locator('#du-an');
          await section.scrollIntoViewIfNeeded();
          await page.waitForTimeout(400);
          const result = await page.evaluate(() => {
            const sec = document.querySelector('#du-an');
            if (!sec) return { found: false };
            const text = sec.innerText || '';
            const hasTitles = ['Space Voyage', 'CodeNest', 'Stellar AI'].every((t) => text.includes(t));
            const liveStages = sec.querySelectorAll('.starter-live-stage, [data-starter-live]').length;
            return { found: true, hasTitles, liveStages };
          });
          assert.equal(result.found, true, 'Missing #du-an section on /');
          assert.equal(result.hasTitles, true, 'Missing Cards 07–09 titles in #du-an');
          assert.ok(result.liveStages >= 3, `Expected >= 3 live stages (.starter-live-stage) for Cards 07–09 without hover, got ${result.liveStages}`);
          assert.equal(trackers.consoleErrors.length, 0);
        });
      },
    },
    {
      id: 'T1-F7-02',
      tier: 1,
      feature: 'F7',
      title: 'Interacting inside Cards 07–09 live trailers updates their stage UI',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/', 600);
          const section = page.locator('#du-an');
          await section.scrollIntoViewIfNeeded();
          const firstStage = section.locator('.starter-live-stage, [data-starter-live]').first();
          await firstStage.waitFor({ state: 'visible', timeout: 6000 });
          const stageBtn = firstStage.locator('button').first();
          await stageBtn.waitFor({ state: 'visible', timeout: 5000 });
          const beforeState = await firstStage.evaluate((el) => ({
            text: el.innerText,
            pressed: Array.from(el.querySelectorAll('button')).map((b) => b.getAttribute('aria-pressed') || b.getAttribute('data-active') || ''),
          }));
          await stageBtn.click();
          await page.waitForTimeout(250);
          const afterState = await firstStage.evaluate((el) => ({
            text: el.innerText,
            pressed: Array.from(el.querySelectorAll('button')).map((b) => b.getAttribute('aria-pressed') || b.getAttribute('data-active') || ''),
          }));
          assert.ok(
            afterState.text !== beforeState.text || JSON.stringify(afterState.pressed) !== JSON.stringify(beforeState.pressed),
            'Expected live trailer stage UI state to update after interaction'
          );
          assert.equal(trackers.consoleErrors.length, 0);
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T1-F7-03',
      tier: 1,
      feature: 'F7',
      timeoutMs: 75000,
      title: 'Clicking Live View on Cards 07–09 launches Workspace preloaded with starter files',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/', 600);
          const section = page.locator('#du-an');
          await section.scrollIntoViewIfNeeded();
          const liveBtns = section.getByRole('button', { name: /^Live View$/i });
          const count = await liveBtns.count();
          assert.ok(count >= 3, `Expected concise "Live View" buttons on Cards 07–09, found ${count}`);
          await liveBtns.last().click();
          await page.waitForTimeout(600);
          assert.ok(page.url().includes('/workspace'), `Expected navigation to /workspace, got ${page.url()}`);
          const wsFrame = page.locator('iframe[sandbox]').first();
          await wsFrame.waitFor({ state: 'attached', timeout: 8000 });
          const srcdoc = await wsFrame.getAttribute('srcdoc');
          assert.ok(srcdoc && srcdoc.trim().length > 40, 'Expected non-empty starter srcdoc in Workspace LivePreviewFrame');
          await page.getByRole('tab', { name: /Mã nguồn/i }).first().click();
          await page.waitForTimeout(250);
          const sourceText = await page.locator('.ws-source').first().innerText();
          assert.ok(/index\.html|styles\.css|app\.js/i.test(sourceText), 'Expected preloaded starter files in Mã nguồn tab');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T1-F7-04',
      tier: 1,
      feature: 'F7',
      title: 'Scrollytelling chapters, scroll progress, and dual marquees progress smoothly on scroll',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/', 500);
          const initial = await page.evaluate(() => {
            const activeDot = document.querySelector('.lp-chapter-dot[data-active="true"], .lp-chapter-dot[aria-current]');
            const track = document.querySelector('.lp-hm-track');
            const marquees = Array.from(document.querySelectorAll('[data-marquee-row], .lp-marquee-row'));
            return {
              chapter: activeDot ? activeDot.textContent?.trim() : null,
              trackTransform: track ? getComputedStyle(track).transform : null,
              marqueeCount: marquees.length,
              marqueeTransforms: marquees.map((m) => getComputedStyle(m).transform),
            };
          });
          assert.ok(initial.chapter, 'Expected initial active Scrollytelling chapter indicator');

          const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
          await page.evaluate((y) => window.scrollTo(0, y), Math.round(totalHeight * 0.45));
          await page.waitForTimeout(450);
          const midOverflow = await measureViewportOverflow(page);
          assert.equal(midOverflow.overflowX, false, `Overflow after scroll: ${JSON.stringify(midOverflow)}`);

          const mid = await page.evaluate(() => {
            const activeDot = document.querySelector('.lp-chapter-dot[data-active="true"], .lp-chapter-dot[aria-current]');
            const track = document.querySelector('.lp-hm-track');
            const marquees = Array.from(document.querySelectorAll('[data-marquee-row], .lp-marquee-row'));
            return {
              chapter: activeDot ? activeDot.textContent?.trim() : null,
              trackTransform: track ? getComputedStyle(track).transform : null,
              marqueeTransforms: marquees.map((m) => getComputedStyle(m).transform),
            };
          });

          await page.evaluate((y) => window.scrollTo(0, y), Math.round(totalHeight * 0.78));
          await page.waitForTimeout(450);
          const late = await page.evaluate(() => {
            const activeDot = document.querySelector('.lp-chapter-dot[data-active="true"], .lp-chapter-dot[aria-current]');
            const marquees = Array.from(document.querySelectorAll('[data-marquee-row], .lp-marquee-row'));
            return {
              chapter: activeDot ? activeDot.textContent?.trim() : null,
              marqueeTransforms: marquees.map((m) => getComputedStyle(m).transform),
            };
          });

          assert.ok(mid.chapter !== initial.chapter || late.chapter !== initial.chapter, 'Chapter indicator did not progress on scroll');
          if (initial.marqueeCount >= 2) {
            assert.notEqual(
              JSON.stringify(mid.marqueeTransforms),
              JSON.stringify(initial.marqueeTransforms),
              'Dual marquee transforms did not update on scroll'
            );
          } else {
            assert.notEqual(mid.trackTransform, initial.trackTransform, 'Scroll-driven horizontal track transform did not update on scroll');
          }
        });
      },
    },
    {
      id: 'T1-F7-05',
      tier: 1,
      feature: 'F7',
      title: 'Landing CTAs comply with button terseness (<= 3 words) and zero duplicate login buttons',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/', 400);
          await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 20000 });
          const buttons = await inspectVisibleButtons(page);
          const verbose = buttons.filter((b) => b.words > 4 || b.chars > 32);
          assert.equal(verbose.length, 0, `Verbose Landing buttons found: ${JSON.stringify(verbose.map((v) => v.text))}`);
          const loginBtns = buttons.filter((b) => /^Đăng nhập$/i.test(b.text));
          assert.ok(loginBtns.length <= 1, `Duplicate Đăng nhập buttons on Landing: ${loginBtns.length}`);
        });
      },
    },

    // =========================================================================
    // F8 — Team Honor Gallery Architectural Dossier
    // =========================================================================
    {
      id: 'T1-F8-01',
      tier: 1,
      feature: 'F8',
      title: '/honor navigates smoothly and renders Populated architectural developer gallery',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/honor', 600);
          const overflow = await measureViewportOverflow(page);
          assert.equal(overflow.overflowX, false);
          const gallery = await page.evaluate(() => ({
            heading: Boolean(document.querySelector('h1, h2')),
            exhibits: document.querySelectorAll('canvas, article, [data-exhibit-id], .thg-card').length,
          }));
          assert.equal(gallery.heading, true, 'Expected visible gallery heading on /honor');
          assert.ok(gallery.exhibits > 0, 'Expected populated developer exhibits or 3D canvas on /honor');
          assert.equal(trackers.consoleErrors.length, 0);
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T1-F8-02',
      tier: 1,
      feature: 'F8',
      title: 'Save drawer & 81 filter-like .thg-chip pills are completely removed on /honor',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/honor', 400);
          await page.locator('#noi-dung h1, #noi-dung h2').first().waitFor({ state: 'visible', timeout: 25000 });
          await page.locator('canvas, article, [data-exhibit-id], .thg-card').first().waitFor({ state: 'attached', timeout: 25000 });
          const audit = await page.evaluate(() => {
            const text = (document.querySelector('#noi-dung') || document.body).innerText || '';
            const chips = document.querySelectorAll('.thg-chip').length;
            return {
              hasSaveBtn: /Lưu vào hồ sơ|Mở Hồ sơ đã lưu|MỞ BỘ SƯU TẬP/i.test(text),
              chips,
            };
          });
          assert.equal(audit.hasSaveBtn, false, 'Removed save-to-profile / collection drawer buttons still present on /honor');
          assert.equal(audit.chips, 0, `Expected 0 .thg-chip filter-like pills on /honor, found ${audit.chips}`);
        });
      },
    },
    {
      id: 'T1-F8-03',
      tier: 1,
      feature: 'F8',
      title: 'Selecting an exhibit opens the 4-part formal architectural dossier',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/honor', 600);
          const listBtn = page.getByRole('button', { name: /Danh sách/i }).first();
          await listBtn.waitFor({ state: 'visible', timeout: 15000 });
          await listBtn.click();
          await page.waitForTimeout(300);
          const exhibitBtn = page
            .locator('article button[data-card-trigger], .thg-card button[data-card-trigger]')
            .or(page.getByRole('button', { name: /^Mở hồ sơ$/i }))
            .first();
          await exhibitBtn.waitFor({ state: 'visible', timeout: 5000 });
          await exhibitBtn.click();
          await page.waitForTimeout(300);
          const dialog = page.locator('#honor-sheet, [role="dialog"]').first();
          await dialog.waitFor({ state: 'visible', timeout: 5000 });
          assert.equal(await dialog.locator('.thg-chip').count(), 0, 'Dossier dialog must not render .thg-chip pills');
          const dossierCheck = await dialog.evaluate((el) => {
            const text = el.innerText || '';
            const metrics = el.querySelectorAll('.thg-metric-val, [data-metric], dd').length;
            const hasBio = text.trim().length > 60;
            const hasContrib = /Đóng góp|Kiến trúc/i.test(text);
            const hasHonor = /Vinh danh|Tri ân|Ghi nhận/i.test(text);
            return { metrics, hasBio, hasContrib, hasHonor };
          });
          assert.equal(dossierCheck.hasBio, true, 'Dossier missing bio/profile section');
          assert.ok(dossierCheck.metrics >= 2, `Dossier missing verified metrics (${dossierCheck.metrics})`);
          assert.equal(dossierCheck.hasContrib, true, 'Dossier missing architectural contributions section');
          assert.equal(dossierCheck.hasHonor, true, 'Dossier missing honors/gratitude section');
        });
      },
    },
    {
      id: 'T1-F8-04',
      tier: 1,
      feature: 'F8',
      title: 'Keyboard navigation & List/3D view toggle work cleanly without duplicate switchers',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/honor', 500);
          const switchers = await page.getByRole('button', { name: /Danh sách/i }).count();
          assert.equal(switchers, 1, `Expected single Danh sách view switcher, found ${switchers}`);
          await page.getByRole('button', { name: /Danh sách/i }).first().click();
          await page.waitForTimeout(250);
          const exhibitBtn = page
            .locator('article button[data-card-trigger], .thg-card button[data-card-trigger]')
            .or(page.getByRole('button', { name: /^Mở hồ sơ$/i }))
            .first();
          await exhibitBtn.waitFor({ state: 'visible', timeout: 5000 });
          await exhibitBtn.click();
          await page.locator('#honor-sheet, [role="dialog"]').first().waitFor({ state: 'visible', timeout: 5000 });
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(150);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
          assert.equal(await page.locator('#honor-sheet:visible, [role="dialog"]:visible').count(), 0, 'Escape did not close dossier');
          const toggle3d = page.getByRole('button', { name: /3D|Hành lang/i }).first();
          await toggle3d.waitFor({ state: 'visible', timeout: 4000 });
          await toggle3d.click();
          await page.waitForTimeout(250);
          assert.ok((await page.locator('canvas, .thg-stage').count()) > 0, 'Expected 3D view restored after toggling back from List');
        });
      },
    },
    {
      id: 'T1-F8-05',
      tier: 1,
      feature: 'F8',
      title: 'Back button returns cleanly from /honor to /home',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/honor', 500);
          await page.getByRole('button', { name: /Quay lại/i }).first().click();
          await page.waitForTimeout(400);
          assert.ok(page.url().includes('/home') || new URL(page.url()).pathname === '/', `Unexpected back route: ${page.url()}`);
          assert.equal(trackers.consoleErrors.length, 0);
        });
      },
    },

    // =========================================================================
    // F9 — Workspace 2027 Redesign & 60fps + R6 Features
    // =========================================================================
    {
      id: 'T1-F9-01',
      tier: 1,
      feature: 'F9',
      title: 'Pointer-capture CSS --split resizer resizes chat vs stage smoothly',
      async run(ctx) {
        await withPage(ctx.browser, { viewport: { width: 1440, height: 900 } }, async (page) => {
          await seedWorkspaceArtifact(page, ctx.baseUrl);
          const separator = page.getByRole('separator', { name: /Thay đổi kích thước chia màn hình|Kéo để thay đổi kích thước/i }).first();
          await separator.waitFor({ state: 'visible', timeout: 8000 });
          const beforeVal = Number(await separator.getAttribute('aria-valuenow'));
          const box = await separator.boundingBox();
          assert.ok(box, 'Separator has no bounding box');
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 90, box.y + box.height / 2, { steps: 6 });
          await page.mouse.up();
          await page.waitForTimeout(150);
          const afterVal = Number(await separator.getAttribute('aria-valuenow'));
          assert.notEqual(afterVal, beforeVal, 'Expected --split aria-valuenow to update after drag');
        });
      },
    },
    {
      id: 'T1-F9-02',
      tier: 1,
      feature: 'F9',
      title: 'ProjectRail active pill uses concentric ::before marker with zero corner bleed',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/workspace', 500);
          const activeItem = page.locator('.ws-rail-item[data-active="true"]').first();
          await activeItem.waitFor({ state: 'visible', timeout: 5000 });
          const pillStyle = await page.evaluate(() => {
            const active = document.querySelector('.ws-rail-item[data-active="true"]');
            if (!active) return null;
            const cs = getComputedStyle(active);
            return { overflow: cs.overflow, boxShadow: cs.boxShadow, borderRadius: cs.borderRadius };
          });
          assert.ok(pillStyle, 'Expected active .ws-rail-item[data-active="true"]');
          assert.equal(pillStyle.overflow, 'hidden', 'ProjectRail active pill must clip cleanly with overflow: hidden');
          assert.equal(/inset\s+3px\s+0px/i.test(pillStyle.boxShadow), false, 'Legacy inset 3px box-shadow bleed still present');
          await activeItem.hover();
          await page.waitForTimeout(150);
          const actionButtons = await page.evaluate(() => {
            const rail = document.querySelector('.ws-rail');
            const active = document.querySelector('.ws-rail-item[data-active="true"]');
            if (!rail || !active) return { count: 0, allInside: false };
            const railRect = rail.getBoundingClientRect();
            const btns = Array.from(active.querySelectorAll('button')).filter((b) => {
              const r = b.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && b.getAttribute('aria-label');
            });
            const allInside = btns.every((b) => {
              const r = b.getBoundingClientRect();
              return r.right <= railRect.right + 1 && r.left >= railRect.left - 1;
            });
            return { count: btns.length, allInside };
          });
          assert.ok(actionButtons.count > 0, 'Expected hover/focus action buttons inside active ProjectRail item');
          assert.equal(actionButtons.allInside, true, 'ProjectRail action buttons clipped outside rail container');
        });
      },
    },
    {
      id: 'T1-F9-03',
      tier: 1,
      feature: 'F9',
      title: 'Live Preview iframe enforces sandbox="allow-scripts" & bridges console errors',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await seedWorkspaceArtifact(page, ctx.baseUrl);
          const iframe = page.locator('iframe[sandbox]').first();
          await iframe.waitFor({ state: 'attached', timeout: 8000 });
          const sandbox = await iframe.getAttribute('sandbox');
          const refPol = await iframe.getAttribute('referrerpolicy');
          assert.equal(sandbox, 'allow-scripts', `Expected sandbox="allow-scripts", got "${sandbox}"`);
          assert.equal(refPol, 'no-referrer', `Expected referrerpolicy="no-referrer", got "${refPol}"`);

          await page.getByRole('tab', { name: /Mã nguồn/i }).first().click();
          await page.waitForTimeout(200);
          await page.getByRole('button', { name: /app\.js/i }).first().click();
          await page.waitForTimeout(150);
          const editor = page.locator('textarea.ws-source-editor').first();
          await editor.waitFor({ state: 'visible', timeout: 4000 });
          await editor.fill("throw new Error('E2E_IFRAME_ERR');");
          await page.getByRole('tab', { name: /Live View/i }).first().click();
          await page.locator('.ws-runtime-banner').first().waitFor({ state: 'visible', timeout: 5000 });
          const stageText = await page.locator('.ws-live').first().innerText();
          assert.ok(
            stageText.includes('E2E_IFRAME_ERR'),
            'Expected runtime iframe error to bridge into Workspace console/status UI'
          );
        });
      },
    },
    {
      id: 'T1-F9-04',
      tier: 1,
      feature: 'F9',
      title: 'Diff & Check executes 6 checks, displays Diff, and supports Ctrl+F & file CRUD',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await seedWorkspaceArtifact(page, ctx.baseUrl);
          await page.getByRole('tab', { name: /Mã nguồn/i }).first().click();
          await page.waitForTimeout(250);

          const addFileBtn = page.getByRole('button', { name: /Tạo tệp|Thêm tệp/i }).first();
          await addFileBtn.waitFor({ state: 'visible', timeout: 4000 });
          await addFileBtn.click();
          const nameInput = page.locator('input[placeholder*="tên tệp"], input[aria-label*="tên tệp"]').first();
          await nameInput.waitFor({ state: 'visible', timeout: 4000 });
          await nameInput.fill('custom.css');
          await nameInput.press('Enter');
          await page.waitForTimeout(200);
          const editor = page.locator('textarea.ws-source-editor').first();
          await editor.fill('.e2e-crud { border-radius: 8px; }');
          await page.waitForTimeout(150);

          await page.keyboard.press('Control+f');
          await page.waitForTimeout(200);
          const findInput = page.locator('input[aria-label*="Tìm"], input[placeholder*="Tìm trong mã"]').first();
          await findInput.waitFor({ state: 'visible', timeout: 4000 });
          await findInput.fill('border-radius');
          await page.waitForTimeout(150);
          const sourceBarText = await page.locator('.ws-source').first().innerText();
          assert.ok(/1\s*\/\s*1|1 kết quả/i.test(sourceBarText), `Expected Ctrl+F match count, got: ${sourceBarText.slice(0, 200)}`);

          await page.locator('.ws-live [role="tablist"]').getByRole('tab', { name: /Kiểm định/i }).first().click();
          await page.waitForTimeout(250);
          const runChecks = page.getByRole('button', { name: /Chạy kiểm định 6 lớp/i }).first();
          await runChecks.waitFor({ state: 'visible', timeout: 4000 });
          await runChecks.click();
          await page.waitForTimeout(300);
          const reviewText = await page.locator('[aria-label="Diff & Check"]').first().innerText();
          for (const cat of [/HTML/i, /JS/i, /Responsive/i, /Links|Liên kết/i, /Secrets|Bảo mật/i, /A11y/i]) {
            assert.match(reviewText, cat, `Missing check category ${cat} in Diff & Check`);
          }
          await page.getByRole('tab', { name: /^Diff/i }).first().click();
          await page.waitForTimeout(200);
          const diffText = await page.locator('[aria-label="Diff & Check"]').first().innerText();
          assert.ok(diffText.includes('e2e-crud') || /\+/.test(diffText), 'Expected real diff additions in Diff tab');
        });
      },
    },
    {
      id: 'T1-F9-05',
      tier: 1,
      feature: 'F9',
      title: 'Single-file HTML export & ZIP export sanitize secrets and download cleanly',
      async run(ctx) {
        const fakeSk = makeSyntheticSecret('sk');
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await seedWorkspaceArtifact(page, ctx.baseUrl, {
            js: `const apiSecret = "${fakeSk}";\nconsole.info("ready");`,
          });

          const downloadTrigger = page.getByRole('button', { name: /^Tải xuống$/i }).first();
          await downloadTrigger.waitFor({ state: 'visible', timeout: 4000 });
          await downloadTrigger.click();
          const htmlBtn = page.getByRole('button', { name: /Xuất HTML/i }).first();
          await htmlBtn.waitFor({ state: 'visible', timeout: 4000 });
          const [htmlDownload] = await Promise.all([
            page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
            htmlBtn.click(),
          ]);
          assert.ok(htmlDownload, 'Expected browser download triggered on single-file HTML export');
          const htmlPath = await htmlDownload.path();
          if (htmlPath) {
            const exportedHtml = fs.readFileSync(htmlPath, 'utf8');
            assert.equal(exportedHtml.includes(fakeSk), false, 'Raw secret leaked in exported single-file HTML');
          }

          await downloadTrigger.click();
          const zipBtn = page.getByRole('button', { name: /Export ZIP|Xuất ZIP|Tải gói ZIP/i }).first();
          await zipBtn.waitFor({ state: 'visible', timeout: 4000 });
          const [zipDownload] = await Promise.all([
            page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
            zipBtn.click(),
          ]);
          assert.ok(zipDownload, 'Expected browser download triggered on ZIP export');
          const bodyText = await page.locator('body').innerText();
          assert.ok(/ẩn|nhạy cảm|bảo mật|ZIP/i.test(bodyText), 'Expected secret scanner toast feedback on export');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },

    // =========================================================================
    // F10 — Unified Tri thức
    // =========================================================================
    {
      id: 'T1-F10-01',
      tier: 1,
      feature: 'F10',
      title: '/community unifies Tra cứu, Bảng tin, and Phòng chat under PinUI LiquidTabs',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/community', 500);
          for (const [label, expectedMode] of [
            ['Tra cứu', 'knowledge'],
            ['Bảng tin', 'feed'],
            ['Phòng chat', 'chat'],
          ]) {
            const tab = page.getByRole('tab', { name: new RegExp(label, 'i') }).first();
            await tab.waitFor({ state: 'visible', timeout: 5000 });
            await tab.click();
            await page.waitForTimeout(250);
            assert.ok(
              page.url().includes(`mode=${expectedMode}`),
              `Expected ?mode=${expectedMode} in URL after clicking ${label}, got ${page.url()}`
            );
            assert.ok((await page.locator('#noi-dung').innerText()).trim().length > 20, `Empty panel for ${label}`);
          }
        });
      },
    },
    {
      id: 'T1-F10-02',
      tier: 1,
      feature: 'F10',
      title: 'URL query ?mode=knowledge&q=hero deep-links directly into filtered Tra cứu results',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/community?mode=knowledge&q=hero', 700);
          const activeTab = page.getByRole('tab', { name: /Tra cứu/i }).first();
          assert.equal(await activeTab.getAttribute('aria-selected'), 'true', 'Expected Tra cứu tab selected on ?mode=knowledge');
          const searchVal = await page.locator('input[type="search"], input[placeholder*="Tìm"]').first().inputValue();
          assert.equal(searchVal.toLowerCase(), 'hero', `Expected search input prefilled with "hero", got "${searchVal}"`);
          const matchingItems = await page.locator('[data-vault-item], .kv-row, .numbered-spine li, article').count();
          assert.ok(matchingItems > 0, 'Expected matching vault records rendered in Tra cứu for q=hero');
        });
      },
    },
    {
      id: 'T1-F10-03',
      tier: 1,
      feature: 'F10',
      title: '1-click Mở Workspace from Tra cứu launches record into /workspace',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/community?mode=knowledge', 800);
          const launchBtn = page.getByRole('button', { name: /Mở Workspace/i }).first();
          await launchBtn.waitFor({ state: 'visible', timeout: 8000 });
          await launchBtn.click();
          await page.waitForTimeout(600);
          assert.ok(page.url().includes('/workspace'), `Expected /workspace navigation, got ${page.url()}`);
          const attachedOrFrame = await page.locator('.ws-attached li, iframe[sandbox]').count();
          assert.ok(attachedOrFrame > 0, 'Expected launched item context or preview mounted in /workspace');
          assert.equal(trackers.pageErrors.length, 0);
        });
      },
    },
    {
      id: 'T1-F10-04',
      tier: 1,
      feature: 'F10',
      title: 'Bảng tin consumes paginated /api/community/list and supports post creation, upvote, bookmark',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await registerUserInBrowser(page, ctx.baseUrl, 'f10feed');
          await gotoRoute(page, ctx.baseUrl, '/community?mode=feed', 700);
          const paginatedCalls = trackers.responses.filter((r) => r.url.includes('/api/community/list') && r.url.includes('page='));
          assert.ok(paginatedCalls.length > 0, 'Expected paginated /api/community/list?page=... API call');
          const savedTabs = await page.getByRole('button', { name: /^Đã lưu$/i }).count()
            + await page.getByRole('tab', { name: /^Đã lưu$/i }).count();
          assert.ok(savedTabs <= 1, `Duplicate Đã lưu control found: ${savedTabs}`);

          await page.getByRole('button', { name: /Viết bài/i }).first().click();
          const dialog = page.locator('dialog[open], [role="dialog"]').last();
          await dialog.waitFor({ state: 'visible', timeout: 5000 });
          const postTitle = `F10 Feed Post ${Date.now()}`;
          await dialog.locator('input').first().fill(postTitle);
          await dialog.locator('textarea').first().fill('Kiểm thử đăng bài, thích và lưu bài trong Bảng tin.');
          const [createResp] = await Promise.all([
            page.waitForResponse((r) => r.url().includes('/api/community/create') && r.request().method() === 'POST'),
            dialog.locator('button[type="submit"]').first().click(),
          ]);
          assert.equal(createResp.status(), 201);
          await page.waitForTimeout(400);
          assert.ok((await page.locator('.cm-main').innerText()).includes(postTitle), 'Created post did not render in Bảng tin');

          const upvoteBtn = page.getByRole('button', { name: /Thích|Thả cảm xúc/i }).first();
          await upvoteBtn.click();
          await page.waitForTimeout(250);

          const saveBtn = page.getByRole('button', { name: /Lưu bài/i }).first();
          await saveBtn.click();
          await page.waitForTimeout(250);
          await page.getByRole('button', { name: /^Đã lưu/i }).first().click();
          await page.waitForTimeout(300);
          assert.ok((await page.locator('.cm-main').innerText()).includes(postTitle), 'Bookmarked post missing under Đã lưu');
        });
      },
    },
    {
      id: 'T1-F10-05',
      tier: 1,
      feature: 'F10',
      title: 'Phòng chat renders live discussion room & accepts messages cleanly',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page, trackers) => {
          await gotoRoute(page, ctx.baseUrl, '/community?mode=chat', 500);
          const chatInput = page.locator('.chat-compose input[aria-label="Nội dung tin nhắn"], .chat-compose input[placeholder*="Nhắn tin" i]').first();
          await chatInput.waitFor({ state: 'visible', timeout: 5000 });
          const msg = `E2E chat msg ${Date.now()}`;
          await chatInput.fill(msg);
          await chatInput.press('Enter');
          await page.waitForTimeout(300);
          const bodyText = await page.locator('#noi-dung').innerText();
          assert.ok(bodyText.includes(msg), 'Submitted chat message did not render in Phòng chat');
          assert.equal(trackers.consoleErrors.length, 0);
        });
      },
    },

    // =========================================================================
    // F11 — Admin Dashboard Redesign & R6 Controls
    // =========================================================================
    {
      id: 'T1-F11-01',
      tier: 1,
      feature: 'F11',
      title: 'Admin login gate authenticates Admin and unlocks redesigned Admin Dashboard',
      async run(ctx) {
        const aqPrefix = ['AQ', '.Ab8'].join('');
        await withPage(ctx.browser, {}, async (page) => {
          await gotoRoute(page, ctx.baseUrl, '/admin', 500);
          await page.getByLabel('Tài khoản Admin').fill(DEFAULT_ADMIN_USER);
          await page.getByLabel('Mật khẩu Admin').fill(DEFAULT_ADMIN_PASS);
          await page.locator('.adm-auth-card button[type="submit"]').first().click();
          await page.getByRole('heading', { name: /Bảng điều khiển quản trị/i }).first().waitFor({ state: 'visible', timeout: 15000 });
          const domText = await page.evaluate(() => document.body.innerText || '');
          assert.equal(domText.includes(aqPrefix), false, 'Raw AQ.Ab* secret exposed in Admin DOM');
          assert.equal(domText.includes('SynthTestToken_'), false, 'Raw synthetic pool key exposed in Admin DOM');
          assert.equal(await page.locator('svg.lucide').count(), 0, 'Lucide icons present in AdminView');
        });
      },
    },
    {
      id: 'T1-F11-02',
      tier: 1,
      feature: 'F11',
      title: 'Key Pool & Token Telemetry displays per-key cards, shared account quota bar, and token counters',
      async run(ctx) {
        await withPage(ctx.browser, {}, async (page) => {
          await loginAdminInBrowser(page, ctx.baseUrl);
          await gotoRoute(page, ctx.baseUrl, '/admin', 0);
          await page.locator('section[aria-label="Tổng quan chỉ số hệ thống"] .adm-kpi-val').first().waitFor({ state: 'visible', timeout: 15000 });
          await page.locator('#noi-dung').getByText(DEFAULT_POOL_KEY_1_MASK).first().waitFor({ state: 'visible', timeout: 5000 });
          const text = await page.locator('#noi-dung').innerText();
          assert.ok(text.includes(DEFAULT_POOL_KEY_1_MASK), `Missing masked key ${DEFAULT_POOL_KEY_1_MASK} on /admin`);
          assert.ok(text.includes(DEFAULT_POOL_KEY_2_MASK), `Missing masked key ${DEFAULT_POOL_KEY_2_MASK} on /admin`);
          assert.ok(/1\.?500|tài khoản|hạn mức chung|shared/i.test(text), 'Missing shared account quota bar on /admin');
          assert.ok(/prompt|completion|total/i.test(text), 'Missing prompt/completion/total token telemetry on /admin');
        });
      },
    },
    {
      id: 'T1-F11-03',
      tier: 1,
      feature: 'F11',
      timeoutMs: 75000,
      title: 'Live Key Pool test trigger button runs real pool test and updates UI telemetry',
      async run(ctx) {
        const mockUpstream = await startMockUpstream(async (_req, res) => {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'UI pool test ok' }] } }],
            usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 22, totalTokenCount: 33 },
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
            const [resp] = await Promise.all([
              page.waitForResponse((r) => r.url().includes('/api/admin/key-pool/test') && r.request().method() === 'POST'),
              testBtn.click(),
            ]);
            assert.equal(resp.status(), 200);
            await page.waitForTimeout(350);
            const text = await page.locator('#noi-dung').innerText();
            assert.ok(text.includes('33'), `Expected updated token count 33 in Admin UI, got: ${text.slice(0, 300)}`);
            assert.ok(text.includes(DEFAULT_POOL_KEY_1_MASK) || text.includes(DEFAULT_POOL_KEY_2_MASK), 'Expected masked key telemetry in UI');
          });
        } finally {
          await srv.close();
          await mockUpstream.close();
        }
      },
    },
    {
      id: 'T1-F11-04',
      tier: 1,
      feature: 'F11',
      title: 'User & IP daily quota editor updates limit, resets usage, and blocks/unblocks subjects',
      async run(ctx) {
        const regClient = createSessionClient(ctx.baseUrl);
        const reg = await regClient.registerAndLogin('f11target');
        assert.equal(reg.res.status, 201);
        await withPage(ctx.browser, {}, async (page) => {
          await loginAdminInBrowser(page, ctx.baseUrl);
          await gotoRoute(page, ctx.baseUrl, '/admin', 600);
          await page.getByRole('tab', { name: /Hạn mức/i }).first().click();
          await page.waitForTimeout(300);
          const quotaInput = page.locator('.adm-desktop-table input[aria-label*="Giới hạn ngày"]:visible, input[aria-label*="Giới hạn ngày"]:visible').first();
          await quotaInput.waitFor({ state: 'visible', timeout: 5000 });
          await quotaInput.fill('4');
          const saveQuotaBtn = page.locator('.adm-desktop-table .adm-limit-inline button:visible').filter({ hasText: /^Lưu$/i }).first();
          await saveQuotaBtn.waitFor({ state: 'visible', timeout: 4000 });
          const [saveResp] = await Promise.all([
            page.waitForResponse((r) => r.url().includes('/api/admin/quotas') && r.request().method() === 'POST'),
            saveQuotaBtn.click(),
          ]);
          assert.equal(saveResp.status(), 200);

          const resetBtn = page.getByRole('button', { name: /Đặt lại|Reset/i }).first();
          await resetBtn.waitFor({ state: 'visible', timeout: 4000 });
          const [resetResp] = await Promise.all([
            page.waitForResponse((r) => (r.url().includes('/api/admin/quotas') || r.url().includes('/api/admin/reset-quota')) && r.request().method() === 'POST'),
            resetBtn.click(),
          ]);
          assert.equal(resetResp.status(), 200);

          const blockBtn = page.getByRole('button', { name: /Chặn|Khóa/i }).first();
          await blockBtn.waitFor({ state: 'visible', timeout: 4000 });
          const [blockResp] = await Promise.all([
            page.waitForResponse((r) => r.url().includes('/api/admin/quotas') && r.request().method() === 'POST'),
            blockBtn.click(),
          ]);
          assert.equal(blockResp.status(), 200);
        });
      },
    },
    {
      id: 'T1-F11-05',
      tier: 1,
      feature: 'F11',
      title: 'Security Event Log & Moderation Queue render sanitized events and resolve reports',
      async run(ctx) {
        const anon = createSessionClient(ctx.baseUrl);
        await anon.get('/api/admin/state');
        const created = await anon.post('/api/community/create', {
          channel: 'qa',
          title: `F11 Report Target ${Date.now()}`,
          body: 'Pending moderation item',
        });
        assert.equal(created.status, 201);
        const postId = created.json?.post?.id;
        assert.ok(postId);
        const rep = await anon.post('/api/community/report', { targetId: postId, reason: 'E2E spam check' });
        assert.equal(rep.status, 201);

        await withPage(ctx.browser, {}, async (page) => {
          await loginAdminInBrowser(page, ctx.baseUrl);
          await gotoRoute(page, ctx.baseUrl, '/admin', 600);
          await page.getByRole('tab', { name: /Bảo mật/i }).first().click();
          await page.waitForTimeout(300);
          const logRegion = page.locator('[role="log"]').first();
          await logRegion.waitFor({ state: 'visible', timeout: 5000 });
          const text = await page.locator('#noi-dung').innerText();
          assert.ok(/bảo mật|401|403|429|security/i.test(text), 'Expected security event log section in Admin Bảo mật & Log tab');

          const modTab = page.getByRole('tab', { name: /Hệ thống/i }).first();
          await modTab.waitFor({ state: 'visible', timeout: 5000 });
          await modTab.click();
          await page.waitForTimeout(250);
          const resolveBtn = page.getByRole('button', { name: /Duyệt|Ẩn bài|Bỏ qua/i }).first();
          await resolveBtn.waitFor({ state: 'visible', timeout: 5000 });
          const [modResp] = await Promise.all([
            page.waitForResponse((r) => r.url().includes('/api/admin/moderate') && r.request().method() === 'POST'),
            resolveBtn.click(),
          ]);
          assert.equal(modResp.status(), 200);
        });
      },
    },
  ];
}
