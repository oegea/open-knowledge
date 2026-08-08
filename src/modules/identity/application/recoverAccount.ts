import { randomBytes } from 'crypto';
import { User } from '../domain/User';
import { UserRepository } from '../domain/UserRepository';
import { TotpRepository } from '../domain/TotpRepository';
import { hashRecoveryCode } from './registerUser';

export interface RecoveryChallenge {
  identifier: string;
  secret: string;
  otpauthUri: string;
}

interface initAccountRecoveryProps {
  identifier: string;
  recoveryCode: string;
  userRepository: UserRepository;
  totpRepository: TotpRepository;
}

/**
 * Step 1: the person proves ownership with the recovery code and receives a
 * new TOTP secret to scan. Nothing is persisted yet.
 */
export async function initAccountRecovery({
  identifier,
  recoveryCode,
  userRepository,
  totpRepository,
}: initAccountRecoveryProps): Promise<RecoveryChallenge> {
  const user = await verifyRecovery(identifier, recoveryCode, userRepository);

  const secret = totpRepository.generateSecret();
  return {
    identifier: user.getIdentifier(),
    secret,
    otpauthUri: totpRepository.buildOtpauthUri(user.getIdentifier(), secret),
  };
}

export interface RecoveryResult {
  user: User;
  /** New recovery code, shown exactly once. */
  recoveryCode: string;
}

interface confirmAccountRecoveryProps {
  identifier: string;
  recoveryCode: string;
  secret: string;
  code: string;
  userRepository: UserRepository;
  totpRepository: TotpRepository;
}

/**
 * Step 2: the recovery code is verified again together with a TOTP code from
 * the new secret; then the account is re-bound and a new recovery code issued.
 */
export async function confirmAccountRecovery({
  identifier,
  recoveryCode,
  secret,
  code,
  userRepository,
  totpRepository,
}: confirmAccountRecoveryProps): Promise<RecoveryResult> {
  const user = await verifyRecovery(identifier, recoveryCode, userRepository);

  if (!secret) {
    throw new Error('[recoverAccount] Secret must be provided');
  }
  if (!(await totpRepository.verify(code, secret))) {
    throw new Error('[recoverAccount] Invalid verification code');
  }

  const newRecoveryCode = randomBytes(16).toString('hex');
  const updated = user.rebindCredentials(secret, hashRecoveryCode(newRecoveryCode));
  const saved = await userRepository.save(updated);

  return { user: saved, recoveryCode: newRecoveryCode };
}

async function verifyRecovery(
  identifier: string,
  recoveryCode: string,
  userRepository: UserRepository
): Promise<User> {
  if (!identifier) {
    throw new Error('[recoverAccount] Identifier must be provided');
  }

  const user = await userRepository.findByIdentifier(identifier);
  // Same error for unknown identifier and bad recovery code.
  if (user === null || hashRecoveryCode(recoveryCode ?? '') !== user.getRecoveryCodeHash()) {
    throw new Error('[recoverAccount] Invalid identifier or recovery code');
  }

  return user;
}
