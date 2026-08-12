import { CourseRepository } from '../../domain/CourseRepository';
import { CourseList } from '../../domain/CourseList';

export function create(overrides?: Partial<CourseRepository>): CourseRepository {
  return {
    save: jest.fn().mockImplementation(async (course) => course),
    findById: jest.fn().mockResolvedValue(null),
    findBySlug: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue(CourseList.create(null)),
    delete: jest.fn().mockResolvedValue(true),
    reassignCategory: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}
