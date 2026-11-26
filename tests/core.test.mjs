import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, execFileSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

describe('F-FORUM v3 Core Verification Suite', () => {
  let serverProcess;
  let baseUrl;
  let testPort;
  const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fforum-core-test-'));

  before(async () => {
    testPort = await getFreePort();
    baseUrl = `http://127.0.0.1:${testPort}`;

    const env = {
      ...process.env,
      PORT: String(testPort),
      NODE_ENV: 'test',
      FF_DISABLE_DOTENV: '1',
      FF_DATA_DIR: testDataDir,
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD_HASH: '',
      ADMIN_BOOTSTRAP_PASSWORD: 'fforum-admin-local-dev',
      AI_API_KEY: '',
      AI_API_KEY_1: '',
      AI_API_KEY_2: '',
      AI_API_KEYS: '',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    };

    serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      cwd: projectRoot,
      env,
      stdio: 'pipe',
    });

    let stderrBuf = '';
    serverProcess.stdout.on('data', () => {});
    serverProcess.stderr.on('data', (chunk) => {
      stderrBuf += String(chunk);
    });

    const maxWait = 12000;
    const start = Date.now();
    let ready = false;

    while (Date.now() - start < maxWait) {
      try {
        const res = await fetch(`${baseUrl}/api/health`);
        if (res.ok) {
          ready = true;
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (!ready) {
      throw new Error(`Server failed to start on ${baseUrl} within ${maxWait}ms${stderrBuf ? `\n${stderrBuf}` : ''}`);
    }
  });

  after(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 500));
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }

    try {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    } catch {
      void 0;
    }
  });

  describe('(a) 15-Turn Quota Enforcement', () => {
    test('enforces 15-turn quota limit for Guest sessions', async () => {
      const guestSessionId = `test-guest-${Date.now()}`;

      for (let turn = 1; turn <= 15; turn += 1) {
        const expectedRemaining = 15 - turn;
        const res = await fetch(`${baseUrl}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-ff-guest-id': guestSessionId,
          },
          body: JSON.stringify({
            projectId: 'guest-quota-test',
            prompt: `Prompt turn ${turn}`,
          }),
        });

        assert.equal(res.status, 200, `Guest turn ${turn} should return 200`);
        const data = await res.json();
        assert.ok(data.quota, 'Response should contain quota');
        assert.equal(data.quota.unlimited, false);
        assert.equal(data.quota.limit, 15);
        assert.equal(data.quota.used, turn);
        assert.equal(data.quota.remaining, expectedRemaining);
      }

      const turn16 = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ff-guest-id': guestSessionId,
        },
        body: JSON.stringify({
          projectId: 'guest-quota-test',
          prompt: 'Prompt turn 16',
        }),
      });

      assert.equal(turn16.status, 429, 'Turn 16 for guest must return HTTP 429');
      const errData = await turn16.json();
      assert.ok(errData.error);
      assert.equal(errData.quota.used, 15);
      assert.equal(errData.quota.remaining, 0);
      assert.equal(errData.quota.exhausted, true);
    });

    test('enforces 15-turn quota limit for Standard User accounts', async () => {
      const uniqueSuffix = Date.now().toString().slice(-6);
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: `stduser_${uniqueSuffix}`,
          email: `stduser_${uniqueSuffix}@fforum.test`,
          password: 'TestPassword123!',
          name: 'Standard Test User',
        }),
      });

      assert.equal(regRes.status, 201, 'Standard user registration should succeed');
      const userCookie = parseCookieHeader(regRes);
      assert.ok(userCookie, 'Should receive session cookie upon registration');

      for (let turn = 1; turn <= 15; turn += 1) {
        const expectedRemaining = 15 - turn;
        const res = await fetch(`${baseUrl}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            cookie: userCookie,
          },
          body: JSON.stringify({
            projectId: 'user-quota-test',
            prompt: `Standard user turn ${turn}`,
          }),
        });

        assert.equal(res.status, 200, `Standard user turn ${turn} should return 200`);
        const data = await res.json();
        assert.equal(data.quota.unlimited, false);
        assert.equal(data.quota.limit, 15);
        assert.equal(data.quota.used, turn);
        assert.equal(data.quota.remaining, expectedRemaining);
      }

      const turn16 = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: userCookie,
        },
        body: JSON.stringify({
          projectId: 'user-quota-test',
          prompt: 'Standard user turn 16',
        }),
      });

      assert.equal(turn16.status, 429, 'Turn 16 for standard user must return HTTP 429');
      const errData = await turn16.json();
      assert.equal(errData.quota.used, 15);
      assert.equal(errData.quota.remaining, 0);
      assert.equal(errData.quota.exhausted, true);
    });
  });

  describe('(b) Admin Unlimited Bypass & Route Protection', () => {
    test('protects /api/admin/state from unauthenticated and standard users', async () => {
      const anonRes = await fetch(`${baseUrl}/api/admin/state`);
      assert.equal(anonRes.status, 401, 'Unauthenticated access to /api/admin/state must be 401');

      const uniqueSuffix = Date.now().toString().slice(-6);
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: `std_chk_${uniqueSuffix}`,
          email: `std_chk_${uniqueSuffix}@fforum.test`,
          password: 'TestPassword123!',
        }),
      });
      const userCookie = parseCookieHeader(regRes);

      const stdRes = await fetch(`${baseUrl}/api/admin/state`, {
        headers: { cookie: userCookie },
      });
      assert.equal(stdRes.status, 403, 'Standard user access to /api/admin/state must be 403');
    });

    test('allows Admin login, sets unlimited quota, and bypasses 15-turn limit', async () => {
      const adminLoginRes = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'fforum-admin-local-dev',
        }),
      });

      assert.equal(adminLoginRes.status, 200, 'Admin login must return 200');
      const adminData = await adminLoginRes.json();
      assert.equal(adminData.user.role, 'admin');
      const adminCookie = parseCookieHeader(adminLoginRes);
      assert.ok(adminCookie, 'Admin session cookie must be set');

      const quotaRes = await fetch(`${baseUrl}/api/ai/quota`, {
        headers: { cookie: adminCookie },
      });
      assert.equal(quotaRes.status, 200);
      const quotaData = await quotaRes.json();
      assert.equal(quotaData.quota.unlimited, true);
      assert.equal(quotaData.quota.limit, null);

      const stateRes = await fetch(`${baseUrl}/api/admin/state`, {
        headers: { cookie: adminCookie },
      });
      assert.equal(stateRes.status, 200, 'Authenticated admin must access /api/admin/state');
      const stateData = await stateRes.json();
      assert.ok(stateData.state);

      for (let turn = 1; turn <= 18; turn += 1) {
        const chatRes = await fetch(`${baseUrl}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            cookie: adminCookie,
          },
          body: JSON.stringify({
            projectId: 'admin-unlimited-test',
            prompt: `Admin turn ${turn}`,
          }),
        });

        assert.equal(chatRes.status, 200, `Admin turn ${turn} must return 200`);
        const chatData = await chatRes.json();
        assert.equal(chatData.quota.unlimited, true);
        assert.equal(chatData.quota.limit, null);
      }
    });
  });

  describe('(c) Secret Scanner Detection and Redaction', () => {
    test('detects and redacts sk-*, AIza*, ghp_*, and Bearer tokens', async () => {
      const { scanFilesForSecrets, sanitizeFilesForZipExport } = await import(
        '../src/services/secretScanner.ts'
      );

      const mockOpenAi = ['sk', '-live99887766554433221100'].join('');
      const mockGcp = ['AIza', 'SyD1234567890abcdefghijklmnop'].join('');
      const mockGhp = ['ghp', '_1234567890abcdefghijklmnopqrstuvwxyz12'].join('');
      const mockJwt = ['eyJhbGciOiJIUzI1NiIs', 'InR5cCI6IkpXVCJ9.xyz'].join('');

      const sampleFiles = [
        {
          path: 'src/config.ts',
          content: `export const openai = "${mockOpenAi}";`,
        },
        {
          path: 'src/gcp.ts',
          content: `const key = "${mockGcp}";`,
        },
        {
          path: 'src/github.ts',
          content: `const token = "${mockGhp}";`,
        },
        {
          path: 'src/auth.ts',
          content: `headers["Authorization"] = "Bearer ${mockJwt}";`,
        },
        {
          path: 'src/clean.ts',
          content: 'export const cleanValue = 42;\nexport const name = "F-Forum";',
        },
      ];

      const scanResult = scanFilesForSecrets(sampleFiles);
      assert.equal(scanResult.clean, false, 'Should flag leaked secrets');
      assert.equal(scanResult.findings.length, 4, 'Should detect exactly 4 secret violations');

      const ruleIds = scanResult.findings.map((f) => f.ruleId);
      assert.ok(ruleIds.includes('SEC_OPENAI_KEY'));
      assert.ok(ruleIds.includes('SEC_GOOGLE_API_KEY'));
      assert.ok(ruleIds.includes('SEC_GITHUB_PAT'));
      assert.ok(ruleIds.includes('SEC_BEARER_TOKEN'));

      const sanitized = sanitizeFilesForZipExport(sampleFiles);
      assert.equal(sanitized.clean, false, 'Initial scan should flag findings');
      assert.equal(sanitized.sanitizedFiles.length, 5);

      for (const file of sanitized.sanitizedFiles) {
        assert.ok(!file.content.includes(mockOpenAi));
        assert.ok(!file.content.includes(mockGcp));
        assert.ok(!file.content.includes(mockGhp));
        assert.ok(!file.content.includes(mockJwt));
      }

      const rescan = scanFilesForSecrets(sanitized.sanitizedFiles);
      assert.equal(rescan.clean, true, 'Sanitized files must be 100% clean');
      assert.equal(rescan.findings.length, 0);
    });
  });

  describe('(d) Sandbox Live Preview & Source Coverage', () => {
    test('enforces strict iframe sandbox without allow-same-origin and no-referrer policy', () => {
      const previewFilePath = path.join(
        projectRoot,
        'src',
        'features',
        'workspace',
        'LivePreviewFrame.tsx'
      );
      assert.ok(fs.existsSync(previewFilePath), 'LivePreviewFrame.tsx must exist');
      const content = fs.readFileSync(previewFilePath, 'utf8');

      assert.ok(
        content.includes('sandbox="allow-scripts"'),
        'Must contain sandbox="allow-scripts"'
      );
      assert.ok(
        !content.includes('allow-same-origin'),
        'Must NOT contain allow-same-origin in LivePreviewFrame'
      );
      assert.ok(
        content.includes('referrerPolicy="no-referrer"') ||
          content.includes('referrerpolicy="no-referrer"'),
        'Must contain referrerPolicy="no-referrer"'
      );
    });

    test('covers all 5 libraries in sourceCatalog.json', () => {
      const catalogPath = path.join(projectRoot, 'src', 'data', 'sourceCatalog.json');
      assert.ok(fs.existsSync(catalogPath));
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

      const sourceLibs = new Set(catalog.map((i) => i.sourceLibrary));
      assert.ok(sourceLibs.has('pinui'), 'Missing pinui in sourceCatalog');
      assert.ok(sourceLibs.has('threeui'), 'Missing threeui in sourceCatalog');
      assert.ok(sourceLibs.has('motionsites'), 'Missing motionsites in sourceCatalog');
      assert.ok(sourceLibs.has('lucianlabs'), 'Missing lucianlabs in sourceCatalog');
      assert.ok(sourceLibs.has('codefronts'), 'Missing codefronts in sourceCatalog');
      assert.ok(catalog.length >= 100, `Expected >= 100 items, got ${catalog.length}`);
    });

    test('covers all 8 groups in resourceLibrary.json', () => {
      const resPath = path.join(projectRoot, 'src', 'data', 'resourceLibrary.json');
      assert.ok(fs.existsSync(resPath));
      const resources = JSON.parse(fs.readFileSync(resPath, 'utf8'));

      const groups = new Set(resources.map((r) => r.group));
      const requiredGroups = [
        'AI Tools',
        'Dev Tools',
        'UI/UX',
        'Prompts',
        'GitHub Repositories',
        'Skills & Rules',
        'Documentation',
        'Learning',
      ];

      for (const g of requiredGroups) {
        assert.ok(groups.has(g), `Missing required group: ${g}`);
      }
    });

    test('ensures 0 emojis across src/ and docs/', () => {
      const emojiRegex =
        /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

      function walk(dir) {
        let results = [];
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, item.name);
          if (item.isDirectory()) {
            results = results.concat(walk(full));
          } else if (item.isFile() && /\.(tsx?|jsx?|json|css|md|html)$/.test(item.name)) {
            results.push(full);
          }
        }
        return results;
      }

      const files = [
        ...walk(path.join(projectRoot, 'src')),
        ...walk(path.join(projectRoot, 'docs')),
      ];

      for (const file of files) {
        const text = fs.readFileSync(file, 'utf8');
        const match = text.match(emojiRegex);
        assert.equal(
          match,
          null,
          `Emoji character ${match ? match[0] : ''} found in ${path.relative(projectRoot, file)}`
        );
      }
    });

    test('ensures 0 host /home/ leaks in src/ and docs/', () => {
      function walk(dir) {
        let results = [];
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, item.name);
          if (item.isDirectory()) {
            results = results.concat(walk(full));
          } else if (item.isFile() && /\.(tsx?|jsx?|json|css|md|html)$/.test(item.name)) {
            results.push(full);
          }
        }
        return results;
      }

      const files = [
        ...walk(path.join(projectRoot, 'src')),
        ...walk(path.join(projectRoot, 'docs')),
      ];

      const forbiddenPrefix = ['/', 'home', '/'].join('');
      for (const file of files) {
        const text = fs.readFileSync(file, 'utf8');
        assert.ok(
          !text.includes(forbiddenPrefix),
          `Host unix home path leaked in ${path.relative(projectRoot, file)}`
        );
      }
    });

    test('validates repoLeaderboard.json has >=35 verified items across 4 categories with valid GitHub URLs and 0 Arena AI references', () => {
      const lbPath = path.join(projectRoot, 'src', 'data', 'repoLeaderboard.json');
      assert.ok(fs.existsSync(lbPath), 'repoLeaderboard.json must exist');
      const rawText = fs.readFileSync(lbPath, 'utf8');
      const parsed = JSON.parse(rawText);
      const items = Array.isArray(parsed) ? parsed : parsed.items || [];

      assert.ok(items.length >= 35, `Expected >= 35 items, got ${items.length}`);

      const requiredCategories = [
        'Skills, Rules & Prompts',
        'AI Agents & CLI',
        'UI/UX & Motion',
        'Local LLM & DevTools',
      ];
      const categories = new Set(items.map((item) => item.category));
      for (const cat of requiredCategories) {
        assert.ok(categories.has(cat), `Missing leaderboard category: ${cat}`);
      }

      const emojiRegex =
        /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
      assert.equal(rawText.match(emojiRegex), null, 'repoLeaderboard.json must contain 0 emojis');
      assert.ok(
        !/arena\s*ai/i.test(rawText),
        'repoLeaderboard.json must contain 0 Arena AI references'
      );

      for (const item of items) {
        assert.ok(
          typeof item.htmlUrl === 'string' && item.htmlUrl.startsWith('https://github.com/'),
          `Invalid GitHub URL for ${item.id}: ${item.htmlUrl}`
        );
        assert.ok(
          typeof item.stars === 'number' && item.stars > 0,
          `Expected positive stars for ${item.id}, got ${item.stars}`
        );
      }
    });

    test('validates ScrollStoryEngine.tsx and story.css exist, enforce prefers-reduced-motion, and have 0 /home/ path leaks', () => {
      const homeViewPath = path.join(projectRoot, 'src', 'features', 'launchpad', 'HomeView.tsx');
      const storyEnginePath = path.join(
        projectRoot,
        'src',
        'components',
        'launchpad',
        'ScrollStoryEngine.tsx'
      );
      const storyCssPath = path.join(projectRoot, 'src', 'styles', 'story.css');

      assert.ok(fs.existsSync(homeViewPath), 'src/features/launchpad/HomeView.tsx must exist');
      assert.ok(
        fs.existsSync(storyEnginePath),
        'src/components/launchpad/ScrollStoryEngine.tsx must exist'
      );
      assert.ok(fs.existsSync(storyCssPath), 'src/styles/story.css must exist');

      const storyEngineText = fs.readFileSync(storyEnginePath, 'utf8');
      const storyCssText = fs.readFileSync(storyCssPath, 'utf8');

      assert.ok(
        storyEngineText.includes('prefers-reduced-motion: reduce'),
        'ScrollStoryEngine.tsx must check prefers-reduced-motion: reduce'
      );
      assert.ok(
        storyCssText.includes('prefers-reduced-motion: reduce'),
        'story.css must include @media (prefers-reduced-motion: reduce)'
      );
      assert.ok(
        !/\/home\/[A-Za-z0-9_-]+/.test(storyEngineText),
        'ScrollStoryEngine.tsx must have 0 /home/ path leaks'
      );
      assert.ok(
        !/\/home\/[A-Za-z0-9_-]+/.test(storyCssText),
        'story.css must have 0 /home/ path leaks'
      );
    });
  });

  describe('(e) Project Sync & Supabase Schema Readiness', () => {
    test('reports local-json persistence on GET /api/health when Supabase env vars are unset', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'ok');
      assert.equal(data.persistence, 'local-json');
    });

    test('blocks Guest project sync with 401 and returns empty unauthenticated project list', async () => {
      const listRes = await fetch(`${baseUrl}/api/projects/list`);
      assert.equal(listRes.status, 200);
      const listData = await listRes.json();
      assert.equal(listData.authenticated, false);
      assert.deepEqual(listData.projects, []);

      const syncRes = await fetch(`${baseUrl}/api/projects/sync`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          project: {
            id: 'guest-attempt-1',
            name: 'Guest Sync Attempt',
            files: [],
          },
        }),
      });
      assert.equal(syncRes.status, 401);
    });

    test('syncs, lists scoped to authenticated user, and deletes projects cleanly', async () => {
      const uniqueSuffix = `${Date.now().toString().slice(-6)}_sync`;
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: `syncuser_${uniqueSuffix}`,
          email: `syncuser_${uniqueSuffix}@fforum.test`,
          password: 'TestPassword123!',
          name: 'Project Sync Tester',
        }),
      });
      assert.equal(regRes.status, 201);
      const userCookie = parseCookieHeader(regRes);
      assert.ok(userCookie);

      const testProjectId = `proj-sync-${uniqueSuffix}`;
      const syncRes = await fetch(`${baseUrl}/api/projects/sync`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: userCookie,
        },
        body: JSON.stringify({
          project: {
            id: testProjectId,
            name: 'Synced Cloud Workspace',
            description: 'End-to-end project sync verification',
            activeFilePath: 'index.html',
            pinned: true,
            archived: false,
            files: [
              {
                path: 'index.html',
                language: 'html',
                content: '<!doctype html><html><body>Synced</body></html>',
              },
            ],
            messages: [],
            attachedItems: [],
            snapshots: [],
            processes: [],
          },
        }),
      });
      assert.equal(syncRes.status, 200);
      const syncData = await syncRes.json();
      assert.equal(syncData.ok, true);
      assert.equal(syncData.project.id, testProjectId);
      assert.equal(syncData.project.name, 'Synced Cloud Workspace');

      const listRes = await fetch(`${baseUrl}/api/projects/list`, {
        headers: { cookie: userCookie },
      });
      assert.equal(listRes.status, 200);
      const listData = await listRes.json();
      assert.equal(listData.authenticated, true);
      assert.ok(Array.isArray(listData.projects));
      const matched = listData.projects.find((p) => p.id === testProjectId);
      assert.ok(matched, 'Synced project must appear in user project list');
      assert.equal(matched.name, 'Synced Cloud Workspace');
      assert.equal(matched.pinned, true);

      const deleteRes = await fetch(`${baseUrl}/api/projects/delete`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: userCookie,
        },
        body: JSON.stringify({ projectId: testProjectId }),
      });
      assert.equal(deleteRes.status, 200);
      const deleteData = await deleteRes.json();
      assert.equal(deleteData.ok, true);

      const listAfterRes = await fetch(`${baseUrl}/api/projects/list`, {
        headers: { cookie: userCookie },
      });
      const listAfterData = await listAfterRes.json();
      assert.equal(
        listAfterData.projects.some((p) => p.id === testProjectId),
        false,
        'Deleted project must no longer appear in user project list'
      );
    });

    test('validates supabase/schema.sql defines all 8 tables with RLS enabled and 0 public anon policies', () => {
      const schemaPath = path.join(projectRoot, 'supabase', 'schema.sql');
      assert.ok(fs.existsSync(schemaPath), 'supabase/schema.sql must exist');
      const sql = fs.readFileSync(schemaPath, 'utf8');

      const requiredTables = [
        'ff_users',
        'ff_quotas',
        'ff_community_posts',
        'ff_community_reports',
        'ff_admin_config',
        'ff_audit_logs',
        'ff_changelog',
        'ff_projects',
      ];

      for (const table of requiredTables) {
        const createRegex = new RegExp(`CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${table}\\b`, 'i');
        const rlsRegex = new RegExp(
          `ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          'i'
        );
        assert.ok(createRegex.test(sql), `Missing CREATE TABLE IF NOT EXISTS for ${table}`);
        assert.ok(rlsRegex.test(sql), `Missing ENABLE ROW LEVEL SECURITY for ${table}`);
      }

      assert.equal(
        /\bCREATE\s+POLICY\b/i.test(sql),
        false,
        'schema.sql must have 0 public/anon policies'
      );
      assert.equal(/\banon\b/i.test(sql), false, 'schema.sql must not grant access to anon role');
    });

    test('supports email-style ADMIN_USERNAME with case-insensitive login and scrypt ADMIN_PASSWORD_HASH', () => {
      const script = [
        "import { getEnvAdminUser, hashPassword, loginAdminUser } from './server/authEngine.ts';",
        "const testAdminEmail = 'Admin.Owner@Example.com';",
        "const testAdminPass = 'UltraSecretAdminPass!2026';",
        "process.env.ADMIN_USERNAME = testAdminEmail;",
        "process.env.ADMIN_PASSWORD_HASH = hashPassword(testAdminPass);",
        "process.env.ADMIN_BOOTSTRAP_PASSWORD = '';",
        "const envAdmin = getEnvAdminUser();",
        "const loginResult = loginAdminUser({ username: 'admin.owner@example.com', password: testAdminPass });",
        "console.log(JSON.stringify({ envAdmin, loginResult }));",
      ].join('\n');

      const stdout = execFileSync('npx', ['tsx', '-e', script], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          FF_DISABLE_DOTENV: '1',
          FF_DATA_DIR: testDataDir,
        },
      });
      const parsed = JSON.parse(stdout.trim());

      assert.equal(parsed.envAdmin.email, 'Admin.Owner@Example.com');
      assert.ok(!parsed.envAdmin.email.endsWith('@fforum.local'));
      assert.equal(parsed.loginResult.ok, true);
      assert.equal(parsed.loginResult.user.role, 'admin');
      assert.equal(parsed.loginResult.user.email, 'Admin.Owner@Example.com');
    });

    test('parses 9Router SSE stream responses and respects requested model via resolveAIConfig', async () => {
      const http = await import('node:http');
      const mockServer = http.createServer((req, res) => {
        if (req.url === '/v1/chat/completions' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            const parsedReq = JSON.parse(body);
            assert.equal(parsedReq.model, 'ag/gemini-3.8-flash-low');
            assert.equal(parsedReq.stream, true);
            const payload = JSON.stringify({
              message: 'Generated via mock 9Router SSE',
              files: [
                { path: 'index.html', content: '<!doctype html><html><body>OK</body></html>', summary: 'html' },
                { path: 'styles.css', content: 'body{margin:0}', summary: 'css' },
                { path: 'app.js', content: 'console.log(1)', summary: 'js' },
              ],
              checksHint: ['SSE verified'],
            });
            const half = Math.floor(payload.length / 2);
            res.writeHead(200, { 'content-type': 'text/event-stream' });
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: payload.slice(0, half) } }] })}\n\n`);
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: payload.slice(half) } }] })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          });
          return;
        }
        res.writeHead(404).end();
      });

      await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
      const { port } = mockServer.address();
      try {
        const script = [
          "import { runAIGeneration } from './server/aiEngine.ts';",
          '(async () => {',
          `  process.env.AI_BASE_URL = 'http://127.0.0.1:${port}/v1';`,
          "  process.env.AI_API_KEY = 'sk-mock-9router';",
          "  process.env.AI_PROTOCOL = 'openai-compatible';",
          "  process.env.AI_MODEL = 'studio-smart-route';",
          "  const out = await runAIGeneration({ projectId: 'sse-test', prompt: 'Build test', model: 'ag/gemini-3.8-flash-low' }, {});",
          "  console.log(JSON.stringify(out));",
          '})();',
        ].join('\n');

        const { stdout } = await execFileAsync('npx', ['tsx', '-e', script], {
          cwd: projectRoot,
          encoding: 'utf8',
          env: {
            ...process.env,
            FF_DISABLE_DOTENV: '1',
            FF_DATA_DIR: testDataDir,
            AI_API_KEY_1: '',
            AI_API_KEY_2: '',
            AI_API_KEYS: '',
          },
        });
        const parsed = JSON.parse(stdout.trim());
        assert.equal(parsed.fallback, false);
        assert.equal(parsed.modelUsed, 'ag/gemini-3.8-flash-low');
        assert.equal(parsed.files.length, 3);
        assert.equal(parsed.message, 'Generated via mock 9Router SSE');
      } finally {
        mockServer.close();
      }
    });
  });

  describe('(f) Real Visitor (195+) & Active Time (91h+)', () => {
    test('GET /api/metrics exposes persisted baselines at 195+ visitors and 91h+ active seconds', async () => {
      const res = await fetch(`${baseUrl}/api/metrics`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(typeof data.visitors, 'number');
      assert.ok(data.visitors >= 195, `visitors must start at >= 195, received ${data.visitors}`);
      assert.equal(typeof data.activeSeconds, 'number');
      assert.ok(
        data.activeSeconds >= 327600,
        `activeSeconds must start at >= 327600 (91h), received ${data.activeSeconds}`
      );
      assert.equal(typeof data.lastUpdatedAt, 'string');
      assert.equal(Number.isNaN(Date.parse(data.lastUpdatedAt)), false);
    });

    test('POST /api/metrics/visit increments visitors only for a genuinely new visitorId', async () => {
      const visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const firstRes = await fetch(`${baseUrl}/api/metrics/visit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });
      assert.equal(firstRes.status, 200);
      const first = await firstRes.json();
      assert.equal(first.counted, true);
      const afterFirst = first.visitors;

      const duplicateRes = await fetch(`${baseUrl}/api/metrics/visit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });
      assert.equal(duplicateRes.status, 200);
      const duplicate = await duplicateRes.json();
      assert.equal(duplicate.counted, false);
      assert.equal(duplicate.visitors, afterFirst, 'Duplicate visitorId must not increment visitors');

      const otherRes = await fetch(`${baseUrl}/api/metrics/visit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visitorId: `${visitorId}-2` }),
      });
      assert.equal(otherRes.status, 200);
      const other = await otherRes.json();
      assert.equal(other.counted, true);
      assert.equal(other.visitors, afterFirst + 1);

      const emptyRes = await fetch(`${baseUrl}/api/metrics/visit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visitorId: '' }),
      });
      assert.equal(emptyRes.status, 400);
    });

    test('POST /api/metrics/heartbeat adds real active seconds and rejects invalid payloads', async () => {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const beforeRes = await fetch(`${baseUrl}/api/metrics`);
      const before = await beforeRes.json();

      const okRes = await fetch(`${baseUrl}/api/metrics/heartbeat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, deltaSeconds: 25 }),
      });
      assert.equal(okRes.status, 200);
      const okData = await okRes.json();
      assert.equal(okData.ok, true);
      assert.equal(okData.addedSeconds, 25);
      assert.equal(okData.activeSeconds, before.activeSeconds + 25);

      for (const invalidDelta of [-5, 0, 61, 3600]) {
        const invalidRes = await fetch(`${baseUrl}/api/metrics/heartbeat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, deltaSeconds: invalidDelta }),
        });
        assert.equal(invalidRes.status, 400, `deltaSeconds=${invalidDelta} must be rejected`);
      }

      const spamRes = await fetch(`${baseUrl}/api/metrics/heartbeat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, deltaSeconds: 36 }),
      });
      assert.equal(spamRes.status, 429, 'Per-session rate limit must block inflated active time');

      const afterRes = await fetch(`${baseUrl}/api/metrics`);
      const after = await afterRes.json();
      assert.equal(
        after.activeSeconds,
        before.activeSeconds + 25,
        'Rejected heartbeats must not add active time'
      );
    });
  });
});
