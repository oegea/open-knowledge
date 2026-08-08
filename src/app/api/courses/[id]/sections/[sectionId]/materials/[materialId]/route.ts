import type { NextRequest } from 'next/server';
import courseFactory from '@/modules/course/application/factory';
import { requireAdmin } from '@/app/serverAuth';
import { apiError } from '../../../../../../apiError';

type Ctx = RouteContext<'/api/courses/[id]/sections/[sectionId]/materials/[materialId]'>;

export async function PUT(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id, sectionId, materialId } = await ctx.params;
    const body = await request.json();
    const course = await courseFactory.updateMaterial(id, sectionId, materialId, body);
    return Response.json({ course: course.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id, sectionId, materialId } = await ctx.params;
    const body = await request.json();
    const course = await courseFactory.moveMaterial(id, sectionId, materialId, body.newIndex);
    return Response.json({ course: course.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id, sectionId, materialId } = await ctx.params;
    const course = await courseFactory.removeMaterial(id, sectionId, materialId);
    return Response.json({ course: course.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}
