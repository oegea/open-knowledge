'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TimedTranscript } from '@/modules/course/domain/TimedTranscript';
import { useI18n } from '@/i18n/I18nProvider';
import { IconAudio, IconCheck, IconClose, IconGear, IconPause, IconPlay, IconRsvp } from '../ui/icons';
import { formatClock } from './formatClock';
import { useMediaState } from './useMediaState';
import {
  RSVP_DEFAULT_PAUSE,
  RSVP_DEFAULT_WPM,
  RSVP_WPM_OPTIONS,
  RsvpPauseLevel,
  buildRsvpFrames,
  frameDurationMs,
} from './rsvp';
import styles from './RsvpReader.module.css';

/** localStorage key for the reader preferences (speed + sentence pause). */
const PREFERENCES_KEY = 'ok-rsvp-preferences';

const PAUSE_LEVELS: RsvpPauseLevel[] = ['short', 'medium', 'long'];

interface RsvpPreferences {
  wpm: number;
  pause: RsvpPauseLevel;
}

function loadPreferences(): RsvpPreferences {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RsvpPreferences>;
      return {
        wpm: RSVP_WPM_OPTIONS.includes(parsed.wpm as (typeof RSVP_WPM_OPTIONS)[number])
          ? (parsed.wpm as number)
          : RSVP_DEFAULT_WPM,
        pause: PAUSE_LEVELS.includes(parsed.pause as RsvpPauseLevel)
          ? (parsed.pause as RsvpPauseLevel)
          : RSVP_DEFAULT_PAUSE,
      };
    }
  } catch {
    // Private windows or blocked storage: fall through to the defaults.
  }
  return { wpm: RSVP_DEFAULT_WPM, pause: RSVP_DEFAULT_PAUSE };
}

function savePreferences(preferences: RsvpPreferences): void {
  try {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Losing the preference is fine; the reader still works.
  }
}

/**
 * Below what share of narrated words found their displayed twin the reader
 * stops offering the listen source (same tolerance as NarratedProse).
 */
const MIN_COVERAGE = 0.6;

/** The narrated material's own player and word timings, when it has both. */
export interface RsvpNarration {
  media: HTMLMediaElement;
  transcript: TimedTranscript;
}

interface RsvpReaderProps {
  /** Material title, shown quietly in the top bar. */
  title: string;
  /** Display tokens in reading order (from the rendered word spans). */
  words: string[];
  /** Whether a next material exists (the completion screen offers it). */
  hasNext: boolean;
  /**
   * Narrated materials only: the page's media element plus its timed
   * transcript. The reader then offers a second pace source — the audio
   * itself — behind a read/listen switch; one transport, no second player.
   */
  narration?: RsvpNarration | null;
  /** Closes the reader; receives the word index to scroll the page to. */
  onClose: (wordIndex: number) => void;
  /** Fired once when the last word has been read. */
  onFinished: () => void;
  /** Navigates to the next material (completion screen action). */
  onNext: () => void;
}

/**
 * Full-screen RSVP reader (ADR 0018): words replace each other at a fixed
 * point between two guides, aligned on the highlighted ORP letter so the
 * eyes never move. Tapping anywhere toggles play/pause; speed and the
 * end-of-sentence pause are configurable and remembered on the device.
 */
export function RsvpReader({
  title,
  words,
  hasNext,
  narration = null,
  onClose,
  onFinished,
  onNext,
}: RsvpReaderProps) {
  const { t } = useI18n();
  const frames = useMemo(() => buildRsvpFrames(words), [words]);
  const [{ wpm, pause }, setPreferences] = useState<RsvpPreferences>(loadPreferences);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const finishedNotified = useRef(false);

  // Narration alignment: displayed word index ↔ narrated word index, the
  // same tolerant mapping NarratedProse uses. Null when the transcript does
  // not belong to this text — the listen source is then not offered.
  const alignment = useMemo(() => {
    if (!narration) return null;
    const wordOfSpan = narration.transcript.alignTo(words);
    const narratedWords = narration.transcript.getWords();
    const spanOfWord = new Array<number>(narratedWords.length).fill(-1);
    wordOfSpan.forEach((wordIndex, spanIndex) => {
      if (wordIndex >= 0) spanOfWord[wordIndex] = spanIndex;
    });
    const coverage = spanOfWord.filter((spanIndex) => spanIndex >= 0).length / spanOfWord.length;
    return coverage >= MIN_COVERAGE ? { wordOfSpan, spanOfWord, narratedWords } : null;
  }, [narration, words]);
  const media = alignment && narration ? narration.media : null;
  const narrated = media !== null;
  const mediaState = useMediaState(media);
  // Seeking mutates the element; routed through a ref, as MediaMaterial does.
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  // One transport, two pace sources: the reader's own timer ("read") or the
  // narration clock ("listen"). Opening the reader while the audio is
  // already playing lands directly on listen.
  const [source, setSource] = useState<'read' | 'listen'>(() =>
    narration && !narration.media.paused ? 'listen' : 'read'
  );
  const activeSource = narrated ? source : 'read';
  const listening = activeSource === 'listen';

  // Elapsed/remaining read-outs: cumulative time before each frame, so a
  // per-word tick costs a lookup, not a sum over the whole text.
  const cumulativeMs = useMemo(() => {
    const cumulative = new Array<number>(frames.length + 1);
    cumulative[0] = 0;
    frames.forEach((frame, frameIndex) => {
      cumulative[frameIndex + 1] = cumulative[frameIndex] + frameDurationMs(frame, wpm, pause);
    });
    return cumulative;
  }, [frames, wpm, pause]);
  const totalMs = cumulativeMs[frames.length] ?? 0;
  const elapsedMs = cumulativeMs[Math.min(index, frames.length)] ?? 0;

  // Playback: one timeout per frame, retimed when speed/pause change. The
  // last frame's timeout is also where the reading finishes.
  useEffect(() => {
    if (!playing || index >= frames.length) return;
    const timer = window.setTimeout(() => {
      const nextIndex = index + 1;
      if (nextIndex >= frames.length) {
        setPlaying(false);
        setFinished(true);
        if (!finishedNotified.current) {
          finishedNotified.current = true;
          onFinished();
        }
      }
      setIndex(nextIndex);
    }, frameDurationMs(frames[index], wpm, pause));
    return () => window.clearTimeout(timer);
  }, [playing, index, frames, wpm, pause, onFinished]);

  // Listen source: the narration clock drives the word — a frame loop while
  // the media plays, plain events otherwise. The reading finishes when the
  // audio does.
  useEffect(() => {
    if (!listening || !media || !alignment) return;
    const syncIndex = () => {
      let narratedIndex = narration!.transcript.wordIndexAt(media.currentTime);
      // The narrated word may not be displayed: fall back to the nearest
      // displayed one before it (same rule as the page highlight).
      while (narratedIndex >= 0 && alignment.spanOfWord[narratedIndex] < 0) narratedIndex -= 1;
      if (narratedIndex >= 0) {
        const spanIndex = alignment.spanOfWord[narratedIndex];
        setIndex((current) => (current === spanIndex ? current : spanIndex));
      }
    };
    let frameHandle = 0;
    const tick = () => {
      syncIndex();
      if (!media.paused && !media.ended) frameHandle = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      cancelAnimationFrame(frameHandle);
      frameHandle = requestAnimationFrame(tick);
    };
    const onStop = () => {
      cancelAnimationFrame(frameHandle);
      syncIndex();
    };
    const onEnded = () => {
      cancelAnimationFrame(frameHandle);
      setFinished(true);
      if (!finishedNotified.current) {
        finishedNotified.current = true;
        onFinished();
      }
    };
    media.addEventListener('play', onPlay);
    media.addEventListener('pause', onStop);
    media.addEventListener('seeked', onStop);
    media.addEventListener('ended', onEnded);
    syncIndex();
    if (!media.paused) frameHandle = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameHandle);
      media.removeEventListener('play', onPlay);
      media.removeEventListener('pause', onStop);
      media.removeEventListener('seeked', onStop);
      media.removeEventListener('ended', onEnded);
    };
  }, [listening, media, alignment, narration, onFinished]);

  // Moves the narration to a displayed word: the nearest narrated word at
  // or before it.
  const seekMediaToWord = useCallback(
    (spanIndex: number) => {
      const element = mediaRef.current;
      if (!element || !alignment) return;
      for (let candidate = Math.min(spanIndex, words.length - 1); candidate >= 0; candidate -= 1) {
        const narratedIndex = alignment.wordOfSpan[candidate];
        if (narratedIndex >= 0) {
          element.currentTime = alignment.narratedWords[narratedIndex].start;
          return;
        }
      }
      element.currentTime = 0;
    },
    [alignment, words.length]
  );

  // Switching the source pauses everything and carries the position over:
  // the text position is the shared truth between both paces.
  const selectSource = useCallback(
    (next: 'read' | 'listen') => {
      if (!narrated || next === activeSource) return;
      if (next === 'listen') {
        setPlaying(false);
        seekMediaToWord(Math.min(index, frames.length - 1));
      } else {
        media?.pause();
      }
      setSource(next);
    },
    [narrated, activeSource, index, frames.length, media, seekMediaToWord]
  );

  // The reader owns the screen: no page scroll behind it while open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const close = useCallback(() => {
    onClose(Math.min(index, frames.length - 1));
  }, [frames.length, index, onClose]);

  // One word back/forward; auto-repeats while the key is held. Leaves the
  // completion screen if it was showing. On the listen source the narration
  // follows the step.
  const step = useCallback(
    (delta: number) => {
      setIndex((current) => {
        const next = Math.min(Math.max(current + delta, 0), Math.max(frames.length - 1, 0));
        if (listening) seekMediaToWord(next);
        return next;
      });
      setFinished(false);
    },
    [frames.length, listening, seekMediaToWord]
  );

  // One play/pause for both sources; playing again from the very end
  // restarts the reading.
  const toggle = useCallback(() => {
    if (listening && media) {
      if (media.paused) void media.play();
      else media.pause();
      return;
    }
    setIndex((currentIndex) => (currentIndex >= frames.length ? 0 : currentIndex));
    setPlaying((current) => !current);
  }, [frames.length, listening, media]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      // With the position slider focused the browser already moves it (and
      // onChange steps the word): skip the global handler to avoid doubling.
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === ' ') {
        event.preventDefault();
        toggle();
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        step(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, step, toggle]);

  // A tap anywhere reads as play/pause — unless a control was tapped
  // (those stop propagation) or the settings sheet is open (tap closes it).
  const handleStageTap = useCallback(() => {
    if (finished) return;
    if (settingsOpen) {
      setSettingsOpen(false);
      return;
    }
    toggle();
  }, [finished, settingsOpen, toggle]);

  const handleSeek = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.target.value);
      setIndex(next);
      if (listening) seekMediaToWord(next);
      if (finished && next < frames.length) {
        setFinished(false);
      }
    },
    [finished, frames.length, listening, seekMediaToWord]
  );

  const setWpm = useCallback((value: number) => {
    setPreferences((current) => {
      const next = { ...current, wpm: value };
      savePreferences(next);
      return next;
    });
  }, []);

  const setPause = useCallback((value: RsvpPauseLevel) => {
    setPreferences((current) => {
      const next = { ...current, pause: value };
      savePreferences(next);
      return next;
    });
  }, []);

  const frame = frames[Math.min(index, frames.length - 1)];

  // The transport reads from whichever source sets the pace.
  const isPlaying = listening ? mediaState.playing : playing;
  const elapsedSeconds = listening ? mediaState.currentTime : elapsedMs / 1000;
  const remainingSeconds = listening
    ? Math.max(0, mediaState.duration - mediaState.currentTime)
    : Math.max(0, totalMs - elapsedMs) / 1000;

  if (frames.length === 0) return null;

  // Very long words (German compounds…) must still fit with the ORP letter
  // anchored at the center: cap the font size by the widest half-word.
  const maxSideChars = Math.max(frame.orpIndex + 1, frame.text.length - frame.orpIndex);
  const wordFontSize = `min(clamp(2.1rem, 9vw, 3.4rem), calc((min(100vw, 34rem) - 2rem) / ${(
    maxSideChars * 2 * 0.55
  ).toFixed(2)}))`;

  return (
    <div
      className={styles.reader}
      role="dialog"
      aria-modal="true"
      aria-label={t('study.rsvpTitle')}
      onClick={handleStageTap}
    >
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={t('study.rsvpExit')}
          onClick={(event) => {
            event.stopPropagation();
            close();
          }}
        >
          <IconClose width={22} height={22} />
        </button>
        <span className={styles.title}>{title}</span>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={t('study.rsvpSettings')}
          aria-expanded={settingsOpen}
          onClick={(event) => {
            event.stopPropagation();
            setSettingsOpen((current) => !current);
          }}
        >
          <IconGear width={22} height={22} />
        </button>
      </header>

      {/* The word changes several times per second: hidden from screen
          readers (the full text is on the page behind), shown to the eye. */}
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.guides}>
          <span className={`${styles.guide} ${styles.guideTop}`} />
          <div className={styles.wordRow} style={{ fontSize: wordFontSize }}>
            <span className={styles.wordBefore}>{frame.text.slice(0, frame.orpIndex)}</span>
            <span className={styles.wordOrp}>{frame.text.charAt(frame.orpIndex)}</span>
            <span className={styles.wordAfter}>{frame.text.slice(frame.orpIndex + 1)}</span>
          </div>
          <span className={`${styles.guide} ${styles.guideBottom}`} />
        </div>
        {!isPlaying && !finished ? (
          <p className={styles.tapHint}>{t('study.rsvpTapHint')}</p>
        ) : null}
      </div>

      {settingsOpen ? (
        <div
          className={`ok-glass-strong ${styles.settings}`}
          role="group"
          aria-label={t('study.rsvpSettings')}
          onClick={(event) => event.stopPropagation()}
        >
          <p className={styles.settingsLabel}>{t('study.rsvpSpeed')}</p>
          <div className={styles.chipRow}>
            {RSVP_WPM_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={styles.chip}
                aria-pressed={option === wpm}
                onClick={() => setWpm(option)}
              >
                {t('study.rsvpWpm', { wpm: option })}
              </button>
            ))}
          </div>
          <p className={styles.settingsLabel}>{t('study.rsvpPauseTitle')}</p>
          <div className={styles.chipRow}>
            {PAUSE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={styles.chip}
                aria-pressed={level === pause}
                onClick={() => setPause(level)}
              >
                {t(
                  level === 'short'
                    ? 'study.rsvpPauseShort'
                    : level === 'medium'
                      ? 'study.rsvpPauseMedium'
                      : 'study.rsvpPauseLong'
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={`ok-glass-strong ${styles.controls}`}
        onClick={(event) => event.stopPropagation()}
      >
        {narrated ? (
          <div className={styles.sourceSwitch} role="group" aria-label={t('study.rsvpSourceTitle')}>
            <button
              type="button"
              className={styles.sourceOption}
              aria-pressed={!listening}
              onClick={() => selectSource('read')}
            >
              <IconRsvp width={18} height={18} />
              {t('study.rsvpSourceRead')}
            </button>
            <button
              type="button"
              className={styles.sourceOption}
              aria-pressed={listening}
              onClick={() => selectSource('listen')}
            >
              <IconAudio width={18} height={18} />
              {t('study.rsvpSourceListen')}
            </button>
          </div>
        ) : null}
        <div className={styles.timeline}>
          <span className={styles.time} aria-label={t('study.rsvpElapsed')}>
            {formatClock(elapsedSeconds)}
          </span>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={frames.length}
            step={1}
            value={Math.min(index, frames.length)}
            aria-label={t('study.rsvpProgress')}
            onChange={handleSeek}
          />
          <span className={styles.time} aria-label={t('study.rsvpRemaining')}>
            −{formatClock(remainingSeconds)}
          </span>
        </div>
        <div className={styles.actions}>
          {listening ? (
            // The narration sets the pace: nothing to configure here.
            <span className={styles.sourceBadge}>
              <IconAudio width={16} height={16} />
              {t('study.rsvpListening')}
            </span>
          ) : (
            <button
              type="button"
              className={styles.speedButton}
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((current) => !current)}
            >
              {t('study.rsvpWpm', { wpm })}
            </button>
          )}
          <button
            type="button"
            className={styles.playButton}
            aria-label={t(isPlaying ? 'study.pause' : 'study.play')}
            onClick={toggle}
          >
            {isPlaying ? <IconPause width={26} height={26} /> : <IconPlay width={26} height={26} />}
          </button>
        </div>
      </div>

      {finished ? (
        <div className={styles.finished} onClick={(event) => event.stopPropagation()}>
          <span className={styles.finishedBadge}>
            <IconCheck width={34} height={34} />
          </span>
          <h2 className={styles.finishedTitle}>{t('study.rsvpCompletedTitle')}</h2>
          <p className={styles.finishedBody}>{t('study.rsvpCompletedBody')}</p>
          <div className={styles.finishedActions}>
            {hasNext ? (
              <button type="button" className={styles.finishedPrimary} onClick={onNext}>
                {t('study.rsvpGoNext')}
              </button>
            ) : null}
            <button type="button" className={styles.finishedSecondary} onClick={close}>
              {t('study.rsvpBackToText')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
