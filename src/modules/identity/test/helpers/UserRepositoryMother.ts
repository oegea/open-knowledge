import { UserRepository } from '../../domain/UserRepository';

export function create(overrides?: Partial<UserRepository>): UserRepository {
  return {
    save: jest.fn().mockImplementation(async (user) => user),
    findById: jest.fn().mockResolvedValue(null),
    findByIdentifier: jest.fn().mockResolvedValue(null),
    countUsers: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}
