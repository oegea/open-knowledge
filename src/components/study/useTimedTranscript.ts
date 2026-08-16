'use client';

import { useEffect, useMemo, useState } from 'react';
import { TimedTranscript } from '@/modules/course/domain/TimedTranscript';
import { getTimedTranscript } from '@/modules/course/application/getTimedTranscript';
import { HttpTimedTranscriptRepository } from '@/modules/course/infrastructure/HttpTimedTranscriptRepository';

interface LoadedTranscript {
  path: string;
  transcript: TimedTranscript | null;
}

/**
 * Loads the timed transcript a media material points at. Resolves to null
 * (plain playback) while loading, when the material has none, or when the
 * file cannot be read.
 */
export function useTimedTranscript(transcriptPath: string | null): TimedTranscript | null {
  const [loaded, setLoaded] = useState<LoadedTranscript | null>(null);
  const timedTranscriptRepository = useMemo(() => new HttpTimedTranscriptRepository(), []);

  useEffect(() => {
    if (!transcriptPath) return;
    let cancelled = false;
    (async () => {
      const transcript = await getTimedTranscript({ transcriptPath, timedTranscriptRepository });
      if (!cancelled) setLoaded({ path: transcriptPath, transcript });
    })();
    return () => {
      cancelled = true;
    };
  }, [transcriptPath, timedTranscriptRepository]);

  // Keyed by path so a stale transcript never leaks into another material.
  return transcriptPath && loaded?.path === transcriptPath ? loaded.transcript : null;
}
