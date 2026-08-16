'use client';

import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { TimedTranscript } from '@/modules/course/domain/TimedTranscript';
import { useI18n } from '@/i18n/I18nProvider';
import { Prose } from '../shared/Prose';
import { WORD_ATTRIBUTE } from '../shared/rehypeWordSpans';
import { IconFollow } from '../ui/icons';
import styles from './NarratedProse.module.css';

interface NarratedProseProps {
  content: string;
  transcript: TimedTranscript;
  /** The `<audio>`/`<video>` element driving the highlight; null until mounted. */
  media: HTMLMediaElement | null;
  /** Moves playback to a position (tapping a narrated word). */
  onSeek: (seconds: number) => void;
  /** Whether the page keeps the narrated word in view (owned by the parent). */
  following: boolean;
  onFollowingChange: (following: boolean) => void;
  /**
   * When the mini player is docked it offers the "follow" control itself;
   * otherwise this component floats its own chip.
   */
  followControlDocked?: boolean;
}

/**
 * Below what share of narrated words found their displayed twin we assume
 * the transcript does not belong to this text and fall back to plain
 * reading rather than highlight nonsense.
 */
const MIN_COVERAGE = 0.6;

/** Viewport band (px from each edge) the active word is kept inside. */
const SCROLL_MARGIN = 150;

interface Alignment {
  spans: HTMLElement[];
  /** narrated word index → span index (-1 when that word is not displayed). */
  spanOfWord: number[];
  /** span index → narrated word index (-1 when the word is not narrated). */
  wordOfSpan: number[];
}

/**
 * Renders the notes of a narrated material and highlights the word being
 * spoken, keeping it in view while the reader lets it ("follow" mode).
 * Any manual scroll hands control back to the reader; a chip (floating, or
 * inside the docked mini player) offers to resume following. Tapping a
 * narrated word seeks the media.
 */
export function NarratedProse({
  content,
  transcript,
  media,
  onSeek,
  following,
  onFollowingChange,
  followControlDocked = false,
}: NarratedProseProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const alignmentRef = useRef<Alignment | null>(null);
  const activeRef = useRef<HTMLElement | null>(null);
  const followingRef = useRef(following);
  // True only while playing *with* a usable alignment: it gates the chip.
  const [playing, setPlaying] = useState(false);

  const setFollow = useCallback(
    (value: boolean) => {
      followingRef.current = value;
      onFollowingChange(value);
    },
    [onFollowingChange]
  );

  // Align the transcript with the words React rendered.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const spans = Array.from(container.querySelectorAll<HTMLElement>(`[${WORD_ATTRIBUTE}]`));
    const wordOfSpan = transcript.alignTo(spans.map((span) => span.textContent ?? ''));
    const spanOfWord = new Array<number>(transcript.getWords().length).fill(-1);
    wordOfSpan.forEach((wordIndex, spanIndex) => {
      if (wordIndex < 0) return;
      spanOfWord[wordIndex] = spanIndex;
      spans[spanIndex].setAttribute('data-narrated', '');
    });
    // Alignment lives in a ref: it is DOM-derived and read by event
    // handlers only, so it never needs to trigger a render.
    const covered = spanOfWord.filter((index) => index >= 0).length / spanOfWord.length;
    alignmentRef.current = covered >= MIN_COVERAGE ? { spans, spanOfWord, wordOfSpan } : null;

    return () => {
      spans.forEach((span) => {
        span.removeAttribute('data-narrated');
        span.removeAttribute('aria-current');
      });
      alignmentRef.current = null;
      activeRef.current = null;
    };
  }, [content, transcript]);

  const keepInView = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const inside = rect.top >= SCROLL_MARGIN && rect.bottom <= window.innerHeight - SCROLL_MARGIN;
    if (inside) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  }, []);

  const highlightAt = useCallback(
    (seconds: number) => {
      const alignment = alignmentRef.current;
      if (!alignment) return;
      // The spoken word may not be displayed (narration-only): fall back
      // to the nearest displayed word before it.
      let wordIndex = transcript.wordIndexAt(seconds);
      while (wordIndex >= 0 && alignment.spanOfWord[wordIndex] < 0) wordIndex -= 1;
      const next = wordIndex >= 0 ? alignment.spans[alignment.spanOfWord[wordIndex]] : null;
      if (next === activeRef.current) return;
      activeRef.current?.removeAttribute('aria-current');
      activeRef.current = next;
      if (!next) return;
      next.setAttribute('aria-current', 'true');
      if (followingRef.current) keepInView(next);
    },
    [keepInView, transcript]
  );

  // Drive the highlight from playback: a frame loop while playing, plain
  // events otherwise (seeking while paused still moves the mark).
  useEffect(() => {
    if (!media) return;
    let frame = 0;
    const tick = () => {
      highlightAt(media.currentTime);
      if (!media.paused && !media.ended) frame = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      setPlaying(alignmentRef.current !== null);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const onStop = () => {
      setPlaying(false);
      cancelAnimationFrame(frame);
      highlightAt(media.currentTime);
    };
    const onSeek = () => highlightAt(media.currentTime);
    media.addEventListener('play', onPlay);
    media.addEventListener('pause', onStop);
    media.addEventListener('ended', onStop);
    media.addEventListener('seeked', onSeek);
    media.addEventListener('timeupdate', onSeek);
    if (!media.paused) onPlay();
    else frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener('play', onPlay);
      media.removeEventListener('pause', onStop);
      media.removeEventListener('ended', onStop);
      media.removeEventListener('seeked', onSeek);
      media.removeEventListener('timeupdate', onSeek);
    };
  }, [media, highlightAt]);

  // Any reader-initiated scroll pauses following. Programmatic smooth
  // scrolling fires `scroll` but never these input events.
  useEffect(() => {
    const release = () => setFollow(false);
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
        release();
      }
    };
    window.addEventListener('wheel', release, { passive: true });
    window.addEventListener('touchmove', release, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', release);
      window.removeEventListener('touchmove', release);
      window.removeEventListener('keydown', onKey);
    };
  }, [setFollow]);

  // Resuming (from the chip here or from the mini player) catches up with
  // the narrated word.
  useEffect(() => {
    followingRef.current = following;
    if (following && activeRef.current) keepInView(activeRef.current);
  }, [following, keepInView]);

  const resumeFollowing = useCallback(() => setFollow(true), [setFollow]);

  const handleWordClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const alignment = alignmentRef.current;
      if (!alignment) return;
      const target = (event.target as HTMLElement).closest<HTMLElement>(`[${WORD_ATTRIBUTE}][data-narrated]`);
      if (!target) return;
      const spanIndex = alignment.spans.indexOf(target);
      const wordIndex = spanIndex >= 0 ? alignment.wordOfSpan[spanIndex] : -1;
      if (wordIndex < 0) return;
      const seconds = transcript.getWords()[wordIndex].start;
      onSeek(seconds);
      setFollow(true);
      highlightAt(seconds);
    },
    [highlightAt, onSeek, setFollow, transcript]
  );

  return (
    <>
      <Prose ref={containerRef} content={content} annotateWords onClick={handleWordClick} />
      {playing && !following && !followControlDocked ? (
        <button type="button" className={`ok-glass-strong ${styles.followChip}`} onClick={resumeFollowing}>
          <IconFollow width={18} height={18} />
          {t('study.followNarration')}
        </button>
      ) : null}
    </>
  );
}
