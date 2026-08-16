import { TimedTranscript } from '../domain/TimedTranscript';
import { TimedTranscriptRepository } from '../domain/TimedTranscriptRepository';

interface getTimedTranscriptProps {
  transcriptPath: string | null;
  timedTranscriptRepository: TimedTranscriptRepository;
}

/**
 * Loads the timed transcript of a media material, if it declares one.
 * A missing or unreadable transcript is not an error: the material simply
 * plays without word highlighting.
 */
export async function getTimedTranscript({
  transcriptPath,
  timedTranscriptRepository,
}: getTimedTranscriptProps): Promise<TimedTranscript | null> {
  if (!transcriptPath || transcriptPath.trim() === '') return null;
  return await timedTranscriptRepository.findByPath(transcriptPath);
}
