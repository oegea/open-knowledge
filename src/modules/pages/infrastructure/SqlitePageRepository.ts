import type { Database } from 'better-sqlite3';
import { Page, PagePlacement } from '../domain/Page';
import { PageRepository } from '../domain/PageRepository';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';

interface PageRow {
  id: string;
  title: string;
  slug: string;
  markdown: string;
  placement: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export class SqlitePageRepository implements PageRepository {
  private readonly db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  async save(page: Page): Promise<Page> {
    const data = page.toPrimitive();
    if (!data.id) {
      throw new Error('[SqlitePageRepository] cannot save a page without id');
    }

    this.db
      .prepare(
        `INSERT INTO pages (id, title, slug, markdown, placement, position, created_at, updated_at)
         VALUES (@id, @title, @slug, @markdown, @placement, @position, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           title = @title,
           slug = @slug,
           markdown = @markdown,
           placement = @placement,
           position = @position,
           updated_at = @updatedAt`
      )
      .run({
        id: data.id,
        title: data.title,
        slug: data.slug,
        markdown: data.markdown,
        placement: data.placement,
        position: data.position,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });

    return page;
  }

  async findById(id: string): Promise<Page | null> {
    const row = this.db.prepare('SELECT * FROM pages WHERE id = ?').get(id) as PageRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findBySlug(slug: string): Promise<Page | null> {
    const row = this.db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug) as
      | PageRow
      | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findAll(): Promise<Page[]> {
    const rows = this.db
      .prepare('SELECT * FROM pages ORDER BY position, created_at')
      .all() as PageRow[];
    return rows.map((row) => this.mapRow(row));
  }

  async findByPlacement(placement: PagePlacement): Promise<Page[]> {
    const rows = this.db
      .prepare('SELECT * FROM pages WHERE placement = ? ORDER BY position, created_at')
      .all(placement) as PageRow[];
    return rows.map((row) => this.mapRow(row));
  }

  async delete(id: string): Promise<boolean> {
    return this.db.prepare('DELETE FROM pages WHERE id = ?').run(id).changes > 0;
  }

  async count(): Promise<number> {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM pages').get() as { count: number };
    return row.count;
  }

  private mapRow(row: PageRow): Page {
    return Page.fromPrimitive({
      id: row.id,
      title: row.title,
      slug: row.slug ?? '',
      markdown: row.markdown,
      placement: row.placement as PagePlacement,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
