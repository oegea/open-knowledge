import type { Database } from 'better-sqlite3';
import { Course, CoursePrimitive } from '../domain/Course';
import { CourseList } from '../domain/CourseList';
import { CourseFilter, CourseRepository } from '../domain/CourseRepository';
import { SectionPrimitive } from '../domain/Section';
import { MaterialPrimitive, MaterialType } from '../domain/Material';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  category: string | null;
  cover_image: string | null;
  authors: string;
  sources: string;
  license: string | null;
  ai_assisted: number;
  published: number;
  created_at: string;
  updated_at: string;
}

interface SectionRow {
  id: string;
  course_id: string;
  title: string;
  position: number;
}

interface MaterialRow {
  id: string;
  section_id: string;
  title: string;
  type: string;
  markdown: string;
  media_path: string | null;
  exam: string | null;
  required: number;
  sources: string;
  position: number;
}

export class SqliteCourseRepository implements CourseRepository {
  private readonly db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  async save(course: Course): Promise<Course> {
    const data = course.toPrimitive();
    if (!data.id) {
      throw new Error('[SqliteCourseRepository] cannot save a course without id');
    }

    const saveTransaction = this.db.transaction((primitive: CoursePrimitive) => {
      this.db
        .prepare(
          `INSERT INTO courses (id, title, slug, description, language, category, cover_image, authors, sources, license, ai_assisted, published, created_at, updated_at)
           VALUES (@id, @title, @slug, @description, @language, @category, @coverImage, @authors, @sources, @license, @aiAssisted, @published, @createdAt, @updatedAt)
           ON CONFLICT(id) DO UPDATE SET
             title = @title,
             slug = @slug,
             description = @description,
             language = @language,
             category = @category,
             cover_image = @coverImage,
             authors = @authors,
             sources = @sources,
             license = @license,
             ai_assisted = @aiAssisted,
             published = @published,
             updated_at = @updatedAt`
        )
        .run({
          id: primitive.id,
          title: primitive.title,
          slug: primitive.slug,
          description: primitive.description,
          language: primitive.language,
          category: primitive.category,
          coverImage: primitive.coverImage,
          authors: JSON.stringify(primitive.authors),
          sources: JSON.stringify(primitive.sources),
          license: primitive.license,
          aiAssisted: primitive.aiAssisted ? 1 : 0,
          published: primitive.published ? 1 : 0,
          createdAt: primitive.createdAt,
          updatedAt: primitive.updatedAt,
        });

      // Sections and materials are replaced wholesale: the aggregate is the
      // source of truth for structure and ordering.
      this.db.prepare('DELETE FROM sections WHERE course_id = ?').run(primitive.id);

      const insertSection = this.db.prepare(
        'INSERT INTO sections (id, course_id, title, position) VALUES (?, ?, ?, ?)'
      );
      const insertMaterial = this.db.prepare(
        `INSERT INTO materials (id, section_id, title, type, markdown, media_path, exam, required, sources, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      primitive.sections.forEach((section, sectionIndex) => {
        insertSection.run(section.id, primitive.id, section.title, sectionIndex);
        section.materials.forEach((material, materialIndex) => {
          insertMaterial.run(
            material.id,
            section.id,
            material.title,
            material.type,
            material.markdown,
            material.mediaPath,
            material.exam ? JSON.stringify(material.exam) : null,
            material.required ? 1 : 0,
            JSON.stringify(material.sources),
            materialIndex
          );
        });
      });
    });

    saveTransaction(data);
    return course;
  }

  async findById(id: string): Promise<Course | null> {
    const courseRow = this.db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as
      | CourseRow
      | undefined;
    if (!courseRow) return null;

    const sectionRows = this.db
      .prepare('SELECT * FROM sections WHERE course_id = ? ORDER BY position')
      .all(id) as SectionRow[];

    const sections: SectionPrimitive[] = sectionRows.map((sectionRow) => {
      const materialRows = this.db
        .prepare('SELECT * FROM materials WHERE section_id = ? ORDER BY position')
        .all(sectionRow.id) as MaterialRow[];

      return {
        id: sectionRow.id,
        title: sectionRow.title,
        materials: materialRows.map((materialRow) => this.mapMaterialRow(materialRow)),
      };
    });

    return Course.fromPrimitive(this.mapCourseRow(courseRow, sections));
  }

  async findBySlug(slug: string): Promise<Course | null> {
    const row = this.db.prepare('SELECT id FROM courses WHERE slug = ?').get(slug) as
      | { id: string }
      | undefined;
    return row ? await this.findById(row.id) : null;
  }

  async findAll(filter?: CourseFilter): Promise<CourseList> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter?.publishedOnly) {
      conditions.push('published = 1');
    }
    if (filter?.language) {
      conditions.push('language = ?');
      params.push(filter.language);
    }
    if (filter?.category) {
      conditions.push('category = ?');
      params.push(filter.category);
    }
    if (filter?.query?.trim()) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      const like = `%${filter.query.trim()}%`;
      params.push(like, like);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = this.db
      .prepare(`SELECT * FROM courses ${where} ORDER BY created_at DESC`)
      .all(...params) as CourseRow[];

    return CourseList.create(rows.map((row) => Course.fromPrimitive(this.mapCourseRow(row, []))));
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM courses WHERE id = ?').run(id);
    return result.changes > 0;
  }

  async reassignCategory(from: string, to: string): Promise<number> {
    const result = this.db
      .prepare('UPDATE courses SET category = @to, updated_at = @now WHERE category = @from')
      .run({ from, to, now: new Date().toISOString() });
    return result.changes;
  }

  private mapCourseRow(row: CourseRow, sections: SectionPrimitive[]): CoursePrimitive {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug ?? '',
      description: row.description,
      language: row.language,
      category: row.category,
      coverImage: row.cover_image,
      authors: JSON.parse(row.authors),
      sources: JSON.parse(row.sources),
      license: row.license,
      aiAssisted: row.ai_assisted === 1,
      published: row.published === 1,
      sections,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapMaterialRow(row: MaterialRow): MaterialPrimitive {
    return {
      id: row.id,
      title: row.title,
      type: row.type as MaterialType,
      markdown: row.markdown,
      mediaPath: row.media_path,
      exam: row.exam ? JSON.parse(row.exam) : null,
      required: row.required === 1,
      sources: JSON.parse(row.sources),
    };
  }
}
