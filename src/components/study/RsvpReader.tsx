'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { IconCheck, IconClose, IconGear, IconPause, IconPlay } from '../ui/icons';
import { formatClock } from './formatClock';
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

interface RsvpReaderProps {
  /** Material title, shown quietly in the top bar. */
  title: string;
  /** Display tokens in reading order (from the rendered word spans). */
  words: string[];
  /** Whether a next material exists (the completion screen offers it). */
  hasNext: boolean;
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
export function RsvpReader({ title, words, hasNext, onClose, onFinished, onNext }: RsvpReaderProps) {
  const { t } = useI18n();
  const frames = useMemo(() => buildRsvpFrames(words), [words]);
  const [{ wpm, pause }, setPreferences] = useState<RsvpPreferences>(loadPreferences);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const finishedNotified = useRef(false);

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === ' ') {
        event.preventDefault();
        setPlaying((current) => !current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  // Playing again from the very end restarts the reading.
  const toggle = useCallback(() => {
    setIndex((currentIndex) => (currentIndex >= frames.length ? 0 : currentIndex));
    setPlaying((current) => !current);
  }, [frames.length]);

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
      if (finished && next < frames.length) {
        setFinished(false);
      }
    },
    [finished, frames.length]
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

  if (frames.length === 0) return null;

  // Very long words (German compounds…) must still fit with the ORP letter
  // anchored at the center: cap the font size by the widest half-word.
  const maxSideChars = Math.max(frame.orpIndex + 1, frame.text.length - frame.orpIndex);
  const wordFontSize = `min(clamp(2.1rem, 9vw, 3.4rem), calc((min(100vw, 34rem) - 2rem) / ${(
    maxSideChars * 2 * 0.62
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
        {!playing && !finished ? (
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
        <div className={styles.timeline}>
          <span className={styles.time} aria-label={t('study.rsvpElapsed')}>
            {formatClock(elapsedMs / 1000)}
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
            −{formatClock(Math.max(0, totalMs - elapsedMs) / 1000)}
          </span>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.speedButton}
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((current) => !current)}
          >
            {t('study.rsvpWpm', { wpm })}
          </button>
          <button
            type="button"
            className={styles.playButton}
            aria-label={t(playing ? 'study.pause' : 'study.play')}
            onClick={toggle}
          >
            {playing ? <IconPause width={26} height={26} /> : <IconPlay width={26} height={26} />}
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
