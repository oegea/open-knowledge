export class CourseDescription {
  private constructor(private readonly value: string) {}

  static create(description: string): CourseDescription {
    CourseDescription.ensureDescriptionIsValid(description);
    return new CourseDescription(description.trim());
  }

  static fromPrimitive(description: string): CourseDescription {
    return CourseDescription.create(description);
  }

  static ensureDescriptionIsValid(description: string): void {
    if (typeof description !== 'string' || description.trim() === '') {
      throw new Error('[CourseDescription] description cannot be empty');
    }
    if (description.trim().length > 5000) {
      throw new Error('[CourseDescription] description cannot exceed 5000 characters');
    }
  }

  getValue(): string {
    return this.value;
  }

  toPrimitive(): string {
    return this.value;
  }

  equals(other: CourseDescription): boolean {
    return this.value === other.value;
  }
}
