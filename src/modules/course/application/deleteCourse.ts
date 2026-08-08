import { CourseRepository } from '../domain/CourseRepository';

interface deleteCourseProps {
  id: string;
  courseRepository: CourseRepository;
}

export async function deleteCourse({ id, courseRepository }: deleteCourseProps): Promise<void> {
  if (!id) {
    throw new Error('[deleteCourse] Id must be provided');
  }

  const deleted = await courseRepository.delete(id);
  if (!deleted) {
    throw new Error(`[deleteCourse] Course with id ${id} not found`);
  }
}
