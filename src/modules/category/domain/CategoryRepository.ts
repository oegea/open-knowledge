import { Category } from './Category';

export interface CategoryRepository {
  save(category: Category): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  /** Exact, case-sensitive match — the same semantics courses use to filter. */
  findByName(name: string): Promise<Category | null>;
  /** All categories, sorted by name. */
  findAll(): Promise<Category[]>;
  delete(id: string): Promise<boolean>;
}
