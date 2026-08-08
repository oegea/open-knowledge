import { CourseProgress, CourseProgressPrimitive } from '../../domain/CourseProgress';

export function create(overrides: Partial<CourseProgressPrimitive> = {}): CourseProgress {
  return CourseProgress.fromPrimitive({
    courseId: 'course-1',
    completedMaterialIds: [],
    lastMaterialId: null,
    ...overrides,
  });
}
