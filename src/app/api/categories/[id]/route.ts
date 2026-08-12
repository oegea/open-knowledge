import type { NextRequest } from 'next/server';
import categoryFactory from '@/modules/category/application/factory';
import { requireAdmin } from '@/app/serverAuth';
import { apiError } from '../../apiError';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/categories/[id]'>) {
  try {
    const { id } = await ctx.params;
    const category = await categoryFactory.getCategory(id);
    return Response.json({ category: category.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/categories/[id]'>) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const category = await categoryFactory.updateCategory(id, body.name, body.imagePath);
    return Response.json({ category: category.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/categories/[id]'>) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    await categoryFactory.deleteCategory(id);
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
