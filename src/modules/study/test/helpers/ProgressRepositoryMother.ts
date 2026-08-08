import { ProgressRepository } from '../../domain/ProgressRepository';
import { CourseProgress } from '../../domain/CourseProgress';

export function create(overrides?: Partial<ProgressRepository>): ProgressRepository {
  return {
    getProgress: jest.fn().mockImplementation(async (courseId: string) =>
      CourseProgress.create(courseId)
    ),
    saveProgress: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
