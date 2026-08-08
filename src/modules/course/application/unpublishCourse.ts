import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';

interface unpublishCourseProps {
  id: string;
  courseRepository: CourseRepository;
}

export async function unpublishCourse({
  id,
  courseRepository,
}: unpublishCourseProps): Promise<Course> {
  if (!id) {
    throw new Error('[unpublishCourse] Id must be provided');
  }

  const course = await courseRepository.findById(id);
  if (course === null) {
    throw new Error(`[unpublishCourse] Course with id ${id} not found`);
  }

  return await courseRepository.save(course.unpublish());
}
