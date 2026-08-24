/**
 * RSVP (Rapid Serial Visual Presentation) reading: the text is shown one
 * word at a time at a fixed point, aligned on the ORP — the Optimal
 * Recognition Point, the letter the eye locks onto to recognize a word —
 * so the reader never moves their eyes. See ADR 0018.
 */

export type RsvpPauseLevel = 'short' | 'medium' | 'long';

export const RSVP_WPM_OPTIONS = [200, 250, 300, 350, 400, 500, 600, 700] as const;
export const RSVP_DEFAULT_WPM = 300;
export const RSVP_DEFAULT_PAUSE: RsvpPauseLevel = 'short';

/** Extra beats (multiples of the base word time) after a sentence ends. */
const SENTENCE_PAUSE_BEATS: Record<RsvpPauseLevel, number> = {
  short: 1,
  medium: 2.5,
  long: 4,
};

/** Punctuation that closes a sentence, optionally wrapped in quotes/brackets. */
const SENTENCE_END = /[.!?…]+["»”’)\]]*$/u;
/** Mid-sentence punctuation that earns a small extra beat. */
const CLAUSE_END = /[,;:]["»”’)\]]*$/u;

export interface RsvpFrame {
  /** Display token exactly as rendered, punctuation included. */
  text: string;
  /** Index in `text` of the highlighted ORP letter. */
  orpIndex: number;
  /** Time multiplier of the base beat (longer words, clause pauses). */
  weight: number;
  /** Whether a sentence ends here (adds the configurable pause). */
  endsSentence: boolean;
}

/**
 * ORP position for a token: computed over the word's core (leading/trailing
 * punctuation ignored) with the length brackets Spritz established — the
 * longer the word, the further left of center the recognition point sits.
 */
export function computeOrpIndex(text: string): number {
  const leading = text.match(/^[^\p{L}\p{N}]+/u)?.[0].length ?? 0;
  const trailing = text.match(/[^\p{L}\p{N}]+$/u)?.[0].length ?? 0;
  const coreLength = text.length - leading - trailing;
  if (coreLength <= 0) return Math.floor((text.length - 1) / 2);
  let offset: number;
  if (coreLength === 1) offset = 0;
  else if (coreLength <= 5) offset = 1;
  else if (coreLength <= 9) offset = 2;
  else if (coreLength <= 13) offset = 3;
  else offset = 4;
  return leading + offset;
}

/** Builds the frame sequence for a list of display tokens (order preserved). */
export function buildRsvpFrames(words: string[]): RsvpFrame[] {
  return words
    .filter((word) => word.trim().length > 0)
    .map((text) => {
      const coreLength = text.replace(/[^\p{L}\p{N}]+/gu, '').length;
      let weight = 1;
      if (coreLength >= 12) weight = 1.6;
      else if (coreLength >= 8) weight = 1.3;
      if (CLAUSE_END.test(text)) weight += 0.5;
      return {
        text,
        orpIndex: computeOrpIndex(text),
        weight,
        endsSentence: SENTENCE_END.test(text),
      };
    });
}

/** Time a frame stays on screen at a given speed and sentence-pause level. */
export function frameDurationMs(
  frame: RsvpFrame,
  wpm: number,
  pause: RsvpPauseLevel
): number {
  const beat = 60000 / wpm;
  const pauseBeats = frame.endsSentence ? SENTENCE_PAUSE_BEATS[pause] : 0;
  return beat * (frame.weight + pauseBeats);
}

/** Total reading time of `frames[fromIndex..]` — the "remaining" read-out. */
export function totalDurationMs(
  frames: RsvpFrame[],
  wpm: number,
  pause: RsvpPauseLevel,
  fromIndex = 0
): number {
  let total = 0;
  for (let index = Math.max(0, fromIndex); index < frames.length; index += 1) {
    total += frameDurationMs(frames[index], wpm, pause);
  }
  return total;
}
