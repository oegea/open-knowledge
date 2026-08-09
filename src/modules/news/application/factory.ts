import { createNewsPost } from './createNewsPost';
import { updateNewsPost } from './updateNewsPost';
import { getNewsPost } from './getNewsPost';
import { listNewsPosts } from './listNewsPosts';
import { deleteNewsPost } from './deleteNewsPost';
import { NewsPost } from '../domain/NewsPost';
import { SqliteNewsRepository } from '../infrastructure/SqliteNewsRepository';
import { StaticNewsRepository } from '../infrastructure/StaticNewsRepository';
import { isStaticMode } from '../../shared/infrastructure/StaticContentClient';

import type { NewsRepository } from '../domain/NewsRepository';

const newsRepository = (): NewsRepository =>
  isStaticMode() ? new StaticNewsRepository() : new SqliteNewsRepository();
import notificationFactory from '../../notification/application/factory';

const notifyNewsPublished = async (post: NewsPost) => {
  await notificationFactory.publishNotification('news_published', post.getTitle(), post.getId());
};

export default {
  createNewsPost: async (
    title: string,
    markdown: string,
    published: boolean,
    imagePath?: string | null,
    author?: string
  ) =>
    await createNewsPost({
      title,
      markdown,
      published,
      imagePath,
      author,
      newsRepository: newsRepository(),
      onNewsPublished: notifyNewsPublished,
    }),

  updateNewsPost: async (
    id: string,
    title: string,
    markdown: string,
    published: boolean,
    imagePath?: string | null,
    author?: string
  ) =>
    await updateNewsPost({
      id,
      title,
      markdown,
      published,
      imagePath,
      author,
      newsRepository: newsRepository(),
      onNewsPublished: notifyNewsPublished,
    }),

  getNewsPost: async (id: string) =>
    await getNewsPost({ id, newsRepository: newsRepository() }),

  listNewsPosts: async (publishedOnly: boolean) =>
    await listNewsPosts({ publishedOnly, newsRepository: newsRepository() }),

  deleteNewsPost: async (id: string) =>
    await deleteNewsPost({ id, newsRepository: newsRepository() }),
};
