import { NewsPost } from '../domain/NewsPost';
import { NewsRepository } from '../domain/NewsRepository';

interface listNewsPostsProps {
  publishedOnly: boolean;
  newsRepository: NewsRepository;
}

export async function listNewsPosts({
  publishedOnly,
  newsRepository,
}: listNewsPostsProps): Promise<NewsPost[]> {
  return await newsRepository.findAll(publishedOnly);
}
