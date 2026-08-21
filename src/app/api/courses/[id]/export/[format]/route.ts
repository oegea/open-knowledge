import type { NextRequest } from 'next/server';
import exportFactory from '@/modules/export/application/factory';
import { apiError } from '../../../../apiError';

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/courses/[id]/export/[format]'>
) {
  const { id, format } = await ctx.params;
  if (format !== 'epub' && format !== 'pdf') {
    return Response.json({ error: `Unknown export format: ${format}` }, { status: 400 });
  }

  try {
    const host = request.headers.get('host') ?? 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') ?? 'http';
    const notesPages = request.nextUrl.searchParams.get('notes') === '1';
    const result = await exportFactory.exportCourse(id, format, `${proto}://${host}`, {
      notesPages,
    });

    return new Response(new Uint8Array(result.data), {
      headers: {
        'Content-Type': result.mime,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': String(result.data.byteLength),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
