import { createHash, randomBytes, randomUUID } from 'crypto';
import { User } from '../domain/User';
import { UserIdentifier } from '../domain/UserIdentifier';
import { UserRepository } from '../domain/UserRepository';
import { TotpRepository } from '../domain/TotpRepository';
import { SettingsRepository } from '../../settings/domain/SettingsRepository';

export interface RegistrationResult {
  user: User;
  /** Shown exactly once; only its hash is persisted. */
  recoveryCode: string;
}

interface registerUserProps {
  identifier: string;
  secret: string;
  code: string;
  userRepository: UserRepository;
  totpRepository: TotpRepository;
  settingsRepository: SettingsRepository;
}

export function hashRecoveryCode(recoveryCode: string): string {
  return createHash('sha256').update(recoveryCode).digest('hex');
}

/**
 * Creates a pseudonymous identity once the person proves control of the
 * authenticator (valid TOTP code). The first user of the instance becomes
 * the administrator; afterwards registration can be closed by the admin.
 */
export async function registerUser({
  identifier,
  secret,
  code,
  userRepository,
  totpRepository,
  settingsRepository,
}: registerUserProps): Promise<RegistrationResult> {
  UserIdentifier.ensureIdentifierIsValid(identifier);

  if (!secret) {
    throw new Error('[registerUser] Secret must be provided');
  }

  const userCount = await userRepository.countUsers();
  const isFirstUser = userCount === 0;

  if (!isFirstUser) {
    const settings = await settingsRepository.get();
    if (!settings.isRegistrationOpen()) {
      throw new Error('[registerUser] Registration is closed on this instance');
    }
  }

  if (!(await totpRepository.verify(code, secret))) {
    throw new Error('[registerUser] Invalid verification code');
  }

  if ((await userRepository.findByIdentifier(identifier)) !== null) {
    throw new Error(`[registerUser] Identifier ${identifier} is already taken`);
  }

  const recoveryCode = randomBytes(16).toString('hex');
  const user = User.create(
    randomUUID(),
    identifier,
    secret,
    hashRecoveryCode(recoveryCode),
    isFirstUser
  );

  const saved = await userRepository.save(user);
  return { user: saved, recoveryCode };
}
