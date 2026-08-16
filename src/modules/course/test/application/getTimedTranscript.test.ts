import { getTimedTranscript } from '../../application/getTimedTranscript';
import * as TimedTranscriptMother from '../helpers/TimedTranscriptMother';
import * as TimedTranscriptRepositoryMother from '../helpers/TimedTranscriptRepositoryMother';

describe('getTimedTranscript (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Behaviour', () => {
    it('loads the transcript the material points at', async () => {
      const transcript = TimedTranscriptMother.create();
      const timedTranscriptRepository = TimedTranscriptRepositoryMother.create({
        findByPath: jest.fn().mockResolvedValue(transcript),
      });

      const result = await getTimedTranscript({
        transcriptPath: 'https://example.org/media/audio/a.transcript.json',
        timedTranscriptRepository,
      });

      expect(result).toBe(transcript);
      expect(timedTranscriptRepository.findByPath).toHaveBeenCalledWith(
        'https://example.org/media/audio/a.transcript.json'
      );
    });
  });

  describe('Edge Cases', () => {
    it('returns null without hitting the repository when the material has no transcript', async () => {
      const timedTranscriptRepository = TimedTranscriptRepositoryMother.create();

      expect(await getTimedTranscript({ transcriptPath: null, timedTranscriptRepository })).toBeNull();
      expect(await getTimedTranscript({ transcriptPath: '  ', timedTranscriptRepository })).toBeNull();
      expect(timedTranscriptRepository.findByPath).not.toHaveBeenCalled();
    });

    it('returns null when the transcript is missing or unreadable', async () => {
      const timedTranscriptRepository = TimedTranscriptRepositoryMother.create();

      const result = await getTimedTranscript({ transcriptPath: 'media/missing.json', timedTranscriptRepository });

      expect(result).toBeNull();
    });
  });
});
