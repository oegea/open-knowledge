import { NewsPost } from './NewsPost';

export interface NewsRepository {
  save(post: NewsPost): Promise<NewsPost>;
  findById(id: string): Promise<NewsPost | null>;
  findBySlug(slug: string): Promise<NewsPost | null>;
  findAll(publishedOnly: boolean): Promise<NewsPost[]>;
  delete(id: string): Promise<boolean>;
}
