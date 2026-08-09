import { NextRequest, NextResponse } from 'next/server';

/**
 * Static content mode (ADR 0013): identity does not exist, content is
 * read-only. Every API that implies accounts or writes returns 404 so the
 * stateless instance never needs a database. Pages render their own branded
 * not-found through notFound() in the route components.
 */

const BLOCKED_API = [
  /^\/api\/identity(\/|$)/,
  /^\/api\/notifications(\/|$)/,
  /^\/api\/progress(\/|$)/,
  /^\/api\/exam-attempts(\/|$)/,
  /^\/api\/certificates(\/|$)/,
  /^\/api\/backup(\/|$)/,
  /^\/api\/media(\/|$)/,
  /^\/api\/settings(\/|$)/,
];

export function proxy(request: NextRequest) {
  if (!process.env.OK_CONTENT_REPO?.trim()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/api/')) return NextResponse.next();

  if (BLOCKED_API.some((pattern) => pattern.test(pathname))) {
    return Response.json({ error: 'Not available in static content mode' }, { status: 404 });
  }
  // Content APIs stay readable; every write is refused.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json({ error: 'Static content mode is read-only' }, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
