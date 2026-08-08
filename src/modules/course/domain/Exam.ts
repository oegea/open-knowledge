import { ExamQuestion, ExamQuestionPrimitive } from './ExamQuestion';

export interface ExamPrimitive {
  questions: ExamQuestionPrimitive[];
  passingScore: number;
}

export class Exam {
  private constructor(
    private readonly questions: ExamQuestion[],
    private readonly passingScore: number
  ) {}

  static create(questions: ExamQuestion[], passingScore: number): Exam {
    Exam.ensureExamIsValid(questions, passingScore);
    return new Exam(questions, passingScore);
  }

  static fromPrimitive(data: ExamPrimitive): Exam {
    if (!data) throw new Error('[Exam] data must be provided');
    const questions = (data.questions ?? []).map((question) => ExamQuestion.fromPrimitive(question));
    return Exam.create(questions, data.passingScore);
  }

  static ensureExamIsValid(questions: ExamQuestion[], passingScore: number): void {
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
  }

  getQuestions(): ExamQuestion[] {
    return [...this.questions];
  }

  getPassingScore(): number {
    return this.passingScore;
  }

  count(): number {
    return this.questions.length;
  }

  toPrimitive(): ExamPrimitive {
    return {
      questions: this.questions.map((question) => question.toPrimitive()),
      passingScore: this.passingScore,
    };
  }

  equals(other: Exam): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }
}
