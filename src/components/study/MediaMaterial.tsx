'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MaterialPrimitive } from '@/modules/course/domain/Material';
import { Prose } from '../shared/Prose';
import { MiniPlayer } from './MiniPlayer';
import { NarratedProse } from './NarratedProse';
import { useDelayedUnmount } from './useDelayedUnmount';
import { useMediaState } from './useMediaState';
import { useTimedTranscript } from './useTimedTranscript';
import styles from './MediaMaterial.module.css';

/** Matches the exit animation length in MiniPlayer.module.css. */
const MINI_EXIT_MS = 260;

interface MediaMaterialProps {
  material: MaterialPrimitive;
  /** Course cover, used as artwork behind the audio player. */
  coverImage?: string | null;
  /**
   * Element (typically inside the sticky study header) that hosts the mini
   * player while the full player is scrolled out of view. Without it the
   * mini player is simply not offered.
   */
  playerDock?: HTMLElement | null;
}

/**
 * Audio/video material: the player, its notes below and — when the
 * material ships a timed transcript — word-by-word highlighting in sync
 * with playback. The media element stays the source of truth for playback;
 * React only mirrors what the mini player needs to display.
 */
export function MediaMaterial({ material, coverImage, playerDock }: MediaMaterialProps) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [media, setMedia] = useState<HTMLMediaElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [playerVisible, setPlayerVisible] = useState(true);
  const { playing, currentTime, duration } = useMediaState(media);
  const transcript = useTimedTranscript(material.transcriptPath);
  // The dock only earns its space once playback is a thing: playing, or
  // paused somewhere past the start. Reading a chapter you never played
  // must look exactly like plain reading.
  const engaged = playing || currentTime > 0;
  const miniDocked = Boolean(playerDock) && !playerVisible && engaged;
  const [miniMounted, miniLeaving] = useDelayedUnmount(miniDocked, MINI_EXIT_MS);
  // Whether the notes keep the narrated word in view; NarratedProse turns
  // it off on manual scroll, the mini player or its chip turn it back on.
  const [following, setFollowing] = useState(true);

  const attachMedia = useCallback((element: HTMLMediaElement | null) => {
    mediaRef.current = element;
    setMedia(element);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setPlayerVisible(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const toggle = useCallback(() => {
    const element = mediaRef.current;
    if (!element) return;
    if (element.paused) void element.play();
    else element.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const element = mediaRef.current;
    if (element) element.currentTime = seconds;
  }, []);

  const backToPlayer = useCallback(() => {
    cardRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, []);

  const resumeFollowing = useCallback(() => setFollowing(true), []);

  const notes = material.markdown ? (
    transcript ? (
      <NarratedProse
        content={material.markdown}
        transcript={transcript}
        media={media}
        onSeek={seek}
        following={following}
        onFollowingChange={setFollowing}
        followControlDocked={miniDocked}
      />
    ) : (
      <Prose content={material.markdown} />
    )
  ) : null;

  const miniPlayer =
    playerDock && miniMounted
      ? createPortal(
          <MiniPlayer
            title={material.title}
            leaving={miniLeaving}
            playing={playing}
            currentTime={currentTime}
            duration={duration}
            following={transcript ? following : null}
            onToggle={toggle}
            onSeek={seek}
            onBackToPlayer={backToPlayer}
            onResumeFollowing={resumeFollowing}
          />,
          playerDock
        )
      : null;

  if (material.type === 'video') {
    return (
      <div className={styles.media}>
        <div ref={cardRef} className={styles.videoCard}>
          <video
            ref={attachMedia}
            controls
            playsInline
            preload="metadata"
            src={material.mediaPath ?? undefined}
            className={styles.video}
          />
        </div>
        {notes}
        {miniPlayer}
      </div>
    );
  }

  return (
    <div className={styles.media}>
      <div ref={cardRef} className={styles.audioCard}>
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className={styles.audioBackdrop} aria-hidden="true" />
        ) : null}
        <div className={styles.audioScrim} aria-hidden="true" />
        <div className={styles.audioInner}>
          <span className={styles.audioGlyph} aria-hidden="true">
            ♪
          </span>
          <audio
            ref={attachMedia}
            controls
            preload="metadata"
            src={material.mediaPath ?? undefined}
            className={styles.audio}
          />
        </div>
      </div>
      {notes}
      {miniPlayer}
    </div>
  );
}
