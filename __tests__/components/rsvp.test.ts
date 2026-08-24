import {
  buildRsvpFrames,
  computeOrpIndex,
  frameDurationMs,
  totalDurationMs,
} from '../../src/components/study/rsvp';

describe('rsvp', () => {
  describe('Basic Behaviour', () => {
    it('places the ORP with the Spritz length brackets', () => {
      expect(computeOrpIndex('y')).toBe(0);
      expect(computeOrpIndex('sol')).toBe(1);
      expect(computeOrpIndex('claro')).toBe(1);
      expect(computeOrpIndex('planeta')).toBe(2);
      expect(computeOrpIndex('presentación')).toBe(3);
      expect(computeOrpIndex('extraordinariamente')).toBe(4);
    });

    it('ignores surrounding punctuation when locating the ORP', () => {
      // Core is "todos": bracket offset 1, shifted past the opening quote.
      expect(computeOrpIndex('«todos».')).toBe(2);
      expect(computeOrpIndex('todos.')).toBe(1);
      expect(computeOrpIndex('(sol)')).toBe(2);
    });

    it('falls back to the middle for punctuation-only tokens', () => {
      expect(computeOrpIndex('—')).toBe(0);
      expect(computeOrpIndex('...')).toBe(1);
    });

    it('builds one frame per word, preserving order and text', () => {
      const frames = buildRsvpFrames(['El', 'sistema', 'solar.']);
      expect(frames.map((frame) => frame.text)).toEqual(['El', 'sistema', 'solar.']);
    });

    it('drops empty tokens', () => {
      expect(buildRsvpFrames(['uno', '  ', '', 'dos'])).toHaveLength(2);
    });

    it('marks sentence endings, including quoted and ellipsed ones', () => {
      const frames = buildRsvpFrames(['Hola.', 'adiós»?', 'pero', 'luego…', 'coma,']);
      expect(frames.map((frame) => frame.endsSentence)).toEqual([true, true, false, true, false]);
    });

    it('gives longer words and clause endings more time', () => {
      const [short, long, clause] = buildRsvpFrames(['sol', 'extraordinario', 'luego,']);
      expect(long.weight).toBeGreaterThan(short.weight);
      expect(clause.weight).toBeGreaterThan(short.weight);
    });
  });

  describe('Timing', () => {
    it('shows a plain word for one beat at the configured speed', () => {
      const [frame] = buildRsvpFrames(['sol']);
      expect(frameDurationMs(frame, 300, 'short')).toBeCloseTo(200);
      expect(frameDurationMs(frame, 600, 'short')).toBeCloseTo(100);
    });

    it('adds the configurable pause after a sentence', () => {
      const [frame] = buildRsvpFrames(['fin.']);
      const short = frameDurationMs(frame, 300, 'short');
      const medium = frameDurationMs(frame, 300, 'medium');
      const long = frameDurationMs(frame, 300, 'long');
      expect(short).toBeGreaterThan(200);
      expect(medium).toBeGreaterThan(short);
      expect(long).toBeGreaterThan(medium);
    });

    it('totals the remaining time from any index', () => {
      const frames = buildRsvpFrames(['uno', 'dos', 'tres']);
      const all = totalDurationMs(frames, 300, 'short');
      expect(all).toBeCloseTo(600);
      expect(totalDurationMs(frames, 300, 'short', 1)).toBeCloseTo(400);
      expect(totalDurationMs(frames, 300, 'short', 3)).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles an empty text', () => {
      expect(buildRsvpFrames([])).toEqual([]);
      expect(totalDurationMs([], 300, 'short')).toBe(0);
    });
  });
});
