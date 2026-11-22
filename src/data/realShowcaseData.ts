export interface MarqueeShowcaseItem {
  id: string;
  title: string;
  source: 'motionsites' | 'pinui' | 'threeui' | 'sourceofknowledge';
  category: string;
  imageUrl: string;
  fallbackUrl: string;
  liveUrl: string;
}

export interface StackingProjectItem {
  id: string;
  indexLabel: string;
  category: string;
  title: string;
  subtitle: string;
  liveUrl: string;
  metrics: Array<{ label: string; value: string }>;
  images: [string, string, string];
  previewHtml?: string;
  previewCss?: string;
}

export interface BroamstuckRepoShowcase {
  id: string;
  fullName: string;
  name: string;
  htmlUrl: string;
  homepage?: string;
  stars: number;
  forks: number;
  language: string;
  license: string;
  pushedAt: string;
  summaryVi: string;
  metrics: Array<{ label: string; value: string }>;
  keyPaths: string[];
  interactiveSnippet: {
    label: string;
    html: string;
    css: string;
  };
}

export interface ShopifyChapterMetric {
  id: string;
  title: string;
  featureCount: number;
  heightPx: number;
  highlightFeature: string;
}

export interface ShopifyWinterTelemetry {
  sourceUrl: string;
  repoUrl: string;
  totalChapters: 12;
  totalUpdates: 199;
  totalLinks: 249;
  totalAssets: 682;
  bundleSizeMb: 124.3;
  pageHeightPx: 46413;
  chapters: ShopifyChapterMetric[];
}

export interface SourceKnowledgeCategoryStat {
  library: 'codefronts' | 'threeui' | 'lucianlabs' | 'motionsites' | 'pinui';
  label: string;
  count: number;
  extraLabel?: string;
  license: string;
  repoPath: string;
  officialUrl: string;
  previewUrl: string;
}

export interface SourceKnowledgeBreakdown {
  repoUrl: string;
  totalItems: 6770;
  libraries: SourceKnowledgeCategoryStat[];
}

const FALLBACK_COURSE_CARD =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png';
const FALLBACK_ISOMETRIC =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png';
const FALLBACK_LIQUID_GLASS =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png';

export const MARQUEE_ROW_1: MarqueeShowcaseItem[] = [
  {
    id: 'ms-space-voyage',
    title: 'Space Voyage',
    source: 'motionsites',
    category: 'Hero',
    imageUrl: 'https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif',
    fallbackUrl: FALLBACK_ISOMETRIC,
    liveUrl: 'https://motionsites.ai/sections#space-voyage',
  },
  {
    id: 'ms-codenest',
    title: 'CodeNest',
    source: 'motionsites',
    category: 'SaaS',
    imageUrl: 'https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif',
    fallbackUrl: FALLBACK_COURSE_CARD,
    liveUrl: 'https://motionsites.ai/sections#codenest',
  },
  {
    id: 'ms-vex-ventures',
    title: 'Vex Ventures',
    source: 'motionsites',
    category: 'Agency',
    imageUrl: 'https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif',
    fallbackUrl: FALLBACK_LIQUID_GLASS,
    liveUrl: 'https://motionsites.ai/sections#vex-ventures',
  },
  {
    id: 'ms-stellar-ai-v2',
    title: 'Stellar AI v2',
    source: 'motionsites',
    category: 'AI',
    imageUrl: 'https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif',
    fallbackUrl: FALLBACK_ISOMETRIC,
    liveUrl: 'https://motionsites.ai/sections#stellar-ai-v2',
  },
  {
    id: 'ms-asme',
    title: 'ASME Studio',
    source: 'motionsites',
    category: 'Portfolio',
    imageUrl: 'https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif',
    fallbackUrl: FALLBACK_COURSE_CARD,
    liveUrl: 'https://motionsites.ai/sections#asme',
  },
  {
    id: 'ms-transform-data',
    title: 'Transform Data',
    source: 'motionsites',
    category: 'Data',
    imageUrl: 'https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif',
    fallbackUrl: FALLBACK_ISOMETRIC,
    liveUrl: 'https://motionsites.ai/sections#transform-data',
  },
  {
    id: 'ms-vitara',
    title: 'Vitara',
    source: 'motionsites',
    category: 'Landing',
    imageUrl: 'https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif',
    fallbackUrl: FALLBACK_LIQUID_GLASS,
    liveUrl: 'https://motionsites.ai/sections#vitara',
  },
  {
    id: 'ms-terra',
    title: 'Terra',
    source: 'motionsites',
    category: '3D',
    imageUrl: 'https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif',
    fallbackUrl: FALLBACK_ISOMETRIC,
    liveUrl: 'https://motionsites.ai/sections#terra',
  },
  {
    id: 'ms-skyelite',
    title: 'SkyElite',
    source: 'motionsites',
    category: 'Travel',
    imageUrl: 'https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif',
    fallbackUrl: FALLBACK_COURSE_CARD,
    liveUrl: 'https://motionsites.ai/sections#skyelite',
  },
  {
    id: 'ms-aethera',
    title: 'Aethera',
    source: 'motionsites',
    category: 'Editorial',
    imageUrl: 'https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif',
    fallbackUrl: FALLBACK_LIQUID_GLASS,
    liveUrl: 'https://motionsites.ai/sections#aethera',
  },
  {
    id: 'ms-designpro',
    title: 'DesignPro',
    source: 'motionsites',
    category: 'Studio',
    imageUrl: 'https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif',
    fallbackUrl: FALLBACK_COURSE_CARD,
    liveUrl: 'https://motionsites.ai/sections#designpro',
  },
];

export const MARQUEE_ROW_2: MarqueeShowcaseItem[] = [
  {
    id: 'ms-stellar-ai',
    title: 'Stellar AI',
    source: 'motionsites',
    category: 'AI',
    imageUrl: 'https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif',
    fallbackUrl: FALLBACK_ISOMETRIC,
    liveUrl: 'https://motionsites.ai/sections#stellar-ai',
  },
  {
    id: 'ms-xportfolio',
    title: 'XPortfolio',
    source: 'motionsites',
    category: 'Portfolio',
    imageUrl: 'https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif',
    fallbackUrl: FALLBACK_COURSE_CARD,
    liveUrl: 'https://motionsites.ai/sections#xportfolio',
  },
  {
    id: 'ms-orbit-web3',
    title: 'Orbit Web3',
    source: 'motionsites',
    category: 'WebGL',
    imageUrl: 'https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif',
    fallbackUrl: FALLBACK_LIQUID_GLASS,
    liveUrl: 'https://motionsites.ai/sections#orbit-web3',
  },
  {
    id: 'ms-nexora',
    title: 'Nexora',
    source: 'motionsites',
    category: 'SaaS',
    imageUrl: 'https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif',
    fallbackUrl: FALLBACK_ISOMETRIC,
    liveUrl: 'https://motionsites.ai/sections#nexora',
  },
  {
    id: 'ms-evr-ventures',
    title: 'EVR Ventures',
    source: 'motionsites',
    category: 'Venture',
    imageUrl: 'https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif',
    fallbackUrl: FALLBACK_COURSE_CARD,
    liveUrl: 'https://motionsites.ai/sections#evr-ventures',
  },
  {
    id: 'ms-planet-orbit',
    title: 'Planet Orbit',
    source: 'motionsites',
    category: '3D',
    imageUrl: 'https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif',
    fallbackUrl: FALLBACK_ISOMETRIC,
    liveUrl: 'https://motionsites.ai/sections#planet-orbit',
  },
  {
    id: 'ms-new-era',
    title: 'New Era',
    source: 'motionsites',
    category: 'Editorial',
    imageUrl: 'https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif',
    fallbackUrl: FALLBACK_LIQUID_GLASS,
    liveUrl: 'https://motionsites.ai/sections#new-era',
  },
  {
    id: 'ms-wealth',
    title: 'Wealth',
    source: 'motionsites',
    category: 'Fintech',
    imageUrl: 'https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif',
    fallbackUrl: FALLBACK_COURSE_CARD,
    liveUrl: 'https://motionsites.ai/sections#wealth',
  },
  {
    id: 'ms-luminex',
    title: 'Luminex',
    source: 'motionsites',
    category: 'Lighting',
    imageUrl: 'https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif',
    fallbackUrl: FALLBACK_LIQUID_GLASS,
    liveUrl: 'https://motionsites.ai/sections#luminex',
  },
  {
    id: 'sok-liquid-glass',
    title: 'Nút kính lỏng',
    source: 'sourceofknowledge',
    category: 'Interface',
    imageUrl: FALLBACK_LIQUID_GLASS,
    fallbackUrl: 'https://threeui.com/social/pages/three-js/app-orbit.jpg',
    liveUrl: 'https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI',
  },
];

export const STACKING_PROJECTS: StackingProjectItem[] = [
  {
    id: 'stack-sok',
    indexLabel: '01',
    category: 'Kho Tri Thức',
    title: 'SOURCEOFKNOWLEDGFORAI',
    subtitle:
      'Kho lưu trữ đa thư viện chuẩn hóa các thành phần tương tác, bố cục, chuyển động và không gian 3D.',
    liveUrl: 'https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI',
    metrics: [
      { label: 'Thư viện', value: '6' },
      { label: 'Chủ đề', value: 'Đa nền tảng' },
      { label: 'Mã nguồn', value: 'Mở' },
    ],
    images: [FALLBACK_COURSE_CARD, FALLBACK_ISOMETRIC, FALLBACK_LIQUID_GLASS],
    previewHtml:
      '<div class="sok-card"><span class="sok-tag">KHO TÀI NGUYÊN</span><h3>Kiến trúc Đa Thư viện</h3><p>Tương tác · Bố cục · Hiệu ứng · Chuyển động · Không gian 3D · Nền &amp; Lớp</p></div>',
    previewCss:
      'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090a0d;color:#f4f1ea;font-family:system-ui,sans-serif}.sok-card{padding:24px;border-radius:20px;border:1px solid rgba(200,155,84,.36);background:#141720;max-width:340px}.sok-tag{font-size:11px;letter-spacing:.12em;color:#c89b54}.sok-card h3{margin:10px 0 8px;font-size:18px}.sok-card p{margin:0;font-size:13px;color:#adb3bf;line-height:1.6}',
  },
  {
    id: 'stack-shopify-winter',
    indexLabel: '02',
    category: 'Giải Phẫu Hệ Thống',
    title: 'Shopify Winter Reverser Engine',
    subtitle:
      'Bản giải phẫu kiến trúc cuộn 12 chương của Shopify Winter Editions với hệ thống biến --st-* và 682 tài nguyên gốc.',
    liveUrl: 'https://github.com/broamstuck-cybr/shoptify-winter-reverser-engine',
    metrics: [
      { label: 'Chương', value: '12' },
      { label: 'Cập nhật', value: '199' },
      { label: 'Tài nguyên', value: '682' },
      { label: 'Chiều cao', value: '46.413 px' },
    ],
    images: [
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055344_5eff02e0-87a5-41ce-b64f-eb08da8f33db.png&w=1280&q=85',
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055431_11d841fd-8b41-46a5-82e4-b04f2407a7d8.png&w=1280&q=85',
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055451_e317bf2d-28d4-48cc-86b0-6f72f25b6327.png&w=1280&q=85',
    ],
    previewHtml:
      '<div class="st-sheet"><span class="st-eyebrow">WINTER EDITION · 12 CHƯƠNG</span><h3>--st-paper &amp; --st-ink</h3><p>199 tính năng · 249 liên kết · 124.3 MB gói tài sản</p></div>',
    previewCss:
      'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f7ee;color:#292919;font-family:Georgia,serif}.st-sheet{padding:28px;border:1px solid rgba(41,41,25,.2);border-radius:12px;max-width:340px}.st-eyebrow{font-family:monospace;font-size:11px;color:#ea1360;letter-spacing:.1em}.st-sheet h3{margin:10px 0 8px;font-size:22px}.st-sheet p{margin:0;font-size:13px;color:#4c4c3d}',
  },
  {
    id: 'stack-pinui-threeui',
    indexLabel: '03',
    category: 'Vật Lý Giao Diện',
    title: 'Tương tác · Không gian 3D · Hiệu ứng',
    subtitle:
      'Kết hợp chuyển động lò xo, cảnh không gian 3D và vi tương tác vào một hệ thành phần thống nhất.',
    liveUrl: '',
    metrics: [
      { label: 'Tương tác', value: '41' },
      { label: 'Không gian 3D', value: '961' },
      { label: 'Hiệu ứng', value: '400' },
    ],
    images: [
      'https://www.pinui.xyz/clips/thumb/theme-switch.webp',
      'https://www.pinui.xyz/clips/thumb/magnify.webp',
      'https://threeui.com/social/pages/3d-assets/apple-devices.jpg',
    ],
  },
];

export const SHOPIFY_CHAPTER_TELEMETRY: ShopifyWinterTelemetry = {
  sourceUrl: 'https://www.shopify.com/editions/winter2026',
  repoUrl: 'https://github.com/broamstuck-cybr/shoptify-winter-reverser-engine',
  totalChapters: 12,
  totalUpdates: 199,
  totalLinks: 249,
  totalAssets: 682,
  bundleSizeMb: 124.3,
  pageHeightPx: 46413,
  chapters: [
    {
      id: 'sidekick',
      title: 'Sidekick',
      featureCount: 19,
      heightPx: 7946,
      highlightFeature: 'Smart suggestions',
    },
    {
      id: 'agentic',
      title: 'Agentic',
      featureCount: 2,
      heightPx: 2326,
      highlightFeature: 'Shopify Agentic Storefronts',
    },
    {
      id: 'online',
      title: 'Online',
      featureCount: 23,
      heightPx: 5232,
      highlightFeature: 'Test and time your launches with Rollouts',
    },
    {
      id: 'retail',
      title: 'Retail',
      featureCount: 17,
      heightPx: 5007,
      highlightFeature: 'Not your standard hub',
    },
    {
      id: 'marketing',
      title: 'Marketing',
      featureCount: 13,
      heightPx: 3675,
      highlightFeature: 'Shopify Product Network',
    },
    {
      id: 'checkout',
      title: 'Checkout',
      featureCount: 10,
      heightPx: 1916,
      highlightFeature: 'Personalized Shop button',
    },
    {
      id: 'operations',
      title: 'Operations',
      featureCount: 22,
      heightPx: 2636,
      highlightFeature: 'Flexible inventory transfers',
    },
    {
      id: 'shop-app',
      title: 'Shop app',
      featureCount: 6,
      heightPx: 2079,
      highlightFeature: 'Dynamic storefronts',
    },
    {
      id: 'b2b',
      title: 'B2B',
      featureCount: 14,
      heightPx: 2586,
      highlightFeature: 'Shopify Collective available globally',
    },
    {
      id: 'finance',
      title: 'Finance',
      featureCount: 12,
      heightPx: 2145,
      highlightFeature: 'Continuous funding with the Shopify Capital flex account',
    },
    {
      id: 'shipping',
      title: 'Shipping',
      featureCount: 7,
      heightPx: 1949,
      highlightFeature: 'FedEx return labels',
    },
    {
      id: 'developer',
      title: 'Developer',
      featureCount: 54,
      heightPx: 7836,
      highlightFeature: 'Build commerce agents',
    },
  ],
};

export const SOURCE_KNOWLEDGE_BREAKDOWN: SourceKnowledgeBreakdown = {
  repoUrl: 'https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI',
  totalItems: 6770,
  libraries: [
    {
      library: 'codefronts',
      label: 'Bố cục',
      count: 5047,
      extraLabel: '6 nhóm UI & CSS thuần',
      license: 'Public Spec',
      repoPath: 'sources/codefronts/',
      officialUrl: '',
      previewUrl: FALLBACK_COURSE_CARD,
    },
    {
      library: 'threeui',
      label: 'Không gian 3D',
      count: 961,
      extraLabel: '1.485 thẻ WebGL & 3D',
      license: 'Catalogue Metadata',
      repoPath: 'sources/threeui/',
      officialUrl: '',
      previewUrl: 'https://threeui.com/social/pages/3d-assets/apple-devices.jpg',
    },
    {
      library: 'lucianlabs',
      label: 'Hiệu ứng',
      count: 400,
      extraLabel: '200 interface · 200 motion',
      license: 'MIT',
      repoPath: 'sources/lucianlabs/',
      officialUrl: '',
      previewUrl: FALLBACK_LIQUID_GLASS,
    },
    {
      library: 'motionsites',
      label: 'Chuyển động',
      count: 321,
      extraLabel: '20+ bản chạy thử',
      license: 'Creative Spec',
      repoPath: 'sources/motionsites/',
      officialUrl: '',
      previewUrl: 'https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif',
    },
    {
      library: 'pinui',
      label: 'Tương tác',
      count: 41,
      extraLabel: '30 components · 11 blocx',
      license: 'MIT',
      repoPath: 'sources/pinui/',
      officialUrl: '',
      previewUrl: 'https://www.pinui.xyz/clips/thumb/prompt-composer.webp',
    },
  ],
};

export const BROAMSTUCK_REPOS: BroamstuckRepoShowcase[] = [
  {
    id: 'repo-sourceofknowledge',
    fullName: 'broamstuck-cybr/SOURCEOFKNOWLEDGFORAI',
    name: 'SOURCEOFKNOWLEDGFORAI',
    htmlUrl: 'https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI',
    stars: 2,
    forks: 0,
    language: 'HTML',
    license: 'Open Source',
    pushedAt: '2026-11-19T08:38:50Z',
    summaryVi:
      'Kho tri thức giao diện hợp nhất các thành phần thực chiến cho cộng đồng dựng web hiện đại.',
    metrics: [
      { label: 'Thư viện', value: '6' },
      { label: 'Bố cục', value: '5.047' },
      { label: 'Không gian 3D', value: '961' },
      { label: 'Hiệu ứng', value: '400' },
    ],
    keyPaths: ['catalog.json', 'sources/lucianlabs/tokens.css', 'assets/previews/'],
    interactiveSnippet: {
      label: 'Nút kính lỏng',
      html: '<div class="stage"><button class="glass-cta" type="button">Khám phá mẫu</button></div>',
      css: 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090a0d;font-family:system-ui,sans-serif}.glass-cta{padding:14px 28px;border-radius:999px;border:1px solid rgba(200,155,84,.45);background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(200,155,84,.16));color:#f4f1ea;font-size:14px;font-weight:500;cursor:pointer;backdrop-filter:blur(14px)}',
    },
  },
  {
    id: 'repo-shopify-winter',
    fullName: 'broamstuck-cybr/shoptify-winter-reverser-engine',
    name: 'shoptify-winter-reverser-engine',
    htmlUrl: 'https://github.com/broamstuck-cybr/shoptify-winter-reverser-engine',
    stars: 0,
    forks: 0,
    language: 'HTML',
    license: 'Open Source',
    pushedAt: '2026-11-18T03:04:01Z',
    summaryVi:
      'Hệ thống giải phẫu toàn văn Shopify Winter Edition: 12 chương, 199 cập nhật, 682 tài nguyên (124.3 MB) và 46.413 px chiều sâu.',
    metrics: [
      { label: 'Chương', value: '12' },
      { label: 'Tính năng', value: '199' },
      { label: 'Tài nguyên', value: '682' },
      { label: 'Chiều cao', value: '46.413 px' },
    ],
    keyPaths: [
      'docs/01-teardown.md',
      'snapshot/page-content.json',
      'src/shoptify-tokens.css',
      'src/components.css',
    ],
    interactiveSnippet: {
      label: 'Thẻ biến --st-* Shopify Winter',
      html: '<article class="st-card"><div class="st-kicker">CHƯƠNG 01 · SIDEKICK</div><h2>19 cập nhật · 7.946 px</h2><p>Hệ thống giấy ấm #f7f7ee, mực #292919 và nhịp cuộn tuyến tính.</p></article>',
      css: 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f7ee;color:#292919;font-family:Georgia,serif}.st-card{max-width:340px;padding:28px;border:1px solid rgba(41,41,25,.24);border-radius:10px;background:#efeee2}.st-kicker{font-family:monospace;font-size:11px;letter-spacing:.12em;color:#ea1360}.st-card h2{margin:10px 0 8px;font-size:24px;font-weight:600}.st-card p{margin:0;font-size:14px;color:#4c4c3d;line-height:1.55}',
    },
  },
  {
    id: 'repo-f-forum',
    fullName: 'broamstuck-cybr/f-forum',
    name: 'f-forum',
    htmlUrl: 'https://github.com/broamstuck-cybr/f-forum',
    homepage: 'https://f-forum.vercel.app',
    stars: 2,
    forks: 0,
    language: 'HTML',
    license: 'Open Source',
    pushedAt: '2026-11-18T03:16:00Z',
    summaryVi:
      'Nền tảng cộng đồng học thuật và dựng giao diện trực tiếp dành cho sinh viên, giảng viên và lập trình viên phản biện.',
    metrics: [
      { label: 'Stack', value: 'React 19' },
      { label: 'CSS', value: 'Tailwind 4' },
      { label: 'Triển khai', value: 'Vercel' },
    ],
    keyPaths: ['package.json', 'src/App.tsx', 'vercel.json'],
    interactiveSnippet: {
      label: 'Huy hiệu F-Forum Live View',
      html: '<div class="ff-pill"><span class="ff-dot"></span><span>F-Forum · Live View</span></div>',
      css: 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090a0d;font-family:system-ui,sans-serif}.ff-pill{display:inline-flex;align-items:center;gap:10px;padding:12px 20px;border-radius:999px;border:1px solid rgba(200,155,84,.4);background:#141720;color:#f4f1ea;font-size:13px}.ff-dot{width:8px;height:8px;border-radius:999px;background:#34d399}',
    },
  },
  {
    id: 'repo-edunext-fe',
    fullName: 'broamstuck-cybr/Edunext_fe',
    name: 'Edunext_fe',
    htmlUrl: 'https://github.com/broamstuck-cybr/Edunext_fe',
    stars: 3,
    forks: 0,
    language: 'JavaScript',
    license: 'Open Source',
    pushedAt: '2026-11-18T06:35:58Z',
    summaryVi:
      'Bộ userscript hỗ trợ học tập và tự động hóa thao tác trên Edunext kèm danh mục kiểm định SHA256.',
    metrics: [
      { label: 'Sao', value: '3' },
      { label: 'Ngôn ngữ', value: 'JavaScript' },
      { label: 'Kiểm định', value: 'SHA256' },
    ],
    keyPaths: ['EDUNEXT_BAS.user.js', 'EDUNEXT_BAS.console.js', 'SHA256SUMS.txt'],
    interactiveSnippet: {
      label: 'Huy hiệu kiểm định SHA256',
      html: '<div class="chk"><strong>EDUNEXT_BAS v1.1.3</strong><span>Đã kiểm định SHA256</span></div>',
      css: 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090a0d;color:#f4f1ea;font-family:monospace}.chk{display:flex;flex-direction:column;gap:6px;padding:18px 22px;border-radius:12px;border:1px solid rgba(52,211,153,.35);background:#0f1117}.chk span{font-size:12px;color:#34d399}',
    },
  },
  {
    id: 'repo-edunext-legacy',
    fullName: 'broamstuck-cybr/edunext-legacy',
    name: 'edunext-legacy',
    htmlUrl: 'https://github.com/broamstuck-cybr/edunext-legacy',
    stars: 6,
    forks: 0,
    language: 'JavaScript',
    license: 'Open Source',
    pushedAt: '2026-11-18T02:56:54Z',
    summaryVi:
      'Kho lưu trữ các phiên bản mở rộng trình duyệt Edunext cho cộng đồng sinh viên.',
    metrics: [
      { label: 'Sao', value: '6' },
      { label: 'Ngôn ngữ', value: 'JavaScript' },
    ],
    keyPaths: ['edunext_ULTRA.user.js', 'eDuNeXt_FoRk_liteV1.0.7.js'],
    interactiveSnippet: {
      label: 'Thẻ mô-đun lưu trữ',
      html: '<div class="leg"><h3>edunext-legacy</h3><p>6 sao · Kho lưu trữ kịch bản trình duyệt</p></div>',
      css: 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090a0d;color:#f4f1ea;font-family:system-ui,sans-serif}.leg{padding:20px 24px;border-radius:14px;border:1px solid rgba(244,241,234,.14);background:#141720}.leg h3{margin:0 0 6px;font-size:16px}.leg p{margin:0;font-size:12px;color:#adb3bf}',
    },
  },
  {
    id: 'repo-resourcepack',
    fullName: 'broamstuck-cybr/resourcepack',
    name: 'resourcepack',
    htmlUrl: 'https://github.com/broamstuck-cybr/resourcepack',
    stars: 1,
    forks: 0,
    language: 'Unknown',
    license: 'Open Source',
    pushedAt: '2026-11-18T02:55:49Z',
    summaryVi: 'Tổng hợp gói học liệu, ngân hàng câu hỏi và tài nguyên tham khảo cho sinh viên.',
    metrics: [
      { label: 'Sao', value: '1' },
      { label: 'Gói', value: '4' },
    ],
    keyPaths: ['demo_resourcepack_v1.zip', 'resourcepack_v1.zip', 'edunext_bank/'],
    interactiveSnippet: {
      label: 'Tóm tắt gói học liệu',
      html: '<div class="rp"><strong>resourcepack_v1</strong><span>edunext_bank · kho học liệu</span></div>',
      css: 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#090a0d;color:#f4f1ea;font-family:monospace}.rp{display:flex;flex-direction:column;gap:4px;padding:18px 22px;border-radius:12px;border:1px solid rgba(244,241,234,.15);background:#141720}.rp span{font-size:12px;color:#c89b54}',
    },
  },
  {
    id: 'repo-socratic',
    fullName: 'broamstuck-cybr/Socratic',
    name: 'Socratic',
    htmlUrl: 'https://github.com/broamstuck-cybr/Socratic',
    stars: 0,
    forks: 0,
    language: 'Markdown',
    license: 'Open Source',
    pushedAt: '2026-11-18T02:55:29Z',
    summaryVi: 'Nguyên mẫu giao diện đối thoại phản biện tối giản theo phương pháp Socratic.',
    metrics: [
      { label: 'Chế độ', value: 'Phản biện' },
      { label: 'Cấu trúc', value: 'Tối giản' },
    ],
    keyPaths: ['README.md'],
    interactiveSnippet: {
      label: 'Thẻ câu hỏi Socratic',
      html: '<blockquote class="soc">“Đặt câu hỏi đúng trước khi viết dòng mã đầu tiên.”</blockquote>',
      css: 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f5f0;color:#141413;font-family:Georgia,serif}.soc{max-width:320px;margin:0;padding:24px;border-left:2px solid #9a6e28;font-size:18px;font-style:italic;line-height:1.5}',
    },
  },
];
