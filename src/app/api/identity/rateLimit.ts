/**
 * Minimal in-memory rate limiter for identity endpoints. Good enough for a
 * single-process self-hosted instance (ADR 0003); resets on restart.
 */
const buckets = new Map<string, number[]>();

export function allowRequest(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): boolean {
  const windowStart = now - windowMs;
  const timestamps = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  buckets.set(key, timestamps);
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || 'local';
}
