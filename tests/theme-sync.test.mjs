import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const enginePath = path.join(
  projectRoot,
  'src/components/pinui/original/theme-switch/theme-switch-engine.ts'
);

/**
 * Dựng một DOM tối giản vừa đủ để chạy `syncPageTheme` thật từ engine.
 * Mục đích: khoá lại hành vi "đổi theme NGAY trong lúc hiệu ứng chạy" — nếu
 * ai đó đổi sang đổi-màu-sau-khi-xong, test này đỏ.
 */
function installFakeDom() {
  const attrs = new Map([['data-theme', 'dark']]);
  const classes = new Set(['dark']);
  const style = {};
  const meta = { content: '' };

  globalThis.document = {
    documentElement: {
      hasAttribute: (key) => attrs.has(key),
      getAttribute: (key) => (attrs.has(key) ? attrs.get(key) : null),
      setAttribute: (key, value) => attrs.set(key, value),
      removeAttribute: (key) => attrs.delete(key),
      classList: {
        toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
        contains: (name) => classes.has(name),
      },
      style,
    },
    querySelector: (selector) =>
      selector.includes('theme-color') ? { setAttribute: (_k, value) => (meta.content = value) } : null,
  };
  globalThis.window = { setTimeout, clearTimeout };
  return { attrs, classes, style, meta };
}

function loadSyncPageTheme() {
  const source = fs.readFileSync(enginePath, 'utf8');
  const start = source.indexOf('function syncPageTheme');
  assert.ok(start >= 0, 'không tìm thấy syncPageTheme trong engine');
  const end = source.indexOf('const EASE_OUT');
  assert.ok(end > start, 'không xác định được điểm kết thúc của syncPageTheme');
  const body = source.slice(start, end).replace('next: ThemeName', 'next');
  // eslint-disable-next-line no-new-func
  return new Function(`${body}; return syncPageTheme;`)();
}

describe('Chuyển sáng/tối đồng bộ trong lúc hiệu ứng chạy', () => {
  test('syncPageTheme ghi theme ngay và mở cửa sổ blend', () => {
    const dom = installFakeDom();
    const syncPageTheme = loadSyncPageTheme();

    syncPageTheme('light');

    assert.equal(dom.attrs.get('data-theme'), 'light', 'theme phải đổi ngay, không chờ hiệu ứng xong');
    assert.equal(dom.attrs.get('data-theme-blend'), 'open', 'phải bật blend để màu tween theo nhịp hiệu ứng');
    assert.equal(dom.classes.has('light'), true);
    assert.equal(dom.classes.has('dark'), false);
    assert.equal(dom.style.colorScheme, 'light');
    assert.equal(dom.meta.content, '#f4f0e6', 'meta theme-color phải theo theme mới');
  });

  test('cửa sổ blend tự đóng sau khoảng 680ms', async () => {
    const dom = installFakeDom();
    const syncPageTheme = loadSyncPageTheme();

    syncPageTheme('light');
    assert.equal(dom.attrs.get('data-theme-blend'), 'open');
    await new Promise((resolve) => setTimeout(resolve, 750));
    assert.equal(dom.attrs.has('data-theme-blend'), false, 'blend phải được gỡ để không tween mọi thay đổi sau đó');
  });

  test('không ghi đè khi trang không do hiệu ứng điều khiển', () => {
    const dom = installFakeDom();
    dom.attrs.delete('data-theme');
    const syncPageTheme = loadSyncPageTheme();

    syncPageTheme('light');
    assert.equal(dom.attrs.has('data-theme'), false, 'trang không có data-theme thì không tự nhận theme');
  });

  test('bỏ qua khi theme đích trùng theme hiện tại', () => {
    const dom = installFakeDom();
    const syncPageTheme = loadSyncPageTheme();

    syncPageTheme('dark');
    assert.equal(dom.attrs.has('data-theme-blend'), false, 'không bật blend khi không có gì để đổi');
  });
});

describe('Engine gọi commit giữa hiệu ứng chứ không phải ở cuối', () => {
  const source = fs.readFileSync(enginePath, 'utf8');

  test('có hằng PAGE_COMMIT_AT nhỏ hơn 1', () => {
    const match = source.match(/const PAGE_COMMIT_AT = ([\d.]+)/);
    assert.ok(match, 'thiếu PAGE_COMMIT_AT');
    const value = Number(match[1]);
    assert.ok(value > 0 && value < 1, `PAGE_COMMIT_AT phải nằm trong (0,1), nhận ${value}`);
  });

  test('cả ba hiệu ứng đều commit theo tiến trình', () => {
    const commits = source.match(/p >= PAGE_COMMIT_AT/g) ?? [];
    assert.ok(commits.length >= 3, `cần ít nhất 3 điểm commit giữa hiệu ứng, hiện có ${commits.length}`);
  });

  test('giọt nước dùng bề mặt nổi của theme mới', () => {
    assert.match(source, /createDrop\(THEMES\[next\]\.raised\)/);
  });
});
