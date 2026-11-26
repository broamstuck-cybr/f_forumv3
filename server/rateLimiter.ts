export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

const buckets = new Map<string, number[]>();

function pruneStaleBuckets(now: number, maxWindowMs: number): void {
  if (buckets.size <= 5000) return;
  for (const [key, timestamps] of buckets.entries()) {
    const fresh = timestamps.filter((ts) => now - ts < maxWindowMs);
    if (fresh.length === 0) {
      buckets.delete(key);
    } else {
      buckets.set(key, fresh);
    }
  }
}

export function checkSlidingWindowLimit(
  bucketKey: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  pruneStaleBuckets(now, Math.max(windowMs, 15 * 60_000));

  const existing = buckets.get(bucketKey) || [];
  const active = existing.filter((ts) => now - ts < windowMs);

  if (active.length >= limit) {
    const oldest = active[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(bucketKey, active);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  active.push(now);
  buckets.set(bucketKey, active);
  return {
    allowed: true,
    remaining: Math.max(0, limit - active.length),
    retryAfterSec: 0,
  };
}
