import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function relativeLuminance(hex) {
  const clean = hex.replace('#', '');
  const channels = [0, 2, 4]
    .map((offset) => parseInt(clean.slice(offset, offset + 2), 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

/** Đọc giá trị một biến màu trong một khối selector của tokens.css. */
function tokenInBlock(css, selector, variable) {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `không tìm thấy khối ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const block = css.slice(open, close);
  const match = block.match(new RegExp(`${variable}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `không tìm thấy ${variable} trong ${selector}`);
  return match[1];
}

describe('Độ tương phản chữ trên nền (WCAG 2.1 AA)', () => {
  const css = fs.readFileSync(path.join(projectRoot, 'src/styles/tokens.css'), 'utf8');

  const cases = [
    {
      name: 'chữ chính trên nền tối',
      theme: "html[data-theme='dark']",
      fg: '--fg',
      bg: '--bg',
    },
    {
      name: 'chữ phụ trên nền tối',
      theme: "html[data-theme='dark']",
      fg: '--fg-muted',
      bg: '--bg',
    },
    {
      name: 'chữ mờ nhất trên nền tối',
      theme: "html[data-theme='dark']",
      fg: '--fg-faint',
      bg: '--bg',
    },
    {
      name: 'chữ chính trên nền sáng',
      theme: "html[data-theme='light']",
      fg: '--fg',
      bg: '--bg',
    },
    {
      name: 'chữ phụ trên nền sáng',
      theme: "html[data-theme='light']",
      fg: '--fg-muted',
      bg: '--bg',
    },
    {
      name: 'chữ mờ nhất trên nền sáng',
      theme: "html[data-theme='light']",
      fg: '--fg-faint',
      bg: '--bg',
    },
  ];

  for (const entry of cases) {
    test(entry.name, () => {
      const fg = tokenInBlock(css, entry.theme, entry.fg);
      const bg = tokenInBlock(css, entry.theme, entry.bg);
      const ratio = contrastRatio(fg, bg);
      assert.ok(
        ratio >= 4.5,
        `${entry.name}: ${fg} trên ${bg} chỉ đạt ${ratio.toFixed(2)}:1, cần ≥ 4.5:1`
      );
    });
  }
});

describe('Không rò rỉ thương hiệu và thông số kỹ thuật ra UI', () => {
  const root = path.join(projectRoot, 'src');

  function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, out);
      else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full);
    }
    return out;
  }

  const files = walk(root);
  const read = (file) => fs.readFileSync(file, 'utf8');

  test('không còn chữ thương hiệu lạc trong giao diện', () => {
    const offenders = files.filter((file) => /(^|[^a-zA-Z])Arena([^a-zA-Z]|$)/.test(read(file)));
    assert.deepEqual(offenders, []);
  });

  test('không còn liên kết mở trang ngoài', () => {
    const offenders = files.filter((file) => read(file).includes('target="_blank"'));
    assert.deepEqual(offenders, []);
  });

  test('không còn cụm khoe thông số trên giao diện giới thiệu', () => {
    const banned = ['6.770', '196 giao diện', '390 · 768 · 1440', '420 ms', 'cách F-Forum làm việc', 'LIVE VIEW'];
    const offenders = [];
    for (const file of files) {
      if (file.endsWith('tokens.css') || file.includes('__tests__')) continue;
      const body = read(file);
      for (const phrase of banned) {
        if (body.includes(phrase)) offenders.push(`${path.relative(projectRoot, file)} → ${phrase}`);
      }
    }
    assert.deepEqual(offenders, []);
  });
});
