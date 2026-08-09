import { createPage } from './createPage';
import { updatePage } from './updatePage';
import { getPage } from './getPage';
import { listPages } from './listPages';
import { deletePage } from './deletePage';
import { createDefaultAboutPage } from './createDefaultAboutPage';
import { PagePlacement } from '../domain/Page';
import { SqlitePageRepository } from '../infrastructure/SqlitePageRepository';
import { StaticPageRepository } from '../infrastructure/StaticPageRepository';
import { isStaticMode } from '../../shared/infrastructure/StaticContentClient';

import type { PageRepository } from '../domain/PageRepository';

const pageRepository = (): PageRepository =>
  isStaticMode() ? new StaticPageRepository() : new SqlitePageRepository();

export default {
  createPage: async (title: string, markdown: string, placement: PagePlacement) =>
    await createPage({ title, markdown, placement, pageRepository: pageRepository() }),

  updatePage: async (id: string, title: string, markdown: string, placement: PagePlacement) =>
    await updatePage({
      id,
      title,
      markdown,
      placement,
      pageRepository: pageRepository(),
    }),

  getPage: async (id: string) => await getPage({ id, pageRepository: pageRepository() }),

  listPages: async (placement?: PagePlacement) =>
    await listPages({ placement, pageRepository: pageRepository() }),

  deletePage: async (id: string) =>
    await deletePage({ id, pageRepository: pageRepository() }),

  createDefaultAboutPage: async () =>
    await createDefaultAboutPage({ pageRepository: pageRepository() }),
};
