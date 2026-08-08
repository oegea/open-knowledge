export class CourseTitle {
  private constructor(private readonly value: string) {}

  static create(title: string): CourseTitle {
    CourseTitle.ensureTitleIsValid(title);
    return new CourseTitle(title.trim());
  }

  static fromPrimitive(title: string): CourseTitle {
    return CourseTitle.create(title);
  }

  static ensureTitleIsValid(title: string): void {
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('[CourseTitle] title cannot be empty');
    }
    if (title.trim().length > 200) {
      throw new Error('[CourseTitle] title cannot exceed 200 characters');
    }
  }

  getValue(): string {
    return this.value;
  }

  toPrimitive(): string {
    return this.value;
  }

  equals(other: CourseTitle): boolean {
    return this.value === other.value;
  }
}
