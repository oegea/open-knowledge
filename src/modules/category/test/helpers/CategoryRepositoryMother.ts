import { CategoryRepository } from '../../domain/CategoryRepository';

export function create(overrides?: Partial<CategoryRepository>): CategoryRepository {
  return {
    save: jest.fn().mockImplementation(async (category) => category),
    findById: jest.fn().mockResolvedValue(null),
    findByName: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}
