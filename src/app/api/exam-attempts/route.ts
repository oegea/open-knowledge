import type { NextRequest } from 'next/server';
import assessmentFactory from '@/modules/assessment/application/factory';
import { getCurrentUser } from '@/app/serverAuth';
import { apiError } from '../apiError';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await assessmentFactory.gradeExam(
      user.getId()!,
      body.courseId,
      body.materialId,
      body.answers
    );
    return Response.json({ result: result.toPrimitive() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const courseId = request.nextUrl.searchParams.get('courseId') ?? '';
    const results = await assessmentFactory.listExamResults(user.getId()!, courseId);
    return Response.json({ results: results.map((result) => result.toPrimitive()) });
  } catch (error) {
    return apiError(error);
  }
}
