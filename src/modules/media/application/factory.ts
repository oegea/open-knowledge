import { storeMediaFile } from './storeMediaFile';
import { getMediaFile } from './getMediaFile';
import { FilesystemMediaRepository } from '../infrastructure/FilesystemMediaRepository';

export default {
  storeMediaFile: async (kind: string, originalName: string, mime: string, data: Buffer) =>
    await storeMediaFile({
      kind,
      originalName,
      mime,
      data,
      mediaRepository: new FilesystemMediaRepository(),
    }),

  getMediaFile: async (relativePath: string) =>
    await getMediaFile({ relativePath, mediaRepository: new FilesystemMediaRepository() }),
};
