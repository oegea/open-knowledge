import type { NextRequest } from 'next/server';
import exportFactory from '@/modules/export/application/factory';

/**
 * The whole course as one plain Markdown document (llms.txt convention):
 * what the "Study with AI" tutor links point assistants at, and a
 * human-copyable plain-text edition of the course.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<'/courses/[id]/llms.txt'>) {
  try {
    const { id } = await ctx.params;
    const markdown = await exportFactory.exportCourseMarkdown(id);
    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
