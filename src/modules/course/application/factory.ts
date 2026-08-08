import { createCourse } from './createCourse';
import { createDefaultWelcomeCourse } from './createDefaultWelcomeCourse';
import { getCourse } from './getCourse';
import { listCourses } from './listCourses';
import { updateCourseDetails } from './updateCourseDetails';
import { deleteCourse } from './deleteCourse';
import { publishCourse } from './publishCourse';
import { unpublishCourse } from './unpublishCourse';
import { addSection } from './addSection';
import { updateSectionTitle } from './updateSectionTitle';
import { removeSection } from './removeSection';
import { moveSection } from './moveSection';
import { addMaterial } from './addMaterial';
import { updateMaterial } from './updateMaterial';
import { removeMaterial } from './removeMaterial';
import { moveMaterial } from './moveMaterial';
import { SqliteCourseRepository } from '../infrastructure/SqliteCourseRepository';
import notificationFactory from '../../notification/application/factory';
import { CourseFilter } from '../domain/CourseRepository';
import { CourseDetailsInput } from '../domain/Course';
import { MaterialInput } from '../domain/Material';

export default {
  createDefaultWelcomeCourse: async () =>
    await createDefaultWelcomeCourse({ courseRepository: new SqliteCourseRepository() }),

  createCourse: async (details: CourseDetailsInput) =>
    await createCourse({ ...details, courseRepository: new SqliteCourseRepository() }),

  getCourse: async (id: string) =>
    await getCourse({ id, courseRepository: new SqliteCourseRepository() }),

  listCourses: async (filter?: CourseFilter) =>
    await listCourses({ filter, courseRepository: new SqliteCourseRepository() }),

  updateCourseDetails: async (id: string, details: CourseDetailsInput) =>
    await updateCourseDetails({ id, ...details, courseRepository: new SqliteCourseRepository() }),

  deleteCourse: async (id: string) =>
    await deleteCourse({ id, courseRepository: new SqliteCourseRepository() }),

  publishCourse: async (id: string) =>
    await publishCourse({
      id,
      courseRepository: new SqliteCourseRepository(),
      onCoursePublished: async (course) => {
        await notificationFactory.publishNotification(
          'course_published',
          course.getTitle(),
          course.getId()
        );
      },
    }),

  unpublishCourse: async (id: string) =>
    await unpublishCourse({ id, courseRepository: new SqliteCourseRepository() }),

  addSection: async (courseId: string, title: string) =>
    await addSection({ courseId, title, courseRepository: new SqliteCourseRepository() }),

  updateSectionTitle: async (courseId: string, sectionId: string, title: string) =>
    await updateSectionTitle({
      courseId,
      sectionId,
      title,
      courseRepository: new SqliteCourseRepository(),
    }),

  removeSection: async (courseId: string, sectionId: string) =>
    await removeSection({ courseId, sectionId, courseRepository: new SqliteCourseRepository() }),

  moveSection: async (courseId: string, sectionId: string, newIndex: number) =>
    await moveSection({
      courseId,
      sectionId,
      newIndex,
      courseRepository: new SqliteCourseRepository(),
    }),

  addMaterial: async (courseId: string, sectionId: string, material: MaterialInput) =>
    await addMaterial({
      courseId,
      sectionId,
      ...material,
      courseRepository: new SqliteCourseRepository(),
    }),

  updateMaterial: async (
    courseId: string,
    sectionId: string,
    materialId: string,
    material: MaterialInput
  ) =>
    await updateMaterial({
      courseId,
      sectionId,
      materialId,
      ...material,
      courseRepository: new SqliteCourseRepository(),
    }),

  removeMaterial: async (courseId: string, sectionId: string, materialId: string) =>
    await removeMaterial({
      courseId,
      sectionId,
      materialId,
      courseRepository: new SqliteCourseRepository(),
    }),

  moveMaterial: async (courseId: string, sectionId: string, materialId: string, newIndex: number) =>
    await moveMaterial({
      courseId,
      sectionId,
      materialId,
      newIndex,
      courseRepository: new SqliteCourseRepository(),
    }),
};
