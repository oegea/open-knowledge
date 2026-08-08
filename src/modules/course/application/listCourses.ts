import { CourseList } from '../domain/CourseList';
import { CourseFilter, CourseRepository } from '../domain/CourseRepository';

interface listCoursesProps {
  filter?: CourseFilter;
  courseRepository: CourseRepository;
}

export async function listCourses({
  filter,
  courseRepository,
}: listCoursesProps): Promise<CourseList> {
  return await courseRepository.findAll(filter);
}
