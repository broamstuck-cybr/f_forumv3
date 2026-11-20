import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const catalogue = JSON.parse(readFileSync(new URL('../src/data/sourceCatalog.json', import.meta.url), 'utf8'));

test('PinUI catalogue includes the archived components and blocks plus the upstream slider', () => {
  const items = catalogue.filter(item => item.sourceLibrary === 'pinui');
  assert.equal(items.filter(item => item.subcategory === 'component').length, 31);
  assert.equal(items.filter(item => item.subcategory === 'blocx').length, 11);
  assert.equal(new Set(items.map(item => item.id)).size, 42);
  const archived = items.filter(item => item.id !== 'component/sling-slider');
  assert.equal(archived.length, 41);
  for (const item of archived) {
    assert.match(item.installCommand, /^npx shadcn@latest add "https:\/\/www\.pinui\.xyz\/r\/(?:blocx\/)?[\w-]+\.json"$/);
    assert.match(item.license, /MIT/);
  }
});
