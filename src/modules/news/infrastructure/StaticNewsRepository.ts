import { NewsPost, NewsPostPrimitive } from '../domain/NewsPost';
import { NewsRepository } from '../domain/NewsRepository';
import {
  fetchContentJson,
  resolveContentUrl,
} from '../../shared/infrastructure/StaticContentClient';

/** Read-only news from `news/index.json` in the content repository. */
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
    const data = (await fetchContentJson<NewsPostPrimitive[]>('news/index.json')) ?? [];
    return data.map((post) =>
      NewsPost.fromPrimitive({ ...post, imagePath: resolveContentUrl(post.imagePath) })
    );
  }
}
