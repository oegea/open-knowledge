import { randomUUID } from 'crypto';
import { Course } from '../domain/Course';
import { SourcePrimitive } from '../domain/Source';
import { CourseRepository } from '../domain/CourseRepository';

interface createCourseProps {
  title: string;
  description: string;
  language: string;
  category?: string | null;
  coverImage?: string | null;
  authors?: string[];
  sources?: SourcePrimitive[];
  aiAssisted?: boolean;
  courseRepository: CourseRepository;
}

export async function createCourse({
  title,
  description,
  language,
  category,
  coverImage,
  authors,
  sources,
  aiAssisted,
  courseRepository,
}: createCourseProps): Promise<Course> {
  const course = Course.create(randomUUID(), title, description, language, {
    category: category ?? null,
    coverImage: coverImage ?? null,
    authors,
    sources,
    aiAssisted,
  });

  return await courseRepository.save(course);
}
