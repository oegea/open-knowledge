import AdmZip from 'adm-zip';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { BackupRepository } from '../domain/BackupRepository';
import { getDatabase, closeDatabase } from '../../shared/infrastructure/SqliteDatabase';
import { resetSecretBox } from '../../shared/infrastructure/SecretBox';

const DB_FILE = 'openknowledge.db';
const KEY_FILE = 'instance.key';
const MEDIA_DIR = 'media';

export class FilesystemBackupRepository implements BackupRepository {
  private readonly dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir ?? (process.env.OK_DATA_DIR || path.join(process.cwd(), 'data'));
  }

  async createArchive(): Promise<Buffer> {
    const zip = new AdmZip();

    // Consistent snapshot of the live database (safe under WAL). Unique name
    // plus one retry: a concurrent write can briefly hold the file busy.
    const snapshotPath = path.join(this.dataDir, `.backup-${randomUUID()}.db`);
    try {
      try {
        await getDatabase().backup(snapshotPath);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 150));
        await getDatabase().backup(snapshotPath);
      }
      zip.addLocalFile(snapshotPath, '', DB_FILE);
    } finally {
      fs.rmSync(snapshotPath, { force: true });
    }

    const keyPath = path.join(this.dataDir, KEY_FILE);
    if (fs.existsSync(keyPath)) {
      zip.addLocalFile(keyPath);
    }

    const mediaPath = path.join(this.dataDir, MEDIA_DIR);
    if (fs.existsSync(mediaPath)) {
      zip.addLocalFolder(mediaPath, MEDIA_DIR);
    }

    return zip.toBuffer();
  }

  async restoreArchive(data: Buffer): Promise<void> {
    const zip = new AdmZip(data);
    if (zip.getEntry(DB_FILE) === null) {
      throw new Error('[restoreBackup] The archive is not an Open Knowledge backup');
    }

    closeDatabase();
    resetSecretBox();

    // Wipe current state... (the data dir is runtime-configurable via
    // OK_DATA_DIR, so Turbopack cannot scope it statically: opt out of
    // build-time filesystem tracing for this call.)
    for (const name of [DB_FILE, `${DB_FILE}-wal`, `${DB_FILE}-shm`, KEY_FILE]) {
      fs.rmSync(path.join(/*turbopackIgnore: true*/ this.dataDir, name), { force: true });
    }
    fs.rmSync(path.join(this.dataDir, MEDIA_DIR), { recursive: true, force: true });

    // ...and replace it with the archive, exactly as it was.
    zip.extractAllTo(this.dataDir, true);
  }
}
