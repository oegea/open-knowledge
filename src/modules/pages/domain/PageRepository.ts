import { Page, PagePlacement } from './Page';

export interface PageRepository {
  save(page: Page): Promise<Page>;
  findById(id: string): Promise<Page | null>;
  findAll(): Promise<Page[]>;
  findByPlacement(placement: PagePlacement): Promise<Page[]>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
