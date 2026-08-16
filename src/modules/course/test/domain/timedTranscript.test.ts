import { TimedTranscript, normalizeWord } from '../../domain/TimedTranscript';
import * as TimedTranscriptMother from '../helpers/TimedTranscriptMother';

describe('TimedTranscript', () => {
  describe('Basic Behaviour', () => {
    it('round-trips through toPrimitive/fromPrimitive', () => {
      const transcript = TimedTranscriptMother.create();
      const copy = TimedTranscript.fromPrimitive(transcript.toPrimitive());
      expect(copy.equals(transcript)).toBe(true);
      expect(copy.getWords()).toHaveLength(8);
      expect(copy.getDuration()).toBeCloseTo(3.9);
    });

    it('finds the word being narrated at a given time', () => {
      const transcript = TimedTranscriptMother.create();
      expect(transcript.wordIndexAt(0)).toBe(0);
      expect(transcript.wordIndexAt(0.45)).toBe(0); // pause after "El" still holds "El"
      expect(transcript.wordIndexAt(1.2)).toBe(2);
      expect(transcript.wordIndexAt(99)).toBe(7);
    });

    it('returns -1 before the first word starts', () => {
      const transcript = TimedTranscript.create([{ text: 'Hola', start: 1, end: 1.5 }]);
      expect(transcript.wordIndexAt(0.2)).toBe(-1);
      expect(transcript.wordIndexAt(Number.NaN)).toBe(-1);
    });

    it('aligns displayed words that match the narration exactly', () => {
      const transcript = TimedTranscriptMother.create();
      const mapping = transcript.alignTo('El agua empezó a moverse a las tres.'.split(' '));
      expect(mapping).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });

    it('ignores case, punctuation and markdown emphasis when comparing words', () => {
      const transcript = TimedTranscriptMother.create();
      const mapping = transcript.alignTo(['**El**', 'AGUA', 'empezó,', 'a', 'moverse', 'a', 'las', '«tres».']);
      expect(mapping).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe('Edge Cases', () => {
    it('leaves displayed words that were not narrated unmapped and resynchronizes', () => {
      const transcript = TimedTranscriptMother.create();
      const displayed = ['El', 'agua', '(imagen', 'decorativa)', 'empezó', 'a', 'moverse', 'a', 'las', 'tres.'];
      expect(transcript.alignTo(displayed)).toEqual([0, 1, -1, -1, 2, 3, 4, 5, 6, 7]);
    });

    it('skips narrated words that are not displayed', () => {
      const transcript = TimedTranscript.create(
        TimedTranscriptMother.createWords('El agua pausa dramática empezó a moverse')
      );
      expect(transcript.alignTo(['El', 'agua', 'empezó', 'a', 'moverse'])).toEqual([0, 1, 4, 5, 6]);
    });

    it('never maps the same narrated word twice and keeps the mapping monotonic', () => {
      const transcript = TimedTranscript.create(TimedTranscriptMother.createWords('a b a b a b'));
      const mapping = transcript.alignTo(['a', 'a', 'b', 'b', 'a', 'b']);
      const mapped = mapping.filter((index) => index >= 0);
      expect(new Set(mapped).size).toBe(mapped.length);
      expect([...mapped].sort((x, y) => x - y)).toEqual(mapped);
    });

    it('treats tokens made only of punctuation as unmapped', () => {
      const transcript = TimedTranscriptMother.create();
      expect(transcript.alignTo(['—', 'El', 'agua'])).toEqual([-1, 0, 1]);
    });

    it('normalizes words consistently', () => {
      expect(normalizeWord('«Ábreme»,')).toBe('ábreme');
      expect(normalizeWord('23:47.')).toBe('2347');
      expect(normalizeWord('---')).toBe('');
    });
  });

  describe('Error Scenarios', () => {
    it('rejects empty transcripts', () => {
      expect(() => TimedTranscript.create([])).toThrow('[TimedTranscript] words must be a non-empty array');
      expect(() => TimedTranscript.fromPrimitive(null as never)).toThrow('[TimedTranscript] data must be provided');
    });

    it('rejects words without text or with invalid timings', () => {
      expect(() => TimedTranscript.create([{ text: ' ', start: 0, end: 1 }])).toThrow('must have text');
      expect(() => TimedTranscript.create([{ text: 'a', start: -1, end: 1 }])).toThrow('finite, non-negative');
      expect(() => TimedTranscript.create([{ text: 'a', start: 2, end: 1 }])).toThrow('ends before it starts');
      expect(() =>
        TimedTranscript.create([
          { text: 'a', start: 2, end: 3 },
          { text: 'b', start: 1, end: 2 },
        ])
      ).toThrow('starts before the previous word');
    });
  });
});
