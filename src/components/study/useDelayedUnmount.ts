'use client';

import { useEffect, useState } from 'react';

/**
 * Keeps an element mounted for `delayMs` after `visible` turns false so its
 * exit animation can play. Returns `[mounted, leaving]`.
 */
export function useDelayedUnmount(visible: boolean, delayMs: number): [boolean, boolean] {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      const frame = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(() => setMounted(false), delayMs);
    return () => window.clearTimeout(timer);
  }, [visible, delayMs]);

  return [mounted || visible, !visible];
}
