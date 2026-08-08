import { NewsPost } from '../domain/NewsPost';
import { NewsRepository } from '../domain/NewsRepository';

interface getNewsPostProps {
  id: string;
  newsRepository: NewsRepository;
}

export async function getNewsPost({ id, newsRepository }: getNewsPostProps): Promise<NewsPost> {
  if (!id) {
    throw new Error('[getNewsPost] Id must be provided');
  }

  const post = await newsRepository.findById(id);
  if (post === null) {
    throw new Error(`[getNewsPost] News post with id ${id} not found`);
  }

  return post;
}
