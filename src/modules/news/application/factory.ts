import { createNewsPost } from './createNewsPost';
import { updateNewsPost } from './updateNewsPost';
import { getNewsPost } from './getNewsPost';
import { listNewsPosts } from './listNewsPosts';
import { deleteNewsPost } from './deleteNewsPost';
import { NewsPost } from '../domain/NewsPost';
import { SqliteNewsRepository } from '../infrastructure/SqliteNewsRepository';
import notificationFactory from '../../notification/application/factory';

const notifyNewsPublished = async (post: NewsPost) => {
  await notificationFactory.publishNotification('news_published', post.getTitle(), post.getId());
};

export default {
  createNewsPost: async (title: string, markdown: string, published: boolean) =>
    await createNewsPost({
      title,
      markdown,
      published,
      newsRepository: new SqliteNewsRepository(),
      onNewsPublished: notifyNewsPublished,
    }),

  updateNewsPost: async (id: string, title: string, markdown: string, published: boolean) =>
    await updateNewsPost({
      id,
      title,
      markdown,
      published,
      newsRepository: new SqliteNewsRepository(),
      onNewsPublished: notifyNewsPublished,
    }),

  getNewsPost: async (id: string) =>
    await getNewsPost({ id, newsRepository: new SqliteNewsRepository() }),

  listNewsPosts: async (publishedOnly: boolean) =>
    await listNewsPosts({ publishedOnly, newsRepository: new SqliteNewsRepository() }),

  deleteNewsPost: async (id: string) =>
    await deleteNewsPost({ id, newsRepository: new SqliteNewsRepository() }),
};
