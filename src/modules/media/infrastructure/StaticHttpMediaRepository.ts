import { MediaRepository, StoredMedia } from '../domain/MediaRepository';
import { resolveContentUrl } from '../../shared/infrastructure/StaticContentClient';

/**
 * Read-only media access for static content mode (ADR 0013): files are
 * fetched from the public content repository over HTTP. Accepts both absolute
 * URLs (as produced by resolveContentUrl in the static repositories) and
 * repo-relative paths like "media/logo.png".
 */
export class StaticHttpMediaRepository implements MediaRepository {
  async store(): Promise<string> {
    throw new Error('[StaticHttpMediaRepository] static content mode is read-only');
  }

  async retrieve(relativePath: string): Promise<StoredMedia | null> {
    const url = resolveContentUrl(relativePath);
    if (!url) return null;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      const data = Buffer.from(await response.arrayBuffer());
      const mime =
        response.headers.get('content-type')?.split(';')[0].trim() || 'application/octet-stream';
      return { data, mime, size: data.byteLength };
    } catch {
      return null;
    }
  }

  async remove(): Promise<boolean> {
    throw new Error('[StaticHttpMediaRepository] static content mode is read-only');
  }
}
