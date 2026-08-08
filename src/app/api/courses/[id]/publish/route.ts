import type { NextRequest } from 'next/server';
import courseFactory from '@/modules/course/application/factory';
import { apiError } from '../../../apiError';

export async function POST(_request: NextRequest, ctx: RouteContext<'/api/courses/[id]/publish'>) {
  try {
    const { id } = await ctx.params;
    const course = await courseFactory.publishCourse(id);
    return Response.json({ course: course.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/courses/[id]/publish'>
) {
  try {
    const { id } = await ctx.params;
    const course = await courseFactory.unpublishCourse(id);
    return Response.json({ course: course.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}
