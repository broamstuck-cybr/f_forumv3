import type { VaultShardPayload } from '../features/explore/vaultLoader';
import type { FilePatchOp, VaultSlotBrief, WorkspaceAssemblyPlan, WorkspaceFile } from '../types/index';
import type { MatchedVaultResource } from '../types/workspaceV4';
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

  const explicitBuild =
    /\b(tao trang|dung trang|dung web|lam trang|lam web|thiet ke trang|thiet ke web|xay dung trang|tao website|dung ho so|lam landing|tao landing|tao app|tao ung dung|dung ung dung|tao dashboard|ghep mau|lap ghep|build a|create a|make a|design a|scaffold|generate html|viet react tsx)\b/.test(
      clean
    );

  const explicitEdit =
    hasExistingFiles &&
    /\b(doi nen|nen sang|nen toi|them cau hoi|them muc|them form|dem nguoc|doi mau|mau cam|rut gon chu|sua tieu de|chinh sua|cap nhat|doi font|bo muc|xoa muc|them phan|sua nut|thay doi|sua loi|fix loi|fix error|runtime error|toi uu di dong|them hieu ung|lam gon)\b/.test(
      clean
    );

  if (explicitEdit && !explicitBuild) return 'patch';

  const questionLead =
    /^(f-?forum|web nay|trang nay|du an|github|repo|kho tai nguyen|kho mau|tai nguyen|admin|cach|lam sao|huong dan|giai thich|gioi thieu|tim|goi y|de xuat|liet ke|so sanh|hoi|cho hoi|co nhung|co gi|o dau|tai sao|vi sao|la gi|ban la ai|ban lam duoc gi|xin chao|hello|hi\b|chao\b|test\b)/.test(
      clean
    );
  const hasQuestion =
    prompt.includes('?') ||
    /\b(la gi|o dau|nhu the nao|ra sao|co bao nhieu|tim giup|goi y giup|huong dan giup|cau truc github|file nao|xu ly o dau|doi api key)\b/.test(
      clean
    );

  if ((questionLead || hasQuestion) && !explicitBuild && !explicitEdit) {
    return 'assistant';
  }
  if (hasExistingFiles && !explicitBuild) return 'patch';
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
        if (sel === ':root' || sel === 'html' || sel === 'body' || sel === 'html, body') {
          return scopeSelector;
        }
        if (/^(html|body)\b/.test(sel)) {
          return sel.replace(/^(html|body)\b/, scopeSelector);
        }
        return `${scopeSelector} ${sel}`;
      });

    if (selectors.length > 0 && body.trim()) {
      // Strip full-viewport fixed height/overflow from body rules mapped onto the slot box
      const safeBody = body
        .replace(/\bmin-height\s*:\s*100d?vh\s*;?/gi, 'min-height: 220px;')
        .replace(/\bheight\s*:\s*100d?vh\s*;?/gi, 'min-height: 220px;');
      out.push(`${selectors.join(', ')} { ${safeBody.trim()} }`);
    }
  }

  return out.join('\n');
}

export function buildStitchedVaultSlots(
  candidates: Array<{ match: MatchedVaultResource; payload?: VaultShardPayload }>
): StitchedVaultSlot[] {
  const slots: StitchedVaultSlot[] = [];

  for (const item of candidates) {
    const p = item.payload;
    if (!p) continue;
    const rawHtml = (p.h || '').trim();
    const rawCss = [extractInlineStyles(rawHtml), (p.c || '').trim()].filter(Boolean).join('\n');
    const rawJs = [extractInlineScripts(rawHtml), (p.j || '').trim()].filter(Boolean).join('\n');
    const innerHtml = extractBodyInnerHtml(rawHtml);

    // Only stitch real renderable HTML+CSS modules (skip empty or Tailwind-CDN-only stubs without styles)
    const hasUsefulMarkup = innerHtml.length >= 24 && innerHtml.length <= 12_000;
    const hasUsefulStyle = rawCss.length >= 20 && rawCss.length <= 18_000;
    if (!hasUsefulMarkup || !hasUsefulStyle) continue;

    const safeJs =
      rawJs.length <= 6000 && !/^\s*(import|export)\s+/m.test(rawJs)
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

    if (slots.length >= 3) break;
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
