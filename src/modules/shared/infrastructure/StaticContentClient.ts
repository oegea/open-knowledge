/**
 * HTTP client for static content mode (ADR 0013). Content lives in a public
 * repository exposed over plain HTTP (e.g. a GitHub raw URL); this client
 * fetches JSON documents with a small in-memory cache so a page render never
 * hits the origin more than once per TTL.
 */

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  body: unknown;
  etag: string | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/** Base URL of the content repository, or null in database mode. */
export function getContentRepoUrl(): string | null {
  const url = process.env.OK_CONTENT_REPO?.trim();
  return url ? url.replace(/\/+$/, '') : null;
}

export function isStaticMode(): boolean {
  return getContentRepoUrl() !== null;
}

/**
 * Resolves a media reference from content JSON: relative paths ("media/x.png")
 * point into the content repository; absolute URLs pass through.
 */
export function resolveContentUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${getContentRepoUrl()}/${path.replace(/^\/+/, '')}`;
}

/** Fetches a JSON document from the content repository. Null when missing. */
export async function fetchContentJson<T>(relativePath: string): Promise<T | null> {
  const base = getContentRepoUrl();
  if (!base) throw new Error('[StaticContentClient] OK_CONTENT_REPO is not set');

  const url = `${base}/${relativePath.replace(/^\/+/, '')}`;
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.body as T | null;
  }

  const headers: Record<string, string> = {};
  if (cached?.etag) headers['If-None-Match'] = cached.etag;

  const response = await fetch(url, { headers, cache: 'no-store' });

  if (response.status === 304 && cached) {
    cached.expiresAt = Date.now() + CACHE_TTL_MS;
    return cached.body as T | null;
  }
  if (response.status === 404) {
    cache.set(url, { body: null, etag: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  }
  if (!response.ok) {
    // Origin hiccup: serve stale content if we have it rather than erroring.
    if (cached) return cached.body as T | null;
    throw new Error(`[StaticContentClient] ${url} responded ${response.status}`);
  }

  const body = (await response.json()) as T;
  cache.set(url, {
    body,
    etag: response.headers.get('etag'),
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return body;
}

/** Test hook. */
export function clearContentCache(): void {
  cache.clear();
}
