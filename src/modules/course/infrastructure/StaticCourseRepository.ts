import { Course, CoursePrimitive } from '../domain/Course';
import { CourseList } from '../domain/CourseList';
import { CourseFilter, CourseRepository } from '../domain/CourseRepository';
import { MaterialPrimitive } from '../domain/Material';
import {
  fetchContentJson,
  fetchContentText,
  resolveContentUrl,
} from '../../shared/infrastructure/StaticContentClient';

/**
 * Read-only courses from the content repository (ADR 0013).
 *
 * `courses/index.json` lists directory names in catalog order; each course
 * lives in `courses/<name>/course.json`. A material may keep its body in a
 * separate Markdown file via `markdownFile` (relative to the course
 * directory) — this loader inlines it before handing the primitive to the
 * domain, so `Course.fromPrimitive` never learns about the storage layout.
 */

type RawMaterial = MaterialPrimitive & { markdownFile?: string };
type RawCourse = Omit<CoursePrimitive, 'sections'> & {
  sections: { id: string; title: string; materials: RawMaterial[] }[];
};

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
    const loaded = await Promise.all(index.map((name) => this.loadCourse(name)));
    return loaded.filter((course): course is Course => course !== null);
  }

  private async loadCourse(directory: string): Promise<Course | null> {
    const raw = await fetchContentJson<RawCourse>(`courses/${directory}/course.json`);
    if (!raw) return null;

    const sections = await Promise.all(
      (raw.sections ?? []).map(async (section) => ({
        ...section,
        materials: await Promise.all(
          (section.materials ?? []).map((material) => this.resolveMaterial(directory, material))
        ),
      }))
    );

    return Course.fromPrimitive({
      ...raw,
      coverImage: resolveContentUrl(raw.coverImage),
      sections,
    });
  }

  private async resolveMaterial(
    directory: string,
    material: RawMaterial
  ): Promise<MaterialPrimitive> {
    const { markdownFile, ...primitive } = material;
    let markdown = primitive.markdown ?? '';
    if (markdownFile) {
      markdown = (await fetchContentText(`courses/${directory}/${markdownFile}`)) ?? '';
    }
    return {
      ...primitive,
      markdown,
      mediaPath: resolveContentUrl(primitive.mediaPath),
    };
  }
}
