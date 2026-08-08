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
    },
  });
}
