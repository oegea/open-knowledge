import { NewsRepository } from '../domain/NewsRepository';

interface deleteNewsPostProps {
  id: string;
  newsRepository: NewsRepository;
}

export async function deleteNewsPost({ id, newsRepository }: deleteNewsPostProps): Promise<void> {
  if (!id) {
    throw new Error('[deleteNewsPost] Id must be provided');
  }

  const deleted = await newsRepository.delete(id);
  if (!deleted) {
    throw new Error(`[deleteNewsPost] News post with id ${id} not found`);
  }
}
