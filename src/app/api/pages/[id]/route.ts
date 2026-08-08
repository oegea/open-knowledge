import type { NextRequest } from 'next/server';
import pagesFactory from '@/modules/pages/application/factory';
import { requireAdmin } from '@/app/serverAuth';
import { apiError } from '../../apiError';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/pages/[id]'>) {
  try {
    const { id } = await ctx.params;
    const page = await pagesFactory.getPage(id);
    return Response.json({ page: page.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/pages/[id]'>) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const page = await pagesFactory.updatePage(id, body.title, body.markdown, body.placement);
    return Response.json({ page: page.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/pages/[id]'>) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    await pagesFactory.deletePage(id);
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
