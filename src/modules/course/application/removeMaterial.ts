import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';

interface removeMaterialProps {
  courseId: string;
  sectionId: string;
  materialId: string;
  courseRepository: CourseRepository;
}

export async function removeMaterial({
  courseId,
  sectionId,
  materialId,
  courseRepository,
}: removeMaterialProps): Promise<Course> {
  if (!courseId) {
    throw new Error('[removeMaterial] Course id must be provided');
  }

  const course = await courseRepository.findById(courseId);
  if (course === null) {
    throw new Error(`[removeMaterial] Course with id ${courseId} not found`);
  }

  const section = course.getSections().getSectionById(sectionId);
  if (section === null) {
    throw new Error(`[removeMaterial] Section with id ${sectionId} not found`);
  }

  const updatedSection = section.setMaterials(section.getMaterials().removeMaterial(materialId));
  const updated = course.setSections(course.getSections().updateSection(updatedSection));

  return await courseRepository.save(updated);
}
