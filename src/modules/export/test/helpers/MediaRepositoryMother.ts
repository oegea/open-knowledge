import { MediaRepository } from '../../../media/domain/MediaRepository';

/** 1x1 transparent PNG, enough to exercise the image code paths. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

export function create(overrides: Partial<MediaRepository> = {}): MediaRepository {
  return {
    store: jest.fn().mockResolvedValue('covers/stored.png'),
    retrieve: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

export function withImages(): MediaRepository {
  return create({
    retrieve: jest
      .fn()
      .mockResolvedValue({ data: TINY_PNG, mime: 'image/png', size: TINY_PNG.length }),
  });
}
