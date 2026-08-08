import type { Database } from 'better-sqlite3';
import { User } from '../domain/User';
import { UserRepository } from '../domain/UserRepository';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';
import { encryptSecret, decryptSecret } from '../../shared/infrastructure/SecretBox';

interface UserRow {
  id: string;
  identifier: string;
  totp_secret: string;
  recovery_code_hash: string;
  is_admin: number;
  created_at: string;
}

export class SqliteUserRepository implements UserRepository {
  private readonly db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  async save(user: User): Promise<User> {
    const data = user.toPrimitive();
    if (!data.id) {
      throw new Error('[SqliteUserRepository] cannot save a user without id');
    }

    this.db
      .prepare(
        `INSERT INTO users (id, identifier, totp_secret, recovery_code_hash, is_admin, created_at)
         VALUES (@id, @identifier, @totpSecret, @recoveryCodeHash, @isAdmin, @createdAt)
         ON CONFLICT(id) DO UPDATE SET
           totp_secret = @totpSecret,
           recovery_code_hash = @recoveryCodeHash,
           is_admin = @isAdmin`
      )
      .run({
        id: data.id,
        identifier: data.identifier,
        totpSecret: encryptSecret(data.totpSecret),
        recoveryCodeHash: data.recoveryCodeHash,
        isAdmin: data.isAdmin ? 1 : 0,
        createdAt: data.createdAt,
      });

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE identifier = ?').get(identifier) as
      | UserRow
      | undefined;
    return row ? this.mapRow(row) : null;
  }

  async countUsers(): Promise<number> {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    return row.count;
  }

  private mapRow(row: UserRow): User {
    return User.fromPrimitive({
      id: row.id,
      identifier: row.identifier,
      totpSecret: decryptSecret(row.totp_secret),
      recoveryCodeHash: row.recovery_code_hash,
      isAdmin: row.is_admin === 1,
      createdAt: row.created_at,
    });
  }
}
