import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * Single embedded SQLite database for the whole instance (ADR 0004).
 * All instance state lives under the data directory so that backing up an
 * installation is copying one folder.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT,
  cover_image TEXT,
  authors TEXT NOT NULL DEFAULT '[]',
  sources TEXT NOT NULL DEFAULT '[]',
  ai_assisted INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sections_course ON sections(course_id, position);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  markdown TEXT NOT NULL DEFAULT '',
  media_path TEXT,
  exam TEXT,
  required INTEGER NOT NULL DEFAULT 1,
  sources TEXT NOT NULL DEFAULT '[]',
  position INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_materials_section ON materials(section_id, position);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL UNIQUE,
  totp_secret TEXT NOT NULL,
  recovery_code_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

let instance: Database.Database | null = null;

function migrate(db: Database.Database): void {
  db.exec(SCHEMA);
}

export function getDatabase(): Database.Database {
  if (!instance) {
    const dataDir = process.env.OK_DATA_DIR || path.join(process.cwd(), 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    instance = new Database(path.join(dataDir, 'openknowledge.db'));
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');
    migrate(instance);
  }
  return instance;
}

/** Fresh isolated database for integration tests. */
export function createInMemoryDatabase(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}
