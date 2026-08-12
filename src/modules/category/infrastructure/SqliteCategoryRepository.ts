import type { Database } from 'better-sqlite3';
import { Category } from '../domain/Category';
import { CategoryRepository } from '../domain/CategoryRepository';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';

interface CategoryRow {
  id: string;
  name: string;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export class SqliteCategoryRepository implements CategoryRepository {
  private readonly db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  async save(category: Category): Promise<Category> {
    const data = category.toPrimitive();
    if (!data.id) {
      throw new Error('[SqliteCategoryRepository] cannot save a category without id');
    }

    this.db
      .prepare(
        `INSERT INTO categories (id, name, image_path, created_at, updated_at)
         VALUES (@id, @name, @imagePath, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           name = @name,
           image_path = @imagePath,
           updated_at = @updatedAt`
      )
      .run({
        id: data.id,
        name: data.name,
        imagePath: data.imagePath,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });

    return category;
  }

  async findById(id: string): Promise<Category | null> {
    const row = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as
      | CategoryRow
      | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const row = this.db.prepare('SELECT * FROM categories WHERE name = ?').get(name) as
      | CategoryRow
      | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findAll(): Promise<Category[]> {
    const rows = this.db
      .prepare('SELECT * FROM categories ORDER BY name COLLATE NOCASE')
      .all() as CategoryRow[];
    return rows.map((row) => this.mapRow(row));
  }

  async delete(id: string): Promise<boolean> {
    return this.db.prepare('DELETE FROM categories WHERE id = ?').run(id).changes > 0;
  }

  private mapRow(row: CategoryRow): Category {
    return Category.fromPrimitive({
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
