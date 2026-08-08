export interface ExamResultPrimitive {
  id: string | null;
  userId: string;
  courseId: string;
  materialId: string;
  correctCount: number;
  totalCount: number;
  score: number;
  passed: boolean;
  createdAt: string;
}

export class ExamResult {
  private constructor(
    private readonly id: string | null,
    private readonly userId: string,
    private readonly courseId: string,
    private readonly materialId: string,
    private readonly correctCount: number,
    private readonly totalCount: number,
    private readonly score: number,
    private readonly passed: boolean,
    private readonly createdAt: Date
  ) {}

  static create(
    id: string | null,
    userId: string,
    courseId: string,
    materialId: string,
    correctCount: number,
    totalCount: number,
    passed: boolean,
    createdAt?: Date
  ): ExamResult {
    ExamResult.ensureResultIsValid(userId, courseId, materialId, correctCount, totalCount);
    return new ExamResult(
      id,
      userId,
      courseId,
      materialId,
      correctCount,
      totalCount,
      totalCount === 0 ? 0 : correctCount / totalCount,
      passed,
      createdAt ?? new Date()
    );
  }

  static fromPrimitive(data: ExamResultPrimitive): ExamResult {
    if (!data) throw new Error('[ExamResult] data must be provided');
    return ExamResult.create(
      data.id,
      data.userId,
      data.courseId,
      data.materialId,
      data.correctCount,
      data.totalCount,
      Boolean(data.passed),
      data.createdAt ? new Date(data.createdAt) : undefined
    );
  }

  static ensureResultIsValid(
    userId: string,
    courseId: string,
    materialId: string,
    correctCount: number,
    totalCount: number
  ): void {
    if (!userId) throw new Error('[ExamResult] userId must be provided');
    if (!courseId) throw new Error('[ExamResult] courseId must be provided');
    if (!materialId) throw new Error('[ExamResult] materialId must be provided');
    if (!Number.isInteger(correctCount) || correctCount < 0) {
      throw new Error('[ExamResult] correctCount must be a non-negative integer');
    }
    if (!Number.isInteger(totalCount) || totalCount < 1) {
      throw new Error('[ExamResult] totalCount must be a positive integer');
    }
    if (correctCount > totalCount) {
      throw new Error('[ExamResult] correctCount cannot exceed totalCount');
    }
  }

  getId(): string | null {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getCourseId(): string {
    return this.courseId;
  }

  getMaterialId(): string {
    return this.materialId;
  }

  getCorrectCount(): number {
    return this.correctCount;
  }

  getTotalCount(): number {
    return this.totalCount;
  }

  getScore(): number {
    return this.score;
  }

  isPassed(): boolean {
    return this.passed;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  equals(other: ExamResult): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): ExamResultPrimitive {
    return {
      id: this.id,
      userId: this.userId,
      courseId: this.courseId,
      materialId: this.materialId,
      correctCount: this.correctCount,
      totalCount: this.totalCount,
      score: this.score,
      passed: this.passed,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
