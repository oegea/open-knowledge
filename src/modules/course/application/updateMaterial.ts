import { Course } from '../domain/Course';
import { CourseRepository } from '../domain/CourseRepository';
import { Material, MaterialType } from '../domain/Material';
import { Exam, ExamPrimitive } from '../domain/Exam';
import { SourcePrimitive } from '../domain/Source';

interface updateMaterialProps {
  courseId: string;
  sectionId: string;
  materialId: string;
  title: string;
  type: MaterialType;
  markdown?: string;
  mediaPath?: string | null;
  exam?: ExamPrimitive | null;
  required?: boolean;
  sources?: SourcePrimitive[];
  courseRepository: CourseRepository;
}

export async function updateMaterial({
  courseId,
  sectionId,
  materialId,
  title,
  type,
  markdown,
  mediaPath,
  exam,
  required,
  sources,
  courseRepository,
}: updateMaterialProps): Promise<Course> {
  if (!courseId) {
    throw new Error('[updateMaterial] Course id must be provided');
  }

  const course = await courseRepository.findById(courseId);
  if (course === null) {
    throw new Error(`[updateMaterial] Course with id ${courseId} not found`);
  }

  const section = course.getSections().getSectionById(sectionId);
  if (section === null) {
    throw new Error(`[updateMaterial] Section with id ${sectionId} not found`);
  }

  const existing = section.getMaterials().getMaterialById(materialId);
  if (existing === null) {
    throw new Error(`[updateMaterial] Material with id ${materialId} not found`);
  }

  const material = Material.create(
    materialId,
    title,
    type,
    markdown ?? '',
    mediaPath ?? null,
    exam ? Exam.fromPrimitive(exam) : null,
    required ?? existing.isRequired(),
    sources ?? existing.getSources().map((source) => source.toPrimitive())
  );

  const updatedSection = section.setMaterials(section.getMaterials().updateMaterial(material));
  const updated = course.setSections(course.getSections().updateSection(updatedSection));

  return await courseRepository.save(updated);
}
