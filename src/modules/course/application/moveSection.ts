import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';

interface moveSectionProps {
  courseId: string;
  sectionId: string;
  newIndex: number;
  courseRepository: CourseRepository;
}

export async function moveSection({
  courseId,
  sectionId,
  newIndex,
  courseRepository,
}: moveSectionProps): Promise<Course> {
  if (!courseId) {
    throw new Error('[moveSection] Course id must be provided');
  }
  if (typeof newIndex !== 'number' || newIndex < 0 || !Number.isInteger(newIndex)) {
    throw new Error('[moveSection] newIndex must be a non-negative integer');
  }

  const course = await courseRepository.findById(courseId);
  if (course === null) {
    throw new Error(`[moveSection] Course with id ${courseId} not found`);
  }

  const updated = course.setSections(course.getSections().moveSection(sectionId, newIndex));

  return await courseRepository.save(updated);
}
