import { createHash, randomBytes } from 'crypto';
import { Session } from '../domain/Session';
import { SessionRepository } from '../domain/SessionRepository';

export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CreatedSession {
  /** Raw token for the cookie; only its hash is persisted. */
  token: string;
  session: Session;
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

interface createSessionProps {
  userId: string;
  sessionRepository: SessionRepository;
}

export async function createSession({
  userId,
  sessionRepository,
}: createSessionProps): Promise<CreatedSession> {
  if (!userId) {
    throw new Error('[createSession] User id must be provided');
  }

  const token = randomBytes(32).toString('hex');
  const session = Session.create(
    hashSessionToken(token),
    userId,
    new Date(Date.now() + SESSION_DURATION_MS)
  );

  await sessionRepository.save(session);
  await sessionRepository.deleteExpired(new Date());

  return { token, session };
}
