import type { NextRequest } from 'next/server';
import courseFactory from '@/modules/course/application/factory';
import { apiError } from '../../apiError';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/courses/[id]'>) {
  try {
    const { id } = await ctx.params;
    const course = await courseFactory.getCourse(id);
    return Response.json({ course: course.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/courses/[id]'>) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const course = await courseFactory.updateCourseDetails(id, body);
    return Response.json({ course: course.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/courses/[id]'>) {
  try {
    const { id } = await ctx.params;
    await courseFactory.deleteCourse(id);
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
