import Database from 'better-sqlite3';
import path from 'path';
import { slugify } from '../domain/slugify';
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
  slug TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT,
  cover_image TEXT,
  authors TEXT NOT NULL DEFAULT '[]',
  sources TEXT NOT NULL DEFAULT '[]',
  license TEXT,
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
  display_name TEXT NOT NULL DEFAULT '',
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

CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  completed_material_ids TEXT NOT NULL DEFAULT '[]',
  last_material_id TEXT,
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS exam_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  material_id TEXT NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  score REAL NOT NULL,
  passed INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exam_results_user_course ON exam_results(user_id, course_id);

CREATE TABLE IF NOT EXISTS news_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  markdown TEXT NOT NULL,
  image_path TEXT,
  author TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  markdown TEXT NOT NULL,
  placement TEXT NOT NULL DEFAULT 'hidden',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  ref_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

CREATE TABLE IF NOT EXISTS notification_state (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  identifier TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  issued_at TEXT NOT NULL,
  UNIQUE (user_id, course_id)
);
`;

let instance: Database.Database | null = null;
let instanceInode: number | null = null;

function migrate(db: Database.Database): void {
  db.exec(SCHEMA);
  // Additive migrations for databases created by earlier versions.
  addColumnIfMissing(db, 'courses', 'license', 'TEXT');
  addColumnIfMissing(db, 'news_posts', 'image_path', 'TEXT');
  addColumnIfMissing(db, 'users', 'display_name', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'certificates', 'display_name', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'news_posts', 'author', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'courses', 'slug', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'news_posts', 'slug', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'pages', 'slug', "TEXT NOT NULL DEFAULT ''");
  backfillSlugs(db, 'courses');
  backfillSlugs(db, 'news_posts');
  backfillSlugs(db, 'pages');
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_posts_slug ON news_posts(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);`);
}

/** Rows created before slugs existed get one derived from their title. */
function backfillSlugs(db: Database.Database, table: string): void {
  const rows = db
    .prepare(`SELECT id, title FROM ${table} WHERE slug = ''`)
    .all() as { id: string; title: string }[];
  if (rows.length === 0) return;

  const taken = new Set(
    (db.prepare(`SELECT slug FROM ${table} WHERE slug != ''`).all() as { slug: string }[]).map(
      (row) => row.slug
    )
  );
  const update = db.prepare(`UPDATE ${table} SET slug = ? WHERE id = ?`);
  for (const row of rows) {
    const base = slugify(row.title);
    let candidate = base;
    for (let suffix = 2; taken.has(candidate); suffix++) {
      candidate = `${base}-${suffix}`;
    }
    taken.add(candidate);
    update.run(candidate, row.id);
  }
}

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  definition: string
): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((candidate) => candidate.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function getDatabase(): Database.Database {
  const dataDir = process.env.OK_DATA_DIR || path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'openknowledge.db');

  // A backup restore replaces the database file on disk. Bundlers may keep
  // several copies of this module alive, so each copy re-checks the inode
  // and reopens its handle when the file changed underneath it.
  if (instance) {
    let replaced = false;
    try {
      replaced = fs.statSync(dbPath).ino !== instanceInode;
    } catch {
      replaced = true;
    }
    if (replaced) {
      instance.close();
      instance = null;
    }
  }

  if (!instance) {
    fs.mkdirSync(dataDir, { recursive: true });
    instance = new Database(dbPath);
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');
    migrate(instance);
    instanceInode = fs.statSync(dbPath).ino;
  }
  return instance;
}

/**
 * Closes the singleton connection (used before a backup restore replaces the
 * database file). The next getDatabase() call reopens it.
 */
export function closeDatabase(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}

/** Fresh isolated database for integration tests. */
export function createInMemoryDatabase(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}
