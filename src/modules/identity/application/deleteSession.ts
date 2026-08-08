import { SessionRepository } from '../domain/SessionRepository';
import { hashSessionToken } from './createSession';

interface deleteSessionProps {
  token: string | null | undefined;
  sessionRepository: SessionRepository;
}

export async function deleteSession({
  token,
  sessionRepository,
}: deleteSessionProps): Promise<void> {
  if (!token) return;
  await sessionRepository.delete(hashSessionToken(token));
}
