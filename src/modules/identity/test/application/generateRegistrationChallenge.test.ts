import { generateRegistrationChallenge } from '../../application/generateRegistrationChallenge';
import { UserIdentifier } from '../../domain/UserIdentifier';
import * as UserMother from '../helpers/UserMother';
import * as UserRepositoryMother from '../helpers/UserRepositoryMother';
import * as TotpRepositoryMother from '../helpers/TotpRepositoryMother';

describe('generateRegistrationChallenge (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('produces a valid identifier, secret and otpauth uri', async () => {
    const challenge = await generateRegistrationChallenge({
      userRepository: UserRepositoryMother.create(),
      totpRepository: TotpRepositoryMother.create(),
    });

    expect(() => UserIdentifier.create(challenge.identifier)).not.toThrow();
    expect(challenge.secret).toBe('JBSWY3DPEHPK3PXP');
    expect(challenge.otpauthUri).toContain('otpauth://totp/');
  });

  it('flags the first account as future admin', async () => {
    const challenge = await generateRegistrationChallenge({
      userRepository: UserRepositoryMother.create({
        countUsers: jest.fn().mockResolvedValue(0),
      }),
      totpRepository: TotpRepositoryMother.create(),
    });
    expect(challenge.willBeAdmin).toBe(true);
  });

  it('does not flag admin when users already exist', async () => {
    const challenge = await generateRegistrationChallenge({
      userRepository: UserRepositoryMother.create({
        countUsers: jest.fn().mockResolvedValue(2),
      }),
      totpRepository: TotpRepositoryMother.create(),
    });
    expect(challenge.willBeAdmin).toBe(false);
  });

  it('retries until it finds a free identifier', async () => {
    const findByIdentifier = jest
      .fn()
      .mockResolvedValueOnce(UserMother.create())
      .mockResolvedValue(null);

    await generateRegistrationChallenge({
      userRepository: UserRepositoryMother.create({ findByIdentifier }),
      totpRepository: TotpRepositoryMother.create(),
    });

    expect(findByIdentifier.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  describe('UserIdentifier domain', () => {
    it('generates identifiers in word#digits format', () => {
      for (let i = 0; i < 50; i += 1) {
        const identifier = UserIdentifier.generate();
        expect(identifier.getValue()).toMatch(/^[\p{L}]+#\d{3,4}$/u);
      }
    });

    it('rejects malformed identifiers', () => {
      ['', 'NoDigits', '#123', 'Word#12', 'Word#12345', 'Wo rd#123'].forEach((bad) => {
        expect(() => UserIdentifier.create(bad)).toThrow('[UserIdentifier]');
      });
    });
  });
});
