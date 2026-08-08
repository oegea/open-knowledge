import { TotpRepository } from '../../domain/TotpRepository';

export function create(overrides?: Partial<TotpRepository>): TotpRepository {
  return {
    generateSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
    buildOtpauthUri: jest
      .fn()
      .mockImplementation(
        (identifier: string, secret: string) =>
          `otpauth://totp/Open%20Knowledge:${encodeURIComponent(identifier)}?secret=${secret}`
      ),
    verify: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}
