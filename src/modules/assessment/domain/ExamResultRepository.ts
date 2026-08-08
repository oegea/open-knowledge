import { ExamResult } from './ExamResult';

export interface ExamResultRepository {
  save(result: ExamResult): Promise<ExamResult>;
  findByUserAndCourse(userId: string, courseId: string): Promise<ExamResult[]>;
  /** Whether the user has ever passed the exam of the given material. */
  hasPassed(userId: string, courseId: string, materialId: string): Promise<boolean>;
}
