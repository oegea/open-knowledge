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
  const questions = exam.getQuestions();
  const correctCount = questions.filter((question) =>
    question.isCorrectChoice(answers[question.getId()] ?? '')
  ).length;
  const passed = correctCount / questions.length >= exam.getPassingScore();

  const result = ExamResult.create(
    randomUUID(),
    userId,
    courseId,
    materialId,
    correctCount,
    questions.length,
    passed
  );

  return await examResultRepository.save(result);
}
