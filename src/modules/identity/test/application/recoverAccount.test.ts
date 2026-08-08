import { initAccountRecovery, confirmAccountRecovery } from '../../application/recoverAccount';
import { hashRecoveryCode } from '../../application/registerUser';
import * as UserMother from '../helpers/UserMother';
import * as UserRepositoryMother from '../helpers/UserRepositoryMother';
import * as TotpRepositoryMother from '../helpers/TotpRepositoryMother';

const RECOVERY_CODE = 'my-recovery-code';

function userWithRecoveryCode() {
  return UserMother.create({ recoveryCodeHash: hashRecoveryCode(RECOVERY_CODE) });
}

describe('account recovery (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initAccountRecovery', () => {
    it('returns a new TOTP challenge when the recovery code matches', async () => {
      const userRepository = UserRepositoryMother.create({
        findByIdentifier: jest.fn().mockResolvedValue(userWithRecoveryCode()),
      });

      const challenge = await initAccountRecovery({
        identifier: 'Erudito#4821',
        recoveryCode: RECOVERY_CODE,
        userRepository,
        totpRepository: TotpRepositoryMother.create(),
      });

      expect(challenge.identifier).toBe('Erudito#4821');
      expect(challenge.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(challenge.otpauthUri).toContain('otpauth://totp/');
    });

    it('rejects a wrong recovery code with a uniform error', async () => {
      const userRepository = UserRepositoryMother.create({
        findByIdentifier: jest.fn().mockResolvedValue(userWithRecoveryCode()),
      });

      await expect(
        initAccountRecovery({
          identifier: 'Erudito#4821',
          recoveryCode: 'wrong',
          userRepository,
          totpRepository: TotpRepositoryMother.create(),
        })
      ).rejects.toThrow('[recoverAccount] Invalid identifier or recovery code');
    });
  });

  describe('confirmAccountRecovery', () => {
    it('rebinds credentials and issues a new recovery code', async () => {
      const original = userWithRecoveryCode();
      const userRepository = UserRepositoryMother.create({
        findByIdentifier: jest.fn().mockResolvedValue(original),
      });

      const { user, recoveryCode } = await confirmAccountRecovery({
        identifier: 'Erudito#4821',
        recoveryCode: RECOVERY_CODE,
        secret: 'NEWSECRET',
        code: '123456',
        userRepository,
        totpRepository: TotpRepositoryMother.create(),
      });

      expect(user.getTotpSecret()).toBe('NEWSECRET');
      expect(user.getRecoveryCodeHash()).toBe(hashRecoveryCode(recoveryCode));
      expect(recoveryCode).not.toBe(RECOVERY_CODE);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('rejects an invalid TOTP code from the new secret', async () => {
      const userRepository = UserRepositoryMother.create({
        findByIdentifier: jest.fn().mockResolvedValue(userWithRecoveryCode()),
      });

      await expect(
        confirmAccountRecovery({
          identifier: 'Erudito#4821',
          recoveryCode: RECOVERY_CODE,
          secret: 'NEWSECRET',
          code: '000000',
          userRepository,
          totpRepository: TotpRepositoryMother.create({
            verify: jest.fn().mockReturnValue(false),
          }),
        })
      ).rejects.toThrow('[recoverAccount] Invalid verification code');

      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
