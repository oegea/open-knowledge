import { ExamQuestion, ExamQuestionPrimitive } from './ExamQuestion';

export interface ExamPrimitive {
  questions: ExamQuestionPrimitive[];
  passingScore: number;
  /**
   * Questions presented per attempt, randomly drawn from the pool.
   * Null means every question is asked.
   */
  questionCount?: number | null;
}

export class Exam {
  private constructor(
    private readonly questions: ExamQuestion[],
    private readonly passingScore: number,
    private readonly questionCount: number | null
  ) {}

  static create(
    questions: ExamQuestion[],
    passingScore: number,
    questionCount: number | null = null
  ): Exam {
    Exam.ensureExamIsValid(questions, passingScore, questionCount);
    return new Exam(questions, passingScore, questionCount);
  }

  static fromPrimitive(data: ExamPrimitive): Exam {
    if (!data) throw new Error('[Exam] data must be provided');
    const questions = (data.questions ?? []).map((question) => ExamQuestion.fromPrimitive(question));
    return Exam.create(questions, data.passingScore, data.questionCount ?? null);
  }

  static ensureExamIsValid(
    questions: ExamQuestion[],
    passingScore: number,
    questionCount: number | null = null
  ): void {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('[Exam] an exam needs at least one question');
    }
    const questionIds = questions.map((question) => question.getId());
    if (new Set(questionIds).size !== questionIds.length) {
      throw new Error('[Exam] question ids must be unique');
    }
    if (typeof passingScore !== 'number' || passingScore < 0 || passingScore > 1) {
      throw new Error('[Exam] passingScore must be a number between 0 and 1');
    }
    if (questionCount !== null) {
      if (!Number.isInteger(questionCount) || questionCount < 1) {
        throw new Error('[Exam] questionCount must be a positive integer');
      }
      if (questionCount > questions.length) {
        throw new Error('[Exam] questionCount cannot exceed the question pool size');
      }
    }
  }

  getQuestions(): ExamQuestion[] {
    return [...this.questions];
  }

  getPassingScore(): number {
    return this.passingScore;
  }

  getQuestionCount(): number | null {
    return this.questionCount;
  }

  /** How many questions an attempt actually presents. */
  effectiveQuestionCount(): number {
    return this.questionCount ?? this.questions.length;
  }

  count(): number {
    return this.questions.length;
  }

  getQuestionById(id: string): ExamQuestion | null {
    return this.questions.find((question) => question.getId() === id) ?? null;
  }

  toPrimitive(): ExamPrimitive {
    return {
      questions: this.questions.map((question) => question.toPrimitive()),
      passingScore: this.passingScore,
      questionCount: this.questionCount,
    };
  }

  equals(other: Exam): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }
}
