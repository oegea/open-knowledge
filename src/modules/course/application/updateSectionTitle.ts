import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';

interface updateSectionTitleProps {
  courseId: string;
  sectionId: string;
  title: string;
  courseRepository: CourseRepository;
}

export async function updateSectionTitle({
  courseId,
  sectionId,
  title,
  courseRepository,
}: updateSectionTitleProps): Promise<Course> {
  if (!courseId) {
    throw new Error('[updateSectionTitle] Course id must be provided');
  }

  const course = await courseRepository.findById(courseId);
  if (course === null) {
    throw new Error(`[updateSectionTitle] Course with id ${courseId} not found`);
  }

  const section = course.getSections().getSectionById(sectionId);
  if (section === null) {
    throw new Error(`[updateSectionTitle] Section with id ${sectionId} not found`);
  }

  const updated = course.setSections(course.getSections().updateSection(section.setTitle(title)));

  return await courseRepository.save(updated);
}
