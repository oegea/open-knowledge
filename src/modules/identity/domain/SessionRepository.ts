import { Session } from './Session';

export interface SessionRepository {
  save(session: Session): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  delete(tokenHash: string): Promise<boolean>;
  deleteExpired(now: Date): Promise<number>;
}
