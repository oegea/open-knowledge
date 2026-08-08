import { CourseProgress } from '../domain/CourseProgress';
import { ProgressRepository } from '../domain/ProgressRepository';

interface unmarkMaterialCompletedProps {
  courseId: string;
  materialId: string;
  progressRepository: ProgressRepository;
}

export async function unmarkMaterialCompleted({
  courseId,
  materialId,
  progressRepository,
}: unmarkMaterialCompletedProps): Promise<CourseProgress> {
  if (!courseId) {
    throw new Error('[unmarkMaterialCompleted] Course id must be provided');
  }
  if (!materialId) {
    throw new Error('[unmarkMaterialCompleted] Material id must be provided');
  }

  const progress = await progressRepository.getProgress(courseId);
  const updated = progress.unmarkCompleted(materialId);
  await progressRepository.saveProgress(updated);

  return updated;
}
