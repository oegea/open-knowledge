import type { NextRequest } from 'next/server';
import courseFactory from '@/modules/course/application/factory';
import { getCurrentUser, requireAdmin } from '@/app/serverAuth';
import { apiError } from '../apiError';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user?.isAdmin() ?? false;
    const { searchParams } = request.nextUrl;
    const courses = await courseFactory.listCourses({
      // Only the administrator can list drafts.
      publishedOnly: isAdmin ? searchParams.get('published') === 'true' || undefined : true,
      language: searchParams.get('language') ?? undefined,
      category: searchParams.get('category') ?? undefined,
    });
    return Response.json({ courses: courses.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const course = await courseFactory.createCourse(body);
    return Response.json({ course: course.toPrimitive() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
