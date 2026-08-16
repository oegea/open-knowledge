'use client';

import { useCallback, useSyncExternalStore } from 'react';

const EVENTS = ['play', 'pause', 'ended', 'timeupdate', 'seeked', 'loadedmetadata', 'durationchange', 'emptied'];

export interface MediaState {
  playing: boolean;
  currentTime: number;
  duration: number;
}

/**
 * Mirrors the playback state of an `<audio>`/`<video>` element into React
 * (the element stays the source of truth) so controls elsewhere in the page
 * — like the mini player — can render it.
 */
export function useMediaState(media: HTMLMediaElement | null): MediaState {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!media) return () => {};
      EVENTS.forEach((event) => media.addEventListener(event, onChange));
      return () => EVENTS.forEach((event) => media.removeEventListener(event, onChange));
    },
    [media]
  );

  const playing = useSyncExternalStore(
    subscribe,
    () => (media ? !media.paused && !media.ended : false),
    () => false
  );
  const currentTime = useSyncExternalStore(subscribe, () => media?.currentTime ?? 0, () => 0);
  const duration = useSyncExternalStore(
    subscribe,
    () => (media && Number.isFinite(media.duration) ? media.duration : 0),
    () => 0
  );

  return { playing, currentTime, duration };
}
