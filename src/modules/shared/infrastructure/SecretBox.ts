import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import path from 'path';
import fs from 'fs';

/**
 * AES-256-GCM encryption for secrets at rest (e.g. TOTP secrets). The
 * instance key is auto-generated on first use and lives in the data
 * directory, keeping the self-hosted zero-config promise.
 */

let cachedKey: Buffer | null = null;
let cachedKeyInode: number | null = null;

/** Clears the cached key (a backup restore may replace the key file). */
export function resetSecretBox(): void {
  cachedKey = null;
  cachedKeyInode = null;
}

function getKey(): Buffer {
  const dataDir = process.env.OK_DATA_DIR || path.join(process.cwd(), 'data');
  const keyPath = path.join(dataDir, 'instance.key');

  // Restores replace the key file; stale module copies must notice (see
  // the inode check in SqliteDatabase for the full rationale).
  if (cachedKey) {
    try {
      if (fs.statSync(keyPath).ino === cachedKeyInode) return cachedKey;
    } catch {
      /* fall through and reload */
    }
    resetSecretBox();
  }

  if (!fs.existsSync(keyPath)) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(keyPath, randomBytes(32), { mode: 0o600 });
  }
  cachedKey = fs.readFileSync(keyPath);
  cachedKeyInode = fs.statSync(keyPath).ino;
  return cachedKey;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decryptSecret(stored: string): string {
  const [ivPart, tagPart, dataPart] = stored.split('.');
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivPart, 'base64'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
