import { Course } from './Course';
import { CourseList } from './CourseList';

export interface CourseFilter {
  publishedOnly?: boolean;
  language?: string;
  category?: string;
}

export interface CourseRepository {
  /** Persists the full course aggregate (course, sections, materials). */
  save(course: Course): Promise<Course>;
  /** Loads the full aggregate. */
  findById(id: string): Promise<Course | null>;
  /** Loads course summaries (sections not populated) matching the filter. */
  findAll(filter?: CourseFilter): Promise<CourseList>;
  delete(id: string): Promise<boolean>;
}
