import type { NextRequest } from 'next/server';
import mediaFactory from '@/modules/media/application/factory';

/**
 * Serves stored media. Supports HTTP Range requests so audio/video seeking
 * works in browser players.
 */
export async function GET(request: NextRequest, ctx: RouteContext<'/api/media/[...path]'>) {
  const { path } = await ctx.params;

  let media;
  try {
    media = await mediaFactory.getMediaFile(path.join('/'));
  } catch {
    return new Response('Not found', { status: 404 });
  }

  // Uploads are served from the app's own origin: never let the browser
  // sniff a different type, and neutralise scripts in SVGs opened directly
  // (as <img> they are inert already; the CSP does not affect that use).
  const hardening: Record<string, string> = { 'X-Content-Type-Options': 'nosniff' };
  if (media.mime === 'image/svg+xml') {
    hardening['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  }

  const range = request.headers.get('range');
  const body = new Uint8Array(media.data);
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? Math.min(parseInt(match[2], 10), media.size - 1) : media.size - 1;
      if (start <= end && start < media.size) {
        return new Response(body.slice(start, end + 1), {
          status: 206,
          headers: {
            'Content-Type': media.mime,
            'Content-Range': `bytes ${start}-${end}/${media.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(end - start + 1),
            'Cache-Control': 'public, max-age=31536000, immutable',
            ...hardening,
          },
        });
      }
    }
  }

  return new Response(body, {
    headers: {
      'Content-Type': media.mime,
      'Content-Length': String(media.size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...hardening,
    },
  });
}
