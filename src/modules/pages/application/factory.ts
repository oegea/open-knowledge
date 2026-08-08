import { createPage } from './createPage';
import { updatePage } from './updatePage';
import { getPage } from './getPage';
import { listPages } from './listPages';
import { deletePage } from './deletePage';
import { createDefaultAboutPage } from './createDefaultAboutPage';
import { PagePlacement } from '../domain/Page';
import { SqlitePageRepository } from '../infrastructure/SqlitePageRepository';

export default {
  createPage: async (title: string, markdown: string, placement: PagePlacement) =>
    await createPage({ title, markdown, placement, pageRepository: new SqlitePageRepository() }),

  updatePage: async (id: string, title: string, markdown: string, placement: PagePlacement) =>
    await updatePage({
      id,
      title,
      markdown,
      placement,
      pageRepository: new SqlitePageRepository(),
    }),

  getPage: async (id: string) => await getPage({ id, pageRepository: new SqlitePageRepository() }),

  listPages: async (placement?: PagePlacement) =>
    await listPages({ placement, pageRepository: new SqlitePageRepository() }),

  deletePage: async (id: string) =>
    await deletePage({ id, pageRepository: new SqlitePageRepository() }),

  createDefaultAboutPage: async () =>
    await createDefaultAboutPage({ pageRepository: new SqlitePageRepository() }),
};
