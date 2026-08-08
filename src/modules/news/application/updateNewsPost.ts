import { NewsPost } from '../domain/NewsPost';
import { ensureUniqueSlug, slugify } from '../../shared/domain/slugify';
import { NewsRepository } from '../domain/NewsRepository';

interface updateNewsPostProps {
  id: string;
  title: string;
  markdown: string;
  published: boolean;
  imagePath?: string | null;
  author?: string;
  newsRepository: NewsRepository;
  /** Port: notifies readers when the post transitions to published. */
  onNewsPublished?: (post: NewsPost) => Promise<void>;
}

export async function updateNewsPost({
  id,
  title,
  markdown,
  published,
  imagePath,
  author,
  newsRepository,
  onNewsPublished,
}: updateNewsPostProps): Promise<NewsPost> {
  if (!id) {
    throw new Error('[updateNewsPost] Id must be provided');
  }

  const post = await newsRepository.findById(id);
  if (post === null) {
    throw new Error(`[updateNewsPost] News post with id ${id} not found`);
  }

  const wasPublished = post.isPublished();
  let updated = post.setContent(title, markdown, published, imagePath ?? null, author ?? '');

  if (updated.getTitle() !== post.getTitle() || !updated.getSlug()) {
    const slug = await ensureUniqueSlug(slugify(title, 'post'), async (candidate) => {
      const existing = await newsRepository.findBySlug(candidate);
      return existing !== null && existing.getId() !== id;
    });
    updated = updated.withSlug(slug);
  }

  const saved = await newsRepository.save(updated);

  if (!wasPublished && saved.isPublished() && onNewsPublished) {
    await onNewsPublished(saved);
  }

  return saved;
}
