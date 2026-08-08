import { gradeExam } from '../../application/gradeExam';
import * as CourseMother from '../../../course/test/helpers/CourseMother';
import * as SectionMother from '../../../course/test/helpers/SectionMother';
import * as MaterialMother from '../../../course/test/helpers/MaterialMother';
import * as ExamMother from '../../../course/test/helpers/ExamMother';
import * as CourseRepositoryMother from '../../../course/test/helpers/CourseRepositoryMother';
import * as ExamResultRepositoryMother from '../helpers/ExamResultRepositoryMother';

function courseWithExam() {
  return CourseMother.create({
    published: true,
    sections: [
      SectionMother.createPrimitive({
        materials: [
          MaterialMother.createPrimitive({
            id: 'exam-1',
            type: 'exam',
            markdown: '',
            exam: ExamMother.createPrimitive({
              questions: [
                {
                  id: 'q1',
                  text: 'Q1?',
                  choices: [
                    { id: 'a', text: 'A' },
                    { id: 'b', text: 'B' },
                  ],
                  correctChoiceId: 'b',
                  explanation: '',
                },
                {
                  id: 'q2',
                  text: 'Q2?',
                  choices: [
                    { id: 'a', text: 'A' },
                    { id: 'b', text: 'B' },
                  ],
                  correctChoiceId: 'a',
                  explanation: '',
                },
              ],
              passingScore: 0.5,
            }),
          }),
        ],
      }),
    ],
  });
}

describe('gradeExam (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Behaviour', () => {
    it('grades answers against the exam definition and records the result', async () => {
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(courseWithExam()),
      });
      const examResultRepository = ExamResultRepositoryMother.create();

      const result = await gradeExam({
        userId: 'user-1',
        courseId: 'course-1',
        materialId: 'exam-1',
        answers: { q1: 'b', q2: 'b' },
        courseRepository,
        examResultRepository,
      });

      expect(result.getCorrectCount()).toBe(1);
      expect(result.getTotalCount()).toBe(2);
      expect(result.getScore()).toBe(0.5);
      expect(result.isPassed()).toBe(true);
      expect(examResultRepository.save).toHaveBeenCalledWith(result);
    });

    it('fails the attempt below the passing score', async () => {
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(courseWithExam()),
      });

      const result = await gradeExam({
        userId: 'user-1',
        courseId: 'course-1',
        materialId: 'exam-1',
        answers: { q1: 'a', q2: 'b' },
        courseRepository,
        examResultRepository: ExamResultRepositoryMother.create(),
      });

      expect(result.getCorrectCount()).toBe(0);
      expect(result.isPassed()).toBe(false);
    });

    it('rejects incomplete attempts', async () => {
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(courseWithExam()),
      });

      await expect(
        gradeExam({
          userId: 'user-1',
          courseId: 'course-1',
          materialId: 'exam-1',
          answers: { q1: 'b' },
          courseRepository,
          examResultRepository: ExamResultRepositoryMother.create(),
        })
      ).rejects.toThrow('[gradeExam] The attempt must answer exactly 2 questions');
    });

    it('grades a random sample against the pool when questionCount is set', async () => {
      const course = CourseMother.create({
        published: true,
        sections: [
          SectionMother.createPrimitive({
            materials: [
              MaterialMother.createPrimitive({
                id: 'exam-1',
                type: 'exam',
                markdown: '',
                exam: ExamMother.createPrimitive({
                  questions: [
                    {
                      id: 'q1',
                      text: 'Q1?',
                      choices: [
                        { id: 'a', text: 'A' },
                        { id: 'b', text: 'B' },
                      ],
                      correctChoiceId: 'b',
                      explanation: '',
                    },
                    {
                      id: 'q2',
                      text: 'Q2?',
                      choices: [
                        { id: 'a', text: 'A' },
                        { id: 'b', text: 'B' },
                      ],
                      correctChoiceId: 'a',
                      explanation: '',
                    },
                    {
                      id: 'q3',
                      text: 'Q3?',
                      choices: [
                        { id: 'a', text: 'A' },
                        { id: 'b', text: 'B' },
                      ],
                      correctChoiceId: 'a',
                      explanation: '',
                    },
                  ],
                  passingScore: 0.5,
                  questionCount: 2,
                }),
              }),
            ],
          }),
        ],
      });
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(course),
      });

      // The attempt answers only the 2 sampled questions.
      const result = await gradeExam({
        userId: 'user-1',
        courseId: 'course-1',
        materialId: 'exam-1',
        answers: { q1: 'b', q3: 'a' },
        courseRepository,
        examResultRepository: ExamResultRepositoryMother.create(),
      });

      expect(result.getTotalCount()).toBe(2);
      expect(result.getCorrectCount()).toBe(2);
      expect(result.isPassed()).toBe(true);
    });

    it('rejects answers for questions outside the exam', async () => {
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(courseWithExam()),
      });

      await expect(
        gradeExam({
          userId: 'user-1',
          courseId: 'course-1',
          materialId: 'exam-1',
          answers: { q1: 'b', intruder: 'a' },
          courseRepository,
          examResultRepository: ExamResultRepositoryMother.create(),
        })
      ).rejects.toThrow('[gradeExam] Question intruder does not belong to this exam');
    });
  });

  describe('Error Scenarios', () => {
    it('rejects unpublished courses', async () => {
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(CourseMother.create({ published: false })),
      });

      await expect(
        gradeExam({
          userId: 'user-1',
          courseId: 'course-1',
          materialId: 'exam-1',
          answers: {},
          courseRepository,
          examResultRepository: ExamResultRepositoryMother.create(),
        })
      ).rejects.toThrow('[gradeExam] Course with id course-1 not found');
    });

    it('rejects a material that is not an exam', async () => {
      const courseRepository = CourseRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(CourseMother.create({ published: true })),
      });

      await expect(
        gradeExam({
          userId: 'user-1',
          courseId: 'course-1',
          materialId: 'material-1',
          answers: {},
          courseRepository,
          examResultRepository: ExamResultRepositoryMother.create(),
        })
      ).rejects.toThrow('[gradeExam] Exam material with id material-1 not found');
    });
  });
});
