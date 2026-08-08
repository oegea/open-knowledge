import { BackupRepository } from '../domain/BackupRepository';

interface createBackupProps {
  backupRepository: BackupRepository;
}

export async function createBackup({ backupRepository }: createBackupProps): Promise<Buffer> {
  return await backupRepository.createArchive();
}
