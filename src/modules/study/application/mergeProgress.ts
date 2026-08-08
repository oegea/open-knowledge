import { CourseProgress } from '../domain/CourseProgress';
import { ProgressRepository } from '../domain/ProgressRepository';

interface mergeProgressProps {
  courseId: string;
  sourceRepository: ProgressRepository;
  targetRepository: ProgressRepository;
}

/**
 * Merges progress from one store into another (e.g. anonymous device
 * progress into the account when the student signs in). Completion only
 * grows; the last visited material is kept when the target has none.
 */
export async function mergeProgress({
  courseId,
  sourceRepository,
  targetRepository,
}: mergeProgressProps): Promise<CourseProgress> {
  if (!courseId) {
    throw new Error('[mergeProgress] Course id must be provided');
  }

  const source = await sourceRepository.getProgress(courseId);
  let target = await targetRepository.getProgress(courseId);

  if (source.getCompletedMaterialIds().length === 0 && source.getLastMaterialId() === null) {
    return target;
  }

  for (const materialId of source.getCompletedMaterialIds()) {
    target = target.markCompleted(materialId);
  }
  if (target.getLastMaterialId() === null && source.getLastMaterialId() !== null) {
    target = target.withLastMaterial(source.getLastMaterialId()!);
  }

  await targetRepository.saveProgress(target);
  return target;
}
