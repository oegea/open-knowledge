import { randomUUID } from 'crypto';
import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';
import { Section } from '../domain/Section';
import { MaterialList } from '../domain/MaterialList';

interface addSectionProps {
  courseId: string;
  title: string;
  courseRepository: CourseRepository;
}

export async function addSection({
  courseId,
  title,
  courseRepository,
}: addSectionProps): Promise<Course> {
  if (!courseId) {
    throw new Error('[addSection] Course id must be provided');
  }

  const course = await courseRepository.findById(courseId);
  if (course === null) {
    throw new Error(`[addSection] Course with id ${courseId} not found`);
  }

  const section = Section.create(randomUUID(), title, MaterialList.create(null));
  const updated = course.setSections(course.getSections().addSection(section));

  return await courseRepository.save(updated);
}
