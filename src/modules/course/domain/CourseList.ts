import { Course, CoursePrimitive } from './Course';

export class CourseList {
  private readonly courses: Course[];

  static create(courses: Course[] | null): CourseList {
    return new CourseList(courses);
  }

  static fromPrimitive(courses: CoursePrimitive[] | null): CourseList {
    if (courses === null) return CourseList.create(null);
    return CourseList.create(courses.map((course) => Course.fromPrimitive(course)));
  }

  private constructor(courses: Course[] | null) {
    this.courses = courses === null ? [] : courses;
  }

  getCourses(): Course[] {
    return [...this.courses];
  }

  getCourseById(id: string): Course | null {
    return this.courses.find((course) => course.getId() === id) || null;
  }

  getCategories(): string[] {
    const categories = this.courses
      .map((course) => course.getCategory())
      .filter((category): category is string => category !== null);
    return [...new Set(categories)];
  }

  getCategoryCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const course of this.courses) {
      const category = course.getCategory();
      if (category === null) continue;
      counts[category] = (counts[category] ?? 0) + 1;
    }
    return counts;
  }

  isEmpty(): boolean {
    return this.courses.length === 0;
  }

  count(): number {
    return this.courses.length;
  }

  equals(other: CourseList): boolean {
    if (this.courses.length !== other.courses.length) return false;
    return this.courses.every((course, i) => course.equals(other.courses[i]));
  }

  toPrimitive(): CoursePrimitive[] {
    return this.courses.map((course) => course.toPrimitive());
  }
}
