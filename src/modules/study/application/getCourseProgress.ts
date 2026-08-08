import { CourseProgress } from '../domain/CourseProgress';
import { ProgressRepository } from '../domain/ProgressRepository';

interface getCourseProgressProps {
  courseId: string;
  progressRepository: ProgressRepository;
}

export async function getCourseProgress({
  courseId,
  progressRepository,
}: getCourseProgressProps): Promise<CourseProgress> {
  if (!courseId) {
    throw new Error('[getCourseProgress] Course id must be provided');
  }

  return await progressRepository.getProgress(courseId);
}
