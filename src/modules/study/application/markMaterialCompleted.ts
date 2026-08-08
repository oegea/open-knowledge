import { CourseProgress } from '../domain/CourseProgress';
import { ProgressRepository } from '../domain/ProgressRepository';

interface markMaterialCompletedProps {
  courseId: string;
  materialId: string;
  progressRepository: ProgressRepository;
}

export async function markMaterialCompleted({
  courseId,
  materialId,
  progressRepository,
}: markMaterialCompletedProps): Promise<CourseProgress> {
  if (!courseId) {
    throw new Error('[markMaterialCompleted] Course id must be provided');
  }
  if (!materialId) {
    throw new Error('[markMaterialCompleted] Material id must be provided');
  }

  const progress = await progressRepository.getProgress(courseId);
  const updated = progress.markCompleted(materialId).withLastMaterial(materialId);
  await progressRepository.saveProgress(updated);

  return updated;
}
