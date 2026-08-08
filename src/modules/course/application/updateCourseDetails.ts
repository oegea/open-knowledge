import { Course } from '../domain/Course';
import { SourcePrimitive } from '../domain/Source';
import { CourseRepository } from '../domain/CourseRepository';

interface updateCourseDetailsProps {
  id: string;
  title: string;
  description: string;
  language: string;
  category: string | null;
  coverImage: string | null;
  authors: string[];
  sources: SourcePrimitive[];
  aiAssisted: boolean;
  courseRepository: CourseRepository;
}

export async function updateCourseDetails({
  id,
  title,
  description,
  language,
  category,
  coverImage,
  authors,
  sources,
  aiAssisted,
  courseRepository,
}: updateCourseDetailsProps): Promise<Course> {
  if (!id) {
    throw new Error('[updateCourseDetails] Id must be provided');
  }

  const course = await courseRepository.findById(id);
  if (course === null) {
    throw new Error(`[updateCourseDetails] Course with id ${id} not found`);
  }

  const updated = course.setDetails({
    title,
    description,
    language,
    category,
    coverImage,
    authors,
    sources,
    aiAssisted,
  });

  return await courseRepository.save(updated);
}
