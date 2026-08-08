import { randomUUID } from 'crypto';
import { NewsPost } from '../domain/NewsPost';
import { ensureUniqueSlug, slugify } from '../../shared/domain/slugify';
import { NewsRepository } from '../domain/NewsRepository';

interface createNewsPostProps {
  title: string;
  markdown: string;
  published: boolean;
  imagePath?: string | null;
  author?: string;
  newsRepository: NewsRepository;
  /** Port: notifies readers when the post goes out published. */
  onNewsPublished?: (post: NewsPost) => Promise<void>;
}

export async function createNewsPost({
  title,
  markdown,
  published,
  imagePath,
  author,
  newsRepository,
  onNewsPublished,
}: createNewsPostProps): Promise<NewsPost> {
  const slug = await ensureUniqueSlug(
    slugify(title, 'post'),
    async (candidate) => (await newsRepository.findBySlug(candidate)) !== null
  );
  const post = NewsPost.create(
    randomUUID(),
    title,
    markdown,
    published,
    imagePath ?? null,
    author ?? '',
    slug
  );
  const saved = await newsRepository.save(post);

  if (saved.isPublished() && onNewsPublished) {
    await onNewsPublished(saved);
  }

  return saved;
}
