export interface CourseProgressPrimitive {
  courseId: string;
  completedMaterialIds: string[];
  lastMaterialId: string | null;
}

export class CourseProgress {
  private constructor(
    private readonly courseId: string,
    private readonly completedMaterialIds: string[],
    private readonly lastMaterialId: string | null
  ) {}

  static create(
    courseId: string,
    completedMaterialIds: string[] = [],
    lastMaterialId: string | null = null
  ): CourseProgress {
    CourseProgress.ensureProgressIsValid(courseId);
    return new CourseProgress(courseId, [...new Set(completedMaterialIds)], lastMaterialId);
  }

  static fromPrimitive(data: CourseProgressPrimitive): CourseProgress {
    if (!data) throw new Error('[CourseProgress] data must be provided');
    return CourseProgress.create(data.courseId, data.completedMaterialIds ?? [], data.lastMaterialId ?? null);
  }

  static ensureProgressIsValid(courseId: string): void {
    if (!courseId || typeof courseId !== 'string') {
      throw new Error('[CourseProgress] courseId must be a non-empty string');
    }
  }

  getCourseId(): string {
    return this.courseId;
  }

  getCompletedMaterialIds(): string[] {
    return [...this.completedMaterialIds];
  }

  getLastMaterialId(): string | null {
    return this.lastMaterialId;
  }

  isMaterialCompleted(materialId: string): boolean {
    return this.completedMaterialIds.includes(materialId);
  }

  markCompleted(materialId: string): CourseProgress {
    if (this.isMaterialCompleted(materialId)) return this;
    return CourseProgress.create(
      this.courseId,
      [...this.completedMaterialIds, materialId],
      this.lastMaterialId
    );
  }

  withLastMaterial(materialId: string): CourseProgress {
    return CourseProgress.create(this.courseId, this.completedMaterialIds, materialId);
  }

  /**
   * Percentage (0..1) of the given ordered material ids that are completed.
   */
  completionRatio(materialIds: string[]): number {
    if (materialIds.length === 0) return 0;
    const completed = materialIds.filter((id) => this.isMaterialCompleted(id)).length;
    return completed / materialIds.length;
  }

  /**
   * First material in pedagogical order that is not yet completed; falls back
   * to the last visited material, then the first one.
   */
  nextPendingMaterialId(orderedMaterialIds: string[]): string | null {
    if (orderedMaterialIds.length === 0) return null;
    const pending = orderedMaterialIds.find((id) => !this.isMaterialCompleted(id));
    if (pending) return pending;
    return this.lastMaterialId ?? orderedMaterialIds[0];
  }

  equals(other: CourseProgress): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }

  toPrimitive(): CourseProgressPrimitive {
    return {
      courseId: this.courseId,
      completedMaterialIds: [...this.completedMaterialIds],
      lastMaterialId: this.lastMaterialId,
    };
  }
}
