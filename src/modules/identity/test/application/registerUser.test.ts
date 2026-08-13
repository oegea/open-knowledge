import { registerUser, hashRecoveryCode } from '../../application/registerUser';
import { InstanceSettings } from '../../../settings/domain/InstanceSettings';
import * as UserMother from '../helpers/UserMother';
import * as UserRepositoryMother from '../helpers/UserRepositoryMother';
import * as TotpRepositoryMother from '../helpers/TotpRepositoryMother';
import * as SettingsRepositoryMother from '../helpers/SettingsRepositoryMother';

describe('registerUser (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Behaviour', () => {
    it('creates the identity after verifying the TOTP code', async () => {
      const userRepository = UserRepositoryMother.create({
        countUsers: jest.fn().mockResolvedValue(3),
      });
      const totpRepository = TotpRepositoryMother.create();

      const { user, recoveryCode } = await registerUser({
        identifier: 'Erudito#4821',
        secret: 'JBSWY3DPEHPK3PXP',
        code: '123456',
        userRepository,
        totpRepository,
        settingsRepository: SettingsRepositoryMother.create(),
      });

      expect(user.getIdentifier()).toBe('Erudito#4821');
      expect(user.isAdmin()).toBe(false);
      expect(user.getRecoveryCodeHash()).toBe(hashRecoveryCode(recoveryCode));
      expect(totpRepository.verify).toHaveBeenCalledWith('123456', 'JBSWY3DPEHPK3PXP');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('makes the first registered user the administrator', async () => {
      const userRepository = UserRepositoryMother.create({
        countUsers: jest.fn().mockResolvedValue(0),
      });

      const { user } = await registerUser({
        identifier: 'Lumen#345',
        secret: 'SECRET',
        code: '123456',
        userRepository,
        totpRepository: TotpRepositoryMother.create(),
        settingsRepository: SettingsRepositoryMother.create(),
      });

      expect(user.isAdmin()).toBe(true);
    });

    it('allows the first user to register even with registration closed', async () => {
      const settingsRepository = SettingsRepositoryMother.create({
        get: jest.fn().mockResolvedValue(InstanceSettings.create('Lib', '', null, null, false, null, null, '', '', null, false, false)),
      });

      const { user } = await registerUser({
        identifier: 'Lumen#345',
        secret: 'SECRET',
        code: '123456',
        userRepository: UserRepositoryMother.create(),
        totpRepository: TotpRepositoryMother.create(),
        settingsRepository,
      });

      expect(user.isAdmin()).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('rejects registration when closed and users exist', async () => {
      const settingsRepository = SettingsRepositoryMother.create({
        get: jest.fn().mockResolvedValue(InstanceSettings.create('Lib', '', null, null, false, null, null, '', '', null, false, false)),
      });
      const userRepository = UserRepositoryMother.create({
        countUsers: jest.fn().mockResolvedValue(1),
      });

      await expect(
        registerUser({
          identifier: 'Lumen#345',
          secret: 'SECRET',
          code: '123456',
          userRepository,
          totpRepository: TotpRepositoryMother.create(),
          settingsRepository,
        })
      ).rejects.toThrow('[registerUser] Registration is closed on this instance');

      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('rejects an invalid TOTP code', async () => {
      const totpRepository = TotpRepositoryMother.create({
        verify: jest.fn().mockReturnValue(false),
      });

      await expect(
        registerUser({
          identifier: 'Lumen#345',
          secret: 'SECRET',
          code: '000000',
          userRepository: UserRepositoryMother.create(),
          totpRepository,
          settingsRepository: SettingsRepositoryMother.create(),
        })
      ).rejects.toThrow('[registerUser] Invalid verification code');
    });

    it('rejects a taken identifier', async () => {
      const userRepository = UserRepositoryMother.create({
        findByIdentifier: jest.fn().mockResolvedValue(UserMother.create()),
        countUsers: jest.fn().mockResolvedValue(1),
      });

      await expect(
        registerUser({
          identifier: 'Erudito#4821',
          secret: 'SECRET',
          code: '123456',
          userRepository,
          totpRepository: TotpRepositoryMother.create(),
          settingsRepository: SettingsRepositoryMother.create(),
        })
      ).rejects.toThrow('[registerUser] Identifier Erudito#4821 is already taken');
    });

    it('rejects malformed identifiers', async () => {
      await expect(
        registerUser({
          identifier: 'no-hash-digits',
          secret: 'SECRET',
          code: '123456',
          userRepository: UserRepositoryMother.create(),
          totpRepository: TotpRepositoryMother.create(),
          settingsRepository: SettingsRepositoryMother.create(),
        })
      ).rejects.toThrow('[UserIdentifier]');
    });
  });
});
