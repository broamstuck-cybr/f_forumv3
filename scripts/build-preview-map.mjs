import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const pinRoot = process.argv[2] || '/tmp/ff-ref/pin-ui';
const sokRoot = process.argv[3] || '/tmp/ff-ref/sok';
const catalog = JSON.parse(readFileSync('src/data/sourceCatalog.json', 'utf8'));
const threeManifest = JSON.parse(readFileSync(path.join(sokRoot, 'sources/threeui/manifest.json'), 'utf8'));
const threeByPath = new Map(threeManifest.map((item) => [item.path, item.preview]));
const pinBase = 'https://www.pinui.xyz';
const map = {};

for (const item of catalog) {
  const slug = String(item.archivePath || '').split('/').pop();
  if (item.sourceLibrary === 'pinui' && item.archivePath.includes('/registry/')) {
    const hasWall = existsSync(path.join(pinRoot, 'public/clips/wall', `${slug}.mp4`));
    const hasThumb = existsSync(path.join(pinRoot, 'public/clips/thumb', `${slug}.webp`));
    if (hasWall) {
      map[item.id] = {
        kind: 'video',
        src: `${pinBase}/clips/wall/${slug}.mp4`,
        poster: hasThumb ? `${pinBase}/clips/thumb/${slug}.webp` : undefined,
        credit: 'pinui.xyz',
      };
    }
  }
  if (item.sourceLibrary === 'pinui' && item.archivePath.includes('/blocx/')) {
    const thumb = ['webp', 'jpg', 'png']
      .map((ext) => `${slug}.${ext}`)
      .find((file) => existsSync(path.join(pinRoot, 'public/blocx/thumbs', file)));
    if (thumb) {
      map[item.id] = { kind: 'image', src: `${pinBase}/blocx/thumbs/${thumb}`, credit: 'pinui.xyz' };
    }
  }
  if (item.sourceLibrary === 'threeui') {
    const preview = threeByPath.get(item.archivePath);
    if (preview) {
      map[item.id] = { kind: 'image', src: preview, credit: 'threeui.com' };
    }
  }
}

writeFileSync('src/data/previewMap.json', `${JSON.stringify(map, null, 2)}\n`);
const counts = Object.values(map).reduce((acc, entry) => {
  acc[entry.credit] = (acc[entry.credit] || 0) + 1;
  return acc;
}, {});
console.log(Object.keys(map).length, counts);
