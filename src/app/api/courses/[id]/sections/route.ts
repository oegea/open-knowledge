import type { NextRequest } from 'next/server';
import courseFactory from '@/modules/course/application/factory';
import { apiError } from '../../../apiError';

export async function POST(request: NextRequest, ctx: RouteContext<'/api/courses/[id]/sections'>) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const course = await courseFactory.addSection(id, body.title);
    return Response.json({ course: course.toPrimitive() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
