import { Page, PagePlacement } from '../domain/Page';
import { ensureUniqueSlug, slugify } from '../../shared/domain/slugify';
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

  let updated = page.setContent(title, markdown, placement);

  if (updated.getTitle() !== page.getTitle() || !updated.getSlug()) {
    const slug = await ensureUniqueSlug(slugify(title, 'page'), async (candidate) => {
      const existing = await pageRepository.findBySlug(candidate);
      return existing !== null && existing.getId() !== id;
    });
    updated = updated.withSlug(slug);
  }

  return await pageRepository.save(updated);
}
