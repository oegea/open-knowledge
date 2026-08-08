import { NewsPost } from '../domain/NewsPost';
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
  const updated = post.setContent(title, markdown, published, imagePath ?? null, author ?? '');
  const saved = await newsRepository.save(updated);

  if (!wasPublished && saved.isPublished() && onNewsPublished) {
    await onNewsPublished(saved);
  }

  return saved;
}
