import { Course, CoursePrimitive } from '../domain/Course';
import { CourseList } from '../domain/CourseList';
import { CourseFilter, CourseRepository } from '../domain/CourseRepository';
import {
  fetchContentJson,
  resolveContentUrl,
} from '../../shared/infrastructure/StaticContentClient';

/**
 * Read-only courses from the content repository (ADR 0013).
 * `courses/index.json` lists course file names in catalog order; each entry
 * is a full CoursePrimitive at `courses/<name>.json`.
 */
export class StaticCourseRepository implements CourseRepository {
  async save(): Promise<Course> {
    throw new Error('[StaticCourseRepository] static content mode is read-only');
  }

  async delete(): Promise<boolean> {
    throw new Error('[StaticCourseRepository] static content mode is read-only');
  }

  async findById(id: string): Promise<Course | null> {
    const courses = await this.loadAll();
    return courses.find((course) => course.getId() === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Course | null> {
    const courses = await this.loadAll();
    return courses.find((course) => course.getSlug() === slug) ?? null;
  }

  async findAll(filter?: CourseFilter): Promise<CourseList> {
    let courses = await this.loadAll();

    if (filter?.publishedOnly) courses = courses.filter((course) => course.isPublished());
    if (filter?.language) courses = courses.filter((c) => c.getLanguage() === filter.language);
    if (filter?.category) courses = courses.filter((c) => c.getCategory() === filter.category);
    if (filter?.query?.trim()) {
      const query = filter.query.trim().toLowerCase();
      courses = courses.filter(
        (course) =>
          course.getTitle().toLowerCase().includes(query) ||
          course.getDescription().toLowerCase().includes(query)
      );
    }

    return CourseList.create(courses);
  }

  private async loadAll(): Promise<Course[]> {
    const index = (await fetchContentJson<string[]>('courses/index.json')) ?? [];
    const loaded = await Promise.all(
      index.map(async (name) => {
        const file = name.endsWith('.json') ? name : `${name}.json`;
        const data = await fetchContentJson<CoursePrimitive>(`courses/${file}`);
        return data ? Course.fromPrimitive(this.resolveMedia(data)) : null;
      })
    );
    return loaded.filter((course): course is Course => course !== null);
  }

  private resolveMedia(data: CoursePrimitive): CoursePrimitive {
    return {
      ...data,
      coverImage: resolveContentUrl(data.coverImage),
      sections: (data.sections ?? []).map((section) => ({
        ...section,
        materials: (section.materials ?? []).map((material) => ({
          ...material,
          mediaPath: resolveContentUrl(material.mediaPath),
        })),
      })),
    };
  }
}
