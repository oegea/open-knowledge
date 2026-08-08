import type { NextRequest } from 'next/server';
import newsFactory from '@/modules/news/application/factory';
import { getCurrentUser, requireAdmin } from '@/app/serverAuth';
import { apiError } from '../../apiError';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/news/[id]'>) {
  try {
    const { id } = await ctx.params;
    const post = await newsFactory.getNewsPost(id);
    if (!post.isPublished()) {
      const user = await getCurrentUser();
      if (!user?.isAdmin()) {
        return Response.json({ error: `News post with id ${id} not found` }, { status: 404 });
      }
    }
    return Response.json({ post: post.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/news/[id]'>) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const post = await newsFactory.updateNewsPost(id, body.title, body.markdown, body.published, body.imagePath);
    return Response.json({ post: post.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/news/[id]'>) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    await newsFactory.deleteNewsPost(id);
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
