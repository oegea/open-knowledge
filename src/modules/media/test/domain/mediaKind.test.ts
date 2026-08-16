import { ensureMediaIsValid, isMediaKind } from '../../domain/MediaKind';

describe('MediaKind', () => {
  describe('Basic Behaviour', () => {
    it('accepts JSON timed transcripts under the transcripts kind', () => {
      expect(isMediaKind('transcripts')).toBe(true);
      expect(() => ensureMediaIsValid('transcripts', 'application/json', 1024)).not.toThrow();
      expect(() => ensureMediaIsValid('transcripts', 'text/json', 1024)).not.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    it('rejects non-JSON files as transcripts', () => {
      expect(() => ensureMediaIsValid('transcripts', 'audio/mpeg', 1024)).toThrow(
        '[Media] mime type "audio/mpeg" is not allowed for kind "transcripts"'
      );
    });

    it('rejects unknown kinds and empty files', () => {
      expect(() => ensureMediaIsValid('documents', 'application/json', 1)).toThrow('is not a valid media kind');
      expect(() => ensureMediaIsValid('transcripts', 'application/json', 0)).toThrow('empty or exceeds');
    });
  });
});
