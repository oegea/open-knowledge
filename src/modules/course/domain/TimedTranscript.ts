export interface TimedWordPrimitive {
  /** The word as narrated, punctuation included (e.g. "pedido."). */
  text: string;
  /** Seconds from the start of the media where the word begins. */
  start: number;
  /** Seconds from the start of the media where the word ends. */
  end: number;
}

/**
 * Serialized shape of a timed transcript file (`transcriptPath` on a
 * material). Deliberately tiny so any speech tool can produce it: an
 * ordered list of narrated words with their timing.
 */
export interface TimedTranscriptPrimitive {
  words: TimedWordPrimitive[];
}

/**
 * Word timings for a narrated `audio` / `video` material.
 *
 * The transcript is aligned against the words the reader actually sees
 * (the rendered notes) so playback can highlight the current word. Both
 * texts derive from the same source, but they are never identical — the
 * narration drops Markdown syntax, images, or whole visual-only blocks — so
 * the alignment tolerates gaps on either side.
 */
export class TimedTranscript {
  private constructor(private readonly words: TimedWordPrimitive[]) {}

  static create(words: TimedWordPrimitive[]): TimedTranscript {
    TimedTranscript.ensureTimedTranscriptIsValid(words);
    return new TimedTranscript(words.map((word) => ({ ...word, text: word.text.trim() })));
  }

  static fromPrimitive(data: TimedTranscriptPrimitive): TimedTranscript {
    if (!data || typeof data !== 'object') {
      throw new Error('[TimedTranscript] data must be provided');
    }
    return TimedTranscript.create(data.words);
  }

  static ensureTimedTranscriptIsValid(words: TimedWordPrimitive[]): void {
    if (!Array.isArray(words) || words.length === 0) {
      throw new Error('[TimedTranscript] words must be a non-empty array');
    }
    let previousStart = -Infinity;
    words.forEach((word, index) => {
      if (!word || typeof word.text !== 'string' || word.text.trim() === '') {
        throw new Error(`[TimedTranscript] word ${index} must have text`);
      }
      if (!Number.isFinite(word.start) || !Number.isFinite(word.end) || word.start < 0) {
        throw new Error(`[TimedTranscript] word ${index} must have finite, non-negative timings`);
      }
      if (word.end < word.start) {
        throw new Error(`[TimedTranscript] word ${index} ends before it starts`);
      }
      if (word.start < previousStart) {
        throw new Error(`[TimedTranscript] word ${index} starts before the previous word`);
      }
      previousStart = word.start;
    });
  }

  getWords(): TimedWordPrimitive[] {
    return this.words.map((word) => ({ ...word }));
  }

  getDuration(): number {
    return this.words[this.words.length - 1].end;
  }

  /**
   * Index of the word being narrated at `seconds`: the last word that has
   * started. Returns -1 before the first word begins. Holding a word until
   * the next one starts (rather than releasing it at its own `end`) avoids
   * flicker in the pauses between words.
   */
  wordIndexAt(seconds: number): number {
    if (!Number.isFinite(seconds) || seconds < this.words[0].start) return -1;
    let low = 0;
    let high = this.words.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (this.words[middle].start <= seconds) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }
    return low;
  }

  /**
   * Maps every displayed word to the index of the narrated word it
   * corresponds to (or -1 when it was not narrated). Greedy left-to-right
   * matching on normalized tokens, resynchronizing across small gaps on
   * either side; the result is monotonic, so an inverse lookup is trivial.
   */
  alignTo(displayedWords: string[], window = 12): number[] {
    const narrated = this.words.map((word) => normalizeWord(word.text));
    const displayed = displayedWords.map(normalizeWord);
    const mapping = new Array<number>(displayed.length).fill(-1);
    let cursor = 0;

    for (let index = 0; index < displayed.length; index++) {
      const token = displayed[index];
      if (token === '') continue;

      // Cheapest resync wins: skipping narrated words, displayed words, or
      // a bit of both. Ties favour advancing the narration cursor.
      let best: { narratedSkip: number; displayedSkip: number } | null = null;
      for (let narratedSkip = 0; narratedSkip <= window && cursor + narratedSkip < narrated.length; narratedSkip++) {
        const candidate = narrated[cursor + narratedSkip];
        if (candidate === '') continue;
        for (let displayedSkip = 0; displayedSkip <= window && index + displayedSkip < displayed.length; displayedSkip++) {
          if (displayed[index + displayedSkip] !== candidate) continue;
          const cost = narratedSkip + displayedSkip;
          if (best === null || cost < best.narratedSkip + best.displayedSkip) {
            best = { narratedSkip, displayedSkip };
          }
          break;
        }
      }
      if (best === null) continue;

      if (best.displayedSkip > 0) {
        // The displayed word is missing from the narration: leave it
        // unmapped and let the loop reach the word that does match.
        continue;
      }
      cursor += best.narratedSkip;
      mapping[index] = cursor;
      cursor += 1;
    }
    return mapping;
  }

  toPrimitive(): TimedTranscriptPrimitive {
    return { words: this.getWords() };
  }

  equals(other: TimedTranscript): boolean {
    return JSON.stringify(this.toPrimitive()) === JSON.stringify(other.toPrimitive());
  }
}

/** Case- and punctuation-insensitive token used to compare words. */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}
