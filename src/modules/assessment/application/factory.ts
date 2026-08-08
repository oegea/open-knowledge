import { gradeExam } from './gradeExam';
import { listExamResults } from './listExamResults';
import { SqliteExamResultRepository } from '../infrastructure/SqliteExamResultRepository';
import { SqliteCourseRepository } from '../../course/infrastructure/SqliteCourseRepository';

export default {
  gradeExam: async (
    userId: string,
    courseId: string,
    materialId: string,
    answers: Record<string, string>
  ) =>
    await gradeExam({
      userId,
      courseId,
      materialId,
      answers,
      courseRepository: new SqliteCourseRepository(),
      examResultRepository: new SqliteExamResultRepository(),
    }),

  listExamResults: async (userId: string, courseId: string) =>
    await listExamResults({
      userId,
      courseId,
      examResultRepository: new SqliteExamResultRepository(),
    }),
};
