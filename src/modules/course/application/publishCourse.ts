import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';

interface publishCourseProps {
  id: string;
  courseRepository: CourseRepository;
  /** Port: notifies readers when a course becomes published. */
  onCoursePublished?: (course: Course) => Promise<void>;
}

export async function publishCourse({
  id,
  courseRepository,
  onCoursePublished,
}: publishCourseProps): Promise<Course> {
  if (!id) {
    throw new Error('[publishCourse] Id must be provided');
  }

  const course = await courseRepository.findById(id);
  if (course === null) {
    throw new Error(`[publishCourse] Course with id ${id} not found`);
  }

  const wasPublished = course.isPublished();
  const published = await courseRepository.save(course.publish());

  if (!wasPublished && onCoursePublished) {
    await onCoursePublished(published);
  }

  return published;
}
