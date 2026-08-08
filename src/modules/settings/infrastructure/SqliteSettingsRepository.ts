import type { Database } from 'better-sqlite3';
import { InstanceSettings } from '../domain/InstanceSettings';
import { SettingsRepository } from '../domain/SettingsRepository';
import { getDatabase } from '../../shared/infrastructure/SqliteDatabase';

const SETTINGS_KEY = 'instance';

export class SqliteSettingsRepository implements SettingsRepository {
  private readonly db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  async get(): Promise<InstanceSettings> {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(SETTINGS_KEY) as
      | { value: string }
      | undefined;
    if (!row) return InstanceSettings.createDefault();
    return InstanceSettings.fromPrimitive(JSON.parse(row.value));
  }

  async save(settings: InstanceSettings): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .run(SETTINGS_KEY, JSON.stringify(settings.toPrimitive()));
  }
}
