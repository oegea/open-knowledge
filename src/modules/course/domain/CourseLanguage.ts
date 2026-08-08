import { LOCALE_CODES } from '@/i18n/config';

export class CourseLanguage {
  private constructor(private readonly value: string) {}

  static create(language: string): CourseLanguage {
    CourseLanguage.ensureLanguageIsValid(language);
    return new CourseLanguage(language);
  }

  static fromPrimitive(language: string): CourseLanguage {
    return CourseLanguage.create(language);
  }

  static ensureLanguageIsValid(language: string): void {
    if (!(LOCALE_CODES as readonly string[]).includes(language)) {
      throw new Error(`[CourseLanguage] "${language}" is not a supported language`);
    }
  }

  getValue(): string {
    return this.value;
  }

  toPrimitive(): string {
    return this.value;
  }

  equals(other: CourseLanguage): boolean {
    return this.value === other.value;
  }
}
