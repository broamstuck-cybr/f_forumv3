import type {
  ProjectSetupBundle,
  ProjectSetupTarget,
  WorkspaceProject,
} from '../types/index';

export function generateProjectSetupBundle(
  project: WorkspaceProject,
  target: ProjectSetupTarget
): ProjectSetupBundle {
  const targetLabel = target === 'antigravity' ? 'Antigravity IDE' : 'Cursor AI IDE';
  const fileManifest = project.files
    .map((f) => `- \`${f.path}\` (${f.language}): ${f.summary || 'Workspace source artifact'}`)
    .join('\n');
  const attachedSummary =
    project.attachedItems.length > 0
      ? project.attachedItems
          .map((item) => `- [${item.kind.toUpperCase()}] ${item.title}: ${item.summary}`)
          .join('\n')
      : '- Standard F-FORUM v3 Spatial Token Set';

  const readmeMd = [
    `# ${project.name}`,
    '',
    project.description || 'Synthesized multi-file web artifact exported from F-FORUM v3 Arena Workspace.',
    '',
    '## Architecture & Files',
    fileManifest,
    '',
    '## Attached Source of Knowledge Context',
    attachedSummary,
    '',
    '## Local Development',
    '1. Open `index.html` in a local static server (`npx serve .` or Vite).',
    '2. Review `RULES.md`, `SKILLS.md`, `TASKS.md`, and `PROJECT_CONTEXT.md` before running agentic edits.',
  ].join('\n');

  const rulesMd = [
    `# Agent Execution Rules (${targetLabel})`,
    '',
    '## Core Guardrails',
    '- Preserve existing working layouts, semantic HTML5 landmarks, and CSS custom property tokens.',
    '- Maintain an 8px spatial grid rhythm and verify responsive behavior across 390px, 768px, and 1440px viewports.',
    '- Never hardcode API keys, session secrets, or local filesystem paths inside source files.',
    '- Do not introduce emojis, generic marketing badges, or unrequested wrapper abstractions.',
    '- Run static checks (HTML structure, JavaScript syntax, internal links, secret scan) after every modification.',
  ].join('\n');

  const skillsMd = [
    `# Specialized Skills Reference (${targetLabel})`,
    '',
    '## Active Design & Logic Cartridges',
    '1. **UI/UX Spatial System**: Asymmetric split layouts, high-contrast typography, and token-driven surfaces.',
    '2. **Clean Logic Core**: Strict input validation at boundaries, deterministic state transitions, and zero silent failures.',
    '3. **Zero-Leak Release Hygiene**: Secret scanning prior to archive export or repository commit.',
  ].join('\n');

  const tasksMd = [
    `# Atomic Implementation Checklist — ${project.name}`,
    '',
    '- [x] Step 1.1: Initialize HTML5 semantic entry (`index.html`), token stylesheet (`styles.css`), and runtime logic (`app.js`).',
    '- [x] Step 1.2: Attach curated blueprints and templates from F-FORUM v3 Explore Library.',
    '- [x] Step 1.3: Execute automated static checks and secret audit in Arena Workspace.',
    '- [ ] Step 2.1: Extend interactive states and bind domain API endpoints.',
    '- [ ] Step 2.2: Verify multi-viewport rendering (390px, 768px, 1440px) with zero console errors.',
  ].join('\n');

  const projectContextMd = [
    `# Project Context Dossier — ${project.name}`,
    '',
    `- **Project ID**: \`${project.id}\``,
    `- **Target Environment**: ${targetLabel}`,
    `- **Generated At**: ${new Date().toISOString()}`,
    `- **Checks Status**: ${project.checksReport ? project.checksReport.overallStatus.toUpperCase() : 'PENDING'}`,
    '',
    '## Attached Explore References',
    attachedSummary,
    '',
    '## Recent Prompt History',
    project.messages.length > 0
      ? project.messages
          .slice(-6)
          .map((m) => `- **${m.role.toUpperCase()}** (${m.createdAt}): ${m.content}`)
          .join('\n')
      : '- Initial workspace baseline.',
  ].join('\n');

  return {
    target,
    files: [
      { path: 'README.md', content: readmeMd },
      { path: 'RULES.md', content: rulesMd },
      { path: 'SKILLS.md', content: skillsMd },
      { path: 'TASKS.md', content: tasksMd },
      { path: 'PROJECT_CONTEXT.md', content: projectContextMd },
    ],
  };
}
