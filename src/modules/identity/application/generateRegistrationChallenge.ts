import { UserIdentifier } from '../domain/UserIdentifier';
import { UserRepository } from '../domain/UserRepository';
import { TotpRepository } from '../domain/TotpRepository';

export interface RegistrationChallenge {
  identifier: string;
  secret: string;
  otpauthUri: string;
  /** True when this instance has no users yet: the account will be admin. */
  willBeAdmin: boolean;
}

interface generateRegistrationChallengeProps {
  userRepository: UserRepository;
  totpRepository: TotpRepository;
}

/**
 * Prepares everything the registration screen needs: a fresh pseudonymous
 * identifier (guaranteed unused) and a TOTP secret with its QR payload.
 */
export async function generateRegistrationChallenge({
  userRepository,
  totpRepository,
}: generateRegistrationChallengeProps): Promise<RegistrationChallenge> {
  let identifier = UserIdentifier.generate();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if ((await userRepository.findByIdentifier(identifier.getValue())) === null) break;
    identifier = UserIdentifier.generate();
  }

  const secret = totpRepository.generateSecret();
  const userCount = await userRepository.countUsers();

  return {
    identifier: identifier.getValue(),
    secret,
    otpauthUri: totpRepository.buildOtpauthUri(identifier.getValue(), secret),
    willBeAdmin: userCount === 0,
  };
}
