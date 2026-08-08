import { generateRegistrationChallenge } from './generateRegistrationChallenge';
import { registerUser } from './registerUser';
import { loginUser } from './loginUser';
import { createSession } from './createSession';
import { getSessionUser } from './getSessionUser';
import { deleteSession } from './deleteSession';
import { initAccountRecovery, confirmAccountRecovery } from './recoverAccount';
import { updateDisplayName } from './updateDisplayName';
import { SqliteUserRepository } from '../infrastructure/SqliteUserRepository';
import { SqliteSessionRepository } from '../infrastructure/SqliteSessionRepository';
import { OtplibTotpRepository } from '../infrastructure/OtplibTotpRepository';
import { SqliteSettingsRepository } from '../../settings/infrastructure/SqliteSettingsRepository';
import pagesFactory from '../../pages/application/factory';
import courseFactory from '../../course/application/factory';
import certificateFactory from '../../certificate/application/factory';

export default {
  hasUsers: async () => (await new SqliteUserRepository().countUsers()) > 0,

  generateRegistrationChallenge: async () =>
    await generateRegistrationChallenge({
      userRepository: new SqliteUserRepository(),
      totpRepository: new OtplibTotpRepository(),
    }),

  registerUser: async (identifier: string, secret: string, code: string) =>
    await registerUser({
      identifier,
      secret,
      code,
      userRepository: new SqliteUserRepository(),
      totpRepository: new OtplibTotpRepository(),
      settingsRepository: new SqliteSettingsRepository(),
      onFirstAdminRegistered: async () => {
        // Default content ships in English; the admin adapts it freely.
        await pagesFactory.createDefaultAboutPage();
        await courseFactory.createDefaultWelcomeCourse();
      },
    }),

  updateDisplayName: async (userId: string, displayName: string) =>
    await updateDisplayName({
      userId,
      displayName,
      userRepository: new SqliteUserRepository(),
      onDisplayNameChanged: async (id, name) => {
        await certificateFactory.updateCertificateHolderName(id, name);
      },
    }),

  loginUser: async (identifier: string, code: string) =>
    await loginUser({
      identifier,
      code,
      userRepository: new SqliteUserRepository(),
      totpRepository: new OtplibTotpRepository(),
    }),

  createSession: async (userId: string) =>
    await createSession({ userId, sessionRepository: new SqliteSessionRepository() }),

  getSessionUser: async (token: string | null | undefined) =>
    await getSessionUser({
      token,
      sessionRepository: new SqliteSessionRepository(),
      userRepository: new SqliteUserRepository(),
    }),

  deleteSession: async (token: string | null | undefined) =>
    await deleteSession({ token, sessionRepository: new SqliteSessionRepository() }),

  initAccountRecovery: async (identifier: string, recoveryCode: string) =>
    await initAccountRecovery({
      identifier,
      recoveryCode,
      userRepository: new SqliteUserRepository(),
      totpRepository: new OtplibTotpRepository(),
    }),

  confirmAccountRecovery: async (
    identifier: string,
    recoveryCode: string,
    secret: string,
    code: string
  ) =>
    await confirmAccountRecovery({
      identifier,
      recoveryCode,
      secret,
      code,
      userRepository: new SqliteUserRepository(),
      totpRepository: new OtplibTotpRepository(),
    }),
};
