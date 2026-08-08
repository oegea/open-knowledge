import { Page, PagePlacement } from '../domain/Page';
import { PageRepository } from '../domain/PageRepository';

interface listPagesProps {
  placement?: PagePlacement;
  pageRepository: PageRepository;
}

export async function listPages({ placement, pageRepository }: listPagesProps): Promise<Page[]> {
  if (placement) {
    return await pageRepository.findByPlacement(placement);
  }
  return await pageRepository.findAll();
}
