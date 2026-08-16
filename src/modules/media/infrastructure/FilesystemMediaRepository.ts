import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { MediaRepository, StoredMedia } from '../domain/MediaRepository';

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.json': 'application/json',
};

const EXTENSION_BY_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_BY_EXTENSION).map(([extension, mime]) => [mime, extension])
);

export class FilesystemMediaRepository implements MediaRepository {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir =
      baseDir ?? path.join(process.env.OK_DATA_DIR || path.join(process.cwd(), 'data'), 'media');
  }

  async store(kind: string, originalName: string, mime: string, data: Buffer): Promise<string> {
    const extension =
      EXTENSION_BY_MIME[mime] ?? path.extname(originalName).toLowerCase() ?? '.bin';
    const fileName = `${randomUUID()}${extension}`;
    const dir = path.join(this.baseDir, kind);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, fileName), data);
    return `${kind}/${fileName}`;
  }

  async retrieve(relativePath: string): Promise<StoredMedia | null> {
    const resolved = this.resolveSafe(relativePath);
    if (resolved === null) return null;

    try {
      const data = await fs.readFile(resolved);
      const mime = MIME_BY_EXTENSION[path.extname(resolved).toLowerCase()] ?? 'application/octet-stream';
      return { data, mime, size: data.byteLength };
    } catch {
      return null;
    }
  }

  async remove(relativePath: string): Promise<boolean> {
    const resolved = this.resolveSafe(relativePath);
    if (resolved === null) return false;

    try {
      await fs.unlink(resolved);
      return true;
    } catch {
      return false;
    }
  }

  /** Prevents path traversal outside the media directory. */
  private resolveSafe(relativePath: string): string | null {
    const resolved = path.resolve(this.baseDir, relativePath);
    if (!resolved.startsWith(path.resolve(this.baseDir) + path.sep)) return null;
    return resolved;
  }
}
