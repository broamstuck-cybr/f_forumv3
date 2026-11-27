import type { WorkspaceFile } from '../../types/index';

export type SyntaxTokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'number'
  | 'tag'
  | 'attr'
  | 'prop'
  | 'type'
  | 'punct';

export interface SyntaxToken {
  kind: SyntaxTokenKind;
  text: string;
}

const JS_KEYWORDS = new Set([
  'import', 'export', 'from', 'default', 'as', 'const', 'let', 'var',
  'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
  'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw',
  'new', 'typeof', 'instanceof', 'in', 'of', 'async', 'await', 'class',
  'extends', 'interface', 'type', 'enum', 'true', 'false', 'null', 'undefined',
  'void', 'this', 'super',
]);

const TS_TYPES = new Set([
  'string', 'number', 'boolean', 'any', 'unknown', 'never', 'object',
  'React', 'FC', 'Record', 'Array', 'Set', 'Map', 'Promise', 'HTMLElement',
]);

function tokenizeJsLike(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  const push = (kind: SyntaxTokenKind, text: string) => {
    if (!text) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === kind) {
      prev.text += text;
    } else {
      tokens.push({ kind, text });
    }
  };

  let i = 0;
  const len = code.length;
  while (i < len) {
    const ch = code[i];

    // Single-line comment
    if (ch === '/' && code[i + 1] === '/') {
      const nl = code.indexOf('\n', i + 2);
      const end = nl === -1 ? len : nl;
      push('comment', code.slice(i, end));
      i = end;
      continue;
    }

    // Multi-line comment
    if (ch === '/' && code[i + 1] === '*') {
      const close = code.indexOf('*/', i + 2);
      const end = close === -1 ? len : close + 2;
      push('comment', code.slice(i, end));
      i = end;
      continue;
    }

    // Strings & template literals
    if (ch === '\'' || ch === '"' || ch === '`') {
      const quote = ch;
      let j = i + 1;
      while (j < len) {
        if (code[j] === '\\') {
          j += 2;
          continue;
        }
        if (code[j] === quote) {
          j += 1;
          break;
        }
        j += 1;
      }
      push('string', code.slice(i, j));
      i = j;
      continue;
    }

    // JSX tags like `<div` or `</div` or `<Header`
    if (ch === '<' && (code[i + 1] === '/' || /[A-Za-z]/.test(code[i + 1] || ''))) {
      let j = i + 1;
      if (code[j] === '/') j += 1;
      const startName = j;
      while (j < len && /[A-Za-z0-9_.-]/.test(code[j])) j += 1;
      if (j > startName) {
        push('punct', code.slice(i, startName));
        push('tag', code.slice(startName, j));
        i = j;
        continue;
      }
    }

    // Numbers
    if (/[0-9]/.test(ch) && (i === 0 || !/[A-Za-z0-9_$]/.test(code[i - 1]))) {
      let j = i + 1;
      while (j < len && /[0-9._xXa-fA-F]/.test(code[j])) j += 1;
      push('number', code.slice(i, j));
      i = j;
      continue;
    }

    // Identifiers / keywords
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[A-Za-z0-9_$]/.test(code[j])) j += 1;
      const word = code.slice(i, j);
      if (JS_KEYWORDS.has(word)) {
        push('keyword', word);
      } else if (TS_TYPES.has(word)) {
        push('type', word);
      } else {
        push('plain', word);
      }
      i = j;
      continue;
    }

    // Punctuation
    if (/[{}()[\].,;:?=+\-*/&|!<>]/.test(ch)) {
      push('punct', ch);
      i += 1;
      continue;
    }

    push('plain', ch);
    i += 1;
  }

  return tokens;
}

function tokenizeHtml(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  const push = (kind: SyntaxTokenKind, text: string) => {
    if (!text) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === kind) prev.text += text;
    else tokens.push({ kind, text });
  };

  let i = 0;
  const len = code.length;
  while (i < len) {
    if (code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i + 4);
      const stop = end === -1 ? len : end + 3;
      push('comment', code.slice(i, stop));
      i = stop;
      continue;
    }
    if (code[i] === '<') {
      const gt = code.indexOf('>', i + 1);
      if (gt === -1) {
        push('plain', code.slice(i));
        break;
      }
      const rawTag = code.slice(i, gt + 1);
      const m = rawTag.match(/^(<\/?!?)([A-Za-z0-9:-]+)([\s\S]*?)(\/?>)$/);
      if (!m) {
        push('punct', rawTag);
        i = gt + 1;
        continue;
      }
      push('punct', m[1]);
      push('tag', m[2]);
      const attrs = m[3];
      let a = 0;
      while (a < attrs.length) {
        if (attrs[a] === '"' || attrs[a] === '\'') {
          const q = attrs[a];
          let b = a + 1;
          while (b < attrs.length && attrs[b] !== q) b += 1;
          push('string', attrs.slice(a, Math.min(attrs.length, b + 1)));
          a = b + 1;
          continue;
        }
        if (/[A-Za-z_:@-]/.test(attrs[a])) {
          let b = a + 1;
          while (b < attrs.length && /[A-Za-z0-9_:@-]/.test(attrs[b])) b += 1;
          push('attr', attrs.slice(a, b));
          a = b;
          continue;
        }
        push('punct', attrs[a]);
        a += 1;
      }
      push('punct', m[4]);
      i = gt + 1;
      continue;
    }
    const nextLt = code.indexOf('<', i);
    const stop = nextLt === -1 ? len : nextLt;
    push('plain', code.slice(i, stop));
    i = stop;
  }

  return tokens;
}

function tokenizeCss(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  const push = (kind: SyntaxTokenKind, text: string) => {
    if (!text) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === kind) prev.text += text;
    else tokens.push({ kind, text });
  };

  let i = 0;
  const len = code.length;
  let insideBlock = 0;

  while (i < len) {
    const ch = code[i];
    if (ch === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      const stop = end === -1 ? len : end + 2;
      push('comment', code.slice(i, stop));
      i = stop;
      continue;
    }
    if (ch === '"' || ch === '\'') {
      let j = i + 1;
      while (j < len && code[j] !== ch) {
        if (code[j] === '\\') j += 1;
        j += 1;
      }
      push('string', code.slice(i, Math.min(len, j + 1)));
      i = j + 1;
      continue;
    }
    if (ch === '{') {
      insideBlock += 1;
      push('punct', ch);
      i += 1;
      continue;
    }
    if (ch === '}') {
      insideBlock = Math.max(0, insideBlock - 1);
      push('punct', ch);
      i += 1;
      continue;
    }
    if (ch === '@') {
      let j = i + 1;
      while (j < len && /[A-Za-z-]/.test(code[j])) j += 1;
      push('keyword', code.slice(i, j));
      i = j;
      continue;
    }
    if (ch === '#' && /[0-9a-fA-F]/.test(code[i + 1] || '')) {
      let j = i + 1;
      while (j < len && /[0-9a-fA-F]/.test(code[j])) j += 1;
      push('number', code.slice(i, j));
      i = j;
      continue;
    }
    if (insideBlock > 0 && /[A-Za-z-]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[A-Za-z0-9-]/.test(code[j])) j += 1;
      const word = code.slice(i, j);
      let look = j;
      while (look < len && (code[look] === ' ' || code[look] === '\t')) look += 1;
      if (code[look] === ':') {
        push('prop', word);
      } else {
        push('plain', word);
      }
      i = j;
      continue;
    }
    if (insideBlock === 0 && /[.#A-Za-z_-]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[.#A-Za-z0-9_:-]/.test(code[j])) j += 1;
      push('tag', code.slice(i, j));
      i = j;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[0-9.%a-zA-Z]/.test(code[j])) j += 1;
      push('number', code.slice(i, j));
      i = j;
      continue;
    }
    push('plain', ch);
    i += 1;
  }

  return tokens;
}

function tokenizeJson(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  const push = (kind: SyntaxTokenKind, text: string) => {
    if (!text) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === kind) prev.text += text;
    else tokens.push({ kind, text });
  };

  let i = 0;
  const len = code.length;
  while (i < len) {
    const ch = code[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < len) {
        if (code[j] === '\\') {
          j += 2;
          continue;
        }
        if (code[j] === '"') {
          j += 1;
          break;
        }
        j += 1;
      }
      let look = j;
      while (look < len && (code[look] === ' ' || code[look] === '\t')) look += 1;
      push(code[look] === ':' ? 'prop' : 'string', code.slice(i, j));
      i = j;
      continue;
    }
    if (/-?[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[0-9.eE+-]/.test(code[j])) j += 1;
      push('number', code.slice(i, j));
      i = j;
      continue;
    }
    const kw = code.slice(i).match(/^(true|false|null)\b/);
    if (kw) {
      push('keyword', kw[1]);
      i += kw[1].length;
      continue;
    }
    if (/[{}[\]:,]/.test(ch)) {
      push('punct', ch);
      i += 1;
      continue;
    }
    push('plain', ch);
    i += 1;
  }
  return tokens;
}

function tokenizeMarkdown(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    if (/^#{1,6}\s/.test(line)) {
      tokens.push({ kind: 'tag', text: line });
    } else if (/^\s*[-*]\s/.test(line)) {
      tokens.push({ kind: 'keyword', text: line.slice(0, line.indexOf(' ') + 1) });
      tokens.push({ kind: 'plain', text: line.slice(line.indexOf(' ') + 1) });
    } else {
      tokens.push({ kind: 'plain', text: line });
    }
    if (idx < lines.length - 1) {
      tokens.push({ kind: 'plain', text: '\n' });
    }
  });
  return tokens;
}

export function tokenizeForEditor(
  code: string,
  language: WorkspaceFile['language']
): SyntaxToken[] {
  if (!code) return [];
  // Cap tokenizing work on extreme >120KB pasted files so UI stays 60fps
  if (code.length > 120_000) {
    return [{ kind: 'plain', text: code }];
  }
  switch (language) {
    case 'html':
      return tokenizeHtml(code);
    case 'css':
      return tokenizeCss(code);
    case 'json':
      return tokenizeJson(code);
    case 'markdown':
      return tokenizeMarkdown(code);
    case 'typescript':
    case 'javascript':
    default:
      return tokenizeJsLike(code);
  }
}
