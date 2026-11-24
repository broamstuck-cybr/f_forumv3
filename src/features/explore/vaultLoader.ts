export type VaultLibraryKey =
  | 'pinui'
  | 'codefronts'
  | 'lucianlabs'
  | 'motionsites'
  | 'threeui'
  | 'glacier';

export interface VaultIndexItem {
  i: string;
  t: string;
  l: VaultLibraryKey;
  g: string;
  c: string;
  tg: string[];
  s: string;
  d: number;
}

export interface VaultIndexData {
  total: number;
  sharded?: boolean;
  shardExt?: string;
  items: VaultIndexItem[];
}

export interface VaultShardPayload {
  h: string;
  c: string;
  j: string;
  cl?: string;
  p: string;
  img?: string;
  vid?: string;
  u?: string;
  m?: {
    tone?: string;
    stack?: string[];
    mood?: string[];
    layout?: string;
    runtime?: string;
    category?: string;
  };
}

export const VAULT_LIBRARY_ORDER: VaultLibraryKey[] = [
  'pinui',
  'threeui',
  'lucianlabs',
  'motionsites',
  'codefronts',
  'glacier',
];

export const VAULT_LIBRARY_LABELS: Record<VaultLibraryKey, string> = {
  pinui: 'Tương tác',
  lucianlabs: 'Hiệu ứng',
  threeui: 'Không gian 3D',
  motionsites: 'Chuyển động',
  codefronts: 'Bố cục',
  glacier: 'Nền & Lớp',
};

export function resolveOriginalLiveUrl(
  library: VaultLibraryKey,
  id: string,
  explicitUrl?: string
): string {
  if (explicitUrl) return explicitUrl;
  if (library === 'motionsites') {
    return `https://motionsites.ai/sections#${id.replace(/^ms-/, '')}`;
  }
  if (library === 'glacier') {
    return `https://www.getlayers.ai/layer/${id.replace(/^glacier\//, '')}`;
  }
  if (library === 'pinui') {
    const bare = id.replace(/^(component|blocx|registry)\//, '');
    return id.startsWith('blocx/')
      ? `https://www.pinui.xyz/blocx/${bare}`
      : `https://www.pinui.xyz/components/${bare}`;
  }
  if (library === 'lucianlabs') {
    return `https://lucianlabs.dev/en/uxui-prompt/#${id}`;
  }
  if (library === 'codefronts') {
    return id.startsWith('cf/')
      ? `https://codefronts.com/components/${id.slice(3)}/`
      : `https://codefronts.com/${id}/`;
  }
  if (library === 'threeui') {
    return `https://threeui.com/${id}`;
  }
  return '';
}

export const VAULT_CACHE_VERSION = 'v9.6';

let vaultIndexCache: VaultIndexData | null = null;
let vaultIndexPromise: Promise<VaultIndexData> | null = null;

const shardCache = new Map<string, Record<string, VaultShardPayload>>();
const shardInflight = new Map<string, Promise<Record<string, VaultShardPayload>>>();

export function getCachedVaultIndex(): VaultIndexData | null {
  return vaultIndexCache;
}

export function fetchVaultIndex(): Promise<VaultIndexData> {
  if (vaultIndexCache) return Promise.resolve(vaultIndexCache);
  if (!vaultIndexPromise) {
    vaultIndexPromise = fetch(`/data/studio-vault.json?v=${VAULT_CACHE_VERSION}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<VaultIndexData>;
      })
      .then((data) => {
        const normalized: VaultIndexData = {
          total: typeof data?.total === 'number' ? data.total : (data?.items?.length ?? 0),
          sharded: Boolean(data?.sharded),
          shardExt: typeof data?.shardExt === 'string' ? data.shardExt : 'jgz',
          items: Array.isArray(data?.items) ? data.items : [],
        };
        vaultIndexCache = normalized;
        return normalized;
      })
      .catch((err) => {
        vaultIndexPromise = null;
        throw err;
      });
  }
  return vaultIndexPromise;
}

export function getCachedVaultShard(
  shardName: string
): Record<string, VaultShardPayload> | null {
  return shardCache.get(shardName) ?? null;
}

// WHY: Inspect gzip magic bytes (0x1f 0x8b) so shards decode identically whether a proxy auto-decompresses or sends raw bytes.
async function decodeShardBuffer(buf: ArrayBuffer): Promise<Record<string, VaultShardPayload>> {
  const bytes = new Uint8Array(buf);
  let text: string;
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Trình duyệt không hỗ trợ giải nén shard gzip.');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    text = await new Response(stream).text();
  } else {
    text = new TextDecoder('utf-8').decode(bytes);
  }
  const parsed = JSON.parse(text) as Record<string, VaultShardPayload>;
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export function fetchVaultShard(
  shardName: string
): Promise<Record<string, VaultShardPayload>> {
  if (!shardName || shardName === 'pinui') return Promise.resolve({});
  const cached = shardCache.get(shardName);
  if (cached) return Promise.resolve(cached);

  const pending = shardInflight.get(shardName);
  if (pending) return pending;

  const ext = vaultIndexCache?.shardExt || 'jgz';
  const req = fetch(`/data/vault/${encodeURIComponent(shardName)}.${ext}?v=${VAULT_CACHE_VERSION}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((buf) => decodeShardBuffer(buf))
    .then((safe) => {
      shardCache.set(shardName, safe);
      shardInflight.delete(shardName);
      return safe;
    })
    .catch((err) => {
      shardInflight.delete(shardName);
      throw err;
    });

  shardInflight.set(shardName, req);
  return req;
}
