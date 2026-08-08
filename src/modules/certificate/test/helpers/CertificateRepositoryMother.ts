import { CertificateRepository } from '../../domain/CertificateRepository';

export function create(overrides?: Partial<CertificateRepository>): CertificateRepository {
  return {
    save: jest.fn().mockImplementation(async (certificate) => certificate),
    findById: jest.fn().mockResolvedValue(null),
    findByUserAndCourse: jest.fn().mockResolvedValue(null),
    findByUser: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}
