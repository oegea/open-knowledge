import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';

interface recategorizeCoursesProps {
  from: string;
  to: string;
  courseRepository: CourseRepository;
}

/** Relabels every course whose category is `from` to `to` (category rename). */
export async function recategorizeCourses({
  from,
  to,
  courseRepository,
}: recategorizeCoursesProps): Promise<number> {
  if (!from) {
    throw new Error('[recategorizeCourses] source category must be provided');
  }
  if (!to || to.trim() === '') {
    throw new Error('[recategorizeCourses] target category must be provided');
  }
  Course.ensureCourseIsValid(to);

  return await courseRepository.reassignCategory(from, to);
}
