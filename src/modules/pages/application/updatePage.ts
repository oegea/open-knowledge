import { Page, PagePlacement } from '../domain/Page';
import { PageRepository } from '../domain/PageRepository';

interface updatePageProps {
  id: string;
  title: string;
  markdown: string;
  placement: PagePlacement;
  pageRepository: PageRepository;
}

export async function updatePage({
  id,
  title,
  markdown,
  placement,
  pageRepository,
}: updatePageProps): Promise<Page> {
  if (!id) {
    throw new Error('[updatePage] Id must be provided');
  }

  const page = await pageRepository.findById(id);
  if (page === null) {
    throw new Error(`[updatePage] Page with id ${id} not found`);
  }

  return await pageRepository.save(page.setContent(title, markdown, placement));
}
