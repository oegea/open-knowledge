import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';

interface removeSectionProps {
  courseId: string;
  sectionId: string;
  courseRepository: CourseRepository;
}

export async function removeSection({
  courseId,
  sectionId,
  courseRepository,
}: removeSectionProps): Promise<Course> {
  if (!courseId) {
    throw new Error('[removeSection] Course id must be provided');
  }

  const course = await courseRepository.findById(courseId);
  if (course === null) {
    throw new Error(`[removeSection] Course with id ${courseId} not found`);
  }

  const updated = course.setSections(course.getSections().removeSection(sectionId));

  return await courseRepository.save(updated);
}
