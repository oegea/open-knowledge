import { Exam, ExamPrimitive } from '../../domain/Exam';

export function createPrimitive(overrides: Partial<ExamPrimitive> = {}): ExamPrimitive {
  return {
    questions: [
      {
        id: 'q1',
        text: 'Which planet is closest to the Sun?',
        choices: [
          { id: 'a', text: 'Venus' },
          { id: 'b', text: 'Mercury' },
          { id: 'c', text: 'Mars' },
        ],
        correctChoiceId: 'b',
        explanation: 'Mercury orbits at ~0.39 AU, closer than any other planet.',
      },
    ],
    passingScore: 0.7,
    ...overrides,
  };
}

export function create(overrides: Partial<ExamPrimitive> = {}): Exam {
  return Exam.fromPrimitive(createPrimitive(overrides));
}
