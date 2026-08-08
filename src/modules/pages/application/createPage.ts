import { randomUUID } from 'crypto';
import { Page, PagePlacement } from '../domain/Page';
import { ensureUniqueSlug, slugify } from '../../shared/domain/slugify';
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
  const slug = await ensureUniqueSlug(
    slugify(title, 'page'),
    async (candidate) => (await pageRepository.findBySlug(candidate)) !== null
  );
  const page = Page.create(randomUUID(), title, markdown, placement, position, slug);
  return await pageRepository.save(page);
}
