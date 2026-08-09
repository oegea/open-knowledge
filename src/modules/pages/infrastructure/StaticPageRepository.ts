import { Page, PagePlacement, PagePrimitive } from '../domain/Page';
import { PageRepository } from '../domain/PageRepository';
import {
  fetchContentJson,
  fetchContentText,
} from '../../shared/infrastructure/StaticContentClient';

type RawPage = PagePrimitive & { markdownFile?: string };

/**
 * Read-only auxiliary pages from the content repository (ADR 0013).
 * `pages/index.json` lists entry names; each page lives in `pages/<name>.json`
 * and may keep its body in a Markdown file via `markdownFile`.
 */
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
    const index = (await fetchContentJson<string[]>('pages/index.json')) ?? [];
    const loaded = await Promise.all(
      index.map(async (name) => {
        const raw = await fetchContentJson<RawPage>(`pages/${name}.json`);
        if (!raw) return null;
        const { markdownFile, ...primitive } = raw;
        const markdown = markdownFile
          ? ((await fetchContentText(`pages/${markdownFile}`)) ?? '')
          : (primitive.markdown ?? '');
        return Page.fromPrimitive({ ...primitive, markdown });
      })
    );
    return loaded
      .filter((page): page is Page => page !== null)
      .sort((a, b) => a.getPosition() - b.getPosition());
  }
}
