export interface StoredMedia {
  data: Buffer;
  mime: string;
  size: number;
}

export interface MediaRepository {
  /** Stores a media file and returns its relative path (e.g. "covers/abc.jpg"). */
  store(kind: string, originalName: string, mime: string, data: Buffer): Promise<string>;
  /** Retrieves a stored media file by its relative path, or null when missing. */
  retrieve(relativePath: string): Promise<StoredMedia | null>;
  /** Deletes a stored media file. Returns false when it did not exist. */
  remove(relativePath: string): Promise<boolean>;
}
