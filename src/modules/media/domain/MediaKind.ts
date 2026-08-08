export const MEDIA_KINDS = ['covers', 'audio', 'video', 'images'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

const ALLOWED_MIME: Record<MediaKind, RegExp> = {
  covers: /^image\//,
  images: /^image\//,
  audio: /^audio\//,
  video: /^video\//,
};

/** 512 MiB — generous enough for self-hosted course video material. */
export const MAX_MEDIA_BYTES = 512 * 1024 * 1024;

export function isMediaKind(value: string): value is MediaKind {
  return (MEDIA_KINDS as readonly string[]).includes(value);
}

export function ensureMediaIsValid(kind: string, mime: string, size: number): void {
  if (!isMediaKind(kind)) {
    throw new Error(`[Media] "${kind}" is not a valid media kind`);
  }
  if (!ALLOWED_MIME[kind].test(mime)) {
    throw new Error(`[Media] mime type "${mime}" is not allowed for kind "${kind}"`);
  }
  if (size <= 0 || size > MAX_MEDIA_BYTES) {
    throw new Error('[Media] file is empty or exceeds the maximum allowed size');
  }
}
