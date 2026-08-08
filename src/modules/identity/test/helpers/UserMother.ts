import { User, UserPrimitive } from '../../domain/User';

export function create(overrides: Partial<UserPrimitive> = {}): User {
  return User.fromPrimitive({
    id: 'user-1',
    identifier: 'Erudito#4821',
    totpSecret: 'JBSWY3DPEHPK3PXP',
    recoveryCodeHash: 'a'.repeat(64),
    isAdmin: false,
    createdAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  });
}
