import { ExamResultRepository } from '../../domain/ExamResultRepository';

export function create(overrides?: Partial<ExamResultRepository>): ExamResultRepository {
  return {
    save: jest.fn().mockImplementation(async (result) => result),
    findByUserAndCourse: jest.fn().mockResolvedValue([]),
    hasPassed: jest.fn().mockResolvedValue(false),
    ...overrides,
  };
}
