'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** localStorage key for the bionic reading preference (ADR 0019). */
const BIONIC_KEY = 'ok-bionic-reading';

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function read(): boolean {
  try {
    return window.localStorage.getItem(BIONIC_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Device-local bionic reading preference as an external store: the server
 * renders it off, the client adopts the stored value on hydration, and
 * every consumer follows a toggle instantly.
 */
export function useBionicReading(): [boolean, () => void] {
  const bionic = useSyncExternalStore(subscribe, read, () => false);

  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(BIONIC_KEY, read() ? '0' : '1');
    } catch {
      // Blocked storage: nothing to flip; the toggle stays off.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [bionic, toggle];
}
