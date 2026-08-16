import { TimedTranscript } from '../domain/TimedTranscript';
import { TimedTranscriptRepository } from '../domain/TimedTranscriptRepository';

/**
 * Fetches timed transcripts from wherever the material points: the
 * instance's own media endpoint in database mode, or the content
 * repository's raw URL in static mode.
 */
export class HttpTimedTranscriptRepository implements TimedTranscriptRepository {
  async findByPath(path: string): Promise<TimedTranscript | null> {
    try {
      const response = await fetch(path);
      if (!response.ok) return null;
      return TimedTranscript.fromPrimitive(await response.json());
    } catch {
      return null;
    }
  }
}
