import { Page } from '../domain/Page';
import { PageRepository } from '../domain/PageRepository';

interface getPageProps {
  id: string;
  pageRepository: PageRepository;
}

export async function getPage({ id, pageRepository }: getPageProps): Promise<Page> {
  if (!id) {
    throw new Error('[getPage] Id must be provided');
  }

  const page = await pageRepository.findById(id);
  if (page === null) {
    throw new Error(`[getPage] Page with id ${id} not found`);
  }

  return page;
}
