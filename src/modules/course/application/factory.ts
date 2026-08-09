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
import { StaticCourseRepository } from '../infrastructure/StaticCourseRepository';
import { isStaticMode } from '../../shared/infrastructure/StaticContentClient';

const courseRepository = (): CourseRepository =>
  isStaticMode() ? new StaticCourseRepository() : new SqliteCourseRepository();
import notificationFactory from '../../notification/application/factory';
import { CourseFilter, CourseRepository } from '../domain/CourseRepository';
import { CourseDetailsInput } from '../domain/Course';
import { MaterialInput } from '../domain/Material';

export default {
  createDefaultWelcomeCourse: async () =>
    await createDefaultWelcomeCourse({ courseRepository: courseRepository() }),

  createCourse: async (details: CourseDetailsInput) =>
    await createCourse({ ...details, courseRepository: courseRepository() }),

  getCourse: async (id: string) =>
    await getCourse({ id, courseRepository: courseRepository() }),

  listCourses: async (filter?: CourseFilter) =>
    await listCourses({ filter, courseRepository: courseRepository() }),

  updateCourseDetails: async (id: string, details: CourseDetailsInput) =>
    await updateCourseDetails({ id, ...details, courseRepository: courseRepository() }),

  deleteCourse: async (id: string) =>
    await deleteCourse({ id, courseRepository: courseRepository() }),

  publishCourse: async (id: string) =>
    await publishCourse({
      id,
      courseRepository: courseRepository(),
      onCoursePublished: async (course) => {
        await notificationFactory.publishNotification(
          'course_published',
          course.getTitle(),
          course.getId()
        );
      },
    }),

  unpublishCourse: async (id: string) =>
    await unpublishCourse({ id, courseRepository: courseRepository() }),

  addSection: async (courseId: string, title: string) =>
    await addSection({ courseId, title, courseRepository: courseRepository() }),

  updateSectionTitle: async (courseId: string, sectionId: string, title: string) =>
    await updateSectionTitle({
      courseId,
      sectionId,
      title,
      courseRepository: courseRepository(),
    }),

  removeSection: async (courseId: string, sectionId: string) =>
    await removeSection({ courseId, sectionId, courseRepository: courseRepository() }),

  moveSection: async (courseId: string, sectionId: string, newIndex: number) =>
    await moveSection({
      courseId,
      sectionId,
      newIndex,
      courseRepository: courseRepository(),
    }),

  addMaterial: async (courseId: string, sectionId: string, material: MaterialInput) =>
    await addMaterial({
      courseId,
      sectionId,
      ...material,
      courseRepository: courseRepository(),
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
      courseRepository: courseRepository(),
    }),

  removeMaterial: async (courseId: string, sectionId: string, materialId: string) =>
    await removeMaterial({
      courseId,
      sectionId,
      materialId,
      courseRepository: courseRepository(),
    }),

  moveMaterial: async (courseId: string, sectionId: string, materialId: string, newIndex: number) =>
    await moveMaterial({
      courseId,
      sectionId,
      materialId,
      newIndex,
      courseRepository: courseRepository(),
    }),
};
