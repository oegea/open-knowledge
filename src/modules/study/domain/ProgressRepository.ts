import { CourseProgress } from './CourseProgress';

export interface ProgressRepository {
  getProgress(courseId: string): Promise<CourseProgress>;
  saveProgress(progress: CourseProgress): Promise<void>;
}
