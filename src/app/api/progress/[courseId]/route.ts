import type { NextRequest } from 'next/server';
import { getCourseProgress } from '@/modules/study/application/getCourseProgress';
import { SqliteProgressRepository } from '@/modules/study/infrastructure/SqliteProgressRepository';
import { getCurrentUser } from '@/app/serverAuth';
import { apiError } from '../../apiError';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/progress/[courseId]'>) {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { courseId } = await ctx.params;
    const progress = await getCourseProgress({
      courseId,
      progressRepository: new SqliteProgressRepository(user.getId()!),
    });
    return Response.json({ progress: progress.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/progress/[courseId]'>) {
  const user = await getCurrentUser();
  if (user === null) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { courseId } = await ctx.params;
    const body = await request.json();
    const repository = new SqliteProgressRepository(user.getId()!);
    // Completion only grows: merging keeps concurrent devices consistent.
    const current = await repository.getProgress(courseId);
    let merged = current;
    for (const materialId of body.completedMaterialIds ?? []) {
      merged = merged.markCompleted(materialId);
    }
    if (body.lastMaterialId) {
      merged = merged.withLastMaterial(body.lastMaterialId);
    }
    await repository.saveProgress(merged);
    return Response.json({ progress: merged.toPrimitive() });
  } catch (error) {
    return apiError(error);
  }
}
