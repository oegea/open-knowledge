import { CourseProgress } from '../domain/CourseProgress';
import { ProgressRepository } from '../domain/ProgressRepository';

const STORAGE_PREFIX = 'ok-progress:';

/**
 * Anonymous, device-local study progress. Registered users get server-side
 * persistence through a different repository implementation.
 */
export class LocalStorageProgressRepository implements ProgressRepository {
  async getProgress(courseId: string): Promise<CourseProgress> {
    try {
      const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${courseId}`);
      if (!raw) return CourseProgress.create(courseId);
      return CourseProgress.fromPrimitive(JSON.parse(raw));
    } catch {
      return CourseProgress.create(courseId);
    }
  }

  async saveProgress(progress: CourseProgress): Promise<void> {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${progress.getCourseId()}`,
      JSON.stringify(progress.toPrimitive())
    );
  }
}
