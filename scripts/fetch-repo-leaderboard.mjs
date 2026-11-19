import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const candidateList = [
  {
    repo: 'anomalyco/opencode',
    category: 'AI Agents & CLI',
    aiNote: 'Autonomous terminal-based coding assistant and developer workflow orchestrator.'
  },
  {
    repo: 'Significant-Gravitas/AutoGPT',
    category: 'AI Agents & CLI',
    aiNote: 'Reference architecture for autonomous multi-step agent execution loops.'
  },
  {
    repo: 'langchain-ai/langchain',
    category: 'AI Agents & CLI',
    aiNote: 'Extensive orchestration ecosystem for LLM application chains and tool bindings.'
  },
  {
    repo: 'OpenHands/OpenHands',
    category: 'AI Agents & CLI',
    aiNote: 'Containerized software development agent capable of autonomous code modification.'
  },
  {
    repo: 'cline/cline',
    category: 'AI Agents & CLI',
    aiNote: 'Autonomous coding agent extension for VS Code with terminal and browser execution capabilities.'
  },
  {
    repo: 'FoundationAgents/MetaGPT',
    category: 'AI Agents & CLI',
    aiNote: 'Multi-agent framework simulating standard software company roles and collaborative outputs.'
  },
  {
    repo: 'microsoft/autogen',
    category: 'AI Agents & CLI',
    aiNote: 'Framework for multi-agent conversational patterns and event-driven agent systems.'
  },
  {
    repo: 'crewAIInc/crewAI',
    category: 'AI Agents & CLI',
    aiNote: 'Framework for orchestrating role-playing autonomous AI agents with task delegation.'
  },
  {
    repo: 'aaif-goose/goose',
    category: 'AI Agents & CLI',
    aiNote: 'Open-source on-machine developer agent executing shell and editing operations.'
  },
  {
    repo: 'Aider-AI/aider',
    category: 'AI Agents & CLI',
    aiNote: 'Command-line pair programming tool integrating directly with Git repositories.'
  },
  {
    repo: 'mattpocock/skills',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Curated library of composable AI agent skill modules for software engineering workflows.'
  },
  {
    repo: 'obra/superpowers',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Modular skill set designed for extending agent capabilities and tool autonomy.'
  },
  {
    repo: 'affaan-m/ECC',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Collection of behavioral instructions and domain-specific engineering rules for coding assistants.'
  },
  {
    repo: 'multica-ai/andrej-karpathy-skills',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Synthesized deep learning heuristics and prompt patterns distilled from Karpathy technical writings.'
  },
  {
    repo: 'anthropics/skills',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Official reference skills and capability definitions for Claude agentic workflows.'
  },
  {
    repo: 'DietrichGebert/ponytail',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Pragmatic minimalist coding heuristics enforcing concise solutions and standard libraries.'
  },
  {
    repo: 'addyosmani/agent-skills',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Practical web performance and engineering skills tailored for AI developer agents.'
  },
  {
    repo: 'ComposioHQ/awesome-claude-skills',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Directory of enterprise tool connectors, MCP integration patterns, and Claude system skills.'
  },
  {
    repo: 'hesreallyhim/awesome-claude-code',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Community collection of configurations, workflows, and prompts for Claude Code CLI.'
  },
  {
    repo: 'PatrickJS/awesome-cursorrules',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Community repository of structured .cursorrules files for popular programming languages and frameworks.'
  },
  {
    repo: 'broamstuck-cybr/SOURCEOFKNOWLEDGFORAI',
    category: 'Skills, Rules & Prompts',
    aiNote: 'Verified knowledge base containing 6,770 UI components across 5 major design libraries and prompt catalog.'
  },
  {
    repo: 'shadcn-ui/ui',
    category: 'UI/UX & Motion',
    aiNote: 'Re-usable component architecture built with Radix UI primitives and Tailwind CSS.'
  },
  {
    repo: 'mrdoob/three.js',
    category: 'UI/UX & Motion',
    aiNote: 'Industry standard JavaScript 3D library rendering WebGL and WebGPU scenes.'
  },
  {
    repo: 'tailwindlabs/tailwindcss',
    category: 'UI/UX & Motion',
    aiNote: 'Utility-first CSS framework with Rust-based compilation engine and modern design tokens.'
  },
  {
    repo: 'juliangarnier/anime',
    category: 'UI/UX & Motion',
    aiNote: 'Lightweight JavaScript animation engine supporting CSS properties, SVG, and DOM attributes.'
  },
  {
    repo: 'DavidHDev/react-bits',
    category: 'UI/UX & Motion',
    aiNote: 'Curated collection of animated React components, background shaders, and interactive text effects.'
  },
  {
    repo: 'motiondivision/motion',
    category: 'UI/UX & Motion',
    aiNote: 'Production-ready spring physics and layout animation library for React and modern browsers.'
  },
  {
    repo: 'greensock/GSAP',
    category: 'UI/UX & Motion',
    aiNote: 'High-performance JavaScript animation platform with ScrollTrigger and SVG morphing.'
  },
  {
    repo: 'pmndrs/react-spring',
    category: 'UI/UX & Motion',
    aiNote: 'Spring-physics based animation library reflecting natural mechanical motion curves.'
  },
  {
    repo: 'magicuidesign/magicui',
    category: 'UI/UX & Motion',
    aiNote: 'UI component collection with animated borders, bento grids, and particle backgrounds.'
  },
  {
    repo: 'darkroomengineering/lenis',
    category: 'UI/UX & Motion',
    aiNote: 'Smooth scroll library providing frame-rate independent kinetic easing for web layouts.'
  },
  {
    repo: 'ollama/ollama',
    category: 'Local LLM & DevTools',
    aiNote: 'Standard runtime for downloading, configuring, and serving large language models locally.'
  },
  {
    repo: 'open-webui/open-webui',
    category: 'Local LLM & DevTools',
    aiNote: 'Extensible self-hosted web interface supporting Ollama and OpenAI-compatible inference backends.'
  },
  {
    repo: 'ggml-org/llama.cpp',
    category: 'Local LLM & DevTools',
    aiNote: 'Pure C/C++ inference engine optimized for CPU and GPU execution of quantized GGUF models.'
  },
  {
    repo: 'vllm-project/vllm',
    category: 'Local LLM & DevTools',
    aiNote: 'High-throughput LLM serving engine featuring PagedAttention and continuous batching.'
  },
  {
    repo: 'modelcontextprotocol/servers',
    category: 'Local LLM & DevTools',
    aiNote: 'Reference implementations of Model Context Protocol servers for standard developer tools.'
  },
  {
    repo: 'unslothai/unsloth',
    category: 'Local LLM & DevTools',
    aiNote: 'Memory-efficient fine-tuning framework providing significant speedups for open weights.'
  },
  {
    repo: 'BerriAI/litellm',
    category: 'Local LLM & DevTools',
    aiNote: 'Universal proxy translating between OpenAI format and 100+ LLM API providers with load balancing.'
  },
  {
    repo: 'ChromeDevTools/chrome-devtools-mcp',
    category: 'Local LLM & DevTools',
    aiNote: 'Model Context Protocol adapter connecting AI agents directly to Chrome DevTools debugging sessions.'
  },
  {
    repo: 'mudler/LocalAI',
    category: 'Local LLM & DevTools',
    aiNote: 'Self-hosted drop-in replacement REST API for OpenAI specifications running consumer hardware.'
  },
  {
    repo: 'janhq/jan',
    category: 'Local LLM & DevTools',
    aiNote: 'Open-source local AI desktop application supporting on-device model management and offline chat.'
  }
];

function sanitizeText(str) {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const verifiedItems = [];

for (const candidate of candidateList) {
  try {
    const raw = execSync(`gh api repos/${candidate.repo}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const meta = JSON.parse(raw);
    const fullName = meta.full_name || candidate.repo;
    const parts = fullName.split('/');
    const owner = parts[0];
    const name = parts[1];
    const id = `${owner}-${name}`.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const description = sanitizeText(meta.description || candidate.aiNote);
    const license = meta.license && meta.license.spdx_id && meta.license.spdx_id !== 'NOASSERTION'
      ? meta.license.spdx_id
      : 'Open Source';
    const topics = Array.isArray(meta.topics) ? meta.topics.slice(0, 8) : [];

    verifiedItems.push({
      id,
      fullName,
      name,
      owner,
      category: candidate.category,
      htmlUrl: meta.html_url || `https://github.com/${fullName}`,
      description,
      stars: typeof meta.stargazers_count === 'number' ? meta.stargazers_count : 0,
      forks: typeof meta.forks_count === 'number' ? meta.forks_count : 0,
      language: meta.language || 'Unknown',
      license,
      pushedAt: meta.pushed_at || new Date().toISOString(),
      topics,
      aiNote: sanitizeText(candidate.aiNote)
    });
  } catch (err) {
    process.stderr.write(`Failed to verify: ${candidate.repo}\n`);
  }
}

verifiedItems.sort((a, b) => b.stars - a.stars);

const output = {
  generatedAt: new Date().toISOString(),
  source: 'opencode-deepseek + github-api',
  items: verifiedItems
};

const targetPath = path.resolve(process.cwd(), 'src/data/repoLeaderboard.json');
fs.writeFileSync(targetPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

process.stdout.write(`Successfully verified and saved ${verifiedItems.length} repos.\n`);
