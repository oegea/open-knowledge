import type { Database } from 'better-sqlite3';
import { NewsPost } from '../domain/NewsPost';
import { NewsRepository } from '../domain/NewsRepository';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';

interface NewsRow {
  id: string;
  title: string;
  slug: string;
  markdown: string;
  image_path: string | null;
  author: string;
  published: number;
  created_at: string;
  updated_at: string;
}

export class SqliteNewsRepository implements NewsRepository {
  private readonly db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  async save(post: NewsPost): Promise<NewsPost> {
    const data = post.toPrimitive();
    if (!data.id) {
      throw new Error('[SqliteNewsRepository] cannot save a post without id');
    }

    this.db
      .prepare(
        `INSERT INTO news_posts (id, title, slug, markdown, image_path, author, published, created_at, updated_at)
         VALUES (@id, @title, @slug, @markdown, @imagePath, @author, @published, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           title = @title,
           slug = @slug,
           markdown = @markdown,
           image_path = @imagePath,
           author = @author,
           published = @published,
           updated_at = @updatedAt`
      )
      .run({
        id: data.id,
        title: data.title,
        slug: data.slug,
        markdown: data.markdown,
        imagePath: data.imagePath,
        author: data.author,
        published: data.published ? 1 : 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });

    return post;
  }

  async findById(id: string): Promise<NewsPost | null> {
    const row = this.db.prepare('SELECT * FROM news_posts WHERE id = ?').get(id) as
      | NewsRow
      | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findBySlug(slug: string): Promise<NewsPost | null> {
    const row = this.db.prepare('SELECT * FROM news_posts WHERE slug = ?').get(slug) as
      | NewsRow
      | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findAll(publishedOnly: boolean): Promise<NewsPost[]> {
    const where = publishedOnly ? 'WHERE published = 1' : '';
    const rows = this.db
      .prepare(`SELECT * FROM news_posts ${where} ORDER BY created_at DESC`)
      .all() as NewsRow[];
    return rows.map((row) => this.mapRow(row));
  }

  async delete(id: string): Promise<boolean> {
    return this.db.prepare('DELETE FROM news_posts WHERE id = ?').run(id).changes > 0;
  }

  private mapRow(row: NewsRow): NewsPost {
    return NewsPost.fromPrimitive({
      id: row.id,
      title: row.title,
      slug: row.slug ?? '',
      markdown: row.markdown,
      imagePath: row.image_path,
      author: row.author ?? '',
      published: row.published === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
