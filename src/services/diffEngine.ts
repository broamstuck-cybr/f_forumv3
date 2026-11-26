import type { DiffEntry, DiffHunk, DiffLine, DiffSplitRow, WorkspaceFile } from '../types/index';

function computeLcsMatrix(oldLines: string[], newLines: string[]): number[][] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }
  return dp;
}

function buildDiffLines(oldLines: string[], newLines: string[]): DiffLine[] {
  if (oldLines.length * newLines.length > 250000) {
    const fallback: DiffLine[] = [];
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i += 1) {
      const o = oldLines[i];
      const n = newLines[i];
      if (o === n && o !== undefined) {
        fallback.push({
          type: 'context',
          oldLineNumber: i + 1,
          newLineNumber: i + 1,
          content: o,
        });
      } else {
        if (o !== undefined) {
          fallback.push({
            type: 'del',
            oldLineNumber: i + 1,
            newLineNumber: null,
            content: o,
          });
        }
        if (n !== undefined) {
          fallback.push({
            type: 'add',
            oldLineNumber: null,
            newLineNumber: i + 1,
            content: n,
          });
        }
      }
    }
    return fallback;
  }

  const dp = computeLcsMatrix(oldLines, newLines);
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      result.push({
        type: 'context',
        oldLineNumber: i + 1,
        newLineNumber: j + 1,
        content: oldLines[i],
      });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({
        type: 'del',
        oldLineNumber: i + 1,
        newLineNumber: null,
        content: oldLines[i],
      });
      i += 1;
    } else {
      result.push({
        type: 'add',
        oldLineNumber: null,
        newLineNumber: j + 1,
        content: newLines[j],
      });
      j += 1;
    }
  }

  while (i < oldLines.length) {
    result.push({
      type: 'del',
      oldLineNumber: i + 1,
      newLineNumber: null,
      content: oldLines[i],
    });
    i += 1;
  }

  while (j < newLines.length) {
    result.push({
      type: 'add',
      oldLineNumber: null,
      newLineNumber: j + 1,
      content: newLines[j],
    });
    j += 1;
  }

  return result;
}

function buildSplitRows(diffLines: DiffLine[]): DiffSplitRow[] {
  const rows: DiffSplitRow[] = [];
  let idx = 0;

  while (idx < diffLines.length) {
    const line = diffLines[idx];
    if (line.type === 'context') {
      rows.push({
        leftLineNumber: line.oldLineNumber,
        leftContent: line.content,
        leftType: 'context',
        rightLineNumber: line.newLineNumber,
        rightContent: line.content,
        rightType: 'context',
      });
      idx += 1;
      continue;
    }

    const dels: DiffLine[] = [];
    const adds: DiffLine[] = [];
    while (idx < diffLines.length && diffLines[idx].type === 'del') {
      dels.push(diffLines[idx]);
      idx += 1;
    }
    while (idx < diffLines.length && diffLines[idx].type === 'add') {
      adds.push(diffLines[idx]);
      idx += 1;
    }

    const pairCount = Math.max(dels.length, adds.length);
    for (let k = 0; k < pairCount; k += 1) {
      const d = dels[k];
      const a = adds[k];
      rows.push({
        leftLineNumber: d ? d.oldLineNumber : null,
        leftContent: d ? d.content : '',
        leftType: d ? 'del' : 'empty',
        rightLineNumber: a ? a.newLineNumber : null,
        rightContent: a ? a.content : '',
        rightType: a ? 'add' : 'empty',
      });
    }
  }

  return rows;
}

export function computeFileDiff(
  filePath: string,
  oldContent: string,
  newContent: string
): DiffEntry {
  const safePath = typeof filePath === 'string' ? filePath : '';
  const safeOld = typeof oldContent === 'string' ? oldContent : '';
  const safeNew = typeof newContent === 'string' ? newContent : '';
  const oldLines = safeOld ? safeOld.split(/\r?\n/) : [];
  const newLines = safeNew ? safeNew.split(/\r?\n/) : [];
  const diffLines = buildDiffLines(oldLines, newLines);

  const additions = diffLines.filter((l) => l.type === 'add').length;
  const deletions = diffLines.filter((l) => l.type === 'del').length;

  let status: DiffEntry['status'] = 'unchanged';
  if (!safeOld && safeNew) {
    status = 'added';
  } else if (safeOld && !safeNew) {
    status = 'deleted';
  } else if (additions > 0 || deletions > 0) {
    status = 'modified';
  }

  const header = `@@ -1,${oldLines.length} +1,${newLines.length} @@`;
  const hunk: DiffHunk = {
    header,
    oldStart: oldLines.length > 0 ? 1 : 0,
    oldLines: oldLines.length,
    newStart: newLines.length > 0 ? 1 : 0,
    newLines: newLines.length,
    lines: diffLines,
  };

  const patchLines = [
    `--- a/${safePath}`,
    `+++ b/${safePath}`,
    header,
    ...diffLines.map((l) => {
      const prefix = l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' ';
      return `${prefix}${l.content}`;
    }),
  ];

  return {
    path: safePath,
    status,
    additions,
    deletions,
    oldContent: safeOld,
    newContent: safeNew,
    unifiedPatch: patchLines.join('\n'),
    hunks: status === 'unchanged' ? [] : [hunk],
    splitRows: buildSplitRows(diffLines),
  };
}

export function computeWorkspaceDiffs(
  previousFiles: WorkspaceFile[],
  currentFiles: WorkspaceFile[]
): DiffEntry[] {
  const prevMap = new Map<string, string>();
  if (Array.isArray(previousFiles)) {
    for (const f of previousFiles) {
      if (f && typeof f === 'object' && typeof f.path === 'string' && f.path) {
        prevMap.set(f.path, typeof f.content === 'string' ? f.content : '');
      }
    }
  }
  const currMap = new Map<string, string>();
  if (Array.isArray(currentFiles)) {
    for (const f of currentFiles) {
      if (f && typeof f === 'object' && typeof f.path === 'string' && f.path) {
        currMap.set(f.path, typeof f.content === 'string' ? f.content : '');
      }
    }
  }
  const allPaths = Array.from(new Set([...prevMap.keys(), ...currMap.keys()])).sort();

  return allPaths.map((p) => computeFileDiff(p, prevMap.get(p) || '', currMap.get(p) || ''));
}
