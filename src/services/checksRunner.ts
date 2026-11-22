import type {
  CheckCategory,
  CheckIssue,
  CheckResult,
  ChecksReport,
  CheckStatus,
  WorkspaceFile,
} from '../types/index';
import { scanFilesForSecrets } from './secretScanner';

function deriveStatus(issues: CheckIssue[]): CheckStatus {
  if (issues.some((i) => i.severity === 'error')) return 'fail';
  if (issues.some((i) => i.severity === 'warning')) return 'warn';
  return 'pass';
}

function checkHtmlStructure(files: WorkspaceFile[]): CheckResult {
  const start = performance.now();
  const issues: CheckIssue[] = [];
  const htmlFiles = files.filter((f) => f.path.endsWith('.html'));

  if (htmlFiles.length === 0) {
    issues.push({
      file: 'index.html',
      severity: 'error',
      message: 'Không tìm thấy tệp HTML (.html) trong Workspace.',
      ruleId: 'HTML_MISSING_ENTRY',
    });
  }

  for (const file of htmlFiles) {
    const raw = file.content || '';
    if (!/<!DOCTYPE\s+html>/i.test(raw)) {
      issues.push({
        file: file.path,
        line: 1,
        severity: 'warning',
        message: 'Thiếu khai báo <!DOCTYPE html> chuẩn HTML5.',
        ruleId: 'HTML_DOCTYPE',
      });
    }
    if (!/<html[^>]*>/i.test(raw) || !/<\/html>/i.test(raw)) {
      issues.push({
        file: file.path,
        severity: 'error',
        message: 'Thiếu cặp thẻ <html>...</html>.',
        ruleId: 'HTML_ROOT_TAG',
      });
    }
    if (!/<head[^>]*>[\s\S]*<\/head>/i.test(raw)) {
      issues.push({
        file: file.path,
        severity: 'warning',
        message: 'Thiếu khối <head>...</head>.',
        ruleId: 'HTML_HEAD_TAG',
      });
    }
    if (!/<body[^>]*>[\s\S]*<\/body>/i.test(raw)) {
      issues.push({
        file: file.path,
        severity: 'error',
        message: 'Thiếu khối <body>...</body>.',
        ruleId: 'HTML_BODY_TAG',
      });
    }
    if (!/<title>[\s\S]+?<\/title>/i.test(raw)) {
      issues.push({
        file: file.path,
        severity: 'warning',
        message: 'Thiếu thẻ <title> mô tả trang.',
        ruleId: 'HTML_TITLE_TAG',
      });
    }
  }

  const status = deriveStatus(issues);
  return {
    id: 'chk-html-structure',
    category: 'html_structure',
    title: 'HTML5 Document Structure',
    status,
    summary:
      issues.length === 0
        ? `Đã xác minh ${htmlFiles.length} tệp HTML đầy đủ doctype, head, title và body.`
        : `Phát hiện ${issues.length} vấn đề cấu trúc HTML.`,
    issues,
    checkedAt: new Date().toISOString(),
    durationMs: Math.max(1, Math.round(performance.now() - start)),
  };
}

function checkJsSyntax(files: WorkspaceFile[]): CheckResult {
  const start = performance.now();
  const issues: CheckIssue[] = [];
  const jsFiles = files.filter((f) => f.path.endsWith('.js') || f.path.endsWith('.mjs'));

  for (const file of jsFiles) {
    const cleaned = (file.content || '')
      .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^\s*export\s+(?:default\s+)?/gm, '');
    try {
      new Function(cleaned);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Syntax error';
      issues.push({
        file: file.path,
        severity: 'error',
        message: `Lỗi cú pháp JavaScript: ${msg}`,
        ruleId: 'JS_PARSE_ERROR',
      });
    }
  }

  const status = deriveStatus(issues);
  return {
    id: 'chk-js-syntax',
    category: 'js_syntax',
    title: 'JavaScript Syntax Verification',
    status,
    summary:
      issues.length === 0
        ? `Đã kiểm tra ${jsFiles.length} tệp JS bằng parser new Function(): 0 lỗi cú pháp.`
        : `Phát hiện ${issues.length} lỗi cú pháp JavaScript.`,
    issues,
    checkedAt: new Date().toISOString(),
    durationMs: Math.max(1, Math.round(performance.now() - start)),
  };
}

function checkResponsiveLayout(files: WorkspaceFile[]): CheckResult {
  const start = performance.now();
  const issues: CheckIssue[] = [];
  const htmlFiles = files.filter((f) => f.path.endsWith('.html'));
  const cssFiles = files.filter((f) => f.path.endsWith('.css'));

  for (const html of htmlFiles) {
    if (!/<meta[^>]+name=["']viewport["'][^>]*>/i.test(html.content)) {
      issues.push({
        file: html.path,
        severity: 'error',
        message: 'Thiếu thẻ <meta name="viewport" content="width=device-width, initial-scale=1.0">.',
        ruleId: 'RESP_VIEWPORT_META',
      });
    }
  }

  for (const css of cssFiles) {
    const lines = css.content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const fixedWidthMatch = /\bwidth\s*:\s*(\d{4,})px\b/.exec(line);
      if (fixedWidthMatch) {
        issues.push({
          file: css.path,
          line: i + 1,
          severity: 'warning',
          message: `Khai báo width cố định ${fixedWidthMatch[1]}px có nguy cơ tràn khung trên khung điện thoại.`,
          ruleId: 'RESP_FIXED_OVERFLOW',
        });
      }
    }
  }

  const status = deriveStatus(issues);
  return {
    id: 'chk-responsive-layout',
    category: 'responsive_layout',
    title: 'Responsive Viewport & Overflow Guard',
    status,
    summary:
      issues.length === 0
        ? 'Viewport meta và quy tắc chống tràn ngang trên điện thoại, máy tính bảng và máy tính đều đạt chuẩn.'
        : `Phát hiện ${issues.length} cảnh báo responsive/overflow.`,
    issues,
    checkedAt: new Date().toISOString(),
    durationMs: Math.max(1, Math.round(performance.now() - start)),
  };
}

function checkInternalLinks(files: WorkspaceFile[]): CheckResult {
  const start = performance.now();
  const issues: CheckIssue[] = [];
  const fileSet = new Set(files.map((f) => f.path.replace(/^\.?\//, '')));
  const htmlFiles = files.filter((f) => f.path.endsWith('.html'));

  for (const html of htmlFiles) {
    const ids = new Set<string>();
    const idRegex = /\bid=["']([^"']+)["']/g;
    let idMatch = idRegex.exec(html.content);
    while (idMatch) {
      ids.add(idMatch[1]);
      idMatch = idRegex.exec(html.content);
    }

    const refRegex = /\b(?:href|src)=["']([^"']+)["']/g;
    let refMatch = refRegex.exec(html.content);
    while (refMatch) {
      const target = refMatch[1].trim();
      if (
        !target ||
        target.startsWith('http://') ||
        target.startsWith('https://') ||
        target.startsWith('data:') ||
        target.startsWith('mailto:')
      ) {
        refMatch = refRegex.exec(html.content);
        continue;
      }

      if (target.startsWith('#')) {
        const anchorId = target.slice(1);
        if (anchorId && !ids.has(anchorId)) {
          issues.push({
            file: html.path,
            severity: 'warning',
            message: `Liên kết neo ${target} không khớp với id nào trong DOM.`,
            ruleId: 'LINK_MISSING_ANCHOR',
          });
        }
      } else {
        const normalized = target.replace(/^\.?\//, '').split('?')[0].split('#')[0];
        if (normalized && !fileSet.has(normalized)) {
          issues.push({
            file: html.path,
            severity: 'error',
            message: `Tham chiếu tệp nội bộ "${target}" không tồn tại trong Workspace.`,
            ruleId: 'LINK_MISSING_ASSET',
          });
        }
      }
      refMatch = refRegex.exec(html.content);
    }
  }

  const status = deriveStatus(issues);
  return {
    id: 'chk-internal-links',
    category: 'internal_links',
    title: 'Internal Asset & Anchor Integrity',
    status,
    summary:
      issues.length === 0
        ? 'Tất cả liên kết href/src và anchor id nội bộ đều hợp lệ.'
        : `Phát hiện ${issues.length} tham chiếu nội bộ bị đứt.`,
    issues,
    checkedAt: new Date().toISOString(),
    durationMs: Math.max(1, Math.round(performance.now() - start)),
  };
}

function checkSecrets(files: WorkspaceFile[]): CheckResult {
  const start = performance.now();
  const scan = scanFilesForSecrets(files);
  const issues: CheckIssue[] = scan.findings.map((f) => ({
    file: f.file,
    line: f.line,
    severity: 'error',
    message: `${f.description} (${f.snippetRedacted})`,
    ruleId: f.ruleId,
  }));

  const status = deriveStatus(issues);
  return {
    id: 'chk-secret-scan',
    category: 'secret_scan',
    title: 'Zero-Leak Secret & Token Audit',
    status,
    summary:
      issues.length === 0
        ? `Đã quét ${scan.scannedFilesCount} tệp: 0 API key hoặc token rò rỉ.`
        : `Cảnh báo bảo mật: Phát hiện ${issues.length} chuỗi nhạy cảm trong Workspace.`,
    issues,
    checkedAt: new Date().toISOString(),
    durationMs: Math.max(1, Math.round(performance.now() - start)),
  };
}

function checkAccessibility(files: WorkspaceFile[]): CheckResult {
  const start = performance.now();
  const issues: CheckIssue[] = [];
  const htmlFiles = files.filter((f) => f.path.endsWith('.html'));

  for (const html of htmlFiles) {
    const raw = html.content || '';
    if (!/<html[^>]+lang=["'][^"']+["']/i.test(raw)) {
      issues.push({
        file: html.path,
        severity: 'warning',
        message: 'Thẻ <html> thiếu thuộc tính lang (ví dụ lang="vi" hoặc lang="en").',
        ruleId: 'A11Y_HTML_LANG',
      });
    }

    const imgRegex = /<img\b[^>]*>/gi;
    let imgMatch = imgRegex.exec(raw);
    while (imgMatch) {
      if (!/\balt=["'][^"']*["']/i.test(imgMatch[0])) {
        issues.push({
          file: html.path,
          severity: 'warning',
          message: 'Phát hiện thẻ <img> thiếu thuộc tính alt.',
          ruleId: 'A11Y_IMG_ALT',
        });
      }
      imgMatch = imgRegex.exec(raw);
    }

    if (!/<main\b[^>]*>/i.test(raw)) {
      issues.push({
        file: html.path,
        severity: 'info',
        message: 'Nên sử dụng landmark <main> cho vùng nội dung chính.',
        ruleId: 'A11Y_MAIN_LANDMARK',
      });
    }
  }

  const status = deriveStatus(issues);
  return {
    id: 'chk-accessibility',
    category: 'accessibility',
    title: 'Accessibility & Semantic Landmarks',
    status,
    summary:
      issues.length === 0
        ? 'Đạt chuẩn thuộc tính lang, alt text và semantic landmarks.'
        : `Có ${issues.length} lưu ý về khả năng truy cập (Accessibility).`,
    issues,
    checkedAt: new Date().toISOString(),
    durationMs: Math.max(1, Math.round(performance.now() - start)),
  };
}

export function runWorkspaceChecks(files: WorkspaceFile[]): ChecksReport {
  const results: CheckResult[] = [
    checkHtmlStructure(files),
    checkJsSyntax(files),
    checkResponsiveLayout(files),
    checkInternalLinks(files),
    checkSecrets(files),
    checkAccessibility(files),
  ];

  const passCount = results.filter((r) => r.status === 'pass').length;
  const warnCount = results.filter((r) => r.status === 'warn').length;
  const failCount = results.filter((r) => r.status === 'fail').length;
  const overallStatus: CheckStatus =
    failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';

  return {
    overallStatus,
    passCount,
    warnCount,
    failCount,
    results,
    ranAt: new Date().toISOString(),
  };
}

export const CHECK_CATEGORIES: CheckCategory[] = [
  'html_structure',
  'js_syntax',
  'responsive_layout',
  'internal_links',
  'secret_scan',
  'accessibility',
];
