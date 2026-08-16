'use client';

import { useI18n } from '@/i18n/I18nProvider';
import { IconArrowUp, IconFollow, IconPause, IconPlay } from '../ui/icons';
import { formatClock } from './formatClock';
import styles from './MiniPlayer.module.css';

interface MiniPlayerProps {
  title: string;
  /** Plays the exit animation; the parent unmounts once it is over. */
  leaving?: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  /**
   * Whether the text is following the narration: `null` when the material
   * has no synced transcript, `false` when the reader scrolled away (shows
   * the resume control).
   */
  following?: boolean | null;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
  onBackToPlayer: () => void;
  onResumeFollowing?: () => void;
}

/**
 * Compact playback strip docked above the study footer while the full
 * player is scrolled out of view — the reader never loses track of what is
 * playing or how far along it is, and can pause, scrub or catch up with the
 * narration without scrolling back up.
 */
export function MiniPlayer({
  title,
  leaving = false,
  playing,
  currentTime,
  duration,
  following = null,
  onToggle,
  onSeek,
  onBackToPlayer,
  onResumeFollowing,
}: MiniPlayerProps) {
  const { t } = useI18n();
  const max = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const ratio = max > 0 ? Math.min(1, currentTime / max) : 0;
  const offerFollow = following === false && Boolean(onResumeFollowing);

  return (
    <div
      className={`ok-glass-strong ${styles.mini} ${leaving ? styles.leaving : ''}`}
      data-leaving={leaving ? '' : undefined}
      role="region"
      aria-label={t('study.nowPlaying')}
    >
      <button
        type="button"
        className={styles.toggle}
        onClick={onToggle}
        aria-label={playing ? t('study.pause') : t('study.play')}
        aria-pressed={playing}
      >
        {playing ? <IconPause width={22} height={22} /> : <IconPlay width={22} height={22} />}
      </button>

      <button type="button" className={styles.info} onClick={onBackToPlayer}>
        <span className={styles.title}>{title}</span>
        <span className={styles.meta}>
          <span className={styles.time}>
            {formatClock(currentTime)} / {formatClock(max)}
          </span>
          <span className={styles.backHint}>
            <IconArrowUp width={14} height={14} />
            {t('study.backToPlayer')}
          </span>
        </span>
      </button>

      {offerFollow ? (
        <button
          type="button"
          className={styles.follow}
          onClick={onResumeFollowing}
          aria-label={t('study.followNarration')}
          title={t('study.followNarration')}
        >
          <IconFollow width={20} height={20} />
          <span className={styles.followLabel}>{t('study.followNarration')}</span>
        </button>
      ) : null}

      <div className={styles.seek} style={{ '--ok-mini-progress': `${ratio * 100}%` } as React.CSSProperties}>
        <input
          type="range"
          className={styles.range}
          min={0}
          max={max || 1}
          step={0.1}
          value={Math.min(currentTime, max || 1)}
          disabled={max === 0}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label={t('study.seek')}
          aria-valuetext={formatClock(currentTime)}
        />
      </div>
    </div>
  );
}
