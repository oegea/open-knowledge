import { Course, CourseDetailsInput } from './Course';
import { MaterialInput } from './Material';

/**
 * Administration operations over courses, as exposed to the frontend.
 * The HTTP implementation talks to the instance API; every mutation returns
 * the updated course aggregate.
 */
export interface CourseAdminRepository {
  createCourse(details: CourseDetailsInput): Promise<Course>;
  updateCourseDetails(id: string, details: CourseDetailsInput): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  publishCourse(id: string): Promise<Course>;
  unpublishCourse(id: string): Promise<Course>;
  addSection(courseId: string, title: string): Promise<Course>;
  updateSectionTitle(courseId: string, sectionId: string, title: string): Promise<Course>;
  removeSection(courseId: string, sectionId: string): Promise<Course>;
  moveSection(courseId: string, sectionId: string, newIndex: number): Promise<Course>;
  addMaterial(courseId: string, sectionId: string, material: MaterialInput): Promise<Course>;
  updateMaterial(
    courseId: string,
    sectionId: string,
    materialId: string,
    material: MaterialInput
  ): Promise<Course>;
  removeMaterial(courseId: string, sectionId: string, materialId: string): Promise<Course>;
  moveMaterial(
    courseId: string,
    sectionId: string,
    materialId: string,
    newIndex: number
  ): Promise<Course>;
  uploadMedia(kind: string, file: File): Promise<string>;
}
