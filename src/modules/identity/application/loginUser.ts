import { User } from '../domain/User';
import { UserRepository } from '../domain/UserRepository';
import { TotpRepository } from '../domain/TotpRepository';

interface loginUserProps {
  identifier: string;
  code: string;
  userRepository: UserRepository;
  totpRepository: TotpRepository;
}

export async function loginUser({
  identifier,
  code,
  userRepository,
  totpRepository,
}: loginUserProps): Promise<User> {
  if (!identifier) {
    throw new Error('[loginUser] Identifier must be provided');
  }

  const user = await userRepository.findByIdentifier(identifier);
  // Same error for unknown identifier and bad code: no account enumeration.
  if (user === null || !(await totpRepository.verify(code, user.getTotpSecret()))) {
    throw new Error('[loginUser] Invalid identifier or verification code');
  }

  return user;
}
