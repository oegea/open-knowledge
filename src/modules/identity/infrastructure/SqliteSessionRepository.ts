import type { Database } from 'better-sqlite3';
import { Session } from '../domain/Session';
import { SessionRepository } from '../domain/SessionRepository';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';

interface SessionRow {
  token_hash: string;
  user_id: string;
  expires_at: string;
}

export class SqliteSessionRepository implements SessionRepository {
  private readonly db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  async save(session: Session): Promise<void> {
    const data = session.toPrimitive();
    this.db
      .prepare(
        `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)
         ON CONFLICT(token_hash) DO UPDATE SET expires_at = excluded.expires_at`
      )
      .run(data.tokenHash, data.userId, data.expiresAt);
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const row = this.db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(tokenHash) as
      | SessionRow
      | undefined;
    if (!row) return null;
    return Session.fromPrimitive({
      tokenHash: row.token_hash,
      userId: row.user_id,
      expiresAt: row.expires_at,
    });
  }

  async delete(tokenHash: string): Promise<boolean> {
    return this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash).changes > 0;
  }

  async deleteExpired(now: Date): Promise<number> {
    return this.db
      .prepare('DELETE FROM sessions WHERE expires_at <= ?')
      .run(now.toISOString()).changes;
  }
}
