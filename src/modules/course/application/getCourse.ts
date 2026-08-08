import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';

interface getCourseProps {
  /** Course id or URL slug — public routes link by slug, older links by id. */
  id: string;
  courseRepository: CourseRepository;
}

export async function getCourse({ id, courseRepository }: getCourseProps): Promise<Course> {
  if (!id) {
    throw new Error('[getCourse] Id must be provided');
  }

  const course = (await courseRepository.findById(id)) ?? (await courseRepository.findBySlug(id));
  if (course === null) {
    throw new Error(`[getCourse] Course with id ${id} not found`);
  }

  return course;
}
