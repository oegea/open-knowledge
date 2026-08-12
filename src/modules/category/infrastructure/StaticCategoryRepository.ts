import { Category, CategoryPrimitive } from '../domain/Category';
import { CategoryRepository } from '../domain/CategoryRepository';
import {
  fetchContentJson,
  resolveContentUrl,
} from '../../shared/infrastructure/StaticContentClient';

/**
 * Read-only categories from the content repository (ADR 0013/0015).
 * `categories/index.json` lists entry names; each category lives in
 * `categories/<name>.json`. Repos created before categories existed have no
 * index file at all — that must read as "no categories", never as an error.
 */
export class StaticCategoryRepository implements CategoryRepository {
  async save(): Promise<Category> {
    throw new Error('[StaticCategoryRepository] static content mode is read-only');
  }

  async delete(): Promise<boolean> {
    throw new Error('[StaticCategoryRepository] static content mode is read-only');
  }

  async findById(id: string): Promise<Category | null> {
    const categories = await this.loadAll();
    return categories.find((category) => category.getId() === id) ?? null;
  }

  async findByName(name: string): Promise<Category | null> {
    const categories = await this.loadAll();
    return categories.find((category) => category.getName() === name) ?? null;
  }

  async findAll(): Promise<Category[]> {
    return await this.loadAll();
  }

  private async loadAll(): Promise<Category[]> {
    const index = (await fetchContentJson<string[]>('categories/index.json')) ?? [];
    const loaded = await Promise.all(
      index.map(async (name) => {
        const raw = await fetchContentJson<CategoryPrimitive>(`categories/${name}.json`);
        if (!raw) return null;
        return Category.fromPrimitive({
          ...raw,
          imagePath: resolveContentUrl(raw.imagePath),
        });
      })
    );
    return loaded
      .filter((category): category is Category => category !== null)
      .sort((a, b) => a.getName().localeCompare(b.getName()));
  }
}
