import { TimedTranscriptRepository } from '../../domain/TimedTranscriptRepository';

export function create(overrides?: Partial<TimedTranscriptRepository>): TimedTranscriptRepository {
  return {
    findByPath: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}
