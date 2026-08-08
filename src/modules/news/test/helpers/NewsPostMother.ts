import { NewsPost, NewsPostPrimitive } from '../../domain/NewsPost';

export function create(overrides: Partial<NewsPostPrimitive> = {}): NewsPost {
  return NewsPost.fromPrimitive({
    id: 'post-1',
    title: 'Three new astronomy courses',
    markdown: 'We just published **three** new courses about the night sky.',
    imagePath: null,
    author: '',
    published: false,
    createdAt: '2026-08-08T10:00:00.000Z',
    updatedAt: '2026-08-08T10:00:00.000Z',
    ...overrides,
  });
}
