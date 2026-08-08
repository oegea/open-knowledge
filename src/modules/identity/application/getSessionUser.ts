import { User } from '../domain/User';
import { UserRepository } from '../domain/UserRepository';
import { SessionRepository } from '../domain/SessionRepository';
import { hashSessionToken } from './createSession';

interface getSessionUserProps {
  token: string | null | undefined;
  sessionRepository: SessionRepository;
  userRepository: UserRepository;
}

/** Resolves the authenticated user for a session token, or null. */
export async function getSessionUser({
  token,
  sessionRepository,
  userRepository,
}: getSessionUserProps): Promise<User | null> {
  if (!token) return null;

  const session = await sessionRepository.findByTokenHash(hashSessionToken(token));
  if (session === null) return null;

  if (session.isExpired()) {
    await sessionRepository.delete(session.getTokenHash());
    return null;
  }

  return await userRepository.findById(session.getUserId());
}
