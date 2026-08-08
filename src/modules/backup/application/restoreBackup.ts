import { BackupRepository } from '../domain/BackupRepository';

interface restoreBackupProps {
  data: Buffer;
  backupRepository: BackupRepository;
}

/**
 * Replaces the entire instance state with a previously downloaded backup.
 * Destructive and definitive: after restoring, the environment is exactly
 * as it was when the backup was taken.
 */
export async function restoreBackup({ data, backupRepository }: restoreBackupProps): Promise<void> {
  if (!data || data.byteLength === 0) {
    throw new Error('[restoreBackup] A backup file must be provided');
  }

  await backupRepository.restoreArchive(data);
}
