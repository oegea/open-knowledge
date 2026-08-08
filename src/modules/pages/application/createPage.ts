import { randomUUID } from 'crypto';
import { Page, PagePlacement } from '../domain/Page';
import { PageRepository } from '../domain/PageRepository';

interface createPageProps {
  title: string;
  markdown: string;
  placement: PagePlacement;
  pageRepository: PageRepository;
}

export async function createPage({
  title,
  markdown,
  placement,
  pageRepository,
}: createPageProps): Promise<Page> {
  const position = await pageRepository.count();
  const page = Page.create(randomUUID(), title, markdown, placement, position);
  return await pageRepository.save(page);
}
