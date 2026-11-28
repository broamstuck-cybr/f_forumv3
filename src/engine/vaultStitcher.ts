import type { VaultShardPayload } from '../features/explore/vaultLoader';
import type { FilePatchOp, VaultSlotBrief, WorkspaceAssemblyPlan, WorkspaceFile } from '../types/index';
import type { MatchedVaultResource, MotionRecipeItem } from '../types/workspaceV4';
import type { ComposerBlueprint } from './repoWebComposer';
import { detectLanguageFromPath, sortProjectFiles } from './workspaceBundler';

export interface StitchedVaultSlot {
  slotId: string;
  id: string;
  title: string;
  library: MatchedVaultResource['library'];
  reason: string;
  html: string;
  css: string;
  js: string;
  summary: string;
}

function escapeHtmlAttr(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function foldVi(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function detectClientWorkspaceIntent(
  prompt: string,
  hasExistingFiles: boolean,
  requestedMode?: 'auto' | 'assistant' | 'assemble' | 'patch'
): 'assistant' | 'assemble' | 'patch' {
  if (requestedMode && requestedMode !== 'auto') return requestedMode;
  const clean = foldVi(prompt).trim();
  if (!clean) return 'assistant';

  const hasMasterpieceTag = /\[mau goc:|\[masterpiece:|\bmotionsites\/[a-z0-9-]+\b/.test(clean);
  const explicitBuild =
    hasMasterpieceTag ||
    /\b(tao trang|tao web|tao website|dung trang|dung web|dung website|lam trang|lam web|lam website|thiet ke trang|thiet ke web|thiet ke website|thiet ke landing|thiet ke giao dien|xay dung trang|xay dung web|xay dung website|dung ho so|lam landing|tao landing|tao app|tao ung dung|dung ung dung|tao dashboard|ghep mau|lap ghep|build a|create a|make a|design a|scaffold|generate html|viet react tsx)\b/.test(
      clean
    );

  const explicitEdit =
    hasExistingFiles &&
    /\b(doi nen|nen sang|nen toi|them cau hoi|them muc|them form|dem nguoc|doi mau|mau cam|rut gon chu|sua tieu de|chinh sua|cap nhat|doi font|bo muc|xoa muc|them phan|sua nut|thay doi|sua loi|fix loi|fix error|runtime error|toi uu di dong|them hieu ung|lam gon)\b/.test(
      clean
    );

  if (explicitEdit && !explicitBuild) return 'patch';
  if (explicitBuild) return 'assemble';

  const questionLead =
    /^(f-?forum|web nay|trang nay|du an|github|repo|kho tai nguyen|kho mau|tai nguyen|admin|cach|lam sao|huong dan|giai thich|gioi thieu|tim|goi y|de xuat|liet ke|so sanh|hoi|cho hoi|co nhung|co gi|o dau|tai sao|vi sao|la gi|ban la ai|ban lam duoc gi|xin chao|hello|hi\b|chao\b|test\b)/.test(
      clean
    );
  const promptWithoutUrls = prompt.replace(/https?:\/\/\S+/gi, '');
  const hasQuestion =
    (clean.length < 360 && promptWithoutUrls.includes('?')) ||
    /\b(la gi|o dau|nhu the nao|ra sao|co bao nhieu|tim giup|goi y giup|huong dan giup|cau truc github|file nao|xu ly o dau|doi api key)\b/.test(
      clean.slice(0, 240)
    );

  if ((questionLead || hasQuestion) && !explicitEdit) {
    return 'assistant';
  }
  if (hasExistingFiles) return 'patch';
  return 'assemble';
}

function extractBodyInnerHtml(rawHtml: string): string {
  const withoutExternalScripts = rawHtml
    .replace(/<script\b[^>]*\bsrc=[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');

  const bodyMatch = withoutExternalScripts.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1] : withoutExternalScripts;
  return inner
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, '')
    .replace(/<button\b[^>]*class=["'][^"']*ux-theme-btn[^"']*["'][^>]*>[\s\S]*?<\/button>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim();
}

function extractInlineStyles(rawHtml: string): string {
  const styles: string[] = [];
  rawHtml.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css: string) => {
    const clean = css.trim();
    if (clean) styles.push(clean);
    return '';
  });
  return styles.join('\n');
}

function extractInlineScripts(rawHtml: string): string {
  const scripts: string[] = [];
  rawHtml.replace(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, (_, js: string) => {
    const clean = js.trim();
    if (clean) scripts.push(clean);
    return '';
  });
  return scripts.join('\n');
}

// WHY: Scope imported Vault CSS inside its slot container so real Vault styles render faithfully without overriding outer page typography or layout.
export function scopeVaultCss(rawCss: string, scopeSelector: string): string {
  const cleaned = rawCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import\s+[^;]+;/gi, '')
    .trim();
  if (!cleaned) return '';

  const out: string[] = [];
  let i = 0;
  const len = cleaned.length;

  const readBlock = (): string => {
    let depth = 1;
    let buf = '';
    while (i < len && depth > 0) {
      const ch = cleaned[i++];
      if (ch === '{') {
        depth += 1;
        buf += ch;
      } else if (ch === '}') {
        depth -= 1;
        if (depth > 0) buf += ch;
      } else {
        buf += ch;
      }
    }
    return buf;
  };

  while (i < len) {
    while (i < len && /\s/.test(cleaned[i])) i += 1;
    if (i >= len) break;

    const braceIdx = cleaned.indexOf('{', i);
    if (braceIdx < 0) break;
    const header = cleaned.slice(i, braceIdx).trim();
    i = braceIdx + 1;
    const body = readBlock();

    if (!header) continue;
    if (header.startsWith('@keyframes') || header.startsWith('@-webkit-keyframes') || header.startsWith('@font-face')) {
      out.push(`${header} { ${body} }`);
      continue;
    }
    if (header.startsWith('@media') || header.startsWith('@supports') || header.startsWith('@container')) {
      const scopedInner = scopeVaultCss(body, scopeSelector);
      if (scopedInner) {
        out.push(`${header} {\n${scopedInner}\n}`);
      }
      continue;
    }
    if (header.startsWith('@')) {
      continue;
    }

    const selectors = header
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((sel) => {
        if (
          sel === ':root' ||
          sel === 'html' ||
          sel === 'body' ||
          sel === 'html, body' ||
          /^:root(?:\[|:not\(|:where\(|\.)/.test(sel) ||
          /^(?:html|body)(?:\[|:not\(|\.)/.test(sel)
        ) {
          return scopeSelector;
        }
        if (/^(html|body)\b/.test(sel)) {
          return sel.replace(/^(html|body)\b/, scopeSelector);
        }
        return `${scopeSelector} ${sel}`;
      });

    if (selectors.length > 0 && body.trim()) {
      // Strip full-viewport fixed height and position:fixed so Vault modules stay cleanly inside their stage box
      const safeBody = body
        .replace(/\bmin-height\s*:\s*100(?:d|s|l)?vh\s*;?/gi, 'min-height: 200px;')
        .replace(/\bheight\s*:\s*100(?:d|s|l)?vh\s*;?/gi, 'min-height: 200px;')
        .replace(/\bposition\s*:\s*fixed\s*;?/gi, 'position: relative;');
      out.push(`${selectors.join(', ')} { ${safeBody.trim()} }`);
    }
  }

  return out.join('\n');
}

export function scopeVaultJs(rawJs: string, vaultId: string): string {
  const clean = rawJs.trim();
  if (!clean || clean.length > 7500 || /^\s*(import|export)\s+/m.test(clean)) {
    return '';
  }
  const rewritten = clean
    .replace(/document\.currentScript\.previousElementSibling/g, "(root.querySelector('.ux') || root.firstElementChild || root)")
    .replace(/document\.currentScript/g, 'root')
    .replace(/\bdocument\.querySelectorAll\s*\(/g, 'root.querySelectorAll(')
    .replace(/\bdocument\.querySelector\s*\(/g, 'root.querySelector(');

  const safeId = vaultId.replace(/["'\\]/g, '');
  return `(function() {
  try {
    var root = document.querySelector('[data-vault-id="${safeId}"]');
    if (!root || root.dataset.ffVaultWired === '1') return;
    root.dataset.ffVaultWired = '1';
${rewritten}
  } catch (_err) {
    /* Safe no-op for optional vault hook */
  }
})();`;
}

export function buildStitchedVaultSlots(
  candidates: Array<{ match: MatchedVaultResource; payload?: VaultShardPayload }>,
  maxSlots = 5
): StitchedVaultSlot[] {
  const slots: StitchedVaultSlot[] = [];

  for (const item of candidates) {
    const p = item.payload;
    if (!p) continue;
    const rawHtml = (p.h || '').trim();
    if (/https?:\/\/(?:cdn\.|unpkg\.com|threejs\.org)/i.test(rawHtml)) continue;
    const rawCss = [extractInlineStyles(rawHtml), (p.c || '').trim()].filter(Boolean).join('\n');
    const rawJs = [extractInlineScripts(rawHtml), (p.j || '').trim()].filter(Boolean).join('\n');
    const innerHtml = extractBodyInnerHtml(rawHtml);

    // Only stitch real renderable HTML+CSS modules (skip empty or Tailwind-CDN-only stubs without styles)
    const hasUsefulMarkup = innerHtml.length >= 24 && innerHtml.length <= 15_000;
    const hasUsefulStyle = rawCss.length >= 20 && rawCss.length <= 22_000;
    if (!hasUsefulMarkup || !hasUsefulStyle) continue;

    const safeJs =
      rawJs.length <= 7500 && !/^\s*(import|export)\s+/m.test(rawJs)
        ? rawJs
        : '';

    const slotIndex = slots.length + 1;
    const slotId = `slot-${slotIndex}`;
    slots.push({
      slotId,
      id: item.match.id,
      title: item.match.title,
      library: item.match.library,
      reason: item.match.reason,
      html: innerHtml,
      css: rawCss,
      js: safeJs,
      summary: (p.p || item.match.reason || `${item.match.library} interactive component`).slice(0, 220),
    });

    if (slots.length >= maxSlots) break;
  }

  return slots;
}

export function toVaultSlotBriefs(slots: StitchedVaultSlot[]): VaultSlotBrief[] {
  return slots.map((s) => ({
    slotId: s.slotId,
    id: s.id,
    title: s.title,
    library: s.library,
    summary: s.summary,
  }));
}

export function applyAssemblyPlanToBlueprint(
  base: ComposerBlueprint,
  plan: WorkspaceAssemblyPlan
): ComposerBlueprint {
  const next: ComposerBlueprint = {
    ...base,
    profile: { ...base.profile },
  };

  if (typeof plan.siteTitle === 'string' && plan.siteTitle.trim()) {
    next.profile.siteName = plan.siteTitle.trim().slice(0, 80);
  }
  if (typeof plan.eyebrow === 'string' && plan.eyebrow.trim()) {
    next.eyebrow = plan.eyebrow.trim().slice(0, 80);
  }
  if (typeof plan.heroTitle === 'string' && plan.heroTitle.trim()) {
    next.heroTitle = plan.heroTitle.trim().slice(0, 120);
  }
  if (typeof plan.heroSubtitle === 'string' && plan.heroSubtitle.trim()) {
    next.heroSubtitle = plan.heroSubtitle.trim().slice(0, 320);
  }
  if (typeof plan.primaryCta === 'string' && plan.primaryCta.trim()) {
    next.primaryCta = plan.primaryCta.trim().slice(0, 42);
  }
  if (typeof plan.secondaryCta === 'string' && plan.secondaryCta.trim()) {
    next.secondaryCta = plan.secondaryCta.trim().slice(0, 42);
  }
  if (plan.themeMode === 'dark' || plan.themeMode === 'light') {
    next.themeMode = plan.themeMode;
  }
  if (typeof plan.accentKey === 'string' && plan.accentKey.trim()) {
    next.accentKey = plan.accentKey.trim();
  }
  if (Array.isArray(plan.stats) && plan.stats.length >= 2) {
    next.stats = plan.stats
      .filter((s) => s && typeof s.value === 'string' && typeof s.label === 'string')
      .slice(0, 4)
      .map((s) => ({ value: s.value.trim(), label: s.label.trim() }));
  }
  if (Array.isArray(plan.cards) && plan.cards.length >= 2) {
    next.cards = plan.cards
      .filter((c) => c && typeof c.title === 'string' && typeof c.description === 'string')
      .slice(0, 6)
      .map((c, idx) => ({
        tag: (c.tag || `Mục 0${idx + 1}`).trim(),
        title: c.title.trim(),
        description: c.description.trim(),
      }));
  }
  if (Array.isArray(plan.timeline) && plan.timeline.length >= 2) {
    next.timeline = plan.timeline
      .filter((t) => t && typeof t.title === 'string')
      .slice(0, 5)
      .map((t, idx) => ({
        time: (t.time || `Bước 0${idx + 1}`).trim(),
        title: t.title.trim(),
        detail: String(t.detail || '').trim(),
      }));
  }
  if (Array.isArray(plan.flashcards) && plan.flashcards.length >= 2) {
    next.flashcards = plan.flashcards
      .filter((f) => f && typeof f.front === 'string' && typeof f.back === 'string')
      .slice(0, 4)
      .map((f, idx) => ({
        tag: (f.tag || `Thẻ 0${idx + 1}`).trim(),
        front: f.front.trim(),
        back: f.back.trim(),
      }));
  }
  if (Array.isArray(plan.quiz) && plan.quiz.length >= 1) {
    const validQuiz = plan.quiz
      .filter(
        (q) =>
          q &&
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          q.options.length >= 2
      )
      .slice(0, 4)
      .map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => String(o).trim()).slice(0, 4),
        correctIndex: Math.max(0, Math.min(q.options.length - 1, Number(q.correctIndex) || 0)),
        explanation: String(q.explanation || 'Đáp án đúng dựa trên nội dung trọng tâm.').trim(),
      }));
    if (validQuiz.length > 0) next.quiz = validQuiz;
  }
  if (typeof plan.registerHeading === 'string' && plan.registerHeading.trim()) {
    next.registerHeading = plan.registerHeading.trim().slice(0, 100);
  }
  if (typeof plan.registerLead === 'string' && plan.registerLead.trim()) {
    next.registerLead = plan.registerLead.trim().slice(0, 260);
  }
  if (typeof plan.registerCta === 'string' && plan.registerCta.trim()) {
    next.registerCta = plan.registerCta.trim().slice(0, 42);
  }
  if (typeof plan.footerNote === 'string' && plan.footerNote.trim()) {
    next.footerNote = plan.footerNote.trim().slice(0, 160);
  }

  return next;
}

export function stitchVaultModulesIntoFiles(
  baseFiles: WorkspaceFile[],
  slots: StitchedVaultSlot[],
  plan?: WorkspaceAssemblyPlan
): WorkspaceFile[] {
  const chosenSlots = (() => {
    if (plan?.selectedSlotIds && plan.selectedSlotIds.length > 0) {
      const picked = slots.filter((s) => plan.selectedSlotIds!.includes(s.slotId));
      if (picked.length > 0) return picked.slice(0, 3);
    }
    return slots.slice(0, 2);
  })();

  if (chosenSlots.length === 0 && !plan?.customCss) {
    return baseFiles;
  }

  const now = new Date().toISOString();
  const nextFiles = baseFiles.map((f) => ({ ...f }));
  const sectionTitle = (plan?.vaultSectionTitle || 'Khối tương tác từ Kho F-Forum').trim();
  const sectionLead = (
    plan?.vaultSectionLead ||
    'Các thành phần bên dưới được lắp ghép trực tiếp từ kho 5.909 mẫu miễn phí F-Forum, giữ nguyên mã CSS và tương tác gốc.'
  ).trim();

  const slotCardsHtml = chosenSlots
    .map((slot) => {
      const note = plan?.slotNotes?.[slot.slotId] || slot.reason;
      return `      <article class="ff-vm-card craft-surface reveal">
        <div class="ff-vm-card__head">
          <div>
            <span class="ff-vm-badge">${escapeHtmlAttr(slot.library)}</span>
            <h3>${escapeHtmlAttr(slot.title)}</h3>
          </div>
          <p class="ff-vm-note">${escapeHtmlAttr(note)}</p>
        </div>
        <div class="ff-vm-stage">
          <div class="ff-vm-scope" data-slot="${escapeHtmlAttr(slot.slotId)}">
${slot.html}
          </div>
        </div>
      </article>`;
    })
    .join('\n');

  const stitchedSectionHtml = chosenSlots.length > 0
    ? `\n    <section class="section" id="kho-tuong-tac">
      <div class="wrap">
        <div class="section__head reveal">
          <div>
            <span class="section__num">KHO MẪU THẬT · ${chosenSlots.length} KHỐI</span>
            <h2>${escapeHtmlAttr(sectionTitle)}</h2>
          </div>
          <p class="section__lead">${escapeHtmlAttr(sectionLead)}</p>
        </div>
        <div class="ff-vm-grid ff-vm-grid--${chosenSlots.length === 1 ? '1' : '2'}">
${slotCardsHtml}
        </div>
      </div>
    </section>\n`
    : '';

  const scopedCssBlocks = [
    `/* F-Forum Real Vault Stitched Modules */
.ff-vm-grid { display: grid; gap: 20px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ff-vm-grid--1 { grid-template-columns: minmax(0, 1fr); }
.ff-vm-card { padding: 20px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
.ff-vm-card__head { display: flex; flex-direction: column; gap: 6px; }
.ff-vm-card__head h3 { margin: 4px 0 0; font-size: 1.08rem; }
.ff-vm-badge { display: inline-flex; width: fit-content; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--line); color: var(--accent); font-family: var(--font-mono, monospace); }
.ff-vm-note { margin: 0; font-size: 0.9rem; color: var(--muted); }
.ff-vm-stage { position: relative; min-height: 220px; border-radius: 14px; border: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 78%, var(--surface) 22%); padding: 18px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.ff-vm-scope { width: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
@media (max-width: 820px) { .ff-vm-grid { grid-template-columns: minmax(0, 1fr); } }`,
    ...chosenSlots.map((slot) =>
      `/* Slot ${slot.slotId}: ${slot.title} (${slot.library}) */\n${scopeVaultCss(slot.css, `.ff-vm-scope[data-slot="${slot.slotId}"]`)}`
    ),
    plan?.customCss ? `/* AI Polish Overrides */\n${plan.customCss.slice(0, 2000)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const scopedJsBlocks = chosenSlots
    .filter((slot) => slot.js.trim().length > 0)
    .map(
      (slot) =>
        `/* Vault Module: ${slot.title} */\n(function() {\n  try {\n    const root = document.querySelector('.ff-vm-scope[data-slot="${slot.slotId}"]');\n    if (!root) return;\n${slot.js}\n  } catch (_) {\n    /* Safe no-op for optional vault hook */\n  }\n})();`
    )
    .join('\n\n');

  const htmlFile = nextFiles.find((f) => f.path === 'index.html');
  if (htmlFile) {
    let nextHtml = htmlFile.content;
    if (!nextHtml.includes('src/vault-modules.css') && scopedCssBlocks) {
      nextHtml = nextHtml.replace(
        /<\/head>/i,
        '  <link rel="stylesheet" href="src/vault-modules.css" />\n</head>'
      );
    }
    if (stitchedSectionHtml) {
      if (nextHtml.includes('id="noi-bat"')) {
        nextHtml = nextHtml.replace(/(<section\b[^>]*id="noi-bat")/i, `${stitchedSectionHtml}$1`);
      } else if (nextHtml.includes('</main>')) {
        nextHtml = nextHtml.replace(/<\/main>/i, `${stitchedSectionHtml}  </main>`);
      }
    }
    htmlFile.content = nextHtml;
    htmlFile.updatedAt = now;
  }

  if (scopedCssBlocks) {
    const existingCss = nextFiles.find((f) => f.path === 'src/vault-modules.css');
    if (existingCss) {
      existingCss.content = scopedCssBlocks;
      existingCss.updatedAt = now;
    } else {
      nextFiles.push({
        path: 'src/vault-modules.css',
        content: scopedCssBlocks,
        language: 'css',
        summary: `CSS tách phạm vi cho ${chosenSlots.length} mẫu kho F-Forum`,
        updatedAt: now,
      });
    }
  }

  const combinedExtraJs = [scopedJsBlocks, plan?.customJs ? plan.customJs.slice(0, 1800) : '']
    .filter(Boolean)
    .join('\n\n');
  if (combinedExtraJs) {
    const jsFile = nextFiles.find((f) => f.path === 'src/app.js');
    if (jsFile) {
      jsFile.content = `${jsFile.content.trimEnd()}\n\n${combinedExtraJs}\n`;
      jsFile.updatedAt = now;
    } else {
      nextFiles.push({
        path: 'src/app.js',
        content: combinedExtraJs,
        language: 'javascript',
        summary: 'Tương tác cho mẫu kho F-Forum',
        updatedAt: now,
      });
    }
  }

  return sortProjectFiles(nextFiles);
}

export function applyIncrementalPatches(
  previousFiles: WorkspaceFile[],
  patches: FilePatchOp[]
): { files: WorkspaceFile[]; appliedCount: number } {
  const now = new Date().toISOString();
  const fileMap = new Map(previousFiles.map((f) => [f.path, { ...f }]));
  let appliedCount = 0;

  for (const patch of patches) {
    const target = fileMap.get(patch.path);
    if (!target) {
      if (!patch.find.trim() && patch.replace.trim()) {
        fileMap.set(patch.path, {
          path: patch.path,
          content: patch.replace,
          language: detectLanguageFromPath(patch.path),
          summary: 'Tạo tệp theo bản vá AI',
          updatedAt: now,
        });
        appliedCount += 1;
      }
      continue;
    }
    if (target.content.includes(patch.find)) {
      target.content = target.content.replace(patch.find, patch.replace);
      target.updatedAt = now;
      appliedCount += 1;
    }
  }

  return {
    files: sortProjectFiles(Array.from(fileMap.values())),
    appliedCount,
  };
}

export interface ExtractedThemeTokens {
  isLight: boolean;
  bg: string;
  surface: string;
  fg: string;
  muted: string;
  accent: string;
  line: string;
}

function parseHexLuminance(hex: string): number | null {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(clean)) return null;
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = Number.parseInt(full.slice(0, 2), 16) / 255;
  const g = Number.parseInt(full.slice(2, 4), 16) / 255;
  const b = Number.parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function extractCssVarValue(css: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = css.match(new RegExp(`${escaped}\\s*:\\s*([^;\\n}]+)`, 'i'));
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

export function extractAiThemeTokens(cssText: string, htmlText: string): ExtractedThemeTokens {
  const rawBg = extractCssVarValue(cssText, ['--bg', '--bg-color', '--color-bg', '--page-bg', '--background']);
  const rawSurface = extractCssVarValue(cssText, ['--surface', '--card-bg', '--bg-card', '--color-surface', '--panel']);
  const rawFg = extractCssVarValue(cssText, ['--fg', '--text', '--text-color', '--color-text', '--ink']);
  const rawMuted = extractCssVarValue(cssText, ['--muted', '--fg-muted', '--text-muted', '--color-muted']);
  const rawAccent = extractCssVarValue(cssText, ['--accent', '--primary', '--color-primary', '--brand']);
  const rawLine = extractCssVarValue(cssText, ['--line', '--border', '--border-color', '--color-border']);

  const bgHexMatch = (rawBg || '').match(/#[0-9a-f]{3,6}/i);
  const bgLum = bgHexMatch ? parseHexLuminance(bgHexMatch[0]) : null;
  const lightHint =
    /data-(?:page-)?theme=["']light["']/i.test(htmlText) ||
    /color-scheme\s*:\s*light/i.test(cssText) ||
    (bgLum !== null && bgLum > 0.48);

  if (lightHint) {
    return {
      isLight: true,
      bg: rawBg || '#f6f3ec',
      surface: rawSurface || '#ffffff',
      fg: rawFg || '#181816',
      muted: rawMuted || '#57554f',
      accent: rawAccent || '#1f5e4b',
      line: rawLine || 'rgba(24, 24, 22, 0.12)',
    };
  }

  return {
    isLight: false,
    bg: rawBg || '#0d1113',
    surface: rawSurface || '#151b1e',
    fg: rawFg || '#f1f3f2',
    muted: rawMuted || '#a6b0b5',
    accent: rawAccent || '#e5a93c',
    line: rawLine || 'rgba(241, 243, 242, 0.14)',
  };
}

function extractDistinctiveClassTokens(snippetHtml: string): string[] {
  const classes = new Set<string>();
  const re = /\bclass=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(snippetHtml)) !== null) {
    for (const cls of m[1].split(/\s+/)) {
      const clean = cls.trim();
      if (clean.length >= 4 && /^(?:thc|u\d|cf-|ll-|ff-|btn-|card-|mcard|tilt|flip)/.test(clean)) {
        classes.add(clean);
      }
    }
  }
  return Array.from(classes).slice(0, 4);
}

function buildKnowledgeMotionAssets(recipes: MotionRecipeItem[], tokens: ExtractedThemeTokens): {
  css: string;
  js: string;
  primaryId: string | null;
} {
  if (recipes.length === 0) {
    return { css: '', js: '', primaryId: null };
  }
  const primary = recipes[0];
  const recipeCssParts: string[] = [];
  for (const r of recipes) {
    if (r.lang === 'css' && r.code.trim()) {
      const safeRecipeCss = r.code
        .replace(/@import\s+[^;]+;/gi, '')
        // WHY: Never allow a Knowledge recipe snippet to leave elements hidden at opacity: 0 before JS runs.
        .replace(/\bopacity\s*:\s*0\s*;/gi, 'opacity: 1;')
        .slice(0, 1800);
      recipeCssParts.push(`/* Knowledge Recipe: ${r.title} (${r.id}) */\n${safeRecipeCss}`);
    }
  }

  const baseChoreographyCss = `/* Source of Knowledge Motion Craft (${primary.id}) */
[data-knowledge-recipe] .ff-kr-item,
.ff-vm-card {
  transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease, box-shadow 0.34s ease;
}
[data-knowledge-recipe] .ff-kr-item:hover,
.ff-vm-card:hover {
  transform: translateY(-3px);
  border-color: ${tokens.accent};
}
@media (prefers-reduced-motion: reduce) {
  [data-knowledge-recipe] *,
  .ff-vm-card,
  .ff-vm-scope * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`;

  const jsChoreography = `/* Source of Knowledge Motion Choreography: ${primary.title} */
(function() {
  try {
    var root = document.querySelector('[data-knowledge-recipe]') || document.querySelector('main') || document.body;
    if (!root || root.dataset.ffRecipeWired === '1') return;
    root.dataset.ffRecipeWired = '1';
    if (!root.getAttribute('data-knowledge-recipe')) {
      root.setAttribute('data-knowledge-recipe', '${primary.id.replace(/["'\\]/g, '')}');
    }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cards = root.querySelectorAll('section, article, .ff-vm-card');
    cards.forEach(function(el, idx) {
      el.classList.add('ff-kr-item');
      if (!reduce) {
        el.style.setProperty('--ff-stagger-i', String(idx));
      }
    });
  } catch (_err) {
    /* Safe no-op */
  }
})();`;

  return {
    css: [baseChoreographyCss, ...recipeCssParts].filter(Boolean).join('\n\n'),
    js: jsChoreography,
    primaryId: primary.id,
  };
}

function buildFallbackInteractiveAppJs(): string {
  return `/* F-Forum Interactive Controls & Safe Wiring */
(function() {
  try {
    var tabGroups = document.querySelectorAll('[role="tablist"]');
    tabGroups.forEach(function(group) {
      if (group.dataset.ffWired === '1') return;
      group.dataset.ffWired = '1';
      var tabs = group.querySelectorAll('[role="tab"]');
      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          tabs.forEach(function(t) { t.setAttribute('aria-selected', 'false'); t.classList.remove('is-active'); });
          tab.setAttribute('aria-selected', 'true');
          tab.classList.add('is-active');
        });
      });
    });

    var forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
      if (form.dataset.ffWired === '1') return;
      form.dataset.ffWired = '1';
      form.addEventListener('submit', function(ev) {
        if (ev.defaultPrevented) return;
        ev.preventDefault();
        var status = form.querySelector('[role="status"], .form-status');
        if (!status) {
          status = document.createElement('p');
          status.setAttribute('role', 'status');
          status.style.marginTop = '10px';
          status.style.fontSize = '0.9rem';
          form.appendChild(status);
        }
        status.textContent = 'Đã ghi nhận thông tin thành công.';
      });
    });
  } catch (_err) {
    /* Safe no-op */
  }
})();`;
}

function buildFailSafeBaseCss(tokens: ExtractedThemeTokens): string {
  return `/* F-Forum Base Design System Fail-Safe */
:root {
  --bg: ${tokens.bg};
  --surface: ${tokens.surface};
  --fg: ${tokens.fg};
  --muted: ${tokens.muted};
  --accent: ${tokens.accent};
  --line: ${tokens.line};
}
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Be Vietnam Pro', system-ui, -apple-system, sans-serif;
  line-height: 1.62;
  overflow-x: clip;
}
.sr-only, .skip-link {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
img, svg { max-width: 100%; height: auto; display: block; }
header svg, nav svg, button svg, a svg, .icon svg { max-width: 24px; max-height: 24px; flex-shrink: 0; }
header, .site-header, .app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: ${tokens.isLight ? 'rgba(246, 243, 236, 0.9)' : 'rgba(13, 17, 19, 0.9)'};
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
header .container, header nav, .main-nav, .nav-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 14px clamp(16px, 4vw, 40px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
nav ul, .nav-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}
a { color: inherit; text-decoration: none; }
a:hover { color: var(--accent); }
main > section, .section, .hero, .hero-section {
  padding: clamp(44px, 6vw, 84px) clamp(16px, 4vw, 40px);
}
.container, .wrap { max-width: 1180px; margin: 0 auto; }
h1 { font-size: clamp(2rem, 4.4vw, 3.8rem); line-height: 1.08; letter-spacing: -0.025em; margin: 0 0 16px; }
h2 { font-size: clamp(1.5rem, 2.8vw, 2.25rem); line-height: 1.15; margin: 0 0 12px; }
h3 { font-size: 1.12rem; line-height: 1.3; margin: 0 0 8px; }
p { color: var(--muted); margin: 0 0 14px; }
.grid, .cards-grid, .bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}
.card, article {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 20px;
}
button, .btn, .btn-primary, .btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--fg);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}
.btn-primary, button[type="submit"] {
  background: var(--accent);
  color: ${tokens.isLight ? '#ffffff' : '#0b0e10'};
  border-color: transparent;
}
input, select, textarea {
  width: 100%;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--fg);
  font: inherit;
}
footer {
  padding: 32px clamp(16px, 4vw, 40px);
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.9rem;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}`;
}

function repairTruncatedCssIfNeeded(rawCss: string): { css: string; wasBroken: boolean } {
  const clean = rawCss.trim();
  if (!clean) return { css: '', wasBroken: true };
  let open = 0;
  let close = 0;
  for (let i = 0; i < clean.length; i += 1) {
    if (clean[i] === '{') open += 1;
    else if (clean[i] === '}') close += 1;
  }
  if (open > close) {
    const missing = '}'.repeat(open - close);
    return { css: `${clean}\n${missing}`, wasBroken: true };
  }
  return { css: clean, wasBroken: clean.length < 400 };
}

function inferPromptThemeTokens(prompt: string, htmlText: string, cssText: string): ExtractedThemeTokens {
  const extracted = extractAiThemeTokens(cssText, htmlText);
  if (cssText.trim().length >= 300) return extracted;
  const folded = foldVi(`${prompt} ${htmlText.slice(0, 600)}`);
  const wantsLight = /\b(light|sang|giay|paper|ivory|gom|ceramic|minimal|lookbook|trang su|sach se|toi gian)\b/.test(folded);
  if (wantsLight) {
    return {
      isLight: true,
      bg: '#f6f3ec',
      surface: '#ffffff',
      fg: '#181816',
      muted: '#57554f',
      accent: '#8c3f2b',
      line: 'rgba(24, 24, 22, 0.12)',
    };
  }
  return extracted;
}

export interface VerifyVaultAssemblyResult {
  files: WorkspaceFile[];
  embeddedVaultIds: string[];
  embeddedRecipeIds: string[];
}

export function verifyAndEnhanceVaultAssembly(
  baseFiles: WorkspaceFile[],
  slots: StitchedVaultSlot[],
  recipes: MotionRecipeItem[],
  options?: { isReact?: boolean; sectionTitle?: string; sectionLead?: string; prompt?: string }
): VerifyVaultAssemblyResult {
  const now = new Date().toISOString();
  const nextFiles = baseFiles.map((f) => ({ ...f }));
  const isReact =
    options?.isReact || nextFiles.some((f) => /\.(tsx|jsx)$/i.test(f.path));

  if (isReact) {
    const appCode = nextFiles.map((f) => f.content).join('\n');
    const embeddedVaultIds = slots
      .filter((s) => appCode.includes(s.id))
      .map((s) => s.id);
    const embeddedRecipeIds = recipes
      .filter((r) => appCode.includes(r.id))
      .map((r) => r.id);
    return { files: sortProjectFiles(nextFiles), embeddedVaultIds, embeddedRecipeIds };
  }

  const htmlFile = nextFiles.find((f) => f.path.toLowerCase() === 'index.html');
  if (!htmlFile) {
    return { files: sortProjectFiles(nextFiles), embeddedVaultIds: [], embeddedRecipeIds: [] };
  }

  let stylesFile = nextFiles.find(
    (f) => f.path.toLowerCase() === 'src/styles.css' || f.path.toLowerCase() === 'styles.css'
  );
  const inlineStyleLen = extractInlineStyles(htmlFile.content).length;
  const tokens = inferPromptThemeTokens(
    options?.prompt || '',
    htmlFile.content,
    stylesFile?.content || ''
  );

  // Structural CSS fail-safe: repair truncated src/styles.css or synthesize base stylesheet if omitted by LLM
  const cssCheck = repairTruncatedCssIfNeeded(stylesFile?.content || '');
  if ((!stylesFile && inlineStyleLen < 400) || cssCheck.wasBroken) {
    const failSafeCss = buildFailSafeBaseCss(tokens);
    const combinedCss = cssCheck.css
      ? `${failSafeCss}\n\n/* AI Styles (repaired) */\n${cssCheck.css}\n`
      : `${failSafeCss}\n`;
    if (stylesFile) {
      stylesFile.content = combinedCss;
      stylesFile.updatedAt = now;
    } else {
      stylesFile = {
        path: 'src/styles.css',
        content: combinedCss,
        language: 'css',
        summary: 'Hệ thống màu, bố cục và responsive đồng bộ',
        updatedAt: now,
      };
      nextFiles.push(stylesFile);
    }
  }

  // Guarantee clean base resets on src/styles.css if AI omitted box-sizing or nav link reset
  if (stylesFile && !/box-sizing\s*:\s*border-box/i.test(stylesFile.content)) {
    stylesFile.content = `*, *::before, *::after { box-sizing: border-box; }\nheader a, nav a { color: inherit; text-decoration: none; }\n${stylesFile.content}`;
    stylesFile.updatedAt = now;
  } else if (stylesFile && !/text-decoration\s*:\s*none/i.test(stylesFile.content)) {
    stylesFile.content = `header a, nav a { color: inherit; text-decoration: none; }\n${stylesFile.content}`;
    stylesFile.updatedAt = now;
  }

  let nextHtml = htmlFile.content;
  if (!/<\/body>/i.test(nextHtml)) {
    nextHtml += '\n</body>';
  }
  if (!/<\/html>/i.test(nextHtml)) {
    nextHtml += '\n</html>';
  }
  if (stylesFile && !/href=["'](?:\.\/)?(?:src\/)?styles\.css["']/i.test(nextHtml)) {
    const cssHref = stylesFile.path;
    if (/<\/head>/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(/<\/head>/i, `  <link rel="stylesheet" href="${cssHref}" />\n</head>`);
    } else {
      nextHtml = `<link rel="stylesheet" href="${cssHref}" />\n${nextHtml}`;
    }
  }

  // Detect which Vault slots AI already genuinely embedded into index.html
  const aiEmbeddedIds = new Set<string>();
  for (const slot of slots) {
    if (nextHtml.includes(`data-vault-id="${slot.id}"`) || nextHtml.includes(`data-vault-id='${slot.id}'`)) {
      aiEmbeddedIds.add(slot.id);
      continue;
    }
    const markers = extractDistinctiveClassTokens(slot.html);
    if (markers.length > 0 && markers.some((cls) => nextHtml.includes(cls))) {
      aiEmbeddedIds.add(slot.id);
    }
  }

  // Ensure at least 2-3 real Vault modules are genuinely woven into the page with scoped CSS & JS
  const alreadyEmbeddedSlots = slots.filter((s) => aiEmbeddedIds.has(s.id));
  const missingSlots = slots.filter((s) => !aiEmbeddedIds.has(s.id));
  const toInjectSlots =
    alreadyEmbeddedSlots.length >= 2
      ? []
      : missingSlots.slice(0, Math.max(2, 3 - alreadyEmbeddedSlots.length));

  const allActiveSlots = [...alreadyEmbeddedSlots, ...toInjectSlots].slice(0, 4);
  const motionAssets = buildKnowledgeMotionAssets(recipes, tokens);

  // Ensure Knowledge Motion Recipe attribute is marked cleanly on <main> or <body>
  if (motionAssets.primaryId && !nextHtml.includes('data-knowledge-recipe=')) {
    if (/<main\b/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(/<main\b([^>]*)>/i, `<main$1 data-knowledge-recipe="${escapeHtmlAttr(motionAssets.primaryId)}">`);
    } else if (/<body\b/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(/<body\b([^>]*)>/i, `<body$1 data-knowledge-recipe="${escapeHtmlAttr(motionAssets.primaryId)}">`);
    }
  }

  // Inject harmonized Vault section if AI omitted the real Vault modules
  if (toInjectSlots.length > 0) {
    const cardsHtml = toInjectSlots
      .map((slot) => {
        const cleanTitle = escapeHtmlAttr(slot.title);
        const cleanLib = escapeHtmlAttr(slot.library);
        const cleanId = escapeHtmlAttr(slot.id);
        return `      <article class="ff-vm-card" data-vault-id="${cleanId}" data-vault-library="${cleanLib}">
        <header class="ff-vm-card__head">
          <span class="ff-vm-badge">${cleanLib}</span>
          <h3>${cleanTitle}</h3>
        </header>
        <div class="ff-vm-stage">
          <div class="ff-vm-scope" data-vault-id="${cleanId}" data-slot="${escapeHtmlAttr(slot.slotId)}">
${slot.html}
          </div>
        </div>
      </article>`;
      })
      .join('\n');

    const sectionHeading = escapeHtmlAttr(options?.sectionTitle || 'Khối tương tác lắp ghép từ Kho F-Forum');
    const sectionLead = escapeHtmlAttr(
      options?.sectionLead ||
        'Các thành phần tương tác được tinh chỉnh đồng bộ bảng màu từ kho 5.909 mẫu F-Forum.'
    );
    const gridColsClass = toInjectSlots.length === 1 ? 'ff-vm-grid--1' : toInjectSlots.length === 3 ? 'ff-vm-grid--3' : 'ff-vm-grid--2';

    const injectedSection = `\n    <section class="ff-vm-section" id="kho-tuong-tac" aria-label="${sectionHeading}">
      <div class="ff-vm-wrap">
        <div class="ff-vm-head">
          <span class="ff-vm-eyebrow">F-Forum Vault · ${toInjectSlots.length} thành phần thực tế</span>
          <h2>${sectionHeading}</h2>
          <p>${sectionLead}</p>
        </div>
        <div class="ff-vm-grid ${gridColsClass}">
${cardsHtml}
        </div>
      </div>
    </section>\n`;

    if (/<\/main>/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(/<\/main>/i, `${injectedSection}  </main>`);
    } else if (/<footer\b/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(/<footer\b/i, `${injectedSection}  <footer`);
    } else if (/<\/body>/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(/<\/body>/i, `${injectedSection}</body>`);
    } else {
      nextHtml += injectedSection;
    }
  }

  // Generate src/vault-modules.css harmonized with the AI's extracted :root palette
  const vaultCssHeader = `/* F-Forum Harmonized Vault & Knowledge Modules */
.ff-vm-section {
  --ff-vm-bg: ${tokens.bg};
  --ff-vm-surface: ${tokens.surface};
  --ff-vm-fg: ${tokens.fg};
  --ff-vm-muted: ${tokens.muted};
  --ff-vm-accent: ${tokens.accent};
  --ff-vm-line: ${tokens.line};
  padding: clamp(48px, 6vw, 84px) clamp(18px, 4vw, 48px);
  border-top: 1px solid var(--ff-vm-line);
  background: var(--ff-vm-bg);
  color: var(--ff-vm-fg);
}
.ff-vm-wrap { max-width: 1180px; margin: 0 auto; }
.ff-vm-head { margin-bottom: 28px; max-width: 680px; }
.ff-vm-eyebrow {
  display: inline-block;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ff-vm-accent);
  margin-bottom: 8px;
}
.ff-vm-head h2 { margin: 0 0 8px; font-size: clamp(1.5rem, 2.8vw, 2.2rem); line-height: 1.15; color: var(--ff-vm-fg); }
.ff-vm-head p { margin: 0; color: var(--ff-vm-muted); font-size: 0.98rem; line-height: 1.6; }
.ff-vm-grid { display: grid; gap: 20px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ff-vm-grid--1 { grid-template-columns: minmax(0, 1fr); }
.ff-vm-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.ff-vm-card {
  background: var(--ff-vm-surface);
  border: 1px solid var(--ff-vm-line);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  overflow: hidden;
}
.ff-vm-card__head { display: flex; flex-direction: column; gap: 6px; }
.ff-vm-card__head h3 { margin: 0; font-size: 1.04rem; line-height: 1.3; color: var(--ff-vm-fg); }
.ff-vm-badge {
  display: inline-flex;
  width: fit-content;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--ff-vm-line);
  color: var(--ff-vm-accent);
}
.ff-vm-stage {
  position: relative;
  min-height: 210px;
  border-radius: 14px;
  border: 1px solid var(--ff-vm-line);
  background: ${tokens.isLight ? 'rgba(0, 0, 0, 0.025)' : 'rgba(255, 255, 255, 0.025)'};
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ff-vm-scope {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  --ux-page: var(--ff-vm-bg);
  --ux-surface: var(--ff-vm-surface);
  --ux-surface-2: var(--ff-vm-bg);
  --ux-ink: var(--ff-vm-fg);
  --ux-ink-2: var(--ff-vm-muted);
  --ux-line: var(--ff-vm-line);
  --ux-accent: var(--ff-vm-accent);
}
@media (max-width: 960px) {
  .ff-vm-grid--3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .ff-vm-grid,
  .ff-vm-grid--2,
  .ff-vm-grid--3 { grid-template-columns: minmax(0, 1fr); }
}`;

  const scopedSlotCssBlocks = toInjectSlots.map((slot) => {
    const safeId = slot.id.replace(/["'\\]/g, '');
    return `/* Vault Module: ${slot.title} (${slot.library}) */\n${scopeVaultCss(slot.css, `.ff-vm-scope[data-vault-id="${safeId}"]`)}`;
  });

  const finalVaultCss = [vaultCssHeader, ...scopedSlotCssBlocks, motionAssets.css]
    .filter(Boolean)
    .join('\n\n');

  if (finalVaultCss.trim()) {
    if (!/href=["'](?:\.\/)?src\/vault-modules\.css["']/i.test(nextHtml)) {
      if (/<\/head>/i.test(nextHtml)) {
        nextHtml = nextHtml.replace(/<\/head>/i, '  <link rel="stylesheet" href="src/vault-modules.css" />\n</head>');
      } else {
        nextHtml = `<link rel="stylesheet" href="src/vault-modules.css" />\n${nextHtml}`;
      }
    }
    const existingVmCss = nextFiles.find((f) => f.path.toLowerCase() === 'src/vault-modules.css');
    if (existingVmCss) {
      existingVmCss.content = `${finalVaultCss}\n`;
      existingVmCss.updatedAt = now;
    } else {
      nextFiles.push({
        path: 'src/vault-modules.css',
        content: `${finalVaultCss}\n`,
        language: 'css',
        summary: `CSS đồng bộ cho ${allActiveSlots.length} khối Vault & công thức chuyển động`,
        updatedAt: now,
      });
    }
  }

  // Guarantee working, syntax-valid src/app.js with scoped Vault module JS + Knowledge recipe JS
  const sanitizeJsSnippet = (raw: string): string =>
    raw
      .replace(/^\s*<script\b[^>]*>\s*/i, '')
      .replace(/\s*<\/script>\s*$/i, '')
      .replace(/^\s*<\/?script\b[^>]*>\s*$/gim, '')
      .trim();

  const isJsSyntaxValid = (code: string): boolean => {
    if (!code.trim()) return false;
    try {
      // WHY: Validate syntax before bundling so a stray HTML tag or truncated LLM block never crashes all preview listeners.
      new Function(code);
      return true;
    } catch {
      return false;
    }
  };

  const slotJsHooks = allActiveSlots
    .map((slot) => scopeVaultJs(slot.js, slot.id))
    .filter((hook) => Boolean(hook) && isJsSyntaxValid(hook));
  const existingAppJs = nextFiles.find((f) => f.path.toLowerCase() === 'src/app.js');
  if (existingAppJs) {
    existingAppJs.content = sanitizeJsSnippet(existingAppJs.content);
  }
  const hasRealAiJs = Boolean(
    existingAppJs &&
      existingAppJs.content.trim().length >= 60 &&
      isJsSyntaxValid(existingAppJs.content)
  );
  const appendedHooks = [
    ...slotJsHooks,
    motionAssets.js,
    hasRealAiJs ? '' : buildFallbackInteractiveAppJs(),
  ]
    .filter(Boolean)
    .join('\n\n');

  if (appendedHooks) {
    if (existingAppJs && hasRealAiJs) {
      existingAppJs.content = `${existingAppJs.content.trimEnd()}\n\n${appendedHooks}\n`;
      existingAppJs.updatedAt = now;
    } else if (existingAppJs) {
      existingAppJs.content = `${appendedHooks}\n`;
      existingAppJs.updatedAt = now;
    } else {
      nextFiles.push({
        path: 'src/app.js',
        content: `${appendedHooks}\n`,
        language: 'javascript',
        summary: 'Tương tác giao diện, khối Vault và hiệu ứng chuyển động',
        updatedAt: now,
      });
    }
  }

  if (
    nextFiles.some((f) => f.path.toLowerCase() === 'src/app.js') &&
    !/src=["'](?:\.\/)?src\/app\.js["']/i.test(nextHtml)
  ) {
    if (/<\/body>/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(/<\/body>/i, '  <script src="src/app.js"></script>\n</body>');
    } else {
      nextHtml += '\n<script src="src/app.js"></script>\n';
    }
  }

  htmlFile.content = nextHtml;
  htmlFile.updatedAt = now;

  // Truthful final inspection: report ONLY Vault modules and Knowledge recipes genuinely present in final output
  const embeddedVaultIds = allActiveSlots
    .filter((slot) => nextHtml.includes(`data-vault-id="${slot.id}"`) || aiEmbeddedIds.has(slot.id))
    .map((slot) => slot.id);
  const embeddedRecipeIds = recipes
    .filter((r) => nextHtml.includes(`data-knowledge-recipe="${r.id}"`) || motionAssets.primaryId === r.id)
    .map((r) => r.id);

  return {
    files: sortProjectFiles(nextFiles),
    embeddedVaultIds,
    embeddedRecipeIds,
  };
}
