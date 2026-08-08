import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';

interface moveMaterialProps {
  courseId: string;
  sectionId: string;
  materialId: string;
  newIndex: number;
  courseRepository: CourseRepository;
}

export async function moveMaterial({
  courseId,
  sectionId,
  materialId,
  newIndex,
  courseRepository,
}: moveMaterialProps): Promise<Course> {
  if (!courseId) {
    throw new Error('[moveMaterial] Course id must be provided');
  }
  if (typeof newIndex !== 'number' || newIndex < 0 || !Number.isInteger(newIndex)) {
    throw new Error('[moveMaterial] newIndex must be a non-negative integer');
  }

  const course = await courseRepository.findById(courseId);
  if (course === null) {
    throw new Error(`[moveMaterial] Course with id ${courseId} not found`);
  }

  const section = course.getSections().getSectionById(sectionId);
  if (section === null) {
    throw new Error(`[moveMaterial] Section with id ${sectionId} not found`);
  }

  const updatedSection = section.setMaterials(
    section.getMaterials().moveMaterial(materialId, newIndex)
  );
  const updated = course.setSections(course.getSections().updateSection(updatedSection));

  return await courseRepository.save(updated);
}
