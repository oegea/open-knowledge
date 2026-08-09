import { Page, PagePlacement, PagePrimitive } from '../domain/Page';
import { PageRepository } from '../domain/PageRepository';
import { fetchContentJson } from '../../shared/infrastructure/StaticContentClient';

/** Read-only auxiliary pages from `pages/index.json` in the content repo. */
export class StaticPageRepository implements PageRepository {
  async save(): Promise<Page> {
    throw new Error('[StaticPageRepository] static content mode is read-only');
  }

  async delete(): Promise<boolean> {
    throw new Error('[StaticPageRepository] static content mode is read-only');
  }

  async findById(id: string): Promise<Page | null> {
    const pages = await this.loadAll();
    return pages.find((page) => page.getId() === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Page | null> {
    const pages = await this.loadAll();
    return pages.find((page) => page.getSlug() === slug) ?? null;
  }

  async findAll(): Promise<Page[]> {
    return await this.loadAll();
  }

  async findByPlacement(placement: PagePlacement): Promise<Page[]> {
    const pages = await this.loadAll();
    return pages.filter((page) => page.getPlacement() === placement);
  }

  async count(): Promise<number> {
    return (await this.loadAll()).length;
  }

  private async loadAll(): Promise<Page[]> {
    const data = (await fetchContentJson<PagePrimitive[]>('pages/index.json')) ?? [];
    return data
      .map((page) => Page.fromPrimitive(page))
      .sort((a, b) => a.getPosition() - b.getPosition());
  }
}
