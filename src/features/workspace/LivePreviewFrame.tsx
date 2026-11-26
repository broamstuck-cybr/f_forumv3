import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { WorkspaceFile } from '../../types/index';

export const PREVIEW_VIEWPORTS = ['fit', 1440, 768, 390] as const;

export type PreviewViewport = (typeof PREVIEW_VIEWPORTS)[number];

export interface PreviewRuntimeError {
  id: string;
  kind: 'error' | 'unhandledrejection' | 'console.error';
  message: string;
  line?: number;
  column?: number;
  timestamp: string;
}

export interface LivePreviewFrameProps {
  files: WorkspaceFile[];
  title: string;
  viewport: PreviewViewport;
  reloadNonce: number;
  onRuntimeError?: (error: PreviewRuntimeError) => void;
}

const ERROR_BRIDGE_SCRIPT = `<script>
(function(){
  if (window.__ffErrBridge) return;
  window.__ffErrBridge = true;
  function emit(kind, message, line, column) {
    try {
      var text = String(message == null ? 'Unknown error' : message).slice(0, 400);
      window.parent.postMessage({
        type: 'ff-preview-runtime-error',
        kind: kind,
        message: text,
        line: typeof line === 'number' ? line : undefined,
        column: typeof column === 'number' ? column : undefined
      }, '*');
    } catch (_) {}
  }
  window.addEventListener('error', function(ev) {
    var msg = ev && ev.message ? ev.message : (ev && ev.error && ev.error.message ? ev.error.message : 'Script error');
    emit('error', msg, ev && ev.lineno, ev && ev.colno);
  });
  window.addEventListener('unhandledrejection', function(ev) {
    var reason = ev ? ev.reason : '';
    var msg = reason && reason.message ? reason.message : String(reason || 'Unhandled promise rejection');
    emit('unhandledrejection', msg);
  });
  var origError = console.error;
  console.error = function() {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (arg && typeof arg === 'object' && arg.message) {
        parts.push(String(arg.message));
      } else {
        parts.push(typeof arg === 'string' ? arg : String(arg));
      }
    }
    emit('console.error', parts.join(' ') || 'console.error');
    if (typeof origError === 'function') {
      return origError.apply(console, arguments);
    }
  };
})();
</script>`;

function normalizeClassicScript(jsSource: string): string {
  return jsSource
    .replace(/\r\n?/g, '\n')
    .replace(/^[ \t]*import\s+['"][^'"]+['"]\s*;?[ \t]*$/gm, '')
    .replace(
      /^[ \t]*import\s+(?:type\s+)?(?:[*]\s+as\s+[A-Za-z_$][\w$]*|\{[^}]*\}|[A-Za-z_$][\w$]*(?:\s*,\s*(?:\{[^}]*\}|[*]\s+as\s+[A-Za-z_$][\w$]*))?)\s+from\s+['"][^'"]+['"]\s*;?[ \t]*$/gm,
      ''
    )
    .replace(
      /^[ \t]*export\s+(?:\*(?:\s+as\s+[A-Za-z_$][\w$]*)?\s+from\s+['"][^'"]+['"]|\{[^}]*\}(?:\s+from\s+['"][^'"]+['"])?)\s*;?[ \t]*$/gm,
      ''
    )
    .replace(
      /^[ \t]*export\s+(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/gm,
      'var $1 = class $1'
    )
    .replace(
      /^[ \t]*export\s+default\s+(?=(?:async\s+)?function\b\*?\s*[A-Za-z_$][\w$]*)/gm,
      ''
    )
    .replace(/^[ \t]*export\s+default\s+/gm, 'var __ffDefaultExport = ')
    .replace(/^[ \t]*export\s+(?:const|let|var)\s+/gm, 'var ')
    .replace(/^[ \t]*export\s+(?=(?:async\s+)?function\b)/gm, '');
}

interface LoopEdit {
  pos: number;
  text: string;
  depth: number;
  isClose: boolean;
}

interface JsToken {
  type: 'eof' | 'ident' | 'literal' | 'punct';
  value: string;
  start: number;
  end: number;
  crossedNewline: boolean;
  nextCanStartRegex: boolean;
}

const REGEX_PREV_KEYWORDS = new Set([
  'return',
  'throw',
  'case',
  'default',
  'delete',
  'void',
  'typeof',
  'in',
  'instanceof',
  'new',
  'else',
  'do',
  'await',
  'yield',
  'of',
  'export',
  'import',
]);

const CONDITION_PAREN_KEYWORDS = new Set(['if', 'while', 'for', 'with']);

const LINE_CONTINUATION_KEYWORDS = new Set([
  'return',
  'throw',
  'typeof',
  'void',
  'delete',
  'new',
  'await',
  'yield',
  'in',
  'instanceof',
  'of',
  'case',
  'else',
  'do',
]);

const LINE_CONTINUATION_PREV_PUNCT = new Set([
  '+',
  '-',
  '*',
  '/',
  '%',
  '**',
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '**=',
  '==',
  '===',
  '!=',
  '!==',
  '<',
  '<=',
  '>',
  '>=',
  '<<',
  '>>',
  '>>>',
  '<<=',
  '>>=',
  '>>>=',
  '&',
  '&&',
  '&&=',
  '|',
  '||',
  '||=',
  '^',
  '&=',
  '|=',
  '^=',
  '??',
  '??=',
  '?',
  ':',
  ',',
  '.',
  '?.',
  '!',
  '~',
  '=>',
  '...',
  '(',
  '[',
]);

const LINE_CONTINUATION_NEXT_PUNCT = new Set([
  '.',
  '?.',
  '(',
  '[',
  ':',
  '?',
  ',',
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '**=',
  '==',
  '===',
  '!=',
  '!==',
  '<',
  '<=',
  '>',
  '>=',
  '<<',
  '>>',
  '>>>',
  '&&',
  '||',
  '??',
  '*',
  '/',
  '%',
  '**',
  '&',
  '|',
  '^',
]);

const LINE_CONTINUATION_NEXT_KEYWORDS = new Set(['in', 'instanceof', 'of']);

const MULTI_CHAR_OPS = [
  '>>>=',
  '===',
  '!==',
  '>>>',
  '<<=',
  '>>=',
  '&&=',
  '||=',
  '??=',
  '**=',
  '...',
  '?.',
  '=>',
  '++',
  '--',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '??',
  '<<',
  '>>',
  '**',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '&=',
  '|=',
  '^=',
];

function skipStringLiteral(src: string, idx: number, limit: number): number {
  const quote = src[idx];
  let i = idx + 1;
  while (i < limit) {
    const ch = src[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) {
      return Math.min(limit, i + 1);
    }
    i += 1;
  }
  return limit;
}

function skipRegexLiteral(src: string, idx: number, limit: number): number {
  let i = idx + 1;
  let inClass = false;
  while (i < limit) {
    const ch = src[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      return idx + 1;
    }
    if (ch === '[') {
      inClass = true;
      i += 1;
      continue;
    }
    if (ch === ']') {
      inClass = false;
      i += 1;
      continue;
    }
    if (ch === '/' && !inClass) {
      i += 1;
      while (i < limit && /[A-Za-z]/.test(src[i])) i += 1;
      return i;
    }
    i += 1;
  }
  return idx + 1;
}

function skipTemplateLiteral(
  src: string,
  idx: number,
  limit: number,
  onExprRange?: (start: number, end: number) => void
): number {
  let i = idx + 1;
  while (i < limit) {
    const ch = src[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') {
      return i + 1;
    }
    if (ch === '$' && i + 1 < limit && src[i + 1] === '{') {
      const exprStart = i + 2;
      const closeBrace = findMatchingBrace(src, i + 1, limit, onExprRange);
      if (closeBrace === -1) {
        return limit;
      }
      if (onExprRange) {
        onExprRange(exprStart, closeBrace);
      }
      i = closeBrace + 1;
      continue;
    }
    i += 1;
  }
  return limit;
}

function scanNextJsToken(
  src: string,
  pos: number,
  limit: number,
  canStartRegex: boolean,
  onExprRange?: (start: number, end: number) => void
): JsToken {
  let i = pos;
  let crossedNewline = false;

  while (i < limit) {
    const ch = src[i];
    if (ch === '\n' || ch === '\r') {
      crossedNewline = true;
      i += 1;
      continue;
    }
    if (ch === ' ' || ch === '\t' || ch === '\v' || ch === '\f') {
      i += 1;
      continue;
    }
    if (ch === '/' && i + 1 < limit && src[i + 1] === '/') {
      i += 2;
      while (i < limit && src[i] !== '\n' && src[i] !== '\r') i += 1;
      continue;
    }
    if (ch === '/' && i + 1 < limit && src[i + 1] === '*') {
      i += 2;
      while (i + 1 < limit && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n' || src[i] === '\r') crossedNewline = true;
        i += 1;
      }
      i = Math.min(limit, i + 2);
      continue;
    }
    break;
  }

  if (i >= limit) {
    return {
      type: 'eof',
      value: '',
      start: limit,
      end: limit,
      crossedNewline,
      nextCanStartRegex: canStartRegex,
    };
  }

  const ch = src[i];

  if (ch === "'" || ch === '"') {
    const end = skipStringLiteral(src, i, limit);
    return {
      type: 'literal',
      value: src.slice(i, end),
      start: i,
      end,
      crossedNewline,
      nextCanStartRegex: false,
    };
  }

  if (ch === '`') {
    const end = skipTemplateLiteral(src, i, limit, onExprRange);
    return {
      type: 'literal',
      value: src.slice(i, end),
      start: i,
      end,
      crossedNewline,
      nextCanStartRegex: false,
    };
  }

  if (
    ch === '/' &&
    canStartRegex &&
    !(i + 1 < limit && (src[i + 1] === '/' || src[i + 1] === '*'))
  ) {
    const end = skipRegexLiteral(src, i, limit);
    if (end > i + 1) {
      return {
        type: 'literal',
        value: src.slice(i, end),
        start: i,
        end,
        crossedNewline,
        nextCanStartRegex: false,
      };
    }
  }

  if (/[A-Za-z_$]/.test(ch)) {
    let end = i + 1;
    while (end < limit && /[A-Za-z0-9_$]/.test(src[end])) end += 1;
    const value = src.slice(i, end);
    return {
      type: 'ident',
      value,
      start: i,
      end,
      crossedNewline,
      nextCanStartRegex: REGEX_PREV_KEYWORDS.has(value),
    };
  }

  if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < limit && /[0-9]/.test(src[i + 1]))) {
    let end = i + 1;
    while (end < limit && /[0-9A-Za-z_.]/.test(src[end])) {
      if ((src[end] === 'e' || src[end] === 'E') && end + 1 < limit && (src[end + 1] === '+' || src[end + 1] === '-')) {
        end += 2;
        continue;
      }
      end += 1;
    }
    return {
      type: 'literal',
      value: src.slice(i, end),
      start: i,
      end,
      crossedNewline,
      nextCanStartRegex: false,
    };
  }

  for (const op of MULTI_CHAR_OPS) {
    if (src.startsWith(op, i) && i + op.length <= limit) {
      const nextCanStartRegex =
        op !== '++' && op !== '--' && op !== '?.';
      return {
        type: 'punct',
        value: op,
        start: i,
        end: i + op.length,
        crossedNewline,
        nextCanStartRegex,
      };
    }
  }

  const nextCanStartRegex = ch !== ')' && ch !== ']' && ch !== '.';
  return {
    type: 'punct',
    value: ch,
    start: i,
    end: i + 1,
    crossedNewline,
    nextCanStartRegex,
  };
}

function findMatchingDelim(
  src: string,
  openIdx: number,
  openCh: '(' | '{',
  closeCh: ')' | '}',
  limit: number,
  onExprRange?: (start: number, end: number) => void
): number {
  let depth = 1;
  let pos = openIdx + 1;
  let canStartRegex = true;
  const parenStack: boolean[] = [];
  let prevIdent = '';
  let prevWasDot = false;

  while (pos < limit) {
    const tok = scanNextJsToken(src, pos, limit, canStartRegex, onExprRange);
    if (tok.type === 'eof') return -1;
    pos = tok.end;
    if (tok.type === 'punct') {
      if (tok.value === '(') {
        parenStack.push(!prevWasDot && CONDITION_PAREN_KEYWORDS.has(prevIdent));
      } else if (tok.value === ')') {
        const wasCondition = parenStack.pop() ?? false;
        if (openCh === '(' && depth === 1) {
          return tok.start;
        }
        canStartRegex = wasCondition;
        prevIdent = '';
        prevWasDot = false;
        continue;
      } else if (tok.value === openCh) {
        depth += 1;
      } else if (tok.value === closeCh) {
        depth -= 1;
        if (depth === 0) return tok.start;
      }
      prevWasDot = tok.value === '.' || tok.value === '?.';
      prevIdent = '';
      canStartRegex = tok.nextCanStartRegex;
    } else if (tok.type === 'ident') {
      prevIdent = prevWasDot ? '' : tok.value;
      prevWasDot = false;
      canStartRegex = tok.nextCanStartRegex;
    } else {
      prevIdent = '';
      prevWasDot = false;
      canStartRegex = tok.nextCanStartRegex;
    }
  }
  return -1;
}

function findMatchingParen(
  src: string,
  openIdx: number,
  limit = src.length,
  onExprRange?: (start: number, end: number) => void
): number {
  return findMatchingDelim(src, openIdx, '(', ')', limit, onExprRange);
}

function findMatchingBrace(
  src: string,
  openIdx: number,
  limit = src.length,
  onExprRange?: (start: number, end: number) => void
): number {
  return findMatchingDelim(src, openIdx, '{', '}', limit, onExprRange);
}

function findStatementEnd(
  src: string,
  startPos: number,
  limit: number,
  stopBeforeWhile: boolean
): number {
  const first = scanNextJsToken(src, startPos, limit, true);
  if (first.type === 'eof') return startPos;
  if (first.type === 'punct' && first.value === ';') return first.end;
  if (first.type === 'punct' && first.value === '{') {
    const close = findMatchingBrace(src, first.start, limit);
    return close !== -1 ? close + 1 : limit;
  }

  if (first.type === 'ident') {
    if (first.value === 'if') {
      const pOpen = scanNextJsToken(src, first.end, limit, true);
      if (pOpen.type === 'punct' && pOpen.value === '(') {
        const pClose = findMatchingParen(src, pOpen.start, limit);
        if (pClose !== -1) {
          const thenEnd = findStatementEnd(src, pClose + 1, limit, false);
          const maybeElse = scanNextJsToken(src, thenEnd, limit, true);
          if (maybeElse.type === 'ident' && maybeElse.value === 'else') {
            return findStatementEnd(src, maybeElse.end, limit, stopBeforeWhile);
          }
          return thenEnd;
        }
      }
    } else if (first.value === 'while' || first.value === 'with') {
      const pOpen = scanNextJsToken(src, first.end, limit, true);
      if (pOpen.type === 'punct' && pOpen.value === '(') {
        const pClose = findMatchingParen(src, pOpen.start, limit);
        if (pClose !== -1) {
          return findStatementEnd(src, pClose + 1, limit, stopBeforeWhile);
        }
      }
    } else if (first.value === 'for') {
      let cursor = scanNextJsToken(src, first.end, limit, true);
      if (cursor.type === 'ident' && cursor.value === 'await') {
        cursor = scanNextJsToken(src, cursor.end, limit, true);
      }
      if (cursor.type === 'punct' && cursor.value === '(') {
        const pClose = findMatchingParen(src, cursor.start, limit);
        if (pClose !== -1) {
          return findStatementEnd(src, pClose + 1, limit, stopBeforeWhile);
        }
      }
    } else if (first.value === 'do') {
      const bodyEnd = findStatementEnd(src, first.end, limit, true);
      const maybeWhile = scanNextJsToken(src, bodyEnd, limit, true);
      if (maybeWhile.type === 'ident' && maybeWhile.value === 'while') {
        const pOpen = scanNextJsToken(src, maybeWhile.end, limit, true);
        if (pOpen.type === 'punct' && pOpen.value === '(') {
          const pClose = findMatchingParen(src, pOpen.start, limit);
          if (pClose !== -1) {
            const maybeSemi = scanNextJsToken(src, pClose + 1, limit, true);
            if (maybeSemi.type === 'punct' && maybeSemi.value === ';') {
              return maybeSemi.end;
            }
            return pClose + 1;
          }
        }
      }
      return bodyEnd;
    } else if (first.value === 'switch') {
      const pOpen = scanNextJsToken(src, first.end, limit, true);
      if (pOpen.type === 'punct' && pOpen.value === '(') {
        const pClose = findMatchingParen(src, pOpen.start, limit);
        if (pClose !== -1) {
          const bOpen = scanNextJsToken(src, pClose + 1, limit, true);
          if (bOpen.type === 'punct' && bOpen.value === '{') {
            const bClose = findMatchingBrace(src, bOpen.start, limit);
            return bClose !== -1 ? bClose + 1 : limit;
          }
        }
      }
    } else if (first.value === 'try') {
      const bOpen = scanNextJsToken(src, first.end, limit, true);
      if (bOpen.type === 'punct' && bOpen.value === '{') {
        let endPos = findMatchingBrace(src, bOpen.start, limit);
        if (endPos === -1) return limit;
        endPos += 1;
        let next = scanNextJsToken(src, endPos, limit, true);
        if (next.type === 'ident' && next.value === 'catch') {
          let afterCatch = scanNextJsToken(src, next.end, limit, true);
          if (afterCatch.type === 'punct' && afterCatch.value === '(') {
            const pClose = findMatchingParen(src, afterCatch.start, limit);
            if (pClose === -1) return limit;
            afterCatch = scanNextJsToken(src, pClose + 1, limit, true);
          }
          if (afterCatch.type === 'punct' && afterCatch.value === '{') {
            const cClose = findMatchingBrace(src, afterCatch.start, limit);
            if (cClose === -1) return limit;
            endPos = cClose + 1;
            next = scanNextJsToken(src, endPos, limit, true);
          }
        }
        if (next.type === 'ident' && next.value === 'finally') {
          const fOpen = scanNextJsToken(src, next.end, limit, true);
          if (fOpen.type === 'punct' && fOpen.value === '{') {
            const fClose = findMatchingBrace(src, fOpen.start, limit);
            return fClose !== -1 ? fClose + 1 : limit;
          }
        }
        return endPos;
      }
    } else if (first.value !== 'case' && first.value !== 'default') {
      const afterFirst = scanNextJsToken(src, first.end, limit, first.nextCanStartRegex);
      if (afterFirst.type === 'punct' && afterFirst.value === ':') {
        return findStatementEnd(src, afterFirst.end, limit, stopBeforeWhile);
      }
    }
  }

  let parenDepth = first.type === 'punct' && first.value === '(' ? 1 : 0;
  let bracketDepth = first.type === 'punct' && first.value === '[' ? 1 : 0;
  let braceDepth = 0;
  let prevTok = first;
  let pos = first.end;
  let canStartRegex = first.nextCanStartRegex;

  while (pos < limit) {
    const next = scanNextJsToken(src, pos, limit, canStartRegex);
    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      if (next.type === 'eof') return prevTok.end;
      if (next.type === 'punct' && next.value === ';') return next.end;
      if (next.type === 'punct' && next.value === '}') return prevTok.end;
      if (stopBeforeWhile && next.type === 'ident' && next.value === 'while') {
        return prevTok.end;
      }
      if (next.crossedNewline) {
        const prevContinues =
          (prevTok.type === 'punct' && LINE_CONTINUATION_PREV_PUNCT.has(prevTok.value)) ||
          (prevTok.type === 'ident' && LINE_CONTINUATION_KEYWORDS.has(prevTok.value));
        const nextContinues =
          (next.type === 'punct' && LINE_CONTINUATION_NEXT_PUNCT.has(next.value)) ||
          (next.type === 'ident' && LINE_CONTINUATION_NEXT_KEYWORDS.has(next.value));
        if (!prevContinues && !nextContinues) {
          return prevTok.end;
        }
      }
    }

    if (next.type === 'eof') return prevTok.end;
    if (next.type === 'punct') {
      if (next.value === '(') parenDepth += 1;
      else if (next.value === ')') parenDepth = Math.max(0, parenDepth - 1);
      else if (next.value === '[') bracketDepth += 1;
      else if (next.value === ']') bracketDepth = Math.max(0, bracketDepth - 1);
      else if (next.value === '{') braceDepth += 1;
      else if (next.value === '}') braceDepth = Math.max(0, braceDepth - 1);
    }
    prevTok = next;
    pos = next.end;
    canStartRegex = next.nextCanStartRegex;
  }

  return prevTok.end;
}

function injectLoopGuards(jsSource: string): string {
  const edits: LoopEdit[] = [];

  const scanRange = (start: number, end: number, depth: number) => {
    let pos = start;
    let canStartRegex = true;
    let prevWasDot = false;
    let prevIdent = '';
    const parenStack: boolean[] = [];

    const onTemplateExpr = (exprStart: number, exprEnd: number) => {
      scanRange(exprStart, exprEnd, depth + 1);
    };

    while (pos < end) {
      const tok = scanNextJsToken(jsSource, pos, end, canStartRegex, onTemplateExpr);
      if (tok.type === 'eof') break;

      if (tok.type === 'punct') {
        if (tok.value === '(') {
          parenStack.push(!prevWasDot && CONDITION_PAREN_KEYWORDS.has(prevIdent));
          canStartRegex = true;
        } else if (tok.value === ')') {
          const wasCond = parenStack.pop() ?? false;
          canStartRegex = wasCond;
        } else {
          canStartRegex = tok.nextCanStartRegex;
        }
        prevWasDot = tok.value === '.' || tok.value === '?.';
        prevIdent = '';
        pos = tok.end;
        continue;
      }

      if (tok.type === 'literal') {
        prevWasDot = false;
        prevIdent = '';
        canStartRegex = false;
        pos = tok.end;
        continue;
      }

      // tok.type === 'ident'
      const word = tok.value;
      const isProperty = prevWasDot;
      prevWasDot = false;

      if (!isProperty && (word === 'do' || word === 'for' || word === 'while')) {
        if (word === 'do') {
          const nextTok = scanNextJsToken(jsSource, tok.end, end, true, onTemplateExpr);
          if (nextTok.type === 'punct' && nextTok.value === ':') {
            prevIdent = '';
            canStartRegex = true;
            pos = nextTok.end;
            continue;
          }
          if (nextTok.type === 'punct' && nextTok.value === '{') {
            edits.push({
              pos: nextTok.end,
              text: ' __ffGuard();',
              depth,
              isClose: false,
            });
            const closeBrace = findMatchingBrace(jsSource, nextTok.start, end, onTemplateExpr);
            const bodyEnd = closeBrace !== -1 ? closeBrace : end;
            scanRange(nextTok.end, bodyEnd, depth + 1);
            let afterDo = closeBrace !== -1 ? closeBrace + 1 : end;
            const tailWhile = scanNextJsToken(jsSource, afterDo, end, true, onTemplateExpr);
            if (tailWhile.type === 'ident' && tailWhile.value === 'while') {
              const tailParen = scanNextJsToken(jsSource, tailWhile.end, end, true, onTemplateExpr);
              if (tailParen.type === 'punct' && tailParen.value === '(') {
                const closeParen = findMatchingParen(jsSource, tailParen.start, end, onTemplateExpr);
                if (closeParen !== -1) {
                  scanRange(tailParen.end, closeParen, depth + 1);
                  afterDo = closeParen + 1;
                }
              }
            }
            prevIdent = '';
            canStartRegex = true;
            pos = afterDo;
            continue;
          }
          if (nextTok.type !== 'eof') {
            const stmtStart = nextTok.start;
            const stmtEnd = findStatementEnd(jsSource, stmtStart, end, true);
            if (stmtEnd >= stmtStart) {
              edits.push({
                pos: stmtStart,
                text: '{ __ffGuard(); ',
                depth,
                isClose: false,
              });
              edits.push({
                pos: stmtEnd,
                text: ' }',
                depth,
                isClose: true,
              });
              scanRange(stmtStart, stmtEnd, depth + 1);
              let afterDo = stmtEnd;
              const tailWhile = scanNextJsToken(jsSource, afterDo, end, true, onTemplateExpr);
              if (tailWhile.type === 'ident' && tailWhile.value === 'while') {
                const tailParen = scanNextJsToken(jsSource, tailWhile.end, end, true, onTemplateExpr);
                if (tailParen.type === 'punct' && tailParen.value === '(') {
                  const closeParen = findMatchingParen(jsSource, tailParen.start, end, onTemplateExpr);
                  if (closeParen !== -1) {
                    scanRange(tailParen.end, closeParen, depth + 1);
                    afterDo = closeParen + 1;
                  }
                }
              }
              prevIdent = '';
              canStartRegex = true;
              pos = afterDo;
              continue;
            }
          }
        } else {
          let cursorTok = scanNextJsToken(jsSource, tok.end, end, true, onTemplateExpr);
          if (word === 'for' && cursorTok.type === 'ident' && cursorTok.value === 'await') {
            cursorTok = scanNextJsToken(jsSource, cursorTok.end, end, true, onTemplateExpr);
          }
          if (cursorTok.type === 'punct' && cursorTok.value === '(') {
            const closeIdx = findMatchingParen(jsSource, cursorTok.start, end, onTemplateExpr);
            if (closeIdx !== -1) {
              scanRange(cursorTok.end, closeIdx, depth + 1);
              const afterParenTok = scanNextJsToken(jsSource, closeIdx + 1, end, true, onTemplateExpr);
              if (afterParenTok.type === 'punct' && afterParenTok.value === '{') {
                edits.push({
                  pos: afterParenTok.end,
                  text: ' __ffGuard();',
                  depth,
                  isClose: false,
                });
                const closeBrace = findMatchingBrace(jsSource, afterParenTok.start, end, onTemplateExpr);
                const bodyEnd = closeBrace !== -1 ? closeBrace : end;
                scanRange(afterParenTok.end, bodyEnd, depth + 1);
                prevIdent = '';
                canStartRegex = true;
                pos = closeBrace !== -1 ? closeBrace + 1 : end;
                continue;
              }
              if (afterParenTok.type !== 'eof') {
                const stmtStart = afterParenTok.start;
                const stmtEnd = findStatementEnd(jsSource, stmtStart, end, false);
                if (stmtEnd >= stmtStart) {
                  edits.push({
                    pos: stmtStart,
                    text: '{ __ffGuard(); ',
                    depth,
                    isClose: false,
                  });
                  edits.push({
                    pos: stmtEnd,
                    text: ' }',
                    depth,
                    isClose: true,
                  });
                  scanRange(stmtStart, stmtEnd, depth + 1);
                  prevIdent = '';
                  canStartRegex = true;
                  pos = stmtEnd;
                  continue;
                }
              }
            }
          }
        }
      }

      prevIdent = word;
      canStartRegex = tok.nextCanStartRegex;
      pos = tok.end;
    }
  };

  scanRange(0, jsSource.length, 0);

  if (edits.length === 0) return jsSource;

  edits.sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos;
    if (a.isClose !== b.isClose) return a.isClose ? -1 : 1;
    if (a.isClose) return b.depth - a.depth;
    return a.depth - b.depth;
  });

  let out = '';
  let last = 0;
  for (const edit of edits) {
    out += jsSource.slice(last, edit.pos) + edit.text;
    last = edit.pos;
  }
  return out + jsSource.slice(last);
}

function instrumentLoopGuard(jsSource: string, includeErrorBridge: boolean): string {
  const guardHeader = `var __ffLoopStart = 0;
var __ffLoopScheduled = false;
function __ffResetLoopGuard() {
  __ffLoopStart = 0;
  __ffLoopScheduled = false;
}
function __ffGuard() {
  var now = Date.now();
  if (!__ffLoopStart) {
    __ffLoopStart = now;
    if (!__ffLoopScheduled) {
      __ffLoopScheduled = true;
      if (typeof Promise === 'function' && typeof Promise.resolve === 'function') {
        Promise.resolve().then(__ffResetLoopGuard);
      } else {
        setTimeout(__ffResetLoopGuard, 0);
      }
    }
  } else if (now - __ffLoopStart > 1200) {
    throw new Error('Execution halted: blocking loop guard triggered');
  }
}
`;
  const guarded = injectLoopGuards(jsSource);
  const bridgeNotify = includeErrorBridge
    ? `  try { window.parent.postMessage({ type: 'ff-preview-runtime-error', kind: 'error', message: String(e && e.message ? e.message : e).slice(0, 400) }, '*'); } catch (_) {}\n`
    : '';
  return `${guardHeader}try {\n${guarded}\n} catch (e) {\n${bridgeNotify}  var banner = document.createElement('div');\n  banner.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;padding:10px 14px;border-radius:8px;background:#7f1d1d;color:#fecaca;font:12px/1.4 monospace;z-index:9999;';\n  banner.textContent = 'Runtime error: ' + (e && e.message ? e.message : String(e));\n  document.body.appendChild(banner);\n}`;
}

interface HtmlAttr {
  name: string;
  value: string;
  hasValue: boolean;
}

interface HtmlToken {
  kind: 'doctype' | 'comment' | 'start' | 'end';
  tagName: string;
  start: number;
  end: number;
  selfClosing: boolean;
  attrs: HtmlAttr[];
}

const RAW_OR_RCDATA_HTML_TAGS = new Set([
  'script',
  'style',
  'title',
  'textarea',
  'xmp',
  'noembed',
  'noframes',
  'noscript',
  'iframe',
  'plaintext',
]);

function tokenizeHtml(doc: string): HtmlToken[] {
  const tokens: HtmlToken[] = [];
  const len = doc.length;
  let i = 0;

  while (i < len) {
    const lt = doc.indexOf('<', i);
    if (lt === -1) break;

    if (doc.startsWith('<!--', lt)) {
      let end = len;
      if (doc.startsWith('<!-->', lt)) {
        end = lt + 5;
      } else if (doc.startsWith('<!--->', lt)) {
        end = lt + 6;
      } else {
        const closeIdx = doc.indexOf('-->', lt + 4);
        const bangIdx = doc.indexOf('--!>', lt + 4);
        const closeEnd = closeIdx === -1 ? len : closeIdx + 3;
        const bangEnd = bangIdx === -1 ? len : bangIdx + 4;
        end = Math.min(closeEnd, bangEnd);
      }
      tokens.push({
        kind: 'comment',
        tagName: '',
        start: lt,
        end,
        selfClosing: false,
        attrs: [],
      });
      i = end;
      continue;
    }

    if (doc[lt + 1] === '!' || doc[lt + 1] === '?') {
      const gt = doc.indexOf('>', lt + 2);
      const end = gt === -1 ? len : gt + 1;
      if (/^<!doctype(?:\s|>)/i.test(doc.slice(lt, Math.min(len, lt + 12)))) {
        tokens.push({
          kind: 'doctype',
          tagName: 'doctype',
          start: lt,
          end,
          selfClosing: false,
          attrs: [],
        });
      }
      i = end;
      continue;
    }

    const isEnd = doc[lt + 1] === '/';
    let p = lt + (isEnd ? 2 : 1);
    if (p >= len || !/[a-zA-Z]/.test(doc[p])) {
      i = lt + 1;
      continue;
    }

    const nameStart = p;
    while (p < len && /[a-zA-Z0-9:-]/.test(doc[p])) p += 1;
    if (p < len && !/[\s/>]/.test(doc[p])) {
      i = lt + 1;
      continue;
    }
    const tagName = doc.slice(nameStart, p).toLowerCase();

    const attrs: HtmlAttr[] = [];
    let selfClosing = false;
    let closed = false;

    while (p < len) {
      while (p < len && /\s/.test(doc[p])) p += 1;
      if (p >= len) break;
      const ch = doc[p];
      if (ch === '>') {
        p += 1;
        closed = true;
        break;
      }
      if (ch === '/') {
        if (doc[p + 1] === '>') {
          selfClosing = true;
          p += 2;
          closed = true;
          break;
        }
        p += 1;
        continue;
      }
      const attrNameStart = p;
      while (p < len && !/[\s=/>]/.test(doc[p])) p += 1;
      const attrName = doc.slice(attrNameStart, p).toLowerCase();
      if (!attrName) {
        p += 1;
        continue;
      }
      while (p < len && /\s/.test(doc[p])) p += 1;
      let attrValue = '';
      let hasValue = false;
      if (p < len && doc[p] === '=') {
        hasValue = true;
        p += 1;
        while (p < len && /\s/.test(doc[p])) p += 1;
        if (p < len && (doc[p] === '"' || doc[p] === "'")) {
          const quote = doc[p];
          p += 1;
          const valStart = p;
          while (p < len && doc[p] !== quote) p += 1;
          attrValue = doc.slice(valStart, p);
          if (p < len && doc[p] === quote) p += 1;
        } else {
          const valStart = p;
          while (p < len && !/[\s>]/.test(doc[p])) p += 1;
          attrValue = doc.slice(valStart, p);
        }
      }
      attrs.push({ name: attrName, value: attrValue, hasValue });
    }

    if (!closed) {
      break;
    }

    tokens.push({
      kind: isEnd ? 'end' : 'start',
      tagName,
      start: lt,
      end: p,
      selfClosing: !isEnd && selfClosing,
      attrs,
    });
    i = p;

    if (!isEnd && RAW_OR_RCDATA_HTML_TAGS.has(tagName)) {
      if (tagName === 'plaintext') {
        i = len;
        continue;
      }
      const closeRe = new RegExp(`<\\/${tagName}(?=[\\s/>]|$)`, 'gi');
      closeRe.lastIndex = i;
      const closeMatch = closeRe.exec(doc);
      if (!closeMatch) {
        i = len;
      } else {
        let cp = closeMatch.index + closeMatch[0].length;
        while (cp < len && doc[cp] !== '>') cp += 1;
        const closeEnd = cp < len ? cp + 1 : len;
        tokens.push({
          kind: 'end',
          tagName,
          start: closeMatch.index,
          end: closeEnd,
          selfClosing: false,
          attrs: [],
        });
        i = closeEnd;
      }
    }
  }

  return tokens;
}

function getTokenAttr(token: HtmlToken, name: string): string | undefined {
  for (let idx = token.attrs.length - 1; idx >= 0; idx -= 1) {
    if (token.attrs[idx].name === name) return token.attrs[idx].value;
  }
  return undefined;
}

function stripHtmlTokens(
  doc: string,
  shouldStripStart: (token: HtmlToken) => boolean
): string {
  const tokens = tokenizeHtml(doc);
  const ranges: Array<[number, number]> = [];
  for (let idx = 0; idx < tokens.length; idx += 1) {
    const token = tokens[idx];
    if (token.kind !== 'start' || !shouldStripStart(token)) continue;
    let end = token.end;
    if (RAW_OR_RCDATA_HTML_TAGS.has(token.tagName)) {
      const next = tokens[idx + 1];
      if (next && next.kind === 'end' && next.tagName === token.tagName) {
        end = next.end;
        idx += 1;
      }
    }
    ranges.push([token.start, end]);
  }
  if (ranges.length === 0) return doc;
  let out = '';
  let cursor = 0;
  for (const [start, end] of ranges) {
    out += doc.slice(cursor, start);
    cursor = end;
  }
  out += doc.slice(cursor);
  return out;
}

function findHtmlTagToken(
  doc: string,
  tagName: string,
  kind: HtmlToken['kind'] = 'start',
  pickLast = false
): HtmlToken | null {
  const tokens = tokenizeHtml(doc);
  let chosen: HtmlToken | null = null;
  for (const token of tokens) {
    if (token.kind === kind && token.tagName === tagName) {
      chosen = token;
      if (!pickLast) return chosen;
    }
  }
  return chosen;
}

function insertBeforeClosingTag(doc: string, tagName: string, addition: string): string {
  const lowerTag = tagName.toLowerCase();
  const pickLast = lowerTag === 'body';
  const token = findHtmlTagToken(doc, lowerTag, 'end', pickLast);
  if (!token) return '';
  return `${doc.slice(0, token.start)}${addition}\n${doc.slice(token.start)}`;
}

const STRIPPED_META_HTTP_EQUIV = new Set([
  'content-security-policy',
  'refresh',
  'set-cookie',
  'location',
]);

function decodeMetaAttrValue(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => {
      const cp = Number.parseInt(hex, 16);
      return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
    })
    .replace(/&#([0-9]+);?/g, (_, dec: string) => {
      const cp = Number.parseInt(dec, 10);
      return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
    });
}

function isDisallowedMetaToken(token: HtmlToken): boolean {
  if (token.tagName !== 'meta') return false;
  return token.attrs.some(
    (attr) =>
      attr.name === 'http-equiv' &&
      STRIPPED_META_HTTP_EQUIV.has(decodeMetaAttrValue(attr.value).trim().toLowerCase())
  );
}

function injectCspMetaEarly(doc: string, cspMeta: string): { doc: string; cspEndIdx: number } {
  const tokens = tokenizeHtml(doc);
  let earlyResourceIdx = Number.POSITIVE_INFINITY;
  let headOpen: HtmlToken | null = null;
  let htmlOpen: HtmlToken | null = null;
  let doctype: HtmlToken | null = null;

  for (const token of tokens) {
    if (token.kind === 'doctype' && !doctype) {
      doctype = token;
    } else if (token.kind === 'start') {
      if (token.tagName === 'head' && !headOpen) headOpen = token;
      if (token.tagName === 'html' && !htmlOpen) htmlOpen = token;
      if (token.tagName !== 'html' && token.tagName !== 'head') {
        earlyResourceIdx = Math.min(earlyResourceIdx, token.start);
      }
    }
  }

  if (headOpen && headOpen.start < earlyResourceIdx) {
    const injection = `\n${cspMeta}`;
    return {
      doc: `${doc.slice(0, headOpen.end)}${injection}${doc.slice(headOpen.end)}`,
      cspEndIdx: headOpen.end + injection.length,
    };
  }

  if (htmlOpen && htmlOpen.start < earlyResourceIdx) {
    const injection = `\n<head>${cspMeta}</head>`;
    return {
      doc: `${doc.slice(0, htmlOpen.end)}${injection}${doc.slice(htmlOpen.end)}`,
      cspEndIdx: htmlOpen.end + `\n<head>${cspMeta}`.length,
    };
  }

  if (doctype && doctype.start < earlyResourceIdx) {
    const injection = `\n<head>${cspMeta}</head>`;
    return {
      doc: `${doc.slice(0, doctype.end)}${injection}${doc.slice(doctype.end)}`,
      cspEndIdx: doctype.end + `\n<head>${cspMeta}`.length,
    };
  }

  const injection = `<head>${cspMeta}</head>\n`;
  return {
    doc: `${injection}${doc}`,
    cspEndIdx: `<head>${cspMeta}`.length,
  };
}

export function compileWorkspaceSrcDoc(
  files: WorkspaceFile[],
  options?: { includeErrorBridge?: boolean }
): string {
  const includeErrorBridge = Boolean(options?.includeErrorBridge);
  const htmlFile =
    files.find((f) => f.path.toLowerCase() === 'index.html') ||
    files.find((f) => {
      const lower = f.path.toLowerCase();
      return lower.endsWith('.html') || lower.endsWith('.htm');
    });
  const cssFiles = files.filter((f) => f.path.toLowerCase().endsWith('.css'));
  const rawJsFiles = files.filter((f) => {
    const lower = f.path.toLowerCase();
    return lower.endsWith('.js') || lower.endsWith('.mjs');
  });

  const cspMeta =
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data: https:; font-src data: https:;" />';

  let doc = htmlFile
    ? htmlFile.content
    : `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Preview</title></head><body><main style="padding:24px;font-family:system-ui,sans-serif;">No index.html found in workspace.</main></body></html>`;

  const declaredOrder: string[] = [];
  for (const token of tokenizeHtml(doc)) {
    if (token.kind !== 'start' || token.tagName !== 'script') continue;
    const rawSrc = getTokenAttr(token, 'src');
    if (!rawSrc) continue;
    const normalizedSrc = rawSrc
      .trim()
      .split(/[?#]/)[0]
      .replace(/^(?:\.\/|\/)+/, '')
      .toLowerCase();
    if (normalizedSrc && !declaredOrder.includes(normalizedSrc)) {
      declaredOrder.push(normalizedSrc);
    }
  }

  const orderedJsFiles: WorkspaceFile[] = [];
  const seenPaths = new Set<string>();
  for (const srcPath of declaredOrder) {
    const matched = rawJsFiles.find((f) => f.path.toLowerCase() === srcPath);
    if (matched && !seenPaths.has(matched.path)) {
      orderedJsFiles.push(matched);
      seenPaths.add(matched.path);
    }
  }
  for (const file of rawJsFiles) {
    if (!seenPaths.has(file.path)) {
      orderedJsFiles.push(file);
      seenPaths.add(file.path);
    }
  }

  const combinedCss = cssFiles.map((f) => f.content).join('\n\n').replace(/<\/style/gi, '<\\/style');
  const scriptBlocks = orderedJsFiles
    .map((f) => {
      const normalized = normalizeClassicScript(f.content || '');
      if (!normalized.trim()) return '';
      const instrumented = instrumentLoopGuard(normalized, includeErrorBridge).replace(
        /<\/script/gi,
        '<\\/script'
      );
      return `<script>\n${instrumented}\n</script>`;
    })
    .filter(Boolean)
    .join('\n');

  doc = stripHtmlTokens(doc, (token) => {
    if (isDisallowedMetaToken(token)) {
      return true;
    }
    if (token.tagName === 'link') {
      const rel = getTokenAttr(token, 'rel');
      return Boolean(rel && rel.trim().toLowerCase().split(/\s+/).includes('stylesheet'));
    }
    if (token.tagName === 'script') {
      const src = getTokenAttr(token, 'src');
      return Boolean(src && src.trim());
    }
    return false;
  });

  const injected = injectCspMetaEarly(doc, cspMeta);
  doc = injected.doc;

  const headTailAdditions = [
    `<style>\n${combinedCss}\n</style>`,
    includeErrorBridge ? ERROR_BRIDGE_SCRIPT : '',
  ]
    .filter(Boolean)
    .join('\n');

  const withHead = insertBeforeClosingTag(doc, 'head', headTailAdditions);
  if (withHead) {
    doc = withHead;
  } else {
    doc = `${doc.slice(0, injected.cspEndIdx)}\n${headTailAdditions}${doc.slice(injected.cspEndIdx)}`;
  }

  if (scriptBlocks) {
    const withBody = insertBeforeClosingTag(doc, 'body', scriptBlocks);
    doc = withBody || `${doc}\n${scriptBlocks}`;
  }

  return doc;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function buildStandalonePreviewDoc(files: WorkspaceFile[], title: string): string {
  const safeTitle = escapeAttribute(title).replace(/</g, '&lt;');
  const frameDoc = escapeAttribute(compileWorkspaceSrcDoc(files, { includeErrorBridge: false }));
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="referrer" content="no-referrer" /><title>${safeTitle}</title><style>html,body{margin:0;height:100%}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><iframe title="${safeTitle}" sandbox="allow-scripts" referrerpolicy="no-referrer" srcdoc="${frameDoc}"></iframe></body></html>`;
}

export const LivePreviewFrame: React.FC<LivePreviewFrameProps> = ({
  files,
  title,
  viewport,
  reloadNonce,
  onRuntimeError,
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const srcDoc = useMemo(
    () => compileWorkspaceSrcDoc(files, { includeErrorBridge: true }),
    [files]
  );

  useEffect(() => {
    if (!onRuntimeError) return;
    const handleMessage = (event: MessageEvent) => {
      const frameWindow = iframeRef.current?.contentWindow;
      if (!frameWindow || event.source !== frameWindow) return;
      const data = event.data as {
        type?: unknown;
        kind?: unknown;
        message?: unknown;
        line?: unknown;
        column?: unknown;
      } | null;
      if (!data || data.type !== 'ff-preview-runtime-error') return;
      const kind =
        data.kind === 'unhandledrejection' || data.kind === 'console.error'
          ? data.kind
          : 'error';
      const message =
        typeof data.message === 'string'
          ? data.message.slice(0, 400)
          : String(data.message ?? 'Runtime error').slice(0, 400);
      onRuntimeError({
        id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind,
        message,
        line: typeof data.line === 'number' ? data.line : undefined,
        column: typeof data.column === 'number' ? data.column : undefined,
        timestamp: new Date().toISOString(),
      });
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRuntimeError]);

  useLayoutEffect(() => {
    const element = areaRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setArea({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const isFit = viewport === 'fit';
  const numericWidth = typeof viewport === 'number' ? viewport : area.width || 1024;
  const scale = !isFit && area.width > 0 ? Math.min(1, area.width / numericWidth) : 1;
  const shownWidth = isFit ? '100%' : Math.round(numericWidth * scale);

  return (
    <div className="ws-frame-host" data-fit={isFit ? 'true' : undefined}>
      <div ref={areaRef} className="ws-frame-area" data-fit={isFit ? 'true' : undefined}>
        {(isFit || area.width > 0) && (
          <div
            className="ws-frame plate scene-paper"
            style={isFit ? { width: '100%', height: '100%' } : { width: shownWidth, height: area.height }}
          >
            <div className="ws-frame-clip">
              <iframe
                ref={iframeRef}
                key={reloadNonce}
                title={title}
                srcDoc={srcDoc}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                className="ws-frame-doc"
                style={
                  isFit
                    ? { width: '100%', height: '100%', transform: 'none' }
                    : {
                        width: numericWidth,
                        height: Math.round(area.height / scale),
                        transform: `scale(${scale})`,
                      }
                }
              />
            </div>
          </div>
        )}
      </div>
      {!isFit && (
        <p className="t-label ws-frame-note">
          <span>{viewport} px</span>
          {scale < 1 && <span>thu còn {Math.round(scale * 100)}%</span>}
        </p>
      )}
    </div>
  );
};
