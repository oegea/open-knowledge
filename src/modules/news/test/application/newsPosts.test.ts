import { createNewsPost } from '../../application/createNewsPost';
import { updateNewsPost } from '../../application/updateNewsPost';
import { deleteNewsPost } from '../../application/deleteNewsPost';
import * as NewsPostMother from '../helpers/NewsPostMother';
import * as NewsRepositoryMother from '../helpers/NewsRepositoryMother';

describe('news post use cases (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNewsPost', () => {
    it('saves the post and notifies when published', async () => {
      const newsRepository = NewsRepositoryMother.create();
      const onNewsPublished = jest.fn().mockResolvedValue(undefined);

      const post = await createNewsPost({
        title: 'Hello',
        markdown: 'World',
        published: true,
        newsRepository,
        onNewsPublished,
      });

      expect(post.getTitle()).toBe('Hello');
      expect(newsRepository.save).toHaveBeenCalledWith(post);
      expect(onNewsPublished).toHaveBeenCalledWith(post);
    });

    it('does not notify for drafts', async () => {
      const onNewsPublished = jest.fn();

      await createNewsPost({
        title: 'Draft',
        markdown: 'Content',
        published: false,
        newsRepository: NewsRepositoryMother.create(),
        onNewsPublished,
      });

      expect(onNewsPublished).not.toHaveBeenCalled();
    });

    it('rejects empty content', async () => {
      await expect(
        createNewsPost({
          title: 'Title',
          markdown: ' ',
          published: false,
          newsRepository: NewsRepositoryMother.create(),
        })
      ).rejects.toThrow('[NewsPost] content cannot be empty');
    });
  });

  describe('updateNewsPost', () => {
    it('notifies only on the transition draft -> published', async () => {
      const draft = NewsPostMother.create({ published: false });
      const newsRepository = NewsRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(draft),
      });
      const onNewsPublished = jest.fn().mockResolvedValue(undefined);

      const updated = await updateNewsPost({
        id: 'post-1',
        title: 'Now live',
        markdown: 'Content',
        published: true,
        newsRepository,
        onNewsPublished,
      });

      expect(updated.isPublished()).toBe(true);
      expect(onNewsPublished).toHaveBeenCalledTimes(1);
    });

    it('does not notify again when the post was already published', async () => {
      const live = NewsPostMother.create({ published: true });
      const newsRepository = NewsRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(live),
      });
      const onNewsPublished = jest.fn();

      await updateNewsPost({
        id: 'post-1',
        title: 'Edited',
        markdown: 'Edited content',
        published: true,
        newsRepository,
        onNewsPublished,
      });

      expect(onNewsPublished).not.toHaveBeenCalled();
    });

    it('throws when the post does not exist', async () => {
      await expect(
        updateNewsPost({
          id: 'missing',
          title: 'X',
          markdown: 'Y',
          published: false,
          newsRepository: NewsRepositoryMother.create(),
        })
      ).rejects.toThrow('[updateNewsPost] News post with id missing not found');
    });
  });

  describe('deleteNewsPost', () => {
    it('throws when the post does not exist', async () => {
      const newsRepository = NewsRepositoryMother.create({
        delete: jest.fn().mockResolvedValue(false),
      });

      await expect(deleteNewsPost({ id: 'missing', newsRepository })).rejects.toThrow(
        '[deleteNewsPost] News post with id missing not found'
      );
    });
  });
});
