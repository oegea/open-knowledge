import { CourseProgress } from '../domain/CourseProgress';
import { ProgressRepository } from '../domain/ProgressRepository';

/**
 * Client-side progress for registered users: persists on the server so
 * learning continues across devices and sessions.
 */
export class HttpProgressRepository implements ProgressRepository {
  async getProgress(courseId: string): Promise<CourseProgress> {
    const response = await fetch(`/api/progress/${courseId}`);
    if (!response.ok) return CourseProgress.create(courseId);
    const body = await response.json();
    return CourseProgress.fromPrimitive(body.progress);
  }

  async saveProgress(progress: CourseProgress): Promise<void> {
    const data = progress.toPrimitive();
    await fetch(`/api/progress/${data.courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completedMaterialIds: data.completedMaterialIds,
        lastMaterialId: data.lastMaterialId,
      }),
    });
  }
}
