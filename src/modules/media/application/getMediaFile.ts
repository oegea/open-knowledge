import { MediaRepository, StoredMedia } from '../domain/MediaRepository';

interface getMediaFileProps {
  relativePath: string;
  mediaRepository: MediaRepository;
}

export async function getMediaFile({
  relativePath,
  mediaRepository,
}: getMediaFileProps): Promise<StoredMedia> {
  if (!relativePath) {
    throw new Error('[getMediaFile] Path must be provided');
  }

  const media = await mediaRepository.retrieve(relativePath);
  if (media === null) {
    throw new Error(`[getMediaFile] Media file ${relativePath} not found`);
  }

  return media;
}
