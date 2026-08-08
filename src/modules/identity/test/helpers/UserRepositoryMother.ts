import { UserRepository } from '../../domain/UserRepository';

export function create(overrides?: Partial<UserRepository>): UserRepository {
  return {
    save: jest.fn().mockImplementation(async (user) => user),
    findById: jest.fn().mockResolvedValue(null),
    findByIdentifier: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    countUsers: jest.fn().mockResolvedValue(0),
    delete: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}
