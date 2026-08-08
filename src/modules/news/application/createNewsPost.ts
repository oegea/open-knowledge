import { randomUUID } from 'crypto';
import { NewsPost } from '../domain/NewsPost';
import { NewsRepository } from '../domain/NewsRepository';

interface createNewsPostProps {
  title: string;
  markdown: string;
  published: boolean;
  imagePath?: string | null;
  newsRepository: NewsRepository;
  /** Port: notifies readers when the post goes out published. */
  onNewsPublished?: (post: NewsPost) => Promise<void>;
}

export async function createNewsPost({
  title,
  markdown,
  published,
  imagePath,
  newsRepository,
  onNewsPublished,
}: createNewsPostProps): Promise<NewsPost> {
  const post = NewsPost.create(randomUUID(), title, markdown, published, imagePath ?? null);
  const saved = await newsRepository.save(post);

  if (saved.isPublished() && onNewsPublished) {
    await onNewsPublished(saved);
  }

  return saved;
}
