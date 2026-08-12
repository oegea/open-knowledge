import { Category, CategoryPrimitive } from '../../domain/Category';

export function create(overrides?: Partial<CategoryPrimitive>): Category {
  return Category.fromPrimitive({
    id: 'category-1',
    name: 'Science',
    imagePath: '/api/media/images/science.png',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });
}
