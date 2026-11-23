import type { AttachedContextItem, ResourceItem } from '../../types/index';
import type { BroamstuckRepoShowcase } from '../../data/realShowcaseData';
import {
  GROUP_LABEL,
  formatCount,
  formatDate,
  rankedRepoContext,
  resourceContext,
  sanitizeBrandText,
  studioRepoContext,
  type RankedRepo,
} from './catalog';

export interface ExplainerProfile {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  originUrl: string;
  originLabel: string;
  licenseLabel: string;
  isSpdx: boolean;
  licenseUrl: string | null;
  statusLabel: string;
  statusKind: 'tested' | 'info' | 'repo';
  snapshotNote: string;
  botBlockedNote: string | null;
  summary: string;
  howItWorks: string[];
  steps: string[];
  installCommand: string;
  useCases: string[];
  contextItem: AttachedContextItem;
  metrics: Array<{ label: string; value: string }>;
}

const VERIFIED_SPDX = new Set([
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'GPL-2.0',
  'LGPL-3.0',
  'AGPL-3.0',
  'ISC',
  'BSD-3-Clause',
  'BSD-2-Clause',
  'CC0-1.0',
  'CC-BY-4.0',
  'CC-BY-SA-2.5',
  'CC-BY-SA-4.0',
  'CC-BY-NC-SA-4.0',
  'MPL-2.0',
  'Unlicense',
]);

export function isVerifiedSpdxLicense(license: string | undefined): boolean {
  if (!license) return false;
  return VERIFIED_SPDX.has(license.trim());
}

const OWNER_AUTHORS: Record<string, string> = {
  mattpocock: 'Matt Pocock (Chuyên gia TypeScript & AI Engineering)',
  obra: 'Jesse Vincent (@obra)',
  'affaan-m': 'Affaan M. (@affaan-m)',
  'multica-ai': 'Multica AI (hệ thống hóa ghi chú của Andrej Karpathy)',
  anomalyco: 'Anomaly Co (Đội ngũ OpenCode)',
  anthropics: 'Anthropic',
  DietrichGebert: 'Dietrich Gebert',
  addyosmani: 'Addy Osmani (Chrome Web Performance)',
  'shadcn-ui': 'shadcn & Cộng đồng Radix/Tailwind',
  'shadcn-labs': 'Rachit Thakur / Shadcn Labs',
  mrdoob: 'Ricardo Cabello (@mrdoob) & Cộng đồng Three.js',
  tailwindlabs: 'Adam Wathan & Tailwind Labs',
  vercel: 'Vercel Engineering',
  ollama: 'Ollama Team',
  'open-webui': 'Open WebUI Contributors',
  'ggml-org': 'Georgi Gerganov & ggml.org',
  'langchain-ai': 'LangChain AI',
  'vllm-project': 'vLLM Project (UC Berkeley SkyLab)',
  OpenHands: 'All Hands AI / OpenHands',
  modelcontextprotocol: 'Anthropic & Model Context Protocol Steering',
  ComposioHQ: 'Composio HQ',
  unslothai: 'Daniel Han & Michael Han (Unsloth AI)',
  juliangarnier: 'Julian Garnier',
  cline: 'Cline Bot Inc.',
  FoundationAgents: 'FoundationAgents (MetaGPT)',
  BerriAI: 'BerriAI (LiteLLM)',
  microsoft: 'Microsoft',
  crewAIInc: 'João Moura & CrewAI',
  hesreallyhim: 'hesreallyhim & Cộng đồng Claude Code',
  ChromeDevTools: 'Chrome DevTools Team (Google)',
  'aaif-goose': 'Block (Square) Open Source',
  DavidHDev: 'David Haz (@DavidHDev)',
  mudler: 'Ettore Di Giacinto (@mudler / LocalAI)',
  'Aider-AI': 'Paul Gauthier (Aider)',
  janhq: 'Jan HQ (Menlo Research)',
  PatrickJS: 'PatrickJS & Cộng đồng Cursor',
  motiondivision: 'Matt Perry (Motion)',
  greensock: 'GreenSock (GSAP)',
  pmndrs: 'Poimandres Collective',
  magicuidesign: 'Dillion Verma (Magic UI)',
  darkroomengineering: 'Darkroom Engineering',
  'broamstuck-cybr': 'Đội ngũ F-Forum',
  emilkowalski: 'Emil Kowalski',
  'tanstack': 'Tanner Linsley (TanStack)',
  TanStack: 'Tanner Linsley (TanStack)',
  'lucide-icons': 'Lucide Contributors',
  'radix-ui': 'WorkOS / Radix UI Team',
  storybookjs: 'Storybook Maintainers',
  'floating-ui': 'Atomiks & Floating UI Contributors',
  mantinedev: 'Vitaly Rtishchev (Mantine)',
  recharts: 'Recharts Group',
  tremorlabs: 'Tremor Labs',
  d3: 'Mike Bostock & Observable',
  withastro: 'Astro Technology Company',
  saadeghi: 'Pouya Saadeghi (daisyUI)',
  airbnb: 'Airbnb Engineering',
  'heroui-inc': 'HeroUI (trước đây là NextUI)',
  c15t: 'c15t Contributors',
  x1xhlol: 'x1xhlol & Cộng đồng AI Security Research',
  'dair-ai': 'DAIR.AI (Elvis Saravia)',
  openai: 'OpenAI',
  danielmiessler: 'Daniel Miessler',
  github: 'GitHub',
  Blazity: 'Blazity',
  firecrawl: 'Mendable / Firecrawl',
  goldbergyoni: 'Yoni Goldberg',
  upstash: 'Upstash (Context7)',
  alan2207: 'Alan Alickovic (@alan2207)',
  huggingface: 'Hugging Face',
  browserbase: 'Browserbase',
  'Comfy-Org': 'Comfy Org',
  'zed-industries': 'Nathan Sobo & Zed Industries',
  'letta-ai': 'Letta (UC Berkeley MemGPT)',
  triggerdotdev: 'Trigger.dev',
  'e2b-dev': 'E2B',
  inngest: 'Inngest',
  supabase: 'Supabase',
  'astral-sh': 'Charlie Marsh & Astral',
  vitejs: 'Evan You & Vite Core Team',
  'drizzle-team': 'Drizzle Team',
  biomejs: 'Biome Contributors',
  'vitest-dev': 'Anthony Fu & Vitest Team',
  'browser-use': 'Gregor Zunic & Magnus Müller (Browser Use)',
  continuedev: 'Continue Dev',
  RooCodeInc: 'Roo Code Inc.',
  'stackblitz-labs': 'StackBlitz Community (bolt.diy)',
  langgenius: 'LangGenius (Dify)',
  'n8n-io': 'n8n GmbH',
  FlowiseAI: 'FlowiseAI',
  'Mintplex-Labs': 'Mintplex Labs (AnythingLLM)',
};

const TOOL_AUTHORS: Record<string, string> = {
  'res-cursor-ide': 'Anysphere (Cursor Team)',
  'res-shadcn-ui': 'shadcn & Cộng đồng Radix/Tailwind',
  'res-tailwind-css': 'Adam Wathan & Tailwind Labs',
  'res-threejs-core': 'Ricardo Cabello (@mrdoob) & Cộng đồng Three.js',
  'res-framer-motion': 'Matt Perry (Motion)',
  'res-lucide-icons': 'Lucide Contributors',
  'res-web-standards-doc': 'Mozilla & Open Web Contributors (MDN)',
  'res-react-docs': 'Meta React Core Team',
  'res-fullstack-deep-dive': 'Đại học Helsinki & Cộng đồng Full Stack Open',
  'res-vite-bundler': 'Evan You & Vite Core Team',
  'res-playwright-test': 'Microsoft Playwright Team',
  'res-pinui-registry': 'Rachit Thakur / Shadcn Labs',
  'res-lucianlabs-tokens': 'Seokwoooo (LucianLabs)',
  'res-windsurf-ide': 'Codeium / Windsurf Team',
  'res-aider-chat': 'Paul Gauthier (Aider)',
  'res-continue-dev': 'Continue.dev Team',
  'res-goose-agent': 'Block Open Source',
  'res-v0-vercel': 'Vercel',
  'res-lovable-dev': 'Lovable (Anton Osika & Fabian Hedin)',
  'res-zed-ai': 'Zed Industries',
  'res-trae-ide': 'Trae AI Team',
  'res-ollama-local': 'Ollama Team',
  'res-lm-studio': 'Element Labs (LM Studio)',
  'res-open-webui': 'Open WebUI Contributors',
  'res-dify-platform': 'LangGenius (Dify)',
  'res-flowise-ai': 'FlowiseAI',
  'res-n8n-ai': 'n8n GmbH',
  'res-langsmith': 'LangChain AI',
  'res-langfuse': 'Langfuse Team',
  'res-promptfoo': 'Ian Webster & Promptfoo Team',
  'res-perplexity-search': 'Perplexity AI',
  'res-notebooklm': 'Google Labs (NotebookLM)',
  'res-anythingllm': 'Mintplex Labs',
  'res-github-copilot': 'GitHub & Microsoft',
};

const BOT_BLOCKED_DOMAINS = ['pinui.xyz', 'lovable.dev'];

function detectBotBlockedNote(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (BOT_BLOCKED_DOMAINS.some((d) => host.endsWith(d))) {
      return `Trang ${host} bật tường bảo vệ bot (HTTP 403 khi kiểm tra tự động); hãy bấm mở trực tiếp trên trình duyệt.`;
    }
  } catch {
    return null;
  }
  return null;
}

function inferAuthorFromUrl(url: string, fallback: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'github.com') {
      const owner = parsed.pathname.split('/').filter(Boolean)[0];
      if (owner && OWNER_AUTHORS[owner]) return OWNER_AUTHORS[owner];
      if (owner) return `@${owner} (GitHub)`;
    }
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return fallback;
  }
}

function buildInstallCommandForTool(item: ResourceItem): string {
  if (item.snippet && item.snippet.length < 180) {
    return item.snippet;
  }
  const url = item.officialUrl;
  if (url.includes('github.com/')) {
    const repoPath = url.split('github.com/')[1]?.split('#')[0]?.replace(/\/$/, '');
    if (item.id === 'res-anomalyco-opencode') return 'npm i -g opencode-ai && opencode';
    if (item.id === 'res-claude-code') return 'npm install -g @anthropic-ai/claude-code && claude';
    if (item.id === 'res-openai-codex-cli') return 'npm install -g @openai/codex && codex';
    if (item.id === 'res-gemini-cli') return 'npx @google/gemini-cli';
    if (item.id === 'res-mcp-inspector') return 'npx @modelcontextprotocol/inspector';
    if (repoPath) return `git clone https://github.com/${repoPath}.git`;
  }
  if (item.id === 'res-shadcn-ui') return 'npx shadcn@latest init';
  if (item.id === 'res-tailwind-css') return 'npm install tailwindcss @tailwindcss/vite';
  if (item.id === 'res-threejs-core') return 'npm install three @types/three';
  if (item.id === 'res-framer-motion') return 'npm install motion';
  if (item.id === 'res-lucide-icons') return 'npm install lucide-react';
  if (item.id === 'res-vite-bundler') return 'npm create vite@latest my-app -- --template react-ts';
  if (item.id === 'res-playwright-test') return 'npm init playwright@latest';
  if (item.id === 'res-ollama-local') return 'curl -fsSL https://ollama.com/install.sh | sh && ollama run qwen2.5-coder';
  if (item.id === 'res-aider-chat') return 'python -m pip install aider-install && aider-install';
  if (item.id === 'res-promptfoo') return 'npx promptfoo@latest init';
  if (item.id === 'res-pinui-registry') return 'npx shadcn@latest add "https://www.pinui.xyz/r/theme-switch.json"';
  return `Mở trang chính thức: ${url}`;
}

function buildInstallCommandForRepo(repo: RankedRepo): string {
  const full = repo.fullName;
  if (full === 'anomalyco/opencode') return 'npm i -g opencode-ai && opencode';
  if (full === 'anthropics/claude-code') return 'npm install -g @anthropic-ai/claude-code';
  if (full === 'openai/codex') return 'npm install -g @openai/codex';
  if (full === 'google-gemini/gemini-cli') return 'npx @google/gemini-cli';
  if (full === 'shadcn-ui/ui') return 'npx shadcn@latest init';
  if (full === 'mrdoob/three.js') return 'npm install three';
  if (full === 'tailwindlabs/tailwindcss') return 'npm install tailwindcss @tailwindcss/vite';
  if (full === 'motiondivision/motion') return 'npm install motion';
  if (full === 'ollama/ollama') return 'curl -fsSL https://ollama.com/install.sh | sh';
  if (full === 'astral-sh/uv') return 'curl -LsSf https://astral.sh/uv/install.sh | sh';
  if (full === 'vitejs/vite') return 'npm create vite@latest';
  if (full === 'vercel/next.js') return 'npx create-next-app@latest';
  if (full === 'microsoft/playwright') return 'npm init playwright@latest';
  return `git clone ${repo.htmlUrl}.git`;
}

function deriveToolGuide(item: ResourceItem): {
  howItWorks: string[];
  steps: string[];
  useCases: string[];
} {
  const desc = sanitizeBrandText(item.description);
  const group = item.group;

  if (group === 'AI Tools') {
    return {
      howItWorks: [
        desc,
        `Hoạt động trên môi trường ${item.compatibility}, kết nối trực tiếp mô hình AI với ngữ cảnh mã nguồn hoặc tài liệu cục bộ.`,
        `Giấy phép phát hành: ${item.license}. Người dùng kiểm soát quyền đọc/ghi tệp và lệnh thực thi theo từng bước.`,
      ],
      steps: [
        `Truy cập nguồn chính thức (${item.officialUrl}) để tải bản cài đặt hoặc xem tài liệu cấu hình.`,
        `Cài đặt theo lệnh gợi ý bên dưới và kết nối khóa API hoặc mô hình cục bộ (Ollama / LM Studio).`,
        `Mở thư mục dự án, đọc lại từng thay đổi (diff) và chạy kiểm thử trước khi lưu kết quả.`,
      ],
      useCases: [
        'Học sinh, sinh viên dựng nhanh đồ án web/AI và giải thích lỗi biên dịch ngay trong dự án.',
        'Lập trình viên tự động hóa tác vụ lặp lại như viết unit test, refactor và rà soát lỗ hổng.',
      ],
    };
  }

  if (group === 'UI/UX') {
    return {
      howItWorks: [
        desc,
        `Tối ưu cho ${item.compatibility}, giúp giữ thiết kế đồng nhất theo design tokens và giảm mã CSS lặp lại.`,
        `Phát hành dưới giấy phép ${item.license}, cho phép tích hợp trực tiếp vào mã nguồn dự án.`,
      ],
      steps: [
        'Cài đặt gói thư viện hoặc sao chép component từ registry vào thư mục dự án.',
        'Gắn các biến giao diện (:root tokens) phù hợp bảng màu sáng/tối của hệ thống.',
        'Kiểm tra hiển thị trên 3 khung nhìn 390px, 768px, 1440px và độ tương phản chữ >= 4.5:1.',
      ],
      useCases: [
        'Dựng giao diện đồ án môn học, landing page sự kiện CLB hoặc dashboard quản trị chuyên nghiệp.',
        'Học cách tổ chức component tái sử dụng, hiệu ứng GPU mượt mà và tiêu chuẩn accessibility.',
      ],
    };
  }

  if (group === 'Skills & Rules' || group === 'Prompts') {
    return {
      howItWorks: [
        desc,
        `Đóng gói thành các quy tắc/chỉ dẫn có cấu trúc cho ${item.compatibility} để agent tuân thủ chuẩn kiến trúc.`,
        'Giúp hạn chế hiện tượng sinh mã lan man (AI-slop), giữ nguyên phong cách code và bất biến hệ thống.',
      ],
      steps: [
        'Mở kho nguồn chính thức và chọn tệp SKILL.md, rule hoặc mẫu prompt đúng stack dự án.',
        'Đặt tệp vào thư mục cấu hình agent (.agents/, .cursor/rules/ hoặc system prompt) của repo.',
        'Chạy thử trên một tác vụ nhỏ và tinh chỉnh ràng buộc theo tiêu chuẩn thực tế của nhóm.',
      ],
      useCases: [
        'Chuẩn hóa quy trình làm việc nhóm khi nhiều thành viên cùng dùng AI coding assistant.',
        'Học tư duy viết đặc tả kỹ thuật rõ ràng trước khi yêu cầu AI sinh mã.',
      ],
    };
  }

  return {
    howItWorks: [
      desc,
      `Tương thích với ${item.compatibility}; được phân loại trong nhóm ${GROUP_LABEL[item.group]} (${item.category}).`,
      `Phát hành theo giấy phép ${item.license}, phục vụ tra cứu chuẩn kỹ thuật và kiểm chứng sản phẩm.`,
    ],
    steps: [
      `Mở liên kết chính thức (${item.officialUrl}) để xem tài liệu khởi tạo và yêu cầu phiên bản.`,
      'Chạy thử trên một nhánh hoặc thư mục mẫu để nắm cấu trúc API / lệnh cơ bản.',
      'Đính kèm vào F-Forum Workspace nếu muốn AI tham chiếu trực tiếp tài nguyên này khi viết mã.',
    ],
    useCases: [
      'Tra cứu tài liệu gốc chính thống thay vì phụ thuộc câu trả lời suy đoán.',
      'Tích hợp vào quy trình build, kiểm thử E2E hoặc quản lý chất lượng đồ án.',
    ],
  };
}

export function buildToolExplainer(item: ResourceItem): ExplainerProfile {
  const title = sanitizeBrandText(item.title);
  const author = TOOL_AUTHORS[item.id] ?? inferAuthorFromUrl(item.officialUrl, item.category);
  const isSpdx = isVerifiedSpdxLicense(item.license);
  const guide = deriveToolGuide(item);
  const isTested = item.status === 'verified_tested';

  return {
    id: item.id,
    title,
    subtitle: `${GROUP_LABEL[item.group]} · ${item.category}`,
    author,
    originUrl: item.officialUrl,
    originLabel: 'Mở trang chính thức',
    licenseLabel: item.license,
    isSpdx,
    licenseUrl: item.officialUrl.includes('github.com/')
      ? `${item.officialUrl.split('#')[0]}/blob/HEAD/LICENSE`
      : null,
    statusLabel: isTested ? 'Đã chạy thử' : 'Thông tin xác thực',
    statusKind: isTested ? 'tested' : 'info',
    snapshotNote: `Đồng bộ danh mục: ${formatDate(item.lastVerified)} (kiểm chứng URL thực tế)`,
    botBlockedNote: detectBotBlockedNote(item.officialUrl),
    summary: sanitizeBrandText(item.description),
    howItWorks: guide.howItWorks,
    steps: guide.steps,
    installCommand: buildInstallCommandForTool(item),
    useCases: guide.useCases,
    contextItem: resourceContext(item),
    metrics: [
      { label: 'Nhóm', value: GROUP_LABEL[item.group] },
      { label: 'Tương thích', value: item.compatibility },
      { label: 'Giấy phép', value: item.license },
    ],
  };
}

export function buildRankedRepoExplainer(
  repo: RankedRepo,
  snapshotIso: string
): ExplainerProfile {
  const desc = sanitizeBrandText(repo.description);
  const note = sanitizeBrandText(repo.aiNote);
  const author = OWNER_AUTHORS[repo.owner] ?? `@${repo.owner} (GitHub)`;
  const isSpdx = isVerifiedSpdxLicense(repo.license);
  const licenseUrl = `${repo.htmlUrl}/blob/HEAD/LICENSE`;

  return {
    id: `repo-${repo.id}`,
    title: repo.fullName,
    subtitle: `${repo.category} · ${repo.language || 'Đa ngữ'}`,
    author,
    originUrl: repo.htmlUrl,
    originLabel: 'Mở kho trên GitHub',
    licenseLabel: isSpdx ? repo.license : 'Xem LICENSE',
    isSpdx,
    licenseUrl,
    statusLabel: 'Đã xác thực GitHub API',
    statusKind: 'repo',
    snapshotNote: `Sao chụp tại ${formatDate(snapshotIso)} · cập nhật mã ${formatDate(repo.pushedAt)}`,
    botBlockedNote: null,
    summary: desc,
    howItWorks: [
      desc,
      note && note !== desc
        ? note
        : `Tổ chức mã nguồn bằng ${repo.language || 'đa ngôn ngữ'}, thuộc nhóm ${repo.category}.`,
      repo.topics.length > 0
        ? `Chủ đề kỹ thuật chính: ${repo.topics.slice(0, 6).join(', ')}.`
        : `Kho công khai trên GitHub với ${formatCount(repo.forks)} lượt fork từ cộng đồng.`,
    ],
    steps: [
      `Mở kho gốc tại ${repo.htmlUrl} để đọc README và kiểm tra tệp LICENSE trước khi tích hợp.`,
      `Sao chép lệnh cài đặt hoặc clone bên dưới để chạy thử cục bộ trên máy cá nhân.`,
      note || 'Đối chiếu cấu trúc thư mục ví dụ trước khi đưa vào dự án chính.',
    ],
    installCommand: buildInstallCommandForRepo(repo),
    useCases: [
      `Học kiến trúc thực chiến từ mã nguồn mở (${formatCount(repo.stars)} sao tại thời điểm chụp).`,
      'Đính kèm trực tiếp thông số repo vào Workspace để AI tham khảo API và quy ước chuẩn.',
    ],
    contextItem: rankedRepoContext(repo),
    metrics: [
      { label: `Sao (${formatDate(snapshotIso)})`, value: formatCount(repo.stars) },
      { label: 'Fork', value: formatCount(repo.forks) },
      { label: 'Ngôn ngữ', value: repo.language || 'Đa ngữ' },
    ],
  };
}

export function buildStudioRepoExplainer(repo: BroamstuckRepoShowcase): ExplainerProfile {
  const isSpdx = isVerifiedSpdxLicense(repo.license);
  return {
    id: repo.id,
    title: repo.fullName,
    subtitle: `Kho nội bộ Studio · ${repo.language}`,
    author: OWNER_AUTHORS['broamstuck-cybr'],
    originUrl: repo.htmlUrl,
    originLabel: 'Mở kho trên GitHub',
    licenseLabel: isSpdx ? repo.license : 'Xem LICENSE / NOTICE',
    isSpdx,
    licenseUrl: `${repo.htmlUrl}/blob/HEAD/LICENSE`,
    statusLabel: 'Kho nội bộ F-Forum',
    statusKind: 'repo',
    snapshotNote: `Cập nhật mã: ${formatDate(repo.pushedAt)}`,
    botBlockedNote: null,
    summary: sanitizeBrandText(repo.summaryVi),
    howItWorks: [
      sanitizeBrandText(repo.summaryVi),
      `Các đường dẫn trọng tâm trong kho: ${repo.keyPaths.join(', ')}.`,
      `Sử dụng trực tiếp cho hệ sinh thái F-Forum và bài tập thực hành của học sinh/sinh viên.`,
    ],
    steps: [
      `Clone kho mã bằng lệnh: git clone ${repo.htmlUrl}.git`,
      `Kiểm tra các tệp lõi: ${repo.keyPaths.slice(0, 3).join(', ')}.`,
      'Chạy thử hoặc đính kèm vào Workspace để tiếp tục tùy biến.',
    ],
    installCommand: `git clone ${repo.htmlUrl}.git`,
    useCases: [
      'Tham khảo cấu trúc thật của chính nền tảng F-Forum và kho học liệu liên quan.',
      'Học cách giải phẫu trang web, quản lý token giao diện và kiểm định tính toàn vẹn SHA256.',
    ],
    contextItem: studioRepoContext(repo),
    metrics: repo.metrics.slice(0, 3),
  };
}
