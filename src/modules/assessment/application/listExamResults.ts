import { ExamResult } from '../domain/ExamResult';
import { ExamResultRepository } from '../domain/ExamResultRepository';

interface listExamResultsProps {
  userId: string;
  courseId: string;
  examResultRepository: ExamResultRepository;
}

export async function listExamResults({
  userId,
  courseId,
  examResultRepository,
}: listExamResultsProps): Promise<ExamResult[]> {
  if (!userId) {
    throw new Error('[listExamResults] User id must be provided');
  }
  if (!courseId) {
    throw new Error('[listExamResults] Course id must be provided');
  }

  return await examResultRepository.findByUserAndCourse(userId, courseId);
}
