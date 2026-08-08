import { randomUUID } from 'crypto';
import { ExamResult } from '../domain/ExamResult';
import { ExamResultRepository } from '../domain/ExamResultRepository';
import { CourseRepository } from '../../course/domain/CourseRepository';

interface gradeExamProps {
  userId: string;
  courseId: string;
  materialId: string;
  /** questionId -> chosen choiceId */
  answers: Record<string, string>;
  courseRepository: CourseRepository;
  examResultRepository: ExamResultRepository;
}

/**
 * Grades an exam attempt server-side against the course definition and
 * records the result for the user's account.
 */
export async function gradeExam({
  userId,
  courseId,
  materialId,
  answers,
  courseRepository,
  examResultRepository,
}: gradeExamProps): Promise<ExamResult> {
  if (!userId) {
    throw new Error('[gradeExam] User id must be provided');
  }
  if (!answers || typeof answers !== 'object') {
    throw new Error('[gradeExam] Answers must be provided');
  }

  const course = await courseRepository.findById(courseId);
  if (course === null) {
    throw new Error(`[gradeExam] Course with id ${courseId} not found`);
  }
  if (!course.isPublished()) {
    throw new Error(`[gradeExam] Course with id ${courseId} not found`);
  }

  const material = course
    .getSections()
    .getSections()
    .flatMap((section) => section.getMaterials().getMaterials())
    .find((candidate) => candidate.getId() === materialId);

  if (!material || !material.isExam() || material.getExam() === null) {
    throw new Error(`[gradeExam] Exam material with id ${materialId} not found`);
  }

  const exam = material.getExam()!;
  // Attempts answer a sample of `questionCount` questions from the pool.
  const expectedCount = exam.effectiveQuestionCount();
  const answeredIds = Object.keys(answers);

  if (answeredIds.length !== expectedCount) {
    throw new Error(`[gradeExam] The attempt must answer exactly ${expectedCount} questions`);
  }
  for (const questionId of answeredIds) {
    if (exam.getQuestionById(questionId) === null) {
      throw new Error(`[gradeExam] Question ${questionId} does not belong to this exam`);
    }
  }

  const correctCount = answeredIds.filter((questionId) =>
    exam.getQuestionById(questionId)!.isCorrectChoice(answers[questionId])
  ).length;
  const passed = correctCount / expectedCount >= exam.getPassingScore();

  const result = ExamResult.create(
    randomUUID(),
    userId,
    courseId,
    materialId,
    correctCount,
    expectedCount,
    passed
  );

  return await examResultRepository.save(result);
}
