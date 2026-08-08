import { PageRepository } from '../domain/PageRepository';

interface deletePageProps {
  id: string;
  pageRepository: PageRepository;
}

export async function deletePage({ id, pageRepository }: deletePageProps): Promise<void> {
  if (!id) {
    throw new Error('[deletePage] Id must be provided');
  }

  const deleted = await pageRepository.delete(id);
  if (!deleted) {
    throw new Error(`[deletePage] Page with id ${id} not found`);
  }
}
