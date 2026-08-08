import { createBackup } from './createBackup';
import { restoreBackup } from './restoreBackup';
import { FilesystemBackupRepository } from '../infrastructure/FilesystemBackupRepository';

export default {
  createBackup: async () =>
    await createBackup({ backupRepository: new FilesystemBackupRepository() }),

  restoreBackup: async (data: Buffer) =>
    await restoreBackup({ data, backupRepository: new FilesystemBackupRepository() }),
};
