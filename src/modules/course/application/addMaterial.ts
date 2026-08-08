import { randomUUID } from 'crypto';
import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';
import { Material, MaterialType } from '../domain/Material';
import { Exam, ExamPrimitive } from '../domain/Exam';

interface addMaterialProps {
  courseId: string;
  sectionId: string;
  title: string;
  type: MaterialType;
  markdown?: string;
  mediaPath?: string | null;
  exam?: ExamPrimitive | null;
  required?: boolean;
  sources?: string[];
  courseRepository: CourseRepository;
}

export async function addMaterial({
  courseId,
  sectionId,
  title,
  type,
  markdown,
  mediaPath,
  exam,
  required,
  sources,
  courseRepository,
}: addMaterialProps): Promise<Course> {
  if (!courseId) {
    throw new Error('[addMaterial] Course id must be provided');
  }

  const course = await courseRepository.findById(courseId);
  if (course === null) {
    throw new Error(`[addMaterial] Course with id ${courseId} not found`);
  }

  const section = course.getSections().getSectionById(sectionId);
  if (section === null) {
    throw new Error(`[addMaterial] Section with id ${sectionId} not found`);
  }

  const material = Material.create(
    randomUUID(),
    title,
    type,
    markdown ?? '',
    mediaPath ?? null,
    exam ? Exam.fromPrimitive(exam) : null,
    required ?? true,
    sources ?? []
  );

  const updatedSection = section.setMaterials(section.getMaterials().addMaterial(material));
  const updated = course.setSections(course.getSections().updateSection(updatedSection));

  return await courseRepository.save(updated);
}
