import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';

interface getCourseProps {
  id: string;
  courseRepository: CourseRepository;
}

export async function getCourse({ id, courseRepository }: getCourseProps): Promise<Course> {
  if (!id) {
    throw new Error('[getCourse] Id must be provided');
  }

  const course = await courseRepository.findById(id);
  if (course === null) {
    throw new Error(`[getCourse] Course with id ${id} not found`);
  }

  return course;
}
