import type { NextRequest } from 'next/server';
import courseFactory from '@/modules/course/application/factory';
import { apiError } from '../apiError';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const courses = await courseFactory.listCourses({
      publishedOnly: searchParams.get('published') === 'true' || undefined,
      language: searchParams.get('language') ?? undefined,
      category: searchParams.get('category') ?? undefined,
    });
    return Response.json({ courses: courses.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const course = await courseFactory.createCourse(body);
    return Response.json({ course: course.toPrimitive() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
