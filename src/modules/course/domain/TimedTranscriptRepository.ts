import { TimedTranscript } from './TimedTranscript';

export interface TimedTranscriptRepository {
  /** Loads the transcript stored at `path` (a media path or URL); null when missing or malformed. */
  findByPath(path: string): Promise<TimedTranscript | null>;
}
