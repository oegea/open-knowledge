export interface BackupRepository {
  /** Builds a zip archive with the full instance state (database, media, key). */
  createArchive(): Promise<Buffer>;
  /**
   * Replaces the full instance state with the given archive. Destructive:
   * everything not in the archive is lost.
   */
  restoreArchive(data: Buffer): Promise<void>;
}
