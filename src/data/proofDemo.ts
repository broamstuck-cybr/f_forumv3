import type { ChecksReport, DiffEntry, WorkspaceFile } from '../types/index';
import { runWorkspaceChecks } from '../services/checksRunner';
import { computeWorkspaceDiffs } from '../services/diffEngine';

export const PROOF_BRIEF = 'Dựng trang giới thiệu câu lạc bộ lập trình: một tiêu đề, lịch sinh hoạt, nút đăng ký.';

const STAMP = '2026-11-20T00:00:00.000Z';

const DRAFT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>CLB Lập trình</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="page">
    <h1>Câu lạc bộ Lập trình</h1>
    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 3'%3E%3Crect width='8' height='3' fill='%23c42a18'/%3E%3C/svg%3E" />
    <p>Sinh hoạt tối thứ Năm, phòng máy 2.</p>
    <a href="#dang-ky">Đăng ký</a>
  </div>
</body>
</html>`;

const DRAFT_CSS = `.page {
  width: 640px;
  margin: 0 auto;
  padding: 24px;
  font-family: Georgia, serif;
}
h1 {
  font-size: 40px;
}
img {
  width: 100%;
  height: 12px;
}`;

const REVISED_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CLB Lập trình</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="page">
    <h1>Câu lạc bộ Lập trình</h1>
    <img alt="Dải băng đỏ của câu lạc bộ" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 3'%3E%3Crect width='8' height='3' fill='%23c42a18'/%3E%3C/svg%3E" />
    <p>Sinh hoạt tối thứ Năm, phòng máy 2.</p>
    <a href="#dang-ky">Đăng ký</a>
    <section id="dang-ky">
      <h2>Đăng ký</h2>
      <p>Mang theo máy tính và một ý tưởng.</p>
    </section>
  </main>
</body>
</html>`;

const REVISED_CSS = `.page {
  max-width: 40rem;
  margin: 0 auto;
  padding: 24px;
  font-family: Georgia, serif;
  line-height: 1.5;
}
h1 {
  font-size: clamp(28px, 8vw, 40px);
}
img {
  width: 100%;
  height: 12px;
}
a {
  display: inline-block;
  padding: 12px 20px;
  background: #17150f;
  color: #f4f0e6;
  text-decoration: none;
}`;

function files(html: string, css: string): WorkspaceFile[] {
  return [
    { path: 'index.html', language: 'html', content: html, updatedAt: STAMP },
    { path: 'styles.css', language: 'css', content: css, updatedAt: STAMP },
  ];
}

export type ProofVersion = 'draft' | 'revised';

export interface ProofState {
  files: WorkspaceFile[];
  report: ChecksReport;
  srcDoc: string;
}

function build(html: string, css: string): ProofState {
  const list = files(html, css);
  return {
    files: list,
    report: runWorkspaceChecks(list),
    srcDoc: html.replace('<link rel="stylesheet" href="styles.css" />', `<style>${css}</style>`),
  };
}

let cache: { draft: ProofState; revised: ProofState; diffs: DiffEntry[] } | null = null;

export function getProofDemo(): { draft: ProofState; revised: ProofState; diffs: DiffEntry[] } {
  if (!cache) {
    const draft = build(DRAFT_HTML, DRAFT_CSS);
    const revised = build(REVISED_HTML, REVISED_CSS);
    cache = { draft, revised, diffs: computeWorkspaceDiffs(draft.files, revised.files) };
  }
  return cache;
}
