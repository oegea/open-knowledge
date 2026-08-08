import { NewsRepository } from '../../domain/NewsRepository';

export function create(overrides?: Partial<NewsRepository>): NewsRepository {
  return {
    save: jest.fn().mockImplementation(async (post) => post),
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}
