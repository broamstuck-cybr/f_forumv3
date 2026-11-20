import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);

function loadPlaywright() {
  try {
    return require('playwright-core');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    return require(path.join(globalRoot, 'playwright-core'));
  }
}

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.slice(2).split('=');
      return [k, v ?? 'true'];
    })
);
const positional = args.filter((a) => !a.startsWith('--'));
const routes = (positional[0] || '/').split(',');
const widths = (flags.w || '1440').split(',').map(Number);
const scrolls = (flags.scroll || '0').split(',');
const outDir = flags.out || '/tmp/ff-qa';
const base = flags.base || 'http://localhost:5173';
const theme = flags.theme || '';
const wait = Number(flags.wait || 900);
const full = flags.full === 'true';
const reduced = flags.reduced === 'true';
const tag = flags.tag ? `-${flags.tag}` : '';
const clickSel = flags.click || '';

mkdirSync(outDir, { recursive: true });

const { chromium } = loadPlaywright();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-gpu'],
});

let failures = 0;

for (const width of widths) {
  const height = Number(flags.h || (width < 500 ? 844 : width < 900 ? 1024 : 900));
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    hasTouch: width < 900,
  });
  if (theme) {
    await context.addInitScript((t) => {
      try {
        const raw = window.localStorage.getItem('fforum_v3_settings');
        const parsed = raw ? JSON.parse(raw) : {};
        parsed.theme = t;
        window.localStorage.setItem('fforum_v3_settings', JSON.stringify(parsed));
        window.localStorage.setItem('fforum_theme', t);
      } catch (err) {
        void err;
      }
    }, theme);
  }
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text().slice(0, 240));
    });
    page.on('pageerror', (err) => errors.push(`pageerror: ${String(err).slice(0, 240)}`));
    await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(wait);
    if (clickSel) {
      await page.click(clickSel).catch((err) => errors.push(`click failed: ${String(err).slice(0, 120)}`));
      await page.waitForTimeout(500);
    }
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
    }));
    const name = (route === '/' ? 'landing' : route.replace(/^\//, '').replace(/[/?=&]/g, '_')) + tag;
    for (const s of scrolls) {
      const maxY = Math.max(0, metrics.scrollHeight - metrics.innerHeight);
      const y = s.endsWith('%') ? Math.round((maxY * Number(s.slice(0, -1))) / 100) : Number(s);
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
      await page.waitForTimeout(s === '0' ? 100 : 650);
      const file = path.join(outDir, `${name}-${width}${theme ? `-${theme}` : ''}-y${s.replace('%', 'p')}.png`);
      await page.screenshot({ path: file, fullPage: full && s === '0' });
      console.log(`shot ${file}`);
    }
    const overflow = metrics.scrollWidth > metrics.innerWidth + 1;
    if (overflow) failures += 1;
    if (errors.length) failures += 1;
    console.log(
      `${route} @${width} height=${metrics.scrollHeight} overflowX=${overflow ? `YES(${metrics.scrollWidth})` : 'no'} consoleErrors=${errors.length}`
    );
    errors.slice(0, 6).forEach((e) => console.log(`  ! ${e}`));
    await page.close();
  }
  await context.close();
}

await browser.close();
process.exit(failures && flags.strict === 'true' ? 1 : 0);
