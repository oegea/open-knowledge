import { ensureMediaIsValid } from '../domain/MediaKind';
import { MediaRepository } from '../domain/MediaRepository';

interface storeMediaFileProps {
  kind: string;
  originalName: string;
  mime: string;
  data: Buffer;
  mediaRepository: MediaRepository;
}

export async function storeMediaFile({
  kind,
  originalName,
  mime,
  data,
  mediaRepository,
}: storeMediaFileProps): Promise<string> {
  ensureMediaIsValid(kind, mime, data.byteLength);
  return await mediaRepository.store(kind, originalName, mime, data);
}
