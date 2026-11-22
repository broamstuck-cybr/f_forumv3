import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const read = (rel) => fs.readFileSync(path.join(projectRoot, rel), 'utf8');

const presetIds = (() => {
  const source = read('src/types/index.ts');
  const block = source.match(/export const WALLPAPER_PRESETS = \[([\s\S]*?)\] as const;/);
  assert.ok(block, 'thiếu WALLPAPER_PRESETS trong types/index.ts');
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
})();

const settingsBlock = (() => {
  const source = read('src/features/settings/SettingsView.tsx');
  const start = source.indexOf('const PRESETS: PresetDefinition[] = [');
  assert.ok(start >= 0, 'thiếu mảng PRESETS trong SettingsView');
  const end = source.indexOf('\n];', start);
  assert.ok(end > start, 'không xác định được điểm kết thúc của PRESETS');
  return source.slice(start, end);
})();

const settingsPresets = [...settingsBlock.matchAll(/^\s{4}id: '([a-zA-Z]+)',$/gm)].map((m) => m[1]);

describe('Preset hình nền trong Settings', () => {
  test('mọi preset trong danh sách nguồn đều có thẻ chọn trong Settings', () => {
    const missing = presetIds.filter((id) => !settingsPresets.includes(id));
    assert.deepEqual(missing, [], `thiếu preset trong Settings: ${missing.join(', ')}`);
  });

  test('không có preset lạ trong Settings ngoài danh sách nguồn', () => {
    const stray = settingsPresets.filter((id) => !presetIds.includes(id));
    assert.deepEqual(stray, [], `preset không có trong type: ${stray.join(', ')}`);
  });

  test('bước nạp cài đặt không còn danh sách viết tay', () => {
    const store = read('src/store/appStore.tsx');
    assert.match(store, /WALLPAPER_PRESETS as readonly string\[\]\)\.includes/);
    assert.doesNotMatch(
      store,
      /parsed\.wallpaperPreset === 'constellation' \|\|/,
      'danh sách viết tay cũ vẫn còn — preset mới sẽ bị reset khi tải lại'
    );
  });

  test('preset gradient có lớp nền thật trong ambient-video.css', () => {
    const css = read('src/components/layout/ambient-video.css');
    /* ember/harbour là nền video, aurora/constellation vẽ bằng canvas,
       nên chỉ các preset gradient thuần mới cần luật `data-preset`. */
    const canvasOrVideo = ['auto', 'ember', 'harbour', 'aurora', 'constellation'];
    const gradientOnly = presetIds.filter((id) => !canvasOrVideo.includes(id));
    const missing = gradientOnly.filter((id) => !css.includes(`data-preset='${id}'`));
    assert.deepEqual(missing, [], `preset chưa có CSS nền: ${missing.join(', ')}`);
  });

  test('preset gradient tự viết khai báo token cho cả nền sáng và tối', () => {
    const tokens = read('src/styles/tokens.css');
    const custom = ['godray', 'meshDusk', 'jade', 'rose'];
    for (const id of custom) {
      for (const theme of ['dark', 'light']) {
        const needle = `html[data-theme='${theme}'][data-wallpaper='${id}']`;
        assert.ok(tokens.includes(needle), `thiếu token ${theme} cho preset ${id}`);
      }
    }
  });

  test('preset nào cũng có mô tả, không dùng câu khoe thông số', () => {
    const descs = [...settingsBlock.matchAll(/^\s{4}desc: '([^']+)',$/gm)].map((m) => m[1]);
    assert.ok(descs.length >= presetIds.length, 'số mô tả ít hơn số preset');
    for (const desc of descs) {
      assert.doesNotMatch(desc, /\d+\s?(px|ms)\b/, `mô tả còn thông số kỹ thuật: ${desc}`);
    }
  });
});
