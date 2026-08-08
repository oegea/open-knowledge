import { CourseProgress } from '../domain/CourseProgress';
import { ProgressRepository } from '../domain/ProgressRepository';

interface trackMaterialVisitProps {
  courseId: string;
  materialId: string;
  progressRepository: ProgressRepository;
}

export async function trackMaterialVisit({
  courseId,
  materialId,
  progressRepository,
}: trackMaterialVisitProps): Promise<CourseProgress> {
  if (!courseId) {
    throw new Error('[trackMaterialVisit] Course id must be provided');
  }
  if (!materialId) {
    throw new Error('[trackMaterialVisit] Material id must be provided');
  }

  const progress = await progressRepository.getProgress(courseId);
  const updated = progress.withLastMaterial(materialId);
  await progressRepository.saveProgress(updated);

  return updated;
}
