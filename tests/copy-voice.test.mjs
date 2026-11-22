import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');

/** Walk every source file we ship to users. */
function collect(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Strip code that is not user-facing copy: CSS blocks (inline template styles),
 * `style=` attributes and matchMedia/media-query lines. What remains is the
 * text a person can actually read on screen.
 */
function copyOnly(text) {
  return text
    .replace(/style=\{\{[^}]*\}\}/g, '')
    .replace(/style=\{[^}]*\}/g, '')
    .split('\n')
    .filter((line) => !/@media|matchMedia|min-width|max-width|setProperty|^\s*--[\w-]+\s*:/.test(line))
    .join('\n');
}

const files = collect(srcRoot).map((full) => ({
  rel: path.relative(projectRoot, full).replace(/\\/g, '/'),
  text: copyOnly(fs.readFileSync(full, 'utf8')),
}));

/**
 * Strings the user explicitly banned from public copy.
 * Each entry: [pattern, why it is banned].
 */
const BANNED = [
  [/Xem giao diện chạy thật/i, 'câu mô tả kiểu báo cáo thông số'],
  [/chia sẻ prompt/i, 'câu mô tả kiểu báo cáo thông số'],
  [/cách F-Forum làm việc/i, 'câu mô tả kiểu báo cáo thông số'],
  [/\b420\s*ms\b/, 'đếm mili-giây trong copy công khai'],
  [/thông số & mã nguồn/i, 'khối "02 · thông số & mã nguồn"'],
  [/6\.770 chi tiết UI\/UX/i, 'con số trang trí'],
];

describe('Giọng văn công khai không còn tự khoe thông số', () => {
  test('không còn câu mô tả kiểu "xem giao diện chạy thật / chia sẻ prompt"', () => {
    const hits = [];
    for (const file of files) {
      for (const [pattern, why] of BANNED) {
        if (pattern.test(file.text)) hits.push(`${file.rel} → ${pattern} (${why})`);
      }
    }
    assert.deepEqual(hits, [], `copy bị cấm vẫn còn:\n${hits.join('\n')}`);
  });

  test('nhãn khung nhìn dùng tên thiết bị, không dùng số pixel', () => {
    const hits = [];
    for (const file of files) {
      // Only flag pixel counts that sit inside a user-facing label/string literal.
      const matches = file.text.matchAll(/['"`>][^'"`<>\n]*\b(?:390|768|1440)\s*px\b[^'"`<>\n]*['"`<]/gi);
      for (const match of matches) {
        // CSS media queries and inline style math are implementation details, not copy.
        if (/@media|matchMedia|min-width|max-width|width:|style=|setProperty/.test(match[0])) continue;
        hits.push(`${file.rel} → ${match[0].trim()}`);
      }
    }
    assert.deepEqual(hits, [], `nhãn pixel vẫn còn trong UI:\n${hits.join('\n')}`);
  });

  test('không còn nhãn "LIVE" / "ACTIVE" trong giao diện người dùng', () => {
    const hits = [];
    for (const file of files) {
      const matches = file.text.matchAll(/>\s*(LIVE|ACTIVE)\s*</g);
      for (const match of matches) hits.push(`${file.rel} → ${match[0].trim()}`);
    }
    assert.deepEqual(hits, [], `nhãn trạng thái thừa:\n${hits.join('\n')}`);
  });
});
