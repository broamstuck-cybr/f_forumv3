import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function walkSourceFiles(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out = out.concat(walkSourceFiles(full));
    } else if (/\.(tsx?|css)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function readShardJson(shardPath) {
  const buf = fs.readFileSync(shardPath);
  const text =
    buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b
      ? zlib.gunzipSync(buf).toString('utf8')
      : buf.toString('utf8');
  return JSON.parse(text);
}

describe('Vault Hydration & Anti-Arena Regression Suite', () => {
  test('hydrates all 8,322 vault items across 6 libraries with valid compact gzipped shard files (<15MB total)', () => {
    const indexPath = path.join(projectRoot, 'public', 'data', 'studio-vault.json');
    assert.ok(fs.existsSync(indexPath), 'studio-vault.json must exist');
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

    assert.equal(data.total, 8322, `Expected 8322 vault items, got ${data.total}`);
    assert.equal(data.items.length, 8322);
    const ext = data.shardExt || 'jgz';

    const libs = new Set(data.items.map((item) => item.l));
    for (const lib of ['pinui', 'codefronts', 'lucianlabs', 'motionsites', 'threeui', 'glacier']) {
      assert.ok(libs.has(lib), `Missing library ${lib} in studio-vault.json`);
    }

    const shardsToSpotCheck = new Set();
    let aiWorkflowShard = '';
    for (const item of data.items) {
      if (item.i === 'ai-workflow') aiWorkflowShard = item.s;
      if (item.s && item.s !== 'pinui') {
        const shardPath = path.join(projectRoot, 'public', 'data', 'vault', `${item.s}.${ext}`);
        assert.ok(fs.existsSync(shardPath), `Missing shard file: ${item.s}.${ext}`);
        if (shardsToSpotCheck.size < 12) shardsToSpotCheck.add(item.s);
      }
    }

    for (const shardName of shardsToSpotCheck) {
      const shardPath = path.join(projectRoot, 'public', 'data', 'vault', `${shardName}.${ext}`);
      const shard = readShardJson(shardPath);
      const keys = Object.keys(shard);
      assert.ok(keys.length > 0, `Shard ${shardName} must not be empty`);
      const sample = shard[keys[0]];
      assert.ok(typeof sample.p === 'string' && sample.p.trim().length > 0, `Empty prompt in ${shardName}`);
    }

    assert.ok(aiWorkflowShard, 'ai-workflow must have a shard assigned');
    const aiShard = readShardJson(
      path.join(projectRoot, 'public', 'data', 'vault', `${aiWorkflowShard}.${ext}`)
    );
    const aiEntry = aiShard['ai-workflow'];
    assert.ok(aiEntry, 'ai-workflow must exist in its ms shard');
    assert.equal(aiEntry.cl, 'tsx', 'ai-workflow shard must extract tsx code language');
    assert.ok(
      typeof aiEntry.j === 'string' && aiEntry.j.includes('BoomerangVideoBg') && aiEntry.j.length > 10000,
      'ai-workflow shard must extract full BoomerangVideoBg + App TSX code'
    );

    const vaultDir = path.join(projectRoot, 'public', 'data', 'vault');
    const totalBytes = fs
      .readdirSync(vaultDir)
      .reduce((acc, f) => acc + fs.statSync(path.join(vaultDir, f)).size, 0);
    assert.ok(totalBytes < 15 * 1024 * 1024, `Vault shards should be < 15MB, got ${(totalBytes / 1e6).toFixed(2)}MB`);
  });

  test('ensures 100% of sourceCatalog.json items have real prompts, authentic vendor officialUrl links, and 0 synthetic stage boilerplate', () => {
    const catalogPath = path.join(projectRoot, 'src', 'data', 'sourceCatalog.json');
    const rawCatalog = fs.readFileSync(catalogPath, 'utf8');
    assert.equal(
      /ms-stage|ff3d-stage|Đổi nhịp xoay|Khối 01|Chạy thử ngay trong khung xem/.test(rawCatalog),
      false,
      'Synthetic stage boilerplate must not exist in sourceCatalog.json'
    );

    const catalog = JSON.parse(rawCatalog);
    assert.ok(catalog.length >= 200);

    const allowedHosts = new Set([
      'www.pinui.xyz',
      'pinui.xyz',
      'threeui.com',
      'www.threeui.com',
      'www.getlayers.ai',
      'getlayers.ai',
      'motionsites.ai',
      'www.motionsites.ai',
      'lucianlabs.dev',
      'www.lucianlabs.dev',
      'codefronts.com',
      'www.codefronts.com',
    ]);

    for (const item of catalog) {
      assert.ok(
        typeof item.promptSpec === 'string' && item.promptSpec.trim().length >= 30,
        `Missing or too-short promptSpec for ${item.id}`
      );
      assert.ok(
        typeof item.officialUrl === 'string' && item.officialUrl.startsWith('https://'),
        `Missing authentic https officialUrl for ${item.id}`
      );
      const parsed = new URL(item.officialUrl);
      assert.ok(
        allowedHosts.has(parsed.hostname),
        `Unexpected officialUrl host ${parsed.hostname} in ${item.id}`
      );
    }

    const guardnet = catalog.find((item) => item.id === 'guardnet-benefits');
    assert.ok(guardnet, 'guardnet-benefits must exist in sourceCatalog.json');
    assert.ok(guardnet.previewHtml?.includes('Key Benefits'), 'guardnet-benefits must match guardnet-benefits.md Key Benefits heading');
    assert.ok(guardnet.previewHtml?.includes('Preemptive Risks'), 'guardnet-benefits must match guardnet-benefits.md Card 1/3 copy');
    assert.ok(guardnet.previewHtml?.includes('Know-how and Sectoral'), 'guardnet-benefits must match guardnet-benefits.md Card 2 copy');
    assert.ok(guardnet.previewCss?.includes('#1e3a8a'), 'guardnet-benefits CSS must match #1e3a8a blue blobs');
  });

  test('ensures motionsites-full.json extracts real TSX/CSS code, omits duplicate keys, and has 0 synthetic ms-stage', () => {
    const msPath = path.join(projectRoot, 'public', 'data', 'motionsites-full.json');
    const rawMs = fs.readFileSync(msPath, 'utf8');
    assert.equal(/ms-stage|Khối 01/.test(rawMs), false, 'Synthetic ms-stage boilerplate must not exist in motionsites-full.json');

    const ms = JSON.parse(rawMs);
    assert.ok(ms.total >= 321, `Expected >= 321 motionsites items, got ${ms.total}`);
    assert.equal(Object.keys(ms.items).length, ms.total, 'motionsites-full.json must not duplicate entries under both bare and ms- keys');

    const aiWorkflow = ms.items['ai-workflow'];
    assert.ok(aiWorkflow, 'ai-workflow must exist in motionsites-full.json');
    assert.ok(aiWorkflow.promptText.length > 5000, 'ai-workflow promptText must be full verbatim prompt');
    assert.equal(aiWorkflow.codeLang, 'tsx');
    assert.ok(aiWorkflow.code.includes('BoomerangVideoBg') && aiWorkflow.code.includes('function App'));
    assert.equal(aiWorkflow.liveHtml, undefined, 'ai-workflow head-only link tags must not be treated as liveHtml');

    const guardnet = ms.items['guardnet-benefits'];
    assert.ok(guardnet?.liveHtml?.includes('Key Benefits'));
    assert.ok(guardnet?.code?.includes('BenefitsSection'));
  });

  test('verifies Arena A/B cosplay, GitHub connector cosplay, jargon, and third-party showcase labels are removed from src/', () => {
    const files = walkSourceFiles(path.join(projectRoot, 'src'));
    const bannedPatterns = [
      /buildDistinctArenaArtifact/,
      /ARENA_TURNS_STORAGE_KEY/,
      /So sánh 2 Model \(A-B\)/,
      /Mở trang gốc/,
      /Ran commands/,
      /Xem giao diện chạy thật\./,
      /02 · thông số/,
      /195 người truy cập/,
      /estimateElapsedLabel/,
      /Gemini 3\.8 Flash/,
      /Claude Sonnet 5\.5/,
      /OBSIDIAN FOUNDRY TOKENS/,
      /GitHubConnectorModal/,
      /Kết nối GitHub/,
      /Tiện ích &amp; Kết nối/,
      /PinUI · ThreeUI · LucianLabs/,
      /LucianLabs Glass/,
      /Nút kính lỏng LucianLabs/,
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const re of bannedPatterns) {
        assert.equal(
          re.test(content),
          false,
          `Banned pattern ${re} found in ${path.relative(projectRoot, file)}`
        );
      }
    }

    assert.equal(
      fs.existsSync(path.join(projectRoot, 'src', 'features', 'explore', 'StudioVaultDrawer.tsx')),
      false,
      'Obsolete StudioVaultDrawer.tsx must be deleted per Teardown Rule'
    );
    assert.equal(
      fs.existsSync(path.join(projectRoot, 'src', 'features', 'workspace', 'GitHubConnectorModal.tsx')),
      false,
      'Obsolete GitHubConnectorModal.tsx must be deleted per Teardown Rule'
    );

    const landingContent = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'landing', 'landingContent.ts'),
      'utf8'
    );
    assert.equal(/allow-same-origin|không chia sẻ quyền đồng nguồn|chặn rò rỉ phiên/.test(landingContent), false, 'Landing copy must not leak iframe sandbox jargon');
  });

  test('verifies SoundHelix ORB audio links are removed, MotionMarqueeGrid has Mã nguồn tab, and Ctrl+E CommandPalette is wired', () => {
    const simHtml = fs.readFileSync(
      path.join(projectRoot, 'public', 'iphone18-simulator.html'),
      'utf8'
    );
    assert.equal(simHtml.includes('soundhelix.com'), false, 'No external SoundHelix URLs allowed');

    const marqueeTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'launchpad', 'MotionMarqueeGrid.tsx'),
      'utf8'
    );
    assert.ok(
      marqueeTsx.includes("activeTab === 'code'"), 'MotionMarqueeGrid modal must include Mã nguồn tab');
    assert.ok(marqueeTsx.includes('Mã nguồn'), 'MotionMarqueeGrid modal must label Mã nguồn tab');
    assert.ok(
      marqueeTsx.includes("setActiveTab(hasLive ? 'live' : 'video')"),
      'MotionMarqueeGrid must open the full live demo first when live HTML exists (A5)'
    );
    assert.ok(
      marqueeTsx.includes('buildMotionThemeOverrideCss'),
      'MotionMarqueeGrid must apply stage theme override CSS inside SandboxPreview'
    );
    assert.equal(
      /mmq-card-badge|mmq-heart-btn|mmq-card-sub/.test(marqueeTsx),
      false,
      'Marquee tiles must stay clean: no corner pills, heart counters, or summary lines'
    );

    const catalogTs = fs.readFileSync(
      path.join(projectRoot, 'src', 'data', 'motionShowcaseCatalog.ts'),
      'utf8'
    );
    const posterUrls = [...catalogTs.matchAll(/"imageUrl":\s*"([^"]+)"/g)].map((m) => m[1]);
    assert.ok(posterUrls.length >= 40, 'Motion marquee catalog must keep >= 40 items');
    assert.equal(
      new Set(posterUrls).size,
      posterUrls.length,
      'Every motion marquee item must have a distinct imageUrl (no shared posters)'
    );

    const appTsx = fs.readFileSync(path.join(projectRoot, 'src', 'App.tsx'), 'utf8');
    assert.ok(appTsx.includes('<CommandPalette />'), 'App.tsx must mount CommandPalette');

    const paletteTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'layout', 'CommandPalette.tsx'),
      'utf8'
    );
    assert.ok(paletteTsx.includes("event.key.toLowerCase() === 'e'"), 'CommandPalette must bind Ctrl+E');
    assert.ok(paletteTsx.includes('previousFocusRef'), 'CommandPalette must restore focus on close');
  });

  test('verifies nv2 Community MVP (polls, multi-image, hide/mute/block, grouped notifications, 3-step onboarding, 390px bottom nav) and zero host path leaks', () => {
    const xpTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'features', 'explore', 'ExperienceView.tsx'),
      'utf8'
    );
    assert.ok(xpTsx.includes('shardRetryTick'), 'ExperienceView must wire shardRetryTick for shard retry');
    assert.equal(
      xpTsx.includes('vaultError && allVaultItems.length === 0'),
      false,
      'ExperienceView must not gate vaultError alert on allVaultItems.length === 0'
    );

    const communityTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'features', 'community', 'CommunityView.tsx'),
      'utf8'
    );
    assert.ok(communityTsx.includes('formatUserDisplayName'), 'CommunityView must normalize admin display name');
    assert.ok(communityTsx.includes('CommunityPollCard'), 'CommunityView must render interactive polls');
    assert.ok(communityTsx.includes('CommunityOnboardingCard'), 'CommunityView must render 3-step onboarding');
    assert.ok(communityTsx.includes('CommunityNotificationsModal'), 'CommunityView must render grouped notifications');
    assert.ok(communityTsx.includes('MAX_COMPOSE_IMAGES = 4'), 'CommunityView must support up to 4 images');
    assert.ok(communityTsx.includes('Ẩn bài viết') && communityTsx.includes('Tắt tiếng') && communityTsx.includes('Chặn @'), 'CommunityView must include hide, mute, and block moderation actions');

    const navbarTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'layout', 'AppNavbar.tsx'),
      'utf8'
    );
    for (const label of ['Trang chủ', 'Khám phá', 'Đăng bài', 'Thông báo', 'Hồ sơ']) {
      assert.ok(navbarTsx.includes(label), `Mobile bottom nav must include ${label}`);
    }
    assert.ok(navbarTsx.includes('mobile-bnav__dot'), 'Mobile bottom nav must include unread notification red dot');

    const repoTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'features', 'explore', 'RepoChart.tsx'),
      'utf8'
    );
    const runBtnMatches = repoTsx.match(/>\s*Chạy thử\s*</g) || [];
    assert.equal(runBtnMatches.length, 1, 'RepoChart house row must render only 1 Chạy thử button');

    const calendarTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'pinui', 'CalendarCard.tsx'),
      'utf8'
    );
    assert.ok(calendarTsx.includes('"Tháng 11"'), 'CalendarCard months must be localized in Vietnamese');
    assert.equal(calendarTsx.includes('"November"'), false, 'CalendarCard must not render English months');

    const qaReportPath = path.join(projectRoot, '.qa', 'QA_REPORT.md');
    if (fs.existsSync(qaReportPath)) {
      const qaReport = fs.readFileSync(qaReportPath, 'utf8');
      assert.equal(/\/home\//.test(qaReport), false, '.qa/QA_REPORT.md must not contain /home/ path leaks');
    }
  });

  test('verifies Iris 3D Robot + QR Code Corner + Dev Team Honor at bottom of Home & Landing, and F-Forum Curved Carousel of 50 PinUI & Motion AI experiences', async () => {
    const qrAssetPath = path.join(projectRoot, 'public', 'assets', 'qr-dino.png');
    assert.ok(fs.existsSync(qrAssetPath), 'public/assets/qr-dino.png must exist');
    assert.ok(fs.statSync(qrAssetPath).size > 5000, 'qr-dino.png must be a valid non-empty PNG');

    assert.equal(
      fs.existsSync(path.join(projectRoot, 'public', 'reelmark-hero.html')),
      false,
      'Legacy public/reelmark-hero.html must be removed'
    );
    assert.equal(
      fs.existsSync(path.join(projectRoot, 'public', 'iris-assistant.html')),
      false,
      'Legacy public/iris-assistant.html must be removed'
    );

    const irisDataTs = fs.readFileSync(
      path.join(projectRoot, 'src', 'data', 'irisRobotHtml.ts'),
      'utf8'
    );
    assert.ok(
      irisDataTs.includes('hf_20261018_172206_0181329a-86e2-41c9-8ab8-c496f29aaa53.glb') &&
        irisDataTs.includes('hf_20261018_172137_cd6086ec-07ef-44dc-bd15-95a450ddaa8c.glb'),
      'irisRobotHtml.ts must keep exact HEAD_GLB and ARM_GLB URLs'
    );
    assert.equal(
      irisDataTs.includes('Get Iris') || irisDataTs.includes('Introducing a Smart AI Assistant'),
      false,
      'irisRobotHtml.ts must not contain legacy Iris boilerplate copy'
    );

    const irisSectionTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'launchpad', 'IrisQrCornerSection.tsx'),
      'utf8'
    );
    assert.ok(
      irisSectionTsx.includes('UnrealBloomPass') &&
        irisSectionTsx.includes('PMREMGenerator') &&
        irisSectionTsx.includes('mergeVertices'),
      'IrisQrCornerSection.tsx must use PMREMGenerator, UnrealBloomPass, and mergeVertices'
    );
    assert.ok(
      irisSectionTsx.indexOf('raycaster.intersectObject(root, true)') < irisSectionTsx.indexOf('head.add(root)'),
      'IrisQrCornerSection.tsx must raycast root before head.add(root)'
    );
    assert.ok(
      irisSectionTsx.includes('webglcontextlost') && irisSectionTsx.includes('disposeObjectTree(scene)'),
      'IrisQrCornerSection.tsx must handle webglcontextlost and dispose scene geometries/materials on unmount'
    );
    assert.ok(
      irisSectionTsx.includes('Gặp gỡ đội ngũ phát triển của tôi :)'),
      'IrisQrCornerSection.tsx must include the Dev Team Honor button'
    );
    assert.equal(
      irisSectionTsx.includes('Get Iris') || irisSectionTsx.includes('Introducing a Smart AI Assistant'),
      false,
      'IrisQrCornerSection.tsx must not render legacy Iris navbar or English hero text'
    );

    const homeTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'features', 'launchpad', 'HomeView.tsx'),
      'utf8'
    );
    const landingTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'landing', 'LandingPage.tsx'),
      'utf8'
    );
    assert.ok(homeTsx.includes('<IrisQrCornerSection'), 'HomeView.tsx must mount IrisQrCornerSection at bottom');
    assert.ok(landingTsx.includes('<IrisQrCornerSection'), 'LandingPage.tsx must mount IrisQrCornerSection at bottom');

    const tidewellTsx = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'landing', 'TidewellStage.tsx'),
      'utf8'
    );
    assert.equal(
      tidewellTsx.includes('biến ý tưởng thành giao diện chạy thật trên trình duyệt'),
      false,
      'Old TidewellStage copy must be deleted'
    );
    assert.equal(
      tidewellTsx.includes('Reelmark') ||
        tidewellTsx.includes('Captivate Crowds') ||
        tidewellTsx.includes('Make a Reel'),
      false,
      'TidewellStage must not contain Reelmark branding or copy'
    );
    assert.ok(
      tidewellTsx.includes('Dùng Thử Trực Tiếp') && tidewellTsx.includes('Trên Trình Duyệt'),
      'TidewellStage must render the Dùng Thử Trực Tiếp / Trên Trình Duyệt headline'
    );
    assert.equal(
      /rm-subline|Trộn ngẫu nhiên|&lt;-|-&gt;/.test(tidewellTsx),
      false,
      'TidewellStage must not render rm-subline, arrow glyphs, or shuffle controls'
    );
    assert.ok(
      tidewellTsx.includes("setModalMode('interactive')"),
      'TidewellStage must open the interactive trial first (A5), video only as fallback'
    );
    const tidewellCss = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'landing', 'tidewell.css'),
      'utf8'
    );
    assert.equal(
      /rm-subline|Trộn ngẫu nhiên/.test(tidewellCss),
      false,
      'tidewell.css must not style rm-subline or shuffle controls'
    );
    assert.ok(
      tidewellTsx.includes('key={idx}') && !tidewellTsx.includes('key={`${card.id}-${idx}`}'),
      'TidewellStage cards must use stable slot key={idx} so reshuffling does not unmount/reload media elements'
    );

    const evalScript = [
      "import { buildShowcase50, buildRandomInterleaved25, buildRoundedQuadClipPath } from './src/data/reelmarkCarouselData.ts';",
      "const all50 = buildShowcase50(101, 'all');",
      "const sampleA = buildRandomInterleaved25(101);",
      "const sampleB = buildRandomInterleaved25(202);",
      "const clip = buildRoundedQuadClipPath(170, 0, 280, 12, 310, 15);",
      "console.log(JSON.stringify({ all50, sampleA, sampleB, clip }));",
    ].join('\n');
    const stdout = execFileSync('npx', ['tsx', '-e', evalScript], {
      cwd: projectRoot,
      encoding: 'utf8',
    });
    const { all50, sampleA, sampleB, clip } = JSON.parse(stdout.trim());

    assert.equal(all50.length, 50, 'buildShowcase50 must provide all 50 experiences (25 Motion AI + 25 PinUI)');
    assert.equal(sampleA.length, 25, 'Must select exactly 25 experiences');
    assert.equal(sampleB.length, 25, 'Must select exactly 25 experiences');

    for (let i = 1; i < sampleA.length; i += 1) {
      assert.notEqual(
        sampleA[i].library,
        sampleA[i - 1].library,
        `Card ${i} (${sampleA[i].library}) must alternate with Card ${i - 1} (${sampleA[i - 1].library})`
      );
    }

    const orderA = sampleA.map((c) => c.id).join(',');
    const orderB = sampleB.map((c) => c.id).join(',');
    assert.notEqual(orderA, orderB, 'Different seeds must produce different randomized interleaved orderings');

    assert.ok(clip.startsWith("path('M ") && clip.endsWith("Z')"), 'buildRoundedQuadClipPath must return valid SVG path()');
  });
});
