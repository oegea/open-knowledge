import type { NextRequest } from 'next/server';
import courseFactory from '@/modules/course/application/factory';
import { requireAdmin } from '@/app/serverAuth';
import { apiError } from '../../../apiError';

export async function POST(request: NextRequest, ctx: RouteContext<'/api/courses/[id]/sections'>) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const course = await courseFactory.addSection(id, body.title);
    return Response.json({ course: course.toPrimitive() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
