import { SessionRepository } from '../../domain/SessionRepository';

export function create(overrides?: Partial<SessionRepository>): SessionRepository {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    findByTokenHash: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(true),
    deleteExpired: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}
