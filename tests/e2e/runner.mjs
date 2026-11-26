#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  closeAllActiveContexts,
  closeAllIsolatedServers,
  closeAllMockUpstreams,
  launchBrowser,
  startIsolatedServer,
} from './harness.mjs';
import { getTier1Tests } from './tier1.mjs';
import { getTier2Tests } from './tier2.mjs';
import { getTier3Tests } from './tier3.mjs';
import { getTier4Tests } from './tier4.mjs';

const DEFAULT_TEST_TIMEOUT_MS = 60000;
const ENV_TEST_TIMEOUT_MS = process.env.E2E_TEST_TIMEOUT_MS
  ? Number(process.env.E2E_TEST_TIMEOUT_MS)
  : 0;

function parseArgs(argv) {
  const opts = { list: false, tier: 'all', filter: '', jsonFile: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--list') {
      opts.list = true;
    } else if (arg === '--tier' && argv[i + 1]) {
      opts.tier = argv[i + 1];
      i += 1;
    } else if (arg === '--filter' && argv[i + 1]) {
      opts.filter = argv[i + 1];
      i += 1;
    } else if (arg === '--json' && argv[i + 1]) {
      opts.jsonFile = argv[i + 1];
      i += 1;
    }
  }
  return opts;
}

function summarizeCounts(allTests) {
  const byTier = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const byFeature = {};
  for (const t of allTests) {
    byTier[t.tier] = (byTier[t.tier] || 0) + 1;
    byFeature[t.feature] = (byFeature[t.feature] || 0) + 1;
  }
  return { byTier, byFeature, total: allTests.length };
}

function validateMinimumThresholds(counts) {
  const errors = [];
  if (counts.byTier[1] < 55) errors.push(`Tier 1 count ${counts.byTier[1]} < 55`);
  if (counts.byTier[2] < 55) errors.push(`Tier 2 count ${counts.byTier[2]} < 55`);
  if (counts.byTier[3] < 11) errors.push(`Tier 3 count ${counts.byTier[3]} < 11`);
  if (counts.byTier[4] < 6) errors.push(`Tier 4 count ${counts.byTier[4]} < 6`);
  if (counts.total < 127) errors.push(`Total count ${counts.total} < 127`);
  return errors;
}

async function runWithTimeout(testCase, ctx, timeoutMs) {
  let timer;
  const runPromise = Promise.resolve().then(() => testCase.run(ctx));
  // Prevent UnhandledPromiseRejection if teardown kills a resource used by the timed-out test.
  runPromise.catch(() => {});
  try {
    await Promise.race([
      runPromise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Test timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const allTests = [
    ...getTier1Tests(),
    ...getTier2Tests(),
    ...getTier3Tests(),
    ...getTier4Tests(),
  ];

  const counts = summarizeCounts(allTests);
  const thresholdErrors = validateMinimumThresholds(counts);

  if (opts.list) {
    console.log('=== F-FORUM v3 E2E Suite Inventory ===');
    console.log(`Tier 1 (Feature Coverage): ${counts.byTier[1]} (min 55)`);
    console.log(`Tier 2 (Boundary & Edge):  ${counts.byTier[2]} (min 55)`);
    console.log(`Tier 3 (Cross-Feature):    ${counts.byTier[3]} (min 11)`);
    console.log(`Tier 4 (Real-World E2E):   ${counts.byTier[4]} (min 6)`);
    console.log(`Total Test Cases:          ${counts.total} (min 127)`);
    console.log('\nBy Feature / Group:');
    for (const [feat, cnt] of Object.entries(counts.byFeature)) {
      console.log(`  - ${feat}: ${cnt}`);
    }
    console.log('\nTest Cases:');
    for (const t of allTests) {
      console.log(`  [${t.id}] (T${t.tier}/${t.feature}) ${t.title}`);
    }
    if (thresholdErrors.length > 0) {
      console.error('\nThreshold validation FAILED:', thresholdErrors.join('; '));
      process.exit(1);
    }
    process.exit(0);
  }

  if (thresholdErrors.length > 0) {
    console.error('Suite threshold validation FAILED:', thresholdErrors.join('; '));
    process.exit(1);
  }

  let selected = allTests;
  if (opts.tier !== 'all') {
    const tierNum = Number(opts.tier);
    if (![1, 2, 3, 4].includes(tierNum)) {
      console.error(`Invalid --tier "${opts.tier}". Expected 1, 2, 3, 4, or all.`);
      process.exit(2);
    }
    selected = selected.filter((t) => t.tier === tierNum);
  }
  if (opts.filter) {
    const q = opts.filter.toLowerCase();
    selected = selected.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.feature.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q)
    );
  }

  if (selected.length === 0) {
    console.error(`No tests matched (--tier ${opts.tier}, --filter "${opts.filter}").`);
    process.exit(1);
  }

  console.log(`Running ${selected.length} opaque-box E2E test(s)...`);
  const suiteStart = Date.now();
  const results = [];
  let server = null;
  let browser = null;
  let signalCleaning = false;

  const handleSignal = (sig, exitCode) => {
    if (signalCleaning) return;
    signalCleaning = true;
    console.error(`\nReceived ${sig}, cleaning up E2E resources...`);
    Promise.resolve()
      .then(() => closeAllActiveContexts().catch(() => {}))
      .then(() => (browser ? browser.close().catch(() => {}) : undefined))
      .then(() => closeAllMockUpstreams().catch(() => {}))
      .then(() => (server ? server.close().catch(() => {}) : undefined))
      .then(() => closeAllIsolatedServers().catch(() => {}))
      .finally(() => process.exit(exitCode));
  };

  const onSigint = () => handleSignal('SIGINT', 130);
  const onSigterm = () => handleSignal('SIGTERM', 143);
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);

  try {
    server = await startIsolatedServer();
    browser = await launchBrowser();
    const ctx = { baseUrl: server.url, browser };

    for (const testCase of selected) {
      const start = Date.now();
      try {
        const testTimeoutMs = ENV_TEST_TIMEOUT_MS > 0
          ? ENV_TEST_TIMEOUT_MS
          : Math.max(DEFAULT_TEST_TIMEOUT_MS, Number(testCase.timeoutMs || 0));
        await runWithTimeout(testCase, ctx, testTimeoutMs);
        const durationMs = Date.now() - start;
        results.push({
          id: testCase.id,
          tier: testCase.tier,
          feature: testCase.feature,
          title: testCase.title,
          status: 'PASS',
          durationMs,
          error: null,
        });
        console.log(`PASS [${testCase.id}] (${durationMs}ms) ${testCase.title}`);
      } catch (err) {
        const durationMs = Date.now() - start;
        const message = err instanceof Error ? err.message : String(err);
        results.push({
          id: testCase.id,
          tier: testCase.tier,
          feature: testCase.feature,
          title: testCase.title,
          status: 'FAIL',
          durationMs,
          error: message,
        });
        console.error(`FAIL [${testCase.id}] (${durationMs}ms) ${testCase.title}\n     -> ${message}`);
      } finally {
        await closeAllActiveContexts().catch(() => {});
        await closeAllMockUpstreams().catch(() => {});
        await closeAllIsolatedServers({ exclude: server ? [server] : [] }).catch(() => {});
      }
    }
  } finally {
    process.off('SIGINT', onSigint);
    process.off('SIGTERM', onSigterm);
    await closeAllActiveContexts().catch(() => {});
    if (browser) {
      await browser.close().catch(() => {});
    }
    await closeAllMockUpstreams().catch(() => {});
    if (server) {
      await server.close().catch(() => {});
    }
    await closeAllIsolatedServers().catch(() => {});
  }

  const totalDurationMs = Date.now() - suiteStart;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log(`\n=== E2E Summary ===`);
  console.log(`Executed: ${results.length} | Passed: ${passed} | Failed: ${failed} | Duration: ${totalDurationMs}ms`);

  if (opts.jsonFile) {
    const outPath = path.resolve(opts.jsonFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          executed: results.length,
          passed,
          failed,
          durationMs: totalDurationMs,
          results,
        },
        null,
        2
      ),
      'utf8'
    );
  }

  process.exit(failed === 0 && results.length === selected.length ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
