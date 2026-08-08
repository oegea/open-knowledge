import { NotificationRepository } from '../../domain/NotificationRepository';

export function create(overrides?: Partial<NotificationRepository>): NotificationRepository {
  return {
    save: jest.fn().mockImplementation(async (notification) => notification),
    findForUser: jest.fn().mockResolvedValue([]),
    getSeenAt: jest.fn().mockResolvedValue(null),
    markSeen: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
