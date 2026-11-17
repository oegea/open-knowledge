/**
 * Minimal in-memory rate limiter for identity endpoints. Good enough for a
 * single-process self-hosted instance (ADR 0003); resets on restart.
 */
const buckets = new Map<string, number[]>();

/** Longest window any caller uses; older timestamps can never count again. */
const MAX_WINDOW_MS = 60 * 60 * 1000;
/** Sweep threshold: keys are attacker-influenced, so the map must stay bounded. */
const MAX_BUCKETS = 10_000;

function sweep(now: number): void {
  for (const [key, timestamps] of buckets) {
    if (timestamps.every((t) => t <= now - MAX_WINDOW_MS)) buckets.delete(key);
  }
  // Still over the cap (a flood of live keys): drop the oldest insertions.
  for (const key of buckets.keys()) {
    if (buckets.size <= MAX_BUCKETS) break;
    buckets.delete(key);
  }
}

export function allowRequest(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): boolean {
  // E2E suites register and sign in far more often than any human; the
  // isolated test instance opts out explicitly.
  if (process.env.OK_DISABLE_RATE_LIMIT === '1') return true;

  const windowStart = now - windowMs;
  const timestamps = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  buckets.set(key, timestamps);
  if (buckets.size > MAX_BUCKETS) sweep(now);
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || 'local';
}
