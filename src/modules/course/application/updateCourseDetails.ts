import { Course } from '../domain/Course';
import { ensureUniqueSlug, slugify } from '../../shared/domain/slugify';
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
  license: string | null;
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
  license,
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

  let updated = course.setDetails({
    title,
    description,
    language,
    category,
    coverImage,
    authors,
    sources,
    license,
    aiAssisted,
  });

  // The slug follows the title. Old links by id keep resolving and get
  // redirected to the canonical slug URL.
  if (updated.getTitle() !== course.getTitle() || !updated.getSlug()) {
    const slug = await ensureUniqueSlug(slugify(title, 'course'), async (candidate) => {
      const existing = await courseRepository.findBySlug(candidate);
      return existing !== null && existing.getId() !== id;
    });
    updated = updated.withSlug(slug);
  }

  return await courseRepository.save(updated);
}
