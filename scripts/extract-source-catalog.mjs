import fs from 'node:fs';
import path from 'node:path';

const SOURCE_ARCHIVE_DIR = process.env.SOURCE_ARCHIVE_DIR || path.resolve(process.cwd(), '../sourceofknowledgforai/sources');
const OUTPUT_DIR = path.resolve(process.cwd(), 'src/data');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function readManifest(libName) {
  const p = path.join(SOURCE_ARCHIVE_DIR, libName, 'manifest.json');
  if (!fs.existsSync(p)) {
    throw new Error(`Manifest not found at ${p}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function cleanDescription(desc) {
  if (!desc) return '';
  return desc.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
}

const pinuiRaw = readManifest('pinui');
const threeuiRaw = readManifest('threeui');
const motionsitesRaw = readManifest('motionsites');
const lucianlabsRaw = readManifest('lucianlabs');
const codefrontsRaw = readManifest('codefronts');

const sourceCatalog = [];

for (const it of pinuiRaw) {
  sourceCatalog.push({
    id: it.id,
    title: it.title,
    sourceLibrary: 'pinui',
    category: it.category || 'Components',
    subcategory: it.kind || 'component',
    tags: [it.kind || 'component', 'react', 'tailwind', 'shadcn'],
    runtime: 'React, Tailwind CSS, TypeScript',
    style: 'Shadcn Modern',
    license: it.license || 'MIT',
    officialUrl: it.url || 'https://www.pinui.xyz',
    installCommand: it.install,
    archivePath: it.path.replace(/^\/+/, ''),
    description: cleanDescription(it.description || `${it.title} - Thanh phan giao dien React Tailwind tu thu vien Pin UI.`)
  });
}

const targetThreeCats = ['Three.js', 'Backgrounds', '3D Assets', 'Landing Pages', 'Hero', 'Sections', 'Buttons', 'UI Elements'];
let threeCount = 0;
for (const cat of targetThreeCats) {
  const matches = threeuiRaw.filter(x => x.category === cat);
  for (const it of matches) {
    if (threeCount >= 30) break;
    sourceCatalog.push({
      id: it.id,
      title: it.title,
      sourceLibrary: 'threeui',
      category: it.category || '3D',
      subcategory: it.subcategory || '',
      tags: ['three.js', 'webgl', '3d', 'interactive'],
      runtime: it.runtime || 'Three.js, WebGL',
      style: 'Interactive 3D / WebGL',
      license: it.license || 'ThreeUI Metadata',
      officialUrl: it.url || `https://threeui.com/${it.id}`,
      archivePath: it.path.replace(/^\/+/, ''),
      description: cleanDescription(it.description || `${it.title} - Hieu ung 3D WebGL thu vien ThreeUI.`)
    });
    threeCount++;
  }
  if (threeCount >= 30) break;
}

let motionCount = 0;
const prioritizedMotionCats = ['Hero', 'SaaS', 'Portfolio', 'Hero Section', '3D', 'Agency', 'Landing Page'];
for (const cat of prioritizedMotionCats) {
  const matches = motionsitesRaw.filter(x => x.category === cat);
  for (const it of matches) {
    if (motionCount >= 20) break;
    sourceCatalog.push({
      id: it.id,
      title: it.title,
      sourceLibrary: 'motionsites',
      category: it.category || 'Layout',
      subcategory: it.type || 'section',
      tags: ['motion', 'layout', 'landing-page', (it.type || 'section').toLowerCase()],
      runtime: 'HTML, CSS, GSAP / Framer Motion',
      style: 'Cinematic Motion Layout',
      license: 'MotionSites Creative Spec',
      officialUrl: `https://motionsites.com/prompts/${it.id}`,
      archivePath: it.path.replace(/^\/+/, ''),
      description: `Cau truc layout va dac ta hieu ung chuyen dong ${it.title} (${it.category}).`
    });
    motionCount++;
  }
  if (motionCount >= 20) break;
}

let lucianCount = 0;
const prioritizedLucianCats = ['Buttons', 'Commerce & Pricing', 'Sections & Content', 'Analytics & Data', 'Navigation', 'Forms & Inputs'];
for (const cat of prioritizedLucianCats) {
  const matches = lucianlabsRaw.filter(x => (x.category || '').toLowerCase().includes(cat.toLowerCase()));
  for (const it of matches) {
    if (lucianCount >= 15) break;
    sourceCatalog.push({
      id: it.id,
      title: it.title,
      sourceLibrary: 'lucianlabs',
      category: it.category || 'UI Element',
      subcategory: it.collection || 'interface',
      tags: Array.isArray(it.tags) ? it.tags : ['ui-token', 'interaction'],
      runtime: 'Vanilla HTML, CSS Custom Properties, JS',
      style: 'Glassmorphism & Micro-Interactions',
      license: 'MIT',
      officialUrl: it.url || `https://lucianlabs.dev/en/uxui-prompt/#${it.id}`,
      archivePath: (it.prompt_path || it.demo_path || '').replace(/^\/+/, ''),
      description: `Thanh phan giao dien chuan tokens ${it.title} voi micro-motion va styling dong bo.`
    });
    lucianCount++;
  }
  if (lucianCount >= 15) break;
}

let codefrontsCount = 0;
const prioritizedCodefrontCats = ['css-buttons', 'tailwind-css-buttons', 'css-toggles-switches', 'css-cards', 'css-modals'];
for (const cat of prioritizedCodefrontCats) {
  const matches = codefrontsRaw.filter(x => x.category === cat);
  for (const it of matches) {
    if (codefrontsCount >= 15) break;
    sourceCatalog.push({
      id: it.id,
      title: it.title,
      sourceLibrary: 'codefronts',
      category: it.category_name || it.category,
      subcategory: it.section_name || it.section,
      tags: ['css', 'ui-snippet', it.category],
      runtime: it.has_js ? 'HTML, CSS, JS' : 'HTML, Modern CSS',
      style: 'Pure CSS / Tailwind Snippet',
      license: 'Public Specification',
      officialUrl: it.url || 'https://codefronts.com',
      archivePath: it.path.replace(/^\/+/, ''),
      description: cleanDescription(it.description || `Mau thiet ke ${it.title} toi uu css thuan va tailwind.`)
    });
    codefrontsCount++;
  }
  if (codefrontsCount >= 15) break;
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'sourceCatalog.json'), JSON.stringify(sourceCatalog, null, 2), 'utf8');

const resourceLibrary = [
  {
    id: 'res-cursor-ide',
    title: 'Cursor AI IDE',
    group: 'AI Tools',
    category: 'IDE / Editor',
    tags: ['platform:Cursor', 'tech:TypeScript', 'level:Intermediate', 'cost:Freemium'],
    officialUrl: 'https://www.cursor.com',
    license: 'Proprietary',
    compatibility: 'Cross-platform (macOS, Linux, Windows)',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Trinh bien tap ma nguon tich hop mo hinh ngon ngu lon ho tro agentic coding va index codebase.'
  },
  {
    id: 'res-opencode-cli',
    title: 'OpenCode AI Terminal Agent',
    group: 'Dev Tools',
    category: 'Agent Orchestration',
    tags: ['platform:Terminal', 'tech:TypeScript', 'level:Advanced', 'cost:Free'],
    officialUrl: 'https://github.com/anomalyco/opencode',
    license: 'MIT',
    compatibility: 'Linux, macOS, POSIX Shell',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Moi truong dieu phoi tac tu thong minh da model voi quy trinh kiem soat ma nguon tu dong.'
  },
  {
    id: 'res-shadcn-ui',
    title: 'shadcn/ui Component Registry',
    group: 'UI/UX',
    category: 'Component Library',
    tags: ['platform:Web', 'tech:React', 'tech:Tailwind', 'tech:TypeScript', 'level:Intermediate', 'cost:Free'],
    officialUrl: 'https://ui.shadcn.com',
    license: 'MIT',
    compatibility: 'Next.js, Vite, Remix',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Tap hop component React tai su dung voi Tailwind CSS va Radix UI primitives khong bi rang buoc npm.'
  },
  {
    id: 'res-tailwind-css',
    title: 'Tailwind CSS v4',
    group: 'UI/UX',
    category: 'CSS Framework',
    tags: ['platform:Web', 'tech:Tailwind', 'level:Beginner', 'cost:Free'],
    officialUrl: 'https://tailwindcss.com',
    license: 'MIT',
    compatibility: 'Modern Browsers, PostCSS, Vite',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Framework CSS tien ich hieu nang cao voi engine Oxide viet bang Rust va CSS cascade layers.'
  },
  {
    id: 'res-threejs-core',
    title: 'Three.js 3D WebGL Engine',
    group: 'UI/UX',
    category: '3D Graphics',
    tags: ['platform:Web', 'tech:TypeScript', 'level:Advanced', 'cost:Free'],
    officialUrl: 'https://threejs.org',
    license: 'MIT',
    compatibility: 'WebGL 2.0, WebGPU',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Thu vien do hoa 3D tieu chuan cong nghiep cho trinh duyet voi he sinh thai shader va mesh phong phu.'
  },
  {
    id: 'res-framer-motion',
    title: 'Motion for React',
    group: 'UI/UX',
    category: 'Animation Library',
    tags: ['platform:Web', 'tech:React', 'tech:TypeScript', 'level:Intermediate', 'cost:Free'],
    officialUrl: 'https://motion.dev',
    license: 'MIT',
    compatibility: 'React 18, React 19',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Engine chuyen dong vat ly spring va layout animation muot ma danh cho he sinh thai React.'
  },
  {
    id: 'res-lucide-icons',
    title: 'Lucide Icons',
    group: 'UI/UX',
    category: 'Iconography',
    tags: ['platform:Web', 'tech:React', 'tech:TypeScript', 'level:Beginner', 'cost:Free'],
    officialUrl: 'https://lucide.dev',
    license: 'ISC',
    compatibility: 'Cross-framework',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Bo bieu tuong vector 24px toi gian, sac net, toi uu tree-shaking va tuy bien do day net ve.'
  },
  {
    id: 'res-system-prompts-directory',
    title: 'Production Agentic System Prompts',
    group: 'Prompts',
    category: 'System Instructions',
    tags: ['platform:Antigravity', 'platform:Cursor', 'level:Advanced', 'cost:Free'],
    officialUrl: 'https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI',
    license: 'MIT',
    compatibility: 'LLM Systems (Claude, GPT, Gemini)',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Kho prompt he thong dac ta nghiem ngat, loai bo tu cam slop va thiet lap co che zero-regression.'
  },
  {
    id: 'res-rag-prompt-templates',
    title: 'RAG Synthesis & Grounding Prompts',
    group: 'Prompts',
    category: 'Retrieval Prompts',
    tags: ['platform:Web', 'tech:Python', 'level:Intermediate', 'cost:Free'],
    officialUrl: 'https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI',
    license: 'Apache-2.0',
    compatibility: 'LangChain, LlamaIndex',
    lastVerified: '2026-11-19',
    status: 'verified_info',
    description: 'Mau prompt trich xuat thong tin theo cau truc json schema giu nguyen nguon bang chung xac thuc.'
  },
  {
    id: 'res-sourceofknowledge-repo',
    title: 'Source of Knowledge for AI Core Repo',
    group: 'GitHub Repositories',
    category: 'Knowledge Base',
    tags: ['platform:GitHub', 'tech:TypeScript', 'level:Intermediate', 'cost:Free'],
    officialUrl: 'https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI',
    license: 'MIT',
    compatibility: 'Git, Markdown Readers',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Kho luu tru 6,770 thanh phan UI tu 5 thu vien lon phục vụ agent AI truy van va tai tao giao dien.'
  },
  {
    id: 'res-nextjs-repo',
    title: 'Next.js Framework Repository',
    group: 'GitHub Repositories',
    category: 'Web Framework',
    tags: ['platform:GitHub', 'tech:Next.js', 'tech:React', 'tech:TypeScript', 'level:Advanced', 'cost:Free'],
    officialUrl: 'https://github.com/vercel/next.js',
    license: 'MIT',
    compatibility: 'Node.js 18+, Edge Runtime',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Khung phat trien web React ho tro Server Components, Server Actions va toi uu hoa tai nguyen tu dong.'
  },
  {
    id: 'res-clean-logic-skill',
    title: 'Clean Logic Core Skill Specification',
    group: 'Skills & Rules',
    category: 'Agent Skill',
    tags: ['platform:Antigravity', 'tech:TypeScript', 'level:Intermediate', 'cost:Free'],
    officialUrl: 'https://github.com/broamstuck-cybr/studio-skills',
    license: 'MIT',
    compatibility: 'Antigravity CLI, Agent Systems',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Bo tieu chuan lap trinh logic phong ve loi toi da, typing chat che va giu vung nguyen tac zero-regression.'
  },
  {
    id: 'res-uiux-promax-skill',
    title: 'UI/UX Pro Max Architecture Rules',
    group: 'Skills & Rules',
    category: 'Design Rule',
    tags: ['platform:Antigravity', 'tech:Tailwind', 'level:Advanced', 'cost:Free'],
    officialUrl: 'https://github.com/broamstuck-cybr/studio-skills',
    license: 'MIT',
    compatibility: 'Antigravity CLI',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Tap hop quy tac thiet ke giao dien thoi dai moi voi bang ma mau chuyen sau va he thong ty le luoi 8px.'
  },
  {
    id: 'res-web-standards-doc',
    title: 'MDN Web Docs Architecture',
    group: 'Documentation',
    category: 'Web Reference',
    tags: ['platform:Web', 'tech:TypeScript', 'level:Beginner', 'cost:Free'],
    officialUrl: 'https://developer.mozilla.org',
    license: 'CC-BY-SA-2.5',
    compatibility: 'All Modern Browsers',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Tai lieu tham chieu quy chuan web chinh thuc ve HTML, CSS, Web APIs va JavaScript tieu chuan.'
  },
  {
    id: 'res-react-docs',
    title: 'React Official Documentation',
    group: 'Documentation',
    category: 'Framework Docs',
    tags: ['platform:Web', 'tech:React', 'tech:TypeScript', 'level:Beginner', 'cost:Free'],
    officialUrl: 'https://react.dev',
    license: 'CC-BY-4.0',
    compatibility: 'React 19',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Huong dan lap trinh React voi kien truc huong hook, immutability va co che reconciliation.'
  },
  {
    id: 'res-fullstack-deep-dive',
    title: 'Full Stack Open Curriculum',
    group: 'Learning',
    category: 'Courseware',
    tags: ['platform:Web', 'tech:React', 'tech:TypeScript', 'level:Intermediate', 'cost:Free'],
    officialUrl: 'https://fullstackopen.com',
    license: 'CC-BY-NC-SA-4.0',
    compatibility: 'Modern Web Stack',
    lastVerified: '2026-11-19',
    status: 'verified_info',
    description: 'Khoa hoc lap trinh hien dai ve React, Redux, Node.js, GraphQL, TypeScript va kiem thu tu dong.'
  },
  {
    id: 'res-ai-engineering-handbook',
    title: 'AI Engineering Patterns Handbook',
    group: 'Learning',
    category: 'Reference Book',
    tags: ['platform:Web', 'tech:Python', 'level:Advanced', 'cost:Free'],
    officialUrl: 'https://github.com/broamstuck-cybr/ai-engineering',
    license: 'MIT',
    compatibility: 'Python 3.11+',
    lastVerified: '2026-11-19',
    status: 'verified_info',
    description: 'Cam nang thiet ke he thong agent, quan ly bo nho ngu canh va toi uu do tre suy luan LLM.'
  },
  {
    id: 'res-vite-bundler',
    title: 'Vite Next Generation Frontend Tooling',
    group: 'Dev Tools',
    category: 'Build Tool',
    tags: ['platform:Web', 'tech:TypeScript', 'level:Intermediate', 'cost:Free'],
    officialUrl: 'https://vitejs.dev',
    license: 'MIT',
    compatibility: 'Node.js 18+, Rollup, esbuild',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Trinh dung du an sieu toc dua tren native ES Modules va bo gom ma nguon cuc bo bang esbuild.'
  },
  {
    id: 'res-playwright-test',
    title: 'Playwright End-to-End Testing',
    group: 'Dev Tools',
    category: 'Testing Framework',
    tags: ['platform:Web', 'tech:TypeScript', 'level:Intermediate', 'cost:Free'],
    officialUrl: 'https://playwright.dev',
    license: 'Apache-2.0',
    compatibility: 'Chromium, Firefox, WebKit',
    lastVerified: '2026-11-19',
    status: 'verified_tested',
    description: 'Framework kiem thu tu dong hoa giao dien trinh duyet xuyen nen tang voi do tin cay cao.'
  }
];

fs.writeFileSync(path.join(OUTPUT_DIR, 'resourceLibrary.json'), JSON.stringify(resourceLibrary, null, 2), 'utf8');

const communitySeed = {
  channels: {
    qa: [
      {
        id: 'qa-01',
        title: 'Cach xu ly giam re-render khi render danh sach lon voi Tailwind va React?',
        author: {
          id: 'user-dev-01',
          name: 'Nguyen Van Minh',
          handle: 'minh_dev',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          role: 'Thanh vien'
        },
        category: 'React / Frontend',
        tags: ['react', 'performance', 'tailwind', 'virtualization'],
        createdAt: '2026-11-18T10:15:00Z',
        votes: 8,
        answersCount: 2,
        isAccepted: true,
        body: 'Toi dang gap van de khi hien thi danh sach tren 500 phan tu trong component Dashboard. Toc do cuon bi giat va FPS rot xuong 35. Co nen dung virtualization hay toi uu lai useMemo cho tung card?',
        acceptedAnswer: {
          id: 'ans-01',
          author: {
            id: 'user-senior-02',
            name: 'Tran Hoang Nam',
            handle: 'nam_core',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
            role: 'Kien truc su'
          },
          createdAt: '2026-11-18T11:00:00Z',
          votes: 11,
          content: 'Voi tren 500 phan tu, virtualization la giai phap chuan nhat. Ban co the su dung `@tanstack/react-virtual` de chi render cac DOM node nam trong viewport. Dong thoi, can kiem tra cac class CSS phuc tap nhu backdrop-blur tren cac card vi chung gay nang GPU khi cuon.'
        }
      },
      {
        id: 'qa-02',
        title: 'Cau hinh CSS Custom Properties nhu the nao de dong bo giua LucianLabs va Pin UI?',
        author: {
          id: 'user-dev-03',
          name: 'Le Quang Huy',
          handle: 'huy_ui',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
          role: 'UI Engineer'
        },
        category: 'UI/UX & Tokens',
        tags: ['css-tokens', 'lucianlabs', 'pinui', 'design-system'],
        createdAt: '2026-11-17T14:20:00Z',
        votes: 6,
        answersCount: 1,
        isAccepted: true,
        body: 'LucianLabs su dung quy uoc `--ux-*` cho motion va radius, trong khi Pin UI dua tren bien goc cua shadcn nhu `--primary`, `--radius`. Lam sao de map hai he thong nay ma khong bi xung dot?',
        acceptedAnswer: {
          id: 'ans-02',
          author: {
            id: 'user-senior-04',
            name: 'Pham Thi Huong',
            handle: 'huong_studio',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
            role: 'Design Technologist'
          },
          createdAt: '2026-11-17T15:10:00Z',
          votes: 7,
          content: 'Ban khai bao mot lop bridge tai `:root`. Vi du: `--ux-radius-md: var(--radius);` va `--ux-surface-1: hsl(var(--card));`. Khi do cac hieu ung micro-motion cua LucianLabs se tu dong ke thua ban sac thiet ke cua Pin UI.'
        }
      }
    ],
    showcase: [
      {
        id: 'sc-01',
        title: 'Liquid Glass Button Component with Spring Physics',
        author: {
          id: 'user-senior-04',
          name: 'Pham Thi Huong',
          handle: 'huong_studio',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          role: 'Design Technologist'
        },
        category: 'Components',
        tags: ['css', 'motion', 'glassmorphism'],
        createdAt: '2026-11-16T09:00:00Z',
        likes: 14,
        views: 280,
        demoSnippet: {
          html: '<button class="ux-liquid-btn"><span class="ux-btn-glow"></span><span class="ux-btn-label">Xac nhan giao dich</span></button>',
          css: '.ux-liquid-btn { position: relative; padding: 10px 22px; border-radius: 999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.18); backdrop-filter: blur(12px); color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; transition: transform 0.2s cubic-bezier(0.2,0.8,0.2,1); } .ux-liquid-btn:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.32); }'
        },
        description: 'Thanh phan nut bam chat lieu kinh long toi uu bo goc khong de lai vet mo hinh chu nhat, tich hop hieu ung phan quang nhe khi hover.'
      },
      {
        id: 'sc-02',
        title: 'Bento Grid Dashboard Card with Radial Spotlight',
        author: {
          id: 'user-senior-02',
          name: 'Tran Hoang Nam',
          handle: 'nam_core',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          role: 'Kien truc su'
        },
        category: 'Layouts',
        tags: ['bento', 'spotlight', 'dashboard'],
        createdAt: '2026-11-15T16:30:00Z',
        likes: 12,
        views: 215,
        demoSnippet: {
          html: '<div class="ff-spotlight-card"><div class="ff-card-header"><span class="ff-badge">Realtime</span><h4>Hieu nang he thong</h4></div><p class="ff-card-body">Tai nguyen CPU giu muc on dinh duoi 12%.</p></div>',
          css: '.ff-spotlight-card { padding: 24px; border-radius: 16px; background: #12141a; border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0; position: relative; overflow: hidden; } .ff-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(34,197,94,0.15); color: #4ade80; }'
        },
        description: 'Khoi the hien thong so dashboard theo phong cach bento toi gian, phan anh chinh xac chi so van hanh.'
      }
    ],
    drops: [
      {
        id: 'drop-01',
        title: 'F-FORUM Clean Logic Rule for Agent Workflows',
        author: {
          id: 'user-admin-00',
          name: 'Staff Architect',
          handle: 'sys_architect',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
          role: 'Dieu hanh'
        },
        category: 'Agent Rules',
        tags: ['antigravity', 'rules', 'clean-code', 'zero-defect'],
        createdAt: '2026-11-18T08:00:00Z',
        forks: 9,
        fileType: 'markdown',
        payload: '# Clean Logic Standard\n- Zero-Defect Typing: Khong su dung type any.\n- Defensive Boundary: Bat loi tai dau vao, khong nuot loi am tham.\n- Zero-Regression: Giu nguyen giao dien va logic cu dang hoat dong tot.'
      },
      {
        id: 'drop-02',
        title: 'Strict Tailwind Color Clamping Prompt',
        author: {
          id: 'user-senior-04',
          name: 'Pham Thi Huong',
          handle: 'huong_studio',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          role: 'Design Technologist'
        },
        category: 'Prompts',
        tags: ['tailwind', 'color-palette', 'anti-slop'],
        createdAt: '2026-11-17T11:45:00Z',
        forks: 5,
        fileType: 'text',
        payload: 'Khi tao giao dien, chi su dung toi da 2 mau nhan (amber/emerald), nen trung tinh den/xam toi (#0d1117, #161b22), khong dung mau tim AI hay gradient 7 sac cau vong.'
      }
    ],
    clubs: [
      {
        id: 'club-01',
        name: 'Frontend Performance & UI Systems',
        slug: 'frontend-perf',
        lead: 'Tran Hoang Nam',
        membersCount: 14,
        description: 'Chuyen de ve toi uu hoa Core Web Vitals, virtualization danh sach, va xay dung design system theo chuan token.',
        activeDossier: {
          projectTitle: 'Chuan hoa bo Design Tokens cho v3',
          handoverNotes: 'Da hoan tat mapping bien mau giua shadcn va lucianlabs. Tiep tuc kiem tra do phan giai tren 3 viewports.',
          nextMilestones: [
            'Hoan tat catalog data bridge',
            'Toi uu CSS custom properties',
            'Chay gate kiem thu'
          ]
        }
      },
      {
        id: 'club-02',
        name: 'AI Agent Protocols & Tooling',
        slug: 'agent-tooling',
        lead: 'Staff Architect',
        membersCount: 9,
        description: 'Nghien cuu va thu nghiem cac giao thuc dieu phoi tac tu da mo hinh, swarm task card, va anti-regression gate.',
        activeDossier: {
          projectTitle: 'Kiem soat quy trinh tien kiem v7.2',
          handoverNotes: 'Bo sung co che ask_question UI bat buoc truoc khi sua code muc 2 tro len.',
          nextMilestones: [
            'Tich hop danh sach to-do nguyen tu',
            'Dong bo log runs.jsonl',
            'Nghiem thu bang chung exit code 0'
          ]
        }
      }
    ]
  }
};

fs.writeFileSync(path.join(OUTPUT_DIR, 'communitySeed.json'), JSON.stringify(communitySeed, null, 2), 'utf8');

console.log('SUCCESS: Catalogs and seed datasets extracted.');
