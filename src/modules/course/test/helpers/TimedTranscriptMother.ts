import { TimedTranscript, TimedTranscriptPrimitive, TimedWordPrimitive } from '../../domain/TimedTranscript';

/** Word timings for "El agua empezó a moverse a las tres." (one word per 0.5 s). */
export function createWords(text = 'El agua empezó a moverse a las tres.'): TimedWordPrimitive[] {
  return text.split(/\s+/).map((word, index) => ({
    text: word,
    start: index * 0.5,
    end: index * 0.5 + 0.4,
  }));
}

export function createPrimitive(
  overrides: Partial<TimedTranscriptPrimitive> = {}
): TimedTranscriptPrimitive {
  return { words: createWords(), ...overrides };
}

export function create(overrides: Partial<TimedTranscriptPrimitive> = {}): TimedTranscript {
  return TimedTranscript.fromPrimitive(createPrimitive(overrides));
}
