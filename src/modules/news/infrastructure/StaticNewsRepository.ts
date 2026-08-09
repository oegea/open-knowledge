import { NewsPost, NewsPostPrimitive } from '../domain/NewsPost';
import { NewsRepository } from '../domain/NewsRepository';
import {
  fetchContentJson,
  fetchContentText,
  resolveContentUrl,
} from '../../shared/infrastructure/StaticContentClient';

type RawPost = NewsPostPrimitive & { markdownFile?: string };

/**
 * Read-only news from the content repository (ADR 0013). `news/index.json`
 * lists entry names newest-first; each post lives in `news/<name>.json` and
 * may keep its body in a Markdown file via `markdownFile`.
 */
export class StaticNewsRepository implements NewsRepository {
  async save(): Promise<NewsPost> {
    throw new Error('[StaticNewsRepository] static content mode is read-only');
  }

  async delete(): Promise<boolean> {
    throw new Error('[StaticNewsRepository] static content mode is read-only');
  }

  async findById(id: string): Promise<NewsPost | null> {
    const posts = await this.loadAll();
    return posts.find((post) => post.getId() === id) ?? null;
  }

  async findBySlug(slug: string): Promise<NewsPost | null> {
    const posts = await this.loadAll();
    return posts.find((post) => post.getSlug() === slug) ?? null;
  }

  async findAll(publishedOnly: boolean): Promise<NewsPost[]> {
    const posts = await this.loadAll();
    return publishedOnly ? posts.filter((post) => post.isPublished()) : posts;
  }

  private async loadAll(): Promise<NewsPost[]> {
    const index = (await fetchContentJson<string[]>('news/index.json')) ?? [];
    const loaded = await Promise.all(
      index.map(async (name) => {
        const raw = await fetchContentJson<RawPost>(`news/${name}.json`);
        if (!raw) return null;
        const { markdownFile, ...primitive } = raw;
        const markdown = markdownFile
          ? ((await fetchContentText(`news/${markdownFile}`)) ?? '')
          : (primitive.markdown ?? '');
        return NewsPost.fromPrimitive({
          ...primitive,
          markdown,
          imagePath: resolveContentUrl(primitive.imagePath),
        });
      })
    );
    return loaded.filter((post): post is NewsPost => post !== null);
  }
}
