import type { WorkspaceFile } from '../types/index';
import { hardenPreviewHtml, stripPreviewGuardScripts } from '../utils/hardenPreviewHtml';

export interface BundleDiagnostic {
  level: 'error' | 'warn' | 'info';
  message: string;
  file?: string;
  line?: number;
}

export interface BundleProjectResult {
  previewHtml: string;
  standaloneHtml: string;
  diagnostics: BundleDiagnostic[];
  mode: 'html' | 'react-tsx';
  entryPath: string;
}

export interface SplitHtmlMeta {
  title?: string;
  domain?: string;
  personality?: string;
  motionSignature?: string;
  sources?: Array<{ id: string; title: string; library: string }>;
}

export interface FileDiffSummary {
  path: string;
  action: 'create' | 'edit';
  added: number;
  removed: number;
}

export function detectLanguageFromPath(filePath: string): WorkspaceFile['language'] {
  const lower = filePath.toLowerCase();
  if (/\.html?$/.test(lower)) return 'html';
  if (/\.css$/.test(lower)) return 'css';
  if (/\.json$/.test(lower)) return 'json';
  if (/\.(md|txt)$/.test(lower)) return 'markdown';
  if (/\.(tsx?|mts|cts)$/.test(lower)) return 'typescript';
  return 'javascript';
}

export function sanitizeVirtualPath(rawPath: string): string | null {
  const normalized = (rawPath || '')
    .replace(/\\/g, '/')
    .trim()
    .replace(/^\.\/+/, '')
    .replace(/^\/+/, '')
    .replace(/\/{2,}/g, '/');

  if (!normalized || normalized.length > 120) return null;
  if (normalized.includes('\0') || normalized.endsWith('/')) return null;

  const segments = normalized.split('/');
  for (const seg of segments) {
    if (!seg || seg === '.' || seg === '..') return null;
    if (!/^[A-Za-z0-9._-]+$/.test(seg)) return null;
  }

  return normalized;
}

function fileSortWeight(filePath: string): number {
  const lower = filePath.toLowerCase();
  if (lower === 'index.html') return 0;
  if (lower === 'src/app.tsx' || lower === 'app.tsx') return 1;
  if (lower === 'src/main.tsx' || lower === 'src/index.tsx') return 2;
  if (lower === 'src/styles.css' || lower === 'styles.css') return 3;
  if (lower === 'src/app.js' || lower === 'app.js') return 4;
  if (lower.startsWith('src/')) return 10;
  if (lower === 'metadata.json') return 90;
  if (lower === 'readme.md') return 95;
  return 50;
}

export function sortProjectFiles(files: WorkspaceFile[]): WorkspaceFile[] {
  return [...files].sort((a, b) => {
    const wa = fileSortWeight(a.path);
    const wb = fileSortWeight(b.path);
    if (wa !== wb) return wa - wb;
    return a.path.localeCompare(b.path);
  });
}

export function createStarterFileContent(filePath: string): string {
  const lower = filePath.toLowerCase();
  const baseName = (filePath.split('/').pop() || 'Component').replace(/\.[^.]+$/, '');
  const pascalName =
    baseName
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('') || 'CustomBlock';

  if (/\.tsx$/.test(lower)) {
    if (lower.endsWith('app.tsx')) {
      return `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState<number>(0);

  return (
    <main className="app-shell">
      <h1>F-Forum Studio App</h1>
      <p>Chỉnh sửa trực tiếp src/App.tsx để xem cập nhật ngay lập tức.</p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Đã bấm {count} lần
      </button>
    </main>
  );
}
`;
    }
    return `import React from 'react';

export interface ${pascalName}Props {
  title?: string;
}

export function ${pascalName}({ title = '${pascalName}' }: ${pascalName}Props) {
  return (
    <section className="card">
      <h2>{title}</h2>
    </section>
  );
}

export default ${pascalName};
`;
  }

  if (/\.jsx$/.test(lower)) {
    return `import React from 'react';

export default function ${pascalName}() {
  return (
    <section className="card">
      <h2>${pascalName}</h2>
    </section>
  );
}
`;
  }

  if (/\.ts$/.test(lower)) {
    return `export interface ${pascalName}Item {
  id: string;
  label: string;
}

export const items: ${pascalName}Item[] = [
  { id: '1', label: 'Mục đầu tiên' },
];
`;
  }

  if (/\.css$/.test(lower)) {
    return `/* ${filePath} */
:root {
  --surface-accent: #38c99a;
}
`;
  }

  if (/\.json$/.test(lower)) {
    return JSON.stringify({ name: baseName, items: [] }, null, 2) + '\n';
  }

  if (/\.md$/.test(lower)) {
    return `# ${pascalName}\n\nGhi chú cho dự án.\n`;
  }

  if (/\.html?$/.test(lower)) {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pascalName}</title>
</head>
<body>
  <main>
    <h1>${pascalName}</h1>
  </main>
</body>
</html>
`;
  }

  return `export function init${pascalName}() {
  console.log('${filePath} ready');
}
`;
}

function unindentBlock(raw: string): string {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length === 0) return '';

  let minIndent = Number.POSITIVE_INFINITY;
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/^[ \t]+/);
    const indent = match ? match[0].length : 0;
    if (indent < minIndent) minIndent = indent;
  }
  if (!Number.isFinite(minIndent) || minIndent <= 0) {
    return lines.join('\n');
  }
  return lines.map((line) => (line.trim() ? line.slice(minIndent) : '')).join('\n');
}

function extractTitleFromHtml(rawHtml: string): string {
  const match = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (match && match[1]) {
    return match[1].replace(/\s+/g, ' ').trim();
  }
  const h1 = rawHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1 && h1[1]) {
    return h1[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }
  return 'Dự án F-Forum';
}

export function splitHtmlToProjectFiles(
  rawHtml: string,
  meta?: SplitHtmlMeta
): WorkspaceFile[] {
  const now = new Date().toISOString();
  const cleanSource = stripPreviewGuardScripts((rawHtml || '').trim());
  const title = meta?.title?.trim() || extractTitleFromHtml(cleanSource);

  const cssChunks: string[] = [];
  let htmlClean = cleanSource.replace(
    /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
    (_, cssBody: string) => {
      const normalized = unindentBlock(cssBody);
      if (normalized) cssChunks.push(normalized);
      return '';
    }
  );

  const jsChunks: string[] = [];
  htmlClean = htmlClean.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (fullTag: string, attrs: string, scriptBody: string) => {
      if (/\bsrc\s*=/i.test(attrs)) {
        return fullTag;
      }
      const typeMatch = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i);
      const scriptType = typeMatch ? typeMatch[1].toLowerCase() : '';
      if (
        scriptType &&
        scriptType !== 'text/javascript' &&
        scriptType !== 'application/javascript' &&
        scriptType !== 'module'
      ) {
        return fullTag;
      }
      const normalized = unindentBlock(scriptBody);
      if (normalized) jsChunks.push(normalized);
      return '';
    }
  );

  const hasCss = cssChunks.length > 0;
  const hasJs = jsChunks.length > 0;

  if (!/<html\b/i.test(htmlClean)) {
    htmlClean = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title.replace(/[<>"]/g, '')}</title>
</head>
<body>
${htmlClean}
</body>
</html>`;
  }

  if (hasCss && !/href\s*=\s*["'](?:\.\/)?src\/styles\.css["']/i.test(htmlClean)) {
    const linkTag = '  <link rel="stylesheet" href="src/styles.css" />';
    if (/<\/head>/i.test(htmlClean)) {
      htmlClean = htmlClean.replace(/<\/head>/i, `${linkTag}\n</head>`);
    } else {
      htmlClean = `${linkTag}\n${htmlClean}`;
    }
  }

  if (hasJs && !/src\s*=\s*["'](?:\.\/)?src\/app\.js["']/i.test(htmlClean)) {
    const scriptTag = '  <script src="src/app.js"></script>';
    if (/<\/body>/i.test(htmlClean)) {
      htmlClean = htmlClean.replace(/<\/body>/i, `${scriptTag}\n</body>`);
    } else {
      htmlClean = `${htmlClean}\n${scriptTag}`;
    }
  }

  htmlClean = htmlClean.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  const files: WorkspaceFile[] = [
    {
      path: 'index.html',
      content: htmlClean,
      language: 'html',
      summary: 'Cấu trúc trang chính',
      updatedAt: now,
    },
  ];

  if (hasCss) {
    files.push({
      path: 'src/styles.css',
      content: `${cssChunks.join('\n\n')}\n`,
      language: 'css',
      summary: 'Hệ thống màu, kiểu chữ và bố cục',
      updatedAt: now,
    });
  }

  if (hasJs) {
    files.push({
      path: 'src/app.js',
      content: `${jsChunks.join('\n\n')}\n`,
      language: 'javascript',
      summary: 'Tương tác giao diện và xử lý sự kiện',
      updatedAt: now,
    });
  }

  const metadata = {
    name: title,
    mode: 'multi-file-web',
    domain: meta?.domain || 'web',
    personality: meta?.personality || 'modern',
    motionSignature: meta?.motionSignature || 'standard',
    entry: 'index.html',
    sources: (meta?.sources || []).map((s) => ({
      id: s.id,
      title: s.title,
      library: s.library,
    })),
    updatedAt: now,
  };

  files.push({
    path: 'metadata.json',
    content: `${JSON.stringify(metadata, null, 2)}\n`,
    language: 'json',
    summary: 'Thông tin cấu hình dự án',
    updatedAt: now,
  });

  const fileListMd = files.map((f) => `- \`${f.path}\`: ${f.summary || f.language}`).join('\n');
  files.push({
    path: 'README.md',
    content: `# ${title}

Dự án đa tệp dựng từ F-Forum Workspace.

## Cấu trúc tệp

${fileListMd}

## Cách chạy ngoại tuyến

Mở trực tiếp tệp \`standalone.html\` trong gói ZIP bằng trình duyệt, hoặc mở thư mục bằng máy chủ tĩnh.
`,
    language: 'markdown',
    summary: 'Hướng dẫn cấu trúc và cách chạy',
    updatedAt: now,
  });

  return sortProjectFiles(files);
}

export function computeLineDiffStats(
  prevContent: string | null | undefined,
  nextContent: string
): { added: number; removed: number } {
  const nextLines = nextContent.split('\n');
  if (!prevContent) {
    return { added: nextLines.length, removed: 0 };
  }
  const prevLines = prevContent.split('\n');
  const prevCounts = new Map<string, number>();
  for (const line of prevLines) {
    const k = line.trim();
    if (!k) continue;
    prevCounts.set(k, (prevCounts.get(k) ?? 0) + 1);
  }
  let added = 0;
  for (const line of nextLines) {
    const k = line.trim();
    if (!k) continue;
    const rem = prevCounts.get(k) ?? 0;
    if (rem > 0) {
      prevCounts.set(k, rem - 1);
    } else {
      added += 1;
    }
  }
  let removed = 0;
  for (const count of prevCounts.values()) {
    removed += count;
  }
  return { added, removed };
}

export function computeProjectFileDiffs(
  previousFiles: WorkspaceFile[],
  nextFiles: WorkspaceFile[]
): FileDiffSummary[] {
  const prevMap = new Map(previousFiles.map((f) => [f.path, f.content]));
  const diffs: FileDiffSummary[] = [];

  for (const file of nextFiles) {
    const prev = prevMap.get(file.path);
    if (prev === undefined) {
      diffs.push({
        path: file.path,
        action: 'create',
        added: file.content.split('\n').length,
        removed: 0,
      });
    } else if (prev !== file.content) {
      const stats = computeLineDiffStats(prev, file.content);
      diffs.push({
        path: file.path,
        action: 'edit',
        added: Math.max(1, stats.added),
        removed: stats.removed,
      });
    }
  }

  return diffs;
}

/* -------------------------------------------------------------------------- */
/* Lightweight Browser-Safe TypeScript + JSX Transpiler (Zero External CDN)   */
/* -------------------------------------------------------------------------- */

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_$]/.test(ch);
}

function isIdentPart(ch: string): boolean {
  return /[A-Za-z0-9_$]/.test(ch);
}

function skipString(src: string, start: number): number {
  const quote = src[start];
  let i = start + 1;
  while (i < src.length) {
    if (src[i] === '\\') {
      i += 2;
      continue;
    }
    if (src[i] === quote) return i + 1;
    i += 1;
  }
  return src.length;
}

function skipComment(src: string, start: number): number {
  if (src[start] === '/' && src[start + 1] === '/') {
    const nl = src.indexOf('\n', start + 2);
    return nl === -1 ? src.length : nl;
  }
  if (src[start] === '/' && src[start + 1] === '*') {
    const end = src.indexOf('*/', start + 2);
    return end === -1 ? src.length : end + 2;
  }
  return start;
}

function skipBalanced(src: string, start: number, open: string, close: string): number {
  let depth = 0;
  let i = start;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\'' || ch === '"' || ch === '`') {
      i = skipString(src, i);
      continue;
    }
    if (ch === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) {
      i = skipComment(src, i);
      continue;
    }
    if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return src.length;
}

function skipTypeExpr(src: string, start: number, stopChars: string): number {
  let i = start;
  let angle = 0;
  let paren = 0;
  let brace = 0;
  let bracket = 0;

  while (i < src.length) {
    const ch = src[i];
    if (ch === '\'' || ch === '"' || ch === '`') {
      i = skipString(src, i);
      continue;
    }
    if (ch === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) {
      i = skipComment(src, i);
      continue;
    }
    if (ch === '=' && src[i + 1] === '>') {
      if (angle === 0 && paren === 0 && brace === 0 && bracket === 0) {
        if (stopChars.includes('>')) return i;
        // Function type arrow inside a type annotation like `onClick: (x: number) => void`
        i += 2;
        continue;
      }
      i += 2;
      continue;
    }
    if (angle === 0 && paren === 0 && brace === 0 && bracket === 0 && stopChars.includes(ch)) {
      return i;
    }
    if (ch === '<') angle += 1;
    else if (ch === '>' && angle > 0) angle -= 1;
    else if (ch === '(') paren += 1;
    else if (ch === ')' && paren > 0) paren -= 1;
    else if (ch === '{') brace += 1;
    else if (ch === '}' && brace > 0) brace -= 1;
    else if (ch === '[') bracket += 1;
    else if (ch === ']' && bracket > 0) bracket -= 1;
    i += 1;
  }
  return i;
}

function stripParamTypes(paramContent: string): string {
  let out = '';
  let i = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;

  while (i < paramContent.length) {
    const ch = paramContent[i];
    if (ch === '\'' || ch === '"' || ch === '`') {
      const end = skipString(paramContent, i);
      out += paramContent.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '/' && (paramContent[i + 1] === '/' || paramContent[i + 1] === '*')) {
      const end = skipComment(paramContent, i);
      out += paramContent.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '{') {
      braceDepth += 1;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      out += ch;
      i += 1;
      continue;
    }
    if (ch === '[') {
      bracketDepth += 1;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      out += ch;
      i += 1;
      continue;
    }
    if (ch === '(') {
      parenDepth += 1;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      out += ch;
      i += 1;
      continue;
    }

    if (braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
      if (ch === '?' && paramContent[i + 1] === ':') {
        const end = skipTypeExpr(paramContent, i + 2, ',=');
        i = end;
        continue;
      }
      if (ch === '?') {
        const nextNonWs = paramContent.slice(i + 1).trimStart()[0];
        if (!nextNonWs || nextNonWs === ',' || nextNonWs === '=') {
          i += 1;
          continue;
        }
      }
      if (ch === ':') {
        const end = skipTypeExpr(paramContent, i + 1, ',=');
        i = end;
        continue;
      }
    }

    out += ch;
    i += 1;
  }

  return out;
}

function stripTypeScriptSyntax(source: string): string {
  // 1. Remove `import type ...` and inline `type ` modifiers inside named imports
  let code = source
    .replace(/^\s*import\s+type\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/gm, '')
    .replace(/^\s*export\s+type\s+\{[\s\S]*?\}\s*(?:from\s+['"][^'"]+['"])?\s*;?/gm, '')
    .replace(
      /import\s*\{([^}]+)\}\s*from/g,
      (_m, names: string) => {
        const kept = names
          .split(',')
          .map((n) => n.trim())
          .filter((n) => n && !/^type\s+/.test(n));
        if (kept.length === 0) return 'import {} from';
        return `import { ${kept.join(', ')} } from`;
      }
    );

  // 2. Strip top-level `interface ... { ... }` and `type ... = ...;` declarations
  let cleaned = '';
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\'' || ch === '"' || ch === '`') {
      const end = skipString(code, i);
      cleaned += code.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '/' && (code[i + 1] === '/' || code[i + 1] === '*')) {
      const end = skipComment(code, i);
      cleaned += code.slice(i, end);
      i = end;
      continue;
    }

    const slice = code.slice(i);
    const prevCh = i > 0 ? code[i - 1] : '\n';
    const atBoundary = prevCh === '\n' || prevCh === ';' || prevCh === ' ' || prevCh === '\t' || prevCh === '{';

    if (atBoundary) {
      const ifaceMatch = slice.match(/^(?:export\s+)?interface\s+[A-Za-z_$][A-Za-z0-9_$]*[\s\S]*?\{/);
      if (ifaceMatch) {
        const braceStart = i + ifaceMatch[0].length - 1;
        const braceEnd = skipBalanced(code, braceStart, '{', '}');
        cleaned += '\n';
        i = braceEnd;
        continue;
      }

      const typeAliasMatch = slice.match(/^(?:export\s+)?type\s+[A-Za-z_$][A-Za-z0-9_$]*(?:\s*<[^>]+>)?\s*=/);
      if (typeAliasMatch) {
        let j = i + typeAliasMatch[0].length;
        let depthBrace = 0;
        let depthParen = 0;
        let depthBracket = 0;
        let depthAngle = 0;
        while (j < code.length) {
          const c = code[j];
          if (c === '\'' || c === '"' || c === '`') {
            j = skipString(code, j);
            continue;
          }
          if (c === '/' && (code[j + 1] === '/' || code[j + 1] === '*')) {
            j = skipComment(code, j);
            continue;
          }
          if (c === '{') depthBrace += 1;
          else if (c === '}') {
            depthBrace = Math.max(0, depthBrace - 1);
            if (depthBrace === 0 && depthParen === 0 && depthBracket === 0) {
              const after = code.slice(j + 1).trimStart();
              if (after[0] === ';') {
                j = code.indexOf(';', j + 1) + 1;
                break;
              }
              if (after[0] !== '|' && after[0] !== '&') {
                j += 1;
                break;
              }
            }
          } else if (c === '(') depthParen += 1;
          else if (c === ')') depthParen = Math.max(0, depthParen - 1);
          else if (c === '[') depthBracket += 1;
          else if (c === ']') depthBracket = Math.max(0, depthBracket - 1);
          else if (c === '<') depthAngle += 1;
          else if (c === '>') depthAngle = Math.max(0, depthAngle - 1);
          else if (c === ';' && depthBrace === 0 && depthParen === 0 && depthBracket === 0 && depthAngle === 0) {
            j += 1;
            break;
          }
          j += 1;
        }
        cleaned += '\n';
        i = j;
        continue;
      }
    }

    cleaned += ch;
    i += 1;
  }

  // 3. Strip generic calls on React hooks & helpers: useState<Foo>(...), useRef<HTMLDivElement | null>(...)
  cleaned = cleaned.replace(
    /\b(useState|useRef|useReducer|useMemo|useCallback|createContext|forwardRef|Array|Set|Map)\s*<([^>\n;{}]+)>\s*\(/g,
    '$1('
  );

  // 4. Strip variable type annotations: `const x: Foo<Bar> = ...` (only outside strings/comments)
  let out = '';
  i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (ch === '\'' || ch === '"' || ch === '`') {
      const end = skipString(cleaned, i);
      out += cleaned.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '/' && (cleaned[i + 1] === '/' || cleaned[i + 1] === '*')) {
      const end = skipComment(cleaned, i);
      out += cleaned.slice(i, end);
      i = end;
      continue;
    }

    const tail = cleaned.slice(i);
    const varMatch = tail.match(/^(const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*/);
    if (varMatch && (i === 0 || !isIdentPart(cleaned[i - 1]))) {
      const typeStart = i + varMatch[0].length;
      const eqPos = skipTypeExpr(cleaned, typeStart, '=;\n');
      if (cleaned[eqPos] === '=' && cleaned[eqPos + 1] !== '>') {
        out += `${varMatch[1]} ${varMatch[2]} `;
        i = eqPos;
        continue;
      }
    }

    // Function declarations: `function name<T>(params): ReturnType {`
    const fnMatch = tail.match(/^function\s+([A-Za-z_$][A-Za-z0-9_$]*)?(?:\s*<[^>]+>)?\s*\(/);
    if (fnMatch && (i === 0 || !isIdentPart(cleaned[i - 1]))) {
      const openParen = i + fnMatch[0].length - 1;
      const closeParen = skipBalanced(cleaned, openParen, '(', ')');
      const rawParams = cleaned.slice(openParen + 1, closeParen - 1);
      const cleanParams = stripParamTypes(rawParams);
      out += `function${fnMatch[1] ? ` ${fnMatch[1]}` : ''}(${cleanParams})`;
      let after = closeParen;
      while (after < cleaned.length && /\s/.test(cleaned[after])) after += 1;
      if (cleaned[after] === ':') {
        const bracePos = skipTypeExpr(cleaned, after + 1, '{');
        out += ' ';
        i = bracePos;
      } else {
        i = closeParen;
      }
      continue;
    }

    // Arrow functions with typed params: `(a: string, b?: number): void =>`
    if (ch === '(') {
      const closeParen = skipBalanced(cleaned, i, '(', ')');
      let after = closeParen;
      while (after < cleaned.length && (cleaned[after] === ' ' || cleaned[after] === '\t')) after += 1;
      let arrowPos = -1;
      if (cleaned[after] === '=' && cleaned[after + 1] === '>') {
        arrowPos = after;
      } else if (cleaned[after] === ':') {
        const retEnd = skipTypeExpr(cleaned, after + 1, '=');
        if (cleaned[retEnd] === '=' && cleaned[retEnd + 1] === '>') {
          arrowPos = retEnd;
        }
      }
      if (arrowPos !== -1) {
        const rawParams = cleaned.slice(i + 1, closeParen - 1);
        const cleanParams = stripParamTypes(rawParams);
        out += `(${cleanParams}) =>`;
        i = arrowPos + 2;
        continue;
      }
    }

    // `as Type` assertions (including string literal unions like `as 'dark' | 'light'`, not inside import/export braces)
    const asMatch = tail.match(/^\s+as\s+(?=const\b|[A-Za-z_$'"`{(\[])/);
    if (asMatch && i > 0 && /[A-Za-z0-9_$)\]"'`]/.test(cleaned[i - 1])) {
      const prevLine = cleaned.slice(Math.max(0, cleaned.lastIndexOf('\n', i)), i);
      if (!/\b(?:import|export)\b/.test(prevLine)) {
        const afterAs = i + tail.indexOf('as') + 2;
        const typeEnd = skipTypeExpr(cleaned, afterAs, ',;)}\n');
        i = typeEnd;
        continue;
      }
    }

    out += ch;
    i += 1;
  }

  return out;
}

const JSX_EXPR_PRECEDERS = new Set([
  '(', '[', '{', ',', ':', '?', '=', '!', '&', '|', ';', '+', '-', '*', '/', '%', '>', '\n',
]);

function canStartJsx(code: string, pos: number): boolean {
  let j = pos - 1;
  while (j >= 0 && (code[j] === ' ' || code[j] === '\t' || code[j] === '\r')) j -= 1;
  if (j < 0) return true;
  const ch = code[j];
  if (JSX_EXPR_PRECEDERS.has(ch)) return true;
  // Check preceding keyword: return, case, throw, default, yield, await
  if (isIdentPart(ch)) {
    let k = j;
    while (k >= 0 && isIdentPart(code[k])) k -= 1;
    const word = code.slice(k + 1, j + 1);
    return (
      word === 'return' ||
      word === 'case' ||
      word === 'throw' ||
      word === 'default' ||
      word === 'yield' ||
      word === 'await'
    );
  }
  return false;
}

function escapeJsString(text: string): string {
  return JSON.stringify(text);
}

function parseJsxExpression(src: string, openBrace: number): { code: string; next: number } {
  let depth = 0;
  let i = openBrace;
  let inner = '';
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\'' || ch === '"') {
      const end = skipString(src, i);
      inner += src.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '`') {
      const end = skipString(src, i);
      inner += src.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) {
      const end = skipComment(src, i);
      inner += src.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      if (depth > 1) inner += ch;
      i += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return { code: transformJsxInSource(inner), next: i + 1 };
      }
      inner += ch;
      i += 1;
      continue;
    }
    if (ch === '<' && canStartJsx(inner, inner.length) && looksLikeJsxTag(src, i)) {
      const parsed = parseJsxElement(src, i);
      if (parsed) {
        inner += parsed.code;
        i = parsed.next;
        continue;
      }
    }
    inner += ch;
    i += 1;
  }
  return { code: transformJsxInSource(inner), next: src.length };
}

function looksLikeJsxTag(src: string, pos: number): boolean {
  if (src[pos] !== '<') return false;
  if (src[pos + 1] === '>') return true; // Fragment <>
  if (!isIdentStart(src[pos + 1] || '')) return false;
  // Scan tag name
  let j = pos + 1;
  while (j < src.length && (isIdentPart(src[j]) || src[j] === '.' || src[j] === '-')) j += 1;
  const next = src[j];
  return next === '>' || next === '/' || next === ' ' || next === '\n' || next === '\r' || next === '\t';
}

function parseJsxElement(src: string, start: number): { code: string; next: number } | null {
  if (src[start] !== '<') return null;

  let i = start + 1;
  let isFragment = false;
  let tagName = '';

  if (src[i] === '>') {
    isFragment = true;
    i += 1;
  } else {
    if (!isIdentStart(src[i] || '')) return null;
    const tagStart = i;
    while (i < src.length && (isIdentPart(src[i]) || src[i] === '.' || src[i] === '-')) {
      i += 1;
    }
    tagName = src.slice(tagStart, i);
  }

  const tagExpr = isFragment
    ? 'React.Fragment'
    : /^[A-Z]/.test(tagName) || tagName.includes('.')
      ? tagName
      : escapeJsString(tagName);

  const propParts: Array<{ spread: boolean; expr: string; key?: string }> = [];
  let selfClosing = false;

  if (!isFragment) {
    while (i < src.length) {
      while (i < src.length && /\s/.test(src[i])) i += 1;
      if (src[i] === '/' && src[i + 1] === '>') {
        selfClosing = true;
        i += 2;
        break;
      }
      if (src[i] === '>') {
        i += 1;
        break;
      }
      if (src[i] === '{' && src.slice(i + 1).trimStart().startsWith('...')) {
        const exprRes = parseJsxExpression(src, i);
        const spreadCode = exprRes.code.trim().replace(/^\.\.\./, '');
        propParts.push({ spread: true, expr: spreadCode });
        i = exprRes.next;
        continue;
      }
      const attrStart = i;
      while (i < src.length && /[A-Za-z0-9_:-]/.test(src[i])) i += 1;
      const attrName = src.slice(attrStart, i);
      if (!attrName) return null;

      while (i < src.length && /\s/.test(src[i])) i += 1;
      if (src[i] === '=') {
        i += 1;
        while (i < src.length && /\s/.test(src[i])) i += 1;
        if (src[i] === '"' || src[i] === '\'') {
          const end = skipString(src, i);
          const rawVal = src.slice(i + 1, end - 1);
          propParts.push({ spread: false, key: attrName, expr: escapeJsString(rawVal) });
          i = end;
        } else if (src[i] === '{') {
          const exprRes = parseJsxExpression(src, i);
          propParts.push({ spread: false, key: attrName, expr: exprRes.code.trim() || 'undefined' });
          i = exprRes.next;
        } else {
          return null;
        }
      } else {
        propParts.push({ spread: false, key: attrName, expr: 'true' });
      }
    }
  }

  let propsCode = 'null';
  if (propParts.length > 0) {
    const hasSpread = propParts.some((p) => p.spread);
    if (!hasSpread) {
      const pairs = propParts.map((p) => `${escapeJsString(p.key || '')}: ${p.expr}`);
      propsCode = `{ ${pairs.join(', ')} }`;
    } else {
      const args: string[] = ['{}'];
      let bucket: string[] = [];
      const flush = () => {
        if (bucket.length > 0) {
          args.push(`{ ${bucket.join(', ')} }`);
          bucket = [];
        }
      };
      for (const p of propParts) {
        if (p.spread) {
          flush();
          args.push(p.expr);
        } else {
          bucket.push(`${escapeJsString(p.key || '')}: ${p.expr}`);
        }
      }
      flush();
      propsCode = `Object.assign(${args.join(', ')})`;
    }
  }

  if (selfClosing) {
    return { code: `React.createElement(${tagExpr}, ${propsCode})`, next: i };
  }

  // Parse children until matching closing tag
  const children: string[] = [];
  let textBuf = '';

  const flushText = () => {
    if (!textBuf) return;
    const cleaned = textBuf
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line, idx, arr) => {
        let s = line;
        if (idx > 0) s = s.replace(/^[ \t]+/, '');
        if (idx < arr.length - 1) s = s.replace(/[ \t]+$/, '');
        return s;
      })
      .filter((line, idx, arr) => !(line === '' && (idx === 0 || idx === arr.length - 1)))
      .join(' ');
    textBuf = '';
    if (cleaned) {
      children.push(escapeJsString(cleaned));
    }
  };

  while (i < src.length) {
    if (src[i] === '<' && src[i + 1] === '/') {
      flushText();
      const closeEnd = src.indexOf('>', i + 2);
      if (closeEnd === -1) return null;
      i = closeEnd + 1;
      break;
    }
    if (src[i] === '<' && looksLikeJsxTag(src, i)) {
      flushText();
      const childEl = parseJsxElement(src, i);
      if (childEl) {
        children.push(childEl.code);
        i = childEl.next;
        continue;
      }
    }
    if (src[i] === '{') {
      flushText();
      const exprRes = parseJsxExpression(src, i);
      const trimmed = exprRes.code.trim();
      const isCommentOnly = /^\/\*[\s\S]*\*\/$/.test(trimmed);
      if (trimmed && !isCommentOnly) {
        children.push(trimmed);
      }
      i = exprRes.next;
      continue;
    }
    textBuf += src[i];
    i += 1;
  }

  const allArgs = [tagExpr, propsCode, ...children];
  return { code: `React.createElement(${allArgs.join(', ')})`, next: i };
}

function transformJsxInSource(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\'' || ch === '"' || ch === '`') {
      const end = skipString(src, i);
      out += src.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) {
      const end = skipComment(src, i);
      out += src.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '<' && canStartJsx(out, out.length) && looksLikeJsxTag(src, i)) {
      const parsed = parseJsxElement(src, i);
      if (parsed) {
        out += parsed.code;
        i = parsed.next;
        continue;
      }
    }
    out += ch;
    i += 1;
  }
  return out;
}

function transformEsmToCommonJs(code: string): string {
  let out = code;

  // Side-effect imports (CSS, etc.)
  out = out.replace(/^\s*import\s+['"]([^'"]+)['"]\s*;?/gm, (_m, spec: string) => {
    if (/\.css$/i.test(spec)) return '';
    return `require(${JSON.stringify(spec)});`;
  });

  // `import Default, { a, b as c } from 'mod'`
  out = out.replace(
    /^\s*import\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*,\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/gm,
    (_m, defName: string, named: string, spec: string) => {
      const mapped = named
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/\s+as\s+/, ': '))
        .join(', ');
      return `const __m_${defName} = require(${JSON.stringify(spec)}); const ${defName} = __m_${defName}.default !== undefined ? __m_${defName}.default : __m_${defName}; const { ${mapped} } = __m_${defName};`;
    }
  );

  // `import * as Name from 'mod'`
  out = out.replace(
    /^\s*import\s+\*\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+from\s+['"]([^'"]+)['"]\s*;?/gm,
    (_m, nsName: string, spec: string) => `const ${nsName} = require(${JSON.stringify(spec)});`
  );

  // `import { a, b as c } from 'mod'`
  out = out.replace(
    /^\s*import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/gm,
    (_m, named: string, spec: string) => {
      const mapped = named
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/\s+as\s+/, ': '))
        .join(', ');
      if (!mapped) return '';
      return `const { ${mapped} } = require(${JSON.stringify(spec)});`;
    }
  );

  // `import Default from 'mod'`
  out = out.replace(
    /^\s*import\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+from\s+['"]([^'"]+)['"]\s*;?/gm,
    (_m, defName: string, spec: string) =>
      `const __m_${defName} = require(${JSON.stringify(spec)}); const ${defName} = __m_${defName}.default !== undefined ? __m_${defName}.default : __m_${defName};`
  );

  // `export default function Name(`
  out = out.replace(
    /^\s*export\s+default\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm,
    'exports.default = function $1'
  );

  // `export default`
  out = out.replace(/^\s*export\s+default\s+/gm, 'exports.default = ');

  // `export function Name(`
  const exportedNames: string[] = [];
  out = out.replace(
    /^\s*export\s+(async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm,
    (_m, asyncKw: string | undefined, name: string) => {
      exportedNames.push(name);
      return `${asyncKw || ''}function ${name}`;
    }
  );

  // `export const/let/var Name =`
  out = out.replace(
    /^\s*export\s+(const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm,
    (_m, kw: string, name: string) => {
      exportedNames.push(name);
      return `${kw} ${name}`;
    }
  );

  // `export { a, b as c }`
  out = out.replace(/^\s*export\s+\{([^}]+)\}\s*;?/gm, (_m, list: string) => {
    return list
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const parts = item.split(/\s+as\s+/);
        const local = parts[0].trim();
        const ext = (parts[1] || parts[0]).trim();
        return `exports.${ext} = ${local};`;
      })
      .join(' ');
  });

  if (exportedNames.length > 0) {
    out += `\n${exportedNames.map((n) => `exports.${n} = ${n};`).join('\n')}\n`;
  }

  return out;
}

export function transpileTsxToJs(source: string, isJsx: boolean): string {
  const withoutTs = stripTypeScriptSyntax(source);
  const withJsx = isJsx ? transformJsxInSource(withoutTs) : withoutTs;
  return transformEsmToCommonJs(withJsx);
}

/* -------------------------------------------------------------------------- */
/* Self-Contained Offline & CSP-Safe Mini-React 19 Compatible Runtime         */
/* -------------------------------------------------------------------------- */

const INLINE_REACT_RUNTIME = `(function(){
  var Fragment = Symbol('Fragment');
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var UNITLESS = { opacity:1, zIndex:1, fontWeight:1, lineHeight:1, flex:1, flexGrow:1, flexShrink:1, order:1, zoom:1, aspectRatio:1, gridColumn:1, gridRow:1, fillOpacity:1, strokeOpacity:1, strokeWidth:1 };
  var EVENT_MAP = { onDoubleClick: 'dblclick', onMouseEnter: 'mouseenter', onMouseLeave: 'mouseleave' };

  function flattenChildren(arr, out) {
    for (var i = 0; i < arr.length; i += 1) {
      var c = arr[i];
      if (c === null || c === undefined || typeof c === 'boolean') continue;
      if (Array.isArray(c)) flattenChildren(c, out);
      else out.push(c);
    }
    return out;
  }

  function createElement(type, props) {
    var children = [];
    for (var i = 2; i < arguments.length; i += 1) {
      children.push(arguments[i]);
    }
    var flat = flattenChildren(children, []);
    var nextProps = props ? Object.assign({}, props) : {};
    if (flat.length === 1) nextProps.children = flat[0];
    else if (flat.length > 1) nextProps.children = flat;
    return { $$typeof: 'ff.el', type: type, props: nextProps, key: nextProps.key !== undefined ? nextProps.key : null };
  }

  function createContext(defaultValue) {
    var ctx = { _currentValue: defaultValue };
    ctx.Provider = function(props) {
      return { $$typeof: 'ff.ctx', ctx: ctx, value: props.value, children: props.children };
    };
    return ctx;
  }

  var stateStore = new Map();
  var activeHooks = null;
  var hookCursor = 0;
  var pendingEffects = [];
  var scheduleRender = null;

  function useState(initial) {
    var hooks = activeHooks;
    var idx = hookCursor++;
    if (!(idx in hooks.slots)) {
      hooks.slots[idx] = typeof initial === 'function' ? initial() : initial;
    }
    var setState = function(next) {
      var prev = hooks.slots[idx];
      var val = typeof next === 'function' ? next(prev) : next;
      if (!Object.is(prev, val)) {
        hooks.slots[idx] = val;
        if (scheduleRender) scheduleRender();
      }
    };
    return [hooks.slots[idx], setState];
  }

  function useReducer(reducer, initialArg, initFn) {
    var initVal = initFn ? initFn(initialArg) : initialArg;
    var pair = useState(initVal);
    var dispatch = function(action) {
      pair[1](function(prev) { return reducer(prev, action); });
    };
    return [pair[0], dispatch];
  }

  function useRef(initial) {
    var hooks = activeHooks;
    var idx = hookCursor++;
    if (!(idx in hooks.slots)) {
      hooks.slots[idx] = { current: initial };
    }
    return hooks.slots[idx];
  }

  function depsChanged(prevDeps, nextDeps) {
    if (!prevDeps || !nextDeps || prevDeps.length !== nextDeps.length) return true;
    for (var i = 0; i < prevDeps.length; i += 1) {
      if (!Object.is(prevDeps[i], nextDeps[i])) return true;
    }
    return false;
  }

  function useMemo(factory, deps) {
    var hooks = activeHooks;
    var idx = hookCursor++;
    var slot = hooks.slots[idx];
    if (!slot || depsChanged(slot.deps, deps)) {
      var val = factory();
      hooks.slots[idx] = { value: val, deps: deps };
      return val;
    }
    return slot.value;
  }

  function useCallback(fn, deps) {
    return useMemo(function() { return fn; }, deps);
  }

  function useEffect(effect, deps) {
    var hooks = activeHooks;
    var idx = hookCursor++;
    var slot = hooks.slots[idx];
    if (!slot || !deps || depsChanged(slot.deps, deps)) {
      var record = { effect: effect, deps: deps, cleanup: slot ? slot.cleanup : null };
      hooks.slots[idx] = record;
      pendingEffects.push(record);
    }
  }

  function useContext(ctx) {
    return ctx._currentValue;
  }

  function applyStyle(dom, styleObj) {
    if (!styleObj || typeof styleObj !== 'object') return;
    Object.keys(styleObj).forEach(function(k) {
      var v = styleObj[k];
      if (v === null || v === undefined) return;
      if (k.startsWith('--')) {
        dom.style.setProperty(k, String(v));
      } else if (typeof v === 'number' && !UNITLESS[k] && v !== 0) {
        dom.style[k] = v + 'px';
      } else {
        dom.style[k] = String(v);
      }
    });
  }

  function renderNode(vnode, path, isSvg, touchedPaths) {
    if (vnode === null || vnode === undefined || typeof vnode === 'boolean') {
      return document.createTextNode('');
    }
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return document.createTextNode(String(vnode));
    }
    if (Array.isArray(vnode)) {
      var frag = document.createDocumentFragment();
      for (var a = 0; a < vnode.length; a += 1) {
        var cKey = vnode[a] && vnode[a].key !== null && vnode[a].key !== undefined ? String(vnode[a].key) : String(a);
        frag.appendChild(renderNode(vnode[a], path + '[' + cKey + ']', isSvg, touchedPaths));
      }
      return frag;
    }
    if (vnode.$$typeof === 'ff.ctx') {
      var prevVal = vnode.ctx._currentValue;
      vnode.ctx._currentValue = vnode.value;
      var rendered = renderNode(vnode.children, path + '.ctx', isSvg, touchedPaths);
      vnode.ctx._currentValue = prevVal;
      return rendered;
    }
    if (vnode.type === Fragment) {
      return renderNode(vnode.props.children, path + '.frag', isSvg, touchedPaths);
    }
    if (typeof vnode.type === 'function') {
      var compKey = path + ':' + (vnode.type.name || 'fn');
      touchedPaths.add(compKey);
      var hooks = stateStore.get(compKey);
      if (!hooks) {
        hooks = { slots: [] };
        stateStore.set(compKey, hooks);
      }
      var prevHooks = activeHooks;
      var prevCursor = hookCursor;
      activeHooks = hooks;
      hookCursor = 0;
      var out;
      try {
        out = vnode.type(vnode.props || {});
      } finally {
        activeHooks = prevHooks;
        hookCursor = prevCursor;
      }
      return renderNode(out, compKey, isSvg, touchedPaths);
    }

    var tag = String(vnode.type);
    var nextSvg = isSvg || tag === 'svg';
    var dom = nextSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    var props = vnode.props || {};

    Object.keys(props).forEach(function(k) {
      var v = props[k];
      if (k === 'children' || k === 'key' || v === undefined || v === null) return;
      if (k === 'ref') {
        if (typeof v === 'function') v(dom);
        else if (v && typeof v === 'object') v.current = dom;
        return;
      }
      if (k === 'dangerouslySetInnerHTML' && v && typeof v.__html === 'string') {
        dom.innerHTML = v.__html;
        return;
      }
      if (k === 'style') {
        applyStyle(dom, v);
        return;
      }
      if (k === 'className') {
        if (nextSvg) dom.setAttribute('class', String(v));
        else dom.className = String(v);
        return;
      }
      if (k === 'htmlFor') {
        dom.setAttribute('for', String(v));
        return;
      }
      if (k.startsWith('on') && typeof v === 'function') {
        var evt = EVENT_MAP[k] || k.slice(2).toLowerCase();
        if (evt === 'change' && (tag === 'input' || tag === 'textarea')) {
          var inputType = String(props.type || 'text').toLowerCase();
          if (inputType !== 'checkbox' && inputType !== 'radio' && inputType !== 'file') {
            evt = 'input';
          }
        }
        dom.addEventListener(evt, v);
        return;
      }
      if (typeof v === 'boolean') {
        if (v) dom.setAttribute(k, '');
        if (k in dom) dom[k] = v;
        return;
      }
      if ((k === 'value' || k === 'checked' || k === 'selectedIndex') && k in dom && !nextSvg) {
        dom[k] = v;
        if (k === 'value') dom.setAttribute('value', String(v));
        return;
      }
      dom.setAttribute(k, String(v));
    });

    if (props.children !== undefined && props.children !== null) {
      var kids = Array.isArray(props.children) ? props.children : [props.children];
      for (var c = 0; c < kids.length; c += 1) {
        var child = kids[c];
        var kidKey = child && child.key !== null && child.key !== undefined ? String(child.key) : String(c);
        dom.appendChild(renderNode(child, path + '/' + tag + '#' + kidKey, nextSvg, touchedPaths));
      }
    }
    return dom;
  }

  function createRoot(container) {
    var rootElement = null;
    var queued = false;

    function performRender() {
      queued = false;
      if (!rootElement || !container) return;

      var activeEl = document.activeElement;
      var activeTag = activeEl && container.contains(activeEl) ? activeEl.tagName : null;
      var activeId = activeEl && activeEl.id ? activeEl.id : null;
      var activeName = activeEl && activeEl.getAttribute ? activeEl.getAttribute('name') : null;
      var activePlaceholder = activeEl && activeEl.getAttribute ? activeEl.getAttribute('placeholder') : null;
      var selStart = activeEl && typeof activeEl.selectionStart === 'number' ? activeEl.selectionStart : null;
      var selEnd = activeEl && typeof activeEl.selectionEnd === 'number' ? activeEl.selectionEnd : null;

      pendingEffects = [];
      var touched = new Set();
      try {
        var domTree = renderNode(rootElement, 'root', false, touched);
        container.innerHTML = '';
        container.appendChild(domTree);

        // Cleanup hooks of unmounted components
        stateStore.forEach(function(hooks, key) {
          if (!touched.has(key)) {
            hooks.slots.forEach(function(slot) {
              if (slot && typeof slot.cleanup === 'function') {
                try { slot.cleanup(); } catch (_) {}
              }
            });
            stateStore.delete(key);
          }
        });

        if (activeTag) {
          var restored = null;
          if (activeId) restored = container.querySelector('#' + CSS.escape(activeId));
          if (!restored && activeName) restored = container.querySelector(activeTag.toLowerCase() + '[name="' + activeName.replace(/"/g, '') + '"]');
          if (!restored && activePlaceholder) restored = container.querySelector(activeTag.toLowerCase() + '[placeholder="' + activePlaceholder.replace(/"/g, '') + '"]');
          if (restored && typeof restored.focus === 'function') {
            restored.focus();
            if (selStart !== null && typeof restored.setSelectionRange === 'function') {
              try { restored.setSelectionRange(selStart, selEnd !== null ? selEnd : selStart); } catch (_) {}
            }
          }
        }

        var effectsToRun = pendingEffects.slice();
        pendingEffects = [];
        effectsToRun.forEach(function(rec) {
          if (typeof rec.cleanup === 'function') {
            try { rec.cleanup(); } catch (_) {}
          }
          try {
            var res = rec.effect();
            rec.cleanup = typeof res === 'function' ? res : null;
          } catch (err) {
            console.error(err);
          }
        });
      } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="padding:20px;margin:16px;border-radius:12px;background:#1a0f12;border:1px solid #f07575;color:#ffd6d6;font-family:monospace;font-size:13px;white-space:pre-wrap;">' +
          '<strong>Render Error</strong>\\n' + String(err && err.message ? err.message : err).replace(/</g, '&lt;') + '</div>';
      }
    }

    scheduleRender = function() {
      if (queued) return;
      queued = true;
      Promise.resolve().then(performRender);
    };

    return {
      render: function(el) {
        rootElement = el;
        performRender();
      }
    };
  }

  var ReactObj = {
    Fragment: Fragment,
    createElement: createElement,
    createContext: createContext,
    useState: useState,
    useReducer: useReducer,
    useRef: useRef,
    useMemo: useMemo,
    useCallback: useCallback,
    useEffect: useEffect,
    useLayoutEffect: useEffect,
    useContext: useContext,
    memo: function(c) { return c; },
    forwardRef: function(c) { return c; }
  };
  ReactObj.default = ReactObj;

  window.__ffReact = ReactObj;
  window.__ffReactDOM = {
    createRoot: createRoot,
    render: function(el, container) { createRoot(container).render(el); },
    default: { createRoot: createRoot }
  };
})();`;

function resolveRelativeModulePath(fromFile: string, specifier: string, allPaths: Set<string>): string | null {
  if (!specifier.startsWith('.')) return null;
  const fromDir = fromFile.includes('/') ? fromFile.slice(0, fromFile.lastIndexOf('/')) : '';
  const combinedParts = (fromDir ? `${fromDir}/${specifier}` : specifier).split('/');
  const resolved: string[] = [];
  for (const part of combinedParts) {
    if (!part || part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }
  const base = resolved.join('/');
  const candidates = [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    `${base}.jsx`,
    `${base}.js`,
    `${base}.json`,
    `${base}/index.tsx`,
    `${base}/index.ts`,
    `${base}/index.jsx`,
    `${base}/index.js`,
  ];
  for (const c of candidates) {
    if (allPaths.has(c)) return c;
  }
  return null;
}

function escapeInlineScript(jsCode: string): string {
  return jsCode.replace(/<\/script/gi, '<\\/script');
}

function buildModuleBundleScript(
  codeFiles: WorkspaceFile[],
  jsonFiles: WorkspaceFile[],
  entryPath: string,
  useReactRuntime: boolean,
  diagnostics: BundleDiagnostic[]
): string {
  const allPaths = new Set([...codeFiles.map((f) => f.path), ...jsonFiles.map((f) => f.path)]);
  const moduleDefs: string[] = [];

  for (const jf of jsonFiles) {
    try {
      const parsed = JSON.parse(jf.content);
      moduleDefs.push(
        `__ffDefs[${JSON.stringify(jf.path)}] = function(_req, _exp, module){ module.exports = ${JSON.stringify(parsed)}; };`
      );
    } catch {
      diagnostics.push({
        level: 'warn',
        file: jf.path,
        message: `JSON syntax warning in ${jf.path}`,
      });
    }
  }

  for (const cf of codeFiles) {
    const isJsx = /\.(tsx|jsx)$/i.test(cf.path);
    const isTs = /\.(ts|tsx)$/i.test(cf.path);
    try {
      const compiled =
        isTs || isJsx || /^\s*(import|export)\b/m.test(cf.content)
          ? transpileTsxToJs(cf.content, isJsx)
          : cf.content;
      moduleDefs.push(
        `__ffDefs[${JSON.stringify(cf.path)}] = function(require, exports, module){\n${escapeInlineScript(compiled)}\n};`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Compile error';
      diagnostics.push({
        level: 'error',
        file: cf.path,
        message: `Compile error in ${cf.path}: ${msg}`,
      });
    }
  }

  const pathListJson = JSON.stringify(Array.from(allPaths));
  const entryJson = JSON.stringify(entryPath);

  const runner = `(function(){
  var React = window.__ffReact || {};
  var __ffDefs = Object.create(null);
  var __ffCache = Object.create(null);
  var __ffPaths = new Set(${pathListJson});
  function __ffResolve(fromPath, spec) {
    if (spec === 'react' || spec === 'react/jsx-runtime') return '__builtin_react';
    if (spec === 'react-dom' || spec === 'react-dom/client') return '__builtin_react_dom';
    if (spec.charAt(0) !== '.') return null;
    var dir = fromPath.indexOf('/') >= 0 ? fromPath.slice(0, fromPath.lastIndexOf('/')) : '';
    var parts = (dir ? dir + '/' + spec : spec).split('/');
    var stack = [];
    for (var i = 0; i < parts.length; i += 1) {
      if (!parts[i] || parts[i] === '.') continue;
      if (parts[i] === '..') stack.pop();
      else stack.push(parts[i]);
    }
    var base = stack.join('/');
    var exts = ['', '.tsx', '.ts', '.jsx', '.js', '.json', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
    for (var e = 0; e < exts.length; e += 1) {
      if (__ffPaths.has(base + exts[e])) return base + exts[e];
    }
    return null;
  }
  function __ffRequire(fromPath, spec) {
    var resolved = __ffResolve(fromPath, spec);
    if (resolved === '__builtin_react') return window.__ffReact || {};
    if (resolved === '__builtin_react_dom') return window.__ffReactDOM || {};
    if (!resolved || !__ffDefs[resolved]) {
      console.warn('Module not found: ' + spec + ' (from ' + fromPath + ')');
      return {};
    }
    if (__ffCache[resolved]) return __ffCache[resolved].exports;
    var mod = { exports: {} };
    __ffCache[resolved] = mod;
    try {
      __ffDefs[resolved](
        function(childSpec){ return __ffRequire(resolved, childSpec); },
        mod.exports,
        mod
      );
    } catch (err) {
      console.error('Error in ' + resolved + ': ' + (err && err.message ? err.message : err));
      throw err;
    }
    return mod.exports;
  }
  ${moduleDefs.join('\n  ')}
  try {
    var entryExp = __ffRequire('', './' + ${entryJson});
    ${
      useReactRuntime
        ? `var AppComp = entryExp && (entryExp.default || entryExp.App);
    if (typeof AppComp === 'function' && window.__ffReact && window.__ffReactDOM) {
      var mountEl = document.getElementById('root') || document.getElementById('app');
      if (!mountEl) {
        mountEl = document.createElement('div');
        mountEl.id = 'root';
        document.body.appendChild(mountEl);
      }
      if (!mountEl.hasChildNodes()) {
        window.__ffReactDOM.createRoot(mountEl).render(window.__ffReact.createElement(AppComp, null));
      }
    }`
        : ''
    }
  } catch (err) {
    console.error(err);
  }
})();`;

  return useReactRuntime ? `${INLINE_REACT_RUNTIME}\n${runner}` : runner;
}

export function bundleProjectFiles(
  files: WorkspaceFile[],
  options?: { enableConsoleBridge?: boolean; previewId?: string }
): BundleProjectResult {
  const diagnostics: BundleDiagnostic[] = [];
  if (!Array.isArray(files) || files.length === 0) {
    return {
      previewHtml: '',
      standaloneHtml: '',
      diagnostics: [],
      mode: 'html',
      entryPath: 'index.html',
    };
  }

  const htmlFile =
    files.find((f) => f.path.toLowerCase() === 'index.html') ||
    files.find((f) => /\.html?$/i.test(f.path));

  const tsxFiles = files.filter((f) => /\.(tsx|jsx)$/i.test(f.path) && f.content.trim());
  const jsTsFiles = files.filter(
    (f) => /\.(js|mjs|ts|tsx|jsx)$/i.test(f.path) && f.content.trim()
  );
  const cssFiles = files.filter((f) => /\.css$/i.test(f.path) && f.content.trim());
  const jsonFiles = files.filter(
    (f) => /\.json$/i.test(f.path) && f.path.toLowerCase() !== 'metadata.json' && f.content.trim()
  );

  const isReactMode = tsxFiles.length > 0;
  const reactEntry =
    files.find((f) => /^(src\/)?(main|index)\.(tsx|jsx)$/i.test(f.path)) ||
    files.find((f) => /^(src\/)?app\.(tsx|jsx)$/i.test(f.path)) ||
    tsxFiles[0];

  let baseHtml = htmlFile ? stripPreviewGuardScripts(htmlFile.content.trim()) : '';

  if (!baseHtml) {
    baseHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>F-Forum Studio Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
  } else if (!/<html\b/i.test(baseHtml)) {
    baseHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>F-Forum Studio Preview</title>
</head>
<body>
${baseHtml}
</body>
</html>`;
  }

  if (isReactMode && !/id\s*=\s*["'](root|app)["']/i.test(baseHtml)) {
    if (/<\/body>/i.test(baseHtml)) {
      baseHtml = baseHtml.replace(/<\/body>/i, '  <div id="root"></div>\n</body>');
    } else {
      baseHtml += '\n<div id="root"></div>';
    }
  }

  // Strip local stylesheet links and inline all project CSS files cleanly
  if (cssFiles.length > 0) {
    baseHtml = baseHtml.replace(
      /<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["'](?!https?:\/\/)[^"']+["'][^>]*\/?>\s*/gi,
      ''
    );
    const styleTags = cssFiles
      .map(
        (cf) =>
          `<style data-ff-file="${cf.path.replace(/"/g, '')}">\n${cf.content}\n</style>`
      )
      .join('\n');
    if (/<\/head>/i.test(baseHtml)) {
      baseHtml = baseHtml.replace(/<\/head>/i, `${styleTags}\n</head>`);
    } else {
      baseHtml = `${styleTags}\n${baseHtml}`;
    }
  }

  // Strip local <script src="..."> tags so sandbox doesn't request parent /workspace/...
  baseHtml = baseHtml.replace(
    /<script\b[^>]*src\s*=\s*["'](?!https?:\/\/)[^"']+["'][^>]*>\s*<\/script>\s*/gi,
    ''
  );

  let entryPath = htmlFile?.path || 'index.html';

  if (isReactMode && reactEntry) {
    entryPath = reactEntry.path;
    const bundleCode = buildModuleBundleScript(jsTsFiles, jsonFiles, reactEntry.path, true, diagnostics);
    const scriptTag = `<script data-ff-bundle="react-tsx">\n${bundleCode}\n</script>`;
    if (/<\/body>/i.test(baseHtml)) {
      baseHtml = baseHtml.replace(/<\/body>/i, `${scriptTag}\n</body>`);
    } else {
      baseHtml = `${baseHtml}\n${scriptTag}`;
    }
  } else if (jsTsFiles.length > 0) {
    const usesModules = jsTsFiles.some(
      (f) => /\.(ts|mjs)$/i.test(f.path) || /^\s*(import|export)\b/m.test(f.content)
    );
    if (usesModules) {
      const jsEntry =
        jsTsFiles.find((f) => /^(src\/)?(main|app|index)\.(ts|js|mjs)$/i.test(f.path)) ||
        jsTsFiles[0];
      const bundleCode = buildModuleBundleScript(jsTsFiles, jsonFiles, jsEntry.path, false, diagnostics);
      const scriptTag = `<script data-ff-bundle="esm">\n${bundleCode}\n</script>`;
      if (/<\/body>/i.test(baseHtml)) {
        baseHtml = baseHtml.replace(/<\/body>/i, `${scriptTag}\n</body>`);
      } else {
        baseHtml = `${baseHtml}\n${scriptTag}`;
      }
    } else {
      const mergedJs = jsTsFiles
        .map((f) => escapeInlineScript(f.content))
        .join('\n\n');
      const scriptTag = `<script>\n${mergedJs}\n</script>`;
      if (/<\/body>/i.test(baseHtml)) {
        baseHtml = baseHtml.replace(/<\/body>/i, `${scriptTag}\n</body>`);
      } else {
        baseHtml = `${baseHtml}\n${scriptTag}`;
      }
    }
  }

  // Validate relative references in non-React mode just for clean diagnostics
  if (isReactMode) {
    const allPaths = new Set(files.map((f) => f.path));
    for (const cf of jsTsFiles) {
      const importMatches = cf.content.matchAll(/from\s+['"](\.[^'"]+)['"]/g);
      for (const m of importMatches) {
        const spec = m[1];
        if (/\.css$/i.test(spec)) continue;
        if (!resolveRelativeModulePath(cf.path, spec, allPaths)) {
          diagnostics.push({
            level: 'warn',
            file: cf.path,
            message: `Import "${spec}" chưa tìm thấy trong dự án`,
          });
        }
      }
    }
  }

  const standaloneHtml = baseHtml;
  const previewHtml = hardenPreviewHtml(standaloneHtml, {
    enableConsoleBridge: options?.enableConsoleBridge ?? true,
    previewId: options?.previewId,
  });

  return {
    previewHtml,
    standaloneHtml,
    diagnostics,
    mode: isReactMode ? 'react-tsx' : 'html',
    entryPath,
  };
}
